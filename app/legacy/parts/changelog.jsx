'use client'
/**
 * parts/changelog.jsx — barrel: รวม re-export โดเมน changelog (แยกรอบ 3)
 * แตกเป็นโฟลเดอร์ changelog/ (โค้ดเดิม ไม่แก้ logic):
 *   changelog/main.jsx     → ChangelogPage (+ CommitDetailModal) · import comments
 *   changelog/comments.jsx → ChangelogCommentSection + CHANGELOG_STATUS_META
 * shell ใช้แค่ ChangelogPage → export ตัวเดียว (import path เดิมไม่เปลี่ยน)
 */
export { ChangelogPage } from './changelog/main'
