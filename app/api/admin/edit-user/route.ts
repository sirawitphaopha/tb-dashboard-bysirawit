import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

const ALLOWED_FIELDS = ['first_name', 'last_name', 'hospital_name', 'hospital_type', 'profession', 'license_number', 'department', 'department_other'] as const
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
      .select('first_name, last_name, hospital_name, hospital_type, profession, license_number, department, department_other')
      .eq('id', userId)
      .single()
    if (fetchErr || !current) {
      return NextResponse.json({ error: 'user not found' }, { status: 404 })
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

    return NextResponse.json({ success: true, changed: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
