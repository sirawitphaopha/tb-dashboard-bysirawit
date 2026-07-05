// POST   /api/patient/images/[id]/request-delete — user (ไม่ใช่แอดมิน) ขอลบรูป → ตั้ง delete_req_* + เมลแจ้งแอดมิน (เฟส 2)
// DELETE /api/patient/images/[id]/request-delete — ผู้ขอ (หรือแอดมิน) ยกเลิกคำขอ → เคลียร์ delete_req_*
import { NextRequest, NextResponse } from 'next/server'
import { getRequester } from '@/lib/patient-image-helpers'
import { getResend, EMAIL_FROM, ADMIN_EMAILS } from '@/lib/resend'
import { adminImageDeleteRequestEmail, adminImageDeleteRequestCancelledEmail,
  imageDeleteRequestSubmittedEmail, imageDeleteRequestCancelledByAdminEmail } from '@/lib/email-templates'
import { professionLabel } from '@/lib/professions'
import { logImageEvent } from '@/lib/image-event-log'

const TYPE_LABEL: Record<string, string> = { cxr: 'ภาพเอกซเรย์ (CXR)', lab: 'ผลแล็บ', document: 'เอกสาร', other: 'อื่นๆ' }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const body = await req.json().catch(() => ({} as any))
    const reason = (body?.reason ? String(body.reason).trim().slice(0, 300) : '')
    if (!reason) return NextResponse.json({ error: 'reason required' }, { status: 400 })

    const { data: im } = await admin
      .from('tb_patient_images')
      .select('patient_id, type, deleted_at, delete_req_by')
      .eq('id', id).maybeSingle()
    if (!im || im.deleted_at) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (im.delete_req_by) return NextResponse.json({ error: 'already requested' }, { status: 409 })

    // ชื่อ + วิชาชีพผู้ขอ (snapshot ณ ตอนขอ)
    const { data: me } = await admin.from('profiles').select('first_name, last_name, username, profession').eq('id', user.id).maybeSingle()
    const requesterName = me ? ([me.first_name, me.last_name].filter(Boolean).join(' ') || me.username || 'ผู้ใช้') : 'ผู้ใช้'
    const requesterProfession = professionLabel(me?.profession) || '—'

    // ตั้งสถานะ "รออนุมัติลบ"
    const { error } = await admin.from('tb_patient_images').update({
      delete_req_by: user.id,
      delete_req_name: requesterName,
      delete_req_at: new Date().toISOString(),
      delete_req_reason: reason,
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logImageEvent(admin, { imageId: id, eventType: 'delete_requested', actorId: user.id, actorRole: isAdmin ? 'admin' : 'user', reason })

    // เมลแจ้ง (ล้มเหลวไม่ทำให้คำขอพัง) — โหลดชื่อผู้ป่วยครั้งเดียว
    const { data: pt } = await admin.from('tb_patients').select('name, hn').eq('id', im.patient_id).maybeSingle()
    const typeLabel = TYPE_LABEL[im.type] || im.type
    if (ADMIN_EMAILS.length > 0) {
      const mail = adminImageDeleteRequestEmail(
        pt?.name || im.patient_id, pt?.hn || '', typeLabel,
        reason, requesterName, requesterProfession, req.nextUrl.origin
      )
      try {
        await getResend().emails.send({ from: EMAIL_FROM, to: ADMIN_EMAILS, subject: mail.subject, html: mail.html })
      } catch (e) { console.error('image delete-request email failed:', e) }
    }
    // เมลยืนยันกลับหาผู้ขอเอง
    if (user.email) {
      const mail2 = imageDeleteRequestSubmittedEmail(me?.first_name || 'ผู้ใช้', pt?.name || im.patient_id, typeLabel, reason)
      try {
        await getResend().emails.send({ from: EMAIL_FROM, to: user.email, subject: mail2.subject, html: mail2.html })
      } catch (e) { console.error('image request confirm email failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { data: im } = await admin.from('tb_patient_images').select('delete_req_by, delete_req_name, deleted_at, patient_id, type').eq('id', id).maybeSingle()
    if (!im || im.deleted_at) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (!im.delete_req_by) return NextResponse.json({ success: true })   // ไม่มีคำขอค้าง = ถือว่าสำเร็จ
    if (im.delete_req_by !== user.id && !isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { error } = await admin.from('tb_patient_images').update({
      delete_req_by: null, delete_req_name: null, delete_req_at: null, delete_req_reason: null,
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logImageEvent(admin, { imageId: id, eventType: 'delete_request_cancelled', actorId: user.id, actorRole: im.delete_req_by === user.id ? 'user' : 'admin' })

    // แจ้งเตือนการยกเลิก (ล้มเหลวไม่ทำให้การยกเลิกพัง) — แยกตามคนที่กดยกเลิก
    const { data: pt } = await admin.from('tb_patients').select('name, hn').eq('id', im.patient_id).maybeSingle()
    const typeLabel = TYPE_LABEL[im.type] || im.type
    if (im.delete_req_by === user.id) {
      // ผู้ขอยกเลิกเอง → แจ้งแอดมิน (ไม่ต้องทำอะไรต่อ)
      if (ADMIN_EMAILS.length > 0) {
        const mail = adminImageDeleteRequestCancelledEmail(pt?.name || im.patient_id, pt?.hn || '', typeLabel, im.delete_req_name || 'ผู้ใช้')
        try { await getResend().emails.send({ from: EMAIL_FROM, to: ADMIN_EMAILS, subject: mail.subject, html: mail.html }) }
        catch (e) { console.error('image cancel (notify admin) email failed:', e) }
      }
    } else {
      // แอดมินยกเลิกแทนผู้ขอ → แจ้งผู้ขอ
      try {
        const { data: authData } = await admin.auth.admin.getUserById(im.delete_req_by)
        const email = authData?.user?.email
        const { data: prof } = await admin.from('profiles').select('first_name').eq('id', im.delete_req_by).maybeSingle()
        if (email) {
          const mail = imageDeleteRequestCancelledByAdminEmail(prof?.first_name || 'ผู้ใช้', pt?.name || im.patient_id, typeLabel)
          try { await getResend().emails.send({ from: EMAIL_FROM, to: email, subject: mail.subject, html: mail.html }) }
          catch (e) { console.error('image cancel (notify user) email failed:', e) }
        }
      } catch (e) { console.error('image cancel notify failed:', e) }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
