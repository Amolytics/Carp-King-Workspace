import React, { useState } from 'react';
import SlotList from './components/SlotList';
import ImageUpload from './components/ImageUpload';
import AdminButton from './components/AdminButton';

const PlannerLayout: React.FC = () => {
  const [postContent, setPostContent] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  return (
    <>
      <AdminButton />
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ flex: '1 1 320px', maxWidth: 420, background: 'rgba(30,32,24,0.97)', padding: 24, borderRadius: 12, boxShadow: '0 2px 12px #0004', minWidth: 320 }}>
          <h2 style={{ color: '#ffe066', marginBottom: 18 }}>Schedule a Post</h2>
          <form>
            <label style={{ color: '#ffe066', fontWeight: 600 }}>Post Content</label>
            <textarea
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="Write your post..."
              rows={6}
              style={{ width: '100%', marginBottom: 16, borderRadius: 6, border: '1.5px solid #ffe06699', background: '#23241a', color: '#ffe066', fontSize: 16, padding: 10, outline: 'none' }}
            />
            <label style={{ color: '#ffe066', fontWeight: 600 }}>Schedule Time</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              style={{ width: '100%', marginBottom: 16, borderRadius: 6, border: '1.5px solid #ffe06699', background: '#23241a', color: '#ffe066', fontSize: 16, padding: 10, outline: 'none' }}
            />
            <label style={{ color: '#ffe066', fontWeight: 600 }}>Preview Image (optional)</label>
            <input
              type="url"
              value={previewImage || ''}
              onChange={e => setPreviewImage(e.target.value || null)}
              placeholder="Paste image URL..."
              style={{ width: '100%', marginBottom: 16, borderRadius: 6, border: '1.5px solid #ffe06699', background: '#23241a', color: '#ffe066', fontSize: 16, padding: 10, outline: 'none' }}
            />
            <label style={{ color: '#ffe066', fontWeight: 600 }}>Or upload an image</label>
            <ImageUpload onUpload={url => setUploadedImageUrl(url)} />
            {uploadedImageUrl && (
              <div style={{ margin: '12px 0' }}>
                <img src={uploadedImageUrl} alt="Uploaded" style={{ maxWidth: '100%', borderRadius: 8 }} />
                <button type="button" style={{ marginTop: 6, color: '#ffe066', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setUploadedImageUrl(null)}>Remove</button>
              </div>
            )}
            <button type="button" style={{ width: '100%', fontSize: 18, marginTop: 8, padding: '12px 32px', borderRadius: 6, background: '#ffe066', color: '#23241a', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px #0004', letterSpacing: 1, transition: 'background 0.2s' }}>Schedule Post</button>
          </form>
        </div>
        <div style={{ flex: '1 1 320px', maxWidth: 420, background: 'rgba(30,32,24,0.97)', padding: 24, borderRadius: 12, boxShadow: '0 2px 12px #0004', minWidth: 320 }}>
          <h2 style={{ color: '#ffe066', marginBottom: 18 }}>Post Preview</h2>
          <div style={{ background: '#23241a', borderRadius: 8, padding: 18, color: '#ffe066', minHeight: 180, boxShadow: '0 1px 6px #0002' }}>
            {uploadedImageUrl && <img src={uploadedImageUrl} alt="Preview" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 12 }} />}
            {!uploadedImageUrl && previewImage && <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 12 }} />}
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{postContent || <span style={{ color: '#888' }}>Your post will appear here...</span>}</div>
            <div style={{ fontSize: 14, color: '#ffe06699' }}>Scheduled for: {scheduledTime ? new Date(scheduledTime).toLocaleString() : <span style={{ color: '#888' }}>No time set</span>}</div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <SlotList />
      </div>
    </>
  );
};
export default PlannerLayout;
