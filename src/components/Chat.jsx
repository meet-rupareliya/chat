import { useEffect, useRef, useState } from 'react';
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
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);
  const clearMenuRef = useRef(null);

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
        .select('id, username, last_seen_at')
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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          <div className="chat-empty-icon">💬</div>
          <h2>Welcome to Circl</h2>
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
          <div className="avatar-sm">{otherUserProfile?.username?.[0]?.toUpperCase()}</div>
          <div className="chat-header-info">
            <strong>{otherUserProfile?.username}</strong>
            <span className={`status-text ${online ? 'online' : ''}`}>
              {formatLastSeen(otherUserProfile?.last_seen_at)}
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
      <div className="chat-messages">
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
                  {/*
                    WhatsApp layout trick:
                    The text and the "tail" (time + ticks) are in the same inline flow.
                    The tail is an inline-flex block that floats to the end of the last
                    text line, creating the characteristic WhatsApp time position.
                  */}
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

      {/* ── Input ── */}
      <form className="chat-input" onSubmit={sendMessage}>
        <button
          type="button"
          className="emoji-toggle-btn"
          onClick={() => setShowEmoji((v) => !v)}
          title="Emoji"
        >
          {showEmoji ? '😊' : '😊'}
        </button>
        <input
          ref={inputRef}
          type="text"
          placeholder={`Message ${otherUser.username}…`}
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
    </div>
  );
}
