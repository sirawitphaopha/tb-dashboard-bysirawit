---
name: session-tb-dashboard-2026-07-06-v0.8.0.1
description: TB Dashboard session 6 ก.ค. 69 (คืน) — v0.8.0.1 คลังความรู้วัณโรค (ระบบ PDF) รวด Step 2+3 · API หลังบ้าน + หน้าคลัง + ตัวอ่าน PDF pdf.js + สร้างถัง R2 + CORS + realtime + ลบ optimistic + ทัมเนล 2K/3 ขนาด
metadata:
  node_type: memory
  type: project
---

# TB Dashboard — session 6 ก.ค. 2569 (คืน) · v0.8.0.1 (ระบบ PDF ครบวง)

**Repo:** live tbjourney.care (ยังไม่เผยแพร่) · Supabase `cioswzdbonnbhbyynrhh` (dev=prod) · Worker `tb-dashboard-bysirawit`
**session นี้:** ทำ **คลังความรู้วัณโรค (ระบบ PDF)** ต่อจาก Step 1 — **รวม Step 2 (API) + Step 3 (frontend + ตัวอ่าน PDF) + ส่วนเสริม** เป็นเวอร์ชันเดียว **v0.8.0.1** (พี่กันสั่งเลข 0.8.0.1 · แผนเดิมแยก .1/.2 แต่ทำรวดเดียว)
**สถานะ:** push ขึ้น main แล้ว · พี่กันเทสผ่าน (อัป/อ่าน/ลบ/realtime ข้ามเครื่อง localhost+192)

## 🛠 ที่ทำ (file-by-file)

### Step 2 — API หลังบ้าน (`app/api/knowledge/*` + `lib/knowledge-helpers.ts`)
- **`lib/knowledge-helpers.ts`** (ใหม่): `LIBRARY_BUCKET = process.env.R2_BUCKET_LIBRARY || 'tb-knowledge'` + re-export `getRequester` จาก `patient-image-helpers`
- **`presign/route.ts`** POST (admin) → PUT url ของ PDF (`library/<uuid>.pdf`) + ปก (`library/<uuid>_thumb.webp`) · `presignPut` 900s
- **`confirm/route.ts`** POST (admin) → insert row (category validate guideline/trial/other · title/sourceUrl trim → null)
- **`route.ts`** GET (approved) `?category=&q=` → docs + `url`/`thumbUrl` signed (7200s) + ชื่อคนอัป (join profiles) · q sanitize `[%,()]` กัน `.or()` พัง · order uploaded_at desc
- **`[id]/url/route.ts`** GET (approved) → signed url สด 3600s + fileName (เรียกตอนกดเปิด)
- **`[id]/route.ts`** DELETE (admin) → `r2Delete` PDF + thumb (try ห่อ ไม่ให้ไฟล์บล็อกการลบ row) → ลบ row (hard delete)
- ทุก route guard 401 `!user` / 403 `!isApproved` / 403 `!isAdmin` (เฉพาะ write) · เขียนผ่าน `createAdminClient()`

### Step 3 — Frontend (`app/legacy/parts/knowledge/*` + barrel + แก้ 2 ไฟล์)
- **`knowledge/helpers.jsx`**: `KNOWLEDGE_CATEGORIES` (3 หมวด + สี/ไอคอน) · `getPdfjs()` lazy import + set workerSrc · `renderPdfCover(file)` render หน้าแรก WebP **2560px (2K)/คุณภาพ 0.8** + นับหน้า (best-effort · ล้มก็อัปได้) · `KNOW_CACHE`/`invalidateKnowCache` · re-export `putWithProgress`/`fmtFileSize`/`loadCache`/`saveCache`
- **`knowledge/upload-modal.jsx`**: `KnowledgeUploadModal` (admin) — drop zone + fields (ชื่อ/หมวด/ลิงก์) · เลือกไฟล์ → render ปก+นับหน้า → presign → `putWithProgress`(% จริง) → PUT ปก → confirm · แถบ % + ปุ่ม `tb-backdrop`
- **`knowledge/library-page.jsx`**: `KnowledgeLibraryPage` — sticky header (สูตร `top:-24px`) + chips หมวด(นับ) + ค้นหา + **ปรับขนาดทัมเนล 3 ระดับ** + ปุ่มอัป(admin) · การ์ด (ปก **แนวตั้ง A4** `aspectRatio 210/297` + `objectFit contain` · หมวด/จำนวนหน้า/ชื่อ/คนอัป/ขนาด/ลิงก์ต้นฉบับ · ปุ่มลบ hover admin) · กดการ์ด→`[id]/url`→เปิด `PdfViewer` · ปุ่มกลับ
- **`knowledge/pdf-viewer.jsx`**: `PdfViewer` เต็มจอ (pdf.js viewer เอง)
- **`knowledge.jsx`** (barrel): `export { KnowledgeLibraryPage }`
- **`parts/misc.jsx`**: `KnowledgeBase({ onOpenPdf })` — เพิ่มแถบ "คลังเอกสาร PDF" + ปุ่ม "เปิดคลัง PDF" ใต้ Hero (ปล่อยการ์ด placeholder เดิมไว้)
- **`tb-monolith.jsx`**: import `KnowledgeLibraryPage` + state `knowledgeView` (home↔pdf · reset เมื่อออกจากแท็บ) + render swap · APP_VERSION 0.8.0.1

## ☁️ Cloudflare R2 (แคลร์ทำเองผ่าน MCP)
- สร้างถัง **`tb-knowledge`** (`r2_bucket_create`) · เช็คกุญแจเดิม (token "tb-dashboard-r2-all") เข้าถังใหม่ได้ (list 200)
- ตั้ง `R2_BUCKET_LIBRARY=tb-knowledge` ใน `.env.local` (gitignored)
- 🚨 **CORS ถังใหม่ = พี่กันตั้งเองบน dashboard** (แคลร์ไม่มีสิทธิ์ตั้ง config ถัง — token เป็น object-level · GetBucketCors 403) → พี่กันใส่ allow localhost:3000/3001 + 192.x + tbjourney.care (GET/PUT/HEAD) แล้วอัปได้
- ⚠️ **ก่อน deploy จริง:** ใส่ `R2_BUCKET_LIBRARY` ใน Cloudflare Worker env (ถึงไม่ใส่ default ในโค้ด=tb-knowledge ก็ตรง แต่ควรใส่) + verify `/pdf.worker.min.mjs` + `/pdf_viewer.css` content-type ถูกหลัง deploy

## 🗄 SQL (รันผ่าน MCP · dev=prod)
- `scripts/add-knowledge-realtime.sql` (ใหม่): เพิ่ม `tb_knowledge_docs` เข้า publication `supabase_realtime` (DO block กัน duplicate) → realtime ทำงาน
- (`add-knowledge-library.sql` รันตั้งแต่ Step 1)

## 🔧 เรื่องเทคนิค pdf.js (v6.1.200 · เจอจริงตอนทำ)
- ⚠️ **บิลด์นี้ไม่มี `PDFThumbnailViewer`** (export มีแค่ EventBus/PDFViewer/PDFLinkService/PDFFindController/PDFRenderingQueue) → **หน้าย่อทำเอง** (render หน้าเล็ก lazy ด้วย IntersectionObserver)
- **css:** Next.js ห้าม import css จาก node_modules ใน component → คัดลอก `pdf_viewer.css` เข้า `public/` (แก้ `copy-pdf-worker.mjs` ให้คัดลอก 2 ไฟล์) แล้วโหลดผ่าน `<link href="/pdf_viewer.css">` runtime · gitignore ทั้งคู่
- PDFViewer: `l10n ||= new GenericL10n()` เอง (ไม่ต้องส่ง) · container ต้อง `position:absolute` ในกล่อง relative + `<div class="pdfViewer">` ข้างใน
- find ผ่าน `eventBus.dispatch('find', {query, type:''|'again', findPrevious, highlightAll})` · นับ match จาก event `updatefindmatchescount`/`updatefindcontrolstate`
- scroll-lock `body.overflow=hidden` + StrictMode-safe (cancelled flag + task/pdf/viewer destroy) · `getDocument({isEvalSupported:false})`
- pdfjs-dist ไม่มี `exports` field → import subpath `web/pdf_viewer.mjs` ได้ตรง ๆ

## 🎓 บทเรียนสำคัญ (session นี้)
- 🔴 **ถัง R2 ใหม่ = ต้องตั้ง CORS เองเสมอ** ไม่งั้นเบราว์เซอร์อัปไม่ได้ = "เครือข่ายมีปัญหา" (`xhr.onerror`) — เจอซ้ำรอยเดิม v0.7.21 · แคลร์ตั้ง CORS ให้เองไม่ได้ (token object-level) ต้องพี่กันทำบน dashboard
- 🔴 **load-once + TTL ยาว = ค้างของเก่าข้ามเครื่อง** (192 ไม่เห็น PDF ที่ localhost อัป · cache ว่างสด 2 ชม.) → แก้เป็น **seed-cache + revalidate เงียบเสมอ** (โชว์ทันทีไม่ skeleton + fetch ใหม่ทุกครั้ง) · realtime เสริมตอนเปิดค้าง
- 🔴 **อ่านคำสั่ง user ให้ตรง** — พี่กันขอทัมเนล "แนวตั้ง" แคลร์ดันทำ mockup 3 แบบมีแนวนอนให้เลือก ("จะเอาแนวนอนมาให้เลือกทำไม") → user บอกอะไรชัดแล้ว **ทำเลย อย่าถามเลือกเกินจำเป็น**
- ✅ optimistic delete: กดยืนยัน = ปิดป๊อป+เอาการ์ดออกทันที → DELETE เบื้องหลัง · ล้มเหลว = คืนการ์ด + แถบ flash (ไม่ใช้ browser alert)
- ✅ Cloudflare MCP ต่ออยู่ → สร้าง R2 bucket + เทสกุญแจได้เอง (แต่ตั้ง CORS/Worker-env ไม่ได้ = พี่กันทำ)

## 🔭 งานต่อไป / ค้าง
1. **ก่อน/หลัง deploy:** ใส่ `R2_BUCKET_LIBRARY=tb-knowledge` ใน Cloudflare Worker env + verify worker/css content-type + เช็ค CORS ถัง tb-knowledge มี tbjourney.care
2. **storage monitor** — เพิ่ม `r2BucketUsage(LIBRARY_BUCKET)` ใน `app/api/admin/storage/route.ts` (นับพื้นที่คลัง PDF · follow-up)
3. **ระบบเขียนบทความ (idea 5C)** — editor Doc/Slide + ตาราง `tb_knowledge_articles` → รวมการ์ดบทความในหน้าคลังเดียวกัน (พี่กัน "แยกก่อน ค่อยปรับ")
4. **สรุป trial ภาษาคน** (idea 5D)
5. ทัมเนล 2K มีผลเฉพาะไฟล์อัปใหม่ (ของเก่าเป็น 360px) — re-upload ถ้าอยากได้คม

## หมายเหตุ
- ไฟล์ค้าง `scripts/rollback-cleanup-easter-egg-log.sql` (ของเก่า ไม่เกี่ยว v0.8) — ไม่รวมใน commit นี้
- mockup ที่พี่กันส่ง (Claude คลาวทำ) เก็บไว้ `docs/mockup-knowledge-pdf-v0.8.html`
- `.env.local` gitignored (R2 key ไม่หลุด)
