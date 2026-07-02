// POST /api/patient/images/purge — ลบรูป "ทั้งหมด" ของผู้ป่วยออกจาก R2 + DB (admin เท่านั้น)
// ใช้ตอนลบผู้ป่วยถาวร (hard delete) เพื่อกันไฟล์กำพร้าค้างใน R2
// หมายเหตุ: tb_patient_images FK = on delete cascade → ลบผู้ป่วยแล้ว row หายเอง แต่ "ไฟล์ R2" ไม่หาย
//          จึงต้องดึง key ทั้งหมด (รวมรูปในถังขยะ soft-deleted) มาลบ R2 ก่อน
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, PATIENT_BUCKET } from '@/lib/patient-image-helpers'
import { r2Delete } from '@/lib/r2'

export async function POST(req: NextRequest) {
  try {
    const { user, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { patientId } = await req.json().catch(() => ({} as any))
    if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })

    // ดึงรูปทั้งหมดของผู้ป่วย (รวมที่อยู่ถังขยะ soft-deleted)
    const { data: imgs } = await admin
      .from('tb_patient_images')
      .select('id, storage_key, thumb_key')
      .eq('patient_id', patientId)

    let r2Deleted = 0
    for (const im of imgs || []) {
      if (im.storage_key) { try { await r2Delete(im.storage_key, PATIENT_BUCKET); r2Deleted++ } catch {} }
      if (im.thumb_key)   { try { await r2Delete(im.thumb_key, PATIENT_BUCKET) } catch {} }
    }

    // ลบ row ออกจาก DB (ชัดเจน · ถ้าผู้ป่วยถูกลบทีหลัง cascade ก็ไม่เจออะไรแล้ว)
    await admin.from('tb_patient_images').delete().eq('patient_id', patientId)

    return NextResponse.json({ success: true, count: imgs?.length || 0, r2Deleted })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
