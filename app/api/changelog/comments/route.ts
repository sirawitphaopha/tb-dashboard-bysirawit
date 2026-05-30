// GET — รายการ comment ของ version (filter ?version=X)
// คืน comment ทั้งหมดที่ยังไม่ถูก soft delete เรียง created_at asc
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const version = req.nextUrl.searchParams.get('version')
    if (!version) return NextResponse.json({ error: 'missing version param' }, { status: 400 })

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
        .eq('version', version)
        .is('deleted_at', null)
        .order('created_at', { ascending: true }),
      admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ])

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      comments: data || [],
      current_user_id: user.id,
      is_admin: callerProfile?.role === 'admin',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
