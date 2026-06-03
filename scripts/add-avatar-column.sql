-- ════════════════════════════════════════════════════════════════════════
-- v0.7.18.0 — เพิ่มระบบรูปโปรไฟล์ (avatar)
-- ════════════════════════════════════════════════════════════════════════
--
-- เพิ่ม 2 คอลัมน์ใน profiles:
--   avatar_url        — เก็บ "ที่อยู่ของรูปในตู้ R2" (เช่น 'avatars/<userId>.webp')
--                       เก็บ key/path เฉยๆ ไม่เก็บ full URL → เปลี่ยน domain ได้ภายหลัง
--                       ค่า NULL = user ยังไม่มีรูป (แสดงตัวอักษรย่อแทน)
--   avatar_updated_at — เวลาเปลี่ยนรูปล่าสุด
--                       ใช้เป็น cache-bust query string (?v=1717398000000)
--                       กัน browser แสดงรูปเก่าค้างหลังเปลี่ยนรูปใหม่
--
-- ปลอดภัย: ใช้ IF NOT EXISTS → รันซ้ำได้ไม่ error
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url        TEXT,
  ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ;

-- comment ในตาราง (ดูใน Supabase Table Editor)
COMMENT ON COLUMN profiles.avatar_url        IS 'R2 object key (e.g. avatars/<userId>.webp) · NULL = ยังไม่มีรูป';
COMMENT ON COLUMN profiles.avatar_updated_at IS 'เวลาเปลี่ยนรูปล่าสุด · ใช้ cache-bust ?v={timestamp}';

-- ตรวจสอบว่าเพิ่มสำเร็จ (ควรเห็น 2 row)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'profiles'
  AND column_name IN ('avatar_url', 'avatar_updated_at');
