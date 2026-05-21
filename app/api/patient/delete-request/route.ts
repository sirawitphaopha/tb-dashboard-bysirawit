import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getResend, EMAIL_FROM, ADMIN_EMAILS } from '@/lib/resend'
import { adminDeleteRequestEmail } from '@/lib/email-templates'
import { professionLabel } from '@/lib/professions'

export async function POST(req: NextRequest) {
  try {
    const { patientId, patientName, patientHn, reason, requestedBy } = await req.json()
    if (!patientId || !reason) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 })
    }

    // เช็คว่า user login อยู่
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

    // ดึงชื่อ + วิชาชีพผู้ขอลบ
    const { data: profile } = await supabase.from('profiles').select('first_name, last_name, profession').eq('id', user.id).single()
    const requesterName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'ผู้ใช้'
    const requesterProfession = professionLabel(profile?.profession) || '—'

    // ส่งเมลให้ admin
    if (ADMIN_EMAILS.length > 0) {
      const mail = adminDeleteRequestEmail(
        patientName || patientId,
        patientHn || '',
        reason,
        requesterName,
        requesterProfession,
        req.nextUrl.origin
      )
      try {
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: ADMIN_EMAILS,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (e) { console.error('delete-request email failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
