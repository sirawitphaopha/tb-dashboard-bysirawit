---
name: session-tb-dashboard-2026-05-20
description: "Session 2026-05-20 — ปรับ Memory/Agent system + Bug Audit ข้อ 6, 8 + ปรับหน้า Register ครั้งใหญ่ — v0.7.9.6"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4c32d047-50a1-47bd-afc4-50172419a488
---

# TB Dashboard session 2026-05-20

**version:** v0.7.9.5 → v0.7.9.6
**commit:** 628a585

---

## สิ่งที่ทำในวันนี้

### ปรับระบบ Memory
- รวมกฎเหล็กทั้งหมด inline ใน MEMORY.md (ไม่ต้องเปิดไฟล์แยก)
- เพิ่มกฎ: บันทึก session ทุกครั้งหลัง push สำเร็จ

### ตั้งทีม Agent
- **แคลร์** — หัวหน้า คุยกับพี่กัน สั่งงาน อบอุ่น ขี้เล่น
- **เค** — ตัวทำงาน ผู้ชาย อบอุ่น เรียก "คุณ"
- **คลอ** — ตัวตรวจ ผู้หญิง ขี้อาย เงียบๆ เรียก "พี่/พี่กัน"
- บันทึกไว้ใน team_agents.md

### Bug Audit ข้อ 6 — License duplicate check
- เดิม: ดึงทุก profile มา filter เอง
- แก้: query เฉพาะวิชาชีพเดียวกัน + เฉพาะ format ที่น่าซ้ำ
- แพทย์เลข 12345 กับเภสัช 12345 ไม่ซ้ำกันแล้ว

### Bug Audit ข้อ 7 — Race condition reject
- ข้าม — ตอนนี้มี admin คนเดียว ค่อยทำเมื่อมี admin คนที่ 2

### Bug Audit ข้อ 8 — เบอร์โทร optional
- เปลี่ยนเป็น required
- รอทำ OTP ตอนพร้อม budget

### ปรับหน้า Register ครั้งใหญ่ (app/register/page.tsx + app/api/register/route.ts)

**วิชาชีพ:**
- เปลี่ยน "เจ้าหน้าที่สาธารณสุข" → "นักสาธารณสุข" (prefix สธ.)
- เพิ่ม "นักวิชาการสาธารณสุข" (ไม่มี prefix)
- แยกพยาบาลเป็น 2 ประเภท: ชั้นหนึ่ง (ป.) / เทคนิคชั้นสอง (ช.)
- เพิ่ม prefix ครบ: ทน./ก./รส.

**บังคับกรอก:**
- เบอร์โทร → required
- เลขใบประกอบวิชาชีพ → required เฉพาะวิชาชีพที่มี prefix (8 วิชาชีพ)
- ทุกช่องบังคับมีดอกจันแดง (*)

**UI:**
- แปลง label ภาษาอังกฤษ → ภาษาไทย

---

## ค้างต่อ
- Bug Audit ข้อ 9-12 ยังไม่ได้เริ่ม
- ข้อ 2, 3-4 deploy แล้ว รอเทสจริง
