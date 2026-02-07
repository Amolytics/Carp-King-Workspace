import React, { useState, useEffect } from 'react';
import { Meeting, Comment } from '../types';
import { addMeetingChat } from '../api';
import { useAuth } from './AuthContext';
import { socket } from '../realtime';

const MeetingChat: React.FC<{ meeting: Meeting; isLocked?: boolean }> = ({ meeting, isLocked = false }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [chat, setChat] = useState<Comment[]>(meeting.chat);
    useEffect(() => {
      const handleMessage = ({ meetingId, comment }: { meetingId: string; comment: Comment }) => {
        if (meetingId !== meeting.id) return;
        setChat(prev => (prev.some(c => c.id === comment.id) ? prev : [...prev, comment]));
      };
      socket.on('meeting:chat', handleMessage);
      // Typing indicator
      const handleTypingUpdate = (names: string[]) => {
        setTypingUsers(names.filter(n => n !== user?.name));
      };
      socket.on('global:typing:update', handleTypingUpdate);
      return () => {
        socket.off('meeting:chat', handleMessage);
        socket.off('global:typing:update', handleTypingUpdate);
      };
    }, [meeting.id, user]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (user) {
      socket.emit('global:typing', { user: user.name, isTyping: !!e.target.value });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isLocked) return;
    setLoading(true);
    setError(null);
      <div
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          background: 'transparent',
          borderRadius: 0,
          padding: window.innerWidth <= 700 ? 0 : 1,
          margin: 0,
          border: 'none',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
          flex: 1,
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          background: 'transparent',
          borderRadius: 0,
          padding: window.innerWidth <= 700 ? 0 : 0,
          margin: 0,
          border: 'none',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {chat.length === 0 && (
          <div style={{ color: '#ffe06699', textAlign: 'center', fontStyle: 'italic', marginTop: 32 }}>No messages yet.</div>
        )}
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {chat.map((c, i) => (
            <li
              key={c.id}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                marginBottom: window.innerWidth <= 700 ? 4 : 6,
                width: '100%',
              }}
            >
              <div
                style={{
                  background: c.userId === user?.id ? '#ffe066' : '#23241a',
                  color: c.userId === user?.id ? '#23241a' : '#ffe066',
                  borderRadius: 8,
                  padding: window.innerWidth <= 700 ? '6px 8px' : '7px 11px',
                  maxWidth: window.innerWidth <= 700 ? '90%' : 'calc(70% - 1px)',
                  minWidth: 24,
                  fontSize: 13,
                  fontWeight: 500,
                  boxShadow: c.userId === user?.id ? '0 1px 4px #ffe06633' : '0 1px 4px #0002',
                  marginLeft: c.userId === user?.id ? 'auto' : 0,
                  marginRight: c.userId === user?.id ? 0 : 'auto',
                  wordBreak: 'break-word',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: c.userId === user?.id ? 'flex-end' : 'flex-start',
                  boxSizing: 'border-box',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 11, opacity: 0.85 }}>{c.userId}</span>
                <span>{c.text}</span>
                <span style={{ fontSize: 9, color: c.userId === user?.id ? '#7a6c1a' : '#ffe06699', marginTop: 1, alignSelf: 'flex-end' }}>{c.createdAt}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ color: '#ffd54f', fontSize: 14, margin: '4px 0 0 0', padding: 0 }}>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</div>
      )}
      {/* Controls */}
      {user && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            width: '100%',
            margin: window.innerWidth <= 700 ? '4px 0 0 0' : '6px 0 0 0',
            padding: 0,
            gap: window.innerWidth <= 700 ? 4 : 6,
          }}
        >
          <input
            type="text"
            value={text}
            onChange={handleTyping}
            placeholder={isLocked ? 'Chat is locked' : 'Add a message'}
            required
            disabled={isLocked}
            style={{
              flex: 1,
              fontSize: window.innerWidth <= 700 ? 12 : 14,
              borderRadius: 5,
              border: '1px solid #ffe06655',
              padding: window.innerWidth <= 700 ? '6px 7px' : '7px 10px',
              background: isLocked ? '#2b2b2b' : '#fffbe6',
              color: isLocked ? '#aaa' : '#23241a',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={loading || isLocked}
            style={{
              background: '#ffe066',
              color: '#23241a',
              fontWeight: 700,
              fontSize: window.innerWidth <= 700 ? 12 : 14,
              borderRadius: 5,
              padding: window.innerWidth <= 700 ? '6px 8px' : '7px 12px',
              border: 'none',
              boxShadow: '0 1px 4px #0002',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.6 : 1,
              width: 'auto',
              minWidth: window.innerWidth <= 700 ? 36 : 48,
            }}
          >
            Send
          </button>
        </form>
      )}
      {user?.role === 'admin' && (
        <button
          onClick={() => setChat([])}
          style={{ background: '#ffe066', color: '#23241a', fontWeight: 700, fontSize: 13, borderRadius: 8, padding: '4px 14px', border: 'none', boxShadow: '0 1px 4px #0002', cursor: 'pointer', margin: '10px 0 0 auto', display: 'block' }}
        >
          Clear Chat
        </button>
      )}
      {error && <div style={{ color: 'red', margin: 0, padding: 0 }}>{error}</div>}
    </div>
  );
};

export default MeetingChat;
