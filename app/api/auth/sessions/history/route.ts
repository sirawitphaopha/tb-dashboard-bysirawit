import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// ─────────────────────────────────────────────────────────────────────────
// GET /api/auth/sessions/history
//
// v0.7.17.3 Phase 4B — pagination + filter
//   Query params:
//     page=0&pageSize=50
//     since=ISO&until=ISO         (date range)
//     device=desktop|mobile|tablet|unknown
//     status=active|manual|session_expired|forced_by_user|forced_by_admin
//     q=keyword                   (ค้นใน ip_address + device_label)
//
//   Response: { rows, total, hasMore, page, pageSize }
//
//   RLS: policy "session_log_select_own" → user_id = auth.uid()
// ─────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 })
  }

  const sp        = new URL(req.url).searchParams
  const page      = Math.max(0, parseInt(sp.get('page')      || '0',  10) || 0)
  const pageSize  = Math.min(100, Math.max(10, parseInt(sp.get('pageSize') || '50', 10) || 50))
  const since     = sp.get('since')      || null
  const until     = sp.get('until')      || null
  const device    = sp.get('device')     || null
  const status    = sp.get('status')     || ''     // ''=all
  const q         = (sp.get('q') || '').trim()

  let qb = supabase
    .from('tb_session_log')
    .select('id, ip_address, device_label, device_type, started_at, last_active_at, ended_at, end_reason', { count: 'exact' })
    .eq('user_id', user.id)

  if (since) qb = qb.gte('started_at', since)
  if (until) qb = qb.lte('started_at', until)
  if (device) qb = qb.eq('device_type', device)
  if (status === 'active')      qb = qb.is('end_reason', null)
  else if (status)              qb = qb.eq('end_reason', status)
  if (q) {
    const esc = q.replace(/[%_]/g, m => `\\${m}`)
    qb = qb.or(`ip_address.ilike.%${esc}%,device_label.ilike.%${esc}%`)
  }

  const from = page * pageSize
  const to   = from + pageSize - 1
  qb = qb.order('started_at', { ascending: false }).range(from, to)

  const { data, count, error } = await qb
  if (error) {
    return NextResponse.json({ error: 'โหลดข้อมูลล้มเหลว' }, { status: 500 })
  }

  const rows    = (data as any[]) ?? []
  const total   = typeof count === 'number' ? count : rows.length
  const hasMore = (from + rows.length) < total

  return NextResponse.json({
    rows,
    total,
    hasMore,
    page,
    pageSize,
    sessions: rows,  // alias เผื่อ caller เก่ายังใช้ชื่อนี้
  })
}
