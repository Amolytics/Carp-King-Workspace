import React from 'react';

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 16 } as React.CSSProperties;

export default function LuckyDraws(): JSX.Element {
  const tiles = [
    { title: 'Random.org', url: 'https://www.random.org/' },
    { title: 'Wooclap', url: 'https://www.wooclap.com/en/spin-the-wheel/' },
    { title: 'Wheel of Names', url: 'https://wheelofnames.com/' },
    { title: 'HeySpinner', url: 'https://heyspinner.com/random-number-wheel' },
    { title: 'GigaCalc', url: 'https://www.gigacalculator.com/calculators/random-number-generator.php' },
    { title: 'Pinky', url: 'https://pinkylam.me/playground/random-name-picker/' },
  ];

  return (
    <div style={{ padding: 12 }}>
      <h2 style={{ textAlign: 'center' }}>Online Visual Pickers</h2>
      <p style={{ textAlign: 'center' }}>Quick-launch visual pickers (opens in new tab):</p>
      <div style={gridStyle}>
        {tiles.map((p, idx) => (
          <div key={idx} style={{ background: '#071018', color: '#fff', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>{p.title}</div>
            <button onClick={() => window.open(p.url, '_blank', 'noopener')} style={{ padding: '8px 12px', borderRadius: 8, background: '#ffe066', border: 'none', fontWeight: 700 }}>Open Picker</button>
          </div>
        ))}
      </div>
    </div>
  );
}
