import React, { useState } from 'react';
import { addSlot } from '../api';
import { useAuth } from './AuthContext';

const SlotPlanner: React.FC = () => {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState('');
  const [abEnabled, setAbEnabled] = useState(false);
  const [abOffset, setAbOffset] = useState(10);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const slot = await addSlot({
        imageUrl,
        abTiming: abEnabled ? { enabled: true, offsetMinutes: abOffset } : undefined,
      } as any);
      setMessage('Slot created!');
      setImageUrl('');
      setAbEnabled(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) return null;

  return (
    <form onSubmit={handleSubmit}>
      <h2>Slot Planner</h2>
      <input
        type="text"
        placeholder="Image URL (upload first)"
        value={imageUrl}
        onChange={e => setImageUrl(e.target.value)}
        required
      />
      <label>
        <input
          type="checkbox"
          checked={abEnabled}
          onChange={e => setAbEnabled(e.target.checked)}
        />
        Enable A/B Timing
      </label>
      {abEnabled && (
        <input
          type="number"
          min={1}
          max={120}
          value={abOffset}
          onChange={e => setAbOffset(Number(e.target.value))}
          placeholder="Offset minutes for B"
        />
      )}
      <button type="submit" disabled={loading}>Create Slot</button>
      {message && <div style={{ color: 'green' }}>{message}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
};

export default SlotPlanner;
