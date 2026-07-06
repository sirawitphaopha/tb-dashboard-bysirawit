// GET /api/knowledge?category=&q= — รายการเอกสารในคลังความรู้ + signed URL (ผู้ใช้ที่อนุมัติแล้วทุกคน)
// ทุกตัวแนบ url (เปิดอ่าน) + thumbUrl (รูปหน้าปก) signed · join ชื่อคนอัป · เรียงใหม่สุดก่อน
import { NextRequest, NextResponse } from 'next/server'
import { getRequester, LIBRARY_BUCKET } from '@/lib/knowledge-helpers'
import { presignGet } from '@/lib/r2'

const CATEGORIES = ['guideline', 'trial', 'other']

export async function GET(req: NextRequest) {
  try {
    const { user, isApproved, admin } = await getRequester(req)
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!isApproved) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const category = req.nextUrl.searchParams.get('category') || ''
    // ตัดอักขระที่จะทำให้ .or()/ilike พัง (comma แยกเงื่อนไข · วงเล็บ/% เป็น syntax ของ PostgREST)
    const q = (req.nextUrl.searchParams.get('q') || '').replace(/[%,()]/g, '').trim()

    let query = admin.from('tb_knowledge_docs').select('*').order('uploaded_at', { ascending: false })
    if (CATEGORIES.includes(category)) query = query.eq('category', category)
    if (q) query = query.or(`title.ilike.%${q}%,file_name.ilike.%${q}%`)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // join ชื่อคนอัป (แบบเดียวกับ images/route.ts)
    const uids = [...new Set((data || []).map((d: any) => d.uploaded_by).filter(Boolean))]
    const { data: ups } = uids.length
      ? await admin.from('profiles').select('id, first_name, last_name, username').in('id', uids)
      : { data: [] as any[] }
    const umap: Record<string, any> = Object.fromEntries((ups || []).map((p: any) => [p.id, p]))
    const upName = (id: string) => { const p = umap[id]; if (!p) return ''; const n = [p.first_name, p.last_name].filter(Boolean).join(' '); return n || p.username || '' }

    const docs = await Promise.all((data || []).map(async (d: any) => ({
      ...d,
      uploader_name: upName(d.uploaded_by),
      url: await presignGet(d.storage_key, 7200, LIBRARY_BUCKET),                    // เปิดอ่าน (fallback)
      thumbUrl: d.thumb_key ? await presignGet(d.thumb_key, 7200, LIBRARY_BUCKET) : null,  // รูปหน้าปก
    })))
    return NextResponse.json({ docs })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
