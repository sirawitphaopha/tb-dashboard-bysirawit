// GET /api/patient/images/log — คืน event ทั้งหมดของรูปผู้ป่วย (admin เท่านั้น)
// โหลดรอบเดียว แล้ว client กรอง/จัดกลุ่มตามรูป/ตรวจรูปซ้ำเอง → กดกรองแล้วทันที ไม่ต้องรอเน็ต
// (imageId = ดูเฉพาะรูปเดียว · ไม่ส่ง = ทั้งหมด)
import { NextRequest, NextResponse } from 'next/server'
import { getRequester } from '@/lib/patient-image-helpers'

export async function GET(req: NextRequest) {
  try {
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved || !isAdmin) return NextResponse.json({ error: 'admin only' }, { status: 403 })

    const imageId = (req.nextUrl.searchParams.get('imageId') || '').trim()
    const CAP = 5000   // สูงสุดที่ดึงมา (เพียงพอสำหรับสเกลนี้ · เกินนี้จะแจ้ง capped)
    let query = admin.from('tb_image_event_log').select('*').order('created_at', { ascending: false }).limit(CAP)
    if (imageId) query = query.eq('image_id', imageId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ events: data || [], capped: (data || []).length >= CAP })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
