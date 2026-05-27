'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import PasswordEye from '@/components/PasswordEye'

// กฎความแข็งแรงของรหัส — เหมือนหน้า register + เปลี่ยนรหัสในโปรไฟล์เป๊ะ
function checkPassword(pw: string) {
  return {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  }
}
function getStrength(checks: ReturnType<typeof checkPassword>) {
  const passed = Object.values(checks).filter(Boolean).length
  if (passed <= 2)  return { label: 'อ่อนแอ',    color: '#ef4444', width: '20%' }
  if (passed <= 3)  return { label: 'พอใช้',     color: '#f59e0b', width: '50%' }
  if (passed === 4) return { label: 'ดี',         color: '#3b82f6', width: '75%' }
  return              { label: 'แข็งแกร่ง',   color: '#22c55e', width: '100%' }
}

export default function ResetPasswordConfirmPage() {
  const router = useRouter()
  const supabase = createClient()

  // 'checking' = รอ Supabase verify token จาก hash | 'ready' = พร้อมตั้งรหัส
  // 'invalid' = token หมดอายุหรือไม่ valid | 'success' = ตั้งรหัสสำเร็จ
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'success'>('checking')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // เมื่อ user มาจากลิงก์ในเมล — ใช้ verifyOtp กับ token_hash จาก URL
  useEffect(() => {
    let cancelled = false

    const handleAuth = async () => {
      try {
        const url = new URL(window.location.href)
        const tokenHash = url.searchParams.get('token_hash')
        const type = url.searchParams.get('type')

        // กรณีปกติ: ลิงก์จากเมลมาพร้อม ?token_hash=...&type=recovery
        if (tokenHash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
          })
          if (cancelled) return
          if (error) {
            console.error('verifyOtp failed:', error)
            setStatus('invalid')
            return
          }
          // ล้าง URL ไม่ให้ token ค้าง (กัน reload แล้วใช้ซ้ำ)
          window.history.replaceState({}, '', '/reset-password/confirm')
          setStatus('ready')
          return
        }

        // เผื่อกรณี reload หน้านี้หลัง verify แล้ว → เช็ค session ปัจจุบัน
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return
        setStatus(session ? 'ready' : 'invalid')
      } catch (e) {
        console.error('reset-password verify error:', e)
        if (!cancelled) setStatus('invalid')
      }
    }

    handleAuth()

    return () => { cancelled = true }
  }, [supabase])

  const checks       = checkPassword(newPw)
  const strength     = getStrength(checks)
  const passedCount  = Object.values(checks).filter(Boolean).length
  const passwordOk   = passedCount >= 4 && checks.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newPw || !confirmPw)   { setError('กรุณากรอกข้อมูลให้ครบทุกช่อง'); return }
    if (!passwordOk)            { setError('รหัสผ่านยังไม่ผ่านเกณฑ์ความปลอดภัย (ต้องผ่านอย่างน้อย 4/5 ข้อ และมีความยาว 8 ตัวอักษรขึ้นไป)'); return }
    if (newPw !== confirmPw)    { setError('รหัสผ่านไม่ตรงกัน'); return }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('ลิงก์หมดอายุ กรุณาขอลิงก์ใหม่')
        setLoading(false)
        return
      }

      // เรียก API ฝั่ง server (enforce strength + log + ส่งเมลแจ้งเตือน)
      const res = await fetch('/api/auth/complete-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({ newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
        setLoading(false)
        return
      }

      // signOut ทันที — บังคับให้ login ด้วยรหัสใหม่ (session recovery ไม่ใช่ session ใช้งานจริง)
      await supabase.auth.signOut().catch(() => {})
      setLoading(false)
      setStatus('success')
    } catch (e: any) {
      setError('เกิดข้อผิดพลาด: ' + (e?.message || 'unknown'))
      setLoading(false)
    }
  }

  // ─── UI: รอ verify token ─────────────────────────────────
  if (status === 'checking') {
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '36px', color: '#0d9488' }}></i>
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>กำลังตรวจสอบลิงก์...</p>
        </div>
      </Shell>
    )
  }

  // ─── UI: ลิงก์หมดอายุ / ไม่ valid ─────────────────────────
  if (status === 'invalid') {
    return (
      <Shell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '28px', color: '#dc2626' }}></i>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#991b1b', margin: '0 0 6px 0' }}>ลิงก์หมดอายุ</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 22px', lineHeight: 1.6 }}>
            ลิงก์รีเซ็ตรหัสผ่านนี้หมดอายุหรือถูกใช้ไปแล้ว<br/>กรุณาขอลิงก์ใหม่อีกครั้ง
          </p>
          <a href="/reset-password" style={{ display: 'inline-block', padding: '12px 28px', background: '#0d9488', color: '#fff', textDecoration: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', boxShadow: '0 4px 14px rgba(13,148,136,0.4)' }}>
            <i className="fa-solid fa-rotate-right" style={{ marginRight: '6px' }}></i>ขอลิงก์ใหม่
          </a>
        </div>
      </Shell>
    )
  }

  // ─── UI: สำเร็จ ─────────────────────────────────────────
  if (status === 'success') {
    return (
      <Shell>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <i className="fa-solid fa-check" style={{ fontSize: '30px', color: '#059669' }}></i>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#065f46', margin: '0 0 6px 0' }}>ตั้งรหัสผ่านใหม่สำเร็จ</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 22px', lineHeight: 1.6 }}>
            ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
          </p>
          <button
            onClick={() => router.push('/login')}
            style={{ padding: '12px 28px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,148,136,0.4)' }}>
            <i className="fa-solid fa-right-to-bracket" style={{ marginRight: '6px' }}></i>ไปยังหน้าเข้าสู่ระบบ
          </button>
        </div>
      </Shell>
    )
  }

  // ─── UI: ฟอร์มตั้งรหัสใหม่ ──────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 44px 12px 14px', border: '1px solid #e5e7eb', borderRadius: '12px',
    background: '#f9fafb', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.border = '1.5px solid #0d9488'; e.target.style.background = '#fff' }
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.border = '1px solid #e5e7eb'; e.target.style.background = '#f9fafb' }

  return (
    <Shell>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <i className="fa-solid fa-key" style={{ fontSize: '24px', color: '#0d9488' }}></i>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#134e4a', margin: '0 0 4px 0' }}>ตั้งรหัสผ่านใหม่</h1>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>ตั้งรหัสผ่านใหม่เพื่อใช้เข้าสู่ระบบครั้งต่อไป</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>รหัสผ่านใหม่</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value.replace(/\s/g, ''))}
              onKeyDown={e => { if (e.key === ' ') e.preventDefault() }}
              name="new-password" autoComplete="new-password"
              placeholder="กรอกรหัสผ่านใหม่"
              style={inp} onFocus={onFocus} onBlur={onBlur}
              required disabled={loading} autoFocus
            />
            <PasswordEye show={showNew} onClick={() => setShowNew(v => !v)} />
          </div>

          {newPw && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>ความแข็งแกร่ง</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: strength.color }}>{strength.label}</span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: '#f3f4f6', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', width: strength.width, background: strength.color, transition: 'width 0.3s, background 0.3s' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 8px', marginTop: '8px' }}>
                {([
                  { key: 'length',  label: 'อย่างน้อย 8 ตัวอักษร' },
                  { key: 'upper',   label: 'ตัวพิมพ์ใหญ่ (A-Z)' },
                  { key: 'lower',   label: 'ตัวพิมพ์เล็ก (a-z)' },
                  { key: 'number',  label: 'ตัวเลข (0-9)' },
                  { key: 'special', label: 'อักขระพิเศษ (!@#$...)' },
                ] as const).map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className={`fa-solid ${checks[key] ? 'fa-circle-check' : 'fa-circle-xmark'}`}
                       style={{ fontSize: '11px', color: checks[key] ? '#22c55e' : '#d1d5db', flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: checks[key] ? '#374151' : '#9ca3af', whiteSpace: 'nowrap' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '6px' }}>ยืนยันรหัสผ่านใหม่</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value.replace(/\s/g, ''))}
              onKeyDown={e => { if (e.key === ' ') e.preventDefault() }}
              name="confirm-password" autoComplete="new-password"
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              style={{ ...inp, border: confirmPw && confirmPw !== newPw ? '1px solid #ef4444' : '1px solid #e5e7eb' }}
              onFocus={e => { e.target.style.border = `1.5px solid ${confirmPw && confirmPw !== newPw ? '#ef4444' : '#0d9488'}`; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.border = `1px solid ${confirmPw && confirmPw !== newPw ? '#ef4444' : '#e5e7eb'}`; e.target.style.background = '#f9fafb' }}
              required disabled={loading}
            />
            <PasswordEye show={showConfirm} onClick={() => setShowConfirm(v => !v)} />
          </div>
          {confirmPw && confirmPw !== newPw && (
            <p style={{ fontSize: '11px', color: '#ef4444', margin: '4px 0 0' }}>รหัสผ่านไม่ตรงกัน</p>
          )}
        </div>

        {error && (
          <div style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <i className="fa-solid fa-circle-exclamation"></i>{error}
          </div>
        )}

        <button
          type="submit" disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', background: loading ? '#5eead4' : '#0d9488', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(13,148,136,0.4)', transition: 'background 0.2s' }}
          onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#0f766e' }}
          onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#0d9488' }}>
          {loading
            ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลังตั้งรหัสผ่าน...</>
            : <><i className="fa-solid fa-key"></i> ตั้งรหัสผ่านใหม่</>}
        </button>
      </form>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0d9488 100%)' }}>
      <div style={{ background: '#fff', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '480px', padding: '40px' }}>
        {children}
      </div>
    </div>
  )
}
