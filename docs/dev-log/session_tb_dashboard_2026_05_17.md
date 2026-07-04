---
name: session_tb_dashboard_2026_05_17
description: "TB Dashboard session 2026-05-17 — ต่อจาก v0.7.4, ระบบ re-register หลัง reject, เริ่ม session ใหม่"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9e58b3a2-1f96-401c-b4fe-8e7091d402a8
---

# TB Dashboard — Session 2026-05-17

## สรุปงานที่ทำใน session ก่อน (2026-05-16 evening → v0.7.4)

### ระบบที่สร้างเสร็จแล้ว (ยังไม่ push จนกว่า confirm)

1. **Trash System (Step 1–3)**
   - `scripts/add-trash-system.sql` — soft delete columns + tb_delete_requests + tb_patients_deleted_log + pg_cron purge 60 วัน
   - `scripts/fix-schema-and-profiles-rls.sql` — เพิ่ม 20+ columns ที่หายไป + แก้ RLS infinite recursion ด้วย SECURITY DEFINER functions
   - `public/tb-data.js` — session bridge + softDelete/restore/hardDelete/loadTrashedPatients functions
   - `public/tb-app.jsx` — currentUser.id, pendingUserCount, delete/restore handlers, sidebar admin-users tab, bell badge
   - `public/tb-modals.jsx` — PharmSummaryTab delete button + 2 dialogs, TrashList, AdminUsersTab (teal theme), notification admin alert

2. **Session Bridge Fix** (`app/api/auth/session/route.ts`)
   - แก้ iframe ไม่ส่ง session ให้ Supabase → patients ไม่บันทึก

3. **Admin Notification System**
   - Sidebar tab "จัดการผู้ใช้" (admin only) + badge นับ pending users
   - Bell notification แสดง admin alert เมื่อมี pending
   - Email admin เมื่อมี user ใหม่

4. **Rejected User Re-registration** (ต่อล่าสุด)
   - `app/api/register/route.ts` — ถ้า email เดิม + status rejected → อัปเดตรหัสผ่าน + reset เป็น pending
   - `lib/email-templates.ts` — email reject มีกล่อง "สมัครใหม่ได้" + ปุ่มลิงก์ /register
   - `app/api/admin/reject/route.ts` — ส่ง baseUrl ให้ email template
   - `app/api/admin/hard-delete-user/route.ts` — ลบถาวร (rejected users only)
   - `public/tb-modals.jsx` — ปุ่ม 🔥 ลบถาวร ใน list/card view + confirm modal

5. **Dev cleanup**
   - ลบ dev_session backdoor ออกจาก login/page.tsx, middleware.ts, app/page.tsx, api/auth/signout

6. **Version:** login/page.tsx + public/tb-app.jsx → v0.7.4
   - Commit: 64637d6 (reset soft หลัง commit version ผิด)

## สถานะ commit/push
- **Committed:** v0.7.4 (64637d6)
- **Push status:** ยังไม่ push — ต้องถามพี่กันก่อน

## Pending Steps ต่อ
- Step 5: ยืนยัน admin email ทำงาน (รอเทส)
- Step 6: User-side delete request button (ผู้ใช้ทั่วไปขอลบ)
- Step 7: Bell + Email สำหรับ delete requests
- Step 8: เทส pg_cron auto-purge 60 วัน
- Long-term: wrangler.toml เก็บ env vars ข้าม deploy

## หมายเหตุสำคัญ
- ADMIN_EMAIL ใน Cloudflare Runtime env หายทุกครั้ง deploy — พี่กันต้องเพิ่มใหม่ทุกครั้ง (หรือทำ wrangler.toml)
- pg_cron ต้องเปิดใน Supabase Dashboard (Extensions) ก่อนใช้งาน
- tb_patients.id เป็น text ไม่ใช่ uuid — sql scripts ปรับแล้ว
