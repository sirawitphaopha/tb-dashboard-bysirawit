'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import PasswordEye from '@/components/PasswordEye'

const PROFESSIONS: Record<string, { label: string; prefix: string }> = {
  doctor:      { label: 'แพทย์',                  prefix: 'ว.' },
  dentist:     { label: 'ทันตแพทย์',              prefix: 'ท.' },
  pharmacist:  { label: 'เภสัชกร',                prefix: 'ภ.' },
  nurse:       { label: 'พยาบาลวิชาชีพ',          prefix: 'ป.' },
  medtech:     { label: 'นักเทคนิคการแพทย์',      prefix: '' },
  physio:      { label: 'นักกายภาพบำบัด',         prefix: '' },
  radio:       { label: 'นักรังสีการแพทย์',       prefix: '' },
  publichealth:{ label: 'เจ้าหน้าที่สาธารณสุข',   prefix: '' },
  officer:     { label: 'เจ้าพนักงาน',            prefix: '' },
  other:       { label: 'อื่นๆ',                   prefix: '' },
}

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

function formatPhone(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
}

// ─────────────────────────────────────────────────────
// Validate เบอร์โทร (เข้มสุด: มือถือ 06/08/09 + เบอร์บ้าน 02)
// + บล็อกเลขซ้ำทั้งหมด / เลขเรียงต่อกัน
// คืนค่า { ok, msg } — ok=true ผ่าน, false=ไม่ผ่าน พร้อมเหตุผลเฉพาะ
// ─────────────────────────────────────────────────────
function validatePhone(phone: string): { ok: boolean; msg: string } {
  const d = phone.replace(/\D/g, '')
  if (d.length === 0) return { ok: true, msg: '' }  // optional — ปล่อยว่างได้
  if (d.length !== 10) return { ok: false, msg: 'เบอร์โทรต้องมี 10 หลัก (เช่น 081-234-5678)' }

  // ต้องขึ้นต้นด้วย 02 (เบอร์บ้าน กทม.) หรือ 06/08/09 (มือถือ)
  const prefix2 = d.slice(0, 2)
  const validPrefixes = ['02', '06', '08', '09']
  if (!validPrefixes.includes(prefix2)) {
    // แยก error เฉพาะเคส — บอกผู้ใช้ให้เข้าใจว่าทำไมถูกปฏิเสธ
    const provincialLandline: Record<string, string> = {
      '03': 'ภาคกลาง/ตะวันออก',
      '04': 'ภาคอีสาน',
      '05': 'ภาคเหนือ',
      '07': 'ภาคใต้',
    }
    if (provincialLandline[prefix2]) {
      return {
        ok: false,
        msg: `เบอร์ ${prefix2} เป็นเบอร์บ้านต่างจังหวัด (${provincialLandline[prefix2]}) — ระบบไม่รองรับ กรุณาใช้เบอร์มือถือ (06/08/09) หรือเบอร์บ้านกรุงเทพ (02)`,
      }
    }
    if (prefix2 === '00' || prefix2.startsWith('1')) {
      return { ok: false, msg: 'เบอร์ที่กรอกไม่ถูกต้อง กรุณากรอกเบอร์มือถือ (06/08/09) หรือเบอร์บ้าน กทม. (02)' }
    }
    if (prefix2 === '01') {
      return { ok: false, msg: 'รหัส 01 เป็นเบอร์บริการพิเศษ (ไม่ใช่เบอร์ส่วนตัว) — กรุณาใช้เบอร์มือถือ (06/08/09)' }
    }
    return { ok: false, msg: 'เบอร์ต้องขึ้นต้นด้วย 02 (กทม.), 06, 08 หรือ 09 (มือถือ)' }
  }

  // บล็อกเลขซ้ำกันทั้งหมด — เช่น 0000000000, 0888888888
  if (/^(\d)\1{9}$/.test(d)) {
    return { ok: false, msg: 'เบอร์ที่กรอกเป็นเลขซ้ำกันทั้งหมด กรุณากรอกเบอร์จริง' }
  }

  // บล็อก 8 หลักหลังเป็นเลขซ้ำ — เช่น 0811111111, 0900000000, 0288888888
  const last8 = d.slice(2)
  if (/^(\d)\1{7}$/.test(last8)) {
    return { ok: false, msg: 'เบอร์ที่กรอกมีรูปแบบผิดปกติ กรุณากรอกเบอร์จริง' }
  }

  // บล็อกเลขเรียงต่อกัน (ขึ้น/ลง) ทั้ง 10 หลัก — เช่น 0123456789, 0987654321
  const isAscending = (s: string) => {
    for (let i = 1; i < s.length; i++) {
      if (parseInt(s[i]) !== (parseInt(s[i - 1]) + 1) % 10) return false
    }
    return true
  }
  const isDescending = (s: string) => {
    for (let i = 1; i < s.length; i++) {
      if (parseInt(s[i]) !== (parseInt(s[i - 1]) - 1 + 10) % 10) return false
    }
    return true
  }
  if (isAscending(d) || isDescending(d) || isAscending(last8) || isDescending(last8)) {
    return { ok: false, msg: 'เบอร์ที่กรอกเป็นเลขเรียงต่อกัน กรุณากรอกเบอร์จริง' }
  }

  return { ok: true, msg: '' }
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!passwordOk)           { setError('รหัสผ่านยังไม่ผ่านเกณฑ์ความปลอดภัย (ต้องผ่านอย่างน้อย 4/5 ข้อ และมีความยาว 8 ตัวอักษรขึ้นไป)'); return }
    if (password !== confirm)  { setError('รหัสผ่านไม่ตรงกัน'); return }
    if (!profession || !hospitalType || !department) { setError('กรุณากรอกข้อมูลให้ครบทุกช่อง'); return }
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
          profession, licenseNumber: licenseNum, phone,
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
          <i className="fa-solid fa-lungs-virus text-5xl" style={{ color: '#0f766e' }}></i>
          <h1 className="text-2xl font-bold mt-2" style={{ color: '#134e4a' }}>Register</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>TB CARE & JOURNEY · รพ.ปรางค์กู่</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">

          {/* ── ACCOUNT ── */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>
              Account
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 2fr' }}>
              <div>
                <label style={lbl}>Username</label>
                <input type="text" name="username" autoComplete="username"
                  value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                  onKeyDown={e => { if (e.key === ' ') e.preventDefault() }}
                  placeholder="username" style={inp} onFocus={focus} onBlur={blur} required />
              </div>
              <div>
                <label style={lbl}>Email</label>
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
              <label style={lbl}>Password</label>
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
              <label style={lbl}>Confirm Password</label>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={lbl}>First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="ชื่อ" style={inp} onFocus={focus} onBlur={blur} required />
              </div>
              <div>
                <label style={lbl}>Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="นามสกุล" style={inp} onFocus={focus} onBlur={blur} required />
              </div>
            </div>

            <div className="mt-3">
              <label style={lbl}>Profession</label>
              <select value={profession}
                onChange={e => { setProfession(e.target.value); setLicenseNum('') }}
                style={{ ...inp, cursor: 'pointer' }} onFocus={focus} onBlur={blur} required>
                <option value="">-- เลือกวิชาชีพ --</option>
                {Object.entries(PROFESSIONS).map(([k, { label }]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>

            {profession && (
              <div className="mt-3">
                <label style={lbl}>
                  License Number
                  {prefix && (
                    <span className="ml-1.5 font-normal text-xs" style={{ color: '#0d9488' }}>
                      (prefix: {prefix})
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  {prefix && (
                    <span className="text-sm font-bold shrink-0 px-3 py-2.5 rounded-xl"
                      style={{ background: '#f0fdf4', color: '#0d9488', border: '1px solid #d1fae5' }}>
                      {prefix}
                    </span>
                  )}
                  <input
                    type="text"
                    value={licenseNum}
                    onChange={e => setLicenseNum(e.target.value.replace(/\D/g, ''))}
                    placeholder={prefix ? '00000' : 'กรอกเลขใบประกอบ (ถ้ามี)'}
                    style={inp}
                    onFocus={focus} onBlur={blur}
                  />
                </div>
              </div>
            )}

            <div className="mt-3">
              <label style={lbl}>Phone Number</label>
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
              <label style={lbl}>Hospital Name</label>
              <input type="text" value={hospitalName} onChange={e => setHospitalName(e.target.value)}
                placeholder="ชื่อโรงพยาบาล / สถานพยาบาล"
                style={inp} onFocus={focus} onBlur={blur} required />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label style={lbl}>Hospital Type</label>
                <select value={hospitalType} onChange={e => setHospitalType(e.target.value)}
                  style={{ ...inp, cursor: 'pointer' }} onFocus={focus} onBlur={blur} required>
                  <option value="">-- เลือกประเภท --</option>
                  {HOSPITAL_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Department</label>
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
                <label style={lbl}>ระบุแผนก</label>
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
