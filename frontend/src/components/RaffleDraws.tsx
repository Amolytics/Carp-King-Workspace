import React, { useState, useEffect } from 'react';

const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: 16 };
const card: React.CSSProperties = { background: '#0f1110', color: '#fff', padding: 12, borderRadius: 8, minHeight: 220, display: 'flex', flexDirection: 'column' };
const textareaStyle: React.CSSProperties = { flex: 1, resize: 'none', padding: 8, borderRadius: 6, border: '1px solid #222', background: '#071010', color: '#ddd' };
const controls: React.CSSProperties = { display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' };
const bigWinner: React.CSSProperties = { marginTop: 10, fontSize: 28, fontWeight: 800, textAlign: 'center', color: '#ffe066' };

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RaffleDraws() {
  const initialLists = Array.from({ length: 6 }, () => '');
  const [lists, setLists] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('raffle.lists.v1');
      return raw ? JSON.parse(raw) : initialLists;
    } catch (e) {
      return initialLists;
    }
  });
  const [winners, setWinners] = useState<string[][]>(Array.from({ length: 6 }, () => []));
  const [countInputs, setCountInputs] = useState<number[]>(Array.from({ length: 6 }, () => 1));

  useEffect(() => {
    try { localStorage.setItem('raffle.lists.v1', JSON.stringify(lists)); } catch (e) {}
  }, [lists]);

  function updateList(index: number, value: string) {
    const copy = lists.slice(); copy[index] = value; setLists(copy);
  }

  function parseEntries(text: string) {
    return text.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0);
  }

  function pick(index: number) {
    const entries = parseEntries(lists[index]);
    if (!entries.length) return alert('Add names or ticket numbers (one per line)');
    const n = Math.max(1, Math.min(entries.length, Math.floor(countInputs[index] || 1)));
    const shuffled = shuffle(entries);
    const picked = shuffled.slice(0, n);
    const copy = winners.slice(); copy[index] = picked; setWinners(copy);
  }

  function clear(index: number) {
    const copy = lists.slice(); copy[index] = ''; setLists(copy);
    const wcopy = winners.slice(); wcopy[index] = []; setWinners(wcopy);
  }

  function pasteSample(index: number) {
    const sample = ['Alice','Bob','Charlie','Dana','Eve','Frank','Grace','Heidi','Ivan','Judy'];
    const copy = lists.slice(); copy[index] = sample.join('\n'); setLists(copy);
  }

  function exportTxt(index: number) {
    const entries = parseEntries(lists[index]);
    if (!entries.length) return alert('No entries to export');
    const txt = entries.join('\n');
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `raffle-${index + 1}-entries.txt`; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: 12 }}>
      <h2>Raffle Draws</h2>
      <p>Six independent raffle pickers — paste names or ticket numbers (one per line), set how many winners, then press <strong>Pick</strong>.</p>
      <div style={grid}>
        {lists.map((list, i) => (
          <div key={i} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Picker #{i + 1}</strong>
              <div style={{ fontSize: 12, color: '#aaa' }}>{(parseEntries(list).length)} entries</div>
            </div>
            <textarea
              placeholder="Paste names or ticket numbers, one per line"
              value={list}
              onChange={e => updateList(i, e.target.value)}
              style={textareaStyle}
            />
            <div style={controls}>
              <button onClick={() => pick(i)} style={{ padding: '8px 10px', borderRadius: 6 }}>Pick</button>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                Winners:
                <input type="number" value={countInputs[i]} min={1} max={100} onChange={e => { const v = Math.max(1, Number(e.target.value) || 1); const c = countInputs.slice(); c[i] = v; setCountInputs(c); }} style={{ width: 64, padding: 6, borderRadius: 6, background: '#071010', color: '#eee', border: '1px solid #222' }} />
              </label>
              <button onClick={() => pasteSample(i)} style={{ padding: '8px 10px', borderRadius: 6 }}>Sample</button>
              <button onClick={() => clear(i)} style={{ padding: '8px 10px', borderRadius: 6 }}>Clear</button>
              <button onClick={() => exportTxt(i)} style={{ padding: '8px 10px', borderRadius: 6 }}>Export TXT</button>
            </div>
            <div style={bigWinner} aria-live="polite">
              {winners[i] && winners[i].length ? winners[i].join(', ') : 'No winner yet'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
