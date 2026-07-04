// GET /api/patient/images/pending-requests — รูปที่มีคำขอลบค้าง (แอดมิน) — ใช้กับกระดิ่ง + หน้าอนุมัติ
import { NextRequest, NextResponse } from 'next/server'
import { getRequester } from '@/lib/patient-image-helpers'

export async function GET(req: NextRequest) {
  try {
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved || !isAdmin) return NextResponse.json({ error: 'admin only' }, { status: 403 })

    const { data, error } = await admin.from('tb_patient_images')
      .select('id, patient_id, type, delete_req_by, delete_req_name, delete_req_at, delete_req_reason')
      .not('delete_req_by', 'is', null).is('deleted_at', null)
      .order('delete_req_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const pids = [...new Set((data || []).map((d: any) => d.patient_id))]
    const { data: pts } = pids.length
      ? await admin.from('tb_patients').select('id, name, hn').in('id', pids)
      : { data: [] as any[] }
    const pmap: Record<string, any> = Object.fromEntries((pts || []).map((p: any) => [p.id, p]))
    const requests = (data || []).map((r: any) => ({
      ...r,
      patient_name: pmap[r.patient_id]?.name || '—',
      patient_hn: pmap[r.patient_id]?.hn || '',
    }))
    return NextResponse.json({ requests })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
