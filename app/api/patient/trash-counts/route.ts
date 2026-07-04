// GET /api/patient/trash-counts — จำนวนของในถังขยะ (ผู้ป่วย + รูป) สำหรับ badge เมนู/แท็บ
import { NextRequest, NextResponse } from 'next/server'
import { getRequester } from '@/lib/patient-image-helpers'

export async function GET(req: NextRequest) {
  try {
    const { user, isApproved, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { count: patients } = await admin.from('tb_patients')
      .select('id', { count: 'exact', head: true }).not('deleted_at', 'is', null)
    const { count: images } = await admin.from('tb_patient_images')
      .select('id', { count: 'exact', head: true }).not('deleted_at', 'is', null)

    return NextResponse.json({ patients: patients || 0, images: images || 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
