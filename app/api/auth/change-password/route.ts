import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { passwordChangedEmail } from '@/lib/email-templates'

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/change-password
//
// 1. Auth: รับ access token (Bearer)
// 2. Rate limit: ห้ามเกิน 3 ครั้ง / 24 ชั่วโมง
// 3. Verify รหัสเดิมด้วย signInWithPassword
// 4. Update รหัสใหม่ผ่าน admin API (revoke session อื่นๆ ทั้งหมด)
// 5. Insert log
// 6. ส่งเมลแจ้งเตือน
// ─────────────────────────────────────────────────────────────────────────

const MAX_CHANGES_PER_DAY = 3
const WINDOW_HOURS = 24

export async function POST(req: NextRequest) {
  try {
    const { oldPassword, newPassword } = await req.json()
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'missing oldPassword or newPassword' }, { status: 400 })
    }

    // ─── 1. Auth: ดึง user จาก Bearer token ─────────────────
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const token = authHeader.substring(7)
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { data: { user }, error: authErr } = await sb.auth.getUser(token)
    if (authErr || !user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const userEmail = user.email
    if (!userEmail) {
      return NextResponse.json({ error: 'no email on account' }, { status: 400 })
    }

    const admin = createAdminClient()
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const ua = req.headers.get('user-agent') || null

    // helper: log attempt (สำเร็จ/พลาด)
    const logAttempt = async (success: boolean, failureReason: string | null) => {
      await admin.from('tb_password_change_log').insert({
        user_id: user.id,
        action: 'change',
        success,
        failure_reason: failureReason,
        ip_address: ip,
        user_agent: ua,
      })
    }

    // ─── 2. Rate limit: นับเฉพาะ "success" ใน 24 ชม. ที่ผ่านมา ───
    // ไม่นับ failed attempts (ไม่งั้น user ที่พิมพ์ผิดจะโดน lock)
    const windowStart = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString()
    const { data: recentLogs, error: countErr } = await admin
      .from('tb_password_change_log')
      .select('changed_at')
      .eq('user_id', user.id)
      .eq('action', 'change')
      .eq('success', true)
      .gte('changed_at', windowStart)
      .order('changed_at', { ascending: true })

    if (countErr) {
      console.error('rate limit check failed:', countErr)
      return NextResponse.json({ error: 'ไม่สามารถตรวจสอบประวัติได้ กรุณาลองใหม่' }, { status: 500 })
    }

    if (recentLogs && recentLogs.length >= MAX_CHANGES_PER_DAY) {
      const earliest = new Date(recentLogs[0].changed_at)
      const nextAvailable = new Date(earliest.getTime() + WINDOW_HOURS * 3600 * 1000)
      const nextStr = nextAvailable.toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      })
      await logAttempt(false, 'rate_limited')
      return NextResponse.json(
        { error: `คุณเปลี่ยนรหัสผ่านครบ ${MAX_CHANGES_PER_DAY} ครั้งใน ${WINDOW_HOURS} ชั่วโมงแล้ว กรุณาลองอีกครั้งหลัง ${nextStr} น.` },
        { status: 429 }
      )
    }

    // ─── 3. Verify รหัสเดิม ─────────────────────────────────
    const verifyClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { error: verifyErr } = await verifyClient.auth.signInWithPassword({
      email: userEmail,
      password: oldPassword,
    })
    if (verifyErr) {
      await logAttempt(false, 'wrong_old_password')
      return NextResponse.json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' }, { status: 400 })
    }

    // ─── 4. Update รหัสใหม่ผ่าน admin (revoke session อื่นๆ) ──
    const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })
    if (updateErr) {
      await logAttempt(false, 'update_failed')
      return NextResponse.json({ error: 'เกิดข้อผิดพลาด: ' + updateErr.message }, { status: 500 })
    }

    // ─── 5. Insert log (success) ───────────────────────────
    await logAttempt(true, null)

    // ─── 6. ส่งเมลแจ้งเตือน (ไม่ throw ถ้า fail) ─────────────
    try {
      const { data: profile } = await admin
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single()

      const when = new Date().toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }) + ' น.'

      const mail = passwordChangedEmail(profile?.first_name || 'ผู้ใช้', when, req.nextUrl.origin)
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: userEmail,
        subject: mail.subject,
        html: mail.html,
      })
    } catch (e) {
      console.error('password-changed email failed:', e)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
