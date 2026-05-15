import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// รับ username → คืน email (ใช้ตอน user กรอก username ในช่อง login)
// ไม่บอกว่ามี/ไม่มี username (ป้องกัน enumeration) — คืน null ถ้าไม่เจอ
export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ email: null })
    }

    const admin = createAdminClient()
    const { data } = await admin
      .from('profiles')
      .select('email')
      .eq('username', username)
      .maybeSingle()

    return NextResponse.json({ email: data?.email || null })
  } catch {
    return NextResponse.json({ email: null })
  }
}
