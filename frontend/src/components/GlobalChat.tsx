import React, { useState, useEffect, useRef } from 'react';
// Simple color palette for user names
const USER_COLORS = [
  '#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#4dd0e1', '#ffb74d', '#a1887f', '#90a4ae', '#f06292',
  '#9575cd', '#4caf50', '#fbc02d', '#dce775', '#ff8a65', '#7986cb', '#00bcd4', '#cddc39', '#ff7043', '#bdbdbd'
];

// Assign a color to a username deterministically
function getUserColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}
import { useAuth } from './AuthContext';
import { addGlobalChat, getGlobalChat } from '../api';
import { GlobalChatMessage } from '../types';
import { socket } from '../realtime';

type Message = GlobalChatMessage;

const GlobalChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    getGlobalChat().then(setMessages).catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    const handleMessage = (message: Message) => {
      setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [...prev, message]));
    };
    socket.on('global:message', handleMessage);
    return () => {
      socket.off('global:message', handleMessage);
    };
  }, []);

  // Listen for online users
  useEffect(() => {
    const handlePresence = (users: any[]) => {
      setOnlineUsers(users.map(u => u.name));
    };
    socket.on('presence:update', handlePresence);
    // Join presence on mount
    if (user) {
      socket.emit('presence:join', { id: user.id, name: user.name, role: user.role });
    }
    return () => {
      socket.off('presence:update', handlePresence);
      if (user) {
        socket.emit('presence:leave');
      }
    };
  }, [user]);

  // Listen for typing updates
  useEffect(() => {
    const handleTypingUpdate = (names: string[]) => {
      setTypingUsers(names.filter(n => n !== user?.name));
    };
    socket.on('global:typing:update', handleTypingUpdate);
    return () => {
      socket.off('global:typing:update', handleTypingUpdate);
    };
  }, [user]);

  // Emit typing events
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (user) {
      socket.emit('global:typing', { user: user.name, isTyping: !!e.target.value });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    try {
      const msg = await addGlobalChat(user.name, text.trim());
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
      setText('');
      // Stop typing
      socket.emit('global:typing', { user: user.name, isTyping: false });
    } catch {
      // Ignore send errors for now
    }
  };

  return (
    <div className="global-chat">
      <h1 className="global-chat-title">Global Team Chat</h1>
      {/* Online users display */}
      <div style={{ marginBottom: 8, color: '#ffe066', fontSize: 15 }}>
        <b>Online:</b> {onlineUsers.length > 0 ? onlineUsers.join(', ') : 'None'}
      </div>
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ color: '#ffd54f', fontSize: 14, marginBottom: 4 }}>
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
      <div className="global-chat-body">
        {messages.map(m => (
          <div key={m.id}>
            <b style={{ color: getUserColor(m.user) }}>{m.user}:</b>
            <span style={{ color: '#fff', marginLeft: 4 }}>{m.text}</span>
            <span style={{ fontSize: 10, color: '#888', marginLeft: 8 }}>{m.createdAt}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {user && (
        <form
          onSubmit={sendMessage}
          style={{
            display: 'flex',
            width: '100%',
            background: 'rgba(255,251,230,0.98)',
            padding: '6px 8px 6px 8px',
            borderTop: '1.5px solid #ffe06655',
            boxSizing: 'border-box',
          }}
        >
          <input
            type="text"
            value={text}
            onChange={handleTyping}
            placeholder="Type a message"
            required
            style={{
              flex: 1,
              fontSize: 15,
              borderRadius: 6,
              border: '1.5px solid #ffe06655',
              padding: '8px 12px',
              marginRight: 8,
              background: '#fffbe6',
              color: '#23241a',
              outline: 'none',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            style={{
              background: '#ffe066',
              color: '#23241a',
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 6,
              padding: '8px 18px',
              border: 'none',
              boxShadow: '0 1px 4px #0002',
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
};

export default GlobalChat;
