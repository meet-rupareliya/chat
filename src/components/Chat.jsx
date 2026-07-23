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

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightText = (text, query, currentMatchId, msgId) => {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  const isCurrentActive = currentMatchId === msgId;
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        className={isCurrentActive ? 'search-highlight active' : 'search-highlight'}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const compressImageFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
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
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.85);
      };
    };
  });
};

export function VoiceNotePlayer({ url, duration }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(url);
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(err => console.error(err));
      setPlaying(true);
    }
  };

  const handleSliderChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const pct = parseFloat(e.target.value);
    const newTime = (pct / 100) * (audio.duration || duration || 0);
    audio.currentTime = newTime;
    setProgress(pct);
    setCurrentTime(newTime);
  };

  const formatAudioTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="voice-note-player">
      <button type="button" className="vn-play-btn" onClick={togglePlay}>
        {playing ? '⏸️' : '▶️'}
      </button>
      <div className="vn-waveform-slider-wrap">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSliderChange}
          className="vn-progress-slider"
        />
        <div className="vn-time-row">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Chat({ currentUser, otherUser, onBack, initialScrollMessageId, clearInitialScrollMessageId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [otherUserProfile, setOtherUserProfile] = useState(otherUser);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState(0);
  const [clearedAt, setClearedAt] = useState(null);
  const [showClearMenu, setShowClearMenu] = useState(false);
  const [friendship, setFriendship] = useState(null); // null (checking), 'friends', 'pending_out', 'pending_in', 'none'
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);
  const clearMenuRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const localIsTypingRef = useRef(false);
  const typingChannelRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const drawVisualRef = useRef(null);
  const streamRef = useRef(null);

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

  // Sync typing status in real-time via broadcast
  useEffect(() => {
    if (!otherUser) {
      typingChannelRef.current = null;
      return;
    }

    const roomId = [currentUser.id, otherUser.id].sort().join('_');
    const channel = supabase.channel(`typing:${roomId}`);
    typingChannelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId === otherUser.id) {
          setOtherIsTyping(payload.payload.isTyping);
        }
      })
      .subscribe();

    setOtherIsTyping(false);

    return () => {
      // Clear timeout and stop typing when switching chat
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      stopVoiceRecording(true);
      if (localIsTypingRef.current && channel) {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUser.id, isTyping: false }
        });
      }
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
    };
  }, [currentUser.id, otherUser?.id]);

  const sendTypingStatus = (isTyping) => {
    const channel = typingChannelRef.current;
    if (!channel) return;

    if (isTyping) {
      if (!localIsTypingRef.current) {
        localIsTypingRef.current = true;
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUser.id, isTyping: true }
        });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        localIsTypingRef.current = false;
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUser.id, isTyping: false }
        });
      }, 2500);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (localIsTypingRef.current) {
        localIsTypingRef.current = false;
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUser.id, isTyping: false }
        });
      }
    }
  };

  // Close emoji picker, clear menu, and attachment menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
      if (clearMenuRef.current && !clearMenuRef.current.contains(e.target)) {
        setShowClearMenu(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target)) {
        setShowAttachmentMenu(false);
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
              // Only mark as read if the receiver has this chat open AND the tab is visible/focused
              if (
                m.receiver_id === currentUser.id &&
                !document.hidden &&
                (document.hasFocus() || document.visibilityState === 'visible')
              ) {
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
    if (!initialScrollMessageId) {
      scrollToBottom('smooth');
    }
  }, [messages, initialScrollMessageId]);

  // Handle jump scroll to a matched message from global search
  useEffect(() => {
    if (initialScrollMessageId && messages.length > 0) {
      if (messages.some((m) => m.id === initialScrollMessageId)) {
        setTimeout(() => {
          const el = document.getElementById('msg-' + initialScrollMessageId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('glow-highlight');
            setTimeout(() => el.classList.remove('glow-highlight'), 2000);
            clearInitialScrollMessageId();
          }
        }, 300);
      }
    }
  }, [initialScrollMessageId, messages, clearInitialScrollMessageId]);

  // Auto focus
  useEffect(() => {
    if (otherUser) inputRef.current?.focus();
  }, [otherUser?.id]);

  // Mark received messages as read when user returns focus to the tab/window
  useEffect(() => {
    if (!otherUser) return;

    const markReadOnFocus = () => {
      if (!document.hidden && (document.hasFocus() || document.visibilityState === 'visible')) {
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', otherUser.id)
          .eq('receiver_id', currentUser.id)
          .eq('is_read', false)
          .then();
      }
    };

    document.addEventListener('visibilitychange', markReadOnFocus);
    window.addEventListener('focus', markReadOnFocus);

    return () => {
      document.removeEventListener('visibilitychange', markReadOnFocus);
      window.removeEventListener('focus', markReadOnFocus);
    };
  }, [currentUser.id, otherUser?.id]);

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
      // Only mark received messages as read if the tab is currently visible/focused
      // This ensures blue ticks only appear when the receiver actually SEES the messages
      if (!document.hidden && (document.hasFocus() || document.visibilityState === 'visible')) {
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', otherUser.id)
          .eq('receiver_id', currentUser.id)
          .eq('is_read', false)
          .then();
      }
    }
  }

  const handleFileUpload = async (file, typeOverride = null, durationOverride = null) => {
    if (!file || !otherUser) return;

    // Validate size (max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('File size exceeds the 25MB limit.');
      return;
    }

    let fileToUpload = file;
    let type = typeOverride;

    if (!type) {
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else type = 'file';
    }

    // Compress image
    if (type === 'image') {
      try {
        fileToUpload = await compressImageFile(file);
      } catch (err) {
        console.warn('Image compression failed, uploading original:', err);
      }
    }

    // Generate a temporary item for progress tracking
    const tempId = Math.random().toString(36).substring(2, 9);
    const newUpload = {
      id: tempId,
      name: file.name,
      size: fileToUpload.size,
      type,
      progress: 0,
      error: false,
      file: file
    };

    setUploadingFiles(prev => {
      // Remove any existing upload with same name to prevent duplicates on retry
      const filtered = prev.filter(item => item.name !== file.name);
      return [...filtered, newUpload];
    });

    const performUpload = async (uploadItem) => {
      const roomId = [currentUser.id, otherUser.id].sort().join('_');
      const fileExt = uploadItem.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${roomId}/${fileName}`;

      try {
        const { data, error: uploadErr } = await supabase.storage
          .from('chat-media')
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
            // progress updates
            onUploadProgress: (progressEvent) => {
              const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadingFiles(prev =>
                prev.map(item => item.id === uploadItem.id ? { ...item, progress: percent } : item)
              );
            }
          });

        if (uploadErr) throw uploadErr;

        const publicUrl = supabase.storage.from('chat-media').getPublicUrl(filePath).data.publicUrl;

        // Insert message row
        const insertData = {
          sender_id: currentUser.id,
          receiver_id: otherUser.id,
          content: type === 'audio' ? '🔊 Sent a voice note' : `Shared a ${type}: ${uploadItem.name}`,
          media_url: publicUrl,
          media_type: type,
          media_name: uploadItem.name,
          media_size: fileToUpload.size
        };

        if (durationOverride) {
          insertData.media_duration = durationOverride;
        }

        const { error: insertErr } = await supabase.from('messages').insert(insertData);

        if (insertErr) throw insertErr;

        // Clean up from active uploads
        setUploadingFiles(prev => prev.filter(item => item.id !== uploadItem.id));
      } catch (err) {
        console.error('Upload error details:', err);
        setUploadingFiles(prev =>
          prev.map(item => item.id === uploadItem.id ? { ...item, error: true } : item)
        );
      }
    };

    performUpload(newUpload);
  };

  function drawWaveform() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    if (!analyser || !canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;
      drawVisualRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = 'rgba(14, 11, 26, 0.9)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        const grad = canvasCtx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        grad.addColorStop(0, '#ffc542');
        grad.addColorStop(0.6, '#ff5e7e');
        grad.addColorStop(1, '#ec4899');

        canvasCtx.fillStyle = grad;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };
    draw();
  }

  async function startVoiceRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      let finalDuration = 0;

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 100 || finalDuration <= 0) return;

        const file = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
        handleFileUpload(file, 'audio', finalDuration);
      };

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);
      setRecordingTime(0);
      mediaRecorder.start();

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          finalDuration = prev + 1;
          return prev + 1;
        });
      }, 1000);

      setTimeout(drawWaveform, 100);
    } catch (err) {
      console.error('Could not start voice recording:', err);
      alert('Microphone access is required to record voice notes.');
    }
  }

  function stopVoiceRecording(isCancelled = false) {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (drawVisualRef.current) cancelAnimationFrame(drawVisualRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});

    analyserRef.current = null;
    audioCtxRef.current = null;

    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      if (isCancelled) {
        audioChunksRef.current = []; // clear to discard
      }
      mediaRecorder.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }

  function toggleVoiceRecording() {
    if (isRecording) {
      stopVoiceRecording(false);
    } else {
      startVoiceRecording();
    }
  }

  const scrollToMessage = (msgId) => {
    setTimeout(() => {
      const el = document.getElementById('msg-' + msgId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('glow-highlight');
        setTimeout(() => el.classList.remove('glow-highlight'), 1500);
      }
    }, 80);
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (!q.trim()) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const matches = messages
      .filter((m) => !m.media_url && m.content.toLowerCase().includes(q.toLowerCase()))
      .map((m) => m.id);

    setSearchMatches(matches);

    if (matches.length > 0) {
      setCurrentMatchIndex(0);
      scrollToMessage(matches[0]);
    } else {
      setCurrentMatchIndex(-1);
    }
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMessage(searchMatches[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMessage(searchMatches[prevIdx]);
  };

  async function sendMessage(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !otherUser || sending) return;

    setSending(true);
    setText('');
    setShowEmoji(false);
    sendTypingStatus(false);
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
            {otherIsTyping ? (
              <span className="status-text typing" style={{ color: 'var(--accent-rose)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                typing<span className="typing-dots-animation">...</span>
              </span>
            ) : (
              <span className={`status-text ${online ? 'online' : ''}`}>
                {online ? 'online' : formatLastSeen(otherUserProfile?.last_seen_at)}
                {otherUserProfile?.username && ` • @${otherUserProfile.username}`}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search Toggle Button */}
          <button
            type="button"
            className="btn ghost small header-search-btn"
            onClick={() => {
              setShowSearch((v) => !v);
              setSearchQuery('');
              setSearchMatches([]);
              setCurrentMatchIndex(-1);
            }}
            title="Search messages"
            style={{ padding: '6px 10px', fontSize: '13px' }}
          >
            🔍 Search
          </button>

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
      </div>

      {showSearch && (
        <div className="chat-search-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'rgba(25, 20, 42, 0.95)', borderBottom: '1px solid var(--border)' }}>
          <input
            type="text"
            placeholder="Search in conversation..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="chat-search-input"
            style={{ flex: 1, padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', fontSize: '13.5px' }}
            autoFocus
          />
          {searchQuery && (
            <span className="search-results-counter" style={{ fontSize: '12px', color: 'var(--accent-rose)', fontWeight: 'bold', minWidth: '60px', textAlign: 'center' }}>
              {searchMatches.length > 0 ? `${currentMatchIndex + 1} of ${searchMatches.length}` : '0 results'}
            </span>
          )}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              disabled={searchMatches.length <= 1}
              onClick={handlePrevMatch}
              className="btn ghost small"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              ▲ Prev
            </button>
            <button
              type="button"
              disabled={searchMatches.length <= 1}
              onClick={handleNextMatch}
              className="btn ghost small"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              ▼ Next
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
                setSearchMatches([]);
                setCurrentMatchIndex(-1);
              }}
              className="btn ghost small"
              style={{ padding: '6px 12px', fontSize: '12px', color: '#ff5e7e', borderColor: 'rgba(255, 94, 126, 0.2)' }}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

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
            <div key={item.key} className={`message-row ${isMine ? 'mine' : 'theirs'}`} id={`msg-${m.id}`}>
              <div className="bubble-wrapper">
                <div className={`bubble ${isMine ? 'mine' : 'theirs'} ${m.media_url ? 'media-bubble' : ''}`}>
                  <span className="msg-body">
                    {/* Media Renderers */}
                    {m.media_url && (
                      <div className="media-bubble-content">
                        {m.media_type === 'image' && (
                          <div className="media-bubble-image-container" onClick={() => setLightboxUrl(m.media_url)}>
                            <img src={m.media_url} className="media-bubble-image" alt={m.media_name || 'Shared image'} />
                          </div>
                        )}
                        {m.media_type === 'video' && (
                          <div className="media-bubble-video-container">
                            <video src={m.media_url} controls className="media-bubble-video" preload="metadata" />
                          </div>
                        )}
                        {m.media_type === 'file' && (
                          <div className="media-bubble-file-container">
                            <div className="file-info-row">
                              <span className="file-icon">📄</span>
                              <div className="file-details">
                                <span className="file-name" title={m.media_name}>{m.media_name}</span>
                                <span className="file-size">{formatBytes(m.media_size)}</span>
                              </div>
                            </div>
                            <a href={m.media_url} target="_blank" rel="noopener noreferrer" className="file-download-link" download>
                              Download
                            </a>
                          </div>
                        )}
                        {m.media_type === 'audio' && (
                          <VoiceNotePlayer url={m.media_url} duration={m.media_duration} />
                        )}
                      </div>
                    )}

                    {(!m.media_url || m.media_type === 'image' || m.media_type === 'video') && (
                      <span className="msg-text">{highlightText(m.content, searchQuery, searchMatches[currentMatchIndex], m.id)}</span>
                    )}

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

        {/* Dynamic uploading files queue */}
        {uploadingFiles.map((up) => (
          <div key={up.id} className="message-row mine uploading-temp-row">
            <div className="bubble mine uploading-bubble">
              <div className="uploading-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span className="uploading-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Sending {up.type}: {up.name}
                </span>
                {up.error ? (
                  <button type="button" className="btn primary small retry-upload-btn" onClick={() => handleFileUpload(up.file, up.type)} style={{ padding: '4px 8px', fontSize: '10.5px' }}>
                    🔄 Retry
                  </button>
                ) : (
                  <span className="upload-percentage" style={{ fontSize: '11px', color: 'var(--accent-rose)', fontWeight: 'bold' }}>
                    {up.progress}%
                  </span>
                )}
              </div>
              {!up.error && (
                <div className="upload-progress-bar-bg" style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div className="upload-progress-bar-fg" style={{ height: '100%', background: 'var(--gradient-primary)', width: `${up.progress}%`, transition: 'width 0.2s ease' }} />
                </div>
              )}
            </div>
          </div>
        ))}

        {messages.length === 0 && !clearedAt && (
          <div className="no-messages">
            <p>No messages yet. Say hi! 👋</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Lightbox Image Preview Modal */}
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <button type="button" className="lightbox-close" onClick={() => setLightboxUrl(null)}>&times;</button>
          <img src={lightboxUrl} className="lightbox-image" alt="Full screen preview" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

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
        isRecording ? (
          <div className="chat-input voice-recording-toolbar" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '12px', padding: '10px 16px', background: 'var(--header-bg)', borderTop: '1px solid var(--border)' }}>
            <div className="pulsing-recording-dot" style={{ width: '8px', height: '8px', background: '#ff5e7e', borderRadius: '50%', animation: 'pulse 1.2s infinite' }} />
            <span className="recording-timer" style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#ff5e7e', minWidth: '40px' }}>
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
            <canvas
              ref={canvasRef}
              width="220"
              height="34"
              className="vn-recording-canvas"
              style={{ flex: 1, height: '34px', borderRadius: '8px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.06)' }}
            />
            <button type="button" className="btn ghost small vn-cancel-btn" onClick={() => stopVoiceRecording(true)} style={{ color: '#ff5e7e', borderColor: 'rgba(255,94,126,0.15)', padding: '6px 12px', fontSize: '12px' }}>
              Cancel
            </button>
            <button type="button" className="btn primary small vn-send-btn" onClick={() => stopVoiceRecording(false)} style={{ padding: '6px 14px', fontSize: '12px' }}>
              Send
            </button>
          </div>
        ) : (
          <form className="chat-input" onSubmit={sendMessage}>
            <button
              type="button"
              className="emoji-toggle-btn"
              onClick={() => setShowEmoji((v) => !v)}
              title="Emoji"
            >
              😊
            </button>
            
            <div className="attachment-wrap">
              <button
                type="button"
                className="attachment-btn"
                onClick={() => setShowAttachmentMenu((v) => !v)}
                title="Attach file"
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
              >
                📎
              </button>
              {showAttachmentMenu && (
                <div className="attachment-menu" ref={attachmentMenuRef}>
                  <label className="attachment-item">
                    <span>📸 Photo / Video</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                        setShowAttachmentMenu(false);
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <label className="attachment-item">
                    <span>📄 Document / File</span>
                    <input
                      type="file"
                      accept="*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                        setShowAttachmentMenu(false);
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button
                    type="button"
                    className="attachment-item"
                    onClick={() => {
                      startVoiceRecording();
                      setShowAttachmentMenu(false);
                    }}
                  >
                    🎤 Voice Note
                  </button>
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder={`Message ${otherUserProfile?.display_name || otherUserProfile?.username || 'user'}…`}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                sendTypingStatus(true);
              }}
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
        )
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
