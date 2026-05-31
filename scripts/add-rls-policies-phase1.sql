-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 1A Quick Wins — เพิ่ม RLS policy ให้ user เห็น session/login log ของตัวเอง (v0.7.15.0)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- เหตุผล:
-- - ปัจจุบัน tb_session_log, tb_logout_log, tb_login_log มี policy "no client access" = USING (false)
-- - = client (anon + authenticated) เข้าไม่ได้เลย → API route ต้องใช้ admin client (service role)
-- - admin client = bypass RLS = ไม่ปลอดภัยถ้า scope ไม่ enforce ใน code
--
-- หลังเพิ่ม policy:
-- - user เห็นได้เฉพาะ row ของตัวเอง (WHERE user_id = auth.uid())
-- - admin client ยังใช้ได้ปกติ (bypass RLS)
-- - API route /api/auth/sessions/history สามารถใช้ server client + RLS = ปลอดภัย + เร็ว
--
-- Idempotent: รันซ้ำได้ (DROP IF EXISTS + CREATE)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── tb_session_log ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "session_log_select_own" ON tb_session_log;
CREATE POLICY "session_log_select_own"
  ON tb_session_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── tb_logout_log ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "logout_log_select_own" ON tb_logout_log;
CREATE POLICY "logout_log_select_own"
  ON tb_logout_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── tb_login_log ───────────────────────────────────────────────────────────
-- หมายเหตุ: login_log มี row ที่ failed login (success=false, user_id=null) ที่ user ไม่ควรเห็น
-- → policy เห็นเฉพาะ success=true ของตัวเอง
DROP POLICY IF EXISTS "login_log_select_own_success" ON tb_login_log;
CREATE POLICY "login_log_select_own_success"
  ON tb_login_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND success = true);

-- ═══════════════════════════════════════════════════════════════════════════
-- Verify policies:
-- SELECT pg_class.relname AS tbl, pg_policy.polname, pg_get_expr(pg_policy.polqual, pg_policy.polrelid) AS using_expr
-- FROM pg_policy JOIN pg_class ON pg_policy.polrelid = pg_class.oid
-- WHERE pg_class.relname IN ('tb_session_log','tb_logout_log','tb_login_log')
-- ORDER BY tbl, polname;
-- ═══════════════════════════════════════════════════════════════════════════
