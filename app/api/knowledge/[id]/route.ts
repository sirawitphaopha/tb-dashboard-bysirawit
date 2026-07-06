// DELETE /api/knowledge/[id] — ลบเอกสารในคลัง (แอดมินเท่านั้น)
// hard delete: ลบไฟล์จริงออกจาก R2 (PDF + รูปหน้าปก) แล้วลบแถวในตาราง (ไม่มีถังขยะ · ไม่ใช่ข้อมูลคนไข้)
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, LIBRARY_BUCKET } from '@/lib/knowledge-helpers'
import { r2Delete } from '@/lib/r2'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, isAdmin, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })   // ลบ = แอดมินเท่านั้น
    const { data: doc } = await admin
      .from('tb_knowledge_docs')
      .select('storage_key, thumb_key')
      .eq('id', id)
      .maybeSingle()
    if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 })
    // ลบไฟล์ R2 ก่อน · ห่อ try กันไฟล์หาย/ลบไม่ได้ ไม่ให้บล็อกการลบแถวในตาราง
    try { await r2Delete(doc.storage_key, LIBRARY_BUCKET) } catch {}
    if (doc.thumb_key) { try { await r2Delete(doc.thumb_key, LIBRARY_BUCKET) } catch {} }
    const { error } = await admin.from('tb_knowledge_docs').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
