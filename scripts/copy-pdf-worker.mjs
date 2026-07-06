// คัดลอกไฟล์ worker ของ pdf.js (pdfjs-dist) เข้า public/ ให้เวอร์ชันตรงกับที่ติดตั้งเสมอ
//   - viewer ตั้ง GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs' (โหลดจาก origin เดียวกัน → ผ่าน CSP worker-src 'self')
//   - ถ้า worker เวอร์ชันไม่ตรงกับ API ที่ import → pdf.js error "API version does not match Worker version" จอเปล่า
//   - รันอัตโนมัติผ่าน postinstall + prebuild (ทั้งเครื่อง dev และตอน Cloudflare build)
//   - ห้าม commit ไฟล์ปลายทาง (อยู่ใน .gitignore) เพราะ auto-gen จาก node_modules ทุกครั้งที่ install/build
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'

const require = createRequire(import.meta.url)
const src = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')
const dest = 'public/pdf.worker.min.mjs'

mkdirSync(dirname(dest), { recursive: true })
copyFileSync(src, dest)
console.log('[copy-pdf-worker] copied', src, '->', dest)
