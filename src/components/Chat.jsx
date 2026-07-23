import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// ── Emoji data ──────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  {
    label: '😀 Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐'],
  },
  {
    label: '👋 Gestures',
    emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝','👍','👎','✊','👊','🤛','🤜','👏','🙌','🤲','🤝','🙏','✍','💅','🤳','💪','🦾','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁','👅','👄'],
  },
  {
    label: '❤️ Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☯️','🕉','🛐','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🔯','✡️','☪️'],
  },
  {
    label: '🎉 Celebration',
    emojis: ['🎉','🎊','🎈','🎁','🎀','🎗','🎟','🎫','🏆','🥇','🥈','🥉','🏅','🎖','🏵','🎪','🤹','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎻','🎮','👾','🕹','🃏','🀄','🎲','♟','🎯','🎳','🎰','🎻'],
  },
  {
    label: '🐶 Animals',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿','🦔'],
  },
  {
    label: '🍕 Food',
    emojis: ['🍕','🍔','🍟','🌭','🍿','🧂','🥓','🥚','🍳','🧇','🥞','🧈','🍞','🥐','🥖','🥨','🥯','🧀','🥗','🥙','🥪','🌮','🌯','🫔','🧆','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🍼','🥛','☕','🍵','🧃','🥤','🧋','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾'],
  },
  {
    label: '⚽ Sports',
    emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🏑','🥍','🏏','⛳','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛷','⛸','🥌','🎿','⛷','🏂','🏋️','🤼','🤸','🤺','⛺','🏕','🚵','🤼','🏊','🤽','🧘','🏄'],
  },
  {
    label: '🚗 Travel',
    emojis: ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍','🛵','🛺','🚲','🛴','🛹','🚏','🛣','🛤','⛽','🚨','🚥','🚦','🛑','🚧','⚓','⛵','🛶','🚤','🛳','⛴','🛥','🚢','✈️','🛩','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰','🚀','🛸','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩','🕋'],
  },
];

// localStorage key for cleared-at timestamps
function getClearKey(uid1, uid2) {
  return `circl_cleared_${[uid1, uid2].sort().join('_')}_by_${uid1}`;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Chat({ currentUser, otherUser, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [otherUserProfile, setOtherUserProfile] = useState(otherUser);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState(0);
  const [clearedAt, setClearedAt] = useState(null);
  const [showClearMenu, setShowClearMenu] = useState(false);
  const [friendship, setFriendship] = useState(null); // null (checking), 'friends', 'pending_out', 'pending_in', 'none'
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);
  const clearMenuRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
    }
  };

  const checkFriendshipStatus = useCallback(async () => {
    if (!otherUser) return;
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setFriendship('none');
      } else if (data.status === 'accepted') {
        setFriendship('friends');
      } else {
        setFriendship(data.sender_id === currentUser.id ? 'pending_out' : 'pending_in');
      }
    } catch (err) {
      console.error('Check friendship status error:', err);
      setFriendship('none');
    }
  }, [currentUser.id, otherUser?.id]);

  // Handle friend requests inside chat container
  async function handleAddFriend() {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: currentUser.id,
          receiver_id: otherUser.id,
          status: 'pending'
        });
      if (error) throw error;
      checkFriendshipStatus();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAcceptFriend() {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('sender_id', otherUser.id)
        .eq('receiver_id', currentUser.id);
      if (error) throw error;
      checkFriendshipStatus();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRejectOrCancel() {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUser.id})`);
      if (error) throw error;
      checkFriendshipStatus();
    } catch (err) {
      console.error(err);
    }
  }

  // Sync friendship state in real-time
  useEffect(() => {
    if (!otherUser) return;
    checkFriendshipStatus();

    const channel = supabase
      .channel(`friendship-${[currentUser.id, otherUser.id].sort().join('-')}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => {
        checkFriendshipStatus();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser.id, otherUser?.id, checkFriendshipStatus]);

  // Close emoji picker and clear menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
      if (clearMenuRef.current && !clearMenuRef.current.contains(e.target)) {
        setShowClearMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load clearedAt from localStorage when conversation changes
  useEffect(() => {
    if (!otherUser) { setClearedAt(null); return; }
    const key = getClearKey(currentUser.id, otherUser.id);
    const stored = localStorage.getItem(key);
    setClearedAt(stored ? new Date(stored) : null);
  }, [currentUser.id, otherUser?.id]);

  // Sync otherUserProfile and track real-time presence
  useEffect(() => {
    setOtherUserProfile(otherUser);
    if (!otherUser) return;

    const fetchLatestProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, last_seen_at')
        .eq('id', otherUser.id)
        .single();
      if (data) setOtherUserProfile(data);
    };
    fetchLatestProfile();

    const channel = supabase
      .channel(`other-user-${otherUser.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${otherUser.id}` },
        (payload) => setOtherUserProfile(payload.new)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [otherUser?.id]);

  // Load messages and subscribe to real-time updates
  useEffect(() => {
    if (!otherUser) {
      setMessages([]);
      return;
    }
    loadMessages();

    const channel = supabase
      .channel(`messages-${[currentUser.id, otherUser.id].sort().join('-')}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const m = payload.new;
            const belongs =
              (m.sender_id === currentUser.id && m.receiver_id === otherUser.id) ||
              (m.sender_id === otherUser.id && m.receiver_id === currentUser.id);
            if (belongs) {
              setMessages((prev) => {
                if (prev.some((msg) => msg.id === m.id)) return prev;
                return [...prev, m];
              });
              if (m.receiver_id === currentUser.id) {
                supabase.from('messages').update({ is_read: true }).eq('id', m.id).then();
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUser?.id]);

  // Auto scroll
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  // Auto focus
  useEffect(() => {
    if (otherUser) inputRef.current?.focus();
  }, [otherUser?.id]);

  // Scroll to bottom on visual viewport resize (keyboard show/hide)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const handleResize = () => {
      setTimeout(() => {
        scrollToBottom('smooth');
      }, 80);
    };
    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport.removeEventListener('resize', handleResize);
  }, []);

  async function loadMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUser.id})`
      )
      .order('created_at', { ascending: true });

    if (!error) {
      setMessages(data || []);
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', otherUser.id)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false)
        .then();
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !otherUser || sending) return;

    setSending(true);
    setText('');
    setShowEmoji(false);
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: otherUser.id,
      content,
    });
    if (error) {
      console.error('Send failed:', error.message);
      setText(content);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function insertEmoji(emoji) {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    // Restore cursor after emoji
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  }

  async function handleDeleteMessage(msgId) {
    await supabase.from('messages').delete().eq('id', msgId);
  }

  // ── Clear for ME only (localStorage, DB unaffected, other person still sees) ──
  function handleClearForMe() {
    setShowClearMenu(false);
    const now = new Date().toISOString();
    const key = getClearKey(currentUser.id, otherUser.id);
    localStorage.setItem(key, now);
    setClearedAt(new Date(now));
  }

  // ── Delete for EVERYONE (actually removes from DB) ──
  async function handleDeleteForEveryone() {
    setShowClearMenu(false);
    if (!window.confirm('This will permanently delete ALL messages in this chat for both people. Continue?')) return;
    
    // Clear state immediately for fast feedback
    setMessages([]);
    
    const { error } = await supabase
      .from('messages')
      .delete()
      .in('sender_id', [currentUser.id, otherUser.id])
      .in('receiver_id', [currentUser.id, otherUser.id]);

    if (error) {
      console.error('Delete for everyone error:', error.message);
      // Reload on error
      loadMessages();
    } else {
      // Also clear the local clear timestamp
      const key = getClearKey(currentUser.id, otherUser.id);
      localStorage.removeItem(key);
      setClearedAt(null);
    }
  }

  function isOnline(lastSeenAt) {
    if (!lastSeenAt) return false;
    return Date.now() - new Date(lastSeenAt).getTime() < 60000;
  }

  function formatLastSeen(lastSeenAt) {
    if (!lastSeenAt) return 'offline';
    const diffMs = Date.now() - new Date(lastSeenAt).getTime();
    if (diffMs < 60000) return 'online';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `last seen ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `last seen ${diffHours}h ago`;
    return `last seen ${new Date(lastSeenAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  function getDateLabel(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }

  // Format time like WhatsApp: "10:27 pm"
  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();
  }

  if (!otherUser) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-inner">
          <div className="chat-empty-icon">
            <svg viewBox="0 0 24 24" width="64" height="64" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="chatEmptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffc542" />
                  <stop offset="60%" stopColor="#ff5e7e" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <path fill="url(#chatEmptyGrad)" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
            </svg>
          </div>
          <h2>Welcome to Circl<span className="logo-dot" style={{ color: '#ff5e7e', fontWeight: 900 }}>.</span></h2>
          <p>Select a person from the list to start chatting.</p>
        </div>
      </div>
    );
  }

  const online = isOnline(otherUserProfile?.last_seen_at);

  // Filter out messages cleared on this side + build date separators
  const visibleMessages = clearedAt
    ? messages.filter((m) => new Date(m.created_at) > clearedAt)
    : messages;

  let lastDateLabel = null;
  const messageItems = [];
  visibleMessages.forEach((m) => {
    const dateLabel = getDateLabel(m.created_at);
    if (dateLabel !== lastDateLabel) {
      messageItems.push({ type: 'date', label: dateLabel, key: `date-${dateLabel}` });
      lastDateLabel = dateLabel;
    }
    messageItems.push({ type: 'message', data: m, key: m.id });
  });

  return (
    <div className="chat">
      {/* ── Header ── */}
      <div className="chat-header">
        <div className="chat-header-profile">
          {onBack && (
            <button className="back-btn" onClick={onBack} title="Back">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>
          )}
          <div className="avatar-wrapper">
            {otherUserProfile?.avatar_url ? (
              <img
                src={otherUserProfile.avatar_url}
                className="avatar-sm"
                alt="User avatar"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="avatar-sm">
                {otherUserProfile?.display_name?.[0]?.toUpperCase() || otherUserProfile?.username?.[0]?.toUpperCase()}
              </div>
            )}
            {online && <span className="status-badge-online" />}
          </div>
          <div className="chat-header-info">
            <strong>{otherUserProfile?.display_name || otherUserProfile?.username}</strong>
            <span className={`status-text ${online ? 'online' : ''}`}>
              {online ? 'online' : formatLastSeen(otherUserProfile?.last_seen_at)}
              {otherUserProfile?.username && ` • @${otherUserProfile.username}`}
            </span>
          </div>
        </div>
        {/* Clear dropdown menu */}
        <div className="clear-menu-wrap" ref={clearMenuRef}>
          <button
            className="btn ghost small clear-chat-btn"
            onClick={() => setShowClearMenu((v) => !v)}
            title="Clear options"
          >
            🗑 Clear
          </button>
          {showClearMenu && (
            <div className="clear-dropdown">
              <button className="clear-option" onClick={handleClearForMe}>
                <span>👁 Clear for me</span>
                <span className="clear-option-sub">Only hidden on your side</span>
              </button>
              <button className="clear-option danger" onClick={handleDeleteForEveryone}>
                <span>🗑 Delete for everyone</span>
                <span className="clear-option-sub">Permanent — both sides</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="chat-messages" ref={messagesContainerRef}>
        <div className="chat-bg-pattern" />
        <div className="chat-bg-glow-1" />
        <div className="chat-bg-glow-2" />
        {clearedAt && visibleMessages.length === 0 && (
          <div className="cleared-notice">
            <span>🧹 Chat cleared on your side</span>
          </div>
        )}
        {messageItems.map((item) => {
          if (item.type === 'date') {
            return (
              <div key={item.key} className="date-separator">
                <span>{item.label}</span>
              </div>
            );
          }

          const m = item.data;
          const isMine = m.sender_id === currentUser.id;

          return (
            <div key={item.key} className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
              <div className="bubble-wrapper">
                <div className={`bubble ${isMine ? 'mine' : 'theirs'}`}>
                  <span className="msg-body">
                    {m.content}
                    <span className="msg-tail">
                      <span className="msg-time">{formatTime(m.created_at)}</span>
                      {isMine && (
                        <span className={`msg-status ${m.is_read ? 'read' : 'sent'}`}>✓✓</span>
                      )}
                    </span>
                  </span>
                </div>
                {isMine && (
                  <button
                    className="msg-delete-btn"
                    onClick={() => handleDeleteMessage(m.id)}
                    title="Delete message"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {messages.length === 0 && !clearedAt && (
          <div className="no-messages">
            <p>No messages yet. Say hi! 👋</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Emoji Picker ── */}
      {showEmoji && (
        <div className="emoji-picker" ref={emojiRef}>
          <div className="emoji-tabs">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={i}
                className={`emoji-tab-btn ${emojiTab === i ? 'active' : ''}`}
                onClick={() => setEmojiTab(i)}
                title={cat.label}
              >
                {cat.emojis[0]}
              </button>
            ))}
          </div>
          <div className="emoji-label">{EMOJI_CATEGORIES[emojiTab].label}</div>
          <div className="emoji-grid">
            {EMOJI_CATEGORIES[emojiTab].emojis.map((emoji) => (
              <button
                key={emoji}
                className="emoji-btn"
                onClick={() => insertEmoji(emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Dynamic Input gating based on friendship ── */}
      {friendship === 'friends' ? (
        <form className="chat-input" onSubmit={sendMessage}>
          <button
            type="button"
            className="emoji-toggle-btn"
            onClick={() => setShowEmoji((v) => !v)}
            title="Emoji"
          >
            😊
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder={`Message ${otherUserProfile?.display_name || otherUserProfile?.username || 'user'}…`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowEmoji(false);
            }}
          />
          <button
            className="send-btn"
            type="submit"
            disabled={sending || !text.trim()}
            title="Send"
          >
            {sending ? (
              <span className="sending-dots">•••</span>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </form>
      ) : (
        <div className="chat-relationship-banner">
          {friendship === 'none' && (
            <div className="banner-content">
              <span>🔒 You must be friends to send messages.</span>
              <button type="button" className="btn primary small" onClick={handleAddFriend} style={{ fontSize: '11px', padding: '6px 12px' }}>
                Send Friend Request
              </button>
            </div>
          )}
          {friendship === 'pending_out' && (
            <div className="banner-content">
              <span>⏳ Friend request pending. You can chat once they accept.</span>
              <button type="button" className="btn ghost small" onClick={handleRejectOrCancel} style={{ fontSize: '11px', padding: '6px 10px', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)' }}>
                Cancel Request
              </button>
            </div>
          )}
          {friendship === 'pending_in' && (
            <div className="banner-content">
              <span>👋 Received a friend request from this user.</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn primary small" onClick={handleAcceptFriend} style={{ fontSize: '11px', padding: '6px 12px' }}>
                  Accept
                </button>
                <button type="button" className="btn ghost small" onClick={handleRejectOrCancel} style={{ fontSize: '11px', padding: '6px 10px', color: '#ff5e7e' }}>
                  Reject
                </button>
              </div>
            </div>
          )}
          {friendship === null && (
            <div className="banner-content">
              <span className="spinner-dots">•••</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
