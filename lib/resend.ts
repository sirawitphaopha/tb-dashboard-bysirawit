import { Resend } from 'resend'

// Lazy init — Resend client สร้างตอนใช้งานจริง (runtime)
// ป้องกัน build error บน Cloudflare ที่ build env ไม่มี API key
let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || '')
  }
  return _resend
}

// Email sender — ใช้ noreply@tbjourney.care (domain verify ใน Resend แล้ว 2026-05-16)
export const EMAIL_FROM = 'TB CARE & JOURNEY <noreply@tbjourney.care>'

// รองรับหลาย email (คั่นด้วย comma ใน .env.local)
// fallback เป็น email แอดมินตายตัว กันกรณี env var หายหลัง deploy
export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAIL || 'siravitphoapha9928@gmail.com,siravitphoapha9928@hotmail.com')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean)
