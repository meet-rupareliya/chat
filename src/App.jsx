import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth.jsx';
import UserList from './components/UserList.jsx';
import Chat from './components/Chat.jsx';
import ProfileSetup, { SettingsModal } from './components/ProfileSetup.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [initialScrollMessageId, setInitialScrollMessageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Capture Invite URL path at startup
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/invite\/([a-zA-Z0-9_.]+)/);
    if (match) {
      const userStr = match[1].toLowerCase();
      localStorage.setItem('pending_invite_username', userStr);
      // Clean path so browser history looks neat
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      if (window.visualViewport) {
        const height = window.visualViewport.height;
        document.documentElement.style.setProperty('--viewport-height', `${height}px`);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      handleResize();
    }

    const handleScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    loadOwnProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Handle invite links when user is logged in
  useEffect(() => {
    if (!session || !profile || !profile.display_name) return;

    const handlePendingInvite = async () => {
      const pending = localStorage.getItem('pending_invite_username');
      if (!pending) return;

      localStorage.removeItem('pending_invite_username');

      if (pending === profile.username?.toLowerCase()) {
        console.log('Cannot invite yourself.');
        return;
      }

      try {
        // Retrieve inviter profile
        const { data: inviter, error: invError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('username', pending)
          .maybeSingle();

        if (invError) throw invError;
        if (!inviter) {
          console.warn('Inviter not found:', pending);
          return;
        }

        // Check if friendship or request exists
        const { data: existing } = await supabase
          .from('friend_requests')
          .select('*')
          .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${inviter.id}),and(sender_id.eq.${inviter.id},receiver_id.eq.${profile.id})`)
          .maybeSingle();

        if (!existing) {
          // Automatically send friend request
          await supabase
            .from('friend_requests')
            .insert({
              sender_id: profile.id,
              receiver_id: inviter.id,
              status: 'pending'
            });
        }

        // Auto-select user to open request/chat
        setSelectedUser(inviter);
      } catch (err) {
        console.error('Invite handler error:', err);
      }
    };

    handlePendingInvite();
  }, [session, profile]);

  useEffect(() => {
    if (!session || !profile) return;

    const updatePresence = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', profile.id);
    };

    updatePresence();
    const interval = setInterval(updatePresence, 30000); // 30s heartbeat

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [session, profile?.id]);

  async function loadOwnProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, phone, email_visible, username_last_changed_at')
      .eq('id', session.user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    } else {
      // Fallback & Ensure profile exists in public.profiles table
      const fallbackUsername = session.user.user_metadata?.username || session.user.email.split('@')[0];
      const newProfile = { id: session.user.id, username: fallbackUsername };

      const { data: upsertedData, error: upsertError } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select('id, username, display_name, avatar_url, bio, phone, email_visible, username_last_changed_at')
        .single();

      if (!upsertError && upsertedData) {
        setProfile(upsertedData);
      } else {
        console.warn('Profile sync warning:', upsertError?.message);
        setProfile(newProfile);
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSelectedUser(null);
  }

  if (loading) return <div className="center-msg">Loading…</div>;
  if (!session) return <Auth />;
  if (!profile) return <div className="center-msg">Setting up your profile…</div>;

  // Redirect to Wizard if Profile display_name is empty
  if (!profile.display_name) {
    return <ProfileSetup profile={profile} session={session} onComplete={loadOwnProfile} />;
  }

  return (
    <div className={`app-shell ${selectedUser ? 'has-active-chat' : ''}`}>
      <aside className="sidebar">
        <div className="me">
          <div className="avatar-wrapper">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                className="avatar-sm"
                alt="My avatar"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="avatar-sm">
                {profile.display_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="status-badge-online" />
          </div>
          <div>
            <strong>{profile.display_name}</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '-2px' }}>
              @{profile.username}
            </span>
          </div>
          <div className="me-actions" style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn ghost small"
              onClick={() => setShowSettings(true)}
              title="Profile Settings"
              style={{ padding: '6px 10px', fontSize: '13px' }}
            >
              ⚙️
            </button>
            <button
              className="btn ghost small"
              onClick={handleLogout}
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              Log out
            </button>
          </div>
        </div>
        <UserList
          currentUser={profile}
          selectedUser={selectedUser}
          onSelectUser={(u) => {
            setSelectedUser(u);
            setInitialScrollMessageId(null); // clear if clicking general user list
          }}
          onSelectUserWithMessage={(u, mid) => {
            setSelectedUser(u);
            setInitialScrollMessageId(mid);
          }}
        />
      </aside>

      <main className="main">
        <Chat
          currentUser={profile}
          otherUser={selectedUser}
          onBack={() => setSelectedUser(null)}
          initialScrollMessageId={initialScrollMessageId}
          clearInitialScrollMessageId={() => setInitialScrollMessageId(null)}
        />
      </main>

      {showSettings && (
        <SettingsModal
          profile={profile}
          session={session}
          onClose={() => setShowSettings(false)}
          onSave={loadOwnProfile}
        />
      )}
    </div>
  );
}
