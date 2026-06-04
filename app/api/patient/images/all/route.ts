// GET /api/patient/images/all — คลังรูปภาพรวมทุกผู้ป่วย (Google Photos page)
// query: ?type=cxr&q=ชื่อ/HN · approved/admin เท่านั้น (sensitive)
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, PATIENT_BUCKET } from '@/lib/patient-image-helpers'
import { presignGet } from '@/lib/r2'

export async function GET(req: NextRequest) {
  try {
    const { user, isApproved, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const type = req.nextUrl.searchParams.get('type')
    const q = (req.nextUrl.searchParams.get('q') || '').trim().toLowerCase()

    let query = admin
      .from('tb_patient_images')
      .select('*')
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
      .limit(500)
    if (type && type !== 'all') query = query.eq('type', type)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // join ชื่อผู้ป่วย
    const pids = [...new Set((data || []).map((d: any) => d.patient_id))]
    const { data: pts } = pids.length
      ? await admin.from('tb_patients').select('id, name, hn').in('id', pids)
      : { data: [] as any[] }
    const pmap: Record<string, any> = Object.fromEntries((pts || []).map((p: any) => [p.id, p]))

    let images = await Promise.all((data || []).map(async (im: any) => ({
      ...im,
      patient_name: pmap[im.patient_id]?.name || '—',
      patient_hn: pmap[im.patient_id]?.hn || '',
      url: await presignGet(im.storage_key, 7200, PATIENT_BUCKET),
      thumbUrl: await presignGet(im.thumb_key || im.storage_key, 7200, PATIENT_BUCKET),
    })))
    if (q) images = images.filter((im: any) =>
      (im.patient_name || '').toLowerCase().includes(q) || (im.patient_hn || '').toLowerCase().includes(q))

    return NextResponse.json({ images })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
