'use client'
/**
 * parts/patient-modal.jsx — barrel: รวม re-export โดเมนเวชระเบียนผู้ป่วย (แยกรอบ 3)
 * แตกออกเป็นโฟลเดอร์ patient-modal/ ทีละแท็บ (ย้ายโค้ดล้วน ไม่แก้ logic) เพื่อให้ปรับแก้อนาคตทีละส่วนง่าย:
 *   index.jsx (ClinicalModal + AddPatientPage) · sputum-utils.js (leaf) ·
 *   diagnosis/timeline/lab(Chart.js)/meds/dose-calculator/regimen/dot/adr/pharm-summary
 * shell ยัง import { ClinicalModal, AddPatientPage } from './parts/patient-modal' เหมือนเดิม
 */
export { ClinicalModal, AddPatientPage } from './patient-modal/index'
