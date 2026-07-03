'use client'
/**
 * parts/account.jsx — barrel: รวม re-export โดเมน account (แยกรอบ 2)
 * แตกออกเป็นโฟลเดอร์ account/ (โค้ดเดิม ไม่แก้ logic):
 *   account/profile.jsx         → UserProfileModal (main) + RequestEditModal + avatar cluster
 *   account/change-password.jsx → ChangePasswordPanel (+ PwEye, password helpers)
 *   account/sessions.jsx        → SessionsPanel (+ deviceIcon, SessionPagination ฯลฯ)
 * profile.jsx import 2 panel ผ่าน mode switch · shell import { UserProfileModal } เหมือนเดิม
 */
export { UserProfileModal } from './account/profile'
