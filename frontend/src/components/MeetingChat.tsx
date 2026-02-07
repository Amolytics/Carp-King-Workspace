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
    // allow admins to type even when locked
    if (isLocked && user?.role !== 'admin') return;
    setText(e.target.value);
    if (user) {
      socket.emit('global:typing', { user: user.name, isTyping: !!e.target.value });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // only allow send when not locked, or if user is admin
    if (!user || (isLocked && user.role !== 'admin')) return;
    setLoading(true);
    setError(null);
    try {
      const comment = await addMeetingChat(meeting.id, user.id, text);
      setChat(prev => (prev.some(c => c.id === comment.id) ? prev : [...prev, comment]));
      setText('');
      socket.emit('global:typing', { user: user.name, isTyping: false });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', margin: 8, padding: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0 }}>Meeting Chat</h4>
        {user?.role === 'admin' && (
          <button
            onClick={() => setChat([])}
            style={{ background: '#ffe066', color: '#23241a', fontWeight: 700, fontSize: 13, borderRadius: 6, padding: '4px 14px', border: 'none', boxShadow: '0 1px 4px #0002', cursor: 'pointer', marginLeft: 12 }}
          >
            Clear Chat
          </button>
        )}
      </div>
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ color: '#ffd54f', fontSize: 14, marginBottom: 4 }}>
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
      <div style={{
        height: 220,
        overflowY: 'auto',
        background: '#23241a',
        borderRadius: 8,
        padding: 8,
        margin: '12px 0',
        border: '1.5px solid #ffe06633',
      }}>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {chat.map(c => (
            <li key={c.id} style={{ marginBottom: 8 }}><b>{c.userId}</b>: {c.text} <span style={{ fontSize: 10, color: '#888' }}>{c.createdAt}</span></li>
          ))}
        </ul>
      </div>
      {user && (
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', width: '100%', marginTop: 8 }}
        >
          <input
            type="text"
            value={text}
            onChange={handleTyping}
            placeholder={isLocked ? (user?.role === 'admin' ? 'Add a message (admin override)' : 'Chat is locked') : 'Add a message'}
            required
            disabled={isLocked && user?.role !== 'admin'}
            style={{
              flex: 1,
              fontSize: 15,
              borderRadius: 6,
              border: '1.5px solid #ffe06655',
              padding: '8px 12px',
              marginRight: 8,
              background: isLocked && user?.role !== 'admin' ? '#2b2b2b' : '#fffbe6',
              color: '#23241a',
              outline: 'none',
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
            disabled={loading || (isLocked && user?.role !== 'admin')}
            style={{
              background: '#ffe066',
              color: '#23241a',
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 6,
              padding: '8px 18px',
              border: 'none',
              boxShadow: '0 1px 4px #0002',
              cursor: isLocked && user?.role !== 'admin' ? 'not-allowed' : 'pointer',
              opacity: isLocked && user?.role !== 'admin' ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </form>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default MeetingChat;
