import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// ส่ง access_token + refresh_token ให้ iframe (tb-data.js) ใช้ตั้ง session
// เพื่อให้ Supabase รู้ว่ากำลังเรียกในนามใคร (auth.uid()) → RLS ผ่าน
export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ session: null }, { status: 401 })
  return NextResponse.json({
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }
  })
}
