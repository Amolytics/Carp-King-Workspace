import React, { useEffect, useState } from 'react';
import { Slot } from '../types';
import { getSlots } from '../api';

const SlotList: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    getSlots().then(setSlots);
    const handler = (e: any) => {
      try {
        const slot = e?.detail as Slot | undefined;
        if (slot && slot.id) setSlots(prev => [slot, ...prev]);
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('slot:created', handler as EventListener);
    return () => window.removeEventListener('slot:created', handler as EventListener);
  }, []);

  if (!slots || slots.length === 0) {
    return (
      <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,224,102,0.04)', color: '#ffe066' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Scheduled Posts</div>
        <div style={{ marginTop: 12, color: '#888' }}>No scheduled posts.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,224,102,0.04)', color: '#ffe066' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Scheduled Posts</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slots.map(slot => (
          <div key={slot.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, background: '#1e2018', borderRadius: 8 }}>
            {slot.imageUrl ? (
              <img src={slot.imageUrl} alt="thumb" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 6 }} />
            ) : (
              <div style={{ width: 84, height: 84, background: '#111307', borderRadius: 6 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#fff', marginBottom: 6 }}>{slot.content || slot?.message || <span style={{ color: '#888' }}>No content</span>}</div>
              <div style={{ fontSize: 12, color: '#ffe06699' }}>
                Scheduled: {slot.scheduledAt ? new Date(slot.scheduledAt).toLocaleString() : <span style={{ color: '#888' }}>—</span>}
                {' — '}
                {slot.published ? <span style={{ color: '#7fff7f' }}>Published</span> : <span style={{ color: '#ffd76b' }}>Queued</span>}
                {slot.publishError ? <span style={{ color: '#ff7b7b' }}> — Error</span> : null}
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 120 }}>
              {slot.publishedAt && <div style={{ fontSize: 12, color: '#fff' }}>Posted: {new Date(slot.publishedAt).toLocaleString()}</div>}
              {slot.publishError && <div style={{ fontSize: 12, color: '#ff7b7b' }}>{String(slot.publishError).slice(0, 120)}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlotList;
