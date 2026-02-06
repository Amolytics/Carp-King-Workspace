import React, { useState } from 'react';

interface MeetingAlertProps {
  message: string;
  onClose: () => void;
}


const MeetingAlert: React.FC<MeetingAlertProps> = ({ message, onClose }) => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(30,32,24,0.85)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ background: '#ffe066', color: '#23241a', padding: 32, borderRadius: 16, boxShadow: '0 2px 16px #0006', fontSize: 22, fontWeight: 700, minWidth: 320, textAlign: 'center' }}>
        {message}
        <div>
          <button onClick={() => { setVisible(false); onClose(); }} style={{ marginTop: 18, background: '#23241a', color: '#ffe066', fontWeight: 700, fontSize: 18, borderRadius: 8, padding: '10px 28px', border: 'none', boxShadow: '0 1px 4px #0004', cursor: 'pointer' }}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default MeetingAlert;
