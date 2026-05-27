import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { passwordChangedEmail } from '@/lib/email-templates'

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/complete-password-reset
//
// ใช้หลังจาก user verify recovery token สำเร็จแล้ว (มี session ชั่วคราว)
// → รับรหัสใหม่ → enforce strength ฝั่ง server → update → log + email
//
// 1. Auth: รับ Bearer token (จาก recovery session)
// 2. Validate: password strength ≥ 4/5 เกณฑ์ + ยาว ≥ 8 ตัว
// 3. Update password ผ่าน admin.auth.admin.updateUserById
// 4. Insert tb_password_change_log
// 5. ส่งเมลแจ้งเตือนผ่าน Resend
// ─────────────────────────────────────────────────────────────────────────

function checkPasswordStrength(pw: string) {
  return {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  }
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const ua = req.headers.get('user-agent') || null

  // helper: log attempt (action='reset' เพราะใช้ในหน้าลืมรหัส)
  const logAttempt = async (userId: string | null, success: boolean, failureReason: string | null) => {
    await admin.from('tb_password_change_log').insert({
      user_id: userId,
      action: 'reset',
      success,
      failure_reason: failureReason,
      ip_address: ip,
      user_agent: ua,
    })
  }

  try {
    const { newPassword } = await req.json()
    if (!newPassword || typeof newPassword !== 'string') {
      await logAttempt(null, false, 'missing_password')
      return NextResponse.json({ error: 'missing newPassword' }, { status: 400 })
    }

    // ─── 1. Auth: ตรวจ Bearer token ─────────────────────────
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await logAttempt(null, false, 'invalid_token')
      return NextResponse.json({ error: 'ลิงก์หมดอายุ กรุณาขอลิงก์ใหม่' }, { status: 401 })
    }
    const token = authHeader.substring(7)
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { data: { user }, error: authErr } = await sb.auth.getUser(token)
    if (authErr || !user) {
      await logAttempt(null, false, 'invalid_token')
      return NextResponse.json({ error: 'ลิงก์หมดอายุ กรุณาขอลิงก์ใหม่' }, { status: 401 })
    }
    const userEmail = user.email
    if (!userEmail) {
      await logAttempt(user.id, false, 'no_email')
      return NextResponse.json({ error: 'ไม่พบอีเมลของบัญชีนี้' }, { status: 400 })
    }

    // ─── 2. Enforce password strength ฝั่ง server ───────────
    const checks = checkPasswordStrength(newPassword)
    const passed = Object.values(checks).filter(Boolean).length
    if (passed < 4 || !checks.length) {
      await logAttempt(user.id, false, 'weak_password')
      return NextResponse.json(
        { error: 'รหัสผ่านยังไม่ผ่านเกณฑ์ความปลอดภัย (ต้องผ่านอย่างน้อย 4/5 ข้อ และมีความยาว 8 ตัวอักษรขึ้นไป)' },
        { status: 400 }
      )
    }

    // ─── 3. Update password ผ่าน admin ────────────────────
    const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })
    if (updateErr) {
      await logAttempt(user.id, false, 'update_failed')
      return NextResponse.json({ error: 'เกิดข้อผิดพลาด: ' + updateErr.message }, { status: 500 })
    }

    // ─── 4. Insert log (success) ───────────────────────────
    await logAttempt(user.id, true, null)

    // ─── 5. ส่งเมลแจ้งเตือน (ไม่ throw ถ้า fail) ──────────────
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
      console.error('reset-complete email failed:', e)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
