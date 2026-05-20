import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM, ADMIN_EMAILS } from '@/lib/resend'
import { adminEditRequestEmail, userEditRequestReceivedEmail } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const { field_name, field_label, old_value, new_value, reason } = await req.json()
    if (!field_name || !field_label || !new_value) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
    }

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

    // ดึงชื่อ user
    const { data: profile } = await admin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    const userName = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : user.email || 'ผู้ใช้'

    // บันทึก request ลง DB
    const { error: insertErr } = await admin
      .from('tb_profile_edit_requests')
      .insert({
        user_id: user.id,
        field_name,
        field_label,
        old_value: old_value || null,
        new_value,
        reason: reason || null,
        status: 'pending',
      })
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    // ส่งเมลแจ้ง admin
    try {
      const mail = adminEditRequestEmail(
        userName, field_label,
        old_value || '', new_value,
        reason || '',
        req.nextUrl.origin
      )
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: ADMIN_EMAILS,
        subject: mail.subject,
        html: mail.html,
      })
    } catch (e) { console.error('request-edit email failed:', e) }

    // ส่งเมลยืนยันกลับให้ user (เก็บไว้เป็นหลักฐานว่าขอแก้อะไรไป)
    try {
      if (user.email) {
        const firstName = profile?.first_name || 'ผู้ใช้'
        const mail = userEditRequestReceivedEmail(
          firstName, field_label,
          old_value || '', new_value, reason || ''
        )
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject: mail.subject,
          html: mail.html,
        })
      }
    } catch (e) { console.error('request-edit user confirm email failed:', e) }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
