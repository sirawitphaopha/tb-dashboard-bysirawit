// POST / DELETE — toggle like บน comment
// POST = like (idempotent — กด POST ซ้ำ ไม่ error เพราะ UNIQUE constraint จะตอบกลับมาว่า liked แล้ว)
// DELETE = unlike (idempotent — ลบที่ไม่มีอยู่ ไม่ error)
// คืน { liked: bool, count: number }
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

async function authUser(req: NextRequest) {
  const cookieStore = req.cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getCount(admin: any, commentId: string) {
  const { count } = await admin
    .from('tb_changelog_comment_likes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId)
  return count || 0
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await authUser(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    // upsert (ON CONFLICT DO NOTHING via insert + ignore unique violation)
    const { error } = await admin
      .from('tb_changelog_comment_likes')
      .insert({ comment_id: id, user_id: user.id })
    // duplicate key = OK (user เคย like แล้ว)
    if (error && !String(error.message || '').toLowerCase().includes('duplicate')) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const count = await getCount(admin, id)
    return NextResponse.json({ liked: true, count })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await authUser(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('tb_changelog_comment_likes')
      .delete()
      .eq('comment_id', id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const count = await getCount(admin, id)
    return NextResponse.json({ liked: false, count })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
