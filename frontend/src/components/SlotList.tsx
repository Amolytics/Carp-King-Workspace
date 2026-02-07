import React, { useEffect, useState } from 'react';
import { Slot } from '../types';
import { getSlots } from '../api';
import SlotThread from './SlotThread';

const SlotList: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    getSlots().then(setSlots);
    const handler = (e: any) => {
      try {
        const slot = e?.detail;
        if (slot && slot.id) setSlots(prev => [slot, ...prev]);
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('slot:created', handler as EventListener);
    return () => window.removeEventListener('slot:created', handler as EventListener);
  }, []);

  return (
    <div>
      <h2>Slots</h2>
      <ul>
        {slots.map(slot => (
          <li key={slot.id}>
            <img src={slot.imageUrl} alt="Slot" width={100} />
            <div>Comments: {slot.comments.length}</div>
            <SlotThread slot={slot} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SlotList;
