// GET — ดูประวัติการแก้ไข comment
// คืน { current: {...}, edits: [{old_text, old_status, edited_at, edited_by}, ...] }
// edits เรียง edited_at desc (ล่าสุดก่อน)
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // permission: เจ้าของ comment + admin เท่านั้น
    const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    const isAdmin = callerProfile?.role === 'admin'

    const [{ data: current, error: cErr }, { data: edits, error: eErr }] = await Promise.all([
      admin
        .from('tb_changelog_comments')
        .select('id, user_id, comment_text, status, edited, updated_at')
        .eq('id', id)
        .maybeSingle(),
      admin
        .from('tb_changelog_comment_edits')
        .select('id, old_text, old_status, edited_at, edited_by')
        .eq('comment_id', id)
        .order('edited_at', { ascending: false }),
    ])

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
    if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 })
    if (!current) return NextResponse.json({ error: 'comment not found' }, { status: 404 })

    const isOwner = current.user_id === user.id
    if (!isOwner && !isAdmin)
      return NextResponse.json({ error: 'ดูประวัติได้เฉพาะเจ้าของ comment หรือ admin' }, { status: 403 })

    // ไม่ส่ง user_id กลับ (ไม่จำเป็น)
    const { user_id: _ignore, ...currentSafe } = current
    return NextResponse.json({ current: currentSafe, edits: edits || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
