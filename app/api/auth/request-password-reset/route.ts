import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { passwordResetEmail } from '@/lib/email-templates'

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/request-password-reset
//
// รับ email → ส่งลิงก์รีเซ็ตทางอีเมล (ผ่าน Resend + Supabase magic link)
//
// กลไก:
//   1. Rate limit 3 ครั้ง/ชม. ต่ออีเมล (silent fail — กัน enumeration)
//   2. ใช้ admin.auth.admin.generateLink({ type: 'recovery' }) ของ Supabase
//      → ได้ action_link ที่มี token + redirect_to
//   3. ส่งเมลผ่าน Resend ด้วย template ไทยของเรา
//   4. Insert log (สำเร็จ/ไม่สำเร็จ)
//
// 🛡 Security: ตอบ success เสมอ ไม่บอกว่าอีเมลอยู่ในระบบหรือไม่ (กัน user enumeration)
// ─────────────────────────────────────────────────────────────────────────

const MAX_REQUESTS_PER_HOUR = 3
const WINDOW_HOURS = 1

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'กรุณากรอกอีเมล' }, { status: 400 })
    }

    const emailLower = email.trim().toLowerCase()
    const admin = createAdminClient()
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const ua = req.headers.get('user-agent') || null

    // ─── 1. Rate limit ─────────────────────────────────────
    const windowStart = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString()
    const { data: recentLogs } = await admin
      .from('tb_password_reset_log')
      .select('id')
      .eq('email_attempted', emailLower)
      .gte('requested_at', windowStart)

    if (recentLogs && recentLogs.length >= MAX_REQUESTS_PER_HOUR) {
      // 🛡 Silent fail — ตอบเหมือนสำเร็จ ไม่บอก rate limit (ไม่งั้นเป็น oracle)
      // เก็บ log ไว้ว่าโดน rate limit (succeeded=false, error_message=rate limit)
      await admin.from('tb_password_reset_log').insert({
        email_attempted: emailLower,
        ip_address: ip,
        user_agent: ua,
        email_sent: false,
        error_message: 'rate_limited',
      })
      return NextResponse.json({ success: true })
    }

    // ─── 2. หา user จากอีเมล ─────────────────────────────
    const { data: profile } = await admin
      .from('profiles')
      .select('id, first_name, email, status')
      .eq('email', emailLower)
      .single()

    // ถ้าไม่เจอ user → silent fail (ตอบ success แต่ไม่ส่งเมล)
    if (!profile) {
      await admin.from('tb_password_reset_log').insert({
        email_attempted: emailLower,
        ip_address: ip,
        user_agent: ua,
        email_sent: false,
        error_message: 'user_not_found',
      })
      return NextResponse.json({ success: true })
    }

    // ถ้า user ไม่ใช่ status approved → silent fail
    // (pending/rejected/deactivated → ห้ามรีเซ็ตรหัส)
    if (profile.status !== 'approved') {
      await admin.from('tb_password_reset_log').insert({
        email_attempted: emailLower,
        user_id: profile.id,
        ip_address: ip,
        user_agent: ua,
        email_sent: false,
        error_message: `user_status_${profile.status}`,
      })
      return NextResponse.json({ success: true })
    }

    // ─── 3. Generate recovery link ผ่าน Supabase admin ─────
    const redirectTo = `${req.nextUrl.origin}/reset-password/confirm`
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: emailLower,
      options: { redirectTo },
    })

    if (linkErr || !linkData?.properties?.hashed_token) {
      await admin.from('tb_password_reset_log').insert({
        email_attempted: emailLower,
        user_id: profile.id,
        ip_address: ip,
        user_agent: ua,
        email_sent: false,
        error_message: 'generate_link_failed: ' + (linkErr?.message || 'unknown'),
      })
      // ตอบ success ภายนอก แต่ log ไว้
      return NextResponse.json({ success: true })
    }

    // ใช้ token_hash + verifyOtp แทน action_link + PKCE
    // (admin-generated link ไม่มี code_verifier ใน browser ของ user → PKCE flow fail)
    const hashedToken = linkData.properties.hashed_token
    const actionLink = `${req.nextUrl.origin}/reset-password/confirm?token_hash=${hashedToken}&type=recovery`

    // ─── 4. ส่งเมลผ่าน Resend ──────────────────────────────
    const mail = passwordResetEmail(profile.first_name || 'ผู้ใช้', actionLink)
    let emailSent = false
    let errorMsg: string | null = null

    try {
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: profile.email,
        subject: mail.subject,
        html: mail.html,
      })
      emailSent = true
    } catch (e: any) {
      errorMsg = 'resend_failed: ' + (e?.message || 'unknown')
      console.error('password-reset email failed:', e)
    }

    // ─── 5. Insert log ─────────────────────────────────────
    await admin.from('tb_password_reset_log').insert({
      email_attempted: emailLower,
      user_id: profile.id,
      ip_address: ip,
      user_agent: ua,
      email_sent: emailSent,
      error_message: errorMsg,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('request-password-reset error:', e)
    // แม้ error ก็ตอบ success — กัน user enumeration จาก error message
    return NextResponse.json({ success: true })
  }
}
