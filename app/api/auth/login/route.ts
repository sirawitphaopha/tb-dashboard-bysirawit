import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { parseUserAgent } from '@/lib/parse-user-agent'

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
//
// แทนการเรียก supabase.auth.signInWithPassword ตรงๆ จาก client
// → เพิ่ม rate limit + audit log ทุก attempt (สำเร็จ + พลาด)
//
// Flow:
//   1. รับ identifier (email หรือ username) + password
//   2. ถ้าเป็น username → resolve เป็น email ผ่าน profiles
//   3. Rate limit check (2 ระดับ):
//      - 5 ครั้งผิด / 15 นาที ต่อ email
//      - 20 ครั้งผิด / 15 นาที ต่อ IP (กันบอทยิงหลายบัญชี)
//   4. signInWithPassword ผ่าน createServerClient (ตั้ง cookie อัตโนมัติ)
//   5. Insert log (success/fail)
//
// 🛡 Anti-enumeration: ตอบ "อีเมลหรือรหัสผ่านไม่ถูกต้อง" เสมอ
//    ไม่ว่าจะ user_not_found หรือ wrong_password
// ─────────────────────────────────────────────────────────────────────────

const MAX_FAILS_PER_EMAIL = 5
const MAX_FAILS_PER_IP    = 20
const WINDOW_MINUTES      = 15

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const ua = req.headers.get('user-agent') || null
  let deviceFp: string | null = null   // รหัสประจำเครื่อง (อ่านจาก body ด้านล่าง)

  // helper: log attempt
  const logAttempt = async (params: {
    emailAttempted: string,
    usernameAttempted: string | null,
    userId: string | null,
    success: boolean,
    failureReason: string | null,
    sessionId?: string | null,
  }) => {
    await admin.from('tb_login_log').insert({
      email_attempted:    params.emailAttempted,
      username_attempted: params.usernameAttempted,
      user_id:            params.userId,
      success:            params.success,
      failure_reason:     params.failureReason,
      ip_address:         ip,
      user_agent:         ua,
      session_id:         params.sessionId ?? null,
      device_fp:          deviceFp,
    })
  }

  try {
    const body = await req.json()
    const { identifier, password } = body
    if (typeof body.deviceFp === 'string' && body.deviceFp.length <= 100) deviceFp = body.deviceFp
    if (!identifier || !password || typeof identifier !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 })
    }

    // ─── 1. Resolve identifier → email ────────────────────
    let loginEmail = identifier.trim()
    let usernameUsed: string | null = null

    if (!loginEmail.includes('@')) {
      // เป็น username → lookup email
      usernameUsed = loginEmail
      const { data: profile } = await admin
        .from('profiles')
        .select('email')
        .eq('username', loginEmail)
        .maybeSingle()
      if (profile?.email) {
        loginEmail = profile.email
      } else {
        // ไม่เจอ username → log + ตอบ error เดียวกัน
        await logAttempt({
          emailAttempted:    loginEmail,   // เก็บ username เป็น email ก็ได้
          usernameAttempted: usernameUsed,
          userId:            null,
          success:           false,
          failureReason:     'username_not_found',
        })
        return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
      }
    }
    loginEmail = loginEmail.toLowerCase()

    // ─── 2. Rate limit check ────────────────────────────────
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

    // 2a. ต่อ email
    const { count: failCountEmail } = await admin
      .from('tb_login_log')
      .select('id', { count: 'exact', head: true })
      .eq('email_attempted', loginEmail)
      .eq('success', false)
      .gte('attempted_at', windowStart)

    if ((failCountEmail ?? 0) >= MAX_FAILS_PER_EMAIL) {
      await logAttempt({
        emailAttempted:    loginEmail,
        usernameAttempted: usernameUsed,
        userId:            null,
        success:           false,
        failureReason:     'rate_limited_email',
      })
      return NextResponse.json(
        { error: `บัญชีของท่านถูกระงับการเข้าสู่ระบบชั่วคราว\nเนื่องจากกรอกรหัสผ่านผิดเกิน ${MAX_FAILS_PER_EMAIL} ครั้ง\nกรุณาลองใหม่อีกครั้งใน ${WINDOW_MINUTES} นาที` },
        { status: 429 }
      )
    }

    // 2b. ต่อ IP
    if (ip) {
      const { count: failCountIp } = await admin
        .from('tb_login_log')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .eq('success', false)
        .gte('attempted_at', windowStart)

      if ((failCountIp ?? 0) >= MAX_FAILS_PER_IP) {
        await logAttempt({
          emailAttempted:    loginEmail,
          usernameAttempted: usernameUsed,
          userId:            null,
          success:           false,
          failureReason:     'rate_limited_ip',
        })
        return NextResponse.json(
          { error: 'มีการพยายามเข้าสู่ระบบจาก IP นี้มากผิดปกติ กรุณาลองอีกครั้งภายหลัง' },
          { status: 429 }
        )
      }
    }

    // ─── 3. signInWithPassword ผ่าน createServerClient ─────
    // เก็บ cookies ที่ Supabase จะ set ไว้แล้วใส่ใน response ตอนท้าย
    const cookiesToSet: { name: string, value: string, options: any }[] = []
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(toSet) {
            toSet.forEach(c => cookiesToSet.push(c))
          },
        },
      }
    )

    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email:    loginEmail,
      password,
    })

    if (signInErr || !signInData.user) {
      // หา user_id ถ้ามี (เผื่อ track failed attempts ของ user คนนั้น)
      let userId: string | null = null
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', loginEmail)
        .maybeSingle()
      if (profile?.id) userId = profile.id

      await logAttempt({
        emailAttempted:    loginEmail,
        usernameAttempted: usernameUsed,
        userId,
        success:           false,
        failureReason:     userId ? 'wrong_password' : 'user_not_found',
      })
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    // ─── 4. Insert session row ก่อน (จะได้ session_id ไปแปะใน login log) ─
    // (Session Activity Log — B1)
    const parsedUA = parseUserAgent(ua)
    const { data: sessionRow } = await admin
      .from('tb_session_log')
      .insert({
        user_id:         signInData.user.id,
        email:           loginEmail,
        ip_address:      ip,
        user_agent:      ua,
        device_label:    parsedUA.device_label,
        browser_name:    parsedUA.browser_name,
        browser_version: parsedUA.browser_version,
        os_name:         parsedUA.os_name,
        os_version:      parsedUA.os_version,
        device_type:     parsedUA.device_type,
        device_vendor:   parsedUA.device_vendor,
        device_model:    parsedUA.device_model,
        device_fp:       deviceFp,
      })
      .select('id')
      .single()

    // ─── 4b. Insert log (success) พร้อม session_id ─────────
    await logAttempt({
      emailAttempted:    loginEmail,
      usernameAttempted: usernameUsed,
      userId:            signInData.user.id,
      success:           true,
      failureReason:     null,
      sessionId:         sessionRow?.id ?? null,
    })

    // ─── 5. ส่ง response พร้อม cookies ─────────────────────
    const response = NextResponse.json({ success: true })
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    // ตั้ง cookie tb_session_id (httpOnly) เพื่อให้ middleware/signout อ้างอิงได้
    if (sessionRow?.id) {
      response.cookies.set('tb_session_id', sessionRow.id, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   60 * 60 * 24 * 30,   // 30 วัน
      })
    }
    return response
  } catch (e: any) {
    console.error('login API error:', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 })
  }
}
