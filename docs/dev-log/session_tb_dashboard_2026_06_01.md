---
name: session-tb-dashboard-2026-06-01
description: 🎯 v0.7.15.2 — Phase 2 Step 1 Optimize: Materialized View บันทึกกิจกรรม + KPI border + Virtual scroll content-visibility
metadata:
  node_type: memory
  type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 📌 TB Dashboard session 2026-06-01 — v0.7.15.2 Phase 2 Step 1

## 🎯 เป้าหมาย
เริ่ม Phase 2 Optimize Step 1 — Materialized view + UI polish + virtual scroll

## ✅ ที่ทำเสร็จ (Push แล้ว)

### 1. Materialized View activity log
- **DB query: 800-1500ms → 0.1ms** (-99.99%, ~10,000 เท่า)
- pre-compute UNION 5 ตาราง (login/logout/password change/password reset/easter) + regex device_type
- 5 indexes: event_time, user_id+time, category+time, success=false partial, email lower
- `refresh_activity_log()` SECURITY DEFINER function — admin trigger ผ่าน RPC
- REVOKE all + GRANT SELECT เฉพาะ service_role

📂 `D:\tb-dashboard-bysirawit\scripts\create-activity-log-mv.sql`

### 2. API activity-log optimize
- `count: 'exact'` → `'estimated'` (pg_class.reltuples, ไม่ scan)
- Parallel admin check + main query (Promise.all) — 3 round trips → 2 (-150-300ms)
- POST `/api/admin/activity-log/refresh` endpoint ใหม่

### 3. ปุ่ม "รีเฟรชล่าสุด" ใน ActivityLogTab
- Banner header — ปุ่มอำพันใส + icon fa-rotate (spin ตอน refreshing)
- Tooltip: เวลา refresh ล่าสุด หรือ "stale สูงสุด 5 นาที"
- คลิก → POST + loadPage(0) reload

### 4. Dashboard KPI border 4 อัน
- เดิม: 3 อัน (ขึ้นทะเบียน/กำลังรักษา/จบ) ขอบ #f1f5f9 เกือบขาว — มองไม่เห็น
- ใหม่: ใช้ hoverBorder (สีอ่อนของโทน) เป็น default, accent (เข้มกว่า) ตอน hover
- Lab ผิดปกติ (alert) ขอบแดงตามเดิม

### 5. Virtual scroll content-visibility
- 1 บรรทัด CSS ใน app.html: `.tb-pt-row { content-visibility: auto; contain-intrinsic-size: 0 60px; }`
- ครอบ 3 lists ที่ใช้ class นี้ (PatientList + 2 ArchiveList)
- Browser-native virtual scroll — DOM tree ครบแต่ skip rendering rows ที่ไม่อยู่ในจอ

#### ทำไมเลือก content-visibility แทน react-window
| ข้อ | content-visibility | react-window |
|---|---|---|
| Effort | 1 บรรทัด CSS | 4-6 ชม. refactor |
| Library size | 0 | +12 KB |
| HTML table + sticky column | ✅ ทำงานปกติ | ❌ ต้อง refactor break |
| Ctrl+F หาเจอทุก row | ✅ | ❌ rows นอกจอไม่อยู่ใน DOM |
| Print ทั้ง list | ✅ browser auto-render | ❌ พิมพ์ได้แค่ที่เห็น |
| Screen reader a11y | ✅ access ครบ | ❌ rows นอกจอ access ไม่ได้ |
| Copy-paste table | ✅ ทั้งหมด | ❌ แค่ที่เห็น |
| Memory | DOM tree ครบ | ลีน (rows นอกจอไม่มี) |
| List 10,000+ | ช้าลง | scale ดีกว่า |
| Browser compat | Chrome/Edge 85+, Safari 18+ | ทุก browser |
| Graceful degrade | ✅ render ปกติ | — |

**สรุป:** content-visibility ดีกว่าจริง สำหรับ list < 10,000 rows + table + Ctrl+F/print/a11y use case
ของ TB Dashboard ~ไม่กี่ร้อย-พัน → content-visibility win

## 📦 Push (2 commits)

| Commit | Hash | สิ่งที่ทำ |
|---|---|---|
| Main | `c19894d` / `c19894da6f5e468928a297147f33d318cdb610d2` | 8 ไฟล์ +299/-23 |
| Hash update | `c3d1f37` | อัป pending → c19894d |

## 📝 Version
- APP_VERSION: 0.7.15.1 → **0.7.15.2** (patch — Phase 2 step 1)
- BUILD_DATE: 31 พ.ค. → **1 มิ.ย. 2569**
- Cache buster: v=83 → v=85

## ⚠️ ต้องทำก่อน deploy
รัน SQL ใน Supabase SQL Editor (idempotent):
- `scripts/create-activity-log-mv.sql`

view tb_activity_log เดิมเก็บไว้ ไม่ลบ (fallback ได้)

## 📊 Before/After
| Metric | Before | After |
|---|---|---|
| Activity log DB query | 800-1500ms | 0.1ms |
| Activity log API total (dev) | 1300-1500ms | ~1100-1300ms* |
| KPI cards border | inconsistent | unified สีตามโทน |
| PatientList scroll 300 rows | DOM ใหญ่ ช้า | smooth (skip nonvisible) |

*dev mode bottleneck คือ middleware + network localhost ↔ Supabase Singapore
ใน production จะเร็วกว่าครึ่ง (~500-700ms)

## 💡 Lesson
- DB optimize ดีมากที่ DB level แต่ network + middleware เป็น bottleneck ครอบ
- count:'exact' กับ Supabase = SELECT COUNT(*) → 'estimated' หรือ remove
- Promise.all parallelize → ลด round-trip
- content-visibility = browser-native virtual scroll, ดีกว่า react-window สำหรับ table
- MV + manual refresh = trade-off ข้อมูล stale vs query เร็ว 10,000x
- SECURITY DEFINER function = secure pattern ให้ non-owner trigger DDL
- ⚠️ ระวัง bump minor version โดยไม่จำเป็น — user ทักว่าควรเป็น 0.7.15.2 ไม่ใช่ 0.7.16.0
  เพราะแก้ไม่ใหญ่พอจะ jump minor → patch +1 ก็พอ

## ✅ Phase 2 Step 2 (v0.7.15.3) — เสร็จ + push แล้ว

### 1. RLS strict tb_changelog_comments
- เดิม USING (true) → ทุก authenticated user เห็นทุก row รวม deleted (security gap)
- ใหม่: `deleted_at IS NULL OR deleted_by = auth.uid() OR is_admin()`
- /api/changelog/comments-all ใช้ admin client → bypass RLS → tombstone ยัง work
- defense in depth: RLS ป้องกัน direct client query

📂 `D:\tb-dashboard-bysirawit\scripts\fix-changelog-comment-rls-strict.sql`

### 2. pg_cron auto-refresh MV ทุก 5 นาที
- CREATE EXTENSION IF NOT EXISTS pg_cron
- cron.schedule('refresh_mv_activity_log_5min', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW public.mv_activity_log')
- admin ไม่ต้องกดปุ่ม manual refresh เอง (ปุ่มยังคงอยู่)

📂 `D:\tb-dashboard-bysirawit\scripts\add-pg-cron-mv-refresh.sql`

### 3. Revert animation
- user บอก "ตอนกดเปิดปิดคอมเม้น มันเร็วกว่านี้ได้มั้ย" → ผมเข้าใจผิดใส่ tb-fade animation 0.25s
- user ทดสอบบอก "อยากได้เปิดปุ๊บมาปั๊บ ปิดเเล้วปิดปั๊บ" = instant ไม่ใช่ smooth
- Revert ลบ `<div className="tb-fade">` ออก → กลับเป็น instant

### 📦 Push (2 commits)
- `468134b` — 6 ไฟล์ +117/-6
- `c9b6ca0` — chore: อัป hash

### 📝 Version
- APP_VERSION: 0.7.15.2 → **0.7.15.3**
- Cache buster: v=85 → v=86

### 💡 Lesson
- "เร็วกว่านี้" ของ user = instant feedback (ไม่ใช่ smooth animation)
- ถ้าใส่ animation = ยิ่งช้าขึ้น (perceived delay)
- RLS strict + admin client API = defense in depth pattern
- pg_cron ใน Supabase ใช้ได้ free tier
- REFRESH MV (no CONCURRENTLY) = exclusive lock สั้นๆ ~100ms acceptable

## ✅ Phase 2 Step 3 (v0.7.15.4) — เสร็จ + push แล้ว

### Keep mounted pattern
- เพิ่ม state `everOpenedVersions: Set<version>` ใน ChangelogPage
- sync ใน 3 จุด: toggleComments + auto-expand + highlight-from-bell
- render เปลี่ยน: `{isOpen && ...}` → `{everOpened && <div display:isOpen ? 'block' : 'none'>...}`

### Before/After
- เปิดครั้งแรก: 50-200ms mount (เหมือนเดิม)
- ปิด: 30-50ms unmount → **0ms** (display:none)
- เปิดอีก: 50-200ms mount → **0ms** (display:block)
- State หลังปิด-เปิด: หาย → **คงอยู่** (filter, draft, mention picker)

### Memory trade-off (acceptable)
- 10 versions เปิดพร้อมกัน ~1MB · realistic 1-3 versions ~300KB
- Realtime channels อยู่ที่ ChangelogPage parent (1 channel) → ไม่ leak
- everOpenedVersions reset ตอน navigate ออก → session ใหม่ state ใหม่

### 📦 Push (2 commits)
- `297dad2` — 4 ไฟล์ +45/-15
- `6504fcb` — chore: อัป hash

### 📝 Version
- APP_VERSION: 0.7.15.3 → **0.7.15.4**
- Cache buster: v=86 → v=87

### 💡 Lesson
- Keep mounted + display:none = simple effective pattern สำหรับ component ที่ open/close ซ้ำ
- display:none = browser skip paint/layout (เกือบเท่า unmount)
- DOM ยังอยู่ → state ของ React/HTML form persist
- Realtime channels ต้องอยู่ parent (ที่ mount ตลอด) ไม่ใช่ child

## ✅ Phase 2 Step 4 (v0.7.15.5) — เสร็จ + push แล้ว

### Style refactor Comment card
- เพิ่ม 4 CSS class ใน app.html: `.cm-card`, `.cm-card-reply`, `.cm-card-text`, `.cm-card-text-reply`
- ย้าย static styles (borderRadius, padding, transition, font, line-height, ฯลฯ) → CSS
- Keep dynamic inline (background filter, border theme, borderLeft status, opacity state)

### Inline reduction
- Parent card div: 8 → 4 properties (-50%)
- Reply card div: 8 → 4 (-50%)
- Parent text `<p>`: 9 → 0 (-100%)
- Reply text `<p>`: 9 → 0 (-100%)

### Real example
50 parent + 30 reply comments × ทุก render:
- Before: 1360 inline properties
- After: **320** inline properties (-76%)

### 📦 Push (2 commits)
- `4da584c` — 4 ไฟล์ +64/-10
- `0bc1e8d` — chore: อัป hash

### 📝 Version
- APP_VERSION: 0.7.15.4 → **0.7.15.5**
- Cache buster: v=87 → v=88

### 💡 Lesson
- Static styles → CSS class (cached selector, no allocation)
- Dynamic styles → keep inline (readability + flexibility)
- transition: all 0.2s ใน CSS class = effect เดียวกัน + ลด JS allocation
- ไม่ต้อง refactor inline ทุกที่ทันที — focus component ที่ render ซ้ำในจอ

## 🚧 ต่อไป Phase 2 Step 5
- Component split ChangelogCommentSection → 3 sub-components + React.memo
  → render เปลี่ยน 1 comment = render เฉพาะ card นั้น
- Style refactor inline เพิ่ม (status badge, avatar, action buttons) — incremental
- Pagination comments-all (ถ้า scale 1000+ comments)

ดู [[session-tb-dashboard-2026-05-31-part6]] · [[popup-animate-resilient-shamir]] (plan)
