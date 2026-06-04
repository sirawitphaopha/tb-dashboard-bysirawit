// GET /api/patient/images?patientId=X — รายการรูปของผู้ป่วย + signed URL (TTL 2 ชม.)
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, PATIENT_BUCKET } from '@/lib/patient-image-helpers'
import { presignGet } from '@/lib/r2'

export async function GET(req: NextRequest) {
  try {
    const { user, isApproved, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const patientId = req.nextUrl.searchParams.get('patientId')
    if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })

    const { data, error } = await admin
      .from('tb_patient_images')
      .select('*')
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // join ชื่อคนอัป
    const uids = [...new Set((data || []).map((d: any) => d.uploaded_by).filter(Boolean))]
    const { data: ups } = uids.length
      ? await admin.from('profiles').select('id, first_name, last_name, username').in('id', uids)
      : { data: [] as any[] }
    const umap: Record<string, any> = Object.fromEntries((ups || []).map((p: any) => [p.id, p]))
    const upName = (id: string) => { const p = umap[id]; if (!p) return ''; const n = [p.first_name, p.last_name].filter(Boolean).join(' '); return n || p.username || '' }

    const images = await Promise.all((data || []).map(async (im: any) => ({
      ...im,
      uploader_name: upName(im.uploaded_by),
      url: await presignGet(im.storage_key, 7200, PATIENT_BUCKET),               // รูปเต็ม (fallback)
      thumbUrl: await presignGet(im.thumb_key || im.storage_key, 7200, PATIENT_BUCKET), // รูปย่อ (แกลเลอรี)
    })))
    return NextResponse.json({ images })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
