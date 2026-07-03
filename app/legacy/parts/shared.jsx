'use client'
/**
 * parts/shared.jsx — primitive ที่ใช้ร่วมกันข้าม domain
 * (hook แอนิเมชัน modal, className ช่อง input, leaf UI ชิ้นเล็ก ๆ)
 * ทุก parts/* และ shell import จากที่นี่ได้
 *
 * ย้ายมาจาก tb-monolith.jsx (เฟส refactor 1b–1c) — โค้ดเดิม ไม่แก้ logic
 */
import * as React from 'react'

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
