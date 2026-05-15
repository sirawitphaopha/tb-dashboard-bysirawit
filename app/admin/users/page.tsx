'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Profile = {
  id: string
  username: string
  first_name: string
  last_name: string
  profession: string
  license_number: string
  phone: string | null
  hospital_name: string
  hospital_type: string
  department: string
  department_other: string | null
  status: 'pending' | 'approved' | 'rejected'
  role: 'admin' | 'user'
  rejected_reason: string | null
  created_at: string
  email?: string
}

const PROFESSION_LABELS: Record<string, string> = {
  doctor:'แพทย์', dentist:'ทันตแพทย์', pharmacist:'เภสัชกร', nurse:'พยาบาลวิชาชีพ',
  medtech:'นักเทคนิคการแพทย์', physio:'นักกายภาพบำบัด', radio:'นักรังสีการแพทย์',
  publichealth:'เจ้าหน้าที่สาธารณสุข', officer:'เจ้าพนักงาน', other:'อื่นๆ',
}

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  pending:  { bg:'#fef3c7', fg:'#92400e', label:'⏳ รออนุมัติ' },
  approved: { bg:'#d1fae5', fg:'#065f46', label:'✅ อนุมัติแล้ว' },
  rejected: { bg:'#fee2e2', fg:'#991b1b', label:'❌ ปฏิเสธ' },
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)

  const loadProfiles = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const admin = data?.role === 'admin'
      setIsAdmin(admin)
      if (admin) loadProfiles()
      else setLoading(false)
    })()
  }, [])

  const handleApprove = async (userId: string) => {
    setBusy(true)
    const res = await fetch('/api/admin/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    setBusy(false)
    if (res.ok) { alert('อนุมัติแล้ว ส่งเมลแจ้ง user เรียบร้อยค่ะ'); loadProfiles() }
    else { const e = await res.json(); alert('error: ' + e.error) }
  }

  const openReject = (userId: string) => { setRejectingId(userId); setRejectReason('') }
  const closeReject = () => { setRejectingId(null); setRejectReason('') }
  const submitReject = async () => {
    if (!rejectReason.trim()) { alert('กรุณาระบุเหตุผล'); return }
    setBusy(true)
    const res = await fetch('/api/admin/reject', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: rejectingId, reason: rejectReason }),
    })
    setBusy(false)
    if (res.ok) { alert('ปฏิเสธแล้ว ส่งเมลแจ้ง user เรียบร้อยค่ะ'); closeReject(); loadProfiles() }
    else { const e = await res.json(); alert('error: ' + e.error) }
  }

  const filtered = filter === 'all' ? profiles : profiles.filter(p => p.status === filter)
  const counts = {
    pending: profiles.filter(p => p.status === 'pending').length,
    approved: profiles.filter(p => p.status === 'approved').length,
    rejected: profiles.filter(p => p.status === 'rejected').length,
  }

  if (loading) return <div className="p-10 text-center" style={{ color:'#6b7280' }}>กำลังโหลด...</div>

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10">
        <div className="text-center max-w-md">
          <i className="fa-solid fa-lock text-5xl mb-4" style={{ color:'#ef4444' }}></i>
          <h1 className="text-xl font-bold mb-2" style={{ color:'#134e4a' }}>ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-sm" style={{ color:'#6b7280' }}>หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
          <a href="/" className="inline-block mt-4 px-6 py-2 rounded-lg font-bold text-white" style={{ background:'#0f766e' }}>กลับหน้าหลัก</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background:'#f3f4f6' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color:'#134e4a' }}>👥 จัดการผู้ใช้</h1>
            <p className="text-sm mt-1" style={{ color:'#6b7280' }}>อนุมัติหรือปฏิเสธคำขอสมัครสมาชิก</p>
          </div>
          <a href="/" className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background:'#fff', color:'#0f766e', border:'1px solid #d1fae5' }}>
            ← กลับหน้าหลัก
          </a>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 bg-white rounded-xl p-1.5 shadow-sm" style={{ width:'fit-content' }}>
          {([
            ['pending',  `รออนุมัติ (${counts.pending})`,  '#f59e0b'],
            ['approved', `อนุมัติแล้ว (${counts.approved})`, '#22c55e'],
            ['rejected', `ปฏิเสธ (${counts.rejected})`,    '#ef4444'],
            ['all',      'ทั้งหมด',                          '#6b7280'],
          ] as const).map(([key, label, color]) => (
            <button key={key} onClick={() => setFilter(key)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: filter === key ? color : 'transparent',
                color:      filter === key ? '#fff' : '#6b7280',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <i className="fa-solid fa-inbox text-4xl mb-3" style={{ color:'#d1d5db' }}></i>
            <p style={{ color:'#9ca3af' }}>ไม่มีผู้ใช้ในหมวดนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => {
              const sc = STATUS_COLORS[p.status]
              const dept = p.department === 'อื่นๆ' ? (p.department_other || 'อื่นๆ') : p.department
              return (
                <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg font-bold" style={{ color:'#134e4a' }}>
                          {p.first_name} {p.last_name}
                        </h3>
                        <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ background:sc.bg, color:sc.fg }}>{sc.label}</span>
                        {p.role === 'admin' && (
                          <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ background:'#ede9fe', color:'#5b21b6' }}>👑 Admin</span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color:'#6b7280' }}>
                        {PROFESSION_LABELS[p.profession] || p.profession}
                        {p.license_number && ` · ${p.license_number}`}
                      </p>
                    </div>
                    {p.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleApprove(p.id)} disabled={busy}
                          className="px-4 py-2 rounded-lg font-bold text-white text-sm shadow-md"
                          style={{ background:'#22c55e' }}>
                          <i className="fa-solid fa-check mr-1.5"></i>อนุมัติ
                        </button>
                        <button onClick={() => openReject(p.id)} disabled={busy}
                          className="px-4 py-2 rounded-lg font-bold text-white text-sm shadow-md"
                          style={{ background:'#ef4444' }}>
                          <i className="fa-solid fa-xmark mr-1.5"></i>ปฏิเสธ
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs pt-3 border-t" style={{ borderColor:'#f3f4f6' }}>
                    <Item label="โรงพยาบาล" value={p.hospital_name} />
                    <Item label="ประเภท" value={p.hospital_type} />
                    <Item label="แผนก" value={dept} />
                    <Item label="Username" value={p.username} />
                    <Item label="Email" value={p.email || '—'} />
                    <Item label="เบอร์โทร" value={p.phone || '—'} />
                  </div>

                  {p.status === 'rejected' && p.rejected_reason && (
                    <div className="mt-3 p-3 rounded-lg text-xs" style={{ background:'#fef2f2', color:'#991b1b' }}>
                      <strong>เหตุผลปฏิเสธ:</strong> {p.rejected_reason}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Reject Modal */}
        {rejectingId && (
          <div className="fixed inset-0 flex items-center justify-center p-5 z-50" style={{ background:'rgba(15,23,42,0.5)', backdropFilter:'blur(3px)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-3" style={{ color:'#991b1b' }}>
                <i className="fa-solid fa-circle-xmark mr-2"></i>ปฏิเสธคำขอสมัคร
              </h3>
              <p className="text-sm mb-4" style={{ color:'#6b7280' }}>
                กรุณาระบุเหตุผล (จะแจ้งไปทางอีเมลของ user)
              </p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                rows={4}
                placeholder="เช่น ข้อมูลไม่ครบถ้วน, ไม่ใช่บุคลากรในระบบ ฯลฯ"
                className="w-full p-3 border rounded-xl text-sm outline-none"
                style={{ borderColor:'#e5e7eb', background:'#f9fafb' }} />
              <div className="flex gap-2 mt-4">
                <button onClick={closeReject} disabled={busy}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm border"
                  style={{ borderColor:'#e5e7eb', color:'#374151' }}>ยกเลิก</button>
                <button onClick={submitReject} disabled={busy || !rejectReason.trim()}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm"
                  style={{ background: busy ? '#fca5a5' : '#ef4444' }}>
                  {busy ? 'กำลังส่ง...' : 'ยืนยันปฏิเสธ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color:'#9ca3af' }}>{label}</p>
      <p className="text-sm font-semibold mt-0.5" style={{ color:'#1f2937' }}>{value}</p>
    </div>
  )
}
