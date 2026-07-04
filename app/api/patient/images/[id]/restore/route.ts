// POST /api/patient/images/[id]/restore — กู้คืนรูปจากถังขยะ (admin เท่านั้น)
// เคลียร์ deleted_at → รูปกลับมาโชว์ในแท็บปกติ (ไฟล์ R2 ยังอยู่ครบ)
import { NextRequest, NextResponse } from 'next/server'
import { getRequester } from '@/lib/patient-image-helpers'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { imageRestoredEmail } from '@/lib/email-templates'

const TYPE_LABEL: Record<string, string> = { cxr: 'ภาพเอกซเรย์ (CXR)', lab: 'ผลแล็บ', document: 'เอกสาร', other: 'อื่นๆ' }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { data: im } = await admin.from('tb_patient_images').select('uploaded_by, patient_id, type').eq('id', id).maybeSingle()
    const { error } = await admin
      .from('tb_patient_images')
      .update({ deleted_at: null, deleted_by: null, deleter_name: null, delete_reason: null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // แจ้งเจ้าของรูป (คนอัปโหลด) ว่าถูกกู้คืน — ไม่แจ้งถ้าแอดมินคือผู้อัปเอง
    if (im?.uploaded_by && im.uploaded_by !== user.id) {
      try {
        const { data: authData } = await admin.auth.admin.getUserById(im.uploaded_by)
        const email = authData?.user?.email
        const { data: prof } = await admin.from('profiles').select('first_name').eq('id', im.uploaded_by).maybeSingle()
        const { data: pt } = await admin.from('tb_patients').select('name').eq('id', im.patient_id).maybeSingle()
        if (email) {
          const mail = imageRestoredEmail(prof?.first_name || 'ผู้ใช้', pt?.name || im.patient_id, TYPE_LABEL[im.type] || im.type)
          try { await getResend().emails.send({ from: EMAIL_FROM, to: email, subject: mail.subject, html: mail.html }) }
          catch (e) { console.error('image restore email failed:', e) }
        }
      } catch (e) { console.error('image restore notify failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
