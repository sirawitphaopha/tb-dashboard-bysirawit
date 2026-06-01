'use client'

/**
 * TbBundle — chain imports สำหรับ Legacy app
 *
 * Import order (ES module — depth-first, statement order):
 *   1. ../legacy/setup       → set window.React/Chart/supabase
 *   2. ../legacy/tb-data.js  → set window.X data + functions
 *   3. ../legacy/tb-changelog.js → set window.TB_CHANGELOG + window.TB_TAGS
 *   4. ../legacy/tb-monolith → ใช้ window.X + export default App
 */

import '../legacy/setup'
import '../legacy/tb-data.js'
import '../legacy/tb-changelog.js'
import TbApp from '../legacy/tb-monolith'

export default TbApp
