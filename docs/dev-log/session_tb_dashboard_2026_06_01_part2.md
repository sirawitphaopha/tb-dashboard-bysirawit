---
name: 🚀 TB Dashboard session 2026-06-01 — Phase 3 ปิดงาน (Full Migration)
description: v0.7.16.0 + v0.7.16.1 + v0.7.17.0 — Phase 3 ทั้ง 3 step ในคืนเดียว — เลิก iframe → Next.js native, TTI -60%
type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# TB Dashboard 2026-06-01 — Phase 3 ปิดงานครบ 3 step

## สรุปใหญ่
session นี้ปิดทั้ง 3 step ของ Phase 3 optimize roadmap ในคืนเดียว:

- v0.7.16.0 — Phase 3 Step 1: Pre-compile JSX (esbuild ลด Babel 2.1 MB จาก prod)
- v0.7.16.1 — Phase 3 Step 2: Skeleton (Teal pulse — iteration 1 ทำ real-shell ดูเหมือนเว็บค้าง, iteration 2 กลับเป็น pulse)
- **v0.7.17.0** — Phase 3 Step 3: **Full Migration ออก iframe → Next.js native** — TTI 8-10s → ~3-4s prod

## v0.7.17.0 — Full Migration (commit 5edcb17)

### Strategy: concatenate ไม่ rewrite
- ยก `tb-app.jsx` (5,874) + `tb-modals.jsx` (4,832) → `app/legacy/tb-monolith.jsx` (~10,700 บรรทัด)
- ทั้ง 2 ไฟล์ใน module เดียว → ฟังก์ชั่นใน modals มองเห็นจาก app code (shared module scope)
- ไม่ต้อง refactor 30+ ไฟล์ — migration ใช้เวลาจริง 1 session
- 'use client' + `dynamic({ssr:false})` กัน `window.X` ใน module body crash ตอน SSR

### Folder structure ใหม่
```
app/
  v2/
    page.tsx          ← parallel route (เก็บไว้เผื่อ rollback)
    TbAppMount.tsx    ← dynamic({ssr:false}) + V2Skeleton loading
    TbBundle.tsx      ← import chain: setup→tb-data→tb-changelog→monolith
  legacy/
    setup.ts          ← shim: window.React/Chart/supabase
    tb-data.js        ← copied as-is (sets window.X)
    tb-changelog.js   ← copied as-is
    tb-monolith.jsx   ← modals + app concatenated + bugfixes
  components/
    V2Skeleton.tsx    ← โครงเทล pulse (sidebar+header+KPI+chart+list)
    LoginSpinner.tsx  ← spinner วงกลม teal (สำหรับ login redirect)
  page.tsx            ← cutover: render <TbAppMount/> ตรงๆ (ไม่ผ่าน iframe แล้ว)
```

### CDN → npm
- React/ReactDOM → Next.js shared chunk
- chart.js → npm (`Chart.register(...registerables)`)
- Tailwind → compile-time (postcss)
- Babel standalone (2.1 MB) → SWC (build-time)

### Optimistic UI + 2-stage loading (User feedback ทำให้ดี)
- กดเข้าระบบ → spinner ในปุ่ม (~500ms POST)
- POST success → `setRedirecting(true)` → **LoginSpinner** (วงกลม teal) แวบนึง
- `router.push('/')` → / page mount → **V2Skeleton** (รวย: sidebar+KPI pulse)
- chunk loaded → App render → ของจริง
- `router.prefetch('/')` ใน useEffect ตอน login mount → bundle โหลดล่วงหน้า

### Changelog optimization (sidebar collapse jank)
- ปัญหา: หน้าประวัติเวอร์ชั่นกระตุกตอนกดซ่อน sidebar — text Thai ยาวๆใน comments ต้อง relayout ทุก frame
- แก้ 2 ชั้น:
  1. **Lazy render**: `useState visibleTimelineCount=15` + slice + ปุ่ม "ดูเวอร์ชั่นเก่าอีก 20 เวอร์ชั่น (15/65)"
  2. **CSS containment**:
     - `.cl-version-row` → `contain: layout style paint` + `content-visibility: auto` + `contain-intrinsic-size: 0 120px`
     - `.cm-card`, `.cm-card-reply` → `contain: layout style`
     - `.cm-card-text*` → `text-rendering: optimizeSpeed`

## บั๊กที่ SWC strict จับได้ (Babel ปล่อยผ่าน)

### 1. fmtDate ชื่อซ้ำ
- `tb-modals.jsx` มี `function fmtDate(d)` (full year format)
- `tb-app.jsx` มี `const fmtDate = d => ...` (2-digit year)
- ใน iframe browser script scope แต่ละไฟล์แยกกัน → ไม่ชน
- หลัง concat → SyntaxError: "the name 'fmtDate' is defined multiple times"
- แก้: rename tb-app version → `fmtDateApp` + 3 call sites

### 2. userDbNotifs TDZ (Temporal Dead Zone)
- `useEffect` ที่ line 1739 อ้างถึง `userDbNotifs` ใน deps array
- `const [userDbNotifs] = useState()` ประกาศที่ line 1775 (ทีหลัง)
- Babel transform const → var → hoist as undefined → no error
- SWC keep const strict → ReferenceError: "Cannot access userDbNotifs before initialization"
- แก้: ย้าย useState declaration ขึ้นมาก่อน useEffect

→ **Lesson:** SWC + Next.js เข้มงวดกว่า Babel — concat strategy ช่วยจับ bug ซ่อนใน iframe pattern

## UX Iterations ที่เรียนรู้

### Skeleton (v0.7.16.1)
- **Iteration 1 (revert):** real-UI shell ที่มีตัวอักษร+ไอคอนจริง → user รู้สึกเหมือนเว็บค้าง
- **Iteration 2 (final):** teal pulse box + ป้าย "กำลังโหลด..." → user รู้ทันทีว่าโหลดอยู่

### Login transition (v0.7.17.0)
- รอบแรกใส่ V2Skeleton (รวย) เลย → พี่กันบอก "เอาวงกลมแวบนึงด้วย" → ทำเป็น 2-stage
- LoginSpinner (simple วงกลม) ~0.5-1s → V2Skeleton (รวย) ~1-2s → ของจริง

## ก่อน/หลัง (production)

| Metric | Before iframe | After Next.js |
|---|---|---|
| Bundle size | ~4 MB | ~1 MB (-75%) |
| Largest chunk | 2.1 MB (Babel) | 1.3 MB (monolith) |
| HTTP requests | 12 CDN cascade | 3-4 chunks |
| TTI 4G prod | 8-10s | ~3-4s (-60%) |
| Login → Dashboard | 4s blank | 3.6s 3-stage UI |
| Babel runtime | 2.1 MB | 0 |
| Tailwind | runtime CDN | compile-time |
| Sidebar collapse Changelog | กระตุก | ลื่น |

## Rollback safety (ยังเก็บไว้ใน v0.7.17.0)
- `public/app.html`, `tb-app.jsx`, `tb-modals.jsx`, `tb-data.js`, `tb-changelog.js`
- `app/components/HomeShell.tsx`
- `app/v2/page.tsx` (parallel route)
- esbuild + prebuild script ใน package.json

→ ถ้ามีปัญหา prod → revert `app/page.tsx` → กลับ iframe ทันที
→ ลบทิ้งใน v0.7.17.1 หลัง confirm 2-3 วัน

## Push history (เรียงตามเวลา)
- v0.7.16.0 commit `b958385` — Pre-compile JSX
- v0.7.16.0 hash update `0fbbf19` (local เท่านั้น — รวมไปกับ v0.7.16.1)
- v0.7.16.1 commit `9ae1eab` — Skeleton + hash update `613981d`
- v0.7.17.0 commit **`5edcb17`** — Full Migration + hash update `62f86fd`

## TODO รอบหน้า (v0.7.17.1)
1. Apply lazy render (slice + ดูเพิ่ม) ทุกหน้า list:
   - PatientList, ArchiveList, AllPatients, AdminUsersTab, ActivityLog, TrashList, AuditLog
2. แก้ logout ช้า — น่าจะมาจาก signOut + session clear ทำ sequential (ยังไม่เจาะ)
3. ลบไฟล์ iframe เก่า (app.html, tb-app.jsx, tb-modals.jsx, HomeShell.tsx)
4. ลบ esbuild + prebuild script
5. Remove 'unsafe-eval' จาก CSP (Babel ไม่ใช้แล้ว → security ดีขึ้น)
6. Decision pending: Changelog page user ขอ apply lazy render เพิ่ม — แต่ทำไปแล้ว (15+ดูเพิ่ม) → ตรวจซ้ำว่า user หมายถึงอะไร

## Lessons (เก็บไว้ใช้รอบหน้า)
- **Concatenate strategy** เร็วกว่า rewrite component-by-component — 10K บรรทัดเข้า bundle ได้ใน session เดียว
- **Real-UI shell** ดูเหมือนเว็บค้าง → ใช้ pulse skeleton + label "กำลังโหลด..." ดีกว่า
- **Optimistic UI** (Facebook pattern) — ทันทีที่ POST success แสดง next state เลย ไม่รอ navigation
- **2-stage loading** (spinner → skeleton) ดีกว่าขั้นเดียว — ดูทำงานต่อเนื่อง
- **SWC strict** จับ bug ที่ Babel เก่าซ่อน — TDZ + duplicate names
- **`dynamic({ssr:false})`** จำเป็นเมื่อ module body อ่าน `window.X`
- **`router.prefetch()`** ใน useEffect ของหน้า login → bundle โหลดล่วงหน้า ลด TTI หลังกด
- **CSS `contain: layout style paint` + `content-visibility: auto`** = lightweight virtual scroll สำหรับ list ยาว
- **Cloudflare Pages prebuild** auto-run → ไม่ต้องตั้งค่าเพิ่มเติม

ดู [[session_tb_dashboard_2026_06_01]] · [[project_tb_dashboard_pending_master]] · [[feedback_plain_thai_chat]]
