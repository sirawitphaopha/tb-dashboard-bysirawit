// lib/image-event-log.ts — บันทึก event ของรูปผู้ป่วยลงตาราง tb_image_event_log
// เรียกจาก API route หลัง mutation สำเร็จ · ห่อ try/catch เสมอ (ล้มเหลวไม่ทำให้งานหลักพัง = fire-and-forget)
import type { SupabaseClient } from '@supabase/supabase-js'

export type ImageEventType =
  | 'uploaded' | 'metadata_updated' | 'delete_requested' | 'delete_request_cancelled'
  | 'delete_direct' | 'delete_approved' | 'delete_rejected' | 'restored' | 'hard_deleted' | 'purged'

// ชื่อแสดงผลจาก profiles (first+last หรือ username)
async function nameOf(admin: SupabaseClient, id?: string | null): Promise<string | null> {
  if (!id) return null
  try {
    const { data } = await admin.from('profiles').select('first_name, last_name, username').eq('id', id).maybeSingle()
    if (!data) return null
    return [data.first_name, data.last_name].filter(Boolean).join(' ') || data.username || null
  } catch { return null }
}

export async function logImageEvent(admin: SupabaseClient, opts: {
  imageId: string
  eventType: ImageEventType
  actorId?: string | null
  actorName?: string | null   // ใส่เองได้ (เช่น 'ระบบอัตโนมัติ' สำหรับ cron ที่ไม่มี user)
  actorRole?: 'admin' | 'user' | null
  reason?: string | null
  imageRow?: Record<string, any> | null   // ส่งมาถ้ารูปจะถูกลบ (hard/purge) เพราะ fetch หลังลบไม่ได้ · ไม่ส่ง = helper ดึง select * เอง
}): Promise<void> {
  try {
    let row = opts.imageRow || null
    if (!row) {
      try {
        const { data } = await admin.from('tb_patient_images').select('*').eq('id', opts.imageId).maybeSingle()
        row = data || null
      } catch {}
    }
    const r = row || {}
    const patientId = r.patient_id ?? null
    const ownerId = r.uploaded_by ?? null

    // ชื่อผู้ป่วย + HN (snapshot)
    let patientName: string | null = null, patientHn: string | null = null
    if (patientId) {
      try {
        const { data: pt } = await admin.from('tb_patients').select('name, hn').eq('id', patientId).maybeSingle()
        if (pt) { patientName = pt.name ?? null; patientHn = pt.hn ?? null }
      } catch {}
    }

    // metadata รูปเต็ม ณ ตอนนั้น (snapshot · เก็บไว้แม้รูปถูกลบถาวร)
    const snapshot = row ? {
      type: r.type ?? null, title: r.title ?? null, note: r.note ?? null,
      mime: r.mime ?? null, size_bytes: r.size_bytes ?? null, width: r.width ?? null, height: r.height ?? null,
      orig_size_bytes: r.orig_size_bytes ?? null, orig_mime: r.orig_mime ?? null,
      orig_width: r.orig_width ?? null, orig_height: r.orig_height ?? null,
      quality: r.quality ?? null, device: r.device ?? null,
      storage_key: r.storage_key ?? null, thumb_key: r.thumb_key ?? null,
      uploaded_by: ownerId, uploaded_at: r.uploaded_at ?? null,
      deleted_at: r.deleted_at ?? null, deleter_name: r.deleter_name ?? null,
      orig_sha256: r.orig_sha256 ?? null, orig_md5: r.orig_md5 ?? null, orig_crc32: r.orig_crc32 ?? null,
      webp_sha256: r.webp_sha256 ?? null, webp_md5: r.webp_md5 ?? null, webp_crc32: r.webp_crc32 ?? null, phash: r.phash ?? null,
    } : null

    await admin.from('tb_image_event_log').insert({
      image_id: opts.imageId,
      event_type: opts.eventType,
      patient_id: patientId,
      patient_name: patientName,
      patient_hn: patientHn,
      image_type: r.type ?? null,
      actor_id: opts.actorId ?? null,
      actor_name: opts.actorName ?? await nameOf(admin, opts.actorId),
      actor_role: opts.actorRole ?? null,
      owner_id: ownerId,
      owner_name: await nameOf(admin, ownerId),
      reason: opts.reason ?? null,
      snapshot,
    })
  } catch (e) {
    console.error('logImageEvent failed:', e)   // fire-and-forget — ไม่ทำให้งานหลักพัง
  }
}
