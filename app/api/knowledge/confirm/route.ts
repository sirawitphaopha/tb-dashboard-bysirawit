// POST /api/knowledge/confirm — บันทึก metadata หลังอัป PDF ขึ้น R2 สำเร็จ (แอดมินเท่านั้น)
import { NextRequest, NextResponse } from 'next/server'
import { getRequester } from '@/lib/knowledge-helpers'

const CATEGORIES = ['guideline', 'trial', 'other']   // หมวดที่อนุญาต · ค่าอื่น → 'other'

export async function POST(req: NextRequest) {
  try {
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })   // เขียน = แอดมินเท่านั้น
    const b = await req.json().catch(() => ({} as any))
    const { category, title, fileName, sourceUrl, key, thumbKey, mime, size, pageCount } = b
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
    const { data, error } = await admin
      .from('tb_knowledge_docs')
      .insert({
        category: CATEGORIES.includes(category) ? category : 'other',
        title: (title && String(title).trim()) || null,     // ว่าง = ใช้ file_name เป็น fallback ตอนแสดง
        file_name: fileName || null,
        source_url: (sourceUrl && String(sourceUrl).trim()) || null,
        storage_key: key,
        thumb_key: thumbKey || null,
        mime: mime || 'application/pdf',
        size_bytes: size || null,
        page_count: pageCount || null,
        uploaded_by: user.id,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, doc: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
