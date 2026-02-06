
import React, { useState } from 'react';
import MeetingPlanner from './components/MeetingPlanner';
import MeetingList from './components/MeetingList';
import AdminButton from './components/AdminButton';

const MeetingsPage: React.FC = () => {
  const [refresh, setRefresh] = useState(0);
  const handleMeetingCreated = () => setRefresh(r => r + 1);
  const handleMeetingRemoved = () => setRefresh(r => r + 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-start', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AdminButton />
        <div style={{ width: '100%', maxWidth: 280, background: 'rgba(30,32,24,0.97)', padding: 10, borderRadius: 12, boxShadow: '0 2px 12px #0004', marginBottom: 12 }}>
          <MeetingPlanner onMeetingCreated={handleMeetingCreated} />
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 640, background: 'rgba(30,32,24,0.97)', padding: 24, borderRadius: 12, boxShadow: '0 2px 12px #0004' }}>
        <MeetingList key={refresh} onMeetingRemoved={handleMeetingRemoved} />
      </div>
    </div>
  );
};

export default MeetingsPage;
