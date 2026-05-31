// GET — นับจำนวน comment (ที่ไม่ถูก soft delete) ต่อ version
// counts: นับทุก comment รวม reply (ตาม decision v0.7.14.5)
// unresolved_counts: นับเฉพาะ bug/request ที่ยังไม่ปิด (สำหรับ filter chip)
//
// v0.7.15.0 — ใช้ server client + RLS (tb_changelog_comments มี SELECT USING (true) ครอบคลุม)
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // ใช้ supabase (server client) — RLS ตาราง tb_changelog_comments ครอบคลุม
    const { data, error } = await supabase
      .from('tb_changelog_comments')
      .select('version, status, resolved_at')
      .is('deleted_at', null)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const counts: Record<string, number> = {}
    const unresolvedCounts: Record<string, { bug: number; request: number; total: number }> = {}
    for (const r of data || []) {
      counts[r.version] = (counts[r.version] || 0) + 1
      if (!r.resolved_at && (r.status === 'bug_report' || r.status === 'request')) {
        if (!unresolvedCounts[r.version]) unresolvedCounts[r.version] = { bug: 0, request: 0, total: 0 }
        if (r.status === 'bug_report') unresolvedCounts[r.version].bug += 1
        if (r.status === 'request')    unresolvedCounts[r.version].request += 1
        unresolvedCounts[r.version].total += 1
      }
    }
    return NextResponse.json({ counts, unresolved_counts: unresolvedCounts })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
