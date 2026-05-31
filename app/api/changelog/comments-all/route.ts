// GET — ดึง comments ทั้งหมดรวด 1 ครั้ง (group by version + replies + likes + resolved)
// ใช้ตอน mount ChangelogPage → ลดเวลา fetch จากหลาย requests → 1 request
// shape: byVersion[X] = parents[] + each parent มี replies[]
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

const SELECT_FIELDS = 'id, version, user_id, display_name, role, profession_label, comment_text, status, created_at, updated_at, edited, parent_comment_id, resolved_at, resolved_by, mentioned_user_ids, deleted_at, deleted_by'

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
    const [
      { data: comments, error: cErr },
      { data: callerProfile },
      { data: allLikes, error: lErr },
    ] = await Promise.all([
      admin
        .from('tb_changelog_comments')
        .select(SELECT_FIELDS)
        .order('created_at', { ascending: true }),
      admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      admin.from('tb_changelog_comment_likes').select('comment_id, user_id'),
    ])

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })
    if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 })

    const isAdmin = callerProfile?.role === 'admin'

    // นับ likes per comment + เช็ค liked_by_me
    const likesCount: Record<string, number> = {}
    const likedByMe: Record<string, boolean> = {}
    for (const lk of allLikes || []) {
      likesCount[lk.comment_id] = (likesCount[lk.comment_id] || 0) + 1
      if (lk.user_id === user.id) likedByMe[lk.comment_id] = true
    }

    // แยก parent vs reply + group reply ใต้ parent
    const parents: any[] = []
    const repliesByParent: Record<string, any[]> = {}
    for (const c of comments || []) {
      // ปกป้องข้อความที่ถูกลบ: user ที่ไม่ใช่ admin → ส่ง text เป็น ''
      const safeText = (c.deleted_at && !isAdmin) ? '' : c.comment_text
      const enriched = {
        ...c,
        comment_text: safeText,
        likes_count: likesCount[c.id] || 0,
        liked_by_me: !!likedByMe[c.id],
      }
      if (c.parent_comment_id) {
        if (!repliesByParent[c.parent_comment_id]) repliesByParent[c.parent_comment_id] = []
        repliesByParent[c.parent_comment_id].push(enriched)
      } else {
        parents.push({ ...enriched, replies: [] })
      }
    }
    // attach replies
    for (const p of parents) {
      p.replies = repliesByParent[p.id] || []
    }

    // Group by version
    const byVersion: Record<string, any[]> = {}
    for (const p of parents) {
      if (!byVersion[p.version]) byVersion[p.version] = []
      byVersion[p.version].push(p)
    }

    return NextResponse.json({
      byVersion,
      current_user_id: user.id,
      is_admin: isAdmin,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
