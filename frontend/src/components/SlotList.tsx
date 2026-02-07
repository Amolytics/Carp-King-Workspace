import React, { useEffect, useState } from 'react';
import { Slot } from '../types';
import { getSlots, updateSlot, deleteSlot } from '../api';
import { socket } from '../realtime';

const SlotList: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    getSlots().then(setSlots);
    const refreshedHandler = (e: any) => {
      try {
        const payload = e?.detail as Slot[] | undefined;
        if (payload && Array.isArray(payload)) setSlots(payload);
      } catch (err) {}
    };
    const windowHandler = (e: any) => {
      try {
        const slot = e?.detail as Slot | undefined;
        if (slot && slot.id) setSlots(prev => [slot, ...prev]);
      } catch (err) {
        // ignore
      }
    };
    const socketCreated = async (_slot: any) => {
      // When server emits a created slot (or another client created one),
      // fetch authoritative list to avoid missing or out-of-order items.
      try {
        const fresh = await getSlots();
        setSlots(fresh);
      } catch (err) {}
    };
    const socketPublished = (_payload: any) => {
      // refresh list on publish
      getSlots().then(setSlots).catch(() => {});
    };

    window.addEventListener('slot:created', windowHandler as EventListener);
    window.addEventListener('slots:refreshed', refreshedHandler as EventListener);
    const refreshHandler = () => { getSlots().then(setSlots).catch(() => {}); };
    window.addEventListener('slots:refresh', refreshHandler as EventListener);
    socket.on('slot:created', socketCreated);
    socket.on('slot:published', socketPublished);
    return () => {
      window.removeEventListener('slot:created', windowHandler as EventListener);
      window.removeEventListener('slots:refreshed', refreshedHandler as EventListener);
      window.removeEventListener('slots:refresh', refreshHandler as EventListener);
      socket.off('slot:created', socketCreated);
      socket.off('slot:published', socketPublished);
    };
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
            <div style={{ textAlign: 'right', minWidth: 160 }}>
              <div style={{ marginBottom: 6 }}>
                <button onClick={async () => {
                  // edit flow: only allow editing if not published
                  if (slot.published) return alert('Cannot edit a published post');
                  const newContent = window.prompt('Edit post content', slot.content || '');
                  if (newContent === null) return; // cancelled
                  const currentLocal = slot.scheduledAt ? new Date(slot.scheduledAt) : null;
                  const currentInput = currentLocal ? new Date(currentLocal.getTime() - currentLocal.getTimezoneOffset()*60000).toISOString().slice(0,16) : '';
                  const newScheduled = window.prompt('Edit scheduled time (local, YYYY-MM-DDTHH:MM)', currentInput || '');
                  try {
                    const updates: any = { content: newContent };
                    if (newScheduled) updates.scheduledAt = new Date(newScheduled).toISOString();
                    const updated = await updateSlot(slot.id!, updates);
                    const fresh = await getSlots();
                    setSlots(fresh);
                    try { window.dispatchEvent(new CustomEvent('slots:refreshed', { detail: fresh })); } catch (e) {}
                  } catch (err: any) {
                    alert('Update failed: ' + (err?.message || String(err)));
                  }
                }} style={{ marginRight: 8 }} title="Edit">⋯</button>
                <button onClick={async () => {
                  if (slot.published) return alert('Cannot delete a published post');
                  if (!confirm('Delete this scheduled post?')) return;
                  try {
                    await deleteSlot(slot.id!);
                    const fresh = await getSlots();
                    setSlots(fresh);
                    try { window.dispatchEvent(new CustomEvent('slots:refreshed', { detail: fresh })); } catch (e) {}
                  } catch (err: any) {
                    alert('Delete failed: ' + (err?.message || String(err)));
                  }
                }} title="Delete">🗑</button>
              </div>
              <div>
              {slot.publishedAt && <div style={{ fontSize: 12, color: '#fff' }}>Posted: {new Date(slot.publishedAt).toLocaleString()}</div>}
              {slot.publishError && <div style={{ fontSize: 12, color: '#ff7b7b' }}>{String(slot.publishError).slice(0, 120)}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlotList;
