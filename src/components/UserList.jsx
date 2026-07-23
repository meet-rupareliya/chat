import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function UserList({ currentUser, selectedUser, onSelectUser }) {
  const [profiles, setProfiles] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchRef = useRef('');

  // Sync search input state to ref so persistent callbacks can access it without triggers
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch conversations involving current user (sender or receiver)
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (msgErr) throw msgErr;

      const chatUserIds = new Set();
      msgs?.forEach((m) => {
        if (m.sender_id !== currentUser.id) chatUserIds.add(m.sender_id);
        if (m.receiver_id !== currentUser.id) chatUserIds.add(m.receiver_id);
      });

      if (chatUserIds.size === 0) {
        setProfiles([]);
        return;
      }

      // 2. Fetch profiles of these users
      const { data: activeProfiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, last_seen_at')
        .in('id', Array.from(chatUserIds))
        .order('username', { ascending: true });

      if (profErr) throw profErr;

      setProfiles(activeProfiles || []);
    } catch (err) {
      console.error('loadProfiles error:', err);
      setError(err.message || 'Could not load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  const loadUnreadCounts = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', currentUser.id)
      .eq('is_read', false);

    if (data) {
      const counts = {};
      data.forEach(({ sender_id }) => {
        counts[sender_id] = (counts[sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    }
  }, [currentUser.id]);

  // Debounced search logic to query Supabase globally
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const query = search.trim();
      if (query) {
        const fetchGlobalSearch = async () => {
          setLoading(true);
          setError(null);
          const { data, error: err } = await supabase
            .from('profiles')
            .select('id, username, last_seen_at')
            .neq('id', currentUser.id)
            .ilike('username', `%${query}%`)
            .order('username', { ascending: true });

          if (err) {
            console.error('Global search error:', err);
            setError(err.message);
          } else {
            setProfiles(data || []);
          }
          setLoading(false);
        };
        fetchGlobalSearch();
      } else {
        // If search is empty, load active profiles
        loadProfiles();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, loadProfiles, currentUser.id]);

  useEffect(() => {
    loadProfiles();
    loadUnreadCounts();

    // Live-update status of existing chat users
    const profileChannel = supabase
      .channel('profiles-directory')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          setProfiles((prev) =>
            prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
          );
        }
      )
      .subscribe();

    // Live-update chat profiles list and unread counts when messages arrive/send
    const msgChannel = supabase
      .channel('messages-sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new;
          if (m.sender_id === currentUser.id || m.receiver_id === currentUser.id) {
            loadUnreadCounts();
            if (!searchRef.current.trim()) {
              loadProfiles();
            }
          }
        }
      )
      .subscribe();

    // Force re-render every 30s to update "X mins ago" strings
    const interval = setInterval(() => {
      setProfiles((prev) => [...prev]);
    }, 30000);

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(msgChannel);
      clearInterval(interval);
    };
  }, [currentUser.id, loadProfiles, loadUnreadCounts]);

  // Clear unread count when a user is selected
  useEffect(() => {
    if (selectedUser) {
      setUnreadCounts((prev) => ({ ...prev, [selectedUser.id]: 0 }));
    }
  }, [selectedUser]);

  function isOnline(lastSeenAt) {
    if (!lastSeenAt) return false;
    return Date.now() - new Date(lastSeenAt).getTime() < 60000;
  }

  function formatLastSeen(lastSeenAt) {
    if (!lastSeenAt) return 'offline';
    const diffMs = Date.now() - new Date(lastSeenAt).getTime();

    if (diffMs < 60000) return 'online';

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return new Date(lastSeenAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function handleDeleteChat(otherUserId) {
    if (!window.confirm('Are you sure you want to clear this conversation on your side? It will be removed from your chat list.')) return;

    const now = new Date().toISOString();
    const key = `circl_cleared_${[currentUser.id, otherUserId].sort().join('_')}_by_${currentUser.id}`;
    localStorage.setItem(key, now);

    if (selectedUser?.id === otherUserId) {
      onSelectUser(null);
    }

    loadProfiles();
  }

  const filtered = profiles.filter((p) => {
    const matchesSearch = p.username?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const online = isOnline(p.last_seen_at);
    if (filterMode === 'active') return online;
    if (filterMode === 'unread') return (unreadCounts[p.id] || 0) > 0;

    return true;
  });

  return (
    <div className="user-list">
      <div className="search-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          className="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <svg className="filter-settings-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
        </svg>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filterMode === 'all' ? 'active' : ''}`}
          onClick={() => setFilterMode('all')}
        >
          All
        </button>
        <button
          className={`filter-tab ${filterMode === 'active' ? 'active' : ''}`}
          onClick={() => setFilterMode('active')}
        >
          Active
        </button>
        <button
          className={`filter-tab ${filterMode === 'unread' ? 'active' : ''}`}
          onClick={() => setFilterMode('unread')}
        >
          Unread
        </button>
      </div>

      {loading && <p className="muted small" style={{ padding: '12px 16px' }}>Loading people…</p>}

      {error && (
        <div style={{ padding: '12px 16px' }}>
          <p className="muted small" style={{ color: '#f15c5c', marginBottom: 8 }}>
            ⚠️ Could not load users: {error}
          </p>
          <button
            className="btn ghost small"
            onClick={loadProfiles}
            style={{ fontSize: 12 }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="muted small" style={{ padding: '12px 16px' }}>
          {search ? `No results for "${search}"` : 'No one else registered yet — invite friends!'}
        </p>
      )}

      <ul>
        {filtered.map((p) => {
          const online = isOnline(p.last_seen_at);
          const unread = unreadCounts[p.id] || 0;
          return (
            <li
              key={p.id}
              className={selectedUser?.id === p.id ? 'user-item active' : 'user-item'}
              onClick={() => onSelectUser(p)}
            >
              <div className="avatar-wrapper">
                <div className="avatar-sm">{p.username?.[0]?.toUpperCase() || '?'}</div>
                {online && <span className="status-badge-online" />}
              </div>
              <div className="user-item-info">
                <span className="username">{p.username}</span>
                <span className={`last-seen ${online ? 'online' : ''}`}>
                  {formatLastSeen(p.last_seen_at)}
                </span>
              </div>
              <div className="user-item-actions">
                {unread > 0 && (
                  <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>
                )}
                <button
                  className="delete-chat-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(p.id);
                  }}
                  title="Delete conversation"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
