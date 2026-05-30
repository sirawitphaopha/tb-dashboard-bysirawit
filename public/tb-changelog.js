// tb-changelog.js — ประวัติเวอร์ชัน TB JOURNEY & CARE
// ⚠️ ทุกครั้งที่ push version ใหม่ → เพิ่ม entry ที่ "top" ของ versions array ใน major ที่ถูกต้อง
// คงศัพท์ทางการที่จำเป็น (RLS, Audit, Resend, etc.) แต่เขียนอธิบายแบบภาษาคน

window.TB_TAGS = {
  feature:  { emoji: '🆕', label: 'ฟีเจอร์ใหม่',    bg: '#d1fae5', fg: '#065f46', border: '#6ee7b7' },
  ui:       { emoji: '🎨', label: 'ปรับ UI',         bg: '#f3e8ff', fg: '#6b21a8', border: '#d8b4fe' },
  bug:      { emoji: '🐛', label: 'แก้บั๊ก',         bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
  security: { emoji: '🔒', label: 'ความปลอดภัย',     bg: '#dbeafe', fg: '#1e3a8a', border: '#93c5fd' },
  backend:  { emoji: '⚙️', label: 'ระบบหลังบ้าน',    bg: '#f1f5f9', fg: '#334155', border: '#cbd5e1' },
  remove:   { emoji: '🗑',  label: 'ลบ/ยกเลิก',       bg: '#e2e8f0', fg: '#475569', border: '#cbd5e1' },
  text:     { emoji: '📝', label: 'ข้อความ/UX',      bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },
};

window.TB_CHANGELOG = [
  // ═══════════════════════════════════════════════════════════════════════════
  // v0.7 — Auth + Audit Era (พ.ค. 2569 — ปัจจุบัน)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    major: '0.7',
    era: 'Auth + Audit Era',
    icon: '⚡',
    color: '#0f766e',
    period: '15 พ.ค. – ปัจจุบัน',
    description: 'ระบบ login จริง + Audit Log ครบวงจร + Admin Approval + ดีไซน์ใหม่ทั้งหมด',
    versions: [
      {
        version: '0.7.14.0',
        date: '30 พ.ค. 2569',
        commit: 'pending',
        title: '📜 หน้า "ประวัติเวอร์ชัน" — Mini Wiki ในเว็บ',
        changes: [
          { tag:'feature', text:'หน้าใหม่: ดูประวัติการอัปเดตทุกเวอร์ชันตั้งแต่ v0.5.0 ถึงปัจจุบัน' },
          { tag:'feature', text:'มี 2 view: Timeline (เลื่อนยาว) / แยกตามรุ่น (กดขยายดู) — สลับได้' },
          { tag:'feature', text:'ฟิลเตอร์ตาม tag (UI/ฟีเจอร์/บั๊ก/ความปลอดภัย/etc.) + ช่องค้นหา' },
          { tag:'ui',      text:'เข้าได้ 2 ทาง: ปุ่ม "ดูประวัติเวอร์ชัน" ใน sidebar + กดที่ Build date ใน popup About' },
        ],
      },
      {
        version: '0.7.13.5',
        date: '30 พ.ค. 2569',
        commit: '22fc0d9',
        title: 'Popup animation มาตรฐานเดียวทั้งเว็บ',
        changes: [
          { tag:'ui', text:'popup ทุกตัวในเว็บเด้งขึ้นนุ่มๆ เหมือนกันหมด (เปิด-ปิดสไตล์เดียวกัน 35+ จุด)' },
          { tag:'ui', text:'Toast แจ้งเตือนเด้งสไลด์ขึ้นมาจากด้านล่าง แทนการเด้งตรงกลาง' },
          { tag:'ui', text:'หน้ารายละเอียดผู้ป่วยเปิดแบบนุ่ม แต่ปิดทันที (ปิดช้ารู้สึกหน่วง)' },
        ],
      },
      {
        version: '0.7.13.4',
        date: '29 พ.ค. 2569',
        commit: '7d6c51e',
        title: 'Popup About มี animation สวยขึ้น',
        changes: [
          { tag:'ui',   text:'popup "เกี่ยวกับระบบ" เปิดแบบ Fade+Scale+Slide ดูพรีเมียม' },
          { tag:'text', text:'เพิ่มอีเมล hotmail ในส่วนติดต่อ จัดเป็น 3 บรรทัด (ติดต่อ/gmail/hotmail)' },
        ],
      },
      {
        version: '0.7.13.3',
        date: '29 พ.ค. 2569',
        commit: 'd4c3457',
        title: 'แยกเครื่องด้วย Device Fingerprint + Session ID',
        changes: [
          { tag:'feature',  text:'ระบบรหัสประจำเครื่อง (Device Fingerprint) — แยก Chrome 2 profile / incognito ออกจากกัน' },
          { tag:'feature',  text:'Session ID ผูก login กับ logout (จับคู่เข้า-ออกได้)' },
          { tag:'ui',       text:'ป้ายแสดงเครื่อง สีม่วงกรองได้ เลขสั้น 8 ตัว hover เห็นเลขเต็ม' },
          { tag:'bug',      text:'แก้ BUILD_DATE ที่ค้างวันเดิม + เพิ่มลิขสิทธิ์ © 2026 หน้า login' },
        ],
      },
      {
        version: '0.7.13.2',
        date: '29 พ.ค. 2569',
        commit: '25bdad1',
        title: 'Banner teal + sticky header เนียน',
        changes: [
          { tag:'ui', text:'หัวเรื่องบันทึกกิจกรรมเป็น banner gradient teal เหมือนหน้าจัดการผู้ใช้' },
          { tag:'ui', text:'sticky header ตรึงเนียนไม่เห็นกรอบขาว เลื่อนแล้วลื่นกว่าเดิม' },
        ],
      },
      {
        version: '0.7.13.1',
        date: '29 พ.ค. 2569',
        commit: 'd8bc3ed',
        title: 'บันทึกกิจกรรม — drill-down กดกรองได้ทุกค่า',
        changes: [
          { tag:'feature', text:'กดที่ชื่อ/IP/วันที่/อุปกรณ์ในแถว → กรองเฉพาะค่านั้นทันที' },
          { tag:'bug',     text:'แก้ไอคอนอุปกรณ์ iPhone ที่ขึ้นเป็นไอคอนคอมพิวเตอร์' },
          { tag:'ui',      text:'ช่องค้นหาย่ออัตโนมัติเมื่อมีตัวกรอง ทุกอย่างอยู่แถวเดียว' },
        ],
      },
      {
        version: '0.7.13.0',
        date: '29 พ.ค. 2569',
        commit: '013dc95',
        title: 'หน้า "บันทึกกิจกรรม" (Activity Log) สำหรับ admin',
        changes: [
          { tag:'feature', text:'หน้าใหม่ใน admin: รวม log ทุกอย่าง (login/logout/password/easter) ในหน้าเดียว' },
          { tag:'feature', text:'ฟิลเตอร์ครบ: ผู้ใช้/ประเภท/อุปกรณ์/เวลา/น่าสงสัย + ช่องค้นหา' },
          { tag:'feature', text:'Timeline พร้อม pagination โหลดเพิ่ม ดูย้อนหลังได้ทั้งหมด' },
          { tag:'backend', text:'สร้าง VIEW tb_activity_log รวม 5 ตาราง (ไม่กระทบข้อมูลเดิม)' },
        ],
      },
      {
        version: '0.7.12.6',
        date: '29 พ.ค. 2569',
        commit: '729bda8',
        title: 'ขัดเกลา UI "อุปกรณ์ที่เข้าใช้งาน"',
        changes: [
          { tag:'ui',   text:'ปุ่มออกทุกอุปกรณ์ เปลี่ยนจากแดง → ส้มอำพัน นุ่มตา' },
          { tag:'text', text:'ปรับคำให้ทางการ: "เมื่อกี้→เมื่อสักครู่", "ขยับล่าสุด→ใช้งานล่าสุด"' },
          { tag:'bug',  text:'แก้ไอคอนมือถือไม่ขึ้นบน FA 6.0 (เปลี่ยนใช้ fa-mobile/tablet/desktop)' },
        ],
      },
      {
        version: '0.7.12.5',
        date: '29 พ.ค. 2569',
        commit: '53a92ea',
        title: 'Session Activity Log — Phase B2+B3',
        changes: [
          { tag:'feature',  text:'ระบบตรวจ session หมดอายุเอง — ปิดแถว + บันทึก log อัตโนมัติ' },
          { tag:'feature',  text:'ปุ่ม "ออกทุกอุปกรณ์ยกเว้นเครื่องนี้" ในหน้าโปรไฟล์ + popup ยืนยัน' },
          { tag:'feature',  text:'หน้า "อุปกรณ์ที่เข้าใช้งาน" แสดง session active + ประวัติ 100 รายการ' },
        ],
      },
      {
        version: '0.7.12.4',
        date: '29 พ.ค. 2569',
        commit: 'd24d47d',
        title: 'Session Activity Log — Phase B1',
        changes: [
          { tag:'feature',  text:'เริ่มเก็บข้อมูล session: login เมื่อไหร่ / ออกเมื่อไหร่ / ใช้อุปกรณ์อะไร' },
          { tag:'backend',  text:'ตาราง tb_session_log + middleware ping last_active ทุก 5 นาที' },
          { tag:'backend',  text:'ติดตั้ง ua-parser-js แยกชื่อ browser + os + device ละเอียด' },
        ],
      },
      {
        version: '0.7.12.3',
        date: '29 พ.ค. 2569',
        commit: '0cda4f5',
        title: 'Logout log + Easter egg log',
        changes: [
          { tag:'feature', text:'เก็บ log การออกจากระบบทุกครั้ง (manual / session expired)' },
          { tag:'feature', text:'เก็บ log Easter egg — ใครเจอ ใครถูกเตะออก (เก็บไว้ขำๆ)' },
          { tag:'text',    text:'ข้อความ rate limit แบ่ง 3 บรรทัด อ่านง่ายขึ้น' },
        ],
      },
      {
        version: '0.7.12.2',
        date: '27 พ.ค. 2569',
        commit: 'b560bae',
        title: 'Login attempt log + Rate Limit (ป้องกัน brute force)',
        changes: [
          { tag:'security', text:'เก็บ log ทุก attempt login (สำเร็จ/ผิดรหัส/ไม่มี email/ไม่มี username)' },
          { tag:'security', text:'จำกัด 5 ครั้ง / 15 นาที — เกินแล้วระงับชั่วคราว ป้องกัน brute force' },
          { tag:'security', text:'Anti-enumeration — ไม่บอก attacker ว่า email มีในระบบหรือไม่' },
        ],
      },
      {
        version: '0.7.12.1',
        date: '27 พ.ค. 2569',
        commit: '25f6ab4',
        title: 'ระบบลืมรหัสผ่าน (รีเซ็ตทางอีเมล)',
        changes: [
          { tag:'feature',  text:'ลิงก์ "ลืมรหัสผ่าน" ที่หน้า login — รีเซ็ตผ่านอีเมลได้' },
          { tag:'feature',  text:'เก็บ log การขอ + การรีเซ็ต ครบทุก attempt' },
        ],
      },
      {
        version: '0.7.12.0',
        date: '27 พ.ค. 2569',
        commit: '99d82be',
        title: 'ระบบเปลี่ยนรหัสผ่านในโปรไฟล์',
        changes: [
          { tag:'feature',  text:'เปลี่ยนรหัสผ่านได้เองในหน้าโปรไฟล์ (กรอกรหัสเก่า + รหัสใหม่)' },
          { tag:'security', text:'จำกัด 3 ครั้ง / 24 ชม. ส่งเมลแจ้งเตือนทุกครั้งที่เปลี่ยน' },
        ],
      },
      {
        version: '0.7.11.6',
        date: '22 พ.ค. 2569',
        commit: '5ea6aa9',
        title: 'Audit Log — ขั้น 5 (UI 2 คอลัมน์) + ขัดเกลา UX',
        changes: [
          { tag:'feature', text:'แท็บประวัติ admin แสดง 2 คอลัมน์ (ปิดบัญชี ↔ กู้คืน)' },
          { tag:'ui',      text:'ขัดเกลาสี/ระยะห่าง/ไอคอน UX ละเอียดยิบทั่วทั้งระบบ' },
        ],
      },
      {
        version: '0.7.11.5',
        date: '22 พ.ค. 2569',
        commit: 'c3eb1c7',
        title: 'Audit Log — ขั้น 3-4 + จัดแท็บจัดการผู้ใช้ใหม่',
        changes: [
          { tag:'feature', text:'จัดแท็บ admin เป็น 2 แถว แยก "ถูกปฏิเสธ" กับ "ถูกปิดบัญชี" ชัดเจน' },
          { tag:'backend', text:'จดประวัติการกระทำต่อ user ครบทุก action (อนุมัติ/ปฏิเสธ/แก้ไข/ปิด)' },
        ],
      },
      {
        version: '0.7.11.4',
        date: '22 พ.ค. 2569',
        commit: 'a5edffd',
        title: 'Audit Log — ขั้น 1-2 (กันประวัติหายตอนลบ)',
        changes: [
          { tag:'security', text:'เก็บสำเนาโปรไฟล์ผู้ใช้ทั้งใบตอนถูกลบ — ข้อมูลไม่หายแม้ admin ลบบัญชี' },
          { tag:'backend',  text:'จดทุกการลบลงในตาราง audit + เก็บ snapshot ของข้อมูล ณ เวลานั้น' },
        ],
      },
      {
        version: '0.7.11.3',
        date: '22 พ.ค. 2569',
        commit: '0776d72',
        title: 'ลบหน้า admin เก่า + Bug Audit ข้อ 11',
        changes: [
          { tag:'remove',   text:'ลบหน้า admin เก่าที่ไม่ใช้แล้ว ลดความสับสน' },
          { tag:'security', text:'เพิ่ม rate limit ฝั่ง API กันการยิงรัวๆ' },
          { tag:'bug',      text:'แก้ลิงก์เมลแอดมินที่ส่งไปผิดที่' },
        ],
      },
      {
        version: '0.7.11.2',
        date: '22 พ.ค. 2569',
        commit: 'a91288d',
        title: 'ระบบเหตุผล + ประวัติการเปิด-ปิดบัญชี + Bug Audit ข้อ 12',
        changes: [
          { tag:'feature', text:'ทุกการปิด/กู้บัญชี ต้องระบุเหตุผล — เก็บประวัติครบ' },
          { tag:'feature', text:'แท็บประวัติแสดงไทม์ไลน์การเปลี่ยนสถานะของ user' },
        ],
      },
      {
        version: '0.7.11.1',
        date: '21 พ.ค. 2569',
        commit: '1a990ab',
        title: 'กล่องแผนพัฒนาระบบยา ในหน้าตั้งค่า',
        changes: [
          { tag:'ui', text:'เพิ่มกล่องบอกแผนพัฒนาในหน้าตั้งค่า > ยาโรคร่วม' },
        ],
      },
      {
        version: '0.7.11',
        date: '21 พ.ค. 2569',
        commit: 'da21ba2',
        title: 'เปลี่ยนชื่อระบบเป็น "TB JOURNEY & CARE"',
        changes: [
          { tag:'feature', text:'รีแบรนด์ทั้งระบบ จาก TB-CARE LINK → TB JOURNEY & CARE' },
          { tag:'feature', text:'ไอคอนอัปโหลดรูปโปรไฟล์ในหน้าโปรไฟล์ (badge "เร็วๆ นี้")' },
        ],
      },
      {
        version: '0.7.10.5',
        date: '21 พ.ค. 2569',
        commit: 'adc6e2d',
        title: 'อุดช่องโหว่ตรวจเบอร์โทร + popup About + ปรับ UI โปรไฟล์',
        changes: [
          { tag:'security', text:'ตรวจเบอร์โทรเข้มขึ้น บล็อกรูปแบบเบอร์ที่ไม่ใช่ของไทย' },
          { tag:'feature',  text:'popup "เกี่ยวกับระบบ" ครั้งแรก — ดูเวอร์ชัน + ข้อมูลผู้พัฒนา' },
          { tag:'ui',       text:'ปรับ UI โปรไฟล์ให้เป็นระเบียบขึ้น' },
        ],
      },
      {
        version: '0.7.10.4',
        date: '21 พ.ค. 2569',
        commit: '353323d',
        title: 'ระบบคำนำหน้าชื่อ (เคารพ LGBTQ+)',
        changes: [
          { tag:'feature', text:'เลือกคำนำหน้านาม นาย/นาง/นางสาว → ระบบแปลงเป็นตัวย่อวิชาชีพอัตโนมัติ' },
          { tag:'feature', text:'รองรับความหลากหลาย — ผู้ใช้เลือกเพศได้อิสระ ไม่บังคับตามใบประกอบ' },
        ],
      },
      {
        version: '0.7.10.3',
        date: '21 พ.ค. 2569',
        commit: 'de99466',
        title: 'รวมระบบเลขใบประกอบเป็นบัญชีกลาง',
        changes: [
          { tag:'feature', text:'ระบบเลขใบประกอบ 1 ฐาน ตรวจ duplicate ข้ามทั้งเว็บได้' },
          { tag:'ui',      text:'ปรับ UI หน้าแก้ไขผู้ใช้ — เห็นเลขใบประกอบชัด แก้ไขสะดวก' },
        ],
      },
      {
        version: '0.7.10.2',
        date: '20 พ.ค. 2569',
        commit: '3163818',
        title: 'ระบบคำขอแก้ไขข้อมูลครบวงจร',
        changes: [
          { tag:'feature', text:'user ส่งคำขอแก้ไข — admin อนุมัติ/ปฏิเสธพร้อมเหตุผล' },
          { tag:'feature', text:'กระดิ่งแจ้งเตือนทั้ง 2 ฝั่ง + เมลแจ้งผลอัตโนมัติ 2 ทาง' },
        ],
      },
      {
        version: '0.7.10.1',
        date: '20 พ.ค. 2569',
        commit: 'a3280c8',
        title: 'Admin Edit Self + User Edit Request System',
        changes: [
          { tag:'feature', text:'admin แก้ข้อมูลตัวเองได้ในโปรไฟล์ (ไม่ต้องส่งคำขอ)' },
          { tag:'feature', text:'user ส่งคำขอแก้ไขฟิลด์ที่ต้องอนุมัติได้' },
          { tag:'text',    text:'ลบ ค่ะ/นะคะ ออกจาก UI ทั้งหมด 11 จุด ให้เป็นทางการ' },
        ],
      },
      {
        version: '0.7.10',
        date: '20 พ.ค. 2569',
        commit: '6ec65b5',
        title: 'Admin edit user + Profile edit log',
        changes: [
          { tag:'feature', text:'admin แก้ข้อมูล user คนอื่นได้ในแท็บจัดการผู้ใช้' },
          { tag:'backend', text:'ตาราง tb_profile_edit_log เก็บประวัติการแก้ไขทุกฟิลด์' },
        ],
      },
      {
        version: '0.7.9.6',
        date: '20 พ.ค. 2569',
        commit: '628a585',
        title: 'ปรับปรุงหน้าสมัครสมาชิกครั้งใหญ่',
        changes: [
          { tag:'ui',      text:'หน้า Register โฉมใหม่ — UI ทันสมัยขึ้น ใช้ง่ายขึ้น' },
          { tag:'feature', text:'เพิ่ม dropdown วิชาชีพ + คำแนะนำใต้ช่องชื่อโรงพยาบาล' },
          { tag:'feature', text:'บังคับกรอกฟิลด์ที่จำเป็นครบถ้วน' },
        ],
      },
      {
        version: '0.7.9.5',
        date: '19 พ.ค. 2569',
        commit: '4cc6797',
        title: 'Revert proxy.ts → middleware.ts (Cloudflare incompatibility)',
        changes: [
          { tag:'bug',     text:'Cloudflare Workers ไม่รัน proxy.ts (Next.js 16 ใหม่) — กลับมาใช้ middleware.ts' },
          { tag:'backend', text:'ทนกับ deprecation warning ไปก่อนจนกว่า Cloudflare รองรับ' },
        ],
      },
      {
        version: '0.7.9.4',
        date: '19 พ.ค. 2569',
        commit: '736ccf1',
        title: 'Bug Audit ข้อ 5: CSP + Security headers',
        changes: [
          { tag:'security', text:'เพิ่ม Content Security Policy ป้องกัน XSS' },
          { tag:'security', text:'เพิ่ม X-Frame-Options / X-Content-Type-Options / Referrer-Policy' },
        ],
      },
      {
        version: '0.7.9.3',
        date: '19 พ.ค. 2569',
        commit: 'aabe17b',
        title: 'Bug Audit ข้อ 3-4: Status guards ใน approve/reject API',
        changes: [
          { tag:'bug', text:'API approve/reject เช็คสถานะปัจจุบันก่อนแก้ — กัน race condition' },
        ],
      },
      {
        version: '0.7.9.2',
        date: '19 พ.ค. 2569',
        commit: '0bfad0b',
        title: 'Migrate middleware.ts → proxy.ts (Next.js 16 deprecation)',
        changes: [
          { tag:'backend', text:'ลองอัปเดตตาม Next.js 16 — แต่ Cloudflare ไม่รองรับ (revert ใน 9.5)' },
        ],
      },
      {
        version: '0.7.9.1',
        date: '19 พ.ค. 2569',
        commit: '16b3e40',
        title: 'Bug Audit ข้อ 2: User Name Snapshot Pattern',
        changes: [
          { tag:'security', text:'เก็บ snapshot ชื่อ user ทุก action log — ข้อมูลไม่หายแม้ user ถูกลบ' },
          { tag:'backend',  text:'Foreign Key SET NULL — log ไม่พังเมื่อ user หายไป' },
        ],
      },
      {
        version: '0.7.9',
        date: '18 พ.ค. 2569',
        commit: 'b9b29e2',
        title: 'Bug Audit Round 1: ปิดคำสั่ง SQL อันตราย',
        changes: [
          { tag:'security', text:'audit เจอช่องโหว่ใน SQL หลายจุด — แก้ครบ (ข้อ 1/12)' },
        ],
      },
      {
        version: '0.7.8.4',
        date: '18 พ.ค. 2569',
        commit: '70ede5b',
        title: 'Reject History แบบ Timeline + UX Polish',
        changes: [
          { tag:'ui',      text:'แสดงประวัติการปฏิเสธเป็น timeline อ่านง่าย' },
          { tag:'ui',      text:'ขัดเกลา UX ละเอียด' },
        ],
      },
      {
        version: '0.7.8.3',
        date: '18 พ.ค. 2569',
        commit: '4a48a4a',
        title: 'License field แดงเมื่อเลขซ้ำ + UX clear error',
        changes: [
          { tag:'ui',  text:'ช่องเลขใบประกอบเปลี่ยนสีแดงทันทีเมื่อตรวจพบเลขซ้ำ' },
          { tag:'ui',  text:'เคลียร์ error ทันทีตอนผู้ใช้เริ่มแก้ไข' },
        ],
      },
      {
        version: '0.7.8.2',
        date: '18 พ.ค. 2569',
        commit: '77b812b',
        title: 'Reject History Snapshot + License Dup Check',
        changes: [
          { tag:'feature',  text:'เก็บ snapshot ตอนปฏิเสธสมัคร — ดูข้อมูลเดิมได้แม้ user แก้ใหม่' },
          { tag:'security', text:'ตรวจเลขใบประกอบซ้ำแบบไม่สน prefix (ภ.12345 = ภญ.12345)' },
        ],
      },
      {
        version: '0.7.8.1',
        date: '18 พ.ค. 2569',
        commit: '39caa31',
        title: 'Validate เบอร์โทรเข้มขึ้น',
        changes: [
          { tag:'security', text:'บล็อกเบอร์มั่ว/ปลอม เช่น 0000000000 / 1234567890' },
        ],
      },
      {
        version: '0.7.8',
        date: '18 พ.ค. 2569',
        commit: 'a94299b',
        title: 'ระบบประวัติการปฏิเสธ + Register Validation',
        changes: [
          { tag:'feature', text:'admin ดูประวัติว่า user คนนี้เคยถูกปฏิเสธกี่ครั้ง เหตุผลอะไรบ้าง' },
          { tag:'ui',      text:'Custom popups สวยขึ้น แทน browser alert' },
          { tag:'security',text:'Validation หน้า Register เข้มขึ้น' },
        ],
      },
      {
        version: '0.7.7.2',
        date: '17 พ.ค. 2569',
        commit: 'e7be30b',
        title: 'Realtime subscriptions (ไม่ต้อง refresh แล้ว)',
        changes: [
          { tag:'feature', text:'ข้อมูลอัปเดตทันทีไม่ต้องกด refresh — admin/user เห็นพร้อมกัน' },
          { tag:'backend', text:'Subscribe 4 ตารางผ่าน Supabase Realtime' },
        ],
      },
      {
        version: '0.7.7.1',
        date: '17 พ.ค. 2569',
        commit: '808e385',
        title: 'แก้บั๊ก badge รออนุมัติค้าง',
        changes: [
          { tag:'bug', text:'badge รออนุมัติค้างอยู่หลัง approve — restore ไม่เคลียร์ pending' },
        ],
      },
      {
        version: '0.7.7',
        date: '17 พ.ค. 2569',
        commit: '343482d',
        title: 'Bell User Notifications + Custom Popups',
        changes: [
          { tag:'feature', text:'user มีกระดิ่งแจ้งเตือนของตัวเอง — เห็นว่าคำขอผ่านหรือไม่' },
          { tag:'ui',      text:'Custom popups แทน browser alert — เด้งสวยขึ้น' },
          { tag:'feature', text:'acknowledged_at — กดอ่านแล้วไม่เด้งซ้ำ' },
        ],
      },
      {
        version: '0.7.6.2',
        date: '17 พ.ค. 2569',
        commit: '73e7e52',
        title: 'Audit Log + Cancel Delete + Green Badge',
        changes: [
          { tag:'feature', text:'แท็บ Audit Log สำหรับ admin — ดูประวัติการกระทำทั้งหมด' },
          { tag:'feature', text:'user ยกเลิกคำขอลบผู้ป่วยได้' },
          { tag:'ui',      text:'badge เขียวบอก "อนุมัติแล้ว" เห็นชัด' },
        ],
      },
      {
        version: '0.7.6.1',
        date: '17 พ.ค. 2569',
        commit: 'b1aa9e5',
        title: 'Account Deactivation + ภาษาทางการ',
        changes: [
          { tag:'feature', text:'admin ปิดบัญชี user ได้ครบวงจร (deactivate/reactivate)' },
          { tag:'text',    text:'ปรับภาษา UI ให้ทางการขึ้น เหมาะกับโรงพยาบาล' },
        ],
      },
      {
        version: '0.7.6',
        date: '17 พ.ค. 2569',
        commit: 'a1fa59a',
        title: 'User Management & Registration Security',
        changes: [
          { tag:'feature',  text:'หน้าจัดการผู้ใช้สำหรับ admin — รายชื่อ, สถานะ, action' },
          { tag:'security', text:'Validation หน้า Register เพิ่ม' },
        ],
      },
      {
        version: '0.7.5.3',
        date: '17 พ.ค. 2569',
        commit: '01dc924',
        title: 'แก้ระบบเมลแอดมิน + lock ทุกแท็บ + bug refresh',
        changes: [
          { tag:'bug', text:'เมลแอดมินไม่ส่ง — แก้ระบบส่งเมลใหม่' },
          { tag:'bug', text:'ปุ่มลบกลับมาแสดงหลัง refresh — fix state ค้าง' },
        ],
      },
      {
        version: '0.7.5.2',
        date: '17 พ.ค. 2569',
        commit: '10eebf9',
        title: 'บล็อกแก้ไขทุกแท็บเมื่อรอลบ + ลบซ้ำ',
        changes: [
          { tag:'bug', text:'duplicate delete request หลัง refresh — แก้ idempotency' },
        ],
      },
      {
        version: '0.7.5.1',
        date: '17 พ.ค. 2569',
        commit: '2a3278b',
        title: 'บล็อกแก้ไขผู้ป่วยรอลบ + Drug Dose System',
        changes: [
          { tag:'feature', text:'ผู้ป่วยที่มีคำขอลบรออยู่ — บันทึก/แก้ข้อมูลไม่ได้จนกว่าจะตัดสินใจ' },
          { tag:'feature', text:'ระบบคำนวณ Drug Dose เบื้องต้น' },
        ],
      },
      {
        version: '0.7.5',
        date: '17 พ.ค. 2569',
        commit: '46470a8',
        title: 'ระบบขอลบผู้ป่วย Step 4-5 + Email Notifications',
        changes: [
          { tag:'feature', text:'user ส่งคำขอลบผู้ป่วย — admin อนุมัติ/ปฏิเสธ' },
          { tag:'feature', text:'เมลแจ้งเตือนทุก action (admin/user)' },
        ],
      },
      {
        version: '0.7.4',
        date: '17 พ.ค. 2569',
        commit: '64637d6',
        title: 'ระบบถังขยะ + Admin notifications',
        changes: [
          { tag:'feature', text:'ลบผู้ป่วยไม่ได้ลบจริง — เข้าถังขยะ 60 วัน admin กู้คืนได้' },
          { tag:'feature', text:'admin มีกระดิ่งแจ้งเตือน user สมัครใหม่' },
          { tag:'bug',     text:'แก้บั๊ก infrastructure 3 จุด' },
        ],
      },
      {
        version: '0.7.3',
        date: '16 พ.ค. 2569',
        commit: '6c45961',
        title: '🎉 tbjourney.care LIVE! โดเมนเป็นของตัวเองครั้งแรก',
        changes: [
          { tag:'feature',  text:'ซื้อโดเมน tbjourney.care + เชื่อม Cloudflare DNS' },
          { tag:'feature',  text:'Verify Resend + ตั้ง DMARC ส่งเมลใช้โดเมนตัวเอง' },
          { tag:'backend',  text:'ตั้ง Supabase Site URL + Env vars Runtime' },
        ],
      },
      {
        version: '0.7.2.4',
        date: '16 พ.ค. 2569',
        commit: 'bfe274a',
        title: 'Hotfix: rename index.html → app.html',
        changes: [
          { tag:'bug', text:'Cloudflare เสิร์ฟ index.html ข้าม Next.js auth — เปลี่ยนชื่อกัน bypass' },
        ],
      },
      {
        version: '0.7.2.3',
        date: '16 พ.ค. 2569',
        commit: 'f67023e',
        title: 'Hotfix: server-side auth check ใน root page',
        changes: [
          { tag:'security', text:'middleware Cloudflare ไม่ทำงานบางที — เพิ่ม auth check ฝั่ง server ในหน้าหลัก' },
        ],
      },
      {
        version: '0.7.2.2',
        date: '16 พ.ค. 2569',
        commit: 'a2de01d',
        title: 'Hotfix: force-dynamic auth pages',
        changes: [
          { tag:'bug', text:'หน้า auth ถูก prerender บน Cloudflare — บังคับ force-dynamic' },
        ],
      },
      {
        version: '0.7.2.1',
        date: '16 พ.ค. 2569',
        commit: 'e436055',
        title: 'Hotfix tag — bump version หลัง deploy',
        changes: [
          { tag:'backend', text:'lazy-init Resend client กัน Cloudflare build crash' },
        ],
      },
      {
        version: '0.7.2',
        date: '16 พ.ค. 2569',
        commit: '092d2b5',
        title: 'Backend Phase 1 Complete (Auth + Email + Admin Approval)',
        changes: [
          { tag:'feature',  text:'Supabase Auth จริง — login/logout ใช้งานได้' },
          { tag:'feature',  text:'ส่งเมลผ่าน Resend — แจ้ง admin ทุกครั้งมี user สมัครใหม่' },
          { tag:'feature',  text:'Admin Approval flow — สมัครแล้วต้องรอ admin อนุมัติก่อนใช้งาน' },
          { tag:'feature',  text:'Profile ดึงข้อมูลจริงจาก DB (ไม่ใช่ mock อีกแล้ว)' },
        ],
      },
      {
        version: '0.7.1',
        date: '15 พ.ค. 2569',
        commit: '93cf7fa',
        title: 'Register form revamp + Profile modal redesign',
        changes: [
          { tag:'ui',       text:'ฟอร์ม Register ออกแบบใหม่ — ทันสมัย ใช้ง่ายขึ้น' },
          { tag:'ui',       text:'Profile modal โฉมใหม่ — layout 2 คอลัมน์' },
          { tag:'security', text:'🚨 Critical: เพิ่ม RLS policies กัน anon key แก้ข้อมูลคนไข้ + ลบ "allow all"' },
          { tag:'backend',  text:'เพิ่ม .gitignore กัน secrets หลุดขึ้น GitHub' },
        ],
      },
      {
        version: '0.7.0',
        date: '15 พ.ค. 2569',
        commit: 'cb66855',
        title: 'TB CARE & JOURNEY — ระบบ Login จริง + เปลี่ยนชื่อโปรเจกต์',
        changes: [
          { tag:'feature', text:'ระบบ Login จริงด้วย Supabase Auth (เลิกใช้ login จำลอง)' },
          { tag:'feature', text:'รีแบรนด์ครั้งแรก: TB-CARE LINK → TB CARE & JOURNEY' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // v0.6 — First Real Build (พ.ค. 2569)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    major: '0.6',
    era: 'First Real Build',
    icon: '🚀',
    color: '#0891b2',
    period: '11 – 15 พ.ค. 2569',
    description: 'Full App Build ครั้งแรก — Dashboard, Patient List, Modal ทุกอย่างเปิดตัวพร้อมกัน',
    versions: [
      {
        version: '0.6.21',
        date: '15 พ.ค. 2569',
        commit: '33d4281',
        title: 'UI overhaul: login, charts, table, sidebar, search',
        changes: [
          { tag:'ui',      text:'login toggle + chart tooltip + table header teal + sidebar floating circle' },
          { tag:'feature', text:'global search roadmap (วางพื้นฐาน)' },
        ],
      },
      {
        version: '0.6.20',
        date: '14 พ.ค. 2569',
        commit: '24baa1e',
        title: 'Major Feature & UI/UX Overhaul',
        changes: [
          { tag:'feature', text:'เปลี่ยนแปลง feature และ UI/UX ครั้งใหญ่' },
          { tag:'bug',     text:'แก้ version ที่ค้างใน sidebar footer' },
        ],
      },
      {
        version: '0.6.0',
        date: '11 พ.ค. 2569',
        commit: '616d20f',
        title: 'TB-CARE LINK — Full App Build (First Real Commit)',
        changes: [
          { tag:'feature', text:'Build แอปทั้งระบบครั้งแรกที่ใช้งานได้จริง' },
          { tag:'feature', text:'Dashboard, Patient List, AddPatient, Bell — เปิดตัวพร้อมกันหมด' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // v0.5 — TB-CARE LINK Genesis
  // ═══════════════════════════════════════════════════════════════════════════
  {
    major: '0.5',
    era: 'Genesis',
    icon: '🌱',
    color: '#65a30d',
    period: '11 พ.ค. 2569',
    description: 'จุดเริ่มต้น — ลองวาง concept TB-CARE LINK + แปลงโปรเจกต์เป็น Next.js',
    versions: [
      {
        version: '0.5.0',
        date: '11 พ.ค. 2569',
        commit: 'c074619',
        title: 'TB-CARE LINK — Major UI/UX Overhaul',
        changes: [
          { tag:'feature', text:'วาง concept TB-CARE LINK ครั้งแรก' },
          { tag:'backend', text:'แปลงโปรเจกต์เป็น Next.js (preview functionality)' },
          { tag:'bug',     text:'แก้ปัญหา CDN React' },
        ],
      },
    ],
  },
];
