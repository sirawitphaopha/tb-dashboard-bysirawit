'use client'
/** patient-images/image-log.jsx — ประวัติทุก event ของรูปผู้ป่วย (ImageLogPage · แอดมินเท่านั้น)
 *  โหลด event ทั้งหมดรอบเดียว → กรอง/จัดกลุ่ม/ตรวจรูปซ้ำใน client (กดกรองแล้วทันที)
 *  2 มุมมอง: "ตามเวลา" (list) · "ตามรูป" (จับกลุ่มตามรูป + ยึดแฮช + ป้ายรูปซ้ำ)
 *  ดรอปดาวน์กรองเหตุการณ์แบบเลือกหลายข้อ · กดดูรายละเอียดเป็นภาษาคน (มีปุ่มดูข้อมูลดิบ JSON) */
import * as React from 'react'
import { createPortal } from 'react-dom'
import { loadCache, saveCache, CACHE_TTL, patientImgInfo, PATIENT_IMG_TYPES } from './helpers'
import { highlightMagic, AvatarLightbox } from '../shared'

const LOG_CACHE_KEY = 'tb_imglog'   // โหลด event ครั้งเดียว (cache) — เปิดหน้าซ้ำไม่โหลดใหม่

// meta ต่อชนิด event (ไอคอน/สี/ป้าย)
const EV = {
  uploaded:                 { ic:'fa-upload',       c:'#059669', bg:'#d1fae5', label:'อัปโหลดรูป' },
  metadata_updated:         { ic:'fa-pen',          c:'#2563eb', bg:'#dbeafe', label:'แก้ข้อมูลรูป' },
  delete_requested:         { ic:'fa-clock',        c:'#d97706', bg:'#fef3c7', label:'ขอลบรูป' },
  delete_request_cancelled: { ic:'fa-rotate-left',  c:'#6b7280', bg:'#f3f4f6', label:'ยกเลิกคำขอลบ' },
  delete_direct:            { ic:'fa-trash',        c:'#dc2626', bg:'#fee2e2', label:'แอดมินลบตรง' },
  delete_approved:          { ic:'fa-check-double', c:'#dc2626', bg:'#fee2e2', label:'อนุมัติลบ (เข้าถังขยะ)' },
  delete_rejected:          { ic:'fa-xmark',        c:'#0d9488', bg:'#ccfbf1', label:'ปฏิเสธคำขอลบ' },
  restored:                 { ic:'fa-rotate-left',  c:'#0d9488', bg:'#ccfbf1', label:'กู้คืนจากถัง' },
  hard_deleted:             { ic:'fa-fire',         c:'#991b1b', bg:'#fee2e2', label:'ลบถาวร' },
  purged:                   { ic:'fa-fire',         c:'#991b1b', bg:'#fee2e2', label:'ลบอัตโนมัติ (60 วัน)' },
}
// ตัวเลือกในดรอปดาวน์เลือกหลายข้อ (set ว่าง = ทุกเหตุการณ์)
const EV_LIST = [
  ['uploaded','อัปโหลด'], ['metadata_updated','แก้ข้อมูล'], ['delete_requested','ขอลบ'],
  ['delete_request_cancelled','ยกเลิกคำขอ'], ['delete_direct','แอดมินลบตรง'], ['delete_approved','อนุมัติลบ'],
  ['delete_rejected','ปฏิเสธ'], ['restored','กู้คืน'], ['hard_deleted','ลบถาวร'], ['purged','ลบอัตโนมัติ'],
]
const DATE_OPTS = [['7d','7 วัน'], ['30d','30 วัน'], ['all','ทั้งหมด']]
const TYPE_LABEL = { cxr:'CXR', lab:'ผลแล็บ', document:'เอกสาร', other:'อื่นๆ' }
const STATUS = {
  hard_deleted:   { label:'ลบถาวรแล้ว', c:'#991b1b', bg:'#fee2e2' },
  in_trash:       { label:'อยู่ในถังขยะ', c:'#d97706', bg:'#fef3c7' },
  pending_delete: { label:'รอลบ',       c:'#d97706', bg:'#fef3c7' },
}
const DUP_COLORS = ['#7c3aed', '#db2777', '#2563eb', '#ea580c', '#0891b2', '#65a30d', '#c026d3']

function computeSinceMs(key) {
  const d = Date.now()
  if (key === '7d')  return d - 7 * 86400000
  if (key === '30d') return d - 30 * 86400000
  return 0
}
function fmtWhen(iso) {
  if (!iso) return '-'
  const dt = new Date(iso), now = new Date()
  const t = dt.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' })
  const sameDay = dt.toDateString() === now.toDateString()
  const yst = new Date(now.getTime() - 86400000).toDateString() === dt.toDateString()
  if (sameDay) return 'วันนี้ ' + t
  if (yst) return 'เมื่อวาน ' + t
  return dt.toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric' }) + ' ' + t
}
function fmtDateTime(iso) {
  if (!iso) return '-'
  const dt = new Date(iso)
  if (isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric' }) + ' ' +
         dt.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' })
}
function shortId(id) { return '#' + String(id || '').replace(/-/g, '').slice(0, 8) }
function fmtBytes(n) {
  if (n === null || n === undefined || isNaN(n)) return '-'
  if (n >= 1048576) return (n / 1048576).toFixed(1) + ' MB'
  if (n >= 1024) return Math.round(n / 1024).toLocaleString() + ' KB'
  return n + ' B'
}
function mimeLabel(m) { return m ? String(m).replace('image/', '').toUpperCase() : '-' }
function phashDist(a, b) {
  if (!a || !b) return 64
  try { let x = BigInt('0x' + a) ^ BigInt('0x' + b), c = 0; while (x) { c += Number(x & 1n); x >>= 1n } return c } catch { return 64 }
}
// รูปย่อในหัวการ์ด (มุมตามรูป) — รูปที่ยังอยู่ = signed URL จริง (กดดูได้) · ลบถาวรแล้ว = ไฟล์หายจึงโชว์ placeholder
function LogThumb({ url, status, onOpen }) {
  const [err, setErr] = React.useState(false)
  React.useEffect(() => { setErr(false) }, [url])
  const box = { width:'46px', height:'46px', flexShrink:0, borderRadius:'10px', overflow:'hidden', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }
  const gone = status === 'hard_deleted'
  if (gone || !url || err) {
    return (
      <div style={{ ...box, background: gone ? '#fef2f2' : '#f3f4f6', flexDirection:'column', gap:'2px' }} title={gone ? 'ไฟล์รูปถูกลบถาวรแล้ว (เหลือแต่ประวัติ)' : 'ไม่มีรูปย่อ'}>
        <i className={'fa-solid '+(gone?'fa-fire':'fa-image')} style={{ fontSize:'15px', color: gone?'#f87171':'#9ca3af' }}></i>
        {gone && <span style={{ fontSize:'7.5px', color:'#f87171', fontWeight:700, lineHeight:1 }}>ลบถาวร</span>}
      </div>
    )
  }
  // รูปที่ยังไม่ลบ = กรอบเทลจางๆ (ให้รูปพื้นขาวมีขอบ) + กดดูรูปใหญ่ได้ (ตัวดูรูปเดียวกับคลังภาพ = กันเซฟ)
  return (
    <div onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); onOpen && onOpen(e.currentTarget.getBoundingClientRect()) }} title="กดเพื่อดูรูปขนาดใหญ่"
      style={{ ...box, border:'1px solid #99f6e4', cursor:'zoom-in', position:'relative' }}>
      <img src={url} alt="" draggable="false" onContextMenu={(e)=>e.preventDefault()} onError={()=>setErr(true)} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
    </div>
  )
}

// ป้ายบทบาทผู้ทำ — สีตามที่เว็บใช้ (บันทึกกิจกรรม): แอดมิน=อำพัน · ผู้ใช้=ฟ้า
function roleBadge(role) {
  if (role === 'admin') return <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 6px', borderRadius:'999px', background:'#fef3c7', color:'#92400e', marginLeft:'5px', whiteSpace:'nowrap' }}>แอดมิน</span>
  if (role === 'user')  return <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 6px', borderRadius:'999px', background:'#e0f2fe', color:'#0369a1', marginLeft:'5px', whiteSpace:'nowrap' }}>ผู้ใช้</span>
  return null
}
// หมายเหตุกิจกรรม (เหตุผลลบ/ทำกิจกรรม) — มีคำนำหน้าให้รู้ว่าคือหมายเหตุ
function noteText(reason) {
  if (!reason) return null
  return <span> · <span style={{ color:'#9ca3af' }}>หมายเหตุ:</span> <span style={{ fontStyle:'italic' }}>{reason}</span></span>
}

// สร้าง object แบบ record รูป (im) จาก snapshot ใน log → ใช้กับ patientImgInfo / AvatarLightbox (ตัวดูรูปเดียวกับคลังภาพ)
function snapToImLike(v) {
  const s = (v && v.snapshot) || {}
  return {
    mime: s.mime, type: v.type, note: s.note, device: s.device, uploaded_at: s.uploaded_at,
    size_bytes: s.size_bytes, orig_size_bytes: s.orig_size_bytes, orig_mime: s.orig_mime,
    orig_width: s.orig_width, orig_height: s.orig_height, uploader_name: v.owner_name,
    orig_sha256: s.orig_sha256, orig_md5: s.orig_md5, orig_crc32: s.orig_crc32,
    webp_sha256: s.webp_sha256, webp_md5: s.webp_md5, webp_crc32: s.webp_crc32, phash: s.phash,
  }
}

// อ่าน cache — รองรับทั้งรูปแบบเก่า (array) และใหม่ ({events, thumbs})
function readSeed(c) {
  if (!c) return { events: null, thumbs: {}, fulls: {} }
  const d = c.data
  if (Array.isArray(d)) return { events: d, thumbs: {}, fulls: {} }
  return { events: (d && d.events) || null, thumbs: (d && d.thumbs) || {}, fulls: (d && d.fulls) || {} }
}

function ImageLogPage({ headerExtra, onOpenInGallery, onOpenPatient } = {}) {
  const _seed = readSeed(loadCache(LOG_CACHE_KEY))
  const [allEvents, setAllEvents] = React.useState(_seed.events)   // seed จาก cache = ไม่ขึ้น skeleton ซ้ำ
  const [thumbs, setThumbs] = React.useState(_seed.thumbs)         // image_id -> signed URL รูปย่อ (เฉพาะรูปที่ยังไม่ลบถาวร)
  const [fulls, setFulls] = React.useState(_seed.fulls)           // image_id -> signed URL รูปเต็ม (กดดูรูปได้)
  const [capped, setCapped] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [view, setView] = React.useState('time')        // 'time' | 'image'
  const [eventSet, setEventSet] = React.useState(() => new Set())
  const [ddOpen, setDdOpen] = React.useState(false)
  const [dateKey, setDateKey] = React.useState('7d')
  const [q, setQ] = React.useState('')
  const [dupOnly, setDupOnly] = React.useState(false)   // มุมตามรูป: กรองเฉพาะรูปที่มีแฝด (ซ้ำ/คล้าย)
  const [dupFocus, setDupFocus] = React.useState(null)  // กดป้าย "ภาพคล้าย #X" = โฟกัสดูเฉพาะกลุ่มนั้น {id, exact}
  const [collapsed, setCollapsed] = React.useState(() => new Set())   // image_id ที่ยุบรายการกิจกรรมอยู่
  const [snap, setSnap] = React.useState(null)          // event ที่กดดูรายละเอียด
  const [viewImg, setViewImg] = React.useState(null)    // URL รูปที่กดดู (เปิด lightbox)
  const [visTime, setVisTime] = React.useState(60)
  const [visImg, setVisImg] = React.useState(24)
  const ddRef = React.useRef(null)

  const reload = React.useCallback(async (force) => {
    const c = loadCache(LOG_CACHE_KEY)
    if (c && !force) { const s = readSeed(c); setAllEvents(s.events); setThumbs(s.thumbs); setFulls(s.fulls); if (Date.now() - c.ts < CACHE_TTL) return }   // มี cache สด (<5นาที) = ไม่ยิง server ซ้ำ
    setLoading(true)
    try {
      const r = await fetch('/api/patient/images/log')
      const d = await r.json()
      if (r.ok) { setAllEvents(d.events || []); setThumbs(d.thumbs || {}); setFulls(d.fulls || {}); setCapped(!!d.capped); saveCache(LOG_CACHE_KEY, { events: d.events || [], thumbs: d.thumbs || {}, fulls: d.fulls || {} }) }
      else if (!c) setAllEvents([])
    } catch { if (!c) setAllEvents([]) }
    setLoading(false)
  }, [])

  React.useEffect(() => { reload(false) }, [reload])

  // รีเฟรชเมื่อมี action กับรูป (เหตุการณ์ tb-img-changed จาก channel กลาง · หน่วงให้ log insert ลงก่อน)
  React.useEffect(() => {
    let t = null
    const h = () => { if (t) clearTimeout(t); t = setTimeout(() => reload(true), 900) }   // มี action = ดึงใหม่ (bypass cache)
    window.addEventListener('tb-img-changed', h)
    return () => { window.removeEventListener('tb-img-changed', h); if (t) clearTimeout(t) }
  }, [reload])

  // ปิดดรอปดาวน์เมื่อคลิกนอก
  React.useEffect(() => {
    if (!ddOpen) return
    const h = (e) => { if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [ddOpen])

  // รีเซ็ตจำนวนที่โชว์เมื่อเปลี่ยนตัวกรอง/มุมมอง
  React.useEffect(() => { setVisTime(60); setVisImg(24) }, [eventSet, dateKey, q, view, dupOnly, dupFocus])
  // ออกจากมุมตามรูป/เปลี่ยนตัวกรองหลัก = เลิกโฟกัสกลุ่มรูปคล้าย
  React.useEffect(() => { setDupFocus(null) }, [view, eventSet, dateKey, q])

  const sinceMs = React.useMemo(() => computeSinceMs(dateKey), [dateKey])

  // กรองด้วยวันที่+ค้นหา (ยังไม่กรองชนิดกิจกรรม) — ใช้เป็นฐานของแถบสรุป เพื่อให้โชว์ทุกชนิดเสมอ (กดสลับได้)
  const dateqFiltered = React.useMemo(() => {
    const list = allEvents || []
    const qq = q.trim().toLowerCase()
    return list.filter(e => {
      if (sinceMs && new Date(e.created_at).getTime() < sinceMs) return false
      if (qq) { const hay = ((e.patient_name||'') + ' ' + (e.patient_hn||'') + ' ' + (e.actor_name||'')).toLowerCase(); if (!hay.includes(qq)) return false }
      return true
    })
  }, [allEvents, sinceMs, q])
  // กรองชนิดกิจกรรมทับอีกที (ทันที)
  const filtered = React.useMemo(() => eventSet.size ? dateqFiltered.filter(e => eventSet.has(e.event_type)) : dateqFiltered, [dateqFiltered, eventSet])
  // ยอดต่อชนิดกิจกรรม (จากฐานวันที่+ค้นหา · ไม่สนตัวกรองชนิด) — โชว์ในแถบสรุปให้กดกรองได้
  const evCounts = React.useMemo(() => { const m = {}; for (const e of dateqFiltered) m[e.event_type] = (m[e.event_type] || 0) + 1; return m }, [dateqFiltered])

  // จัดกลุ่มตามรูป + ตรวจรูปซ้ำ (ฝั่ง client)
  const grouped = React.useMemo(() => {
    const map = new Map()
    for (const e of filtered) {
      let g = map.get(e.image_id)
      if (!g) { g = { image_id:e.image_id, events:[], patient_id:null, patient_name:null, patient_hn:null, owner_name:null, image_type:null, snapshot:null }; map.set(e.image_id, g) }
      g.events.push(e)
      if (e.patient_id) g.patient_id = e.patient_id
      if (e.patient_name) g.patient_name = e.patient_name
      if (e.patient_hn) g.patient_hn = e.patient_hn
      if (e.owner_name) g.owner_name = e.owner_name
      if (e.image_type) g.image_type = e.image_type
      const s = e.snapshot
      if (s && (s.orig_sha256 || s.phash || s.webp_sha256)) g.snapshot = s
      else if (s && !g.snapshot) g.snapshot = s
    }
    const groups = Array.from(map.values()).map(g => {
      g.events.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))   // ในกลุ่ม เก่า→ใหม่
      const evs = g.events
      const last = evs[evs.length - 1]
      const types = new Set(evs.map(x => x.event_type))
      let status = 'active'
      if (types.has('hard_deleted') || types.has('purged')) status = 'hard_deleted'
      else if (last && last.event_type === 'delete_approved') status = 'in_trash'
      else if (last && last.event_type === 'delete_direct') status = 'in_trash'
      else if (last && last.event_type === 'delete_requested') status = 'pending_delete'
      const snap = g.snapshot || {}
      return { ...g, count:evs.length, latest:last ? last.created_at : null, status,
        hash:{ sha256:snap.orig_sha256 || null, phash:snap.phash || null }, dup:null }
    })
    // union-find: exact = sha256 ตรง · near = pHash Hamming ≤ 8
    const n = groups.length
    const parent = Array.from({ length:n }, (_, i) => i)
    const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i] } return i }
    const union = (i, j) => { const a = find(i), b = find(j); if (a !== b) parent[a] = b }
    const exactFlag = new Array(n).fill(false)
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const gi = groups[i].hash, gj = groups[j].hash
      const exact = !!(gi.sha256 && gj.sha256 && gi.sha256 === gj.sha256)
      const near = phashDist(gi.phash, gj.phash) <= 8
      if (exact || near) { union(i, j); if (exact) { exactFlag[i] = true; exactFlag[j] = true } }
    }
    const size = new Map(); for (let i = 0; i < n; i++) { const r = find(i); size.set(r, (size.get(r) || 0) + 1) }
    const idx = new Map(); let dc = 0
    for (let i = 0; i < n; i++) { const r = find(i); if ((size.get(r) || 0) > 1) { if (!idx.has(r)) idx.set(r, ++dc); groups[i].dup = { id:idx.get(r), exact:exactFlag[i] } } }
    groups.sort((a, b) => (b.latest || '').localeCompare(a.latest || ''))
    return groups
  }, [filtered])

  const toggleEvent = (v) => setEventSet(prev => { const n = new Set(prev); if (n.has(v)) n.delete(v); else n.add(v); return n })
  const toggleCollapse = (id) => setCollapsed(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const openSnap = (ev) => { setSnap(ev) }
  const focusDup = (dup) => { setDupFocus(dup ? { id: dup.id, exact: dup.exact } : null); setDupOnly(false) }
  const dupCount = React.useMemo(() => grouped.filter(g => g.dup).length, [grouped])

  // ปุ่มกระโดด: "ดูในคลัง" (เฉพาะรูปที่ยังไม่ลบ) + "เวชระเบียน" (เปิดเวชระเบียนคนไข้) — ใช้ทั้งมุมตามรูป/ตามเวลา
  const navButtons = (imageId, patientId, status) => (<>
    {status === 'active' && onOpenInGallery && <button onClick={(e)=>{ e.stopPropagation(); onOpenInGallery(imageId) }} className="tb-hovteal" title="เปิดรูปนี้ในหน้าคลังรูป (ดูข้างรูปอื่นของคนไข้ · แก้ไขได้)" style={{ fontSize:'11px', fontWeight:700, color:'#0d9488', background:'#f0fdfa', border:'0.5px solid #99f6e4', borderRadius:'5px', padding:'1px 8px', display:'inline-flex', alignItems:'center', gap:'4px', cursor:'pointer' }}><i className="fa-solid fa-up-right-from-square" style={{ fontSize:'9px' }}></i>ดูในคลัง</button>}
    {onOpenPatient && patientId && <button onClick={(e)=>{ e.stopPropagation(); onOpenPatient(patientId) }} className="tb-hovbg" title="เปิดเวชระเบียนของผู้ป่วยคนนี้" style={{ fontSize:'11px', fontWeight:700, color:'#4b5563', background:'#f3f4f6', border:'0.5px solid #e5e7eb', borderRadius:'5px', padding:'1px 8px', display:'inline-flex', alignItems:'center', gap:'4px', cursor:'pointer' }}><i className="fa-solid fa-user-doctor" style={{ fontSize:'9px' }}></i>เวชระเบียน</button>}
  </>)

  // ยุบ/กางกิจกรรมทุกการ์ดในครั้งเดียว
  const allIds = React.useMemo(() => grouped.map(g => g.image_id), [grouped])
  const anyExpanded = allIds.some(id => !collapsed.has(id))
  const toggleAll = () => setCollapsed(anyExpanded ? new Set(allIds) : new Set())
  // สถานะรูปต่อ image_id (ให้รูปย่อในแถบตามเวลารู้ว่ารูปลบถาวรไหม → โชว์ placeholder ถูก)
  const statusById = React.useMemo(() => { const m = {}; for (const g of grouped) m[g.image_id] = g.status; return m }, [grouped])

  const chip = (on) => ({ border:'0.5px solid '+(on?'#0d9488':'#e5e7eb'), background:on?'#0d9488':'#fff', color:on?'#fff':'#6b7280', borderRadius:'999px', padding:'5px 12px', fontSize:'12px', cursor:'pointer' })
  const segBtn = (on) => ({ display:'flex', alignItems:'center', gap:'6px', border:'none', background:on?'#0d9488':'transparent', color:on?'#fff':'#6b7280', borderRadius:'8px', padding:'7px 14px', fontSize:'13px', fontWeight:700, cursor:'pointer' })

  const imgSource = dupFocus ? grouped.filter(g => g.dup && g.dup.id === dupFocus.id)
    : dupOnly ? grouped.filter(g => g.dup) : grouped
  const isInitLoading = allEvents === null
  const isEmpty = allEvents !== null && (view === 'image' ? imgSource.length === 0 : filtered.length === 0)
  const totalImages = imgSource.length
  const totalEvents = filtered.length
  const imgEventCount = imgSource.reduce((s, g) => s + g.count, 0)   // นับเหตุการณ์เฉพาะรูปที่แสดง (กันตัวนับไม่ลดตอนกรองรูปซ้ำ)
  const timeShown = filtered.slice(0, visTime)
  const imgShown = imgSource.slice(0, visImg)
  const hasMore = view === 'image' ? visImg < imgSource.length : visTime < filtered.length

  return (
    <div>
      {/* ส่วนหัว — ตรึงไว้ด้านบน (sticky · full-bleed ปิดช่องโหว่บน+ข้าง) */}
      <div style={{ position:'sticky', top:'-24px', zIndex:20, background:'#f0fdfa', margin:'0 -24px 6px', padding:'12px 24px 10px' }}>
      {headerExtra}
      {/* แถบกรอง (ปุ่มสลับมุมมอง + ช่องค้นหา แถวเดียวกัน) */}
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'0' }}>
        <div style={{ display:'inline-flex', background:'#f3f4f6', borderRadius:'10px', padding:'3px', flexShrink:0 }}>
          <button onClick={()=>setView('time')} style={segBtn(view==='time')}><i className="fa-solid fa-list-ul"></i> ตามเวลา</button>
          <button onClick={()=>setView('image')} style={segBtn(view==='image')}><i className="fa-solid fa-images"></i> ตามรูป</button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'6px 10px', flex:'0 1 190px', minWidth:'130px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize:'12px', color:'#9ca3af' }}></i>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาผู้ป่วย / HN" style={{ flex:1, minWidth:0, border:'none', outline:'none', fontSize:'13px', background:'none' }}/>
        </div>

        {/* ดรอปดาวน์เลือกหลายข้อ */}
        <div ref={ddRef} style={{ position:'relative' }}>
          <button onClick={()=>setDdOpen(o=>!o)} className="tb-hovbg" style={{ display:'flex', alignItems:'center', gap:'7px', width:'178px', boxSizing:'border-box', padding:'7px 11px', borderRadius:'8px', border:'1px solid '+(eventSet.size?'#0d9488':'#e5e7eb'), background:'#fff', fontSize:'12px', color:eventSet.size?'#0d9488':'#6b7280', cursor:'pointer' }}>
            <i className="fa-solid fa-filter" style={{ fontSize:'11px', flexShrink:0 }}></i>
            <span style={{ flex:1, textAlign:'left', whiteSpace:'nowrap' }}>{eventSet.size ? 'เลือก ' + eventSet.size + ' เหตุการณ์' : 'ทุกเหตุการณ์'}</span>
            <i className={'fa-solid ' + (ddOpen ? 'fa-chevron-up' : 'fa-chevron-down')} style={{ fontSize:'10px', color:'#9ca3af', flexShrink:0 }}></i>
          </button>
          {ddOpen && (
            <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:60, background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', padding:'5px', minWidth:'210px' }}>
              {EV_LIST.map(([v, l]) => {
                const on = eventSet.has(v)
                return (
                  <div key={v} onClick={()=>toggleEvent(v)} className="tb-hovteal" style={{ display:'flex', alignItems:'center', gap:'9px', padding:'7px 9px', borderRadius:'7px', cursor:'pointer', background:on?'#f0fdfa':'transparent' }}>
                    <div style={{ width:'17px', height:'17px', borderRadius:'4px', background:on?'#0d9488':'#fff', border:on?'none':'1.5px solid #d1d5db', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{on && <i className="fa-solid fa-check" style={{ fontSize:'10px', color:'#fff' }}></i>}</div>
                    <span style={{ fontSize:'13px', color:on?'#111827':'#374151' }}>{l}</span>
                  </div>
                )
              })}
              <div style={{ display:'flex', gap:'8px', padding:'6px 4px 2px', borderTop:'1px solid #f3f4f6', marginTop:'4px' }}>
                <span onClick={()=>setEventSet(new Set())} className="tb-hovbg" style={{ fontSize:'12px', color:'#6b7280', cursor:'pointer', padding:'5px 9px', borderRadius:'6px' }}>ล้างทั้งหมด</span>
                <span onClick={()=>setEventSet(new Set(EV_LIST.map(x=>x[0])))} className="tb-hovbg" style={{ fontSize:'12px', color:'#0d9488', marginLeft:'auto', cursor:'pointer', padding:'5px 9px', borderRadius:'6px' }}>เลือกทั้งหมด</span>
              </div>
            </div>
          )}
        </div>

        {DATE_OPTS.map(([v, l]) => <button key={v} onClick={()=>setDateKey(v)} style={chip(dateKey===v)}>{l}</button>)}
        {view === 'image' && (
          dupFocus
            ? <button onClick={()=>setDupFocus(null)} title="เลิกดูเฉพาะกลุ่มนี้ (กลับไปดูทุกรูป)" style={{ ...chip(true), display:'inline-flex', alignItems:'center', gap:'6px' }}>
                <i className={'fa-solid '+(dupFocus.exact?'fa-clone':'fa-images')} style={{ fontSize:'10px' }}></i>{dupFocus.exact ? 'รูปซ้ำ' : 'ภาพคล้าย'} #{dupFocus.id}<i className="fa-solid fa-xmark" style={{ fontSize:'11px', marginLeft:'1px' }}></i>
              </button>
            : <button onClick={()=>setDupOnly(v=>!v)} title="แสดงเฉพาะรูปที่มีแฝดในระบบ (เนื้อไฟล์ซ้ำ หรือภาพคล้ายกันมาก)" style={{ ...chip(dupOnly), display:'inline-flex', alignItems:'center', gap:'5px' }}>
                <i className="fa-solid fa-clone" style={{ fontSize:'10px' }}></i>เฉพาะรูปซ้ำ{dupCount ? ' ('+dupCount+')' : ''}
              </button>
        )}
        {view === 'image' && imgSource.length > 0 && (
          <button onClick={toggleAll} title={anyExpanded ? 'ยุบรายละเอียดทุกการ์ด' : 'กางรายละเอียดทุกการ์ด'} style={{ display:'inline-flex', alignItems:'center', gap:'5px', border:'0.5px solid #e5e7eb', background:'#fff', color:'#6b7280', borderRadius:'999px', padding:'5px 12px', fontSize:'12px', cursor:'pointer' }}>
            <i className={'fa-solid '+(anyExpanded?'fa-angles-up':'fa-angles-down')} style={{ fontSize:'10px' }}></i>{anyExpanded ? 'ยุบทั้งหมด' : 'กางทั้งหมด'}
          </button>
        )}
        <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#9ca3af' }}>
          {loading && <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize:'12px' }}></i>}
          {view === 'image' ? `${totalImages} รูป · ${imgEventCount} เหตุการณ์` : `${totalEvents} เหตุการณ์`}
        </span>
      </div>
      {/* แถบสรุปยอดต่อชนิดกิจกรรม (กดเพื่อกรอง · ตรึงรวมกับหัว) */}
      {!isInitLoading && dateqFiltered.length > 0 && (
        <div style={{ display:'flex', gap:'7px', flexWrap:'wrap', marginTop:'9px' }}>
          {EV_LIST.map(([type]) => {
            const c = evCounts[type]; if (!c) return null
            const m = EV[type] || { ic:'fa-circle', c:'#6b7280', bg:'#f3f4f6', label:type }
            const on = eventSet.has(type)
            return <button key={type} onClick={()=>toggleEvent(type)} title={on ? 'เลิกกรองกิจกรรมนี้' : 'กดเพื่อกรองเฉพาะกิจกรรมนี้'} style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'11.5px', fontWeight:700, color:m.c, background:m.bg, border:'none', borderRadius:'999px', padding:'3px 11px', cursor:'pointer', boxShadow: on ? '0 0 0 2px '+m.c : 'none', opacity:(eventSet.size && !on) ? 0.45 : 1 }}>{on && <i className="fa-solid fa-check" style={{ fontSize:'9px' }}></i>}<i className={'fa-solid '+m.ic} style={{ fontSize:'10px' }}></i>{m.label} {c}</button>
          })}
        </div>
      )}
      </div>{/* /sticky header */}

      {capped &&<div style={{ fontSize:'11.5px', color:'#b45309', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'8px', padding:'7px 11px', margin:'12px 0' }}>แสดงเหตุการณ์ล่าสุด 5,000 รายการ (มีมากกว่านี้ในระบบ)</div>}

      {/* โหลดครั้งแรก */}
      {isInitLoading && <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>{[0,1,2,3].map(i=><div key={i} className="tb-skel" style={{ height:view==='image'?'120px':'66px', borderRadius:'11px' }}/>)}</div>}

      {/* ว่าง */}
      {isEmpty && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'56px 20px' }}>
          <div style={{ width:'70px', height:'70px', borderRadius:'50%', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}><i className="fa-solid fa-clock-rotate-left" style={{ fontSize:'26px', color:'#cbd5e1' }}></i></div>
          <p style={{ fontSize:'14px', fontWeight:700, color:'#6b7280', margin:'0 0 4px' }}>ยังไม่มีประวัติที่ตรงกับตัวกรอง</p>
          <p style={{ fontSize:'12px', color:'#9ca3af', margin:0 }}>ลองเปลี่ยนช่วงเวลา หรือชนิดเหตุการณ์</p>
        </div>
      )}

      {/* ══════ มุม "ตามเวลา" ══════ */}
      {!isInitLoading && view === 'time' && timeShown.map(lg => {
        const e = EV[lg.event_type] || { ic:'fa-circle', c:'#6b7280', bg:'#f3f4f6', label:lg.event_type }
        return (
          <div key={lg.id} style={{ display:'flex', gap:'12px', alignItems:'flex-start', background:'#fff', border:'1px solid #e5e7eb', borderRadius:'11px', padding:'11px 13px', marginBottom:'9px' }}>
            {/* รูปย่อ (กดดูได้) + ป้ายชนิดกิจกรรมมุมล่างขวา */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <LogThumb url={thumbs[lg.image_id]} status={statusById[lg.image_id]} onOpen={(rect)=> setViewImg({ id:lg.image_id, snapshot:lg.snapshot, patient_name:lg.patient_name, patient_hn:lg.patient_hn, owner_name:lg.owner_name, type:lg.image_type, rect })} />
              <div title={e.label} style={{ position:'absolute', right:'-4px', bottom:'-4px', width:'21px', height:'21px', borderRadius:'50%', background:e.bg, border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center' }}><i className={'fa-solid '+e.ic} style={{ fontSize:'9px', color:e.c }}></i></div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'13.5px', fontWeight:700, color:e.c }}>{e.label}</span>
                <span style={{ fontSize:'11px', color:'#6b7280', background:'#f3f4f6', borderRadius:'5px', padding:'1px 7px' }}>{TYPE_LABEL[lg.image_type] || lg.image_type || '-'}</span>
              </div>
              <div style={{ fontSize:'12px', color:'#374151', marginTop:'3px' }}>{lg.patient_name || lg.patient_id || '-'}{lg.patient_hn ? <span style={{ color:'#9ca3af' }}> · HN {lg.patient_hn}</span> : null}</div>
              <div style={{ fontSize:'11.5px', color:'#6b7280', marginTop:'2px', wordBreak:'break-word' }}>
                โดย {lg.actor_name || '-'}{roleBadge(lg.actor_role)}
                {lg.owner_name ? <span> · เจ้าของรูป {lg.owner_name}</span> : null}
                {noteText(lg.reason)}
              </div>
              {lg.snapshot && (lg.snapshot.orig_sha256 || lg.snapshot.phash) && (
                <div style={{ fontSize:'10.5px', color:'#9ca3af', marginTop:'3px', fontFamily:'ui-monospace, monospace', wordBreak:'break-all' }}>
                  {lg.snapshot.orig_sha256 ? <>SHA-256 {highlightMagic(lg.snapshot.orig_sha256, '#0d9488')}</> : <>pHash {highlightMagic(lg.snapshot.phash, '#0d9488')}</>}
                </div>
              )}
              {(onOpenInGallery || onOpenPatient) && <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'6px' }}>{navButtons(lg.image_id, lg.patient_id, statusById[lg.image_id])}</div>}
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:'11px', color:'#9ca3af', whiteSpace:'nowrap' }}>{fmtWhen(lg.created_at)}</div>
              {lg.snapshot && <button onClick={()=>openSnap(lg)} style={{ marginTop:'6px', border:'0.5px solid #d1d5db', borderRadius:'7px', padding:'3px 9px', fontSize:'11px', color:'#4b5563', background:'#fff', cursor:'pointer' }}>ดูข้อมูล</button>}
            </div>
          </div>
        )
      })}

      {/* ══════ มุม "ตามรูป" ══════ */}
      {!isInitLoading && view === 'image' && imgShown.map(g => {
        const st = STATUS[g.status]
        const dupColor = g.dup ? DUP_COLORS[(g.dup.id - 1) % DUP_COLORS.length] : null
        const isCol = collapsed.has(g.image_id)
        return (
          <div key={g.image_id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'13px', padding:'13px 15px', marginBottom:'11px' }}>
            <div style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
              <LogThumb url={thumbs[g.image_id]} status={g.status} onOpen={(rect)=> setViewImg({ id:g.image_id, snapshot:g.snapshot, patient_name:g.patient_name, patient_hn:g.patient_hn, owner_name:g.owner_name, type:g.image_type, rect })} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'7px', flexWrap:'wrap' }}>
                  <span title="รหัสอ้างอิงรูป (ระบบสุ่มให้ ไม่เกี่ยวกับเนื้อรูป)" style={{ fontSize:'13px', fontWeight:800, color:'#374151', fontFamily:'ui-monospace, monospace' }}>{shortId(g.image_id)}</span>
                  <span style={{ fontSize:'11px', color:'#6b7280', background:'#f3f4f6', borderRadius:'5px', padding:'1px 7px' }}>{TYPE_LABEL[g.image_type] || g.image_type || '-'}</span>
                  {st && <span style={{ fontSize:'11px', fontWeight:700, color:st.c, background:st.bg, borderRadius:'5px', padding:'1px 8px' }}>{st.label}</span>}
                  {g.dup && <span onClick={(e)=>{ e.stopPropagation(); focusDup(g.dup) }} title={(g.dup.exact ? 'เนื้อไฟล์เหมือนกันเป๊ะกับรูปอื่นในระบบ' : 'ภาพคล้ายกันมากกับรูปอื่นในระบบ') + ' (กลุ่มที่ '+g.dup.id+') — กดเพื่อดูเฉพาะกลุ่มนี้'} style={{ fontSize:'11px', fontWeight:700, color:'#fff', background:dupColor, borderRadius:'5px', padding:'1px 8px', display:'inline-flex', alignItems:'center', gap:'4px', cursor:'pointer' }}><i className={'fa-solid '+(g.dup.exact?'fa-clone':'fa-images')} style={{ fontSize:'9px' }}></i>{g.dup.exact ? 'รูปซ้ำ' : 'ภาพคล้าย'} #{g.dup.id}</span>}
                  {navButtons(g.image_id, g.patient_id, g.status)}
                </div>
                <div style={{ fontSize:'12px', color:'#374151', marginTop:'4px' }}>
                  {g.patient_name || '-'}{g.patient_hn ? <span style={{ color:'#9ca3af' }}> · HN {g.patient_hn}</span> : null}
                  {g.owner_name ? <span style={{ color:'#9ca3af' }}> · เจ้าของ {g.owner_name}</span> : null}
                </div>
                {g.hash.sha256
                  ? <div style={{ fontSize:'10.5px', color:'#9ca3af', marginTop:'3px', fontFamily:'ui-monospace, monospace', wordBreak:'break-all' }}>SHA-256 {highlightMagic(g.hash.sha256, '#0d9488')}</div>
                  : g.hash.phash
                    ? <div style={{ fontSize:'10.5px', color:'#9ca3af', marginTop:'3px', fontFamily:'ui-monospace, monospace', wordBreak:'break-all' }}>pHash {highlightMagic(g.hash.phash, '#0d9488')}</div>
                    : null}
              </div>
              {/* ปุ่มยุบ/กางรายการกิจกรรม */}
              <button onClick={()=>toggleCollapse(g.image_id)} className="tb-hovbg" title={isCol ? 'กางรายการกิจกรรม' : 'ยุบรายการกิจกรรม'} style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0, border:'none', background:'transparent', borderRadius:'7px', padding:'4px 8px', cursor:'pointer', color:'#9ca3af', fontSize:'11px', whiteSpace:'nowrap', alignSelf:'flex-start' }}>
                {g.count} เหตุการณ์<i className={'fa-solid '+(isCol?'fa-chevron-down':'fa-chevron-up')} style={{ fontSize:'10px' }}></i>
              </button>
            </div>
            {!isCol && (
            <div style={{ borderTop:'1px dashed #e5e7eb', marginTop:'11px', paddingTop:'8px', display:'flex', flexDirection:'column', gap:'2px' }}>
              {g.events.map(ev => {
                const e = EV[ev.event_type] || { ic:'fa-circle', c:'#6b7280', bg:'#f3f4f6', label:ev.event_type }
                const clickable = !!ev.snapshot
                return (
                  <div key={ev.id} onClick={()=> clickable && openSnap(ev)} className={clickable ? 'tb-hovteal' : undefined} style={{ display:'flex', gap:'10px', alignItems:'flex-start', cursor: clickable ? 'pointer' : 'default', borderRadius:'8px', padding:'6px', margin:'0 -6px' }}>
                    <div style={{ width:'26px', height:'26px', flexShrink:0, borderRadius:'50%', background:e.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><i className={'fa-solid '+e.ic} style={{ fontSize:'11px', color:e.c }}></i></div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontSize:'12.5px', fontWeight:700, color:e.c }}>{e.label}</span>
                      <div style={{ fontSize:'11.5px', color:'#6b7280', marginTop:'1px', wordBreak:'break-word' }}>
                        โดย {ev.actor_name || '-'}{roleBadge(ev.actor_role)}
                        {noteText(ev.reason)}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'7px', flexShrink:0 }}>
                      <div style={{ fontSize:'11px', color:'#9ca3af', whiteSpace:'nowrap' }}>{fmtWhen(ev.created_at)}</div>
                      {clickable && <i className="fa-solid fa-chevron-right" style={{ fontSize:'10px', color:'#cbd5e1' }}></i>}
                    </div>
                  </div>
                )
              })}
            </div>
            )}
          </div>
        )
      })}

      {/* โหลดเพิ่ม (ฝั่ง client · ทันที) */}
      {!isInitLoading && hasMore && <div style={{ textAlign:'center', marginTop:'12px' }}><button onClick={()=> view==='image' ? setVisImg(v=>v+24) : setVisTime(v=>v+60)} style={{ border:'0.5px solid #d1d5db', borderRadius:'9px', padding:'8px 20px', fontSize:'13px', color:'#4b5563', background:'#fff', cursor:'pointer' }}>โหลดเพิ่ม</button></div>}

      {/* popup รายละเอียด (ภาษาคน + สลับ JSON ดิบ) */}
      {snap && createPortal(<SnapModal snap={snap} onClose={()=>setSnap(null)} />, document.body)}
      {/* ดูรูปขนาดใหญ่ (กดจากรูปย่อ) — ตัวดูรูปเดียวกับคลังภาพ: ซูม/ลาก + กันคลิกขวา/บันทึกภาพ · ไม่มีปุ่มดาวน์โหลด */}
      {viewImg && (() => {
        const meta = PATIENT_IMG_TYPES[viewImg.type] || PATIENT_IMG_TYPES.other
        const name = meta.label + ' · ' + (viewImg.patient_name || '-') + (viewImg.patient_hn ? ' (' + viewImg.patient_hn + ')' : '')
        const info = patientImgInfo(snapToImLike(viewImg), meta, name)
        return <AvatarLightbox src={fulls[viewImg.id] || thumbs[viewImg.id]} thumb={thumbs[viewImg.id]} originRect={viewImg.rect} info={info}
          onExpire={async () => { try { const r = await fetch('/api/patient/images/' + viewImg.id + '/url'); if (r.ok) { const d = await r.json(); return d.url } } catch {} return null }}
          onClose={() => setViewImg(null)} />
      })()}
    </div>
  )
}

// ── modal รายละเอียด event/รูป ── ภาษาคน (จัดแนวนอน grid) + แฮชเต็ม + ปุ่มดูข้อมูลดิบ (JSON)
function SnapModal({ snap, onClose }) {
  const isEvent = !!snap.event_type   // true = เปิดจาก log (มี event) · false = เปิดจากรูปปกติ (ดูข้อมูลอย่างเดียว)
  const e = EV[snap.event_type] || { ic:'fa-circle', c:'#6b7280', bg:'#f3f4f6', label:snap.event_type }
  const s = snap.snapshot || null
  const [rawJson, setRawJson] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const copyJson = () => { try { navigator.clipboard.writeText(JSON.stringify(snap.snapshot, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {} }
  const row = (k, v, mono) => (
    <div key={k} style={{ display:'flex', gap:'8px' }}>
      <span style={{ color:'#9ca3af', flexShrink:0, minWidth:'88px' }}>{k}</span>
      <span style={{ flex:1, minWidth:0, wordBreak: mono ? 'break-all' : 'normal', overflowWrap: mono ? 'anywhere' : 'break-word', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit' }}>{v}</span>
    </div>
  )
  const sect = (icon, color, title, children, grid2) => (
    <div style={{ border:'1px solid #eef0f2', borderRadius:'11px', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'#f9fafb', padding:'7px 12px', borderBottom:'1px solid #eef0f2' }}><i className={'fa-solid '+icon} style={{ fontSize:'13px', color }}></i><span style={{ fontSize:'12px', fontWeight:700, color:'#374151' }}>{title}</span></div>
      <div style={{ padding:'8px 13px', fontSize:'12.5px', lineHeight:1.95, color:'#374151', ...(grid2 ? { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(210px, 1fr))', columnGap:'20px', rowGap:'0' } : {}) }}>{children}</div>
    </div>
  )
  const compress = (s && s.orig_size_bytes && s.size_bytes) ? Math.round((1 - s.size_bytes / s.orig_size_bytes) * 100) : null

  return (
    <div className="tb-backdrop" style={{ position:'fixed', inset:0, zIndex:10002, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }} onClick={onClose}>
      <div className="modal-A" onClick={ev=>ev.stopPropagation()} style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'720px', maxHeight:'86vh', overflowY:'auto', padding:'18px', boxSizing:'border-box' }}>
        {/* หัว */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:isEvent?e.bg:'#e0f2fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><i className={'fa-solid '+(isEvent?e.ic:'fa-image')} style={{ color:isEvent?e.c:'#0284c7', fontSize:'18px' }}></i></div>
          <div><p style={{ fontSize:'15px', fontWeight:700, color:'#111827', margin:0 }}>{isEvent ? e.label : 'รายละเอียดรูป'}</p><p style={{ fontSize:'11px', color:'#9ca3af', margin:0 }}>{isEvent ? fmtWhen(snap.created_at) : ((TYPE_LABEL[s&&s.type]||(s&&s.type)||'รูป') + (snap.patient_name ? ' · '+snap.patient_name : ''))}</p></div>
        </div>

        {/* ผู้เกี่ยวข้อง */}
        <div style={{ background:'#f9fafb', border:'1px solid #eef0f2', borderRadius:'11px', padding:'11px 13px', marginBottom:'12px', fontSize:'12.5px', lineHeight:1.9, color:'#374151' }}>
          {row('ผู้ป่วย', (snap.patient_name||'-') + (snap.patient_hn ? ' · HN '+snap.patient_hn : ''))}
          {isEvent ? row('ผู้ทำ', <span>{snap.actor_name||'-'}{roleBadge(snap.actor_role)}</span>) : null}
          {row('เจ้าของรูป', snap.owner_name || '-')}
          {snap.reason ? row('หมายเหตุ', snap.reason) : null}
        </div>

        {!s && <p style={{ fontSize:'12px', color:'#9ca3af', textAlign:'center', padding:'8px 0' }}>ไม่มีข้อมูลรูปในเหตุการณ์นี้</p>}

        {/* ทุกกรอบเต็มความกว้าง · ข้อมูลรูป/เวลา จัด row เป็น 2 คอลัมน์ให้เต็มกรอบ */}
        {s && !rawJson && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {sect('fa-image', '#0d9488', 'ข้อมูลรูป', <>
              {row('ชนิด', TYPE_LABEL[s.type] || s.type || '-')}
              {row('อุปกรณ์', s.device || '-')}
              {row('ขนาดภาพ', (s.width && s.height) ? `${s.width} × ${s.height} px` : '-')}
              {s.note ? row('หมายเหตุ', s.note) : null}
            </>, true)}

            {sect('fa-clock', '#6b7280', 'เวลา', <>
              {row('อัปโหลด', fmtDateTime(s.uploaded_at))}
              {s.deleted_at ? row('ลบ', fmtDateTime(s.deleted_at) + (s.deleter_name ? ' โดย '+s.deleter_name : '')) : null}
            </>, true)}

            {/* ต้นฉบับ vs ไฟล์ที่เก็บ — รวมกรอบเดียว เทียบกันได้ (เต็มความกว้าง) */}
            <div style={{ border:'1px solid #eef0f2', borderRadius:'11px', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'#f9fafb', padding:'7px 12px', borderBottom:'1px solid #eef0f2' }}><i className="fa-solid fa-right-left" style={{ fontSize:'12px', color:'#0d9488' }}></i><span style={{ fontSize:'12px', fontWeight:700, color:'#374151' }}>ต้นฉบับ เทียบ ไฟล์ที่เก็บ</span></div>
              <div style={{ padding:'9px 13px', fontSize:'12.5px', color:'#374151' }}>
                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr', gap:'6px 12px', alignItems:'baseline' }}>
                  <div></div>
                  <div style={{ fontWeight:700, color:'#6b7280' }}><i className="fa-solid fa-file" style={{ fontSize:'10px', marginRight:'4px' }}></i>ต้นฉบับ</div>
                  <div style={{ fontWeight:700, color:'#0d9488' }}><i className="fa-solid fa-hard-drive" style={{ fontSize:'10px', marginRight:'4px' }}></i>ไฟล์ที่เก็บ</div>
                  <div style={{ color:'#9ca3af' }}>นามสกุล</div>
                  <div style={{ fontWeight:700, color:'#111827' }}>{mimeLabel(s.orig_mime)}</div>
                  <div style={{ fontWeight:700, color:'#111827' }}>{mimeLabel(s.mime)}{s.quality ? ' · '+s.quality+'%' : ''}</div>
                  <div style={{ color:'#9ca3af' }}>ขนาดไฟล์</div>
                  <div>{fmtBytes(s.orig_size_bytes)}</div>
                  <div>{fmtBytes(s.size_bytes)}{compress !== null && compress > 0 ? <span style={{ color:'#059669' }}> · เล็กลง {compress}%</span> : null}</div>
                  <div style={{ color:'#9ca3af' }}>ขนาดภาพ</div>
                  <div>{(s.orig_width && s.orig_height) ? `${s.orig_width} × ${s.orig_height}` : '-'}</div>
                  <div>{(s.width && s.height) ? `${s.width} × ${s.height}` : '-'}</div>
                </div>
              </div>
            </div>

            {(s.orig_sha256 || s.orig_md5 || s.orig_crc32 || s.webp_sha256 || s.webp_md5 || s.webp_crc32 || s.phash) && (
              <div style={{ border:'1px solid #eef0f2', borderRadius:'11px', overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'#f9fafb', padding:'7px 12px', borderBottom:'1px solid #eef0f2' }}><i className="fa-solid fa-fingerprint" style={{ fontSize:'13px', color:'#7c3aed' }}></i><span style={{ fontSize:'12px', fontWeight:700, color:'#374151' }}>ลายนิ้วมือดิจิทัล (Hash)</span></div>
                <div style={{ padding:'8px 13px', fontSize:'12.5px', lineHeight:1.95, color:'#374151' }}>
                  {(s.orig_sha256 || s.orig_md5 || s.orig_crc32) && <>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#7c3aed', margin:'0 0 2px' }}>ต้นฉบับ ({mimeLabel(s.orig_mime)})</div>
                    {s.orig_sha256 ? row('SHA-256', highlightMagic(s.orig_sha256, '#0d9488'), true) : null}
                    {s.orig_md5 ? row('MD5', highlightMagic(s.orig_md5, '#0d9488'), true) : null}
                    {s.orig_crc32 ? row('CRC32', highlightMagic(s.orig_crc32, '#0d9488'), true) : null}
                  </>}
                  {(s.webp_sha256 || s.webp_md5 || s.webp_crc32) && <>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#7c3aed', margin:'9px 0 2px' }}>ไฟล์ที่เก็บ ({mimeLabel(s.mime)})</div>
                    {s.webp_sha256 ? row('SHA-256', highlightMagic(s.webp_sha256, '#0d9488'), true) : null}
                    {s.webp_md5 ? row('MD5', highlightMagic(s.webp_md5, '#0d9488'), true) : null}
                    {s.webp_crc32 ? row('CRC32', highlightMagic(s.webp_crc32, '#0d9488'), true) : null}
                  </>}
                  {s.phash ? <>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#7c3aed', margin:'9px 0 2px' }}>pHash (ภาพ · เทียบรูปซ้ำ)</div>
                    <div style={{ fontFamily:'ui-monospace, monospace', wordBreak:'break-all' }}>{highlightMagic(s.phash, '#0d9488')}</div>
                  </> : null}
                </div>
              </div>
            )}
          </div>
        )}

        {s && rawJson && (
          <div style={{ position:'relative' }}>
            <p style={{ fontSize:'11.5px', color:'#6b7280', margin:'0 0 6px' }}>ข้อมูลดิบทั้งหมดของรูปในรูปแบบ JSON (สำหรับสายเทคนิค/ตรวจสอบ)</p>
            <button onClick={copyJson} style={{ position:'absolute', top:'28px', right:'8px', zIndex:1, border:'0.5px solid #334155', borderRadius:'7px', padding:'4px 10px', background:'#1e293b', color:copied?'#5eead4':'#cbd5e1', fontSize:'11px', fontWeight:700, cursor:'pointer' }}><i className={'fa-solid '+(copied?'fa-check':'fa-copy')} style={{ marginRight:'4px' }}></i>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</button>
            <pre style={{ background:'#0b0f19', color:'#a5f3ea', borderRadius:'10px', padding:'12px', fontSize:'11px', overflowX:'auto', margin:0, whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{JSON.stringify(snap.snapshot, null, 2)}</pre>
          </div>
        )}

        {/* ปุ่ม — ขนาดคงที่ (กดสลับไม่ยืดหด) · ปิด = เทล */}
        <div style={{ display:'flex', gap:'8px', marginTop:'14px' }}>
          {s && <button onClick={()=>setRawJson(r=>!r)} className="tb-hovbg" style={{ width:'172px', flexShrink:0, textAlign:'center', border:'0.5px solid #d1d5db', borderRadius:'10px', padding:'10px 12px', background:'#fff', color:'#6b7280', fontWeight:700, fontSize:'12.5px', cursor:'pointer', whiteSpace:'nowrap' }}><i className={'fa-solid '+(rawJson?'fa-eye':'fa-code')} style={{ marginRight:'5px', fontSize:'11px' }}></i>{rawJson ? 'ดูแบบอ่านง่าย' : 'ดูข้อมูลดิบ (JSON)'}</button>}
          <button onClick={onClose} className="tb-hovtealbtn" style={{ flex:1, padding:'10px', borderRadius:'10px', background:'#0d9488', color:'#fff', fontWeight:700, fontSize:'13px', border:'none', cursor:'pointer' }}>ปิด</button>
        </div>
      </div>
    </div>
  )
}

// แปลง record รูปปกติ (จาก /api/patient/images/all) → รูปแบบ snap ให้ SnapModal เปิดดูข้อมูลได้ (ไม่มี event)
function imageToSnap(im) {
  if (!im) return null
  return {
    event_type: null,
    created_at: im.uploaded_at || null,
    patient_name: im.patient_name || null, patient_hn: im.patient_hn || null,
    owner_name: im.uploader_name || null,
    reason: null,
    snapshot: {
      type: im.type, note: im.note, mime: im.mime, size_bytes: im.size_bytes,
      width: im.width, height: im.height,
      orig_size_bytes: im.orig_size_bytes, orig_mime: im.orig_mime, orig_width: im.orig_width, orig_height: im.orig_height,
      quality: im.quality, device: im.device, uploaded_at: im.uploaded_at,
      deleted_at: im.deleted_at || null, deleter_name: im.deleter_name || null,
      orig_sha256: im.orig_sha256, orig_md5: im.orig_md5, orig_crc32: im.orig_crc32,
      webp_sha256: im.webp_sha256, webp_md5: im.webp_md5, webp_crc32: im.webp_crc32, phash: im.phash,
    },
  }
}

export { ImageLogPage, SnapModal, imageToSnap }

