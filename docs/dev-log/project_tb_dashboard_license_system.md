---
name: tb-dashboard-license-system
description: "✅ ระบบเลขใบประกอบ TB Dashboard — แก้+เทส+push แล้ว 2026-05-21 (v0.7.10.3 commit de99466) รวมบัญชีกลาง 2 เล่ม (lib/professions.ts + window.TB_PROFESSIONS) คงเหลือ: migrate ข้อมูลเก่า + คำนำหน้าแยกเพศ"
metadata: 
  node_type: memory
  type: project
  originSessionId: 935f9db2-504a-4949-8616-e99f53443219
---

# ✅ ระบบเลขใบประกอบวิชาชีพ — แก้+เทส+push แล้ว (2026-05-21)

**สถานะ:** ✅ v0.7.10.3 commit de99466 push ขึ้น main แล้ว (พี่กันเทสผ่านครบทุกจุด)

## 🔧 วิธีแก้: รวมเป็น "บัญชีกลาง" 2 เล่ม (จาก 5 ตารางที่เพี้ยน)
- **ฝั่งเซิร์ฟเวอร์:** `lib/professions.ts` — PROFESSIONS + helpers (professionLabel, professionKeyFromLabel, professionPrefix, licenseDigits, buildLicense)
- **ฝั่งหน้าเว็บ:** `window.TB_PROFESSIONS` + helpers (tbProfPrefix, tbLicenseDigits, tbBuildLicense) ใน `public/tb-data.js`
- 🚨 **2 เล่มนี้ต้องแก้คู่กันเสมอ** (key+label+prefix ตรงกันเป๊ะ ไม่งั้นการแปลง label↔key พัง)

## ไฟล์ที่แก้ (11 ไฟล์)
1. `lib/professions.ts` (ใหม่) 2. `public/tb-data.js` 3. `app/register/page.tsx` (+"คำนำหน้า")
4. `app/api/register/route.ts` 5. `app/api/admin/approve-edit-request/route.ts`
6. `app/api/admin/edit-user/route.ts` (เซิร์ฟเวอร์เติมคำนำหน้า) 7. `app/api/admin/edit-self/route.ts` (เติมคำนำหน้า)
8. `public/tb-app.jsx` 9. `public/tb-modals.jsx` 10. `app/admin/users/page.tsx`
11. `app/api/patient/delete-request/route.ts` + `public/app.html` (cache ?v=22)

## ✅ ทำต่อเสร็จแล้ว
1. **migrate ข้อมูลเก่า** — ไม่ต้องทำ (พี่กันยืนยัน 2026-05-21: ก่อนหน้านี้มีแค่เภสัชสมัคร ไม่มี nurse/publichealth เก่า)
2. ✅ **คำนำหน้าแยกเพศ — เสร็จ v0.7.10.4 (2026-05-21)** ดู [[session_tb_dashboard_2026_05_21]]
   - ผู้ใช้เลือกคำนำหน้านาม (นาย/นาง/นางสาว) → ระบบ derive ตัวย่อวิชาชีพ (ภก./ภญ.) อัตโนมัติ
   - เก็บใน `profiles.title` (คำนำหน้านาม) + helper `displayTitle(profession, namePrefix)`
   - ไม่ถามเพศตรงๆ (เคารพ LGBTQ — พี่กันจุดประเด็น)

---

## 📜 บั๊กเดิม (ก่อนแก้ — เก็บเป็น history)

## 🗺 ระบบนี้อยู่ที่ไหนบ้าง (3 ทางเข้า กรอกไม่เหมือนกัน)
| ทางเข้า | ไฟล์ | วิธีกรอก |
|---|---|---|
| สมัครสมาชิก | `app/register/page.tsx` + `app/api/register/route.ts` | กรอกเลขเปล่า → ระบบเติมคำนำหน้า |
| โปรไฟล์ → ขอแก้ไข | `public/tb-app.jsx` (Profile modal) → `app/api/admin/approve-edit-request/route.ts` | กรอกเลขเปล่า → admin อนุมัติ → ระบบเติม |
| admin แก้ user | `public/tb-modals.jsx` (RequestEditModal ~บรรทัด 3905) → `app/api/admin/edit-user/route.ts` | admin พิมพ์คำนำหน้าเอง |
| admin แก้ตัวเอง | `public/tb-app.jsx` ~บรรทัด 2820 → `app/api/admin/edit-self/route.ts` | edit-self ไม่เติมคำนำหน้า |

## 🔴 ต้นตอ: ตารางวิชาชีพ→คำนำหน้า ซ้ำ 4 ที่ และ KEY ไม่ตรงกัน
- `register/page.tsx` PROFESSIONS + `api/register` PREFIXES → key: **nurse1, nurse2, publichealthofficer, publichealthtech, medtech=ทน., physio=ก., radio=รส.**
- `tb-app.jsx` PROFESSIONS (~2434) + `approve-edit-request` PROFESSION_PREFIX (~25) → key: **nurse, publichealth, medtech='', physio='', radio=''** (คนละชุด!)

## บั๊กที่เกิดจริง
1. **🔴 พยาบาล/นักสาธารณสุข เปิดโปรไฟล์ → วิชาชีพกลายเป็น "อื่นๆ" + ไอคอน "?"** — สมัครเก็บ key `nurse1`/`publichealthofficer` แต่ tb-app PROFESSIONS หาไม่เจอ (มีแค่ `nurse`/`publichealth`) → ตกไป PROFESSIONS.other
2. **🔴 คำนำหน้าหายตอน admin อนุมัติคำขอแก้** — medtech/physio/radio (ทน./ก./รส.) ใน approve-edit มี prefix='' → "ทน.12345" → "12345" / พยาบาล key `nurse1` หาไม่เจอใน PROFESSION_PREFIX → ป. หาย
3. **🟠 ตัวตัดคำนำหน้าเดิมรู้จักแค่ 4 ตัว** — regex `/^([วทภป]\.)?(.*)$/` (tb-app mapDb ~2623) และ `/^[วทภป]\.\s*/` (approve-edit ~157) ตัด ช. ทน. ก. รส. สธ. ไม่ออก → คำนำหน้าซ้ำซ้อน/ค้างในช่อง
4. **🟡 approve-edit แปลง label ไทย→key ไม่ครบ** — PROFESSION_LABEL_TO_KEY ไม่มี "พยาบาลวิชาชีพ (ชั้นหนึ่ง)"/"(ชั้นสอง)"/"นักสาธารณสุข"/"นักวิชาการสาธารณสุข"

## 🎨 UX/UI ไม่เข้าท่า
1. หน้าสมัครโชว์ "(prefix: ภ.)" — อังกฤษ ขัดกฎภาษาไทย ควร "(คำนำหน้า: ภ.)"
2. 3 ทางเข้ากรอกไม่เหมือนกัน (2 ที่เลขเปล่า, admin พิมพ์เอง) → สับสน
3. admin แก้ไม่มี validation — ลืมพิมพ์คำนำหน้า = บันทึกเลขเปล่าเงียบๆ

## 💡 ทางแก้ที่แนะนำ (ตอนพี่กันสั่ง)
- **รวมตารางวิชาชีพเป็นแหล่งเดียว** (single source) แล้ว import ใช้ทุกที่ — เลิกก๊อป 4 ชุด
- ใช้ key ชุดเดียว (nurse1/nurse2/publichealthofficer/publichealthtech ตามที่ DB เก็บจริง)
- regex ตัดคำนำหน้าให้ครอบคลุมทุกตัว (ว ท ภ ป ช ทน ก รส สธ)
- ทำทุกทางเข้าให้กรอกแบบเดียวกัน (เลขเปล่า + ระบบเติม) รวม admin ด้วย

## ⚠️ ความเสี่ยงข้อมูลที่สมัครไปแล้ว
ถ้ามี user ที่สมัครเป็น nurse1/nurse2/publichealthofficer/publichealthtech อยู่ใน DB แล้ว → ตอนแก้โค้ดต้องเช็ค/migrate ค่า profession เดิมด้วย ไม่งั้นแสดงผลเพี้ยน

ดู [[tb-dashboard-pending-master]]
