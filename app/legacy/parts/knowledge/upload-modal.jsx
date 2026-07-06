'use client'
/** parts/knowledge/upload-modal.jsx — หน้าต่างอัปโหลด PDF เข้าคลัง (แอดมินเท่านั้น) · v0.8
 *   flow: เลือกไฟล์ → (best-effort) render ปก+นับหน้าด้วย pdf.js → presign → PUT ไฟล์(%จริง) → PUT ปก → confirm
 *   เลียนแบบ branch "ไม่แปลงไฟล์" ของ patient-tab (เก็บ PDF ต้นฉบับ) */
import * as React from 'react'
import { createPortal } from 'react-dom'
const { useState, useRef } = React
import { KNOWLEDGE_CATEGORIES, putWithProgress, fmtFileSize, renderPdfCover } from './helpers'

export function KnowledgeUploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [meta, setMeta] = useState({ pageCount: null, coverBlob: null, previewUrl: null, reading: false })
  const [category, setCategory] = useState('guideline')
  const [title, setTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('')          // '' | 'prepare' | 'upload' | 'save'
  const [err, setErr] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const pickFile = async (f) => {
    if (!f) return
    const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name || '')
    if (!isPdf) { setErr('รองรับเฉพาะไฟล์ PDF'); return }
    setErr(''); setFile(f)
    if (!title) setTitle('')                        // ปล่อยชื่อว่างได้ (ใช้ชื่อไฟล์แทน)
    setMeta({ pageCount: null, coverBlob: null, previewUrl: null, reading: true })
    const { pageCount, coverBlob } = await renderPdfCover(f)   // best-effort
    setMeta({ pageCount, coverBlob, previewUrl: coverBlob ? URL.createObjectURL(coverBlob) : null, reading: false })
  }

  const doUpload = async () => {
    if (!file || uploading) return
    setUploading(true); setErr(''); setProgress(0); setPhase('prepare')
    try {
      const pres = await fetch('/api/knowledge/presign', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      const pd = await pres.json()
      if (!pres.ok) throw new Error(pd.error || 'ขอลิงก์อัปโหลดไม่สำเร็จ')
      setPhase('upload')
      await putWithProgress(pd.uploadUrl, file, setProgress, 'application/pdf')
      // อัปปก (ถ้าทำได้) — ล้มก็ไม่เป็นไร (แค่ไม่มีรูปหน้าปก)
      let thumbKey = null
      if (meta.coverBlob && pd.uploadUrlThumb) {
        try { const r = await fetch(pd.uploadUrlThumb, { method: 'PUT', body: meta.coverBlob, headers: { 'content-type': 'image/webp' } }); if (r.ok) thumbKey = pd.thumbKey } catch {}
      }
      setPhase('save')
      const conf = await fetch('/api/knowledge/confirm', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ category, title: title.trim() || null, fileName: file.name, sourceUrl: sourceUrl.trim() || null,
          key: pd.key, thumbKey, mime: 'application/pdf', size: file.size, pageCount: meta.pageCount }) })
      const cd = await conf.json()
      if (!conf.ok) throw new Error(cd.error || 'บันทึกไม่สำเร็จ')
      if (meta.previewUrl) { try { URL.revokeObjectURL(meta.previewUrl) } catch {} }
      onUploaded?.(cd.doc)
      onClose?.()
    } catch (e) { setErr(e.message || 'เกิดข้อผิดพลาด'); setUploading(false); setPhase('') }
  }

  const cat = KNOWLEDGE_CATEGORIES.find(c => c.id === category)

  return createPortal(
    <div className="tb-backdrop" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: 460, maxWidth: '100%', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.25)', maxHeight: '92vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4, color: '#0f766e' }}>
          <i className="fa-solid fa-cloud-arrow-up" style={{ color: '#0d9488' }}></i>อัปโหลด PDF เข้าคลัง
        </h3>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 18 }}>เฉพาะแอดมิน · ไฟล์เก็บบนคลาวด์ของเว็บ อ่านได้เลยในเว็บ</div>

        {/* drop zone / file picker */}
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" style={{ display: 'none' }}
          onChange={e => pickFile(e.target.files?.[0])} />
        <div onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (!uploading) pickFile(e.dataTransfer.files?.[0]) }}
          style={{ border: `2px dashed ${dragOver ? '#0d9488' : '#99f6e4'}`, borderRadius: 14, background: dragOver ? '#ccfbf1' : '#f0fdfa', padding: 20, textAlign: 'center', marginBottom: 16, cursor: uploading ? 'default' : 'pointer' }}>
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              {meta.previewUrl
                ? <img src={meta.previewUrl} alt="" style={{ width: 46, height: 60, objectFit: 'cover', borderRadius: 4, boxShadow: '0 1px 6px rgba(0,0,0,.2)', flexShrink: 0 }} />
                : <div style={{ width: 46, height: 60, borderRadius: 4, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,.15)', flexShrink: 0 }}><i className="fa-solid fa-file-pdf" style={{ color: '#dc2626', fontSize: 22 }}></i></div>}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f766e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                  {fmtFileSize(file.size)}
                  {meta.reading ? ' · กำลังอ่านไฟล์...' : (meta.pageCount ? ` · ${meta.pageCount} หน้า` : '')}
                </div>
                {!uploading && <div style={{ fontSize: 11, color: '#0d9488', marginTop: 3 }}>กดเพื่อเปลี่ยนไฟล์</div>}
              </div>
            </div>
          ) : (
            <>
              <i className="fa-solid fa-file-pdf" style={{ fontSize: 30, color: '#5eead4', marginBottom: 8 }}></i>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0f766e' }}>ลากไฟล์ PDF มาวาง หรือกดเลือกไฟล์</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>รองรับเฉพาะไฟล์ PDF</div>
            </>
          )}
        </div>

        {/* fields */}
        <div style={{ marginBottom: 13 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>ชื่อเรื่อง <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>(ไม่บังคับ · เว้นว่างจะใช้ชื่อไฟล์)</span></label>
          <input value={title} onChange={e => setTitle(e.target.value)} disabled={uploading} placeholder="เช่น แนวทางการควบคุมวัณโรค ประเทศไทย พ.ศ. 2564"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit' }} />
        </div>
        <div style={{ marginBottom: 13 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>หมวดหมู่</label>
          <select value={category} onChange={e => setCategory(e.target.value)} disabled={uploading}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
            {KNOWLEDGE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 13 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>ลิงก์ต้นฉบับ <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>(ไม่บังคับ)</span></label>
          <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} disabled={uploading} placeholder="https://..."
            style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit' }} />
        </div>

        {err && <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 11px', marginBottom: 12 }}><i className="fa-solid fa-circle-exclamation" style={{ marginRight: 6 }}></i>{err}</div>}

        {uploading && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
              {phase === 'upload' ? `กำลังอัปโหลด... ${progress}%` : phase === 'save' ? 'กำลังบันทึก...' : 'กำลังเตรียม...'}
            </div>
            <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${phase === 'upload' ? progress : phase === 'save' ? 100 : 8}%`, background: 'linear-gradient(90deg,#14b8a6,#0d9488)', borderRadius: 999, transition: 'width .2s' }}></div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={() => { if (!uploading) { if (meta.previewUrl) { try { URL.revokeObjectURL(meta.previewUrl) } catch {} } onClose?.() } }} disabled={uploading}
            style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: uploading ? 'default' : 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontFamily: 'inherit', opacity: uploading ? .5 : 1 }}>ยกเลิก</button>
          <button onClick={doUpload} disabled={!file || uploading || meta.reading}
            style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: (!file || uploading || meta.reading) ? 'default' : 'pointer', border: 'none', background: (!file || uploading || meta.reading) ? '#5eead4' : '#0d9488', color: '#fff', fontFamily: 'inherit' }}>
            {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
