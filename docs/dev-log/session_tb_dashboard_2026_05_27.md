---
name: session-tb-dashboard-2026-05-27
description: v0.7.12.0 — ระบบเปลี่ยนรหัสผ่านในโปรไฟล์ (self-service password change) + rate limit 3 ครั้ง/24 ชม. + ส่งเมลแจ้งเตือน + audit log
metadata: 
  node_type: memory
  type: project
  originSessionId: 1f6e6634-a264-4da1-9733-cdfa847fcd37
---

# 📌 TB Dashboard session 2026-05-27 — v0.7.12.0

## 🎯 เป้าหมาย
ทำระบบเปลี่ยนรหัสผ่านในโปรไฟล์ (ข้อ 13A จาก [[tb-dashboard-pending-master]]) — ปลดล็อกปุ่มที่ค้าง "เร็วๆ นี้" มานาน

## ✅ ที่ทำเสร็จ

### 🔐 ระบบเปลี่ยนรหัสผ่าน — Self-service Password Change
- ปลดล็อกปุ่ม "เปลี่ยนรหัสผ่าน" ใน Profile Modal การ์ดซ้าย
- **Toggle view** (ไม่ซ้อน popup) — กดแล้วฝั่งขวาเปลี่ยนเป็นฟอร์ม ฝั่งซ้ายสีเขียวอยู่เดิม
- 3 ช่อง: รหัสเดิม / รหัสใหม่ / ยืนยันรหัส (PasswordEye ทุกช่อง)
- แท่ง strength + checklist 5 ข้อ (real-time) — copy โลจิกจากหน้า register เป๊ะ
- ผ่าน ≥4/5 + ยาว ≥8 ตัว → เปลี่ยนได้
- ห้ามใช้รหัสเดิมซ้ำ
- บังคับ re-auth รหัสเดิมก่อน
- หน้าสำเร็จ: ติ๊กเขียว + กล่องแจ้งเมล + ปุ่มกลับ (ไม่ auto-redirect)

### 🛡 Rate Limit + Audit Log
- จำกัด **3 ครั้ง / 24 ชั่วโมง** — เกินแล้วบอกเวลาที่ลองใหม่ได้
- table `tb_password_change_log` เก็บ IP + user_agent ทุกครั้ง
- RLS บล็อก client ทั้งหมด เข้าได้แค่ service_role

### 📧 ส่งเมลแจ้งเตือน
- หัวข้อ: "🔐 รหัสผ่านบัญชีของท่านถูกเปลี่ยน"
- กล่องเขียวเวลาที่เปลี่ยน + กล่องแดงเตือน "ถ้าไม่ใช่คุณ"
- ปุ่ม "เข้าสู่ระบบ"

## 🐛 ปัญหาที่เจอ + แก้ไขระหว่างพัฒนา

### Bug A — API 401 หลังเปลี่ยนรหัส
- **อาการ:** เปลี่ยนสำเร็จแต่ฝั่ง API เรียกไม่ได้ → เมลไม่ส่ง
- **Root cause:** Supabase revoke refresh token เก่าทันทีที่ updateUser สำเร็จ → cookie ฝั่ง server expired → `auth.getUser()` คืน null → 401
- **Fix:** ฝั่ง client ดึง access_token ใหม่จาก `_sb.auth.getSession()` ส่งผ่าน `Authorization: Bearer ...` header แทน cookie
- **บทเรียน:** ทุก API ที่เรียกหลัง updateUser/admin.updateUserById ต้องใช้ Bearer token ไม่ใช่ cookie

### Bug B — แท็บ/เครื่องอื่นที่ login ค้าง
- หลัง `admin.auth.admin.updateUserById` → Supabase revoke session อื่นๆ ทั้งหมด → user ในแท็บนี้ก็เกือบโดนเตะ
- **Fix:** หลังเปลี่ยนสำเร็จ client auto-call `signInWithPassword` ด้วยรหัสใหม่ → refresh session ใน browser แท็บปัจจุบัน (user ไม่ถูกเตะ)
- เครื่อง/แท็บอื่นจะโดนเตะภายใน ≤1 ชม. ตอน access token หมดอายุ

## 🏗 สถาปัตยกรรม — รวม flow ใน API เดียว (atomic)

**POST /api/auth/change-password** (ใหม่):
1. Verify Bearer token → user
2. นับ log 24 ชม. → reject ถ้า ≥3
3. Verify รหัสเดิม (signInWithPassword ฝั่ง server)
4. `admin.auth.admin.updateUserById` (revoke all sessions)
5. Insert log (IP + UA)
6. ส่งเมล (fail แล้วไม่ throw)

**เหตุผลรวมเป็น API เดียว:** กัน bypass — ถ้าทำหลาย API แยก ผู้ร้ายสามารถข้าม rate limit ตอน client ได้

## 📂 ไฟล์ที่เปลี่ยน
- `public/tb-app.jsx` — PwEye + ChangePasswordPanel + checkPasswordStrength + getPasswordStrength + state `mode`
- `lib/email-templates.ts` — `passwordChangedEmail()`
- `app/api/auth/change-password/route.ts` (ใหม่)
- `scripts/add-password-change-log.sql` (ใหม่ — รันแล้วทั้ง dev + production)
- `app/login/page.tsx` — bump version
- ลบ `app/api/auth/notify-password-changed/` (API เก่าที่แยก ไม่ใช้แล้ว)

## 🚀 Deployment
- ✅ SQL รันบน Supabase production แล้ว
- ✅ Push commit 99d82be ขึ้น main
- ✅ Cloudflare Pages auto-deploy
- ไม่มี env vars ใหม่
- ไม่ต้องตั้ง Cloudflare เพิ่ม

## 🧪 Test cases ที่ผ่าน
- เปลี่ยนรหัสปกติ + รับเมล ✅
- รหัสเดิมผิด → error ✅
- รหัสใหม่ไม่ผ่าน strength → error ✅
- Confirm ไม่ตรง → กรอบแดง + ข้อความใต้ช่อง ✅
- รหัสใหม่ซ้ำรหัสเดิม → error ✅
- เกิน 3 ครั้ง/24 ชม. → error 429 พร้อมเวลาที่ลองใหม่ได้ ✅

## 🤔 ที่ตัดสินใจระหว่างทาง
- **UI:** Toggle view ในฝั่งขวา (ไม่ซ้อน popup) — พี่กันเลือกเอง
- **โลจิก:** copy จากหน้า register เป๊ะ (แท่ง + checklist 5 ข้อ) — พี่กันบอก "เหมือนหน้าสมัคร"
- **กลับหน้าโปรไฟล์:** ผู้ใช้กดเอง (ไม่ auto-redirect) — พี่กันต้องการ
- **Rate limit:** 3 ครั้ง/24 ชม. + เก็บ audit log ใน DB (option A) — พี่กันเลือก
- **API:** รวมเป็น API เดียว (atomic) แทนแยก check + update + log + email

## 📌 ค้างต่อ
- ระบบลืมรหัสผ่าน / รีเซ็ตทางอีเมล (ข้อ 13B) — ✅ **เสร็จ v0.7.12.1** (push commit 25f6ab4)

---

# 📌 part 2 — v0.7.12.1 (push เดียวกันวัน)

## 🎯 เป้าหมาย
ทำต่อระบบลืมรหัสผ่าน (ข้อ 13B) ให้ครบและส่ง log

## ✅ สิ่งที่ทำ

### 🔓 ระบบลืมรหัสผ่าน (Forgot Password Flow)
- ลิงก์ "ลืมรหัสผ่าน" ใต้ช่อง Password ในหน้า login
- หน้า `/reset-password` กรอกอีเมล
- API `/api/auth/request-password-reset` ส่งลิงก์ผ่าน Resend
- Email template `passwordResetEmail` (ภาษาไทย)
- หน้า `/reset-password/confirm` ตั้งรหัสใหม่ (strength meter 5 ข้อ)
- API `/api/auth/complete-password-reset` enforce strength + log + ส่งเมลแจ้งเตือน

### 🛠 สถาปัตยกรรม
- ใช้ `admin.auth.admin.generateLink({ type: 'recovery' })` + `verifyOtp({ type: 'recovery', token_hash })`
- **ไม่ใช้ PKCE/exchangeCodeForSession** เพราะ admin-generated link ไม่มี code_verifier ใน browser ของ user → PKCE fail
- URL pattern: `/reset-password/confirm?token_hash=xxx&type=recovery`

### 🛡 Security
- Anti-enumeration: ตอบ success เสมอ (ไม่บอก user มีในระบบไหม)
- Rate limit 3 ครั้ง/ชม. ต่ออีเมล
- Server-side strength enforcement
- Token single-use (Supabase จัดการ)
- ส่งลิงก์เฉพาะ user status='approved'
- ส่งเมลแจ้งเตือนหลัง reset สำเร็จ (กันคนแฮกอีเมลไป reset)

### 📊 Audit Log ครบ 100%
- table ใหม่ `tb_password_reset_log` — เก็บคำขอทุกครั้ง (สำเร็จ+พลาด)
- extend `tb_password_change_log` — เพิ่ม action/success/failure_reason/email_attempted
- rate limit ฉลาดขึ้น: นับเฉพาะ success (user พิมพ์ผิดไม่โดน lock)

## 🐛 ปัญหาที่เจอ + วิธีแก้ระหว่างพัฒนา

### Bug A — กดลิงก์ในเมลขึ้น "ลิงก์หมดอายุ" ทันที
- **Root cause:** ใช้ action_link ของ Supabase แต่ Supabase v2 default = PKCE flow → ต้องการ code_verifier ใน browser ที่ขอ → admin-generated link ไม่มี → exchangeCodeForSession fail
- **Fix:** เปลี่ยนเป็น `verifyOtp({ token_hash })` แทน → ใช้ properties.hashed_token จาก generateLink ส่งใน URL → verify ฝั่ง client ตรงๆ
- **บทเรียน:** PKCE flow ใช้ไม่ได้กับ admin-generated link สำหรับ recovery/invite — ใช้ verifyOtp + token_hash แทน

### Bug B — เมลไม่ส่ง (ที่จริงโดน rate limit)
- **อาการ:** เทสบ่อยจน 3 ครั้ง/ชม. เต็ม → API ตอบ 200 แต่เมลไม่มา
- **Fix:** ระบบทำงานถูก — silent fail เป็น by design (กัน enumeration) ล้าง log แล้วเทสใหม่
- **บทเรียน:** Anti-enumeration ทำให้ debug ยาก — ต้องดูจาก log table แทน error response

## 📂 ไฟล์ที่เปลี่ยน (v0.7.12.1)

**ใหม่ (6):**
- `app/reset-password/page.tsx`
- `app/reset-password/confirm/page.tsx`
- `app/api/auth/request-password-reset/route.ts`
- `app/api/auth/complete-password-reset/route.ts`
- `scripts/add-password-reset-log.sql`
- `scripts/extend-password-change-log.sql`

**แก้:**
- `app/login/page.tsx` — ลิงก์ "ลืมรหัสผ่าน"
- `app/api/auth/change-password/route.ts` — log ทุก path + rate limit ฉลาดขึ้น
- `lib/email-templates.ts` — passwordResetEmail
- `public/tb-app.jsx` — bump version

## 🚀 Deployment (v0.7.12.1)
- ✅ SQL รันบน Supabase production แล้ว 2 ไฟล์ (add-password-reset-log + extend-password-change-log)
- ✅ Supabase Auth → URL Configuration → Redirect URLs ตั้งแล้ว (production + localhost)
- ✅ Push commit 25f6ab4 → Cloudflare auto-deploy
- ไม่มี env vars ใหม่

## 📌 ค้างต่อ
- ✅ **v0.7.12.2 Login attempt log + Rate limit หน้า login — เสร็จแล้ว** (push commit b560bae)
- ส่งเมลแจ้งเตือนเมื่อมีคน login จาก IP/Device แปลก (อนาคต)

---

# 📌 part 3 — v0.7.12.2 (push เดียวกันวัน)

## 🎯 เป้าหมาย
ปิดช่องโหว่ brute force หน้า login (พี่กันเข้าใจผิดคิดว่าทำแล้ว → แคลร์อธิบายชัดอีกที)

## ✅ สิ่งที่ทำ

### 🛡 Login Attempt Log + Rate Limit
- table ใหม่ `tb_login_log` (email/username/user_id/success/failure_reason/ip/ua/time)
- API ใหม่ `/api/auth/login` — แทน `signInWithPassword` ตรงๆ
- หน้า login ส่ง `{ identifier, password }` ไป API (ไม่เรียก Supabase ตรงๆ อีกแล้ว)
- ลบ `createClient` import ออกจากหน้า login (ไม่ต้องใช้แล้ว)

### Rate Limit 2 ระดับ
- **5 ครั้งผิด/15 นาที ต่ออีเมล** → กันเดารหัสของบัญชีเดียว
- **20 ครั้งผิด/15 นาที ต่อ IP** → กันบอทยิงหลายบัญชีจาก IP เดียว

### failure_reason ที่บันทึก
- `username_not_found` / `user_not_found` / `wrong_password`
- `rate_limited_email` / `rate_limited_ip`

### Anti-enumeration
- ตอบ "อีเมลหรือรหัสผ่านไม่ถูกต้อง" เสมอ ไม่ว่าจะ user มีหรือไม่มี / รหัสผิด
- แยก wrong_password vs user_not_found ภายใน log (เพื่อ audit)

## 🏗 Pattern ที่ใช้ — createServerClient + cookies adapter ใน API route

```ts
const cookiesToSet: { name: string, value: string, options: any }[] = []
const supabase = createServerClient(URL, ANON, {
  cookies: {
    getAll() { return req.cookies.getAll() },
    setAll(toSet) { toSet.forEach(c => cookiesToSet.push(c)) },
  },
})

await supabase.auth.signInWithPassword({ email, password })

const response = NextResponse.json({ success: true })
cookiesToSet.forEach(({ name, value, options }) =>
  response.cookies.set(name, value, options))
return response
```

→ Supabase ตั้ง cookies → เก็บใน buffer → ใส่ใน NextResponse ตอน return
→ client แค่ `router.refresh()` ก็เห็น cookie ใหม่ (middleware อ่านได้)

## 📂 ไฟล์ที่เปลี่ยน (v0.7.12.2)
**ใหม่ (2):**
- `scripts/add-login-log.sql`
- `app/api/auth/login/route.ts`

**แก้:**
- `app/login/page.tsx` — เรียก API ใหม่ + ลบ unused import
- `public/tb-app.jsx` — bump version

## 🚀 Deployment (v0.7.12.2)
- ✅ SQL รันบน Supabase แล้ว (dev/prod = project เดียว)
- ✅ Push commit b560bae

## 🎉 ระบบรหัสผ่านครบวงจร — สรุปทั้งวัน
- v0.7.12.0: เปลี่ยนรหัสในโปรไฟล์ + rate limit 3/24h + ส่งเมล
- v0.7.12.1: ลืมรหัสผ่าน (รีเซ็ตทางเมล) + rate limit 3/ชม. + ส่งเมล x2 + audit ครบทุก attempt
- v0.7.12.2: Login attempt log + rate limit 5/15min ต่ออีเมล + 20/15min ต่อ IP

## 📚 Memory ใหม่ที่สร้าง
- [[supabase-single-env]] — TB Dashboard ใช้ Supabase project เดียว dev=prod ไม่ต้องถามแยก (เพราะแคลร์ถามซ้ำเรื่องนี้หลายรอบจนพี่กันรำคาญ)
