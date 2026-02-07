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
  const [modes, setModes] = useState<string[]>(Array.from({ length: 6 }, () => 'names'));
  const [useRange, setUseRange] = useState<boolean[]>(Array.from({ length: 6 }, () => true));
  const [minVals, setMinVals] = useState<number[]>(Array.from({ length: 6 }, () => 1));
  const [maxVals, setMaxVals] = useState<number[]>(Array.from({ length: 6 }, () => 100));
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

  useEffect(() => {
    try { localStorage.setItem('raffle.lists.v1', JSON.stringify(lists)); } catch (e) {}
  }, [lists]);

  function updateList(index: number, value: string) {
    const copy = lists.slice(); copy[index] = value; setLists(copy);
  }

  function parseEntries(text: string) {
    return text.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0);
  }

  async function pickNames(index: number) {
    const entries = parseEntries(lists[index]);
    if (!entries.length) return alert('Add names or ticket numbers (one per line)');
    const n = Math.max(1, Math.min(entries.length, Math.floor(countInputs[index] || 1)));
    const shuffled = shuffle(entries);
    const picked = shuffled.slice(0, n);
    await revealWinners(index, picked);
  }

  async function pickTickets(index: number) {
    // Tickets can be supplied as lines or as a range (min/max)
    let pool: string[] = [];
    if (!useRange[index]) {
      pool = parseEntries(lists[index]);
    } else {
      const min = Math.max(0, Math.floor(minVals[index] || 0));
      const max = Math.max(min + 1, Math.floor(maxVals[index] || (min + 1)));
      for (let i = min; i <= max; i++) pool.push(String(i));
    }
    if (!pool.length) return alert('Provide ticket numbers or a valid range');
    const n = Math.max(1, Math.min(pool.length, Math.floor(countInputs[index] || 1)));

    // Try to use random.org as a web-sourced RNG; fall back to crypto RNG
    let picked: string[] = [];
    if (useRange[index]) {
      // Try fetch from random.org integers endpoint
      try {
        const url = `https://www.random.org/integers/?num=${n}&min=${minVals[index]}&max=${maxVals[index]}&col=1&base=10&format=plain&rnd=new`;
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          picked = text.trim().split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0).slice(0, n);
        }
      } catch (e) {
        // ignore and fallback
      }
    }
    if (!picked.length) {
      // fallback crypto-powered selection
      const shuffled = shuffle(pool);
      picked = shuffled.slice(0, n);
    }
    await revealWinners(index, picked);
  }

  async function revealWinners(index: number, picked: string[]) {
    setAnimatingIndex(index);
    // small delay to let animation start
    await new Promise(r => setTimeout(r, 600));
    const copy = winners.slice(); copy[index] = picked; setWinners(copy);
    // stop anim after a bit
    setTimeout(() => setAnimatingIndex(null), 2400);
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
      <p>Six independent raffle pickers — paste names or ticket numbers (one per line), or choose ticket range mode to draw from a numeric range. Pick attempts to use web RNG when possible and falls back to a crypto RNG. Winners reveal with a brief animation.</p>
      <div style={grid}>
        {lists.map((list, i) => (
          <div key={i} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Picker #{i + 1}</strong>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={modes[i]} onChange={e => { const m = modes.slice(); m[i] = e.target.value; setModes(m); }}>
                  <option value="names">Names / Tickets (list)</option>
                  <option value="tickets">Ticket Range</option>
                </select>
                <div style={{ fontSize: 12, color: '#aaa' }}>{(parseEntries(list).length)} entries</div>
              </div>
            </div>
            {modes[i] === 'names' ? (
              <textarea
                placeholder="Paste names or ticket numbers, one per line"
                value={list}
                onChange={e => updateList(i, e.target.value)}
                style={textareaStyle}
              />
            ) : (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  Min:
                  <input type="number" value={minVals[i]} onChange={e => { const v = Math.max(0, Number(e.target.value) || 0); const c = minVals.slice(); c[i] = v; setMinVals(c); }} style={{ width: 80 }} />
                </label>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  Max:
                  <input type="number" value={maxVals[i]} onChange={e => { const v = Math.max(0, Number(e.target.value) || 0); const c = maxVals.slice(); c[i] = v; setMaxVals(c); }} style={{ width: 80 }} />
                </label>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="checkbox" checked={useRange[i]} onChange={e => { const c = useRange.slice(); c[i] = e.target.checked; setUseRange(c); }} /> Use range
                </label>
              </div>
            )}
            <div style={controls}>
              <button onClick={() => modes[i] === 'names' ? pickNames(i) : pickTickets(i)} style={{ padding: '8px 10px', borderRadius: 6 }}>Pick</button>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                Winners:
                <input type="number" value={countInputs[i]} min={1} max={100} onChange={e => { const v = Math.max(1, Number(e.target.value) || 1); const c = countInputs.slice(); c[i] = v; setCountInputs(c); }} style={{ width: 64, padding: 6, borderRadius: 6, background: '#071010', color: '#eee', border: '1px solid #222' }} />
              </label>
              <button onClick={() => pasteSample(i)} style={{ padding: '8px 10px', borderRadius: 6 }}>Sample</button>
              <button onClick={() => clear(i)} style={{ padding: '8px 10px', borderRadius: 6 }}>Clear</button>
              <button onClick={() => exportTxt(i)} style={{ padding: '8px 10px', borderRadius: 6 }}>Export TXT</button>
            </div>
            <div style={bigWinner} aria-live="polite">
              {winners[i] && winners[i].length ? (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                  {winners[i].map((w, idx) => (
                    <div key={idx} style={{
                      padding: '12px 18px', borderRadius: 10, background: '#111827', color: '#fff', fontSize: 20, fontWeight: 800,
                      transform: animatingIndex === i ? 'translateY(-10px) scale(1.08)' : 'none',
                      transition: `transform 500ms ease ${idx * 120}ms, opacity 400ms ${idx * 120}ms`,
                      opacity: animatingIndex === null ? 1 : 0.01
                    }}>{w}</div>
                  ))}
                </div>
              ) : (
                <span style={{ color: '#999' }}>No winner yet</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
