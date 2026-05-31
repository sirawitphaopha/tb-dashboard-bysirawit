import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import HomeShell from './components/HomeShell'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const cookieStore = await cookies()

  // ตรวจ Supabase auth (server-side — กัน bypass บน Cloudflare ที่ middleware ไม่ทำงาน)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // เช็คสถานะ profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.status === 'pending')  redirect('/pending-approval')
  if (profile?.status === 'rejected') redirect('/rejected')

  // v0.7.16.1 Phase 3 Step 2 — Skeleton (ลด blank time ตอนเปิดครั้งแรก)
  // HomeShell = client component: render skeleton + iframe, fade skeleton เมื่อ tb-app.jsx ส่ง postMessage
  return <HomeShell />
}
