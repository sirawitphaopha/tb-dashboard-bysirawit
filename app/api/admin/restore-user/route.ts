import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { userRestoredEmail } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const { userId, reason } = await req.json()
    if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุเหตุผลในการกู้คืน' }, { status: 400 })
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
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single()
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'admin only' }, { status: 403 })
    }

    const { data: target } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!target) return NextResponse.json({ error: 'user not found' }, { status: 404 })

    // ข้อ 12: กู้คืนได้เฉพาะบัญชีที่ "ถูกปิดบัญชีโดย Admin" เท่านั้น
    // ใช้ deactivated_at เป็นป้ายแยกประเภท (มีวันที่ = ถูกปิดบัญชี ไม่ใช่ถูกปฏิเสธปกติ)
    // ตรงกับเงื่อนไขปุ่มกู้คืนใน UI — tb-modals.jsx: isDeactivated = !!p.deactivated_at
    // กันการกดผิด/ยิงคำสั่งตรง → ส่งเมลผิด หรือดึงคนที่ไม่เคยอนุมัติเข้าเป็น approved
    if (!target.deactivated_at) {
      const msg =
        target.status === 'approved' ? 'บัญชีนี้ใช้งานได้ตามปกติอยู่แล้ว ไม่จำเป็นต้องกู้คืน'
        : target.status === 'pending' ? 'บัญชีนี้อยู่ระหว่างรออนุมัติ กรุณาใช้ปุ่มอนุมัติแทน'
        : 'บัญชีนี้ถูกปฏิเสธ (ไม่ใช่การปิดบัญชี) — หากต้องการให้ผู้ใช้กลับเข้าระบบ กรุณาใช้ปุ่ม "ปลดล็อก" เพื่อให้สมัครใหม่'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { error } = await admin
      .from('profiles')
      .update({
        status: 'approved',
        rejected_reason: null,
        deactivated_at: null,
      })
      .eq('id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // จดลงสมุดบันทึก: ใครกู้คืนบัญชีใคร เมื่อไหร่ เพราะอะไร (+ snapshot ชื่อ กันหายตอนลบ user)
    await admin.from('tb_user_action_log').insert({
      user_id: userId,
      action: 'restore',
      reason: trimmedReason,
      performed_by: user.id,
      first_name_at_action: target.first_name,
      last_name_at_action: target.last_name,
      email_at_action: target.email,
      profile_snapshot: target,
      performer_name_at_action: `${caller.first_name || ''} ${caller.last_name || ''}`.trim() || null,
    })

    // ส่งเมลแจ้ง user ว่าบัญชีกู้คืนแล้ว
    if (target.email) {
      const mail = userRestoredEmail(target.first_name || 'ผู้ใช้', req.nextUrl.origin, trimmedReason)
      try {
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: target.email,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (e) { console.error('restore email failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
