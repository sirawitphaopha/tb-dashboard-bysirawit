'use client'
/**
 * parts/account/profile.jsx — โมดัลโปรไฟล์หลัก (แยกรอบ 2)
 * UserProfileModal (export) + RequestEditModal + avatar cluster (cropToWebp, resizeToWebp,
 * AvatarCropModal, AvatarDeleteConfirm) + DEPARTMENTS/HOSPITAL_TYPES
 * โหมด profile/password/sessions สลับด้วย state — import panel จาก ./change-password, ./sessions
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import Cropper from 'react-easy-crop'
const { useState, useEffect, useRef, useCallback } = React
import { useModalAnim, r2AvatarUrl, loadImageEl, AvatarLightbox } from '../shared'
import { PROFESSIONS } from '../globals'
import { ChangePasswordPanel } from './change-password'
import { SessionsPanel } from './sessions'

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
