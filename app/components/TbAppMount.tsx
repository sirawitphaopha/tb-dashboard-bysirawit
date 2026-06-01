'use client'

/**
 * TbAppMount — wrapper สำหรับ TB Dashboard
 *
 * ใช้ next/dynamic + ssr:false เพราะ tb-monolith อ่าน window.X ที่ระดับ module
 * (เช่น const PROFESSIONS = window.TB_PROFESSIONS) — ถ้า SSR จะ crash
 *
 * Flow:
 *   1. Next.js server render: ส่ง HTML เปล่า (skeleton)
 *   2. Client hydrate: dynamic import โหลด TbBundle
 *   3. setup → tb-data → tb-changelog → tb-monolith
 *   4. App component render → fetch data → UI ขึ้น
 */

import dynamic from 'next/dynamic'
import V2Skeleton from './V2Skeleton'

const TbApp = dynamic(() => import('./TbBundle'), {
  ssr: false,
  loading: () => <V2Skeleton />,
})

export default function TbAppMount() {
  return <TbApp />
}
