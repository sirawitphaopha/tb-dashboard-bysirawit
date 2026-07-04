---
name: session_tb_dashboard_2026_05_20_part3
description: "v0.7.10.1 — Admin Edit Self, User Request Edit System, UI Language Fix ครบ, push สำเร็จ"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4c32d047-50a1-47bd-afc4-50172419a488
---

# TB Dashboard session 2026-05-20 part 3

**commit:** a3280c8  
**version:** v0.7.10.1  
**branch:** main → origin/main (push สำเร็จ)

---

## สิ่งที่ทำใน session นี้

### 1. Admin แก้ข้อมูลตัวเองได้ inline (edit-self)
- สร้าง `app/api/admin/edit-self/route.ts` ใหม่
- Admin กดปุ่มปากกาแก้ field ได้ในหน้าโปรไฟล์โดยตรง
- บันทึก log ลง tb_profile_edit_log ทุกครั้ง (edited_by = ตัวเอง)

### 2. User ส่งคำขอแก้ข้อมูล (request-edit)
- สร้าง `app/api/profile/request-edit/route.ts` ใหม่
- บันทึกลง tb_profile_edit_requests (status = 'pending')
- ส่งเมลแจ้ง Admin ผ่าน template adminEditRequestEmail
- RequestEditModal เปลี่ยนจาก alert() หลอก → API จริงครบ flow
  - busy state ตอนส่ง, sent state ตอนสำเร็จ, ปิดอัตโนมัติ 1.5s

### 3. Admin แก้ User แล้วส่งเมลแจ้ง User (edit-user)
- `app/api/admin/edit-user/route.ts` เพิ่มส่งเมล
- template userProfileEditedEmail แสดงตารางก่อน/หลัง

### 4. Email Templates เพิ่ม 2 อัน (lib/email-templates.ts)
- Template 13: adminEditRequestEmail — แจ้ง Admin เมื่อ User ขอแก้
- Template 14: userProfileEditedEmail — แจ้ง User เมื่อ Admin แก้ให้

### 5. UI Changes (tb-app.jsx)
- UserProfileModal: ลบ X ออก, backdrop ไม่ปิด modal
- warnClose popup: ถ้ากำลังแก้ค้างแล้วกดปิด → ถามยืนยัน
- Admin profile: ทุก field มีปุ่มปากกา amber แก้ inline ได้

### 6. UI Changes (tb-modals.jsx)
- AdminUsersTab: ปุ่มแก้ไขใน card/list ทุกสถานะ
- Edit modal popup พร้อม form ครบทุก field

### 7. ลบ ค่ะ/นะคะ ออกจาก UI ทั้งหมด — 11 จุด
- tb-app.jsx: 8 จุด
- tb-modals.jsx: 3 จุด
- บันทึก feedback ลงเมม: feedback_ui_language.md

---

## Pending ต่อไป
- Bug Audit ข้อ 9-12 ยังไม่ได้เริ่ม
- รูปโปรไฟล์ user (roadmap อนาคต)
- เทส RequestEditModal จริงบนเว็บ
- เทส edit-self จริงบนเว็บ
