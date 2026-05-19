/** @type {import('next').NextConfig} */

// ── Content Security Policy ──────────────────────────────────────────────
// อนุญาตเฉพาะ CDN ที่เราใช้จริง — domain อื่น browser จะ block ให้อัตโนมัติ
// ลด attack surface ของ XSS (ถ้ามี vector ในอนาคต)
//
// ⚠️ หมายเหตุ:
//   - 'unsafe-eval' จำเป็นเพราะใช้ @babel/standalone แปลง JSX ในเบราว์เซอร์
//     (ตอน refactor ออกจาก iframe + babel-in-browser pattern จึงเอาออกได้)
//   - 'unsafe-inline' จำเป็นเพราะ Tailwind CDN inject style + มี <style> block
//     ใน public/app.html
const cspDirectives = [
  "default-src 'self'",
  // script: เปิดให้ CDN ที่รู้จัก + unsafe-eval (Babel) + unsafe-inline (Tailwind runtime)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com",
  // style: เปิดให้ Font Awesome + Google Fonts + inline styles
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
  // font: Google Fonts + Font Awesome
  "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  // image: self + data URI (base64) + Supabase storage (เผื่ออนาคต)
  "img-src 'self' data: blob: https://*.supabase.co",
  // connect: Supabase API + Realtime (websocket) + CDN source maps (สำหรับ DevTools)
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com",
  // frame: เฉพาะ iframe ของเราเอง (/app.html)
  "frame-src 'self'",
  // กัน <object>/<embed> — ไม่ใช้
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
