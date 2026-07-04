'use client'
/** patient-images/helpers.jsx — foundation รูปภาพ (แยกรอบ 3) : codecs, JustifiedGallery, ImgViewToolbar, patientImgInfo, cache, CXR viewers */
import * as React from 'react'
import { createPortal } from 'react-dom'
const { useState, useEffect, useRef } = React
import { loadImageEl } from '../shared'

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

// ══════════ ระบบ "ขอลบรูป" เฟส 2 (v0.7.20) — overlay ฝ้าขาว + popup ขอลบ/อนุมัติ ══════════

// overlay "รออนุมัติลบ" (ฝ้าขาว) ทับ thumbnail · แยกมุมมอง: ผู้ขอเห็น "ยกเลิกคำขอ" · แอดมินเห็น "อนุมัติ/ปฏิเสธ"
// พื้นฝ้า pointer-events:none (กดทะลุเปิดตัวดูรูปได้) · ปุ่ม pointer-events:auto + stopPropagation
function PendingDeleteOverlay({ image, isAdmin, isRequester, onCancel, onApprove, onReject }) {
  const stop = (e, fn) => { e.stopPropagation(); e.preventDefault(); if (fn) fn(); };
  return (
    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',inset:0,background:'rgba(255,251,235,0.82)',backdropFilter:'blur(2px)',WebkitBackdropFilter:'blur(2px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'7px',padding:'8px',boxSizing:'border-box',cursor:'default',zIndex:3,overflow:'hidden'}}>
      <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'10px',fontWeight:800,padding:'3px 9px',borderRadius:'999px',background:'#fef3c7',color:'#92400e',border:'1px solid #fcd34d',whiteSpace:'nowrap'}}>
        <i className="fa-solid fa-clock"></i>รออนุมัติลบ
      </span>
      {isAdmin ? (<>
        {(image?.delete_req_name || image?.delete_req_reason) && (
          <p style={{margin:0,fontSize:'9.5px',color:'#78716c',textAlign:'center',lineHeight:1.35,maxWidth:'98%',overflow:'hidden',textOverflow:'ellipsis'}}>
            {image.delete_req_name && <span>{image.delete_req_name} ขอลบ</span>}{image.delete_req_reason && <><br/>“{image.delete_req_reason}”</>}
          </p>
        )}
        <div style={{display:'flex',gap:'6px',pointerEvents:'auto',flexWrap:'wrap',justifyContent:'center'}}>
          <button onClick={e=>stop(e,onApprove)} style={{fontSize:'11px',fontWeight:700,color:'#fff',background:'#0d9488',border:'none',borderRadius:'8px',padding:'6px 11px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap'}}><i className="fa-solid fa-check"></i>อนุมัติ</button>
          <button onClick={e=>stop(e,onReject)} style={{fontSize:'11px',fontWeight:700,color:'#dc2626',background:'#fee2e2',border:'none',borderRadius:'8px',padding:'6px 11px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap'}}><i className="fa-solid fa-xmark"></i>ปฏิเสธ</button>
        </div>
      </>) : isRequester ? (
        <button onClick={e=>stop(e,onCancel)} style={{fontSize:'11px',fontWeight:700,color:'#4b5563',background:'#fff',border:'1px solid #d1d5db',borderRadius:'8px',padding:'6px 12px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'5px',whiteSpace:'nowrap',pointerEvents:'auto'}}><i className="fa-solid fa-rotate-left"></i>ยกเลิกคำขอ</button>
      ) : null}
    </div>
  );
}

// popup "ขอลบรูป" (คนที่ไม่ใช่แอดมินกด) — กรอกเหตุผล + พิมพ์ HN ยืนยัน (เหมือนตอนแอดมินลบ) → POST request-delete
function ImageRequestDeleteModal({ image, lightboxOpen, onClose, onDone }) {
  const [reason, setReason] = React.useState('');
  const [hn, setHn]         = React.useState('');
  const [busy, setBusy]     = React.useState(false);
  const [err, setErr]       = React.useState('');
  const reasonOk = reason.trim().length >= 3;
  const hnOk = hn.trim() === String(image.patient_hn || '');
  const disabled = busy || !reasonOk || !hnOk;
  const submit = async () => {
    if (!reasonOk) { setErr('กรุณากรอกเหตุผลการขอลบ'); return; }
    if (!hnOk) { setErr('HN ไม่ตรง — พิมพ์ให้ตรงกับผู้ป่วย'); return; }
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/patient/images/' + image.id + '/request-delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error === 'already requested' ? 'รูปนี้มีคำขอลบค้างอยู่แล้ว' : (d.error || 'ส่งคำขอไม่สำเร็จ')); }
      onDone(reason.trim()); onClose();
    } catch (e) { setErr(e.message || 'เกิดข้อผิดพลาด'); setBusy(false); }
  };
  return createPortal(
    <div className={lightboxOpen?'':'tb-backdrop'} style={{position:'fixed',inset:0,...(lightboxOpen?{background:'rgba(15,23,42,0.6)'}:{}),zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={busy?undefined:onClose}>
      <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'350px',padding:'22px',textAlign:'center',boxSizing:'border-box'}}>
        <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'#fef3c7',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}><i className="fa-solid fa-trash-can" style={{color:'#b45309',fontSize:'20px'}}></i></div>
        <p style={{fontSize:'15px',fontWeight:700,color:'#111827',margin:'0 0 5px'}}>ขอลบรูปนี้</p>
        <p style={{fontSize:'12.5px',color:'#6b7280',margin:'0 0 14px',lineHeight:1.5}}>รูปจะขึ้นสถานะ "รออนุมัติลบ" จนกว่าแอดมินจะอนุมัติ</p>
        <div style={{textAlign:'left'}}>
          <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>เหตุผลการขอลบ <span style={{color:'#dc2626'}}>*</span></label>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} disabled={busy} rows={2} placeholder="เช่น อัปผิดคน / รูปซ้ำ / ภาพไม่ชัด" style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px',boxSizing:'border-box',resize:'vertical',fontFamily:'inherit',marginBottom:'12px'}}/>
          <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>พิมพ์ HN <span style={{color:'#dc2626'}}>{image.patient_hn || '-'}</span> เพื่อยืนยัน</label>
          <input value={hn} onChange={e=>setHn(e.target.value)} disabled={busy} style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid '+(hn && !hnOk ? '#fca5a5':'#d1d5db'),fontSize:'13px',boxSizing:'border-box'}}/>
        </div>
        {err && <p style={{fontSize:'12px',color:'#dc2626',margin:'8px 0 0',textAlign:'left'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{err}</p>}
        <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
          <button onClick={onClose} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ยกเลิก</button>
          <button onClick={submit} disabled={disabled} style={{flex:1,padding:'10px',borderRadius:'10px',background:disabled?'#a7f3d0':'#0d9488',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:disabled?'not-allowed':'pointer'}}>{busy?'กำลังส่ง...':'ส่งคำขอลบ'}</button>
        </div>
      </div>
    </div>, document.body
  );
}

// popup แอดมิน "อนุมัติ/ปฏิเสธ" คำขอลบรูป → POST review-delete
function ImageReviewDeleteModal({ image, action, lightboxOpen, onClose, onDone }) {
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr]   = React.useState('');
  const approve = action === 'approve';
  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/patient/images/' + image.id + '/review-delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, note: note.trim() || null }),
      });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'ดำเนินการไม่สำเร็จ'); }
      onDone(action); onClose();
    } catch (e) { setErr(e.message || 'เกิดข้อผิดพลาด'); setBusy(false); }
  };
  return createPortal(
    <div className={lightboxOpen?'':'tb-backdrop'} style={{position:'fixed',inset:0,...(lightboxOpen?{background:'rgba(15,23,42,0.6)'}:{}),zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={busy?undefined:onClose}>
      <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'350px',padding:'22px',textAlign:'center'}}>
        <div style={{width:'50px',height:'50px',borderRadius:'50%',background:approve?'#ccfbf1':'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}><i className={approve?'fa-solid fa-check':'fa-solid fa-xmark'} style={{color:approve?'#0d9488':'#dc2626',fontSize:'20px'}}></i></div>
        <p style={{fontSize:'15px',fontWeight:700,color:'#111827',margin:'0 0 5px'}}>{approve?'อนุมัติลบรูปนี้':'ปฏิเสธคำขอลบ'}</p>
        <p style={{fontSize:'12.5px',color:'#6b7280',margin:'0 0 12px',lineHeight:1.5}}>{approve?'รูปจะถูกย้ายไปถังขยะ (กู้คืนได้ 60 วัน)':'รูปจะกลับมาแสดงตามปกติ'}</p>
        {(image.delete_req_name || image.delete_req_reason) && (
          <div style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'9px 11px',margin:'0 0 12px',fontSize:'12px',color:'#4b5563',textAlign:'left',lineHeight:1.55}}>
            {image.delete_req_name && <div><b style={{color:'#374151'}}>ผู้ขอ:</b> {image.delete_req_name}</div>}
            {image.delete_req_reason && <div><b style={{color:'#374151'}}>เหตุผล:</b> {image.delete_req_reason}</div>}
          </div>
        )}
        {!approve && (
          <div style={{textAlign:'left'}}>
            <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>หมายเหตุถึงผู้ขอ (ไม่บังคับ)</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} disabled={busy} rows={2} placeholder="เช่น รูปยังจำเป็นต้องเก็บ" style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid #d1d5db',fontSize:'13px',boxSizing:'border-box',resize:'vertical',fontFamily:'inherit'}}/>
          </div>
        )}
        {err && <p style={{fontSize:'12px',color:'#dc2626',margin:'8px 0 0',textAlign:'left'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{err}</p>}
        <div style={{display:'flex',gap:'10px',marginTop:'14px'}}>
          <button onClick={onClose} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ยกเลิก</button>
          <button onClick={submit} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:busy?(approve?'#5eead4':'#fca5a5'):(approve?'#0d9488':'#dc2626'),color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:busy?'wait':'pointer'}}>{busy?'กำลังทำ...':(approve?'ยืนยันอนุมัติ':'ยืนยันปฏิเสธ')}</button>
        </div>
      </div>
    </div>, document.body
  );
}

// ── ถังขยะรูปรวมทุกผู้ป่วย (จัดกลุ่มตามผู้ป่วย + กรอง + มุมมอง · กู้คืน/ลบถาวร = แอดมิน) ──

export { compressToWebp, putWithProgress, blobToDataURL, decodeImageToDataURL, isAnimatedGif,
  JustifiedGallery, fmtFileSize, mimeLabel, detectDevice, IMG_SORTS, imgInRange, imgSortCmp,
  patientImgInfo, PATIENT_IMG_TYPES, CXRComparePanel, CXRCompareModal, CACHE_TTL, loadCache,
  saveCache, invalidateImgCaches, IMG_VIEW_SIZES, ImgViewToolbar,
  PendingDeleteOverlay, ImageRequestDeleteModal, ImageReviewDeleteModal }
