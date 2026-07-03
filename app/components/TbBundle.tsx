'use client'

/**
 * TbBundle — chain imports สำหรับ Legacy app
 *
 * Import order (ES module — depth-first, statement order):
 *   1. ../legacy/setup          → set window.React/Chart/supabase
 *   2. ../legacy/tb-constants.js → enums/labels/lab-ref tables (window.*)
 *   3. ../legacy/tb-calc.js      → dose/CrCl/alert calculators + getLabStatus (window.*)
 *   4. ../legacy/tb-seed.js      → window.INITIAL_PATIENTS (seed data)
 *   5. ../legacy/tb-db.js        → Supabase client (window._sb) + async data fns
 *   6. ../legacy/tb-changelog.js → set window.TB_CHANGELOG + window.TB_TAGS
 *   7. ../legacy/tb-monolith    → ใช้ window.X + export default App
 *
 * หมายเหตุ: tb-data.js เดิมถูกแยกเป็น 4 ไฟล์ (constants/calc/seed/db) รอบ 3 —
 * ทั้ง 4 ต้องรันครบก่อน globals.js (ใน tb-monolith) snapshot window.* · ลำดับเดิมทุกอย่าง
 */

import '../legacy/setup'
import '../legacy/tb-constants.js'
import '../legacy/tb-calc.js'
import '../legacy/tb-seed.js'
import '../legacy/tb-db.js'
import '../legacy/tb-changelog.js'
import TbApp from '../legacy/tb-monolith'

export default TbApp
