'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import PasswordEye from '@/components/PasswordEye'
import { PROFESSIONS, NAME_PREFIXES, displayTitle } from '@/lib/professions'
import { validatePhone, formatPhone } from '@/lib/phone'

const HOSPITAL_TYPES = [
  'โรงพยาบาลศูนย์ (ระดับ A)',
  'โรงพยาบาลทั่วไป (ระดับ S)',
  'โรงพยาบาลทั่วไป (ระดับ M1)',
  'โรงพยาบาลชุมชน (ระดับ M2)',
  'โรงพยาบาลชุมชน (ระดับ F1)',
  'โรงพยาบาลชุมชน (ระดับ F2)',
  'โรงพยาบาลชุมชน (ระดับ F3)',
  'โรงพยาบาลเอกชน',
  'สำนักงานสาธารณสุข (สสจ./สสอ.)',
  'โรงพยาบาลส่งเสริมสุขภาพตำบล (รพ.สต.)',
]

const DEPARTMENTS = [
  'กลุ่มงานเภสัชกรรม',
  'กลุ่มงานการพยาบาล',
  'กลุ่มงานแพทย์',
  'อื่นๆ',
]

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
  if (passed <= 2) return { label: 'อ่อนแอ',     color: '#ef4444', width: '20%' }
  if (passed <= 3) return { label: 'พอใช้',       color: '#f59e0b', width: '50%' }
  if (passed === 4) return { label: 'ดี',          color: '#3b82f6', width: '75%' }
  return               { label: 'แข็งแกร่ง',    color: '#22c55e', width: '100%' }
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e5e7eb',
  borderRadius: '10px', background: '#f9fafb', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#4b5563',
  display: 'block', marginBottom: '5px',
}
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.border = '1.5px solid #0d9488'
  e.target.style.background = '#fff'
}
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.border = '1px solid #e5e7eb'
  e.target.style.background = '#f9fafb'
}

export default function RegisterPage() {
  const supabase = createClient()

  const [username,     setUsername]     = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)

  const [firstName,    setFirstName]    = useState('')
  const [lastName,     setLastName]     = useState('')
  const [profession,   setProfession]   = useState('')
  const [title,        setTitle]        = useState('')
  const [licenseNum,   setLicenseNum]   = useState('')
  const [phone,        setPhone]        = useState('')

  const [hospitalName,    setHospitalName]    = useState('')
  const [hospitalType,    setHospitalType]    = useState('')
  const [department,      setDepartment]      = useState('')
  const [departmentOther, setDepartmentOther] = useState('')

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const checks       = checkPassword(password)
  const strength     = getStrength(checks)
  const passedCount  = Object.values(checks).filter(Boolean).length
  const passwordOk   = passedCount >= 4 && checks.length
  const prefix       = PROFESSIONS[profession]?.prefix ?? ''
  const shownTitle   = displayTitle(profession, title)  // ตัวย่อวิชาชีพที่ระบบจะแสดงให้ (เช่น ภญ.)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!passwordOk)           { setError('รหัสผ่านยังไม่ผ่านเกณฑ์ความปลอดภัย (ต้องผ่านอย่างน้อย 4/5 ข้อ และมีความยาว 8 ตัวอักษรขึ้นไป)'); return }
    if (password !== confirm)  { setError('รหัสผ่านไม่ตรงกัน'); return }
    if (!profession || !hospitalType || !department) { setError('กรุณากรอกข้อมูลให้ครบทุกช่อง'); return }
    if (profession && !title) { setError('กรุณาเลือกคำนำหน้าชื่อ'); return }
    if (prefix && !licenseNum.trim()) { setError('กรุณากรอกเลขใบประกอบวิชาชีพ'); return }
    if (department === 'อื่นๆ' && !departmentOther.trim()) { setError('กรุณาระบุชื่อแผนก'); return }
    const phoneCheck = validatePhone(phone)
    if (!phoneCheck.ok) { setError(phoneCheck.msg); return }

    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username, email, password,
          firstName, lastName,
          profession, title, licenseNumber: licenseNum, phone,
          hospitalName, hospitalType, department, departmentOther,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
        setLoading(false)
        return
      }
      setSuccess(true)
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถเชื่อมต่อระบบได้'))
      setLoading(false)
    }
  }

  if (success) return (
    <div className="w-full min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 text-center">
        <i className="fa-solid fa-hourglass-half text-6xl mb-4" style={{ color: '#f59e0b' }}></i>
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#134e4a' }}>ส่งคำขอเรียบร้อย</h2>
        <p className="text-sm mb-3" style={{ color: '#6b7280', lineHeight: 1.9 }}>
          ระบบได้รับข้อมูลของท่านเรียบร้อยแล้ว<br />
          กรุณารอผู้ดูแลระบบพิจารณาอนุมัติ
        </p>
        <div className="mb-4 p-3 rounded-xl text-left" style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}>
          <p className="text-xs mb-1" style={{ color: '#0f766e' }}>ผลการอนุมัติจะส่งไปที่</p>
          <p className="font-bold text-sm" style={{ color: '#134e4a' }}>{email}</p>
        </div>

        {/* หมายเหตุเรื่อง spam */}
        <div className="mb-6 p-3 rounded-xl text-left flex gap-3"
          style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
          <i className="fa-solid fa-triangle-exclamation flex-shrink-0 mt-0.5" style={{ color: '#d97706' }}></i>
          <div className="text-xs" style={{ color: '#92400e', lineHeight: 1.7 }}>
            <strong>หากไม่ได้รับอีเมล</strong> กรุณาตรวจสอบกล่องจดหมายขยะ (Spam / Junk Mail) เนื่องจากระบบอาจคัดกรองอีเมลอัตโนมัติ
          </div>
        </div>

        <a href="/login"
          className="inline-block w-full p-3.5 rounded-xl font-bold text-white text-center"
          style={{ background: '#0f766e' }}>
          กลับหน้า Login
        </a>
      </div>
    </div>
  )

  return (
    <div className="w-full min-h-screen flex justify-center py-10"
      style={{ background: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative">

        {/* Back button */}
        <a href="/login"
          className="absolute top-5 left-5 flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: '#0f766e' }}>
          <i className="fa-solid fa-arrow-left"></i>
          <span>ย้อนกลับ</span>
        </a>

        {/* Header */}
        <div className="text-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="60" height="48" style={{ display: 'inline-block' }}>
            <path fill="#0d9488" d="M320 0c17.7 0 32 14.3 32 32l0 124.2c-8.5-7.6-19.7-12.2-32-12.2s-23.5 4.6-32 12.2L288 32c0-17.7 14.3-32 32-32zM444.5 195.5c-16.4-16.4-41.8-18.5-60.5-6.1l0-24.1C384 127 415 96 453.3 96c21.7 0 42.8 10.2 55.8 28.8c15.4 22.1 44.3 65.4 71 116.9c26.5 50.9 52.4 112.5 59.6 170.3c.2 1.3 .2 2.6 .2 4l0 7c0 49.1-39.8 89-89 89c-7.3 0-14.5-.9-21.6-2.7l-72.7-18.2c-20.9-5.2-38.7-17.1-51.5-32.9c14 1.5 28.5-3 39.2-13.8l-22.6-22.6 22.6 22.6c18.7-18.7 18.7-49.1 0-67.9c-1.1-1.1-1.4-2-1.5-2.5c-.1-.8-.1-1.8 .4-2.9s1.2-1.9 1.8-2.3c.5-.3 1.3-.8 2.9-.8c26.5 0 48-21.5 48-48s-21.5-48-48-48c-1.6 0-2.4-.4-2.9-.8c-.6-.4-1.3-1.2-1.8-2.3s-.5-2.2-.4-2.9c.1-.6 .4-1.4 1.5-2.5c18.7-18.7 18.7-49.1 0-67.9zM183.3 491.2l-72.7 18.2c-7.1 1.8-14.3 2.7-21.6 2.7c-49.1 0-89-39.8-89-89l0-7c0-1.3 .1-2.7 .2-4c7.2-57.9 33.1-119.4 59.6-170.3c26.8-51.5 55.6-94.8 71-116.9c13-18.6 34-28.8 55.8-28.8C225 96 256 127 256 165.3l0 24.1c-18.6-12.4-44-10.3-60.5 6.1c-18.7 18.7-18.7 49.1 0 67.9c1.1 1.1 1.4 2 1.5 2.5c.1 .8 .1 1.8-.4 2.9s-1.2 1.9-1.8 2.3c-.5 .3-1.3 .8-2.9 .8c-26.5 0-48 21.5-48 48s21.5 48 48 48c1.6 0 2.4 .4 2.9 .8c.6 .4 1.3 1.2 1.8 2.3s.5 2.2 .4 2.9c-.1 .6-.4 1.4-1.5 2.5c-18.7 18.7-18.7 49.1 0 67.9c10.7 10.7 25.3 15.3 39.2 13.8c-12.8 15.9-30.6 27.7-51.5 32.9z"/>
            <path fill="#fbbf24" d="M421.8 421.8c-6.2 6.2-16.4 6.2-22.6 0C375.9 398.5 336 415 336 448c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-33-39.9-49.5-63.2-26.2c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6C241.5 375.9 225 336 192 336c-8.8 0-16-7.2-16-16s7.2-16 16-16c33 0 49.5-39.9 26.2-63.2c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0C264.1 241.5 304 225 304 192c0-8.8 7.2-16 16-16s16 7.2 16 16c0 33 39.9 49.5 63.2 26.2c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6C398.5 264.1 415 304 448 304c8.8 0 16 7.2 16 16s-7.2 16-16 16c-33 0-49.5 39.9-26.2 63.2c6.2 6.2 6.2 16.4 0 22.6z"/>
            <path fill="#e11d48" d="M296 320a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm72 32a16 16 0 1 0 -32 0 16 16 0 1 0 32 0z"/>
          </svg>
          <h1 className="text-2xl font-bold mt-2" style={{ color: '#134e4a' }}>Register</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af', fontFamily: "'Manrope', sans-serif" }}>TB JOURNEY <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>&amp;</span> CARE · รพ.ปรางค์กู่</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">

          {/* ── ACCOUNT ── */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>
              Account
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 2fr' }}>
              <div>
                <label style={lbl}>Username <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="username" autoComplete="username"
                  value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                  onKeyDown={e => { if (e.key === ' ') e.preventDefault() }}
                  placeholder="username" style={inp} onFocus={focus} onBlur={blur} required />
              </div>
              <div>
                <label style={lbl}>Email <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" name="email" autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value.replace(/\s/g, ''))}
                  onKeyDown={e => { if (e.key === ' ') e.preventDefault() }}
                  placeholder="email@example.com" style={inp} onFocus={focus} onBlur={blur} required />
                <p style={{ fontSize: '11px', color: '#d97706', marginTop: '5px', lineHeight: 1.5 }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '4px' }}></i>
                  กรุณาตรวจสอบให้ถูกต้อง
                  <br />
                  <span style={{ marginLeft: '17px' }}>ระบบจะแจ้งผลอนุมัติทางอีเมลนี้เท่านั้น</span>
                </p>
              </div>
            </div>

            <div className="mt-3">
              <label style={lbl}>Password <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="new-password" autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value.replace(/\s/g, ''))}
                  onKeyDown={e => { if (e.key === ' ') e.preventDefault() }}
                  placeholder="กรอกรหัสผ่าน"
                  style={{ ...inp, paddingRight: '44px' }}
                  onFocus={focus} onBlur={blur} required
                />
                <PasswordEye show={showPassword} onClick={() => setShowPassword(v => !v)} />
              </div>

              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#6b7280' }}>ความแข็งแกร่ง</span>
                    <span className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: '#f3f4f6' }}>
                    <div className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: strength.width, background: strength.color }} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-0.5">
                    {([
                      { key: 'length',  label: 'อย่างน้อย 8 ตัวอักษร' },
                      { key: 'upper',   label: 'ตัวพิมพ์ใหญ่ (A-Z)' },
                      { key: 'lower',   label: 'ตัวพิมพ์เล็ก (a-z)' },
                      { key: 'number',  label: 'ตัวเลข (0-9)' },
                      { key: 'special', label: 'อักขระพิเศษ (!@#$...)' },
                    ] as const).map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <i className={`fa-solid ${checks[key] ? 'fa-circle-check' : 'fa-circle-xmark'} text-xs`}
                          style={{ color: checks[key] ? '#22c55e' : '#d1d5db' }} />
                        <span className="text-xs" style={{ color: checks[key] ? '#374151' : '#9ca3af' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3">
              <label style={lbl}>Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm-password" autoComplete="new-password"
                  value={confirm} onChange={e => setConfirm(e.target.value.replace(/\s/g, ''))}
                  onKeyDown={e => { if (e.key === ' ') e.preventDefault() }}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  style={{ ...inp, paddingRight: '44px', borderColor: confirm && confirm !== password ? '#ef4444' : '#e5e7eb' }}
                  onFocus={e => { e.target.style.border = `1.5px solid ${confirm && confirm !== password ? '#ef4444' : '#0d9488'}`; e.target.style.background = '#fff' }}
                  onBlur={e => { e.target.style.border = `1px solid ${confirm && confirm !== password ? '#ef4444' : '#e5e7eb'}`; e.target.style.background = '#f9fafb' }}
                  required
                />
                <PasswordEye show={showConfirm} onClick={() => setShowConfirm(v => !v)} />
              </div>
              {confirm && confirm !== password && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>รหัสผ่านไม่ตรงกัน</p>
              )}
            </div>
          </section>

          <hr style={{ borderColor: '#f3f4f6' }} />

          {/* ── PERSONAL ── */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>
              Personal Info
            </p>
            <div className="mb-3">
              <label style={lbl}>คำนำหน้าชื่อ <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={title} onChange={e => setTitle(e.target.value)}
                style={{ ...inp, cursor: 'pointer' }} onFocus={focus} onBlur={blur} required>
                <option value="">-- เลือกคำนำหน้า --</option>
                {NAME_PREFIXES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={lbl}>ชื่อ <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="flex items-center gap-2">
                  {shownTitle && (
                    <span className="text-sm font-bold shrink-0 px-2.5 py-2 rounded-xl" style={{ background: '#f0fdf4', color: '#0d9488', border: '1px solid #d1fae5' }}>
                      {shownTitle}
                    </span>
                  )}
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="ชื่อ" style={inp} onFocus={focus} onBlur={blur} required />
                </div>
              </div>
              <div>
                <label style={lbl}>นามสกุล <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="นามสกุล" style={inp} onFocus={focus} onBlur={blur} required />
              </div>
            </div>

            <div className="mt-3">
              <label style={lbl}>วิชาชีพ <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={profession}
                onChange={e => { setProfession(e.target.value); setLicenseNum('') }}
                style={{ ...inp, cursor: 'pointer' }} onFocus={focus} onBlur={blur} required>
                <option value="">-- เลือกวิชาชีพ --</option>
                {Object.entries(PROFESSIONS).map(([k, { label }]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>

            {profession && (() => {
              const licenseDup = !!error && error.includes('เลขใบประกอบ')
              return (
                <div className="mt-3">
                  <label style={lbl}>
                    เลขใบประกอบวิชาชีพ
                    {prefix && <span style={{ color: '#ef4444' }}> *</span>}
                    {prefix && (
                      <span className="ml-1.5 font-normal text-xs" style={{ color: '#0d9488' }}>
                        (คำนำหน้า: {prefix})
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    {prefix && (
                      <span className="text-sm font-bold shrink-0 px-3 py-2.5 rounded-xl"
                        style={{
                          background: licenseDup ? '#fef2f2' : '#f0fdf4',
                          color: licenseDup ? '#dc2626' : '#0d9488',
                          border: `1px solid ${licenseDup ? '#fecaca' : '#d1fae5'}`,
                        }}>
                        {prefix}
                      </span>
                    )}
                    <input
                      type="text"
                      value={licenseNum}
                      onChange={e => { setLicenseNum(e.target.value.replace(/\D/g, '')); if (licenseDup) setError('') }}
                      placeholder={prefix ? 'กรอกเลขใบประกอบวิชาชีพ *' : 'กรอกเลขใบประกอบ (ถ้ามี)'}
                      required={!!prefix}
                      style={{ ...inp, borderColor: licenseDup ? '#ef4444' : '#e5e7eb' }}
                      onFocus={e => { e.target.style.border = `1.5px solid ${licenseDup ? '#ef4444' : '#0d9488'}`; e.target.style.background = '#fff' }}
                      onBlur={e => { e.target.style.border = `1px solid ${licenseDup ? '#ef4444' : '#e5e7eb'}`; e.target.style.background = '#f9fafb' }}
                    />
                  </div>
                  {licenseDup && (
                    <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '5px' }}>
                      <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '4px' }}></i>
                      เลขนี้มีคนใช้แล้ว — กรุณาแก้ไขหรือใช้อีเมลเดิมที่เคยสมัคร
                    </p>
                  )}
                </div>
              )
            })()}

            <div className="mt-3">
              <label style={lbl}>เบอร์โทรศัพท์ <span style={{ color: '#ef4444' }}>*</span></label>
              {(() => {
                const v = validatePhone(phone)
                const showError = phone.replace(/\D/g, '').length > 0 && !v.ok
                return (
                  <>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      placeholder="0xx-xxx-xxxx"
                      required
                      style={{ ...inp, borderColor: showError ? '#ef4444' : '#e5e7eb' }}
                      onFocus={e => { e.target.style.border = `1.5px solid ${showError ? '#ef4444' : '#0d9488'}`; e.target.style.background = '#fff' }}
                      onBlur={e => { e.target.style.border = `1px solid ${showError ? '#ef4444' : '#e5e7eb'}`; e.target.style.background = '#f9fafb' }}
                    />
                    {showError && (
                      <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '5px' }}>
                        <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '4px' }}></i>
                        {v.msg}
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          </section>

          <hr style={{ borderColor: '#f3f4f6' }} />

          {/* ── HOSPITAL ── */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>
              Hospital
            </p>
            <div>
              <label style={lbl}>ชื่อโรงพยาบาล / หน่วยงาน <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" value={hospitalName} onChange={e => setHospitalName(e.target.value)}
                placeholder="เช่น โรงพยาบาลปรางค์กู่ / สำนักงานสาธารณสุขจังหวัดศรีสะเกษ"
                style={inp} onFocus={focus} onBlur={blur} required />
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '5px', lineHeight: 1.6 }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: '4px', color: '#0d9488' }}></i>
                กรุณาระบุชื่อเต็ม เช่น <strong>"โรงพยาบาลปรางค์กู่"</strong> ไม่ใช่แค่ <strong>"ปรางค์กู่"</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label style={lbl}>ประเภทโรงพยาบาล <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={hospitalType} onChange={e => setHospitalType(e.target.value)}
                  style={{ ...inp, cursor: 'pointer' }} onFocus={focus} onBlur={blur} required>
                  <option value="">-- เลือกประเภท --</option>
                  {HOSPITAL_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>แผนก <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={department}
                  onChange={e => { setDepartment(e.target.value); if (e.target.value !== 'อื่นๆ') setDepartmentOther('') }}
                  style={{ ...inp, cursor: 'pointer' }} onFocus={focus} onBlur={blur} required>
                  <option value="">-- เลือกแผนก --</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {department === 'อื่นๆ' && (
              <div className="mt-3">
                <label style={lbl}>ระบุแผนก <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" value={departmentOther}
                  onChange={e => setDepartmentOther(e.target.value)}
                  placeholder="กรุณาระบุชื่อแผนกของคุณ"
                  style={inp} onFocus={focus} onBlur={blur} required />
              </div>
            )}
          </section>

          {/* Error */}
          {error && (
            <div className="text-sm p-3 rounded-xl flex items-center gap-2"
              style={{ background: '#fef2f2', color: '#dc2626' }}>
              <i className="fa-solid fa-circle-exclamation" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            className="w-full p-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2"
            style={{ background: loading ? '#99f6e4' : '#0f766e' }}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin" />กำลังส่งคำขอ...</>
              : <><i className="fa-solid fa-paper-plane" />ส่งคำขอสมัครสมาชิก</>}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t text-center" style={{ borderColor: '#f3f4f6' }}>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            หากท่านเป็นสมาชิกอยู่แล้ว{' '}
            <a href="/login" className="font-semibold" style={{ color: '#0f766e' }}>
              กรุณาเข้าสู่ระบบ
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}
