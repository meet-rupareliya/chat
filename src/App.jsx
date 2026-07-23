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
      </aside>

      <main className="main">
        <Chat currentUser={profile} otherUser={selectedUser} onBack={() => setSelectedUser(null)} />
      </main>
    </div>
  );
}
