
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Meeting } from '../types';
import { getMeetings, removeMeeting } from '../api';
import MeetingChat from './MeetingChat';
import MeetingCountdown from './MeetingCountdown';
import MeetingRoom from './MeetingRoom';
import { socket } from '../realtime';

interface MeetingListProps {
  onMeetingRemoved?: () => void;
}

const MeetingList: React.FC<MeetingListProps> = ({ onMeetingRemoved }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [openMeeting, setOpenMeeting] = useState<any | null>(null);
  const { user } = useAuth();

  const fetchMeetings = () => {
    getMeetings().then(setMeetings);
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    const handleMeetingEnd = (payload: { meetingId: string }) => {
      if (!payload?.meetingId) return;
      setOpenMeeting(prev => (prev?.id === payload.meetingId ? null : prev));
    };
    socket.on('meeting:end', handleMeetingEnd);
    const handleMeetingRemoved = (payload: { meetingId: string }) => {
      if (!payload?.meetingId) return;
      // refresh meetings list and close open meeting if it was removed
      fetchMeetings();
      setOpenMeeting(prev => (prev?.id === payload.meetingId ? null : prev));
    };
    socket.on('meeting:removed', handleMeetingRemoved);
    return () => {
      socket.off('meeting:end', handleMeetingEnd);
      socket.off('meeting:removed', handleMeetingRemoved);
    };
  }, []);

  const handleRemove = async (meetingId: string) => {
    setRemoving(meetingId);
    try {
      await removeMeeting(meetingId);
      fetchMeetings();
      if (onMeetingRemoved) onMeetingRemoved();
    } catch (err) {
      alert('Failed to remove meeting');
    } finally {
      setRemoving(null);
    }
  };
  return (
    <React.Fragment>
      <div style={{ width: '100%' }}>
        <h2 style={{ color: '#ffe066', marginBottom: 20, fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>Meetings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {meetings.length === 0 && (
            <div style={{ color: '#ffe06699', textAlign: 'center', fontStyle: 'italic', padding: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>No meetings scheduled yet.</div>
          )}
          {meetings.map(meeting => (
            <div key={meeting.id} style={{
              background: 'linear-gradient(120deg, #23241a 80%, #ffe06622 100%)',
              border: '1.5px solid #ffe06644',
              boxShadow: '0 2px 10px #0003',
              borderRadius: 12,
              padding: 20,
              color: '#ffe066',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              position: 'relative',
            }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 2, display: 'flex', alignItems: 'center' }}>
                Agenda: <span style={{ fontWeight: 400, marginLeft: 4 }}>{meeting.agenda}</span>
                <MeetingCountdown date={meeting.date} time={meeting.time} agenda={meeting.agenda} />
              </div>
              <div style={{ fontSize: 14, color: '#ffe066bb', marginBottom: 2 }}>
                <span style={{ marginRight: 10 }}>
                  <span style={{ fontWeight: 600 }}>Date:</span> {meeting.date || '-'}
                </span>
                <span>
                  <span style={{ fontWeight: 600 }}>Time:</span> {meeting.time || '-'}
                </span>
              </div>
              <div style={{ fontSize: 15, marginBottom: 2 }}>Notes: <span style={{ color: '#ffe066cc' }}>{meeting.notes}</span></div>
              <div style={{ fontSize: 15 }}>Action Items: <span style={{ color: '#ffe066cc' }}>{meeting.actionItems.join(', ')}</span></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'flex-end' }}>
                <button
                  style={{
                    background: '#ffe066',
                    color: '#23241a',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 18px',
                    fontWeight: 700,
                    fontSize: 15,
                    boxShadow: '0 1px 4px #0004',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onClick={() => setOpenMeeting(meeting)}
                >Join</button>
                {user?.role === 'admin' && (
                  <button onClick={() => handleRemove(meeting.id)} disabled={removing === meeting.id} style={{
                    background: '#c00',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 18px',
                    fontWeight: 700,
                    fontSize: 15,
                    boxShadow: '0 1px 4px #0004',
                    cursor: 'pointer',
                    opacity: removing === meeting.id ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Modal must be sibling, so wrap in fragment */}
      {openMeeting && (
        <MeetingRoom meeting={openMeeting} onClose={() => setOpenMeeting(null)} />
      )}
    </React.Fragment>
  );
}

export default MeetingList;
