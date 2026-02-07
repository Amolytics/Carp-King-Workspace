import React, { useEffect, useRef, useState } from 'react';

const grid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 16 } as React.CSSProperties;
const card = { background: '#0b1220', color: '#fff', padding: 14, borderRadius: 12, minHeight: 260, display: 'flex', flexDirection: 'column', boxShadow: '0 6px 24px rgba(0,0,0,0.6)' } as React.CSSProperties;
const textarea = { flex: 1, resize: 'none', padding: 10, borderRadius: 8, border: '1px solid #16202b', background: '#071018', color: '#e6f0ff' } as React.CSSProperties;
const controls = { display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' } as React.CSSProperties;
const bigDisplay = { marginTop: 12, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#fff' } as React.CSSProperties;

function shuffle<T>(arr: T[]) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function makePoolFromRange(min: number, max: number) {
  const pool: string[] = [];
  import React from 'react';

  export default function LuckyDraws() {
    const tiles = [
      { title: 'Random', url: 'https://www.random.org/' },
      { title: 'Wooclap', url: 'https://www.wooclap.com/en/spin-the-wheel/' },
      { title: 'Wheel', url: 'https://wheelofnames.com/' },
      { title: 'HeySpinner', url: 'https://heyspinner.com/random-number-wheel' },
      { title: 'GigaCalc', url: 'https://www.gigacalculator.com/calculators/random-number-generator.php' },
      { title: 'Pinky', url: 'https://pinkylam.me/playground/random-name-picker/' },
    ];

    return (
      <div style={{ padding: 12 }}>
        <h2 style={{ textAlign: 'center' }}>Online Visual Pickers</h2>
        <p style={{ textAlign: 'center' }}>Quick-launch visual pickers (opens in new tab):</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          {tiles.map((p, idx) => (
            <div key={idx} style={{ background: '#071018', color: '#fff', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>{p.title}</div>
              <button onClick={() => window.open(p.url, '_blank', 'noopener')} style={{ padding: '10px 14px', borderRadius: 8, background: '#ffe066', border: 'none', fontWeight: 700 }}>Open Picker</button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <h2 style={{ margin: 0 }}>Lucky Draw</h2>
          <p style={{ marginTop: 8 }}>Inline pickers removed — use the Online Pickers above or open a picker in a new tab.</p>
        </div>
      </div>
    );
  }
    if (raw) {
