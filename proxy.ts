import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isAuthed = !!user

  const publicPaths = ['/login', '/register', '/reset-password']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))
                || pathname.startsWith('/api/auth')
                || pathname.startsWith('/api/register')
                || pathname.startsWith('/api/login-lookup')
  const isStatusPage = pathname === '/pending-approval' || pathname === '/rejected'

  if (!isAuthed && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthed && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .maybeSingle()

    if (profile) {
      if (profile.status === 'pending' && pathname !== '/pending-approval') {
        return NextResponse.redirect(new URL('/pending-approval', request.url))
      }
      if (profile.status === 'rejected' && pathname !== '/rejected') {
        return NextResponse.redirect(new URL('/rejected', request.url))
      }
      if (profile.status === 'approved' && isStatusPage) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
