# แผนจัดโครงสร้างไฟล์ รอบ 2 — เตรียมรับ AI + รื้อหน้าผู้ป่วยใหม่

## Context (ทำไมต้องทำ)
โครงการผ่าไฟล์ยักษ์ (เฟส 1–8) เสร็จแล้ว: `tb-monolith.jsx` 13,476 → 1,142 บรรทัด, แตกเป็น `app/legacy/parts/` 11 ไฟล์. งานถูกต้อง — build ผ่าน, eslint no-undef สะอาด, ทุกเฟสเป็น pure code motion (ตรวจซ้ำแล้ว: ดู "การตรวจงานเฟส 1–8" ด้านล่าง).

ตอนนี้มองไปข้างหน้า 2 เรื่องที่ผู้ใช้ระบุ:
1. **จะมีระบบ AI เข้ามา** → ต้องมีที่วางโค้ด AI (client, prompt, API route) ให้ชัดตั้งแต่ตอนนี้
2. **หน้าผู้ป่วยจะรื้อทำใหม่หมด** (`patient-modal.jsx` = ไฟล์ใหญ่สุด 2,504 บรรทัด) → อยากวางโครงไฟล์เป้าหมายก่อนลงมือรื้อ

แผนนี้ = (ก) ยืนยันงานเดิมถูกต้อง (ข) เสนอ backlog การแยกไฟล์ที่ยังทำได้อีก เรียงตามความคุ้ม/ปลอดภัย (ค) วางโครงไฟล์รองรับ AI + หน้าผู้ป่วยใหม่

> **ข้อสมมติที่ใช้ (แก้ได้ตอนอนุมัติ):** (1) หน้าผู้ป่วยรื้อใหม่ **อยู่ในระบบ `parts/` เดิม + window.* contract** — ปลอดภัยสุด ต่อเนื่องกับของเดิม เหมาะกับผู้ดูแลที่ไม่ใช่โปรแกรมเมอร์. (2) AI ตัวแรก = **"สรุปเคสผู้ป่วย"** (อ่านอย่างเดียว, ฝั่ง server, เสี่ยงต่ำสุด) โดยวางท่อกลางให้ต่อฟีเจอร์อื่นได้. (3) แผนนี้แบ่งเป็นเฟสย่อย ผู้ใช้ไฟเขียวทีละเฟส — ยังไม่ลงมือจนกว่าจะสั่ง.

---

## 🔨 รอบ 3 — execution plan (สิ่งที่จะทำต่อไปนี้)
> รอบ 1 (เฟส 1–8) + รอบ 2 (notifications/about, admin/, dashboard/, account/) เสร็จเข้า main แล้ว
> **ผู้ใช้ยืนยัน:** ทำต่อ 4 ไฟล์ตามลำดับ — patient-modal → changelog → patient-images → tb-data
> **patient-modal.jsx = แยกไฟล์เลย (split-now):** ผู้ใช้จะ **ปรับแก้หน้าผู้ป่วยในอนาคตแบบค่อยเป็นค่อยไป** — **ไม่ใช่ทิ้งเขียนใหม่ทั้งหมด** (บางแท็บอาจไม่โดนแก้เลย · ยังไม่รู้จนกว่าจะทำเสร็จ). แยกไฟล์ทีละแท็บไว้ก่อน → ปรับทีละส่วนง่าย ไม่ต้องแตะไฟล์ยักษ์. (แก้ความเข้าใจผิดในแผนเดิม Part C ที่เขียนว่า "จะถูกทิ้ง อย่าเสียเวลาแตก")
> **dead code = ห้ามลบ:** เก็บไว้ทั้งหมด → แยกเสร็จรายงานผู้ใช้ก่อน แล้วค่อยคุยกัน (ดู 3.1)

**หลักการทุกไฟล์ (เหมือนรอบ 2):** ย้ายโค้ดล้วน · ไฟล์เดิมกลายเป็น **barrel** (`export {X} from './folder/...'`) เพื่อ shell/parts อื่น import path เดิมไม่ต้องแก้ · ไฟล์ในโฟลเดอร์ import จาก `../shared`/`../globals`/`../storage`/parts อื่น · gate = build + eslint no-undef (recursive glob) + scan JSX `<[A-Z]>` เอง + ตรวจ bare Chart/supabase ที่ import · bump `0.7.19.6.X` · commit A4 · push main

### 3.1 `patient-modal.jsx` (2,504) → โฟลเดอร์ `patient-modal/` — ⚠️ ใหญ่/ระวังสุด
เป้าหมาย: 1 ไฟล์ต่อ 1 แท็บ (หน่วยที่ผู้ใช้จะปรับแก้ในอนาคตทีละส่วน). โครง:
- `patient-modal/sputum-utils.js` — hasResistance, afbCombined, isAfbPositive, getSputumConversion, isDelayedConversion (**leaf — แยกก่อน**; ใช้ร่วม diagnosis+timeline+index; แก้ hoisting hack ใน buildGroupedTimeline ให้เป็น import จริง)
- `patient-modal/diagnosis.jsx` — DiagnosisTab + consts (TP_OPTIONS, SPECIMEN_TYPES, MOLEC_TYPES, AFB/RIF/INH_RESULTS, SLD_DRUGS, SLD_RES_OPTIONS, EMPTY_DX, DEFAULT_COLS, SPECIMEN_LAB_FIELDS, fmtDate) · import sputum-utils
- `patient-modal/timeline.jsx` — TimelineTab + VisitForm + EMPTY_VISIT + detectDotMisses + buildGroupedTimeline + TL_ICONS/COLORS/BORDER · import sputum-utils
- `patient-modal/lab.jsx` — LabTab (⚠️ Chart.js — import { Chart } from '../globals') + dead labColor/labFlag (เก็บไว้, domain เดียวกัน)
- `patient-modal/meds.jsx` — MedsTab + HOSP_STRENGTHS + dead DrugInteractionPanel
- `patient-modal/dose-calculator.jsx` — DoseCalculator (ใช้โดย AddPatientPage) · import HOSP_STRENGTHS จาก ./meds (หรือย้าย HOSP_STRENGTHS เป็น leaf ถ้าสองฝั่งใช้)
- `patient-modal/regimen.jsx` · `dot.jsx` · `adr.jsx` · `pharm-summary.jsx` — แท็บเดี่ยว self-contained
- `patient-modal/index.jsx` — ClinicalModal + AddPatientPage (+ dead InfoBar) · import ทุกแท็บ + sputum-utils(hasResistance) + PatientImagesTab จาก `../patient-images`
- `patient-modal.jsx` (barrel) — `export { ClinicalModal, AddPatientPage } from './patient-modal/index'`
- **dead code (คาดว่า: DrugInteractionPanel, labColor, labFlag, InfoBar) — ⛔ ห้ามลบ:** เก็บไว้ทั้งหมด วางกับ domain ที่ใกล้สุด (pure motion). **หลังแยกเสร็จ → รายงานผู้ใช้:** (1) เจอกี่จุด (2) แต่ละตัวคืออะไร/โค้ดอ่านว่าทำอะไร (3) ลบแล้วกระทบเว็บจริงไหม (มีใคร render/เรียกไหม) → **คุยกับผู้ใช้ก่อน** ค่อยตัดสินใจลบทีหลัง (ไม่ลบเองในเฟสนี้)
- deps รวม: shared (INP, FormSection, FieldError, RangeStatus, Badge, ConfirmModal) · globals (calcDoses, calcCrCl, crClStage, DRUG_RANGES, REGIMENS, PREFIXES, PATIENT_TYPES, DISEASE_LOCATIONS, EXTRA_PULMONARY_TYPES, TAMBONS, DEFAULT_COMORBIDITIES, CONSULT_TYPES, DRP_TYPES, LAB_GROUPS, getLabStatus, LAB_STATUS_STYLE, Chart, DEFAULT_DRUGS, DEFAULT_RESTART_REASONS, ADR_LIST, migrateAdr) · patient-images (PatientImagesTab) · window.OUTCOME_TYPES
- **⚠️ กราฟ Chart.js แท็บ Lab** — ผู้ใช้ต้องกดดูจริง (build จับ runtime กราฟไม่ได้)

### 3.2 `changelog.jsx` (2,365) → โฟลเดอร์ `changelog/`
- `changelog/page.jsx` — ChangelogPage + CommitDetailModal · import ChangelogCommentSection จาก ./comments
- `changelog/comments.jsx` — ChangelogCommentSection (React.memo) + CHANGELOG_STATUS_META
- `changelog.jsx` (barrel) — shell ใช้แค่ ChangelogPage → `export { ChangelogPage } from './changelog/page'` (ยืนยัน export อื่นไม่มีใครใช้ตอน exec)
- deps: shared เท่านั้น (13 symbol) + window.TB_CHANGELOG/TB_TAGS/_sb/APP_VERSION · แต่ละครึ่งยัง ~1,100 (ยอมรับได้ — ตัดต่อต้อง decompose component เสี่ยงกว่า)

### 3.3 `patient-images.jsx` (1,271) → โฟลเดอร์ `patient-images/`
- `patient-images/helpers.jsx` — **แยกก่อน** (foundation ที่ 3 หน้าใช้ร่วม): codecs (compressToWebp/putWithProgress/blobToDataURL/decodeImageToDataURL/isAnimatedGif), JustifiedGallery, ImgViewToolbar, patientImgInfo, cache trio + CACHE_TTL, PATIENT_IMG_TYPES, IMG_VIEW_SIZES, IMG_SORTS/imgInRange/imgSortCmp, fmtFileSize/mimeLabel/detectDevice, CXRComparePanel/CXRCompareModal · import loadImageEl จาก ../shared
- `patient-images/trash.jsx` — ImageTrashPage + TrashHub · import TrashList จาก ../misc + helpers + AvatarLightbox
- `patient-images/patient-tab.jsx` — PatientImagesTab · import helpers + AvatarLightbox
- `patient-images/library.jsx` — ImageLibraryPage · import helpers + AvatarLightbox
- `patient-images.jsx` (barrel) — `export { TrashHub, PatientImagesTab, ImageLibraryPage } from ...`
- หมายเหตุ: patient-modal/index.jsx import PatientImagesTab จาก barrel นี้ → ต้องทำ 3.1 ให้ import ผ่าน barrel (ไม่พังตอนสลับ)

### 3.4 `tb-data.js` (1,049) → แยก 4 ไฟล์ — ⚠️ แตะ load-order contract
- `app/legacy/tb-constants.js` — enums/labels/lab-ref (pure, assign window.*)
- `app/legacy/tb-calc.js` — calcDoses/calcCrCl/crClStage/generateAlerts/migrateAdr (pure)
- `app/legacy/tb-seed.js` — INITIAL_PATIENTS (~385 บรรทัด static)
- `app/legacy/tb-db.js` — Supabase client bootstrap + session bridge (window._sb) + async data fns (loadPatients ฯลฯ) — **sensitive**
- **แก้ `app/components/TbBundle.tsx`:** import order → setup → tb-constants → tb-calc → tb-seed → tb-db → tb-changelog → tb-monolith (ทั้ง 4 ต้องรันก่อน globals.js snapshot window.*)
- ทดสอบหนักกว่าเพื่อน (แตะ runtime data layer) — ผู้ใช้กดเว็บจริงยืนยันหลัง push

---

## ✅ การตรวจงานเฟส 1–8 (เช็คซ้ำตามที่ผู้ใช้ขอ)
- โครงสร้างถูก: `globals.js`(49) `shared.jsx`(679) `storage.jsx`(207) `changelog.jsx`(2365) `admin.jsx`(2189) `misc.jsx`(505) `patient-images.jsx`(1271) `account.jsx`(1551) `patient-modal.jsx`(2504) `dashboard.jsx`(1285) + shell `tb-monolith.jsx`(1142).
- สัญญาการโหลดยังครบ: `TbBundle.tsx` → setup → tb-data.js → tb-changelog.js → tb-monolith. ทุก part import ข้อมูลจาก `./globals` (ไม่แตะ bare window เอง) — **กฎนี้ต้องรักษาไว้ทุกไฟล์ใหม่**.
- **พบ dead code เดิม (มีมาตั้งแต่ monolith ไม่ใช่ของใหม่)** ใน `patient-modal.jsx`: `DrugInteractionPanel`, `labColor`, `labFlag`, `InfoBar` — นิยามไว้แต่ไม่มีใคร render. เนื่องจากหน้าผู้ป่วยจะรื้อใหม่ **ไม่ต้องเสียเวลาลบตอนนี้** — ปล่อยให้หายไปตอน rebuild.

---

## Part A — การแยกไฟล์ที่ยังทำได้อีก (backlog เรียงตามความคุ้ม)
เป้าหมาย: ไม่มีไฟล์ part ไหนใหญ่เกินอ่านไหว. หลักการเดิมทุกข้อ (pure code motion, gate = build + eslint no-undef + scan JSX `<[A-Z]>` เอง, commit A4, bump version `0.7.19.6.X`).

**ลำดับแนะนำ (ง่าย→ยาก):**

1. **`shell → parts/notifications.jsx` + `parts/about.jsx`** (quick win, ~200 บรรทัดออกจาก shell)
   - notifications: `useNotifHelpers`, `NotificationPanel`, `NotificationFullModal` (app-level, App เรียก) → export ทั้ง 3, shell import กลับ. deps: props + `window.loadUserNotifications`/`markUserNotificationRead`.
   - about: `AboutModal` + คง `APP_VERSION`/`BUILD_DATE` ไว้ shell (ธรรมเนียม version bump; `window.APP_VERSION` bridge ยังอยู่). ผลลัพธ์: shell เหลือแค่ `App` + version + mount.

2. **`admin.jsx` → โฟลเดอร์ `admin/`** (คุ้มสุด — 4 แท็บ coupling เป็นศูนย์)
   - `admin/users.jsx` (AdminUsersTab + EditRow/ActionHistoryTable/ActionPairTable/RejectHistoryTable + consts) · `admin/activity-log.jsx` (ActivityLogTab + activityMeta/Reason/DeviceIcon) · `admin/audit-log.jsx` (AuditLogTab) · `admin/settings.jsx` (AdminSettings — ต้อง import globals lists + `StorageDetail` จาก `../storage`).
   - `admin.jsx` กลายเป็น barrel re-export 4 ไฟล์. ไม่มี helper ข้ามแท็บ → mechanical.

3. **`dashboard.jsx` → โฟลเดอร์ `dashboard/`**
   - `dashboard/overview.jsx` (Dashboard ⚠️Chart.js + MONTH_LABELS/FAKE_*) · `dashboard/patient-lists.jsx` (PatientList+ArchiveList+AllPatientsPage + list helpers 477–602) · `dashboard/weekly-prep.jsx` · `dashboard/reports.jsx`.
   - ⚠️ `getTotalMonths` (+`fmtDateApp`) ใช้ร่วม overview+lists → ย้ายเข้า `dashboard/helpers.jsx` หรือ `../shared`.

4. **`account.jsx` → โฟลเดอร์ `account/`** (1 export แต่ 3 panel แยกได้)
   - `account/change-password.jsx` (PwEye + password helpers + ChangePasswordPanel) · `account/sessions.jsx` (SessionsPanel + session helpers) · `account/profile.jsx` (UserProfileModal + RequestEditModal + avatar cluster) importing 2 panel ข้างบน.

5. **`changelog.jsx` → `changelog/page.jsx` + `changelog/comments.jsx`** (ตัด 2 ทางสะอาด แต่แต่ละครึ่งยัง ~1,100 บรรทัด — ลดต่อต้อง decompose component เอง เสี่ยงกว่า)

6. **`patient-images.jsx` → โฟลเดอร์ `patient-images/`** (ลำดับท้าย — ต้องแยก `helpers.jsx` ก่อน)
   - `patient-images/helpers.jsx` (codecs, JustifiedGallery, ImgViewToolbar, patientImgInfo, cache, consts, CXR viewers) · `trash.jsx` · `patient-tab.jsx` · `library.jsx`. การแยกไม่ลด coupling แค่ย้ายเข้า module ชัด → priority ต่ำสุด.

7. **`tb-data.js` (1049) → แยกกลุ่ม (option, ทำเมื่อพร้อม)** — ต้องแตะ `TbBundle.tsx`:
   - `tb-constants.js` (enums/labels/lab-ref, pure) · `tb-calc.js` (calcDoses/calcCrCl/generateAlerts, pure) · `tb-seed.js` (INITIAL_PATIENTS ~385 บรรทัด) · `tb-db.js` (Supabase client + async data fns).
   - ทั้ง 4 ต้อง assign `window.*` ตามเดิม และเพิ่มลำดับ import ใน `TbBundle.tsx` (setup → constants → calc → seed → db → changelog → monolith). กลุ่ม A/B/C ปลอดภัย, กลุ่ม db มี creds/session bridge ระวัง.

---

## Part B — โครงไฟล์ระบบ AI (ตามแพตเทิร์นเดิมของ lib/)
วาง **ท่อกลาง feature-agnostic** ก่อน แล้วต่อฟีเจอร์บนนั้น. อ้างอิงแพตเทิร์น lazy-init ของ `lib/resend.ts` (กัน Cloudflare build error ตอนไม่มี key) และ `lib/r2.ts`.

**ไฟล์ใหม่:**
- **`lib/anthropic.ts`** — lazy singleton client (mirror `lib/resend.ts` เป๊ะ):
  ```ts
  import Anthropic from '@anthropic-ai/sdk'
  let _client: Anthropic | null = null
  export function getAnthropic(): Anthropic {
    if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })
    return _client
  }
  export const AI_MODEL = 'claude-opus-4-8'   // default (per claude-api skill)
  ```
  - เพิ่ม dep: `npm i @anthropic-ai/sdk` (ยังไม่มีใน package.json). เพิ่ม `ANTHROPIC_API_KEY` ใน env docs (CLAUDE.md/README) + Cloudflare Pages.
- **`lib/ai-patient-context.ts`** — pure functions: patient object → prompt text (mirror `email-templates.ts`). ดึง labs/sputum/adr/visits/dot/regimenHistory เป็นข้อความให้ Claude อ่าน. reuse `getLabStatus()` เพื่อ flag ค่าผิดปกติ.
- **`app/api/ai/summarize/route.ts`** — POST, admin/approved-only (verify caller ด้วย cookie session แบบ route อื่น), อ่านข้อมูลผู้ป่วยฝั่ง server ด้วย `createAdminClient()`/server client (**อย่าเชื่อ clinical data ที่ client ส่งมา**), เรียก `getAnthropic().messages.create({ model: AI_MODEL, ... })`, ตอบสรุปกลับ. โดเมนใหม่ `app/api/ai/*` ขนานกับ auth/admin/patient (ต่อ `chat/`, `lab-interpret/` ภายหลังได้).
- **CSP:** `next.config.js` ไม่ต้องเปิด origin ใหม่ (เรียก Anthropic จาก server route ไม่ใช่ browser).
- **ฝั่ง UI:** ปุ่ม/แผงใน `parts/patient-modal.jsx` (หรือหน้าใหม่) เรียก `fetch('/api/ai/summarize')` — ไม่ให้ browser ถือ API key.

**AI ตัวแรก = สรุปเคสผู้ป่วย** (read-only, server-side, เสี่ยงต่ำ). ต่อยอด: chat over patient (`api/ai/chat`), แปลผล Lab/เตือน ADR-drug interaction (`api/ai/lab-interpret`) — ใช้ท่อ `lib/anthropic.ts` + `lib/ai-patient-context.ts` ตัวเดิม.

---

## Part C — โครงไฟล์หน้าผู้ป่วย (แยกไฟล์เลย เพื่อปรับแก้อนาคตง่าย)
> ⚠️ แก้ความเข้าใจ: **ไม่ได้จะทิ้ง patient-modal.jsx** — ผู้ใช้จะปรับแก้แบบค่อยเป็นค่อยไป (บางแท็บอาจไม่โดนแก้เลย).
> ดังนั้น **แยกไฟล์ทีละแท็บไว้เลย** (split-now, ย้ายโค้ดล้วน) → รายละเอียด execution อยู่ที่ §3.1 ด้านบน.
> โครงโฟลเดอร์เป้าหมาย (ตามรอยต่อธรรมชาติที่วิเคราะห์แล้ว):

```
app/legacy/parts/patient/            (โฟลเดอร์ใหม่ แทน patient-modal.jsx)
├─ index.jsx          ClinicalModal + AddPatientPage  (2 export เดียวที่ shell เรียก)
├─ sputum-utils.js    hasResistance, afbCombined, isAfbPositive, getSputumConversion,
│                     isDelayedConversion   ← leaf ที่ diagnosis+timeline+ClinicalModal ใช้ร่วม (แยกก่อน)
├─ diagnosis.jsx      DiagnosisTab + consts (TP_OPTIONS, SPECIMEN_TYPES, ...) + SPECIMEN_LAB_FIELDS
├─ timeline.jsx       TimelineTab + VisitForm + buildGroupedTimeline + detectDotMisses + TL_* (imports sputum-utils)
├─ lab.jsx            LabTab  (⚠️ เจ้าเดียวที่แตะ Chart.js — import { Chart } from '../globals')
├─ meds.jsx           MedsTab + DoseCalculator + HOSP_STRENGTHS + drug-interaction engine เดียว
├─ regimen.jsx        RegimenHistoryTab
├─ dot.jsx            DOTCalendar
├─ adr.jsx            ADRTab
├─ pharm-summary.jsx  PharmSummaryTab  (+ แยก delete-dialogs.jsx ถ้าอยากตัด delete-workflow ออกจาก summary)
└─ ai-panel.jsx       (ใหม่) แผงเรียก /api/ai/summarize — จุดเสียบ AI ในหน้าผู้ป่วย
```
- แต่ละแท็บรับ props `{patient, onUpdate, locked}` (+`settings`) เหมือนเดิม; ClinicalModal เป็น tab switcher + ต่อ `updatePatient`/delete-workflow handlers ของ `App` (ใน shell) เหมือนเดิม.
- `PatientImagesTab` ยังอยู่ `parts/patient-images.jsx` (cross-part import) — แท็บ images ใน index.jsx import จากที่นั่น.
- **กฎรื้อใหม่:** ตัด dead code (DrugInteractionPanel/labColor/labFlag/InfoBar) ทิ้ง; รวม drug-interaction เป็น engine เดียว; import ข้อมูลจาก `../globals`/`../shared` เท่านั้น (ห้าม bare window ข้อมูล); scan JSX `<[A-Z]>` ให้ครบ; **ผู้ใช้เทสต์กราฟ Lab จริงเสมอ**.

---

## ไฟล์หลักที่จะแก้/สร้าง (สรุป)
- แยกเพิ่ม: `app/legacy/parts/{notifications,about}.jsx`, โฟลเดอร์ `admin/ dashboard/ account/ changelog/ patient-images/`, (option) `app/legacy/tb-{constants,calc,seed,db}.js` + `app/components/TbBundle.tsx`
- AI: `lib/anthropic.ts`, `lib/ai-patient-context.ts`, `app/api/ai/summarize/route.ts`, `package.json` (+`@anthropic-ai/sdk`), `next.config.js` (ไม่ต้องแก้ CSP), CLAUDE.md/README (env `ANTHROPIC_API_KEY`)
- หน้าผู้ป่วยใหม่: โฟลเดอร์ `app/legacy/parts/patient/*` (แทน `patient-modal.jsx`) + `shell import { ClinicalModal, AddPatientPage } from './parts/patient'`

## ลำดับทำ (เมื่อไฟเขียว)
1. Quick wins: notifications + about ออกจาก shell
2. AI plumbing: `lib/anthropic.ts` + `lib/ai-patient-context.ts` + `app/api/ai/summarize` (+ ปุ่มทดสอบ)
3. แยกไฟล์ตาม backlog A ทีละโดเมน (admin → dashboard → account → changelog → patient-images)
4. (option) แยก `tb-data.js`
5. หน้าผู้ป่วย: rebuild ลงโครง `parts/patient/*` — เฟสใหญ่ ทำ+เทสต์แยกเป็นหลาย commit

## Verification (ทุกเฟส)
- `npm run build` ด้วย env หลอก (มี placeholder Supabase keys) → ต้อง "Compiled successfully"
- `eslint --config <scratchpad>/eslint-noundef.mjs app/legacy/parts/**` → exit 0
- **scan JSX เอง**: `grep -oE '<[A-Z][A-Za-z0-9]+'` เทียบกับ defined/imported (กับดัก #11 — eslint จับ JSX ที่ลืม import ไม่ได้)
- ตรวจ bare `Chart`/`supabase` ที่ import แล้ว (eslint มองข้าม เพราะเป็น global ใน config)
- AI route: `curl -XPOST /api/ai/summarize` ด้วยผู้ป่วยตัวอย่าง → ได้สรุปกลับ (ต้องมี `ANTHROPIC_API_KEY` จริงตอนรัน)
- ผู้ใช้เทสต์ localhost ทุกหน้า โดยเฉพาะกราฟ Chart.js (Dashboard + Lab) — cloud กดทดสอบจริงไม่ได้
