-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 1A Quick Wins — เพิ่ม index ที่หายไป (v0.7.15.0)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ทำไมต้องเพิ่ม:
-- 1. tb_changelog_comment_likes(comment_id)
--    → ทุกครั้งที่ comments-all endpoint นับไลก์ ปัจจุบัน Postgres ต้อง
--      ไล่อ่านทุกแถวของ tb_changelog_comment_likes (full scan)
--    → เพิ่ม index แล้ว query เร็วขึ้น ~10-40 เท่า เมื่อตารางโตขึ้น
--
-- 2. tb_changelog_comments(user_id, created_at DESC)
--    → ใช้เวลาเปิดดูคอมเมนต์ของคนคนเดียว (เช่น "คอมเม้นของฉัน" filter)
--    → composite index ช่วยทั้ง WHERE user_id = ... + ORDER BY created_at DESC
--    → WHERE deleted_at IS NULL = partial index (เล็กกว่า full index)
--
-- Idempotent: รันซ้ำได้ไม่เออเรอร์ (CREATE INDEX IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. ไลก์คอมเมนต์: lookup by comment_id ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_changelog_comment_likes_comment
  ON tb_changelog_comment_likes(comment_id);

-- ── 2. คอมเมนต์ตาม user + เรียงเวลา ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_changelog_comments_user_created
  ON tb_changelog_comments(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ── 3. (Bonus) คอมเมนต์ตาม version + เรียงเวลา ────────────────────────────
-- กรณีที่ frontend ดึงคอมเมนต์ของ 1 version ต่อ 1 request ในอนาคต (Phase 2)
CREATE INDEX IF NOT EXISTS idx_changelog_comments_version_created
  ON tb_changelog_comments(version, created_at DESC)
  WHERE deleted_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verify indexes ที่สร้างแล้ว (สำหรับ admin เช็ค):
-- SELECT indexname, tablename FROM pg_indexes
--   WHERE tablename IN ('tb_changelog_comment_likes', 'tb_changelog_comments')
--   ORDER BY tablename, indexname;
-- ═══════════════════════════════════════════════════════════════════════════
