// คัดลอกไฟล์ของ pdf.js (pdfjs-dist) เข้า public/ ให้เวอร์ชันตรงกับที่ติดตั้งเสมอ
//   1) pdf.worker.min.mjs — viewer ตั้ง GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs' (same-origin → ผ่าน CSP worker-src 'self')
//        ถ้า worker เวอร์ชันไม่ตรงกับ API ที่ import → pdf.js error "API version does not match Worker version" จอเปล่า
//   2) pdf_viewer.css — สไตล์ของ PDFViewer (text layer/หน้า/ไฮไลต์ค้นหา) · โหลดผ่าน <link href="/pdf_viewer.css"> ตอนเปิดตัวอ่าน
//        (เลี่ยงข้อจำกัด Next.js ที่ห้าม import CSS จาก node_modules ใน component)
//   - รันอัตโนมัติผ่าน postinstall + prebuild (ทั้งเครื่อง dev และตอน Cloudflare build)
//   - ห้าม commit ไฟล์ปลายทาง (อยู่ใน .gitignore) เพราะ auto-gen จาก node_modules ทุกครั้งที่ install/build
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const root = dirname(require.resolve('pdfjs-dist/package.json'))

mkdirSync('public', { recursive: true })

const copies = [
  [require.resolve('pdfjs-dist/build/pdf.worker.min.mjs'), 'public/pdf.worker.min.mjs'],
  [join(root, 'web', 'pdf_viewer.css'), 'public/pdf_viewer.css'],
]
for (const [src, dest] of copies) {
  copyFileSync(src, dest)
  console.log('[copy-pdf-worker] copied', src, '->', dest)
}
