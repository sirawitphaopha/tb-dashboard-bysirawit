// POST /api/patient/images/presign — ขอ presigned PUT URL สำหรับอัปรูปผู้ป่วยเข้า R2 (private)
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, PATIENT_BUCKET } from '@/lib/patient-image-helpers'
import { presignPut } from '@/lib/r2'

export async function POST(req: NextRequest) {
  try {
    const { user, isApproved } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const { patientId } = await req.json().catch(() => ({} as any))
    if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })
    const uid = crypto.randomUUID()
    const key = `patients/${patientId}/${uid}.webp`             // รูปเต็ม
    const thumbKey = `patients/${patientId}/${uid}_thumb.webp`  // รูปย่อ (แกลเลอรี)
    const [uploadUrl, uploadUrlThumb] = await Promise.all([
      presignPut(key, 300, PATIENT_BUCKET),
      presignPut(thumbKey, 300, PATIENT_BUCKET),
    ])
    return NextResponse.json({ uploadUrl, key, uploadUrlThumb, thumbKey })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
