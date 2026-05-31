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

    // v0.7.15.0 — fire-and-forget 2 emails (admin + user confirmation) → response ทันที
    try {
      const adminMail = adminEditRequestEmail(
        userName, field_label,
        old_value || '', new_value,
        reason || '',
        req.nextUrl.origin
      )
      getResend().emails.send({
        from: EMAIL_FROM,
        to: ADMIN_EMAILS,
        subject: adminMail.subject,
        html: adminMail.html,
      }).catch(e => console.error('request-edit admin email failed:', e))

      if (user.email) {
        const firstName = profile?.first_name || 'ผู้ใช้'
        const userMail = userEditRequestReceivedEmail(
          firstName, field_label,
          old_value || '', new_value, reason || ''
        )
        getResend().emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject: userMail.subject,
          html: userMail.html,
        }).catch(e => console.error('request-edit user confirm email failed:', e))
      }
    } catch (e) { console.error('request-edit email prep failed:', e) }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
