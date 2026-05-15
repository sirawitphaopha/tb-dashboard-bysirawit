import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const cookieStore = await cookies()

  // Dev session bypass (sirawit/1234 ใช้ตอนพัฒนา local)
  const devSession = cookieStore.get('dev_session')?.value === 'sirawit'

  if (!devSession) {
    // ตรวจ Supabase auth
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
  }

  return (
    <iframe
      src="/app.html"
      className="w-full h-screen border-0"
      title="TB CARE & JOURNEY"
    />
  )
}
