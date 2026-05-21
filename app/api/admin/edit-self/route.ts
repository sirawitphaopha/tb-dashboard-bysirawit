import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { buildLicense } from '@/lib/professions'

const ALLOWED_FIELDS = ['title', 'first_name', 'last_name', 'hospital_name', 'hospital_type', 'profession', 'license_number', 'department', 'department_other', 'phone'] as const
type AllowedField = typeof ALLOWED_FIELDS[number]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

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
      .select('first_name, last_name, hospital_name, hospital_type, profession, license_number, department, department_other, phone')
      .eq('id', user.id)
      .single()
    if (fetchErr || !current) {
      return NextResponse.json({ error: 'profile not found' }, { status: 404 })
    }

    // เลขใบประกอบ: ให้เซิร์ฟเวอร์เติมคำนำหน้าตามวิชาชีพเสมอ (รับพิมพ์เลขเปล่าหรือเต็มก็ได้)
    const curSelf = current as Record<string, string | null>
    const selfProfession = ('profession' in body && body.profession)
      ? body.profession
      : curSelf.profession
    if ('license_number' in body) {
      body.license_number = buildLicense(selfProfession, body.license_number)
    } else if ('profession' in body && body.profession !== curSelf.profession) {
      body.license_number = buildLicense(selfProfession, curSelf.license_number)
    }

    // กรองเฉพาะ field ที่อนุญาต และเปรียบเทียบ changes
    const safeUpdates: Partial<Record<AllowedField, string>> = {}
    const changes: Record<string, { before: string | null; after: string | null }> = {}

    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        const before = (current as Record<string, string | null>)[field] ?? null
        const after = body[field] ?? null
        if (before !== after) {
          safeUpdates[field] = body[field]
          changes[field] = { before, after }
        }
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ success: true, changed: false })
    }

    const { error: updErr } = await admin
      .from('profiles')
      .update(safeUpdates)
      .eq('id', user.id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    // บันทึก log (edited_by = ตัวเอง)
    const { error: logErr } = await admin
      .from('tb_profile_edit_log')
      .insert({
        user_id: user.id,
        edited_by: user.id,
        changes,
        snapshot_before: current,
      })
    if (logErr) console.error('edit-self log failed:', logErr)

    return NextResponse.json({ success: true, changed: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
