import React, { useState, useEffect } from 'react';
import { Slot, Comment } from '../types';
import { addComment } from '../api';
import { useAuth } from './AuthContext';
import { socket } from '../realtime';

const SlotThread: React.FC<{ slot: Slot }> = ({ slot }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [comments, setComments] = useState<Comment[]>(slot.comments);
    useEffect(() => {
      const handleComment = ({ slotId, comment }: { slotId: string; comment: Comment }) => {
        if (slotId !== slot.id) return;
        setComments(prev => (prev.some(c => c.id === comment.id) ? prev : [...prev, comment]));
      };
      socket.on('slot:comment', handleComment);
      return () => {
        socket.off('slot:comment', handleComment);
      };
    }, [slot.id]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const comment = await addComment(slot.id, user.id, text);
      setComments(prev => (prev.some(c => c.id === comment.id) ? prev : [...prev, comment]));
      setText('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', margin: 8, padding: 8 }}>
      <h4>Thread</h4>
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
            onChange={e => setText(e.target.value)}
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
