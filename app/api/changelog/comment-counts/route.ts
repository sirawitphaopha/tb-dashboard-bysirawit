// GET — นับจำนวน comment (ที่ไม่ถูก soft delete) ต่อ version ทั้งหมด
// คืน { counts: { "0.7.14.2": 3, "0.7.14.1": 1, ... } }
// ใช้สำหรับโชว์ badge + filter "เฉพาะที่มี comment"
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('tb_changelog_comments')
      .select('version')
      .is('deleted_at', null)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const counts: Record<string, number> = {}
    for (const r of data || []) {
      counts[r.version] = (counts[r.version] || 0) + 1
    }
    return NextResponse.json({ counts })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
