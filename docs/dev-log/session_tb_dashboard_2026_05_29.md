---
name: session-tb-dashboard-2026-05-29
description: 🔥 วันยาวมาก push 10 รอบ (v0.7.12.3 → v0.7.13.4) — Logout/Easter log + Session Activity (อุปกรณ์ที่เข้าใช้งาน) + หน้าบันทึกกิจกรรม Activity Log + Device Fingerprint แยกเครื่อง + Popup animation
metadata: 
  node_type: memory
  type: project
  originSessionId: 1f6e6634-a264-4da1-9733-cdfa847fcd37
---

# 📌 TB Dashboard session 2026-05-29 — push 10 รอบ (v0.7.12.3 → v0.7.13.4)

## 🏆 สรุปทั้งวัน (push 10 รอบ)
| Version | commit | งานหลัก |
|---|---|---|
| v0.7.12.3 | 0cda4f5 | Logout log + Easter egg log + rate limit 3 บรรทัด |
| v0.7.12.4 | d24d47d | Session Activity Log B1 (tb_session_log + ua-parser + middleware ping) |
| v0.7.12.5 | 53a92ea | Session B2+B3 (expired detection + signout-others + UI "อุปกรณ์ที่เข้าใช้งาน") |
| v0.7.12.6 | 729bda8 | ขัดเกลา UI Session (สี/ไอคอน/ภาษา/legend/sticky) |
| v0.7.13.0 | 013dc95 | 🎯 หน้าบันทึกกิจกรรม Activity Log (VIEW รวม 5 ตาราง + ฟิลเตอร์) |
| v0.7.13.1 | d8bc3ed | drill-down กดกรองได้ทุกค่า + แก้ไอคอนอุปกรณ์ |
| v0.7.13.2 | 25bdad1 | banner teal + sticky header เนียน |
| v0.7.13.3 | d4c3457 | 🎯 Device Fingerprint แยกเครื่อง + session_id + total นับจริง + © + build date |
| v0.7.13.4 | 7d6c51e | Popup animation A (Fade+Scale+Slide) About + อีเมล hotmail |

## 🎯 เป้าหมาย
ต่อยอดจาก v0.7.12.2 (login log) — เพิ่ม logout log + easter egg log เพื่อปิดวงจร login/logout ให้ครบ

## ✅ ที่ทำเสร็จ

### เทส v0.7.12.2 (login rate limit) — ผ่านครบ 6/6
1. Login สำเร็จ + log success ✅
2. Login ด้วย username แทน email ✅
3. รหัสผ่านผิด → log wrong_password ✅
4. Email ไม่มีในระบบ → log user_not_found + anti-enumeration ✅
5. Username ไม่มีในระบบ → log username_not_found ✅
6. Rate limit 5 ครั้ง/15นาที → ระงับชั่วคราว ✅

### ปรับข้อความ rate limit
- เปลี่ยน "บัญชีนี้" → "บัญชีของท่าน"
- เปลี่ยน "กรุณาลองอีกครั้ง" → "กรุณาลองใหม่อีกครั้ง"
- ขึ้น 3 บรรทัดด้วย `\n` + `white-space: pre-line` ใน error box

### ตารางใหม่ 2 ตัว
**`tb_logout_log`**
- คอลัมน์: id, user_id, email, logout_type, ip_address, user_agent, logged_out_at
- logout_type: 'manual' (ตอนนี้) + 'session_expired' (รอข้อ B)
- check constraint + RLS no client access + index user_id

**`tb_easter_egg_log`**
- คอลัมน์: id, user_id, email, event_type, ip_address, user_agent, occurred_at
- event_type: 'discovered' (กดอ่านข้อความครบ) + 'kicked_out' (โดนเตะออก)
- เก็บไว้ขำๆ ว่าใครเจอบ้าง

### API ที่เกี่ยวข้อง
- `/api/auth/signout` — แก้ให้บันทึก log ก่อน signOut (ดึง user ก่อน เพราะ session จะหายหลัง signOut)
- `/api/easter-egg/log` — รับ event_type ผ่าน body ต้องมี session ก่อนถึงบันทึก

### tb-app.jsx
- `closeEasterMsg` ตอนจบข้อความทั้งหมด → fetch log 'discovered'
- `handleLogoClick` (easterRound=2) → fetch log 'kicked_out' ก่อน signout

## 🧪 เทสผ่าน
- A. Manual logout → tb_logout_log มีแถว manual ✅
- B. Easter egg discovered → tb_easter_egg_log มี 'discovered' ✅
- C. Easter egg kicked out → tb_easter_egg_log 'kicked_out' + tb_logout_log 'manual' ✅

## 📦 Push
- v0.7.12.3 → commit `0cda4f5`
- ไฟล์: app/api/auth/login/route.ts, app/api/auth/signout/route.ts, app/api/easter-egg/log/route.ts, app/login/page.tsx, public/tb-app.jsx, scripts/add-logout-log.sql, scripts/add-easter-egg-log.sql

## ✅ v0.7.12.4 — Session Activity Log Phase B1 (commit d24d47d)

### ตารางใหม่ tb_session_log
- 1 แถว = 1 session (ตั้งแต่ login → logout)
- คอลัมน์: user_id, email, ip_address, user_agent, started_at, last_active_at, ended_at, end_reason
- device แบบละเอียด: device_label + browser/os/device 7 ฟิลด์
- check constraint end_reason ∈ (manual, session_expired, forced_by_user, forced_by_admin)
- RLS service_role only + 2 indexes

### Dependency ใหม่
- ua-parser-js ^2.0.10

### ไฟล์
- lib/parse-user-agent.ts (helper)
- scripts/add-session-log.sql
- แก้: app/api/auth/login/route.ts (INSERT + set cookie tb_session_id 30 วัน)
- แก้: app/api/auth/signout/route.ts (UPDATE ended_at + ลบ cookie)
- แก้: middleware.ts (throttle ping last_active_at ทุก 5 นาที ผ่าน cookie tb_session_pinged)

### เทสผ่าน (PC ทั้งหมด — มือถือเทสบน production)
- Test 1: login → device_label ขึ้น "Chrome 148 · Windows 10" ✅
- Test 2: throttle 5 นาที ✅
- Test 3: manual logout ปิด session ✅
- Test 4: 2 browsers พร้อมกัน ✅

### มือถือเทสบน local ไม่ได้
- HTTP + LAN IP → mobile browser block cookie
- ทางแก้: เทสบน production tbjourney.care หลัง deploy

## ✅ v0.7.12.5 — Session Activity Log Phase B2+B3 (commit 53a92ea)

### B2: Session Expired + Force Signout Others
- scripts/extend-logout-log-constraint.sql — ขยาย logout_type 4 ค่า (รัน supabase แล้ว)
- middleware.ts — session_expired detection (cookie tb_session_id แต่ user=null → UPDATE + INSERT logout_log + clear cookies)
- /api/auth/signout-others — supabase.auth.signOut({scope:'others'}) + batch UPDATE tb_session_log + INSERT tb_logout_log forced_by_user

### B3: UI ในโปรไฟล์
- /api/auth/sessions — active sessions + flag is_current
- /api/auth/sessions/history — 100 รายการล่าสุด
- public/tb-app.jsx — SessionsPanel toggle view + relTime/deviceIcon/endReasonLabel helpers
  + ปุ่ม "อุปกรณ์ที่เข้าใช้งาน" ในเมนูซ้าย
  + ปุ่มแดง "ออกทุกอุปกรณ์ยกเว้นเครื่องนี้" (otherCount=0 → disabled)
  + popup ยืนยัน
  + ลิงก์ "ดูประวัติทั้งหมด"

### ✅ เทสผ่านครบแล้ว (รวมมือถือบน production) — 2026-05-29
ระบบ Session Activity Log + Password epic ปิดสมบูรณ์

### ทำพร้อมระบบ admin หลายคน (pending master ข้อ 42)
- forced_by_admin logout — schema + UI label พร้อม เหลือ API + ปุ่ม

## ✅ v0.7.12.6 — ขัดเกลา UI Session (commit 729bda8)
- ปุ่มออกทุกอุปกรณ์ แดง → อำพันแดง #ea580c (ปุ่มหลัก+popup+ไอคอน)
- ลบ ? "ยืนยันออกจากระบบทุกอุปกรณ์" + บันทึกกฎเหล็กห้าม ? ใน UI
- แก้ไอคอนมือถือไม่ขึ้น: FA 6.0.0 ไม่มี fa-mobile-screen → ใช้ fa-mobile/fa-tablet/fa-desktop
- คำไม่ทางการ → ทางการ: เมื่อกี้→เมื่อสักครู่, ขยับล่าสุด→ใช้งานล่าสุด, ถูกเตะออก→ถูกบังคับออก, หมดอายุเอง→หมดอายุการใช้งาน, admin→ผู้ดูแลระบบ
- StatusLegend ป้ายสีแถวเดียว แสดงเฉพาะหน้าประวัติ
- sticky header หน้าประวัติ (ตรึงปุ่มกลับ+ชื่อ+legend)
- iPad iPadOS13+ ปลอม UA เป็น Mac → อาจ detect เป็น desktop (ข้อจำกัด Apple)

## ✅ v0.7.13.0 — หน้าบันทึกกิจกรรม Activity Log (commit 013dc95)
เปิด epic ใหม่ → bump minor เป็น 0.7.13.0

### DB: VIEW tb_activity_log (scripts/add-activity-log-view.sql)
- รวม 5 ตาราง UNION ALL (login/logout/password_change/password_reset/easter) ไม่รวม session_log
- normalize: event_time/user_id/email/category/event_key/success/detail/ip/user_agent/device_type
- device_type = regex จาก user_agent (desktop/mobile/tablet/unknown)
- security_invoker=on + revoke anon/authenticated + grant service_role
- **VIEW ไม่ใช่ table — ไม่กระทบข้อมูลเดิม รันซ้ำได้ (create or replace)**

### API: /api/admin/activity-log (เช็ค admin + service_role ดึง view)
- pagination page/pageSize + hasMore
- ฟิลเตอร์: userId/category/failedOnly/since/until/device/suspicious/q(search)
- enrich: display_name + role + device_label (parseUserAgent)

### UI: ActivityLogTab (tb-modals.jsx) + เมนู sidebar (tb-app.jsx)
- timeline + ป้าย ADMIN/ผู้ใช้ + ชื่ออุปกรณ์สวย (hover เห็น UA ดิบ)
- IP คลิกกรองได้
- แถบฟิลเตอร์การ์ด gradient teal: ค้นหา(debounce)/ผู้ใช้/ประเภท/อุปกรณ์/เวลา(+กำหนดเอง)/น่าสงสัย/ล้าง
- FilterSelect helper (dropdown มีไอคอน)
- โหลดเพิ่ม (ดูย้อนหลังได้ทั้งหมด)

### เทสผ่านครบ
ทำ 2 รอบ + ตกแต่ง UI ตาม feedback (ป้ายผู้ใช้, ชื่ออุปกรณ์, IP คลิก, ตัวกรองอุปกรณ์, การ์ดสวย)

## ✅ v0.7.13.1 — ขัดเกลา Activity Log (commit d8bc3ed)
- กดกรองได้ทุกค่าในแถว (drill-down): ชื่อผู้ใช้/การกระทำ/วันที่/IP/อุปกรณ์
- helper: activityDeviceIcon (แก้ iPhone ขึ้นไอคอนคอม → fa-mobile/tablet/desktop) + eventToFType + pickDate
- ช่องค้นหาย่ออัตโนมัติเมื่อมีตัวกรอง (hasActiveFilter) → ทุกอย่างแถวเดียว
- "ทุกประเภท" → "ทุกกิจกรรม" + ปุ่ม "ล้าง" → "ล้างค่า" สีอำพัน

## ✅ v0.7.13.2 — banner teal หัวเรื่อง + sticky เนียน (commit 25bdad1)
- หัวเรื่องเป็น banner gradient teal (เหมือนหน้าจัดการผู้ใช้)
- แก้ sticky: top -16→-24 (ชดเชย scroll container p-6=24), zIndex 20, พื้น sticky #fff→#f0fdfa (=bg-teal-50 พื้นหน้าจริง) → ไม่เห็นกรอบขาว
- badge รายการ พื้นขาวทึบ + teal เข้ม ตัดกันชัด
- **บทเรียน:** พื้นหลัง content area = bg-teal-50 (#f0fdfa), scroll container = div flex-1 p-6 overflow-y-auto

## ✅ v0.7.13.3 — Device Fingerprint + Session ID + แก้ที่ลืม (commit d4c3457)
- session_id: ผูก login/logout log กับ session (จับคู่เข้า-ออก) — ป้ายเทา ไม่กด
- device_fp: รหัสประจำเครื่อง (localStorage, คงเดิมแม้ login ใหม่) — ป้ายม่วง กดกรองได้ = แยกเครื่องจริง
  - per-browser ไม่ใช่ per-hardware (Chrome 2 profile = คนละเลข, incognito/ล้าง browser = เลขใหม่)
- SQL: add-session-id-to-logs.sql + add-device-fingerprint.sql (3 ตาราง) + view (DROP+CREATE เพราะ 42P16)
- backend เก็บทั้ง 2 ค่า: login/signout/middleware expired/signout-others
- API: filter sessionId+deviceFp + short 8 ตัว + count:'exact' → total จริง
- UI: ป้าย 8 ตัว + hover เลขเต็ม + chip device_fp + badge เลขจริง (ไม่ใช่ 50+) + แบนเนอร์ขยับขึ้น
- 🔴 แก้ที่ลืม: BUILD_DATE 22→29 พ.ค. 2569 + เพิ่ม © 2026 หน้า login
- **บทเรียน:** create or replace view สลับคอลัมน์ไม่ได้ (42P16) ต้อง DROP+CREATE / BUILD_DATE ต้องอัปทุก version

## ✅ v0.7.13.4 — Popup animation A + อีเมล hotmail (commit 7d6c51e)
- AboutModal: animation A (Fade+Scale+Slide) เปิด 0.9s ขึ้น 35px / ปิด 0.6s ลง 35px + overlay fade
- เพิ่ม exit animation: state closing + handleClose setTimeout(onClose,580)
- keyframes 4 แบบใน app.html (modal-A/B/C/D) — เลือก A
- เพิ่มอีเมล hotmail + จัด 3 บรรทัด (ติดต่อ/gmail/hotmail)
- 📌 แผน: นำ animation A ไปใช้ popup ทั้งเว็บ → [[tb-dashboard-pending-master]] ข้อ 29

## 🚧 ต่อไป — แผนใหญ่
**5 ขั้นเรื่อง audit/log:**
1. ✅ Login log (v0.7.12.2)
2. ✅ Logout log + Easter egg (v0.7.12.3 — ตอนนี้)
3. ⏳ Session Activity Log — track IP/Device active + รองรับ session_expired logout
4. ⏳ Sensitive Action Log (ดู/แก้ข้อมูลผู้ป่วย — PDPA)
5. 🎯 UI Activity Log หน้าใหม่ในแอด มินสำหรับดูทุก log

## 🐛 Bug Audit เหลือ
- ข้อ 7 (race condition reject) → ทำหลังมี admin หลายคน
- ข้อ 9 → ตัดทิ้ง
- ข้อ 10 (middleware cache) → ทำตอน optimize

ดู [[tb-dashboard-bugs-2026-05-18]] · [[tb-dashboard-pending-master]] · [[session-tb-dashboard-2026-05-27]]
