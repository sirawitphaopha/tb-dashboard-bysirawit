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
    // v0.7.20 — ลบรูปตรง = แอดมินเท่านั้น (เหมือนระบบผู้ป่วย) · คนอื่นต้องใช้ request-delete (ขอลบ → รออนุมัติ)
    if (!isAdmin) return NextResponse.json({ error: 'admin only' }, { status: 403 })

    const body = await req.json().catch(() => ({} as any))
    const reason = (body?.reason ? String(body.reason).trim().slice(0, 300) : '') || null

    // ชื่อคนลบ ณ ตอนลบ (โชว์ในถังขยะ)
    let deleterName: string | null = null
    try {
      const { data: me } = await admin.from('profiles').select('first_name, last_name, username').eq('id', user.id).maybeSingle()
      if (me) deleterName = [me.first_name, me.last_name].filter(Boolean).join(' ') || me.username || null
    } catch {}

    // soft delete → ย้ายไปถังขยะ (เก็บไฟล์ R2 ไว้ก่อน เพื่อกู้คืนได้ · ลบ R2 จริงตอน "ลบถาวร"/auto-purge 60 วัน)
    const { error } = await admin
      .from('tb_patient_images')
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id, deleter_name: deleterName, delete_reason: reason })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}

// PATCH /api/patient/images/[id] — แก้หมวด/หมายเหตุ/ชื่อ (เจ้าของหรือ admin) · ไม่แตะไฟล์/คุณภาพ
const ALLOWED_TYPES = ['cxr', 'lab', 'document', 'other']
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { data: im } = await admin
      .from('tb_patient_images')
      .select('uploaded_by, deleted_at')
      .eq('id', id)
      .maybeSingle()
    if (!im || im.deleted_at) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (im.uploaded_by !== user.id && !isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const b = await req.json().catch(() => ({} as any))
    const upd: any = {}
    if (typeof b.type === 'string' && ALLOWED_TYPES.includes(b.type)) upd.type = b.type
    if ('note' in b) upd.note = b.note || null
    if ('title' in b) upd.title = b.title || null
    // ย่อขนาดใหม่ตอนเปลี่ยนหมวด (client ส่งไฟล์ย่อแล้ว + คีย์ใหม่) → อัปเดตคีย์/มิติ + ลบไฟล์เก่า
    if (b.storageKey) {
      upd.storage_key = b.storageKey
      upd.thumb_key = b.thumbKey || null
      if (b.width) upd.width = b.width
      if (b.height) upd.height = b.height
      if (b.size) upd.size_bytes = b.size
      if (b.quality) upd.quality = b.quality
    }
    if (!Object.keys(upd).length) return NextResponse.json({ error: 'no changes' }, { status: 400 })

    const { error } = await admin.from('tb_patient_images').update(upd).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // ลบไฟล์เก่าใน R2 (กรณีย่อขนาดใหม่ = เปลี่ยนคีย์)
    if (b.storageKey && b.oldKey && b.oldKey !== b.storageKey) {
      try { await r2Delete(b.oldKey, PATIENT_BUCKET) } catch {}
      if (b.oldThumbKey && b.oldThumbKey !== b.thumbKey) { try { await r2Delete(b.oldThumbKey, PATIENT_BUCKET) } catch {} }
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
