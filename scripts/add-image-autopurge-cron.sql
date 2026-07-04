-- ════════════════════════════════════════════════════════════════════════
-- 🧹 auto-purge รูปในถังขยะเกิน 60 วัน (row + ไฟล์ R2) — v0.7.20
-- Project: cioswzdbonnbhbyynrhh.supabase.co
-- ════════════════════════════════════════════════════════════════════════
-- รูปมีไฟล์บน Cloudflare R2 ที่ SQL ล้วนๆ ลบไม่ได้ → ให้ pg_cron เรียก API route
-- (/api/cron/purge-images) ผ่าน pg_net · route ลบทั้ง row + ไฟล์ R2 ให้
--
-- ⚠️⚠️ ก่อนรัน SQL นี้ ทำตามลำดับ:
--   1) สร้างค่า CRON_SECRET (สุ่ม) — แคลร์ให้ไว้ในแชต
--   2) ตั้ง env CRON_SECRET บน Cloudflare Pages (Settings → Environment variables → Runtime)
--      + ใส่ใน .env.local ด้วย (ค่าเดียวกัน)  แล้ว redeploy
--   3) แทนคำว่า  PUT_CRON_SECRET_HERE  ด้านล่างด้วยค่า CRON_SECRET เดียวกัน
--   4) เปิด extension pg_net (Supabase → Database → Extensions → ค้นหา pg_net → Enable)
--   5) ค่อยรัน SQL นี้
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ลบ cron เก่า (ถ้ามี) แล้วสร้างใหม่
select cron.unschedule('purge_images_60d') where exists (
  select 1 from cron.job where jobname = 'purge_images_60d'
);

select cron.schedule(
  'purge_images_60d',
  '0 19 * * *',   -- 19:00 UTC = 02:00 น. ไทย (รายวัน)
  $$
    select net.http_post(
      url     := 'https://tbjourney.care/api/cron/purge-images',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', 'PUT_CRON_SECRET_HERE'
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- ✅ ตรวจสอบว่า cron ถูกตั้ง:
--    select jobname, schedule, active from cron.job where jobname = 'purge_images_60d';
-- ════════════════════════════════════════════════════════════════════════
