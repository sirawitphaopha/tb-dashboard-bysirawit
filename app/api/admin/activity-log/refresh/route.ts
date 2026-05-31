import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

// ─────────────────────────────────────────────────────────────────────────
// POST /api/admin/activity-log/refresh
//
// Trigger รีเฟรช materialized view mv_activity_log
// คืน { refreshed_at: ISO timestamp }
//
// v0.7.16.0 — Phase 2 Optimize
//   - admin หน้า "บันทึกกิจกรรม" กดปุ่ม "รีเฟรชล่าสุด"
//   - เรียก function refresh_activity_log() ที่ SECURITY DEFINER
//   - ปกติ MV อัป auto ทุก 5 นาที (ถ้าตั้ง pg_cron) หรือไม่อัปจนกว่าจะกดปุ่ม
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // เช็ค admin
    const cookieStore = req.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: caller } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'admin only' }, { status: 403 })
    }

    // เรียก function refresh_activity_log() — return ISO timestamp ที่ refresh เสร็จ
    const { data, error } = await admin.rpc('refresh_activity_log')
    if (error) {
      console.error('refresh_activity_log error:', error)
      return NextResponse.json({ error: 'รีเฟรชล้มเหลว' }, { status: 500 })
    }

    return NextResponse.json({ refreshed_at: data })
  } catch (e: any) {
    console.error('activity-log refresh API error:', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
