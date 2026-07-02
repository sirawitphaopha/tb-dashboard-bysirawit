// POST /api/patient/images/[id]/restore — กู้คืนรูปจากถังขยะ (admin เท่านั้น)
// เคลียร์ deleted_at → รูปกลับมาโชว์ในแท็บปกติ (ไฟล์ R2 ยังอยู่ครบ)
import { NextRequest, NextResponse } from 'next/server'
import { getRequester } from '@/lib/patient-image-helpers'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { error } = await admin
      .from('tb_patient_images')
      .update({ deleted_at: null, deleted_by: null, deleter_name: null, delete_reason: null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
