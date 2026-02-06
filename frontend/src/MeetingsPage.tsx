
import React, { useState } from 'react';
import MeetingPlanner from './components/MeetingPlanner';
import MeetingList from './components/MeetingList';

const MeetingsPage: React.FC = () => {
  const [refresh, setRefresh] = useState(0);
  const handleMeetingCreated = () => setRefresh(r => r + 1);
  const handleMeetingRemoved = () => setRefresh(r => r + 1);
  return (
    <div className="meetings-layout">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
        <div className="panel panel-compact meeting-planner-panel" style={{ width: '100%', marginBottom: 12 }}>
          <MeetingPlanner onMeetingCreated={handleMeetingCreated} />
        </div>
      </div>
      <div className="panel" style={{ width: '100%' }}>
        <MeetingList key={refresh} onMeetingRemoved={handleMeetingRemoved} />
      </div>
    </div>
  );
};

export default MeetingsPage;
