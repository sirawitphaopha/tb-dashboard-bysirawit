---
name: tb-dashboard-2026-07-03-v0-7-19-6-22
description: TB Dashboard 3 ก.ค. — pull refactor ยักษ์จากมือถือ (47 commits ผ่าไฟล์ monolith) + push v0.7.19.6.22 (ยกเครื่อง generator changelog + CLAUDE.md ตัวตน/กฎ/commit-naming + อัปโครงสร้าง docs)
metadata:
  node_type: memory
  type: project
  originSessionId: 7aa68f83-dda6-4087-a662-3dcb5fe5fceb
---
# TB Dashboard — Session 2026-07-03

**Repo:** `D:\tb-dashboard-bysirawit` · main · push ตรง (Cloudflare Pages auto-deploy) · Live tbjourney.care
**Supabase:** `cioswzdbonnbhbyynrhh` (แคลร์ต่อ MCP รัน SQL เองได้)

## 📥 มือถือ push refactor ยักษ์ (47 commits) — แคลร์ pull ลงเครื่อง
ระหว่างวันพี่กันใช้ Claude Code มือถือ **ผ่าไฟล์ tb-monolith.jsx สำเร็จทั้งโครงการ**:
- **13,476 → 985 บรรทัด** (shell บาง ๆ) · ที่เหลือแตกเป็น `app/legacy/parts/` 30+ ไฟล์ (dashboard/ admin/ account/ patient-modal/ 11 ไฟล์ / patient-images/ changelog/ + shared/storage/misc/notifications/about + globals.js) · barrel file กัน import path เปลี่ยน
- **tb-data.js → 4 ไฟล์** (tb-constants/tb-calc/tb-seed/tb-db) · TbBundle load order: setup→constants→calc→seed→db→changelog→monolith
- +โฟลเดอร์ `docs/` (ideas.md · session-notes/ : cross-device-workflow, ai-roadmap, monolith-split-progress, refactor-round3-plan)
- ⚠️ pull แบบ `git checkout -- next-env.d.ts` + `git pull --ff-only` (local ตามหลัง 47 · ff ได้ ปลอดภัย) · เก็บ .env.local + node_modules (ไม่ clone ใหม่)

## ✅ push v0.7.19.6.22 (feature 639bad0 + chore 93a4f4c)
**1. ยกเครื่อง generator changelog** (`scripts/generate-changelog.mjs`) — แก้ 3 จุด:
- `extractVersion` regex 4→5 ช่วง (`{0,2}`→`{0,3}`) → refactor 21 ตัว (0.7.19.6.1–.21) **แยกครบ ไม่ยุบเป็น "0.7.19.6" ก้อนเดียว**
- `extractTitle` เปลี่ยนเป็น **"วนตัดหัว"** (do…while) ตัดชื่อโปรเจกต์/เลข version/ตัวคั่น จนเกลี้ยง — รองรับ commit เก่าทุกแบบสลับลำดับ ("feat: TB CARE & JOURNEY vX — …" และ "vX · TB-CARE LINK — …") · ใช้ `\p{Pd}` (dash ทุกชนิด Unicode) + คำ hotfix + scope prefix + ตัด version ท้าย
- `trimBody` ตัดบรรทัด `Claude-Session:` (ขยะจาก commit มือถือ)
- **ผล: changelog 22 → 116 version** (กู้ประวัติเก่าย้อนถึง v0.5.0 ที่ shallow clone มือถือเผลอตัดหาย) · title สะอาดทุกอัน 0 ขยะ · จัดกลุ่ม 3 ยุค (0.5 Genesis / 0.6 First Real Build / 0.7 Auth+Audit Era)
**2. CLAUDE.md** — +section "ตัวตน+วิธีสื่อสาร" (แคลร์=หญิง ค่ะ/นะคะ แทนตัวแคลร์ เรียกพี่กัน · พี่กัน=เภสัชกรเขียนโค้ดไม่เป็น) + ขยาย "วิธีทำงาน" เป็นกฎเต็ม (เดิมชี้ user memory ที่มือถืออ่านไม่ได้) + **กฎตั้งชื่อ commit** (subject `vX.Y.Z: ภาษาคน` ห้าม `refactor(...)/feat:` นำ = ต้นเหตุ title แปลก) + อัปโครงสร้าง (monolith→shell 985 + parts/ + tb-data 4 ไฟล์)
**3. README.md** — อัปแผนผังไฟล์หลัง refactor
**เหตุผล:** มือถือไม่มี user memory (~/.claude) + ไม่มีกฎ → ต้องย้ายกฎ/ตัวตนลง repo (CLAUDE.md ตามไปทุกเครื่อง) · หลักการจาก `docs/session-notes/2026-07-02-cross-device-workflow.md`

## 📌 กฎใหม่ (พี่กันสั่ง 3 ก.ค.)
**จัดระเบียบ+จัดหมวดประวัติเวอร์ชันเป็นระยะ** (นานๆที พี่กันสั่ง "ไปจัดระเบียบประวัติเวอร์ชัน") → ดู [[feedback-changelog-tidy]]

## 🏷 ชื่อเว็บ (พี่กันถาม จะเอาไปใส่หน้า About)
- **TB-CARE LINK = ชื่อเก่า** → เปลี่ยนเป็น TB CARE & JOURNEY → สลับเป็น **TB JOURNEY & CARE** ตอน **v0.7.11 (da21ba2)** เหตุผล "ให้ตรงโดเมน tbjourney.care"
- ⚠️ **"ความหมาย/ที่มา" ไม่มีบันทึกที่ไหน** — มีแค่เหตุผลเชิงโดเมน · ตอนทำ About ต้องถามพี่กันเล่าความหมาย (อย่าเดาใส่มั่ว) · design เก่าอยู่ [[design-tbcarelink]]

## 🔭 งานต่อ (พี่กันสั่ง — ทำหลัง push v22)
1. **หน้า About: ใส่ความหมายชื่อเว็บ + TB-CARE LINK เป็น "ชื่อในอดีต"** (รอพี่กันเล่าความหมาย · ตามรูป mockup ที่พี่กันส่ง)
2. **เพิ่มกฎ changelog-tidy ลง CLAUDE.md** (บอกมือถือด้วย · bundle กับงาน About)
- ค้าง (จาก docs): พี่กันเทสเว็บจริงหลัง refactor (กราฟ Chart.js) — เทสแล้วรอบนี้ ✓ · ระบบ AI (วางแผน ยังไม่เขียน) · รื้อหน้าผู้ป่วยทีละแท็บ · ideas 5 ข้อ (จอ 768p / Win7 / scrollbar auto-hide / หน้า wiki / แท็บความรู้วัณโรค+PDF viewer)

## 💡 หมายเหตุ
- dev ข้ามเครื่อง: `npm run dev -- -H 0.0.0.0 -p 3000` → เครื่องอื่น http://192.168.34.126:3000 (IP อยู่ใน allowedDevOrigins แล้ว)
- generator: `node scripts/generate-changelog.mjs > app/legacy/tb-changelog.js` แล้ว chore commit · **ห้ามแก้ tb-changelog.js มือ** (regenerate ทับ) · repo เต็ม (ไม่ shallow) → regenerate ได้ครบ
- version 3 จุด: tb-monolith APP_VERSION(~980)+BUILD_DATE · login/page.tsx · [[tb-dashboard-version-locations]]
