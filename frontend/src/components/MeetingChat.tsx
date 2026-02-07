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
    <div style={{ width: '100%', height: '100%', margin: 0, padding: 0, border: 'none', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', margin: 0, padding: 0 }}>
        <h4 style={{ margin: 0, padding: 0 }}>Meeting Chat</h4>
        {user?.role === 'admin' && (
          <button
            onClick={() => setChat([])}
            style={{ background: '#ffe066', color: '#23241a', fontWeight: 700, fontSize: 13, borderRadius: 6, padding: '4px 10px', border: 'none', boxShadow: '0 1px 4px #0002', cursor: 'pointer', marginLeft: 8 }}
          >
            Clear Chat
          </button>
        )}
      </div>
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ color: '#ffd54f', fontSize: 14, margin: 0, padding: 0 }}>
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
      <div style={{ flex: 1, width: '100%', height: '100%', overflowY: 'auto', background: '#23241a', borderRadius: 0, padding: 0, margin: 0, border: 'none', boxSizing: 'border-box' }}>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', width: '100%' }}>
          {chat.map(c => (
            <li key={c.id} style={{ marginBottom: 8, wordBreak: 'break-word' }}><b>{c.userId}</b>: {c.text} <span style={{ fontSize: 10, color: '#888' }}>{c.createdAt}</span></li>
          ))}
        </ul>
      </div>
      {user && (
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', width: '100%', margin: 0, padding: 0 }}
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
              fontSize: 15,
              borderRadius: 0,
              border: '1.5px solid #ffe06655',
              padding: '8px 8px',
              marginRight: 4,
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
              fontSize: 15,
              borderRadius: 0,
              padding: '8px 10px',
              border: 'none',
              boxShadow: '0 1px 4px #0002',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.6 : 1,
              width: 'auto',
              minWidth: 60,
            }}
          >
            Send
          </button>
        </form>
      )}
      {error && <div style={{ color: 'red', margin: 0, padding: 0 }}>{error}</div>}
    </div>
  );
};

export default MeetingChat;
