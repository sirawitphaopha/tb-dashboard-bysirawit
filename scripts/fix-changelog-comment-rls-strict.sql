-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2 Step 2 — RLS strict ของ tb_changelog_comments (v0.7.15.3)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ปัญหาเดิม:
-- - SELECT policy USING (true) → ทุก authenticated user เห็นทุก row รวม deleted
-- - frontend masking comment_text เฉพาะใน /api/changelog/comments-all
-- - แต่ถ้า client query ตรงๆ ผ่าน supabase-js → เห็น deleted_text เต็มทั้งหมด
-- - = security in depth gap
--
-- หลังแก้:
-- - non-admin เห็นเฉพาะ comment ที่ไม่ถูกลบ (deleted_at IS NULL)
--   + comment ที่ตัวเองเป็นคนลบ (own audit trail)
-- - admin เห็นทุก comment (รวม deleted) — ผ่าน is_admin() function
-- - /api/changelog/comments-all ยังคงใช้ admin client → bypass RLS → tombstone ยัง work
-- - direct client query (supabase-js จาก browser) → strict policy ป้องกัน
--
-- ⚠️ ข้อสำคัญ:
-- - Realtime broadcast event ตอน soft delete จะหายไปสำหรับ non-admin user
--   (เพราะ Realtime ตรวจ RLS — row UPDATE deleted_at NULL → NOT NULL จะไม่ broadcast)
-- - แต่ frontend ใช้ debounced refetch ผ่าน /api/changelog/comments-all อยู่แล้ว
--   → tombstone ยังคงเห็น (ผ่าน admin client) เพียงแต่ delay 500ms
--
-- Idempotent: รันซ้ำได้
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. ลบ policy เก่า ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "select all comments" ON tb_changelog_comments;

-- ── 2. สร้าง policy ใหม่ (strict) ──────────────────────────────────────────
CREATE POLICY "select non_deleted or admin or self_deleter"
  ON tb_changelog_comments FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    OR deleted_by = auth.uid()
    OR is_admin()
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Verify:
-- SELECT polname, pg_get_expr(polqual, polrelid) FROM pg_policy
--   WHERE polrelid = 'tb_changelog_comments'::regclass AND polcmd = 'r';
--
-- Test (จาก SQL editor ใน role anon/authenticated):
-- SET LOCAL ROLE authenticated;
-- SELECT id, deleted_at FROM tb_changelog_comments WHERE deleted_at IS NOT NULL;
-- → ควรไม่เห็น row ใดๆ ยกเว้น row ที่ตัวเองลบ
-- ═══════════════════════════════════════════════════════════════════════════
