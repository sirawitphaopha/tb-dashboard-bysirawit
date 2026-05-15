'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-browser'

export default function PendingApprovalPage() {
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center">
        <i className="fa-solid fa-hourglass-half text-6xl mb-4" style={{ color: '#f59e0b' }}></i>
        <h1 className="text-2xl font-bold mb-3" style={{ color: '#134e4a' }}>
          รอการอนุมัติจากผู้ดูแลระบบ
        </h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: '#6b7280' }}>
          คำขอสมัครสมาชิกของท่านได้ถูกส่งให้ผู้ดูแลระบบพิจารณาแล้ว<br />
          เมื่อได้รับการอนุมัติ ระบบจะแจ้งให้ทราบทางอีเมล
        </p>

        <div className="rounded-xl p-4 mb-6 text-left" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
          <div className="flex items-start gap-2">
            <i className="fa-solid fa-circle-info mt-0.5" style={{ color: '#d97706' }}></i>
            <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
              ระบบนี้ใช้สำหรับบุคลากรทางการแพทย์เท่านั้น<br />
              หากท่านมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบโดยตรง
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full p-3.5 rounded-xl font-bold text-white"
          style={{ background: '#0f766e' }}>
          <i className="fa-solid fa-right-from-bracket mr-2"></i>
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}
