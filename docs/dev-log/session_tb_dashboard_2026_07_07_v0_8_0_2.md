---
name: session-tb-dashboard-2026-07-07-v0.8.0.2
description: TB Dashboard session 6-7 ก.ค. 69 — v0.8.0.2 ตัวอ่าน PDF โฉมใหม่แบบ Chrome (toolbar เทล/ปุ่มกลาง/fit toggle/2หน้า/นำเสนอ/เปิดแท็บใหม่/คุณสมบัติเอกสาร+แฮช+device) + เปิดเร็ว+animation+บาร์% + แก้ตัวอักษรเบลอ + แถบหน้าย่อลากปรับได้ · push เอง (พี่กันไปนอน)
metadata:
  node_type: memory
  type: project
---

# TB Dashboard — session 6-7 ก.ค. 2569 · v0.8.0.2 (ตัวอ่าน PDF โฉมใหม่)

**Repo:** live tbjourney.care (ยังไม่เผยแพร่) · Supabase `cioswzdbonnbhbyynrhh` (dev=prod) · Worker `tb-dashboard-bysirawit`
**session นี้:** ยกเครื่อง **ตัวอ่าน PDF** (`pdf-viewer.jsx`) ให้เหมือน Chrome ตามที่พี่กันขอ + เพิ่ม device + ขัดผิว UI = **v0.8.0.2**
**สถานะ:** 🌙 พี่กันสั่ง "พุชเลย 0.8.0.2 · ปล่อยเธอทำ · เขียนวิธีเทสไว้ · มาดูตอนเช้า" → แคลร์ build+bump+commit+push **เอง** (พี่กันยังไม่ได้เทส · verify ด้วย `npm run build` ผ่าน + tsc สะอาด แทน)

> ⚠️ **พี่กันยังไม่ได้เทสหน้าจริงก่อน push** (ไปนอน · อนุญาต push ชัดเจน) — ตัวอ่านเป็น UI ใหญ่ที่เขียนใหม่เยอะ · **เช้ามาต้องเทสตามคู่มือ** (อยู่ในแชท + ด้านล่าง) ถ้าเจอบั๊กแก้เช้าได้เลย (ฟีเจอร์แยกส่วน ไม่กระทบระบบคนไข้)

## 🛠 ที่ทำ (v0.8.0.2 · ต่อจาก v0.8.0.1 ที่ push ไปแล้ว)

### ตัวอ่าน PDF โฉมใหม่ — `parts/knowledge/pdf-viewer.jsx` (rewrite)
- **toolbar เทล (`#0f766e`) · ปุ่มอยู่กลาง** (เหมือน Chrome) · พื้นหลังตัวอ่านเข้ม
- **เปิดมา 100%** (เดิม fit-width) · ซูม **dropdown** (พอดีกว้าง/พอดีหน้า/50–500%) + กด **+/−** ทีละขั้น (×1.2 · เพดาน pdf.js `MAX_SCALE=25` = **2500%**)
- **ปุ่ม fit toggle เดียว** สลับ พอดีกว้าง(↔) ↔ พอดีหน้า(↕) — ไม่ใช่ 2 ปุ่ม (พี่กันขอ · `fitNext` state · ไอคอนสลับตามโหมด)
- **ดูแบบ 2 หน้า** (`spreadMode`) · **นำเสนอ** (เต็มจอ `requestFullscreen`) · **เปิดในแท็บใหม่** (native Chrome · ขอ url สด)
- **คุณสมบัติของเอกสาร** (`DocProps` · **พื้นขาว**) — `pdf.getMetadata` (Producer/เวอร์ชัน PDF/วันที่สร้าง-แก้ไข) + จำนวนหน้า + ขนาดหน้า(มม.) + คนอัป/วันที่ + **อัปจากไหน (device)** + **แฮชสด** SHA-256/MD5/CRC32 (จาก `pdf.getData()` → `computeByteHashes`) · **ปุ่มกดแยกบน toolbar** (ⓘ) + ในเมนู ⋮
- **แถบหน้าย่อลากปรับกว้างได้อิสระ** (`thumbW` + drag handle ขอบขวา · 90–460px · หน้าย่อ render 220px คมตอนขยาย)
- **find bar เทลสว่าง + โปร่งใส + เบลอฉากหลัง** (เห็นตัวอักษร PDF ทะลุ · ตัวหนังสือ/ปุ่มในแถบเป็นเทลเข้ม `FBtn`)
- **บาร์ % โหลด** (`loadingTask.onProgress` · มี % จริง / บาร์วิ่งถ้าไม่รู้ขนาด)
- **เปิดเร็ว** — กดการ์ดเปิดทันทีด้วย `doc.url` ที่มีอยู่ (ไม่รอ fetch) + retry ขอ url สดถ้าหมดอายุ + `preload getPdfjs()` ตอน mount library
- 🐛 **แก้ตัวอักษรเบลอ** — เกิดจาก `transform: scale` ค้างหลัง animation (composite layer re-raster) → เอา transform ออกหลัง animation จบ 240ms (`settled` state)

### device "อัปจากไหน"
- DB: `alter table tb_knowledge_docs add column device` (`scripts/add-knowledge-device.sql` · รันผ่าน MCP)
- `helpers.jsx` re-export `detectDevice` · `upload-modal.jsx` ส่ง `detectDevice()` ตอน confirm · `confirm/route.ts` เก็บ `device`
- ⚠️ ไฟล์ที่อัปก่อน v0.8.0.2 จะไม่มี device (null → ซ่อนแถว) · แฮช/metadata โชว์ได้ทุกไฟล์ (คำนวณสด)

### `library-page.jsx`
- `openDoc` เปิดทันที (setViewer(doc)) · ส่ง `url/docId/doc` เข้า `PdfViewer` · preload pdf.js

## 🔧 เทคนิค/ข้อจำกัดที่เจอ
- pdf.js `MAX_SCALE = 25` (2500%) — **4000% ที่พี่กันอยากได้เกินเพดาน** ต้องซ้อน CSS overzoom (เบลอ) · **ยังไม่ทำ · รอพี่กันเคาะ**
- `fa-regular` ใช้ได้ (FA 6 all.min.css โหลดครบ)
- transform ค้าง = ตัวอักษร canvas เบลอ (บทเรียน · เอาออกหลัง animation)

## 💡 ไอเดียเฟสหลัง (พี่กัน "แค่คิด")
- **ไฮไลต์ข้อความ / คอมเมนต์ใน PDF** — pdf.js มี AnnotationEditor (ไฮไลต์/วาด/โน้ต) ทำได้ แต่เป็นก้อนใหญ่: (1) บันทึกต้องเขียนกลับเป็นไฟล์ PDF ใหม่แล้วอัปทับ R2 (2) ตัดสินว่าเก็บ **ในไฟล์ (ทุกคนเห็น)** หรือ **แยก layer ตามผู้อ่าน** · เก็บเป็นเฟสหลัง

## 🔭 งานต่อไป / ค้าง
1. 🌅 **พี่กันเทส v0.8.0.2 เช้านี้** (ตามคู่มือในแชท) — ตัวอ่านใหม่ + device + fit toggle + ลากแถบหน้าย่อ + popup ขาว + find bar + บาร์% + ตัวอักษรคม
2. **4000% zoom** — ถ้าพี่กันเอาจริง ต้องทำ CSS overzoom (>2500% เบลอ)
3. **ไฮไลต์/คอมเมนต์ PDF** (เฟสหลัง · ดูไอเดียด้านบน)
4. **storage monitor** นับพื้นที่ถัง library
5. **ระบบเขียนบทความ** (idea 5C) · **สรุป trial** (5D)
6. ⚠️ **deploy:** ใส่ `R2_BUCKET_LIBRARY` ใน Cloudflare Worker env + CORS ถัง tb-knowledge มี tbjourney.care + verify worker/css content-type

## หมายเหตุ
- build ผ่าน (SWC strict · BUILD_ID สร้าง · knowledge routes ครบ) · tsc สะอาด
- SQL device รันผ่าน MCP แล้ว (dev=prod)
- ไฟล์ค้าง `scripts/rollback-cleanup-easter-egg-log.sql` (ของเก่า) — ไม่รวม commit
