'use client'
/** patient-images/library.jsx — คลังรูปรวม (ImageLibraryPage) (แยกรอบ 3) */
import * as React from 'react'
import { createPortal } from 'react-dom'
const { useState, useEffect, useCallback } = React
import { AvatarLightbox } from '../shared'
import { compressToWebp, putWithProgress, JustifiedGallery, IMG_SORTS, imgInRange, imgSortCmp,
  patientImgInfo, PATIENT_IMG_TYPES, CACHE_TTL, loadCache, saveCache, invalidateImgCaches,
  IMG_VIEW_SIZES, ImgViewToolbar, PendingDeleteOverlay, ImageRequestDeleteModal, ImageReviewDeleteModal, ImageCancelRequestModal,
  storeImgs, getStoredImgs, updateStoredImg, removeStoredImg } from './helpers'
import { ImageLogPage, SnapModal, imageToSnap } from './image-log'
import { phashDistance } from './image-hash'

const DUP_COLORS = ['#7c3aed', '#db2777', '#2563eb', '#ea580c', '#0891b2', '#65a30d', '#c026d3'];   // สีป้ายรูปซ้ำ (วนตาม cluster)

function ImageLibraryPage({ currentUser, pendingImageRequests, wantPending, onConsumeWant, onGoTrash }) {
  const _lc0 = loadCache('tb_libimg');
  const _seed0 = _lc0 ? _lc0.data : (getStoredImgs().length ? getStoredImgs() : null);   // v0.7.20.1 — seed จาก shared store (โหลดในหน้าอื่นแล้ว) กันขึ้น skeleton
  const [images, setImages] = React.useState(_seed0);
  const [loading, setLoading] = React.useState(!_seed0);
  const _seededRef = React.useRef(!!_seed0);
  const [err, setErr]       = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('new');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo]     = React.useState('');
  const [uploaderFilter, setUploaderFilter] = React.useState('all');
  const [q, setQ]           = React.useState('');
  const [lightbox, setLightbox] = React.useState(null);
  const [detailImg, setDetailImg] = React.useState(null);   // รูปที่กดดูข้อมูล (popup ทับ · จากปุ่มในการ์ด/ตัวดูรูป)
  const [reqTarget, setReqTarget] = React.useState(null);        // v0.7.20 — รูปที่กำลัง "ขอลบ"
  const [reviewTarget, setReviewTarget] = React.useState(null);  // v0.7.20 — {im, action} แอดมินอนุมัติ/ปฏิเสธ
  const [cancelTarget, setCancelTarget] = React.useState(null);  // v0.7.20.2 — รูปที่กำลังยืนยัน "ยกเลิกคำขอลบ"
  const [libView, setLibView] = React.useState('gallery');       // v0.7.21 — สลับ คลังรูป/ประวัติ (admin)
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
  const pendingCount = pendingImageRequests?.length || 0;
  const [pendingMode, setPendingMode] = React.useState(false);   // v0.7.20.1 — โหมดกรองเฉพาะรูปที่ขอลบ (client-side · ไม่โหลดใหม่)
  const [dupMode, setDupMode] = React.useState(false);           // กรองเฉพาะรูปซ้ำ (client-side · ยึดแฮช)

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
      storeImgs(d.images || []);
      setImages(d.images || []);
    } catch (e) { setErr(e.message); if (!c) setImages([]); }
    setLoading(false);
  }, []);
  React.useEffect(() => { load(false, _seededRef.current); }, [load]);   // seed แล้ว = โหลดเงียบ (ไม่ skeleton ทับของที่มี)
  // Realtime (v0.7.20.3): ฟังสัญญาณกลาง 'tb-img-changed' (1 channel ใน tb-monolith · เชื่อถือได้) → **patch จาก payload ทันที** (เร็ว ไม่ refetch ทั้งคลัง) · เฉพาะ INSERT/กู้คืน (ต้องดึง url) ถึง load ใหม่
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const onChanged = (e) => {
      const payload = e.detail; if (!payload) return;
      invalidateImgCaches();
      const ev = payload.eventType, n = payload.new, o = payload.old;
      if (ev === 'DELETE') { if (o && o.id) setImages(arr => (arr||[]).filter(x => x.id !== o.id)); }
      else if (ev === 'UPDATE') {
        if (n && n.deleted_at) setImages(arr => (arr||[]).filter(x => x.id !== n.id));   // soft-delete → เอาออก
        else if (n) setImages(arr => {
          if (!(arr||[]).some(x => x.id === n.id)) { load(true, true); return arr; }   // กู้คืน (ไม่มีในลิสต์) → โหลดใหม่
          return (arr||[]).map(x => x.id === n.id ? { ...x, type: n.type, note: n.note, title: n.title, width: n.width, height: n.height, size_bytes: n.size_bytes, quality: n.quality, delete_req_by: n.delete_req_by, delete_req_name: n.delete_req_name, delete_req_at: n.delete_req_at, delete_req_reason: n.delete_req_reason } : x);   // แก้หมวด/สถานะขอลบ → patch field
        });
      }
      else load(true, true);   // INSERT
    };
    window.addEventListener('tb-img-changed', onChanged);
    return () => { window.removeEventListener('tb-img-changed', onChanged); };
  }, [load]);

  // v0.7.20.2 — sync ฝ้าขาว "รออนุมัติลบ" จากรายการกลาง pendingImageRequests (โหลดผ่าน API เชื่อถือได้ · แก้บั๊ก admin ไม่เห็นฝ้าเพราะ realtime payload ข้ามเครื่องไม่ถึง)
  React.useEffect(() => {
    const pendMap = new Map((pendingImageRequests || []).map(r => [r.id, r]));
    setImages(arr => {
      if (!Array.isArray(arr)) return arr;
      let changed = false;
      const next = arr.map(x => {
        const p = pendMap.get(x.id);
        if (p) {   // มีคำขอลบ → ต้องมีฝ้าขาว
          if (x.delete_req_by !== p.delete_req_by || x.delete_req_reason !== p.delete_req_reason) { changed = true; return { ...x, delete_req_by: p.delete_req_by, delete_req_name: p.delete_req_name, delete_req_at: p.delete_req_at, delete_req_reason: p.delete_req_reason }; }
        } else if (x.delete_req_by) {   // ไม่อยู่ในคำขอแล้ว (ยกเลิก/ปฏิเสธ/อนุมัติ) → เคลียร์ฝ้า
          changed = true; return { ...x, delete_req_by:null, delete_req_name:null, delete_req_at:null, delete_req_reason:null };
        }
        return x;
      });
      return changed ? next : arr;
    });
  }, [pendingImageRequests]);

  // v0.7.20.1 — มาจากกระดิ่ง → เปิดตัวกรอง "เฉพาะรูปที่ขอลบ" อัตโนมัติ (กรอง client-side จากรูปที่โหลดแล้ว · ไม่ยิง server)
  React.useEffect(() => { if (wantPending) { setPendingMode(true); if (onConsumeWant) onConsumeWant(); } }, [wantPending]);

  const qq = q.trim().toLowerCase();
  const uploaders = [...new Set((images || []).map(im => im.uploader_name).filter(Boolean))];

  // ── ตรวจรูปซ้ำทั้งคลัง (ยึดแฮช) — exact = orig_sha256 ตรง · near = pHash ภาพคล้าย (Hamming ≤ 8) ──
  // คำนวณจากรูปทั้งหมดที่โหลดมา (ไม่ผูกตัวกรอง) → ป้าย "ซ้ำ" ติดรูปเสมอไม่ว่ากรองอะไรอยู่
  const dupMap = React.useMemo(() => {
    const imgs = (images || []).filter(im => im.orig_sha256 || im.phash);
    const n = imgs.length;
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i] } return i };
    const union = (i, j) => { const a = find(i), b = find(j); if (a !== b) parent[a] = b };
    const exactFlag = new Array(n).fill(false);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = imgs[i], b = imgs[j];
      const exact = !!(a.orig_sha256 && b.orig_sha256 && a.orig_sha256 === b.orig_sha256);
      const near = phashDistance(a.phash, b.phash) <= 8;
      if (exact || near) { union(i, j); if (exact) { exactFlag[i] = true; exactFlag[j] = true } }
    }
    const size = new Map(); for (let i = 0; i < n; i++) { const r = find(i); size.set(r, (size.get(r) || 0) + 1) }
    const idx = new Map(); let dc = 0; const m = {};
    for (let i = 0; i < n; i++) { const r = find(i); if ((size.get(r) || 0) > 1) { if (!idx.has(r)) idx.set(r, ++dc); m[imgs[i].id] = { id: idx.get(r), exact: exactFlag[i] } } }
    return m;
  }, [images]);
  const dupCount = Object.keys(dupMap).length;
  const flat = (images || []).filter(im =>
    (filter === 'all' || im.type === filter) &&
    (uploaderFilter === 'all' || im.uploader_name === uploaderFilter) &&
    imgInRange(im, dateFrom, dateTo) &&
    (!qq || (im.patient_name || '').toLowerCase().includes(qq) || (im.patient_hn || '').toLowerCase().includes(qq))
  ).sort(imgSortCmp(sortBy));
  const displayList = pendingMode ? flat.filter(im => im.delete_req_by)
    : dupMode ? flat.filter(im => dupMap[im.id])
    : flat;   // กรอง "ขอลบ"/"รูปซ้ำ" client-side จากรูปที่โหลดแล้ว (ทันที · ไม่ skeleton/ไม่ยิง server)
  const showLoading = loading;
  const openImage = (im, rect) => {   // เปิดด้วย index → ลูกศรเลื่อนข้ามทุกผู้ป่วยได้
    const idx = displayList.findIndex(x => x.id === im.id);
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

  // ── ขอลบรูป (v0.7.20) — คนไม่ใช่แอดมิน · แอดมินอนุมัติ/ปฏิเสธ · ผู้ขอยกเลิก ──
  const doCancelImgRequest = async (im) => {   // ทำจริงหลังยืนยันใน popup
    setImages(arr => (arr||[]).map(x => x.id===im.id ? { ...x, delete_req_by:null, delete_req_name:null, delete_req_at:null, delete_req_reason:null } : x));
    updateStoredImg(im.id, { delete_req_by:null, delete_req_name:null, delete_req_at:null, delete_req_reason:null });
    if (typeof window!=='undefined' && window.__imgPendingResolve) window.__imgPendingResolve(im.id);   // หัก badge/glow ทันที ไม่รอ realtime
    invalidateImgCaches(); setLightbox(null);
    try { await fetch('/api/patient/images/'+im.id+'/request-delete', { method:'DELETE' }); } catch {}   // ยิงเบื้องหลัง → เมลแจ้งแอดมินว่ายกเลิก
  };
  const cancelImgRequest = (im) => setCancelTarget(im);   // เปิด popup ยืนยันก่อน (กฎ: การกระทำสำคัญต้องเตือน)
  const onReqDone = (im, reason) => {   // ส่งคำขอสำเร็จ → ฝ้าขาวทันที
    setImages(arr => (arr||[]).map(x => x.id===im.id ? { ...x, delete_req_by: currentUser?.id || 'me', delete_req_name:'(คุณ)', delete_req_at:new Date().toISOString(), delete_req_reason: reason } : x));
    updateStoredImg(im.id, { delete_req_by: currentUser?.id || 'me', delete_req_reason: reason });
    invalidateImgCaches(); setLightbox(null);
  };
  const onReviewDone = (im, action) => {   // แอดมิน approve = ไปถังขยะ · reject = กลับปกติ
    if (action === 'approve') { setImages(arr => (arr||[]).filter(x => x.id !== im.id)); removeStoredImg(im.id); }
    else { setImages(arr => (arr||[]).map(x => x.id===im.id ? { ...x, delete_req_by:null, delete_req_name:null, delete_req_at:null, delete_req_reason:null } : x)); updateStoredImg(im.id, { delete_req_by:null, delete_req_name:null, delete_req_at:null, delete_req_reason:null }); }
    if (typeof window!=='undefined' && window.__imgPendingResolve) window.__imgPendingResolve(im.id);   // หัก badge/glow ทันที ไม่รอ realtime
    invalidateImgCaches(); setLightbox(null);
  };

  const [vMode, setVMode] = React.useState('card');   // มุมมองรูป: การ์ด/แถว
  const [vSize, setVSize] = React.useState(1);         // ขนาด 0/1/2
  const [pSort, setPSort] = React.useState('name-asc');   // เรียงกลุ่มผู้ป่วย: name/hn

  const groups = {};
  for (const im of displayList) {
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
        {im.delete_req_by && <PendingDeleteOverlay image={im} isAdmin={isAdmin} isRequester={im.delete_req_by===currentUser?.id} onCancel={()=>cancelImgRequest(im)} onApprove={()=>setReviewTarget({im, action:'approve'})} onReject={()=>setReviewTarget({im, action:'reject'})}/>}
        <div className="tb-img-zoomicon" style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.22)',pointerEvents:'none'}}><i className="fa-solid fa-magnifying-glass-plus" style={{color:'#fff',fontSize:'18px',textShadow:'0 1px 5px rgba(0,0,0,0.6)'}}></i></div>
        <span style={{position:'absolute',top:'5px',right:'5px',fontSize:'9px',fontWeight:800,padding:'2px 6px',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
        {dupMap[im.id] && (()=>{ const d=dupMap[im.id]; const col=DUP_COLORS[(d.id-1)%DUP_COLORS.length]; return <span title={d.exact?'ไฟล์เดียวกันเป๊ะ':'ภาพเดียวกัน (คนละไฟล์)'} style={{position:'absolute',top:'5px',left:'5px',fontSize:'9px',fontWeight:800,padding:'2px 6px',borderRadius:'999px',background:col,color:'#fff',display:'inline-flex',alignItems:'center',gap:'3px'}}><i className={'fa-solid '+(d.exact?'fa-clone':'fa-images')} style={{fontSize:'8px'}}></i>{d.exact?'ซ้ำ':'คล้าย'} #{d.id}</span>; })()}
        <span style={{position:'absolute',bottom:0,left:0,right:0,padding:'10px 6px 4px',background:'linear-gradient(transparent,rgba(0,0,0,0.6))',color:'#fff',fontSize:'9px'}}>{new Date(im.uploaded_at).toLocaleDateString('th-TH',{day:'numeric',month:'short'})}</span>
        <button onClick={(e)=>{ e.stopPropagation(); setDetailImg(im); }} title="ดูข้อมูล" style={{position:'absolute',bottom:'6px',right:'6px',zIndex:3,width:'28px',height:'28px',borderRadius:'50%',background:'rgba(0,0,0,0.62)',color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px'}}><i className="fa-solid fa-circle-info"></i></button>
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
      <div key={im.id} onClick={(e)=>openImage(im, e.currentTarget.getBoundingClientRect())} style={{display:'flex',alignItems:'center',gap:'10px',border:'1px solid '+(im.delete_req_by?'#fcd34d':'#e5e7eb'),borderRadius:'10px',padding:'7px 10px',background:im.delete_req_by?'#fffbeb':'#fff',cursor:'zoom-in',marginBottom:'8px'}}>
        <div style={{width:th+'px',height:th+'px',flexShrink:0,borderRadius:'8px',overflow:'hidden',background:'#0b0f19'}}><img src={im.thumbUrl||im.url} alt="" loading="lazy" draggable={false} onContextMenu={e=>e.preventDefault()} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
        <span style={{flexShrink:0,width:'52px',fontSize:'10px',fontWeight:800,padding:'2px 0',textAlign:'center',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
        {dupMap[im.id] && (()=>{ const d=dupMap[im.id]; const col=DUP_COLORS[(d.id-1)%DUP_COLORS.length]; return <span title={d.exact?'ไฟล์เดียวกันเป๊ะ':'ภาพเดียวกัน (คนละไฟล์)'} style={{flexShrink:0,fontSize:'9px',fontWeight:800,padding:'2px 7px',borderRadius:'999px',background:col,color:'#fff',whiteSpace:'nowrap'}}><i className={'fa-solid '+(d.exact?'fa-clone':'fa-images')} style={{marginRight:'3px'}}></i>{d.exact?'รูปซ้ำ':'ภาพคล้าย'} #{d.id}</span>; })()}
        {im.delete_req_by && <span style={{flexShrink:0,fontSize:'9px',fontWeight:800,padding:'2px 7px',borderRadius:'999px',background:'#fef3c7',color:'#92400e',border:'1px solid #fcd34d',whiteSpace:'nowrap'}}><i className="fa-solid fa-clock" style={{marginRight:'3px'}}></i>รออนุมัติลบ</span>}
        <div style={{flexShrink:0,width:'146px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>อัปโหลด</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{up}</p></div>
        <div style={{flexShrink:0,width:'112px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>ขนาดภาพ</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{dimF}</p></div>
        <div style={{flexShrink:0,width:'82px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>คุณภาพ</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{qual}</p></div>
        <div style={{flex:1,minWidth:'70px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>หมายเหตุ</p><p style={{fontSize:'12px',color:'#374151',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{im.title||im.note||'—'}</p></div>
        <div style={{flexShrink:0,width:'102px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>อัปโหลดโดย</p><p style={{fontSize:'12px',color:'#374151',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{im.uploader_name||'—'}</p></div>
        <div style={{flexShrink:0,width:'60px',textAlign:'right'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>ไฟล์</p><p style={{fontSize:'12px',color:'#374151',margin:0}}>{sz}</p></div>
      </div>
    );
  };

  // v0.7.21 — สลับมุมมอง คลังรูป/ประวัติรูปภาพ (แอดมินเท่านั้น)
  const viewToggle = isAdmin ? (
    <div style={{display:'inline-flex',background:'#f1f5f9',borderRadius:'10px',padding:'3px',marginBottom:'16px'}}>
      <button onClick={()=>setLibView('gallery')} style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'7px 16px',fontSize:'13px',fontWeight:700,border:'none',borderRadius:'8px',background:libView==='gallery'?'#0f766e':'transparent',color:libView==='gallery'?'#fff':'#6b7280',cursor:'pointer'}}><i className="fa-solid fa-images"></i>คลังรูป</button>
      <button onClick={()=>setLibView('log')} style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'7px 16px',fontSize:'13px',fontWeight:700,border:'none',borderRadius:'8px',background:libView==='log'?'#0f766e':'transparent',color:libView==='log'?'#fff':'#6b7280',cursor:'pointer'}}><i className="fa-solid fa-clock-rotate-left"></i>ประวัติ</button>
      <button onClick={()=>{ if(onGoTrash) onGoTrash(); }} title="ไปหน้าถังขยะ (แท็บรูปภาพ)" style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'7px 16px',fontSize:'13px',fontWeight:700,border:'none',borderRadius:'8px',background:'transparent',color:'#6b7280',cursor:'pointer'}}><i className="fa-solid fa-trash"></i>ถังขยะ</button>
    </div>
  ) : null;

  if (isAdmin && libView === 'log') {
    return (<ImageLogPage headerExtra={viewToggle}/>);   // ส่ง viewToggle เข้าไปใน sticky header ของหน้าประวัติ (ตรึงรวมกัน)
  }

  return (
    <div>
      {/* ส่วนหัว — ตรึงไว้ด้านบน (sticky) */}
      <div style={{position:'sticky',top:'-24px',zIndex:20,background:'#f0fdfa',margin:'0 -24px 8px',padding:'12px 24px 10px'}}>
      {viewToggle}
      {/* ตัวกรอง + ค้นหา (ชื่อหน้าอยู่บนแถบหัวเรื่องด้านบนแล้ว) */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',marginBottom:'0',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {['all',...Object.keys(PATIENT_IMG_TYPES)].map(k=>{const active=filter===k;const v=PATIENT_IMG_TYPES[k];return <button key={k} onClick={()=>setFilter(k)} style={{padding:'5px 14px',borderRadius:'999px',fontSize:'12px',fontWeight:700,border:'1px solid '+(active?'#0d9488':'#e5e7eb'),background:active?'#0d9488':'#fff',color:active?'#fff':'#6b7280',cursor:'pointer'}}>{k==='all'?'ทั้งหมด':v.label}</button>;})}
          {/* v0.7.20.1 — ปุ่มกรองเฉพาะรูปที่ขอลบ · เรืองแสงเมื่อมีคำขอ · จางกดไม่ได้เมื่อไม่มี */}
          <button onClick={()=>{ if(pendingCount>0) setPendingMode(m=>{ const nv=!m; if(nv) setDupMode(false); return nv; }); }} disabled={pendingCount===0}
            title={pendingCount===0?'ไม่มีรูปที่ขอลบ':'ดูเฉพาะรูปที่ขอลบ'}
            className={pendingCount>0 && !pendingMode ? 'tb-pend-glow' : ''}
            style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'12px',fontWeight:800,padding:'5px 14px',borderRadius:'999px',cursor:pendingCount===0?'not-allowed':'pointer',...(pendingMode?{background:'#f59e0b',color:'#fff',border:'1.5px solid #f59e0b'}:pendingCount>0?{background:'#fef3c7',color:'#92400e',border:'1.5px solid #f59e0b'}:{background:'#fff',color:'#cbd5e1',border:'1px solid #e5e7eb'})}}>
            <i className="fa-solid fa-clock"></i>เฉพาะรูปที่ขอลบ
            {pendingCount>0 && <span style={{background:pendingMode?'#fff':'#dc2626',color:pendingMode?'#b45309':'#fff',fontSize:'10px',fontWeight:800,minWidth:'17px',height:'17px',borderRadius:'999px',display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'0 4px'}}>{pendingCount}</span>}
          </button>
          {/* กรองเฉพาะรูปซ้ำ (ยึดแฮช) · จางกดไม่ได้เมื่อไม่มีรูปซ้ำ */}
          <button onClick={()=>{ if(dupCount>0) setDupMode(m=>{ const nv=!m; if(nv) setPendingMode(false); return nv; }); }} disabled={dupCount===0}
            title={dupCount===0?'ไม่มีรูปซ้ำในคลัง':'ดูเฉพาะรูปที่ซ้ำกัน'}
            style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'12px',fontWeight:800,padding:'5px 14px',borderRadius:'999px',cursor:dupCount===0?'not-allowed':'pointer',...(dupMode?{background:'#7c3aed',color:'#fff',border:'1.5px solid #7c3aed'}:dupCount>0?{background:'#f3e8ff',color:'#6b21a8',border:'1.5px solid #a78bfa'}:{background:'#fff',color:'#cbd5e1',border:'1px solid #e5e7eb'})}}>
            <i className="fa-solid fa-clone"></i>เฉพาะรูปซ้ำ
            {dupCount>0 && <span style={{background:dupMode?'#fff':'#7c3aed',color:dupMode?'#6b21a8':'#fff',fontSize:'10px',fontWeight:800,minWidth:'17px',height:'17px',borderRadius:'999px',display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'0 4px'}}>{dupCount}</span>}
          </button>
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
          {(filter!=='all'||sortBy!=='new'||dateFrom||dateTo||uploaderFilter!=='all'||q||pendingMode||dupMode) && <button onClick={()=>{setFilter('all');setSortBy('new');setDateFrom('');setDateTo('');setUploaderFilter('all');setQ('');setPendingMode(false);setDupMode(false);}} title="ล้างตัวกรองทั้งหมด" style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'7px 12px',borderRadius:'10px',border:'1px solid #fca5a5',background:'#fff',color:'#dc2626',fontSize:'12px',fontWeight:700,cursor:'pointer'}}><i className="fa-solid fa-filter-circle-xmark"></i>ล้างค่า</button>}
          <ImgViewToolbar mode={vMode} setMode={setVMode} size={vSize} setSize={setVSize}/>
        </div>
      </div>
      </div>{/* /sticky header */}
      {err && <p style={{color:'#dc2626',fontSize:'13px'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{err}</p>}

      {/* กำลังโหลด → โครงร่างเบลอ (สื่อว่ามีรูปกำลังมา ไม่ใช่รูปหาย) */}
      {showLoading && [0,1].map(g=>(
        <div key={g} style={{marginBottom:'22px'}}>
          <div className="tb-skel" style={{height:'14px',width:'170px',borderRadius:'6px',marginBottom:'10px'}}/>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            {[0,1,2,3,4,5].map(i=><div key={i} className="tb-skel" style={{width:(120+(i%3)*44)+'px',height:'170px',borderRadius:'10px'}}/>)}
          </div>
        </div>
      ))}

      {!showLoading && displayList.length===0 && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px'}}>
          <div style={{width:'80px',height:'80px',borderRadius:'50%',background:pendingMode?'#fffbeb':dupMode?'#f3e8ff':'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px'}}>
            <i className={pendingMode?'fa-solid fa-clock':dupMode?'fa-solid fa-clone':'fa-solid fa-images'} style={{fontSize:'32px',color:pendingMode?'#fcd34d':dupMode?'#c4b5fd':'#cbd5e1'}}></i>
          </div>
          <p style={{fontSize:'15px',fontWeight:700,color:'#6b7280',margin:'0 0 4px'}}>{pendingMode?'ไม่มีรูปที่ขอลบ':dupMode?'ไม่พบรูปซ้ำที่ตรงกับตัวกรอง':((q||filter!=='all'||dateFrom||dateTo||uploaderFilter!=='all')?'ไม่พบรูปที่ตรงกับตัวกรอง':'ยังไม่มีรูปในระบบ')}</p>
          <p style={{fontSize:'12px',color:'#9ca3af',margin:0,textAlign:'center'}}>{pendingMode?'ไม่มีคำขอลบรูปรออนุมัติในตอนนี้':dupMode?'ลองล้างตัวกรองอื่น หรือเปลี่ยนคำค้นหา':((q||filter!=='all'||dateFrom||dateTo||uploaderFilter!=='all')?'ลองล้างตัวกรองหรือเปลี่ยนคำค้นหา':'อัปโหลดรูปได้จากแท็บ "รูปภาพ" ในหน้าผู้ป่วย')}</p>
          {(pendingMode||dupMode) && <button onClick={()=>{setPendingMode(false);setDupMode(false);}} style={{marginTop:'14px',fontSize:'13px',fontWeight:700,color:'#0f766e',background:'#fff',border:'1px solid #99e1cb',borderRadius:'8px',padding:'8px 16px',cursor:'pointer'}}><i className="fa-solid fa-arrow-left" style={{marginRight:'6px'}}></i>ดูรูปทั้งหมด</button>}
        </div>
      )}
      {!showLoading && groupEntries.map(([pid,g])=>(
        <div key={pid} style={{marginBottom:'22px'}}>
          <p style={{fontWeight:700,fontSize:'14px',color:'#1f2937',margin:'0 0 8px',borderLeft:'3px solid #0d9488',paddingLeft:'8px'}}>{g.name}{g.hn?<span style={{color:'#9ca3af',fontWeight:400,fontSize:'12px'}}> · HN {g.hn}</span>:null} <span style={{color:'#9ca3af',fontWeight:400,fontSize:'12px'}}>({g.items.length})</span></p>
          {vMode==='card'
            ? <JustifiedGallery items={g.items} targetHeight={IMG_VIEW_SIZES[vSize].jh} gap={8} renderItem={renderThumb}/>
            : g.items.map(renderRow)}
        </div>
      ))}

      {editTarget && createPortal(
        <div className={lightbox?'':'tb-backdrop'} style={{position:'fixed',inset:0,...(lightbox?{background:'rgba(15,23,42,0.6)'}:{}),zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={savingEdit?undefined:()=>setEditTarget(null)}>
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
        <div className={lightbox?'':'tb-backdrop'} style={{position:'fixed',inset:0,...(lightbox?{background:'rgba(15,23,42,0.6)'}:{}),zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
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
      {reqTarget && <ImageRequestDeleteModal image={reqTarget} lightboxOpen={!!lightbox} onClose={()=>setReqTarget(null)} onDone={(reason)=>onReqDone(reqTarget, reason)}/>}
      {reviewTarget && <ImageReviewDeleteModal image={reviewTarget.im} action={reviewTarget.action} lightboxOpen={!!lightbox} onClose={()=>setReviewTarget(null)} onDone={(action)=>onReviewDone(reviewTarget.im, action)}/>}
      {cancelTarget && <ImageCancelRequestModal image={cancelTarget} lightboxOpen={!!lightbox} onClose={()=>setCancelTarget(null)} onDone={()=>doCancelImgRequest(cancelTarget)}/>}
      {detailImg && createPortal(<SnapModal snap={imageToSnap(detailImg)} onClose={()=>setDetailImg(null)}/>, document.body)}
      {lightbox && (()=>{
        const cur = displayList[lightbox.idx]; if (!cur) return null;
        const meta = PATIENT_IMG_TYPES[cur.type] || PATIENT_IMG_TYPES.other;
        const name = meta.label + ' · ' + cur.patient_name + (cur.patient_hn ? ' (' + cur.patient_hn + ')' : '');
        const mine = cur.uploaded_by===currentUser?.id;
        const canEdit = mine || isAdmin;
        const pending = !!cur.delete_req_by;
        const myReq = cur.delete_req_by === currentUser?.id;
        const acts = [];
        if (canEdit && !pending) acts.push({ icon:'fa-pen', label:'แก้หมวด / คำอธิบาย', onClick:()=>{ openEdit(cur); } });
        if (isAdmin) {
          if (pending) {
            acts.push({ icon:'fa-check', label:'อนุมัติลบรูป', onClick:()=>{ setReviewTarget({ im: cur, action:'approve' }); } });
            acts.push({ icon:'fa-xmark', label:'ปฏิเสธคำขอลบ', danger:true, onClick:()=>{ setReviewTarget({ im: cur, action:'reject' }); } });
          } else {
            acts.push({ icon:'fa-trash-can', label:'ลบรูป', danger:true, onClick:()=>{ setDelReason(''); setDelHn(''); setDelStep2(false); setDelTarget(cur); } });
          }
        } else {
          if (pending && myReq) acts.push({ icon:'fa-rotate-left', label:'ยกเลิกคำขอลบ', onClick:()=>{ cancelImgRequest(cur); } });
          else if (!pending) acts.push({ icon:'fa-trash-can', label:'ขอลบรูป', onClick:()=>{ setReqTarget(cur); } });
        }
        const info = patientImgInfo(cur, meta, name);
        info.noteEditable = canEdit;
        info.onSaveNote = async (text) => { await fetch('/api/patient/images/'+cur.id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({note:text||null})}); setImages(arr=>(arr||[]).map(x=>x.id===cur.id?{...x,note:text||null}:x)); invalidateImgCaches(); };
        return <AvatarLightbox src={cur.url} thumb={cur.thumbUrl} originRect={lightbox.rect} info={info} menuActions={acts} infoAction={()=>setDetailImg(cur)}
          hasPrev={lightbox.idx>0} hasNext={lightbox.idx<displayList.length-1}
          onPrev={()=>setLightbox(l=>({ idx: Math.max(0, l.idx-1) }))}
          onNext={()=>setLightbox(l=>({ idx: Math.min(displayList.length-1, l.idx+1) }))}
          onExpire={async()=>{ try { const r=await fetch(`/api/patient/images/${cur.id}/url`); if(r.ok){ const d=await r.json(); return d.url; } } catch {} return null; }}
          onClose={()=>setLightbox(null)}/>;
      })()}
    </div>
  );
}



export { ImageLibraryPage }
