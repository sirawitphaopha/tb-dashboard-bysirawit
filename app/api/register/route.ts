import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM, ADMIN_EMAILS } from '@/lib/resend'
import { adminNotifyEmail, userPendingEmail } from '@/lib/email-templates'
import { professionLabel, buildLicense } from '@/lib/professions'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      username, email, password,
      firstName, lastName,
      profession, title, licenseNumber, phone,
      hospitalName, hospitalType, department, departmentOther,
    } = body

    // Validate ขั้นต่ำ
    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'กรอกข้อมูลไม่ครบ' }, { status: 400 })
    }

    const admin = createAdminClient()
    const fullLicense = buildLicense(profession, licenseNumber)

    // 1) เช็คว่า email นี้เคยมีไหม — ถ้าเคย reject สามารถสมัครใหม่ได้ (reset เป็น pending)
    const { data: existingByEmail } = await admin
      .from('profiles')
      .select('id, status, rejection_week_start, rejection_week_count')
      .eq('email', email)
      .maybeSingle()

    const isReregister = existingByEmail?.status === 'rejected'

    if (existingByEmail && !isReregister) {
      return NextResponse.json({ error: 'อีเมลนี้มีคนสมัครแล้ว' }, { status: 400 })
    }

    // Rate limiting: ถ้าถูก reject ครบ 3 ครั้งภายในสัปดาห์นี้ → บล็อกชั่วคราว
    if (isReregister) {
      const weekStart = existingByEmail?.rejection_week_start
        ? new Date(existingByEmail.rejection_week_start)
        : null
      const now = new Date()
      const isCurrentWeek = weekStart && (now.getTime() - weekStart.getTime()) < 7 * 24 * 60 * 60 * 1000

      if (isCurrentWeek && (existingByEmail?.rejection_week_count ?? 0) >= 3) {
        const unlockDate = new Date(weekStart!.getTime() + 7 * 24 * 60 * 60 * 1000)
        const unlockStr = unlockDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
        return NextResponse.json({
          error: `ท่านถูกปฏิเสธครบ 3 ครั้งในสัปดาห์นี้แล้ว กรุณาลองใหม่หลังวันที่ ${unlockStr}`,
        }, { status: 400 })
      }
    }

    // 2) Check username ซ้ำ — ยกเว้น profile ของตัวเอง (กรณี re-register)
    let usernameQuery = admin.from('profiles').select('id').eq('username', username)
    if (isReregister) usernameQuery = usernameQuery.neq('id', existingByEmail!.id)
    const { data: usernameConflict } = await usernameQuery.maybeSingle()
    if (usernameConflict) {
      return NextResponse.json({ error: 'Username นี้มีคนใช้แล้ว' }, { status: 400 })
    }

    // 2.5) Check license_number ซ้ำ — กันคนเดิมเปลี่ยนเมลหนี rate limit
    // เทียบเฉพาะตัวเลข (digits only) และวิชาชีพเดียวกันเท่านั้น
    // เช่น แพทย์ "ว.12345" กับ เภสัช "ภ.12345" = เลขเดียวกันแต่ไม่ซ้ำกัน
    const licenseDigits = (licenseNumber || '').replace(/\D/g, '').trim()
    if (licenseDigits) {
      // ดึงเฉพาะวิชาชีพเดียวกัน และเฉพาะ format ที่อาจซ้ำ (มี prefix / ไม่มี prefix)
      const possibleFormats = [licenseDigits, fullLicense].filter(Boolean)
      let licenseQuery = admin
        .from('profiles')
        .select('id, license_number')
        .eq('profession', profession)
        .in('license_number', possibleFormats)
      if (isReregister) licenseQuery = licenseQuery.neq('id', existingByEmail!.id)
      const { data: candidates } = await licenseQuery
      const conflict = (candidates || []).find(p => {
        const pDigits = (p.license_number || '').replace(/\D/g, '')
        return pDigits === licenseDigits
      })
      if (conflict) {
        return NextResponse.json({
          error: 'เลขใบประกอบวิชาชีพนี้มีคนใช้สมัครแล้ว — หากเป็นเจ้าของจริง กรุณาสมัครด้วยอีเมลเดิม หรือติดต่อผู้ดูแลระบบ',
        }, { status: 400 })
      }
    }

    let userId: string

    if (isReregister) {
      // ─── Re-registration: update password + reset profile to pending ───
      userId = existingByEmail!.id

      const { error: pwErr } = await admin.auth.admin.updateUserById(userId, { password })
      if (pwErr) return NextResponse.json({ error: 'อัปเดตรหัสผ่านไม่สำเร็จ: ' + pwErr.message }, { status: 500 })

      const { error: updErr } = await admin.from('profiles').update({
        username,
        first_name:       firstName,
        last_name:        lastName,
        profession,
        title:            title || null,
        license_number:   fullLicense,
        phone:            phone || null,
        hospital_name:    hospitalName,
        hospital_type:    hospitalType,
        department,
        department_other: departmentOther || null,
        status:           'pending',
        rejected_reason:  null,
      }).eq('id', userId)

      if (updErr) return NextResponse.json({ error: 'อัปเดตโปรไฟล์ไม่สำเร็จ: ' + updErr.message }, { status: 500 })
    } else {
      // ─── New registration: create auth + insert profile ───
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // ไม่ต้อง confirm email (admin จะ approve เอง)
      })

      if (authErr || !authData.user) {
        const isDup = authErr?.message?.toLowerCase().includes('already')
        return NextResponse.json({
          error: isDup ? 'อีเมลนี้มีคนสมัครแล้ว' : (authErr?.message || 'สมัครไม่สำเร็จ')
        }, { status: 400 })
      }

      userId = authData.user.id

      const { error: profErr } = await admin.from('profiles').insert({
        id:                userId,
        username,
        email,
        first_name:        firstName,
        last_name:         lastName,
        profession,
        title:             title || null,
        license_number:    fullLicense,
        phone:             phone || null,
        hospital_name:     hospitalName,
        hospital_type:     hospitalType,
        department:        department,
        department_other:  departmentOther || null,
      })

      if (profErr) {
        // Rollback: ลบ auth user ที่เพิ่งสร้าง
        await admin.auth.admin.deleteUser(userId)
        return NextResponse.json({ error: 'บันทึกโปรไฟล์ไม่สำเร็จ: ' + profErr.message }, { status: 500 })
      }
    }

    // 4) ส่งเมล
    const origin = req.nextUrl.origin
    const summary = {
      userId,
      username, email,
      firstName, lastName,
      profession: professionLabel(profession),
      licenseNumber: fullLicense,
      hospitalName, hospitalType,
      department: department === 'อื่นๆ' ? (departmentOther || 'อื่นๆ') : department,
    }

    // ส่งเมลให้ admin
    const adminMail = adminNotifyEmail(summary, origin)
    try {
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: ADMIN_EMAILS,
        subject: adminMail.subject,
        html: adminMail.html,
      })
    } catch (e) { console.error('admin email failed:', e) }

    // ส่งเมลให้ user
    const userMail = userPendingEmail(firstName)
    try {
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: userMail.subject,
        html: userMail.html,
      })
    } catch (e) { console.error('user email failed:', e) }

    return NextResponse.json({ success: true })

  } catch (e: any) {
    console.error('register error:', e)
    return NextResponse.json({ error: e.message || 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
