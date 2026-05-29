import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/signout-others
//
// "ออกจากระบบทุกอุปกรณ์ ยกเว้นเครื่องนี้"
//   1. รับ session ปัจจุบันจาก cookie + supabase
//   2. supabase.auth.signOut({ scope: 'others' }) → Supabase revoke refresh
//      ของเครื่องอื่นทั้งหมด (เครื่องนี้ยัง active)
//   3. UPDATE tb_session_log ของแถวอื่น (ที่ยัง active) → forced_by_user
//   4. INSERT tb_logout_log ตามจำนวนแถวที่ปิด → forced_by_user
//
// หมายเหตุ: คืน count ของ session ที่ถูกปิด สำหรับใช้แสดงใน UI (B3)
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 })
    }

    const currentSessionId = req.cookies.get('tb_session_id')?.value || null
    const admin = createAdminClient()

    // ─── 1. ดึง session อื่นของ user นี้ที่ยัง active ───
    let query = admin
      .from('tb_session_log')
      .select('id, email, ip_address, user_agent, device_fp')
      .eq('user_id', user.id)
      .is('ended_at', null)
    if (currentSessionId) {
      query = query.neq('id', currentSessionId)
    }
    const { data: otherSessions } = await query
    const others = otherSessions ?? []

    // ─── 2. supabase signOut scope='others' (revoke refresh) ──
    // ทำก่อน → ถ้าล้มเหลวจะได้ไม่ไปแก้ตาราง
    let revoked = false
    try {
      await supabase.auth.signOut({ scope: 'others' })
      revoked = true
    } catch (e) {
      console.error('signOut(others) failed:', e)
    }

    if (others.length === 0) {
      return NextResponse.json({ success: true, count: 0, revoked })
    }

    const now = new Date().toISOString()
    const ids = others.map(s => s.id)

    // ─── 3. ปิดแถวใน tb_session_log ───
    await admin
      .from('tb_session_log')
      .update({ ended_at: now, end_reason: 'forced_by_user' })
      .in('id', ids)
      .is('ended_at', null)

    // ─── 4. INSERT tb_logout_log 1 แถวต่อ session ที่ปิด ───
    const logRows = others.map(s => ({
      user_id:     user.id,
      email:       s.email,
      logout_type: 'forced_by_user',
      ip_address:  s.ip_address,
      user_agent:  s.user_agent,
      session_id:  s.id,
      device_fp:   s.device_fp,
    }))
    await admin.from('tb_logout_log').insert(logRows)

    return NextResponse.json({ success: true, count: others.length, revoked })
  } catch (e: any) {
    console.error('signout-others error:', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 })
  }
}
