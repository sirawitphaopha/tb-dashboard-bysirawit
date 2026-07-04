// POST /api/patient/images/[id]/review-delete — แอดมินอนุมัติ/ปฏิเสธคำขอลบรูป (เฟส 2)
//   action=approve → soft-delete เข้าถังขยะ + เคลียร์ delete_req_* + เมล/กระดิ่งแจ้งผู้ขอ
//   action=reject  → เคลียร์ delete_req_* (รูปกลับปกติ) + เมล/กระดิ่งแจ้งผู้ขอ
import { NextRequest, NextResponse } from 'next/server'
import { getRequester } from '@/lib/patient-image-helpers'
import { getResend, EMAIL_FROM } from '@/lib/resend'
import { imageDeleteApprovedEmail, imageDeleteRejectedEmail } from '@/lib/email-templates'

const TYPE_LABEL: Record<string, string> = { cxr: 'ภาพเอกซเรย์ (CXR)', lab: 'ผลแล็บ', document: 'เอกสาร', other: 'อื่นๆ' }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved || !isAdmin) return NextResponse.json({ error: 'admin only' }, { status: 403 })

    const body = await req.json().catch(() => ({} as any))
    const action = body?.action
    const note = body?.note ? String(body.note).trim().slice(0, 300) : null
    if (action !== 'approve' && action !== 'reject') return NextResponse.json({ error: 'bad action' }, { status: 400 })

    const { data: im } = await admin.from('tb_patient_images')
      .select('patient_id, type, deleted_at, delete_req_by, delete_req_reason').eq('id', id).maybeSingle()
    if (!im || im.deleted_at) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (!im.delete_req_by) return NextResponse.json({ error: 'no pending request' }, { status: 409 })

    const requesterId = im.delete_req_by

    if (action === 'approve') {
      // ชื่อแอดมินผู้อนุมัติ (โชว์ในถังขยะว่าใครลบ)
      let adminName: string | null = null
      try {
        const { data: meP } = await admin.from('profiles').select('first_name, last_name, username').eq('id', user.id).maybeSingle()
        if (meP) adminName = [meP.first_name, meP.last_name].filter(Boolean).join(' ') || meP.username || null
      } catch {}
      const { error } = await admin.from('tb_patient_images').update({
        deleted_at: new Date().toISOString(), deleted_by: user.id,
        deleter_name: adminName, delete_reason: im.delete_req_reason || null,
        delete_req_by: null, delete_req_name: null, delete_req_at: null, delete_req_reason: null,
      }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await admin.from('tb_patient_images').update({
        delete_req_by: null, delete_req_name: null, delete_req_at: null, delete_req_reason: null,
      }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // แจ้งผู้ขอ (เมล + กระดิ่ง) — ล้มเหลวไม่ทำให้การอนุมัติ/ปฏิเสธพัง
    try {
      const { data: authData } = await admin.auth.admin.getUserById(requesterId)
      const email = authData?.user?.email
      const { data: prof } = await admin.from('profiles').select('first_name').eq('id', requesterId).maybeSingle()
      const firstName = prof?.first_name || 'ผู้ใช้'
      const { data: pt } = await admin.from('tb_patients').select('name').eq('id', im.patient_id).maybeSingle()
      const patientName = pt?.name || im.patient_id
      const typeLabel = TYPE_LABEL[im.type] || im.type
      if (email) {
        const mail = action === 'approve'
          ? imageDeleteApprovedEmail(firstName, patientName, typeLabel)
          : imageDeleteRejectedEmail(firstName, patientName, typeLabel, note || undefined)
        try { await getResend().emails.send({ from: EMAIL_FROM, to: email, subject: mail.subject, html: mail.html }) }
        catch (e) { console.error('image review-delete email failed:', e) }
      }
      await admin.from('tb_notifications').insert({
        user_id: requesterId,
        type: action === 'approve' ? 'img_delete_approved' : 'img_delete_rejected',
        patient_name: patientName,
        note: note || null,
      })
    } catch (e) { console.error('image review-delete notify failed:', e) }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
