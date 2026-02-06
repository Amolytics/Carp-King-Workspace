import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';


const STORAGE_KEY = 'fb-page-details';

const FacebookSettings: React.FC = () => {
  const { user } = useAuth();
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<any>(null);

  // On mount, try to load from backend
  useEffect(() => {
    fetch('/api/facebook/get-page')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.details) {
          setSaved(data.details);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.details));
        } else {
          setSaved(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => {
        setSaved(null);
        localStorage.removeItem(STORAGE_KEY);
      });
  }, []);

  if (!user || user.role !== 'admin') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/facebook/set-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, pageName, accessToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to set page');
      setMessage('Page credentials saved!');
      const details = { pageId, pageName, accessToken };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
      setSaved(details);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/facebook/remove-page', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to remove');
      localStorage.removeItem(STORAGE_KEY);
      setSaved(null);
      setPageId('');
      setPageName('');
      setAccessToken('');
      setMessage('Page details removed.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <div style={{ margin: '2px 0' }}>
        <div style={{ color: '#ffe066', fontWeight: 600, marginBottom: 1, padding: 0 }}>Current Facebook Page Details:</div>
        <div style={{ fontSize: 14, marginBottom: 2 }}>Page ID: <b>{saved.pageId}</b></div>
        <div style={{ fontSize: 14, marginBottom: 2 }}>Page Name: <b>{saved.pageName}</b></div>
        <div style={{ fontSize: 14, marginBottom: 2 }}>Access Token: <b style={{ fontFamily: 'monospace' }}>{saved.accessToken}</b></div>
        <button type="button" onClick={handleRemove} style={{ background: '#c00', color: '#fff', fontWeight: 700, borderRadius: 6, padding: '4px 14px', border: 'none', marginTop: 4, cursor: 'pointer' }}>Remove Details</button>
        {message && <div style={{ color: 'green', marginTop: 2 }}>{message}</div>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ color: '#ffe066', fontWeight: 600, marginBottom: 2 }}>Enter Facebook Page Details</div>
      <input
        type="text"
        placeholder="Page ID"
        value={pageId}
        onChange={e => setPageId(e.target.value)}
        required
        style={{ marginBottom: 2, padding: 4, borderRadius: 4, border: '1px solid #ffe06655', background: '#23241a', color: '#ffe066' }}
      />
      <input
        type="text"
        placeholder="Page Name"
        value={pageName}
        onChange={e => setPageName(e.target.value)}
        required
        style={{ marginBottom: 2, padding: 4, borderRadius: 4, border: '1px solid #ffe06655', background: '#23241a', color: '#ffe066' }}
      />
      <input
        type="text"
        placeholder="Access Token"
        value={accessToken}
        onChange={e => setAccessToken(e.target.value)}
        required
        style={{ marginBottom: 2, padding: 4, borderRadius: 4, border: '1px solid #ffe06655', background: '#23241a', color: '#ffe066' }}
      />
      <button type="submit" disabled={loading} style={{ background: '#ffe066', color: '#23241a', fontWeight: 700, borderRadius: 6, padding: '4px 14px', border: 'none', marginTop: 4, cursor: 'pointer' }}>Save</button>
      {message && <div style={{ color: 'green', marginTop: 2 }}>{message}</div>}
      {error && <div style={{ color: 'red', marginTop: 2 }}>{error}</div>}
    </form>
  );
};

export default FacebookSettings;
