'use client'
/** parts/knowledge/pdf-viewer.jsx — ตัวอ่าน PDF เต็มรูปแบบในเว็บ (PdfViewer) · v0.8 (3b)
 *   ประกอบ viewer ของ pdf.js เอง (EventBus + PDFViewer + PDFLinkService + PDFFindController)
 *   ได้ text layer (เลือก/คัดลอก/ค้นหาไทย) + ไฮไลต์ค้นหา + ซูม + หมุน + เลื่อนหน้า มาจากเอนจินเดียวกับ Firefox
 *   หน้าย่อ = ทำเอง (บิลด์นี้ไม่มี PDFThumbnailViewer) render หน้าเล็กแบบ lazy
 *   ตัวดูรูป/PDF = พื้นเข้ม (ไม่ใส่ tb-backdrop ตามกฎ popup กลุ่ม B)
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
const { useState, useEffect, useRef } = React
import { getPdfjs } from './helpers'

// ── หน้าย่อ 1 หน้า (render เมื่อเลื่อนเข้าใกล้ · lazy กัน PDF ใหญ่หน่วง) ──
function Thumb({ pageNum, pdfRef, active, onClick }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const doneRef = useRef(false)
  useEffect(() => {
    const el = wrapRef.current; if (!el) return
    let cancelled = false, task = null
    const render = async () => {
      if (doneRef.current || cancelled) return
      const pdf = pdfRef.current; if (!pdf) return
      doneRef.current = true
      try {
        const page = await pdf.getPage(pageNum)
        if (cancelled) return
        const vp0 = page.getViewport({ scale: 1 })
        const vp = page.getViewport({ scale: 118 / vp0.width })
        const canvas = canvasRef.current; if (!canvas) return
        canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height)
        task = page.render({ canvasContext: canvas.getContext('2d'), viewport: vp })
        await task.promise
      } catch { doneRef.current = false }
    }
    const io = new IntersectionObserver((ents) => { if (ents.some(e => e.isIntersecting)) { render(); io.disconnect() } }, { root: el.parentElement, rootMargin: '300px' })
    io.observe(el)
    return () => { cancelled = true; io.disconnect(); try { task?.cancel?.() } catch {} }
  }, [pageNum, pdfRef])
  return (
    <div ref={wrapRef} onClick={onClick} style={{ cursor: 'pointer', width: 118, flexShrink: 0 }}>
      <div style={{ border: `2px solid ${active ? '#14b8a6' : 'transparent'}`, borderRadius: 3, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.4)', minHeight: 150 }}>
        <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 10, marginTop: 4, color: active ? '#5eead4' : '#9ca3af', fontWeight: active ? 700 : 400 }}>{pageNum}</div>
    </div>
  )
}

const IconBtn = ({ onClick, title, children, danger }) => (
  <button onClick={onClick} title={title} style={{ background: 'none', border: 'none', color: '#e5e7eb', cursor: 'pointer', fontFamily: 'inherit', padding: '6px 8px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}
    onMouseEnter={e => e.currentTarget.style.background = danger ? '#dc2626' : '#3a3c42'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
    {children}
  </button>
)

export function PdfViewer({ url, title, fileName, onClose }) {
  const containerRef = useRef(null)     // scroll container (pdf.js ต้อง position:absolute)
  const viewerRef = useRef(null)        // <div class="pdfViewer">
  const thumbScrollRef = useRef(null)
  const st = useRef({}).current         // เก็บ pdf/viewer/eventBus ไว้ cleanup
  const pdfRef = useRef(null)
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [scalePct, setScalePct] = useState(100)
  const [showThumbs, setShowThumbs] = useState(false)
  const [showFind, setShowFind] = useState(false)
  const [findQ, setFindQ] = useState('')
  const [highlightAll, setHighlightAll] = useState(true)
  const [matches, setMatches] = useState({ current: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [downloading, setDownloading] = useState(false)

  // โหลด css ของ viewer (คัดลอกไว้ที่ public/pdf_viewer.css โดย scripts/copy-pdf-worker.mjs)
  useEffect(() => {
    if (!document.getElementById('pdfjs-viewer-css')) {
      const link = document.createElement('link')
      link.id = 'pdfjs-viewer-css'; link.rel = 'stylesheet'; link.href = '/pdf_viewer.css'
      document.head.appendChild(link)
    }
  }, [])

  // mount pdf.js viewer
  useEffect(() => {
    let cancelled = false
    document.body.style.overflow = 'hidden'   // scroll lock (กันหน้าหลังเลื่อน)
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
        st.eventBus = eventBus; st.pdfViewer = pdfViewer; st.findController = findController

        eventBus.on('pagesinit', () => { pdfViewer.currentScaleValue = 'page-width'; setScalePct(Math.round(pdfViewer.currentScale * 100)) })
        eventBus.on('pagechanging', (e) => setPage(e.pageNumber))
        eventBus.on('scalechanging', (e) => setScalePct(Math.round(e.scale * 100)))
        const onFind = (e) => { if (e.matchesCount) setMatches({ current: e.matchesCount.current || 0, total: e.matchesCount.total || 0 }) }
        eventBus.on('updatefindmatchescount', onFind)
        eventBus.on('updatefindcontrolstate', onFind)

        const task = pdfjs.getDocument({ url, isEvalSupported: false })
        st.task = task
        const pdf = await task.promise
        if (cancelled) { try { pdf.destroy() } catch {}; return }
        st.pdf = pdf; pdfRef.current = pdf
        pdfViewer.setDocument(pdf)
        linkService.setDocument(pdf, null)
        setNumPages(pdf.numPages)
        setLoading(false)
      } catch (e) {
        if (!cancelled) { setErr('เปิดไฟล์ไม่สำเร็จ — ' + (e?.message || 'ลองใหม่อีกครั้ง')); setLoading(false) }
      }
    })()
    return () => {
      cancelled = true
      document.body.style.overflow = ''
      try { st.task?.destroy?.() } catch {}
      try { st.pdf?.destroy?.() } catch {}
      try { st.pdfViewer?.cleanup?.() } catch {}
    }
  }, [url])

  // Esc = ปิด
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const goPage = (n) => { const v = st.pdfViewer; if (!v) return; v.currentPageNumber = Math.min(numPages, Math.max(1, n)) }
  const zoom = (dir) => { const v = st.pdfViewer; if (!v) return; v.currentScale = Math.min(4, Math.max(0.25, v.currentScale * (dir > 0 ? 1.15 : 1 / 1.15))) }
  const fitWidth = () => { const v = st.pdfViewer; if (v) v.currentScaleValue = 'page-width' }
  const rotate = () => { const v = st.pdfViewer; if (v) v.pagesRotation = (v.pagesRotation + 90) % 360 }

  const dispatchFind = (opts) => st.eventBus?.dispatch('find', { source: null, query: findQ, caseSensitive: false, entireWord: false, highlightAll, findPrevious: false, matchDiacritics: false, ...opts })
  useEffect(() => { if (showFind && findQ) dispatchFind({ type: '' }) /* eslint-disable-next-line */ }, [findQ, highlightAll])
  const findStep = (prev) => dispatchFind({ type: 'again', findPrevious: prev })
  const closeFind = () => { setShowFind(false); dispatchFind({ type: '', query: '' }); setMatches({ current: 0, total: 0 }) }

  const doDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(url); const blob = await res.blob()
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName || (title ? title + '.pdf' : 'document.pdf'); document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => { try { URL.revokeObjectURL(a.href) } catch {} }, 8000)
    } catch { setErr('ดาวน์โหลดไม่สำเร็จ') }
    setDownloading(false)
  }
  const doPrint = () => { window.open(url, '_blank', 'noopener') }   // เปิดแท็บใหม่ (ตัวอ่านเบราว์เซอร์) แล้วสั่งพิมพ์

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: '#33353a', display: 'flex', flexDirection: 'column', zIndex: 10001 }}>
      {/* toolbar */}
      <div style={{ height: 50, background: '#26272b', display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', color: '#e5e7eb', flexShrink: 0, boxShadow: '0 1px 8px rgba(0,0,0,.4)', zIndex: 5, flexWrap: 'nowrap', overflowX: 'auto' }}>
        <IconBtn onClick={onClose} title="ปิด" danger><i className="fa-solid fa-xmark" style={{ fontSize: 16 }}></i></IconBtn>
        <IconBtn onClick={() => setShowThumbs(s => !s)} title="หน้าย่อ"><i className="fa-solid fa-table-cells-large" style={{ fontSize: 15 }}></i></IconBtn>
        <span style={{ fontWeight: 700, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 6px', fontSize: 13 }}>{title || fileName || 'เอกสาร'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#33353a', borderRadius: 8, padding: '3px 4px', margin: '0 2px' }}>
          <IconBtn onClick={() => goPage(page - 1)} title="หน้าก่อน"><i className="fa-solid fa-chevron-left" style={{ fontSize: 13 }}></i></IconBtn>
          <input value={page} onChange={e => { const n = parseInt(e.target.value, 10); if (!isNaN(n)) { setPage(n); goPage(n) } else setPage(e.target.value) }}
            style={{ width: 36, background: '#1c1d20', border: '1px solid #444', color: '#fff', borderRadius: 5, textAlign: 'center', padding: 3, fontFamily: 'inherit', fontSize: 12 }} />
          <span style={{ color: '#9ca3af', fontSize: 12 }}>/ {numPages || '—'}</span>
          <IconBtn onClick={() => goPage(page + 1)} title="หน้าถัดไป"><i className="fa-solid fa-chevron-right" style={{ fontSize: 13 }}></i></IconBtn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#33353a', borderRadius: 8, padding: '3px 4px', margin: '0 2px' }}>
          <IconBtn onClick={() => zoom(-1)} title="ย่อ"><i className="fa-solid fa-minus" style={{ fontSize: 13 }}></i></IconBtn>
          <span style={{ minWidth: 42, textAlign: 'center', fontSize: 12 }}>{scalePct}%</span>
          <IconBtn onClick={() => zoom(1)} title="ขยาย"><i className="fa-solid fa-plus" style={{ fontSize: 13 }}></i></IconBtn>
        </div>
        <IconBtn onClick={fitWidth} title="พอดีความกว้าง"><i className="fa-solid fa-arrows-left-right" style={{ fontSize: 14 }}></i></IconBtn>
        <IconBtn onClick={rotate} title="หมุน"><i className="fa-solid fa-rotate-right" style={{ fontSize: 14 }}></i></IconBtn>
        <IconBtn onClick={() => setShowFind(s => !s)} title="ค้นหา"><i className="fa-solid fa-magnifying-glass" style={{ fontSize: 14 }}></i>ค้นหา</IconBtn>
        <div style={{ marginLeft: 'auto' }}></div>
        <IconBtn onClick={doDownload} title="ดาวน์โหลด"><i className={`fa-solid ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`} style={{ fontSize: 14 }}></i>ดาวน์โหลด</IconBtn>
        <IconBtn onClick={doPrint} title="พิมพ์"><i className="fa-solid fa-print" style={{ fontSize: 14 }}></i>พิมพ์</IconBtn>
      </div>

      {/* find bar */}
      {showFind && (
        <div style={{ position: 'absolute', top: 56, right: 14, background: '#26272b', border: '1px solid #3a3c42', borderRadius: 10, padding: 8, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 6px 20px rgba(0,0,0,.4)', zIndex: 6 }}>
          <input autoFocus value={findQ} onChange={e => setFindQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') findStep(e.shiftKey) }} placeholder="ค้นหาในเอกสาร"
            style={{ background: '#1c1d20', border: '1px solid #444', color: '#fff', borderRadius: 6, padding: '6px 9px', fontSize: 12.5, fontFamily: 'inherit', width: 170 }} />
          <span style={{ fontSize: 11.5, color: '#9ca3af', minWidth: 54, textAlign: 'center' }}>{findQ ? `${matches.current} / ${matches.total}` : ''}</span>
          <IconBtn onClick={() => findStep(true)} title="ก่อนหน้า"><i className="fa-solid fa-chevron-up" style={{ fontSize: 13 }}></i></IconBtn>
          <IconBtn onClick={() => findStep(false)} title="ถัดไป"><i className="fa-solid fa-chevron-down" style={{ fontSize: 13 }}></i></IconBtn>
          <label style={{ fontSize: 11, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={highlightAll} onChange={e => setHighlightAll(e.target.checked)} />ไฮไลต์ทั้งหมด
          </label>
          <IconBtn onClick={closeFind} title="ปิดค้นหา"><i className="fa-solid fa-xmark" style={{ fontSize: 14 }}></i></IconBtn>
        </div>
      )}

      {/* body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {showThumbs && (
          <div ref={thumbScrollRef} style={{ width: 150, background: '#1f2023', overflowY: 'auto', flexShrink: 0, padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {Array.from({ length: numPages }, (_, i) => (
              <Thumb key={i + 1} pageNum={i + 1} pdfRef={pdfRef} active={page === i + 1} onClick={() => goPage(i + 1)} />
            ))}
          </div>
        )}
        {/* page area — pdf.js container ต้อง position:absolute ในกล่อง position:relative */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div ref={containerRef} className="pdfjs-scroll" style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
            <div ref={viewerRef} className="pdfViewer"></div>
          </div>
          {loading && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb', flexDirection: 'column', gap: 12, pointerEvents: 'none' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 28 }}></i><div style={{ fontSize: 13 }}>กำลังเปิดเอกสาร...</div></div>}
          {err && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5', flexDirection: 'column', gap: 12 }}><i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 28 }}></i><div style={{ fontSize: 13 }}>{err}</div></div>}
        </div>
      </div>
    </div>,
    document.body
  )
}
