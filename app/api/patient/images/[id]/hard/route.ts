// POST /api/patient/images/[id]/hard — ลบรูปถาวรจากถังขยะ (admin เท่านั้น)
// ลบไฟล์จริงออกจาก R2 (รูปเต็ม + รูปย่อ) แล้วลบ row ออกจาก DB — กู้คืนไม่ได้
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, PATIENT_BUCKET } from '@/lib/patient-image-helpers'
import { r2Delete } from '@/lib/r2'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { data: im } = await admin
      .from('tb_patient_images')
      .select('storage_key, thumb_key')
      .eq('id', id)
      .maybeSingle()
    if (!im) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (im.storage_key) { try { await r2Delete(im.storage_key, PATIENT_BUCKET) } catch {} }
    if (im.thumb_key)   { try { await r2Delete(im.thumb_key, PATIENT_BUCKET) } catch {} }

    const { error } = await admin.from('tb_patient_images').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
