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
