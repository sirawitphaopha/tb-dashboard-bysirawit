'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function checkPassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  }
}

function getStrength(checks: ReturnType<typeof checkPassword>) {
  const passed = Object.values(checks).filter(Boolean).length
  if (passed <= 2) return { label: 'อ่อนแอ', color: '#ef4444', width: '20%' }
  if (passed <= 3) return { label: 'พอใช้', color: '#f59e0b', width: '50%' }
  if (passed === 4) return { label: 'ดี', color: '#3b82f6', width: '75%' }
  return { label: 'แข็งแกร่ง', color: '#22c55e', width: '100%' }
}

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const checks = checkPassword(password)
  const strength = getStrength(checks)
  const allPassed = Object.values(checks).every(Boolean)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!allPassed) { setError('รหัสผ่านยังไม่ผ่านเกณฑ์ความปลอดภัย'); return }
    if (password !== confirm) { setError('รหัสผ่านไม่ตรงกัน'); return }

    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message === 'User already registered' ? 'อีเมลนี้มีบัญชีอยู่แล้ว' : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) return (
    <div className="w-full h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center">
        <i className="fa-solid fa-circle-check text-6xl mb-4" style={{ color: '#22c55e' }}></i>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#134e4a' }}>สมัครสำเร็จ!</h2>
        <p className="text-sm mb-6" style={{ color: '#6b7280' }}>กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี จากนั้นกลับมา login ได้เลยค่ะ</p>
        <a href="/login" className="inline-block w-full p-3.5 rounded-xl font-bold text-white text-center" style={{ background: '#0f766e' }}>
          ไปหน้า Login
        </a>
      </div>
    </div>
  )

  return (
    <div className="w-full min-h-screen flex items-center justify-center py-8" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center">

        <div className="mb-4">
          <i className="fa-solid fa-lungs-virus text-5xl" style={{ color: '#0f766e' }}></i>
        </div>
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#134e4a' }}>สมัครสมาชิก</h1>
        <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>TB CARE & JOURNEY · รพ.ปรางค์กู่</p>

        <form onSubmit={handleRegister} className="space-y-4 text-left">
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: '#4b5563' }}>อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="กรอกอีเมลของคุณ"
              className="w-full p-3 border rounded-xl bg-gray-50 outline-none"
              style={{ borderColor: '#e5e7eb' }}
              onFocus={e => e.target.style.borderColor = '#0d9488'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: '#4b5563' }}>รหัสผ่าน</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                className="w-full p-3 pr-11 border rounded-xl bg-gray-50 outline-none"
                style={{ borderColor: '#e5e7eb' }}
                onFocus={e => e.target.style.borderColor = '#0d9488'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                required
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#0d9488' }}>
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>

            {password && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: '#6b7280' }}>ความแข็งแกร่ง</span>
                  <span className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: '#f3f4f6' }}>
                  <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: strength.width, background: strength.color }}></div>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {[
                    { key: 'length', label: 'อย่างน้อย 8 ตัวอักษร' },
                    { key: 'upper', label: 'ตัวพิมพ์ใหญ่ (A-Z)' },
                    { key: 'lower', label: 'ตัวพิมพ์เล็ก (a-z)' },
                    { key: 'number', label: 'ตัวเลข (0-9)' },
                    { key: 'special', label: 'อักขระพิเศษ (!@#$...)' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <i className={`fa-solid ${checks[key as keyof typeof checks] ? 'fa-circle-check' : 'fa-circle-xmark'} text-xs`}
                        style={{ color: checks[key as keyof typeof checks] ? '#22c55e' : '#d1d5db' }}></i>
                      <span className="text-xs" style={{ color: checks[key as keyof typeof checks] ? '#374151' : '#9ca3af' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: '#4b5563' }}>ยืนยันรหัสผ่าน</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                className="w-full p-3 pr-11 border rounded-xl bg-gray-50 outline-none"
                style={{ borderColor: confirm && confirm !== password ? '#ef4444' : '#e5e7eb' }}
                onFocus={e => e.target.style.borderColor = confirm && confirm !== password ? '#ef4444' : '#0d9488'}
                onBlur={e => e.target.style.borderColor = confirm && confirm !== password ? '#ef4444' : '#e5e7eb'}
                required
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#0d9488' }}>
                <i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {confirm && confirm !== password && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>รหัสผ่านไม่ตรงกัน</p>
            )}
          </div>

          {error && (
            <div className="text-sm p-3 rounded-xl flex items-center gap-2" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            style={{ background: loading ? '#99f6e4' : '#0f766e' }}
          >
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin"></i>กำลังสมัคร...</>
              : <><i className="fa-solid fa-user-plus"></i>สมัครสมาชิก</>}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t" style={{ borderColor: '#f3f4f6' }}>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            มีบัญชีแล้ว?{' '}
            <a href="/login" className="font-semibold" style={{ color: '#0f766e' }}>
              เข้าสู่ระบบ
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
