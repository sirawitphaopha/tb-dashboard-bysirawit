import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const res = NextResponse.json({ success: true })
  res.cookies.set('dev_session', '', { maxAge: 0, path: '/' })
  return res
}
