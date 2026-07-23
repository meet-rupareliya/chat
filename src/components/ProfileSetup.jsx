import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Helper to compress and convert file to Base64 using HTML5 Canvas
const compressAndEncodeImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Compress using low quality to stay under 15-20KB
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        resolve(base64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export function ProfileForm({ profile, session, onComplete, isModal, onClose }) {
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [emailVisible, setEmailVisible] = useState(profile.email_visible || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Uniqueness checker states for username changes
  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [suggestions, setSuggestions] = useState([]);

  const lastChanged = profile.username_last_changed_at ? new Date(profile.username_last_changed_at) : null;
  const daysPassed = lastChanged ? (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24) : 999;
  const cooldownDays = 30;
  const daysRemaining = Math.max(0, Math.ceil(cooldownDays - daysPassed));
  const canChangeUsername = daysRemaining <= 0;

  // Real-time username verification (only if changed and editable)
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (trimmed === profile.username?.toLowerCase()) {
      setUsernameStatus('idle');
      setSuggestions([]);
      return;
    }

    if (!trimmed) {
      setUsernameStatus('idle');
      return;
    }

    const isValid = /^[a-z0-9_.]+$/.test(trimmed) && trimmed.length >= 3 && trimmed.length <= 20;
    if (!isValid) {
      setUsernameStatus('invalid');
      setSuggestions([]);
      return;
    }

    setUsernameStatus('checking');

    const checkAvailability = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', trimmed)
          .maybeSingle();

        if (error) throw error;

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
  }, [username, profile.username]);

  // Suggestions generator
  async function generateSuggestions(base) {
    const candidates = [
      `${base}${Math.floor(Math.random() * 90 + 10)}`,
      `${base}_${Math.floor(Math.random() * 89 + 10)}`,
      `${base}.${Math.floor(Math.random() * 89 + 10)}`
    ];

    try {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .in('username', candidates);

      const taken = new Set(data?.map(d => d.username) || []);
      const available = candidates.filter(c => !taken.has(c));
      setSuggestions(available.slice(0, 3));
    } catch (err) {
      setSuggestions(candidates.slice(0, 3));
    }
  }

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      const base64Image = await compressAndEncodeImage(file);
      setAvatarUrl(base64Image);
    } catch (err) {
      console.error('Avatar processing error:', err);
      setError('Could not process the image. Please try another one.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      setError('Display name is required.');
      setLoading(false);
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername) {
      setError('Username is required.');
      setLoading(false);
      return;
    }

    // Uniqueness validation
    if (trimmedUsername !== profile.username?.toLowerCase() && usernameStatus !== 'available') {
      setError('Please choose an available username.');
      setLoading(false);
      return;
    }

    // Save default avatar if empty
    let finalAvatar = avatarUrl;
    if (!finalAvatar) {
      finalAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedUsername)}`;
    }

    try {
      const updateData = {
        display_name: trimmedDisplayName,
        avatar_url: finalAvatar,
        bio: bio.trim(),
        phone: phone.trim(),
        email_visible: emailVisible,
      };

      // Only change username if allowed and edited
      if (trimmedUsername !== profile.username) {
        if (!canChangeUsername) {
          setError(`Username is locked for another ${daysRemaining} days.`);
          setLoading(false);
          return;
        }
        updateData.username = trimmedUsername;
        updateData.username_last_changed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        onComplete();
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="profile-setup-form" onSubmit={handleSave}>
      <div className="avatar-upload-section">
        <div className="avatar-preview-container">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar Preview" className="avatar-large" />
          ) : (
            <div className="avatar-large-fallback">
              {displayName?.[0]?.toUpperCase() || username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <label className="avatar-upload-label" htmlFor="avatar-file-input">
            📸 Upload Photo
          </label>
        </div>
        <input
          id="avatar-file-input"
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          style={{ display: 'none' }}
        />
        <span className="muted small">Recommended: JPG/PNG, compressed automatically.</span>
      </div>

      <div className="form-group">
        <label>Display Name (Public)</label>
        <input
          type="text"
          placeholder="e.g. Raj Patel"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
        />
      </div>

      <div className="form-group">
        <label>Username</label>
        <div className="username-input-wrapper">
          <input
            type="text"
            placeholder="e.g. raj_patel23"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            disabled={!canChangeUsername}
            style={{ paddingRight: '45px' }}
          />
          {canChangeUsername && username !== profile.username && (
            <div className="username-status-badge">
              {usernameStatus === 'checking' && <span className="spinner-dots">•••</span>}
              {usernameStatus === 'available' && <span className="status-available">✓</span>}
              {usernameStatus === 'taken' && <span className="status-taken">✗</span>}
              {usernameStatus === 'invalid' && <span className="status-invalid">!</span>}
            </div>
          )}
        </div>
        {!canChangeUsername ? (
          <span className="field-hint cooldown-locked">
            🔒 Locked. Cooldown: {daysRemaining} days remaining before next change.
          </span>
        ) : (
          <span className="field-hint">
            Allowed: lowercase, numbers, dot, underscore. Cooldown: 30 days.
          </span>
        )}

        {usernameStatus === 'taken' && suggestions.length > 0 && (
          <div className="suggestions-box">
            <p>Taken. Suggestions:</p>
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
      </div>

      <div className="form-group">
        <label>Bio (Max 150 chars)</label>
        <textarea
          placeholder="Status message or quick bio..."
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 150))}
          rows={3}
          maxLength={150}
        />
        <div className="char-count text-right small muted">
          {bio.length}/150
        </div>
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label>Recovery Phone (Optional)</label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="form-group flex-1">
          <label>Account Email</label>
          <input
            type="email"
            value={session?.user?.email || ''}
            disabled
            style={{ opacity: 0.6 }}
          />
        </div>
      </div>

      <div className="form-group checkbox-row">
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={emailVisible}
            onChange={(e) => setEmailVisible(e.target.checked)}
          />
          <span className="checkbox-text">Show email publicly on profile screen</span>
        </label>
      </div>

      <div className="form-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        {isModal && (
          <button type="button" className="btn ghost flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn primary flex-1" disabled={loading}>
          {loading ? 'Saving…' : 'Save Profile'}
        </button>
      </div>

      {error && <p className="error" style={{ marginTop: '16px' }}>{error}</p>}
      {success && <p className="info" style={{ marginTop: '16px', color: '#10b981', borderLeftColor: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>{success}</p>}
    </form>
  );
}

// standalone profile wizard page
export default function ProfileSetup({ profile, session, onComplete }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card profile-setup-card" style={{ maxWidth: '480px' }}>
        <h2>Setup Your Profile<span className="logo-dot">.</span></h2>
        <p className="muted" style={{ marginBottom: '24px' }}>Please complete your profile to start connecting.</p>
        <ProfileForm profile={profile} session={session} onComplete={onComplete} isModal={false} />
      </div>
    </div>
  );
}

// Modal popup wrapper for settings page editing
export function SettingsModal({ profile, session, onClose, onSave }) {
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content auth-card" style={{ maxWidth: '480px', padding: '30px 25px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>Profile Settings<span className="logo-dot">.</span></h2>
          <button className="close-x" onClick={onClose}>&times;</button>
        </div>
        <ProfileForm profile={profile} session={session} onComplete={onSave} isModal={true} onClose={onClose} />
      </div>
    </div>
  );
}
