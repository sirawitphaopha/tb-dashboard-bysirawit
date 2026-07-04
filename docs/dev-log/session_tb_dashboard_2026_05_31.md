---
name: session-tb-dashboard-2026-05-31
description: 💬 v0.7.14.2 — ระบบ Comment ต่อ version + ป้าย New + UX iterations + bug fixes เยอะมาก
metadata:
  node_type: memory
  type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 📌 TB Dashboard session 2026-05-30 → 31 — v0.7.14.2 Comment System + UX Polish

## 🎯 เป้าหมาย
ต่อยอด Changelog Page (v0.7.14.1) — เติม 3 ฟีเจอร์: Housekeeping + ป้าย New + ระบบ Comment

## ✅ ที่ทำ

### Phase A — Housekeeping
- อัป v0.7.14.1 commit `pending` → `9e7b3e1` / `9e7b3e14f608e0e64a03fce9f6cc4247fc0ce53a`
- Sync body field v0.7.14.1 ให้ตรง `git log 9e7b3e1 --format=%B`

### Phase B — ป้าย "New" บน sidebar
- localStorage `tb_changelog_last_seen`
- Dot สีแดง pulse + badge "New" บน sidebar เมนู "ประวัติเวอร์ชั่น"
- กดเข้าหน้า → setItem → dot หาย

### Phase D — ระบบ Comment ต่อ version (ใหญ่สุด)
- **DB:** `tb_changelog_comments` 12 cols + 3 indexes + RLS 4 policies
- **Snapshot:** email + display_name + role + profession_label (ไม่หายแม้ user ถูกลบ)
- **6 API endpoints:**
  - POST `/api/changelog/comment` (insert + email)
  - PATCH `/api/changelog/comment/[id]` (edit own)
  - DELETE `/api/changelog/comment/[id]` (soft delete own หรือ admin)
  - GET `/api/changelog/comments?version=X` (list + is_admin)
  - GET `/api/changelog/comment-counts` (counts รวด)
- **Email template:** `changelogCommentNotifyEmail` — กรอบอำพัน + date/time พ.ศ. + tbjourney.care fallback
- **UI:**
  - Component `ChangelogCommentSection` (~270 บรรทัด) — React.memo + theme prop
  - 4 status: feedback/bug_report/request/note + badge สี
  - Soft delete (deleted_at + deleted_by)
  - Edited flag

## 🎨 UX iterations (หลายรอบ)
- ปุ่ม "ความคิดเห็น" ใต้ version card ใหญ่ๆ ชัดเจน (เดิม chip เล็ก)
- "ดูเต็ม" → "บันทึกฉบับเต็ม" + ปุ่ม copy icon (สี่เหลี่ยมซ้อน) แยก
- Copy ฉบับย่อ vs ฉบับเต็ม — แยกชัด + Toast
- Comment ที่มี → สีอำพัน (กรอบ + ปุ่ม + filter)
- **Auto-expand version ที่มี comment** — เห็นทันที
- **Avatar เปลี่ยน:** อักษรย่อ (นส) → profession label
  - ใช้ชื่อเต็ม (เภสัชกร/แพทย์/พยาบาล) ไม่ใช่ตัวย่อ (ภก./ภญ./นพ.)
- Comment card 2 แถว (header + body) — ไม่มี avatar row แยก
- Banner + filter ห่อใน sticky group เดียว — ไม่ทับกัน
- Icon 💬 ใน header version + banner stats

## 🐛 Bug fixes (เยอะมาก)
1. **Infinite re-render loop** — `useCallback([..., onCountChange])` + parent ส่ง arrow function ใหม่ทุก render → loop
   - แก้: useRef
2. **VersionCard remount loop** — function reference ใหม่ทุก render
   - แก้: ลบ component → inline JSX
3. **Email argument shift** — ลืม pass commentText → URL ไปอยู่ที่ commentText slot
4. **Comment overflow** — คำยาวๆ ล้นกล่อง (UI + email)
   - แก้: word-break + overflow-wrap + max-width
5. **Sticky overlap** — banner สูงขึ้น → ทับ filter
   - แก้: ห่อใน sticky group เดียว
6. **profession_label column not exist** — ลืมเตือนรัน migration
7. **BUILD_DATE สลับวัน** — session ข้าม 30 → 31 พ.ค.

## ⚡ Performance
- React.memo wrap CommentSection
- useMemo สำหรับ filteredTimeline
- Bulk fetch /comment-counts รวด 1 ครั้ง
- useCallback setCommentCount + กัน update ซ้ำ

⚠️ **ที่ยังเหลือ** (รอ v0.7.16): Network latency ตอน fetch comment per section → bulk fetch + pre-compile JSX + lazy load

## 📦 Push
- commit `b9e10ae` / `b9e10ae10f78ab9ecbada5524be416d4881e9686`
- 11 files / +986 / -48
- ไฟล์ใหม่: 4 API routes + 2 SQL scripts
- ไฟล์ที่แก้: tb-app.jsx (+485) + tb-changelog.js + email-templates + login + app.html

## 📝 Version
- APP_VERSION: 0.7.14.1 → 0.7.14.2
- BUILD_DATE: **30 → 31 พ.ค. 2569** (session ข้ามวัน)
- login footer: Version 0.7.14.2
- Cache buster: v=51 → v=65 (14 รอบ)

## 🚧 ต่อไป
- อัป v0.7.14.2 pending → `b9e10ae` / `b9e10ae10f78ab9ecbada5524be416d4881e9686` ใน push หน้า
- Body checkup v0.7.14.0/14.1/14.2 (3 versions รอบหน้า)
- **v0.7.15:** ระบบอัปโหลดภาพ (R2 + AVIF/webp)
- **v0.7.16:** Performance optimize (bulk fetch + pre-compile JSX)
- Pending Master ที่เคลียร์: ✅ D (Comment system) — เหลือ F (deep link) + G (New badge ทำแล้ว)

## 💡 Lesson Learned (เพิ่มเติมจาก feedback_push_flow)
- **SQL file path ต้องอยู่บรรทัดแรกสุด** (ลืมไป 2 ครั้งใน session นี้) — บันทึกใน feedback_sql_file_path.md
- React `useCallback` deps สำคัญมาก — function prop จาก inline arrow = ใหม่ทุก render
- Inline component definitions ใน parent → remount issue เสมอ
- Email arg ordering ต้อง match function signature ทุกตัว — ตกแถวเดียวก็พังหมด

ดู [[feedback_push_flow]] · [[feedback_sql_file_path]] · [[session-tb-dashboard-2026-05-30-part3]]
