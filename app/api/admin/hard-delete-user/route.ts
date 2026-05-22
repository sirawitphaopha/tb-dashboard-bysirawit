import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { userAccountDeletedEmail } from '@/lib/email-templates'

// ลบ user ถาวร — ใช้กรณีต้องการเคลียร์ rejected user ออกจากระบบ
// (อนุญาตเฉพาะ user ที่ status = 'rejected' เท่านั้น เพื่อความปลอดภัย)
export async function POST(req: NextRequest) {
  try {
    const { userId, reason } = await req.json()
    if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุเหตุผลในการลบบัญชี' }, { status: 400 })
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

    // ตรวจ caller = admin
    const { data: caller } = await admin
      .from('profiles')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single()
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'admin only' }, { status: 403 })
    }

    // ตรวจ target = rejected เท่านั้น (กันลบ admin/approved user เผลอ)
    const { data: target } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!target) return NextResponse.json({ error: 'user not found' }, { status: 404 })
    if (target.status !== 'rejected') {
      return NextResponse.json({ error: 'ลบถาวรได้เฉพาะ user ที่สถานะ rejected เท่านั้น' }, { status: 400 })
    }

    // หมายเหตุ: ไม่ต้องลบ tb_delete_requests / tb_patients.deleted_by /
    // tb_patients_deleted_log.deleted_by ด้วยตนเองแล้ว
    // เพราะ FK ทุกตัวตั้งเป็น ON DELETE SET NULL — ลบ profile ไป
    // ช่องอ้างอิงจะกลายเป็น null อัตโนมัติ และชื่อยังถูกเก็บไว้ใน *_name_at_* (snapshot)

    // จดลงสมุดบันทึกก่อนลบ (ขณะ user ยังอยู่) — หลังลบ user_id จะ set null แต่ snapshot เก็บชื่อไว้
    await admin.from('tb_user_action_log').insert({
      user_id: userId,
      action: 'delete',
      reason: trimmedReason,
      performed_by: user.id,
      first_name_at_action: target.first_name,
      last_name_at_action: target.last_name,
      email_at_action: target.email,
      profile_snapshot: target,
      performer_name_at_action: `${caller.first_name || ''} ${caller.last_name || ''}`.trim() || null,
    })

    // ลบทั้ง profile + auth user
    const { error: profErr } = await admin.from('profiles').delete().eq('id', userId)
    if (profErr) return NextResponse.json({ error: 'ลบ profile ไม่สำเร็จ: ' + profErr.message }, { status: 500 })

    const { error: authErr } = await admin.auth.admin.deleteUser(userId)
    if (authErr) return NextResponse.json({ error: 'ลบ auth user ไม่สำเร็จ: ' + authErr.message }, { status: 500 })

    // แจ้ง user ว่าบัญชีถูกลบถาวรแล้ว
    if (target.email) {
      const mail = userAccountDeletedEmail(target.first_name || 'ผู้ใช้')
      try {
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: target.email,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (e) { console.error('account-deleted email failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
