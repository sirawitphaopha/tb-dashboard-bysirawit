// GET — รายชื่อ user สำหรับ @mention autocomplete
// query: ?q=prefix (optional) → match กับ username / first_name / last_name
// คืน user 8 คน เฉพาะ status='approved'
// expose เฉพาะ field: id, username, display_name, profession_label
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { professionTitleLabel } from '@/lib/changelog-comment-helpers'

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

    const q = (req.nextUrl.searchParams.get('q') || '').trim().toLowerCase()

    const admin = createAdminClient()
    let query = admin
      .from('profiles')
      .select('id, username, first_name, last_name, title, profession, role, status, avatar_url, avatar_updated_at')
      .eq('status', 'approved')
      .limit(20)

    if (q) {
      query = query.or(`username.ilike.${q}%,first_name.ilike.${q}%,last_name.ilike.${q}%`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const users = (data || []).map((p: any) => {
      const titlePart = p.title ? `${p.title} ` : ''
      const namePart = `${p.first_name || ''} ${p.last_name || ''}`.trim()
      const displayName = (titlePart + namePart).trim() || p.username || ''
      return {
        id: p.id,
        username: p.username || '',
        display_name: displayName,
        profession_label: professionTitleLabel(p.profession, p.title || ''),
        role: p.role === 'admin' ? 'admin' : 'user',
        avatar_url: p.avatar_url || null,
        avatar_updated_at: p.avatar_updated_at || null,
      }
    }).filter((u: any) => u.username)  // skip user ที่ไม่มี username (mention ไม่ได้)
      // เรียง admin มาก่อน (เน้นให้เห็น)
      .sort((a: any, b: any) => (a.role === 'admin' ? -1 : 1) - (b.role === 'admin' ? -1 : 1))

    return NextResponse.json({ users })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
