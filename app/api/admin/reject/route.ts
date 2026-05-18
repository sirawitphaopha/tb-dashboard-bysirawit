import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
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

    // query ก่อนเพื่อเอา rejection week data ปัจจุบัน
    const { data: current } = await admin
      .from('profiles')
      .select('first_name, last_name, rejection_week_start, rejection_week_count')
      .eq('id', userId)
      .single()

    // คำนวณ weekly counter — ถ้าผ่านไป 7 วันแล้ว รีเซ็ตใหม่
    const now = new Date()
    const weekStart = current?.rejection_week_start ? new Date(current.rejection_week_start) : null
    const isNewWeek = !weekStart || (now.getTime() - weekStart.getTime()) >= 7 * 24 * 60 * 60 * 1000
    const newWeekStart = isNewWeek ? now.toISOString().split('T')[0] : current?.rejection_week_start
    const newWeekCount = isNewWeek ? 1 : (current?.rejection_week_count ?? 0) + 1

    const { error: updErr } = await admin
      .from('profiles')
      .update({
        status: 'rejected',
        rejected_reason: reason,
        rejection_week_start: newWeekStart,
        rejection_week_count: newWeekCount,
      })
      .eq('id', userId)

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    const { error: logErr } = await admin
      .from('tb_user_reject_log')
      .insert({
        user_id: userId,
        rejected_by: user.id,
        rejected_reason: reason,
      })
    if (logErr) console.error('reject log insert failed:', logErr)

    const target = current

    const { data: authData } = await admin.auth.admin.getUserById(userId)
    const userEmail = authData?.user?.email

    if (userEmail && target) {
      const mail = userRejectedEmail(target.first_name || 'ผู้ใช้', reason, req.nextUrl.origin)
      try {
        await getResend().emails.send({
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
