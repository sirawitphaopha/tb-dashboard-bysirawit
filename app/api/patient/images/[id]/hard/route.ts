// POST /api/patient/images/[id]/hard — ลบรูปถาวรจากถังขยะ (admin เท่านั้น)
// ลบไฟล์จริงออกจาก R2 (รูปเต็ม + รูปย่อ) แล้วลบ row ออกจาก DB — กู้คืนไม่ได้
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, PATIENT_BUCKET } from '@/lib/patient-image-helpers'
import { r2Delete } from '@/lib/r2'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { imageHardDeletedEmail } from '@/lib/email-templates'

const TYPE_LABEL: Record<string, string> = { cxr: 'ภาพเอกซเรย์ (CXR)', lab: 'ผลแล็บ', document: 'เอกสาร', other: 'อื่นๆ' }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { data: im } = await admin
      .from('tb_patient_images')
      .select('storage_key, thumb_key, uploaded_by, patient_id, type')
      .eq('id', id)
      .maybeSingle()
    if (!im) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (im.storage_key) { try { await r2Delete(im.storage_key, PATIENT_BUCKET) } catch {} }
    if (im.thumb_key)   { try { await r2Delete(im.thumb_key, PATIENT_BUCKET) } catch {} }

    const { error } = await admin.from('tb_patient_images').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // แจ้งเจ้าของรูป (คนอัปโหลด) ว่าถูกลบถาวร — ไม่แจ้งถ้าแอดมินคือผู้อัปเอง
    if (im.uploaded_by && im.uploaded_by !== user.id) {
      try {
        const { data: authData } = await admin.auth.admin.getUserById(im.uploaded_by)
        const email = authData?.user?.email
        const { data: prof } = await admin.from('profiles').select('first_name').eq('id', im.uploaded_by).maybeSingle()
        const { data: pt } = await admin.from('tb_patients').select('name').eq('id', im.patient_id).maybeSingle()
        if (email) {
          const mail = imageHardDeletedEmail(prof?.first_name || 'ผู้ใช้', pt?.name || im.patient_id, TYPE_LABEL[im.type] || im.type)
          try { await getResend().emails.send({ from: EMAIL_FROM, to: email, subject: mail.subject, html: mail.html }) }
          catch (e) { console.error('image hard-delete email failed:', e) }
        }
      } catch (e) { console.error('image hard-delete notify failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
