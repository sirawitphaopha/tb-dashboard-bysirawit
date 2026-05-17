import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { deleteRequestApprovedEmail, deleteRequestRejectedEmail, deleteRequestRestoredEmail, deleteRequestHardDeletedEmail } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const { requestedBy, patientName, action, note, patientId } = await req.json()
    if (!requestedBy || !patientName || !action) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 })
    }

    // เช็คว่าคนเรียก API เป็น admin
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
    const { data: caller } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (caller?.role !== 'admin') return NextResponse.json({ error: 'admin only' }, { status: 403 })

    // หาชื่อและอีเมลของ user ที่ขอลบ
    const { data: authData } = await admin.auth.admin.getUserById(requestedBy)
    const userEmail = authData?.user?.email
    const { data: profile } = await admin.from('profiles').select('first_name').eq('id', requestedBy).single()
    const firstName = profile?.first_name || 'ผู้ใช้'

    if (userEmail) {
      const mail = action === 'approved'   ? deleteRequestApprovedEmail(firstName, patientName)
               : action === 'rejected'    ? deleteRequestRejectedEmail(firstName, patientName, note)
               : action === 'restored'    ? deleteRequestRestoredEmail(firstName, patientName)
               :                           deleteRequestHardDeletedEmail(firstName, patientName)
      try {
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: userEmail,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (e) { console.error('delete-notify email failed:', e) }
    }

    // แทรก in-app notification
    const notifType = action === 'approved' ? 'delete_approved'
      : action === 'rejected'    ? 'delete_rejected'
      : action === 'restored'    ? 'delete_restored'
      : 'delete_hard_deleted'
    try {
      await admin.from('tb_notifications').insert({
        user_id:      requestedBy,
        type:         notifType,
        patient_name: patientName,
        patient_id:   (action === 'rejected' || action === 'restored') ? (patientId || null) : null,
        note:         note || null,
      })
    } catch (e) { console.error('insert notification failed:', e) }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
