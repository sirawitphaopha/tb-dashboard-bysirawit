// DELETE /api/patient/images/[id] — ลบรูป (soft delete + ลบไฟล์ R2) · เจ้าของหรือ admin
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, PATIENT_BUCKET } from '@/lib/patient-image-helpers'
import { r2Delete } from '@/lib/r2'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { data: im } = await admin
      .from('tb_patient_images')
      .select('storage_key, thumb_key, uploaded_by, deleted_at')
      .eq('id', id)
      .maybeSingle()
    if (!im || im.deleted_at) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (im.uploaded_by !== user.id && !isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    // soft delete + audit
    const { error } = await admin
      .from('tb_patient_images')
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // ลบไฟล์จริงใน R2 ทั้งรูปเต็ม + รูปย่อ (ถ้า fail ก็ปล่อย — DB ล้างแล้ว)
    try { await r2Delete(im.storage_key, PATIENT_BUCKET) } catch {}
    if (im.thumb_key) { try { await r2Delete(im.thumb_key, PATIENT_BUCKET) } catch {} }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
