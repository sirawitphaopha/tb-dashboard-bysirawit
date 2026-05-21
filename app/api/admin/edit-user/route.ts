import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { userProfileEditedEmail } from '@/lib/email-templates'
import { buildLicense, professionLabel } from '@/lib/professions'
import { validatePhone, formatPhone } from '@/lib/phone'

const ALLOWED_FIELDS = ['title', 'first_name', 'last_name', 'hospital_name', 'hospital_type', 'profession', 'license_number', 'department', 'department_other', 'phone'] as const
type AllowedField = typeof ALLOWED_FIELDS[number]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, ...updates } = body
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

    // ดึงข้อมูลเดิมก่อนแก้ไข
    const { data: current, error: fetchErr } = await admin
      .from('profiles')
      .select('title, first_name, last_name, hospital_name, hospital_type, profession, license_number, department, department_other, phone')
      .eq('id', userId)
      .single()
    if (fetchErr || !current) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 })
    }

    // ตรวจ + จัดรูปแบบเบอร์โทรก่อนบันทึก (เฉพาะถ้ากรอก — เว้นว่างได้ ไม่แตะ)
    if ('phone' in updates) {
      if (updates.phone) {
        const chk = validatePhone(updates.phone)
        if (!chk.ok) return NextResponse.json({ error: chk.msg }, { status: 400 })
        updates.phone = formatPhone(updates.phone)
      } else {
        delete updates.phone
      }
    }

    // เลขใบประกอบ: ให้เซิร์ฟเวอร์เติมคำนำหน้าตามวิชาชีพเสมอ (รับ admin พิมพ์เลขเปล่าหรือเต็มก็ได้)
    const cur = current as Record<string, string | null>
    const targetProfession = ('profession' in updates && updates.profession)
      ? updates.profession
      : cur.profession
    if ('license_number' in updates) {
      updates.license_number = buildLicense(targetProfession, updates.license_number)
    } else if ('profession' in updates && updates.profession !== cur.profession) {
      // เปลี่ยนวิชาชีพแต่ไม่ได้แก้เลข → เปลี่ยนคำนำหน้าให้ตรงวิชาชีพใหม่
      updates.license_number = buildLicense(targetProfession, cur.license_number)
    }

    // กรองเฉพาะ field ที่อนุญาต และสร้าง changes log
    const safeUpdates: Partial<Record<AllowedField, string>> = {}
    const changes: Record<string, { before: string | null; after: string | null }> = {}

    for (const field of ALLOWED_FIELDS) {
      if (field in updates) {
        const before = (current as Record<string, string | null>)[field] ?? null
        const after = updates[field] ?? null
        if (before !== after) {
          safeUpdates[field] = updates[field]
          changes[field] = { before, after }
        }
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ success: true, changed: false })
    }

    // อัปเดตข้อมูล
    const { error: updErr } = await admin
      .from('profiles')
      .update(safeUpdates)
      .eq('id', userId)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    // บันทึก log
    const { error: logErr } = await admin
      .from('tb_profile_edit_log')
      .insert({
        user_id: userId,
        edited_by: user.id,
        changes,
        snapshot_before: current,
      })
    if (logErr) console.error('edit log insert failed:', logErr)

    // ส่งเมลแจ้ง user ว่าข้อมูลถูกแก้แล้ว
    try {
      const { data: authData } = await admin.auth.admin.getUserById(userId)
      const userEmail = authData?.user?.email
      if (userEmail && Object.keys(changes).length > 0) {
        const FIELD_LABELS: Record<string, string> = {
          title: 'คำนำหน้าชื่อ',
          first_name: 'ชื่อ', last_name: 'นามสกุล',
          hospital_name: 'ชื่อโรงพยาบาล', hospital_type: 'ประเภทโรงพยาบาล',
          profession: 'วิชาชีพ', license_number: 'เลขใบประกอบวิชาชีพ',
          department: 'แผนก', department_other: 'แผนก (ระบุ)', phone: 'เบอร์โทรศัพท์',
        }
        const changeList = Object.entries(changes).map(([field, val]) => {
          const v = val as any
          // วิชาชีพเก็บเป็น key ในฐานข้อมูล → แปลงเป็นชื่อไทยก่อนแสดงในเมล
          const fmt = (x: string | null) => (field === 'profession' ? professionLabel(x) : x)
          return { label: FIELD_LABELS[field] || field, before: fmt(v.before), after: fmt(v.after) }
        })
        const firstName = (current as any).first_name || 'ผู้ใช้'
        const mail = userProfileEditedEmail(firstName, changeList)
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: userEmail,
          subject: mail.subject,
          html: mail.html,
        })
      }
    } catch (e) { console.error('edit user email failed:', e) }

    return NextResponse.json({ success: true, changed: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
