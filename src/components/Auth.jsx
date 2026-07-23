import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle, checking, available, taken, invalid
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  function switchMode(m) {
    setMode(m);
    setError('');
    setInfo('');
    setUsernameStatus('idle');
    setSuggestions([]);
  }

  // Real-time username validation and availability checks
  useEffect(() => {
    if (mode !== 'signup') {
      setUsernameStatus('idle');
      setSuggestions([]);
      return;
    }

    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setUsernameStatus('idle');
      setSuggestions([]);
      return;
    }

    // Validation: lower letters, numbers, underscore, dot. Min 3, max 20.
    const isValid = /^[a-z0-9_.]+$/.test(trimmed) && trimmed.length >= 3 && trimmed.length <= 20;
    if (!isValid) {
      setUsernameStatus('invalid');
      setSuggestions([]);
      return;
    }

    setUsernameStatus('checking');

    const checkAvailability = async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', trimmed)
          .maybeSingle();

        if (queryError) throw queryError;

        if (data) {
          setUsernameStatus('taken');
          generateSuggestions(trimmed);
        } else {
          setUsernameStatus('available');
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Username check error:', err);
        setUsernameStatus('idle');
      }
    };

    const delayDebounceFn = setTimeout(checkAvailability, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [username, mode]);

  // Generate 3 unique suggestions if username is taken
  async function generateSuggestions(base) {
    const candidates = [
      `${base}${Math.floor(Math.random() * 90 + 10)}`,
      `${base}_${Math.floor(Math.random() * 89 + 10)}`,
      `${base}.${Math.floor(Math.random() * 89 + 10)}`,
      `im_${base}`,
      `${base}_fit`,
      `the_${base}`
    ];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .in('username', candidates);

      if (!error && data) {
        const taken = new Set(data.map(d => d.username));
        const available = candidates.filter(c => !taken.has(c));
        setSuggestions(available.slice(0, 3));
      } else {
        setSuggestions(candidates.slice(0, 3));
      }
    } catch (err) {
      console.error('Suggestions error:', err);
      setSuggestions(candidates.slice(0, 3));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    if (mode === 'signup') {
      const trimmedUsername = username.trim().toLowerCase();
      if (!trimmedUsername) {
        setError('Username is required.');
        setLoading(false);
        return;
      }

      const isValid = /^[a-z0-9_.]+$/.test(trimmedUsername) && trimmedUsername.length >= 3 && trimmedUsername.length <= 20;
      if (!isValid) {
        setError('Username must be 3-20 characters, containing only lowercase letters, numbers, underscore, or dot.');
        setLoading(false);
        return;
      }

      if (usernameStatus === 'checking') {
        setError('Please wait while we verify your username.');
        setLoading(false);
        return;
      }

      if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
        setError('Please choose a valid and available username.');
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: trimmedUsername },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If session exists immediately, insert profile row (email confirmation disabled)
      if (data.session) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: trimmedUsername,
        });
        return;
      }

      setInfo('Account created! Check your email to confirm, then log in.');
      setLoading(false);
      return;
    }

    // Login flow
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setError(loginError.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Circl<span className="logo-dot">.</span></h1>
        <p className="muted">Register, find people, chat live.</p>

        <div className="tabs">
          <button
            className={mode === 'login' ? 'tab active' : 'tab'}
            onClick={() => switchMode('login')}
            type="button"
          >
            Log in
          </button>
          <button
            className={mode === 'signup' ? 'tab active' : 'tab'}
            onClick={() => switchMode('signup')}
            type="button"
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="username-input-wrapper">
              <input
                type="text"
                placeholder="Username (e.g. raj_patel23)"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                autoComplete="username"
                style={{ paddingRight: '45px' }}
              />
              <div className="username-status-badge">
                {usernameStatus === 'checking' && <span className="spinner-dots">•••</span>}
                {usernameStatus === 'available' && <span className="status-available">✓</span>}
                {usernameStatus === 'taken' && <span className="status-taken">✗</span>}
                {usernameStatus === 'invalid' && <span className="status-invalid">!</span>}
              </div>
              
              {usernameStatus === 'taken' && suggestions.length > 0 && (
                <div className="suggestions-box">
                  <p>Taken. Available suggestions:</p>
                  <div className="suggestions-list">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        type="button"
                        className="suggestion-badge"
                        onClick={() => setUsername(s)}
                      >
                        @{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {usernameStatus === 'invalid' && username.length > 0 && (
                <p className="field-hint-error">
                  Must be 3-20 chars: lowercase letters, numbers, dot, or underscore.
                </p>
              )}
            </div>
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
        {info && <p className="info">{info}</p>}
      </div>
    </div>
  );
}
