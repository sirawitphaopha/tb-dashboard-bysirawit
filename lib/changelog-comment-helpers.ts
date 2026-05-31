// helper รวมสำหรับ Changelog Comment + Reply + Mention
// extract มาจาก app/api/changelog/comment/route.ts เพื่อ DRY กับ reply/mention/notify route
import type { SupabaseClient } from '@supabase/supabase-js'

export const VALID_STATUS = ['feedback', 'bug_report', 'request', 'note'] as const
export type Status = typeof VALID_STATUS[number]

export const PROFESSION_LABEL: Record<string, string> = {
  pharmacist: 'เภสัชกร',
  doctor: 'แพทย์',
  nurse: 'พยาบาล',
  dentist: 'ทันตแพทย์',
  pharm_tech: 'ผู้ช่วยเภสัชกร',
  health_official: 'เจ้าหน้าที่สาธารณสุข',
  other: 'อื่นๆ',
}

// ชื่อวิชาชีพแบบเต็ม (ใช้แสดงใน avatar)
export const PROF_NAME: Record<string, string> = {
  pharmacist:          'เภสัชกร',
  doctor:              'แพทย์',
  dentist:             'ทันตแพทย์',
  nurse1:              'พยาบาล',
  nurse2:              'พยาบาล',
  medtech:             'เทคนิคการแพทย์',
  physio:              'กายภาพบำบัด',
  radio:               'รังสีการแพทย์',
  publichealthofficer: 'สาธารณสุข',
  publichealthtech:    'นักวิชาการสาธารณสุข',
  officer:             'เจ้าพนักงาน',
  other:               'อื่นๆ',
}

export function professionTitleLabel(professionKey: string, namePrefix: string): string {
  return PROF_NAME[professionKey] || namePrefix || ''
}

export type ProfileSnapshot = {
  email: string
  displayName: string
  roleLabel: 'admin' | 'user'
  professionLabel: string
  profileRow: any
}

// ดึง profile + คำนวณ displayName/role/profession ให้พร้อมใส่ comment
export async function snapshotProfile(admin: SupabaseClient, userId: string): Promise<ProfileSnapshot | null> {
  const { data: profile } = await admin
    .from('profiles')
    .select('email, first_name, last_name, profession, role, title, username')
    .eq('id', userId)
    .maybeSingle()
  if (!profile) return null

  const titlePart = profile.title ? `${profile.title} ` : ''
  const namePart = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
  const displayName = (titlePart + namePart).trim() || profile.email || 'ไม่ระบุชื่อ'
  const roleLabel = profile.role === 'admin' ? 'admin' : 'user'
  const professionLabel = professionTitleLabel(profile.profession, profile.title || '')

  return {
    email: profile.email,
    displayName,
    roleLabel,
    professionLabel,
    profileRow: profile,
  }
}

// ── @mention parser ──────────────────────────────────────────────
// รองรับ username 2 รูปแบบ:
//  1. handle ปกติ: @SirawitP
//  2. username เป็น email: @kikmydad1400@gmail.com
// คืน lowercased, unique
export function extractMentionUsernames(text: string): string[] {
  if (!text) return []
  // first part: ตัวอักษร/ตัวเลข/_/-/. — optional second @host.tld
  const matches = text.matchAll(/@([\w.\-]+(?:@[\w.\-]+\.[A-Za-z]{2,})?)/g)
  const set = new Set<string>()
  for (const m of matches) {
    if (m[1]) set.add(m[1].toLowerCase())
  }
  return Array.from(set)
}

// resolve username[] → user_id[] (เฉพาะ approved + ไม่ใช่ตัว actor เอง)
// ใช้ case-insensitive matching (ilike) เพราะ regex ใน extractMentionUsernames
// lowercase username แต่ DB อาจเก็บแบบ mixed case (เช่น "SirawitP")
export async function resolveMentionedUserIds(
  admin: SupabaseClient,
  usernames: string[],
  actorUserId: string,
): Promise<string[]> {
  if (usernames.length === 0) return []
  // ใช้ OR ของ ilike — case-insensitive
  const orClause = usernames.map(u => `username.ilike.${u}`).join(',')
  const { data, error } = await admin
    .from('profiles')
    .select('id, username, status')
    .or(orClause)
    .eq('status', 'approved')
  if (error) {
    console.error('[resolveMentionedUserIds] query failed:', error.message, 'usernames:', usernames)
    return []
  }
  if (!data) return []
  return data
    .filter((p: any) => p.id !== actorUserId)
    .map((p: any) => p.id)
}

// แจ้ง admin ทุกคนเมื่อมี comment ใหม่ของ user คนอื่น
// skip ถ้า admin = actor หรือ admin อยู่ใน excludeUserIds (จะได้ notif ประเภทเฉพาะแล้ว)
export async function notifyAdminsOfNewComment(
  admin: SupabaseClient,
  params: {
    actorUserId: string
    actorName: string
    commentVersion: string
    commentId: string
    excludeUserIds?: string[]   // admin ที่ได้ notif เฉพาะ (reply/mention) แล้ว ไม่ต้องส่งซ้ำ
  }
): Promise<void> {
  try {
    const { data: admins } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('status', 'approved')
    if (!admins) return
    const exclude = new Set([params.actorUserId, ...(params.excludeUserIds || [])])
    for (const a of admins) {
      if (exclude.has(a.id)) continue
      try {
        const { error } = await admin.from('tb_notifications').insert({
          user_id: a.id,
          type: 'comment_new',
          note: params.actorName,
          comment_version: params.commentVersion,
          comment_id: params.commentId,
          is_read: false,
        })
        if (error) console.error('[notifyAdminsOfNewComment] insert failed:', error.message, 'admin:', a.id)
      } catch (e: any) {
        console.error('[notifyAdminsOfNewComment] exception:', e?.message || e)
      }
    }
  } catch (e: any) {
    console.error('[notifyAdminsOfNewComment] query failed:', e?.message || e)
  }
}

// ── สร้าง tb_notifications row (skip self) ────────────────────────
export async function insertCommentNotif(
  admin: SupabaseClient,
  params: {
    userId: string                  // ผู้รับ notif
    actorUserId: string             // ผู้สร้าง action
    type: 'comment_reply' | 'comment_mention' | 'comment_resolved'
    note: string                    // preview/หัวข้อ
    commentVersion: string
    commentId: string
  }
): Promise<void> {
  if (params.userId === params.actorUserId) return  // skip self
  try {
    const { error } = await admin.from('tb_notifications').insert({
      user_id: params.userId,
      type: params.type,
      note: params.note,
      comment_version: params.commentVersion,
      comment_id: params.commentId,
      is_read: false,
    })
    if (error) console.error('[insertCommentNotif] insert failed:', error.message, 'params:', params)
  } catch (e: any) {
    console.error('[insertCommentNotif] exception:', e?.message || e, 'params:', params)
  }
}
