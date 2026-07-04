---
name: session-tb-dashboard-2026-05-30-part3
description: 📜 v0.7.14.1 — Changelog Page ขยายผลรอบใหญ่ + flow push ฉบับมาตรฐาน
metadata:
  node_type: memory
  type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 📌 TB Dashboard session 2026-05-30 (part 3) — v0.7.14.1 Changelog Polish

## 🎯 เป้าหมาย
ต่อยอด Changelog Page (v0.7.14.0) ที่เปิดตัว — เติมลูกเล่นเก็บตก + ขยาย data จาก 3-4 bullets → 7-15 bullets ครบ 47 entries

## ✅ ที่ทำ

### ฟีเจอร์ใหม่ใน ChangelogPage (5 อย่างหลัก)
1. **Banner stats breakdown** — subtitle แสดง 🆕14 · 🎨26 · 🐛18 · 🔒12 · ⚙️8 · 📝4 (กดเป็น filter ได้)
2. **Copy commit hash** — chip กดได้ + เปลี่ยนเป็น ✓ copied + คงเดิม
3. **Copy commit ฉบับย่อ** (icon copy สี่เหลี่ยมซ้อน สีอำพัน) — copy version + title + bullets (ไม่รวม body) + Toast
4. **Copy commit ฉบับเต็ม** (ปุ่ม "คัดลอกทั้งหมด" ใน popup) — copy version + title + body ครบ + Toast
5. **Commit Detail Modal** — popup กลางจอ แสดง commit body ฉบับเต็ม + commit hash 40 ตัว (กด copy ได้) + GitHub link
6. **Search highlight** — พื้นเหลือง <mark> ใน title/version/text ที่ค้นเจอ
7. **Sticky banner + filter bar** — ตรึงบนสุดเลื่อนตามไม่ได้
8. **Tag breakdown** ใน version card (🆕3 · 🎨5 · 🐛2) — กดได้เป็น filter
9. **ปุ่ม icon "fa-regular fa-copy"** เหมือน Claude Desktop — กดแล้วเปลี่ยนเป็น fa-check 1.8s

### Bug fixes
- **กด chip → หน้าเด้งขึ้นบน** (เหตุ: browser auto-scroll button ให้เข้า viewport ตอน focus + sticky banner บัง)
  - แก้: `tabIndex={-1}` + `onMouseDown preventDefault` กัน focus ตั้งแต่ mousedown
- **กด chip ใน Grouped → row collapse** (เหตุ: parent row onClick toggle)
  - แก้: `stopPropagation` ทุก button + wrapper span

### Data expansion (47 entries)
- เพิ่ม **`scripts/generate-changelog.mjs`** — auto-generate ข้อมูลจาก git log
- algorithm: extract bullets จาก `-/•/*/·` lines + TAG_RULES detect tag จาก keyword + dedupe + group by major
- output ทั้ง `commit` (7 ตัวสั้น) + **`commitFull` (40 ตัวยาว)** สำหรับใช้กับ git log
- เพิ่ม **field `body`** เก็บ commit message ฉบับเต็ม (ตัด Co-Authored-By + ส่วนคุยกับพี่กันออก)
- ครอบคลุม 63 versioned entries (v0.5.0 → v0.7.14.0) + v0.7.14.1 เพิ่มที่ top แบบ pending

## 🐔 Chicken-and-egg ของ commit hash
- v0.7.14.1 entry ใน tb-changelog.js ใส่ `commit: "pending"` + `commitFull: "pending"`
- รอบถัดไปต้องอัป → hash จริง = **commit `9e7b3e1` / `9e7b3e14f608e0e64a03fce9f6cc4247fc0ce53a`**
- **ห้ามใช้ generate-changelog.mjs script** อัปย้อนหลัง — จะ overwrite bullets/body ที่เขียนมือ ใช้ Edit ตรงๆ แทน

## 📦 Push
- commit `9e7b3e1` / `9e7b3e14f608e0e64a03fce9f6cc4247fc0ce53a`
- 5 files / +1656 / -440
- ไฟล์: app/login/page.tsx, public/app.html, public/tb-app.jsx, public/tb-changelog.js, scripts/generate-changelog.mjs (ใหม่)

## 📝 Version
- APP_VERSION: 0.7.14.0 → 0.7.14.1 (patch — ขยายฟีเจอร์เดิม)
- BUILD_DATE: 30 พ.ค. 2569 (วันเดียวกับ 0.7.14.0)
- login footer: Version 0.7.14.1
- Cache buster: v=40 → v=51 (bump 9 รอบในวันเดียว ตามการ tweak ต่อเนื่อง)

## 💡 สิ่งใหม่ที่ได้จาก session นี้
- 📜 **บันทึก Push Flow** ฉบับมาตรฐาน — [[feedback_push_flow]]
  - Phase 1 เตรียม: อัป "pending" ก่อนหน้า → ร่าง commit → เพิ่ม entry ใหม่ → bump version + BUILD_DATE → cache buster → verify
  - Phase 2 Push: stage เฉพาะไฟล์ → commit ด้วย HEREDOC → push
  - Phase 3 หลัง: save session memory
  - **ห้ามอัป "pending" ของเวอร์ชันที่เพิ่ง push** — ทิ้งไว้ให้รอบถัดไปแก้

## 🚧 ต่อไป
- รอบหน้า: อัป v0.7.14.1's pending → `9e7b3e1` / `9e7b3e14f608e0e64a03fce9f6cc4247fc0ce53a` ก่อน
- **🔍 Checkup body field**: v0.7.14.1's body ใน tb-changelog.js เป็น draft เก่า ไม่ match commit message ที่ push จริง — ต้อง Edit body ให้ตรง `git log 9e7b3e1 --format=%B` ตอนรอบหน้า
- รอบถัดๆ ไป: ทำตาม [[feedback_push_flow]] หัวข้อ "ตรวจทาน body field — ทุก 2-3 versions"
- Pending Master ที่ทำเสร็จไป (จากข้อ 45):
  - ✅ A. Copy commit ฉบับเต็ม + Toast
  - ✅ B. แบนเนอร์ตรึง (sticky)
  - ✅ C. Icon จำนวนการแก้ไข กดเป็น filter
  - ✅ E. เปลี่ยนคำปุ่ม "ดูเต็ม" → "บันทึกฉบับเต็ม"
- Pending Master ที่เหลือ (ข้อ 45):
  - ⏳ D. ระบบ Comment ต่อ version (เก็บ DB + status feedback/bug)
  - ⏳ F. คลิกที่ change → deep link ไปฟีเจอร์
  - ⏳ G. ป้าย "New" บน sidebar ถ้ามี version ใหม่ที่ยังไม่ได้ดู
- Roadmap หลัก: v0.7.15 (อัปโหลดรูป R2), v0.7.16 (performance optimization)
- Epic Audit/Log: ขั้นที่ 4 Sensitive Action Log ยังไม่เริ่ม

ดู [[session-tb-dashboard-2026-05-30-part2]] · [[feedback_push_flow]] · [[tb-dashboard-pending-master]]
