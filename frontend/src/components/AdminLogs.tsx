import React, { useEffect, useState } from 'react';
import { API_URL } from '../api';

type LogRow = { id: number; ts: string; method: string; path: string; userId: string; role: string; ip: string; details: string };

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const panelStyle: React.CSSProperties = {
  width: '90%',
  maxWidth: 980,
  height: '80%',
  background: '#0f1110',
  color: '#eee',
  borderRadius: 10,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 8px 40px #0008',
};

const toolbarStyle: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 8 };

export default function AdminLogs({ token, onClose }: { token: string; onClose: () => void }) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function fetchLogs() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_URL}/admin/audit?limit=500`, { headers: { 'x-admin-token': token || '' } });
      if (!res.ok) throw new Error('Failed to fetch logs');
      const json = await res.json();
      setLogs((json || []) as LogRow[]);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  function downloadBackup() {
    if (!token) return alert('Enter backup token in admin first');
    fetch(`${API_URL}/admin/backup`, { headers: { 'x-admin-token': token } })
      .then(r => { if (!r.ok) throw new Error('Backup failed'); return r.blob(); })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'carp-king-backup.sqlite'; document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(e => alert(String(e)));
  }

  function exportCsv() {
    if (!logs.length) return alert('No logs to export');
    const header = ['id','ts','method','path','userId','role','ip','details'];
    const rows = logs.map(l => header.map(h => {
      const v = (l as any)[h] ?? '';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    }).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-logs-${new Date().toISOString().slice(0,19)}.csv`; document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  }

  function exportTxt() {
    if (!logs.length) return alert('No logs to export');
    // TSV format for easy readability in text editors
    const header = ['TS','METHOD','PATH','USER','ROLE','IP','DETAILS'];
    const rows = logs.map(l => [l.ts, l.method, l.path, l.userId, l.role, l.ip, l.details].map(v => String(v || '').replace(/\t/g, ' ')).join('\t'));
    const txt = [header.join('\t'), ...rows].join('\n');
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-logs-${new Date().toISOString().slice(0,19)}.txt`; document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div style={overlayStyle} role="dialog" aria-modal>
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Audit Logs</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '6px 10px' }}>Close</button>
          </div>
        </div>
        <div style={toolbarStyle}>
          <button onClick={fetchLogs} disabled={loading} style={{ padding: '6px 10px' }}>{loading ? 'Loading…' : 'Refresh'}</button>
          <button onClick={downloadBackup} style={{ padding: '6px 10px' }}>Download DB</button>
          <button onClick={exportCsv} style={{ padding: '6px 10px' }}>Export CSV</button>
          <button onClick={exportTxt} style={{ padding: '6px 10px' }}>Export TXT</button>
          <div style={{ marginLeft: 'auto', color: '#aaa', fontSize: 12 }}>{logs.length} rows</div>
        </div>

        {err && <div style={{ color: 'salmon' }}>{err}</div>}

        <div style={{ flex: 1, overflow: 'auto', background: '#071010', padding: 8, borderRadius: 6, border: '1px solid #222' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #222' }}>
                <th style={{ padding: '6px 8px' }}>TS</th>
                <th style={{ padding: '6px 8px' }}>Method</th>
                <th style={{ padding: '6px 8px' }}>Path</th>
                <th style={{ padding: '6px 8px' }}>User</th>
                <th style={{ padding: '6px 8px' }}>Role</th>
                <th style={{ padding: '6px 8px' }}>IP</th>
                <th style={{ padding: '6px 8px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #0b0b0b' }}>
                  <td style={{ padding: '6px 8px', verticalAlign: 'top', color: '#ccc' }}>{l.ts}</td>
                  <td style={{ padding: '6px 8px' }}>{l.method}</td>
                  <td style={{ padding: '6px 8px' }}>{l.path}</td>
                  <td style={{ padding: '6px 8px' }}>{l.userId}</td>
                  <td style={{ padding: '6px 8px' }}>{l.role}</td>
                  <td style={{ padding: '6px 8px' }}>{l.ip}</td>
                  <td style={{ padding: '6px 8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: 420 }}>{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
