'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function RejectedPage() {
  const supabase = createClient()
  const [reason, setReason] = useState<string>('')

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase
        .from('profiles')
        .select('rejected_reason')
        .eq('id', user.id)
        .maybeSingle()
      setReason(data?.rejected_reason || '(ผู้ดูแลระบบไม่ได้ระบุเหตุผล)')
    })()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
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

        <div className="rounded-xl p-4 mb-6 text-left" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#991b1b' }}>เหตุผล:</p>
          <p className="text-sm leading-relaxed" style={{ color: '#7f1d1d' }}>{reason}</p>
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
