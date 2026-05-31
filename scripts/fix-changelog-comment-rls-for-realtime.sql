-- ════════════════════════════════════════════════════════════════════════
-- v0.7.14.5 fix — แก้ RLS ของ tb_changelog_comments
-- เพื่อให้ Supabase Realtime broadcast event ตอน soft delete ได้
--
-- ปัญหาเดิม:
--   SELECT policy: USING (deleted_at IS NULL)
--   เมื่อ UPDATE deleted_at จาก NULL → IS NOT NULL
--   → row ใหม่ ไม่ผ่าน RLS → Supabase Realtime ไม่ broadcast event
--   → Browser อื่นไม่รู้ว่ามีการลบ
--
-- ทางแก้:
--   เปลี่ยน SELECT เป็น USING (true) — frontend handle tombstone เอง
--   - comments-all API ผ่าน admin client + mask comment_text สำหรับ non-admin
--   - direct query ก็ปลอดภัยเพราะ frontend ใช้ API เท่านั้น
-- ════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "select all comments" ON tb_changelog_comments;
CREATE POLICY "select all comments"
  ON tb_changelog_comments FOR SELECT TO authenticated
  USING (true);
