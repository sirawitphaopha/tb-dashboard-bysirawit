---
name: session-tb-dashboard-2026-07-06-v0.8-pdf-step1
description: TB Dashboard session 6 ก.ค. 69 — เริ่ม v0.8 ระบบ PDF (คลังความรู้วัณโรค) · คุยเคาะสเปก + วางแผน + Step 1 (DB + ติดตั้ง pdf.js) + แก้กฎ workflow ใหม่ (push main / แคลร์รัน SQL เอง)
metadata:
  node_type: memory
  type: project
---

# TB Dashboard — session 6 ก.ค. 2569 (เริ่ม v0.8 · ระบบ PDF · Step 1)

**Repo:** live tbjourney.care (ยังไม่เผยแพร่) · Supabase `cioswzdbonnbhbyynrhh` (dev=prod)
**session นี้:** เริ่มฟีเจอร์ใหม่ **คลังความรู้วัณโรค (ระบบ PDF)** = เวอร์ชัน **v0.8.0.0** (Step 1/3 · ฐานราก)
**สถานะ:** ตั้งเวอร์ชัน **v0.8.0.0** + force-push ขึ้น main (แก้ subject "v0.8" ปลอมที่เผลอ push ก่อนหน้า · Step 2 = 0.8.0.1, Step 3 = 0.8.0.2 แยก commit ทีหลัง)

> ⚠️ session นี้ยาว เพราะช่วงแรกพี่กันอารมณ์เสีย (แคลร์รีบพุ่งไปทำ mockup/เลือกโน่นนี่ทั้งที่พี่กันแค่อยากคุยให้เข้าใจก่อน) → บทเรียนสำคัญด้านล่าง

## 🎯 ฟีเจอร์: คลังความรู้วัณโรค (ระบบ PDF)
แท็บ "คลังความรู้วัณโรค" เดิมเป็น placeholder (`parts/misc.jsx` `KnowledgeBase()`) โชว์การ์ด "เร็วๆ นี้" กดไม่ได้ · จะแทนด้วยระบบจริง: แอดมินอัป PDF (ไกด์ไลน์/งานวิจัย) เก็บบน R2 → ทุกคน login อ่านในเว็บได้ด้วยตัวอ่าน pdf.js เต็มรูปแบบ (เลื่อน/ซูม/หมุน/ค้นหาคำในไฟล์+ไฮไลต์/เลือก-คัดลอก/หน้าย่อ/พิมพ์/ดาวน์โหลด) · ตรงไอเดียข้อ 5B ใน `docs/ideas.md`

### สเปกที่เคาะกับพี่กัน (สัมภาษณ์ทีละข้อ)
- ทุกคน login **อ่าน** ได้ · แอดมิน (พี่กัน) คนเดียว **อัป+ลบ**
- เก็บไฟล์จริงบน R2 ทุกไฟล์ · **ไม่แคร์ลิขสิทธิ์** (ระบบวงปิด login เท่านั้น ไม่ได้ขาย)
- หมวด: แนวทางการรักษา / งานวิจัย-Trial / อื่นๆ · **ไม่มีแท็ก ไม่คิดเผื่ออนาคต** (ไฟล์แค่หลักสิบ)
- อ่านในเว็บ (pdf.js) · **ค้นหาคำในไฟล์ที่เปิดอยู่ต้องมี** (Ctrl+F style · pdf.js มีในตัว)
- ขอบเขต v1 = อัป+อ่าน+ลบ · editor เขียนบทความ + สรุป trial = phase ถัดไป
- ลบ = hard delete (ไม่ทำถังขยะ · ไม่ใช่ข้อมูลคนไข้) แต่ยังยืนยัน 2 ขั้นตามธรรมเนียม

### แผนเต็ม
อยู่ที่ `~/.claude/plans/plan-mofd-vast-charm.md` (approve แล้ว) · แบ่ง 3 step (Gemini แนะนำ ทำทีละขั้น กันโค้ดขาด)

## 🛠 Step 1 ที่ทำเสร็จ (commit 2da4543)
1. **DB — `scripts/add-knowledge-library.sql`** (ใหม่): ตาราง `tb_knowledge_docs` (category/title/file_name/source_url/storage_key/thumb_key/mime/size_bytes/page_count/uploaded_by/uploaded_at · ไม่มี soft-delete) + index (category,uploaded_at) + RLS (`is_approved()` อ่าน / `is_admin()` เขียน-ลบ)
   - ✅ **แคลร์รันเองผ่าน Supabase MCP `execute_sql`** (ตามที่พี่กันสั่ง) → verify: 12 คอลัมน์ · RLS on · 4 policies ครบ
2. **ติดตั้ง pdf.js** — `package.json`: `pdfjs-dist` **6.1.200** (pin เป๊ะ) + scripts `copy-pdf-worker`/`postinstall`/`prebuild`
3. **`scripts/copy-pdf-worker.mjs`** (ใหม่): คัดลอก `pdf.worker.min.mjs` จาก node_modules เข้า `public/` (worker ตรงเวอร์ชัน API เสมอ · ผ่าน CSP worker-src 'self') · เทสแล้วสร้างไฟล์ 1.2MB จริง
4. **`.gitignore`**: + `public/pdf.worker.min.mjs` (auto-gen ไม่ commit)
5. **`next.config.js` ไม่แตะ** — CSP รองรับ pdf.js อยู่แล้ว (worker-src 'self' blob: / connect-src *.r2 / wasm-unsafe-eval) · ตรวจแล้ว 3 explore agents

### เรื่องเทคนิค pdf.js (จากการ explore + Gemini เสริม)
- ใช้ `pdfjs-dist/web/pdf_viewer.mjs` (EventBus/PDFViewer/PDFFindController/PDFThumbnailViewer) ประกอบใน React shell เอง — vanilla JS ล้วน = **เข้ากับ React 19 ไม่มีปัญหา** ได้ find/thumbnails/text-layer มาฟรี
- `<iframe>`/`<embed>` ใช้ไม่ได้ (frame-src/object-src 'none') → canvas renderer เท่านั้น
- lazy `await import('pdfjs-dist')` ตอนเปิดไฟล์ (เลียนแบบ heic-to/csp) · `getDocument({isEvalSupported:false})`
- **Gemini tips เก็บเข้าแผน:** (1) รูปหน้าปก+จำนวนหน้า v1 (2) scroll lock `body.overflow=hidden` ตอนเปิด viewer (3) สร้างปกแบบประหยัดแรม (render หน้า 1 อย่างเดียว scale ~360px) (4) กัน StrictMode ยิง getDocument เบิ้ล (cancelled flag + task.destroy)

## 📌 กฎ workflow ใหม่ (พี่กันสั่ง · แก้ลง CLAUDE.md + skill แล้ว)
1. 🚀 **push ขึ้น `main` โดยตรง ไม่ใช้ feature branch/PR** ("เอาขึ้นเมน") · ยกเว้น session ที่ setup บังคับ branch (ถ้าบล็อกให้บอกตรง ๆ)
2. 🗄️ **แคลร์รัน SQL เองผ่าน Supabase MCP** ถ้า MCP ต่ออยู่ (ไม่ให้พี่กันรัน ไม่ echo path) · fallback = echo path เดิมถ้า MCP ไม่ต่อ
   - แก้แล้ว: `CLAUDE.md` (หัวข้อ scripts + push) + `.claude/skills/working-with-gun/SKILL.md` (ข้อ 4 + 5)

## 🎓 บทเรียนสำคัญ (session นี้)
- 🔴🔴 **อย่ารีบพุ่งไป "ทำ" ตอน user ยังไม่เข้าใจ/ยังไม่สั่งทำ** — พี่กันบอก "อย่าพุ่งมาที่ทำๆๆ เรายังไม่เข้าใจเลย มาคุยให้เข้าใจก่อน" · แคลร์รีบทำ mockup + เปิด AskUserQuestion เลือกโน่นนี่ ทำพี่กันหงุดหงิดหนัก → **คุยให้เข้าใจ + เคาะสเปกก่อน ค่อยลงมือ**
- 🔴 **user หงุดหงิด = ตอบสั้น ตรง ไม่พิมพ์เยอะ** · เสนอให้ตรง + มองหลายมุม · **อย่าถามสิ่งที่ user เขียนไว้ใน idea แล้ว** (เช่น "อ่านในเว็บไหม" = เขียนไว้แล้ว ถามซ้ำ = โดนด่า)
- 🔴 **AskUserQuestion popup เจ๊งบ่อย (permission stream closed) + กินคำตอบที่ user พิมพ์** → พี่กันเสียดายที่พิมพ์ยาว · **เลี่ยง popup ถ้าไม่จำเป็น ใช้ถามเป็นข้อความธรรมดา**
- 🔴 **user สั่ง "สัมภาษณ์เรา" = ถามทีละข้อ ให้ user ตอบสั้น ๆ** (ไม่ให้เล่าเองยาว ๆ)
- ✅ Gemini (ที่พี่กันไปปรึกษา) ให้ tips ดีจริง — รับมาเสริมแผนได้ ไม่ต้องหวง

## 🔭 งานต่อไป / ค้าง
1. **push Step 1 ขึ้น main** (commit 2da4543 + commit นี้)
2. **Step 2 — API หลังบ้าน:** `app/api/knowledge/{presign,confirm,route,[id]/url,[id]/route}` + `lib/knowledge-helpers.ts` (LIBRARY_BUCKET + re-export getRequester)
3. **Step 3 — Frontend:** `parts/knowledge/*` (helpers/library-page/upload-modal/pdf-viewer) + barrel + แก้ tb-monolith 2 จุด
4. **Step 4 (follow-up):** รูปหน้าปก+จำนวนหน้า, storage monitor, bump version + push
5. **ก่อน deploy จริง:** สร้าง R2 bucket + ใส่ env `R2_BUCKET_LIBRARY` (.env.local + Cloudflare) · เช็ค content-type worker หลัง deploy

## หมายเหตุ
- ตาราง `tb_knowledge_docs` สร้างใน Supabase แล้ว (รันผ่าน MCP · dev=prod)
- `next.config.js` CSP ไม่ต้องแก้
- mockup ที่ทำให้พี่กันดู: หน้าคลัง + upload modal + ตัวอ่าน PDF (ค้นหา/หน้าย่อ/ซูม) — พี่กันเห็นแล้ว
