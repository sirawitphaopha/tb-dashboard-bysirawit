-- ════════════════════════════════════════════════════════════════════════
-- v0.7.14.5 — ขยายระบบ Changelog Comments
-- • reply 1 ระดับ (parent_comment_id)
-- • mark resolved + label ตาม status
-- • like / 👍
-- • edit history
-- • @mention + notification
-- ปลอดภัย รันซ้ำได้ (IF NOT EXISTS / DO block ทุกที่)
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. ALTER tb_changelog_comments ─────────────────────────────────────
ALTER TABLE tb_changelog_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id  uuid
    REFERENCES tb_changelog_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS resolved_at        timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mentioned_user_ids uuid[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_changelog_comments_parent
  ON tb_changelog_comments(parent_comment_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_changelog_comments_unresolved
  ON tb_changelog_comments(version, status)
  WHERE deleted_at IS NULL AND resolved_at IS NULL;

-- ── 2. CREATE tb_changelog_comment_likes ──────────────────────────────
CREATE TABLE IF NOT EXISTS tb_changelog_comment_likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid NOT NULL REFERENCES tb_changelog_comments(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON tb_changelog_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user    ON tb_changelog_comment_likes(user_id);

ALTER TABLE tb_changelog_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes select all" ON tb_changelog_comment_likes;
CREATE POLICY "likes select all"
  ON tb_changelog_comment_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "likes insert own" ON tb_changelog_comment_likes;
CREATE POLICY "likes insert own"
  ON tb_changelog_comment_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes delete own" ON tb_changelog_comment_likes;
CREATE POLICY "likes delete own"
  ON tb_changelog_comment_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── 3. CREATE tb_changelog_comment_edits ──────────────────────────────
CREATE TABLE IF NOT EXISTS tb_changelog_comment_edits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid NOT NULL REFERENCES tb_changelog_comments(id) ON DELETE CASCADE,
  edited_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  old_text    text NOT NULL,
  old_status  text NOT NULL,
  edited_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comment_edits_comment_time
  ON tb_changelog_comment_edits(comment_id, edited_at DESC);

ALTER TABLE tb_changelog_comment_edits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edits select all" ON tb_changelog_comment_edits;
CREATE POLICY "edits select all"
  ON tb_changelog_comment_edits FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "edits no client write" ON tb_changelog_comment_edits;
CREATE POLICY "edits no client write"
  ON tb_changelog_comment_edits FOR INSERT TO authenticated WITH CHECK (false);

-- ── 4. ALTER tb_notifications เพิ่ม comment link ──────────────────────
ALTER TABLE tb_notifications
  ADD COLUMN IF NOT EXISTS comment_version text,
  ADD COLUMN IF NOT EXISTS comment_id      uuid REFERENCES tb_changelog_comments(id) ON DELETE SET NULL;

-- ── 5. เปิด Realtime publication ──────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tb_changelog_comments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tb_changelog_comment_likes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
