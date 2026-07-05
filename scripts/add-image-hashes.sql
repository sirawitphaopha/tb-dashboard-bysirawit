-- ════════════════════════════════════════════════════════════
-- add-image-hashes.sql — เก็บ hash ของรูป (ตรวจรูปซ้ำ)
-- orig_sha256/md5/crc32 = hash ของไฟล์ต้นฉบับ (นิ่ง ไม่เปลี่ยนตามการบีบอัด) → รูปซ้ำเป๊ะ
-- phash = perceptual hash (dHash) จากภาพ → "ภาพเดียวกันแม้คนละไฟล์/บีบอัดต่าง"
-- คำนวณฝั่งเบราว์เซอร์ตอนอัป (image-hash.js) แล้วส่งมาเก็บ · รูปเก่าก่อนหน้า = null (ไม่ backfill)
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.tb_patient_images ADD COLUMN IF NOT EXISTS orig_sha256 text;
ALTER TABLE public.tb_patient_images ADD COLUMN IF NOT EXISTS orig_md5    text;
ALTER TABLE public.tb_patient_images ADD COLUMN IF NOT EXISTS orig_crc32  text;
ALTER TABLE public.tb_patient_images ADD COLUMN IF NOT EXISTS phash       text;   -- dHash 64-bit เก็บเป็น hex 16 ตัว

-- hash ของไฟล์ WebP ที่เก็บจริง (v0.7.21.1 · พี่กันขอดูคู่ต้นฉบับ) — เปลี่ยนตามการบีบอัด/หมวด
ALTER TABLE public.tb_patient_images ADD COLUMN IF NOT EXISTS webp_sha256 text;
ALTER TABLE public.tb_patient_images ADD COLUMN IF NOT EXISTS webp_md5    text;
ALTER TABLE public.tb_patient_images ADD COLUMN IF NOT EXISTS webp_crc32  text;

-- index หารูปซ้ำเป๊ะ (จาก sha256)
CREATE INDEX IF NOT EXISTS idx_patient_images_sha256 ON public.tb_patient_images (orig_sha256) WHERE orig_sha256 IS NOT NULL;
