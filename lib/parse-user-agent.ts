import { UAParser } from 'ua-parser-js'

// ─────────────────────────────────────────────────────────────────────────
// parseUserAgent
//
// แปลง User-Agent string → ข้อมูลเครื่อง/browser/os แบบละเอียด
// ใช้ตอน insert tb_session_log
// ─────────────────────────────────────────────────────────────────────────

export interface ParsedUA {
  device_label:    string   // ป้ายชื่อแบบอ่านง่าย — แสดงในหน้า profile
  browser_name:    string | null
  browser_version: string | null
  os_name:         string | null
  os_version:      string | null
  device_type:     string   // mobile / tablet / desktop / unknown
  device_vendor:   string | null
  device_model:    string | null
}

export function parseUserAgent(ua: string | null): ParsedUA {
  if (!ua) {
    return {
      device_label:    'ไม่ทราบอุปกรณ์',
      browser_name:    null,
      browser_version: null,
      os_name:         null,
      os_version:      null,
      device_type:     'unknown',
      device_vendor:   null,
      device_model:    null,
    }
  }

  const parser = new UAParser(ua)
  const browser = parser.getBrowser()
  const os      = parser.getOS()
  const device  = parser.getDevice()

  // browser version → เก็บเฉพาะ major number (เช่น "131.0.6778.86" → "131")
  const browserMajor = browser.version?.split('.')[0] ?? null

  // device type
  const deviceType = device.type || (
    /Mobile/i.test(ua) ? 'mobile' :
    /Tablet|iPad/i.test(ua) ? 'tablet' :
    'desktop'
  )

  // ─── สร้าง device_label สำหรับแสดง ────────────────────
  // ตัวอย่างที่ได้:
  //   "iPhone · Safari 17 · iOS 17.2"
  //   "Samsung Galaxy S24 · Chrome 131 · Android 14"
  //   "Chrome 131 · Windows 11"
  //   "Safari 17 · macOS 14.2"

  const parts: string[] = []

  // device (เฉพาะถ้าเป็น mobile/tablet)
  if (device.vendor || device.model) {
    const dev = [device.vendor, device.model].filter(Boolean).join(' ')
    if (dev) parts.push(dev)
  }

  // browser
  if (browser.name) {
    parts.push(browserMajor ? `${browser.name} ${browserMajor}` : browser.name)
  }

  // os
  if (os.name) {
    parts.push(os.version ? `${os.name} ${os.version}` : os.name)
  }

  const device_label = parts.length > 0 ? parts.join(' · ') : 'ไม่ทราบอุปกรณ์'

  return {
    device_label,
    browser_name:    browser.name    ?? null,
    browser_version: browserMajor,
    os_name:         os.name         ?? null,
    os_version:      os.version      ?? null,
    device_type:     deviceType,
    device_vendor:   device.vendor   ?? null,
    device_model:    device.model    ?? null,
  }
}
