import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// ─────────────────────────────────────────────────────────────────────────
// POST /api/easter-egg/log
//
// บันทึกตอนคนเจอ easter egg 🥚
//   body: { event_type: 'discovered' | 'kicked_out' }
//
// ต้อง login อยู่ก่อนเท่านั้น (ไม่งั้นไม่บันทึก)
// ─────────────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['discovered', 'kicked_out'] as const

export async function POST(req: NextRequest) {
  try {
    const { event_type } = await req.json()
    if (!ALLOWED_TYPES.includes(event_type)) {
      return NextResponse.json({ error: 'invalid event_type' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // ไม่มี session ก็ไม่บันทึก (silent — ไม่ทำให้ UX สะดุด)
      return NextResponse.json({ success: false, reason: 'no_session' })
    }

    const ip = req.headers.get('cf-connecting-ip')
            || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || null
    const ua = req.headers.get('user-agent') || null

    const admin = createAdminClient()
    await admin.from('tb_easter_egg_log').insert({
      user_id:    user.id,
      email:      user.email ?? null,
      event_type,
      ip_address: ip,
      user_agent: ua,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('easter-egg log error:', e)
    return NextResponse.json({ error: 'log failed' }, { status: 500 })
  }
}
