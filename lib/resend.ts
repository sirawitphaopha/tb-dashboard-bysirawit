import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

// Email sender — ใช้ onboarding@resend.dev ตอนนี้เพราะยังไม่ได้ verify domain
// ในอนาคต ถ้าซื้อ domain (เช่น tbcare.co.th) ก็มาเปลี่ยนเป็น noreply@tbcare.co.th
export const EMAIL_FROM = 'TB CARE & JOURNEY <onboarding@resend.dev>'

// รองรับหลาย email (คั่นด้วย comma ใน .env.local)
export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAIL || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean)
