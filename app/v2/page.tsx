import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import TbAppMount from './TbAppMount'

/**
 * /v2 — v0.7.17.0 Phase 3 Step 3 (Full Migration, parallel run)
 *
 * Native Next.js render ของ tb-app + tb-modals — ไม่ผ่าน iframe เลย
 * เก็บ / (iframe) ไว้ใช้คู่ขนานตอน beta test
 * เปรียบเทียบ TTI: /  (8-10s)  vs  /v2  (เป้า 2-3s)
 */
export const dynamic = 'force-dynamic'

export default async function V2Page() {
  const cookieStore = await cookies()

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.status === 'pending')  redirect('/pending-approval')
  if (profile?.status === 'rejected') redirect('/rejected')

  return <TbAppMount />
}
