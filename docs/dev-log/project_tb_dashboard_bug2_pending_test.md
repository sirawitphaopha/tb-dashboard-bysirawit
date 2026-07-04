---
name: project-tb-dashboard-bug2-pending-test
description: 🧪 Bug Audit ข้อ 2 — hard-delete-user FK fix + Snapshot Pattern — ยังไม่ได้ทดสอบ
metadata:
  node_type: memory
  type: project
  originSessionId: current
---

# 🧪 Bug ข้อ 2 — แก้โค้ดแล้ว ยังไม่ได้เทส

**บันทึก:** 2026-05-19

## สถานะ

- ✅ SQL รันบน Supabase แล้ว (`scripts/add-user-name-snapshots.sql`) — success no rows returned
- ✅ แก้โค้ดเสร็จ 3 ไฟล์:
  - `public/tb-data.js` — helper `_fetchUserDisplayName` + 5 ฟังก์ชัน (soft/restore/submit/approve/reject)
  - `public/tb-modals.jsx` — fallback display 2 จุด (cancelled list, AuditLogTab)
  - `app/api/admin/hard-delete-user/route.ts` — เอา explicit delete tb_delete_requests ออก
- ✅ commit + push แล้ว (v0.7.9.1, commit 16b3e40, 2026-05-19)
- ⏳ **ยังไม่ได้ทดสอบ** — พี่กันขี้เกียจเทสตอนนี้ บอกว่าจะเทสในอนาคต
- 📌 ย้ายเข้า Bug Audit เป็น **ข้อ 13 (รอเทส)** ดู [[project_tb_dashboard_bugs_2026_05_18]]

**Why:** พี่กันบอก deploy ก่อน เทสทีหลัง เพราะมั่นใจในการ implement (snapshot pattern เหมือน reject log ที่เคยทำสำเร็จใน v0.7.8.2)

**How to apply:**
- session ใหม่มาคุยกัน ถ้าพี่กันถามว่า "bug ข้อ 2 เทสยัง" → ตอบว่ายัง พร้อมเส้นทางเทสด้านล่าง
- ถ้าพี่กันเทสเจอปัญหา → แก้ inline ทันที (กฎ [[feedback_fix_urgent_inline]])
- เมื่อเทสผ่านครบ → ลบ memory ไฟล์นี้ + ปิดข้อ 13 ใน bug audit

## เส้นทางที่ต้องเทส (เผื่อพี่กันถาม)

1. ยื่นคำขอลบคนไข้ (user) → เช็ค `tb_delete_requests.requester_name_at_request`
2. approve/reject คำขอ (admin) → เช็ค `reviewer_name_at_review`
3. soft delete คนไข้ตรง ๆ → เช็ค `tb_patients.deleter_name_at_delete`
4. restore คนไข้ → เช็คว่าเป็น null แล้ว
5. hard delete คนไข้ → เช็ค `tb_patients_deleted_log.deleter_name_at_delete` (มาจาก trigger)
6. ลบบัญชี user ถาวร (hard-delete-user) → ดูว่าไม่ FK error และชื่อใน log ยังอยู่ + ป้าย "(ผู้ใช้ถูกลบออกจากระบบแล้ว)" โผล่

## ที่เกี่ยวข้อง
- [[project_tb_dashboard_bugs_2026_05_18]] — Bug audit list
- [[session_tb_dashboard_2026_05_18]] — session ก่อนหน้า
