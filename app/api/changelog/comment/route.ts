// POST — เพิ่ม comment ใหม่ในหน้า Changelog
// • รองรับ parent_comment_id (= reply) — แต่ปกติ reply ใช้ route /comment/[id]/reply โดยตรงดีกว่า
// • parse @mention → เก็บ user_id ลง mentioned_user_ids[]
// • snapshot profile (email/display_name/role/profession_label)
// • ส่ง email แจ้ง admin
// • ส่ง bell + email แจ้ง user ที่ถูก mention
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { changelogCommentNotifyEmail, changelogMentionNotifyEmail } from '@/lib/email-templates'
import {
  VALID_STATUS,
  PROFESSION_LABEL,
  snapshotProfile,
  extractMentionUsernames,
  resolveMentionedUserIds,
  insertCommentNotif,
  type Status,
} from '@/lib/changelog-comment-helpers'

export async function POST(req: NextRequest) {
  try {
    const { version, comment_text, status, parent_comment_id } = await req.json()
    if (!version || typeof version !== 'string')
      return NextResponse.json({ error: 'missing version' }, { status: 400 })
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
    const snap = await snapshotProfile(admin, user.id)
    if (!snap) return NextResponse.json({ error: 'profile not found' }, { status: 404 })

    // ── ตรวจ parent (ถ้ามี) — block reply ของ reply ──
    let parentRow: any = null
    if (parent_comment_id) {
      const { data: p } = await admin
        .from('tb_changelog_comments')
        .select('id, user_id, parent_comment_id, version, deleted_at')
        .eq('id', parent_comment_id)
        .maybeSingle()
      if (!p) return NextResponse.json({ error: 'parent comment ไม่พบ' }, { status: 404 })
      if (p.deleted_at) return NextResponse.json({ error: 'parent ถูกลบไปแล้ว' }, { status: 410 })
      if (p.parent_comment_id) return NextResponse.json({ error: 'ตอบกลับซ้อนไม่ได้' }, { status: 400 })
      parentRow = p
    }

    // ── parse @mention → resolve user_ids ──
    const usernames = extractMentionUsernames(comment_text)
    const mentionedUserIds = await resolveMentionedUserIds(admin, usernames, user.id)

    // insert
    const { data: newRow, error: insErr } = await admin
      .from('tb_changelog_comments')
      .insert({
        version: parentRow?.version || version,
        user_id: user.id,
        email: snap.email,
        display_name: snap.displayName,
        role: snap.roleLabel,
        profession_label: snap.professionLabel,
        comment_text: comment_text.trim(),
        status,
        parent_comment_id: parent_comment_id || null,
        mentioned_user_ids: mentionedUserIds,
      })
      .select('*')
      .single()

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

    const baseUrl = req.nextUrl.origin

    // ── ส่งอีเมลแจ้ง admin (fire-and-forget) ──
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean)
    if (adminEmails.length > 0) {
      try {
        const profLabel = PROFESSION_LABEL[snap.profileRow.profession] || snap.profileRow.profession || ''
        const mail = changelogCommentNotifyEmail(
          version,
          status,
          snap.displayName,
          profLabel ? `${snap.roleLabel} · ${profLabel}` : snap.roleLabel,
          snap.email,
          comment_text.trim(),
          baseUrl,
          newRow?.created_at,
        )
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: adminEmails,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (e) { console.error('changelog comment admin email failed:', e) }
    }

    // ── แจ้ง mentioned users (bell + email) ──
    if (mentionedUserIds.length > 0) {
      const notePreview = comment_text.trim().slice(0, 80)
      for (const uid of mentionedUserIds) {
        await insertCommentNotif(admin, {
          userId: uid,
          actorUserId: user.id,
          type: 'comment_mention',
          note: snap.displayName,
          commentVersion: newRow.version,
          commentId: newRow.id,
        })
      }
      // email — ดึง email ของผู้ที่ถูก mention
      try {
        const { data: mUsers } = await admin
          .from('profiles')
          .select('id, email')
          .in('id', mentionedUserIds)
        if (mUsers && mUsers.length > 0) {
          const mail = changelogMentionNotifyEmail(
            newRow.version,
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
      } catch (e) { console.error('mention email failed:', e) }
    }

    return NextResponse.json({ success: true, comment: newRow })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
