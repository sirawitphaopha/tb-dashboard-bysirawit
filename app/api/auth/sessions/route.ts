import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// ─────────────────────────────────────────────────────────────────────────
// GET /api/auth/sessions
//
// คืนรายการ session ที่ "ยัง active" ของ user ปัจจุบัน
//   - มาร์ก flag `is_current` ให้แถวที่ตรงกับ cookie tb_session_id
//   - เรียงจาก last_active_at ใหม่สุดก่อน (เครื่องที่กำลังใช้อยู่จะอยู่บนสุด)
// ─────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 })
  }

  const currentSessionId = req.cookies.get('tb_session_id')?.value || null
  const admin = createAdminClient()

  const { data: rows, error } = await admin
    .from('tb_session_log')
    .select('id, ip_address, device_label, device_type, started_at, last_active_at')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .order('last_active_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'โหลดข้อมูลล้มเหลว' }, { status: 500 })
  }

  const sessions = (rows ?? []).map(r => ({
    ...r,
    is_current: r.id === currentSessionId,
  }))

  return NextResponse.json({ sessions, current_session_id: currentSessionId })
}
