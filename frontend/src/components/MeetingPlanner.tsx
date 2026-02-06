import React, { useState } from 'react';
import { addMeeting } from '../api';
import { useAuth } from './AuthContext';

interface MeetingPlannerProps {
  onMeetingCreated?: () => void;
}

const MeetingPlanner: React.FC<MeetingPlannerProps> = ({ onMeetingCreated }) => {
  const { user } = useAuth();
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');
  const [actionItems, setActionItems] = useState<string>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await addMeeting({
        agenda,
        notes,
        actionItems: actionItems.split(',').map(s => s.trim()),
        date,
        time,
      } as any);
      setMessage('Meeting created!');
      setAgenda('');
      setNotes('');
      setActionItems('');
      setDate('');
      setTime('');
      if (onMeetingCreated) onMeetingCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) return null;

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 10,
      padding: 10,
      boxShadow: '0 1px 6px #0002',
      color: '#ffe066',
      width: '100%',
      maxWidth: '100%',
    }}>
      <h2 style={{ color: '#ffe066', marginBottom: 4, fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>New Meeting</h2>
      <input
        type="text"
        placeholder="Agenda"
        value={agenda}
        onChange={e => setAgenda(e.target.value)}
        required
        style={{
          padding: '6px 8px',
          borderRadius: 6,
          border: '1.5px solid #ffe06655',
          background: '#23241a',
          color: '#ffe066',
          fontSize: 14,
          marginBottom: 2,
        }}
      />
      <input
        type="text"
        placeholder="Notes"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        style={{
          padding: '6px 8px',
          borderRadius: 6,
          border: '1.5px solid #ffe06655',
          background: '#23241a',
          color: '#ffe066',
          fontSize: 14,
          marginBottom: 2,
        }}
      />
      <input
        type="text"
        placeholder="Action items (comma separated)"
        value={actionItems}
        onChange={e => setActionItems(e.target.value)}
        style={{
          padding: '6px 8px',
          borderRadius: 6,
          border: '1.5px solid #ffe06655',
          background: '#23241a',
          color: '#ffe066',
          fontSize: 14,
          marginBottom: 2,
        }}
      />
      <input
        type="date"
        placeholder="Date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
        style={{
          padding: '6px 8px',
          borderRadius: 6,
          border: '1.5px solid #ffe06655',
          background: '#23241a',
          color: '#ffe066',
          fontSize: 14,
          marginBottom: 2,
        }}
      />
      <input
        type="time"
        placeholder="Time"
        value={time}
        onChange={e => setTime(e.target.value)}
        required
        style={{
          padding: '6px 8px',
          borderRadius: 6,
          border: '1.5px solid #ffe06655',
          background: '#23241a',
          color: '#ffe066',
          fontSize: 14,
          marginBottom: 2,
        }}
      />
      <button type="submit" disabled={loading} style={{
        background: '#ffe066',
        color: '#23241a',
        fontWeight: 700,
        fontSize: 15,
        borderRadius: 8,
        padding: '8px 18px',
        border: 'none',
        boxShadow: '0 1px 4px #0004',
        cursor: 'pointer',
        marginTop: 6,
        opacity: loading ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}>Create</button>
      {message && <div style={{ color: '#7fff7f', fontWeight: 600, fontSize: 13 }}>{message}</div>}
      {error && <div style={{ color: '#ff7f7f', fontWeight: 600, fontSize: 13 }}>{error}</div>}
    </form>
  );
};

export default MeetingPlanner;
