'use client';

import { useEffect, useRef } from 'react';

// Inline the raw content of tb-data.js, tb-modals.jsx, tb-app.jsx
// by loading them as browser scripts via the public folder.
// All original logic is preserved 100%.

export default function TBApp() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    // Create root div for React CDN app
    const root = document.getElementById('root');
    if (!root) return;

    const loadScript = (src: string, type?: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        if (type) s.type = type;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load ' + src));
        document.body.appendChild(s);
      });

    (async () => {
      try {
        // 1. Load React 18 (UMD) from CDN
        await loadScript('https://unpkg.com/react@18.3.1/umd/react.development.js');
        await loadScript('https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js');

        // 2. Load Babel standalone for JSX transpilation
        await loadScript('https://unpkg.com/@babel/standalone@7.29.0/babel.min.js');

        // 3. Load Chart.js
        await loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js');

        // 4. Load app data (plain JS)
        await loadScript('/tb-data.js');

        // 5. Load modals (Babel JSX)
        await loadScript('/tb-modals.jsx', 'text/babel');

        // 6. Load main app (Babel JSX) — this renders into #root
        await loadScript('/tb-app.jsx', 'text/babel');
      } catch (err) {
        console.error('[TBApp] Script load error:', err);
      }
    })();
  }, []);

  return (
    <div
      id="root"
      className="w-full h-screen"
      style={{ fontFamily: "'Sarabun', sans-serif" }}
    />
  );
}
