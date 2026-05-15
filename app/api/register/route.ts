import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { resend, EMAIL_FROM, ADMIN_EMAILS } from '@/lib/resend'
import { adminNotifyEmail, userPendingEmail } from '@/lib/email-templates'

const PROFESSION_LABELS: Record<string, string> = {
  doctor:       'แพทย์',
  dentist:      'ทันตแพทย์',
  pharmacist:   'เภสัชกร',
  nurse:        'พยาบาลวิชาชีพ',
  medtech:      'นักเทคนิคการแพทย์',
  physio:       'นักกายภาพบำบัด',
  radio:        'นักรังสีการแพทย์',
  publichealth: 'เจ้าหน้าที่สาธารณสุข',
  officer:      'เจ้าพนักงาน',
  other:        'อื่นๆ',
}

const PREFIXES: Record<string, string> = {
  doctor: 'ว.', dentist: 'ท.', pharmacist: 'ภ.', nurse: 'ป.',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      username, email, password,
      firstName, lastName,
      profession, licenseNumber, phone,
      hospitalName, hospitalType, department, departmentOther,
    } = body

    // Validate ขั้นต่ำ
    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'กรอกข้อมูลไม่ครบ' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1) Check username ซ้ำ
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Username นี้มีคนใช้แล้ว' }, { status: 400 })
    }

    // 2) สร้าง auth user
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

    const userId = authData.user.id

    // 3) Insert profile (status = pending default)
    const fullLicense = (PREFIXES[profession] || '') + (licenseNumber || '')
    const { error: profErr } = await admin.from('profiles').insert({
      id:                userId,
      username,
      email,
      first_name:        firstName,
      last_name:         lastName,
      profession,
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

    // 4) ส่งเมล
    const origin = req.nextUrl.origin
    const summary = {
      userId,
      username, email,
      firstName, lastName,
      profession: PROFESSION_LABELS[profession] || profession,
      licenseNumber: fullLicense,
      hospitalName, hospitalType,
      department: department === 'อื่นๆ' ? (departmentOther || 'อื่นๆ') : department,
    }

    // ส่งเมลให้ admin
    const adminMail = adminNotifyEmail(summary, origin)
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: ADMIN_EMAILS,
        subject: adminMail.subject,
        html: adminMail.html,
      })
    } catch (e) { console.error('admin email failed:', e) }

    // ส่งเมลให้ user
    const userMail = userPendingEmail(firstName)
    try {
      await resend.emails.send({
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
