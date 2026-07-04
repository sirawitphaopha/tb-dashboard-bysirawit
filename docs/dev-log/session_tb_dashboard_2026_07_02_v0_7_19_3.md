---
name: tb-dashboard-2026-07-02-v0-7-19-3-4
description: 🔁 กลับมาทำ TB Dashboard (ห่าง ~1 เดือน) — push v0.7.19.3 (เก็บงานค้าง) + v0.7.19.4 (ถังขยะรูปครบวงจร+มุมมองรูป) + v0.7.19.5 (ระบบวัดพื้นที่ storage แอดมิน + จัด sidebar ยุบ)
metadata:
  node_type: memory
  type: project
  originSessionId: 7aa68f83-dda6-4087-a662-3dcb5fe5fceb
---
# TB Dashboard — Session 2026-07-02 (กลับมาทำใหม่หลังห่างเกือบเดือน)

**Repo:** `D:\tb-dashboard-bysirawit` (ย้ายจาก C:\) · branch main · push ตรง (Cloudflare Pages auto-deploy) · Live https://tbjourney.care
**Supabase project TB Dashboard:** `cioswzdbonnbhbyynrhh` (แยกจาก tb-calculator/Daily Quest) · **แคลร์ต่อ MCP รัน SQL เองได้แล้ว** (พี่กันไม่ต้องรันมือ · แต่ยังเซฟไฟล์ .sql เป็นหลักฐาน) · ⚠️ mass DELETE บนตารางคนไข้ถูก auto-mode บล็อก → ต้อง count ก่อน + ลบด้วย id list ที่ระบุชัด

## ✅ push v0.7.19.3 (feature ab89475 + chore 2ee165b) — เก็บงานค้างในเครื่อง (ค้างตั้งแต่ 4 มิ.ย.)
- ลบไฟล์กำพร้าใน R2 ตอนลบผู้ป่วยถาวร (purge API) + empty state สวย + กันลาก/คลิกขวาทัมเนล
- **เขียน CLAUDE.md ใหม่ (เดิมล้าสมัยอ้าง iframe) + README.md ใหม่** · next.config allowedDevOrigins += 192.168.34.126

## ✅ push v0.7.19.4 (feature 8c26869 + chore d486446) — ระบบถังขยะรูปภาพครบวงจร
1. **ถังขยะรูป — soft-delete เก็บไฟล์** (แก้ของเดิมที่ลบ R2 ทันที → กู้คืนไม่ได้) · ลบ R2 จริงเฉพาะลบถาวร/purge
2. **ถังขยะรวมทุกผู้ป่วย ในเมนู "ถังขยะ"** — `TrashHub` สลับ [ผู้ป่วย=TrashList] / [รูปภาพ=ImageTrashPage] · โหลด `/api/patient/images/all?trash=1` จัดกลุ่มตามผู้ป่วย(ชื่อ+HN) + ค้นหา/กรองหมวด/เรียง(ใกล้ลบถาวร·ล่าสุด) + คลิกซูม
3. **ระบบมุมมองรูป** `ImgViewToolbar` + `IMG_VIEW_SIZES` — การ์ด 3 ขนาด (ไอคอน fa-image ขยายแบบ Windows) + แถว(คอลัม) · การ์ดเล็กสุด=ปุ่มไอคอนล้วน · ปุ่ม+เหลือกี่วันชิดล่าง (ตรงกันทุกใบ marginTop:auto)
4. **การลบเข้มเท่าลบผู้ป่วย** — ย้ายเข้าถัง: เหตุผล+HN → ยืนยัน 2 สเต็ป · ลบถาวร: HN+ติ๊ก → ยืนยัน 2 สเต็ป · ปุ่มยืนยันแดงอยู่**ซ้าย**ในสเต็ป 2 · popup 2 สเต็ปสูงเท่ากัน (minHeight ตรึง: ย้ายเข้าถัง 404 / ลบถาวร 366 + ปุ่มชิดล่าง) · ทำทั้งแท็บรูป+คลังรูป
5. **UX** — ลบถาวร/กู้คืน optimistic หายทันที + realtime กู้คืนเด้งกลับ · ตัวดูรูปในถังมีเมนูกู้คืน/ลบถาวร popup ทับรูป (ไม่ปิด lightbox z10001 < popup z10002) · วันที่ลบมีปี · ชื่อผู้ป่วยสีเทลใน popup
6. **DB** — +คอลัมน์ `tb_patient_images`: deleter_name, delete_reason, delete_req_by/name/at/reason + index (เผื่อเฟส 2) · ลบรูปกำพร้าเก่า 8 รูป (id list · ไฟล์หายก่อนมีระบบ)

## ✅ push v0.7.19.5 (feature 01ee271 + chore dc7fa6b) — ระบบวัดพื้นที่จัดเก็บ (Storage) แอดมิน + จัด sidebar ยุบ
1. **API `/api/admin/storage`** (admin เท่านั้น): DB = `pg_database_size` แยกพื้นที่ระบบ(system) vs ข้อมูลจริง(user_tables) quota 500MB · R2 = นับจริง ListObjectsV2 ทั้ง 2 ถัง(patient+avatar) quota 10GB + แยกหมวด(cxr/lab/document/other) จาก size_bytes + thumbsOther
2. **lib/r2.ts +`r2BucketUsage(bucket)`** — ไล่ list ทีละ 1000 รวม `<Size>` จนครบ (continuation token) ใช้กุญแจ R2 เดิม ไม่ต้อง API token เพิ่ม
3. **SQL 2 ฟังก์ชัน** (SECURITY DEFINER, grant service_role, รันผ่าน MCP แล้ว · verify มีจริงก่อน push): `get_db_stats()` (add-db-stats-function.sql), `get_db_size()` (add-get-db-size-function.sql)
4. **UI (tb-monolith.jsx)**: `StorageMiniCard` การ์ดที่ 5 KPI แดชบอร์ด(admin·กด→แท็บ storage ผ่าน `_settingsWantTab`·เด้ง+ขอบสี+hover) · `StorageDonut`+`StorageDetail` แท็บ "พื้นที่จัดเก็บ" ตั้งค่า(วงกลม+บาร์แยกสีตามหมวดแบบ iPhone+แยก system/ข้อมูลจริง+ลิงก์ Supabase/Cloudflare) · `StorageAlert` popup เตือนทุกครั้งเข้าเว็บเมื่อ ≥80% admin เท่านั้น · cache localStorage(STORAGE_TTL)+skeleton กัน layout shift · % แสดง x.xxx
5. **Sidebar ยุบ**: ลดกว้าง 72→56px + จัด icon/โลโก้/โปรไฟล์/logout/ปุ่มข้อมูลระบบ กลางที่ 28px เท่ากันหมด (วัดจริงเบราว์เซอร์) · chevron -12→-10 · ⚠️ **พี่กันยังไม่พอใจ 100% (จะนอน สั่ง push ก่อน) — ปรับ sidebar ต่อรอบหน้า**
6. **เอกสาร**: CLAUDE.md +section "Storage usage monitor (admin)" · README +bullet พื้นที่จัดเก็บ · BUILD_DATE 3 ก.ค. 2569 (ข้ามเที่ยงคืนตอน push)

## 🏗 โครงสร้างจริง (v0.7.17.0+ เลิก iframe)
- `app/page.tsx`(auth) → `TbAppMount`(dynamic ssr:false) → `TbBundle`: setup→tb-data.js→tb-changelog.js→**tb-monolith.jsx** (12,897+ บรรทัด/904KB — ตัวใหญ่ควรแบ่ง)
- **version 3 จุด:** tb-monolith APP_VERSION(~8380)+BUILD_DATE · login/page.tsx
- **changelog auto-gen:** `node scripts/generate-changelog.mjs > app/legacy/tb-changelog.js` (จาก commit body) แล้ว chore commit
- ⚠️ commit ต้องเว้น next-env.d.ts (auto-gen) + scripts/rollback-cleanup-easter-egg-log.sql (ของเก่าไม่เกี่ยว)

## 🗑 ดีไซน์ถังขยะ/ขอลบรูป (ล็อกกับพี่กันแล้ว)
- ถังรวม (ไม่ใช่ต่อผู้ป่วย) · admin คุมกู้/ลบถาวรคนเดียว · 60 วัน auto-purge
- ลบทุกที่ต้องพิมพ์ HN + เหตุผล + ยืนยัน 2 ชั้น (พี่กันเน้น "ลบให้ยาก")
- **เฟส 2 ขอลบรูป:** user ทั่วไป (ไม่ใช่คนอัป) กด "ขอลบ" → **รูปขึ้นฝ้าขาว + ตัวหนังสือกลางรูป "รอแอดมินอนุมัติลบรูป"** → admin อนุมัติ(เข้าถัง)/ไม่อนุมัติ · 🚨 **ต้องส่งเมล + กระดิ่ง เหมือนลบผู้ป่วยเป๊ะ** (tb_notifications + resend · pattern จาก /api/patient/delete-request + delete-notify)

## 🔭 งานถัดไป (อัปเดต 3 ก.ค. หลัง push v0.7.19.5)
0. 🚨 **เกลา sidebar ต่อ — พี่กันยังไม่พอใจ** (ยุบ 56px จัดกลาง 28px แล้ว แต่ยังไม่โดนใจ · จะคุยต่อรอบหน้า) + เกลาหน้าตั้งค่า storage (ช่องว่างกลาง)
1. **เอาระบบมุมมอง (การ์ด/แถว/ขนาด) ไปใส่ คลังรูป + แท็บรูปในผู้ป่วย** (ตอนนี้มีแค่ถังขยะ · ยังไม่ทำ)
2. **เฟส 2 ขอลบรูป** (ฝ้าขาว + เมล + กระดิ่ง) — คอลัมน์ DB delete_req_* เตรียมไว้แล้ว
3. **auto-purge 60 วัน** — Supabase Edge Function ลบ R2+DB (pg_cron ปกติลบ R2 ไม่ได้) → deploy ผ่าน MCP
4. **เว็บเร็วขึ้น + แบ่งไฟล์ tb-monolith** (12,897 บรรทัด) — งานใหญ่ session แยก
- บันทึกไว้: favorite รูป · DICOM · ซิงก์ซูมเทียบ CXR · ระบบหลายแอดมิน · AI ช่วยกรอก (ตอนรื้อหน้ากรอก)

## 💡 หมายเหตุ
- เทส dev ข้ามเครื่อง: `npm run dev -- -H 0.0.0.0 -p 3000` → เครื่องอื่น http://192.168.34.126:3000
- 🐛 บทเรียน: ตั้ง minHeight popup ให้เท่ากันต้อง**วัดจริง** ไม่ใช่กะจากโค้ด (เดาต่ำหลายรอบ พี่กันหงุดหงิด) — สเต็ปที่มี textarea สูงกว่า · วิธีชัวร์=grid-stack เอาสเต็ปสูงสุดเป็นตัวตั้ง
- ดูเพิ่ม [[tb-dashboard-pending-master]] · [[tb-dashboard-cxr-v0-7-19]] · [[tb-dashboard-version-locations]]
