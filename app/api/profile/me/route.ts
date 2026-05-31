import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// v0.7.15.0 — ใช้ server client + RLS แทน admin client (เร็วกว่า + ปลอดภัยกว่า)
// RLS policy "profiles_select_own_or_admin" (id = auth.uid() OR is_admin()) ครอบคลุมแล้ว
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // ใช้ supabase (server client) แทน admin — RLS จัดการ scope ให้
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 })

    return NextResponse.json({ profile })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
