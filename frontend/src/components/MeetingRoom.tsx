import React, { useState, useRef } from 'react';
import { useAuth } from './AuthContext';
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

  const handleGenerateMinutes = () => {
    // TODO: Implement minutes generation
    alert('Generate Minutes (not implemented)');
  };
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
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(30,32,24,0.98)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
    }}>
      <div style={{
        width: '90vw',
        height: '80vh',
        background: 'rgba(30,32,24,1)',
        borderRadius: 18,
        boxShadow: '0 4px 32px #000a',
        display: 'flex',
        overflow: 'hidden',
        paddingTop: 8,
        paddingBottom: 8,
      }}>
        {/* Chat Section */}
        <div style={{ width: '60%', minWidth: 400, maxWidth: 800, display: 'flex', flexDirection: 'column', background: 'rgba(30,32,24,0.98)', padding: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#ffe066', marginBottom: 12, letterSpacing: 1, alignSelf: 'flex-start' }}>{meeting.agenda}</div>
          <div ref={chatRef} style={{
            background: '#181910',
            borderRadius: 10,
            padding: 18,
            marginBottom: 12,
            overflowY: 'auto',
            color: '#ffe066',
            fontSize: 16,
            width:  '100%',
            height: 420,
            minHeight: 420,
            maxHeight: 420,
            display: 'block',
            position: 'relative',
          }}>
            <MeetingChat meeting={meeting} />
          </div>
        </div>
        {/* Notes/Actions Section */}
        <div style={{ flex: 1, background: 'rgba(40,42,24,0.98)', padding: '12px 10px 12px 16px', display: 'flex', flexDirection: 'column', gap: 14, borderLeft: '2px solid #ffe06633' }}>
          {/* Notes/Actions Section */}
          <div>
            <div style={{ color: '#ffe066', fontWeight: 700, fontSize: 20, marginBottom: 6, cursor: 'pointer' }} onClick={() => setShowNotes(v => !v)}>
              Notes {showNotes ? '▲' : '▼'}
            </div>
            {showNotes && (
              <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', minHeight: 80, borderRadius: 8, background: '#23241a', color: '#ffe066', border: '1.5px solid #ffe06655', fontSize: 15, padding: 10 }} />
            )}
          </div>
          <div>
            <div style={{ color: '#ffe066', fontWeight: 700, fontSize: 20, marginBottom: 6, cursor: 'pointer' }} onClick={() => setShowActions(v => !v)}>
              Action Items {showActions ? '▲' : '▼'}
            </div>
            {showActions && (
              <textarea value={actions} onChange={e => setActions(e.target.value)} style={{ width: '100%', minHeight: 60, borderRadius: 8, background: '#23241a', color: '#ffe066', border: '1.5px solid #ffe06655', fontSize: 15, padding: 10 }} />
            )}
          </div>
          <button onClick={handleDownloadChat} style={{ background: '#ffe066', color: '#23241a', fontWeight: 700, fontSize: 16, borderRadius: 8, padding: '10px 28px', border: 'none', boxShadow: '0 1px 4px #0004', cursor: 'pointer', marginTop: 8, marginBottom: 8 }}>Download Meeting Chat</button>
          {user?.role === 'admin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              <button onClick={handleGenerateMinutes} style={{ background: '#ffe066', color: '#23241a', fontWeight: 700, fontSize: 14, borderRadius: 8, padding: '7px 18px', border: 'none', boxShadow: '0 1px 4px #0002', cursor: 'pointer' }}>Generate Minutes</button>
              <button onClick={handleLockUnlockChat} style={{ background: chatLocked ? '#c00' : '#ffe066', color: chatLocked ? '#fff' : '#23241a', fontWeight: 700, fontSize: 14, borderRadius: 8, padding: '7px 18px', border: 'none', boxShadow: '0 1px 4px #0002', cursor: 'pointer' }}>{chatLocked ? 'Unlock Chat' : 'Lock Chat'}</button>
              <button onClick={handleArchive} style={{ background: archived ? '#888' : '#ffe066', color: '#23241a', fontWeight: 700, fontSize: 14, borderRadius: 8, padding: '7px 18px', border: 'none', boxShadow: '0 1px 4px #0002', cursor: archived ? 'not-allowed' : 'pointer' }} disabled={archived}>Archive</button>
            </div>
          )}
          {user?.role === 'admin' && (
            <button onClick={onClose} style={{ marginTop: 8, background: '#c00', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 8, padding: '10px 28px', border: 'none', boxShadow: '0 1px 4px #0004', cursor: 'pointer' }}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
