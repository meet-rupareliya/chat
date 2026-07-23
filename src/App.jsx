import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth.jsx';
import UserList from './components/UserList.jsx';
import Chat from './components/Chat.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [session, profile?.id]);


  async function loadOwnProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', session.user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    } else {
      // Fallback & Ensure profile exists in public.profiles table:
      // The profile row wasn't created at sign-up time. Since the user is authenticated now, we can write it.
      const fallbackUsername = session.user.user_metadata?.username || session.user.email.split('@')[0];
      const newProfile = { id: session.user.id, username: fallbackUsername };

      const { data: upsertedData, error: upsertError } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
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

  return (
    <div className={`app-shell ${selectedUser ? 'has-active-chat' : ''}`}>
      <aside className="sidebar">
        <div className="me">
          <div className="avatar-sm">{profile.username?.[0]?.toUpperCase()}</div>
          <div>
            <strong>{profile.username}</strong>
            <span className="online-dot" title="Online" />
          </div>
          <button className="btn ghost small" onClick={handleLogout}>
            Log out
          </button>
        </div>
        <UserList
          currentUser={profile}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />
        {/* Float navigation bar */}
        <div className="float-nav">
          <button className="nav-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>
          <button className="nav-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
            </svg>
          </button>
          <button className="nav-item active">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2z"/>
            </svg>
          </button>
          <button className="nav-item">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </button>
        </div>
      </aside>

      <main className="main">
        <Chat currentUser={profile} otherUser={selectedUser} onBack={() => setSelectedUser(null)} />
      </main>
    </div>
  );
}
