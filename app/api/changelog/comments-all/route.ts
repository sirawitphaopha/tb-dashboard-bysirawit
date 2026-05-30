// GET — ดึง comments ทั้งหมดรวด 1 ครั้ง (group by version)
// ใช้ตอน mount ChangelogPage → ลดเวลา fetch จากหลาย requests → 1 request
// ทุก version จะได้ข้อมูลพร้อมกัน → auto-expand ทำได้โดยไม่ค้าง
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
    const [{ data, error }, { data: callerProfile }] = await Promise.all([
      admin
        .from('tb_changelog_comments')
        .select('id, version, user_id, display_name, role, profession_label, comment_text, status, created_at, updated_at, edited')
        .is('deleted_at', null)
        .order('created_at', { ascending: true }),
      admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ])

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Group by version
    const byVersion: Record<string, any[]> = {}
    for (const c of data || []) {
      if (!byVersion[c.version]) byVersion[c.version] = []
      byVersion[c.version].push(c)
    }

    return NextResponse.json({
      byVersion,
      current_user_id: user.id,
      is_admin: callerProfile?.role === 'admin',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
