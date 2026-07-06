// POST /api/knowledge/presign — ขอ presigned PUT URL สำหรับอัป PDF เข้า R2 (แอดมินเท่านั้น)
// ไฟล์ยิงตรงเข้า R2 (ไม่ผ่าน Worker = ไม่ติด body limit) · presign อายุ 900 วิ (ไฟล์ใหญ่ใช้เวลาอัป)
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, LIBRARY_BUCKET } from '@/lib/knowledge-helpers'
import { presignPut } from '@/lib/r2'

export async function POST(req: NextRequest) {
  try {
    const { user, isApproved, isAdmin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })   // อัป = แอดมินเท่านั้น
    const uid = crypto.randomUUID()
    const key = `library/${uid}.pdf`                 // ตัวไฟล์ PDF
    const thumbKey = `library/${uid}_thumb.webp`     // รูปหน้าปก (หน้าแรกของ PDF · render ฝั่ง client)
    const [uploadUrl, uploadUrlThumb] = await Promise.all([
      presignPut(key, 900, LIBRARY_BUCKET),
      presignPut(thumbKey, 900, LIBRARY_BUCKET),
    ])
    return NextResponse.json({ uploadUrl, key, uploadUrlThumb, thumbKey })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
