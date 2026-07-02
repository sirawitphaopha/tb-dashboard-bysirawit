-- ════════════════════════════════════════════════════════════════════════
-- 📊 ฟังก์ชันดึงขนาดฐานข้อมูล (ไว้แสดงแถบพื้นที่ใช้งาน — แอดมิน)
-- สร้าง/รัน 2026-07-02 (ผ่าน Supabase MCP)
-- ════════════════════════════════════════════════════════════════════════
-- supabase-js เรียก raw SQL ตรงไม่ได้ → ทำเป็น RPC function
-- SECURITY DEFINER เพื่อให้เรียก pg_database_size ได้ · เรียกผ่าน admin client เท่านั้น

create or replace function public.get_db_size()
returns bigint
language sql
security definer
set search_path = public
as $$
  select pg_database_size(current_database());
$$;

grant execute on function public.get_db_size() to service_role;
