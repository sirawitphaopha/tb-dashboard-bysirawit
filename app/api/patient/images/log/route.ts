// GET /api/patient/images/log — คืน event ทั้งหมดของรูปผู้ป่วย (admin เท่านั้น)
// โหลดรอบเดียว แล้ว client กรอง/จัดกลุ่มตามรูป/ตรวจรูปซ้ำเอง → กดกรองแล้วทันที ไม่ต้องรอเน็ต
// (imageId = ดูเฉพาะรูปเดียว · ไม่ส่ง = ทั้งหมด)
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, PATIENT_BUCKET } from '@/lib/patient-image-helpers'
import { presignGet } from '@/lib/r2'

export async function GET(req: NextRequest) {
  try {
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved || !isAdmin) return NextResponse.json({ error: 'admin only' }, { status: 403 })

    const imageId = (req.nextUrl.searchParams.get('imageId') || '').trim()
    const CAP = 5000   // สูงสุดที่ดึงมา (เพียงพอสำหรับสเกลนี้ · เกินนี้จะแจ้ง capped)
    let query = admin.from('tb_image_event_log').select('*').order('created_at', { ascending: false }).limit(CAP)
    if (imageId) query = query.eq('image_id', imageId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const events = data || []

    // รูปย่อ (thumbnail) ต่อรูป — สร้าง signed URL เฉพาะรูปที่ยังไม่ถูกลบถาวร (ไฟล์ยังอยู่ใน R2)
    // รูปที่ลบถาวร/ลบอัตโนมัติแล้ว = ไฟล์หายจาก R2 → หน้าเว็บโชว์ placeholder แทน (เพราะดูรูปจริงไม่ได้อีก)
    const goneIds = new Set<string>()
    const thumbKeyOf = new Map<string, string>()   // image_id -> thumb_key/storage_key ล่าสุด (รูปย่อ · events เรียงใหม่→เก่า จึงตัวแรกที่เจอ = ใหม่สุด)
    const fullKeyOf = new Map<string, string>()     // image_id -> storage_key ล่าสุด (รูปเต็ม · กดดูรูปได้)
    for (const e of events) {
      if (e.event_type === 'hard_deleted' || e.event_type === 'purged') goneIds.add(e.image_id)
      const s = e.snapshot
      if (s && (s.thumb_key || s.storage_key) && !thumbKeyOf.has(e.image_id)) thumbKeyOf.set(e.image_id, s.thumb_key || s.storage_key)
      if (s && s.storage_key && !fullKeyOf.has(e.image_id)) fullKeyOf.set(e.image_id, s.storage_key)
    }
    const thumbs: Record<string, string> = {}
    const fulls: Record<string, string> = {}
    await Promise.all([
      ...[...thumbKeyOf.entries()].map(async ([id, key]) => { if (goneIds.has(id)) return; try { thumbs[id] = await presignGet(key, 7200, PATIENT_BUCKET) } catch {} }),
      ...[...fullKeyOf.entries()].map(async ([id, key]) => { if (goneIds.has(id)) return; try { fulls[id] = await presignGet(key, 7200, PATIENT_BUCKET) } catch {} }),
    ])

    return NextResponse.json({ events, capped: events.length >= CAP, thumbs, fulls })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
