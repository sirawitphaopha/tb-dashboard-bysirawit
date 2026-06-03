// GET — แจ้งเตือนของ user ปัจจุบัน + avatar ของ "คนที่ทำ" (actor) สำหรับแจ้งเตือนคอมเมนต์
// ทำไมต้องผ่าน API (admin client): user client ติด RLS อ่าน avatar ของคนอื่นไม่ได้
// actor หาได้จาก comment_id → tb_changelog_comments.user_id → profiles.avatar_url
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
    const { data: notifs, error } = await admin
      .from('tb_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // actor avatar: comment_id → comment.user_id → profile.avatar_url
    const commentIds = [...new Set((notifs || []).map((n: any) => n.comment_id).filter(Boolean))]
    const commentAuthor: Record<string, string> = {}
    if (commentIds.length) {
      const { data: cs } = await admin.from('tb_changelog_comments').select('id, user_id').in('id', commentIds)
      for (const c of cs || []) commentAuthor[c.id] = c.user_id
    }
    const actorIds = [...new Set(Object.values(commentAuthor).filter(Boolean))]
    const avatarMap: Record<string, { url: string | null; at: string | null }> = {}
    if (actorIds.length) {
      const { data: profs } = await admin.from('profiles').select('id, avatar_url, avatar_updated_at').in('id', actorIds)
      for (const p of profs || []) avatarMap[p.id] = { url: p.avatar_url, at: p.avatar_updated_at }
    }

    const notifications = (notifs || []).map((n: any) => {
      const actorId = n.comment_id ? commentAuthor[n.comment_id] : null
      const a = actorId ? avatarMap[actorId] : null
      return { ...n, actor_id: actorId || null, actor_avatar_url: a?.url || null, actor_avatar_updated_at: a?.at || null }
    })

    return NextResponse.json({ notifications })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
