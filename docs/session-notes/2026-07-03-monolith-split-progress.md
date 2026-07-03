# 🔧 สถานะการผ่าไฟล์ยักษ์ tb-monolith.jsx (handoff สำหรับแชทใหม่)

> **แชทใหม่: อ่านไฟล์นี้ให้จบก่อนทำต่อ** — ไฟล์ plan เดิม (`~/.claude/plans/*.md`) อยู่นอก repo หายไปแล้ว
> ข้อมูลทั้งหมดที่ต้องใช้อยู่ในไฟล์นี้

## เป้าหมาย
ผ่า `app/legacy/tb-monolith.jsx` (เดิม 13,476 บรรทัด = ทั้งแอปหน้าบ้านในไฟล์เดียว) ออกเป็นไฟล์ย่อยใน
`app/legacy/parts/` ทีละเฟส **ย้ายโค้ดล้วน ไม่แก้ logic** โดย `tb-monolith.jsx` ยังเป็น entry ที่
`export default App` (TbBundle.tsx ไม่ต้องแก้)

## กฎสำคัญ (จากผู้ใช้)
- **ถามก่อน push ทุกครั้ง** — แต่ผู้ใช้อนุมัติให้ลุยทุกเฟส + merge เข้า main ได้เลยในรอบนี้
- **เวอร์ชันแต่ละเฟส = `0.7.19.6.X`** (X รันทีละเฟส ไม่ใส่ 0 นำ เช่น .1 .2 ... .10)
- commit message ละเอียด (goal / what / why / files)
- 1 เฟส = 1 branch = 1 commit = 1 PR merge เข้า main

## ✅ เฟสที่เสร็จแล้ว (เข้า main หมด, build ผ่านทุกเฟส)
| เฟส | เวอร์ชัน | ไฟล์ที่สร้าง | ย้ายอะไร |
|---|---|---|---|
| 1a | 0.7.19.6.1 | `parts/globals.js` | window.* จาก tb-data (ADR_LIST, calcDoses, Chart, INITIAL_PATIENTS, generateAlerts, DEFAULT_DRUGS, DEFAULT_RESTART_REASONS, PROFESSION_LABELS_TH, PROFESSIONS ฯลฯ) |
| 1b | 0.7.19.6.2 | `parts/shared.jsx` | useModalAnim, INP, FormSection, FieldError, RangeStatus, Badge + ลบ dead code `Object.assign(window,{...})` |
| 1c | 0.7.19.6.3 | `parts/shared.jsx` (+) | ConfirmModal, ToastModal, Field, FilterSelect, StatusBadge, ScrollNav |
| 1d | 0.7.19.6.4 | `parts/shared.jsx` (+) | relTime, r2AvatarUrl, normName, nameInitials, AVATAR_PALETTE, colorFromName, AvatarCircle |
| 2 | 0.7.19.6.5 | `parts/changelog.jsx` | ChangelogPage, CommitDetailModal, CHANGELOG_STATUS_META, ChangelogCommentSection |
| 3a | 0.7.19.6.6 | `parts/storage.jsx` | StorageMiniCard, StorageDonut, StorageDetail, StorageAlert + `_settingsWantTab` → `window._settingsWantTab` |
| 3 | 0.7.19.6.7 | `parts/admin.jsx` | AdminUsersTab, ActivityLogTab, AuditLogTab, AdminSettings + tables/activity helpers |
| 4 | 0.7.19.6.8 | `parts/misc.jsx` | TrashList + KnowledgeBase (ย้ายตรง — พึ่งแค่ useState/useEffect + window.loadTrashedPatients/_sb, ไม่มี cross-dep) |
| 5 | 0.7.19.6.9 | `parts/patient-images.jsx` (+`shared.jsx`) | PatientImagesTab, ImageLibraryPage, ImageTrashPage, CXRComparePanel/Modal, TrashHub, ImgViewToolbar + image helpers (compressToWebp, decodeImageToDataURL, JustifiedGallery, patientImgInfo ฯลฯ). **ย้าย loadImageEl + AvatarLightbox เข้า shared.jsx** (ใช้ร่วมกับ avatar เฟส 6) · cross-part import แรก: patient-images ← TrashList จาก misc |
| 6 | 0.7.19.6.10 | `parts/account.jsx` | UserProfileModal (main, export), ChangePasswordPanel, SessionsPanel, RequestEditModal, AvatarCropModal, AvatarDeleteConfirm + helpers (PwEye, checkPasswordStrength, cropToWebp, resizeToWebp, deviceIcon, SessionPagination ฯลฯ) + DEPARTMENTS/HOSPITAL_TYPES. **shell เอา import Cropper + loadImageEl/AvatarLightbox ออก** (ย้ายมา account หมด · shared ยัง export ให้ patient-images) · account ← loadImageEl/AvatarLightbox จาก shared |
| 7 | 0.7.19.6.11 | `parts/patient-modal.jsx` | ClinicalModal + AddPatientPage (export) + ทุกแท็บ (Regimen/Lab⚠️Chart.js/ADR/Timeline/Diagnosis/Meds) + DoseCalculator, DOTCalendar, VisitForm, DrugInteractionPanel, PharmSummaryTab, InfoBar + helpers/consts. **notification (useNotifHelpers/NotificationPanel/NotificationFullModal) เก็บไว้ shell** (app-level) → ย้าย 2 ช่วง 48–126 + 233–2628. cross-part: patient-modal ← PatientImagesTab จาก patient-images |

| 8 | 0.7.19.6.12 | `parts/dashboard.jsx` | Dashboard (⚠️Chart.js), PatientList, ArchiveList, AllPatientsPage, WeeklyPrep, Reports + MONTH_LABELS/FAKE_* + col-config/render helpers. deps: shared(StatusBadge), globals(calcDoses, Chart), storage(StorageMiniCard cross-part) |

**🎉 ผลลัพธ์สุดท้าย (จบครบ 8 เฟส):** shell เหลือ ~1,142 บรรทัด (จาก 13,476 · เหลือ ~8.5%) · parts มี 11 ไฟล์: globals.js, shared.jsx, changelog.jsx, storage.jsx, admin.jsx, misc.jsx, patient-images.jsx, account.jsx, patient-modal.jsx, dashboard.jsx
shell เหลือแค่แกน: App + notification (แจ้งเตือน) + AboutModal + APP_VERSION/BUILD_DATE + mount logic

## ✅ โครงการผ่าไฟล์ — เสร็จสมบูรณ์
ไม่มีเฟสค้างแล้ว ทุกโดเมนแยกไฟล์ครบ · commit เฟส 8 = 1815786

## 🛠️ สูตรทำแต่ละเฟส (ทำแบบนี้ทุกครั้ง)
1. `git checkout main && git pull && git checkout -b refactor/split-phase-X-<name>`
2. หา line boundaries: `grep -nE '^(function|const) (ComponentName)\b' app/legacy/tb-monolith.jsx`
   (บรรทัดขยับทุกเฟส ต้อง grep ใหม่เสมอ) — หาปลายด้วย `sed -n 'A,Bp'`
3. สร้าง part file: header (`'use client'` + `import * as React` + `const {useState,useEffect,useRef}=React`
   + import จาก `./shared` `./globals` `./storage` เท่าที่ใช้) + บล็อกที่ sed ออกมา + `export { ... }`
   - ตัวอย่าง extract: `{ echo "header..."; sed -n 'A,Bp' tb-monolith.jsx; echo "export {...}"; } > parts/X.jsx`
4. **eslint no-undef หา dependency ที่ขาด** (ดู §เครื่องมือ) → เติม import ให้ครบ
5. ลบบล็อกจาก shell: `sed -i 'A,Bd' tb-monolith.jsx` (ระวัง off-by-one ที่ `}` ปิดฟังก์ชัน!)
   + เพิ่ม `import { ... } from './parts/X'` ที่ shell + แก้ comment ค้าง
6. bump version 2 ที่: `APP_VERSION` ใน tb-monolith.jsx + `Version` ใน app/login/page.tsx
7. `npm run build` (ใส่ env หลอก ดู §เครื่องมือ) ต้องผ่าน + eslint ทุก parts ต้องสะอาด
8. commit ละเอียด → push → เปิด PR → merge เข้า main → sync main

## ⚠️ กับดักที่เจอมาแล้ว (ต้องระวัง)
1. **eslint config มี Chart/supabase/React/process เป็น global** → no-undef ไม่จับ bare `Chart`/`supabase`
   → ต้อง grep เองว่า part ใช้ bare Chart/supabase ไหม แล้ว import จาก globals ถ้าใช้
2. **sed ลบบล็อกมัก off-by-one ที่ `}` ปิดฟังก์ชัน** → เช็ค seam หลังลบทุกครั้ง (ดูว่ามี `}` ค้าง)
3. **createPortal**: component ที่ render ผ่าน Portal (StorageAlert, ScrollNav, modal บางตัว)
   ต้อง `import { createPortal } from 'react-dom'` ใน part — build ไม่จับ (runtime error) แต่ no-undef จับ
4. **eslint no-undef ที่ grep แค่ "is not defined" จะพลาด parse error** → ดู output เต็ม (`| tail -15`)
5. **repo เป็น shallow clone** → ห้าม regenerate changelog (`generate-changelog.mjs`) จนกว่าจะ
   `git fetch --unshallow origin` ก่อน (ไม่งั้น changelog พังหมด ลบพันบรรทัด)
6. **changelog generator รองรับเวอร์ชันแค่ 4 ช่วง** → `0.7.19.6.X` ถูกตัดเหลือ `0.7.19.6` รวมกลุ่มเดียว
   → ข้ามการ regenerate changelog รายเฟสได้ (ทำทีเดียวตอนจบ) ไม่ใช่เรื่องคอขาดบาดตาย
7. **cross-dependency**: บาง domain ใช้ของ domain อื่น → ต้องย้ายตัวที่ใช้ร่วมเข้า shared ก่อน
   (ทำมาแล้ว: avatar→shared เฟส 1d, storage แยกก่อน admin เฟส 3a)
8. **APP_VERSION**: parts อ่านผ่าน `window.APP_VERSION` (shell ตั้ง `window.APP_VERSION = APP_VERSION`)
   เพราะ APP_VERSION ต้องอยู่ shell ตามธรรมเนียม version bump
9. **git config**: ตั้ง `user.email noreply@anthropic.com` + `user.name Claude` ก่อน commit (ให้ขึ้น Verified)
10. **package-lock.json**: ถ้า npm install ไปแก้มัน ให้ `git checkout -- package-lock.json` (อย่า commit)

## 🧰 เครื่องมือ
**eslint no-undef** (ติดตั้งแล้วด้วย `npm i --no-save eslint@9 globals`):
```bash
# config อยู่ที่ scratchpad (นอก repo) — ถ้าหาย สร้างใหม่: flat config, files *.jsx/*.js,
# globals: browser + es2021 + React/Chart/supabase/process readonly, rule no-undef:error,
# import globals ด้วย absolute path จาก node_modules/globals/index.js
npx eslint --config <scratchpad>/eslint-noundef.mjs app/legacy/parts/*.js app/legacy/parts/*.jsx
```
**build ด้วย env หลอก** (เครื่องคลาวด์ไม่มี Supabase key จริง — build จริงจะ fail ตอน prerender ถ้าไม่ใส่):
```bash
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_placeholder" \
SUPABASE_SERVICE_ROLE_KEY="sb_secret_placeholder" \
npm run build
```
(ต้อง `npm install` ก่อนถ้า node_modules ยังไม่มี)

## 📍 เฟส 8 (dashboard) — เฟสสุดท้าย พร้อมทำต่อทันที
- component ที่ต้องย้าย (grep ใหม่เสมอ): Dashboard (⚠️ Chart.js — กราฟรายเดือน/รายปี), PatientList,
  ArchiveList, AllPatientsPage, WeeklyPrep, Reports + consts (MONTH_LABELS, FAKE_MONTHLY, FAKE_YEARLY,
  DEFAULT_COL_CONFIG, DEFAULT_ARCHIVE_COL_CONFIG) + helpers (getTotalMonths, fmtDateApp, renderPatientCell,
  getBannerColors) — อยู่ท้าย shell ก่อน App (grep ใหม่ บรรทัดขยับ)
- ⚠️ Dashboard ใช้ Chart.js เหมือน LabTab → import { Chart } from './globals' + ผู้ใช้เทสต์กราฟ
- ⚠️ เก็บไว้ shell: App, AboutModal, notification (useNotifHelpers/NotificationPanel/NotificationFullModal),
  APP_VERSION/BUILD_DATE, PROFESSION_LABELS_TH, mount logic → shell จะเหลือแค่ "แกน App + แจ้งเตือน + version"
- ตรวจว่า Dashboard/PatientList ใช้อะไรจาก globals/shared → import ให้ครบ + scan JSX (กับดัก #11)
- เสร็จเฟสนี้ = จบโครงการผ่าไฟล์ 🎉 (regenerate changelog ตอนนี้ได้ ถ้า git fetch --unshallow ก่อน — ดูกับดัก #5)

## 🧭 กับดักใหม่ (เจอเฟส 5 — สำคัญ ใช้ทุกเฟสที่เหลือ)
11. **eslint no-undef จับ JSX component ที่ไม่ได้ import ไม่ได้** (เช็คแค่ call ฟังก์ชัน ไม่เช็ค `<Tag/>`)
    → หลัง extract ต้อง `grep -oE '<[A-Z][A-Za-z0-9]+' part.jsx | sort -u` แล้วเทียบว่าทุกตัวมีนิยาม/import
    ในไฟล์ · เฟส 5 เกือบพลาด `<AvatarLightbox/>` (eslint ผ่านแต่จะ crash runtime) จนไป scan JSX เจอ
12. **helper ท้ายไฟล์อาจใช้ร่วม 2 domain** (loadImageEl = images+avatar, AvatarLightbox = images+avatar)
    → ตัวใช้ร่วม → shared.jsx · ตัวใช้ domain เดียว → part นั้น · ตรวจด้วย grep usage ทั้งไฟล์ก่อนตัดสิน

## 📝 หมายเหตุการ push (รอบนี้)
- ผู้ใช้อนุมัติให้ **push เข้า main ตรง ไม่แยกกิ่ง/ไม่เปิด PR** · commit ละเอียดระดับ A4
- เฟส 4 = commit 03e35d7 · เฟส 5 = 0d2d824 · เฟส 6 = 89f160a · เฟส 7 = 906ca41 · เฟส 8 = 1815786 (จบ)
- ⏭️ ยังไม่ได้ทำ: regenerate changelog (ต้อง git fetch --unshallow ก่อน — gotcha #5) · ผู้ใช้เทสต์ localhost ทุกหน้า
- gate ต่อเฟส: `npm run build` (env หลอก) + eslint no-undef + **scan JSX `<[A-Z]>` เอง** (กับดัก #11)
- ผู้ใช้ยังเทสต์ localhost ไม่ได้รอบนี้ → เทสต์ทีเดียวหลังจบทุกเฟส (build+eslint+scan JSX เป็น gate)

## หมายเหตุการเทสต์
เครื่องคลาวด์เทสต์กดจริงไม่ได้ (ไม่มี key + คนละเครื่องกับ localhost ผู้ใช้) → ใช้ build + eslint no-undef
เป็น gate · ผู้ใช้เทสต์ localhost เองทีหลัง ถ้าเฟสไหนพัง `git revert <commit>` ได้สะอาด (ย้ายโค้ดล้วน)

---

# 🔧 รอบ 2 — เก็บกวาดต่อ (split round 2) + เตรียม AI + วางโครงหน้าผู้ป่วยใหม่
> แผนเต็ม: `~/.claude/plans/*.md` (อนุมัติแล้ว) · AI roadmap: `2026-07-03-ai-roadmap.md`

## ✅ เสร็จแล้ว (เข้า main, gate ผ่านทุกอัน)
| ขั้น | เวอร์ชัน | commit | ทำอะไร |
|---|---|---|---|
| r2-1 | .13 | ced9632 | shell → `parts/notifications.jsx` + `parts/about.jsx` · shell 1,142→985 (เพิ่ม bridge window.BUILD_DATE) |
| — | — | bd99eb6 | docs: AI roadmap + CLAUDE.md หัวข้อ "AI features (วางแผนไว้)" (provider-neutral) |
| r2-2 | .14 | 56650d9 | `admin.jsx` → `admin/{users,activity-log,audit-log,settings}.jsx` + barrel (2,189→14) |
| r2-3 | .15 | 6a1839a | `dashboard.jsx` → `dashboard/{overview,patient-lists,weekly-prep,reports}.jsx` + helpers.js + barrel (1,285→15) |
| r2-4 | .16 | bea3b38 | `account.jsx` → `account/{profile,change-password,sessions}.jsx` + barrel (1,551→10) |

**สูตร barrel:** ไฟล์เดิม (เช่น admin.jsx) กลายเป็น `export { X } from './admin/...'` — shell import path เดิมไม่เปลี่ยน
(ไฟล์ barrel ชนะโฟลเดอร์ตอน resolve). ไฟล์ในโฟลเดอร์ import จาก `../shared`/`../globals`/`../storage` (ขึ้น 1 ชั้น).
**eslint รอบ 2 ใช้ recursive glob:** `'app/legacy/parts/**/*.js' 'app/legacy/parts/**/*.jsx'` (ครอบ subfolder)

## ⏳ เหลือ (option — ยังไม่ได้ทำ)
- `changelog.jsx` (2,365) → `changelog/{page,comments}.jsx` — ตัด 2 ทางสะอาด แต่แต่ละครึ่งยัง ~1,100
- `patient-images.jsx` (1,271) → `patient-images/{helpers,trash,patient-tab,library}.jsx` — ต้องแยก helpers.jsx ก่อน
- `tb-data.js` (1,049) → constants/calc/seed/db — ต้องแตะ TbBundle.tsx
- **หน้าผู้ป่วยรื้อใหม่** → โฟลเดอร์ `parts/patient/*` (patient-modal.jsx 2,504 = ใหญ่สุด, จะถูกเขียนใหม่ ไม่แตะตอนนี้)
- **ระบบ AI** → `lib/ai.ts` + `lib/ai-patient-context.ts` + `app/api/ai/*` (ตาม CLAUDE.md · ผู้ใช้ยังไม่เลือก provider)

**ไฟล์ใหญ่สุดที่เหลือตอนนี้:** patient-modal.jsx(2,504 รอ rebuild), changelog.jsx(2,365), admin/users.jsx(1,331), patient-images.jsx(1,271)
