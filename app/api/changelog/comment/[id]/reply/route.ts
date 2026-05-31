// POST — ตอบกลับ comment (reply)
// • validate: parent ต้องมีอยู่ + ไม่ใช่ reply (1 level only)
// • snapshot profile + parse mention
// • แจ้ง bell + email ให้: เจ้าของ parent comment + mentioned users
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { changelogReplyNotifyEmail, changelogMentionNotifyEmail } from '@/lib/email-templates'
import {
  VALID_STATUS,
  snapshotProfile,
  extractMentionUsernames,
  resolveMentionedUserIds,
  insertCommentNotif,
  type Status,
} from '@/lib/changelog-comment-helpers'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: parentId } = await params
    const { comment_text, status } = await req.json()
    if (!comment_text || typeof comment_text !== 'string' || !comment_text.trim())
      return NextResponse.json({ error: 'comment ว่างไม่ได้' }, { status: 400 })
    if (comment_text.length > 2000)
      return NextResponse.json({ error: 'comment ยาวเกิน 2000 ตัวอักษร' }, { status: 400 })
    if (!VALID_STATUS.includes(status as Status))
      return NextResponse.json({ error: 'status ไม่ถูกต้อง' }, { status: 400 })

    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // ── หา parent ──
    const { data: parent } = await admin
      .from('tb_changelog_comments')
      .select('id, user_id, parent_comment_id, version, deleted_at, display_name')
      .eq('id', parentId)
      .maybeSingle()
    if (!parent) return NextResponse.json({ error: 'parent comment ไม่พบ' }, { status: 404 })
    if (parent.deleted_at) return NextResponse.json({ error: 'parent ถูกลบไปแล้ว' }, { status: 410 })
    if (parent.parent_comment_id) return NextResponse.json({ error: 'ตอบกลับซ้อนไม่ได้' }, { status: 400 })

    const snap = await snapshotProfile(admin, user.id)
    if (!snap) return NextResponse.json({ error: 'profile not found' }, { status: 404 })

    // ── parse @mention ──
    const usernames = extractMentionUsernames(comment_text)
    const mentionedUserIds = await resolveMentionedUserIds(admin, usernames, user.id)

    // insert reply
    const { data: newRow, error: insErr } = await admin
      .from('tb_changelog_comments')
      .insert({
        version: parent.version,
        user_id: user.id,
        email: snap.email,
        display_name: snap.displayName,
        role: snap.roleLabel,
        profession_label: snap.professionLabel,
        comment_text: comment_text.trim(),
        status,
        parent_comment_id: parent.id,
        mentioned_user_ids: mentionedUserIds,
      })
      .select('*')
      .single()
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

    const baseUrl = req.nextUrl.origin

    // ── แจ้งเจ้าของ parent (bell + email) ──
    await insertCommentNotif(admin, {
      userId: parent.user_id,
      actorUserId: user.id,
      type: 'comment_reply',
      note: snap.displayName,
      commentVersion: parent.version,
      commentId: newRow.id,
    })
    if (parent.user_id !== user.id) {
      try {
        const { data: ownerRow } = await admin
          .from('profiles')
          .select('email')
          .eq('id', parent.user_id)
          .maybeSingle()
        if (ownerRow?.email) {
          const mail = changelogReplyNotifyEmail(
            parent.version,
            snap.displayName,
            comment_text.trim(),
            baseUrl,
          )
          await getResend().emails.send({
            from: EMAIL_FROM,
            to: [ownerRow.email],
            subject: mail.subject,
            html: mail.html,
          })
        }
      } catch (e) { console.error('reply notify email failed:', e) }
    }

    // ── แจ้ง mention (bell + email) ──
    for (const uid of mentionedUserIds) {
      if (uid === parent.user_id) continue   // ถ้าเจ้าของ parent ก็ถูก mention ด้วย — ไม่ส่งซ้ำ
      await insertCommentNotif(admin, {
        userId: uid,
        actorUserId: user.id,
        type: 'comment_mention',
        note: snap.displayName,
        commentVersion: parent.version,
        commentId: newRow.id,
      })
    }
    if (mentionedUserIds.length > 0) {
      try {
        const targets = mentionedUserIds.filter(uid => uid !== parent.user_id)
        if (targets.length > 0) {
          const { data: mUsers } = await admin
            .from('profiles')
            .select('id, email')
            .in('id', targets)
          if (mUsers && mUsers.length > 0) {
            const mail = changelogMentionNotifyEmail(
              parent.version,
              snap.displayName,
              comment_text.trim(),
              baseUrl,
            )
            await getResend().emails.send({
              from: EMAIL_FROM,
              to: mUsers.map((u: any) => u.email).filter(Boolean),
              subject: mail.subject,
              html: mail.html,
            })
          }
        }
      } catch (e) { console.error('mention email (reply) failed:', e) }
    }

    return NextResponse.json({ success: true, comment: newRow })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
