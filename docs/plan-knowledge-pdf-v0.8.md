# 📋 แผน: คลังความรู้วัณโรค (ระบบ PDF) — v0.8.0.x

> ไฟล์นี้ = แผนเต็มของฟีเจอร์คลังความรู้วัณโรค (ระบบ PDF) เก็บใน repo เพื่อให้ **แชทใหม่/เครื่องอื่น อ่านแล้วทำต่อได้ทันที**
> วิธีใช้ตอนเปิดแชทใหม่: บอกแคลร์ว่า **"อ่าน docs/plan-knowledge-pdf-v0.8.md"** แล้วทำ Step ถัดไปต่อ
> วันที่วางแผน/เริ่ม: 6 ก.ค. 2569

---

## ✅ สถานะปัจจุบัน (อัปเดต 6 ก.ค. 69)
- **Step 1 = v0.8.0.0 → เสร็จ + push ขึ้น main แล้ว** (commit `ea78046` feature + `15a682b` docs + `06c19a6` changelog)
  - ตาราง `tb_knowledge_docs` **สร้างใน Supabase แล้ว** (รันผ่าน MCP · 12 คอลัมน์ · RLS on · 4 policies)
  - `pdfjs-dist 6.1.200` ติดตั้งแล้ว + `scripts/copy-pdf-worker.mjs` (auto คัดลอก worker)
  - APP_VERSION = 0.8.0.0
- **Step 2 (API) = v0.8.0.1 → ยังไม่ทำ** ← ทำต่อจากตรงนี้
- **Step 3 (Frontend) = v0.8.0.2 → ยังไม่ทำ**
- ⚠️ **ยังไม่ได้ทำ:** สร้าง R2 bucket + env `R2_BUCKET_LIBRARY` (ต้องทำก่อนเทส Step 2/3 จริง)

---

## Context (ทำไมต้องทำ)
แท็บ "คลังความรู้วัณโรค" มีอยู่แล้วในเว็บ แต่เป็นการ์ด placeholder โชว์เฉย ๆ ("เร็วๆ นี้ / ยังไม่เปิด") กดอะไรไม่ได้จริง (`app/legacy/parts/misc.jsx` `KnowledgeBase()` บรรทัด ~396–505).

พี่กัน (เภสัชกร รพ.ปรางค์กู่) อยากได้ระบบเก็บไฟล์ PDF (ไกด์ไลน์ TB / งานวิจัย) ไว้บนคลาวด์ของเว็บเอง แล้ว **กดอ่านในเว็บได้เลย** ด้วยตัวอ่าน PDF เต็มรูปแบบ (เลื่อนหน้า/ซูม/หมุน/ค้นหาคำในไฟล์+ไฮไลต์/เลือก-คัดลอก/หน้าย่อ/พิมพ์/ดาวน์โหลด) — ตรงกับไอเดียข้อ 5B ใน `docs/ideas.md`.

**ข้อสรุปที่เคาะกับพี่กันแล้ว:**
- ทุกคนที่ล็อกอิน **อ่านได้** · เฉพาะแอดมิน (พี่กัน) **อัปโหลด+ลบ** ได้
- เก็บไฟล์จริงบน R2 ทุกไฟล์ (ไม่กรองลิขสิทธิ์ · ระบบวงปิด login เท่านั้น)
- หมวด: แนวทางการรักษา (guideline) / งานวิจัย-Trial / อื่นๆ · ไม่มีแท็ก
- ขอบเขตรอบนี้ = **อัปโหลด + อ่าน + ลบ เท่านั้น** (editor เขียนบทความเอง + สรุป trial = phase ถัดไป)
- title กับ source URL = ไม่บังคับ · ลบ = hard delete (ไม่ทำถังขยะ เพราะไม่ใช่ข้อมูลคนไข้) แต่ต้องมีป๊อปยืนยัน 2 ขั้นตามธรรมเนียมบ้านนี้
- ต้องใช้บนมือถือได้

## แนวทางตัวอ่าน PDF (จุดสำคัญสุด)
ใช้ **`pdfjs-dist`** (Mozilla pdf.js) — ประกอบชิ้นส่วน viewer ของ pdf.js เอง (`pdfjs-dist/web/pdf_viewer.mjs`: `EventBus` + `PDFViewer` + `PDFLinkService` + `PDFFindController` + `PDFThumbnailViewer` + `pdf_viewer.css`) ใน React shell ที่เขียนเอง สั่งงานผ่าน ref ใน `useEffect`.

**ทำไมเลือกแบบนี้** (ไม่เอา react-pdf / @react-pdf-viewer): ชิ้นส่วน viewer ของ pdf.js เป็น vanilla JS ล้วน React ไม่ได้ render component ของ pdf.js เลย (แค่ mount `<div>` ว่าง แล้วเรียก method) → **เข้ากับ React 19 โดยไม่มีปัญหา** และได้ text layer (เลือก/คัดลอก/ค้นหาภาษาไทยได้), find-with-highlight + นับ match + next/prev, หน้าย่อ, ซูม, หมุน "มาฟรี" จากเอนจินเดียวกับ Firefox viewer.

**CSP: ไม่ต้องแก้เลย** — `next.config.js` มี `worker-src 'self' blob:`, `connect-src ... https://*.r2.cloudflarestorage.com blob:`, `wasm-unsafe-eval` ครบแล้ว. เงื่อนไข: (1) worker เป็น same-origin ที่ `public/pdf.worker.min.mjs` แล้ว set `GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs'` (2) `getDocument({isEvalSupported:false})` + ปิด scripting. **`<iframe>`/`<embed>` ใช้ไม่ได้** (`frame-src/object-src 'none'`) → ต้องใช้ canvas renderer เท่านั้น.

**worker version pin (ทำแล้วใน Step 1):** `pdfjs-dist 6.1.200` pin เป๊ะ + `scripts/copy-pdf-worker.mjs` (require.resolve คัดลอก worker เข้า public/) ผูก `postinstall`+`prebuild`. **lazy import** ตอนเปิดไฟล์ (`await import('pdfjs-dist')` · เลียนแบบ `await import('heic-to/csp')`).

## ที่เก็บไฟล์ (R2)
สร้าง bucket ใหม่ + env `R2_BUCKET_LIBRARY` (แยกจาก patient bucket เพื่อไม่ปนข้อมูลคนไข้ + โควตาแยก). key = `library/<uuid>.pdf`. **`lib/knowledge-helpers.ts` ใหม่:** `LIBRARY_BUCKET` + re-export `getRequester` จาก `patient-image-helpers`. ใช้ `presignPut`/`presignGet`/`r2Delete` จาก `lib/r2.ts` เดิม.

## DB (✅ ทำแล้วใน Step 1) — `scripts/add-knowledge-library.sql`
ตาราง `tb_knowledge_docs`: `id uuid pk`, `category text check in ('guideline','trial','other') default 'other'`, `title text`, `file_name text`, `source_url text`, `storage_key text not null`, `thumb_key text`, `mime text default 'application/pdf'`, `size_bytes int`, `page_count int`, `uploaded_by uuid`, `uploaded_at timestamptz default now()`. **ไม่มี soft-delete** (ลบจริง). index `(category, uploaded_at desc)`. RLS: `is_approved()` อ่าน / `is_admin()` เขียน-ลบ.

---

## 🔨 Step 2 (v0.8.0.1) — API `app/api/knowledge/*` (เลียนแบบ `app/api/patient/images/*`)
ทุก route ใช้ `getRequester(req)` → guard `401 !user` / `403 !isApproved` / (`403 !isAdmin` เฉพาะ write) · เขียน DB ผ่าน `createAdminClient()`:
- `lib/knowledge-helpers.ts` (ใหม่): `export const LIBRARY_BUCKET = process.env.R2_BUCKET_LIBRARY || 'tb-knowledge'` + `export { getRequester } from './patient-image-helpers'`
- `presign/route.ts` POST (admin) → `{uploadUrl, key}` (+ `uploadUrlThumb`,`thumbKey` ถ้าทำรูปปก) · `presignPut(key,900,LIBRARY_BUCKET)` · key = `library/<uuid>.pdf`
- `confirm/route.ts` POST (admin) → insert row → `{doc}` · validate `category` ใน `['guideline','trial','other']`
- `route.ts` GET (approved) `?category=&q=` → `{docs}` แต่ละตัวมี `url`=`presignGet(...,7200)`, `thumbUrl?`, join `profiles` เอาชื่อคนอัป (แบบ `images/all/route.ts`) · order `uploaded_at desc`
- `[id]/url/route.ts` GET (approved) → `{url}` signed สด (3600) เรียกก่อนเปิด viewer
- `[id]/route.ts` DELETE (admin) → fetch row → `r2Delete(storage_key,LIBRARY_BUCKET)` (+thumb) → `admin.delete()` (hard delete)

## 🔨 Step 3 (v0.8.0.2) — Frontend `app/legacy/parts/knowledge/` + barrel
React: `import * as React from 'react'; const {useState,useEffect,useRef}=React` · globals via `../globals` · shared via `../shared`.
- `knowledge/helpers.jsx` — `KNOWLEDGE_CATEGORIES` map, re-export `putWithProgress`/`fmtFileSize` จาก `../patient-images/helpers`, cache key `tb_libknow` + `invalidateKnowCache()`
- `knowledge/pdf-viewer.jsx` — `PdfViewer({url,title,docId,onClose})` · `import 'pdfjs-dist/web/pdf_viewer.css'` · full-screen `createPortal` zIndex 10001 พื้นเข้ม · sidebar หน้าย่อ + toolbar (close/thumbnails/page nav/zoom/rotate/find/download/print) · effect mount pdf.js + cleanup destroy · print=เปิด tab ใหม่ · download=fetch signed→blob→anchor `download`
  - 🔒 **scroll lock (Gemini):** mount ตั้ง `document.body.style.overflow='hidden'` → restore ตอน cleanup (กันหน้าหลังเลื่อนตาม)
  - 🛡 **กัน StrictMode ยิง getDocument เบิ้ล (Gemini):** `let cancelled=false` + `task=getDocument(...)` · ถ้า cancelled ตอน resolve = ไม่ setDocument · cleanup: `cancelled=true; task.destroy?.(); pdf?.destroy()`
- `knowledge/upload-modal.jsx` — `KnowledgeUploadModal` (admin) · เลียนแบบ SVG no-convert branch ของ `patient-tab.jsx` (ไม่แปลง WebP) · presign→`putWithProgress`(mime `application/pdf` · % จริง)→confirm · fields: file/category/title/source URL
- `knowledge/library-page.jsx` — `KnowledgeLibraryPage({currentUser})` · load-once `loadCache/saveCache('tb_libknow')` · sticky header สูตรบ้านนี้ (`top:-24px, margin:0 -24px, padding:12px 24px`, bg teal-50) · chips หมวด + search (client debounce) + ปุ่มอัปโหลด (admin) · การ์ด (thumbnail/ไอคอน, title||file_name, `fmtFileSize`, วันที่ th-TH, คนอัป, chip source) · กดการ์ด→fetch `[id]/url`→เปิด `PdfViewer` · ลบ (admin)=ป๊อป 2 ขั้น (step1 `[ยกเลิก][ถัดไป]` · step2 SWAPPED `[ยืนยันลบ ซ้าย แดง][ย้อนกลับ]` · เท่ากันสูง · backdrop ไม่ปิด · optimistic remove)
- `knowledge.jsx` (barrel) — `export { KnowledgeLibraryPage } from './knowledge/library-page'`
- แก้ `tb-monolith.jsx`: import (บรรทัด ~39) เอา `KnowledgeBase` ออกจาก misc + เพิ่ม `import { KnowledgeLibraryPage } from './parts/knowledge'` · render (บรรทัด ~982) `<KnowledgeBase/>` → `<KnowledgeLibraryPage currentUser={currentUser}/>` · nav/titles/pageIcons ('knowledge') คงเดิม · **ปล่อย `KnowledgeBase` เดิมใน misc.jsx ไว้** (ห้ามลบฟีเจอร์โดยไม่ถาม)

## ส่วนเสริม (ยืนยันทำ · แคลร์ + Gemini เห็นตรงกัน — ทำใน Step 3)
1. ✅ **รูปหน้าปก (หน้าแรกของ PDF) บนการ์ด** — ตอนอัป render หน้า 1 เป็น WebP เล็ก เก็บ `thumb_key` → การ์ดโชว์รูปจริง
   - 💾 **ประหยัดแรม (Gemini):** render **เฉพาะหน้า 1** scale กว้าง ~360px ก่อน `canvas.toBlob('image/webp')` (กัน PDF ใหญ่แรมเต็ม)
2. ✅ **จำนวนหน้า** (`page_count`) โชว์ "N หน้า" — ฟรีเพราะ pdf.js โหลดตอนสร้างปกอยู่แล้ว (`pdf.numPages`)
3. 📊 **นับพื้นที่ใน storage monitor** — เพิ่ม `r2BucketUsage(LIBRARY_BUCKET)` ใน `app/api/admin/storage/route.ts` (follow-up)

---

## ความเสี่ยง
1. worker version ไม่ตรง API → จอเปล่า · แก้แล้วด้วย `copy-pdf-worker` (require.resolve) + pin เป๊ะ
2. Cloudflare เสิร์ฟ `.mjs` ผิด content-type → verify `curl -I /pdf.worker.min.mjs` หลัง deploy · ถ้าผิดเพิ่ม `public/_headers`
3. React 19 StrictMode double-mount → ref + cleanup destroy ครบ (ดู Gemini tip ใน pdf-viewer)
4. ไฟล์ใหญ่: presign PUT ยิงตรง R2 (ไม่ผ่าน Worker = ไม่ติด body limit) · cap ~50–100MB · presign expiry 900s
5. มือถือ/PDF ใหญ่: PDFViewer virtualize อยู่แล้ว · default `page-width` บนมือถือ

## Verification (เทสหน้าจริง Chrome ที่ล็อกอิน · ไม่ใช่ mock)
1. `npm run dev` → เช็ค `public/pdf.worker.min.mjs` ถูกสร้าง
2. admin: อัปไกด์ไลน์ไทยจริง → % bar เดิน → การ์ดขึ้น (หมวด/ขนาด/วันที่/คนอัป)
3. เปิด viewer: page nav/zoom/rotate/หน้าย่อ/เลือก+คัดลอกไทย/print(tab ใหม่)/download(ชื่อถูก)
4. find: ค้น "rifampicin"/"ไอโซไนอาซิด" → ไฮไลต์+นับ match+next/prev
5. non-admin: อ่านได้ ไม่มีปุ่มอัป/ลบ · ยิง `presign`/`DELETE` ตรง → 403
6. ลบ (admin): ป๊อป 2 ขั้น → การ์ดหาย → ไฟล์หายจาก R2
7. มือถือจริง: เปิด PDF ใหญ่ scroll+zoom
8. `npm run build` ผ่าน → deploy → verify `/pdf.worker.min.mjs` 200 + JS content-type

## ⚠️ Checklist ก่อน deploy
- สร้าง R2 bucket + ใส่ `R2_BUCKET_LIBRARY` ทั้ง `.env.local` และ Cloudflare Pages Runtime env
- `scripts/add-knowledge-library.sql` — รันแล้วใน Supabase (dev=prod)
- CSP ไม่ต้องแก้ · แต่เช็ค content-type ของ worker หลัง deploy

---

## 📌 หมายเหตุ workflow (บันทึกลง CLAUDE.md + skill แล้ว)
- push ขึ้น `main` โดยตรง (พี่กันสั่ง 6 ก.ค. 69) · **ห้าม push ก่อนพี่กันพิมพ์ "push/พุช" ชัด ๆ**
- ถ้า Supabase MCP ต่ออยู่ → แคลร์รัน SQL เองผ่าน `execute_sql` (project `cioswzdbonnbhbyynrhh`)
- แต่ละ step แยก commit ละเอียด (ห้ามรวบ/ย่อ) · เวอร์ชัน 4 ตำแหน่ง (Step 2 = 0.8.0.1, Step 3 = 0.8.0.2)
