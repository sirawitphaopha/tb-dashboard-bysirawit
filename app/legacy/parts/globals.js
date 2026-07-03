'use client'
/**
 * parts/globals.js — สัญญากลางของ window.* ที่ tb-data.js / setup.ts ตั้งไว้
 *
 * อ่าน window.* ครั้งเดียว แล้ว re-export เป็น named export
 * ให้ทุกไฟล์ย่อย (parts/*) import จากที่นี่ แทนการพึ่ง bare global
 * หรือ destructure window ซ้ำหลายที่
 *
 * ลำดับโหลดที่การันตีความถูกต้อง (ดู app/components/TbBundle.tsx):
 *   setup.ts → tb-data.js → tb-changelog.js → tb-monolith.jsx (import ไฟล์นี้)
 * ไฟล์นี้ถูกเรียกผ่าน tb-monolith ซึ่งเป็น import ตัวสุดท้าย → window.* ถูก set ครบก่อนเสมอ
 * (TbAppMount ใช้ ssr:false → รันบน browser เท่านั้น window มีจริง)
 *
 * NOTE: เป็น snapshot ตอน module load (พฤติกรรมเดียวกับ destructure เดิมที่ tb-monolith บรรทัด 55–58)
 * tb-data set ค่าเหล่านี้ครั้งเดียวก่อนอ่าน จึงไม่ต้องใช้ getter
 */

const g = /** @type {any} */ (typeof window !== 'undefined' ? window : {})

// (a) ชุด destructure เดิม (tb-monolith บรรทัด 55–58)
export const ADR_LIST = g.ADR_LIST
export const migrateAdr = g.migrateAdr
export const calcDoses = g.calcDoses
export const calcCrCl = g.calcCrCl
export const crClStage = g.crClStage
export const DRUG_RANGES = g.DRUG_RANGES
export const REGIMENS = g.REGIMENS
export const PREFIXES = g.PREFIXES
export const PATIENT_TYPES = g.PATIENT_TYPES
export const DISEASE_LOCATIONS = g.DISEASE_LOCATIONS
export const EXTRA_PULMONARY_TYPES = g.EXTRA_PULMONARY_TYPES
export const TAMBONS = g.TAMBONS
export const DEFAULT_COMORBIDITIES = g.DEFAULT_COMORBIDITIES
export const CONSULT_TYPES = g.CONSULT_TYPES
export const DRP_TYPES = g.DRP_TYPES
export const LAB_GROUPS = g.LAB_GROUPS
export const getLabStatus = g.getLabStatus
export const LAB_STATUS_STYLE = g.LAB_STATUS_STYLE

// (b) bare implicit globals ที่เคยพึ่ง window fall-through (สาย strict-mode มองไม่เห็น) — ทำให้ชัดเจน
export const Chart = g.Chart
export const INITIAL_PATIENTS = g.INITIAL_PATIENTS
export const generateAlerts = g.generateAlerts
export const DEFAULT_DRUGS = g.DEFAULT_DRUGS
export const DEFAULT_RESTART_REASONS = g.DEFAULT_RESTART_REASONS

// (c) profession maps (tb-monolith บรรทัด 4105 / 8794) — ไว้ให้ parts อนาคต import
export const PROFESSION_LABELS_TH = g.TB_PROFESSION_LABELS
export const PROFESSIONS = g.TB_PROFESSIONS
