---
name: session_tb_dashboard_2026_05_20_part4
description: v0.7.10.2 — ระบบคำขอแก้ไขข้อมูลครบวงจร (อนุมัติ/ปฏิเสธ+กระดิ่ง+เมล) push แล้ว ⚠️ ยังไม่ได้เทส
metadata: 
  node_type: memory
  type: project
  originSessionId: 4c32d047-50a1-47bd-afc4-50172419a488
---

# TB Dashboard session 2026-05-20 part 4

**commit:** 3163818
**version:** v0.7.10.2
**branch:** main → origin/main (push สำเร็จ)

## 🚨 สถานะ: ยังไม่ได้เทส — เดี๋ยวพี่กันกลับมาเทส
พี่กันไปพักก่อน push แล้วแต่ยังไม่ได้ทดสอบ flow จริงในเว็บ ครั้งหน้ามาต้องเทสตามขั้นตอนด้านล่าง

## ✅ ทำอะไรไปบ้าง (ระบบคำขอแก้ไขข้อมูลครบวงจร)

### Backend
- **API ใหม่** `/api/admin/approve-edit-request` — admin อนุมัติ→อัปเดต profiles อัตโนมัติ+log+เมล+กระดิ่ง / ปฏิเสธ→เหตุผล+เมล+กระดิ่ง
- แปลงค่าก่อนบันทึก: วิชาชีพ ไทย→key, เลขใบประกอบ user กรอกแค่ตัวเลข→ระบบเติม prefix ตามวิชาชีพ (ภ./ว./ท./ป.) + กันซ้ำ
- `request-edit` เพิ่มเมลยืนยันกลับ user
- email templates ใหม่ 3 อัน: received/approved/rejected
- tb-data.js: `loadPendingEditRequests()`

### Frontend
- กระดิ่ง admin ขึ้นเลขแดง แต่ละคำขอแยกรายการ กด→เด้งไป user คนนั้น+ไฮไลต์เหลือง + realtime
- กระดิ่ง user รองรับ type edit_request_approved/rejected
- หน้าจัดการผู้ใช้: กล่องคำขอสีอำพันใต้ user (เดิม→ใหม่+เหตุผล)+ปุ่มอนุมัติ/ปฏิเสธ+badge นับ
- modal ปฏิเสธคำขอใส่เหตุผล
- **ปุ่มแก้ไขข้อมูลย้ายไปแท็บ "อนุมัติแล้ว" เท่านั้น** (filter==='approved') — พี่กันเลือกแบบนี้ (ไม่ใช่ตาม p.status)
- RequestEditModal: แยกชื่อ/นามสกุล 2 ช่อง, key ตรงคอลัมน์จริง, เลขใบประกอบกรอกแค่ตัวเลข+hint, กล่องสำเร็จไม่ปิดเอง

### Database
- `scripts/add-edit-request-review.sql` — **พี่กันรันใน Supabase แล้ว** (Success no rows returned)
  - เพิ่มคอลัมน์ reviewed_by/reviewed_at/review_note/reviewer_name_at_review
  - tb_notifications patient_name → nullable
  - RLS: admin อ่านคำขอได้ / user อ่าน-สร้างของตัวเอง

## 📋 ขั้นตอนเทสครั้งหน้า
1. **user**: เปิดโปรไฟล์→ขอแก้ field (ลองเลขใบประกอบกรอกแค่ตัวเลข + วิชาชีพ)→กล่องเขียวค้าง กดปิดเอง→เช็คเมลยืนยัน
2. **admin**: เช็คกระดิ่งเลขแดง→กดรายการ→เด้งไป user+ไฮไลต์→เห็นกล่องคำขอสีอำพัน
3. **อนุมัติ**: กดอนุมัติ→ข้อมูลเปลี่ยนจริง (เลขใบประกอบมี prefix ภ. เติมให้)→user ได้เมล+กระดิ่ง
4. **ปุ่มแก้ไข**: เช็คว่าโผล่เฉพาะแท็บ "อนุมัติแล้ว" เท่านั้น
5. คำขอเก่า (key 'license' เดิม) อนุมัติไม่ได้ → ให้ปฏิเสธทิ้ง

## ⚠️ ก่อน production จริง
- ถ้า Supabase prod เป็นคนละตัวกับที่รัน SQL → ต้องรัน add-edit-request-review.sql บน prod ด้วย
- env vars + Cloudflare ตามปกติ
