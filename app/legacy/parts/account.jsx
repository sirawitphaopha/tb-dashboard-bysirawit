'use client'
/**
 * parts/account.jsx — domain: บัญชีผู้ใช้ / โปรไฟล์ตัวเอง (account)
 * ย้ายจาก tb-monolith.jsx (เฟส 6) — โค้ดเดิม ไม่แก้ logic
 *   data     : DEPARTMENTS, HOSPITAL_TYPES (ตัวเลือกฟอร์มโปรไฟล์)
 *   helpers  : PwEye, checkPasswordStrength, getPasswordStrength (รหัสผ่าน) ·
 *              deviceIcon, endReasonLabel, StatusLegend, SessionPagination (เซสชัน) ·
 *              cropToWebp, resizeToWebp (ครอบ/ย่อ avatar — ใช้ loadImageEl จาก shared)
 *   modals   : RequestEditModal (ขอแก้ข้อมูลโปรไฟล์), AvatarCropModal, AvatarDeleteConfirm
 *   panels   : ChangePasswordPanel, SessionsPanel
 *   main     : UserProfileModal (โมดัลโปรไฟล์หลัก — export ให้ shell/App)
 * deps ภายนอก: shared (useModalAnim, FilterSelect, ScrollNav, relTime, r2AvatarUrl, normName,
 *   nameInitials, AVATAR_PALETTE, colorFromName, AvatarCircle, loadImageEl, AvatarLightbox) ·
 *   globals (PROFESSIONS) · Cropper (react-easy-crop) · createPortal · window.* (tbFormatPhone ฯลฯ)
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import Cropper from 'react-easy-crop'
import { useModalAnim, FilterSelect, ScrollNav, relTime, r2AvatarUrl, normName, nameInitials,
         AVATAR_PALETTE, colorFromName, AvatarCircle, loadImageEl, AvatarLightbox } from './shared'
import { PROFESSIONS } from './globals'
const { useState, useEffect, useRef, useCallback } = React

// ═══════════════ ตัวเลือกฟอร์มโปรไฟล์ (DEPARTMENTS / HOSPITAL_TYPES) ═══════════════
const DEPARTMENTS = ['กลุ่มงานเภสัชกรรม','กลุ่มงานการพยาบาล','กลุ่มงานแพทย์','อื่นๆ'];

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
];


// ═══════════════ RequestEditModal — ขอแก้ข้อมูลโปรไฟล์ ═══════════════
function RequestEditModal({ field, currentValue, onClose }) {
  const [newValue, setNewValue] = React.useState('');
  const [reason,   setReason]   = React.useState('');
  const [busy,     setBusy]     = React.useState(false);
  const [sent,     setSent]     = React.useState(false);
  const {close, modalCls, overlayCls} = useModalAnim(onClose);

  const submit = async () => {
    if (!newValue.trim()) { alert('กรุณากรอกค่าใหม่'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/profile/request-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_name:  field.key,
          field_label: field.label,
          old_value:   currentValue || '',
          new_value:   newValue.trim(),
          reason:      reason.trim() || '',
        }),
      });
      if (res.ok) {
        setSent(true);
        // ไม่ปิดอัตโนมัติ — ให้ผู้ใช้กดปุ่มปิดเอง
      } else {
        const e = await res.json();
        alert('เกิดข้อผิดพลาด: ' + (e.error || 'ไม่ทราบสาเหตุ'));
      }
    } catch {
      alert('ไม่สามารถส่งคำขอได้ กรุณาลองใหม่');
    }
    setBusy(false);
  };

  // เลือก input ตามประเภท field
  const renderInput = () => {
    if (field.options) {
      return (
        <select value={newValue} onChange={e=>setNewValue(e.target.value)}
          style={{width:'100%',padding:'10px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',background:'#f9fafb',fontSize:'14px',outline:'none',cursor:'pointer'}}>
          <option value="">-- เลือกใหม่ --</option>
          {field.options.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input type="text" value={newValue} onChange={e=>setNewValue(e.target.value)}
        placeholder="กรอกค่าใหม่"
        style={{width:'100%',padding:'10px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',background:'#f9fafb',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/>
    );
  };

  return (
    <div className={overlayCls} style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(3px)',zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}
      onClick={e=>{if(e.target===e.currentTarget)close();}}>
      <div className={modalCls} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'420px',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',overflow:'hidden'}}>

        <div style={{background:'linear-gradient(135deg,#f59e0b,#fbbf24)',padding:'18px 20px',color:'#fff',display:'flex',alignItems:'center',gap:'10px'}}>
          <i className="fa-solid fa-shield" style={{fontSize:'20px'}}></i>
          <div style={{flex:1}}>
            <p style={{fontSize:'11px',margin:0,opacity:0.9}}>ส่งคำขอแก้ไขข้อมูล</p>
            <p style={{fontSize:'15px',fontWeight:700,margin:'2px 0 0'}}>{field.label}</p>
          </div>
          <button onClick={close} style={{width:'28px',height:'28px',borderRadius:'8px',border:'none',background:'rgba(255,255,255,0.25)',color:'#fff',cursor:'pointer'}}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style={{padding:'18px 20px'}}>
          <p style={{fontSize:'11px',color:'#9ca3af',margin:'0 0 4px',fontWeight:600}}>ค่าปัจจุบัน</p>
          <div style={{padding:'10px 12px',background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'14px',color:'#6b7280',marginBottom:'14px'}}>
            {currentValue || '—'}
          </div>

          <p style={{fontSize:'11px',color:'#9ca3af',margin:'0 0 4px',fontWeight:600}}>ค่าใหม่ที่ต้องการ</p>
          {renderInput()}
          {field.hint && (
            <p style={{fontSize:'11px',color:'#0d9488',margin:'6px 0 0',display:'flex',alignItems:'flex-start',gap:'5px'}}>
              <i className="fa-solid fa-circle-info" style={{marginTop:'2px'}}></i>
              <span>{field.hint}</span>
            </p>
          )}

          <p style={{fontSize:'11px',color:'#9ca3af',margin:'14px 0 4px',fontWeight:600}}>เหตุผล <span style={{fontWeight:400}}>(ไม่บังคับ)</span></p>
          <textarea value={reason} onChange={e=>setReason(e.target.value)}
            placeholder="ระบุเหตุผลที่ต้องการแก้ไข เช่น พิมพ์ผิด, เปลี่ยนตำแหน่งงาน ฯลฯ"
            rows={3}
            style={{width:'100%',padding:'10px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',background:'#f9fafb',fontSize:'13px',outline:'none',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit'}}/>

          {sent ? (
            <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'14px 12px',marginTop:'14px',textAlign:'center'}}>
              <i className="fa-solid fa-circle-check" style={{color:'#16a34a',fontSize:'22px',marginBottom:'6px',display:'block'}}></i>
              <p style={{fontSize:'13px',color:'#15803d',fontWeight:700,margin:0}}>ส่งคำขอเรียบร้อยแล้ว</p>
              <p style={{fontSize:'11px',color:'#166534',margin:'4px 0 0'}}>ระบบส่งอีเมลยืนยันให้ท่านแล้ว และแจ้งผู้ดูแลระบบเพื่อพิจารณา</p>
            </div>
          ) : (
            <div style={{background:'#fef3c7',border:'1px solid #fde68a',borderRadius:'10px',padding:'10px 12px',marginTop:'14px',display:'flex',gap:'8px',alignItems:'flex-start'}}>
              <i className="fa-solid fa-circle-info" style={{color:'#d97706',fontSize:'13px',marginTop:'2px'}}></i>
              <p style={{fontSize:'11px',color:'#92400e',margin:0,lineHeight:1.5}}>
                เมื่อส่งคำขอแล้ว ผู้ดูแลระบบจะได้รับแจ้งทันที และดำเนินการให้
              </p>
            </div>
          )}
        </div>

        <div style={{padding:'12px 20px 18px',display:'flex',gap:'8px',borderTop:'1px solid #f1f5f9'}}>
          <button onClick={close} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#374151',fontWeight:600,fontSize:'13px',cursor:'pointer'}}>
            {sent ? 'ปิด' : 'ยกเลิก'}
          </button>
          {!sent && (
            <button onClick={submit} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',background: busy ? '#fcd34d' : '#f59e0b',color:'#fff',fontWeight:700,fontSize:'13px',cursor: busy ? 'not-allowed' : 'pointer'}}>
              {busy
                ? <><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'6px'}}></i>กำลังส่ง...</>
                : <><i className="fa-solid fa-paper-plane" style={{marginRight:'6px'}}></i>ส่งคำขอ</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════ password / sessions / avatar / UserProfileModal ═══════════════
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
function deviceIcon(type) {
  if (type === 'mobile') return 'fa-mobile';   // มือถือ
  if (type === 'tablet') return 'fa-tablet';   // แท็บเล็ต / iPad
  return 'fa-desktop';                          // คอมพิวเตอร์
}
function endReasonLabel(reason) {
  switch (reason) {
    case 'manual':           return { label: 'ออกจากระบบเอง',     color: '#0d9488', bg: '#f0fdfa' };
    case 'session_expired':  return { label: 'หมดอายุการใช้งาน',  color: '#9ca3af', bg: '#f3f4f6' };
    case 'forced_by_user':   return { label: 'ถูกบังคับออก',       color: '#d97706', bg: '#fffbeb' };
    case 'forced_by_admin':  return { label: 'ผู้ดูแลระบบบังคับออก', color: '#dc2626', bg: '#fef2f2' };
    default:                 return { label: 'ยังใช้งานอยู่',       color: '#22c55e', bg: '#dcfce7' };
  }
}
// ป้ายสีแถวเดียว (legend) — อธิบายความหมายของแต่ละสถานะ
function StatusLegend() {
  const items = [
    { color: '#22c55e', label: 'ยังใช้งานอยู่' },
    { color: '#0d9488', label: 'ออกจากระบบเอง' },
    { color: '#9ca3af', label: 'หมดอายุการใช้งาน' },
    { color: '#d97706', label: 'ถูกบังคับออก' },
    { color: '#dc2626', label: 'ผู้ดูแลระบบบังคับออก' },
  ];
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:'6px 14px',padding:'10px 14px',background:'#f9fafb',borderRadius:'10px',border:'1px solid #f3f4f6'}}>
      {items.map(it => (
        <div key={it.label} style={{display:'flex',alignItems:'center',gap:'5px'}}>
          <span style={{width:'9px',height:'9px',borderRadius:'50%',background:it.color,flexShrink:0}}></span>
          <span style={{fontSize:'11px',color:'#6b7280',whiteSpace:'nowrap'}}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// v0.7.17.3 Phase 4B — ปุ่มลอยขวาล่าง (เลื่อนขึ้น/ลงรวดเดียว) ใช้กับ container ที่ scroll ได้
//   props: getContainer? () => HTMLElement   ถ้าไม่ส่งจะใช้ window
//          zIndex? number                    default 30 (ต่ำกว่า modals ที่ 50)
//   - แสดงเฉพาะเมื่อเลื่อนลงได้/ขึ้นได้ (ซ่อนเองอัตโนมัติ)
//   - ใช้ React Portal → render ที่ document.body
//     (สำคัญ: ป้องกัน position:fixed ผิดที่ เมื่ออยู่ใน modal-A ที่มี transform)
//   - คำนวณตำแหน่งจาก bounding rect ของ container → เกาะมุมล่างขวาของ "กรอบ"
// ScrollNav ย้ายไป parts/shared.jsx (เฟส 1c)

// v0.7.17.3 Phase 4B — Pagination component สำหรับ Session History (เลขหน้า 1 2 3 ... N)
function SessionPagination({ page, totalPages, total, pageSize, onChange }) {
  // สร้าง list ของหมายเลขหน้า + ellipsis
  // window 5 (รอบหน้าปัจจุบัน ±2) + first + last + ellipsis
  const pageWindow = () => {
    const cur = page + 1; // 1-indexed สำหรับแสดงผล
    const last = totalPages;
    const set = new Set([1, last, cur, cur-1, cur+1, cur-2, cur+2]);
    const arr = [...set].filter(n => n >= 1 && n <= last).sort((a,b)=>a-b);
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      out.push(arr[i]);
      if (i < arr.length - 1 && arr[i+1] - arr[i] > 1) out.push('…');
    }
    return out;
  };
  const items = pageWindow();
  const from  = page * pageSize + 1;
  const to    = Math.min(total, from + pageSize - 1);

  const btnBase = { minWidth:'30px',height:'30px',padding:'0 9px',borderRadius:'8px',border:'1px solid #e5e7eb',background:'#fff',color:'#374151',fontSize:'12px',fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s' };
  const btnActive = { borderColor:'#0d9488',background:'#0d9488',color:'#fff',boxShadow:'0 2px 6px rgba(13,148,136,0.3)' };
  const btnDisabled = { opacity:0.4,cursor:'not-allowed' };

  return (
    <div style={{marginTop:'18px',paddingTop:'14px',borderTop:'1px solid #f3f4f6'}}>
      <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:'5px',marginBottom:'8px'}}>
        <button onClick={()=>page>0 && onChange(page-1)} disabled={page===0}
          style={{...btnBase, ...(page===0?btnDisabled:{})}} title="หน้าก่อนหน้า">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        {items.map((it, idx) => (
          it === '…'
            ? <span key={`e${idx}`} style={{padding:'0 4px',color:'#9ca3af',fontSize:'12px'}}>…</span>
            : <button key={it} onClick={()=>onChange(it-1)}
                style={{...btnBase, ...(it === page+1 ? btnActive : {})}}>
                {it}
              </button>
        ))}
        <button onClick={()=>page<totalPages-1 && onChange(page+1)} disabled={page>=totalPages-1}
          style={{...btnBase, ...(page>=totalPages-1?btnDisabled:{})}} title="หน้าถัดไป">
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
      <div style={{textAlign:'center',fontSize:'11px',color:'#9ca3af'}}>
        แสดง {from}-{to} จาก {total} รายการ · หน้า {page+1} / {totalPages}
      </div>
    </div>
  );
}

function SessionsPanel({ onBack }) {
  const [sessions, setSessions]   = React.useState([]);
  const [currentId, setCurrentId] = React.useState(null);
  const [loading, setLoading]     = React.useState(true);
  const [error, setError]         = React.useState('');
  const [showHistory, setShowHistory] = React.useState(false);
  const [history, setHistory]     = React.useState([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [resultMsg, setResultMsg] = React.useState('');

  // v0.7.17.3 Phase 4B — history filter + pagination
  const [hPage, setHPage]               = React.useState(0)
  const [hPageSize]                     = React.useState(50)
  const [hTotal, setHTotal]             = React.useState(0)
  const [hHasMore, setHHasMore]         = React.useState(false)
  const [hfTime, setHfTime]             = React.useState('30d')  // today/7d/30d/all/custom
  const [hfDevice, setHfDevice]         = React.useState('')      // desktop/mobile/tablet/unknown
  const [hfStatus, setHfStatus]         = React.useState('')      // ''=all, active, manual, session_expired, forced_by_user, forced_by_admin
  const [hfDateFrom, setHfDateFrom]     = React.useState('')
  const [hfDateTo, setHfDateTo]         = React.useState('')
  const [hSearchInput, setHSearchInput] = React.useState('')
  const [hfSearch, setHfSearch]         = React.useState('')
  // refreshing = filter/page change (ไม่โชว์ skeleton); historyLoading = first mount เท่านั้น
  const [historyRefreshing, setHistoryRefreshing] = React.useState(false)
  const [historyEverLoaded, setHistoryEverLoaded] = React.useState(false)
  // ref ไปยัง root → ใช้หา parent scroll container สำหรับ ScrollNav
  const panelRootRef = React.useRef(null);
  const getScrollContainer = React.useCallback(() => {
    let el = panelRootRef.current && panelRootRef.current.parentElement;
    while (el) {
      const s = window.getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY)) return el;
      el = el.parentElement;
    }
    return null; // fallback → window
  }, []);

  const loadActive = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/sessions');
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'โหลดข้อมูลล้มเหลว'); setLoading(false); return; }
      setSessions(data.sessions || []);
      setCurrentId(data.current_session_id || null);
    } catch { setError('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
    setLoading(false);
  };
  // v0.7.17.3 Phase 4B — สร้าง params จาก filter state
  const buildHistoryParams = (p) => {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    sp.set('pageSize', String(hPageSize))
    // ช่วงเวลา
    const now = new Date()
    if (hfTime === 'today') {
      const d = new Date(now); d.setHours(0,0,0,0)
      sp.set('since', d.toISOString())
    } else if (hfTime === '7d') {
      sp.set('since', new Date(now.getTime() - 7 * 86400000).toISOString())
    } else if (hfTime === '30d') {
      sp.set('since', new Date(now.getTime() - 30 * 86400000).toISOString())
    } else if (hfTime === 'custom') {
      if (hfDateFrom) sp.set('since', new Date(hfDateFrom + 'T00:00:00').toISOString())
      if (hfDateTo)   sp.set('until', new Date(hfDateTo + 'T23:59:59.999').toISOString())
    }
    if (hfDevice) sp.set('device', hfDevice)
    if (hfStatus) sp.set('status', hfStatus)
    if (hfSearch) sp.set('q', hfSearch)
    return sp
  }

  const loadHistory = async (p = 0) => {
    // ตอนเปิดหน้าครั้งแรก → skeleton เต็ม; ครั้งถัดไป (filter / page) → spinner เบาๆ คงข้อมูลเก่าไว้
    if (!historyEverLoaded) setHistoryLoading(true);
    else                    setHistoryRefreshing(true);
    try {
      const res  = await fetch(`/api/auth/sessions/history?${buildHistoryParams(p).toString()}`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data.rows || data.sessions || []);
        setHTotal(typeof data.total === 'number' ? data.total : (data.rows?.length || 0));
        setHHasMore(!!data.hasMore);
        setHPage(p);
        setHistoryEverLoaded(true);
      }
    } catch {}
    setHistoryLoading(false);
    setHistoryRefreshing(false);
  };

  React.useEffect(() => { loadActive(); }, []);
  // debounce ช่องค้นหา 400ms
  React.useEffect(() => {
    const t = setTimeout(() => setHfSearch(hSearchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [hSearchInput])
  // โหลดใหม่ทุกครั้งที่เปลี่ยน filter (รวมตอนเปิดหน้าประวัติ)
  React.useEffect(() => {
    if (showHistory) loadHistory(0);
  }, [showHistory, hfTime, hfDevice, hfStatus, hfDateFrom, hfDateTo, hfSearch]);

  const hHasActiveFilter = !!(hfTime !== '30d' || hfDevice || hfStatus || hfSearch || hfDateFrom || hfDateTo);
  const hTotalPages = Math.max(1, Math.ceil(hTotal / hPageSize));

  // กดที่ chip ในแถว → ใส่ filter อัตโนมัติ
  const applyIpFilter     = (ip)     => { setHSearchInput(ip); setHfSearch(ip); }
  const applyDeviceFilter = (dtype)  => setHfDevice(dtype || 'unknown');
  const applyStatusFilter = (reason) => setHfStatus(reason || 'active');

  const otherCount = sessions.filter(s => !s.is_current).length;

  const doSignoutOthers = async () => {
    setConfirmOpen(false);
    setSigningOut(true); setResultMsg('');
    try {
      const res  = await fetch('/api/auth/signout-others', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setResultMsg(data.error || 'เกิดข้อผิดพลาด'); }
      else { setResultMsg(`ออกจากระบบสำเร็จ ${data.count} อุปกรณ์`); await loadActive(); }
    } catch { setResultMsg('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
    setSigningOut(false);
  };

  if (showHistory) {
    const selStyleH = { fontSize:'12px', padding:'7px 10px', borderRadius:'9px', border:'1px solid #e5e7eb', background:'#fff', color:'#374151', outline:'none', cursor:'pointer' };
    return (
      <div ref={panelRootRef}>
        <div style={{position:'sticky',top:'-20px',zIndex:5,background:'#fff',margin:'-20px -28px 14px',padding:'20px 28px 0',boxShadow:'0 4px 8px -6px rgba(0,0,0,0.15)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'4px 0 14px',borderBottom:'1px solid #e5e7eb',marginBottom:'14px'}}>
            <button onClick={()=>setShowHistory(false)} title="กลับไปดูอุปกรณ์ที่กำลังเข้าใช้งาน"
              style={{background:'#f3f4f6',border:'none',color:'#4b5563',cursor:'pointer',fontSize:'12px',fontWeight:600,padding:'7px 12px',borderRadius:'8px',display:'flex',alignItems:'center',gap:'6px',transition:'background 0.15s, color 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#ccfbf1';e.currentTarget.style.color='#0d9488';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.color='#4b5563';}}>
              <i className="fa-solid fa-arrow-left"></i>กลับ
            </button>
            <i className="fa-solid fa-clock-rotate-left" style={{color:'#0d9488',fontSize:'13px',marginLeft:'4px'}}></i>
            <p style={{fontSize:'13px',fontWeight:700,color:'#0d9488',margin:0,textTransform:'uppercase',letterSpacing:'0.5px',flex:1}}>ประวัติการเข้าใช้งานทั้งหมด</p>
            {!historyLoading && (
              <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'999px',background:'#ccfbf1',color:'#0f766e',whiteSpace:'nowrap'}}>
                {hTotal} รายการ
              </span>
            )}
          </div>

          {/* v0.7.17.3 Phase 4B — Filter panel */}
          <div style={{background:'linear-gradient(135deg,#f0fdfa 0%,#f8fafc 100%)',border:'1px solid #d1fae5',borderRadius:'12px',padding:'10px',marginBottom:'10px'}}>
            <div style={{display:'flex',flexWrap:'nowrap',gap:'7px',alignItems:'center'}}>
              <div style={{position:'relative',flex:'1 1 80px',minWidth:'80px'}}>
                <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#0d9488',fontSize:'11px'}}></i>
                <input value={hSearchInput} onChange={e=>setHSearchInput(e.target.value)}
                  placeholder="ค้นหา IP / อุปกรณ์"
                  style={{width:'100%',fontSize:'12px',padding:'8px 26px 8px 28px',borderRadius:'9px',border:'1px solid #e5e7eb',outline:'none',boxSizing:'border-box',background:'#fff'}}/>
                {hSearchInput && (
                  <i className="fa-solid fa-xmark" onClick={()=>setHSearchInput('')}
                    style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'11px',cursor:'pointer'}}></i>
                )}
              </div>
              <FilterSelect icon="fa-laptop" value={hfDevice} onChange={e=>setHfDevice(e.target.value)}>
                <option value="">ทุกอุปกรณ์</option>
                <option value="desktop">คอมพิวเตอร์</option>
                <option value="mobile">มือถือ</option>
                <option value="tablet">แท็บเล็ต</option>
                <option value="unknown">ไม่ทราบ</option>
              </FilterSelect>
              <FilterSelect icon="fa-calendar" value={hfTime} onChange={e=>setHfTime(e.target.value)}>
                <option value="all">ทุกช่วงเวลา</option>
                <option value="today">วันนี้</option>
                <option value="7d">7 วันล่าสุด</option>
                <option value="30d">30 วันล่าสุด</option>
                <option value="custom">กำหนดเอง</option>
              </FilterSelect>
              <FilterSelect icon="fa-flag" value={hfStatus} onChange={e=>setHfStatus(e.target.value)}>
                <option value="">ทุกสถานะ</option>
                <option value="active">ยังใช้งานอยู่</option>
                <option value="manual">ออกจากระบบเอง</option>
                <option value="session_expired">หมดอายุการใช้งาน</option>
                <option value="forced_by_user">ถูกบังคับออก</option>
                <option value="forced_by_admin">ผู้ดูแลระบบบังคับออก</option>
              </FilterSelect>
              {hHasActiveFilter && (
                <button onClick={()=>{ setHfTime('30d'); setHfDevice(''); setHfStatus(''); setHfDateFrom(''); setHfDateTo(''); setHSearchInput(''); setHfSearch(''); }}
                  title="กลับเป็นค่าตั้งต้น (30 วันล่าสุด)"
                  style={{fontSize:'12px',fontWeight:600,padding:'8px 11px',borderRadius:'9px',border:'1px solid #fcd34d',background:'#fffbeb',color:'#b45309',cursor:'pointer',whiteSpace:'nowrap'}}>
                  <i className="fa-solid fa-rotate-left" style={{marginRight:'5px'}}></i>ล้างค่า
                </button>
              )}
            </div>
            {hfTime === 'custom' && (
              <div style={{display:'flex',flexWrap:'wrap',gap:'7px',alignItems:'center',marginTop:'9px',paddingTop:'9px',borderTop:'1px dashed #99f6e4'}}>
                <span style={{fontSize:'12px',color:'#0f766e',fontWeight:600}}><i className="fa-solid fa-calendar-day" style={{marginRight:'5px'}}></i>จากวันที่</span>
                <input type="date" value={hfDateFrom} max={hfDateTo || undefined} onChange={e=>setHfDateFrom(e.target.value)} style={{...selStyleH,background:'#fff'}}/>
                <span style={{fontSize:'12px',color:'#0f766e',fontWeight:600}}>ถึงวันที่</span>
                <input type="date" value={hfDateTo} min={hfDateFrom || undefined} onChange={e=>setHfDateTo(e.target.value)} style={{...selStyleH,background:'#fff'}}/>
              </div>
            )}
          </div>

          <StatusLegend/>
        </div>

        {/* v0.7.17.3 — Container ขนาดคงที่ ป้องกัน filter panel หดตอน loading
             - first mount เท่านั้นที่ขึ้น skeleton
             - filter/page change คงข้อมูลเก่าไว้ + dim overlay เบาๆ */}
        <div style={{position:'relative',minHeight:'200px'}}>
          {historyLoading ? (
            <div style={{textAlign:'center',padding:'40px 0',color:'#9ca3af',fontSize:'13px'}}>
              <i className="fa-solid fa-spinner fa-spin" style={{marginRight:'8px'}}></i>กำลังโหลด...
            </div>
          ) : history.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px 0',color:'#9ca3af',fontSize:'13px'}}>
              {hHasActiveFilter ? 'ไม่พบรายการตามเงื่อนไขที่กรอง' : 'ไม่พบประวัติ'}
            </div>
          ) : (
            <>
              <div style={{display:'flex',flexDirection:'column',gap:'10px',opacity:historyRefreshing?0.55:1,transition:'opacity 0.15s',pointerEvents:historyRefreshing?'none':'auto'}}>
                {history.map(s => {
                  const reason = endReasonLabel(s.end_reason);
                  const statusKey = s.end_reason || 'active';
                  return (
                    <div key={s.id} style={{padding:'12px 14px',borderRadius:'10px',border:'1px solid #e5e7eb',background:'#fff'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
                        <i className={`fa-solid ${deviceIcon(s.device_type)}`} style={{color:'#0d9488',fontSize:'16px',width:'18px',textAlign:'center'}}></i>
                        <span onClick={()=>applyDeviceFilter(s.device_type)} title={`กรองเฉพาะ ${s.device_label || 'อุปกรณ์นี้'}`}
                          style={{fontSize:'13px',fontWeight:700,color:'#134e4a',margin:0,flex:1,cursor:'pointer'}}
                          onMouseEnter={e=>e.currentTarget.style.color='#0d9488'}
                          onMouseLeave={e=>e.currentTarget.style.color='#134e4a'}>
                          {s.device_label || 'ไม่ทราบอุปกรณ์'}
                        </span>
                        <span onClick={()=>applyStatusFilter(statusKey)} title="กรองตามสถานะนี้"
                          style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'10px',fontWeight:700,padding:'3px 9px',borderRadius:'999px',background:reason.bg,color:reason.color,whiteSpace:'nowrap',cursor:'pointer'}}>
                          <span style={{width:'7px',height:'7px',borderRadius:'50%',background:reason.color,flexShrink:0}}></span>{reason.label}
                        </span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 16px',fontSize:'11px',color:'#6b7280',marginLeft:'28px'}}>
                        <span>
                          <i className="fa-solid fa-globe" style={{marginRight:'5px'}}></i>
                          {s.ip_address
                            ? <span onClick={()=>applyIpFilter(s.ip_address)} title={`กรองเฉพาะ IP ${s.ip_address}`}
                                style={{cursor:'pointer',textDecoration:'underline dotted',textUnderlineOffset:'2px'}}
                                onMouseEnter={e=>e.currentTarget.style.color='#0d9488'}
                                onMouseLeave={e=>e.currentTarget.style.color='#6b7280'}>
                                {s.ip_address}
                              </span>
                            : '-'}
                        </span>
                        <span><i className="fa-solid fa-right-to-bracket" style={{marginRight:'5px'}}></i>เข้า {relTime(s.started_at)}</span>
                        {s.ended_at && <span><i className="fa-solid fa-right-from-bracket" style={{marginRight:'5px'}}></i>ออก {relTime(s.ended_at)}</span>}
                        {!s.ended_at && <span><i className="fa-solid fa-circle" style={{color:'#22c55e',marginRight:'5px',fontSize:'8px'}}></i>ใช้งานล่าสุด {relTime(s.last_active_at)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* v0.7.17.3 Phase 4B — Pagination */}
              {hTotalPages > 1 && (
                <SessionPagination
                  page={hPage}
                  totalPages={hTotalPages}
                  total={hTotal}
                  pageSize={hPageSize}
                  onChange={(p) => loadHistory(p)}
                />
              )}
            </>
          )}

          {/* Spinner overlay เบาๆ ตอน refresh (ไม่ใช่ skeleton เต็ม) */}
          {historyRefreshing && history.length > 0 && (
            <div style={{position:'absolute',top:'10px',right:'10px',display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'11px',fontWeight:600,padding:'5px 11px',borderRadius:'999px',background:'rgba(13,148,136,0.95)',color:'#fff',boxShadow:'0 2px 8px rgba(13,148,136,0.3)'}}>
              <i className="fa-solid fa-spinner fa-spin"></i>กำลังกรอง
            </div>
          )}
        </div>
        <ScrollNav getContainer={getScrollContainer} zIndex={9990} />
      </div>
    );
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'4px 0 14px',borderBottom:'1px solid #e5e7eb',marginBottom:'18px'}}>
        <button onClick={onBack} title="กลับไปดูข้อมูลโปรไฟล์"
          style={{background:'#f3f4f6',border:'none',color:'#4b5563',cursor:'pointer',fontSize:'12px',fontWeight:600,padding:'7px 12px',borderRadius:'8px',display:'flex',alignItems:'center',gap:'6px',transition:'background 0.15s, color 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='#ccfbf1';e.currentTarget.style.color='#0d9488';}}
          onMouseLeave={e=>{e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.color='#4b5563';}}>
          <i className="fa-solid fa-arrow-left"></i>กลับ
        </button>
        <i className="fa-solid fa-shield-halved" style={{color:'#0d9488',fontSize:'13px',marginLeft:'4px'}}></i>
        <p style={{fontSize:'13px',fontWeight:700,color:'#0d9488',margin:0,textTransform:'uppercase',letterSpacing:'0.5px'}}>อุปกรณ์ที่เข้าใช้งาน</p>
      </div>

      <p style={{fontSize:'12px',color:'#9ca3af',margin:'0 0 14px 0'}}>รายการอุปกรณ์/เครื่องที่บัญชีนี้กำลังเข้าใช้งานอยู่</p>

      {loading ? (
        <div style={{textAlign:'center',padding:'40px 0',color:'#9ca3af',fontSize:'13px'}}>
          <i className="fa-solid fa-spinner fa-spin" style={{marginRight:'8px'}}></i>กำลังโหลด...
        </div>
      ) : error ? (
        <div style={{padding:'14px',borderRadius:'10px',background:'#fef2f2',color:'#dc2626',fontSize:'13px'}}>
          <i className="fa-solid fa-circle-exclamation" style={{marginRight:'8px'}}></i>{error}
        </div>
      ) : (
        <>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {sessions.map(s => (
              <div key={s.id} style={{padding:'14px 16px',borderRadius:'12px',border: s.is_current?'1.5px solid #0d9488':'1px solid #e5e7eb',background: s.is_current?'#f0fdfa':'#fff'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                  <i className={`fa-solid ${deviceIcon(s.device_type)}`} style={{color:'#0d9488',fontSize:'18px',width:'20px',textAlign:'center'}}></i>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#134e4a',margin:0,flex:1}}>{s.device_label || 'ไม่ทราบอุปกรณ์'}</p>
                  {s.is_current && (
                    <span style={{fontSize:'10px',fontWeight:700,padding:'3px 9px',borderRadius:'999px',background:'#0d9488',color:'#fff'}}>
                      <i className="fa-solid fa-circle" style={{fontSize:'7px',marginRight:'5px'}}></i>เครื่องนี้
                    </span>
                  )}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 16px',fontSize:'11px',color:'#6b7280',marginLeft:'32px'}}>
                  <span><i className="fa-solid fa-globe" style={{marginRight:'5px'}}></i>IP: {s.ip_address || '-'}</span>
                  <span><i className="fa-solid fa-right-to-bracket" style={{marginRight:'5px'}}></i>เริ่ม {relTime(s.started_at)}</span>
                  <span style={{gridColumn:'1 / -1'}}><i className="fa-solid fa-circle" style={{color:'#22c55e',marginRight:'5px',fontSize:'8px'}}></i>ใช้งานล่าสุด {relTime(s.last_active_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {resultMsg && (
            <div style={{marginTop:'14px',padding:'10px 14px',borderRadius:'10px',background:resultMsg.includes('สำเร็จ')?'#d1fae5':'#fef2f2',color:resultMsg.includes('สำเร็จ')?'#065f46':'#dc2626',fontSize:'12px',textAlign:'center'}}>
              <i className={`fa-solid ${resultMsg.includes('สำเร็จ')?'fa-circle-check':'fa-circle-exclamation'}`} style={{marginRight:'6px'}}></i>{resultMsg}
            </div>
          )}

          <button onClick={()=>otherCount>0 && setConfirmOpen(true)} disabled={signingOut || otherCount===0}
            style={{width:'100%',marginTop:'18px',padding:'13px',borderRadius:'12px',background: otherCount===0?'#e5e7eb':(signingOut?'#fdba74':'#ea580c'),color: otherCount===0?'#9ca3af':'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:(signingOut||otherCount===0)?'not-allowed':'pointer',boxShadow:otherCount===0?'none':'0 4px 14px rgba(234,88,12,0.3)',transition:'background 0.2s'}}
            onMouseEnter={e=>{if(!signingOut && otherCount>0) e.currentTarget.style.background='#c2410c';}}
            onMouseLeave={e=>{if(!signingOut && otherCount>0) e.currentTarget.style.background='#ea580c';}}>
            {signingOut
              ? <><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'6px'}}></i>กำลังออกจากระบบ...</>
              : otherCount===0
                ? <><i className="fa-solid fa-circle-check" style={{marginRight:'6px'}}></i>ไม่มีอุปกรณ์อื่นที่เข้าใช้งาน</>
                : <><i className="fa-solid fa-right-from-bracket" style={{marginRight:'6px'}}></i>ออกจากระบบทุกอุปกรณ์ยกเว้นเครื่องนี้ ({otherCount})</>}
          </button>

          <div style={{textAlign:'center',marginTop:'18px',paddingTop:'14px',borderTop:'1px solid #f3f4f6'}}>
            <button onClick={()=>setShowHistory(true)}
              style={{background:'none',border:'none',color:'#0d9488',fontSize:'12px',fontWeight:600,cursor:'pointer',textDecoration:'none'}}
              onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
              onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
              <i className="fa-solid fa-clock-rotate-left" style={{marginRight:'6px'}}></i>ดูประวัติการเข้าใช้งานทั้งหมด
            </button>
          </div>
        </>
      )}

      {/* Confirm popup */}
      {confirmOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}} onClick={()=>setConfirmOpen(false)}>
          <div className="modal-A" style={{background:'#fff',borderRadius:'16px',padding:'28px',maxWidth:'400px',width:'90%',textAlign:'center',boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'#fff7ed',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
              <i className="fa-solid fa-triangle-exclamation" style={{fontSize:'22px',color:'#ea580c'}}></i>
            </div>
            <p style={{fontSize:'15px',fontWeight:700,color:'#134e4a',margin:'0 0 8px'}}>ยืนยันออกจากระบบทุกอุปกรณ์</p>
            <p style={{fontSize:'12px',color:'#6b7280',margin:'0 0 18px',lineHeight:1.5}}>
              อุปกรณ์อื่นๆ ทั้งหมด ({otherCount} อุปกรณ์) จะถูกออกจากระบบทันที<br/>เครื่องนี้จะยังใช้งานต่อได้ปกติ
            </p>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setConfirmOpen(false)}
                style={{flex:1,padding:'11px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>
                ยกเลิก
              </button>
              <button onClick={doSignoutOthers}
                style={{flex:1,padding:'11px',borderRadius:'10px',background:'#ea580c',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Avatar helpers (v0.7.18.x) ────────────────────────────────────────────
// สร้าง public URL ของรูป avatar จาก key ที่เก็บใน DB · มี fallback domain (กันกรณี
// NEXT_PUBLIC_R2_AVATAR_URL ไม่ถูก inline ตอน build บน Cloudflare Worker)
// r2AvatarUrl, normName, nameInitials, AVATAR_PALETTE, colorFromName, AvatarCircle ย้ายไป parts/shared.jsx (เฟส 1d)

// ── Avatar crop + upload (v0.7.18.0) ──────────────────────────────────────
// loadImageEl ย้ายไป parts/shared.jsx (เฟส 5 — ใช้ร่วม images + avatar crop)
// ครอบ + ย่อเป็น WebP จัตุรัส (EXIF/GPS หายอัตโนมัติ เพราะวาดลง canvas ใหม่)
// เก็บเป็น "สี่เหลี่ยม" เต็มกรอบครอบ (รวมมุม/ผมที่อยู่นอกวงกลม) → avatar เล็กแสดงเป็นวงกลมด้วย CSS
// รูปครอบนี้ใช้แสดง avatar เล็กเท่านั้น (≤90px) → เก็บแค่ 512px พอ · รูปกดดูเต็มใช้ "ต้นฉบับ" แทน
// out = min(outMax, ความละเอียดจริงของบริเวณที่ครอบ) → ไม่ขยายเกินรูปจริง (กันรูปแตก)
async function cropToWebp(src, pixels, outMax = 512) {
  const img = await loadImageEl(src);
  const out = Math.max(1, Math.min(outMax, Math.round(pixels.width)));
  const canvas = document.createElement('canvas');
  canvas.width = out; canvas.height = out;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';        // พื้นขาว — โผล่เฉพาะตอนซูมออกจนรูปไม่เต็มกรอบ (กันขอบดำ/โปร่งใส)
  ctx.fillRect(0, 0, out, out);
  ctx.drawImage(img, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, out, out);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 1.0));  // WebP 100%
}
// ย่อรูป "ต้นฉบับ" คงสัดส่วนเดิม (max maxEdge ด้านยาว, ไม่ขยายเกินรูปจริง) → สำหรับกดดูเต็ม/ซูม
async function resizeToWebp(src, maxEdge = 1920) {
  const img = await loadImageEl(src);
  let w = img.naturalWidth, h = img.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 1.0));  // WebP 100%
}
// image helpers (compressToWebp, putWithProgress, blobToDataURL, decodeImageToDataURL, isAnimatedGif, JustifiedGallery, fmtFileSize, mimeLabel, detectDevice, IMG_SORTS, imgInRange, imgSortCmp, patientImgInfo) ย้ายไป parts/patient-images.jsx (เฟส 5)

function AvatarCropModal({ src, uploading, error, onCancel, onConfirm }) {
  const [crop, setCrop]   = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom]   = React.useState(1);
  const [pixels, setPixels] = React.useState(null);
  const onComplete = React.useCallback((_, p) => setPixels(p), []);
  return createPortal(
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={uploading?undefined:onCancel}>
      <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'400px',overflow:'hidden',boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #f3f4f6'}}>
          <p style={{fontSize:'15px',fontWeight:700,color:'#0f766e',margin:0}}><i className="fa-solid fa-crop-simple" style={{marginRight:'8px'}}></i>ปรับรูปโปรไฟล์</p>
          <p style={{fontSize:'12px',color:'#9ca3af',margin:'4px 0 0'}}>ลากเลื่อน และซูม — ซูมออกเพื่อเห็นรูปทั้งใบ</p>
        </div>
        {/* กรอบจัตุรัส (paddingBottom 100%) + objectFit cover → วงกลมครอบเต็มขอบทุกด้าน
            ไม่ว่ารูปแนวตั้ง/แนวนอน (cover = รูปเต็มกรอบเสมอ เหมือน avatar LINE/FB) */}
        <div style={{position:'relative',width:'100%',paddingBottom:'100%',background:'#1f2937'}}>
          <div style={{position:'absolute',inset:0}}>
            <Cropper image={src} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
              objectFit="cover" minZoom={0.4} restrictPosition={false}
              onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onComplete}/>
          </div>
          {/* เส้นช่วยจัดองค์ประกอบ: rule of thirds (9 ช่อง) + เส้นแบ่งครึ่งกลาง (เข้มกว่า) */}
          <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
            <div style={{position:'absolute',top:0,bottom:0,left:'33.33%',width:'1px',background:'rgba(255,255,255,0.30)'}}/>
            <div style={{position:'absolute',top:0,bottom:0,left:'66.66%',width:'1px',background:'rgba(255,255,255,0.30)'}}/>
            <div style={{position:'absolute',left:0,right:0,top:'33.33%',height:'1px',background:'rgba(255,255,255,0.30)'}}/>
            <div style={{position:'absolute',left:0,right:0,top:'66.66%',height:'1px',background:'rgba(255,255,255,0.30)'}}/>
            <div style={{position:'absolute',top:0,bottom:0,left:'50%',width:'1px',background:'rgba(255,255,255,0.55)'}}/>
            <div style={{position:'absolute',left:0,right:0,top:'50%',height:'1px',background:'rgba(255,255,255,0.55)'}}/>
          </div>
        </div>
        <div style={{padding:'14px 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
            <i className="fa-solid fa-magnifying-glass-minus" style={{color:'#9ca3af',fontSize:'12px'}}></i>
            <input type="range" min={0.4} max={3} step={0.05} value={zoom} disabled={uploading}
              onChange={e=>setZoom(Number(e.target.value))} style={{flex:1,accentColor:'#0d9488'}}/>
            <i className="fa-solid fa-magnifying-glass-plus" style={{color:'#9ca3af',fontSize:'12px'}}></i>
          </div>
          {error && <p style={{fontSize:'12px',color:'#dc2626',margin:'0 0 10px',textAlign:'center'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{error}</p>}
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={onCancel} disabled={uploading}
              style={{flex:1,padding:'11px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:uploading?'not-allowed':'pointer'}}>ยกเลิก</button>
            <button onClick={()=>pixels && onConfirm(pixels)} disabled={uploading || !pixels}
              style={{flex:1,padding:'11px',borderRadius:'10px',background:uploading?'#5eead4':'#0d9488',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:uploading?'wait':'pointer'}}>
              {uploading ? <><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'6px'}}></i>กำลังอัปโหลด</> : <><i className="fa-solid fa-check" style={{marginRight:'6px'}}></i>ใช้รูปนี้</>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── ดูรูปโปรไฟล์เต็ม (lightbox) — เครื่องมือดูรูปสไตล์ Windows Photos ──────────
// แสดง "รูปต้นฉบับ" · เปิดแบบขยายจากตำแหน่งรูป · ลาก + สโครลซูม + หมุน + เลือก % + info (nerd)
// AvatarLightbox ย้ายไป parts/shared.jsx (เฟส 5 — ใช้ร่วมกับ avatar/UserProfileModal)
function AvatarDeleteConfirm({ uploading, error, onCancel, onConfirm }) {
  return createPortal(
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={uploading?undefined:onCancel}>
      <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'360px',overflow:'hidden',boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}}>
        <div style={{padding:'24px 22px 18px',textAlign:'center'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'50%',background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
            <i className="fa-solid fa-trash-can" style={{color:'#dc2626',fontSize:'20px'}}></i>
          </div>
          <p style={{fontSize:'16px',fontWeight:700,color:'#111827',margin:'0 0 8px'}}>ลบรูปโปรไฟล์</p>
          <p style={{fontSize:'13px',color:'#6b7280',margin:0,lineHeight:1.6}}>รูปโปรไฟล์จะถูกลบถาวร และกลับไปแสดงเป็นตัวอักษรย่อ หากต้องการรูปเดิมต้องอัปโหลดใหม่</p>
          {error && <p style={{fontSize:'12px',color:'#dc2626',margin:'12px 0 0'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{error}</p>}
        </div>
        <div style={{display:'flex',gap:'10px',padding:'0 20px 20px'}}>
          <button onClick={onCancel} disabled={uploading} style={{flex:1,padding:'11px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:uploading?'not-allowed':'pointer'}}>ยกเลิก</button>
          <button onClick={onConfirm} disabled={uploading} style={{flex:1,padding:'11px',borderRadius:'10px',background:uploading?'#fca5a5':'#dc2626',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:uploading?'wait':'pointer'}}>
            {uploading ? <><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'6px'}}></i>กำลังลบ</> : <><i className="fa-solid fa-trash-can" style={{marginRight:'6px'}}></i>ลบรูป</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function UserProfileModal({ onClose }) {
  const [form, setForm]                 = React.useState(null);
  const [loading, setLoading]           = React.useState(true);
  const [editingKey, setEditingKey]     = React.useState(null);
  const [tempValue, setTempValue]       = React.useState('');
  const [requestField, setRequestField] = React.useState(null);
  const [saving, setSaving]             = React.useState(false);
  const [warnClose, setWarnClose]       = React.useState(false);
  const [editErr, setEditErr]           = React.useState('');  // ข้อความเตือนใต้ช่องที่กำลังแก้ (แทน popup)
  const [mode, setMode]                 = React.useState('profile');  // 'profile' | 'changePassword' | 'sessions'
  // v0.7.18.0 — avatar upload
  const [cropSrc, setCropSrc]                 = React.useState(null);  // dataURL รูปที่เลือก รอครอบ
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [avatarErr, setAvatarErr]             = React.useState('');
  const [lightbox, setLightbox]               = React.useState(null);  // {src} ดูรูปเต็ม (รูปต้นฉบับ)
  const [confirmDelAvatar, setConfirmDelAvatar] = React.useState(false);  // popup ยืนยันลบรูป
  const [cropFromOriginal, setCropFromOriginal] = React.useState(false);  // กำลัง "ครอบใหม่" จากรูปต้นฉบับ (ไม่ต้องอัปต้นฉบับซ้ำ)
  const avatarInputRef = React.useRef(null);
  const avatarCircleRef = React.useRef(null);  // วงกลม avatar (ใช้คำนวณตำแหน่งตอนเปิด lightbox)
  const {close: animClose, modalCls, overlayCls} = useModalAnim(onClose);

  const handleClose = () => {
    if (editingKey !== null) { setWarnClose(true); return; }
    animClose();
  };

  // v0.7.18.0 — เลือกไฟล์รูป → เปิดหน้าครอบ
  const pickAvatarFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';  // reset เผื่อเลือกไฟล์เดิมซ้ำ
    if (!file) return;
    if (!file.type.startsWith('image/')) { setAvatarErr('กรุณาเลือกไฟล์รูปภาพ'); return; }
    if (file.size > 50 * 1024 * 1024) { setAvatarErr('ไฟล์ใหญ่เกิน 50MB'); return; }
    setAvatarErr('');
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
  };
  // ครอบเสร็จ → ย่อ WebP → อัปโหลด
  // อัปครั้งแรก: เก็บ 2 ไฟล์ (รูปครอบ 512 + รูปต้นฉบับ max 1920) · "ครอบใหม่": อัปแค่รูปครอบ (ต้นฉบับเดิมคงไว้)
  const handleCropConfirm = async (pixels) => {
    setUploadingAvatar(true); setAvatarErr('');
    try {
      const isRecrop = cropFromOriginal;
      const croppedBlob = await cropToWebp(cropSrc, pixels, 512);   // รูปครอบ (โชว์ avatar เล็ก)
      const originalBlob = isRecrop ? null : await resizeToWebp(cropSrc, 1920);  // รูปต้นฉบับ (กดดูเต็ม)
      const pres = await fetch('/api/profile/avatar/presign', { method: 'POST' });
      const presData = await pres.json();
      if (!pres.ok) throw new Error(presData.error || 'ขอลิงก์อัปโหลดไม่สำเร็จ');
      const put = await fetch(presData.uploadUrl, { method: 'PUT', body: croppedBlob, headers: { 'content-type': 'image/webp' } });
      if (!put.ok) throw new Error('อัปโหลดรูปไม่สำเร็จ');
      if (originalBlob) {
        const put2 = await fetch(presData.uploadUrlOrig, { method: 'PUT', body: originalBlob, headers: { 'content-type': 'image/webp' } });
        if (!put2.ok) throw new Error('อัปโหลดรูปต้นฉบับไม่สำเร็จ');
      }
      const conf = await fetch('/api/profile/avatar/confirm', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hasOriginal: !isRecrop }),
      });
      const confData = await conf.json();
      if (!conf.ok) throw new Error(confData.error || 'บันทึกรูปไม่สำเร็จ');
      setForm(f => ({ ...f, avatarUrl: confData.key, avatarOriginalUrl: confData.keyOrig || f.avatarOriginalUrl, avatarUpdatedAt: confData.avatar_updated_at }));
      setCropSrc(null); setCropFromOriginal(false);
    } catch (err) {
      setAvatarErr(err.message || 'เกิดข้อผิดพลาด');
    }
    setUploadingAvatar(false);
  };
  // ลบรูปจริง → กลับเป็นตัวอักษรย่อ (เรียกหลังยืนยันใน popup)
  const doDeleteAvatar = async () => {
    setUploadingAvatar(true); setAvatarErr('');
    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
      if (!res.ok) throw new Error('ลบรูปไม่สำเร็จ');
      setForm(f => ({ ...f, avatarUrl: null, avatarOriginalUrl: null, avatarUpdatedAt: null }));
      setConfirmDelAvatar(false);
    } catch (err) { setAvatarErr(err.message || 'ลบรูปไม่สำเร็จ'); }
    setUploadingAvatar(false);
  };
  // กดที่รูป → เปิด popup ดูรูปเต็ม (ใช้รูปต้นฉบับ ถ้าไม่มีค่อย fallback รูปครอบ)
  const openLightbox = () => {
    const url = avatarOriginalPublicUrl || avatarPublicUrl;
    if (!url) return;
    const rect = avatarCircleRef.current ? avatarCircleRef.current.getBoundingClientRect() : null;
    const key = (form && (form.avatarOriginalUrl || form.avatarUrl)) || '';
    setLightbox({ src: url, rect, info: { name: key.split('/').pop(), updatedAt: form && form.avatarUpdatedAt } });
  };
  // "ครอบใหม่" → ดึงรูปต้นฉบับเป็น blob (object URL = same-origin) เข้าหน้าครอบ
  // ใช้ fetch→blob แทนใส่ URL ตรงๆ เพื่อกัน canvas tainted (เบราว์เซอร์ cache รูปแบบไม่มี CORS ไว้ตอนแสดง popup)
  const startRecrop = async () => {
    if (!avatarOriginalPublicUrl) return;
    setAvatarErr('');
    try {
      const res = await fetch(avatarOriginalPublicUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error('โหลดรูปต้นฉบับไม่สำเร็จ');
      const objUrl = URL.createObjectURL(await res.blob());
      setCropFromOriginal(true); setCropSrc(objUrl);
    } catch (err) {
      setAvatarErr('เปิดรูปต้นฉบับไม่สำเร็จ ลองอัปรูปใหม่');
    }
  };
  const avatarPublicUrl = form ? r2AvatarUrl(form.avatarUrl, form.avatarUpdatedAt) : null;
  const avatarOriginalPublicUrl = form ? r2AvatarUrl(form.avatarOriginalUrl, form.avatarUpdatedAt) : null;

  // Map DB profile → form ที่ modal ใช้
  const mapDb = (db) => {
    if (!db) return null;
    // license_number ใน DB เก็บแบบเต็ม (เช่น "ภ.12345") → ตัดเหลือเฉพาะตัวเลขเพื่อให้ UI เติมคำนำหน้ากลับ
    const licenseDigits = window.tbLicenseDigits(db.license_number);
    return {
      username:       db.username,
      email:          db.email,
      role:           db.role === 'admin' ? 'Admin' : 'User',
      since:          db.approved_at
                        ? new Date(db.approved_at).toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' })
                        : '—',
      phone:          db.phone || '—',
      department:     db.department === 'อื่นๆ' ? (db.department_other || 'อื่นๆ') : db.department,
      firstName:      db.first_name,
      lastName:       db.last_name,
      profession:     db.profession,
      title:          db.title || '',  // คำนำหน้านามที่ผู้ใช้เลือก (นาย/นาง/นางสาว) — ระบบแปลงเป็นตัวย่อวิชาชีพตอนแสดง
      licenseNumber:  licenseDigits,
      hospitalName:   db.hospital_name,
      hospitalType:   db.hospital_type,
      avatarUrl:      db.avatar_url || null,
      avatarOriginalUrl: db.avatar_original_url || null,
      avatarUpdatedAt: db.avatar_updated_at || null,
    };
  };

  // Fetch profile on mount
  React.useEffect(() => {
    fetch('/api/profile/me')
      .then(r => r.json())
      .then(data => { setForm(mapDb(data.profile)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !form) {
    return (
      <div className={overlayCls} style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(2px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center'}}
        onClick={animClose}>
        <div className={modalCls} style={{background:'#fff',borderRadius:'20px',padding:'40px',textAlign:'center',color:'#6b7280'}}>
          <i className="fa-solid fa-spinner fa-spin" style={{fontSize:'24px',color:'#0f766e'}}></i>
          <p style={{marginTop:'12px',fontSize:'14px'}}>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }


  const prof = PROFESSIONS[form.profession] || PROFESSIONS.other;
  const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim() || '—';
  const fullLicense = (prof.prefix || '') + (form.licenseNumber || '');
  const shownTitle = window.tbDisplayTitle(form.profession, form.title);  // ตัวย่อวิชาชีพตามเพศ (ภญ.) หรือคำนำหน้านาม

  // Self-editable fields (เบอร์โทร + แผนก)
  const selfFields = [
    { key:'phone',      icon:'fa-phone',   label:'เบอร์โทรศัพท์', type:'text' },
    { key:'department', icon:'fa-pills',   label:'แผนก',          type:'select', options: DEPARTMENTS },
  ];

  // Admin-approval required fields
  // key = ชื่อคอลัมน์จริงในฐานข้อมูล / currentValue = ค่าดิบ (ไม่จัดรูป) เพื่อให้บันทึกถูกตอนอนุมัติ
  const approvalFields = [
    { key:'title',          icon:'fa-user-tag',       label:'คำนำหน้าชื่อ',        currentValue: form.title, options: window.TB_NAME_PREFIXES },
    { key:'first_name',     icon:'fa-user',           label:'ชื่อ',                currentValue: form.firstName },
    { key:'last_name',      icon:'fa-user',           label:'นามสกุล',             currentValue: form.lastName },
    { key:'profession',     icon:'fa-user-doctor',    label:'วิชาชีพ',             currentValue: prof.label, options: Object.values(PROFESSIONS).map(p=>p.label) },
    { key:'license_number', icon:'fa-id-card',        label:'เลขใบประกอบ',         currentValue: form.licenseNumber, displayValue: fullLicense, hint:'กรอกเฉพาะตัวเลข ระบบจะเติมคำนำหน้าตามวิชาชีพให้อัตโนมัติ' },
    { key:'hospital_name',  icon:'fa-hospital',       label:'โรงพยาบาล',           currentValue: form.hospitalName },
    { key:'hospital_type',  icon:'fa-location-dot',   label:'ประเภทโรงพยาบาล',     currentValue: form.hospitalType, options: HOSPITAL_TYPES },
  ];

  // Read-only system fields
  const systemFields = [
    { key:'email',    icon:'fa-envelope',       label:'อีเมล',              value: form.email },
    { key:'username', icon:'fa-at',             label:'ชื่อผู้ใช้',          value: form.username },
    { key:'role',     icon: form.role === 'Admin' ? 'fa-shield' : 'fa-user',  label:'สิทธิ์การใช้งาน',     value: form.role },
    { key:'since',    icon:'fa-calendar',       label:'ใช้งานระบบตั้งแต่',   value: form.since },
  ];

  const startEdit = (field) => {
    setEditingKey(field.key);
    setEditErr('');
    setTempValue(form[field.key] === '—' ? '' : form[field.key]);
  };
  const saveEdit = async () => {
    setEditErr('');
    // ตรวจ + จัดรูปแบบเบอร์ก่อนส่ง
    let valueToSave = tempValue;
    if (editingKey === 'phone') {
      const chk = window.tbValidatePhone(tempValue);
      if (!chk.ok) { setEditErr(chk.msg); return; }
      valueToSave = window.tbFormatPhone(tempValue);
    }
    setSaving(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editingKey]: valueToSave }),
      });
      if (!res.ok) { const e = await res.json(); setEditErr('บันทึกไม่สำเร็จ: ' + e.error); setSaving(false); return; }
      setForm(f => ({ ...f, [editingKey]: valueToSave || '—' }));
      setEditingKey(null);
    } catch (e) {
      setEditErr('เกิดข้อผิดพลาด: ' + e.message);
    } finally { setSaving(false); }
  };
  const cancelEdit = () => { setEditingKey(null); setEditErr(''); };

  const saveAdminSelf = async (dbKey) => {
    setEditErr('');
    // ตรวจ + จัดรูปแบบเบอร์ก่อนส่ง
    let valueToSave = tempValue;
    if (dbKey === 'phone') {
      const chk = window.tbValidatePhone(tempValue);
      if (!chk.ok) { setEditErr(chk.msg); return; }
      valueToSave = window.tbFormatPhone(tempValue);
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/edit-self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [dbKey]: valueToSave }),
      });
      if (!res.ok) { const e = await res.json(); setEditErr('บันทึกไม่สำเร็จ: ' + e.error); setSaving(false); return; }
      // map dbKey กลับเป็น form key
      const DB_TO_FORM = {
        first_name:'firstName', last_name:'lastName', phone:'phone',
        department:'department', hospital_name:'hospitalName',
        hospital_type:'hospitalType', license_number:'licenseNumber',
      };
      const formKey = DB_TO_FORM[dbKey] || dbKey;
      setForm(f => ({ ...f, [formKey]: valueToSave || '—' }));
      setEditingKey(null);
    } catch (e) {
      setEditErr('เกิดข้อผิดพลาด: ' + e.message);
    } finally { setSaving(false); }
  };

  // Render row helpers
  const SectionHeader = ({ icon, color, label, hint }) => (
    <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'14px 0 6px',borderBottom:'1px solid #e5e7eb',marginBottom:'4px'}}>
      <i className={`fa-solid ${icon}`} style={{color,fontSize:'11px'}}></i>
      <p style={{fontSize:'11px',fontWeight:700,color,margin:0,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</p>
      {hint && <span style={{fontSize:'10px',color:'#9ca3af',marginLeft:'auto'}}>{hint}</span>}
    </div>
  );

  const RowShell = ({ icon, label, children, action }) => (
    <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #f1f5f9'}}>
      <span style={{width:'32px',height:'32px',borderRadius:'8px',background:'#fffbeb',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <i className={`fa-solid ${icon}`} style={{color:'#d97706',fontSize:'13px'}}></i>
      </span>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>{label}</p>
        {children}
      </div>
      {action}
    </div>
  );

  return (
    <>
      <div className={overlayCls} style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(2px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
        <div className={modalCls} style={{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'920px',
          // v0.7.17.3 — หน้าโปรไฟล์ปล่อยให้กรอบหดตาม content (ไม่โล่ง)
          //             หน้าอื่น (อุปกรณ์ / เปลี่ยนรหัสผ่าน) ล็อค height ไว้ ไม่ขยับตอนกรอง
          ...(mode === 'profile'
            ? { maxHeight: 'min(88vh, 720px)' }
            : { height: '88vh', maxHeight: '720px' }),
          display:'flex',flexDirection:'row',boxShadow:'0 20px 60px rgba(0,0,0,0.15)',overflow:'hidden'}}>

          {/* ═══ LEFT: Header column ═══ */}
          <div style={{background:'linear-gradient(160deg,#0f766e,#14b8a6)',padding:'32px 24px',width:'280px',flexShrink:0,display:'flex',flexDirection:'column',position:'relative'}}>

            <div style={{textAlign:'center',marginTop:'10px'}}>
              <div style={{position:'relative',width:'90px',margin:'0 auto 16px'}}>
                <div ref={avatarCircleRef} onClick={openLightbox} title={avatarPublicUrl ? 'กดดูรูปเต็ม' : undefined}
                  style={{width:'90px',height:'90px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'3px solid rgba(255,255,255,0.3)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:(shownTitle||'').length>3?'15px':'22px',overflow:'hidden',cursor:avatarPublicUrl?'zoom-in':'default'}}>
                  {avatarPublicUrl
                    ? <img src={avatarPublicUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : shownTitle}
                </div>
                <button onClick={()=>avatarInputRef.current && avatarInputRef.current.click()} title="เปลี่ยนรูปโปรไฟล์"
                  style={{position:'absolute',bottom:'0',right:'0',width:'30px',height:'30px',borderRadius:'50%',background:'#fff',border:'2px solid #14b8a6',color:'#0f766e',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,0.15)'}}>
                  <i className="fa-solid fa-camera" style={{fontSize:'12px'}}></i>
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={pickAvatarFile} style={{display:'none'}}/>
              </div>
              {avatarPublicUrl && (
                <div style={{display:'flex',gap:'8px',justifyContent:'center',margin:'0 0 12px'}}>
                  {avatarOriginalPublicUrl && (
                    <button onClick={startRecrop} disabled={uploadingAvatar}
                      style={{fontSize:'11px',color:'#fff',background:'rgba(0,0,0,0.18)',border:'none',borderRadius:'8px',padding:'4px 12px',cursor:uploadingAvatar?'not-allowed':'pointer'}}>
                      <i className="fa-solid fa-crop-simple" style={{marginRight:'5px',fontSize:'10px'}}></i>ครอบใหม่
                    </button>
                  )}
                  <button onClick={()=>setConfirmDelAvatar(true)} disabled={uploadingAvatar}
                    style={{fontSize:'11px',color:'#fff',background:'rgba(0,0,0,0.18)',border:'none',borderRadius:'8px',padding:'4px 12px',cursor:uploadingAvatar?'not-allowed':'pointer'}}>
                    <i className="fa-solid fa-trash-can" style={{marginRight:'5px',fontSize:'10px'}}></i>ลบรูป
                  </button>
                </div>
              )}
              {avatarErr && !cropSrc && (
                <p style={{fontSize:'11px',color:'#fecaca',background:'rgba(0,0,0,0.15)',borderRadius:'8px',padding:'5px 10px',margin:'0 0 12px',display:'inline-block'}}>
                  <i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{avatarErr}
                </p>
              )}
              {cropSrc && (
                <AvatarCropModal src={cropSrc} uploading={uploadingAvatar} error={avatarErr}
                  onCancel={()=>{ if(!uploadingAvatar){ setCropSrc(null); setAvatarErr(''); } }}
                  onConfirm={handleCropConfirm}/>
              )}
              {lightbox && (
                <AvatarLightbox src={lightbox.src} originRect={lightbox.rect} info={lightbox.info} onClose={()=>setLightbox(null)}/>
              )}
              {confirmDelAvatar && (
                <AvatarDeleteConfirm uploading={uploadingAvatar} error={avatarErr}
                  onCancel={()=>{ if(!uploadingAvatar){ setConfirmDelAvatar(false); setAvatarErr(''); } }}
                  onConfirm={doDeleteAvatar}/>
              )}
              <p style={{fontWeight:800,fontSize:'18px',color:'#fff',margin:0,lineHeight:1.3}}>{shownTitle} {fullName}</p>
              <p style={{fontSize:'13px',color:'rgba(255,255,255,0.85)',margin:'5px 0 0'}}>{prof.label}</p>
              {fullLicense && <p style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',margin:'2px 0 0'}}><i className="fa-solid fa-id-card" style={{marginRight:'5px',fontSize:'11px'}}></i>{fullLicense}</p>}
              <span style={{display:'inline-block',marginTop:'12px',background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:'11px',fontWeight:700,padding:'4px 12px',borderRadius:'20px'}}>
                <i className={"fa-solid " + (form.role === 'Admin' ? 'fa-shield' : 'fa-user')} style={{marginRight:'5px'}}></i>{form.role}
              </span>
            </div>

            {/* Mini stats / quick info */}
            <div style={{marginTop:'24px',padding:'14px',background:'rgba(255,255,255,0.1)',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.15)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                <i className="fa-solid fa-hospital" style={{color:'rgba(255,255,255,0.8)',fontSize:'12px',width:'14px'}}></i>
                <p style={{fontSize:'11px',color:'#fff',margin:0,fontWeight:600,lineHeight:1.3}}>{form.hospitalName}</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                <i className="fa-solid fa-pills" style={{color:'rgba(255,255,255,0.8)',fontSize:'12px',width:'14px'}}></i>
                <p style={{fontSize:'11px',color:'#fff',margin:0,fontWeight:600}}>{form.department}</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <i className="fa-solid fa-calendar" style={{color:'rgba(255,255,255,0.8)',fontSize:'12px',width:'14px'}}></i>
                <p style={{fontSize:'11px',color:'#fff',margin:0,fontWeight:600}}>เริ่มใช้ {form.since}</p>
              </div>
            </div>

            {/* Footer buttons inside left col */}
            <div style={{marginTop:'auto',paddingTop:'20px',display:'flex',flexDirection:'column',gap:'8px'}}>
              <button onClick={()=>setMode('changePassword')}
                style={{width:'100%',padding:'10px',borderRadius:'10px',border:'1.5px solid rgba(255,255,255,0.35)',background:'rgba(255,255,255,0.15)',color:'#fff',fontWeight:600,fontSize:'12px',cursor:'pointer',transition:'background 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.25)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
                <i className="fa-solid fa-key" style={{marginRight:'6px'}}></i>เปลี่ยนรหัสผ่าน
              </button>
              <button onClick={()=>setMode('sessions')}
                style={{width:'100%',padding:'10px',borderRadius:'10px',border:'1.5px solid rgba(255,255,255,0.35)',background:'rgba(255,255,255,0.15)',color:'#fff',fontWeight:600,fontSize:'12px',cursor:'pointer',transition:'background 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.25)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
                <i className="fa-solid fa-shield-halved" style={{marginRight:'6px'}}></i>อุปกรณ์ที่เข้าใช้งาน
              </button>
              <button onClick={handleClose} style={{width:'100%',padding:'11px',borderRadius:'10px',border:'none',background:'rgba(255,255,255,0.95)',color:'#0f766e',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>

          {/* ═══ RIGHT: Content column ═══ */}
          <div style={{flex:1,overflowY:'auto',padding:'20px 28px'}}>

            {mode === 'changePassword' ? (
              <ChangePasswordPanel email={form.email} onBack={()=>setMode('profile')} />
            ) : mode === 'sessions' ? (
              <SessionsPanel onBack={()=>setMode('profile')} />
            ) : (
            <>
            {/* Sections */}
            {form.role === 'Admin' ? (
              <>
                <SectionHeader icon="fa-user" color="#d97706" label="ข้อมูลโปรไฟล์" hint="✏️ กดปุ่มปากกาเพื่อแก้ไข" />
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
                  {[
                    { key:'title',       dbKey:'title',         icon:'fa-user-tag',     label:'คำนำหน้าชื่อ',       type:'select', options: window.TB_NAME_PREFIXES },
                    { key:'firstName',   dbKey:'first_name',    icon:'fa-user',         label:'ชื่อ',               type:'text' },
                    { key:'lastName',    dbKey:'last_name',     icon:'fa-user',         label:'นามสกุล',            type:'text' },
                    { key:'phone',       dbKey:'phone',         icon:'fa-phone',        label:'เบอร์โทรศัพท์',      type:'text' },
                    { key:'department',  dbKey:'department',    icon:'fa-pills',        label:'แผนก',               type:'select', options: DEPARTMENTS },
                    { key:'hospitalName',dbKey:'hospital_name', icon:'fa-hospital',     label:'โรงพยาบาล',          type:'text' },
                    { key:'hospitalType',dbKey:'hospital_type', icon:'fa-location-dot', label:'ประเภทโรงพยาบาล',    type:'select', options: HOSPITAL_TYPES },
                    { key:'licenseNumber',dbKey:'license_number',icon:'fa-id-card',    label:'เลขใบประกอบ',         type:'text' },
                  ].map(field => (
                    <div key={field.key} style={field.key==='title'?{gridColumn:'1 / -1'}:undefined}>
                    <RowShell icon={field.icon} label={field.label}
                      action={editingKey === field.key
                        ? (
                          <div style={{display:'flex',gap:'4px'}}>
                            <button onClick={cancelEdit} style={{width:'28px',height:'28px',borderRadius:'7px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',cursor:'pointer'}}>
                              <i className="fa-solid fa-xmark" style={{fontSize:'11px'}}></i>
                            </button>
                            <button onClick={()=>saveAdminSelf(field.dbKey)} style={{width:'28px',height:'28px',borderRadius:'7px',border:'none',background:'#d97706',color:'#fff',cursor:'pointer'}}>
                              <i className="fa-solid fa-check" style={{fontSize:'11px'}}></i>
                            </button>
                          </div>
                        ) : (
                          <button onClick={()=>startEdit(field)} title="แก้ไข"
                            style={{width:'28px',height:'28px',borderRadius:'7px',border:'1px solid #d1fae5',background:'#f0fdfa',color:'#0d9488',cursor:'pointer'}}>
                            <i className="fa-solid fa-pen" style={{fontSize:'11px'}}></i>
                          </button>
                        )}>
                      {editingKey === field.key
                        ? (<>
                            {field.type === 'select'
                            ? <select value={tempValue} onChange={e=>setTempValue(e.target.value)} autoFocus
                                style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #d97706',outline:'none',background:'transparent',padding:'2px 0',cursor:'pointer'}}>
                                <option value="">— เลือก —</option>
                                {(field.options||[]).map(o=><option key={o} value={o}>{o}</option>)}
                              </select>
                            : field.key === 'phone'
                              ? <input value={tempValue} onChange={e=>setTempValue(window.tbFormatPhone(e.target.value))} autoFocus
                                  placeholder="08x-xxx-xxxx"
                                  style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #d97706',outline:'none',background:'transparent',padding:'2px 0'}}/>
                            : field.key === 'licenseNumber'
                              ? <div style={{display:'flex',alignItems:'center',gap:'6px',borderBottom:'1.5px solid #d97706'}}>
                                  {prof.prefix && <span style={{fontSize:'13px',fontWeight:700,color:'#0d9488',flexShrink:0}}>{prof.prefix}</span>}
                                  <input value={tempValue} onChange={e=>setTempValue(e.target.value.replace(/\D/g,''))} autoFocus
                                    placeholder="กรอกเฉพาะตัวเลข"
                                    style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',outline:'none',background:'transparent',padding:'2px 0'}}/>
                                </div>
                              : <input value={tempValue} onChange={e=>setTempValue(e.target.value)} autoFocus
                                  style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #d97706',outline:'none',background:'transparent',padding:'2px 0'}}/>}
                            {editErr && <p style={{fontSize:'11px',color:'#ef4444',margin:'4px 0 0'}}>{editErr}</p>}
                          </>)
                        : <p style={{fontSize:'13px',fontWeight:600,color:'#1f2937',margin:0}}>{field.key === 'licenseNumber' ? (((prof.prefix||'') + (form.licenseNumber||'')) || '—') : (form[field.key] || '—')}</p>
                      }
                    </RowShell>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <SectionHeader icon="fa-pen-to-square" color="#0d9488" label="ข้อมูลที่แก้ไขได้เอง" />
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
                  {selfFields.map(field => (
                    <RowShell key={field.key} icon={field.icon} label={field.label}
                      action={editingKey === field.key
                        ? (
                          <div style={{display:'flex',gap:'4px'}}>
                            <button onClick={cancelEdit} style={{width:'28px',height:'28px',borderRadius:'7px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',cursor:'pointer'}}>
                              <i className="fa-solid fa-xmark" style={{fontSize:'11px'}}></i>
                            </button>
                            <button onClick={saveEdit} style={{width:'28px',height:'28px',borderRadius:'7px',border:'none',background:'#0d9488',color:'#fff',cursor:'pointer'}}>
                              <i className="fa-solid fa-check" style={{fontSize:'11px'}}></i>
                            </button>
                          </div>
                        ) : (
                          <button onClick={()=>startEdit(field)} title="แก้ไขข้อมูลนี้"
                            style={{width:'28px',height:'28px',borderRadius:'7px',border:'1px solid #d1fae5',background:'#f0fdfa',color:'#0d9488',cursor:'pointer'}}>
                            <i className="fa-solid fa-pen" style={{fontSize:'11px'}}></i>
                          </button>
                        )}>
                      {editingKey === field.key
                        ? (<>
                            {field.type === 'select'
                            ? <select value={tempValue} onChange={e=>setTempValue(e.target.value)} autoFocus
                                style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #14b8a6',outline:'none',background:'transparent',padding:'2px 0',cursor:'pointer'}}>
                                {field.options.map(o=><option key={o} value={o}>{o}</option>)}
                              </select>
                            : field.key === 'phone'
                              ? <input value={tempValue} onChange={e=>setTempValue(window.tbFormatPhone(e.target.value))} autoFocus
                                  placeholder="08x-xxx-xxxx"
                                  style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #14b8a6',outline:'none',background:'transparent',padding:'2px 0'}}/>
                            : <input value={tempValue} onChange={e=>setTempValue(e.target.value)} autoFocus
                                style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #14b8a6',outline:'none',background:'transparent',padding:'2px 0'}}/>}
                            {editErr && <p style={{fontSize:'11px',color:'#ef4444',margin:'4px 0 0'}}>{editErr}</p>}
                          </>)
                        : <p style={{fontSize:'13px',fontWeight:600,color:'#1f2937',margin:0}}>{form[field.key]}</p>
                      }
                    </RowShell>
                  ))}
                </div>
                <SectionHeader icon="fa-shield" color="#d97706" label="ต้องขออนุมัติแก้ไข" hint="🔒 ส่งคำขอถึง admin" />
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
                  {approvalFields.map(field => (
                    <div key={field.key} style={field.key==='title'?{gridColumn:'1 / -1'}:undefined}>
                    <RowShell icon={field.icon} label={field.label}
                      action={
                        <button onClick={()=>setRequestField(field)} title="ต้องขออนุมัติจากผู้ดูแลระบบ"
                          style={{width:'28px',height:'28px',borderRadius:'7px',border:'1px solid #fde68a',background:'#fef3c7',color:'#d97706',cursor:'pointer'}}>
                          <i className="fa-solid fa-lock" style={{fontSize:'11px'}}></i>
                        </button>
                      }>
                      <p style={{fontSize:'13px',fontWeight:600,color:'#1f2937',margin:0}}>{field.displayValue || field.currentValue || '—'}</p>
                    </RowShell>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Section 3: Read-only */}
            <SectionHeader icon="fa-circle-info" color="#6b7280" label="ข้อมูลระบบ" hint="แก้ไขไม่ได้" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
              {systemFields.map(field => (
                <RowShell key={field.key} icon={field.icon} label={field.label}>
                  <p style={{fontSize:'13px',fontWeight:600,color:'#1f2937',margin:0,wordBreak:'break-all'}}>{field.value}</p>
                </RowShell>
              ))}
            </div>
            </>
            )}

          </div>
        </div>
      </div>

      {/* Sub-modal: ขอแก้ไข */}
      {requestField && (
        <RequestEditModal
          field={requestField}
          currentValue={requestField.currentValue}
          onClose={()=>setRequestField(null)}
        />
      )}

      {/* Warn close popup */}
      {warnClose && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div className="modal-A" style={{background:'#fff',borderRadius:'16px',padding:'24px',maxWidth:'340px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',textAlign:'center'}}>
            <i className="fa-solid fa-triangle-exclamation" style={{fontSize:'28px',color:'#f59e0b',marginBottom:'10px',display:'block'}}></i>
            <p style={{fontSize:'15px',fontWeight:700,color:'#1f2937',margin:'0 0 6px'}}>ยังไม่ได้บันทึก</p>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px',lineHeight:1.5}}>มีข้อมูลที่กำลังแก้ไขอยู่ หากปิดตอนนี้ข้อมูลจะหายไป</p>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setWarnClose(false)}
                style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#374151',fontWeight:600,fontSize:'13px',cursor:'pointer'}}>
                กลับไปแก้ต่อ
              </button>
              <button onClick={()=>{ setEditingKey(null); setWarnClose(false); onClose(); }}
                style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',background:'#ef4444',color:'#fff',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>
                ปิดทิ้งเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


export { UserProfileModal }
