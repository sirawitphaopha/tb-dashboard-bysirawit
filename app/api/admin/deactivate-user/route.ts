import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM, ADMIN_EMAILS } from '@/lib/resend'
import { userDeactivatedEmail } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const { userId, reason } = await req.json()
    if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุเหตุผลในการปิดบัญชี' }, { status: 400 })
    }
    const trimmedReason = reason.trim()

    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: caller } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'admin only' }, { status: 403 })
    }

    // ปิดบัญชีได้เฉพาะ approved เท่านั้น — กันแก้ admin โดยไม่ตั้งใจ
    const { data: target } = await admin
      .from('profiles')
      .select('status, role, email, first_name')
      .eq('id', userId)
      .single()
    if (!target) return NextResponse.json({ error: 'user not found' }, { status: 404 })
    if (target.status !== 'approved') {
      return NextResponse.json({ error: 'ปิดบัญชีได้เฉพาะ user ที่สถานะ approved เท่านั้น' }, { status: 400 })
    }
    if (target.role === 'admin') {
      return NextResponse.json({ error: 'ไม่สามารถปิดบัญชี Admin ได้' }, { status: 400 })
    }

    const now = new Date()
    const { error } = await admin
      .from('profiles')
      .update({
        status: 'rejected',
        rejected_reason: trimmedReason,
        deactivated_at: now.toISOString(),
      })
      .eq('id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // จดลงสมุดบันทึก: ใครปิดบัญชีใคร เมื่อไหร่ เพราะอะไร
    await admin.from('tb_user_action_log').insert({
      user_id: userId,
      action: 'deactivate',
      reason: trimmedReason,
      performed_by: user.id,
    })

    // ส่งเมลแจ้ง user
    if (target.email) {
      const deletionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
      const mail = userDeactivatedEmail(
        target.first_name || 'ผู้ใช้',
        ADMIN_EMAILS[0],
        deletionDate,
        trimmedReason
      )
      try {
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: target.email,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (e) { console.error('deactivate email failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
