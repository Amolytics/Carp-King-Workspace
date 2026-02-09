// Inline component for changing a user's password
function ChangePasswordButton({ userId, userName }: { userId: string, userName: string }) {
  const [show, setShow] = React.useState(false);
  const [pw, setPw] = React.useState('');
  const [msg, setMsg] = React.useState<string | null>(null);
  const handleChange = async () => {
    if (!pw || pw.length < 3) {
      setMsg('Password must be at least 3 characters.');
      return;
    }
    try {
      await setUserPassword(userId, pw);
      setMsg('Password updated!');
      setPw('');
      setTimeout(() => { setShow(false); setMsg(null); }, 1200);
    } catch {
      setMsg('Failed to update password.');
    }
  };
  return (
    <div style={{ marginTop: 2 }}>
      <button style={{ ...buttonStyle, background: '#ffe066', color: '#23241a', fontSize: 12, padding: '2px 8px' }} onClick={() => setShow(s => !s)}>
        {show ? 'Cancel' : 'Change PW'}
      </button>
      {show && (
        <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <input type="text" value={pw} onChange={e => setPw(e.target.value)} placeholder={`New password for ${userName}`} style={{ padding: 4, borderRadius: 6, border: '1.5px solid #ffe06699', background: '#23241a', color: '#ffe066', fontSize: 12 }} />
          <button style={{ ...buttonStyle, fontSize: 12, padding: '2px 8px' }} onClick={handleChange}>Set Password</button>
          {msg && <div style={{ color: msg.includes('updated') ? '#7fff7f' : 'red', fontSize: 12 }}>{msg}</div>}
        </div>
      )}
    </div>
  );
}
import * as React from 'react';
import { useState, useEffect } from 'react';
import { clearUsers, API_URL } from '../api';
import FacebookSettings from './FacebookSettings';
import AdminLogs from './AdminLogs';
import { useCallback } from 'react';

const panelStyle: React.CSSProperties = {
  background: 'rgba(30,32,24,0.97)',
  borderRadius: 12,
  boxShadow: '0 2px 12px #0004',
  padding: 4,
  margin: '8px auto',
  maxWidth: 600,
  color: '#ffe066',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
};

const buttonStyle: React.CSSProperties = {
  background: '#ffe066',
  color: '#23241a',
  fontWeight: 700,
  fontSize: 14,
  borderRadius: 8,
  padding: '3px 8px',
  border: 'none',
  boxShadow: '0 1px 4px #0004',
  cursor: 'pointer',
  marginTop: 2,
  marginBottom: 2,
};

// Fetch all users from backend
async function fetchUsers(): Promise<any[]> {
  const res = await fetch(`${API_URL}/users`);
  return res.json();
}

// Change user role (admin only)
async function setUserRole(userId: string, role: string): Promise<any> {
  const res = await fetch(`${API_URL}/users/${userId}/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
    body: JSON.stringify({ role })
  });
  return res.json();
}

// Change user password (admin only)
async function setUserPassword(userId: string, password: string): Promise<any> {
  const res = await fetch(`${API_URL}/users/${userId}/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
    body: JSON.stringify({ password })
  });
  return res.json();
}

// Mask a long token for UI display (show first/last chars only)
function maskToken(t?: string) {
  if (!t) return '';
  try {
    if (t.length <= 16) return t;
    return `${t.slice(0, 6)}...${t.slice(-6)}`;
  } catch (_e) {
    return '';
  }
}
const ADMIN_PW_KEY = 'adminPassword';
const EDITOR_PW_KEY = 'editorPassword';

function AdminPanel() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [roleMsg, setRoleMsg] = useState<string | null>(null);
  const [backupToken, setBackupToken] = useState('');
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [adminPw, setAdminPw] = useState(() => localStorage.getItem(ADMIN_PW_KEY) || 'fred flintstone');
  const [editorPw, setEditorPw] = useState(() => localStorage.getItem(EDITOR_PW_KEY) || 'donald duck');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
    const handleSavePasswords = () => {
      localStorage.setItem(ADMIN_PW_KEY, adminPw);
      localStorage.setItem(EDITOR_PW_KEY, editorPw);
      setPwMsg('Passwords updated!');
      setTimeout(() => setPwMsg(null), 2000);
    };
  const [fbStatus, setFbStatus] = useState<{ connected: boolean; page?: any; message?: string } | null>(null);
  const [fbDetails, setFbDetails] = useState<any | null>(null);

  const fetchFbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/facebook/status');
      const json = await res.json();
      setFbStatus(json);
    } catch (err) {
      setFbStatus({ connected: false, message: 'Failed to contact backend' });
    }
  }, []);

  const fetchFbDetails = useCallback(async () => {
    try {
      const res = await fetch('/api/facebook/get-page');
      const json = await res.json();
      if (json?.success && json.details) setFbDetails(json.details);
      else setFbDetails(null);
    } catch (err) {
      setFbDetails(null);
    }
  }, []);

  useEffect(() => {
    setUserLoading(true);
    fetchUsers().then(setUsers).finally(() => setUserLoading(false));
    fetchFbStatus();
    fetchFbDetails();
  }, []);

  const refreshUsers = () => {
    setUserLoading(true);
    fetchUsers().then(setUsers).finally(() => setUserLoading(false));
  };

  const handleClearUsers = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await clearUsers();
      setMessage(res.message || 'User list cleared.');
      // Refresh user list
      setUserLoading(true);
      fetchUsers().then(setUsers).finally(() => setUserLoading(false));
    } catch (err: any) {
      setMessage('Failed to clear users.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetRole = async (userId: string, role: string) => {
    setRoleMsg(null);
    try {
      await setUserRole(userId, role);
      setRoleMsg('Role updated!');
      // Refresh user list
      setUserLoading(true);
      fetchUsers().then(setUsers).finally(() => setUserLoading(false));
    } catch (err: any) {
      setRoleMsg('Failed to update role.');
    }
  };

  const handleDownloadBackup = () => {
    setBackupMsg(null);
    if (!backupToken.trim()) {
      setBackupMsg('Enter the backup token first.');
      return;
    }
    const url = `${API_URL}/admin/backup`;
    fetch(url, { headers: { 'x-admin-token': backupToken.trim() } })
      .then(res => {
        if (!res.ok) throw new Error('Backup failed');
        const disposition = res.headers.get('content-disposition') || '';
        const match = disposition.match(/filename="?([^"]+)"?/i);
        const filename = match?.[1] || 'carp-king-backup.sqlite';
        return res.blob().then(blob => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        setBackupMsg('Backup downloaded.');
      })
      .catch(() => setBackupMsg('Backup failed. Check token and try again.'));
  };

  return (
    <div style={panelStyle}>
      <h2 style={{ color: '#ffe066', marginBottom: 4, fontSize: 20, padding: 0 }}>Admin Functions</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <button style={{ ...buttonStyle, marginTop: 1, marginBottom: 1, padding: '2px 8px', fontSize: 14 }} onClick={refreshUsers} disabled={userLoading}>
          {userLoading ? 'Refreshing...' : 'Refresh Users'}
        </button>
        <button style={{ ...buttonStyle, marginTop: 1, marginBottom: 1, padding: '2px 8px', fontSize: 14 }} onClick={handleClearUsers} disabled={loading}>
          {loading ? 'Clearing...' : 'Clear All Users (except admin)'}
        </button>
          <button style={{ ...buttonStyle, marginTop: 1, marginBottom: 1, padding: '2px 8px', fontSize: 14 }} onClick={() => setShowLogs(true)}>
            Open Logs Viewer
          </button>
      </div>
      {message && <div style={{ color: message.includes('Failed') ? 'red' : '#ffe066', marginTop: 2 }}>{message}</div>}

      {/* Admin/editor password change section */}
      <div style={{ width: '100%', margin: '6px 0 12px 0', background: 'rgba(40,42,24,0.98)', borderRadius: 6, padding: 12 }}>
        <h3 style={{ color: '#ffe066', marginBottom: 2 }}>Change Admin/Editor Passwords</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340 }}>
          <label style={{ color: '#ffe066', fontWeight: 600 }}>Admin Password</label>
          <input type="text" value={adminPw} onChange={e => setAdminPw(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1.5px solid #ffe06699', background: '#23241a', color: '#ffe066' }} />
          <label style={{ color: '#ffe066', fontWeight: 600 }}>Editor Password</label>
          <input type="text" value={editorPw} onChange={e => setEditorPw(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1.5px solid #ffe06699', background: '#23241a', color: '#ffe066' }} />
          <button style={buttonStyle} onClick={handleSavePasswords}>Save Passwords</button>
          {pwMsg && <div style={{ color: '#7fff7f', marginTop: 2 }}>{pwMsg}</div>}
        </div>
      </div>
      <div style={{ width: '100%', margin: '6px 0 6px 0' }}>
        <h3 style={{ color: '#ffe066', marginBottom: 2 }}>Registered Users</h3>
        {userLoading ? <div>Loading users...</div> : (
          <table style={{ width: '100%', background: 'rgba(40,42,24,0.98)', color: '#ffe066', borderRadius: 6, boxShadow: '0 1px 6px #0002', marginBottom: 4, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#23241a', color: '#ffe066' }}>
                <th style={{ padding: 3, borderBottom: '1.5px solid #ffe06633' }}>Name</th>
                <th style={{ padding: 3, borderBottom: '1.5px solid #ffe06633' }}>Chat Username</th>
                <th style={{ padding: 3, borderBottom: '1.5px solid #ffe06633' }}>Role</th>
                <th style={{ padding: 3, borderBottom: '1.5px solid #ffe06633' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ padding: 3 }}>{u.name}</td>
                  <td style={{ padding: 3 }}>{u.chatUsername}</td>
                  <td style={{ padding: 3 }}>{u.role}</td>
                  <td style={{ padding: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {u.role !== 'admin' && (
                      <button style={buttonStyle} onClick={() => handleSetRole(u.id, 'admin')}>Make Admin</button>
                    )}
                    {u.role !== 'editor' && (
                      <button style={buttonStyle} onClick={() => handleSetRole(u.id, 'editor')}>Make Editor</button>
                    )}
                    <ChangePasswordButton userId={u.id} userName={u.name} />
                    {u.role === 'admin' && (
                      <span style={{ color: '#7fff7f', fontWeight: 700 }}>Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            {/* End of users.map */}

            </tbody>
          </table>
        )}
        {roleMsg && <div style={{ color: roleMsg.includes('Failed') ? 'red' : '#7fff7f', marginTop: 2 }}>{roleMsg}</div>}
      </div>
      {showLogs && <AdminLogs token={backupToken} onClose={() => setShowLogs(false)} />}

        <div style={{ width: '100%', margin: '6px 0 0 0' }}>
          <h3 style={{ color: '#ffe066', marginBottom: 2 }}>Database Backup</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="password"
              placeholder="Backup token"
              value={backupToken}
              onChange={e => setBackupToken(e.target.value)}
              style={{
                flex: 1,
                padding: '4px 6px',
                borderRadius: 6,
                border: '1.5px solid #ffe06699',
                background: '#23241a',
                color: '#ffe066',
              }}
            />
            <button style={buttonStyle} onClick={handleDownloadBackup}>Download</button>
          </div>
          {backupMsg && <div style={{ color: backupMsg.includes('failed') ? 'red' : '#7fff7f', marginTop: 2 }}>{backupMsg}</div>}
        </div>

      {/* Facebook page details stacked vertically */}
      <div style={{ width: '100%', margin: '6px 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <h3 style={{ color: '#ffe066', marginBottom: 2 }}>Facebook Page Details</h3>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div>
              {fbStatus ? (
                fbStatus.connected ? (
                  <span style={{ background: '#2f8f4a', color: '#fff', padding: '4px 8px', borderRadius: 8, fontWeight: 700 }}>Connected</span>
                ) : (
                  <span style={{ background: '#a33', color: '#fff', padding: '4px 8px', borderRadius: 8, fontWeight: 700 }}>Disconnected</span>
                )
              ) : (
                <span style={{ padding: '4px 8px', borderRadius: 8, background: '#444', color: '#fff' }}>Checking…</span>
              )}
            </div>
            <button style={{ ...buttonStyle, padding: '4px 8px' }} onClick={() => { fetchFbStatus(); fetchFbDetails(); }}>Refresh Status</button>
          </div>
          {fbDetails && (
            <div style={{ marginBottom: 8, padding: 8, background: 'rgba(255,224,102,0.06)', borderRadius: 8 }}>
              <div style={{ fontSize: 13 }}>Page ID: <b style={{ color: '#fff' }}>{fbDetails.pageId}</b></div>
              <div style={{ fontSize: 13 }}>Page Name: <b style={{ color: '#fff' }}>{fbDetails.pageName}</b></div>
              <div style={{ fontSize: 13 }}>Access Token: <b style={{ fontFamily: 'monospace', color: '#fff' }}>{maskToken(fbDetails.accessToken)}</b></div>
            </div>
          )}
          <FacebookSettings />
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
