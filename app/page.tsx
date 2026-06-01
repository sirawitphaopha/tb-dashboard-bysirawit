import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import TbAppMount from './v2/TbAppMount'

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

  // v0.7.17.0 Phase 3 Step 3 — Full Migration: ใช้ Next.js bundler ตรงๆ ไม่ผ่าน iframe
  //   - TbAppMount โหลด setup → tb-data → tb-changelog → tb-monolith (lazy via dynamic)
  //   - ระหว่างโหลดเห็น V2Skeleton (spinner teal)
  //   - หลังโหลดเสร็จ render App component เต็มตัว
  //   - iframe pattern (HomeShell.tsx + app.html + tb-app.compiled.js) ยังเก็บไฟล์ไว้
  //     ป้องกัน rollback กรณี v2 มีปัญหาที่ไม่คาดคิด
  return <TbAppMount />
}
