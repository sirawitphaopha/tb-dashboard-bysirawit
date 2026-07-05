'use client'
/** patient-images/patient-tab.jsx — แท็บรูปในเวชระเบียน (PatientImagesTab) (แยกรอบ 3) */
import * as React from 'react'
import { createPortal } from 'react-dom'
const { useState, useEffect, useRef, useCallback } = React
import { loadImageEl, AvatarLightbox } from '../shared'
import { compressToWebp, putWithProgress, decodeImageToDataURL, isAnimatedGif, JustifiedGallery,
  fmtFileSize, mimeLabel, detectDevice, IMG_SORTS, imgInRange, imgSortCmp, patientImgInfo,
  PATIENT_IMG_TYPES, CXRCompareModal, CACHE_TTL, loadCache, saveCache, invalidateImgCaches,
  IMG_VIEW_SIZES, ImgViewToolbar, PendingDeleteOverlay, ImageRequestDeleteModal, ImageReviewDeleteModal, ImageCancelRequestModal,
  storeImgs, getStoredImgsFor, updateStoredImg, removeStoredImg } from './helpers'
import { computeByteHashes, computePerceptualHash } from './image-hash'
import { SnapModal, imageToSnap } from './image-log'

function PatientImagesTab({ patient, currentUser, locked }) {
  const LSKEY = 'tb_patimg_' + patient.id;
  const _c0 = loadCache(LSKEY);
  const _seed0 = _c0 ? _c0.data : (getStoredImgsFor(patient.id).length ? getStoredImgsFor(patient.id) : null);   // v0.7.20.1 — seed จาก shared store (โหลดในคลัง/หน้าอื่นแล้ว) กันขึ้น skeleton
  const [images, setImages]   = React.useState(_seed0);
  const [loading, setLoading] = React.useState(!_seed0);
  const _seededRef = React.useRef(!!_seed0);
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
  const [detailImg, setDetailImg] = React.useState(null);   // รูปที่กดดูข้อมูล (popup ทับ)
  const [reqTarget, setReqTarget] = React.useState(null);        // v0.7.20 — รูปที่กำลัง "ขอลบ"
  const [reviewTarget, setReviewTarget] = React.useState(null);  // v0.7.20 — {im, action} แอดมินอนุมัติ/ปฏิเสธ
  const [cancelTarget, setCancelTarget] = React.useState(null);  // v0.7.20.2 — รูปที่กำลังยืนยัน "ยกเลิกคำขอลบ"
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
      storeImgs(withHn);
      setImages(withHn);
    } catch (e) { setErr(e.message); if (!c) setImages([]); }
    setLoading(false);
  }, [patient.id]);
  React.useEffect(() => { load(false, _seededRef.current); }, [load]);   // seed แล้ว = โหลดเงียบ (ไม่ skeleton ทับของที่มี)
  // Realtime (v0.7.20.3): ฟังสัญญาณกลาง 'tb-img-changed' → **patch เฉพาะรูปผู้ป่วยรายนี้** จาก payload ทันที (เร็ว) · กรอง patient_id เอง (channel กลางไม่ filter) · INSERT/กู้คืน = โหลดใหม่
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const onChanged = (e) => {
      const payload = e.detail; if (!payload) return;
      const n = payload.new, o = payload.old;
      const pid = (n && n.patient_id) || (o && o.patient_id);
      if (pid !== patient.id) return;   // ไม่ใช่ผู้ป่วยรายนี้ ข้าม
      invalidateImgCaches();
      const ev = payload.eventType;
      if (ev === 'DELETE') { if (o && o.id) setImages(arr => (arr||[]).filter(x => x.id !== o.id)); }
      else if (ev === 'UPDATE') {
        if (n && n.deleted_at) setImages(arr => (arr||[]).filter(x => x.id !== n.id));
        else if (n) setImages(arr => {
          if (!(arr||[]).some(x => x.id === n.id)) { load(true, true); return arr; }   // กู้คืน → โหลดใหม่
          return (arr||[]).map(x => x.id === n.id ? { ...x, type: n.type, note: n.note, title: n.title, width: n.width, height: n.height, size_bytes: n.size_bytes, quality: n.quality, delete_req_by: n.delete_req_by, delete_req_name: n.delete_req_name, delete_req_at: n.delete_req_at, delete_req_reason: n.delete_req_reason } : x);
        });
      }
      else load(true, true);   // INSERT
    };
    window.addEventListener('tb-img-changed', onChanged);
    return () => { window.removeEventListener('tb-img-changed', onChanged); };
  }, [patient.id, load]);

  // เลือกไฟล์ → เปิดพรีวิว "ทันที" (สถานะ decoding) แล้วถอดรหัสเบื้องหลัง → ผู้ใช้เห็น popup เลย มั่นใจว่าอัปติด
  const pickFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setErr('');
    const name = (file.name || '').toLowerCase();
    const isSvg = file.type === 'image/svg+xml' || /\.svg$/.test(name);   // SVG = เก็บต้นฉบับ ไม่แปลง WebP (vector ซูมไม่สิ้นสุด)
    const okExt = /\.(jpe?g|png|webp|avif|gif|bmp|heic|heif|tiff?|svg)$/.test(name);
    if (!file.type.startsWith('image/') && !okExt) { setErr('รองรับไฟล์รูป: JPG/PNG/WebP/AVIF/GIF/BMP/HEIC/TIFF/SVG — ไม่รองรับ RAW/DICOM'); return; }
    if (file.size > 200 * 1024 * 1024) { setErr('ไฟล์ใหญ่เกิน 200MB'); return; }
    setPendingUpload({ file, decoding: true, previewUrl: null, isAnimated: false, isSvg, dims: { width: 0, height: 0 }, origMime: file.type || (isSvg ? 'image/svg+xml' : ('image/' + name.split('.').pop())), error: '' });
    (async () => {
      try {
        const animated = isSvg ? false : await isAnimatedGif(file);
        const previewUrl = (animated || isSvg) ? URL.createObjectURL(file) : await decodeImageToDataURL(file);
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
      if (pu.isSvg) {
        mainBlob = pu.file; ext = 'svg'; mime = 'image/svg+xml'; width = pu.dims.width; height = pu.dims.height;   // เก็บ SVG ต้นฉบับ ไม่บีบ
      } else if (pu.isAnimated) {
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
      const origH = await computeByteHashes(pu.file);      // v0.7.21 — hash ไฟล์ต้นฉบับ (นิ่ง)
      const webpH = await computeByteHashes(mainBlob);      // hash ไฟล์ WebP ที่เก็บจริง (GIF = ไฟล์เดียวกับต้นฉบับ)
      const phash = await computePerceptualHash(pu.previewUrl);   // dHash ภาพ (จับภาพเดียวกันแม้คนละไฟล์)
      const conf = await fetch('/api/patient/images/confirm', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id, key: pd.key, thumbKey: pd.thumbKey, type: upType, note: upNote || null, size: mainBlob.size, width, height, mime, origSize: pu.file.size, origMime: pu.origMime, origWidth: pu.dims.width, origHeight: pu.dims.height, quality: (pu.isAnimated || pu.isSvg) ? null : (isCxr ? 92 : 87), device: detectDevice(), origSha256: origH.sha256, origMd5: origH.md5, origCrc32: origH.crc32, webpSha256: webpH.sha256, webpMd5: webpH.md5, webpCrc32: webpH.crc32, phash }) });
      const cd = await conf.json();
      if (!conf.ok) throw new Error(cd.error || 'บันทึกไม่สำเร็จ');
      if (pu.isAnimated || pu.isSvg) { try { URL.revokeObjectURL(pu.previewUrl); } catch {} }
      setUpNote(''); setPendingUpload(null); invalidateImgCaches(); await load(true, true);
    } catch (e) { setErr(e.message || 'เกิดข้อผิดพลาด'); }
    setUploading(false); setUpPhase(''); setUpProgress(0);
  };
  const cancelUpload = () => { if (pendingUpload?.isAnimated || pendingUpload?.isSvg) { try { URL.revokeObjectURL(pendingUpload.previewUrl); } catch {} } setPendingUpload(null); };

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

  // ── ขอลบรูป (v0.7.20) — คนไม่ใช่แอดมิน · แอดมินอนุมัติ/ปฏิเสธ · ผู้ขอยกเลิก ──
  const doCancelImgRequest = async (im) => {   // ทำจริงหลังยืนยันใน popup
    setImages(arr => (arr||[]).map(x => x.id===im.id ? { ...x, delete_req_by:null, delete_req_name:null, delete_req_at:null, delete_req_reason:null } : x));
    updateStoredImg(im.id, { delete_req_by:null, delete_req_name:null, delete_req_at:null, delete_req_reason:null });
    if (typeof window!=='undefined' && window.__imgPendingResolve) window.__imgPendingResolve(im.id);   // หัก badge/glow ทันที
    invalidateImgCaches(); setLightbox(null);
    try { await fetch('/api/patient/images/'+im.id+'/request-delete', { method:'DELETE' }); } catch {}   // ยิงเบื้องหลัง → เมลแจ้งแอดมินว่ายกเลิก
  };
  const cancelImgRequest = (im) => setCancelTarget(im);   // เปิด popup ยืนยันก่อน (กฎ: การกระทำสำคัญต้องเตือน)
  const onReqDone = (im, reason) => {
    setImages(arr => (arr||[]).map(x => x.id===im.id ? { ...x, delete_req_by: currentUser?.id || 'me', delete_req_name:'(คุณ)', delete_req_at:new Date().toISOString(), delete_req_reason: reason } : x));
    updateStoredImg(im.id, { delete_req_by: currentUser?.id || 'me', delete_req_reason: reason });
    invalidateImgCaches(); setLightbox(null);
  };
  const onReviewDone = (im, action) => {
    if (action === 'approve') { setImages(arr => (arr||[]).filter(x => x.id !== im.id)); removeStoredImg(im.id); }
    else { setImages(arr => (arr||[]).map(x => x.id===im.id ? { ...x, delete_req_by:null, delete_req_name:null, delete_req_at:null, delete_req_reason:null } : x)); updateStoredImg(im.id, { delete_req_by:null, delete_req_name:null, delete_req_at:null, delete_req_reason:null }); }
    if (typeof window!=='undefined' && window.__imgPendingResolve) window.__imgPendingResolve(im.id);   // หัก badge/glow ทันที
    invalidateImgCaches(); setLightbox(null);
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
          <input ref={fileRef} type="file" accept="image/*,.heic,.heif,.tif,.tiff,.avif,.bmp,.svg" onChange={pickFile} style={{display:'none'}}/>
          <span style={{fontSize:'11px',color:'#9ca3af',flexBasis:'100%'}}>รองรับ JPG/PNG/WebP/AVIF/GIF/BMP/HEIC/TIFF/SVG (iPhone ได้) · CXR คมชัด ≤4096px/92% · ทั่วไป ≤2560px (2K)/87% · ≤200MB · GIF เคลื่อนไหว/SVG เก็บต้นฉบับ (SVG ซูมไม่สิ้นสุด)</span>
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
              {im.delete_req_by && <PendingDeleteOverlay image={im} isAdmin={isAdmin} isRequester={im.delete_req_by===currentUser?.id} onCancel={()=>cancelImgRequest(im)} onApprove={()=>setReviewTarget({im, action:'approve'})} onReject={()=>setReviewTarget({im, action:'reject'})}/>}
              {!selectableForCompare && <div className="tb-img-zoomicon" style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.22)',pointerEvents:'none'}}><i className="fa-solid fa-magnifying-glass-plus" style={{color:'#fff',fontSize:'18px',textShadow:'0 1px 5px rgba(0,0,0,0.6)'}}></i></div>}
              {selectableForCompare && <div style={{position:'absolute',top:'6px',left:'6px',width:'22px',height:'22px',borderRadius:'50%',background:selIdx>=0?'#0d9488':'rgba(255,255,255,0.85)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800,border:'2px solid #fff'}}>{selIdx>=0?selIdx+1:''}</div>}
              <span style={{position:'absolute',top:'6px',right:'6px',fontSize:'10px',fontWeight:800,padding:'2px 7px',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
              <div style={{position:'absolute',left:0,right:0,bottom:0,padding:'12px 8px 5px',background:'linear-gradient(transparent,rgba(0,0,0,0.65))'}}>
                <span style={{fontSize:'10px',color:'#fff',textShadow:'0 1px 3px rgba(0,0,0,0.7)'}}>{new Date(im.uploaded_at).toLocaleDateString('th-TH',{day:'numeric',month:'short'})} · {fmtSize(im.size_bytes)}</span>
              </div>
              <button onClick={(e)=>{ e.stopPropagation(); setDetailImg(im); }} title="ดูข้อมูล" style={{position:'absolute',bottom:'6px',right:'6px',zIndex:3,width:'28px',height:'28px',borderRadius:'50%',background:'rgba(0,0,0,0.62)',color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px'}}><i className="fa-solid fa-circle-info"></i></button>
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
              <div key={im.id} onClick={(e)=>openImage(im, e.currentTarget.getBoundingClientRect())} style={{display:'flex',alignItems:'center',gap:'10px',border:'1px solid '+(im.delete_req_by?'#fcd34d':'#e5e7eb'),borderRadius:'10px',padding:'7px 10px',background:im.delete_req_by?'#fffbeb':'#fff',cursor:'zoom-in'}}>
                <div style={{width:th+'px',height:th+'px',flexShrink:0,borderRadius:'8px',overflow:'hidden',background:'#0b0f19'}}><img src={im.thumbUrl||im.url} alt="" loading="lazy" draggable={false} onContextMenu={e=>e.preventDefault()} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
                <span style={{flexShrink:0,width:'52px',fontSize:'10px',fontWeight:800,padding:'2px 0',textAlign:'center',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
                {im.delete_req_by && <span style={{flexShrink:0,fontSize:'9px',fontWeight:800,padding:'2px 7px',borderRadius:'999px',background:'#fef3c7',color:'#92400e',border:'1px solid #fcd34d',whiteSpace:'nowrap'}}><i className="fa-solid fa-clock" style={{marginRight:'3px'}}></i>รออนุมัติลบ</span>}
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
        const mine = cur.uploaded_by===currentUser?.id;
        const canEdit = !locked && (mine || isAdmin);
        const pending = !!cur.delete_req_by;
        const myReq = cur.delete_req_by === currentUser?.id;
        const acts = [];
        if (canEdit && !pending) acts.push({ icon:'fa-pen', label:'แก้หมวด / คำอธิบาย', onClick:()=>{ openEdit(cur); } });
        if (!locked && isAdmin) {
          if (pending) {
            acts.push({ icon:'fa-check', label:'อนุมัติลบรูป', onClick:()=>{ setReviewTarget({ im: cur, action:'approve' }); } });
            acts.push({ icon:'fa-xmark', label:'ปฏิเสธคำขอลบ', danger:true, onClick:()=>{ setReviewTarget({ im: cur, action:'reject' }); } });
          } else {
            acts.push({ icon:'fa-trash-can', label:'ลบรูป', danger:true, onClick:()=>{ setDelReason(''); setDelHn(''); setDelStep2(false); setDelTarget(cur); } });
          }
        } else if (!locked && !isAdmin) {
          if (pending && myReq) acts.push({ icon:'fa-rotate-left', label:'ยกเลิกคำขอลบ', onClick:()=>{ cancelImgRequest(cur); } });
          else if (!pending) acts.push({ icon:'fa-trash-can', label:'ขอลบรูป', onClick:()=>{ setReqTarget(cur); } });
        }
        const info = patientImgInfo(cur, meta, name);
        info.noteEditable = canEdit;
        info.onSaveNote = async (text) => { await fetch('/api/patient/images/'+cur.id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({note:text||null})}); setImages(arr=>(arr||[]).map(x=>x.id===cur.id?{...x,note:text||null}:x)); invalidateImgCaches(); };
        return <AvatarLightbox src={cur.url} thumb={cur.thumbUrl} originRect={lightbox.rect} info={info} menuActions={acts} infoAction={()=>setDetailImg(cur)}
          hasPrev={lightbox.idx>0} hasNext={lightbox.idx<shown.length-1}
          onPrev={()=>setLightbox(l=>({ idx: Math.max(0, l.idx-1) }))}
          onNext={()=>setLightbox(l=>({ idx: Math.min(shown.length-1, l.idx+1) }))}
          onExpire={async()=>{ try { const r=await fetch(`/api/patient/images/${cur.id}/url`); if(r.ok){ const d=await r.json(); return d.url; } } catch {} return null; }}
          onClose={()=>setLightbox(null)}/>;
      })()}
      {compare && <CXRCompareModal left={compare.left} right={compare.right} onClose={()=>setCompare(null)}/>}
      {reqTarget && <ImageRequestDeleteModal image={reqTarget} lightboxOpen={!!lightbox} onClose={()=>setReqTarget(null)} onDone={(reason)=>onReqDone(reqTarget, reason)}/>}
      {reviewTarget && <ImageReviewDeleteModal image={reviewTarget.im} action={reviewTarget.action} lightboxOpen={!!lightbox} onClose={()=>setReviewTarget(null)} onDone={(action)=>onReviewDone(reviewTarget.im, action)}/>}
      {cancelTarget && <ImageCancelRequestModal image={cancelTarget} lightboxOpen={!!lightbox} onClose={()=>setCancelTarget(null)} onDone={()=>doCancelImgRequest(cancelTarget)}/>}
      {detailImg && createPortal(<SnapModal snap={imageToSnap(detailImg)} onClose={()=>setDetailImg(null)}/>, document.body)}
      {pendingUpload && createPortal(
        <div className={lightbox?'':'tb-backdrop'} style={{position:'fixed',inset:0,...(lightbox?{background:'rgba(15,23,42,0.65)'}:{}),zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={uploading?undefined:cancelUpload}>
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
        <div className={lightbox?'':'tb-backdrop'} style={{position:'fixed',inset:0,...(lightbox?{background:'rgba(15,23,42,0.6)'}:{}),zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={deleting?undefined:()=>{setDelTarget(null);setDelStep2(false);}}>
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

export { PatientImagesTab }
