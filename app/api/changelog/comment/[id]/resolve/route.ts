// PATCH — mark/unmark resolved (ปิด/เปิดประเด็น)
// permission: เจ้าของ comment + admin เท่านั้น
// body: { resolved: boolean }
// แจ้ง bell + email ให้เจ้าของ (skip ถ้า resolver = owner)
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { changelogResolvedNotifyEmail } from '@/lib/email-templates'
import { insertCommentNotif, snapshotProfile } from '@/lib/changelog-comment-helpers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { resolved } = await req.json()
    if (typeof resolved !== 'boolean')
      return NextResponse.json({ error: 'missing resolved boolean' }, { status: 400 })

    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const isAdmin = profile?.role === 'admin'

    const { data: existing } = await admin
      .from('tb_changelog_comments')
      .select('id, user_id, deleted_at, version, status, comment_text, resolved_at')
      .eq('id', id)
      .maybeSingle()
    if (!existing) return NextResponse.json({ error: 'comment not found' }, { status: 404 })
    if (existing.deleted_at) return NextResponse.json({ error: 'comment ถูกลบไปแล้ว' }, { status: 410 })

    if (!isAdmin)
      return NextResponse.json({ error: 'อนุญาตเฉพาะ admin เท่านั้น' }, { status: 403 })

    const updates: any = resolved
      ? { resolved_at: new Date().toISOString(), resolved_by: user.id }
      : { resolved_at: null, resolved_by: null }

    const { data: updated, error: updErr } = await admin
      .from('tb_changelog_comments')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    // ── แจ้งเจ้าของ comment (skip ถ้า resolver = owner) ──
    if (resolved && existing.user_id !== user.id) {
      const snap = await snapshotProfile(admin, user.id)
      const actorName = snap?.displayName || 'admin'
      await insertCommentNotif(admin, {
        userId: existing.user_id,
        actorUserId: user.id,
        type: 'comment_resolved',
        note: actorName,
        commentVersion: existing.version,
        commentId: existing.id,
      })

      // email
      try {
        const { data: owner } = await admin
          .from('profiles')
          .select('email')
          .eq('id', existing.user_id)
          .maybeSingle()
        if (owner?.email) {
          const mail = changelogResolvedNotifyEmail(
            existing.version,
            existing.status,
            actorName,
            existing.comment_text,
            req.nextUrl.origin,
          )
          await getResend().emails.send({
            from: EMAIL_FROM,
            to: [owner.email],
            subject: mail.subject,
            html: mail.html,
          })
        }
      } catch (e) { console.error('resolved email failed:', e) }
    }

    return NextResponse.json({ success: true, comment: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
