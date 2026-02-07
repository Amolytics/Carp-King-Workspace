import React, { useEffect, useState } from 'react';
import { Slot } from '../types';
import { getSlots, updateSlot, deleteSlot } from '../api';
import { socket } from '../realtime';

const SlotList: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editScheduled, setEditScheduled] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  function isoToInputLocal(iso?: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  useEffect(() => {
    getSlots().then(list => setSlots(list.filter(s => !s.published)));
    const refreshedHandler = (e: any) => {
      try {
        const payload = e?.detail as Slot[] | undefined;
        if (payload && Array.isArray(payload)) setSlots(payload.filter(s => !s.published));
      } catch (err) {}
    };
    const windowHandler = (e: any) => {
      try {
        const slot = e?.detail as Slot | undefined;
        if (slot && slot.id && !slot.published) setSlots(prev => [slot, ...prev]);
      } catch (err) {
        // ignore
      }
    };
    const socketCreated = async (_slot: any) => {
      // When server emits a created slot (or another client created one),
      // fetch authoritative list to avoid missing or out-of-order items.
      try {
        const fresh = await getSlots();
        setSlots(fresh.filter(s => !s.published));
      } catch (err) {}
    };
    const socketPublished = (payload: any) => {
      try {
        const slotId = payload?.slotId;
        if (slotId) {
          setSlots(prev => prev.filter(s => s.id !== slotId));
          return;
        }
      } catch (err) {}
      // fallback: refetch authoritative queued slots
      getSlots().then(list => setSlots(list.filter(s => !s.published))).catch(() => {});
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
                <button onClick={() => {
                  if (slot.published) return alert('Cannot edit a published post');
                  setEditing(slot);
                  setEditContent(slot.content || '');
                  setEditImageUrl(slot.imageUrl || '');
                  setEditScheduled(isoToInputLocal(slot.scheduledAt));
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
      {editing && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ width: 720, maxWidth: '90%', background: '#0f1110', padding: 18, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Edit Scheduled Post</h3>
            <label style={{ display: 'block', marginBottom: 6 }}>Content</label>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={6} style={{ width: '100%', marginBottom: 8 }} />
            <label style={{ display: 'block', marginBottom: 6 }}>Scheduled time</label>
            <input type="datetime-local" value={editScheduled} onChange={e => setEditScheduled(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
            <label style={{ display: 'block', marginBottom: 6 }}>Image URL</label>
            <input type="url" value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)} style={{ width: '100%', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditing(null); }} className="btn btn-ghost">Cancel</button>
              <button onClick={async () => {
                try {
                  const updates: any = { content: editContent, imageUrl: editImageUrl };
                  if (editScheduled) updates.scheduledAt = new Date(editScheduled).toISOString();
                  await updateSlot(editing.id!, updates);
                  const fresh = await getSlots();
                  setSlots(fresh.filter(s => !s.published));
                  try { window.dispatchEvent(new CustomEvent('slots:refreshed', { detail: fresh })); } catch (e) {}
                  setEditing(null);
                } catch (err: any) {
                  alert('Update failed: ' + (err?.message || String(err)));
                }
              }} className="btn">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotList;
