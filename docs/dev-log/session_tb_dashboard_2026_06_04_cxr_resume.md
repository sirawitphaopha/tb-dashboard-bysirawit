---
name: tb-dashboard-cxr-v0-7-19
description: 🩻 ระบบรูปภาพผู้ป่วย CXR/Lab/เอกสาร — v0.7.19.0→.2 ✅ PUSH หมดแล้ว · roadmap เหลือ (ไฟล์กำพร้า/ถังขยะรูป/empty state/ขอลบ user/favorite)
metadata:
  node_type: memory
  type: project
  originSessionId: 0d319472-21f4-4173-828b-35af180daaa4
---
# 🩻 ระบบรูปภาพผู้ป่วย (CXR/Lab/เอกสาร) — push หมดแล้ว v0.7.19.0 → v0.7.19.2

**push:** 19.0=`e79c733` · 19.1=`bf162f6` · 19.2=`0080b87` (+chore 76f9841) · BUILD_DATE 4 มิ.ย. 2569
**แผนเดิม:** `C:\Users\User\.claude\plans\compressed-conjuring-tome.md`

## ✅ env R2 prod = ตั้งครบแล้ว (พี่กันกรอกเอง 2026-06-04)
- R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY (token tb-dashboard-r2-all) + R2_BUCKET_PATIENT=tb-patient-images บน Cloudflare ครบ → รูปคนไข้/HEIC ใช้ได้บน production (รอ deploy เสร็จ)

## 🔭 ค้าง — Roadmap (Gemini suggest + พี่กันสั่งทีหลัง)
1. (เคลียร์แล้ว ✅ env prod)
2. **Roadmap:**
   - **ไฟล์กำพร้า:** ลบรูปใน R2 ตอน "ลบผู้ป่วย" (ตอนนี้ลบ patient แล้วรูปค้างใน R2) — แก้ฟังก์ชันลบผู้ป่วย → เช็ค tb_patient_images → ลบ R2 ก่อน
   - **ถังขยะรูป:** ลบ→เข้าถังขยะ กู้คืนได้ (เหมือนระบบลบผู้ป่วย) ไม่ลบจริงทันที
   - **"ขอลบ" สำหรับ user ทั่วไป:** กดแล้ว admin อนุมัติก่อนลบ
   - **empty state สวยขึ้น** (icon box แทนข้อความเปล่า) · **กันคลิกขวา/ลากที่ทัมเนล** (lightbox ทำแล้ว) · **favorite** · **อนิเมชันระเบิดตอนลบ** · lossless server-side · DICOM/TIFF เต็ม · sync ซูมเทียบ CXR · เชื่อม timeline

## ✅ สรุปฟีเจอร์ (3 version)
- **19.0 (e79c733):** ฐาน — แท็บรูปในผู้ป่วย + คลังรูป + เทียบ CXR · R2 private + signed URL · บีบ WebP ตามหมวด · ทัมเนล · ตัวดูรูป blur-up/zoom/info
- **19.1 (bf162f6):** รับไฟล์หลากหลาย (HEIC heic2any/TIFF/AVIF/GIF) + พรีวิว + Google Photos justified + ลูกศร/pinch/minimap + เมนู3จุด + เรียง/กรองวันที่ + cache + อุปกรณ์
- **19.2 (0080b87):** HEIC ปลอดภัย (heic2any→**heic-to/csp** ไม่ใช้ eval) · **เปลี่ยนหมวด=ย่อไฟล์จริง** (CXR4096→Lab2560 โหลด→ย่อ→อัปทับ→ลบเก่า · PATCH รับ key/มิติ) · **Realtime ข้ามผู้ใช้** (payload merge ไม่ refetch) · **ลบ optimistic + FLIP** (กดปุ๊บหายปั๊บ เลื่อนนุ่ม ไม่ skeleton · soft-delete=UPDATE event) · คำอธิบาย inline · คนอัปโหลด+ตัวกรอง · ขนาดต้นฉบับ · เคอร์เซอร์มือเปิด/กำ · info ดันรูปซ้าย · ปุ่ม hover เทล · บีบอื่น 87%/2560 · ≤200MB · คำ "อัปโหลด"

## 📁 DB/API/lib
- DB tb_patient_images คอลัมน์: storage_key, thumb_key, type, mime, size_bytes, width, height, orig_size_bytes, orig_mime, orig_width, orig_height, quality, device, title, note, uploaded_by, soft delete · 6 SQL (รัน MCP หมด) · ใน realtime publication แล้ว
- API `app/api/patient/images/`: presign(ext) · confirm(origW/H+quality+device) · route+all(uploader join) · [id]/url · [id] (DELETE + PATCH ย่อขนาด/ลบไฟล์เก่า)
- lib: **heic-to** (ไม่ใช่ heic2any แล้ว) + utif · lib/r2 + patient-image-helpers
- `tb-monolith.jsx`: decodeImageToDataURL(heic-to/csp) · isAnimatedGif · compressToWebp · putWithProgress · detectDevice · imgSortCmp/imgInRange · patientImgInfo · JustifiedGallery(FLIP) · PatientImagesTab · ImageLibraryPage · AvatarLightbox(minimap/cursor/3จุด/inline note/info-shift) · cache localStorage
- `next.config.js` CSP: script wasm-unsafe-eval · worker-src blob · connect blob · img/connect R2

## 💡 Lessons (สำคัญ)
- **HEIC ในเบราว์เซอร์:** heic2any ใช้ eval → CSP บล็อก · ใช้ **heic-to/csp** (เลี่ยง eval ใช้ wasm-unsafe-eval) แทน — อย่าเปิด unsafe-eval
- **soft-delete = Postgres UPDATE event** (ไม่ใช่ DELETE) → realtime ต้องเช็ค deleted_at
- **เปลี่ยนหมวดย่อจริง:** โหลด signed url → canvas ย่อ → อัป key ใหม่ → PATCH + ลบ key เก่า (ไม่เก็บต้นฉบับ)
- optimistic (ลบ/แก้) + FLIP (useLayoutEffect+data-flip-id) = UX ลื่น ไม่ skeleton
- signed URL เติม query ไม่ได้ · cache ใช้ลิงก์เดิมให้ browser cache · % = scale×fitRatio×100
