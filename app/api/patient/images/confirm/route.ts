// POST /api/patient/images/confirm — บันทึก metadata หลังอัปไฟล์ขึ้น R2 สำเร็จ
import { NextRequest, NextResponse } from 'next/server'
import { getRequester } from '@/lib/patient-image-helpers'
import { logImageEvent } from '@/lib/image-event-log'

const ALLOWED = ['cxr', 'lab', 'document', 'other']

export async function POST(req: NextRequest) {
  try {
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const b = await req.json().catch(() => ({} as any))
    const { patientId, key, thumbKey, type, title, note, size, width, height, mime, origSize, origMime, origWidth, origHeight, quality, device, sha256, md5, crc32, phash } = b
    if (!patientId || !key) return NextResponse.json({ error: 'patientId + key required' }, { status: 400 })
    const { data, error } = await admin
      .from('tb_patient_images')
      .insert({
        patient_id: patientId,
        type: ALLOWED.includes(type) ? type : 'other',
        storage_key: key,
        thumb_key: thumbKey || null,
        mime: mime || 'image/webp',
        size_bytes: size || null,
        width: width || null,
        height: height || null,
        orig_size_bytes: origSize || null,
        orig_mime: origMime || null,
        orig_width: origWidth || null,
        orig_height: origHeight || null,
        quality: quality || null,
        device: device || null,
        title: title || null,
        note: note || null,
        uploaded_by: user.id,
        orig_sha256: sha256 || null,
        orig_md5: md5 || null,
        orig_crc32: crc32 || null,
        phash: phash || null,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logImageEvent(admin, { imageId: data.id, eventType: 'uploaded', actorId: user.id, actorRole: isAdmin ? 'admin' : 'user', imageRow: data })
    return NextResponse.json({ success: true, image: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
