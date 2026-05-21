import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { userEditRequestApprovedEmail, userEditRequestRejectedEmail } from '@/lib/email-templates'
import { professionKeyFromLabel, professionLabel, buildLicense } from '@/lib/professions'
import { validatePhone, formatPhone } from '@/lib/phone'

// field ที่อนุญาตให้แก้ผ่านระบบคำขอ (whitelist กันแก้ field นอกรายการ)
const ALLOWED_FIELDS = [
  'title', 'first_name', 'last_name', 'hospital_name', 'hospital_type',
  'profession', 'license_number', 'department', 'department_other', 'phone',
] as const

export async function POST(req: NextRequest) {
  try {
    const { requestId, action, note } = await req.json()
    if (!requestId || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'missing requestId or invalid action' }, { status: 400 })
    }

    // ── ตรวจสิทธิ์ผู้เรียก ต้องเป็น admin ──
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
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single()
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'admin only' }, { status: 403 })
    }

    // ── ดึงคำขอ ──
    const { data: reqRow, error: reqErr } = await admin
      .from('tb_profile_edit_requests')
      .select('*')
      .eq('id', requestId)
      .single()
    if (reqErr || !reqRow) {
      return NextResponse.json({ error: 'request not found' }, { status: 404 })
    }
    if (reqRow.status !== 'pending') {
      return NextResponse.json({ error: 'คำขอนี้ถูกดำเนินการไปแล้ว' }, { status: 409 })
    }

    const reviewerName = `${caller.first_name || ''} ${caller.last_name || ''}`.trim() || (user.email || 'Admin')
    const targetUserId = reqRow.user_id

    // ── ดึงชื่อ + อีเมลผู้ขอ (ไว้ส่งเมล) ──
    const { data: targetProfile } = await admin
      .from('profiles')
      .select('first_name')
      .eq('id', targetUserId)
      .single()
    const firstName = targetProfile?.first_name || 'ผู้ใช้'
    const { data: authData } = await admin.auth.admin.getUserById(targetUserId)
    const userEmail = authData?.user?.email

    // ════════════════════════════════════════════════
    //  ปฏิเสธคำขอ
    // ════════════════════════════════════════════════
    if (action === 'reject') {
      const { error: updErr } = await admin
        .from('tb_profile_edit_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_name_at_review: reviewerName,
          review_note: note || null,
        })
        .eq('id', requestId)
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

      // เมลแจ้ง user
      try {
        if (userEmail) {
          const mail = userEditRequestRejectedEmail(firstName, reqRow.field_label, reqRow.new_value, note || '')
          await getResend().emails.send({ from: EMAIL_FROM, to: userEmail, subject: mail.subject, html: mail.html })
        }
      } catch (e) { console.error('reject edit-request email failed:', e) }

      // แจ้งเตือนในแอป (กระดิ่งของ user)
      try {
        await admin.from('tb_notifications').insert({
          user_id: targetUserId,
          type: 'edit_request_rejected',
          note: `${reqRow.field_label}${note ? ' — ' + note : ''}`,
        })
      } catch (e) { console.error('reject notif insert failed:', e) }

      return NextResponse.json({ success: true, action: 'rejected' })
    }

    // ════════════════════════════════════════════════
    //  อนุมัติคำขอ — อัปเดตข้อมูลจริงให้อัตโนมัติ
    // ════════════════════════════════════════════════
    const field = reqRow.field_name as string
    if (!ALLOWED_FIELDS.includes(field as any)) {
      return NextResponse.json({ error: 'field ไม่อยู่ในรายการที่อนุญาต' }, { status: 400 })
    }

    // ดึงโปรไฟล์ปัจจุบัน (ต้องใช้ profession เพื่อเติมคำนำหน้าเลขใบประกอบ)
    const { data: current, error: curErr } = await admin
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single()
    if (curErr || !current) {
      return NextResponse.json({ error: 'ไม่พบโปรไฟล์ผู้ใช้' }, { status: 404 })
    }
    const cur = current as Record<string, string | null>
    const beforeRaw = cur[field] ?? null
    const afterRaw = reqRow.new_value ?? null

    let writeVal: string | null      // ค่าที่เขียนลง DB
    let beforeDisplay: string | null // ค่าที่แสดงใน log/เมล (ก่อน)
    let afterDisplay: string | null  // ค่าที่แสดงใน log/เมล (หลัง)

    if (field === 'profession') {
      // หน้าเว็บส่งป้ายไทยมา → แปลงเป็น key ก่อนบันทึก
      writeVal = professionKeyFromLabel(afterRaw)
      beforeDisplay = professionLabel(beforeRaw)
      afterDisplay = afterRaw
    } else if (field === 'license_number') {
      // user กรอกแค่ตัวเลข → เติมคำนำหน้าตามวิชาชีพปัจจุบันให้เอง (กันคำนำหน้าซ้ำด้วย)
      writeVal = buildLicense(cur.profession, afterRaw)
      beforeDisplay = beforeRaw          // ค่าเดิมใน DB (มีคำนำหน้าอยู่แล้ว)
      afterDisplay = writeVal            // แสดงค่าเต็มหลังเติมคำนำหน้า
    } else if (field === 'phone') {
      // ตรวจ + จัดรูปแบบเบอร์ก่อนบันทึก (กันเบอร์ผิดหลุดผ่านคำขอ)
      const chk = validatePhone(afterRaw)
      if (!chk.ok) return NextResponse.json({ error: 'เบอร์ในคำขอไม่ถูกต้อง: ' + chk.msg }, { status: 400 })
      writeVal = formatPhone(afterRaw)
      beforeDisplay = beforeRaw
      afterDisplay = writeVal
    } else {
      writeVal = afterRaw
      beforeDisplay = beforeRaw
      afterDisplay = afterRaw
    }

    // อัปเดตข้อมูลจริง
    const { error: updProfileErr } = await admin
      .from('profiles')
      .update({ [field]: writeVal })
      .eq('id', targetUserId)
    if (updProfileErr) return NextResponse.json({ error: updProfileErr.message }, { status: 500 })

    // บันทึก log การแก้ไข (edited_by = admin)
    try {
      await admin.from('tb_profile_edit_log').insert({
        user_id: targetUserId,
        edited_by: user.id,
        changes: { [field]: { before: beforeDisplay, after: afterDisplay } },
        snapshot_before: { [field]: beforeRaw },
      })
    } catch (e) { console.error('approve edit-request log failed:', e) }

    // เปลี่ยนสถานะคำขอเป็นอนุมัติ
    const { error: reqUpdErr } = await admin
      .from('tb_profile_edit_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        reviewer_name_at_review: reviewerName,
      })
      .eq('id', requestId)
    if (reqUpdErr) return NextResponse.json({ error: reqUpdErr.message }, { status: 500 })

    // เมลแจ้ง user
    try {
      if (userEmail) {
        const mail = userEditRequestApprovedEmail(firstName, reqRow.field_label, beforeDisplay || '', afterDisplay || '')
        await getResend().emails.send({ from: EMAIL_FROM, to: userEmail, subject: mail.subject, html: mail.html })
      }
    } catch (e) { console.error('approve edit-request email failed:', e) }

    // แจ้งเตือนในแอป (กระดิ่งของ user)
    try {
      await admin.from('tb_notifications').insert({
        user_id: targetUserId,
        type: 'edit_request_approved',
        note: reqRow.field_label,
      })
    } catch (e) { console.error('approve notif insert failed:', e) }

    return NextResponse.json({ success: true, action: 'approved' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
