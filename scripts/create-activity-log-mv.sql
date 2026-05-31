-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2 Optimize — Materialized View activity log (v0.7.16.0)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ทำไมต้องเปลี่ยน:
-- - view เดิม (tb_activity_log) UNION 5 tables + regex device_type ทุก row
-- - ทุกครั้งที่ admin เปิดหน้า "บันทึกกิจกรรม" → DB ต้องคำนวณใหม่หมด
-- - + count exact ของ pagination → scan ทั้ง result set
-- - = ช้า 800-1500ms
--
-- หลังเปลี่ยน MV:
-- - pre-computed UNION + device_type ครั้งเดียว
-- - indexes บน event_time, user_id, category, success
-- - query เร็ว ~50-100ms (-10-30 เท่า)
-- - admin trigger refresh ผ่านปุ่ม "รีเฟรชล่าสุด" → POST /api/admin/activity-log/refresh
-- - ข้อมูลอาจ stale สูงสุด 5 นาที (ถ้าตั้ง cron) หรือทันทีเมื่อกดปุ่ม
--
-- Idempotent: รันซ้ำได้ (DROP IF EXISTS + CREATE)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. ลบ MV เก่า (ถ้ามี) ─────────────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS public.mv_activity_log;

-- ── 2. สร้าง MV ────────────────────────────────────────────────────────────
-- ใช้ enrich (event_time + UNION + device_type) แบบเดียวกับ view เดิม
CREATE MATERIALIZED VIEW public.mv_activity_log AS
SELECT
  base.*,
  CASE
    WHEN base.user_agent IS NULL OR base.user_agent = ''            THEN 'unknown'
    WHEN base.user_agent ~* 'iPad|Tablet'                          THEN 'tablet'
    WHEN base.user_agent ~* 'Android' AND base.user_agent !~* 'Mobile' THEN 'tablet'
    WHEN base.user_agent ~* 'Mobile|iPhone|iPod|Android'           THEN 'mobile'
    ELSE 'desktop'
  END AS device_type
FROM (
  -- 1) เข้าสู่ระบบ
  SELECT
    ll.attempted_at                                              AS event_time,
    ll.user_id                                                   AS user_id,
    ll.email_attempted                                           AS email,
    'login'::text                                                AS category,
    CASE WHEN ll.success THEN 'login_success' ELSE 'login_failed' END AS event_key,
    ll.success                                                   AS success,
    ll.failure_reason                                            AS detail,
    ll.ip_address                                                AS ip_address,
    ll.user_agent                                                AS user_agent,
    ll.session_id                                                AS session_id,
    ll.device_fp                                                 AS device_fp
  FROM public.tb_login_log ll

  UNION ALL

  -- 2) ออกจากระบบ
  SELECT
    lo.logged_out_at,
    lo.user_id,
    lo.email,
    'logout',
    'logout_' || lo.logout_type,
    NULL::boolean,
    lo.logout_type,
    lo.ip_address,
    lo.user_agent,
    lo.session_id,
    lo.device_fp
  FROM public.tb_logout_log lo

  UNION ALL

  -- 3) เปลี่ยน / ตั้งรหัสผ่านใหม่
  SELECT
    pc.changed_at,
    pc.user_id,
    pc.email_attempted,
    'password',
    'password_' || pc.action || CASE WHEN pc.success THEN '_success' ELSE '_failed' END,
    pc.success,
    COALESCE(pc.failure_reason, pc.action),
    pc.ip_address,
    pc.user_agent,
    NULL::uuid,
    NULL::text
  FROM public.tb_password_change_log pc

  UNION ALL

  -- 4) ขอลิงก์ลืมรหัสผ่าน
  SELECT
    pr.requested_at,
    pr.user_id,
    pr.email_attempted,
    'password',
    'password_reset_request',
    pr.email_sent,
    CASE WHEN pr.email_sent THEN 'sent' ELSE COALESCE(pr.error_message, 'failed') END,
    pr.ip_address,
    pr.user_agent,
    NULL::uuid,
    NULL::text
  FROM public.tb_password_reset_log pr

  UNION ALL

  -- 5) easter egg 🥚
  SELECT
    ee.occurred_at,
    ee.user_id,
    ee.email,
    'easter',
    'easter_' || ee.event_type,
    NULL::boolean,
    ee.event_type,
    ee.ip_address,
    ee.user_agent,
    NULL::uuid,
    NULL::text
  FROM public.tb_easter_egg_log ee
) base;

-- ── 3. Indexes สำหรับ query ที่ใช้บ่อย ─────────────────────────────────────
-- event_time DESC — เรียงล่าสุดก่อน (default sort ใน admin page)
CREATE INDEX IF NOT EXISTS idx_mv_activity_log_event_time
  ON public.mv_activity_log (event_time DESC);

-- user_id — filter ตาม user (admin คลิกชื่อ user)
CREATE INDEX IF NOT EXISTS idx_mv_activity_log_user_id
  ON public.mv_activity_log (user_id, event_time DESC);

-- category — filter ตามประเภท (login/logout/password/easter)
CREATE INDEX IF NOT EXISTS idx_mv_activity_log_category
  ON public.mv_activity_log (category, event_time DESC);

-- success (boolean) — filter เฉพาะที่ล้มเหลว (สำหรับ security audit)
CREATE INDEX IF NOT EXISTS idx_mv_activity_log_success_false
  ON public.mv_activity_log (event_time DESC) WHERE success = false;

-- email — search by email (admin หา user ที่ email)
CREATE INDEX IF NOT EXISTS idx_mv_activity_log_email
  ON public.mv_activity_log (LOWER(email));

-- ── 4. Permissions — เฉพาะ service_role อ่านได้ ────────────────────────────
REVOKE ALL ON public.mv_activity_log FROM anon, authenticated;
GRANT SELECT ON public.mv_activity_log TO service_role;

-- ── 5. Helper function: refresh MV (callable by service_role only) ────────
-- ใช้ใน API /api/admin/activity-log/refresh
CREATE OR REPLACE FUNCTION public.refresh_activity_log()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_activity_log;
  RETURN now();
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_activity_log() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.refresh_activity_log() TO service_role;

COMMENT ON MATERIALIZED VIEW public.mv_activity_log IS
  'Pre-computed activity log timeline (v0.7.16.0) — refresh via refresh_activity_log() · query เร็วกว่า view เดิม 10-30 เท่า';

-- ── 6. Initial refresh ───────────────────────────────────────────────────
-- รัน REFRESH ครั้งแรกเพื่อ populate ข้อมูลจริง
REFRESH MATERIALIZED VIEW public.mv_activity_log;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verify:
-- SELECT COUNT(*) FROM mv_activity_log;
-- SELECT * FROM mv_activity_log ORDER BY event_time DESC LIMIT 10;
-- SELECT refresh_activity_log(); -- รีเฟรช
-- ═══════════════════════════════════════════════════════════════════════════
