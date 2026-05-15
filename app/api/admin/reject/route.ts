import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { userRejectedEmail } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const { userId, reason } = await req.json()
    if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'ต้องระบุเหตุผลที่ reject' }, { status: 400 })
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
    const { data: caller } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'admin only' }, { status: 403 })
    }

    const { data: target, error: updErr } = await admin
      .from('profiles')
      .update({ status: 'rejected', rejected_reason: reason })
      .eq('id', userId)
      .select('first_name, last_name')
      .single()

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    const { data: authData } = await admin.auth.admin.getUserById(userId)
    const userEmail = authData?.user?.email

    if (userEmail && target) {
      const mail = userRejectedEmail(target.first_name || 'ผู้ใช้', reason)
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: userEmail,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (e) { console.error('reject email failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
