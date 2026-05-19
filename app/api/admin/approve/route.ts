import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { userApprovedEmail } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

    // เช็คว่าคนเรียก API เป็น admin จริง
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

    // ตรวจสถานะเดิมของ target ก่อน approve
    // อนุญาตเฉพาะ user ที่อยู่ในสถานะ pending เท่านั้น
    // ป้องกัน bypass การพิจารณา เช่น ดึง rejected user กลับเข้าระบบโดยกดปุ่มผิด
    const { data: targetCheck } = await admin
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .single()
    if (!targetCheck) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 })
    }
    if (targetCheck.status !== 'pending') {
      const statusLabel: Record<string, string> = {
        approved: 'อนุมัติแล้ว',
        rejected: 'ถูกปฏิเสธ',
        deactivated: 'ถูกระงับ',
      }
      const label = statusLabel[targetCheck.status] || targetCheck.status
      return NextResponse.json(
        {
          error: `ไม่สามารถอนุมัติ user ที่สถานะ "${label}" ได้ — อนุมัติได้เฉพาะ user ที่รอพิจารณา (pending) เท่านั้น กรุณาใช้ปุ่ม Restore/Activate แทน`,
        },
        { status: 400 }
      )
    }

    // Approve
    const { data: target, error: updErr } = await admin
      .from('profiles')
      .update({ status: 'approved', approved_at: new Date().toISOString(), rejected_reason: null })
      .eq('id', userId)
      .select('first_name, last_name')
      .single()

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    // หา email ของ user เพื่อส่งเมล
    const { data: authData } = await admin.auth.admin.getUserById(userId)
    const userEmail = authData?.user?.email

    if (userEmail && target) {
      const mail = userApprovedEmail(target.first_name || 'ผู้ใช้', req.nextUrl.origin)
      try {
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: userEmail,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (e) { console.error('approve email failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
