import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { validatePhone, formatPhone } from '@/lib/phone'

// ฟิลด์ที่ user แก้เองได้ (self-editable)
const SELF_EDITABLE = ['phone', 'department', 'department_other'] as const

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // เลือกเฉพาะฟิลด์ที่อนุญาตให้แก้เอง
    const patch: Record<string, any> = {}
    for (const key of SELF_EDITABLE) {
      if (key in body) patch[key] = body[key]
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'no editable fields provided' }, { status: 400 })
    }

    // ตรวจ + จัดรูปแบบเบอร์โทรก่อนบันทึก
    if ('phone' in patch) {
      const chk = validatePhone(patch.phone)
      if (!chk.ok) return NextResponse.json({ error: chk.msg }, { status: 400 })
      patch.phone = formatPhone(patch.phone)
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .update(patch)
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
}
