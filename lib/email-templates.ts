// Email templates สำหรับ TB CARE & JOURNEY
// ทุก template ใช้ inline CSS เพราะ email client ไม่รองรับ external CSS

type ProfileSummary = {
  userId:         string
  username:       string
  email:          string
  firstName:      string
  lastName:       string
  profession:     string  // label เช่น "เภสัชกร"
  licenseNumber:  string  // เต็มรวม prefix เช่น "ภ.12345"
  hospitalName:   string
  hospitalType:   string
  department:     string
}

const BRAND_TEAL = '#0f766e'
const BRAND_TEAL_DARK = '#134e4a'

// ─── Layout wrapper ──────────────────────────────────────
function wrap(title: string, body: string): string {
  return `
    <!doctype html>
    <html lang="th">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Sarabun','Helvetica',Arial,sans-serif;color:#1f2937;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
            <tr><td style="background:linear-gradient(135deg,${BRAND_TEAL_DARK},${BRAND_TEAL});padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">🩺 TB CARE &amp; JOURNEY</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:12px;">รพ.ปรางค์กู่ · ระบบจัดการข้อมูลผู้ป่วยวัณโรค</p>
            </td></tr>
            <tr><td style="padding:32px;">${body}</td></tr>
            <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #f1f5f9;">
              อีเมลนี้ส่งจากระบบอัตโนมัติ · กรุณาอย่าตอบกลับ
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
}

// ═════════════════════════════════════════════════════════
// 1) Admin Notify — มีคนสมัครใหม่ ต้องอนุมัติ
// ═════════════════════════════════════════════════════════
export function adminNotifyEmail(p: ProfileSummary, baseUrl: string) {
  const approveUrl = `${baseUrl}/admin/users`
  const subject = `🔔 มีผู้ใช้ใหม่รออนุมัติ: ${p.firstName} ${p.lastName}`
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">คำขอสมัครสมาชิกใหม่</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;">มีผู้ใช้ส่งคำขอสมัครเข้าใช้งานระบบ กรุณาตรวจสอบและพิจารณาอนุมัติ</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;width:130px;">ชื่อ-นามสกุล</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${p.firstName} ${p.lastName}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">วิชาชีพ</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${p.profession}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">เลขใบประกอบ</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${p.licenseNumber || '—'}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">โรงพยาบาล</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${p.hospitalName}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">ประเภท รพ.</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${p.hospitalType}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">แผนก</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${p.department}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Username</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${p.username}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">Email</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${p.email}</td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0;">
        <a href="${approveUrl}" style="display:inline-block;padding:14px 32px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
          🛡️ เข้าหน้าจัดการผู้ใช้
        </a>
      </td></tr>
    </table>

    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
      คลิกปุ่มข้างบนเพื่อไปอนุมัติหรือปฏิเสธคำขอนี้
    </p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 2) User Pending — แจ้ง user ว่ารออนุมัติ
// ═════════════════════════════════════════════════════════
export function userPendingEmail(firstName: string) {
  const subject = 'ได้รับคำขอสมัครสมาชิก — รอการอนุมัติจากผู้ดูแลระบบ'
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ระบบได้รับคำขอสมัครสมาชิกของท่านเรียบร้อยแล้ว
    </p>

    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        <strong>สถานะ:</strong> รอผู้ดูแลระบบพิจารณาอนุมัติ<br/>
        เมื่อได้รับการอนุมัติ ระบบจะแจ้งให้ทราบทางอีเมล จากนั้นจึงจะสามารถเข้าใช้งานระบบได้
      </p>
    </div>

    <p style="margin:0 0 8px;font-size:14px;color:#4b5563;">ขอขอบคุณที่ให้ความสนใจในระบบ</p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB CARE &amp; JOURNEY</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 3) User Approved — อนุมัติแล้ว
// ═════════════════════════════════════════════════════════
export function userApprovedEmail(firstName: string, baseUrl: string) {
  const subject = 'บัญชีของท่านได้รับการอนุมัติ'
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ผู้ดูแลระบบได้อนุมัติคำขอสมัครสมาชิกของท่านเรียบร้อยแล้ว ท่านสามารถเข้าใช้งานระบบได้ทันที
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0 20px;">
        <a href="${baseUrl}/login" style="display:inline-block;padding:14px 36px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
          เข้าสู่ระบบ
        </a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:13px;color:#6b7280;">TB CARE &amp; JOURNEY</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 4) User Rejected — ปฏิเสธ
// ═════════════════════════════════════════════════════════
export function userRejectedEmail(firstName: string, reason: string) {
  const subject = 'แจ้งผลคำขอสมัครสมาชิก — ไม่ได้รับการอนุมัติ'
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ขอเรียนแจ้งให้ทราบว่า คำขอสมัครสมาชิกของท่านไม่ได้รับการอนุมัติในครั้งนี้
    </p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#991b1b;font-weight:700;">เหตุผล</p>
      <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">${reason || '(ไม่ระบุเหตุผล)'}</p>
    </div>

    <p style="margin:0 0 8px;font-size:14px;color:#4b5563;line-height:1.7;">
      หากท่านมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบโดยตรง
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB CARE &amp; JOURNEY</p>
  `
  return { subject, html: wrap(subject, body) }
}
