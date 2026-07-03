'use client'
/**
 * parts/account/change-password.jsx — เปลี่ยนรหัสผ่าน (แยกรอบ 2)
 * PwEye, checkPasswordStrength, getPasswordStrength, ChangePasswordPanel
 */
import * as React from 'react'
const { useState } = React
import { relTime } from '../shared'

function PwEye({ show, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:disabled?'not-allowed':'pointer',color:'#0d9488',padding:'4px',lineHeight:0,display:'flex',alignItems:'center'}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12 C7 18 17 18 22 12" />
        <path d="M2 12 C7 6 17 6 22 12" style={{transformBox:'fill-box',transformOrigin:'50% 100%',transform: show ? 'scaleY(1)':'scaleY(0)',transition:'transform 0.12s ease'}} />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" style={{transformBox:'fill-box',transformOrigin:'50% 50%',transform: show ? 'scale(1)':'scale(0)',transition:'transform 0.12s ease'}} />
      </svg>
    </button>
  );
}

// ── ฟอร์มเปลี่ยนรหัสผ่าน (แสดงในฝั่งขวาของ UserProfileModal) ───────────────────
// โลจิก + กฎความแข็งแรงรหัส เหมือนหน้าสมัคร (app/register/page.tsx) เป๊ะ
function checkPasswordStrength(pw) {
  return {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  };
}
function getPasswordStrength(checks) {
  const passed = Object.values(checks).filter(Boolean).length;
  if (passed <= 2)  return { label: 'อ่อนแอ',    color: '#ef4444', width: '20%' };
  if (passed <= 3)  return { label: 'พอใช้',     color: '#f59e0b', width: '50%' };
  if (passed === 4) return { label: 'ดี',         color: '#3b82f6', width: '75%' };
  return              { label: 'แข็งแกร่ง',   color: '#22c55e', width: '100%' };
}

function ChangePasswordPanel({ email, onBack }) {
  const [oldPw, setOldPw]             = React.useState('');
  const [newPw, setNewPw]             = React.useState('');
  const [confirmPw, setConfirmPw]     = React.useState('');
  const [showOld, setShowOld]         = React.useState(false);
  const [showNew, setShowNew]         = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading]         = React.useState(false);
  const [error, setError]             = React.useState('');
  const [success, setSuccess]         = React.useState(false);

  const checks      = checkPasswordStrength(newPw);
  const strength    = getPasswordStrength(checks);
  const passedCount = Object.values(checks).filter(Boolean).length;
  const passwordOk  = passedCount >= 4 && checks.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!oldPw || !newPw || !confirmPw) { setError('กรุณากรอกข้อมูลให้ครบทุกช่อง'); return; }
    if (!passwordOk)                    { setError('รหัสผ่านยังไม่ผ่านเกณฑ์ความปลอดภัย (ต้องผ่านอย่างน้อย 4/5 ข้อ และมีความยาว 8 ตัวอักษรขึ้นไป)'); return; }
    if (newPw !== confirmPw)            { setError('รหัสผ่านไม่ตรงกัน'); return; }
    if (newPw === oldPw)                { setError('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม'); return; }

    setLoading(true);

    // ส่งคำขอเปลี่ยนรหัสผ่านไป API กลาง (ตรวจ rate limit + verify + update + log + ส่งเมล)
    try {
      const { data: { session } } = await window._sb.auth.getSession();
      if (!session?.access_token) {
        setError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        setLoading(false);
        return;
      }

      // เปลี่ยนสำเร็จ → refresh session ใน browser ด้วยรหัสใหม่ (เพราะ admin updateUser revoke session เก่า)
      await window._sb.auth.signInWithPassword({ email, password: newPw }).catch(() => {});
    } catch (e) {
      setError('เกิดข้อผิดพลาด: ' + (e.message || 'unknown'));
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
  };

  const inputStyle = {
    width:'100%', padding:'12px 44px 12px 14px', border:'1px solid #e5e7eb', borderRadius:'12px',
    background:'#f9fafb', fontSize:'14px', outline:'none', boxSizing:'border-box',
  };
  const onFocus = (e) => { e.target.style.border = '1.5px solid #0d9488'; e.target.style.background = '#fff'; };
  const onBlur  = (e) => { e.target.style.border = '1px solid #e5e7eb';   e.target.style.background = '#f9fafb'; };

  return (
    <div>
      {/* Header: ปุ่มกลับ + ไอคอน + หัวข้อ */}
      <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'4px 0 14px',borderBottom:'1px solid #e5e7eb',marginBottom:'18px'}}>
        <button onClick={onBack} disabled={loading||success} title="กลับไปดูข้อมูลโปรไฟล์"
          style={{background:'#f3f4f6',border:'none',color:'#4b5563',cursor:loading||success?'not-allowed':'pointer',fontSize:'12px',fontWeight:600,padding:'7px 12px',borderRadius:'8px',display:'flex',alignItems:'center',gap:'6px',transition:'background 0.15s, color 0.15s'}}
          onMouseEnter={e=>{if(!loading&&!success){e.currentTarget.style.background='#ccfbf1';e.currentTarget.style.color='#0d9488';}}}
          onMouseLeave={e=>{if(!loading&&!success){e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.color='#4b5563';}}}>
          <i className="fa-solid fa-arrow-left"></i>กลับ
        </button>
        <i className="fa-solid fa-key" style={{color:'#0d9488',fontSize:'13px',marginLeft:'4px'}}></i>
        <p style={{fontSize:'13px',fontWeight:700,color:'#0d9488',margin:0,textTransform:'uppercase',letterSpacing:'0.5px'}}>เปลี่ยนรหัสผ่าน</p>
      </div>

      <p style={{fontSize:'12px',color:'#9ca3af',margin:'0 0 18px 0'}}>กรุณายืนยันรหัสผ่านเดิมก่อนตั้งรหัสผ่านใหม่</p>

        {success ? (
          <div style={{textAlign:'center',padding:'24px 0'}}>
            <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'#d1fae5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
              <i className="fa-solid fa-check" style={{fontSize:'22px',color:'#059669'}}></i>
            </div>
            <p style={{fontSize:'15px',fontWeight:700,color:'#065f46',margin:0}}>เปลี่ยนรหัสผ่านสำเร็จ</p>

            <div style={{background:'#f0fdfa',border:'1px solid #99f6e4',borderRadius:'10px',padding:'14px 16px',margin:'16px auto 0',maxWidth:'420px',textAlign:'center',wordBreak:'break-word'}}>
              <p style={{fontSize:'12px',color:'#0f766e',margin:'0 0 6px 0',fontWeight:700}}>
                <i className="fa-solid fa-envelope" style={{marginRight:'6px'}}></i>อีเมลแจ้งเตือน
              </p>
              <p style={{fontSize:'12px',color:'#134e4a',margin:0,lineHeight:1.6}}>
                ระบบได้ส่งอีเมลแจ้งเตือนการเปลี่ยนรหัสผ่านไปยังอีเมลของท่านแล้ว<br/>เพื่อความปลอดภัยของบัญชี
              </p>
            </div>

            <button onClick={onBack}
              style={{marginTop:'18px',padding:'12px 28px',borderRadius:'12px',background:'#0d9488',color:'#fff',fontWeight:700,fontSize:'14px',border:'none',cursor:'pointer',boxShadow:'0 4px 14px rgba(13,148,136,0.4)',transition:'background 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#0f766e'}
              onMouseLeave={e=>e.currentTarget.style.background='#0d9488'}>
              <i className="fa-solid fa-arrow-left" style={{marginRight:'6px'}}></i>กลับไปหน้าโปรไฟล์
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{textAlign:'left'}}>
            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'13px',fontWeight:600,color:'#4b5563',display:'block',marginBottom:'6px'}}>รหัสผ่านเดิม</label>
              <div style={{position:'relative'}}>
                <input type={showOld?'text':'password'} value={oldPw} onChange={e=>setOldPw(e.target.value)} placeholder="กรอกรหัสผ่านเดิม"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} required disabled={loading}/>
                <PwEye show={showOld} onClick={()=>setShowOld(v=>!v)} disabled={loading}/>
              </div>
            </div>

            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'13px',fontWeight:600,color:'#4b5563',display:'block',marginBottom:'6px'}}>รหัสผ่านใหม่</label>
              <div style={{position:'relative'}}>
                <input type={showNew?'text':'password'} value={newPw}
                  onChange={e=>setNewPw(e.target.value.replace(/\s/g,''))}
                  onKeyDown={e=>{if(e.key===' ') e.preventDefault();}}
                  name="new-password" autoComplete="new-password"
                  placeholder="กรอกรหัสผ่านใหม่"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} required disabled={loading}/>
                <PwEye show={showNew} onClick={()=>setShowNew(v=>!v)} disabled={loading}/>
              </div>

              {newPw && (
                <div style={{marginTop:'10px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                    <span style={{fontSize:'11px',color:'#6b7280'}}>ความแข็งแกร่ง</span>
                    <span style={{fontSize:'11px',fontWeight:700,color:strength.color}}>{strength.label}</span>
                  </div>
                  <div style={{width:'100%',height:'6px',borderRadius:'999px',background:'#f3f4f6',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:'999px',width:strength.width,background:strength.color,transition:'width 0.3s, background 0.3s'}}/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px 8px',marginTop:'8px'}}>
                    {[
                      { key:'length',  label:'อย่างน้อย 8 ตัวอักษร' },
                      { key:'upper',   label:'ตัวพิมพ์ใหญ่ (A-Z)' },
                      { key:'lower',   label:'ตัวพิมพ์เล็ก (a-z)' },
                      { key:'number',  label:'ตัวเลข (0-9)' },
                      { key:'special', label:'อักขระพิเศษ (!@#$...)' },
                    ].map(({key,label}) => (
                      <div key={key} style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <i className={`fa-solid ${checks[key]?'fa-circle-check':'fa-circle-xmark'}`}
                          style={{fontSize:'11px',color:checks[key]?'#22c55e':'#d1d5db'}}/>
                        <span style={{fontSize:'11px',color:checks[key]?'#374151':'#9ca3af'}}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{marginBottom:'8px'}}>
              <label style={{fontSize:'13px',fontWeight:600,color:'#4b5563',display:'block',marginBottom:'6px'}}>ยืนยันรหัสผ่านใหม่</label>
              <div style={{position:'relative'}}>
                <input type={showConfirm?'text':'password'} value={confirmPw}
                  onChange={e=>setConfirmPw(e.target.value.replace(/\s/g,''))}
                  onKeyDown={e=>{if(e.key===' ') e.preventDefault();}}
                  name="confirm-password" autoComplete="new-password"
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  style={{...inputStyle, border: confirmPw && confirmPw !== newPw ? '1px solid #ef4444' : '1px solid #e5e7eb'}}
                  onFocus={e=>{e.target.style.border=`1.5px solid ${confirmPw && confirmPw !== newPw ? '#ef4444' : '#0d9488'}`;e.target.style.background='#fff';}}
                  onBlur={e=>{e.target.style.border=`1px solid ${confirmPw && confirmPw !== newPw ? '#ef4444' : '#e5e7eb'}`;e.target.style.background='#f9fafb';}}
                  required disabled={loading}/>
                <PwEye show={showConfirm} onClick={()=>setShowConfirm(v=>!v)} disabled={loading}/>
              </div>
              {confirmPw && confirmPw !== newPw && (
                <p style={{fontSize:'11px',color:'#ef4444',margin:'4px 0 0'}}>รหัสผ่านไม่ตรงกัน</p>
              )}
            </div>

            {error && (
              <div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'10px',background:'#fef2f2',color:'#dc2626',display:'flex',alignItems:'center',gap:'8px',marginTop:'10px',marginBottom:'4px'}}>
                <i className="fa-solid fa-circle-exclamation"></i>{error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{width:'100%',padding:'14px',borderRadius:'12px',background:loading?'#5eead4':'#0d9488',color:'#fff',fontWeight:700,fontSize:'15px',border:'none',cursor:loading?'not-allowed':'pointer',marginTop:'14px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',boxShadow:'0 4px 14px rgba(13,148,136,0.4)',transition:'background 0.2s'}}
              onMouseEnter={e=>{if(!loading) e.currentTarget.style.background='#0f766e';}}
              onMouseLeave={e=>{if(!loading) e.currentTarget.style.background='#0d9488';}}>
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลังเปลี่ยนรหัสผ่าน...</>
                : <><i className="fa-solid fa-key"></i> เปลี่ยนรหัสผ่าน</>}
            </button>
          </form>
        )}
    </div>
  );
}

// ── ฟอร์ม "อุปกรณ์ที่เข้าใช้งาน" (B3) ───────────────────────────────────────
// helper: relative time ภาษาไทย
// relTime ย้ายไป parts/shared.jsx (เฟส 1d)
// FontAwesome 6.0.0 — ใช้ชื่อ icon ที่มีในเวอร์ชันนี้
// (fa-mobile-screen / fa-tablet-screen-button เพิ่งเพิ่มใน 6.1.0 → ใช้ไม่ได้)

export { ChangePasswordPanel }
