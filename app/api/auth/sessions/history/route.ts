import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// ─────────────────────────────────────────────────────────────────────────
// GET /api/auth/sessions/history
//
// คืนประวัติ session ทั้งหมดของ user (รวมที่จบแล้ว)
//   - เรียง started_at desc
//   - จำกัด 100 รายการ
//
// v0.7.15.0 — ใช้ server client + RLS ("session_log_select_own": user_id = auth.uid())
//             แทน admin client → เร็วกว่า + ปลอดภัยกว่า (ไม่ใช้ service role โดยไม่จำเป็น)
// ─────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 })
  }

  // ใช้ supabase (server client) — RLS policy "session_log_select_own" filter ให้แล้ว
  const { data: rows, error } = await supabase
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
