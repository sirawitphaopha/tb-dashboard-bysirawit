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

        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="130" height="104" style={{filter:'drop-shadow(0 6px 14px rgba(13,148,136,0.25))'}}>
            {/* ปอด + หลอดลม (teal) — ที่ตั้งของการอักเสบ */}
            <path fill="#0d9488" d="M320 0c17.7 0 32 14.3 32 32l0 124.2c-8.5-7.6-19.7-12.2-32-12.2s-23.5 4.6-32 12.2L288 32c0-17.7 14.3-32 32-32zM444.5 195.5c-16.4-16.4-41.8-18.5-60.5-6.1l0-24.1C384 127 415 96 453.3 96c21.7 0 42.8 10.2 55.8 28.8c15.4 22.1 44.3 65.4 71 116.9c26.5 50.9 52.4 112.5 59.6 170.3c.2 1.3 .2 2.6 .2 4l0 7c0 49.1-39.8 89-89 89c-7.3 0-14.5-.9-21.6-2.7l-72.7-18.2c-20.9-5.2-38.7-17.1-51.5-32.9c14 1.5 28.5-3 39.2-13.8l-22.6-22.6 22.6 22.6c18.7-18.7 18.7-49.1 0-67.9c-1.1-1.1-1.4-2-1.5-2.5c-.1-.8-.1-1.8 .4-2.9s1.2-1.9 1.8-2.3c.5-.3 1.3-.8 2.9-.8c26.5 0 48-21.5 48-48s-21.5-48-48-48c-1.6 0-2.4-.4-2.9-.8c-.6-.4-1.3-1.2-1.8-2.3s-.5-2.2-.4-2.9c.1-.6 .4-1.4 1.5-2.5c18.7-18.7 18.7-49.1 0-67.9zM183.3 491.2l-72.7 18.2c-7.1 1.8-14.3 2.7-21.6 2.7c-49.1 0-89-39.8-89-89l0-7c0-1.3 .1-2.7 .2-4c7.2-57.9 33.1-119.4 59.6-170.3c26.8-51.5 55.6-94.8 71-116.9c13-18.6 34-28.8 55.8-28.8C225 96 256 127 256 165.3l0 24.1c-18.6-12.4-44-10.3-60.5 6.1c-18.7 18.7-18.7 49.1 0 67.9c1.1 1.1 1.4 2 1.5 2.5c.1 .8 .1 1.8-.4 2.9s-1.2 1.9-1.8 2.3c-.5 .3-1.3 .8-2.9 .8c-26.5 0-48 21.5-48 48s21.5 48 48 48c1.6 0 2.4 .4 2.9 .8c.6 .4 1.3 1.2 1.8 2.3s.5 2.2 .4 2.9c-.1 .6-.4 1.4-1.5 2.5c-18.7 18.7-18.7 49.1 0 67.9c10.7 10.7 25.3 15.3 39.2 13.8c-12.8 15.9-30.6 27.7-51.5 32.9z"/>
            {/* Macrophage (amber) — เซลล์ภูมิคุ้มกันที่กลืน Mtb เข้าไป */}
            <path fill="#fbbf24" d="M421.8 421.8c-6.2 6.2-16.4 6.2-22.6 0C375.9 398.5 336 415 336 448c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-33-39.9-49.5-63.2-26.2c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6C241.5 375.9 225 336 192 336c-8.8 0-16-7.2-16-16s7.2-16 16-16c33 0 49.5-39.9 26.2-63.2c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0C264.1 241.5 304 225 304 192c0-8.8 7.2-16 16-16s16 7.2 16 16c0 33 39.9 49.5 63.2 26.2c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6C398.5 264.1 415 304 448 304c8.8 0 16 7.2 16 16s-7.2 16-16 16c-33 0-49.5 39.9-26.2 63.2c6.2 6.2 6.2 16.4 0 22.6z"/>
            {/* Mtb ใน phagosome — AFB+ บน Ziehl–Neelsen stain */}
            <path fill="#e11d48" d="M296 320a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm72 32a16 16 0 1 0 -32 0 16 16 0 1 0 32 0z"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: '35px', fontWeight: 800, color: '#0f766e', margin: '0 0 4px 0', letterSpacing: '-0.7px', whiteSpace: 'nowrap' }}>
          TB JOURNEY <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>&amp;</span> CARE
        </h1>
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
          <p style={{ fontSize: '11px', color: '#d1d5db', margin: '0 0 4px 0' }}>Version 0.7.14.6 · <span style={{ color: '#fbbf24', fontWeight: 600 }}>ยังไม่เผยแพร่</span></p>
          <p style={{ fontSize: '11px', color: '#d1d5db', margin: 0 }}>© 2026 TB JOURNEY &amp; CARE</p>
        </div>
      </div>
    </div>
  )
}
