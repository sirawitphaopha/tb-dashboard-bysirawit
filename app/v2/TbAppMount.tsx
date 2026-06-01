'use client'

/**
 * TbAppMount — v0.7.17.0 Phase 3 Step 3 (Full Migration, client-only)
 *
 * ใช้ next/dynamic + ssr:false เพราะ tb-monolith อ่าน window.X
 * ที่ระดับ module (เช่น const PROFESSIONS = window.TB_PROFESSIONS)
 * — ถ้า SSR จะ crash ตอนเรนเดอร์เซิร์ฟเวอร์เพราะ window undefined
 *
 * Flow:
 *   1. Next.js server render: ส่ง HTML เปล่า (skeleton ก็ได้)
 *   2. Client hydrate: dynamic import โหลด monolith
 *   3. monolith.js เริ่ม evaluate → import setup → tb-data → tb-changelog
 *   4. window.X พร้อม → tb-app App component render → fetch data → UI ขึ้น
 *
 * ตอนรอ dynamic chunk โหลด → แสดง skeleton ทับ
 */

import dynamic from 'next/dynamic'
import V2Skeleton from '../components/V2Skeleton'

// ssr:false กัน window undefined error ตอน server-render
// loading = skeleton (เห็น UI ทันที ไม่จอขาว)
const TbApp = dynamic(() => import('./TbBundle'), {
  ssr: false,
  loading: () => <V2Skeleton />,
})

export default function TbAppMount() {
  return <TbApp />
}
