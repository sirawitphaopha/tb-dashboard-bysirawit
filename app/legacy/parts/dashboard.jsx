'use client'
/**
 * parts/dashboard.jsx — barrel: รวม re-export โดเมน dashboard (แยกรอบ 2)
 * แตกออกเป็นโฟลเดอร์ dashboard/ (โค้ดเดิม ไม่แก้ logic):
 *   dashboard/overview.jsx      → Dashboard (⚠️ Chart.js)
 *   dashboard/patient-lists.jsx → PatientList, ArchiveList, AllPatientsPage (+ list helpers)
 *   dashboard/weekly-prep.jsx   → WeeklyPrep
 *   dashboard/reports.jsx       → Reports
 *   dashboard/helpers.js        → getTotalMonths (ใช้ร่วม overview + lists)
 * shell ยัง import จาก './parts/dashboard' เหมือนเดิม (resolve มาที่ไฟล์ barrel นี้)
 */
export { Dashboard } from './dashboard/overview'
export { PatientList, ArchiveList, AllPatientsPage } from './dashboard/patient-lists'
export { WeeklyPrep } from './dashboard/weekly-prep'
export { Reports } from './dashboard/reports'
