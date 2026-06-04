// GET /api/patient/images/[id]/url — ขอ signed URL "สดใหม่" ของรูปเต็ม (ตอนกดเปิด lightbox)
// กันกรณีเปิดหน้าทิ้งไว้นาน → ลิงก์ใน list หมดอายุ → ขอใหม่ ณ ตอนคลิก
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, PATIENT_BUCKET } from '@/lib/patient-image-helpers'
import { presignGet } from '@/lib/r2'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const { data } = await admin
      .from('tb_patient_images')
      .select('storage_key, deleted_at')
      .eq('id', id)
      .maybeSingle()
    if (!data || data.deleted_at) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const url = await presignGet(data.storage_key, 3600, PATIENT_BUCKET)   // 1 ชม.
    return NextResponse.json({ url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
