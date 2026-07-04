---
name: tb-dashboard-roadmap
description: รายการที่ต้องทำในอนาคตสำหรับ TB CARE & JOURNEY — เรียงตาม priority
metadata: 
  node_type: memory
  type: project
  originSessionId: 92e270da-2652-4d4f-8507-b3a3d855ba94
---

# 🗺 TB CARE & JOURNEY — Roadmap

อัปเดต: 2026-05-15

---

## 🔴 ก่อน Launch จริง (ทำก่อนเปิดให้คนภายนอกใช้)

### 1. ซื้อ Domain + Verify ใน Resend
- **Domain ที่เลือกแล้ว (2026-05-16):** `tbjourney.care`
  - ราคา $34/ปี (~1,200 บาท)
  - ซื้อผ่าน Cloudflare Registrar (เชื่อม Pages ง่าย)
  - มีคำครบ TB + Journey + Care (เรียงต่างจาก brand "TB CARE & JOURNEY" แต่อ่านสวย)
  - Read naturally: "TB Journey, with Care"
- ไปที่ Resend → Domains → Add Domain `tbjourney.care` → verify DNS records (SPF/DKIM/DMARC)
- เปลี่ยน `EMAIL_FROM` ใน `lib/resend.ts` จาก `onboarding@resend.dev` เป็น `noreply@tbjourney.care`
- **เหตุผล:** Hotmail/Gmail/Outlook ไม่ค่อยเชื่อ `resend.dev` → เมลเข้า spam บ่อย
  ถ้าใช้ domain ของเราเอง + verify SPF/DKIM → ไม่เข้า spam แล้ว
- หลัง verify domain → ปลดล็อกส่งเมลให้ user ที่ไม่ใช่ gmail signup ได้ → ทดสอบ approve/reject ครบ flow ได้

### 2. ตั้ง Env Vars บน Cloudflare Pages (ก่อน push deploy)
- ดู [[knowledge_env_production]]
- ทำก่อน push ที่มี breaking change ครั้งแรก
- ทุก env ใน `.env.local` ต้องไป mirror บน Cloudflare

### 3. ตั้ง Site URL + Redirect URLs ใน Supabase Auth
- Supabase → Authentication → URL Configuration
- Site URL: URL จริงของเว็บ (เช่น `https://tb-dashboard.pages.dev`)
- Redirect URLs: เพิ่มหน้าที่ user จะถูก redirect (login, reset-password, ฯลฯ)

### 4. Bootstrap Admin บัญชีแรก
- หลังพี่กัน register ตัวเองครั้งแรก → ต้องรัน SQL ตั้งให้เป็น admin + approved
- คำสั่ง: `update profiles set role='admin', status='approved' where username='<your_username>';`

---

## 🟡 ฟีเจอร์ขั้นต่อไป (หลัง Phase 1 backend เสร็จ)

### 5. ระบบเปลี่ยนรหัสผ่านจริง
- ตอนนี้ปุ่ม "เปลี่ยนรหัสผ่าน" ใน Profile modal disabled อยู่
- ต้องสร้าง flow `/reset-password` (Supabase magic link)
- หรือ modal กรอก current+new+confirm

### 6. Profile Modal — เชื่อม data จริง
- ลบ `DEMO_USER` ออกจาก `public/tb-app.jsx`
- Fetch จาก `/api/profile/me` (สร้างเพิ่ม)
- Wire ปุ่ม self-edit (เบอร์โทร, แผนก) → POST `/api/profile/update`
- Wire ปุ่ม approval-required edit → POST `/api/profile/request-edit`

### 7. Login ด้วย Username (ไม่ใช่แค่ Email)
- ตอนนี้ login รับเฉพาะ email
- ต้องการ: ใส่ username ก็ login ได้ (lookup username → email ก่อน)
- ✅ ทำเสร็จแล้วใน v0.7.2 (`/api/login-lookup`)

### 7.1 ตั้ง Session Timeout 12 ชั่วโมง (เผื่อ PDPA)
- ปัจจุบัน Supabase default = ไม่หมดอายุ (logged in ตลอดจนกว่าจะ logout เอง)
- พี่กันต้องการ: **Max session 12 ชั่วโมง** (เหมาะกับเภสัชทำงานข้ามเวร)
- เพิ่มเติม (optional): auto-logout ถ้าไม่ active 30 นาที + แจ้งเตือน 2 นาทีก่อนหมด

**ปัญหาที่เจอ 2026-05-16:** Supabase Dashboard → Authentication → Sessions
ตั้งค่า "Time-box user sessions" + "Inactivity timeout" **ต้อง Pro Plan ($25/เดือน)**

**ทางเลือกที่บันทึกไว้:**

**Option A — ปล่อยไปก่อน (ตอนนี้ใช้อันนี้)**
- ไม่ทำ session timeout
- ตอนนี้คนใช้คือพี่กันคนเดียว risk ต่ำ
- เมื่อ scale ขึ้นค่อยจัดการ — อาจซื้อ Pro plan หรือทำ B

**Option B — Implement เองฝั่ง code (ฟรี)**
- เก็บ login timestamp ใน cookie หรือ localStorage ตอน login สำเร็จ
- ในทุก page load (server component) → เช็ค:
  - ถ้า timestamp เกิน 12 ชั่วโมง → call `supabase.auth.signOut()` + redirect `/login`
- เพิ่ม API `/api/auth/check-expiry` ก็ได้สำหรับเรียกจาก client
- ข้อจำกัด: user แก้ localStorage หลบได้ (แต่ต้องตั้งใจ) — กันคนสุจริตได้ดี
- ถ้าจะ bulletproof: เก็บ login timestamp ใน `profiles.last_login_at` column แล้วเช็คฝั่ง server

### 8. Email Verification ตอน Register
- ตอนนี้ register แล้ว auth user ถูก `email_confirm: true` อัตโนมัติ (ข้าม verify)
- อาจเปลี่ยนให้ user ต้องกดลิงก์ verify email ก่อน admin จะเห็นใน list ได้

---

## 🟢 ฟีเจอร์เพิ่มเติม (ไม่เร่งด่วน)

### 9. Admin Audit Log
- เก็บ log การ approve/reject/edit ทุกครั้ง (ใครทำ เมื่อไหร่ เปลี่ยนอะไร)
- สำหรับ accountability + ตามรอย

### 9.1 Notification เมื่อ Admin ลบผู้ป่วยตรงๆ (Direct Delete)
- ปัจจุบัน: ถ้า Admin ลบผู้ป่วยเองโดยไม่ผ่าน request flow → ไม่มีการแจ้งเตือนใดๆ
- ตั้งใจปล่อยไว้ก่อน เพราะตอนนี้มี Admin คนเดียว (พี่กัน) risk ต่ำ
- เมื่อ scale ขึ้น (หลาย User หลาย รพ.) ควรเพิ่ม:
  - ส่งเมลแจ้ง User ที่เป็น "เจ้าของ" ผู้ป่วยคนนั้น ว่าถูก Admin ลบแล้ว
  - บันทึกลง Audit Log ว่า Admin คนไหน ลบเมื่อไหร่

### 10. Edit Request System (สำหรับฟิลด์ที่ต้อง admin approve)
- ตอนนี้ Profile modal มี sub-modal "ส่งคำขอแก้ไข" แต่ยัง alert placeholder
- ต้อง: บันทึก edit request ลง table → ส่งเมล admin → admin approve/reject
- สร้าง table `edit_requests` + API + admin UI

### 11. RLS Strict mode สำหรับ tb_patients
- ปัจจุบัน authenticated ทุกคน CRUD ได้ทั้งหมด
- ต้อง:
  - DELETE → admin only
  - SELECT/UPDATE → เฉพาะ user ที่อยู่โรงพยาบาลเดียวกัน
  - INSERT → approved user เท่านั้น

### 12. Rate Limiting ตอน Register
- ป้องกัน spam สมัคร bot
- ใช้ Cloudflare Bot Fight Mode (เปิดอยู่แล้ว) + อาจเพิ่ม captcha

### 13. Notification System ใน-แอป
- bell ปัจจุบันใช้ใน TB Dashboard → ทำให้แจ้งเตือนตอน admin approve/reject ด้วย

---

## 🔵 Future Vision (long-term)

### 14. Multi-Hospital Support
- ปัจจุบัน design สำหรับโรงพยาบาลปรางค์กู่ — แต่ register form มีให้เลือก รพ. ได้แล้ว
- ต้อง: data isolation ระดับโรงพยาบาล, dashboard แยกตาม รพ.

### 15. ขาย/แจกให้โรงพยาบาลอื่นใช้
- เป้าหมายในอนาคตของพี่กัน — design ตั้งแต่ตอนนี้ให้รองรับ multi-tenant

---

ดู [[session_tb_dashboard_2026_05_15_part2]] สำหรับสถานะปัจจุบัน
