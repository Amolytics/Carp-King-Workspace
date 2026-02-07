import React, { useEffect, useRef, useState } from 'react';

const grid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 16 } as React.CSSProperties;
const card = { background: '#0b1220', color: '#fff', padding: 14, borderRadius: 12, minHeight: 260, display: 'flex', flexDirection: 'column', boxShadow: '0 6px 24px rgba(0,0,0,0.6)' } as React.CSSProperties;
const textarea = { flex: 1, resize: 'none', padding: 10, borderRadius: 8, border: '1px solid #16202b', background: '#071018', color: '#e6f0ff' } as React.CSSProperties;
const controls = { display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' } as React.CSSProperties;
const bigDisplay = { marginTop: 12, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#fff' } as React.CSSProperties;

function shuffle<T>(arr: T[]) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function makePoolFromRange(min: number, max: number) {
  const pool: string[] = [];
  for (let i = min; i <= max; i++) pool.push(String(i));
  return pool;
}

function useConfetti() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  function burst() {
    if (!containerRef.current) return;
    const container = containerRef.current;
    for (let i = 0; i < 24; i++) {
      const el = document.createElement('div');
      el.className = 'ck-confetti';
      el.style.left = `${Math.random() * 100}%`;
      el.style.background = ['#ffe066', '#ff7ab6', '#7afcff', '#8b5cf6'][Math.floor(Math.random() * 4)];
      el.style.transform = `translateY(0) rotate(${Math.random() * 360}deg)`;
      container.appendChild(el);
      (function removeLater(node: HTMLElement) { setTimeout(() => { node.style.opacity = '0'; setTimeout(() => node.remove(), 600); }, 1100 + Math.random() * 1000); })(el);
    }
  }
  return { containerRef, burst };
}

export default function LuckyDraws() {
  const initial = Array.from({ length: 6 }, () => ({ text: '', mode: 'list', min: 1, max: 100, winners: [] as string[] }));
  const [pickers, setPickers] = useState(initial);
  const [display, setDisplay] = useState<string[]>(Array.from({ length: 6 }, () => 'No winner yet'));
  const [running, setRunning] = useState<boolean[]>(Array.from({ length: 6 }, () => false));
  const cyclesRef = useRef<Record<number, number | null>>({});
  const { containerRef, burst } = useConfetti();

  useEffect(() => {
    const raw = localStorage.getItem('lucky.draws.v1');
    if (raw) {
      try { const parsed = JSON.parse(raw); setPickers(parsed); } catch (e) {}
    }
  }, []);
  useEffect(() => { try { localStorage.setItem('lucky.draws.v1', JSON.stringify(pickers)); } catch (e) {} }, [pickers]);

  function updatePicker(i: number, patch: Partial<{ text: string; mode: string; min: number; max: number }>) {
    const copy = pickers.slice(); copy[i] = { ...copy[i], ...patch }; setPickers(copy);
  }

  function parseLines(s: string) { return s.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0); }

  function stopCycle(i: number) {
    const id = cyclesRef.current[i]; if (id) { window.clearInterval(id); cyclesRef.current[i] = null; }
  }

  async function doSpin(i: number, winnerCount = 1) {
    if (running[i]) return;
    let pool: string[] = [];
    const p = pickers[i];
    if (p.mode === 'list') pool = parseLines(p.text);
    else pool = makePoolFromRange(Math.min(p.min, p.max), Math.max(p.min, p.max));
    if (!pool.length) return alert('Add names or ticket numbers (or set a valid range)');
    setRunning(prev => { const c = prev.slice(); c[i] = true; return c; });

    // animation: fast cycling -> slow -> stop on winner(s)
    const displayTick = (val: string) => setDisplay(prev => { const c = prev.slice(); c[i] = val; return c; });
    const totalFrames = 220 + Math.floor(Math.random() * 80);
    let frame = 0;
    let last = '';

    // create a random sequence biased to avoid repeats quickly
    const seq = [] as string[];
    const localPool = pool.slice();
    for (let k = 0; k < Math.max(1, winnerCount); k++) {
      seq.push(...shuffle(localPool));
    }

    return new Promise<void>(resolve => {
      const speedFn = (t: number) => {
        // returns ms delay between frames; accelerate then decelerate
        const p = t / totalFrames;
        // ease-out cubic for slow end
        const delay = 8 + Math.pow(p, 2.2) * 900; // from 8ms -> ~908ms
        return delay;
      };
      let runningTimer: number | null = null;
      function step() {
        frame++;
        const idx = Math.floor(Math.random() * seq.length);
        const val = seq[idx] || pool[Math.floor(Math.random() * pool.length)];
        if (val !== last) { displayTick(val); last = val; }
        if (frame >= totalFrames) {
          // finalize winners
          stopCycle(i);
          const shuffled = shuffle(pool).slice(0, Math.max(1, Math.min(pool.length, winnerCount)));
          setTimeout(() => {
            // final reveal animation
            displayTick(shuffled.join(' • '));
            // small confetti burst
            burst();
            setPickers(prev => { const c = prev.slice(); (c[i] as any).winners = shuffled; return c; });
            setRunning(prev => { const c = prev.slice(); c[i] = false; return c; });
            resolve();
          }, 300);
          return;
        }
        const delay = speedFn(frame);
        runningTimer = window.setTimeout(step, delay);
      }
      step();
      cyclesRef.current[i] = runningTimer as unknown as number;
    });
  }

  function clearPicker(i: number) { updatePicker(i, { text: '' }); setDisplay(prev => { const c = prev.slice(); c[i] = 'No winner yet'; return c; }); }
  function sample(i: number) { updatePicker(i, { text: ['Alice','Bob','Charlie','Dana','Eve','Frank','Grace','Heidi','Ivan','Judy'].join('\n') }); }

  return (
    <div style={{ padding: 12 }}>
      <h2>Online Visual Pickers</h2>
      <p>Quick-launch visual pickers (opens in new tab):</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        {[
          { title: 'Random', url: 'https://www.random.org/' },
          { title: 'Wooclap', url: 'https://www.wooclap.com/en/spin-the-wheel/' },
          { title: 'Wheel', url: 'https://wheelofnames.com/' },
          { title: 'HeySpinner', url: 'https://heyspinner.com/random-number-wheel' },
          { title: 'GigaCalc', url: 'https://www.gigacalculator.com/calculators/random-number-generator.php' },
          { title: 'Pinky', url: 'https://pinkylam.me/playground/random-name-picker/' },
        ].map((p, idx) => (
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

      <style>{`
        .ck-confetti{ position:absolute; top:10px; width:10px; height:18px; border-radius:3px; opacity:1; transform-origin:center; animation: ck-fall 1.6s linear forwards; z-index:9999 }
        @keyframes ck-fall { to { transform: translateY(520px) rotate(360deg); opacity:0 } }
      `}</style>
    </div>
  );
}
