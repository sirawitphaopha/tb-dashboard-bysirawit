import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// ─────────────────────────────────────────────────────────────────────────
// GET /api/auth/sessions/history
//
// คืนประวัติ session ทั้งหมดของ user (รวมที่จบแล้ว)
//   - เรียง started_at desc
//   - จำกัด 100 รายการ
// ─────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from('tb_session_log')
    .select('id, ip_address, device_label, device_type, started_at, last_active_at, ended_at, end_reason')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: 'โหลดข้อมูลล้มเหลว' }, { status: 500 })
  }

  return NextResponse.json({ sessions: rows ?? [] })
}
