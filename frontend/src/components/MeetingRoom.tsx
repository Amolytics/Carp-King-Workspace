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
    <div className="meeting-room-overlay" style={{ background: 'rgba(30,32,24,0.98)', minHeight: '100vh', padding: 0 }}>
      <div
        className="meeting-room-modal"
        style={{
          maxWidth: 900,
          margin: 'auto',
          borderRadius: 12,
          boxShadow: '0 2px 16px #000a',
          background: '#23241a',
          display: 'flex',
          flexDirection: window.innerWidth <= 700 ? 'column' : 'row',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Left: Info & Notes */}
        <div
          className="meeting-room-side"
          style={{
            flex: 1,
            background: '#23241a',
            padding: window.innerWidth <= 700 ? 8 : 16,
            display: 'flex',
            flexDirection: 'column',
            gap: window.innerWidth <= 700 ? 6 : 12,
            borderRight: window.innerWidth <= 700 ? 'none' : '1px solid #ffe06622',
            borderBottom: window.innerWidth <= 700 ? '1px solid #ffe06622' : 'none',
            minWidth: 0,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ffe066', marginBottom: 4, letterSpacing: 0.5 }}>Agenda</div>
            <div style={{ fontSize: 15, color: '#ffe066cc', fontWeight: 500 }}>{meeting.agenda}</div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ffe066', marginBottom: 2 }}>Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', minHeight: 60, borderRadius: 6, background: '#181910', color: '#ffe066', border: '1px solid #ffe06655', fontSize: 14, padding: 7, resize: 'vertical' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ffe066', marginBottom: 2 }}>Action Items</div>
            <textarea value={actions} onChange={e => setActions(e.target.value)} style={{ width: '100%', minHeight: 40, borderRadius: 6, background: '#181910', color: '#ffe066', border: '1px solid #ffe06655', fontSize: 14, padding: 7, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <button onClick={handleDownloadChat} className="btn" style={{ background: '#ffe066', color: '#23241a', fontWeight: 700, borderRadius: 6, padding: '6px 12px', border: 'none', boxShadow: '0 1px 4px #0002' }}>Download Chat</button>
            {user?.role === 'admin' && (
              <>
                <button onClick={handleLockUnlockChat} className={`btn ${chatLocked ? 'btn-danger' : ''}`} style={{ borderRadius: 6, padding: '6px 12px' }}>{chatLocked ? 'Unlock Chat' : 'Lock Chat'}</button>
                <button onClick={handleArchive} className={`btn ${archived ? 'btn-secondary' : ''}`} style={{ borderRadius: 6, padding: '6px 12px' }} disabled={archived}>Archive</button>
                <button onClick={() => { socket.emit('meeting:end', { meetingId: meeting.id }); onClose(); }} className="btn btn-danger" style={{ borderRadius: 6, padding: '6px 12px' }}>End Meeting</button>
              </>
            )}
          </div>
        </div>
        {/* Right: Chat */}
        <div className="meeting-room-chat" style={{ flex: 2, background: '#181910', padding: 16, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div className="meeting-room-title" style={{ fontSize: 20, fontWeight: 700, color: '#ffe066', marginBottom: 8, letterSpacing: 0.5 }}>Meeting Chat</div>
          <div ref={chatRef} className="meeting-room-chatbox" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'transparent', padding: 0, margin: 0, border: 'none' }}>
            <MeetingChat meeting={meeting} isLocked={chatLocked} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
