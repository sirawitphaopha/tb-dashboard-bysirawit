import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { parseUserAgent } from '@/lib/parse-user-agent'

// ─────────────────────────────────────────────────────────────────────────
// GET /api/admin/activity-log?page=0&pageSize=50
//
// คืน timeline รวมจาก materialized view mv_activity_log (admin เท่านั้น)
//   - เช็คว่า caller เป็น admin
//   - ดึงทีละหน้า (pagination ด้วย .range)
//   - join ชื่อ-สกุล-role จาก profiles ให้แต่ละ event (ตาม user_id)
//   - คืน { events, hasMore }
//
// v0.7.16.0 — Phase 2: เปลี่ยนจาก view → materialized view
//   - query เร็วขึ้น 10-30 เท่า (50-100ms vs 800-1500ms)
//   - ข้อมูลอาจ stale สูงสุด 5 นาที (admin กดปุ่ม refresh เพื่ออัปทันที)
//
// 🛡 mv ปิดจาก client → ต้องผ่าน API นี้ที่ใช้ service_role เท่านั้น
// ─────────────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

export async function GET(req: NextRequest) {
  try {
    // ─── เช็ค admin ───
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // ─── pagination params ───
    const url = req.nextUrl
    const page     = Math.max(0, parseInt(url.searchParams.get('page') || '0', 10) || 0)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(url.searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE))
    const from = page * pageSize
    const to   = from + pageSize - 1

    // ─── filter params (รอบ 2) ───
    const fUserId     = url.searchParams.get('userId')      // กรองตามผู้ใช้
    const fCategory   = url.searchParams.get('category')    // login/logout/password/easter
    const fFailedOnly = url.searchParams.get('failedOnly') === '1'  // เฉพาะที่ล้มเหลว
    const fSince      = url.searchParams.get('since')       // ISO — ตั้งแต่
    const fUntil      = url.searchParams.get('until')       // ISO — ถึง (ช่วงวันที่กำหนดเอง)
    const fDevice     = url.searchParams.get('device')      // desktop/mobile/tablet/unknown
    const fSessionId  = url.searchParams.get('sessionId')   // กรองตาม session (ครั้งเข้าใช้)
    const fDeviceFp   = url.searchParams.get('deviceFp')    // กรองตามเครื่อง (device fingerprint)
    const fSuspicious = url.searchParams.get('suspicious') === '1'  // เฉพาะเหตุการณ์น่าสงสัย
    // ค้นหาทุกอย่าง (ชื่อ/อีเมล/IP) — ตัดอักขระที่อันตรายต่อ PostgREST or() ออก
    const fSearch = (url.searchParams.get('q') || '').replace(/[(),*%\\]/g, '').trim()

    // ─── ดึง events ทีละหน้า ───
    // ดึง pageSize+1 เพื่อรู้ว่ามีหน้าถัดไปไหม (hasMore)
    // v0.7.16.0 — count:'estimated' (เร็วกว่า exact, ใช้ pg_class.reltuples) + MV
    let query = admin
      .from('mv_activity_log')
      .select('*', { count: 'estimated' })
    if (fUserId)     query = query.eq('user_id', fUserId)
    if (fCategory)   query = query.eq('category', fCategory)
    if (fFailedOnly) query = query.eq('success', false)
    if (fSince)      query = query.gte('event_time', fSince)
    if (fUntil)      query = query.lte('event_time', fUntil)
    if (fDevice)     query = query.eq('device_type', fDevice)
    if (fSessionId)  query = query.eq('session_id', fSessionId)
    if (fDeviceFp)   query = query.eq('device_fp', fDeviceFp)

    // เหตุการณ์น่าสงสัย = ล้มเหลว (success=false) หรือ ผู้ดูแลบังคับออก
    if (fSuspicious) {
      query = query.or('success.eq.false,event_key.eq.logout_forced_by_admin')
    }

    // ค้นหา: ชื่อ (จาก profiles) / อีเมล / IP
    if (fSearch) {
      // หา user_id ที่ชื่อ-สกุล ตรงกับคำค้น
      const { data: matched } = await admin
        .from('profiles')
        .select('id')
        .or(`first_name.ilike.*${fSearch}*,last_name.ilike.*${fSearch}*`)
      const matchedIds = (matched ?? []).map(m => m.id)

      const orParts = [`email.ilike.*${fSearch}*`, `ip_address.ilike.*${fSearch}*`]
      if (matchedIds.length > 0) orParts.push(`user_id.in.(${matchedIds.join(',')})`)
      query = query.or(orParts.join(','))
    }

    // v0.7.16.0 — parallel admin check + main query (ลด round-trip จาก 3 → 2)
    const [callerRes, mainRes] = await Promise.all([
      admin.from('profiles').select('role').eq('id', user.id).single(),
      query.order('event_time', { ascending: false }).range(from, to + 1),
    ])

    if (callerRes.data?.role !== 'admin') {
      return NextResponse.json({ error: 'admin only' }, { status: 403 })
    }

    const { data: rows, error, count } = mainRes
    if (error) {
      console.error('activity-log query error:', error)
      return NextResponse.json({ error: 'โหลดข้อมูลล้มเหลว' }, { status: 500 })
    }

    const hasMore = (rows?.length ?? 0) > pageSize
    const events = (rows ?? []).slice(0, pageSize)

    // ─── join profiles เพื่อได้ชื่อผู้ใช้ปัจจุบัน ───
    const userIds = [...new Set(events.map(e => e.user_id).filter(Boolean))]
    let profileMap: Record<string, { first_name: string | null, last_name: string | null, role: string | null }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('id', userIds)
      for (const p of profiles ?? []) {
        profileMap[p.id] = { first_name: p.first_name, last_name: p.last_name, role: p.role }
      }
    }

    const enriched = events.map(e => {
      const p = e.user_id ? profileMap[e.user_id] : null
      const fullName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : null
      return {
        ...e,
        display_name: fullName || e.email || 'ไม่ทราบผู้ใช้',
        role: p?.role || null,
        device_label: e.user_agent ? parseUserAgent(e.user_agent).device_label : null,
        session_short: e.session_id ? String(e.session_id).slice(0, 8) : null,
        device_fp_short: e.device_fp ? String(e.device_fp).slice(0, 8) : null,
      }
    })

    return NextResponse.json({ events: enriched, hasMore, page, total: count ?? null })
  } catch (e: any) {
    console.error('activity-log API error:', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 })
  }
}
