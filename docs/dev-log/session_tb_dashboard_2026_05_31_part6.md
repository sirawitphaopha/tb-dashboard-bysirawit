---
name: session-tb-dashboard-2026-05-31-part6
description: 🚀 v0.7.15.0 — Phase 1A Optimize (Backend Quick Wins) + ย้าย project ไป D drive + Optimize Roadmap 4 Phases
metadata:
  node_type: memory
  type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 📌 TB Dashboard session 2026-05-31 (part 6) — v0.7.15.0 Phase 1A Optimize

## 🎯 เป้าหมาย
- ย้าย project C:\ → D:\ (roadmap ข้อ 50 — กัน disk full ทำลายไฟล์อีก)
- วาง Optimize Roadmap 4 Phases (Quick Wins → Medium → Big Rewrite → Maintenance)
- เริ่ม Phase 1A Backend Quick Wins (เปิด milestone v0.7.15.x)

## 📦 ย้าย project ไป D:\ (เสร็จ)

| ขั้น | สิ่งที่ทำ |
|---|---|
| 1 | หยุด dev server เก่า (PID 23704) ที่ C:\ |
| 2 | robocopy source ไป D:\ (ข้าม node_modules + .next) — 7.8MB |
| 3 | npm install ที่ D:\ — 105 packages, 390MB |
| 4 | รัน dev server ใหม่ — Ready 649ms |
| 5 | User confirm ใช้งานปกติ |
| 6 | ลบ folder เก่าที่ C:\ |
| 7 | อัป Claude memory paths (sed C:\ → D:\) |
| 8 | mark roadmap ข้อ 50 ✅ done |

### ⚠️ Incident: PowerShell ทำลาย encoding ไทย
ใช้ `PowerShell Get-Content/Set-Content` แก้ memory paths → ไฟล์ UTF-8 อ่านเป็น CP874 → re-encode UTF-8 → **mojibake 4 ไฟล์** (MEMORY.md + 3 ไฟล์อื่น)

**กู้ได้ด้วย double-decode reverse:**
```
bytes → UTF8 string → CP874 bytes → UTF8 string
```

จดเป็นกฎเหล็กใหม่ใน MEMORY.md:
> 🚨 ห้ามใช้ PowerShell แก้ไฟล์ไทย — ใช้ Bash sed เสมอ

## 🗺 Optimize Roadmap 4 Phases (Plan agent output)

วิเคราะห์ปัจจุบัน:
- เปิดเว็บครั้งแรก: 8-10 วินาที (4G) · 15-20 วิ (3G) · 30-40 วิ (Slow 3G)
- โหลด ~4 MB (Babel standalone 2.1 MB!)
- คุย Changelog 5+ นาที = กระตุก
- Admin approve user → รอ 500ms (Resend blocking)
- Activity log โหลด 800-1500ms

**4 Phases:**
| Phase | ชื่อเล่น | เป้าหมาย | ระยะเวลา | เสี่ยง |
|---|---|---|---|---|
| 1 | เก็บกวาดห้องยา | Quick wins (DB + frontend) | 1-2 วัน | ต่ำมาก |
| 2 | จัดตู้ยาใหม่ | Split component + virtual scroll + RLS strict | 3-5 วัน | กลาง |
| 3 | รื้อห้องยาสร้างใหม่ | ออก iframe + pre-compile JSX → ลด TTI 60% | 5-10 วัน | สูง |
| 4 | ดูแลห้องยา | Log retention + monitoring | ongoing | ต่ำ |

## ✅ Phase 1A Backend (v0.7.15.0) — เสร็จ + push แล้ว

### 1. เพิ่ม Index ฐานข้อมูล 3 ตัว
- `idx_changelog_comment_likes_comment` ON tb_changelog_comment_likes(comment_id) — นับไลก์เร็ว 10-40 เท่า
- `idx_changelog_comments_user_created` ON tb_changelog_comments(user_id, created_at DESC) WHERE deleted_at IS NULL
- `idx_changelog_comments_version_created` ON tb_changelog_comments(version, created_at DESC) WHERE deleted_at IS NULL

📂 `D:\tb-dashboard-bysirawit\scripts\add-perf-indexes.sql`

### 2. Fire-and-forget email — 3 endpoints
- admin/edit-user, admin/approve, profile/request-edit (×2)
- เปลี่ยน `await fn()` → `fn().catch(e => log)` → ลด blocking 100-500ms
- pattern: `getResend().emails.send({...}).catch(e => console.error('xxx failed:', e))`

### 3. Combine login rate limit 2 queries → 1
- เดิม: query email + IP แยก (.count exact head:true ×2)
- ใหม่: query รวมด้วย `.or(email_attempted=...,ip_address=...)` + count ใน JS
- ลด round-trip 50ms

### 4. Switch 3 routes admin client → server client + RLS
- `/api/profile/me` — RLS profiles_select_own_or_admin
- `/api/changelog/comment-counts` — tb_changelog_comments USING (true)
- `/api/auth/sessions/history` — RLS policy ใหม่

### 5. เพิ่ม RLS policy 3 ตัว
- session_log_select_own (user_id = auth.uid())
- logout_log_select_own
- login_log_select_own_success (กัน expose failed login)

📂 `D:\tb-dashboard-bysirawit\scripts\add-rls-policies-phase1.sql`

### ⚠️ ค้างไป Phase 2
- `/api/changelog/mentionable-users` ยัง admin client (profiles RLS จำกัด user เห็นแค่ตัวเอง → tag คนอื่นไม่ได้ถ้า switch)
- ทำใน Phase 2 พร้อมปรับ RLS profiles แบบ scoped

## 📦 Push (2 commits)

| Commit | Hash | สิ่งที่ทำ |
|---|---|---|
| Main | `e512462` / `e5124623e1b26e870ecee32765ae1b483f739763` | 13 ไฟล์ +172/-69 |
| Hash update | `5763ca4` | อัป pending → e512462 |

## 📝 Version
- APP_VERSION: 0.7.14.8 → **0.7.15.0** (minor bump — Phase 1A milestone)
- BUILD_DATE: 31 พ.ค. 2569
- login footer: Version 0.7.15.0
- Cache buster: v=80 → v=81

## 🧪 Verification (เภสัชเทสแล้ว)
- ✅ เปิด Profile ตัวเอง — ข้อมูลขึ้นครบ (server client + RLS ผ่าน)
- ⏸ Admin approve user — skip (ไม่มี pending user)
- ✅ Session history — list ขึ้นครบ (RLS policy ใหม่ทำงาน)
- ✅ คอมเม้น Changelog — like ทันที (index ทำงาน)
- ✅ Login — error rate limit ปกติ (combine query OK)

## 💡 Lesson Learned

### Project move
- ย้าย project ใหญ่: robocopy /XD node_modules .next + npm install ที่ใหม่ + ลบเก่า — สะอาด
- **ห้ามใช้ PowerShell แก้ไฟล์ไทย** — Windows PS 5.1 default CP874 → mojibake
- กู้ mojibake ได้ด้วย double-decode reverse (UTF8 → CP874 → UTF8)

### Optimize
- Fire-and-forget pattern: simple change, big impact (เปลี่ยน 1 บรรทัด ลด 500ms blocking)
- Combine queries ดี → ลด round-trip + DB load
- RLS policy ที่ scope ดี + server client ปลอดภัยกว่า admin client + ได้ query optimization
- Partial index (WHERE deleted_at IS NULL) เล็กกว่า + เร็วกว่า full index

### Plan workflow
- Plan ละเอียดมาก่อน implement = แตก commit ง่าย + scope ชัด
- ใช้ Supabase MCP ตรวจ RLS ก่อน switch route — ปลอดภัย ไม่ break

## ✅ Phase 1B Frontend (v0.7.15.1) — เสร็จ + push แล้ว

### 4 Quick Wins ตามแผน
1. **setInterval 30s → 60s** ใน ChangelogCommentSection (ลด re-render ครึ่ง)
2. **Realtime debounce 300 → 500ms** (ลด API call burst ครึ่ง · search debounce keep 300ms)
3. **Dashboard KPI useMemo** — 1 pass loop คำนวณทุก KPI พร้อมกัน (5000 ops → 0 cached)
   - ⚠️ ตั้งชื่อ kpiCalc (กันชนกับ array kpis ที่มี — เคยทำ crash blank page)
4. **Key prop audit** — 4 จุด: visibleChanges (×2) + restartReasons + customDrugInteractions

### 🐛 Bug fixes 5 จุดที่เจอระหว่างเทส
A. **Crash** Identifier 'kpis' has already been declared — fix: rename เป็น kpiCalc
B. **Optimistic แวบหาย** — fix: useEffect merge keep _pending ที่ initialComments ยังไม่มี
C. **Comment ขึ้น 2 อัน** หลังส่ง — fix: signature match (user+text+version+parent) แทน id match
D. **ปุ่ม chevron sidebar ถูกครอบครึ่งวง** — fix: sidebar wrapper zIndex:40 + ปุ่ม zIndex:50 (เดิม header z:30 ทับ)
E. **ปุ่ม chevron กลืน bg** — fix: border default → เทล + hover bg เทล + icon < ขาว + box-shadow

### 🎨 UI polish sidebar collapse
F. ปุ่ม chevron top:32 → 20 (กึ่งกลาง header ตรงกับโลโก้ปอด)
G. Icon menu marginLeft 0 → 10px ตอน collapsed (slide ไปกลาง smooth)
   - Math: button content 56px → center=28 · icon ที่ marginLeft 10 + 18 = 28 ✓
   - transition margin-left 0.2s sync กับ sidebar width 0.2s

### 📦 Push (2 commits)
- `34801af` / `34801af2065c371f93977fb15513b0c5f9988ef1` — Phase 1B + bug fixes (4 ไฟล์ +98/-56)
- `2f8e0fe` — chore: อัป pending hash

### 📝 Version
- APP_VERSION: 0.7.15.0 → **0.7.15.1**
- Cache buster: v=81 → v=83 (bump 2 ครั้งระหว่าง debug)

### ⚡ Performance (Plan agent บอกถูก)
- First load TTI = 9.3s (Optimistic 8-10s) — Phase 1B แก้ไม่ได้
- ต้อง Phase 3 (ออก iframe + pre-compile JSX) เท่านั้น
- Phase 1B = runtime perf หลังเข้าหน้าแล้ว — Dashboard เปิดเร็ว / Comment scroll ลื่น / animation list smooth

## 💡 Lesson Phase 1B
- useMemo ระวังตั้งชื่อชนกับตัวแปรอื่น scope → ใช้ kpiCalc แทน kpis
- Optimistic update + parent refetch → match ด้วย **signature ไม่ใช่ id** (เพราะ tmp-id ≠ uuid-id)
- z-index issue: parent ไม่มี position → child z-index ไม่ effective vs siblings
- margin transition smooth กว่า width transition สำหรับ "เลื่อน" element

## 🚧 ต่อไป
- Phase 2 (ตัดสินใจอีกครั้ง — split component + virtual scroll + RLS strict)
- Image upload เต็ม (roadmap ข้อ 51)
- First load 9.3s — Phase 3 (ออก iframe + pre-compile)

ดู [[session-tb-dashboard-2026-05-31-part5]] · [[popup-animate-resilient-shamir]] (plan file) · [[tb-dashboard-pending-master]]
