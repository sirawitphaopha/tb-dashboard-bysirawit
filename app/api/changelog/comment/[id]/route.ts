// PATCH — แก้ไข comment (เฉพาะเจ้าของ)
// DELETE — soft delete comment (เจ้าของ หรือ admin ลบของคนอื่น)
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

const VALID_STATUS = ['feedback', 'bug_report', 'request', 'note'] as const
type Status = typeof VALID_STATUS[number]

async function getCallerContext(req: NextRequest) {
  const cookieStore = req.cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized', status: 401 as const }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return { user, admin, isAdmin: profile?.role === 'admin' }
}

// ── PATCH — แก้ไข comment ของตัวเอง ───────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const body = await req.json()
    const ctx = await getCallerContext(req)
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    // หา comment เดิม (ดึง field มากขึ้น เพื่อ snapshot edit history)
    const { data: existing } = await ctx.admin
      .from('tb_changelog_comments')
      .select('id, user_id, deleted_at, comment_text, status')
      .eq('id', id)
      .maybeSingle()
    if (!existing) return NextResponse.json({ error: 'comment not found' }, { status: 404 })
    if (existing.deleted_at) return NextResponse.json({ error: 'comment ถูกลบไปแล้ว' }, { status: 410 })
    if (existing.user_id !== ctx.user.id)
      return NextResponse.json({ error: 'แก้ไขได้เฉพาะ comment ของตัวเอง' }, { status: 403 })

    // validate input
    const updates: Record<string, any> = { edited: true, updated_at: new Date().toISOString() }
    if (typeof body.comment_text === 'string') {
      const t = body.comment_text.trim()
      if (!t) return NextResponse.json({ error: 'comment ว่างไม่ได้' }, { status: 400 })
      if (t.length > 2000) return NextResponse.json({ error: 'comment ยาวเกิน 2000 ตัวอักษร' }, { status: 400 })
      updates.comment_text = t
    }
    if (typeof body.status === 'string') {
      if (!VALID_STATUS.includes(body.status as Status))
        return NextResponse.json({ error: 'status ไม่ถูกต้อง' }, { status: 400 })
      updates.status = body.status
    }

    // snapshot ลง edit history ก่อน UPDATE — fire-and-forget (ถ้าเขียน history ไม่ผ่าน ไม่ block update)
    if (updates.comment_text || updates.status) {
      try {
        await ctx.admin.from('tb_changelog_comment_edits').insert({
          comment_id: id,
          edited_by: ctx.user.id,
          old_text: existing.comment_text,
          old_status: existing.status,
        })
      } catch {/* ignore */}
    }

    const { data: updated, error: updErr } = await ctx.admin
      .from('tb_changelog_comments')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
    return NextResponse.json({ success: true, comment: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}

// ── DELETE — soft delete (เจ้าของ หรือ admin ลบของคนอื่น) ─────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const ctx = await getCallerContext(req)
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

    const { data: existing } = await ctx.admin
      .from('tb_changelog_comments')
      .select('id, user_id, deleted_at, parent_comment_id')
      .eq('id', id)
      .maybeSingle()
    if (!existing) return NextResponse.json({ error: 'comment not found' }, { status: 404 })
    if (existing.deleted_at) return NextResponse.json({ error: 'comment ถูกลบไปแล้ว' }, { status: 410 })

    const isOwner = existing.user_id === ctx.user.id
    if (!isOwner && !ctx.isAdmin)
      return NextResponse.json({ error: 'ลบได้เฉพาะ comment ของตัวเอง หรือ admin' }, { status: 403 })

    const nowIso = new Date().toISOString()
    const { error: delErr } = await ctx.admin
      .from('tb_changelog_comments')
      .update({ deleted_at: nowIso, deleted_by: ctx.user.id })
      .eq('id', id)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

    // v0.7.14.5 — ไม่ cascade soft delete reply อีกต่อไป
    // (parent ที่ลบจะแสดงเป็น tombstone "[ข้อความนี้ถูกลบ]" reply ยังอยู่ใต้ + admin ดูข้อความเดิมได้)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
