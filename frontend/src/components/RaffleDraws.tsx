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
  const pickers: { title: string; url: string; desc: string }[] = [
    { title: 'Wheel of Names', url: 'https://wheelofnames.com/', desc: 'Classic spinning wheel with big visuals and name import.' },
    { title: 'Picker Wheel', url: 'https://pickerwheel.com/', desc: 'Large colorful wheel with many visual options.' },
    { title: 'WheelDecide', url: 'https://wheeldecide.com/', desc: 'Simple wheel with clear display for live draws.' },
    { title: 'CommentPicker', url: 'https://commentpicker.com/random-name-picker.php', desc: 'Popular name/comment picker with large results.' },
    { title: 'MiniWebTool Picker', url: 'https://miniwebtool.com/random-name-picker/', desc: 'Straightforward name picker list tool.' },
    { title: 'RandomLists Names', url: 'https://www.randomlists.com/random-names', desc: 'Random name list generator with big result display.' },
  ];

  const cardLarge: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 12, background: '#0f1110', color: '#fff', minHeight: 160 };
  const gridLarge: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, padding: 16 };
  const btnBig: React.CSSProperties = { padding: '14px 18px', fontSize: 18, borderRadius: 8, cursor: 'pointer', background: '#ffe066', border: 'none', color: '#000', fontWeight: 700 };

  return (
    <div style={{ padding: 12 }}>
      <h2>Online Visual Raffle Pickers</h2>
      <p>Open an online visual raffle picker in a new tab — large, attractive UIs suitable for live draws. Click any tile to launch the picker.</p>
      <div style={gridLarge}>
        {pickers.map((p, i) => (
          <div key={i} style={cardLarge}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{p.title}</div>
            <div style={{ color: '#ccc', textAlign: 'center', marginBottom: 12 }}>{p.desc}</div>
            <button style={btnBig} onClick={() => window.open(p.url, '_blank', 'noopener')}>Open Picker</button>
          </div>
        ))}
      </div>
    </div>
  );
}
