import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function UserList({ currentUser, selectedUser, onSelectUser }) {
  const [activeTab, setActiveTab] = useState('chats'); // chats, friends, requests
  const [profiles, setProfiles] = useState([]); // active chats users
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchRef = useRef('');

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  // 1. Fetch conversations involving current user (sender or receiver)
  const loadProfiles = useCallback(async () => {
    try {
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

      // Fetch profiles of these users
      const { data: activeProfiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, last_seen_at')
        .in('id', Array.from(chatUserIds))
        .order('username', { ascending: true });

      if (profErr) throw profErr;
      setProfiles(activeProfiles || []);
    } catch (err) {
      console.error('loadProfiles error:', err);
    }
  }, [currentUser.id]);

  // 2. Fetch accepted friends profiles
  const loadFriends = useCallback(async () => {
    try {
      const { data: reqs, error: reqErr } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (reqErr) throw reqErr;

      const friendIds = reqs?.map((r) => (r.sender_id === currentUser.id ? r.receiver_id : r.sender_id)) || [];

      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, last_seen_at, bio')
        .in('id', friendIds)
        .order('username', { ascending: true });

      if (profErr) throw profErr;
      setFriends(profiles || []);
    } catch (err) {
      console.error('loadFriends error:', err);
    }
  }, [currentUser.id]);

  // 3. Fetch incoming & outgoing requests
  const loadFriendRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          profiles:sender_id (id, username, display_name, avatar_url)
        `)
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (error) throw error;
      setFriendRequests(data || []);
    } catch (err) {
      console.error('loadFriendRequests error:', err);
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

  // Debounced search logic to query Supabase globally by username
  useEffect(() => {
    const query = search.trim();
    if (!query) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, last_seen_at')
          .neq('id', currentUser.id)
          .ilike('username', `%${query}%`)
          .order('username', { ascending: true })
          .limit(20);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [search, currentUser.id]);

  // Fetch initial data and subscribe to changes
  useEffect(() => {
    setLoading(true);
    Promise.all([loadProfiles(), loadFriends(), loadFriendRequests(), loadUnreadCounts()]).then(() => {
      setLoading(false);
    });

    // Realtime channel for profiles status
    const profileChannel = supabase
      .channel('profiles-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        loadProfiles();
        loadFriends();
      })
      .subscribe();

    // Realtime messages sync
    const msgChannel = supabase
      .channel('messages-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new;
        if (m.sender_id === currentUser.id || m.receiver_id === currentUser.id) {
          loadUnreadCounts();
          if (!searchRef.current.trim()) {
            loadProfiles();
          }
        }
      })
      .subscribe();

    // Realtime friend requests sync
    const reqChannel = supabase
      .channel('friend-requests-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
        loadFriendRequests();
        loadFriends();
        loadProfiles();
      })
      .subscribe();

    const interval = setInterval(() => {
      setProfiles((prev) => [...prev]);
      setFriends((prev) => [...prev]);
    }, 30000);

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(reqChannel);
      clearInterval(interval);
    };
  }, [currentUser.id, loadProfiles, loadFriends, loadFriendRequests, loadUnreadCounts]);

  // Clear unread counts on select
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

  // --- Invite & Friend system methods ---
  const handleShareInvite = () => {
    const inviteUrl = `${window.location.origin}/invite/${currentUser.username}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Circl Chat',
        text: `Connect with me on Circl: @${currentUser.username}`,
        url: inviteUrl,
      }).catch(err => console.error(err));
    } else {
      navigator.clipboard.writeText(inviteUrl);
      alert('Invite link copied to clipboard!');
    }
  };

  async function sendFriendRequest(targetId) {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: currentUser.id,
          receiver_id: targetId,
          status: 'pending',
        });
      if (error) throw error;
      loadFriendRequests();
    } catch (err) {
      alert(err.message || 'Could not send friend request.');
    }
  }

  async function acceptFriendRequest(senderId) {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('sender_id', senderId)
        .eq('receiver_id', currentUser.id);
      if (error) throw error;
      loadFriendRequests();
      loadFriends();
    } catch (err) {
      alert(err.message || 'Could not accept request.');
    }
  }

  async function rejectOrCancelRequest(targetId) {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${currentUser.id})`);
      if (error) throw error;
      loadFriendRequests();
      loadFriends();
    } catch (err) {
      alert(err.message || 'Could not remove request.');
    }
  }

  function handleDeleteChat(otherUserId) {
    if (!window.confirm('Are you sure you want to clear this conversation?')) return;
    const now = new Date().toISOString();
    const key = `circl_cleared_${[currentUser.id, otherUserId].sort().join('_')}_by_${currentUser.id}`;
    localStorage.setItem(key, now);
    if (selectedUser?.id === otherUserId) {
      onSelectUser(null);
    }
    loadProfiles();
  }

  // Calculate pending incoming requests count for the badge
  const pendingIncomingRequests = friendRequests.filter(
    (r) => r.receiver_id === currentUser.id && r.status === 'pending'
  );
  const badgeCount = pendingIncomingRequests.length;

  return (
    <div className="user-list">
      {/* ── Search Bar ── */}
      <div className="search-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          className="search"
          placeholder="Search by username…"
          value={search}
          onChange={(e) => setSearch(e.target.value.toLowerCase())}
        />
        {searchLoading && <span className="spinner-dots small-spinner">•••</span>}
      </div>

      {/* ── Mode Tabs ── */}
      {!search && (
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            Chats
          </button>
          <button
            className={`filter-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends
          </button>
          <button
            className={`filter-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
            style={{ position: 'relative' }}
          >
            Requests
            {badgeCount > 0 && <span className="tab-badge">{badgeCount}</span>}
          </button>
        </div>
      )}

      {loading && <p className="muted small" style={{ padding: '16px' }}>Loading list…</p>}

      {error && <p className="error small" style={{ margin: '16px' }}>{error}</p>}

      {/* ── Rendering search results if search is active ── */}
      {search && !searchLoading && (
        <ul className="search-results-list">
          <li className="search-title muted small" style={{ padding: '8px 18px', fontSize: '12px' }}>
            Search Results for "{search}"
          </li>
          {searchResults.length === 0 ? (
            <p className="muted small" style={{ padding: '16px 18px' }}>No users found matching @{search}</p>
          ) : (
            searchResults.map((p) => {
              const req = friendRequests.find(
                (r) =>
                  (r.sender_id === currentUser.id && r.receiver_id === p.id) ||
                  (r.sender_id === p.id && r.receiver_id === currentUser.id)
              );

              let relationState = 'none'; // none, pending_out, pending_in, friends
              if (req) {
                if (req.status === 'accepted') relationState = 'friends';
                else if (req.status === 'pending') {
                  relationState = req.sender_id === currentUser.id ? 'pending_out' : 'pending_in';
                }
              }

              return (
                <li key={p.id} className="user-item">
                  <div className="avatar-wrapper">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} className="avatar-sm" alt="User avatar" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="avatar-sm">{p.display_name?.[0]?.toUpperCase() || p.username?.[0]?.toUpperCase()}</div>
                    )}
                  </div>
                  <div className="user-item-info">
                    <span className="username" style={{ fontWeight: 600 }}>{p.display_name}</span>
                    <span className="last-seen">@{p.username}</span>
                  </div>
                  <div className="relationship-action">
                    {relationState === 'none' && (
                      <button className="btn primary small" onClick={() => sendFriendRequest(p.id)} style={{ fontSize: '11px', padding: '6px 12px' }}>
                        Add Friend
                      </button>
                    )}
                    {relationState === 'pending_out' && (
                      <button className="btn ghost small" onClick={() => rejectOrCancelRequest(p.id)} style={{ fontSize: '11px', padding: '6px 10px', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)' }} title="Cancel Request">
                        Requested
                      </button>
                    )}
                    {relationState === 'pending_in' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn primary small" onClick={() => acceptFriendRequest(p.id)} style={{ fontSize: '10.5px', padding: '5px 10px' }}>
                          Accept
                        </button>
                        <button className="btn ghost small" onClick={() => rejectOrCancelRequest(p.id)} style={{ fontSize: '10.5px', padding: '5px 8px', color: '#ff5e7e' }}>
                          Reject
                        </button>
                      </div>
                    )}
                    {relationState === 'friends' && (
                      <button className="btn ghost small" onClick={() => { setSearch(''); onSelectUser(p); }} style={{ fontSize: '11px', padding: '6px 12px' }}>
                        Chat
                      </button>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}

      {/* ── Rendering Active Tabs if search is empty ── */}
      {!search && !loading && (
        <>
          {/* TAB 1: CHATS */}
          {activeTab === 'chats' && (
            <>
              {profiles.length === 0 && (
                <div style={{ padding: '30px 18px', textAlign: 'center' }}>
                  <p className="muted small" style={{ marginBottom: '12px' }}>No active chats.</p>
                  <button className="btn primary small" onClick={() => setActiveTab('friends')}>
                    View Friends List
                  </button>
                </div>
              )}
              <ul>
                {profiles.map((p) => {
                  const online = isOnline(p.last_seen_at);
                  const unread = unreadCounts[p.id] || 0;
                  return (
                    <li
                      key={p.id}
                      className={selectedUser?.id === p.id ? 'user-item active' : 'user-item'}
                      onClick={() => onSelectUser(p)}
                    >
                      <div className="avatar-wrapper">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} className="avatar-sm" alt="User avatar" style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="avatar-sm">{p.display_name?.[0]?.toUpperCase() || p.username?.[0]?.toUpperCase()}</div>
                        )}
                        {online && <span className="status-badge-online" />}
                      </div>
                      <div className="user-item-info">
                        <span className="username">{p.display_name}</span>
                        <span className={`last-seen ${online ? 'online' : ''}`}>
                          {online ? 'online' : formatLastSeen(p.last_seen_at)}
                        </span>
                      </div>
                      <div className="user-item-actions">
                        {unread > 0 && <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>}
                        <button
                          className="delete-chat-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(p.id);
                          }}
                          title="Delete conversation"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {/* TAB 2: FRIENDS */}
          {activeTab === 'friends' && (
            <>
              <div style={{ padding: '12px 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted small" style={{ fontSize: '11.5px' }}>{friends.length} friends</span>
                <button className="btn ghost small" onClick={handleShareInvite} style={{ padding: '5px 10px', fontSize: '11px', borderColor: 'rgba(255,94,126,0.25)', color: 'var(--accent-rose)' }}>
                  🔗 Share Invite Link
                </button>
              </div>
              {friends.length === 0 ? (
                <div style={{ padding: '30px 18px', textAlign: 'center' }}>
                  <p className="muted small" style={{ marginBottom: '14px' }}>Add friends by searching their @username, or share your invite link!</p>
                  <button className="btn primary small" onClick={handleShareInvite}>
                    Share Invite Link
                  </button>
                </div>
              ) : (
                <ul style={{ marginTop: '8px' }}>
                  {friends.map((p) => {
                    const online = isOnline(p.last_seen_at);
                    return (
                      <li
                        key={p.id}
                        className={selectedUser?.id === p.id ? 'user-item active' : 'user-item'}
                        onClick={() => onSelectUser(p)}
                      >
                        <div className="avatar-wrapper">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} className="avatar-sm" alt="User avatar" style={{ objectFit: 'cover' }} />
                          ) : (
                            <div className="avatar-sm">{p.display_name?.[0]?.toUpperCase() || p.username?.[0]?.toUpperCase()}</div>
                          )}
                          {online && <span className="status-badge-online" />}
                        </div>
                        <div className="user-item-info">
                          <span className="username">{p.display_name}</span>
                          <span className="last-seen">@{p.username}</span>
                        </div>
                        <div className="user-item-actions">
                          <button className="btn ghost small" style={{ padding: '5px 10px', fontSize: '11px' }}>
                            Chat
                          </button>
                          <button
                            className="delete-chat-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Remove ${p.display_name} from friends list?`)) {
                                rejectOrCancelRequest(p.id);
                              }
                            }}
                            title="Remove friend"
                            style={{ marginLeft: '4px' }}
                          >
                            💔
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {/* TAB 3: REQUESTS */}
          {activeTab === 'requests' && (
            <>
              {pendingIncomingRequests.length === 0 ? (
                <div style={{ padding: '40px 18px', textAlign: 'center' }}>
                  <p className="muted small">No pending friend requests.</p>
                </div>
              ) : (
                <ul>
                  {pendingIncomingRequests.map((req) => {
                    const p = req.profiles;
                    if (!p) return null;
                    return (
                      <li key={req.id} className="user-item" style={{ cursor: 'default' }}>
                        <div className="avatar-wrapper">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} className="avatar-sm" alt="User avatar" style={{ objectFit: 'cover' }} />
                          ) : (
                            <div className="avatar-sm">{p.display_name?.[0]?.toUpperCase() || p.username?.[0]?.toUpperCase()}</div>
                          )}
                        </div>
                        <div className="user-item-info">
                          <span className="username" style={{ fontWeight: 600 }}>{p.display_name}</span>
                          <span className="last-seen">@{p.username}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                          <button className="btn primary small" onClick={() => acceptFriendRequest(p.id)} style={{ fontSize: '11px', padding: '5px 10px' }}>
                            Accept
                          </button>
                          <button className="btn ghost small" onClick={() => rejectOrCancelRequest(p.id)} style={{ fontSize: '11px', padding: '5px 8px', color: '#ff5e7e' }}>
                            Reject
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
