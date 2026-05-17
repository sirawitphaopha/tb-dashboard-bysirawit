'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

const ADMIN_CONTACT = 'siravitphoapha9928@gmail.com'

export default function RejectedPage() {
  const supabase = createClient()
  const [reason, setReason] = useState<string>('')
  const [deactivatedAt, setDeactivatedAt] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase
        .from('profiles')
        .select('rejected_reason, deactivated_at')
        .eq('id', user.id)
        .maybeSingle()
      setReason(data?.rejected_reason || '(ผู้ดูแลระบบไม่ได้ระบุเหตุผล)')
      setDeactivatedAt(data?.deactivated_at || null)
    })()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isDeactivated = reason === 'ปิดบัญชีโดย Admin'

  const deletionDate = deactivatedAt
    ? new Date(new Date(deactivatedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  if (isDeactivated) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)' }}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center">
          <i className="fa-solid fa-lock text-6xl mb-4" style={{ color: '#f97316' }}></i>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#134e4a' }}>
            บัญชีของท่านถูกปิดชั่วคราว
          </h1>
          <p className="text-sm mb-5" style={{ color: '#6b7280' }}>
            ผู้ดูแลระบบได้ทำการปิดบัญชีของท่าน
          </p>

          {deletionDate && (
            <div className="rounded-xl p-4 mb-4 text-left" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#9a3412' }}>⏳ กำหนดลบบัญชีอัตโนมัติ</p>
              <p className="text-sm" style={{ color: '#7c2d12' }}>
                หากไม่มีการกู้คืน บัญชีจะถูกลบถาวรในวันที่ <strong>{deletionDate}</strong>
              </p>
            </div>
          )}

          <div className="rounded-xl p-4 mb-6" style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#0f766e' }}>หากต้องการกู้คืนบัญชี</p>
            <p className="text-sm" style={{ color: '#134e4a' }}>
              ติดต่อผู้ดูแลระบบที่<br />
              <strong>{ADMIN_CONTACT}</strong>
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full p-3.5 rounded-xl font-bold text-white"
            style={{ background: '#0f766e' }}>
            ออกจากระบบ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center">
        <i className="fa-solid fa-circle-xmark text-6xl mb-4" style={{ color: '#ef4444' }}></i>
        <h1 className="text-2xl font-bold mb-3" style={{ color: '#134e4a' }}>
          คำขอสมัครถูกปฏิเสธ
        </h1>
        <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
          ผู้ดูแลระบบไม่อนุมัติคำขอสมัครของท่าน
        </p>

        <div className="rounded-xl p-4 mb-4 text-left" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#991b1b' }}>เหตุผล:</p>
          <p className="text-sm leading-relaxed" style={{ color: '#7f1d1d' }}>{reason}</p>
        </div>

        <div className="rounded-xl p-4 mb-6 text-left" style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#0f766e' }}>📝 สมัครใหม่ได้</p>
          <p className="text-sm" style={{ color: '#134e4a' }}>
            ท่านสามารถ<strong>สมัครด้วยอีเมลเดิม</strong>ได้ทันที โดยไม่ต้องติดต่อผู้ดูแล
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <a href="/register"
            className="w-full p-3.5 rounded-xl font-bold text-white text-center"
            style={{ background: '#0f766e' }}>
            สมัครใหม่
          </a>
          <button
            onClick={handleSignOut}
            className="w-full p-3.5 rounded-xl font-bold"
            style={{ background: '#f3f4f6', color: '#6b7280' }}>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  )
}
