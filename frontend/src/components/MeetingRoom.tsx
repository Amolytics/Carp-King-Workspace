import React, { useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { socket } from '../realtime';
import MeetingChat from './MeetingChat';

interface MeetingRoomProps {
  meeting: {
    id: string;
    agenda: string;
    notes: string;
    actionItems: string[];
    chat: any[];
    date: string;
    time: string;
  };
  onClose: () => void;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ meeting, onClose }) => {
  const [notes, setNotes] = useState(meeting.notes || '');
  const [actions, setActions] = useState(meeting.actionItems.join(', '));
  const [showNotes, setShowNotes] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [chatLocked, setChatLocked] = useState(false);
  const [archived, setArchived] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const handleLockUnlockChat = () => {
    setChatLocked(l => !l);
  };
  const handleArchive = () => {
    setArchived(true);
    alert('Meeting archived (not implemented)');
  };

  const handleDownloadChat = () => {
    // For demo: just grab chat text from MeetingChat (could be improved)
    const chatText = chatRef.current?.innerText || 'No chat available.';
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting_chat_${meeting.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="meeting-room-overlay">
      <div className="meeting-room-modal">
        {/* Chat Section */}
        <div className="meeting-room-chat">
          <div className="meeting-room-title">{meeting.agenda}</div>
          <div ref={chatRef} className="meeting-room-chatbox">
            <MeetingChat meeting={meeting} isLocked={chatLocked} />
          </div>
        </div>
        {/* Notes/Actions Section */}
        <div className="meeting-room-side">
          {/* Notes/Actions Section */}
          <div>
            <div className="meeting-room-section-title" onClick={() => setShowNotes(v => !v)}>
              Notes {showNotes ? '▲' : '▼'}
            </div>
            {showNotes && (
              <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', minHeight: 80, borderRadius: 8, background: '#23241a', color: '#ffe066', border: '1.5px solid #ffe06655', fontSize: 15, padding: 10 }} />
            )}
          </div>
          <div>
            <div className="meeting-room-section-title" onClick={() => setShowActions(v => !v)}>
              Action Items {showActions ? '▲' : '▼'}
            </div>
            {showActions && (
              <textarea value={actions} onChange={e => setActions(e.target.value)} style={{ width: '100%', minHeight: 60, borderRadius: 8, background: '#23241a', color: '#ffe066', border: '1.5px solid #ffe06655', fontSize: 15, padding: 10 }} />
            )}
          </div>
          <button onClick={handleDownloadChat} className="btn" style={{ marginTop: 8, marginBottom: 8 }}>Download Meeting Chat</button>
          {user?.role === 'admin' && (
            <div className="meeting-room-actions">
              <button onClick={handleLockUnlockChat} className={`btn ${chatLocked ? 'btn-danger' : ''}`}>{chatLocked ? 'Unlock Chat' : 'Lock Chat'}</button>
              <button onClick={handleArchive} className={`btn ${archived ? 'btn-secondary' : ''}`} disabled={archived}>Archive</button>
            </div>
          )}
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                socket.emit('meeting:end', { meetingId: meeting.id });
                onClose();
              }}
              className="btn btn-danger"
              style={{ marginTop: 8 }}
            >
              End Meeting
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
