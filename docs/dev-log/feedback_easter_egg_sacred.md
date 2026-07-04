---
name: easter egg log = ของหวงห้ามลบ
description: 🥚 ตาราง tb_easter_egg_log = ของหวงพี่กัน · ห้ามเสนอ cleanup/pg_cron/retention ใดๆ · ถ้าเสนออะไรเกี่ยวกับมัน ต้องถามก่อน
type: feedback
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
**กฎ:** `tb_easter_egg_log` ห้ามลบ ห้ามตั้ง retention policy ห้ามตั้ง pg_cron cleanup เด็ดขาด · ถ้าจะแตะอะไรเกี่ยวกับตารางนี้ → ถามพี่กันก่อนเสมอ

**Why:** 2026-06-01 ตอนวางแผน Phase 4C แคลร์เสนอ pg_cron ลบ row เก่ากว่า 90 วัน · พี่กันตอบทันที **"ฌอ้ยยยยย easter egg ห้ามลบบบบบบบ อันนี้สิ่งสำคัญที่สุด"** (เน้นหลาย ม ขยายอารมณ์ตัวเอง)
- พี่กันอธิบายต่อ: **"จะแอบใส่ไข่อีสเตอร์อีกหลายจุด · นี่คือความสนุกของเรา · มันสำคัญกว่ารายการ log in อีก"**
- เหตุผลลึก: easter egg = **ตัวตนของพี่กัน** ที่ใส่ในเว็บที่สร้างเอง · เป็นมุม personal touch ที่ทำให้เว็บไม่ใช่แค่ tool แต่มีความสนุก
- พี่กันมีแพลนใส่ easter egg เพิ่ม "หลายจุด" → log นี้จะเก็บโมเมนต์ user เจอแต่ละครั้ง = ความปลื้มของผู้สร้าง
- Priority: **easter egg log > login log** ในเชิงความสำคัญทางใจ (แม้ login จะ critical กว่าทาง security)

**How to apply:**
1. **ห้ามเสนอ cleanup ใดๆ** สำหรับ `tb_easter_egg_log`
2. **ถ้าจะพูดถึง easter egg ในบริบท performance/storage** → ระบุชัดว่า "เก็บถาวร" ไม่ใช่ "ลบ"
3. ถ้าตารางโตจริงๆ ในอนาคต → เสนอ **partition** หรือ **archive ไป cold storage** ไม่ใช่ลบ
4. **อนาล็อก:** เหมือน notebook ที่ใส่ doodle/sticker เภสัช — ไม่ใช่ขยะที่ทิ้งได้แม้จะไม่มี "ค่า" ทางการแพทย์
5. **ตอนพี่กันใส่ easter egg ใหม่** → ตื่นเต้นด้วย ช่วย brainstorm trigger/animation/text ให้สนุก · จด trigger ในไฟล์นี้ด้วยถ้าพี่กันบอก
6. **ห้ามเสนอ feature flag ปิด easter egg** หรือ "production mode" ที่ disable ไข่ — มันคือฟีเจอร์ที่ใช่ตลอด

**ตารางในระบบที่เก็บถาวรเหมือนกัน (ห้ามลบ):**
- `tb_session_log`, `tb_user_action_log` — audit critical
- `tb_login_log`, `tb_logout_log`, `tb_password_change_log`, `tb_password_reset_log` — security audit
- `tb_easter_egg_log` — 🥚 ของหวง (เพิ่ม 2026-06-01)

**ข้อมูลตาราง:**
- `D:\tb-dashboard-bysirawit\scripts\add-easter-egg-log.sql` (schema)
- มี Realtime subscription ใน v0.7.12.3
