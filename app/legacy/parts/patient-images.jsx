'use client'
/**
 * parts/patient-images.jsx — domain: รูปภาพผู้ป่วย (patient images)
 * ย้ายจาก tb-monolith.jsx (เฟส 5) — โค้ดเดิม ไม่แก้ logic
 *   helpers : compressToWebp, putWithProgress, blobToDataURL, decodeImageToDataURL, isAnimatedGif,
 *             JustifiedGallery, fmtFileSize, mimeLabel, detectDevice, IMG_SORTS, imgInRange, imgSortCmp,
 *             patientImgInfo, PATIENT_IMG_TYPES, loadCache/saveCache/invalidateImgCaches, IMG_VIEW_SIZES, ImgViewToolbar
 *   viewers : CXRComparePanel, CXRCompareModal
 *   pages   : ImageTrashPage, PatientImagesTab, ImageLibraryPage
 *   hub     : TrashHub (สลับถังขยะ ผู้ป่วย/รูปภาพ) — เรียก TrashList จาก parts/misc (cross-part import แรกของโครงการ)
 * deps ภายนอก: loadImageEl (parts/shared — ใช้ร่วมกับ avatar crop) + TrashList (parts/misc)
 *              + React hooks + createPortal + window._sb · dynamic import heic-to/csp, utif
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import { loadImageEl, AvatarLightbox } from './shared'
import { TrashList } from './misc'
const { useState, useEffect, useRef, useCallback } = React

// ═══════════════ image helpers (ย้ายจากท้าย tb-monolith.jsx) ═══════════════
// บีบรูปผู้ป่วย (CXR/Lab) เป็น WebP คงสัดส่วน · cap 4096px (กัน Safari/iOS คืนภาพดำ) · คืน {blob, width, height}
async function compressToWebp(src, quality = 0.92, maxEdge = 4096) {
  const img = await loadImageEl(src);
  let w = img.naturalWidth, h = img.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(w, h));   // เกิน 4096 → ย่อ · ไม่เกิน → คงเดิม
  w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
  return { blob, width: w, height: h };
}
// อัปไฟล์ขึ้น R2 ด้วย XHR เพื่อรายงาน % ความคืบหน้า (fetch รายงาน upload progress ไม่ได้)
function putWithProgress(url, blob, onProgress, mime = 'image/webp') {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('content-type', mime);
    if (xhr.upload) xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error('อัปโหลดไม่สำเร็จ (' + xhr.status + ')'));
    xhr.onerror = () => reject(new Error('อัปโหลดไม่สำเร็จ — เครือข่ายมีปัญหา'));
    xhr.send(blob);
  });
}
function blobToDataURL(blob) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); });
}
// แปลงไฟล์รูปทุกชนิดที่รองรับ → dataURL ที่ canvas วาดได้ (HEIC/HEIF→heic2any · TIFF→UTIF · อื่นๆ เบราว์เซอร์อ่านเอง)
// โหลด lib เฉพาะตอนเจอไฟล์นั้น (dynamic import → ไม่ถ่วง bundle)
async function decodeImageToDataURL(file) {
  const name = (file.name || '').toLowerCase();
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/.test(name);
  const isTiff = file.type === 'image/tiff' || /\.(tif|tiff)$/.test(name);
  if (isHeic) {
    try {
      // heic-to/csp = ตัวถอดรหัสที่ไม่ใช้ eval/new Function → ใช้แค่ wasm-unsafe-eval (CSP ยังเข้ม ไม่ต้องเปิด unsafe-eval)
      const { heicTo } = await import('heic-to/csp');
      const out = await Promise.race([
        heicTo({ blob: file, type: 'image/png' }),   // PNG = lossless → เหลือ lossy แค่ตอนเป็น WebP รอบเดียว
        new Promise((_, rej) => setTimeout(() => rej(new Error('ถอดรหัส HEIC นานเกิน 60 วิ (timeout)')), 60000)),
      ]);
      return await blobToDataURL(out);
    } catch (e) {
      console.error('[HEIC decode] failed:', e);
      throw new Error('เปิดไฟล์ HEIC ไม่ได้: ' + (e && e.message ? e.message : e) + ' — ลองแปลงเป็น JPG ก่อนอัป');
    }
  }
  if (isTiff) {
    const mod = await import('utif'); const UTIF = mod.default || mod;
    const buf = await file.arrayBuffer();
    const ifds = UTIF.decode(buf);
    UTIF.decodeImage(buf, ifds[0]);
    const rgba = UTIF.toRGBA8(ifds[0]);
    const cv = document.createElement('canvas');
    cv.width = ifds[0].width; cv.height = ifds[0].height;
    const ctx = cv.getContext('2d');
    const imgData = ctx.createImageData(ifds[0].width, ifds[0].height);
    imgData.data.set(rgba);
    ctx.putImageData(imgData, 0, 0);
    return cv.toDataURL('image/png');
  }
  return await blobToDataURL(file);   // png/jpeg/webp/avif/gif/bmp — เบราว์เซอร์ decode เอง
}
// ตรวจว่า GIF เคลื่อนไหว (มี Graphic Control Extension ≥ 2 เฟรม)
async function isAnimatedGif(file) {
  if (!(file.type === 'image/gif' || /\.gif$/i.test(file.name || ''))) return false;
  const b = new Uint8Array(await file.arrayBuffer());
  let count = 0;
  for (let i = 0; i < b.length - 3; i++) {
    if (b[i] === 0x21 && b[i+1] === 0xF9 && b[i+2] === 0x04) { count++; if (count > 1) return true; }
  }
  return false;
}
// แกลเลอรีแบบ Google Photos (justified rows) — รูปคงสัดส่วนจริง เรียงเต็มแถวพอดี ไม่ครอป
function JustifiedGallery({ items, targetHeight = 190, gap = 8, renderItem }) {
  const ref = React.useRef(null);
  const [cw, setCw] = React.useState(0);
  const posRef = React.useRef(new Map());   // id → ตำแหน่งเดิม (สำหรับ FLIP animate ตอนเลื่อน)
  const cwRef = React.useRef(0);            // ความกว้างล่าสุด — ใช้เช็คว่าเป็น resize (ยุบ sidebar) จะได้ไม่ FLIP
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const update = () => setCw(el.clientWidth);
    update();
    let ro; if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(update); ro.observe(el); }
    window.addEventListener('resize', update);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  // FLIP: รูปลบ/เพิ่ม → รูปที่เหลือเลื่อนนุ่มๆ ไปตำแหน่งใหม่ (ไม่กระโดด)
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const widthChanged = cwRef.current !== cw; cwRef.current = cw;   // resize/ยุบ sidebar → ไหลตามความกว้าง ไม่ FLIP (ไม่เด้ง)
    const nodes = el.querySelectorAll('[data-flip-id]');
    const present = new Set();
    nodes.forEach(node => {
      const id = node.getAttribute('data-flip-id'); present.add(id);
      const nr = node.getBoundingClientRect();
      const old = posRef.current.get(id);
      if (old && !widthChanged) {
        const dx = old.left - nr.left, dy = old.top - nr.top;
        if (dx || dy) {
          node.style.transition = 'none';
          node.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
          requestAnimationFrame(() => { node.style.transition = 'transform 0.32s cubic-bezier(0.16,1,0.3,1)'; node.style.transform = ''; });
        }
      }
      posRef.current.set(id, nr);
    });
    for (const k of Array.from(posRef.current.keys())) if (!present.has(k)) posRef.current.delete(k);
  });
  const rows = [];
  if (cw > 0) {
    let row = [], rowRatio = 0;
    const maxRatio = (cw - gap) / targetHeight;
    for (const it of items) {
      const r = (it.width && it.height) ? (it.width / it.height) : 1;
      row.push({ it, r }); rowRatio += r;
      if (rowRatio >= maxRatio) { rows.push(row); row = []; rowRatio = 0; }
    }
    if (row.length) rows.push(row);
  }
  return (
    <div ref={ref}>
      {rows.map((row, ri) => {
        const last = ri === rows.length - 1;
        const totalR = row.reduce((s, x) => s + x.r, 0);
        const avail = cw - gap * (row.length - 1);
        let h = avail / totalR;
        if (last && h > targetHeight * 1.25) h = targetHeight;   // แถวสุดท้ายไม่ยืดเกิน
        return (
          <div key={ri} style={{ display: 'flex', gap: gap + 'px', marginBottom: gap + 'px' }}>
            {row.map(({ it, r }) => (
              <div key={it.id} data-flip-id={it.id} style={{ width: Math.floor(h * r) + 'px', height: Math.floor(h) + 'px', flexShrink: 0 }}>
                {renderItem(it)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
// helper จัดข้อมูลรูปผู้ป่วยสำหรับแผง info ใน lightbox
function fmtFileSize(b){ return b==null?'—':(b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(2)+' MB'); }
function mimeLabel(m){ if(!m) return 'ไฟล์รูป'; const s=String(m).split('/').pop().toUpperCase(); return ({JPEG:'JPEG',PNG:'PNG',WEBP:'WebP',BMP:'BMP',GIF:'GIF'})[s]||s; }
// ตรวจอุปกรณ์ที่อัปรูป (จาก userAgent) → แสดงในข้อมูลรูป
// หมายเหตุ: เบราว์เซอร์ไม่บอก "รุ่นคอม" (ความเป็นส่วนตัว) · iPhone บอกได้แค่ "iPhone" · Android บางรุ่นมีชื่อรุ่นใน UA
function detectDevice(){
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  let os = 'อื่นๆ', model = '';
  if (/iPhone/i.test(ua)) os = 'iPhone (iOS)';
  else if (/iPad/i.test(ua)) os = 'iPad (iPadOS)';
  else if (/Android/i.test(ua)) { os = 'Android'; const m = ua.match(/Android[^;]*;\s*([^);]+?)(?:\s+Build|\))/i); if (m) model = m[1].trim(); }
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac';
  else if (/Windows/i.test(ua)) os = 'Windows (PC)';
  let br = '';
  if (/Edg\//.test(ua)) br = 'Edge';
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) br = 'Chrome';
  else if (/Firefox\//.test(ua)) br = 'Firefox';
  else if (/Safari\//.test(ua)) br = 'Safari';
  return os + (model ? (' · ' + model) : '') + (br ? (' · ' + br) : '');
}
// ตัวเรียงรูป (วันที่/ขนาด) — ใช้ทั้งแท็บผู้ป่วย + คลังรูป
const IMG_SORTS = [['new','ใหม่→เก่า'],['old','เก่า→ใหม่'],['big','ใหญ่→เล็ก'],['small','เล็ก→ใหญ่']];
function imgInRange(im, from, to){
  if (from && new Date(im.uploaded_at) < new Date(from + 'T00:00:00')) return false;
  if (to && new Date(im.uploaded_at) > new Date(to + 'T23:59:59')) return false;
  return true;
}
function imgSortCmp(sort){
  return (a,b)=>{
    if (sort==='old')   return new Date(a.uploaded_at)-new Date(b.uploaded_at);
    if (sort==='big')   return (b.size_bytes||0)-(a.size_bytes||0);
    if (sort==='small') return (a.size_bytes||0)-(b.size_bytes||0);
    return new Date(b.uploaded_at)-new Date(a.uploaded_at);  // new (ค่าเริ่มต้น)
  };
}
function patientImgInfo(im, meta, name){
  const isGif = im.mime === 'image/gif';
  const qNum = im.type==='cxr' ? 92 : 87;   // คุณภาพตามหมวด (เปลี่ยนหมวด = แสดงตามหมวดใหม่ทันที)
  const reducePct = (!isGif && im.orig_size_bytes && im.size_bytes) ? Math.max(0, Math.round((1 - im.size_bytes/im.orig_size_bytes)*100)) : null;
  return {
    name,
    updatedAt: im.uploaded_at,
    sizeBytes: im.size_bytes,
    format: isGif ? 'GIF เคลื่อนไหว (เก็บต้นฉบับ)' : ('WebP · คุณภาพ ' + qNum + '%'),
    origText: im.orig_size_bytes ? (mimeLabel(im.orig_mime) + ' · ' + fmtFileSize(im.orig_size_bytes)) : null,
    origDimText: im.orig_width ? (im.orig_width + ' × ' + im.orig_height + ' px') : null,
    reducePct,
    device: im.device || null,
    uploader: im.uploader_name || null,
    note: im.note || null,
    storage: 'Cloudflare R2 · ส่วนตัว (signed URL)',
  };
}

// ═══════════════ image meta / cache / viewers / pages / hub ═══════════════
const PATIENT_IMG_TYPES = {
  cxr:      { label: 'CXR',     bg: '#dbeafe', fg: '#1d4ed8' },
  lab:      { label: 'Lab',     bg: '#dcfce7', fg: '#15803d' },
  document: { label: 'เอกสาร',  bg: '#fef3c7', fg: '#b45309' },
  other:    { label: 'อื่นๆ',   bg: '#f3f4f6', fg: '#4b5563' },
};

// ── popup เทียบ CXR 2 ช่วงเวลา (side-by-side, ซูม/ลากแยกกัน) — v1 หยาบ ──────────
function CXRComparePanel({ src, dateLabel }) {
  const [scale, setScale] = React.useState(1);
  const [tx, setTx] = React.useState(0);
  const [ty, setTy] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const boxRef = React.useRef(null);
  const drag = React.useRef(null);
  const clamp = (s) => Math.max(0.3, Math.min(8, s));
  // ซูมยึดจุดเมาส์ + ไม่ลอยตอนสุดสเกล (ระบบเดียวกับตัวดูรูปหลัก)
  const zoomAt = (clientX, clientY, ns) => {
    const el = boxRef.current; if (!el) { setScale(ns); return; }
    const r = el.getBoundingClientRect();
    const k = ns / scale;
    const mx = clientX - (r.left + r.width / 2), my = clientY - (r.top + r.height / 2);
    let nx, ny;
    if (ns <= 1.0001) { nx = 0; ny = 0; }
    else { nx = tx * k + mx * (1 - k); ny = ty * k + my * (1 - k); }
    setScale(ns); setTx(nx); setTy(ny);
  };
  const reset = () => { setScale(1); setTx(0); setTy(0); };
  return (
    <div style={{flex:1,minWidth:0,position:'relative',background:'#0b0f19',borderRadius:'12px',overflow:'hidden',display:'flex',flexDirection:'column'}}>
      <div ref={boxRef} style={{flex:1,position:'relative',overflow:'hidden',cursor: dragging?'grabbing':'grab'}}
        onWheel={e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,clamp(scale*(e.deltaY<0?1.12:0.89)));}}
        onDoubleClick={e=>{ if(scale>1.2) reset(); else zoomAt(e.clientX,e.clientY,2.5); }}
        onMouseDown={e=>{e.preventDefault();drag.current={x:e.clientX,y:e.clientY,tx,ty};setDragging(true);}}
        onMouseMove={e=>{if(!drag.current)return;setTx(drag.current.tx+(e.clientX-drag.current.x));setTy(drag.current.ty+(e.clientY-drag.current.y));}}
        onMouseUp={()=>{drag.current=null;setDragging(false);}} onMouseLeave={()=>{drag.current=null;setDragging(false);}}>
        <img src={src} alt="" draggable={false} onContextMenu={e=>e.preventDefault()}
          style={{position:'absolute',top:'50%',left:'50%',maxWidth:'100%',maxHeight:'100%',objectFit:'contain',userSelect:'none',transform:`translate(-50%,-50%) translate(${tx}px,${ty}px) scale(${scale})`,transition: dragging?'none':'transform 0.15s ease-out'}}/>
      </div>
      <div style={{padding:'6px 10px',background:'rgba(255,255,255,0.06)',color:'#cbd5e1',fontSize:'12px',textAlign:'center',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span>{dateLabel} · <span style={{color:'#94a3b8'}}>สโครลซูม · ดับเบิลคลิก</span></span>
        <button onClick={reset} style={{fontSize:'11px',background:'rgba(255,255,255,0.12)',color:'#fff',border:'none',borderRadius:'6px',padding:'3px 8px',cursor:'pointer'}}>รีเซ็ต</button>
      </div>
    </div>
  );
}
function CXRCompareModal({ left, right, onClose }) {
  return createPortal(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:10001,background:'rgba(10,15,25,0.95)',display:'flex',flexDirection:'column',padding:'20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}} onClick={e=>e.stopPropagation()}>
        <p style={{color:'#fff',fontWeight:700,fontSize:'15px',margin:0}}><i className="fa-solid fa-images" style={{marginRight:'8px'}}></i>เทียบ CXR ก่อน-หลัง</p>
        <button onClick={onClose} title="ปิด" style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(255,255,255,0.16)',color:'#fff',border:'none',cursor:'pointer',fontSize:'18px'}}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div onClick={e=>e.stopPropagation()} style={{flex:1,display:'flex',gap:'12px',minHeight:0}}>
        <CXRComparePanel src={left.src} dateLabel={left.label}/>
        <CXRComparePanel src={right.src} dateLabel={right.label}/>
      </div>
    </div>,
    document.body
  );
}

// cache รูป (localStorage — อยู่ข้ามรีเฟรช · ใช้ลิงก์เดิม เบราว์เซอร์ cache ทัมเนลได้)
// สด <5นาที = ไม่ยิงซ้ำเลย · เก่า 5นาที-2ชม. = โชว์ทันที + revalidate เงียบ · >2ชม. = โหลดใหม่
const CACHE_TTL = 300000;       // 5 นาที
function loadCache(key){ try { const s = localStorage.getItem(key); if (s) { const o = JSON.parse(s); if (Date.now() - o.ts < 7200000) return o; } } catch {} return null; }
function saveCache(key, data){ try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {} }
function invalidateImgCaches(){ try { localStorage.removeItem('tb_libimg'); for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.indexOf('tb_patimg_') === 0) localStorage.removeItem(k); } } catch {} }
// ── แท็บรูปภาพในโปรไฟล์ผู้ป่วย (CXR/Lab/Document) ───────────────────────────
// ── ระบบมุมมองรูป (การ์ด/แถว + ขนาด เล็ก/กลาง/ใหญ่) ใช้ร่วมกันทุกคลังรูป ──────
const IMG_VIEW_SIZES = [
  { label:'เล็ก', card:120, thumb:44, jh:120 },   // jh = ความสูงแกลเลอรี justified (โหมดการ์ด)
  { label:'กลาง', card:168, thumb:56, jh:170 },
  { label:'ใหญ่', card:230, thumb:76, jh:240 },
];
function ImgViewToolbar({ mode, setMode, size, setSize }) {
  const btn = (on) => ({width:'34px',height:'30px',border:'none',background:on?'#0d9488':'#fff',color:on?'#fff':'#6b7280',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'});
  return (
    <div style={{display:'inline-flex',border:'1px solid #e5e7eb',borderRadius:'8px',overflow:'hidden'}}>
      <button title="รูปเล็ก" onClick={()=>{setMode('card');setSize(0);}} style={btn(mode==='card'&&size===0)}><i className="fa-solid fa-image" style={{fontSize:'10px'}}></i></button>
      <button title="รูปกลาง" onClick={()=>{setMode('card');setSize(1);}} style={btn(mode==='card'&&size===1)}><i className="fa-solid fa-image" style={{fontSize:'13px'}}></i></button>
      <button title="รูปใหญ่" onClick={()=>{setMode('card');setSize(2);}} style={btn(mode==='card'&&size===2)}><i className="fa-solid fa-image" style={{fontSize:'17px'}}></i></button>
      <button title="รายการ" onClick={()=>setMode('row')} style={{...btn(mode==='row'),borderLeft:'1px solid #e5e7eb'}}><i className="fa-solid fa-list" style={{fontSize:'14px'}}></i></button>
    </div>
  );
}

// ── ถังขยะรูปรวมทุกผู้ป่วย (จัดกลุ่มตามผู้ป่วย + กรอง + มุมมอง · กู้คืน/ลบถาวร = แอดมิน) ──
function ImageTrashPage({ currentUser, isAdmin }) {
  const [imgs, setImgs] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr]   = React.useState('');
  const [q, setQ]       = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('expiry');   // expiry = ใกล้ลบถาวรก่อน
  const [pSort, setPSort] = React.useState('name-asc');       // เรียงกลุ่มผู้ป่วย: name(ชื่อ) / hn
  const [mode, setMode] = React.useState('card');
  const [size, setSize] = React.useState(1);
  const [lightbox, setLightbox] = React.useState(null);
  const [restoreT, setRestoreT] = React.useState(null);
  const [hardT, setHardT]       = React.useState(null);
  const [hnInput, setHnInput]   = React.useState('');
  const [hardCheck, setHardCheck] = React.useState(false);
  const [hardStep2, setHardStep2] = React.useState(false);   // ยืนยันซ้ำก่อนลบถาวรจริง

  const load = React.useCallback(async () => {
    setErr('');
    try {
      const r = await fetch('/api/patient/images/all?trash=1');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'โหลดถังขยะไม่สำเร็จ');
      setImgs(d.images || []);
    } catch (e) { setErr(e.message); setImgs([]); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const daysLeft = (delAt) => { if (!delAt) return 60; const el = Math.floor((Date.now() - new Date(delAt).getTime()) / 86400000); return Math.max(0, 60 - el); };

  const doRestore = () => {   // optimistic: หายทันที + กู้คืนจริงเบื้องหลัง
    if (!restoreT) return; const id = restoreT.id;
    setImgs(a => (a||[]).filter(x => x.id !== id)); invalidateImgCaches(); setRestoreT(null); setLightbox(null); setErr('');
    fetch('/api/patient/images/' + id + '/restore', { method: 'POST' })
      .then(r => { if (!r.ok) { setErr('กู้คืนไม่สำเร็จ'); load(); } })
      .catch(() => { setErr('กู้คืนไม่สำเร็จ'); load(); });
  };
  const doHard = () => {   // optimistic: หายทันที + ลบจริงเบื้องหลัง
    if (!hardT) return;
    if (hnInput.trim() !== String(hardT.patient_hn || '') || !hardCheck) return;   // ต้องพิมพ์ HN ตรง + ติ๊ก
    const id = hardT.id;
    setImgs(a => (a||[]).filter(x => x.id !== id)); setHardT(null); setHardStep2(false); setLightbox(null); setErr('');
    fetch('/api/patient/images/' + id + '/hard', { method: 'POST' })
      .then(r => { if (!r.ok) { setErr('ลบถาวรไม่สำเร็จ'); load(); } })
      .catch(() => { setErr('ลบถาวรไม่สำเร็จ'); load(); });
  };

  const ql = q.trim().toLowerCase();
  const filtered = (imgs||[]).filter(im =>
    (typeFilter==='all' || im.type===typeFilter) &&
    (!ql || (im.patient_name||'').toLowerCase().includes(ql) || (im.patient_hn||'').toLowerCase().includes(ql)));
  const sorted = [...filtered].sort((a,b)=> sortBy==='expiry'
    ? new Date(a.deleted_at||0) - new Date(b.deleted_at||0)   // เก่าสุด = ใกล้ลบถาวรสุด → บนสุด
    : new Date(b.deleted_at||0) - new Date(a.deleted_at||0));  // ลบล่าสุดก่อน
  const groups = {};
  sorted.forEach(im => { const k = im.patient_id; if (!groups[k]) groups[k] = { name: im.patient_name, hn: im.patient_hn, items: [] }; groups[k].items.push(im); });
  const groupEntries = Object.entries(groups).sort((a,b)=>{
    const [pf,pd] = pSort.split('-');
    const r = pf==='hn'
      ? String(a[1].hn||'').localeCompare(String(b[1].hn||''), undefined, {numeric:true})
      : (a[1].name||'').localeCompare(b[1].name||'', 'th');
    return pd==='desc' ? -r : r;
  });
  const thumb = IMG_VIEW_SIZES[size].thumb;

  const actionsFor = (im, compact) => isAdmin ? (
    <div style={{display:'flex',gap:'6px'}}>
      <button title="กู้คืน" onClick={(e)=>{e.stopPropagation();setRestoreT(im);}} style={{flex:1,padding:'6px 4px',borderRadius:'8px',background:'#0d9488',color:'#fff',fontWeight:700,fontSize:'11px',border:'none',cursor:'pointer',whiteSpace:'nowrap',overflow:'hidden'}}><i className="fa-solid fa-rotate-left" style={{marginRight:compact?0:'4px'}}></i>{!compact && 'กู้คืน'}</button>
      <button title="ลบถาวร" onClick={(e)=>{e.stopPropagation();setHnInput('');setHardCheck(false);setHardStep2(false);setHardT(im);}} style={{flex:1,padding:'6px 4px',borderRadius:'8px',background:'#fee2e2',color:'#dc2626',fontWeight:700,fontSize:'11px',border:'none',cursor:'pointer',whiteSpace:'nowrap',overflow:'hidden'}}><i className="fa-solid fa-fire" style={{marginRight:compact?0:'4px'}}></i>{!compact && 'ลบถาวร'}</button>
    </div>
  ) : <p style={{fontSize:'10px',color:'#9ca3af',margin:0,textAlign:'center'}}>กู้คืน / ลบถาวร = แอดมิน</p>;

  const renderItem = (im) => {
    const meta = PATIENT_IMG_TYPES[im.type] || PATIENT_IMG_TYPES.other;
    const dl = daysLeft(im.deleted_at);
    const delWhen = im.deleted_at ? new Date(im.deleted_at).toLocaleString('th-TH',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '-';
    if (mode === 'row') {
      const up = new Date(im.uploaded_at).toLocaleString('th-TH',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
      const dimF = (im.width && im.height) ? im.width+' × '+im.height+' px' : '—';
      const qual = im.mime==='image/gif' ? 'GIF' : 'WebP '+(im.type==='cxr'?92:87)+'%';
      const col = (label, val, w) => <div style={{flexShrink:0,width:w}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>{label}</p><p style={{fontSize:'12px',color:'#374151',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{val||'—'}</p></div>;
      return (
        <div key={im.id} onClick={()=>setLightbox(im)} style={{display:'flex',alignItems:'center',gap:'10px',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'7px 10px',background:'#fff',cursor:'zoom-in'}}>
          <div style={{width:thumb+'px',height:thumb+'px',flexShrink:0,borderRadius:'8px',overflow:'hidden',background:'#0b0f19'}}><img src={im.thumbUrl||im.url} alt="" loading="lazy" draggable={false} onContextMenu={e=>e.preventDefault()} style={{width:'100%',height:'100%',objectFit:'cover',filter:'grayscale(0.35)'}}/></div>
          <span style={{flexShrink:0,width:'52px',fontSize:'10px',fontWeight:800,padding:'2px 0',textAlign:'center',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
          {col('ลบเมื่อ', delWhen, '126px')}
          {col('โดย', im.deleter_name, '92px')}
          {col('อัปโหลด', up, '126px')}
          {col('ขนาดภาพ', dimF, '106px')}
          {col('คุณภาพ', qual, '80px')}
          <div style={{flex:1,minWidth:'70px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>เหตุผล</p><p style={{fontSize:'12px',color:'#374151',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{im.delete_reason||'—'}</p></div>
          <div style={{flexShrink:0,width:'64px',textAlign:'center'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>เหลือ</p><p style={{fontSize:'12px',fontWeight:700,color:dl<=7?'#dc2626':'#b45309',margin:0}}>{dl} วัน</p></div>
          <div onClick={e=>e.stopPropagation()} style={{flexShrink:0,width:'150px'}}>{actionsFor(im)}</div>
        </div>
      );
    }
    const th = Math.round(IMG_VIEW_SIZES[size].card * 0.72);
    return (
      <div key={im.id} style={{border:'1px solid #e5e7eb',borderRadius:'12px',overflow:'hidden',background:'#fff',display:'flex',flexDirection:'column',height:'100%'}}>
        <div onClick={()=>setLightbox(im)} style={{position:'relative',height:th+'px',flexShrink:0,background:'#0b0f19',cursor:'zoom-in'}}>
          <img src={im.thumbUrl||im.url} alt="" loading="lazy" draggable={false} onContextMenu={e=>e.preventDefault()} style={{width:'100%',height:'100%',objectFit:'cover',filter:'grayscale(0.35)',opacity:0.9}}/>
          <span style={{position:'absolute',top:'6px',right:'6px',fontSize:'10px',fontWeight:800,padding:'2px 7px',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
        </div>
        <div style={{padding:'8px 10px',flex:1,display:'flex',flexDirection:'column'}}>
          <p style={{fontSize:'11px',color:'#6b7280',margin:'0 0 2px'}}>ลบ {delWhen}</p>
          {im.deleter_name && <p style={{fontSize:'11px',color:'#6b7280',margin:'0 0 2px'}}>โดย {im.deleter_name}</p>}
          {im.delete_reason && <p style={{fontSize:'11px',color:'#9ca3af',margin:'0 0 3px',fontStyle:'italic',wordBreak:'break-word'}}>เหตุผล: {im.delete_reason}</p>}
          <div style={{marginTop:'auto'}}>
            <p style={{fontSize:'11px',fontWeight:700,color:dl<=7?'#dc2626':'#b45309',margin:'6px 0 8px'}}><i className="fa-solid fa-clock" style={{marginRight:'4px'}}></i>เหลืออีก {dl} วัน</p>
            {actionsFor(im, size===0)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:'12px',padding:'10px 14px',marginBottom:'14px',fontSize:'12px',color:'#92400e',lineHeight:1.5}}>
        <i className="fa-solid fa-trash" style={{marginRight:'6px'}}></i>รูปในถังขยะเก็บไว้ 60 วัน แล้วลบถาวรอัตโนมัติ · กู้คืน / ลบถาวร ทำได้เฉพาะแอดมิน
      </div>

      {/* แถบกรอง + มุมมอง */}
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center',marginBottom:'14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px',flex:'1 1 180px',minWidth:'160px',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'6px 10px'}}>
          <i className="fa-solid fa-magnifying-glass" style={{fontSize:'12px',color:'#9ca3af'}}></i>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาชื่อ / HN" style={{flex:1,minWidth:0,border:'none',outline:'none',fontSize:'13px',background:'none'}}/>
        </div>
        {['all',...Object.keys(PATIENT_IMG_TYPES)].map(k=>{
          const active=typeFilter===k; const v=PATIENT_IMG_TYPES[k];
          return <button key={k} onClick={()=>setTypeFilter(k)} style={{padding:'4px 12px',borderRadius:'999px',fontSize:'12px',fontWeight:700,border:'1px solid '+(active?'#0d9488':'#e5e7eb'),background:active?'#0d9488':'#fff',color:active?'#fff':'#6b7280',cursor:'pointer'}}>{k==='all'?'ทุกหมวด':v.label}</button>;
        })}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'5px 8px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'12px',color:'#6b7280',cursor:'pointer'}}>
          <option value="expiry">ใกล้ลบถาวรก่อน</option>
          <option value="recent">ลบล่าสุดก่อน</option>
        </select>
        <select value={pSort} onChange={e=>setPSort(e.target.value)} title="เรียงผู้ป่วย" style={{padding:'5px 8px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'12px',color:'#6b7280',cursor:'pointer'}}>
          <option value="name-asc">ชื่อ ก → ฮ</option>
          <option value="name-desc">ชื่อ ฮ → ก</option>
          <option value="hn-asc">HN น้อย → มาก</option>
          <option value="hn-desc">HN มาก → น้อย</option>
        </select>
        <div style={{marginLeft:'auto'}}><ImgViewToolbar mode={mode} setMode={setMode} size={size} setSize={setSize}/></div>
      </div>

      {err && <p style={{fontSize:'12px',color:'#dc2626',margin:'0 0 10px'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{err}</p>}
      {imgs===null && <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>{[0,1,2,3].map(i=><div key={i} className="tb-skel" style={{width:'150px',height:'170px',borderRadius:'10px'}}/>)}</div>}
      {imgs!==null && sorted.length===0 && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'56px 20px'}}>
          <div style={{width:'76px',height:'76px',borderRadius:'50%',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}><i className="fa-solid fa-trash" style={{fontSize:'28px',color:'#cbd5e1'}}></i></div>
          <p style={{fontSize:'14px',fontWeight:700,color:'#6b7280',margin:'0 0 4px'}}>{(imgs.length>0)?'ไม่พบรูปที่ตรงกับตัวกรอง':'ถังขยะรูปว่าง'}</p>
          <p style={{fontSize:'12px',color:'#9ca3af',margin:0}}>{(imgs.length>0)?'ลองล้างตัวกรองหรือเปลี่ยนคำค้นหา':'ยังไม่มีรูปที่ถูกลบ'}</p>
        </div>
      )}
      {imgs!==null && sorted.length>0 && groupEntries.map(([pid,g])=>(
        <div key={pid} style={{marginBottom:'20px'}}>
          <p style={{fontWeight:700,fontSize:'13px',color:'#1f2937',margin:'0 0 8px',borderLeft:'3px solid #0d9488',paddingLeft:'8px'}}>{g.name}{g.hn?<span style={{color:'#9ca3af',fontWeight:400,fontSize:'12px'}}> · HN {g.hn}</span>:null} <span style={{color:'#9ca3af',fontWeight:400,fontSize:'12px'}}>({g.items.length})</span></p>
          {mode==='card'
            ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax('+IMG_VIEW_SIZES[size].card+'px,1fr))',gap:'12px'}}>{g.items.map(renderItem)}</div>
            : <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>{g.items.map(renderItem)}</div>}
        </div>
      ))}

      {lightbox && (()=>{
        const meta = PATIENT_IMG_TYPES[lightbox.type] || PATIENT_IMG_TYPES.other;
        const name = meta.label + ' · ' + (lightbox.patient_name||'') + (lightbox.patient_hn?' (HN '+lightbox.patient_hn+')':'');
        const info = patientImgInfo(lightbox, meta, name);
        const acts = isAdmin ? [
          { icon:'fa-rotate-left', label:'กู้คืนรูป', onClick:()=>{ setRestoreT(lightbox); } },   // ไม่ปิดตัวดูรูป → popup มาทับ
          { icon:'fa-fire', label:'ลบถาวร', danger:true, onClick:()=>{ setHnInput(''); setHardCheck(false); setHardStep2(false); setHardT(lightbox); } },
        ] : [];
        return <AvatarLightbox src={lightbox.url} thumb={lightbox.thumbUrl} info={info} menuActions={acts}
          hasPrev={false} hasNext={false} onPrev={()=>{}} onNext={()=>{}}
          onExpire={async()=>{ try{ const r=await fetch('/api/patient/images/'+lightbox.id+'/url'); if(r.ok){ const d=await r.json(); return d.url; } }catch{} return null; }}
          onClose={()=>setLightbox(null)}/>;
      })()}

      {restoreT && createPortal(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={busy?undefined:()=>setRestoreT(null)}>
          <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'340px',padding:'22px',textAlign:'center'}}>
            <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'#ccfbf1',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}><i className="fa-solid fa-rotate-left" style={{color:'#0d9488',fontSize:'19px'}}></i></div>
            <p style={{fontSize:'15px',fontWeight:700,color:'#111827',margin:'0 0 6px'}}>กู้คืนรูปนี้</p>
            <p style={{fontSize:'13px',fontWeight:700,color:'#0d9488',margin:'0 0 4px'}}>{restoreT.patient_name||'ผู้ป่วย'}{restoreT.patient_hn?' · HN '+restoreT.patient_hn:''}</p>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 16px'}}>รูปจะกลับไปแสดงในแท็บรูปตามปกติ</p>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setRestoreT(null)} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ยกเลิก</button>
              <button onClick={doRestore} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:busy?'#5eead4':'#0d9488',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:busy?'wait':'pointer'}}>{busy?'กำลังกู้คืน...':'ยืนยันกู้คืน'}</button>
            </div>
          </div>
        </div>, document.body
      )}
      {hardT && createPortal(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={busy?undefined:()=>{setHardT(null);setHardStep2(false);}}>
          <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'360px',padding:'22px',minHeight:'366px',display:'flex',flexDirection:'column',boxSizing:'border-box'}}>
            <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}><i className="fa-solid fa-fire" style={{color:'#dc2626',fontSize:'19px'}}></i></div>
            <p style={{fontSize:'15px',fontWeight:700,color:'#111827',margin:'0 0 6px',textAlign:'center'}}>ลบรูปนี้ถาวร</p>
            <p style={{fontSize:'13px',fontWeight:700,color:'#0d9488',margin:'0 0 4px',textAlign:'center'}}>{hardT.patient_name||'ผู้ป่วย'}{hardT.patient_hn?' · HN '+hardT.patient_hn:''}</p>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 14px',textAlign:'center'}}>ไฟล์จะถูกลบออกจากระบบจริง <span style={{whiteSpace:'nowrap'}}>กู้คืนไม่ได้อีก</span></p>
            {!hardStep2 ? (<>
            <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>พิมพ์ HN <span style={{color:'#dc2626'}}>{hardT.patient_hn||'-'}</span> เพื่อยืนยัน</label>
            <input value={hnInput} onChange={e=>setHnInput(e.target.value)} disabled={busy} style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid '+(hnInput&&hnInput.trim()!==String(hardT.patient_hn||'')?'#fca5a5':'#d1d5db'),fontSize:'13px',marginBottom:'10px',boxSizing:'border-box'}}/>
            <label style={{display:'flex',alignItems:'flex-start',gap:'8px',fontSize:'12px',color:'#4b5563',marginBottom:'14px',cursor:'pointer'}}>
              <input type="checkbox" checked={hardCheck} onChange={e=>setHardCheck(e.target.checked)} disabled={busy} style={{marginTop:'2px',flexShrink:0}}/>
              <span>ข้าพเจ้าเข้าใจว่ารูปนี้จะถูกลบถาวรและกู้คืนไม่ได้</span>
            </label>
            <div style={{display:'flex',gap:'10px',marginTop:'auto'}}>
              <button onClick={()=>{setHardT(null);setHardStep2(false);}} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ยกเลิก</button>
              <button onClick={()=>setHardStep2(true)} disabled={busy||hnInput.trim()!==String(hardT.patient_hn||'')||!hardCheck} style={{flex:1,padding:'10px',borderRadius:'10px',background:(busy||hnInput.trim()!==String(hardT.patient_hn||'')||!hardCheck)?'#fca5a5':'#dc2626',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:(busy||hnInput.trim()!==String(hardT.patient_hn||'')||!hardCheck)?'not-allowed':'pointer'}}>ลบถาวร</button>
            </div>
            </>) : (<>
            <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'11px 13px',marginBottom:'16px',fontSize:'12px',color:'#991b1b',lineHeight:1.6,textAlign:'center'}}><i className="fa-solid fa-triangle-exclamation" style={{marginRight:'6px'}}></i>ยืนยันครั้งสุดท้าย — กดแล้วลบถาวรทันที <span style={{whiteSpace:'nowrap'}}>กู้คืนไม่ได้อีก</span></div>
            <div style={{display:'flex',gap:'10px',marginTop:'auto'}}>
              <button onClick={doHard} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:busy?'#fca5a5':'#dc2626',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:busy?'wait':'pointer'}}>{busy?'กำลังลบ...':'ยืนยันลบถาวร'}</button>
              <button onClick={()=>setHardStep2(false)} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ย้อนกลับ</button>
            </div>
            </>)}
          </div>
        </div>, document.body
      )}
    </div>
  );
}

// ── ศูนย์รวมถังขยะ (สลับ ผู้ป่วย / รูปภาพ) ─────────────────────────────────
function TrashHub(props) {
  const [sub, setSub] = React.useState('patients');
  const isAdmin = props.currentUser?.role === 'admin';
  const pCount = (props.pendingDeleteRequests || []).length;
  const seg = (on) => ({padding:'7px 16px',fontSize:'13px',fontWeight:700,border:'none',borderRadius:'8px',background:on?'#0f766e':'transparent',color:on?'#fff':'#6b7280',cursor:'pointer'});
  return (
    <div>
      <div style={{display:'inline-flex',background:'#f1f5f9',borderRadius:'10px',padding:'3px',marginBottom:'16px'}}>
        <button onClick={()=>setSub('patients')} style={seg(sub==='patients')}><i className="fa-solid fa-users" style={{marginRight:'6px'}}></i>ผู้ป่วย{pCount>0?' '+pCount:''}</button>
        <button onClick={()=>setSub('images')} style={seg(sub==='images')}><i className="fa-solid fa-images" style={{marginRight:'6px'}}></i>รูปภาพ</button>
      </div>
      {sub==='patients' && <TrashList {...props}/>}
      {sub==='images' && <ImageTrashPage currentUser={props.currentUser} isAdmin={isAdmin}/>}
    </div>
  );
}

function PatientImagesTab({ patient, currentUser, locked }) {
  const LSKEY = 'tb_patimg_' + patient.id;
  const _c0 = loadCache(LSKEY);
  const [images, setImages]   = React.useState(_c0 ? _c0.data : null);
  const [loading, setLoading] = React.useState(!_c0);
  const [err, setErr]         = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [upProgress, setUpProgress] = React.useState(0);
  const [upPhase, setUpPhase] = React.useState('');   // 'compress' | 'upload' | 'save'
  const [upType, setUpType]   = React.useState('cxr');
  const [upNote, setUpNote]   = React.useState('');
  const [pendingUpload, setPendingUpload] = React.useState(null);  // {file, previewUrl, isAnimated, dims, origMime} รอยืนยันอัป
  const [preparing, setPreparing] = React.useState(false);         // กำลังถอดรหัสไฟล์ (HEIC/TIFF ช้านิด)
  const [filter, setFilter]   = React.useState('all');
  const [sortBy, setSortBy]   = React.useState('new');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo]     = React.useState('');
  const [uploaderFilter, setUploaderFilter] = React.useState('all');
  const [lightbox, setLightbox] = React.useState(null);
  const [delTarget, setDelTarget] = React.useState(null);
  const [delReason, setDelReason] = React.useState('');   // เหตุผลการลบ (บังคับ — ลบยากเหมือนผู้ป่วย)
  const [delHn, setDelHn] = React.useState('');           // พิมพ์ HN ยืนยันตอนย้ายเข้าถัง
  const [delStep2, setDelStep2] = React.useState(false);  // ป๊อปอัปยืนยันซ้ำ (สเต็ป 2)
  const [deleting, setDeleting] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState(null);   // รูปที่กำลังแก้หมวด
  const [editType, setEditType]   = React.useState('cxr');
  const [editNote, setEditNote]   = React.useState('');
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [compareMode, setCompareMode] = React.useState(false);
  const [compareSel, setCompareSel]   = React.useState([]);
  const [compare, setCompare] = React.useState(null);
  const fileRef = React.useRef(null);
  const isAdmin = currentUser?.role === 'admin';
  const [vMode, setVMode] = React.useState('card');   // มุมมองรูป: การ์ด/แถว
  const [vSize, setVSize] = React.useState(1);         // ขนาด 0/1/2

  const load = React.useCallback(async (force, silent) => {
    const c = loadCache(LSKEY);
    if (c && !force && (Date.now() - c.ts < CACHE_TTL)) { setImages(c.data); setLoading(false); return; }  // cache สด → ไม่ยิงซ้ำ
    if (!c && !silent) setLoading(true);   // silent = refresh เงียบ ไม่ขึ้น skeleton (ตอนลบ/อัป/realtime)
    setErr('');
    try {
      const r = await fetch('/api/patient/images?patientId=' + encodeURIComponent(patient.id));
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'โหลดรูปไม่สำเร็จ');
      const withHn = (d.images || []).map(im => ({ ...im, patient_hn: patient.hn }));   // แนบ HN ผู้ป่วยไว้กับรูป (ใช้ยืนยันตอนลบ)
      saveCache(LSKEY, withHn);
      setImages(withHn);
    } catch (e) { setErr(e.message); if (!c) setImages([]); }
    setLoading(false);
  }, [patient.id]);
  React.useEffect(() => { load(); }, [load]);
  // Realtime: รูปผู้ป่วยรายนี้เปลี่ยน (อัป/ลบ/แก้ — ข้ามผู้ใช้) → รีเฟรช
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window._sb || !patient?.id) return;
    const ch = window._sb.channel('patimg-' + patient.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_patient_images', filter: 'patient_id=eq.' + patient.id }, (payload) => {
        invalidateImgCaches();
        const ev = payload.eventType, n = payload.new, o = payload.old;
        if (ev === 'DELETE') { if (o && o.id) setImages(arr => (arr||[]).filter(x => x.id !== o.id)); }
        else if (ev === 'UPDATE') {
          if (n && n.deleted_at) setImages(arr => (arr||[]).filter(x => x.id !== n.id));   // soft-delete → เอาออก
          else if (n) setImages(arr => {
            if (!(arr||[]).some(x => x.id === n.id)) { load(true, true); return arr; }   // กู้คืนจากถังขยะ (ไม่มีในลิสต์) → โหลดใหม่
            return (arr||[]).map(x => x.id === n.id ? { ...x, type: n.type, note: n.note, title: n.title, width: n.width, height: n.height, size_bytes: n.size_bytes, quality: n.quality } : x);   // แก้หมวด/คำอธิบาย → อัปเดต field ตรงๆ (ไม่ refetch)
          });
        }
        else load(true, true);   // INSERT → ต้องดึง url ใหม่
      })
      .subscribe();
    return () => { try { window._sb.removeChannel(ch); } catch {} };
  }, [patient.id, load]);

  // เลือกไฟล์ → เปิดพรีวิว "ทันที" (สถานะ decoding) แล้วถอดรหัสเบื้องหลัง → ผู้ใช้เห็น popup เลย มั่นใจว่าอัปติด
  const pickFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setErr('');
    const name = (file.name || '').toLowerCase();
    const okExt = /\.(jpe?g|png|webp|avif|gif|bmp|heic|heif|tiff?)$/.test(name);
    if (!file.type.startsWith('image/') && !okExt) { setErr('รองรับไฟล์รูป: JPG/PNG/WebP/AVIF/GIF/BMP/HEIC/TIFF — ไม่รองรับ RAW/DICOM'); return; }
    if (file.size > 200 * 1024 * 1024) { setErr('ไฟล์ใหญ่เกิน 200MB'); return; }
    setPendingUpload({ file, decoding: true, previewUrl: null, isAnimated: false, dims: { width: 0, height: 0 }, origMime: file.type || ('image/' + name.split('.').pop()), error: '' });
    (async () => {
      try {
        const animated = await isAnimatedGif(file);
        const previewUrl = animated ? URL.createObjectURL(file) : await decodeImageToDataURL(file);
        let dims = { width: 0, height: 0 };
        try { const im = await loadImageEl(previewUrl); dims = { width: im.naturalWidth, height: im.naturalHeight }; } catch {}
        setPendingUpload(pu => (pu && pu.file === file) ? { ...pu, decoding: false, previewUrl, isAnimated: animated, dims } : pu);
      } catch (e2) {
        setPendingUpload(pu => (pu && pu.file === file) ? { ...pu, decoding: false, error: 'เปิดไฟล์นี้ไม่ได้ (อาจเสีย/ไม่รองรับ): ' + (e2.message || '') } : pu);
      }
    })();
  };

  // ยืนยันในพรีวิว → บีบ + อัปจริง (GIF เคลื่อนไหว = เก็บต้นฉบับคงการเคลื่อนไหว)
  const doUpload = async () => {
    const pu = pendingUpload; if (!pu || pu.decoding || !pu.previewUrl) return;
    setUploading(true); setErr(''); setUpPhase('compress'); setUpProgress(0);
    try {
      const isCxr = upType === 'cxr';
      let mainBlob, width, height, ext, mime;
      if (pu.isAnimated) {
        mainBlob = pu.file; ext = 'gif'; mime = 'image/gif'; width = pu.dims.width; height = pu.dims.height;
      } else {
        // CXR คมชัด 4096px/92% · รูปทั่วไป 2560px (2K)/87%
        const c = await compressToWebp(pu.previewUrl, isCxr ? 0.92 : 0.87, isCxr ? 4096 : 2560);
        mainBlob = c.blob; width = c.width; height = c.height; ext = 'webp'; mime = 'image/webp';
      }
      const thumb = await compressToWebp(pu.previewUrl, 0.7, 400);   // ทัมเนล (GIF = เฟรมแรก)
      setUpPhase('upload');
      const pres = await fetch('/api/patient/images/presign', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ patientId: patient.id, ext }) });
      const pd = await pres.json();
      if (!pres.ok) throw new Error(pd.error || 'ขอลิงก์อัปโหลดไม่สำเร็จ');
      await putWithProgress(pd.uploadUrl, mainBlob, setUpProgress, mime);   // รูปเต็ม (รายงาน %)
      if (pd.uploadUrlThumb) { try { await fetch(pd.uploadUrlThumb, { method: 'PUT', body: thumb.blob, headers: { 'content-type': 'image/webp' } }); } catch {} }
      setUpPhase('save');
      const conf = await fetch('/api/patient/images/confirm', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id, key: pd.key, thumbKey: pd.thumbKey, type: upType, note: upNote || null, size: mainBlob.size, width, height, mime, origSize: pu.file.size, origMime: pu.origMime, origWidth: pu.dims.width, origHeight: pu.dims.height, quality: pu.isAnimated ? null : (isCxr ? 92 : 87), device: detectDevice() }) });
      const cd = await conf.json();
      if (!conf.ok) throw new Error(cd.error || 'บันทึกไม่สำเร็จ');
      if (pu.isAnimated) { try { URL.revokeObjectURL(pu.previewUrl); } catch {} }
      setUpNote(''); setPendingUpload(null); invalidateImgCaches(); await load(true, true);
    } catch (e) { setErr(e.message || 'เกิดข้อผิดพลาด'); }
    setUploading(false); setUpPhase(''); setUpProgress(0);
  };
  const cancelUpload = () => { if (pendingUpload?.isAnimated) { try { URL.revokeObjectURL(pendingUpload.previewUrl); } catch {} } setPendingUpload(null); };

  const freshUrl = async (im) => {
    try { const r = await fetch(`/api/patient/images/${im.id}/url`); if (r.ok) { const d = await r.json(); if (d.url) return d.url; } } catch {}
    return im.url;
  };
  const openImage = (im, rect) => {   // เปิดด้วย index → ลูกศรเลื่อนรูปถัดไป/ก่อนหน้าได้
    const idx = shown.findIndex(x => x.id === im.id);
    if (idx >= 0) setLightbox({ idx, rect });
  };
  const doDelete = () => {
    if (!delTarget) return;
    const reason = delReason.trim();
    if (reason.length < 3) return;   // บังคับกรอกเหตุผล (ลบยากเหมือนผู้ป่วย)
    if (delHn.trim() !== String(delTarget.patient_hn || '')) return;   // ต้องพิมพ์ HN ผู้ป่วยให้ตรง
    const id = delTarget.id;
    setImages(arr => (arr||[]).filter(x => x.id !== id));   // optimistic: หายทันที + ปิดป๊อปอัป + เลื่อน
    invalidateImgCaches(); setDelTarget(null); setDelReason(''); setDelHn(''); setDelStep2(false); setLightbox(null);
    fetch('/api/patient/images/' + id, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reason }) })   // ลบจริงเบื้องหลัง (ไม่รอ)
      .then(r => { if (!r.ok) { setErr('ลบไม่สำเร็จ — กู้รายการกลับมา'); load(true, true); } })
      .catch(() => { setErr('ลบไม่สำเร็จ — กู้รายการกลับมา'); load(true, true); });
  };
  const openEdit = (im) => { setEditTarget(im); setEditType(im.type); setEditNote(im.note || ''); setErr(''); };
  const doEdit = async () => {
    if (!editTarget) return;
    const cur = editTarget, id = cur.id, nt = editType, nn = editNote || null;
    const newMax = nt === 'cxr' ? 4096 : 2560;
    const curMaxDim = Math.max(cur.width || 0, cur.height || 0);
    const needShrink = cur.mime !== 'image/gif' && curMaxDim > newMax + 4;   // ขนาดเกินหมวดใหม่ → ย่อไฟล์จริง (เช่น CXR 4096 → Lab 2560)
    if (!needShrink) {
      setImages(arr => (arr||[]).map(x => x.id===id ? { ...x, type: nt, note: nn } : x));   // เปลี่ยนป้าย → ทันที
      invalidateImgCaches(); setEditTarget(null);
      fetch('/api/patient/images/' + id, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: nt, note: nn }) })
        .then(r => { if (!r.ok) { setErr('แก้ไขไม่สำเร็จ'); load(true, true); } }).catch(() => { setErr('แก้ไขไม่สำเร็จ'); load(true, true); });
      return;
    }
    setSavingEdit(true); setErr('');   // ย่อจริง: โหลดรูปปัจจุบัน → ย่อ → อัปทับ → ลบไฟล์เก่า
    try {
      const ur = await fetch('/api/patient/images/' + id + '/url'); const ud = await ur.json();
      if (!ur.ok || !ud.url) throw new Error('โหลดรูปเดิมไม่ได้');
      const obj = URL.createObjectURL(await (await fetch(ud.url)).blob());
      const c = await compressToWebp(obj, nt==='cxr'?0.92:0.87, newMax);
      const th = await compressToWebp(obj, 0.7, 400);
      URL.revokeObjectURL(obj);
      const pres = await fetch('/api/patient/images/presign', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ patientId: cur.patient_id, ext: 'webp' }) });
      const pd = await pres.json(); if (!pres.ok) throw new Error(pd.error || 'ขอลิงก์ไม่ได้');
      await putWithProgress(pd.uploadUrl, c.blob, null, 'image/webp');
      try { await fetch(pd.uploadUrlThumb, { method: 'PUT', body: th.blob, headers: { 'content-type': 'image/webp' } }); } catch {}
      const r = await fetch('/api/patient/images/' + id, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: nt, note: nn, storageKey: pd.key, thumbKey: pd.thumbKey, width: c.width, height: c.height, size: c.blob.size, quality: nt==='cxr'?92:87, oldKey: cur.storage_key, oldThumbKey: cur.thumb_key }) });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'บันทึกไม่สำเร็จ'); }
      setEditTarget(null); invalidateImgCaches(); await load(true, true);   // ดึง url/มิติใหม่
    } catch (e) { setErr('ปรับขนาดไม่สำเร็จ: ' + (e.message || '')); }
    setSavingEdit(false);
  };
  const toggleSel = (im) => setCompareSel(s => s.includes(im.id) ? s.filter(x=>x!==im.id) : (s.length<2 ? [...s,im.id] : [s[1],im.id]));
  const openCompare = async () => {
    const picked = compareSel.map(id => (images||[]).find(im=>im.id===id)).filter(Boolean);
    if (picked.length !== 2) return;
    const [a,b] = await Promise.all(picked.map(async im => ({ src: await freshUrl(im), label: new Date(im.uploaded_at).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'}) })));
    setCompare({ left:a, right:b });
  };

  const uploaders = [...new Set((images || []).map(im => im.uploader_name).filter(Boolean))];
  const shown = (images || []).filter(im => (filter==='all' || im.type===filter) && (uploaderFilter==='all' || im.uploader_name===uploaderFilter) && imgInRange(im, dateFrom, dateTo)).sort(imgSortCmp(sortBy));
  const cxrCount = (images || []).filter(im => im.type==='cxr').length;
  const fmtSize = (b) => b==null?'':(b<1048576?(b/1024).toFixed(0)+' KB':(b/1048576).toFixed(1)+' MB');

  return (
    <div>
      {/* อัปโหลด */}
      {!locked && (
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center',marginBottom:'14px',padding:'12px',background:'#f8fafc',borderRadius:'12px',border:'1px solid #e5e7eb'}}>
          <select value={upType} onChange={e=>setUpType(e.target.value)} style={{padding:'8px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px'}}>
            {Object.entries(PATIENT_IMG_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <input value={upNote} onChange={e=>setUpNote(e.target.value)} placeholder="หมายเหตุ (ไม่บังคับ)" style={{flex:'1 1 160px',minWidth:0,padding:'8px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px'}}/>
          <button onClick={()=>fileRef.current&&fileRef.current.click()} disabled={preparing||uploading}
            style={{padding:'8px 16px',borderRadius:'8px',background:(preparing||uploading)?'#5eead4':'#0d9488',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:(preparing||uploading)?'wait':'pointer'}}>
            {preparing ? <><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'6px'}}></i>กำลังเปิดไฟล์...</> : <><i className="fa-solid fa-cloud-arrow-up" style={{marginRight:'6px'}}></i>เลือกรูป</>}
          </button>
          <input ref={fileRef} type="file" accept="image/*,.heic,.heif,.tif,.tiff,.avif,.bmp" onChange={pickFile} style={{display:'none'}}/>
          <span style={{fontSize:'11px',color:'#9ca3af',flexBasis:'100%'}}>รองรับ JPG/PNG/WebP/AVIF/GIF/BMP/HEIC/TIFF (iPhone ได้) · CXR คมชัด ≤4096px/92% · ทั่วไป ≤2560px (2K)/87% · ≤200MB · GIF เคลื่อนไหวเก็บต้นฉบับ</span>
        </div>
      )}

      {/* แถบกรอง + ปุ่มเทียบ */}
      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center',marginBottom:'12px'}}>
        {['all',...Object.keys(PATIENT_IMG_TYPES)].map(k=>{
          const active=filter===k; const v=PATIENT_IMG_TYPES[k];
          return <button key={k} onClick={()=>setFilter(k)} style={{padding:'4px 12px',borderRadius:'999px',fontSize:'12px',fontWeight:700,border:'1px solid '+(active?'#0d9488':'#e5e7eb'),background:active?'#0d9488':'#fff',color:active?'#fff':'#6b7280',cursor:'pointer'}}>{k==='all'?'ทั้งหมด':v.label}</button>;
        })}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} title="เรียงลำดับ" style={{padding:'4px 8px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'12px',color:'#6b7280',cursor:'pointer'}}>
          {IMG_SORTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} title="ตั้งแต่วันที่" style={{padding:'3px 6px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'11px',color:'#6b7280'}}/>
        <span style={{fontSize:'11px',color:'#9ca3af'}}>ถึง</span>
        <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} title="ถึงวันที่" style={{padding:'3px 6px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'11px',color:'#6b7280'}}/>
        {(dateFrom||dateTo) && <button onClick={()=>{setDateFrom('');setDateTo('');}} title="ล้างวันที่" style={{fontSize:'12px',color:'#0d9488',background:'none',border:'none',cursor:'pointer'}}><i className="fa-solid fa-xmark"></i></button>}
        {uploaders.length>1 && <select value={uploaderFilter} onChange={e=>setUploaderFilter(e.target.value)} title="กรองตามคนอัปโหลด" style={{padding:'4px 8px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'12px',color:'#6b7280',cursor:'pointer',maxWidth:'140px'}}><option value="all">คนอัปโหลด: ทุกคน</option>{uploaders.map(u=><option key={u} value={u}>{u}</option>)}</select>}
        {cxrCount>=2 && (
          <button onClick={()=>{setCompareMode(m=>!m);setCompareSel([]);}} style={{marginLeft:'auto',padding:'4px 12px',borderRadius:'999px',fontSize:'12px',fontWeight:700,border:'1px solid '+(compareMode?'#d97706':'#e5e7eb'),background:compareMode?'#fef3c7':'#fff',color:compareMode?'#b45309':'#6b7280',cursor:'pointer',order:2}}>
            <i className="fa-solid fa-clone" style={{marginRight:'5px'}}></i>เทียบ CXR
          </button>
        )}
        {compareMode && <button onClick={openCompare} disabled={compareSel.length!==2} style={{padding:'4px 12px',borderRadius:'999px',fontSize:'12px',fontWeight:700,border:'none',background:compareSel.length===2?'#0d9488':'#e5e7eb',color:'#fff',cursor:compareSel.length===2?'pointer':'not-allowed',order:3}}>เปิดเทียบ ({compareSel.length}/2)</button>}
        <div style={{marginLeft:cxrCount>=2?'8px':'auto',order:4}}><ImgViewToolbar mode={vMode} setMode={setVMode} size={vSize} setSize={setVSize}/></div>
      </div>

      {err && <p style={{fontSize:'12px',color:'#dc2626',margin:'0 0 10px'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{err}</p>}
      {loading && (
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
          {[0,1,2,3,4,5].map(i=><div key={i} className="tb-skel" style={{width:(150+(i%3)*40)+'px',height:'170px',borderRadius:'10px'}}/>)}
        </div>
      )}
      {!loading && shown.length===0 && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48px 20px'}}>
          <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}>
            <i className="fa-solid fa-images" style={{fontSize:'28px',color:'#cbd5e1'}}></i>
          </div>
          <p style={{fontSize:'14px',fontWeight:700,color:'#6b7280',margin:'0 0 4px'}}>ยังไม่มีรูปในหมวดนี้</p>
          {!locked && <p style={{fontSize:'12px',color:'#9ca3af',margin:0,textAlign:'center'}}>กดปุ่มอัปโหลดด้านบน เพื่อเพิ่มรูป CXR ผล Lab หรือเอกสาร</p>}
        </div>
      )}

      {/* แกลเลอรี — Google Photos (justified rows คงสัดส่วนจริง) */}
      {!loading && shown.length>0 && vMode==='card' && (
        <JustifiedGallery items={shown} targetHeight={IMG_VIEW_SIZES[vSize].jh} gap={8} renderItem={(im)=>{
          const meta=PATIENT_IMG_TYPES[im.type]||PATIENT_IMG_TYPES.other;
          const canDel = !locked && (im.uploaded_by===currentUser?.id || isAdmin);
          const selIdx = compareSel.indexOf(im.id);
          const selectableForCompare = compareMode && im.type==='cxr';
          return (
            <div className="tb-img-thumb" title={im.title || im.note || ''}
              onClick={(e)=>selectableForCompare?toggleSel(im):openImage(im, e.currentTarget.getBoundingClientRect())}
              style={{position:'relative',width:'100%',height:'100%',background:'#0b0f19',borderRadius:'10px',overflow:'hidden',cursor:selectableForCompare?'pointer':'zoom-in',border:'1px solid #e5e7eb',outline:selIdx>=0?'3px solid #0d9488':'none',outlineOffset:'-3px'}}>
              <img src={im.thumbUrl || im.url} alt="" loading="lazy" draggable={false} onContextMenu={e=>e.preventDefault()} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              {!selectableForCompare && <div className="tb-img-zoomicon" style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.22)',pointerEvents:'none'}}><i className="fa-solid fa-magnifying-glass-plus" style={{color:'#fff',fontSize:'18px',textShadow:'0 1px 5px rgba(0,0,0,0.6)'}}></i></div>}
              {selectableForCompare && <div style={{position:'absolute',top:'6px',left:'6px',width:'22px',height:'22px',borderRadius:'50%',background:selIdx>=0?'#0d9488':'rgba(255,255,255,0.85)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800,border:'2px solid #fff'}}>{selIdx>=0?selIdx+1:''}</div>}
              <span style={{position:'absolute',top:'6px',right:'6px',fontSize:'10px',fontWeight:800,padding:'2px 7px',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
              <div style={{position:'absolute',left:0,right:0,bottom:0,padding:'12px 8px 5px',background:'linear-gradient(transparent,rgba(0,0,0,0.65))'}}>
                <span style={{fontSize:'10px',color:'#fff',textShadow:'0 1px 3px rgba(0,0,0,0.7)'}}>{new Date(im.uploaded_at).toLocaleDateString('th-TH',{day:'numeric',month:'short'})} · {fmtSize(im.size_bytes)}</span>
              </div>
            </div>
          );
        }}/>
      )}
      {/* มุมมองแถว */}
      {!loading && shown.length>0 && vMode==='row' && (
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {shown.map(im=>{
            const meta=PATIENT_IMG_TYPES[im.type]||PATIENT_IMG_TYPES.other;
            const th=IMG_VIEW_SIZES[vSize].thumb;
            const up=new Date(im.uploaded_at).toLocaleString('th-TH',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
            const dimF=(im.width&&im.height)?im.width+' × '+im.height+' px':'—';
            const qual=im.mime==='image/gif' ? 'GIF' : 'WebP '+(im.type==='cxr'?92:87)+'%';
            return (
              <div key={im.id} onClick={(e)=>openImage(im, e.currentTarget.getBoundingClientRect())} style={{display:'flex',alignItems:'center',gap:'10px',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'7px 10px',background:'#fff',cursor:'zoom-in'}}>
                <div style={{width:th+'px',height:th+'px',flexShrink:0,borderRadius:'8px',overflow:'hidden',background:'#0b0f19'}}><img src={im.thumbUrl||im.url} alt="" loading="lazy" draggable={false} onContextMenu={e=>e.preventDefault()} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
                <span style={{flexShrink:0,width:'52px',fontSize:'10px',fontWeight:800,padding:'2px 0',textAlign:'center',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
                <div style={{flexShrink:0,width:'146px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>อัปโหลด</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{up}</p></div>
                <div style={{flexShrink:0,width:'112px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>ขนาดภาพ</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{dimF}</p></div>
                <div style={{flexShrink:0,width:'82px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>คุณภาพ</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{qual}</p></div>
                <div style={{flex:1,minWidth:'70px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>หมายเหตุ</p><p style={{fontSize:'12px',color:'#374151',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{im.title||im.note||'—'}</p></div>
                <div style={{flexShrink:0,width:'102px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>อัปโหลดโดย</p><p style={{fontSize:'12px',color:'#374151',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{im.uploader_name||'—'}</p></div>
                <div style={{flexShrink:0,width:'60px',textAlign:'right'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>ไฟล์</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{fmtSize(im.size_bytes)}</p></div>
              </div>
            );
          })}
        </div>
      )}

      {lightbox && (()=>{
        const cur = shown[lightbox.idx]; if (!cur) return null;
        const meta = PATIENT_IMG_TYPES[cur.type] || PATIENT_IMG_TYPES.other;
        const name = meta.label + ' · ' + (cur.title || (cur.storage_key||'').split('/').pop());
        const canDel = !locked && (cur.uploaded_by===currentUser?.id || isAdmin);
        const acts = canDel ? [
          { icon:'fa-pen', label:'แก้หมวด / คำอธิบาย', onClick:()=>{ openEdit(cur); } },
          { icon:'fa-trash-can', label:'ลบรูป', danger:true, onClick:()=>{ setDelReason(''); setDelHn(''); setDelStep2(false); setDelTarget(cur); } },
        ] : [];
        const info = patientImgInfo(cur, meta, name);
        info.noteEditable = canDel;
        info.onSaveNote = async (text) => { await fetch('/api/patient/images/'+cur.id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({note:text||null})}); setImages(arr=>(arr||[]).map(x=>x.id===cur.id?{...x,note:text||null}:x)); invalidateImgCaches(); };
        return <AvatarLightbox src={cur.url} thumb={cur.thumbUrl} originRect={lightbox.rect} info={info} menuActions={acts}
          hasPrev={lightbox.idx>0} hasNext={lightbox.idx<shown.length-1}
          onPrev={()=>setLightbox(l=>({ idx: Math.max(0, l.idx-1) }))}
          onNext={()=>setLightbox(l=>({ idx: Math.min(shown.length-1, l.idx+1) }))}
          onExpire={async()=>{ try { const r=await fetch(`/api/patient/images/${cur.id}/url`); if(r.ok){ const d=await r.json(); return d.url; } } catch {} return null; }}
          onClose={()=>setLightbox(null)}/>;
      })()}
      {compare && <CXRCompareModal left={compare.left} right={compare.right} onClose={()=>setCompare(null)}/>}
      {pendingUpload && createPortal(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.65)',zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={uploading?undefined:cancelUpload}>
          <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'440px',overflow:'hidden',boxShadow:'0 25px 60px rgba(0,0,0,0.3)',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f4f6',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <p style={{fontSize:'15px',fontWeight:700,color:'#0f766e',margin:0}}><i className="fa-solid fa-cloud-arrow-up" style={{marginRight:'8px'}}></i>ยืนยันอัปโหลดรูป</p>
              {!uploading && <button onClick={cancelUpload} title="ปิด" style={{width:'28px',height:'28px',borderRadius:'7px',background:'#f3f4f6',color:'#6b7280',border:'none',cursor:'pointer'}}><i className="fa-solid fa-xmark"></i></button>}
            </div>
            <div style={{padding:'16px 20px',overflowY:'auto'}}>
              <div style={{position:'relative',width:'100%',height:'220px',background:'#0b0f19',borderRadius:'12px',overflow:'hidden',marginBottom:'14px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {pendingUpload.decoding ? (
                  <div style={{textAlign:'center',color:'#cbd5e1'}}>
                    <div style={{width:'180px',height:'5px',background:'rgba(255,255,255,0.12)',borderRadius:'999px',overflow:'hidden',margin:'0 auto 10px'}}><div className="tb-lb-bar" style={{height:'100%',background:'linear-gradient(90deg,#0d9488,#5eead4)'}}/></div>
                    <p style={{fontSize:'12px',margin:0}}><i className="fa-solid fa-image" style={{marginRight:'6px'}}></i>กำลังเปิด/ถอดรหัสไฟล์...</p>
                  </div>
                ) : pendingUpload.error ? (
                  <div style={{textAlign:'center',color:'#fca5a5',padding:'0 20px'}}><i className="fa-solid fa-circle-exclamation" style={{fontSize:'22px',marginBottom:'8px'}}></i><p style={{fontSize:'12px',margin:0}}>{pendingUpload.error}</p></div>
                ) : (
                  <img src={pendingUpload.previewUrl} alt="" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
                )}
                {pendingUpload.isAnimated && !pendingUpload.decoding && <span style={{position:'absolute',top:'8px',left:'8px',fontSize:'10px',fontWeight:800,padding:'3px 8px',borderRadius:'999px',background:'#fef3c7',color:'#b45309'}}><i className="fa-solid fa-film" style={{marginRight:'4px'}}></i>GIF เคลื่อนไหว (เก็บต้นฉบับ)</span>}
              </div>
              <div style={{background:'#f0fdfa',border:'1px solid #99f6e4',borderRadius:'10px',padding:'9px 12px',marginBottom:'12px',fontSize:'12px',color:'#0f766e'}}>
                <i className="fa-solid fa-circle-check" style={{marginRight:'6px'}}></i>เช็คให้แน่ใจว่าเลือก <strong>หมวดถูกต้อง</strong> ก่อนอัปโหลด
              </div>
              <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>หมวดรูป</label>
              <select value={upType} onChange={e=>setUpType(e.target.value)} disabled={uploading} style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px',marginBottom:'12px',boxSizing:'border-box'}}>
                {Object.entries(PATIENT_IMG_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
              <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>หมายเหตุ (ไม่บังคับ)</label>
              <input value={upNote} onChange={e=>setUpNote(e.target.value)} disabled={uploading} placeholder="เช่น CXR ก่อนเริ่มยา" style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px',marginBottom:'12px',boxSizing:'border-box'}}/>
              <div style={{fontSize:'11px',color:'#9ca3af',lineHeight:1.6,wordBreak:'break-all'}}>
                <div>ไฟล์: {pendingUpload.file.name}</div>
                <div>ต้นฉบับ: {mimeLabel(pendingUpload.origMime)} · {fmtFileSize(pendingUpload.file.size)}{pendingUpload.dims.width?` · ${pendingUpload.dims.width}×${pendingUpload.dims.height}px`:''}</div>
              </div>
              {uploading && (
                <div style={{marginTop:'14px'}}>
                  {upPhase==='upload' ? (
                    <div>
                      <div style={{height:'8px',background:'#e5e7eb',borderRadius:'999px',overflow:'hidden'}}><div style={{height:'100%',width:upProgress+'%',background:'linear-gradient(90deg,#0d9488,#14b8a6)',borderRadius:'999px',transition:'width 0.2s ease'}}/></div>
                      <p style={{fontSize:'11px',color:'#0f766e',fontWeight:700,margin:'5px 0 0'}}><i className="fa-solid fa-cloud-arrow-up" style={{marginRight:'6px'}}></i>กำลังอัปโหลด {upProgress}%</p>
                    </div>
                  ) : (
                    <p style={{fontSize:'11px',color:'#0f766e',fontWeight:700,margin:0}}><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'6px'}}></i>{upPhase==='compress'?'กำลังบีบอัดรูป...':'กำลังบันทึก...'}</p>
                  )}
                </div>
              )}
              {err && <p style={{fontSize:'12px',color:'#dc2626',margin:'10px 0 0'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{err}</p>}
            </div>
            <div style={{display:'flex',gap:'10px',padding:'0 20px 18px',flexShrink:0}}>
              <button onClick={cancelUpload} disabled={uploading} style={{flex:1,padding:'11px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:uploading?'not-allowed':'pointer'}}>ยกเลิก</button>
              <button onClick={doUpload} disabled={uploading || pendingUpload.decoding || !!pendingUpload.error} style={{flex:1,padding:'11px',borderRadius:'10px',background:(uploading||pendingUpload.decoding||pendingUpload.error)?'#5eead4':'#0d9488',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:uploading?'wait':'pointer'}}>{uploading?'กำลังอัปโหลด...':(pendingUpload.decoding?'กำลังเปิดไฟล์...':'ยืนยันอัปโหลด')}</button>
            </div>
          </div>
        </div>, document.body
      )}
      {delTarget && createPortal(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={deleting?undefined:()=>{setDelTarget(null);setDelStep2(false);}}>
          <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'360px',padding:'22px',minHeight:'404px',display:'flex',flexDirection:'column',boxSizing:'border-box'}}>
            <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}><i className="fa-solid fa-trash-can" style={{color:'#dc2626',fontSize:'19px'}}></i></div>
            {!delStep2 ? (<>
            <p style={{fontSize:'15px',fontWeight:700,color:'#111827',margin:'0 0 6px',textAlign:'center'}}>ย้ายรูปนี้ไปถังขยะ</p>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 14px',textAlign:'center'}}>กู้คืนได้ภายใน 60 วัน หลังจากนั้นลบถาวรอัตโนมัติ</p>
            <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>เหตุผลการลบ <span style={{color:'#dc2626'}}>*</span></label>
            <textarea value={delReason} onChange={e=>setDelReason(e.target.value)} disabled={deleting} placeholder="เช่น รูปซ้ำ / อัปผิดคน / ภาพไม่ชัด" rows={2} style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px',marginBottom:'12px',boxSizing:'border-box',resize:'vertical',fontFamily:'inherit'}}/>
            <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>พิมพ์ HN <span style={{color:'#dc2626'}}>{delTarget&&delTarget.patient_hn}</span> เพื่อยืนยัน</label>
            <input value={delHn} onChange={e=>setDelHn(e.target.value)} disabled={deleting} style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid '+(delHn&&delTarget&&delHn.trim()!==String(delTarget.patient_hn||'')?'#fca5a5':'#d1d5db'),fontSize:'13px',marginBottom:'14px',boxSizing:'border-box'}}/>
            <div style={{display:'flex',gap:'10px',marginTop:'auto'}}>
              <button onClick={()=>{setDelTarget(null);setDelReason('');setDelHn('');setDelStep2(false);}} disabled={deleting} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ยกเลิก</button>
              <button onClick={()=>setDelStep2(true)} disabled={deleting||delReason.trim().length<3||!delTarget||delHn.trim()!==String(delTarget.patient_hn||'')} style={{flex:1,padding:'10px',borderRadius:'10px',background:(deleting||delReason.trim().length<3||!delTarget||delHn.trim()!==String(delTarget.patient_hn||''))?'#fca5a5':'#dc2626',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:(deleting||delReason.trim().length<3||!delTarget||delHn.trim()!==String(delTarget.patient_hn||''))?'not-allowed':'pointer'}}>ถัดไป</button>
            </div>
            </>) : (<>
            <p style={{fontSize:'15px',fontWeight:700,color:'#111827',margin:'0 0 6px',textAlign:'center'}}>ยืนยันย้ายรูปไปถังขยะ</p>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 10px',textAlign:'center'}}>ยืนยันว่าต้องการลบรูปนี้จริง</p>
            <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'10px 12px',marginBottom:'14px',fontSize:'12px',color:'#4b5563',wordBreak:'break-word'}}><i className="fa-solid fa-circle-info" style={{marginRight:'6px',color:'#0d9488'}}></i>เหตุผล: {delReason}</div>
            <div style={{display:'flex',gap:'10px',marginTop:'auto'}}>
              <button onClick={doDelete} disabled={deleting} style={{flex:1,padding:'10px',borderRadius:'10px',background:deleting?'#fca5a5':'#dc2626',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:deleting?'wait':'pointer'}}>{deleting?'กำลังลบ...':'ยืนยันลบ'}</button>
              <button onClick={()=>setDelStep2(false)} disabled={deleting} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ย้อนกลับ</button>
            </div>
            </>)}
          </div>
        </div>, document.body
      )}
      {editTarget && createPortal(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={savingEdit?undefined:()=>setEditTarget(null)}>
          <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'380px',padding:'22px'}}>
            <p style={{fontSize:'15px',fontWeight:700,color:'#0f766e',margin:'0 0 14px'}}><i className="fa-solid fa-pen" style={{marginRight:'8px'}}></i>แก้หมวด / หมายเหตุ</p>
            <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>หมวดรูป</label>
            <select value={editType} onChange={e=>setEditType(e.target.value)} disabled={savingEdit} style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px',marginBottom:'12px',boxSizing:'border-box'}}>
              {Object.entries(PATIENT_IMG_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>หมายเหตุ (ไม่บังคับ)</label>
            <input value={editNote} onChange={e=>setEditNote(e.target.value)} disabled={savingEdit} placeholder="หมายเหตุ" style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px',marginBottom:'12px',boxSizing:'border-box'}}/>
            {editType==='cxr' && editTarget.type!=='cxr' && (
              <div style={{background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:'10px',padding:'9px 12px',marginBottom:'12px',fontSize:'12px',color:'#b45309',lineHeight:1.5}}>
                <i className="fa-solid fa-triangle-exclamation" style={{marginRight:'6px'}}></i>เปลี่ยนหมวดได้ แต่ไฟล์นี้บีบไว้ตามหมวดเดิมแล้ว <strong>คุณภาพคงเดิม</strong> — ถ้าอยากได้ความคมระดับ CXR เต็ม ต้องอัปไฟล์ใหม่
              </div>
            )}
            {err && <p style={{fontSize:'12px',color:'#dc2626',margin:'0 0 10px'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{err}</p>}
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setEditTarget(null)} disabled={savingEdit} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ยกเลิก</button>
              <button onClick={doEdit} disabled={savingEdit} style={{flex:1,padding:'10px',borderRadius:'10px',background:savingEdit?'#5eead4':'#0d9488',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:savingEdit?'wait':'pointer'}}>{savingEdit?'กำลังบันทึก...':'บันทึก'}</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}

// ── หน้าคลังรูปภาพรวมทุกผู้ป่วย (Google Photos style) ──────────────────────
function ImageLibraryPage({ currentUser }) {
  const _lc0 = loadCache('tb_libimg');
  const [images, setImages] = React.useState(_lc0 ? _lc0.data : null);
  const [loading, setLoading] = React.useState(!_lc0);
  const [err, setErr]       = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('new');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo]     = React.useState('');
  const [uploaderFilter, setUploaderFilter] = React.useState('all');
  const [q, setQ]           = React.useState('');
  const [lightbox, setLightbox] = React.useState(null);
  const [editTarget, setEditTarget] = React.useState(null);
  const [editType, setEditType]   = React.useState('cxr');
  const [editNote, setEditNote]   = React.useState('');
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [delTarget, setDelTarget] = React.useState(null);
  const [delReason, setDelReason] = React.useState('');   // เหตุผลการลบ (บังคับ — ลบยากเหมือนผู้ป่วย)
  const [delHn, setDelHn] = React.useState('');           // พิมพ์ HN ยืนยันตอนย้ายเข้าถัง
  const [delStep2, setDelStep2] = React.useState(false);  // ป๊อปอัปยืนยันซ้ำ (สเต็ป 2)
  const [deleting, setDeleting] = React.useState(false);
  const isAdmin = currentUser?.role === 'admin';

  // โหลดทุกรูปครั้งเดียว → กรอง/ค้นหาในเครื่อง + cache (เปิดซ้ำ/รีเฟรชไม่โหลดใหม่)
  const load = React.useCallback(async (force, silent) => {
    const c = loadCache('tb_libimg');
    if (c && !force && (Date.now() - c.ts < CACHE_TTL)) { setImages(c.data); setLoading(false); return; }
    if (!c && !silent) setLoading(true);   // silent = refresh เงียบ ไม่ขึ้น skeleton
    setErr('');
    try {
      const r = await fetch('/api/patient/images/all');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'โหลดไม่สำเร็จ');
      saveCache('tb_libimg', d.images || []);
      setImages(d.images || []);
    } catch (e) { setErr(e.message); if (!c) setImages([]); }
    setLoading(false);
  }, []);
  React.useEffect(() => { load(); }, [load]);
  // Realtime: รูปผู้ป่วยคนใดเปลี่ยน (อัป/ลบ/แก้ — ข้ามผู้ใช้) → รีเฟรชคลังรูป
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window._sb) return;
    const ch = window._sb.channel('patimg-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_patient_images' }, (payload) => {
        invalidateImgCaches();
        const ev = payload.eventType, n = payload.new, o = payload.old;
        if (ev === 'DELETE') { if (o && o.id) setImages(arr => (arr||[]).filter(x => x.id !== o.id)); }
        else if (ev === 'UPDATE') {
          if (n && n.deleted_at) setImages(arr => (arr||[]).filter(x => x.id !== n.id));
          else if (n) setImages(arr => (arr||[]).map(x => x.id === n.id ? { ...x, type: n.type, note: n.note, title: n.title, width: n.width, height: n.height, size_bytes: n.size_bytes, quality: n.quality } : x));  // แก้หมวด/คำอธิบาย → อัปเดตตรงๆ
        }
        else load(true, true);   // INSERT
      })
      .subscribe();
    return () => { try { window._sb.removeChannel(ch); } catch {} };
  }, [load]);

  const qq = q.trim().toLowerCase();
  const uploaders = [...new Set((images || []).map(im => im.uploader_name).filter(Boolean))];
  const flat = (images || []).filter(im =>
    (filter === 'all' || im.type === filter) &&
    (uploaderFilter === 'all' || im.uploader_name === uploaderFilter) &&
    imgInRange(im, dateFrom, dateTo) &&
    (!qq || (im.patient_name || '').toLowerCase().includes(qq) || (im.patient_hn || '').toLowerCase().includes(qq))
  ).sort(imgSortCmp(sortBy));
  const openImage = (im, rect) => {   // เปิดด้วย index → ลูกศรเลื่อนข้ามทุกผู้ป่วยได้
    const idx = flat.findIndex(x => x.id === im.id);
    if (idx >= 0) setLightbox({ idx, rect });
  };
  const openEdit = (im) => { setEditTarget(im); setEditType(im.type); setEditNote(im.note || ''); setErr(''); };
  const doEdit = async () => {
    if (!editTarget) return;
    const cur = editTarget, id = cur.id, nt = editType, nn = editNote || null;
    const newMax = nt === 'cxr' ? 4096 : 2560;
    const curMaxDim = Math.max(cur.width || 0, cur.height || 0);
    const needShrink = cur.mime !== 'image/gif' && curMaxDim > newMax + 4;   // ขนาดเกินหมวดใหม่ → ย่อไฟล์จริง (เช่น CXR 4096 → Lab 2560)
    if (!needShrink) {
      setImages(arr => (arr||[]).map(x => x.id===id ? { ...x, type: nt, note: nn } : x));   // เปลี่ยนป้าย → ทันที
      invalidateImgCaches(); setEditTarget(null);
      fetch('/api/patient/images/' + id, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: nt, note: nn }) })
        .then(r => { if (!r.ok) { setErr('แก้ไขไม่สำเร็จ'); load(true, true); } }).catch(() => { setErr('แก้ไขไม่สำเร็จ'); load(true, true); });
      return;
    }
    setSavingEdit(true); setErr('');   // ย่อจริง: โหลดรูปปัจจุบัน → ย่อ → อัปทับ → ลบไฟล์เก่า
    try {
      const ur = await fetch('/api/patient/images/' + id + '/url'); const ud = await ur.json();
      if (!ur.ok || !ud.url) throw new Error('โหลดรูปเดิมไม่ได้');
      const obj = URL.createObjectURL(await (await fetch(ud.url)).blob());
      const c = await compressToWebp(obj, nt==='cxr'?0.92:0.87, newMax);
      const th = await compressToWebp(obj, 0.7, 400);
      URL.revokeObjectURL(obj);
      const pres = await fetch('/api/patient/images/presign', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ patientId: cur.patient_id, ext: 'webp' }) });
      const pd = await pres.json(); if (!pres.ok) throw new Error(pd.error || 'ขอลิงก์ไม่ได้');
      await putWithProgress(pd.uploadUrl, c.blob, null, 'image/webp');
      try { await fetch(pd.uploadUrlThumb, { method: 'PUT', body: th.blob, headers: { 'content-type': 'image/webp' } }); } catch {}
      const r = await fetch('/api/patient/images/' + id, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: nt, note: nn, storageKey: pd.key, thumbKey: pd.thumbKey, width: c.width, height: c.height, size: c.blob.size, quality: nt==='cxr'?92:87, oldKey: cur.storage_key, oldThumbKey: cur.thumb_key }) });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'บันทึกไม่สำเร็จ'); }
      setEditTarget(null); invalidateImgCaches(); await load(true, true);   // ดึง url/มิติใหม่
    } catch (e) { setErr('ปรับขนาดไม่สำเร็จ: ' + (e.message || '')); }
    setSavingEdit(false);
  };
  const doDelete = () => {
    if (!delTarget) return;
    const reason = delReason.trim();
    if (reason.length < 3) return;   // บังคับกรอกเหตุผล (ลบยากเหมือนผู้ป่วย)
    if (delHn.trim() !== String(delTarget.patient_hn || '')) return;   // ต้องพิมพ์ HN ผู้ป่วยให้ตรง
    const id = delTarget.id;
    setImages(arr => (arr||[]).filter(x => x.id !== id));   // optimistic: หายทันที + ปิดป๊อปอัป + เลื่อน
    invalidateImgCaches(); setDelTarget(null); setDelReason(''); setDelHn(''); setDelStep2(false); setLightbox(null);
    fetch('/api/patient/images/' + id, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reason }) })   // ลบจริงเบื้องหลัง (ไม่รอ)
      .then(r => { if (!r.ok) { setErr('ลบไม่สำเร็จ — กู้รายการกลับมา'); load(true, true); } })
      .catch(() => { setErr('ลบไม่สำเร็จ — กู้รายการกลับมา'); load(true, true); });
  };

  const [vMode, setVMode] = React.useState('card');   // มุมมองรูป: การ์ด/แถว
  const [vSize, setVSize] = React.useState(1);         // ขนาด 0/1/2
  const [pSort, setPSort] = React.useState('name-asc');   // เรียงกลุ่มผู้ป่วย: name/hn

  const groups = {};
  for (const im of flat) {
    if (!groups[im.patient_id]) groups[im.patient_id] = { name: im.patient_name, hn: im.patient_hn, items: [] };
    groups[im.patient_id].items.push(im);
  }
  const groupEntries = Object.entries(groups).sort((a,b)=>{
    const [pf,pd] = pSort.split('-');
    const r = pf==='hn'
      ? String(a[1].hn||'').localeCompare(String(b[1].hn||''), undefined, {numeric:true})
      : (a[1].name||'').localeCompare(b[1].name||'', 'th');
    return pd==='desc' ? -r : r;
  });

  const renderThumb = (im) => {
    const meta = PATIENT_IMG_TYPES[im.type] || PATIENT_IMG_TYPES.other;
    return (
      <div className="tb-img-thumb" title={(im.patient_name||'') + (im.title?(' · '+im.title):'')}
        onClick={(e)=>openImage(im, e.currentTarget.getBoundingClientRect())}
        style={{position:'relative',width:'100%',height:'100%',background:'#0b0f19',borderRadius:'10px',overflow:'hidden',cursor:'zoom-in',border:'1px solid #e5e7eb'}}>
        <img src={im.thumbUrl || im.url} alt="" loading="lazy" draggable={false} onContextMenu={e=>e.preventDefault()} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        <div className="tb-img-zoomicon" style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.22)',pointerEvents:'none'}}><i className="fa-solid fa-magnifying-glass-plus" style={{color:'#fff',fontSize:'18px',textShadow:'0 1px 5px rgba(0,0,0,0.6)'}}></i></div>
        <span style={{position:'absolute',top:'5px',right:'5px',fontSize:'9px',fontWeight:800,padding:'2px 6px',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
        <span style={{position:'absolute',bottom:0,left:0,right:0,padding:'10px 6px 4px',background:'linear-gradient(transparent,rgba(0,0,0,0.6))',color:'#fff',fontSize:'9px'}}>{new Date(im.uploaded_at).toLocaleDateString('th-TH',{day:'numeric',month:'short'})}</span>
      </div>
    );
  };

  const renderRow = (im) => {   // มุมมองแถว (คอลัม)
    const meta = PATIENT_IMG_TYPES[im.type] || PATIENT_IMG_TYPES.other;
    const th = IMG_VIEW_SIZES[vSize].thumb;
    const sz = im.size_bytes!=null ? (im.size_bytes<1048576?Math.round(im.size_bytes/1024)+' KB':(im.size_bytes/1048576).toFixed(1)+' MB') : '';
    const up = new Date(im.uploaded_at).toLocaleString('th-TH',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const dimF = (im.width&&im.height)?im.width+' × '+im.height+' px':'—';
    const qual = im.mime==='image/gif' ? 'GIF' : 'WebP '+(im.type==='cxr'?92:87)+'%';
    return (
      <div key={im.id} onClick={(e)=>openImage(im, e.currentTarget.getBoundingClientRect())} style={{display:'flex',alignItems:'center',gap:'10px',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'7px 10px',background:'#fff',cursor:'zoom-in',marginBottom:'8px'}}>
        <div style={{width:th+'px',height:th+'px',flexShrink:0,borderRadius:'8px',overflow:'hidden',background:'#0b0f19'}}><img src={im.thumbUrl||im.url} alt="" loading="lazy" draggable={false} onContextMenu={e=>e.preventDefault()} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
        <span style={{flexShrink:0,width:'52px',fontSize:'10px',fontWeight:800,padding:'2px 0',textAlign:'center',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
        <div style={{flexShrink:0,width:'146px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>อัปโหลด</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{up}</p></div>
        <div style={{flexShrink:0,width:'112px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>ขนาดภาพ</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{dimF}</p></div>
        <div style={{flexShrink:0,width:'82px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>คุณภาพ</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{qual}</p></div>
        <div style={{flex:1,minWidth:'70px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>หมายเหตุ</p><p style={{fontSize:'12px',color:'#374151',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{im.title||im.note||'—'}</p></div>
        <div style={{flexShrink:0,width:'102px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>อัปโหลดโดย</p><p style={{fontSize:'12px',color:'#374151',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{im.uploader_name||'—'}</p></div>
        <div style={{flexShrink:0,width:'60px',textAlign:'right'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>ไฟล์</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{sz}</p></div>
      </div>
    );
  };

  return (
    <div>
      {/* ตัวกรอง + ค้นหา (ชื่อหน้าอยู่บนแถบหัวเรื่องด้านบนแล้ว) */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',marginBottom:'16px',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {['all',...Object.keys(PATIENT_IMG_TYPES)].map(k=>{const active=filter===k;const v=PATIENT_IMG_TYPES[k];return <button key={k} onClick={()=>setFilter(k)} style={{padding:'5px 14px',borderRadius:'999px',fontSize:'12px',fontWeight:700,border:'1px solid '+(active?'#0d9488':'#e5e7eb'),background:active?'#0d9488':'#fff',color:active?'#fff':'#6b7280',cursor:'pointer'}}>{k==='all'?'ทั้งหมด':v.label}</button>;})}
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} title="เรียงลำดับ" style={{padding:'7px 10px',borderRadius:'10px',border:'1px solid #d1d5db',fontSize:'13px',color:'#6b7280',cursor:'pointer'}}>
            {IMG_SORTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
          <select value={pSort} onChange={e=>setPSort(e.target.value)} title="เรียงผู้ป่วย" style={{padding:'7px 10px',borderRadius:'10px',border:'1px solid #d1d5db',fontSize:'13px',color:'#6b7280',cursor:'pointer'}}>
            <option value="name-asc">ชื่อ ก → ฮ</option>
          <option value="name-desc">ชื่อ ฮ → ก</option>
            <option value="hn-asc">HN น้อย → มาก</option>
          <option value="hn-desc">HN มาก → น้อย</option>
          </select>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} title="ตั้งแต่วันที่" style={{padding:'6px 8px',borderRadius:'10px',border:'1px solid #d1d5db',fontSize:'12px',color:'#6b7280'}}/>
          <span style={{fontSize:'12px',color:'#9ca3af'}}>ถึง</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} title="ถึงวันที่" style={{padding:'6px 8px',borderRadius:'10px',border:'1px solid #d1d5db',fontSize:'12px',color:'#6b7280'}}/>
          {(dateFrom||dateTo) && <button onClick={()=>{setDateFrom('');setDateTo('');}} title="ล้างวันที่" style={{fontSize:'13px',color:'#0d9488',background:'none',border:'none',cursor:'pointer'}}><i className="fa-solid fa-xmark"></i></button>}
          {uploaders.length>1 && <select value={uploaderFilter} onChange={e=>setUploaderFilter(e.target.value)} title="กรองตามคนอัปโหลด" style={{padding:'7px 10px',borderRadius:'10px',border:'1px solid #d1d5db',fontSize:'13px',color:'#6b7280',cursor:'pointer',maxWidth:'160px'}}><option value="all">คนอัปโหลด: ทุกคน</option>{uploaders.map(u=><option key={u} value={u}>{u}</option>)}</select>}
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาชื่อ / HN ผู้ป่วย" style={{padding:'8px 12px',borderRadius:'10px',border:'1px solid #d1d5db',fontSize:'13px',minWidth:'160px'}}/>
          <ImgViewToolbar mode={vMode} setMode={setVMode} size={vSize} setSize={setVSize}/>
        </div>
      </div>
      {err && <p style={{color:'#dc2626',fontSize:'13px'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{err}</p>}

      {/* กำลังโหลด → โครงร่างเบลอ (สื่อว่ามีรูปกำลังมา ไม่ใช่รูปหาย) */}
      {loading && [0,1].map(g=>(
        <div key={g} style={{marginBottom:'22px'}}>
          <div className="tb-skel" style={{height:'14px',width:'170px',borderRadius:'6px',marginBottom:'10px'}}/>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            {[0,1,2,3,4,5].map(i=><div key={i} className="tb-skel" style={{width:(120+(i%3)*44)+'px',height:'170px',borderRadius:'10px'}}/>)}
          </div>
        </div>
      ))}

      {!loading && flat.length===0 && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px'}}>
          <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
            <i className="fa-solid fa-images" style={{fontSize:'32px',color:'#cbd5e1'}}></i>
          </div>
          <p style={{fontSize:'15px',fontWeight:700,color:'#6b7280',margin:'0 0 4px'}}>{(q||filter!=='all'||dateFrom||dateTo||uploaderFilter!=='all')?'ไม่พบรูปที่ตรงกับตัวกรอง':'ยังไม่มีรูปในระบบ'}</p>
          <p style={{fontSize:'12px',color:'#9ca3af',margin:0,textAlign:'center'}}>{(q||filter!=='all'||dateFrom||dateTo||uploaderFilter!=='all')?'ลองล้างตัวกรองหรือเปลี่ยนคำค้นหา':'อัปโหลดรูปได้จากแท็บ "รูปภาพ" ในหน้าผู้ป่วย'}</p>
        </div>
      )}
      {!loading && groupEntries.map(([pid,g])=>(
        <div key={pid} style={{marginBottom:'22px'}}>
          <p style={{fontWeight:700,fontSize:'14px',color:'#1f2937',margin:'0 0 8px',borderLeft:'3px solid #0d9488',paddingLeft:'8px'}}>{g.name}{g.hn?<span style={{color:'#9ca3af',fontWeight:400,fontSize:'12px'}}> · HN {g.hn}</span>:null} <span style={{color:'#9ca3af',fontWeight:400,fontSize:'12px'}}>({g.items.length})</span></p>
          {vMode==='card'
            ? <JustifiedGallery items={g.items} targetHeight={IMG_VIEW_SIZES[vSize].jh} gap={8} renderItem={renderThumb}/>
            : g.items.map(renderRow)}
        </div>
      ))}

      {editTarget && createPortal(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={savingEdit?undefined:()=>setEditTarget(null)}>
          <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'380px',padding:'22px'}}>
            <p style={{fontSize:'15px',fontWeight:700,color:'#0f766e',margin:'0 0 14px'}}><i className="fa-solid fa-pen" style={{marginRight:'8px'}}></i>แก้หมวด / หมายเหตุ</p>
            <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>หมวดรูป</label>
            <select value={editType} onChange={e=>setEditType(e.target.value)} disabled={savingEdit} style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px',marginBottom:'12px',boxSizing:'border-box'}}>
              {Object.entries(PATIENT_IMG_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>หมายเหตุ (ไม่บังคับ)</label>
            <input value={editNote} onChange={e=>setEditNote(e.target.value)} disabled={savingEdit} placeholder="หมายเหตุ" style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px',marginBottom:'12px',boxSizing:'border-box'}}/>
            {editType==='cxr' && editTarget.type!=='cxr' && (
              <div style={{background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:'10px',padding:'9px 12px',marginBottom:'12px',fontSize:'12px',color:'#b45309',lineHeight:1.5}}>
                <i className="fa-solid fa-triangle-exclamation" style={{marginRight:'6px'}}></i>เปลี่ยนหมวดได้ แต่ไฟล์นี้บีบไว้ตามหมวดเดิมแล้ว <strong>คุณภาพคงเดิม</strong> — อยากได้ CXR เต็มต้องอัปใหม่
              </div>
            )}
            {err && <p style={{fontSize:'12px',color:'#dc2626',margin:'0 0 10px'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{err}</p>}
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setEditTarget(null)} disabled={savingEdit} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ยกเลิก</button>
              <button onClick={doEdit} disabled={savingEdit} style={{flex:1,padding:'10px',borderRadius:'10px',background:savingEdit?'#5eead4':'#0d9488',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:savingEdit?'wait':'pointer'}}>{savingEdit?'กำลังบันทึก...':'บันทึก'}</button>
            </div>
          </div>
        </div>, document.body
      )}
      {delTarget && createPortal(
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={deleting?undefined:()=>{setDelTarget(null);setDelStep2(false);}}>
          <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'360px',padding:'22px',minHeight:'404px',display:'flex',flexDirection:'column',boxSizing:'border-box'}}>
            <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}><i className="fa-solid fa-trash-can" style={{color:'#dc2626',fontSize:'19px'}}></i></div>
            {!delStep2 ? (<>
            <p style={{fontSize:'15px',fontWeight:700,color:'#111827',margin:'0 0 6px',textAlign:'center'}}>ย้ายรูปนี้ไปถังขยะ</p>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 14px',textAlign:'center'}}>กู้คืนได้ภายใน 60 วัน หลังจากนั้นลบถาวรอัตโนมัติ</p>
            <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>เหตุผลการลบ <span style={{color:'#dc2626'}}>*</span></label>
            <textarea value={delReason} onChange={e=>setDelReason(e.target.value)} disabled={deleting} placeholder="เช่น รูปซ้ำ / อัปผิดคน / ภาพไม่ชัด" rows={2} style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px',marginBottom:'12px',boxSizing:'border-box',resize:'vertical',fontFamily:'inherit'}}/>
            <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>พิมพ์ HN <span style={{color:'#dc2626'}}>{delTarget&&delTarget.patient_hn}</span> เพื่อยืนยัน</label>
            <input value={delHn} onChange={e=>setDelHn(e.target.value)} disabled={deleting} style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid '+(delHn&&delTarget&&delHn.trim()!==String(delTarget.patient_hn||'')?'#fca5a5':'#d1d5db'),fontSize:'13px',marginBottom:'14px',boxSizing:'border-box'}}/>
            <div style={{display:'flex',gap:'10px',marginTop:'auto'}}>
              <button onClick={()=>{setDelTarget(null);setDelReason('');setDelHn('');setDelStep2(false);}} disabled={deleting} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ยกเลิก</button>
              <button onClick={()=>setDelStep2(true)} disabled={deleting||delReason.trim().length<3||!delTarget||delHn.trim()!==String(delTarget.patient_hn||'')} style={{flex:1,padding:'10px',borderRadius:'10px',background:(deleting||delReason.trim().length<3||!delTarget||delHn.trim()!==String(delTarget.patient_hn||''))?'#fca5a5':'#dc2626',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:(deleting||delReason.trim().length<3||!delTarget||delHn.trim()!==String(delTarget.patient_hn||''))?'not-allowed':'pointer'}}>ถัดไป</button>
            </div>
            </>) : (<>
            <p style={{fontSize:'15px',fontWeight:700,color:'#111827',margin:'0 0 6px',textAlign:'center'}}>ยืนยันย้ายรูปไปถังขยะ</p>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 10px',textAlign:'center'}}>ยืนยันว่าต้องการลบรูปนี้จริง</p>
            <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'10px 12px',marginBottom:'14px',fontSize:'12px',color:'#4b5563',wordBreak:'break-word'}}><i className="fa-solid fa-circle-info" style={{marginRight:'6px',color:'#0d9488'}}></i>เหตุผล: {delReason}</div>
            <div style={{display:'flex',gap:'10px',marginTop:'auto'}}>
              <button onClick={doDelete} disabled={deleting} style={{flex:1,padding:'10px',borderRadius:'10px',background:deleting?'#fca5a5':'#dc2626',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:deleting?'wait':'pointer'}}>{deleting?'กำลังลบ...':'ยืนยันลบ'}</button>
              <button onClick={()=>setDelStep2(false)} disabled={deleting} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ย้อนกลับ</button>
            </div>
            </>)}
          </div>
        </div>, document.body
      )}
      {lightbox && (()=>{
        const cur = flat[lightbox.idx]; if (!cur) return null;
        const meta = PATIENT_IMG_TYPES[cur.type] || PATIENT_IMG_TYPES.other;
        const name = meta.label + ' · ' + cur.patient_name + (cur.patient_hn ? ' (' + cur.patient_hn + ')' : '');
        const canDel = cur.uploaded_by===currentUser?.id || isAdmin;
        const acts = canDel ? [
          { icon:'fa-pen', label:'แก้หมวด / คำอธิบาย', onClick:()=>{ openEdit(cur); } },
          { icon:'fa-trash-can', label:'ลบรูป', danger:true, onClick:()=>{ setDelReason(''); setDelHn(''); setDelStep2(false); setDelTarget(cur); } },
        ] : [];
        const info = patientImgInfo(cur, meta, name);
        info.noteEditable = canDel;
        info.onSaveNote = async (text) => { await fetch('/api/patient/images/'+cur.id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({note:text||null})}); setImages(arr=>(arr||[]).map(x=>x.id===cur.id?{...x,note:text||null}:x)); invalidateImgCaches(); };
        return <AvatarLightbox src={cur.url} thumb={cur.thumbUrl} originRect={lightbox.rect} info={info} menuActions={acts}
          hasPrev={lightbox.idx>0} hasNext={lightbox.idx<flat.length-1}
          onPrev={()=>setLightbox(l=>({ idx: Math.max(0, l.idx-1) }))}
          onNext={()=>setLightbox(l=>({ idx: Math.min(flat.length-1, l.idx+1) }))}
          onExpire={async()=>{ try { const r=await fetch(`/api/patient/images/${cur.id}/url`); if(r.ok){ const d=await r.json(); return d.url; } } catch {} return null; }}
          onClose={()=>setLightbox(null)}/>;
      })()}
    </div>
  );
}


export { TrashHub, PatientImagesTab, ImageLibraryPage }
