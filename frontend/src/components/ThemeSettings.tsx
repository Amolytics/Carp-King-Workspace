import React, { useState, useEffect, useRef } from 'react';

const THEME_KEY = 'customTheme';
const DEFAULT_PRIMARY = '#e0e0e0';
const DEFAULT_SECONDARY = '#23241a';
const DEFAULT_LOGO = null;

export default function ThemeSettings() {
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(DEFAULT_SECONDARY);
  const [logo, setLogo] = useState<string | null>(DEFAULT_LOGO);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      const t = JSON.parse(saved);
      setPrimary(t.primary || DEFAULT_PRIMARY);
      setSecondary(t.secondary || DEFAULT_SECONDARY);
      setLogo(t.logo || DEFAULT_LOGO);
    } else {
      setPrimary(DEFAULT_PRIMARY);
      setSecondary(DEFAULT_SECONDARY);
      setLogo(DEFAULT_LOGO);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(THEME_KEY, JSON.stringify({ primary, secondary, logo }));
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--secondary', secondary);
    if (logo) localStorage.setItem('customLogo', logo);
    else localStorage.removeItem('customLogo');
    alert('Theme saved!');
  };

  // Export theme as JSON
  const handleExport = () => {
    const theme = { primary, secondary, logo };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(theme));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'carp-king-theme.json';
    a.click();
  };

  // Import theme from JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const t = JSON.parse(ev.target?.result as string);
        setPrimary(t.primary || DEFAULT_PRIMARY);
        setSecondary(t.secondary || DEFAULT_SECONDARY);
        setLogo(t.logo || DEFAULT_LOGO);
        alert('Theme imported! Click Save Theme to apply.');
      } catch {
        alert('Invalid theme file.');
      }
    };
    reader.readAsText(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setLogo(dataUrl);
      // Try to extract dominant color from logo
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          // Simple color count for dominant color
          const colorCounts: Record<string, number> = {};
          for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i], g = imageData[i+1], b = imageData[i+2], a = imageData[i+3];
            if (a < 128) continue; // skip transparent
            const key = `${r},${g},${b}`;
            colorCounts[key] = (colorCounts[key] || 0) + 1;
          }
          let dominant = null, max = 0;
          for (const [key, count] of Object.entries(colorCounts)) {
            if (count > max) { dominant = key; max = count; }
          }
          if (dominant) {
            const [r, g, b] = dominant.split(',').map(Number);
            // Convert to hex
            const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
            setPrimary(hex);
          }
        } catch {}
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ background: 'var(--secondary, #23241a)', color: 'var(--primary, #e0e0e0)', padding: 24, borderRadius: 12, maxWidth: 400, margin: '24px auto' }}>
      <h2 style={{ marginBottom: 16 }}>Theme & Branding</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Primary Color: </label>
        <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Secondary Color: </label>
        <input type="color" value={secondary} onChange={e => setSecondary(e.target.value)} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Logo: </label>
        <input type="file" accept="image/*" onChange={handleLogoChange} ref={fileInputRef} />
        {logo && <div style={{ marginTop: 8 }}><img src={logo} alt="Logo preview" style={{ maxWidth: 120, maxHeight: 60, background: '#fff', borderRadius: 6 }} /></div>}
      </div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <button onClick={handleSave} style={{ padding: '8px 24px', borderRadius: 6, background: 'var(--primary, #e0e0e0)', color: 'var(--secondary, #23241a)', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Save Theme</button>
        <button onClick={handleExport} style={{ padding: '8px 16px', borderRadius: 6, background: '#bbb', color: '#23241a', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Export</button>
        <label style={{ display: 'inline-block', padding: 0 }}>
          <span style={{ padding: '8px 16px', borderRadius: 6, background: '#bbb', color: '#23241a', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Import</span>
          <input type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
        </label>
      </div>
      <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
        Tip: Upload a logo to auto-set the main color from your logo.
      </div>
    </div>
  );
}
