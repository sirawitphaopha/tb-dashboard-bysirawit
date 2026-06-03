import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { presignPut } from '@/lib/r2'

// POST /api/profile/avatar/presign
// → sign "ลิงก์อัปชั่วคราว" (presigned PUT URL) สำหรับ avatars/<userId>.webp
//   client เอา uploadUrl ไป PUT ไฟล์ WebP ตรงเข้า R2 (ไม่ผ่าน server body)
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

    // key ผูกกับ user.id เสมอ → user อัปทับของคนอื่นไม่ได้ + 1 user 2 ไฟล์ (ไม่มี orphan)
    // key      = รูปครอบจัตุรัส (โชว์ avatar เล็ก) · keyOrig = รูปต้นฉบับ (กดดูเต็ม)
    const key = `avatars/${user.id}.webp`
    const keyOrig = `avatars/${user.id}_orig.webp`
    const uploadUrl = await presignPut(key, 300)
    const uploadUrlOrig = await presignPut(keyOrig, 300)
    return NextResponse.json({ uploadUrl, key, uploadUrlOrig, keyOrig })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
