-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2 Step 2 — pg_cron auto-refresh MV activity log (v0.7.15.3)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- เหตุผล:
-- - ตอนนี้ admin ต้องกดปุ่ม "รีเฟรชล่าสุด" เองเพื่อ trigger REFRESH MV
-- - ขอ schedule auto refresh ทุก 5 นาที (acceptable staleness สำหรับ audit log)
-- - admin ไม่ต้องกดปุ่มเอง (แต่ปุ่มยังคงอยู่ ใช้ตอนต้องการดูข้อมูล real-time)
--
-- ใช้ pg_cron extension (Supabase รองรับใน free tier)
--
-- Idempotent: unschedule job เก่า + schedule ใหม่
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. เปิด extension pg_cron (ถ้ายังไม่เปิด) ─────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── 2. unschedule job เก่า (ถ้ามี) เพื่อกัน duplicate ──────────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT jobid FROM cron.job WHERE jobname = 'refresh_mv_activity_log_5min'
  LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
END $$;

-- ── 3. Schedule REFRESH MV ทุก 5 นาที ──────────────────────────────────────
-- cron expression: '*/5 * * * *' = ทุก 5 นาที
-- รัน SQL: REFRESH MATERIALIZED VIEW (ไม่ใช้ CONCURRENTLY เพราะไม่มี unique index)
SELECT cron.schedule(
  'refresh_mv_activity_log_5min',
  '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW public.mv_activity_log$$
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Verify:
-- SELECT jobid, jobname, schedule, command, active FROM cron.job
--   WHERE jobname = 'refresh_mv_activity_log_5min';
--
-- ดู history:
-- SELECT * FROM cron.job_run_details
--   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh_mv_activity_log_5min')
--   ORDER BY start_time DESC LIMIT 10;
--
-- หยุด job (ถ้าต้องการ):
-- SELECT cron.unschedule('refresh_mv_activity_log_5min');
-- ═══════════════════════════════════════════════════════════════════════════
