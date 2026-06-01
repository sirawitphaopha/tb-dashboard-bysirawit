/** @type {import('next').NextConfig} */

// ── Content Security Policy ──────────────────────────────────────────────
// v0.7.17.1 — tightened หลังออก iframe + Babel + CDN cascade
//
// เลิกใช้แล้ว (ลบทิ้งจาก CSP):
//   - 'unsafe-eval'              ← ใช้ตอน Babel transform JSX ใน browser (ไม่ใช้แล้ว — SWC build-time)
//   - cdn.tailwindcss.com        ← Tailwind compile-time (postcss)
//   - cdn.jsdelivr.net           ← Chart.js + Supabase ใช้ npm แล้ว
//   - unpkg.com                  ← React UMD ไม่ใช้แล้ว (Next.js ship)
//
// ยังต้องเปิด:
//   - 'unsafe-inline'            ← Next.js inject inline script เพื่อ hydrate
//   - cdnjs.cloudflare.com       ← FontAwesome CSS (layout.tsx)
//   - fonts.googleapis.com       ← Google Fonts (layout.tsx)
//   - fonts.gstatic.com          ← Google Fonts woff2 files
//   - *.supabase.co              ← Supabase API + Realtime
const cspDirectives = [
  "default-src 'self'",
  // script: เฉพาะ self + inline (Next.js hydration)
  "script-src 'self' 'unsafe-inline'",
  // style: self + inline + FontAwesome + Google Fonts
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
  // font: Google Fonts + FontAwesome
  "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  // image: self + data URI (base64) + Supabase storage (เผื่ออนาคต)
  "img-src 'self' data: blob: https://*.supabase.co",
  // connect: Supabase API + Realtime (websocket)
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  // frame: ไม่ใช้ iframe แล้ว
  "frame-src 'none'",
  // กัน <object>/<embed>
  "object-src 'none'",
  // base href ห้ามถูกเปลี่ยน
  "base-uri 'self'",
  // form action ส่งได้เฉพาะภายในเว็บเรา
  "form-action 'self'",
  // กัน clickjacking — ห้ามถูก embed ในเว็บอื่น
  "frame-ancestors 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy',   value: cspDirectives },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
];

const nextConfig = {
  allowedDevOrigins: ['*.vusercontent.net'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
