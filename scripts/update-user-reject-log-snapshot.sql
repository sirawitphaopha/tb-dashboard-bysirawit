-- ============================================================
-- เพิ่มคอลัมน์ snapshot ใน tb_user_reject_log
-- เก็บข้อมูล user ตอนที่ถูก reject (ไม่ใช่ปัจจุบัน)
-- ============================================================

-- 1) เพิ่มคอลัมน์ snapshot
alter table public.tb_user_reject_log
  add column if not exists username_at_reject   text,
  add column if not exists first_name_at_reject text,
  add column if not exists last_name_at_reject  text,
  add column if not exists email_at_reject      text;

-- ⚠️ 2) คำสั่งลบข้อมูลทดสอบ — รันไปแล้วครั้งเดียวเมื่อ 2026-05-18
--
-- 🚨 คำเตือน: คำสั่งข้างล่างถูก "ปิดการทำงาน" ไว้ด้วยเครื่องหมาย -- หน้าบรรทัด
--    (เครื่องหมาย -- บอกระบบว่า "ข้าม ไม่ต้องทำคำสั่งนี้")
--
-- 🚨 ห้ามลบเครื่องหมาย -- หน้าบรรทัดล่างออกเด็ดขาด!
--    เพราะถ้าลบออก = ระบบจะลบประวัติการปฏิเสธทั้งหมดในตารางทันที
--
-- ถ้าวันหลังจำเป็นต้องล้างข้อมูล กรุณารันใน Supabase SQL Editor ด้วยมือ
-- พร้อมพิจารณาผลกระทบทุกครั้ง อย่ารันจากไฟล์นี้
--
-- delete from public.tb_user_reject_log;
