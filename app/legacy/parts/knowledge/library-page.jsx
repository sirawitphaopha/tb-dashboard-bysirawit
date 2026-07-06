'use client'
/** parts/knowledge/library-page.jsx — หน้าคลังเอกสาร PDF (KnowledgeLibraryPage) · v0.8 (3a)
 *   ทุกคนที่อนุมัติ = ดู/เปิดอ่าน · แอดมิน = อัป/ลบ
 *   โหลดครั้งเดียว (loadCache/saveCache) · กรองหมวด+ค้นหาฝั่ง client · sticky header สูตรบ้านนี้
 *   หมายเหตุ (3a): กดการ์ด = เปิด PDF ในแท็บใหม่ (ตัวอ่านในเว็บเต็มรูปแบบ = 3b) */
import * as React from 'react'
import { createPortal } from 'react-dom'
const { useState, useEffect, useCallback, useMemo } = React
import { KNOWLEDGE_CATEGORIES, catOf, fmtFileSize, loadCache, saveCache, KNOW_CACHE, invalidateKnowCache } from './helpers'
import { KnowledgeUploadModal } from './upload-modal'
import { PdfViewer } from './pdf-viewer'

const fmtDate = (s) => { try { return new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '' } }

// ขนาดทัมเนลการ์ด 3 ระดับ (min = ความกว้างขั้นต่ำต่อคอลัมน์ · grid auto-fill ปรับจำนวนคอลัมน์เอง)
const CARD_SIZES = [
  { label: 'เล็ก', min: 150, icon: 11 },
  { label: 'กลาง', min: 205, icon: 14 },
  { label: 'ใหญ่', min: 280, icon: 18 },
]

export function KnowledgeLibraryPage({ currentUser, onBack }) {
  const isAdmin = currentUser?.role === 'admin'
  const [docs, setDocs] = useState(() => { const c = loadCache(KNOW_CACHE); return c ? c.data : [] })
  const [loading, setLoading] = useState(() => !loadCache(KNOW_CACHE))
  const [typeFilter, setTypeFilter] = useState('')     // '' = ทั้งหมด
  const [q, setQ] = useState('')
  const [opening, setOpening] = useState(null)         // docId ที่กำลังขอลิงก์เปิด
  const [showUpload, setShowUpload] = useState(false)
  const [delTarget, setDelTarget] = useState(null)     // doc ที่จะลบ
  const [delStep, setDelStep] = useState(1)
  const [viewer, setViewer] = useState(null)           // { doc, url, fileName } ที่กำลังเปิดอ่าน
  const [flash, setFlash] = useState('')               // แถบแจ้งเตือนสั้น ๆ (ลบไม่สำเร็จ ฯลฯ)
  const [sizeIdx, setSizeIdx] = useState(() => { try { const s = parseInt(localStorage.getItem('tb_libknow_size'), 10); if (s >= 0 && s <= 2) return s } catch {} return 1 })

  const load = useCallback(async () => {
    const c = loadCache(KNOW_CACHE)
    if (c) setDocs(c.data)                 // มี cache = โชว์ทันที (ไม่ค้าง skeleton)
    try {                                   // แล้ว revalidate เงียบ ๆ เสมอ — กันค้างของเก่า (โดยเฉพาะข้ามเครื่อง)
      const r = await fetch('/api/knowledge')
      const d = await r.json()
      if (r.ok) { setDocs(d.docs || []); saveCache(KNOW_CACHE, d.docs || []) }
    } catch {}
    setLoading(false)
  }, [])
  useEffect(() => { load(false) }, [load])

  // realtime — เครื่องอื่นอัป/ลบ PDF → หน้านี้อัปเดตเอง (subscribe tb_knowledge_docs · debounce 500ms · แบบเดียวกับคอมเมนต์)
  useEffect(() => {
    if (!window._sb) return
    let pending = null
    const debounced = () => { clearTimeout(pending); pending = setTimeout(() => load(true), 500) }
    const ch = window._sb.channel('knowledge-docs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_knowledge_docs' }, debounced)
      .subscribe()
    return () => { clearTimeout(pending); try { window._sb.removeChannel(ch) } catch {} }
  }, [load])

  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(''), 4000); return () => clearTimeout(t) }, [flash])
  const setSize = (i) => { setSizeIdx(i); try { localStorage.setItem('tb_libknow_size', String(i)) } catch {} }

  const counts = useMemo(() => {
    const m = { all: docs.length, guideline: 0, trial: 0, other: 0 }
    docs.forEach(d => { m[d.category] = (m[d.category] || 0) + 1 })
    return m
  }, [docs])

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return docs.filter(d =>
      (!typeFilter || d.category === typeFilter) &&
      (!kw || (d.title || '').toLowerCase().includes(kw) || (d.file_name || '').toLowerCase().includes(kw))
    )
  }, [docs, typeFilter, q])

  const openDoc = async (doc) => {
    setOpening(doc.id)
    try {
      const r = await fetch(`/api/knowledge/${doc.id}/url`)
      const d = await r.json()
      if (r.ok && d.url) setViewer({ doc, url: d.url, fileName: d.fileName })   // เปิดตัวอ่าน PDF ในเว็บ
    } catch {}
    setOpening(null)
  }

  const askDelete = (doc) => { setDelTarget(doc); setDelStep(1) }
  const doDelete = () => {
    const doc = delTarget; if (!doc) return
    // optimistic: ปิดป๊อป + เอาการ์ดออกทันที แล้วค่อยลบหลังบ้านเบื้องหลัง
    setDocs(prev => { const next = prev.filter(x => x.id !== doc.id); saveCache(KNOW_CACHE, next); return next })
    setDelTarget(null); setDelStep(1)
    fetch(`/api/knowledge/${doc.id}`, { method: 'DELETE' })
      .then(r => { if (!r.ok) throw new Error() })
      .catch(() => {   // ล้มเหลว = คืนการ์ดกลับ (เรียงตามวันที่ล่าสุด) + แจ้ง
        setDocs(prev => { const next = [doc, ...prev.filter(x => x.id !== doc.id)].sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)); saveCache(KNOW_CACHE, next); return next })
        setFlash('ลบไม่สำเร็จ — คืนเอกสารกลับให้แล้ว ลองใหม่อีกครั้ง')
      })
  }

  const chips = [{ id: '', label: 'ทั้งหมด', n: counts.all }, ...KNOWLEDGE_CATEGORIES.map(c => ({ id: c.id, label: c.short, n: counts[c.id] || 0 }))]

  return (
    <div className="tb-fade">
      {/* ── sticky header (สูตรบ้านนี้: top -24 ชดเชย p-6, full-bleed ข้าง) ── */}
      <div style={{ position: 'sticky', top: '-24px', margin: '0 -24px 8px', padding: '12px 24px 14px', background: '#f0fdfa', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={onBack} title="กลับ" style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #99f6e4', background: '#fff', color: '#0f766e', cursor: 'pointer', flexShrink: 0, fontSize: 15 }}>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#0d9488,#0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fa-solid fa-file-pdf" style={{ color: '#fff', fontSize: 20 }}></i>
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1f2937' }}>คลังเอกสาร PDF</h1>
            <p style={{ fontSize: 12, color: '#6b7280' }}>แนวทางการรักษา · งานวิจัย/Trial · อ่านได้ในเว็บ</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {chips.map(c => {
              const on = typeFilter === c.id
              return (
                <button key={c.id || 'all'} onClick={() => setTypeFilter(c.id)}
                  style={{ padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    border: `1px solid ${on ? '#0d9488' : '#e5e7eb'}`, background: on ? '#0d9488' : '#fff', color: on ? '#fff' : '#6b7280' }}>
                  {c.label}
                  <span style={{ background: on ? 'rgba(255,255,255,.25)' : '#f1f5f9', color: on ? '#fff' : '#9ca3af', borderRadius: 999, padding: '0 6px', fontSize: 10 }}>{c.n}</span>
                </button>
              )
            })}
          </div>
          {/* ปรับขนาดทัมเนล 3 ระดับ (จำค่าไว้ใน localStorage) */}
          <div style={{ marginLeft: 'auto', display: 'inline-flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
            {CARD_SIZES.map((s, i) => (
              <button key={i} title={`ทัมเนล${s.label}`} onClick={() => setSize(i)}
                style={{ width: 34, height: 36, border: 'none', borderLeft: i ? '1px solid #e5e7eb' : 'none', background: sizeIdx === i ? '#0d9488' : '#fff', color: sizeIdx === i ? '#fff' : '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-file-pdf" style={{ fontSize: s.icon }}></i>
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 12, top: 10, fontSize: 13, color: '#9ca3af' }}></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาชื่อเรื่อง"
              style={{ padding: '9px 14px 9px 33px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, width: 200, fontFamily: 'inherit', background: '#fff' }} />
          </div>
          {isAdmin && (
            <button onClick={() => setShowUpload(true)}
              style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '9px 15px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit' }}>
              <i className="fa-solid fa-cloud-arrow-up"></i>อัปโหลด PDF
            </button>
          )}
        </div>
      </div>

      {flash && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-circle-exclamation"></i>{flash}
        </div>
      )}

      {/* ── grid ── */}
      {loading && !docs.length ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24 }}></i><div style={{ marginTop: 10, fontSize: 13 }}>กำลังโหลด...</div></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <i className="fa-solid fa-folder-open" style={{ fontSize: 34, color: '#cbd5e1' }}></i>
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>{docs.length ? 'ไม่พบเอกสารที่ค้นหา' : 'ยังไม่มีเอกสารในคลัง'}</div>
          {isAdmin && !docs.length && <div style={{ marginTop: 6, fontSize: 12 }}>กดปุ่ม "อัปโหลด PDF" เพื่อเพิ่มเอกสารแรก</div>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_SIZES[sizeIdx].min}px, 1fr))`, gap: 16 }}>
          {filtered.map(doc => {
            const cat = catOf(doc.category)
            return (
              <div key={doc.id} onClick={() => openDoc(doc)}
                className="group"
                style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative', transition: '.15s' }}>
                {/* cover */}
                <div style={{ aspectRatio: '210 / 297', background: doc.thumbUrl ? '#f1f5f9' : 'linear-gradient(135deg,#f8fafc,#eef2f7)', borderBottom: '1px solid #f1f5f9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {doc.thumbUrl
                    ? <img src={doc.thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="lazy" />
                    : <i className="fa-solid fa-file-pdf" style={{ fontSize: 48, color: '#cbd5e1' }}></i>}
                  <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: cat.bg, color: cat.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className={`fa-solid ${cat.icon}`} style={{ fontSize: 9 }}></i>{cat.short}
                  </div>
                  {doc.page_count ? <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 10, fontWeight: 700, background: 'rgba(31,41,55,.72)', color: '#fff', padding: '2px 8px', borderRadius: 999 }}>{doc.page_count} หน้า</div> : null}
                  {opening === doc.id && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-spinner fa-spin" style={{ color: '#0d9488', fontSize: 20 }}></i></div>}
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); askDelete(doc) }} title="ลบ"
                      className="opacity-0 group-hover:opacity-100"
                      style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,.92)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity .15s' }}>
                      <i className="fa-solid fa-trash" style={{ color: '#dc2626', fontSize: 12 }}></i>
                    </button>
                  )}
                </div>
                {/* body */}
                <div style={{ padding: '13px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.35, color: '#1f2937', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 37 }}>
                    {doc.title || doc.file_name || 'ไม่มีชื่อ'}
                  </h4>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><i className="fa-solid fa-user" style={{ fontSize: 10, color: '#d1d5db' }}></i>อัปโดย {doc.uploader_name || '—'} · {fmtDate(doc.uploaded_at)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><i className="fa-solid fa-file" style={{ fontSize: 10, color: '#d1d5db' }}></i>{fmtFileSize(doc.size_bytes)}</div>
                  </div>
                  {doc.source_url && (
                    <a href={doc.source_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#0d9488', background: '#f0fdfa', padding: '2px 8px', borderRadius: 999, marginTop: 8, fontWeight: 600, width: 'fit-content' }}>
                      <i className="fa-solid fa-link" style={{ fontSize: 10 }}></i>ลิงก์ต้นฉบับ
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── ตัวอ่าน PDF ในเว็บ (3b) ── */}
      {viewer && <PdfViewer url={viewer.url} title={viewer.doc.title || viewer.doc.file_name} fileName={viewer.fileName || viewer.doc.file_name} onClose={() => setViewer(null)} />}

      {/* ── upload modal (admin) ── */}
      {showUpload && isAdmin && (
        <KnowledgeUploadModal onClose={() => setShowUpload(false)} onUploaded={() => { setShowUpload(false); invalidateKnowCache(); load(true) }} />
      )}

      {/* ── delete popup 2 ขั้น (admin) ── */}
      {delTarget && createPortal(
        <div className="tb-backdrop" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 95, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: 420, maxWidth: '100%', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.25)', minHeight: 232, display: 'flex', flexDirection: 'column' }}>
            {delStep === 1 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className="fa-solid fa-trash" style={{ color: '#dc2626' }}></i></div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1f2937' }}>ลบเอกสารออกจากคลัง</h3>
                </div>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginTop: 4 }}>
                  กำลังจะลบ <b style={{ color: '#1f2937' }}>{delTarget.title || delTarget.file_name || 'เอกสารนี้'}</b> ออกจากคลังความรู้ · ไฟล์จะถูกลบถาวร (ไม่มีถังขยะ) กู้คืนไม่ได้
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 20 }}>
                  <button onClick={() => setDelTarget(null)} style={{ flex: 1, padding: 11, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontFamily: 'inherit' }}>ยกเลิก</button>
                  <button onClick={() => setDelStep(2)} style={{ flex: 1, padding: 11, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#0d9488', color: '#fff', fontFamily: 'inherit' }}>ถัดไป</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className="fa-solid fa-triangle-exclamation" style={{ color: '#dc2626' }}></i></div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1f2937' }}>ยืนยันลบถาวร</h3>
                </div>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginTop: 4 }}>
                  ยืนยันลบ <b style={{ color: '#dc2626' }}>{delTarget.title || delTarget.file_name || 'เอกสารนี้'}</b> อย่างถาวร การกระทำนี้ย้อนกลับไม่ได้
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 20 }}>
                  {/* SWAPPED: ยืนยันลบ อยู่ซ้าย (กันเผลอกด) */}
                  <button onClick={doDelete} style={{ flex: 1, padding: 11, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: '#dc2626', color: '#fff', fontFamily: 'inherit' }}>ยืนยันลบ</button>
                  <button onClick={() => setDelStep(1)} style={{ flex: 1, padding: 11, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontFamily: 'inherit' }}>ย้อนกลับ</button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
