import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { r2Delete } from '@/lib/r2'

// DELETE /api/profile/avatar
// → ลบรูปออกจาก R2 + ล้าง avatar_url ใน profiles (กลับไปแสดงตัวอักษรย่อ)
export async function DELETE(req: NextRequest) {
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

    // ลบทั้งรูปครอบ + รูปต้นฉบับ ออกจาก R2 (ถ้า fail ก็ปล่อย — การล้าง DB สำคัญกว่า)
    try { await r2Delete(`avatars/${user.id}.webp`) } catch {}
    try { await r2Delete(`avatars/${user.id}_orig.webp`) } catch {}

    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .update({ avatar_url: null, avatar_original_url: null, avatar_updated_at: null })
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
