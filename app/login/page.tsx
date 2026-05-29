'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PasswordEye from '@/components/PasswordEye'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // รหัสประจำเครื่อง (device fingerprint) — สุ่มครั้งแรก เก็บถาวรใน localStorage
  // ไม่เปลี่ยนแม้ logout/login ใหม่ → ใช้แยกเครื่องในหน้าบันทึกกิจกรรม
  const getDeviceFp = () => {
    try {
      let fp = localStorage.getItem('tb_device_fp')
      if (!fp) {
        fp = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
        localStorage.setItem('tb_device_fp', fp)
      }
      return fp
    } catch { return null }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // เรียก API ฝั่ง server (มี rate limit + audit log + ตั้ง cookie ให้)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password, deviceFp: getDeviceFp() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        setLoading(false)
        return
      }

      // Cookie ถูกตั้งจากฝั่ง server แล้ว — แค่ refresh ให้ middleware/component อ่านใหม่
      router.push('/')
      router.refresh()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0d9488 100%)' }}>
      <div style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '420px', padding: '40px', textAlign: 'center' }}>

        <div style={{ marginBottom: '16px' }}>
          <i className="fa-solid fa-lungs-virus" style={{ fontSize: '56px', color: '#0d9488' }}></i>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#134e4a', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>TB JOURNEY & CARE</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 28px 0' }}>รพ.ปรางค์กู่ · กลุ่มงานเภสัชกรรม</p>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>Email / Username</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="กรอกอีเมล"
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#f9fafb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.border = '1.5px solid #0d9488'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.background = '#f9fafb' }}
              required
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                style={{ width: '100%', padding: '12px 44px 12px 14px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#f9fafb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.border = '1.5px solid #0d9488'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.background = '#f9fafb' }}
                required
              />
              <PasswordEye show={showPassword} onClick={() => setShowPassword(v => !v)} />
            </div>
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <a href="/reset-password" style={{ fontSize: '12px', color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
                ลืมรหัสผ่าน
              </a>
            </div>
          </div>

          {error && (
            <div style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ marginTop: '3px' }}></i>
              <span style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', background: loading ? '#5eead4' : '#0d9488', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(13,148,136,0.4)', transition: 'background 0.2s' }}
            onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#0f766e' }}
            onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#0d9488' }}
          >
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลังเข้าสู่ระบบ...</>
              : <><i className="fa-solid fa-right-to-bracket"></i> เข้าสู่ระบบ</>}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
            หากท่านยังไม่เป็นสมาชิก{' '}
            <a href="/register" style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
              กรุณาลงทะเบียน
            </a>
          </p>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px 0' }}>พัฒนาโดย เภสัชกร สิรวิชญ์ เผ่าผา</p>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px 0' }}>โรงพยาบาลปรางค์กู่</p>
          <p style={{ fontSize: '11px', color: '#d1d5db', margin: '0 0 4px 0' }}>Version 0.7.13.4 · <span style={{ color: '#fbbf24', fontWeight: 600 }}>ยังไม่เผยแพร่</span></p>
          <p style={{ fontSize: '11px', color: '#d1d5db', margin: 0 }}>© 2026 TB JOURNEY &amp; CARE</p>
        </div>
      </div>
    </div>
  )
}
