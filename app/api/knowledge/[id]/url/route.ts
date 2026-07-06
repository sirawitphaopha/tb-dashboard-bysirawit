// GET /api/knowledge/[id]/url — ขอ signed URL "สดใหม่" ของ PDF (ตอนกดเปิดตัวอ่าน)
// กันกรณีเปิดหน้าทิ้งไว้นาน → ลิงก์ใน list หมดอายุ → ขอใหม่ ณ ตอนคลิก (อายุ 1 ชม.)
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, LIBRARY_BUCKET } from '@/lib/knowledge-helpers'
import { presignGet } from '@/lib/r2'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user, isApproved, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const { data } = await admin
      .from('tb_knowledge_docs')
      .select('storage_key, file_name')
      .eq('id', id)
      .maybeSingle()
    if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const url = await presignGet(data.storage_key, 3600, LIBRARY_BUCKET)
    return NextResponse.json({ url, fileName: data.file_name })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
