import React, { useState, useEffect } from 'react';
import { Slot, Comment } from '../types';
import { addComment } from '../api';
import { useAuth } from './AuthContext';
import { socket } from '../realtime';

const SlotThread: React.FC<{ slot: Slot }> = ({ slot }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>(slot.comments);
    useEffect(() => {
      const handleComment = ({ slotId, comment }: { slotId: string; comment: Comment }) => {
        if (slotId !== slot.id) return;
        setComments(prev => (prev.some(c => c.id === comment.id) ? prev : [...prev, comment]));
      };
      socket.on('slot:comment', handleComment);
      // Typing indicator
      const handleTypingUpdate = (names: string[]) => {
        setTypingUsers(names.filter(n => n !== user?.name));
      };
      socket.on('global:typing:update', handleTypingUpdate);
      return () => {
        socket.off('slot:comment', handleComment);
        socket.off('global:typing:update', handleTypingUpdate);
      };
    }, [slot.id, user]);
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
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const comment = await addComment(slot.id, user.id, text);
      setComments(prev => (prev.some(c => c.id === comment.id) ? prev : [...prev, comment]));
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
      <h4>Thread</h4>
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ color: '#ffd54f', fontSize: 14, marginBottom: 4 }}>
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
      <ul>
        {comments.map(c => (
          <li key={c.id}><b>{c.userId}</b>: {c.text} <span style={{ fontSize: 10, color: '#888' }}>{c.createdAt}</span></li>
        ))}
      </ul>
      {user && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={text}
            onChange={handleTyping}
            placeholder="Add a comment"
            required
          />
          <button type="submit" disabled={loading}>Post</button>
        </form>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default SlotThread;
