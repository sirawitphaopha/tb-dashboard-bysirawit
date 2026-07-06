'use client'
/**
 * parts/knowledge/helpers.jsx — คลังความรู้วัณโรค (ระบบ PDF) · v0.8
 *   - KNOWLEDGE_CATEGORIES : หมวดเอกสาร (ตรงกับ DB check guideline/trial/other)
 *   - reuse putWithProgress/fmtFileSize (อัปโหลด + ฟอร์แมตขนาดไฟล์) จากระบบรูปผู้ป่วย
 *   - loadCache/saveCache (โหลดครั้งเดียว) จาก shared
 *   - getPdfjs / renderPdfCover : โหลด pdf.js แบบ lazy + สร้างรูปหน้าปก (หน้าแรก) + นับจำนวนหน้า
 */
import * as React from 'react'
export { putWithProgress, fmtFileSize, detectDevice } from '../patient-images/helpers'
export { loadCache, saveCache } from '../shared'

// หมวดเอกสาร — id ตรงกับ check constraint ใน tb_knowledge_docs
export const KNOWLEDGE_CATEGORIES = [
  { id: 'guideline', label: 'แนวทางการรักษา',  short: 'แนวทาง', bg: '#dbeafe', color: '#1d4ed8', icon: 'fa-book-medical' },
  { id: 'trial',     label: 'งานวิจัย · Trial', short: 'Trial',  bg: '#f3e8ff', color: '#7e22ce', icon: 'fa-flask' },
  { id: 'other',     label: 'อื่นๆ',            short: 'อื่นๆ',  bg: '#f3f4f6', color: '#4b5563', icon: 'fa-file-lines' },
]
export const catOf = (id) => KNOWLEDGE_CATEGORIES.find(c => c.id === id) || KNOWLEDGE_CATEGORIES[2]

// cache โหลดครั้งเดียว (localStorage) — เคลียร์เมื่อมี mutation (อัป/ลบ)
export const KNOW_CACHE = 'tb_libknow'
export function invalidateKnowCache(){ try { localStorage.removeItem(KNOW_CACHE) } catch {} }

// โหลด pdf.js แบบ lazy (โหลดตอนใช้ครั้งแรก · เลียนแบบ await import('heic-to/csp')) + ผูก worker same-origin
let _pdfjs = null
export async function getPdfjs(){
  if (_pdfjs) return _pdfjs
  const pdfjs = await import('pdfjs-dist')
  // worker คัดลอกไว้ที่ public/pdf.worker.min.mjs แล้ว (scripts/copy-pdf-worker.mjs)
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  _pdfjs = pdfjs
  return pdfjs
}

// อ่านไฟล์ PDF → คืน { pageCount, coverBlob } · coverBlob = หน้าแรก render เป็น WebP กว้าง ~2560px (2K · คุณภาพ 80%)
// best-effort: ถ้า pdf.js พลาด → coverBlob=null, pageCount=null (อัปโหลดต่อได้ปกติ ไม่มีปกก็ได้)
export async function renderPdfCover(file){
  try {
    const pdfjs = await getPdfjs()
    const buf = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: buf, isEvalSupported: false }).promise
    const pageCount = pdf.numPages
    let coverBlob = null
    try {
      const page = await pdf.getPage(1)
      const vp0 = page.getViewport({ scale: 1 })
      const scale = Math.min(6, 2560 / vp0.width)         // กว้างเป้าหมาย ~2560px (2K · เท่ารูปทั่วไปในเว็บ · cap 6x กัน PDF หน้าเล็กมากแรมพุ่ง)
      const vp = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height)
      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport: vp }).promise
      coverBlob = await new Promise(res => canvas.toBlob(res, 'image/webp', 0.8))
    } catch {}
    try { pdf.destroy() } catch {}
    return { pageCount, coverBlob }
  } catch {
    return { pageCount: null, coverBlob: null }
  }
}
