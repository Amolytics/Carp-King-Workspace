import React, { useEffect, useState } from 'react';
import MeetingAlert from './MeetingAlert';

interface MeetingCountdownProps {
  date: string; // ISO date string (yyyy-mm-dd)
  time: string; // HH:mm (24h)
  agenda?: string;
}

const getMeetingTimestamp = (date: string, time: string) => {
  if (!date || !time) return null;
  // Combine date and time into a single ISO string
  const iso = `${date}T${time}:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.getTime();
};

const MeetingCountdown: React.FC<MeetingCountdownProps> = ({ date, time, agenda }) => {
  const [remaining, setRemaining] = useState<string>('');
  const [alerted, setAlerted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const update = () => {
      const ts = getMeetingTimestamp(date, time);
      if (!ts) {
        setRemaining('Invalid date/time');
        return;
      }
      const now = Date.now();
      const diff = ts - now;
      if (diff <= 0) {
        setRemaining('Now!');
        if (!alerted) {
          setAlerted(true);
          setShowAlert(true);
        }
        return;
      }
      // Format as HH:MM:SS
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${hours > 0 ? hours + 'h ' : ''}${mins}m ${secs}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [date, time, agenda, alerted]);

  return (
    <>
      <span style={{ color: '#7fff7f', fontWeight: 600, fontSize: 15, marginLeft: 8 }}>
        {remaining && !remaining.startsWith('Invalid') ? `Starts in: ${remaining}` : remaining}
      </span>
      {showAlert && (
        <MeetingAlert
          message={`Meeting${agenda ? `: ${agenda}` : ''} is starting now!`}
          onClose={() => setShowAlert(false)}
        />
      )}
    </>
  );
};

export default MeetingCountdown;
