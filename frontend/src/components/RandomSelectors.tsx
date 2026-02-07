import React from 'react';

const containerStyle: React.CSSProperties = { padding: 16 };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 };
const btnStyle: React.CSSProperties = { padding: '12px 14px', fontSize: 16, borderRadius: 6, cursor: 'pointer' };

export default function RandomSelectors() {
  const buttons: { label: string; url: string }[] = [
    { label: 'Random.org', url: 'https://www.random.org/' },
    { label: 'Calculator.net RNG', url: 'https://www.calculator.net/random-number-generator.html' },
    { label: 'NumberGenerator.org', url: 'https://www.numbergenerator.org/random-number-generator' },
    { label: 'MiniWebTool', url: 'https://miniwebtool.com/random-number-generator/' },
    { label: 'RandomNumberGenerator.com', url: 'https://www.randomnumbergenerator.com/' },
    { label: 'RapidTables RNG', url: 'https://www.rapidtables.com/tools/random-number-generator.html' },
  ];

  return (
    <div style={containerStyle}>
      <h2>Random Number Selectors</h2>
      <p>Click any button to open a separate random-number selector page in a new tab.</p>
      <div style={gridStyle}>
        {buttons.map((b, i) => (
          <button
            key={i}
            style={btnStyle}
            onClick={() => window.open(b.url, '_blank', 'noopener')}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
