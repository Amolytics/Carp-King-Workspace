import React, { useState } from 'react';
import SlotList from './components/SlotList';
import ImageUpload from './components/ImageUpload';

const PlannerLayout: React.FC = () => {
  const [postContent, setPostContent] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  return (
    <>
      <div className="planner-layout">
        <div className="panel">
          <h2 style={{ marginBottom: 18 }}>Schedule a Post</h2>
          <form className="panel-form">
            <label>Post Content</label>
            <textarea
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="Write your post..."
              rows={6}
            />
            <label>Schedule Time</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
            />
            <label>Preview Image (optional)</label>
            <input
              type="url"
              value={previewImage || ''}
              onChange={e => setPreviewImage(e.target.value || null)}
              placeholder="Paste image URL..."
            />
            <label>Or upload an image</label>
            <ImageUpload onUpload={url => setUploadedImageUrl(url)} />
            {uploadedImageUrl && (
              <div style={{ margin: '12px 0' }}>
                <img src={uploadedImageUrl} alt="Uploaded" style={{ maxWidth: '100%', borderRadius: 8 }} />
                <button type="button" className="btn btn-ghost" style={{ marginTop: 6 }} onClick={() => setUploadedImageUrl(null)}>Remove</button>
              </div>
            )}
            <button type="button" className="btn" style={{ width: '100%', fontSize: 18, marginTop: 8 }}>Schedule Post</button>
          </form>
        </div>
        <div className="panel">
          <h2 style={{ marginBottom: 18 }}>Post Preview</h2>
          <div className="panel-preview">
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
