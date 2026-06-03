import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

// POST /api/profile/avatar/confirm
// → หลัง client PUT ไฟล์ขึ้น R2 สำเร็จ → บันทึก key + เวลาเปลี่ยนรูปลง profiles
export async function POST(req: NextRequest) {
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

    // hasOriginal: อัปครั้งแรก = true (อัปรูปต้นฉบับด้วย) · "ครอบใหม่" = false (ต้นฉบับเดิมคงไว้)
    const body = await req.json().catch(() => ({} as any))
    const key = `avatars/${user.id}.webp`
    const keyOrig = `avatars/${user.id}_orig.webp`
    const now = new Date().toISOString()
    const updates: Record<string, any> = { avatar_url: key, avatar_updated_at: now }
    if (body && body.hasOriginal) updates.avatar_original_url = keyOrig
    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, key, keyOrig: (body && body.hasOriginal) ? keyOrig : undefined, avatar_updated_at: now })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
