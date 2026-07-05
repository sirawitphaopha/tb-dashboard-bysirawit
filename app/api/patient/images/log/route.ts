// GET /api/patient/images/log — ประวัติทุก event ของรูปผู้ป่วย (admin เท่านั้น)
// filter: event (ชนิด) · q (ชื่อผู้ป่วย/HN) · since (ISO ช่วงเวลา) · imageId (ดูเฉพาะรูปเดียว) · pagination
import { NextRequest, NextResponse } from 'next/server'
import { getRequester } from '@/lib/patient-image-helpers'

export async function GET(req: NextRequest) {
  try {
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved || !isAdmin) return NextResponse.json({ error: 'admin only' }, { status: 403 })

    const sp = req.nextUrl.searchParams
    const page = Math.max(0, parseInt(sp.get('page') || '0', 10) || 0)
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get('pageSize') || '50', 10) || 50))
    const eventType = (sp.get('event') || '').trim()
    const q = (sp.get('q') || '').trim().replace(/[%,()*]/g, '')   // กันอักขระที่ทำ filter พัง
    const since = (sp.get('since') || '').trim()
    const imageId = (sp.get('imageId') || '').trim()

    let query = admin.from('tb_image_event_log').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (eventType) query = query.eq('event_type', eventType)
    if (imageId) query = query.eq('image_id', imageId)
    if (since) query = query.gte('created_at', since)
    if (q) query = query.or(`patient_name.ilike.%${q}%,patient_hn.ilike.%${q}%,actor_name.ilike.%${q}%`)
    query = query.range(page * pageSize, page * pageSize + pageSize - 1)

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ logs: data || [], total: count || 0 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
