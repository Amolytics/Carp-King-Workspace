import * as React from 'react';
import { useState, useEffect } from 'react';
import { clearUsers, API_URL } from '../api';
import FacebookSettings from './FacebookSettings';

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  });
  return res.json();
}
function AdminPanel() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [roleMsg, setRoleMsg] = useState<string | null>(null);
  const [backupToken, setBackupToken] = useState('');
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  useEffect(() => {
    setUserLoading(true);
    fetchUsers().then(setUsers).finally(() => setUserLoading(false));
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
      </div>
      {message && <div style={{ color: message.includes('Failed') ? 'red' : '#ffe066', marginTop: 2 }}>{message}</div>}

      {/* User list always visible, minimal padding */}
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
                  <td style={{ padding: 3 }}>
                    {u.role !== 'admin' && (
                      <button style={buttonStyle} onClick={() => handleSetRole(u.id, 'admin')}>Make Admin</button>
                    )}
                    {u.role === 'admin' && (
                      <span style={{ color: '#7fff7f', fontWeight: 700 }}>Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {roleMsg && <div style={{ color: roleMsg.includes('Failed') ? 'red' : '#7fff7f', marginTop: 2 }}>{roleMsg}</div>}
      </div>

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
          <FacebookSettings />
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
