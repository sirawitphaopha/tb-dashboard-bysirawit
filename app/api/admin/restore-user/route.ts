import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { userRestoredEmail } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

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

    const { data: target } = await admin
      .from('profiles')
      .select('email, first_name, rejected_reason')
      .eq('id', userId)
      .single()
    if (!target) return NextResponse.json({ error: 'user not found' }, { status: 404 })

    const { error } = await admin
      .from('profiles')
      .update({
        status: 'approved',
        rejected_reason: null,
        deactivated_at: null,
      })
      .eq('id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // ส่งเมลแจ้ง user ว่าบัญชีกู้คืนแล้ว
    if (target.email) {
      const mail = userRestoredEmail(target.first_name || 'ผู้ใช้', req.nextUrl.origin)
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
