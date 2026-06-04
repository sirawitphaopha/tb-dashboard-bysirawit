// helper สำหรับ API รูปผู้ป่วย — auth + เช็คสิทธิ์ (approved/admin) + ชื่อ bucket
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

export const PATIENT_BUCKET = process.env.R2_BUCKET_PATIENT || 'tb-patient-images'

// ดึง user ปัจจุบัน + สถานะ approved/admin + admin client (ไว้ query ข้าม RLS)
export async function getRequester(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null as any, isApproved: false, isAdmin: false, admin: null as any }
  const admin = createAdminClient()
  const { data: prof } = await admin.from('profiles').select('status, role').eq('id', user.id).maybeSingle()
  return {
    user,
    isApproved: prof?.status === 'approved',
    isAdmin: prof?.role === 'admin',
    admin,
  }
}
