import { createClient } from '@supabase/supabase-js'

// Service-role client — ใช้เฉพาะฝั่ง server (API routes)
// บายพาส RLS ทุกอย่าง → ใช้สำหรับ admin operations เช่น approve/reject user
// ห้ามใช้ฝั่ง browser เด็ดขาด!
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
