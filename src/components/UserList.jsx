import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export default function UserList({ currentUser, selectedUser, onSelectUser }) {
  const [profiles, setProfiles] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, username, last_seen_at')
      .neq('id', currentUser.id)
      .order('username', { ascending: true });

    if (err) {
      console.error('UserList fetch error:', err);
      setError(err.message);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
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

  useEffect(() => {
    loadProfiles();
    loadUnreadCounts();

    // Live-update the directory when someone new registers or status changes
    const profileChannel = supabase
      .channel('profiles-directory')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const p = payload.new;
            if (p.id === currentUser.id) return; // skip self
            setProfiles((prev) => {
              if (prev.some((x) => x.id === p.id)) return prev;
              return [...prev, p].sort((a, b) => a.username.localeCompare(b.username));
            });
          } else if (payload.eventType === 'UPDATE') {
            setProfiles((prev) =>
              prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
            );
          } else if (payload.eventType === 'DELETE') {
            setProfiles((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Live-update unread counts when messages arrive
    const msgChannel = supabase
      .channel('unread-counts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` },
        () => {
          loadUnreadCounts();
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

  const filtered = profiles.filter((p) =>
    p.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="user-list">
      <input
        className="search"
        placeholder="Find people…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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
              {unread > 0 && (
                <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
