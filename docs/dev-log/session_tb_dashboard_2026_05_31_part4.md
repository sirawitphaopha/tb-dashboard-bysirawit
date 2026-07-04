---
name: session-tb-dashboard-2026-05-31-part4
description: 💬 v0.7.14.5 — Changelog Comment Overhaul (Realtime + Reply + Resolve + @mention + Like + Edit history + Tombstone + Bell scroll/flash) + hotfix Admin bell + keyboard nav + Enter ส่ง + Resolve admin-only
metadata:
  node_type: memory
  type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 📌 TB Dashboard session 2026-05-31 (part 4) — v0.7.14.5 Comment Overhaul + Hotfix

## 🎯 เป้าหมาย
ยกระดับ Changelog Comment จาก "กล่อง feedback ทางเดียว" → "discussion + issue tracking system" ใช้ได้จริงในรพ.

## ✅ Features หลัก (Tier A + B + Bonus 13 ฟีเจอร์)

### Tier A — Discussion + Tracking
1. **Realtime auto-update** — Supabase Realtime ทั้ง comments + likes channels (debounce 300ms)
2. **Reply 1 ระดับ** — ไม่ nested ลึก, parent ลบ → reply ยังอยู่ (ไม่ cascade)
3. **Mark resolved + label ตาม status** — CTA ก่อนกด (ไม่มี ✓): 🔧 บั๊กนี้แก้แล้ว / ➕ ฟีเจอร์นี้เพิ่มแล้ว / 👍 รับทราบ · Badge หลังกด: ✓ แก้ไขบั๊กแล้ว / เพิ่มฟีเจอร์นี้แล้ว / รับทราบ
4. **Notify commenter** — bell + email 3 types (reply/mention/resolved)

### Tier B — Productivity boosters
5. **@mention + autocomplete (LINE-like)** — pre-fetch + caret position + กรอบเทล 2px เข้ม + admin highlight (bg อำพัน + badge ADMIN) + รองรับชื่อไทย + email-style username
6. **Like 👍** — กดได้ทั้ง parent + reply, optimistic update
7. **Edit history** — snapshot ลง tb_changelog_comment_edits + modal ดูได้
8. **Filter + Sort + Hide resolved** — default sort: ใหม่สุดอยู่ล่าง (chat-style)

### Bonus
9. **Tombstone** — comment ที่ลบไม่หาย, user เห็น "[ข้อความนี้ถูกลบ]", admin ดูข้อความเดิมได้ (toggle)
10. **Admin "ลบไป N" ที่ banner** — รวม reply
11. **Bell click → scroll + flash** — retry pattern 100ms × 40, CSS commentFlash 2.4s (เทล→อำพัน→ขาว)
12. **Text comment ใหญ่ + สีเทล** — 18px parent / 16px reply, weight 600, color #0f766e
13. **relTime auto-update** — setInterval 30s force re-render

## 🐛 Bugs ที่เจอ + แก้ระหว่างทาง (12 ข้อ)

| # | ปัญหา | สาเหตุ | แก้ |
|---|---|---|---|
| A | **tb-app.jsx 0 bytes** (CRITICAL) | disk เต็ม 100% (Temp folder) → ENOSPC ตอน Edit | git restore + reconstruct ChangelogCommentSection ทั้งหมด → จดใน roadmap (ข้อ 50): ย้าย project ไป D drive |
| B | Mention ไม่แจ้งกระดิ่ง — case-sensitive | regex lowercase แต่ DB เก็บ "SirawitP" → `.in()` ไม่เจอ | เปลี่ยนเป็น `.or()` + `.ilike()` |
| C | Mention regex ตัดที่ @ กลาง email | `@kikmydad1400@gmail.com` → match แค่ "kikmydad1400" | regex ใหม่ `/@([\w.\-]+(?:@[\w.\-]+\.[A-Za-z]{2,})?)/g` |
| D | Realtime ไม่ broadcast event ตอน soft delete | SELECT RLS USING (deleted_at IS NULL) → row หลัง UPDATE ไม่ผ่าน RLS → ไม่ broadcast | SQL `fix-changelog-comment-rls-for-realtime.sql` → SELECT USING (true) + admin client mask |
| E | insertCommentNotif silent fail | CHECK constraint เก่าใน tb_notifications + try-catch กลืน error | SQL `fix-tb-notifications-for-comment-types.sql` → DROP CHECK + ADD columns + Realtime + เพิ่ม `console.error` |
| F | Comment count ไม่นับ reply | counts = parents.length | คำนวณ active + deleted แยก รวม reply |
| G | Delete cascade reply → orphan UX | ลบ parent → reply หายด้วย | เลิก cascade → tombstone |
| H | Notification หายจากกระดิ่งหลังคลิก | filter `is_read=false` → row หาย | ดึง 50 ล่าสุดทั้งหมด + sync readAlerts จาก DB |
| I | Bell click ไม่ scroll + ไม่ flash | setTimeout 400ms — CommentSection mount ช้า | retry interval 100ms × 40 (4s) |
| J | Like delay 3 วินาที | รอ network + realtime | Optimistic update |
| K | @ popup ขึ้นช้าครั้งแรก | fetch tries on first @ | Pre-fetch ตอน mount + cache 60s |
| L | tag admin ไม่แจ้ง bell | (เพิ่มในรอบ hotfix) | ดู hotfix ด้านล่าง |

## 🩹 v0.7.14.6 — Hotfix v0.7.14.5 (commit 5dd48e2 + version bump 1a5c62e)

### แก้ 4 ปัญหา:
1. **Admin bell ทุก comment ของ user** — เพิ่ม `notifyAdminsOfNewComment` helper → query ทุก admin + insert tb_notifications type='comment_new' + skip ที่จะได้ notif เฉพาะแล้ว
2. **Keyboard nav ใน @ popup** — ↑↓ Enter Tab Escape ใน handleTextareaKey helper
3. **Enter = ส่ง · Shift+Enter = newline** — override default ใน textarea (กัน IME composing)
4. **Resolve admin-only** — user เจ้าของไม่เห็นปุ่ม + API guard isAdmin only (เพราะ user เจ้าของคือคนแจ้ง ไม่ใช่คนแก้บั๊ก)

## 📦 Push (3 commits)

### Main commit
- `4d32b08` / `4d32b087e50a829a0ebf901911992750bae3e763` (v0.7.14.5)
- 20 ไฟล์ / +1620 / -183
- 10 ไฟล์ใหม่ (API + helpers + SQL × 3)
- 11 ไฟล์แก้

### Hash update
- `482e9b4` — chore: update v0.7.14.5 commit hash → 4d32b08

### v0.7.14.6.1 — Hotfix admin bell (2 commits)
- `f388631` / `f388631ce4b11558064eac0265fed4dfd344e1c9` — fix frontend guard + debug log
- `c59678f` — chore: update v0.7.14.6.1 hash
- 5 ไฟล์ +60/-22

### v0.7.14.6 — Force push รวมเป็น 1 commit (squash หลัง user ต่อว่า)
- เดิม: 3 commits (5dd48e2 fix + 1a5c62e bump + 2dfa0f4 hash) → user ต่อว่า "พุชสองอันทำซากอะไร"
- แก้: `git reset --soft HEAD~3` → squash → force push
- ปัจจุบัน:
  - `c58a09c` / `c58a09cb6e1a8a41eeef9298d7ec84a18880bbff` — รวมทุกอย่างใน 1 commit
  - `77db8da` — chore: update v0.7.14.6 hash → c58a09c

⚠️ **ที่เรียนรู้สำคัญ:**
1. **ห้าม push โดยไม่ถาม "พุชด้วยไหมคะ" ทุกครั้ง** — เริ่มนับใหม่หลังทุก push
2. **ทุก fix หลัง push ต้อง bump version ใหม่** (patch +1) — ไม่ทับเลข version เดิม
3. **เมื่อ user ต่อว่าและสั่ง "พุชซ้ำเลย" / "ทับเลย"** = force push (squash หลายๆ commit เป็น 1) — ไม่ใช่ commit เพิ่มอีก 2 commit

## 📝 Version
- APP_VERSION: 0.7.14.4 → **0.7.14.5** → **0.7.14.6** (hotfix)
- BUILD_DATE: 31 พ.ค. 2569
- login footer: Version 0.7.14.6
- Cache buster: v=75 → v=76 → v=77

## 📁 ไฟล์ใหม่ทั้งหมด (10 ไฟล์)
- `scripts/add-changelog-comment-extensions.sql` — DB หลัก
- `scripts/fix-changelog-comment-rls-for-realtime.sql` — RLS
- `scripts/fix-tb-notifications-for-comment-types.sql` — CHECK + columns
- `app/api/changelog/comment/[id]/reply/route.ts`
- `app/api/changelog/comment/[id]/resolve/route.ts`
- `app/api/changelog/comment/[id]/like/route.ts`
- `app/api/changelog/comment/[id]/history/route.ts`
- `app/api/changelog/mentionable-users/route.ts`
- `lib/changelog-comment-helpers.ts`

## ⚠️ SQL ที่ต้องรันก่อน deploy (3 ไฟล์ idempotent)
1. `scripts/add-changelog-comment-extensions.sql`
2. `scripts/fix-changelog-comment-rls-for-realtime.sql`
3. `scripts/fix-tb-notifications-for-comment-types.sql`

## 🚧 ต่อไป
- PATCH comment ที่เพิ่ม @mention คนใหม่ → trigger notify (ตอนนี้ยัง)
- Email throttle/digest กัน spam admin
- v0.7.15 Performance Optimize (pre-compile JSX + virtualization)
- ย้าย project ไป D drive (roadmap ข้อ 50 — หลัง disk full incident)
- Body checkup v0.7.14.0/14.1/14.2/14.3/14.4/14.5

## 🐛 Bug หลัง v0.7.14.6 — Admin ไม่ได้กระดิ่ง (root cause + fix)

**อาการ:** user คนอื่น tag/reply admin → admin ไม่เห็นกระดิ่งเด้งในเว็บ
(แต่ DB มี notification รอ + อีเมลส่งถึง — แสดงว่า backend สำเร็จ)

**Root cause:** ใน `tb-app.jsx` 2 ที่ตั้ง condition guard กัน admin ออก
1. บรรทัด 1776-1797 — initial load: `if admin → load admin queues only · else → loadUserNotifications`
   → admin ไม่เคยเรียก `loadUserNotifications` เลย
2. บรรทัด 1834-1835 — Realtime subscription:
   `if (!currentUser?.id || currentUser.role === 'admin') return;`
   → admin ไม่ subscribe channel ของ tb_notifications

**ทำไมตั้งแบบนี้แต่แรก:** admin เคยมีแค่ admin alerts (delete-requests, edit-requests) — ไม่มี notification ที่ admin ได้รับ → ตั้ง guard เพื่อ save resource

**Trigger bug:** v0.7.14.5 เพิ่ม comment_reply / mention / resolved / comment_new ที่ admin ได้รับ → ไม่มีใครคิดถึง guards เก่า

**Fix:**
1. ย้าย `loadUserNotifications()` ออกจาก else → เรียก**ทุก role** (admin + user)
2. ลบ `currentUser.role === 'admin'` ออกจาก Realtime subscription condition

**Debug process:**
- เพิ่ม console.error ใน notifyAdminsOfNewComment + insertCommentNotif
- ตรวจ DB ผ่าน Supabase MCP execute_sql → พบ notification 5 รายการ → ปัญหาไม่ใช่ backend
- ตรวจ RLS → ปกติ (user_id = auth.uid())
- ตรวจ frontend → เจอ guard ที่ตัด admin ออก

**Lesson:**
- เพิ่มฟีเจอร์ที่ใช้ตาราง notification → **ต้องเช็คทุก condition guard ที่กรอง role/type** ในส่วน initial load + Realtime subscription
- Supabase MCP `execute_sql` ดี debug ตรงจาก DB — แยก backend issue vs frontend issue เร็ว

## 💡 Lesson Learned

### Disk space
- **C drive เต็ม 100% = Edit tool ทำลายไฟล์** (ENOSPC truncate) → ต้องย้าย project ไป D
- ลบ Temp folder + browser cache + node_modules cache เป็นประจำ

### Realtime
- **Supabase Realtime broadcast ตาม RLS** — ถ้า row ไม่ผ่าน SELECT policy → ไม่ส่ง event
- ใช้ admin client + mask ที่ frontend แทนการพึ่ง RLS เป็น security boundary

### Mention parser
- Username case-sensitive (`.in()`) เป็นกับดักง่าย → ใช้ `.or()` + `.ilike()` เสมอ
- Email-style username (มี @ กลาง) → regex ต้องรองรับ

### UI/UX
- Keyboard navigation (↑↓ Enter Esc) + Enter ส่ง = ลด friction มาก (เภสัชใช้คีย์บอร์ดเร็ว)
- Optimistic update สำคัญสำหรับ action บ่อยๆ (like, delete) — รอ realtime ไม่ wait
- Tombstone > hard hide — กันสับสน (ผู้ใช้รู้ว่ามีอะไรอยู่ตรงนั้น)
- Pre-fetch + cache > on-demand fetch สำหรับ data ที่ใช้บ่อย (mention users)

### Notification
- Admin ต้องได้ notif ทุก action ของ user (รพ.ปรางค์กู่ scale เล็ก) → ใช้ type 'comment_new' + skip ซ้ำ
- Bell ที่อ่านแล้วไม่ควรหาย → ดึง read + unread, แยก visual

ดู [[session-tb-dashboard-2026-05-31]] · [[session-tb-dashboard-2026-05-31-part2]] · [[session-tb-dashboard-2026-05-31-part3]] · [[feedback_push_flow]] · [[tb-dashboard-pending-master]]
