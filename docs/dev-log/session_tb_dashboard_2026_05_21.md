---
name: session_tb_dashboard_2026_05_21
description: v0.7.10.3 (commit de99466) — แก้ระบบเลขใบประกอบ (รวมบัญชีกลาง 2 เล่ม) + UI หน้าแก้ไขผู้ใช้ 2 ฝั่ง + ไอคอน role + push สำเร็จ เทสผ่าน
metadata: 
  node_type: memory
  type: project
  originSessionId: 935f9db2-504a-4949-8616-e99f53443219
---

# TB Dashboard session 2026-05-21

**version:** v0.7.10.3
**commit:** de99466 (push main สำเร็จ 3163818..de99466)
**สถานะ:** เทสผ่านครบ + push แล้ว

## ทำอะไรไปบ้าง

### 1. แก้ version ตกหล่น (ต้น session)
- พบ login/page.tsx ยังค้าง v0.7.9.5 ขณะที่ push v0.7.10.2 ไปแล้ว → แก้ให้ตรง
- เสริม [[tb-dashboard-version-locations]] เพิ่ม "ประวัติการลืม" + ย้ำว่า login เป็นจุดตกหล่นบ่อยสุด

### 2. 🔴 แก้ระบบเลขใบประกอบทั้งระบบ — ดูเต็ม [[tb-dashboard-license-system]]
- **ต้นตอ:** ตารางวิชาชีพ→คำนำหน้า กระจาย 5 ที่ key ไม่ตรงกัน (nurse1 vs nurse ฯลฯ)
- **วิธีแก้:** รวมบัญชีกลาง 2 เล่ม (เลี่ยงไม่ได้เพราะ 2 runtime):
  - `lib/professions.ts` (ฝั่งเซิร์ฟเวอร์) + `window.TB_PROFESSIONS` ใน tb-data.js (ฝั่งหน้าเว็บ)
- บั๊กที่แก้: พยาบาล/นักสาธารณสุขโผล่ "อื่นๆ" / คำนำหน้าหายตอนอนุมัติ / regex ตัดคำนำหน้าไม่ครบ / เมลโชว์ key อังกฤษ
- เซิร์ฟเวอร์เติมคำนำหน้าตามวิชาชีพให้อัตโนมัติทุกทางเข้า

### 3. ปรับ UI ตามที่พี่กันเทสเจอ
- **หน้าแก้ไขข้อมูลผู้ใช้ (admin) เป็น 2 ฝั่ง** (พี่กันเสนอเอง): ซ้ายค่าเดิม / ขวาช่องแก้ + ไฮไลต์อำพัน + ป้าย "แก้แล้ว" (component `EditRow` ใน tb-modals)
  - ⚠️ ตอบพี่กันแล้ว: **ไม่กระทบ**ระบบคำขอแก้ไข (user ขอ→admin อนุมัติ) เพราะคนละ component/API
- โปรไฟล์ admin+user: เลขใบประกอบโชว์คำนำหน้าเต็ม (ภ.47186) + ตอนแก้มีป้ายคำนำหน้าฝังหน้า (แก้ไม่ได้ พิมพ์ได้แต่เลข)
- ป้าย role + แถวสิทธิ์การใช้งาน: admin=ไอคอนเกราะ / user=ไอคอนคน
- แก้ fa-shield-halved → fa-shield (ไม่มีใน FA 6.0.0)
- หน้าสมัคร "(prefix:)" → "(คำนำหน้า:)"

## เทคนิคที่ใช้ session นี้
- **ตรวจ syntax JSX ฝั่ง public** (ไม่ได้ build ด้วย Next): `npx --no-install tsc --noEmit --jsx preserve --allowJs <file> | grep "error TS1[0-9]{3}"` (TS1xxx = syntax, ไม่สน TS2xxx ที่เป็น name/type) — ใช้แทน esbuild/babel ที่ไม่ได้ติดตั้ง
- ทุกครั้งที่แก้ public/*.jsx ต้อง bump `?v=N` ใน app.html (session นี้ v21→v27)

## 4. ✅ ระบบคำนำหน้าชื่อ — v0.7.10.4 (commit 353323d, push แล้ว)
- ผู้ใช้เลือกคำนำหน้านาม (นาย/นาง/นางสาว) → ระบบแปลงเป็นตัวย่อวิชาชีพอัตโนมัติตามเพศ
  (นาย+เภสัช→ภก. / นาง+เภสัช→ภญ. / กายภาพ→กภ. ไม่แยกเพศ / กลุ่มไม่มีตัวย่อ→ใช้นาม)
- **ไม่ถามเพศตรงๆ** — เคารพ LGBTQ (พี่กันจุดประเด็นเอง)
- DB: เพิ่ม `profiles.title` (scripts/add-profile-title.sql รันแล้ว) เก็บคำนำหน้านาม
- บัญชีกลาง: titleMale/titleFemale + NAME_PREFIXES + helper displayTitle()
- หน้าสมัคร: ป้ายตัวย่อ (ภก.) ฝังหน้าช่องชื่อ (สไตล์เดียวกับ ภ. หน้าเลขใบ)
- โปรไฟล์: คำนำหน้าเต็มแถวบนสุด + ชื่อ-นามสกุลจับคู่กัน
- แก้บั๊ก: dropdown แก้ไขไม่มีตัวเลือกว่าง → ส่งค่าว่างตอนบันทึก → เพิ่ม "— เลือก —"

## 5. ✅ ระบบเบอร์โทร + popup About — v0.7.10.5 (commit adc6e2d, push แล้ว)
- **อุดช่องโหว่เบอร์โทร**: เดิมตรวจแค่ตอนสมัคร แก้ทีหลังหลุดหมด → สร้างตัวกลาง `lib/phone.ts` + `window.tbValidatePhone/tbFormatPhone`
  - validate ทุกจุด: profile/update, edit-self, edit-user, approve-edit + client (tb-app)
  - เพิ่ม field เบอร์ในหน้าจัดการผู้ใช้ (edit-user เดิมไม่มี phone)
  - format ใส่ขีดสม่ำเสมอ (081-234-5678) + ขีดขึ้นขณะพิมพ์
- **เปลี่ยน alert → inline error** (พี่กันเคยบอกไม่ให้ popup เด้ง) ดู [[feedback_no_browser_alert]]
- **เลขใบประกอบในการ์ดซ้าย** โปรไฟล์ (ใต้ชื่อวิชาชีพ)
- **popup "เกี่ยวกับระบบ" (About)** — กดที่ footer เวอร์ชัน (กดได้ทั้งบล็อก + hover):
  โลโก้ fa-lungs-virus / Build date / ผู้พัฒนา + ภ. / อีเมล mailto / เครดิต Claude+Gemini / คำโปรยกล่องอำพัน
- **version 3 จุดแล้ว**: `APP_VERSION` + `BUILD_DATE` (tb-app.jsx) + login/page.tsx — ดู [[tb-dashboard-version-locations]]
  - tb-app footer ใช้ {APP_VERSION} (เลิก hardcode) → ในแอปแก้ APP_VERSION ที่เดียวคุม footer+popup

## 6. ✅ เปลี่ยนชื่อระบบ + ไอคอนอัปโหลดรูป — v0.7.11 (commit da21ba2, push แล้ว)
- **เปลี่ยนชื่อ "TB CARE & JOURNEY" → "TB JOURNEY & CARE"** ทุกจุด (ให้ตรงโดเมน tbjourney.care)
  - หน้าเว็บ (sidebar/About/login/สมัคร/title) + เมลทุกฉบับ (EMAIL_FROM/หัว/footer/subject) + ทั้ง & และ &amp;
- **ไอคอนกล้องที่รูปโปรไฟล์** กดแล้วขึ้น "อัปโหลดรูป — เร็วๆ นี้" (ยังไม่ทำระบบ ดู pending #38)

## 7. ✅ กล่องแผนพัฒนาระบบยา — v0.7.11.1 (commit 1a990ab, push แล้ว)
- เพิ่มกล่อง note "แผนพัฒนาระบบยา" (อำพัน) ในหน้าตั้งค่า > ยาโรคร่วม โชว์ในเว็บกันลืม (ดู pending #39)
- ยาจริงจะมี 100+ ตัว → จัดกลุ่มจริงเป็นงานใหญ่ ไว้ทำทีหลัง

## ยังเหลือ (จดไว้)
- 🚀 **พรุ่งนี้ (2026-05-22): ทำเว็บให้เร็วขึ้น** — เว็บเริ่มหมุนๆ ช้า ดู pending #40 (สาเหตุน่าจะ Babel standalone transpile in-browser)
- migrate ข้อมูลเก่า: **ไม่ต้องทำ** (พี่กันยืนยันมีแค่เภสัชสมัครก่อนหน้า)
- BUILD_DATE ต้องอัปเดตมือทุกครั้งที่ push version ใหม่ (ยังไม่ auto)
- OTP เบอร์โทร: แพลนหน้า (ยังไม่ทำ)
