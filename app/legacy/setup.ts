'use client'

/**
 * v0.7.17.0 Phase 3 Step 3 — Legacy compatibility shim
 *
 * เซ็ต window.X ให้ tb-data.js + tb-modals.jsx + tb-app.jsx ที่เคยพึ่ง global ของ CDN
 * โหลด ก่อน import './tb-data.js' (ลำดับ import = ลำดับ evaluation ใน ES module)
 *
 * แทน CDN ทั้งหมด:
 *   - React UMD  → npm 'react'
 *   - Chart.js   → npm 'chart.js/auto'
 *   - Supabase   → npm '@supabase/supabase-js'
 *   - Babel      → ลบ (SWC compile JSX ตอน build)
 *   - Tailwind   → compile-time (postcss + tailwindcss)
 *
 * Cloudflare/Next.js bundler ทำ tree-shake + code-split อัตโนมัติ
 */

import * as React from 'react'
import { Chart, registerables } from 'chart.js'
import * as Supabase from '@supabase/supabase-js'

// register Chart.js components (Bar, Line, Pie, Doughnut, ...)
Chart.register(...registerables)

if (typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>
  w.React = React
  w.Chart = Chart
  // tb-data.js เรียก window.supabase.createClient(...)
  w.supabase = Supabase
}

export {}
