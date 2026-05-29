import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/signout
//
// ออกจากระบบ + บันทึก log
//   - บันทึก user_id/email/IP/UA ก่อน signOut (ไม่งั้น session หาย)
//   - signOut จะลบ session ใน Supabase + clear cookies
//   - logout_type ตอนนี้รองรับแค่ 'manual' (เริ่มต้น)
//     session_expired จะทำพร้อม Session Activity Log ในข้อ B
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const ip = req.headers.get('cf-connecting-ip')
          || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || null
  const ua = req.headers.get('user-agent') || null

  // ดึง user ก่อน signOut เพื่อเก็บ id/email
  let userId: string | null = null
  let email: string | null = null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      email = user.email ?? null
    }
  } catch {
    // ไม่มี session ก็ไม่เป็นไร (อาจถูกเรียกซ้ำ)
  }

  // อ่าน tb_session_id ก่อน signOut เพื่อปิด session row ใน tb_session_log
  const sessionId = req.cookies.get('tb_session_id')?.value || null

  // ดึง device_fp จาก session row (เพื่อเก็บลง logout log)
  let deviceFp: string | null = null
  if (sessionId) {
    const { data: srow } = await admin
      .from('tb_session_log')
      .select('device_fp')
      .eq('id', sessionId)
      .maybeSingle()
    deviceFp = srow?.device_fp ?? null
  }

  // signOut เสมอ ไม่ว่ามี session หรือไม่
  await supabase.auth.signOut()

  // บันทึก log เฉพาะถ้ามี user (ไม่อยากเก็บ noise)
  if (userId) {
    await admin.from('tb_logout_log').insert({
      user_id:     userId,
      email,
      logout_type: 'manual',
      ip_address:  ip,
      user_agent:  ua,
      session_id:  sessionId,
      device_fp:   deviceFp,
    })
  }

  // ปิด session row (Session Activity Log — B1)
  if (sessionId) {
    await admin
      .from('tb_session_log')
      .update({
        ended_at:   new Date().toISOString(),
        end_reason: 'manual',
      })
      .eq('id', sessionId)
      .is('ended_at', null)   // กันเขียนทับ session ที่ปิดไปแล้ว
  }

  // ลบ cookie tb_session_id
  const response = NextResponse.json({ success: true })
  response.cookies.set('tb_session_id', '', {
    httpOnly: true,
    path:     '/',
    maxAge:   0,
  })
  return response
}
