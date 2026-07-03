'use client'
/**
 * parts/admin.jsx — barrel: รวม re-export โดเมน admin (แยกรอบ 2)
 * แตกออกเป็นโฟลเดอร์ admin/ เพื่อให้แต่ละแท็บอยู่ไฟล์ของตัวเอง (โค้ดเดิม ไม่แก้ logic):
 *   admin/users.jsx        → AdminUsersTab (จัดการผู้ใช้ + ประวัติ)
 *   admin/activity-log.jsx → ActivityLogTab (บันทึกกิจกรรม)
 *   admin/audit-log.jsx    → AuditLogTab (ประวัติลบผู้ป่วยถาวร)
 *   admin/settings.jsx     → AdminSettings (ตั้งค่าระบบ)
 * shell ยัง import จาก './parts/admin' เหมือนเดิม (resolve มาที่ไฟล์ barrel นี้)
 */
export { AdminUsersTab } from './admin/users'
export { ActivityLogTab } from './admin/activity-log'
export { AuditLogTab } from './admin/audit-log'
export { AdminSettings } from './admin/settings'
