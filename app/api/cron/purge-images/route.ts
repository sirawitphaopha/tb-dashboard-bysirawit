// POST /api/cron/purge-images — ลบรูปในถังขยะที่เกิน 60 วันอัตโนมัติ (row + ไฟล์ R2)
// เรียกโดย pg_cron (ผ่าน pg_net) รายวัน · ป้องกันด้วย header x-cron-secret = env CRON_SECRET
// SQL ตั้ง cron: scripts/add-image-autopurge-cron.sql
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { r2Delete } from '@/lib/r2'
import { PATIENT_BUCKET } from '@/lib/patient-image-helpers'
import { logImageEvent } from '@/lib/image-event-log'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (req.headers.get('x-cron-secret') !== secret) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const admin = createAdminClient()
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()   // เกิน 60 วัน
    const { data, error } = await admin
      .from('tb_patient_images')
      .select('*')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoff)
      .limit(200)   // ทีละ 200 กันtimeout · รันรายวัน (สะสมได้)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const rows = data || []
    if (!rows.length) return NextResponse.json({ purged: 0 })

    // log ก่อนลบ (เก็บ snapshot ถาวร · actor = ระบบอัตโนมัติ)
    for (const im of rows) {
      await logImageEvent(admin, { imageId: im.id, eventType: 'purged', actorName: 'ระบบอัตโนมัติ', reason: 'ลบอัตโนมัติ เกิน 60 วัน', imageRow: im })
    }

    // ลบไฟล์จริงใน R2 (รูปเต็ม + รูปย่อ) — ทนทาน: บางไฟล์ล้มก็ลบ row ต่อ (ไฟล์กำพร้าเก็บกวาดทีหลังได้)
    await Promise.allSettled(rows.flatMap((im: any) => {
      const ops: Promise<any>[] = []
      if (im.storage_key) ops.push(r2Delete(im.storage_key, PATIENT_BUCKET))
      if (im.thumb_key)   ops.push(r2Delete(im.thumb_key, PATIENT_BUCKET))
      return ops
    }))

    // ลบ row ออกจาก DB
    const ids = rows.map((r: any) => r.id)
    const { error: delErr } = await admin.from('tb_patient_images').delete().in('id', ids)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

    return NextResponse.json({ purged: ids.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
