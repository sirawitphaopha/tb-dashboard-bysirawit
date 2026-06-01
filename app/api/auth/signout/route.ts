import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/signout
//
// ออกจากระบบ + บันทึก log
//
// v0.7.17.1 — optimize sequential → parallel + fire-and-forget
//   ก่อน: getUser → device_fp lookup → signOut → logout_log insert → session_log update
//         5 ops sequential ~500-1000ms total
//   หลัง: getUser + device_fp (parallel) → signOut → response (fire-and-forget logs)
//         2-3 ops critical path ~150-300ms (logs ไม่ block response)
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const ip = req.headers.get('cf-connecting-ip')
          || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || null
  const ua = req.headers.get('user-agent') || null

  // อ่าน tb_session_id ก่อน signOut เพื่อปิด session row ใน tb_session_log
  const sessionId = req.cookies.get('tb_session_id')?.value || null

  // v0.7.17.1 — ดึง user + device_fp ขนาน (ไม่ต้อง sequential)
  const fetchUser = async () => {
    try {
      const { data } = await supabase.auth.getUser()
      return data
    } catch { return { user: null } }
  }
  const fetchDeviceFp = async (): Promise<string | null> => {
    if (!sessionId) return null
    try {
      const { data } = await admin
        .from('tb_session_log')
        .select('device_fp')
        .eq('id', sessionId)
        .maybeSingle()
      return (data?.device_fp as string | null) ?? null
    } catch { return null }
  }

  const [userData, deviceFp] = await Promise.all([fetchUser(), fetchDeviceFp()])

  const userId = userData?.user?.id ?? null
  const email  = userData?.user?.email ?? null

  // signOut เสมอ ไม่ว่ามี session หรือไม่ (critical path — ต้องเสร็จก่อน return)
  await supabase.auth.signOut()

  // v0.7.17.1 — Fire-and-forget log writes (ไม่ block response)
  // log ไม่กระทบ user perception ของ logout speed — ทำเบื้องหลังได้
  if (userId) {
    admin.from('tb_logout_log').insert({
      user_id:     userId,
      email,
      logout_type: 'manual',
      ip_address:  ip,
      user_agent:  ua,
      session_id:  sessionId,
      device_fp:   deviceFp,
    }).then(() => {}, (err: unknown) => console.error('[signout] logout_log insert failed', err))
  }

  if (sessionId) {
    admin
      .from('tb_session_log')
      .update({
        ended_at:   new Date().toISOString(),
        end_reason: 'manual',
      })
      .eq('id', sessionId)
      .is('ended_at', null)   // กันเขียนทับ session ที่ปิดไปแล้ว
      .then(() => {}, (err: unknown) => console.error('[signout] session_log update failed', err))
  }

  // ลบ cookie tb_session_id + return response ทันที (ไม่รอ log writes)
  const response = NextResponse.json({ success: true })
  response.cookies.set('tb_session_id', '', {
    httpOnly: true,
    path:     '/',
    maxAge:   0,
  })
  return response
}
