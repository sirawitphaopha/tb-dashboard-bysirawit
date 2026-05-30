// POST — เพิ่ม comment ใหม่ในหน้า Changelog
// • snapshot email/display_name/role จาก profiles ใส่ลงตาราง (กันลบ)
// • ส่ง email แจ้ง admin (ADMIN_EMAIL)
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { changelogCommentNotifyEmail } from '@/lib/email-templates'

const VALID_STATUS = ['feedback', 'bug_report', 'request', 'note'] as const
type Status = typeof VALID_STATUS[number]

const PROFESSION_LABEL: Record<string, string> = {
  pharmacist: 'เภสัชกร',
  doctor: 'แพทย์',
  nurse: 'พยาบาล',
  dentist: 'ทันตแพทย์',
  pharm_tech: 'ผู้ช่วยเภสัชกร',
  health_official: 'เจ้าหน้าที่สาธารณสุข',
  other: 'อื่นๆ',
}

// ── ชื่อวิชาชีพแบบเต็ม (ใช้แสดงใน avatar) ────────────────────────────
const PROF_NAME: Record<string, string> = {
  pharmacist:          'เภสัชกร',
  doctor:              'แพทย์',
  dentist:             'ทันตแพทย์',
  nurse1:              'พยาบาล',
  nurse2:              'พยาบาล',
  medtech:             'เทคนิคการแพทย์',
  physio:              'กายภาพบำบัด',
  radio:               'รังสีการแพทย์',
  publichealthofficer: 'สาธารณสุข',
  publichealthtech:    'นักวิชาการสาธารณสุข',
  officer:             'เจ้าพนักงาน',
  other:               'อื่นๆ',
}
function professionTitleLabel(professionKey: string, namePrefix: string): string {
  return PROF_NAME[professionKey] || namePrefix || ''
}

export async function POST(req: NextRequest) {
  try {
    const { version, comment_text, status } = await req.json()
    if (!version || typeof version !== 'string')
      return NextResponse.json({ error: 'missing version' }, { status: 400 })
    if (!comment_text || typeof comment_text !== 'string' || !comment_text.trim())
      return NextResponse.json({ error: 'comment ว่างไม่ได้' }, { status: 400 })
    if (comment_text.length > 2000)
      return NextResponse.json({ error: 'comment ยาวเกิน 2000 ตัวอักษร' }, { status: 400 })
    if (!VALID_STATUS.includes(status as Status))
      return NextResponse.json({ error: 'status ไม่ถูกต้อง' }, { status: 400 })

    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    // snapshot profile
    const { data: profile } = await admin
      .from('profiles')
      .select('email, first_name, last_name, profession, role, title')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 })

    // display name: title + first_name + last_name (fallback to email)
    const titlePart = profile.title ? `${profile.title} ` : ''
    const namePart = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    const displayName = (titlePart + namePart).trim() || profile.email || 'ไม่ระบุชื่อ'
    const roleLabel = profile.role === 'admin' ? 'admin' : 'user'

    // คำนวณตัวย่อวิชาชีพ (ตัวอย่าง: ภก./ภญ./นพ./พญ.) ใช้แสดงใน avatar
    const professionLabel = professionTitleLabel(profile.profession, profile.title || '')

    // insert
    const { data: newRow, error: insErr } = await admin
      .from('tb_changelog_comments')
      .insert({
        version,
        user_id: user.id,
        email: profile.email,
        display_name: displayName,
        role: roleLabel,
        profession_label: professionLabel,
        comment_text: comment_text.trim(),
        status,
      })
      .select('*')
      .single()

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

    // ── ส่งอีเมลแจ้ง admin (fire-and-forget) ──────────────────────────────
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean)
    if (adminEmails.length > 0) {
      try {
        const profLabel = PROFESSION_LABEL[profile.profession] || profile.profession || ''
        const mail = changelogCommentNotifyEmail(
          version,
          status,
          displayName,
          profLabel ? `${roleLabel} · ${profLabel}` : roleLabel,
          profile.email,
          comment_text.trim(),
          req.nextUrl.origin,
          newRow?.created_at,
        )
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: adminEmails,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (e) { console.error('changelog comment email failed:', e) }
    }

    return NextResponse.json({ success: true, comment: newRow })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
