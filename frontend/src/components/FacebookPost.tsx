import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const FacebookPost: React.FC = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== 'admin') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/facebook/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, imageUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || JSON.stringify(data));
      // show backend/Facebook response details for debugging (post id, errors)
      setResult(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Post to Facebook (Stub)</h2>
      <input
        type="text"
        placeholder="Message"
        value={message}
        onChange={e => setMessage(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Image URL (optional)"
        value={imageUrl}
        onChange={e => setImageUrl(e.target.value)}
      />
      <button type="submit" disabled={loading}>Post</button>
      {result && <div style={{ color: 'green' }}>{result}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
};

export default FacebookPost;
