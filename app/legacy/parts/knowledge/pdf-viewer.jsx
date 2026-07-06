'use client'
/** parts/knowledge/pdf-viewer.jsx — ตัวอ่าน PDF ในเว็บ (PdfViewer) · v0.8 (3b · รื้อใหม่แบบ Chrome)
 *   toolbar เทล ปุ่มกลาง · default 100% · ซูม dropdown+ทีละขั้น (ถึง 2500% เพดาน pdf.js) · 2 หน้า · นำเสนอ(เต็มจอ)
 *   · คุณสมบัติเอกสาร (metadata + แฮชสด) · เปิดแท็บใหม่ · เปิดเร็ว (ใช้ url ที่มีอยู่ + retry) + animation เด้งเข้า
 *   หน้าย่อ = ทำเอง (บิลด์ไม่มี PDFThumbnailViewer) · พื้นหลังเข้ม (popup กลุ่ม B)
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
const { useState, useEffect, useRef } = React
import { getPdfjs, fmtFileSize } from './helpers'
import { computeByteHashes } from '../patient-images/image-hash'

const MAXS = 25, MINS = 0.25   // เพดาน/พื้น pdf.js (2500% / 25%)
const ZOOM_PRESETS = [
  { label: 'พอดีความกว้าง', val: 'page-width' },
  { label: 'พอดีทั้งหน้า', val: 'page-fit' },
  { label: '50%', val: 0.5 }, { label: '75%', val: 0.75 }, { label: '100%', val: 1 },
  { label: '125%', val: 1.25 }, { label: '150%', val: 1.5 }, { label: '200%', val: 2 },
  { label: '300%', val: 3 }, { label: '400%', val: 4 }, { label: '500%', val: 5 },
]
const clampScale = (s) => Math.min(MAXS, Math.max(MINS, s))

// วันที่ใน PDF metadata (D:YYYYMMDDHHmmSS...) → ภาษาคน
const pdfDate = (s) => {
  if (!s) return '-'
  const m = /D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/.exec(s)
  if (!m) return s
  const [, y, mo, d, h = '00', mi = '00'] = m
  try { return new Date(`${y}-${mo}-${d}T${h}:${mi}:00`).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return s }
}

// ── หน้าย่อ 1 หน้า (render lazy เมื่อเลื่อนเข้าใกล้) ──
function Thumb({ pageNum, pdfRef, active, onClick }) {
  const wrapRef = useRef(null), canvasRef = useRef(null), doneRef = useRef(false)
  useEffect(() => {
    const el = wrapRef.current; if (!el) return
    let cancelled = false, task = null
    const render = async () => {
      if (doneRef.current || cancelled) return
      const pdf = pdfRef.current; if (!pdf) return
      doneRef.current = true
      try {
        const page = await pdf.getPage(pageNum); if (cancelled) return
        const vp0 = page.getViewport({ scale: 1 })
        const vp = page.getViewport({ scale: Math.min(2, 220 / vp0.width) })   // render res สูงหน่อย (คมตอนลากขยายแถบ)
        const canvas = canvasRef.current; if (!canvas) return
        canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height)
        task = page.render({ canvasContext: canvas.getContext('2d'), viewport: vp })
        await task.promise
      } catch { doneRef.current = false }
    }
    const io = new IntersectionObserver((e) => { if (e.some(x => x.isIntersecting)) { render(); io.disconnect() } }, { root: el.parentElement, rootMargin: '300px' })
    io.observe(el)
    return () => { cancelled = true; io.disconnect(); try { task?.cancel?.() } catch {} }
  }, [pageNum, pdfRef])
  return (
    <div ref={wrapRef} onClick={onClick} style={{ cursor: 'pointer', width: '100%', flexShrink: 0 }}>
      <div style={{ border: `2px solid ${active ? '#14b8a6' : 'transparent'}`, borderRadius: 3, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.4)', minHeight: 150 }}>
        <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 10, marginTop: 4, color: active ? '#5eead4' : '#9ca3af', fontWeight: active ? 700 : 400 }}>{pageNum}</div>
    </div>
  )
}

const Btn = ({ onClick, title, children, active }) => (
  <button onClick={onClick} title={title} style={{ background: active ? 'rgba(255,255,255,.18)' : 'none', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', padding: '6px 8px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.14)' }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none' }}>
    {children}
  </button>
)
// ปุ่มใน find bar (พื้นเทลสว่าง → ใช้ไอคอนเทลเข้ม)
const FBtn = ({ onClick, title, children }) => (
  <button onClick={onClick} title={title} style={{ background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', fontFamily: 'inherit', padding: '5px 7px', borderRadius: 6, display: 'flex', alignItems: 'center' }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,118,110,.16)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
    {children}
  </button>
)

export function PdfViewer({ url, docId, doc, onClose }) {
  const rootRef = useRef(null), containerRef = useRef(null), viewerRef = useRef(null)
  const st = useRef({}).current, pdfRef = useRef(null)
  const [numPages, setNumPages] = useState(doc?.page_count || 0)
  const [page, setPage] = useState(1)
  const [scalePct, setScalePct] = useState(100)
  const [showThumbs, setShowThumbs] = useState(false)
  const [showFind, setShowFind] = useState(false)
  const [findQ, setFindQ] = useState(''), [highlightAll, setHighlightAll] = useState(true)
  const [matches, setMatches] = useState({ current: 0, total: 0 })
  const [loading, setLoading] = useState(true), [err, setErr] = useState('')
  const [zoomOpen, setZoomOpen] = useState(false), [menuOpen, setMenuOpen] = useState(false)
  const [spread, setSpread] = useState(false)
  const [fitNext, setFitNext] = useState('width')   // ปุ่ม fit toggle (โหมดที่กดครั้งถัดไปจะเป็น)
  const [thumbW, setThumbW] = useState(160)          // ความกว้างแถบหน้าย่อ (ลากปรับได้อิสระ)
  const [propsOpen, setPropsOpen] = useState(false), [propsData, setPropsData] = useState(null)
  const [mounted, setMounted] = useState(false), [settled, setSettled] = useState(false)
  const [progress, setProgress] = useState(null)   // % โหลดไฟล์ (null = ยังไม่รู้ขนาด → บาร์วิ่ง)

  const title = doc?.title || doc?.file_name || 'เอกสาร'

  // css ของ viewer (public/pdf_viewer.css) + keyframe บาร์โหลด
  useEffect(() => {
    if (!document.getElementById('pdfjs-viewer-css')) {
      const l = document.createElement('link'); l.id = 'pdfjs-viewer-css'; l.rel = 'stylesheet'; l.href = '/pdf_viewer.css'; document.head.appendChild(l)
    }
    if (!document.getElementById('tb-pdf-anim')) {
      const s = document.createElement('style'); s.id = 'tb-pdf-anim'; s.textContent = '@keyframes tbLoadSlide{0%{transform:translateX(-110%)}100%{transform:translateX(360%)}}'; document.head.appendChild(s)
    }
  }, [])

  // animation เด้งเข้า → พอจบเอา transform ออก (transform ค้าง = ตัวอักษรเบลอเพราะ re-raster)
  useEffect(() => { const r = requestAnimationFrame(() => setMounted(true)); const t = setTimeout(() => setSettled(true), 240); return () => { cancelAnimationFrame(r); clearTimeout(t) } }, [])

  useEffect(() => {
    let cancelled = false
    document.body.style.overflow = 'hidden'
    ;(async () => {
      try {
        const pdfjs = await getPdfjs()
        const V = await import('pdfjs-dist/web/pdf_viewer.mjs')
        if (cancelled || !containerRef.current) return
        const eventBus = new V.EventBus()
        const linkService = new V.PDFLinkService({ eventBus })
        const findController = new V.PDFFindController({ eventBus, linkService })
        const pdfViewer = new V.PDFViewer({ container: containerRef.current, viewer: viewerRef.current, eventBus, linkService, findController })
        linkService.setViewer(pdfViewer)
        st.eventBus = eventBus; st.pdfViewer = pdfViewer
        eventBus.on('pagesinit', () => { pdfViewer.currentScale = 1; setScalePct(100) })   // เปิดมา 100%
        eventBus.on('pagechanging', (e) => setPage(e.pageNumber))
        eventBus.on('scalechanging', (e) => setScalePct(Math.round(e.scale * 100)))
        const onFind = (e) => { if (e.matchesCount) setMatches({ current: e.matchesCount.current || 0, total: e.matchesCount.total || 0 }) }
        eventBus.on('updatefindmatchescount', onFind); eventBus.on('updatefindcontrolstate', onFind)

        const onProg = (p) => setProgress(p && p.total ? Math.min(99, Math.round(p.loaded / p.total * 100)) : null)
        let pdf
        try {
          const t = pdfjs.getDocument({ url, isEvalSupported: false }); t.onProgress = onProg; st.task = t; pdf = await t.promise
        } catch (e1) {
          if (!docId) throw e1
          const r = await fetch(`/api/knowledge/${docId}/url`); const d = await r.json()
          if (!r.ok || !d.url) throw e1
          const t2 = pdfjs.getDocument({ url: d.url, isEvalSupported: false }); t2.onProgress = onProg; st.task = t2; pdf = await t2.promise   // url เดิมหมดอายุ → ขอใหม่
        }
        if (cancelled) { try { pdf.destroy() } catch {}; return }
        st.pdf = pdf; pdfRef.current = pdf
        pdfViewer.setDocument(pdf); linkService.setDocument(pdf, null)
        setNumPages(pdf.numPages); setLoading(false)
      } catch (e) { if (!cancelled) { setErr('เปิดไฟล์ไม่สำเร็จ — ' + (e?.message || 'ลองใหม่')); setLoading(false) } }
    })()
    return () => {
      cancelled = true; document.body.style.overflow = ''
      try { st.task?.destroy?.() } catch {}; try { st.pdf?.destroy?.() } catch {}; try { st.pdfViewer?.cleanup?.() } catch {}
    }
  }, [url, docId])

  useEffect(() => { const k = (e) => { if (e.key === 'Escape') { if (document.fullscreenElement) return; onClose?.() } }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])

  const goPage = (n) => { const v = st.pdfViewer; if (v) v.currentPageNumber = Math.min(numPages, Math.max(1, n)) }
  const zoomStep = (dir) => { const v = st.pdfViewer; if (v) v.currentScale = clampScale(v.currentScale * (dir > 0 ? 1.2 : 1 / 1.2)) }
  const setZoom = (val) => { const v = st.pdfViewer; if (!v) return; if (val === 'page-width' || val === 'page-fit') v.currentScaleValue = val; else v.currentScale = clampScale(val); setZoomOpen(false) }
  const rotate = () => { const v = st.pdfViewer; if (v) v.pagesRotation = (v.pagesRotation + 90) % 360 }
  const toggleSpread = () => { const v = st.pdfViewer; if (!v) return; const next = v.spreadMode === 1 ? 0 : 1; v.spreadMode = next; setSpread(next === 1) }
  const toggleFit = () => { setZoom(fitNext === 'width' ? 'page-width' : 'page-fit'); setFitNext(fitNext === 'width' ? 'page' : 'width') }   // ปุ่มเดียว สลับพอดีกว้าง↔พอดีหน้า
  const startResize = (e) => {   // ลากปรับความกว้างแถบหน้าย่อ
    e.preventDefault(); const sx = e.clientX, sw = thumbW; document.body.style.userSelect = 'none'
    const move = (ev) => setThumbW(Math.min(460, Math.max(90, sw + (ev.clientX - sx))))
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); document.body.style.userSelect = '' }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
  }
  const presentation = () => { setMenuOpen(false); const el = rootRef.current; if (el?.requestFullscreen) el.requestFullscreen().catch(() => {}) }

  const dispatchFind = (o) => st.eventBus?.dispatch('find', { source: null, query: findQ, caseSensitive: false, entireWord: false, highlightAll, findPrevious: false, matchDiacritics: false, ...o })
  useEffect(() => { if (showFind && findQ) dispatchFind({ type: '' }) /* eslint-disable-next-line */ }, [findQ, highlightAll])
  const findStep = (prev) => dispatchFind({ type: 'again', findPrevious: prev })
  const closeFind = () => { setShowFind(false); dispatchFind({ type: '', query: '' }); setMatches({ current: 0, total: 0 }) }

  const doDownload = async () => {
    setMenuOpen(false)
    try { const res = await fetch(url); const b = await res.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = doc?.file_name || (title + '.pdf'); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => { try { URL.revokeObjectURL(a.href) } catch {} }, 8000) } catch {}
  }
  const openNewTab = async () => { setMenuOpen(false); try { const r = await fetch(`/api/knowledge/${docId}/url`); const d = await r.json(); window.open((r.ok && d.url) ? d.url : url, '_blank', 'noopener') } catch { window.open(url, '_blank', 'noopener') } }
  const doPrint = () => { setMenuOpen(false); openNewTab() }

  const openProps = async () => {
    setMenuOpen(false); setPropsOpen(true)
    if (propsData || !st.pdf) return
    try {
      const meta = await st.pdf.getMetadata()
      const p1 = await st.pdf.getPage(1); const vp = p1.getViewport({ scale: 1 })
      const wmm = Math.round(vp.width * 25.4 / 72), hmm = Math.round(vp.height * 25.4 / 72)
      setPropsData({ info: meta?.info || {}, sizeMm: `${wmm} × ${hmm} มม.`, hashing: true, hash: null })
      const data = await st.pdf.getData()
      const h = await computeByteHashes(new Blob([data], { type: 'application/pdf' }))
      setPropsData(prev => ({ ...(prev || {}), hash: h, hashing: false, byteLen: data.length }))
    } catch { setPropsData(prev => ({ ...(prev || { info: {} }), hashing: false })) }
  }

  const zoomBtn = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,.12)', borderRadius: 8, padding: '2px 3px', position: 'relative' }}>
      <Btn onClick={() => zoomStep(-1)} title="ย่อ"><i className="fa-solid fa-minus" style={{ fontSize: 12 }}></i></Btn>
      <button onClick={() => { setZoomOpen(o => !o); setMenuOpen(false) }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, minWidth: 52, padding: '5px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        {scalePct}% <i className="fa-solid fa-caret-down" style={{ fontSize: 10, opacity: .8 }}></i>
      </button>
      <Btn onClick={() => zoomStep(1)} title="ขยาย"><i className="fa-solid fa-plus" style={{ fontSize: 12 }}></i></Btn>
      {zoomOpen && (<>
        <div onClick={() => setZoomOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
        <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', background: '#26272b', border: '1px solid #3a3c42', borderRadius: 8, padding: 4, zIndex: 41, minWidth: 132, boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
          {ZOOM_PRESETS.map(z => (
            <button key={z.label} onClick={() => setZoom(z.val)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#e5e7eb', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, padding: '7px 10px', borderRadius: 5 }}
              onMouseEnter={e => e.currentTarget.style.background = '#3a3c42'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>{z.label}</button>
          ))}
        </div>
      </>)}
    </div>
  )

  return createPortal(
    <div ref={rootRef} style={{ position: 'fixed', inset: 0, background: '#2b2d31', display: 'flex', flexDirection: 'column', zIndex: 10001, opacity: mounted ? 1 : 0, transform: settled ? 'none' : (mounted ? 'scale(1)' : 'scale(.985)'), transition: 'opacity .18s ease, transform .18s ease' }}>
      {/* toolbar เทล · ปุ่มกลาง */}
      <div style={{ height: 50, background: '#0f766e', display: 'flex', alignItems: 'center', padding: '0 10px', color: '#fff', flexShrink: 0, boxShadow: '0 1px 8px rgba(0,0,0,.35)', zIndex: 5, gap: 4 }}>
        {/* ซ้าย */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <Btn onClick={onClose} title="ปิด"><i className="fa-solid fa-xmark" style={{ fontSize: 16 }}></i></Btn>
          <Btn onClick={() => setShowThumbs(s => !s)} title="หน้าย่อ" active={showThumbs}><i className="fa-solid fa-table-cells-large" style={{ fontSize: 14 }}></i></Btn>
          <span style={{ fontWeight: 700, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 4px', fontSize: 13 }}>{title}</span>
        </div>
        {/* กลาง */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,.12)', borderRadius: 8, padding: '2px 3px' }}>
            <Btn onClick={() => goPage(page - 1)} title="หน้าก่อน"><i className="fa-solid fa-chevron-left" style={{ fontSize: 12 }}></i></Btn>
            <input value={page} onChange={e => { const n = parseInt(e.target.value, 10); if (!isNaN(n)) { setPage(n); goPage(n) } else setPage(e.target.value) }}
              style={{ width: 34, background: 'rgba(0,0,0,.25)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 5, textAlign: 'center', padding: 3, fontFamily: 'inherit', fontSize: 12 }} />
            <span style={{ fontSize: 12, opacity: .85, padding: '0 3px' }}>/ {numPages || '—'}</span>
            <Btn onClick={() => goPage(page + 1)} title="หน้าถัดไป"><i className="fa-solid fa-chevron-right" style={{ fontSize: 12 }}></i></Btn>
          </div>
          {zoomBtn}
          <Btn onClick={toggleFit} title={fitNext === 'width' ? 'พอดีความกว้าง' : 'พอดีทั้งหน้า'}><i className={fitNext === 'width' ? 'fa-solid fa-arrows-left-right' : 'fa-solid fa-arrows-up-down'} style={{ fontSize: 15 }}></i></Btn>
          <Btn onClick={rotate} title="หมุน"><i className="fa-solid fa-rotate-right" style={{ fontSize: 14 }}></i></Btn>
          <Btn onClick={toggleSpread} title="ดูแบบ 2 หน้า" active={spread}><i className="fa-solid fa-book-open" style={{ fontSize: 14 }}></i></Btn>
        </div>
        {/* ขวา */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <Btn onClick={() => setShowFind(s => !s)} title="ค้นหา" active={showFind}><i className="fa-solid fa-magnifying-glass" style={{ fontSize: 14 }}></i></Btn>
          <Btn onClick={doDownload} title="ดาวน์โหลด"><i className="fa-solid fa-download" style={{ fontSize: 14 }}></i></Btn>
          <Btn onClick={doPrint} title="พิมพ์"><i className="fa-solid fa-print" style={{ fontSize: 14 }}></i></Btn>
          <Btn onClick={openProps} title="คุณสมบัติของเอกสาร"><i className="fa-solid fa-circle-info" style={{ fontSize: 15 }}></i></Btn>
          <div style={{ position: 'relative' }}>
            <Btn onClick={() => { setMenuOpen(o => !o); setZoomOpen(false) }} title="เพิ่มเติม" active={menuOpen}><i className="fa-solid fa-ellipsis-vertical" style={{ fontSize: 15 }}></i></Btn>
            {menuOpen && (<>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div style={{ position: 'absolute', top: 40, right: 0, background: '#26272b', border: '1px solid #3a3c42', borderRadius: 8, padding: 4, zIndex: 41, minWidth: 190, boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
                {[['fa-expand', 'การนำเสนอ', presentation], ['fa-arrow-up-right-from-square', 'เปิดในแท็บใหม่', openNewTab]].map(([ic, tx, fn]) => (
                  <button key={tx} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#e5e7eb', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, padding: '9px 10px', borderRadius: 5 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#3a3c42'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <i className={`fa-solid ${ic}`} style={{ fontSize: 13, width: 16, textAlign: 'center' }}></i>{tx}</button>
                ))}
              </div>
            </>)}
          </div>
        </div>
      </div>

      {/* find bar */}
      {showFind && (
        <div style={{ position: 'absolute', top: 56, right: 14, background: 'rgba(45,212,191,0.30)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(15,118,110,0.45)', borderRadius: 10, padding: 8, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 6px 20px rgba(0,0,0,.22)', zIndex: 6 }}>
          <input autoFocus value={findQ} onChange={e => setFindQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') findStep(e.shiftKey) }} placeholder="ค้นหาในเอกสาร"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(15,118,110,0.45)', color: '#0f766e', borderRadius: 6, padding: '6px 9px', fontSize: 12.5, fontFamily: 'inherit', width: 170, fontWeight: 600 }} />
          <span style={{ fontSize: 11.5, color: '#0f766e', fontWeight: 700, minWidth: 54, textAlign: 'center' }}>{findQ ? `${matches.current} / ${matches.total}` : ''}</span>
          <FBtn onClick={() => findStep(true)} title="ก่อนหน้า"><i className="fa-solid fa-chevron-up" style={{ fontSize: 13 }}></i></FBtn>
          <FBtn onClick={() => findStep(false)} title="ถัดไป"><i className="fa-solid fa-chevron-down" style={{ fontSize: 13 }}></i></FBtn>
          <label style={{ fontSize: 11, color: '#134e4a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><input type="checkbox" checked={highlightAll} onChange={e => setHighlightAll(e.target.checked)} />ไฮไลต์</label>
          <FBtn onClick={closeFind} title="ปิด"><i className="fa-solid fa-xmark" style={{ fontSize: 14 }}></i></FBtn>
        </div>
      )}

      {/* body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {showThumbs && (
          <div style={{ width: thumbW, flexShrink: 0, position: 'relative', background: '#1f2023' }}>
            <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: numPages }, (_, i) => <Thumb key={i + 1} pageNum={i + 1} pdfRef={pdfRef} active={page === i + 1} onClick={() => goPage(i + 1)} />)}
            </div>
            <div onMouseDown={startResize} title="ลากปรับขนาด" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 6, cursor: 'col-resize', zIndex: 2, transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(94,234,212,.35)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} />
          </div>
        )}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div ref={containerRef} className="pdfjs-scroll" style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
            <div ref={viewerRef} className="pdfViewer"></div>
          </div>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb', flexDirection: 'column', gap: 14, pointerEvents: 'none' }}>
              <i className="fa-solid fa-file-pdf" style={{ fontSize: 30, color: '#5eead4' }}></i>
              <div style={{ width: 210, height: 6, borderRadius: 999, background: 'rgba(255,255,255,.15)', overflow: 'hidden' }}>
                {progress != null
                  ? <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#14b8a6,#5eead4)', borderRadius: 999, transition: 'width .2s' }} />
                  : <div style={{ height: '100%', width: '40%', background: 'linear-gradient(90deg,#14b8a6,#5eead4)', borderRadius: 999, animation: 'tbLoadSlide 1.1s ease-in-out infinite' }} />}
              </div>
              <div style={{ fontSize: 12.5 }}>{progress != null ? `กำลังเปิดเอกสาร ${progress}%` : 'กำลังเปิดเอกสาร...'}</div>
            </div>
          )}
          {err && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5', flexDirection: 'column', gap: 12 }}><i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 28 }}></i><div style={{ fontSize: 13 }}>{err}</div></div>}
        </div>
      </div>

      {/* คุณสมบัติของเอกสาร */}
      {propsOpen && <DocProps doc={doc} data={propsData} onClose={() => setPropsOpen(false)} />}
    </div>,
    document.body
  )
}

// ── popup คุณสมบัติของเอกสาร (metadata จาก pdf.js + คนอัป/วันที่ + แฮชสด) ──
function DocProps({ doc, data, onClose }) {
  const info = data?.info || {}
  const Row = ({ k, v, mono }) => (v || v === 0) ? (
    <div style={{ display: 'flex', gap: 12, padding: '5px 0', fontSize: 12.5 }}>
      <div style={{ color: '#6b7280', width: 118, flexShrink: 0 }}>{k}</div>
      <div style={{ color: '#1f2937', flex: 1, wordBreak: 'break-all', fontFamily: mono ? 'ui-monospace,Menlo,monospace' : 'inherit', fontSize: mono ? 11 : 12.5 }}>{v}</div>
    </div>
  ) : null
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10002, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: 480, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,.35)', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <i className="fa-solid fa-circle-info" style={{ color: '#0d9488', fontSize: 18 }}></i>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1f2937' }}>คุณสมบัติของเอกสาร</h3>
        </div>
        {!data ? (
          <div style={{ color: '#9ca3af', fontSize: 13, padding: '20px 0', textAlign: 'center' }}><i className="fa-solid fa-spinner fa-spin"></i> กำลังอ่าน...</div>
        ) : (
          <div>
            <Row k="ชื่อไฟล์" v={doc?.file_name} />
            <Row k="ขนาดไฟล์" v={fmtFileSize(doc?.size_bytes || data.byteLen)} />
            <Row k="ชื่อเรื่อง" v={info.Title} />
            <Row k="ผู้เขียน" v={info.Author} />
            <Row k="เรื่อง" v={info.Subject} />
            <Row k="คีย์เวิร์ด" v={info.Keywords} />
            <div style={{ borderTop: '1px solid #f1f5f9', margin: '8px 0' }} />
            <Row k="แอปที่สร้าง" v={info.Creator} />
            <Row k="โปรแกรมสร้าง PDF" v={info.Producer} />
            <Row k="เวอร์ชัน PDF" v={info.PDFFormatVersion} />
            <Row k="สร้างเมื่อ" v={pdfDate(info.CreationDate)} />
            <Row k="แก้ไขเมื่อ" v={pdfDate(info.ModDate)} />
            <Row k="จำนวนหน้า" v={doc?.page_count} />
            <Row k="ขนาดหน้า" v={data.sizeMm} />
            <div style={{ borderTop: '1px solid #f1f5f9', margin: '8px 0' }} />
            <Row k="อัปโดย" v={doc?.uploader_name} />
            <Row k="วันที่อัป" v={doc?.uploaded_at ? new Date(doc.uploaded_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
            <Row k="อัปจากไหน" v={doc?.device} />
            <div style={{ borderTop: '1px solid #f1f5f9', margin: '8px 0' }} />
            <div style={{ fontSize: 12, color: '#0f766e', fontWeight: 700, margin: '4px 0 2px' }}>แฮชไฟล์ (ตรวจความถูกต้อง)</div>
            {data.hashing ? <div style={{ color: '#9ca3af', fontSize: 12, padding: '4px 0' }}><i className="fa-solid fa-spinner fa-spin"></i> กำลังคำนวณแฮช...</div> : (<>
              <Row k="SHA-256" v={data.hash?.sha256} mono />
              <Row k="MD5" v={data.hash?.md5} mono />
              <Row k="CRC32" v={data.hash?.crc32} mono />
            </>)}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ background: '#0d9488', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>ปิด</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
