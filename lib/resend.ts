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

// Email sender — ใช้ onboarding@resend.dev ตอนนี้เพราะยังไม่ได้ verify domain
// ในอนาคต ถ้าซื้อ domain (เช่น tbcare.co.th) ก็มาเปลี่ยนเป็น noreply@tbcare.co.th
export const EMAIL_FROM = 'TB CARE & JOURNEY <onboarding@resend.dev>'

// รองรับหลาย email (คั่นด้วย comma ใน .env.local)
export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAIL || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean)
