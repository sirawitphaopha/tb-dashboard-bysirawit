'use client'

import { useState } from 'react'

export default function ResetPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('กรุณากรอกอีเมล'); return }

    setLoading(true)
    try {
      await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      // ตอบ success เสมอ — ไม่เปิดเผยว่าอีเมลมีในระบบหรือไม่
      setSubmitted(true)
    } catch {
      // แม้ error ก็แสดงข้อความเดียวกัน — กัน user enumeration
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0d9488 100%)' }}>
      <div style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '440px', padding: '40px' }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <i className="fa-solid fa-key" style={{ fontSize: '28px', color: '#0d9488' }}></i>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#134e4a', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>ลืมรหัสผ่าน</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>กรุณากรอกอีเมลที่ใช้สมัครสมาชิก<br/>ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของท่าน</p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="fa-solid fa-paper-plane" style={{ fontSize: '24px', color: '#059669' }}></i>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#065f46', margin: '0 0 10px 0' }}>ส่งคำขอเรียบร้อยแล้ว</p>
            <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '10px', padding: '14px 16px', textAlign: 'left', margin: '14px 0' }}>
              <p style={{ fontSize: '13px', color: '#134e4a', margin: 0, lineHeight: 1.6 }}>
                หากอีเมลของท่านอยู่ในระบบ ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของท่านภายในเวลาไม่กี่นาที กรุณาตรวจสอบกล่องจดหมาย รวมถึงกล่องอีเมลขยะ
              </p>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '14px 0 18px' }}>
              <i className="fa-solid fa-clock" style={{ marginRight: '5px' }}></i>ลิงก์มีอายุ 1 ชั่วโมง
            </p>
            <a href="/login" style={{ display: 'inline-block', padding: '11px 28px', background: '#0d9488', color: '#fff', textDecoration: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', boxShadow: '0 4px 14px rgba(13,148,136,0.4)' }}>
              <i className="fa-solid fa-arrow-left" style={{ marginRight: '6px' }}></i>กลับไปหน้าเข้าสู่ระบบ
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="กรอกอีเมลที่ใช้สมัครสมาชิก"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#f9fafb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.border = '1.5px solid #0d9488'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.background = '#f9fafb' }}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <i className="fa-solid fa-circle-exclamation"></i>{error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: loading ? '#5eead4' : '#0d9488', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(13,148,136,0.4)', transition: 'background 0.2s' }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#0f766e' }}
              onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#0d9488' }}
            >
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลังส่งคำขอ...</>
                : <><i className="fa-solid fa-paper-plane"></i> ส่งลิงก์ตั้งรหัสผ่านใหม่</>}
            </button>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
              <a href="/login" style={{ fontSize: '13px', color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: '5px' }}></i>กลับไปหน้าเข้าสู่ระบบ
              </a>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
