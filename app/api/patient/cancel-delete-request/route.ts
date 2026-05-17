import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM, ADMIN_EMAILS } from '@/lib/resend'
import { adminDeleteRequestCancelledEmail } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const { patientId, patientName, patientHn } = await req.json()
    if (!patientId) return NextResponse.json({ error: 'missing patientId' }, { status: 400 })

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

    // ดึงชื่อผู้ขอลบ
    const { data: profile } = await admin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()
    const requesterName = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'ผู้ใช้'
      : 'ผู้ใช้'

    // อัปเดต status = 'cancelled' (ใช้ admin client ไม่ติด RLS)
    const { data: updated, error } = await admin
      .from('tb_delete_requests')
      .update({ status: 'cancelled' })
      .eq('patient_id', patientId)
      .eq('requested_by', user.id)
      .eq('status', 'pending')
      .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'no pending request found' }, { status: 404 })
    }

    // ส่งเมลแจ้ง Admin
    if (ADMIN_EMAILS.length > 0) {
      const mail = adminDeleteRequestCancelledEmail(
        patientName || 'ไม่ทราบชื่อ',
        patientHn || '',
        requesterName
      )
      try {
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: ADMIN_EMAILS,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (e) { console.error('cancel-delete-request email failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
