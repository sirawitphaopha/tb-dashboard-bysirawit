// GET /api/admin/storage — พื้นที่ใช้งานแบบละเอียด · admin เท่านั้น
// DB  = pg_database_size (แยก พื้นที่ระบบ vs ข้อมูลจริง)
// R2  = ไล่ list ไฟล์จริงในถัง (patient + avatar) + แยกขนาดตามหมวดจากฐานข้อมูล
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, PATIENT_BUCKET } from '@/lib/patient-image-helpers'
import { r2BucketUsage } from '@/lib/r2'

const AVATAR_BUCKET = process.env.R2_BUCKET_AVATAR || 'tb-avatars'
const DB_QUOTA = 500 * 1024 * 1024          // Supabase free: 500 MB
const R2_QUOTA = 10 * 1024 * 1024 * 1024    // R2 free: 10 GB

export async function GET(req: NextRequest) {
  try {
    const { user, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    // ── ฐานข้อมูล (แยกพื้นที่ระบบ/ข้อมูลจริง) ──
    let dbTotal = 0, dbUserTables = 0
    try {
      const { data } = await admin.rpc('get_db_stats')
      if (data) { dbTotal = Number(data.total) || 0; dbUserTables = Number(data.user_tables) || 0 }
    } catch {}

    // ── รูป R2: ขนาดจริงในถัง ──
    let patientTotal = 0, avatarTotal = 0, r2Count = 0, r2Ok = true
    try {
      const p = await r2BucketUsage(PATIENT_BUCKET)
      const a = await r2BucketUsage(AVATAR_BUCKET)
      patientTotal = p.bytes; avatarTotal = a.bytes; r2Count = p.count + a.count
    } catch { r2Ok = false }

    // ── แยกขนาดรูปคนไข้ตามหมวด (จาก size_bytes ในฐานข้อมูล · รวมที่อยู่ในถังขยะด้วย) ──
    const byType: Record<string, number> = { cxr: 0, lab: 0, document: 0, other: 0 }
    try {
      const { data: imgs } = await admin.from('tb_patient_images').select('type, size_bytes')
      for (const im of imgs || []) {
        const t = (byType[im.type] !== undefined) ? im.type : 'other'
        byType[t] += Number(im.size_bytes) || 0
      }
    } catch {}
    const mainsSum = byType.cxr + byType.lab + byType.document + byType.other
    const thumbsOther = Math.max(0, patientTotal - mainsSum)   // ทัมเนล + ส่วนที่เหลือในถังคนไข้

    return NextResponse.json({
      db: { total: dbTotal, userTables: dbUserTables, systemSpace: Math.max(0, dbTotal - dbUserTables), quota: DB_QUOTA },
      r2: {
        total: patientTotal + avatarTotal, quota: R2_QUOTA, count: r2Count, ok: r2Ok,
        patientTotal, avatarTotal, byType, thumbsOther,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
