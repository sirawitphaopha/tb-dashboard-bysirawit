import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// throttle: ไม่ ping DB ถ้าเพิ่ง ping ภายใน 5 นาที (เก็บใน cookie)
const PING_THROTTLE_MIN = 5

// หมายเหตุ: ใช้ชื่อ middleware.ts (ไม่ใช่ proxy.ts) เพราะ Cloudflare Pages
// ยังไม่รองรับ Node.js middleware (proxy.ts บน Next.js 16 บังคับ Node runtime)
// → ทนกับ deprecation warning ไปก่อนจนกว่า opennextjs-cloudflare จะรองรับ
//    หรือย้าย host ไป Vercel
export async function middleware(request: NextRequest) {
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

  // ─── Session Expired Detection (B2) ──────────────────────
  // ถ้าไม่มี user แต่ยังมี cookie tb_session_id ที่ชี้ไปแถวยัง active
  // = session หมดอายุเอง → ปิดแถว + จดใน tb_logout_log + ลบ cookie
  const orphanSessionId = !isAuthed ? request.cookies.get('tb_session_id')?.value : null
  let sessionExpired = false
  if (orphanSessionId) {
    try {
      const admin = createAdminClient()
      const { data: row } = await admin
        .from('tb_session_log')
        .select('user_id, email, device_fp')
        .eq('id', orphanSessionId)
        .is('ended_at', null)
        .maybeSingle()

      if (row) {
        const now = new Date().toISOString()
        const ip = request.headers.get('cf-connecting-ip')
                || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                || null
        const ua = request.headers.get('user-agent') || null

        await admin
          .from('tb_session_log')
          .update({ ended_at: now, end_reason: 'session_expired' })
          .eq('id', orphanSessionId)
          .is('ended_at', null)

        await admin.from('tb_logout_log').insert({
          user_id:     row.user_id,
          email:       row.email,
          logout_type: 'session_expired',
          ip_address:  ip,
          user_agent:  ua,
          session_id:  orphanSessionId,
          device_fp:   row.device_fp,
        })

        sessionExpired = true
      }
    } catch {
      // ไม่ block ถ้า log fail
    }
  }

  const publicPaths = ['/login', '/register', '/reset-password']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))
                || pathname.startsWith('/api/auth')
                || pathname.startsWith('/api/register')
                || pathname.startsWith('/api/login-lookup')
  const isStatusPage = pathname === '/pending-approval' || pathname === '/rejected'

  if (!isAuthed && !isPublic) {
    const redirectRes = NextResponse.redirect(new URL('/login', request.url))
    // ลบ cookie tb_session_id ถ้าเจอ session_expired (หรือ orphan)
    if (orphanSessionId) {
      redirectRes.cookies.set('tb_session_id', '', { httpOnly: true, path: '/', maxAge: 0 })
      redirectRes.cookies.set('tb_session_pinged', '', { httpOnly: true, path: '/', maxAge: 0 })
    }
    return redirectRes
  }

  if (isAuthed && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ─── Session Activity ping (B1) ──────────────────────────
  // อัปเดต last_active_at แบบ throttle 5 นาที (ใช้ cookie ping marker)
  if (user) {
    const sessionId = request.cookies.get('tb_session_id')?.value
    const lastPinged = request.cookies.get('tb_session_pinged')?.value
    const now = Date.now()
    const needPing = !lastPinged || (now - parseInt(lastPinged, 10)) > PING_THROTTLE_MIN * 60 * 1000

    if (sessionId && needPing) {
      // ยิงแบบไม่ await ก็ได้ (fire-and-forget) แต่ Cloudflare Workers อาจ kill ก่อน
      // → await ไปเลย ปลอดภัยกว่า (ทุก 5 นาทีต่อ user ไม่ใช่ปัญหา)
      try {
        const admin = createAdminClient()
        await admin
          .from('tb_session_log')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', sessionId)
          .is('ended_at', null)
      } catch {
        // ไม่ block ถ้า ping fail
      }
      supabaseResponse.cookies.set('tb_session_pinged', String(now), {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   60 * 60 * 24 * 30,
      })
    }
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
