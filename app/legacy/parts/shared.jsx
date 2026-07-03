'use client'
/**
 * parts/shared.jsx — primitive ที่ใช้ร่วมกันข้าม domain
 * (hook แอนิเมชัน modal, className ช่อง input, leaf UI ชิ้นเล็ก ๆ)
 * ทุก parts/* และ shell import จากที่นี่ได้
 *
 * ย้ายมาจาก tb-monolith.jsx (เฟส refactor 1b–1c) — โค้ดเดิม ไม่แก้ logic
 */
import * as React from 'react'
import { createPortal } from 'react-dom'

// ── Modal Animation Helper ──────────────────────────────────────────────
// ใช้กับ popup ทุกตัวที่อยากให้มี animation เปิด/ปิดสม่ำเสมอ (เหมือน AboutModal)
// pattern: modal-A เปิด 0.9s / modal-A-out + modal-overlay-out ปิด 0.6s
export function useModalAnim(onClose, opts = {}) {
  const fast = opts.fast === true;
  const duration = opts.duration ?? (fast ? 240 : 580);
  const [closing, setClosing] = React.useState(false);
  const close = React.useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, duration);
  }, [closing, onClose, duration]);
  return {
    closing,
    close,
    modalCls:   closing ? (fast ? 'modal-A-out-fast'       : 'modal-A-out')       : 'modal-A',
    overlayCls: closing ? (fast ? 'modal-overlay-out-fast' : 'modal-overlay-out') : '',
  };
}

// className มาตรฐานของช่อง input (ใช้ทั่วทุกฟอร์ม)
export const INP = `w-full p-2.5 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-teal-400 text-sm`;

// ── leaf UI ชิ้นเล็ก ๆ (ใช้ข้าม domain) ──
export function FormSection({icon,title,children}){return(<div><div className="flex items-center gap-2 mb-4"><div className="w-7 h-7 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center text-xs"><i className={`fa-solid ${icon}`}></i></div><h3 className="font-bold text-gray-800 text-sm">{title}</h3></div>{children}</div>);}
export function FieldError({msg}){return msg?<p className="text-red-500 text-xs mt-1">{msg}</p>:null;}
export function RangeStatus({status,mgkg}){const c={ok:{bg:'bg-green-100',t:'text-green-700',l:'เหมาะสม'},low:{bg:'bg-amber-100',t:'text-amber-700',l:'ต่ำ'},high:{bg:'bg-red-100',t:'text-red-700',l:'สูง'}}[status]||{bg:'bg-gray-100',t:'text-gray-500',l:'-'};return<div className="text-right flex-shrink-0"><p className={'font-bold text-sm '+c.t}>{mgkg}</p><span className={'text-xs px-2 py-0.5 rounded-full font-bold '+c.bg+' '+c.t}>{c.l}</span></div>;}
export function Badge({label,color='bg-gray-100 text-gray-600'}){return<span className={'px-2.5 py-0.5 rounded-full text-xs font-bold '+color}>{label}</span>;}

// ── leaf UI เพิ่มเติม (เฟส 1c) ──
export function ConfirmModal({ message, onConfirm, onCancel }) {
  const {closing, close, modalCls, overlayCls} = useModalAnim(onCancel);
  const doConfirm = () => { if (closing) return; setTimeout(onConfirm, 0); close(); };
  return (
    <div className={"fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 "+overlayCls}>
      <div className={"bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center "+modalCls}>
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
        </div>
        <p className="font-bold text-gray-800 text-base mb-2">{message}</p>
        <p className="text-sm text-gray-400 mb-6">การกระทำนี้ไม่สามารถยกเลิกได้</p>
        <div className="flex gap-3">
          <button type="button" onClick={close} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">ยกเลิก</button>
          <button type="button" onClick={doConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors">ยืนยันลบ</button>
        </div>
      </div>
    </div>
  );
}

export function ToastModal({ toast, onClose }) {
  const [closing, setClosing] = React.useState(false);
  // reset closing state เมื่อ toast ใหม่เข้ามา
  React.useEffect(() => { if (toast) setClosing(false); }, [toast]);
  const close = React.useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 280);
  }, [closing, onClose]);
  if (!toast) return null;
  const palette = {
    success: { bg:'#ecfdf5', bd:'#10b981', fg:'#065f46', icon:'fa-circle-check', btn:'#0d9488', btnHover:'#0f766e' },
    error:   { bg:'#fef2f2', bd:'#ef4444', fg:'#991b1b', icon:'fa-circle-xmark', btn:'#dc2626', btnHover:'#b91c1c' },
    info:    { bg:'#eff6ff', bd:'#3b82f6', fg:'#1e3a8a', icon:'fa-circle-info',  btn:'#2563eb', btnHover:'#1d4ed8' },
  };
  const c = palette[toast.kind] || palette.info;
  return (
    <div className={"fixed inset-0 z-50 flex items-center justify-center p-4 "+(closing?'modal-overlay-out':'')} style={{ background:'rgba(15,23,42,0.45)' }}>
      <div className={"bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden "+(closing?'modal-toast-out':'modal-toast')}>
        <div className="px-6 py-5" style={{ background: c.bg, borderLeft: `5px solid ${c.bd}` }}>
          <div className="flex items-start gap-3">
            <i className={'fa-solid '+c.icon+' text-2xl mt-0.5'} style={{ color: c.bd }}></i>
            <div className="flex-1">
              {toast.title && <h3 className="font-bold text-base mb-1" style={{ color: c.fg }}>{toast.title}</h3>}
              <p className="text-sm whitespace-pre-line" style={{ color: c.fg }}>{toast.message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 bg-white flex justify-end">
          <button type="button" onClick={close}
            className="px-5 py-2 rounded-xl text-white text-sm font-bold transition-colors"
            style={{ background: c.btn }}
            onMouseEnter={e=>e.currentTarget.style.background=c.btnHover}
            onMouseLeave={e=>e.currentTarget.style.background=c.btn}>
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold mt-0.5 text-gray-800">{value}</p>
    </div>
  );
}

export function FilterSelect({ icon, value, onChange, children }) {
  return (
    <div style={{position:'relative'}}>
      <i className={`fa-solid ${icon}`} style={{position:'absolute',left:'11px',top:'50%',transform:'translateY(-50%)',color:'#0d9488',fontSize:'11px',pointerEvents:'none'}}></i>
      <select value={value} onChange={onChange}
        style={{fontSize:'12px',fontWeight:value?600:400,padding:'9px 26px 9px 30px',borderRadius:'9px',border:`1px solid ${value?'#5eead4':'#e5e7eb'}`,background:value?'#f0fdfa':'#fff',color:value?'#0f766e':'#374151',outline:'none',cursor:'pointer',appearance:'none',WebkitAppearance:'none',MozAppearance:'none'}}>
        {children}
      </select>
      <i className="fa-solid fa-chevron-down" style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'9px',pointerEvents:'none'}}></i>
    </div>
  )
}

export function StatusBadge({ status }) {
  if (status === 'critical') return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit animate-pulse"><i className="fa-solid fa-triangle-exclamation"></i>Lab ผิดปกติ</span>;
  if (status === 'warning') return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">⚠ ติดตาม</span>;
  return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">✓ ปกติ</span>;
}

export function ScrollNav({ getContainer, zIndex = 30 }) {
  const [canUp, setCanUp]     = React.useState(false)
  const [canDown, setCanDown] = React.useState(false)
  const [pos, setPos]         = React.useState({ right: 22, bottom: 22 })  // px จาก viewport edges

  React.useEffect(() => {
    const el = getContainer ? getContainer() : null
    const target = el || window
    const computePos = () => {
      if (el) {
        const r = el.getBoundingClientRect()
        // ฝัง padding 16px ภายในกรอบ
        setPos({
          right:  Math.max(8, window.innerWidth  - r.right  + 16),
          bottom: Math.max(8, window.innerHeight - r.bottom + 16),
        })
      } else {
        setPos({ right: 22, bottom: 22 })
      }
    }
    const onScroll = () => {
      let top, scrollHeight, clientHeight
      if (el) {
        top = el.scrollTop; scrollHeight = el.scrollHeight; clientHeight = el.clientHeight
      } else {
        top = window.scrollY || document.documentElement.scrollTop
        scrollHeight = document.documentElement.scrollHeight
        clientHeight = window.innerHeight
      }
      setCanUp(top > 50)
      setCanDown(top + clientHeight < scrollHeight - 50)
    }
    computePos()
    onScroll()
    target.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', () => { computePos(); onScroll(); })
    // re-compute ตำแหน่งทุก 1s เผื่อ modal/layout เปลี่ยน
    const id = setInterval(computePos, 800)
    return () => {
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      clearInterval(id)
    }
  }, [getContainer])

  const scrollTo = (kind) => {
    const el = getContainer ? getContainer() : null
    const opts = { behavior: 'smooth' }
    if (kind === 'up') {
      if (el) el.scrollTo({ top: 0, ...opts }); else window.scrollTo({ top: 0, ...opts })
    } else {
      if (el) el.scrollTo({ top: el.scrollHeight, ...opts }); else window.scrollTo({ top: document.documentElement.scrollHeight, ...opts })
    }
  }

  if (!canUp && !canDown) return null
  if (typeof document === 'undefined') return null

  // สีอ่อนใสตอนปกติ → hover ค่อยเข้ม
  const btn = {
    width:'40px',height:'40px',borderRadius:'50%',
    border:'1px solid rgba(13,148,136,0.25)',
    background:'rgba(255,255,255,0.7)',
    color:'#0d9488',
    cursor:'pointer',
    boxShadow:'0 2px 6px rgba(0,0,0,0.06)',
    backdropFilter:'blur(4px)',
    WebkitBackdropFilter:'blur(4px)',
    fontSize:'14px',display:'inline-flex',alignItems:'center',justifyContent:'center',
    transition:'transform 0.15s, background 0.2s, color 0.2s, box-shadow 0.2s, border-color 0.2s'
  }
  const btnHoverEnter = (e)=>{
    e.currentTarget.style.background='#0d9488';
    e.currentTarget.style.color='#fff';
    e.currentTarget.style.borderColor='#0d9488';
    e.currentTarget.style.boxShadow='0 6px 18px rgba(13,148,136,0.45)';
    e.currentTarget.style.transform='translateY(-2px)';
  }
  const btnHoverLeave = (e)=>{
    e.currentTarget.style.background='rgba(255,255,255,0.7)';
    e.currentTarget.style.color='#0d9488';
    e.currentTarget.style.borderColor='rgba(13,148,136,0.25)';
    e.currentTarget.style.boxShadow='0 2px 6px rgba(0,0,0,0.06)';
    e.currentTarget.style.transform='translateY(0)';
  }

  // Render ผ่าน Portal ไปที่ document.body → หนีออกจาก subtree ของ modal-A
  // (modal-A ใช้ transform ใน animation → จะดักให้ position:fixed กลายเป็น relative ต่อ modal)
  return createPortal(
    <div style={{position:'fixed',right:pos.right,bottom:pos.bottom,display:'flex',flexDirection:'column',gap:'8px',zIndex}}>
      {canUp && (
        <button title="ขึ้นบนสุด" onClick={()=>scrollTo('up')} style={btn}
          onMouseEnter={btnHoverEnter} onMouseLeave={btnHoverLeave}>
          <i className="fa-solid fa-chevron-up"></i>
        </button>
      )}
      {canDown && (
        <button title="ลงล่างสุด" onClick={()=>scrollTo('down')} style={btn}
          onMouseEnter={btnHoverEnter} onMouseLeave={btnHoverLeave}>
          <i className="fa-solid fa-chevron-down"></i>
        </button>
      )}
    </div>,
    document.body
  )
}

// ── time helper (ใช้ข้าม domain: changelog, sessions ฯลฯ) — เฟส 1d ──
export function relTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60000);
  if (m < 1)  return 'เมื่อสักครู่';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} วันที่แล้ว`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} เดือนที่แล้ว`;
  return new Date(iso).toLocaleDateString('th-TH');
}

// ── avatar display helpers (ใช้ข้าม domain: changelog, admin, account, dashboard) — เฟส 1d ──
export function r2AvatarUrl(key, updatedAt) {
  if (!key) return null;
  const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_R2_AVATAR_URL) || 'https://img.tbjourney.care';
  const v = updatedAt ? new Date(updatedAt).getTime() : '';
  return `${base}/${key}?v=${v}`;
}
// ตัดคำนำหน้า (นาย/นาง/ภญ. ฯลฯ) — ถ้ามี 3 คำขึ้นไป เอา 2 คำท้าย (ชื่อ+นามสกุล) → key มาตรฐานเดียวทุกที่
export function normName(name) {
  let p = (name || '').trim().split(/\s+/).filter(Boolean);
  if (p.length > 2) p = p.slice(-2);
  return p.join(' ');
}
// ตัวอักษรย่อจากชื่อ (ตัดคำนำหน้าแล้ว)
export function nameInitials(name) {
  const p = normName(name).split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}
// คู่สี pastel (พื้นอ่อน + ตัวอักษรเข้ม) — hash จาก key (ควรเป็น user_id → สีคงที่ต่อคน)
export const AVATAR_PALETTE = [
  { bg: '#ccfbf1', fg: '#0f766e' }, { bg: '#fef3c7', fg: '#b45309' }, { bg: '#fce7f3', fg: '#be185d' },
  { bg: '#dbeafe', fg: '#1d4ed8' }, { bg: '#f3e8ff', fg: '#7e22ce' }, { bg: '#cffafe', fg: '#0e7490' },
  { bg: '#dcfce7', fg: '#15803d' }, { bg: '#ffedd5', fg: '#c2410c' }, { bg: '#fee2e2', fg: '#b91c1c' },
  { bg: '#e0e7ff', fg: '#4338ca' }, { bg: '#e0f2fe', fg: '#0369a1' }, { bg: '#fef9c3', fg: '#a16207' },
];
export function colorFromName(key) {
  const s = (key == null ? '' : String(key)).toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}
// วงกลม avatar ใช้ซ้ำได้ — มีรูป → แสดงรูป · ไม่มี/รูปเสีย → ตัวอักษรย่อ
export function AvatarCircle({ urlKey, updatedAt, fallback, name, colorKey, size = 32, fontSize, bg, onClick, title, style }) {
  const [err, setErr] = React.useState(false);
  React.useEffect(() => { setErr(false); }, [urlKey, updatedAt]);   // เปลี่ยนรูป → reset error
  const url = !err ? r2AvatarUrl(urlKey, updatedAt) : null;
  const fs = fontSize || Math.max(8, Math.round(size * 0.36));
  const key = (colorKey != null && colorKey !== '') ? String(colorKey) : normName(name || fallback || '');
  const pair = colorFromName(key);
  return (
    <div onClick={onClick} title={title}
      style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: bg || pair.bg, color: bg ? '#fff' : pair.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: fs, flexShrink: 0, cursor: onClick ? 'pointer' : 'default', ...(style || {}) }}>
      {url ? <img src={url} onError={() => setErr(true)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (fallback || '?')}
    </div>
  );
}

// ── โหลด <img> จาก src (Promise) ────────────────────────────────────────────
// ใช้ร่วมข้าม domain: avatar crop (cropToWebp/resizeToWebp ใน shell) + รูปผู้ป่วย (compressToWebp ใน parts/patient-images)
// ย้ายเข้า shared.jsx เฟส 5 (เดิมอยู่ tb-monolith.jsx) — โค้ดเดิม ไม่แก้ logic
export function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';   // ให้ดึงรูปจาก R2 มาวาด canvas ได้ (ใช้ตอน "ครอบใหม่" จากรูปต้นฉบับ)
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ── AvatarLightbox — ดูรูปเต็มจอ (ซูม/ลาก/สไลด์) ────────────────────────────
// ใช้ร่วมข้าม domain: รูปผู้ป่วย (parts/patient-images) + avatar (UserProfileModal ใน shell → parts/account เฟส 6)
// ย้ายเข้า shared.jsx เฟส 5 (เดิมอยู่ tb-monolith.jsx) — โค้ดเดิม ไม่แก้ logic · เติม export หน้า function
export function AvatarLightbox({ src, thumb, originRect, info, onExpire, onClose, hasPrev, hasNext, onPrev, onNext, menuActions }) {
  const [open, setOpen]       = React.useState(false);
  const [settled, setSettled] = React.useState(false); // เปิดเสร็จแล้ว → สลับ transition ซูมให้ไว
  const [scale, setScale]     = React.useState(1);
  const [tx, setTx]           = React.useState(0);
  const [ty, setTy]           = React.useState(0);
  const [rot, setRot]         = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);
  const [zoomMenu, setZoomMenu] = React.useState(false);
  const [renderMenu, setRenderMenu] = React.useState(false);
  const [actionMenu, setActionMenu] = React.useState(false);
  const [imgRendering, setImgRendering] = React.useState('auto'); // auto | pixelated | crisp-edges (โหมดลบรอยหยัก)
  const [showHelp, setShowHelp] = React.useState(false);
  const [hintVisible, setHintVisible] = React.useState(true);     // ป้ายบอกวิธีใช้ตอนเปิด (จางเองใน 4 วิ)
  const [noteEditing, setNoteEditing] = React.useState(false);    // แก้คำอธิบาย inline (คลิกพิมพ์ได้เลย)
  const [noteVal, setNoteVal] = React.useState('');
  const [noteSaving, setNoteSaving] = React.useState(false);
  const [dim, setDim]     = React.useState(null);   // {w,h} ขนาดภาพจริง
  const [bytes, setBytes] = React.useState(info?.sizeBytes ?? null);
  const [curSrc, setCurSrc] = React.useState(src);          // URL รูปเต็ม (เปลี่ยนได้ถ้าลิงก์หมดอายุ)
  const [fullLoaded, setFullLoaded] = React.useState(false);// รูปเต็มโหลดเสร็จยัง
  const drag = React.useRef(null);
  const touch = React.useRef(null);
  const triedRefresh = React.useRef(false);
  // เลื่อนรูป (ลูกศร) → รีเซ็ตซูม/หมุน + โหลดรูปใหม่ (ไม่ remount → สลับลื่น)
  React.useEffect(() => {
    setScale(1); setTx(0); setTy(0); setRot(0); setFullLoaded(false); setCurSrc(src); setBytes(info?.sizeBytes ?? null); setNoteEditing(false); triedRefresh.current = false;
  }, [src]);
  const doClose = () => { setOpen(false); setTimeout(onClose, 320); };
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const stop = (e) => e && e.stopPropagation();
  const closeMenus = () => { setShowHelp(false); setRenderMenu(false); setZoomMenu(false); setActionMenu(false); setShowInfo(false); }; // คลิกที่รูป = ปิด popup ทั้งหมด
  const dismissPopups = () => { setShowHelp(false); setRenderMenu(false); setZoomMenu(false); setActionMenu(false); }; // กดฟังก์ชันอื่น = ปิดเมนูที่ค้าง (ไม่แตะ info)
  // เปิดเมนูลอยตัวใดตัวหนึ่ง → ปิดที่เหลือ (ไม่ทับกัน) · แผง info แยกต่างหาก
  const toggleMenu = (which) => {
    setShowHelp(which==='help' ? (v=>!v) : false);
    setZoomMenu(which==='zoom' ? (v=>!v) : false);
    setRenderMenu(which==='render' ? (v=>!v) : false);
    setActionMenu(which==='action' ? (v=>!v) : false);
  };
  // เปิดแผง info → ดันพื้นที่รูปไปทางซ้าย (ไม่ทับรูป) · พอดีจอ + อัตราพิกเซลจริง
  const panelW = 320;
  const availW = showInfo ? Math.max(360, vw - panelW) : vw;
  const cx = availW / 2;
  const maxW = availW * 0.92, maxH = vh * 0.84;
  const fitRatio = dim ? Math.min(maxW / dim.w, maxH / dim.h, 1) : 1;
  // ซูม: ล้อ/นิ้ว ลึกได้ถึง ~8000% (เห็นพิกเซล) · ปุ่ม/แถบเลือก สูงสุด 4000%
  const clamp = (s) => Math.max(0.1 / fitRatio, Math.min(80 / fitRatio, s));

  // ── ขอบเขตการลาก (กันรูปหลุดออกนอกจอ) ──
  const baseSize = () => {
    if (!dim) return { w: maxW, h: maxH };
    const r = Math.min(maxW / dim.w, maxH / dim.h, 1);
    return { w: dim.w * r, h: dim.h * r };
  };
  const clampPan = (x, y, s) => {
    const b = baseSize();
    const limX = Math.max(0, (b.w * s) / 2 - availW / 2);
    const limY = Math.max(0, (b.h * s) / 2 - vh / 2);
    return [Math.max(-limX, Math.min(limX, x)), Math.max(-limY, Math.min(limY, y))];
  };
  // ── ซูม โดยยึด "จุด" (เมาส์/ดับเบิลคลิก) ให้อยู่กับที่ + ไม่ลอยตอนสุดสเกล ──
  const zoomAt = (clientX, clientY, ns) => {
    const k = ns / scale;
    const mx = clientX - cx, my = clientY - vh / 2;
    let nx, ny;
    if (ns <= 1.0001) { nx = 0; ny = 0; }                       // ย่อจนพอดี → กึ่งกลางเป๊ะ
    else { nx = tx * k + mx * (1 - k); ny = ty * k + my * (1 - k); } // k=1 (สุดสเกล) → ไม่ขยับ = ไม่ลอย
    [nx, ny] = clampPan(nx, ny, ns);
    setScale(ns); setTx(nx); setTy(ny);
  };
  const onWheel = (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, clamp(scale * (e.deltaY < 0 ? 1.12 : 0.89))); };
  const onDblClick = (e) => { stop(e); if (scale > 1.05) fit(); else zoomAt(e.clientX, e.clientY, clamp(Math.max(2, 1 / fitRatio))); }; // ดับเบิลคลิก → ซูมเข้า (อย่างน้อย 200% หรือ 100% พิกเซลจริง) ↔ พอดีจอ
  const onMouseDown = (e) => { e.preventDefault(); closeMenus(); drag.current = { x: e.clientX, y: e.clientY, tx, ty }; setDragging(true); };
  const onMouseMove = (e) => {
    if (!drag.current) return;
    const [nx, ny] = clampPan(drag.current.tx + (e.clientX - drag.current.x), drag.current.ty + (e.clientY - drag.current.y), scale);
    setTx(nx); setTy(ny);
  };
  const endDrag = () => { drag.current = null; setDragging(false); };
  const fit = (e) => { stop(e); dismissPopups(); setScale(1); setTx(0); setTy(0); setRot(0); };
  const zoomTo = (s) => { const ns = clamp(s); const [nx, ny] = clampPan(0, 0, ns); setScale(ns); setTx(nx); setTy(ny); };
  // % จริง: scale=1 = "พอดีจอ" (รูปใหญ่อาจ ~30%) · 100% = 1:1 พิกเซลจริง
  const zoomToPct = (p) => { const ns = clamp((p / 100) / fitRatio); const [nx, ny] = clampPan(0, 0, ns); setScale(ns); setTx(nx); setTy(ny); };
  const pct = Math.round(scale * fitRatio * 100);
  // รูปเต็มโหลด error → ลิงก์อาจหมดอายุ → ขอใหม่ 1 ครั้ง
  const onFullError = () => {
    if (onExpire && !triedRefresh.current) {
      triedRefresh.current = true;
      Promise.resolve(onExpire()).then(u => { if (u) { setCurSrc(u); } }).catch(()=>{});
    }
  };
  // ── สัมผัส (มือถือ/แท็บเล็ต): สองนิ้ว = pinch zoom · นิ้วเดียว = เลื่อน ──
  const dist2 = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const mid2 = (t) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });
  const onTouchStart = (e) => {
    closeMenus();
    if (e.touches.length === 2) touch.current = { mode:'pinch', d: dist2(e.touches), s: scale };
    else if (e.touches.length === 1) touch.current = { mode:'pan', x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
  };
  const onTouchMove = (e) => {
    if (!touch.current) return;
    if (touch.current.mode === 'pinch' && e.touches.length === 2) {
      e.preventDefault();
      const m = mid2(e.touches);
      zoomAt(m.x, m.y, clamp(touch.current.s * (dist2(e.touches) / touch.current.d)));
    } else if (touch.current.mode === 'pan' && e.touches.length === 1) {
      e.preventDefault();
      const [nx, ny] = clampPan(touch.current.tx + (e.touches[0].clientX - touch.current.x), touch.current.ty + (e.touches[0].clientY - touch.current.y), scale);
      setTx(nx); setTy(ny);
    }
  };
  const onTouchEnd = (e) => {
    if (e.touches.length === 0) touch.current = null;
    else if (e.touches.length === 1) touch.current = { mode:'pan', x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
  };
  const RENDER_MODES = [
    { v:'auto',      icon:'fa-wand-magic-sparkles', label:'ภาพเนียน (Smooth)',     desc:'เกลี่ยสีให้นุ่ม (ค่าเริ่มต้น) — เหมาะดูรูปทั่วไป/CXR' },
    { v:'pixelated', icon:'fa-table-cells',         label:'พิกเซลดิบ (Pixelated)', desc:'ไม่เกลี่ยสี เห็นบล็อกพิกเซลจริง — เหมาะส่องรายละเอียดแบบเนิร์ด' },
  ];
  const curRender = RENDER_MODES.find(m => m.v === imgRendering) || RENDER_MODES[0];

  // ── เปิด (animation) + โหลดขนาดไฟล์ (เฉพาะ avatar ที่ไม่ได้ส่ง sizeBytes มา) ──
  React.useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
    const t = setTimeout(() => setSettled(true), 450);
    if (info?.sizeBytes == null) {
      // signed URL เติม query ไม่ได้ (ลายเซ็นพัง) → ทำเฉพาะ avatar (public URL)
      const metaUrl = src + (src.includes('?') ? '&' : '?') + '_meta=1';
      fetch(metaUrl).then(r => r.blob()).then(b => setBytes(b.size)).catch(()=>{});
    }
    return () => { cancelAnimationFrame(id); clearTimeout(t); };
  }, []);
  // ── คีย์บอร์ด (ผูกใหม่เมื่อ scale/ขอบเขตเลื่อนเปลี่ยน เพื่อใช้ค่าล่าสุด) ──
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') doClose();
      else if (e.key === '+' || e.key === '=') zoomTo(scale * 1.25);
      else if (e.key === '-' || e.key === '_') zoomTo(scale * 0.8);
      else if (e.key === '0') fit();
      else if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      else if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scale, hasPrev, hasNext]);
  // ป้ายบอกวิธีใช้ → จางหายเองใน 4 วิ
  React.useEffect(() => { const t = setTimeout(() => setHintVisible(false), 4000); return () => clearTimeout(t); }, []);

  // เปิด: ขยายจากตำแหน่งรูปเดิม (thumb/avatar) → เลื่อนลื่น
  let sx = 0, sy = 0, ss = 0.2;
  if (originRect) { sx = (originRect.left + originRect.width/2) - cx; sy = (originRect.top + originRect.height/2) - vh/2; ss = Math.max(0.12, Math.min(0.5, originRect.width / 520)); }
  const startT = `translate(-50%,-50%) translate(${sx}px,${sy}px) scale(${ss}) rotate(0deg)`;
  const liveT  = `translate(-50%,-50%) translate(${tx}px,${ty}px) scale(${scale}) rotate(${rot}deg)`;
  const imgTrans = (dragging
    ? 'opacity 0.3s ease'
    : (settled ? 'transform 0.18s ease-out, opacity 0.3s ease' : 'transform 0.42s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease')) + ', left 0.34s cubic-bezier(0.16,1,0.3,1)';
  const imgBase = { position:'absolute', top:'50%', left: cx + 'px', maxWidth: maxW + 'px', maxHeight: maxH + 'px', objectFit:'contain', userSelect:'none', boxShadow:'0 25px 80px rgba(0,0,0,0.6)' };
  const bar = { width:'40px',height:'40px',borderRadius:'10px',background:'rgba(255,255,255,0.12)',color:'#fff',border:'none',cursor:'pointer',fontSize:'15px',display:'flex',alignItems:'center',justifyContent:'center' };
  const fmtBytes = (b) => b==null ? '—' : (b<1024 ? b+' B' : b<1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(2)+' MB');
  // เคอร์เซอร์มือ (ขอบดำ + ไส้ขาว → เห็นชัดทั้งพื้นขาว/ดำ ไม่กลืน)
  const handCur = `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='32'%20height='32'%20viewBox='0%200%2024%2024'%20fill='white'%20stroke='black'%20stroke-width='1'%20stroke-linejoin='round'%3E%3Cpath%20d='M23%205.5V20c0%202.2-1.8%204-4%204h-7.3c-1.08%200-2.1-.43-2.85-1.19L1%2014.83s1.26-1.23%201.3-1.25c.22-.19.49-.29.79-.29.22%200%20.42.06.6.16.04.01%204.31%202.46%204.31%202.46V4c0-.83.67-1.5%201.5-1.5S11%203.17%2011%204v7h1V1.5c0-.83.67-1.5%201.5-1.5S15%20.67%2015%201.5V11h1V2.5c0-.83.67-1.5%201.5-1.5s1.5.67%201.5%201.5V11h1V5.5c0-.83.67-1.5%201.5-1.5s1.5.67%201.5%201.5z'/%3E%3C/svg%3E") 13 13, grab`;
  // มือกำ (ตอนลาก) — ขนาด/สไตล์เดียวกับมือเปิด (32px ขอบดำไส้ขาว) ให้ดูเป็นมือเดียวกัน
  const fistCur = `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='32'%20height='32'%20viewBox='0%200%2024%2024'%20fill='white'%20stroke='black'%20stroke-width='1'%20stroke-linejoin='round'%3E%3Cpath%20d='M7%209.5C7%208%208%207%209.5%207h4C16%207%2017%208.5%2017%2010v5c0%203-2%205.5-5.5%205.5h-1C8%2020.5%207%2019%206%2017.5l-2-3c-.6-.9-.3-2%20.6-2.4.7-.3%201.5-.1%202%20.5l.4.5V9.5z'/%3E%3C/svg%3E") 13 13, grabbing`;
  // ── minimap: รูปย่อมุมจอ + กรอบบอกว่ากำลังดูส่วนไหน (แสดงเมื่อซูมจนรูปใหญ่กว่าพื้นที่) ──
  const _b = baseSize();
  const dispW = _b.w * scale, dispH = _b.h * scale;
  const showMap = !!dim && (dispW > availW + 4 || dispH > maxH + 4);
  let mmW = 130, mmH = 130;
  if (dim) { const ar = dim.w / dim.h; if (ar >= 1) mmH = Math.round(130 / ar); else mmW = Math.round(130 * ar); }
  const fracW = Math.min(1, availW / dispW), fracH = Math.min(1, maxH / dispH);
  const rectW = mmW * fracW, rectH = mmH * fracH;
  const rectL = Math.max(0, Math.min(mmW - rectW, mmW/2 + (-tx/dispW)*mmW - rectW/2));
  const rectT = Math.max(0, Math.min(mmH - rectH, mmH/2 + (-ty/dispH)*mmH - rectH/2));
  return createPortal(
    <div onMouseMove={onMouseMove} onMouseUp={endDrag} onMouseLeave={endDrag}
      style={{position:'fixed',inset:0,zIndex:10001,background:`rgba(10,15,25,${open?0.95:0})`,transition:'background 0.32s ease',overflow:'hidden'}}>
      {/* คลิกพื้นหลัง = ปิด */}
      <div onClick={doClose} style={{position:'absolute',inset:0,cursor:'zoom-out'}}/>

      {/* แถบโหลดด้านบน — ระหว่างรอรูปเต็มโหลด */}
      {!fullLoaded && (
        <div style={{position:'fixed',top:0,left:0,right:0,height:'3px',background:'rgba(255,255,255,0.08)',overflow:'hidden',zIndex:6}}>
          <div className="tb-lb-bar" style={{height:'100%',background:'linear-gradient(90deg,#0d9488,#5eead4)'}}/>
        </div>
      )}

      {/* รูปย่อ (เบลอ) เป็น placeholder ระหว่างรอรูปเต็ม → กดแล้วเห็นภาพทันที */}
      {thumb && !fullLoaded && (
        <img src={thumb} alt="" draggable={false}
          style={{...imgBase, transform: open ? liveT : startT, opacity: open?1:0,
            transition:'transform 0.42s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease',
            filter:'blur(8px)', pointerEvents:'none'}}/>
      )}

      {/* รูปเต็ม */}
      <img src={curSrc} alt="" draggable={false}
        onLoad={e=>{ setDim({ w:e.target.naturalWidth, h:e.target.naturalHeight }); setFullLoaded(true); }}
        onError={onFullError}
        onWheel={onWheel} onMouseDown={onMouseDown} onClick={stop} onDoubleClick={onDblClick} onContextMenu={e=>e.preventDefault()}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{...imgBase, transform: open ? liveT : startT,
          opacity: (open && (fullLoaded || !thumb)) ? 1 : 0, transition: imgTrans,
          imageRendering: imgRendering, touchAction: 'none',
          cursor: dragging ? fistCur : handCur}}/>

      {/* minimap — รูปย่อ + กรอบบอกตำแหน่งที่ซูมดูอยู่ (มุมขวา ถัดจากปุ่ม · เลื่อนซ้ายเมื่อเปิด info) */}
      {showMap && (
        <div style={{position:'fixed',top:'78px',right:(showInfo?(panelW+18):18)+'px',width:mmW+'px',height:mmH+'px',borderRadius:'6px',overflow:'hidden',boxShadow:'0 6px 20px rgba(0,0,0,0.5)',border:'2px solid rgba(255,255,255,0.5)',opacity:open?1:0,transition:'opacity 0.3s, right 0.34s cubic-bezier(0.16,1,0.3,1)',zIndex:8,background:'#0b0f19',pointerEvents:'none'}}>
          <img src={thumb || curSrc} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.85}}/>
          <div style={{position:'absolute',left:rectL+'px',top:rectT+'px',width:rectW+'px',height:rectH+'px',border:'2px solid #14b8a6',background:'rgba(20,184,166,0.18)',boxSizing:'border-box'}}/>
        </div>
      )}

      {/* ลูกศรเลื่อนรูป ◀▶ */}
      {hasPrev && <button onClick={e=>{stop(e);onPrev();}} title="ก่อนหน้า (←)" style={{position:'fixed',top:'50%',left:'16px',transform:'translateY(-50%)',width:'48px',height:'48px',borderRadius:'50%',background:'rgba(17,24,39,0.7)',color:'#fff',border:'none',cursor:'pointer',fontSize:'18px',opacity:open?1:0,transition:'opacity 0.3s',zIndex:8}}><i className="fa-solid fa-chevron-left"></i></button>}
      {hasNext && <button onClick={e=>{stop(e);onNext();}} title="ถัดไป (→)" style={{position:'fixed',top:'50%',right:'16px',transform:'translateY(-50%)',width:'48px',height:'48px',borderRadius:'50%',background:'rgba(17,24,39,0.7)',color:'#fff',border:'none',cursor:'pointer',fontSize:'18px',opacity:open?1:0,transition:'opacity 0.3s',zIndex:8}}><i className="fa-solid fa-chevron-right"></i></button>}

      {/* ป้ายบอกวิธีใช้ (จางหายเองใน 4 วิ) */}
      <div style={{position:'fixed',top:'18px',left:'50%',transform:'translateX(-50%)',background:'rgba(17,24,39,0.82)',color:'#e5e7eb',fontSize:'12px',padding:'7px 14px',borderRadius:'999px',opacity:(open&&hintVisible)?1:0,transition:'opacity 0.4s',pointerEvents:'none',zIndex:8,whiteSpace:'nowrap',maxWidth:'92vw',overflow:'hidden',textOverflow:'ellipsis'}}>
        <i className="fa-solid fa-circle-info" style={{marginRight:'6px',color:'#5eead4'}}></i>สโครล = ซูม · ดับเบิลคลิก = ซูมเข้า/ออก · ลาก = เลื่อน · กดปุ่ม ? ดูทั้งหมด
      </div>

      {/* มุมขวาบน: ⋮ + ? + info + ปิด (พื้นหลังเข้ม → เห็นชัดบนรูปพื้นขาว) */}
      <div style={{position:'fixed',top:'18px',right:'18px',display:'flex',gap:'6px',opacity:open?1:0,transition:'opacity 0.3s',zIndex:8,background:'rgba(17,24,39,0.6)',backdropFilter:'blur(6px)',borderRadius:'14px',padding:'5px',boxShadow:'0 6px 20px rgba(0,0,0,0.35)'}}>
        {menuActions && menuActions.length>0 && (
          <div style={{position:'relative'}}>
            <button onClick={e=>{stop(e);toggleMenu('action');}} title="เพิ่มเติม" className="tb-lb-btn" style={{...bar, background: actionMenu?'rgba(13,148,136,0.85)':'rgba(255,255,255,0.12)'}}><i className="fa-solid fa-ellipsis-vertical"></i></button>
            {actionMenu && (
              <div onClick={stop} style={{position:'absolute',top:'48px',right:0,background:'rgba(17,24,39,0.98)',borderRadius:'12px',padding:'6px',boxShadow:'0 12px 30px rgba(0,0,0,0.5)',minWidth:'190px',display:'flex',flexDirection:'column'}}>
                {menuActions.map((a,i)=>(
                  <button key={i} onClick={e=>{stop(e);setActionMenu(false);a.onClick&&a.onClick();}}
                    style={{background:'transparent',color:a.danger?'#fca5a5':'#e5e7eb',border:'none',padding:'9px 12px',borderRadius:'7px',cursor:'pointer',fontSize:'13px',textAlign:'left',display:'flex',alignItems:'center',gap:'10px'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <i className={'fa-solid '+a.icon} style={{width:'16px'}}></i>{a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button onClick={e=>{stop(e);toggleMenu('help');}} title="วิธีใช้ / คีย์ลัด" className="tb-lb-btn" style={{...bar, background: showHelp?'rgba(13,148,136,0.85)':'rgba(255,255,255,0.12)'}}><i className="fa-solid fa-question"></i></button>
        <button onClick={e=>{stop(e);dismissPopups();setShowInfo(v=>!v);}} title="ข้อมูลรูป" className="tb-lb-btn" style={{...bar, background: showInfo?'rgba(13,148,136,0.85)':'rgba(255,255,255,0.12)'}}><i className="fa-solid fa-circle-info"></i></button>
        <button onClick={doClose} title="ปิด (Esc)" className="tb-lb-btn" style={bar}><i className="fa-solid fa-xmark"></i></button>
      </div>

      {/* แผงวิธีใช้ / คีย์ลัด */}
      {showHelp && (
        <div onClick={stop} style={{position:'fixed',top:'70px',right:'18px',width:'264px',background:'rgba(17,24,39,0.97)',borderRadius:'14px',padding:'14px 16px',boxShadow:'0 16px 40px rgba(0,0,0,0.5)',zIndex:9,color:'#e5e7eb'}}>
          <p style={{margin:'0 0 8px',fontWeight:700,fontSize:'13px',color:'#fff'}}><i className="fa-solid fa-keyboard" style={{marginRight:'6px',color:'#5eead4'}}></i>วิธีใช้ / คีย์ลัด</p>
          {[['สโครลเมาส์','ซูมเข้า/ออก ตามจุดเมาส์'],['ดับเบิลคลิก','ซูมเข้า/ออก ที่จุดนั้น'],['ลากเมาส์','เลื่อนรูป'],['สองนิ้ว','ซูม (จอสัมผัส)'],['+ / −','ซูมเข้า / ออก'],['0','พอดีหน้าจอ'],['← / →','รูปก่อนหน้า / ถัดไป'],['Esc','ปิด']].map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',gap:'10px',padding:'4px 0',fontSize:'12px'}}>
              <span style={{color:'#5eead4',fontWeight:700,flexShrink:0}}>{k}</span><span style={{color:'#cbd5e1',textAlign:'right'}}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* แผง info (nerd) — สไลด์เข้าจากขวา (mount ตลอด → animate ทั้งเข้า/ออก) */}
      <div onClick={stop} style={{position:'fixed',top:0,right:0,bottom:0,width:'312px',background:'#fff',boxShadow:'-12px 0 40px rgba(0,0,0,0.35)',overflowY:'auto',display:'flex',flexDirection:'column',zIndex:9,
        transform: showInfo ? 'translateX(0)' : 'translateX(106%)', transition:'transform 0.34s cubic-bezier(0.16,1,0.3,1)', pointerEvents: showInfo?'auto':'none'}}>
        <div style={{background:'linear-gradient(160deg,#0f766e,#14b8a6)',padding:'18px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <p style={{fontSize:'15px',fontWeight:700,margin:0,color:'#fff'}}><i className="fa-solid fa-circle-info" style={{marginRight:'8px'}}></i>ข้อมูลรูป</p>
          <button onClick={e=>{stop(e);setShowInfo(false);}} title="ปิด" style={{width:'30px',height:'30px',borderRadius:'8px',background:'rgba(255,255,255,0.22)',color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div style={{padding:'6px 20px 20px'}}>
          {/* คำอธิบาย — คลิกพิมพ์ได้เลย (เจ้าของ/admin) แบบ Google Photos */}
          {info && (info.noteEditable || info.note) && (
            <div style={{padding:'11px 0',borderBottom:'1px solid #f1f5f9'}}>
              <p style={{fontSize:'10px',color:'#9ca3af',margin:'0 0 4px',textTransform:'uppercase',letterSpacing:'0.5px'}}>คำอธิบาย</p>
              {noteEditing ? (
                <div>
                  <textarea value={noteVal} onChange={e=>setNoteVal(e.target.value)} autoFocus rows={3}
                    style={{width:'100%',padding:'8px 10px',borderRadius:'8px',border:'1px solid #5eead4',fontSize:'13px',color:'#0f766e',boxSizing:'border-box',resize:'vertical',fontFamily:'inherit',outline:'none'}}/>
                  <div style={{display:'flex',gap:'6px',marginTop:'6px'}}>
                    <button disabled={noteSaving} onClick={async()=>{ setNoteSaving(true); try { await info.onSaveNote(noteVal); setNoteEditing(false); } catch {} setNoteSaving(false); }} style={{flex:1,padding:'7px',borderRadius:'8px',background:'#0d9488',color:'#fff',border:'none',fontWeight:700,fontSize:'12px',cursor:'pointer'}}>{noteSaving?'กำลังบันทึก...':'บันทึก'}</button>
                    <button disabled={noteSaving} onClick={()=>setNoteEditing(false)} style={{flex:1,padding:'7px',borderRadius:'8px',background:'#f3f4f6',color:'#4b5563',border:'none',fontWeight:700,fontSize:'12px',cursor:'pointer'}}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <p onClick={()=>{ if(info.noteEditable){ setNoteVal(info.note||''); setNoteEditing(true); } }}
                  style={{fontSize:'13px',fontWeight:600,margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',color: info.note?'#0f766e':'#9ca3af', cursor: info.noteEditable?'text':'default'}}>
                  {info.note || (info.noteEditable ? 'คลิกเพื่อเพิ่มคำอธิบาย…' : '—')}
                </p>
              )}
            </div>
          )}
          {[
            ['ชื่อไฟล์', info && info.name ? info.name : '—'],
            ['ขนาดภาพ (หลังบีบ)', dim ? `${dim.w} × ${dim.h} px` : '—'],
            ...(info && info.origDimText ? [['ขนาดภาพต้นฉบับ', info.origDimText]] : []),
            ...(info && info.origText ? [['ไฟล์ต้นฉบับ', info.origText]] : []),
            ['ขนาดไฟล์ (หลังบีบ)', fmtBytes(bytes)],
            ...(info && info.reducePct != null ? [['บีบลดลง', info.reducePct + '%']] : []),
            ['ฟอร์แมต', (info && info.format) ? info.format : 'WebP · คุณภาพ 100%'],
            ['ซูมปัจจุบัน', pct + '%'],
            ['หมุน', (rot % 360) + '°'],
            ...(info && info.uploader ? [['อัปโหลดโดย', info.uploader]] : []),
            ...(info && info.device ? [['อัปโหลดจากอุปกรณ์', info.device]] : []),
            ['อัปเดตล่าสุด', info && info.updatedAt ? new Date(info.updatedAt).toLocaleString('th-TH') : '—'],
            ['แหล่งเก็บ', (info && info.storage) ? info.storage : 'Cloudflare R2 · img.tbjourney.care'],
          ].map(([k,v]) => (
            <div key={k} style={{padding:'11px 0',borderBottom:'1px solid #f1f5f9'}}>
              <p style={{fontSize:'10px',color:'#9ca3af',margin:'0 0 3px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{k}</p>
              <p style={{fontSize:'13px',color:'#0f766e',fontWeight:600,margin:0,wordBreak:'break-all'}}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* แถบควบคุมล่าง (สไตล์ Windows Photos) */}
      <div onClick={stop} style={{position:'fixed',bottom:'22px',left:'50%',transform:'translateX(-50%)',display:'flex',alignItems:'center',gap:'7px',background:'rgba(17,24,39,0.88)',backdropFilter:'blur(6px)',borderRadius:'14px',padding:'8px 12px',opacity:open?1:0,transition:'opacity 0.3s',boxShadow:'0 10px 30px rgba(0,0,0,0.4)',zIndex:8}}>
        <button onClick={e=>{stop(e);dismissPopups();setRot(r=>r-90);}} title="หมุนซ้าย" className="tb-lb-btn" style={bar}><i className="fa-solid fa-rotate-left"></i></button>
        <button onClick={e=>{stop(e);dismissPopups();setRot(r=>r+90);}} title="หมุนขวา" className="tb-lb-btn" style={bar}><i className="fa-solid fa-rotate-right"></i></button>
        <button onClick={fit} title="พอดีจอ (Fit to screen) · กด 0" className="tb-lb-btn" style={bar}><i className="fa-solid fa-expand"></i></button>
        <button onClick={e=>{stop(e);dismissPopups();zoomToPct(100);}} title="ขนาดจริง 1:1 (Actual size)" className="tb-lb-btn" style={{...bar,width:'auto',padding:'0 10px',fontSize:'12px',fontWeight:800}}>1:1</button>
        <div style={{width:'1px',height:'24px',background:'rgba(255,255,255,0.15)'}}/>
        <button onClick={e=>{stop(e);dismissPopups();zoomTo(scale*0.8);}} title="ย่อ (−)" className="tb-lb-btn" style={bar}><i className="fa-solid fa-magnifying-glass-minus"></i></button>
        <input type="range" min={10} max={4000} step={1} value={Math.min(4000,Math.max(10,pct))}
          onChange={e=>{stop(e);dismissPopups();zoomToPct(Number(e.target.value));}} onMouseDown={stop}
          title="เลื่อนปรับขนาด"
          style={{width:'130px',accentColor:'#14b8a6',cursor:'pointer'}}/>
        <button onClick={e=>{stop(e);dismissPopups();zoomTo(scale*1.25);}} title="ขยาย (+)" className="tb-lb-btn" style={bar}><i className="fa-solid fa-magnifying-glass-plus"></i></button>
        <div style={{width:'1px',height:'24px',background:'rgba(255,255,255,0.15)'}}/>
        <div style={{position:'relative'}}>
          <button onClick={e=>{stop(e);toggleMenu('zoom');}} title="เลือกขนาด" className="tb-lb-btn" style={{...bar,width:'auto',padding:'0 12px',fontSize:'13px',fontWeight:700,gap:'6px'}}>{pct}% <i className="fa-solid fa-chevron-down" style={{fontSize:'9px'}}></i></button>
          {zoomMenu && (
            <div style={{position:'absolute',bottom:'48px',right:'0',background:'rgba(17,24,39,0.98)',borderRadius:'10px',padding:'6px',boxShadow:'0 10px 30px rgba(0,0,0,0.5)',display:'flex',flexDirection:'column',minWidth:'92px'}}>
              {[4000,2000,1000,400,200,100,50,25,10].map(p => (
                <button key={p} onClick={e=>{stop(e);zoomToPct(p);setZoomMenu(false);}}
                  style={{background:pct===p?'rgba(13,148,136,0.6)':'transparent',color:'#fff',border:'none',padding:'7px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'13px',textAlign:'center'}}>{p}%</button>
              ))}
            </div>
          )}
        </div>
        <div style={{width:'1px',height:'24px',background:'rgba(255,255,255,0.15)'}}/>
        {/* โหมดลบรอยหยัก (เนิร์ด) */}
        <div style={{position:'relative'}}>
          <button onClick={e=>{stop(e);toggleMenu('render');}} title={'การแสดงผลตอนซูม: '+curRender.label+' — '+curRender.desc} className="tb-lb-btn" style={{...bar, background: imgRendering!=='auto'?'rgba(13,148,136,0.55)':'rgba(255,255,255,0.12)'}}><i className={'fa-solid '+curRender.icon}></i></button>
          {renderMenu && (
            <div style={{position:'absolute',bottom:'48px',right:'0',background:'rgba(17,24,39,0.98)',borderRadius:'10px',padding:'6px',boxShadow:'0 10px 30px rgba(0,0,0,0.5)',display:'flex',flexDirection:'column',minWidth:'160px'}}>
              <p style={{fontSize:'10px',color:'#94a3b8',margin:'4px 8px 6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>โหมดลบรอยหยัก</p>
              {RENDER_MODES.map(m=>(
                <button key={m.v} onClick={e=>{stop(e);setImgRendering(m.v);setRenderMenu(false);}} title={m.desc}
                  style={{background:imgRendering===m.v?'rgba(13,148,136,0.6)':'transparent',color:'#fff',border:'none',padding:'8px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'13px',textAlign:'left',display:'flex',alignItems:'center',gap:'9px'}}>
                  <i className={'fa-solid '+m.icon} style={{width:'15px',color:'#5eead4'}}></i>{m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── popup ยืนยันลบรูปโปรไฟล์ ──────────────────────────────────────────────
