// Email templates สำหรับ TB JOURNEY & CARE
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
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.3px;display:inline-flex;align-items:center;gap:10px;font-family:'Manrope','Sarabun',sans-serif;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;background:#ffffff;border-radius:12px;flex-shrink:0;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="32" height="26" style="vertical-align:middle;"><path fill="#0d9488" d="M320 0c17.7 0 32 14.3 32 32l0 124.2c-8.5-7.6-19.7-12.2-32-12.2s-23.5 4.6-32 12.2L288 32c0-17.7 14.3-32 32-32zM444.5 195.5c-16.4-16.4-41.8-18.5-60.5-6.1l0-24.1C384 127 415 96 453.3 96c21.7 0 42.8 10.2 55.8 28.8c15.4 22.1 44.3 65.4 71 116.9c26.5 50.9 52.4 112.5 59.6 170.3c.2 1.3 .2 2.6 .2 4l0 7c0 49.1-39.8 89-89 89c-7.3 0-14.5-.9-21.6-2.7l-72.7-18.2c-20.9-5.2-38.7-17.1-51.5-32.9c14 1.5 28.5-3 39.2-13.8l-22.6-22.6 22.6 22.6c18.7-18.7 18.7-49.1 0-67.9c-1.1-1.1-1.4-2-1.5-2.5c-.1-.8-.1-1.8 .4-2.9s1.2-1.9 1.8-2.3c.5-.3 1.3-.8 2.9-.8c26.5 0 48-21.5 48-48s-21.5-48-48-48c-1.6 0-2.4-.4-2.9-.8c-.6-.4-1.3-1.2-1.8-2.3s-.5-2.2-.4-2.9c.1-.6 .4-1.4 1.5-2.5c18.7-18.7 18.7-49.1 0-67.9zM183.3 491.2l-72.7 18.2c-7.1 1.8-14.3 2.7-21.6 2.7c-49.1 0-89-39.8-89-89l0-7c0-1.3 .1-2.7 .2-4c7.2-57.9 33.1-119.4 59.6-170.3c26.8-51.5 55.6-94.8 71-116.9c13-18.6 34-28.8 55.8-28.8C225 96 256 127 256 165.3l0 24.1c-18.6-12.4-44-10.3-60.5 6.1c-18.7 18.7-18.7 49.1 0 67.9c1.1 1.1 1.4 2 1.5 2.5c.1 .8 .1 1.8-.4 2.9s-1.2 1.9-1.8 2.3c-.5 .3-1.3 .8-2.9 .8c-26.5 0-48 21.5-48 48s21.5 48 48 48c1.6 0 2.4 .4 2.9 .8c.6 .4 1.3 1.2 1.8 2.3s.5 2.2 .4 2.9c-.1 .6-.4 1.4-1.5 2.5c-18.7 18.7-18.7 49.1 0 67.9c10.7 10.7 25.3 15.3 39.2 13.8c-12.8 15.9-30.6 27.7-51.5 32.9z"/><path fill="#fbbf24" d="M421.8 421.8c-6.2 6.2-16.4 6.2-22.6 0C375.9 398.5 336 415 336 448c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-33-39.9-49.5-63.2-26.2c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6C241.5 375.9 225 336 192 336c-8.8 0-16-7.2-16-16s7.2-16 16-16c33 0 49.5-39.9 26.2-63.2c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0C264.1 241.5 304 225 304 192c0-8.8 7.2-16 16-16s16 7.2 16 16c0 33 39.9 49.5 63.2 26.2c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6C398.5 264.1 415 304 448 304c8.8 0 16 7.2 16 16s-7.2 16-16 16c-33 0-49.5 39.9-26.2 63.2c6.2 6.2 6.2 16.4 0 22.6z"/><path fill="#e11d48" d="M296 320a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm72 32a16 16 0 1 0 -32 0 16 16 0 1 0 32 0z"/></svg>
                </span>
                <span>TB JOURNEY <span style="font-family:'Plus Jakarta Sans','Sarabun',sans-serif;">&amp;</span> CARE</span>
              </h1>
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
  // ชี้ไปหน้าแรก (login → dashboard) — admin กดเมนู "จัดการผู้ใช้" ที่มี badge แดงนำทาง
  const approveUrl = baseUrl
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
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
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

    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 4) User Rejected — ปฏิเสธ
// ═════════════════════════════════════════════════════════
export function userRejectedEmail(firstName: string, reason: string, baseUrl?: string) {
  const subject = 'แจ้งผลคำขอสมัครสมาชิก — ไม่ได้รับการอนุมัติ'
  const registerUrl = baseUrl ? `${baseUrl}/register` : '/register'
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ขอเรียนแจ้งให้ทราบว่า คำขอสมัครสมาชิกของท่านไม่ได้รับการอนุมัติในครั้งนี้
    </p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#991b1b;font-weight:700;">เหตุผล</p>
      <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">${reason || '(ไม่ระบุเหตุผล)'}</p>
    </div>

    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:13px;color:${BRAND_TEAL_DARK};font-weight:700;">📝 สมัครใหม่ได้</p>
      <p style="margin:0;font-size:13px;color:${BRAND_TEAL};line-height:1.6;">
        หากต้องการแก้ไขข้อมูลและส่งคำขอใหม่ ท่านสามารถ <strong>สมัครด้วยอีเมลเดิม</strong> ได้ทันทีโดยไม่ต้องติดต่อผู้ดูแลระบบ
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0 16px;">
        <a href="${registerUrl}" style="display:inline-block;padding:12px 28px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:13px;">
          สมัครใหม่
        </a>
      </td></tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.7;">
      หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบ
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 5) Admin Delete Request — มีคนขอลบผู้ป่วย
// ═════════════════════════════════════════════════════════
export function adminDeleteRequestEmail(
  patientName: string, patientHn: string,
  reason: string, requesterName: string, requesterProfession: string, baseUrl: string
) {
  const trashUrl = `${baseUrl}/`
  const subject = `🗑️ คำขอลบผู้ป่วย: ${patientName} (HN: ${patientHn})`
  const body = `
    <h2 style="margin:0 0 16px;color:#991b1b;font-size:18px;">คำขอลบข้อมูลผู้ป่วย</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;">มีผู้ใช้ส่งคำขอลบข้อมูลผู้ป่วยออกจากระบบ กรุณาตรวจสอบและพิจารณา</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;width:130px;">ชื่อผู้ป่วย</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1f2937;">${patientName}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">HN</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1f2937;font-family:monospace;">${patientHn || '—'}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">ผู้ขอลบ</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${requesterName}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">วิชาชีพ</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${requesterProfession || '—'}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">เหตุผล</td>
          <td style="padding:6px 0;font-size:14px;color:#7f1d1d;line-height:1.6;">${reason}</td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0;">
        <a href="${trashUrl}" style="display:inline-block;padding:14px 32px;background:#dc2626;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
          🗑️ ไปที่ถังขยะ — อนุมัติ/ปฏิเสธ
        </a>
      </td></tr>
    </table>

    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
      คลิกปุ่มข้างบนเพื่อไปพิจารณาคำขอนี้ในระบบ
    </p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 6) User Delete Approved — แจ้ง user ว่าลบแล้ว
// ═════════════════════════════════════════════════════════
export function deleteRequestApprovedEmail(firstName: string, patientName: string) {
  const subject = `✅ คำขอลบผู้ป่วยได้รับการอนุมัติ: ${patientName}`
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ผู้ดูแลระบบได้อนุมัติคำขอลบข้อมูลผู้ป่วยของท่านเรียบร้อยแล้ว
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#166534;font-weight:700;">ผู้ป่วยที่ถูกลบ</p>
      <p style="margin:0;font-size:16px;font-weight:700;color:#15803d;">${patientName}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#166534;">ข้อมูลถูกย้ายไปถังขยะ — Admin สามารถกู้คืนได้ภายใน 60 วัน</p>
    </div>

    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 7) User Delete Rejected — แจ้ง user ว่าปฏิเสธ
// ═════════════════════════════════════════════════════════
export function deleteRequestRejectedEmail(firstName: string, patientName: string, note?: string) {
  const subject = `ℹ️ คำขอลบผู้ป่วยไม่ได้รับการอนุมัติ: ${patientName}`
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ขอเรียนแจ้งให้ทราบว่า คำขอลบข้อมูลผู้ป่วย <strong>${patientName}</strong> ไม่ได้รับการอนุมัติในครั้งนี้
    </p>

    ${note ? `
    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#92400e;font-weight:700;">หมายเหตุจาก Admin</p>
      <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">${note}</p>
    </div>` : ''}

    <p style="margin:0 0 8px;font-size:14px;color:#4b5563;">หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบโดยตรง</p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 7a) Admin Image Delete Request — มีคนขอลบรูปผู้ป่วย (เฟส 2)
// ═════════════════════════════════════════════════════════
export function adminImageDeleteRequestEmail(
  patientName: string, patientHn: string, imgTypeLabel: string,
  reason: string, requesterName: string, requesterProfession: string, baseUrl: string
) {
  const goUrl = `${baseUrl}/`
  const subject = `🗑️ คำขอลบรูปผู้ป่วย: ${patientName} (HN: ${patientHn})`
  const body = `
    <h2 style="margin:0 0 16px;color:#991b1b;font-size:18px;">คำขอลบรูปผู้ป่วย</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;">มีผู้ใช้ส่งคำขอลบรูปของผู้ป่วยออกจากระบบ กรุณาตรวจสอบและพิจารณา</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;width:130px;">ผู้ป่วย</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1f2937;">${patientName}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">HN</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1f2937;font-family:monospace;">${patientHn || '—'}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">ประเภทรูป</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${imgTypeLabel || '—'}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">ผู้ขอลบ</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${requesterName}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">วิชาชีพ</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${requesterProfession || '—'}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">เหตุผล</td>
          <td style="padding:6px 0;font-size:14px;color:#7f1d1d;line-height:1.6;">${reason}</td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0;">
        <a href="${goUrl}" style="display:inline-block;padding:14px 32px;background:#dc2626;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
          🗑️ ไปที่คลังรูป — อนุมัติ/ปฏิเสธ
        </a>
      </td></tr>
    </table>

    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center;">คลิกปุ่มข้างบนเพื่อไปพิจารณาคำขอนี้ในระบบ</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 7b) User Image Delete Approved — แอดมินอนุมัติลบรูป
// ═════════════════════════════════════════════════════════
export function imageDeleteApprovedEmail(firstName: string, patientName: string, imgTypeLabel: string) {
  const subject = `✅ คำขอลบรูปได้รับการอนุมัติ: ${patientName}`
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ผู้ดูแลระบบได้อนุมัติคำขอลบรูปของท่านเรียบร้อยแล้ว
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#166534;font-weight:700;">รูปที่ถูกลบ</p>
      <p style="margin:0;font-size:16px;font-weight:700;color:#15803d;">${imgTypeLabel} · ${patientName}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#166534;">รูปถูกย้ายไปถังขยะ — Admin สามารถกู้คืนได้ภายใน 60 วัน</p>
    </div>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 7c) User Image Delete Rejected — แอดมินปฏิเสธคำขอลบรูป
// ═════════════════════════════════════════════════════════
export function imageDeleteRejectedEmail(firstName: string, patientName: string, imgTypeLabel: string, note?: string) {
  const subject = `ℹ️ คำขอลบรูปไม่ได้รับการอนุมัติ: ${patientName}`
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ขอเรียนแจ้งให้ทราบว่า คำขอลบรูป <strong>${imgTypeLabel} · ${patientName}</strong> ไม่ได้รับการอนุมัติในครั้งนี้ รูปยังอยู่ในระบบตามปกติ
    </p>
    ${note ? `
    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#92400e;font-weight:700;">หมายเหตุจาก Admin</p>
      <p style="margin:0;font-size:14px;color:#78350f;line-height:1.6;">${note}</p>
    </div>` : ''}
    <p style="margin:0 0 8px;font-size:14px;color:#4b5563;">หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบโดยตรง</p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 8) User Delete Restored — admin กู้คืนผู้ป่วยที่ user ขอลบ
// ═════════════════════════════════════════════════════════
export function deleteRequestRestoredEmail(firstName: string, patientName: string) {
  const subject = `ℹ️ ผู้ป่วยถูกกู้คืนจากถังขยะ: ${patientName}`
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ขอเรียนแจ้งให้ทราบว่า ผู้ดูแลระบบได้ทำการ<strong>กู้คืน</strong>ข้อมูลผู้ป่วยที่ท่านเคยส่งคำขอลบไว้
    </p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#1e40af;font-weight:700;">ผู้ป่วยที่ถูกกู้คืน</p>
      <p style="margin:0;font-size:16px;font-weight:700;color:#1d4ed8;">${patientName}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#1e40af;">ข้อมูลผู้ป่วยกลับไปอยู่ในรายการผู้ป่วย Active ตามเดิม</p>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#4b5563;">หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบโดยตรง</p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 11) User Account Deactivated — admin ปิดบัญชีชั่วคราว (30 วัน)
// ═════════════════════════════════════════════════════════
export function userDeactivatedEmail(firstName: string, adminEmail: string, deletionDate: string, reason?: string) {
  const subject = 'แจ้งการปิดบัญชีชั่วคราว — TB JOURNEY & CARE'
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ขอเรียนแจ้งให้ทราบว่า ผู้ดูแลระบบได้ทำการ<strong>ปิดบัญชีชั่วคราว</strong>ของท่าน ท่านจะไม่สามารถเข้าสู่ระบบได้ในขณะนี้
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#991b1b;font-weight:700;">เหตุผลในการปิดบัญชี</p>
      <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">${reason || '(ไม่ระบุเหตุผล)'}</p>
    </div>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#9a3412;font-weight:700;">⏳ กำหนดลบบัญชีอัตโนมัติ</p>
      <p style="margin:0;font-size:14px;color:#7c2d12;line-height:1.6;">
        หากไม่มีการกู้คืน บัญชีของท่านจะถูกลบออกจากระบบถาวรในวันที่ <strong>${deletionDate}</strong>
      </p>
    </div>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:13px;color:${BRAND_TEAL_DARK};font-weight:700;">📧 หากต้องการกู้คืนบัญชี</p>
      <p style="margin:0;font-size:13px;color:${BRAND_TEAL};line-height:1.6;">
        กรุณาติดต่อผู้ดูแลระบบโดยตรงที่<br/>
        <strong>${adminEmail}</strong>
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 12) User Account Restored — admin กู้คืนบัญชี
// ═════════════════════════════════════════════════════════
export function userRestoredEmail(firstName: string, baseUrl: string, reason?: string) {
  const subject = 'บัญชีของท่านได้รับการกู้คืนแล้ว — TB JOURNEY & CARE'
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ผู้ดูแลระบบได้ทำการ<strong>กู้คืนบัญชี</strong>ของท่านเรียบร้อยแล้ว ท่านสามารถเข้าใช้งานระบบได้ทันที
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">✅ บัญชีของท่านกลับมาใช้งานได้ตามปกติแล้ว</p>
    </div>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:${BRAND_TEAL_DARK};font-weight:700;">เหตุผลในการกู้คืน</p>
      <p style="margin:0;font-size:14px;color:${BRAND_TEAL};line-height:1.6;">${reason || '(ไม่ระบุเหตุผล)'}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0 20px;">
        <a href="${baseUrl}/login" style="display:inline-block;padding:14px 36px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
          เข้าสู่ระบบ
        </a>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 10) User Account Deleted — admin ลบบัญชีผู้ใช้ถาวร (กรณีปฏิเสธแล้วลบทิ้ง)
// ═════════════════════════════════════════════════════════
export function userAccountDeletedEmail(firstName: string) {
  const subject = 'แจ้งยกเลิกสิทธิ์การเข้าใช้งานระบบ TB JOURNEY & CARE'
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ขอเรียนแจ้งให้ทราบว่า ผู้ดูแลระบบได้ทำการ<strong>ยกเลิกบัญชีผู้ใช้</strong>ของท่านออกจากระบบแล้ว
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#991b1b;font-weight:700;">สถานะบัญชี</p>
      <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">
        บัญชีของท่านถูกลบออกจากระบบถาวร — ท่านจะไม่สามารถเข้าสู่ระบบได้อีก
      </p>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#4b5563;line-height:1.7;">
      หากท่านเชื่อว่าเกิดความผิดพลาด หรือต้องการสอบถามเพิ่มเติม กรุณาติดต่อผู้ดูแลระบบโดยตรง
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 9) User Delete Hard Deleted — admin ลบถาวร
// ═════════════════════════════════════════════════════════
export function adminDeleteRequestCancelledEmail(
  patientName: string, patientHn: string, requesterName: string
) {
  const subject = `[ยกเลิกแล้ว] คำขอลบผู้ป่วย: ${patientName} (HN: ${patientHn})`
  const body = `
    <h2 style="margin:0 0 16px;color:#92400e;font-size:18px;">คำขอลบถูกยกเลิกโดยผู้ใช้แล้ว</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.7;">
      ผู้ใช้ได้ยกเลิกคำขอลบข้อมูลผู้ป่วยด้วยตัวเองแล้ว ไม่จำเป็นต้องดำเนินการใดๆ
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;width:130px;">ชื่อผู้ป่วย</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1f2937;">${patientName}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">HN</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1f2937;font-family:monospace;">${patientHn || '—'}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">ยกเลิกโดย</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${requesterName}</td></tr>
    </table>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:14px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#134e4a;">
        ผู้ป่วยยังคงอยู่ในระบบตามปกติ ไม่มีการเปลี่ยนแปลงข้อมูลใดๆ
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 13) Admin — user ขอแก้ไขข้อมูลโปรไฟล์
// ═════════════════════════════════════════════════════════
export function adminEditRequestEmail(
  userName: string, fieldLabel: string,
  oldValue: string, newValue: string,
  reason: string, baseUrl: string
) {
  const subject = `📝 คำขอแก้ไขข้อมูล: ${userName} — ${fieldLabel}`
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">คำขอแก้ไขข้อมูลโปรไฟล์</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;">ผู้ใช้ส่งคำขอแก้ไขข้อมูลในโปรไฟล์ของตนเอง กรุณาตรวจสอบและดำเนินการ</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;width:130px;">ผู้ขอแก้ไข</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${userName}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">ข้อมูลที่ขอแก้</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:${BRAND_TEAL};">${fieldLabel}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">ค่าเดิม</td>
          <td style="padding:6px 0;font-size:14px;color:#6b7280;">${oldValue || '—'}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">ค่าใหม่ที่ต้องการ</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1f2937;">${newValue}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">เหตุผล</td>
          <td style="padding:6px 0;font-size:14px;color:#4b5563;">${reason || '(ไม่ระบุ)'}</td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0;">
        <a href="${baseUrl}" style="display:inline-block;padding:14px 32px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
          🛡️ ไปที่หน้าจัดการผู้ใช้
        </a>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center;">กรุณาเข้าไปแก้ไขข้อมูลให้ผู้ใช้ในหน้าจัดการผู้ใช้</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 14) User — admin แก้ไขข้อมูลโปรไฟล์ให้แล้ว
// ═════════════════════════════════════════════════════════
export function userProfileEditedEmail(
  firstName: string,
  changes: { label: string; before: string | null; after: string | null }[]
) {
  const subject = 'ข้อมูลโปรไฟล์ของท่านได้รับการอัปเดต'
  const rows = changes.map(c => `
    <tr>
      <td style="padding:6px 0;font-size:12px;color:#6b7280;width:140px;">${c.label}</td>
      <td style="padding:6px 0;font-size:13px;color:#6b7280;text-decoration:line-through;">${c.before || '—'}</td>
      <td style="padding:6px 4px;font-size:13px;color:#374151;">→</td>
      <td style="padding:6px 0;font-size:13px;font-weight:700;color:#0f766e;">${c.after || '—'}</td>
    </tr>
  `).join('')
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ผู้ดูแลระบบได้ทำการอัปเดตข้อมูลโปรไฟล์ของท่านเรียบร้อยแล้ว
    </p>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 10px;font-size:12px;color:#134e4a;font-weight:700;">รายการที่เปลี่ยนแปลง</p>
      <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#4b5563;">หากท่านไม่ได้ขอให้แก้ไข หรือมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบโดยตรง</p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

export function deleteRequestHardDeletedEmail(firstName: string, patientName: string) {
  const subject = `✅ ข้อมูลผู้ป่วยถูกลบถาวรแล้ว: ${patientName}`
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ขอเรียนแจ้งให้ทราบว่า ผู้ดูแลระบบได้ทำการ<strong>ลบถาวร</strong>ข้อมูลผู้ป่วยออกจากระบบแล้ว
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:12px;color:#991b1b;font-weight:700;">ผู้ป่วยที่ถูกลบถาวร</p>
      <p style="margin:0;font-size:16px;font-weight:700;color:#dc2626;">${patientName}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#991b1b;">ข้อมูลถูกลบออกจากระบบถาวร — ไม่สามารถกู้คืนได้</p>
    </div>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 15) User — ระบบรับคำขอแก้ไขข้อมูลแล้ว (ยืนยันกลับให้ผู้ขอ)
// ═════════════════════════════════════════════════════════
export function userEditRequestReceivedEmail(
  firstName: string, fieldLabel: string,
  oldValue: string, newValue: string, reason: string
) {
  const subject = `ได้รับคำขอแก้ไขข้อมูลของท่านแล้ว — ${fieldLabel}`
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ระบบได้รับคำขอแก้ไขข้อมูลโปรไฟล์ของท่านเรียบร้อยแล้ว และส่งให้ผู้ดูแลระบบพิจารณา
      ท่านจะได้รับอีเมลแจ้งอีกครั้งเมื่อผู้ดูแลระบบดำเนินการเสร็จสิ้น
    </p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 10px;font-size:12px;color:#92400e;font-weight:700;">รายละเอียดคำขอ</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:5px 0;font-size:12px;color:#6b7280;width:120px;">ข้อมูลที่ขอแก้</td>
            <td style="padding:5px 0;font-size:14px;font-weight:700;color:${BRAND_TEAL};">${fieldLabel}</td></tr>
        <tr><td style="padding:5px 0;font-size:12px;color:#6b7280;">ค่าเดิม</td>
            <td style="padding:5px 0;font-size:14px;color:#6b7280;">${oldValue || '—'}</td></tr>
        <tr><td style="padding:5px 0;font-size:12px;color:#6b7280;">ค่าใหม่ที่ขอ</td>
            <td style="padding:5px 0;font-size:14px;font-weight:700;color:#1f2937;">${newValue}</td></tr>
        <tr><td style="padding:5px 0;font-size:12px;color:#6b7280;">เหตุผล</td>
            <td style="padding:5px 0;font-size:14px;color:#4b5563;">${reason || '(ไม่ระบุ)'}</td></tr>
      </table>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">สถานะปัจจุบัน: <strong style="color:#d97706;">รอผู้ดูแลระบบพิจารณา</strong></p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 16) User — คำขอแก้ไขข้อมูลได้รับการอนุมัติแล้ว
// ═════════════════════════════════════════════════════════
export function userEditRequestApprovedEmail(
  firstName: string, fieldLabel: string,
  oldValue: string, newValue: string
) {
  const subject = `คำขอแก้ไขข้อมูลของท่านได้รับการอนุมัติ — ${fieldLabel}`
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ผู้ดูแลระบบได้<strong style="color:#0f766e;">อนุมัติ</strong>คำขอแก้ไขข้อมูลของท่าน และอัปเดตข้อมูลในระบบเรียบร้อยแล้ว
    </p>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 10px;font-size:12px;color:#134e4a;font-weight:700;">รายการที่เปลี่ยนแปลง</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#6b7280;width:140px;">${fieldLabel}</td>
          <td style="padding:6px 0;font-size:13px;color:#6b7280;text-decoration:line-through;">${oldValue || '—'}</td>
          <td style="padding:6px 4px;font-size:13px;color:#374151;">→</td>
          <td style="padding:6px 0;font-size:13px;font-weight:700;color:#0f766e;">${newValue}</td>
        </tr>
      </table>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#4b5563;">หากท่านมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบโดยตรง</p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// 17) User — คำขอแก้ไขข้อมูลไม่ได้รับการอนุมัติ
// ═════════════════════════════════════════════════════════
export function userEditRequestRejectedEmail(
  firstName: string, fieldLabel: string,
  newValue: string, note: string
) {
  const subject = `คำขอแก้ไขข้อมูลของท่านไม่ได้รับการอนุมัติ — ${fieldLabel}`
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ขอเรียนแจ้งว่า ผู้ดูแลระบบ<strong style="color:#dc2626;">ไม่อนุมัติ</strong>คำขอแก้ไขข้อมูลของท่าน
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:5px 0;font-size:12px;color:#991b1b;width:120px;">ข้อมูลที่ขอแก้</td>
            <td style="padding:5px 0;font-size:14px;font-weight:700;color:#1f2937;">${fieldLabel}</td></tr>
        <tr><td style="padding:5px 0;font-size:12px;color:#991b1b;">ค่าที่ขอ</td>
            <td style="padding:5px 0;font-size:14px;color:#4b5563;">${newValue}</td></tr>
        ${note ? `<tr><td style="padding:5px 0;font-size:12px;color:#991b1b;">เหตุผล</td>
            <td style="padding:5px 0;font-size:14px;color:#4b5563;">${note}</td></tr>` : ''}
      </table>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#4b5563;">หากมีข้อสงสัย หรือต้องการส่งคำขอใหม่ กรุณาติดต่อผู้ดูแลระบบโดยตรง</p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// ลิงก์รีเซ็ตรหัสผ่าน (ลืมรหัสผ่าน)
// ═════════════════════════════════════════════════════════
export function passwordResetEmail(firstName: string, resetLink: string) {
  const subject = '🔓 รีเซ็ตรหัสผ่าน TB JOURNEY & CARE'
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ระบบได้รับคำขอรีเซ็ตรหัสผ่านบัญชีของท่าน กรุณากดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0 20px;">
        <a href="${resetLink}" style="display:inline-block;padding:14px 36px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
          รีเซ็ตรหัสผ่าน
        </a>
      </td></tr>
    </table>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin:20px 0;">
      <p style="margin:0 0 4px;font-size:13px;color:#92400e;font-weight:700;">⏰ ลิงก์นี้หมดอายุใน 1 ชั่วโมง</p>
      <p style="margin:0;font-size:12px;color:#78350f;line-height:1.6;">
        ลิงก์ใช้ได้เพียงครั้งเดียว หากต้องการขอใหม่ กรุณากดลืมรหัสผ่านที่หน้าเข้าสู่ระบบอีกครั้ง
      </p>
    </div>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;margin:20px 0;">
      <p style="margin:0 0 4px;font-size:13px;color:#991b1b;font-weight:700;">⚠️ หากท่านไม่ได้เป็นผู้ขอรีเซ็ตรหัสผ่าน</p>
      <p style="margin:0;font-size:12px;color:#7f1d1d;line-height:1.6;">
        กรุณาละเลยอีเมลฉบับนี้ บัญชีของท่านยังปลอดภัย รหัสผ่านเดิมยังใช้งานได้ตามปกติ
      </p>
    </div>

    <p style="margin:16px 0 8px;font-size:12px;color:#6b7280;line-height:1.6;">
      หากปุ่มด้านบนกดไม่ได้ ให้คัดลอกลิงก์นี้ไปวางในแถบที่อยู่ของเว็บเบราว์เซอร์:
    </p>
    <p style="margin:0 0 16px;font-size:11px;color:#0f766e;word-break:break-all;background:#f0fdfa;padding:8px 10px;border-radius:6px;">
      ${resetLink}
    </p>

    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// แจ้งเตือนเมื่อรหัสผ่านถูกเปลี่ยน — security alert
// ═════════════════════════════════════════════════════════
export function passwordChangedEmail(firstName: string, when: string, baseUrl: string) {
  const subject = '🔐 รหัสผ่านบัญชีของท่านถูกเปลี่ยน'
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">เรียน คุณ${firstName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
      ระบบขอแจ้งให้ทราบว่า รหัสผ่านบัญชีของท่านได้รับการเปลี่ยนแปลงเรียบร้อยแล้ว
    </p>

    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:5px 0;font-size:12px;color:#0f766e;font-weight:700;width:40%;">เวลาที่เปลี่ยน</td>
            <td style="padding:5px 0;font-size:14px;color:#134e4a;">${when}</td></tr>
      </table>
    </div>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:13px;color:#991b1b;font-weight:700;">⚠️ หากท่านไม่ได้เป็นผู้เปลี่ยนรหัสผ่านนี้</p>
      <p style="margin:0;font-size:13px;color:#7f1d1d;line-height:1.6;">
        กรุณารีบเข้าสู่ระบบเพื่อเปลี่ยนรหัสผ่านอีกครั้งทันที และติดต่อผู้ดูแลระบบเพื่อตรวจสอบความปลอดภัยของบัญชี
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0 20px;">
        <a href="${baseUrl}/login" style="display:inline-block;padding:14px 36px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
          เข้าสู่ระบบ
        </a>
      </td></tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">หากท่านเป็นผู้เปลี่ยนรหัสผ่านเอง สามารถละเลยอีเมลฉบับนี้ได้</p>
    <p style="margin:0;font-size:13px;color:#6b7280;">TB JOURNEY &amp; CARE</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ═════════════════════════════════════════════════════════
// Changelog Comment Notify — มี comment ใหม่ในหน้าประวัติเวอร์ชั่น
// ═════════════════════════════════════════════════════════
const CHANGELOG_STATUS: Record<string, { emoji: string; label: string; bg: string; fg: string }> = {
  feedback:   { emoji: '💬', label: 'ความเห็น',   bg: '#dbeafe', fg: '#1e3a8a' },
  bug_report: { emoji: '🐛', label: 'แจ้งบั๊ก',   bg: '#fee2e2', fg: '#991b1b' },
  request:    { emoji: '✨', label: 'ขอฟีเจอร์', bg: '#f3e8ff', fg: '#6b21a8' },
  note:       { emoji: '📝', label: 'บันทึก',     bg: '#f1f5f9', fg: '#334155' },
}

// ── format ISO timestamp → "31 พ.ค. 2569 · 14:23" ─────────────────────
function thaiDateTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  if (isNaN(d.getTime())) return ''
  const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  const day = d.getDate()
  const month = MONTHS[d.getMonth()]
  const year = d.getFullYear() + 543
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year} · ${hh}:${mm}`
}

export function changelogCommentNotifyEmail(
  version: string,
  status: string,
  authorName: string,
  authorRole: string,
  authorEmail: string,  // เก็บไว้รับ argument เผื่ออนาคต (ตอนนี้ไม่ได้แสดง)
  commentText: string,
  baseUrl: string,
  createdAt?: string,   // ISO timestamp — ถ้าไม่ส่ง ใช้ตอนส่งเมล
) {
  const s = CHANGELOG_STATUS[status] || CHANGELOG_STATUS.feedback
  const subject = `${s.emoji} ความคิดเห็นใหม่ v${version} — ${s.label}`
  const safe = commentText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  // ถ้า baseUrl เป็น localhost (ส่งจาก dev) → ใช้ production แทน
  const link = /localhost|127\.0\.0\.1/.test(baseUrl) ? 'https://tbjourney.care' : baseUrl
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">มีความคิดเห็นใหม่ในระบบ</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;">มีผู้ใช้เขียนความคิดเห็นที่หน้า "ประวัติเวอร์ชั่น" บน TB JOURNEY &amp; CARE</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:20px;">
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;width:130px;">เวอร์ชั่น</td>
          <td style="padding:6px 0;font-size:14px;font-weight:700;color:${BRAND_TEAL_DARK};">v${version}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">ประเภท</td>
          <td style="padding:6px 0;">
            <span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${s.bg};color:${s.fg};font-size:12px;font-weight:700;">${s.emoji} ${s.label}</span>
          </td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">ผู้เขียน</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2937;">${authorName} <span style="font-size:11px;color:#9ca3af;font-weight:400;">(${authorRole})</span></td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#6b7280;">วันที่และเวลา</td>
          <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1f2937;">${thaiDateTime(createdAt)}</td></tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;">💬 ข้อความ:</p>
    <div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:12px;padding:16px 20px;margin-bottom:24px;box-shadow:0 2px 6px rgba(245,158,11,0.12);max-width:100%;overflow:hidden;">
      <p style="margin:0;font-size:15px;color:#1f2937;line-height:1.75;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;font-weight:500;max-width:100%;">${safe}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0;">
        <a href="${link}" style="display:inline-block;padding:14px 32px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">📜 เปิดในระบบ</a>
      </td></tr>
    </table>

    <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;text-align:center;">อีเมลฉบับนี้ส่งให้ admin อัตโนมัติเมื่อมีคนเขียน comment ใหม่</p>
  `
  return { subject, html: wrap(subject, body) }
}

// ════════════════════════════════════════════════════════════════════════
// v0.7.14.5 — Reply / Mention / Resolved notifications
// ════════════════════════════════════════════════════════════════════════

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
}

function baseLink(baseUrl: string): string {
  return /localhost|127\.0\.0\.1/.test(baseUrl) ? 'https://tbjourney.care' : baseUrl
}

// 1) มีคนตอบกลับ comment ของเรา
export function changelogReplyNotifyEmail(
  version: string,
  actorName: string,
  replyText: string,
  baseUrl: string,
) {
  const subject = `↩ ${actorName} ตอบกลับความคิดเห็นของคุณ v${version}`
  const safe = escapeHtml(replyText)
  const link = baseLink(baseUrl)
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">มีคนตอบกลับความคิดเห็นของคุณ</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;"><b>${actorName}</b> ตอบกลับความคิดเห็นของคุณใน v${version}</p>
    <div style="background:#f0fdfa;border:2px solid #5eead4;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#1f2937;line-height:1.75;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;">${safe}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0;">
        <a href="${link}" style="display:inline-block;padding:14px 32px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">📜 เปิดในระบบ</a>
      </td></tr>
    </table>
  `
  return { subject, html: wrap(subject, body) }
}

// 2) มีคนแท็กคุณ (@mention)
export function changelogMentionNotifyEmail(
  version: string,
  actorName: string,
  commentText: string,
  baseUrl: string,
) {
  const subject = `@ ${actorName} แท็กคุณใน v${version}`
  const safe = escapeHtml(commentText)
  const link = baseLink(baseUrl)
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">มีคนแท็กคุณในความคิดเห็น</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;"><b>${actorName}</b> เรียกชื่อคุณในความคิดเห็น v${version}</p>
    <div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#1f2937;line-height:1.75;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;">${safe}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0;">
        <a href="${link}" style="display:inline-block;padding:14px 32px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">📜 เปิดในระบบ</a>
      </td></tr>
    </table>
  `
  return { subject, html: wrap(subject, body) }
}

// 3) ประเด็นของเราถูกปิด — label เปลี่ยนตาม status
export function changelogResolvedNotifyEmail(
  version: string,
  status: string,
  resolverName: string,
  commentText: string,
  baseUrl: string,
) {
  const labelMap: Record<string, { subj: string; head: string; verb: string }> = {
    bug_report: { subj: 'บั๊กที่คุณแจ้งถูกแก้ไขแล้ว', head: '✓ บั๊กที่คุณแจ้งถูกแก้ไขแล้ว', verb: 'แก้ไข' },
    request:    { subj: 'ฟีเจอร์ที่คุณขอถูกเพิ่มแล้ว', head: '✓ ฟีเจอร์ที่คุณขอถูกเพิ่มแล้ว', verb: 'เพิ่ม' },
    feedback:   { subj: 'ความคิดเห็นของคุณได้รับการรับทราบ', head: '✓ ความคิดเห็นของคุณได้รับการรับทราบ', verb: 'รับทราบ' },
    note:       { subj: 'บันทึกของคุณได้รับการรับทราบ', head: '✓ บันทึกของคุณได้รับการรับทราบ', verb: 'รับทราบ' },
  }
  const L = labelMap[status] || labelMap.feedback
  const subject = `${L.subj} · v${version}`
  const safe = escapeHtml(commentText)
  const link = baseLink(baseUrl)
  const body = `
    <h2 style="margin:0 0 16px;color:${BRAND_TEAL_DARK};font-size:18px;">${L.head}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#4b5563;"><b>${resolverName}</b> ${L.verb}ประเด็นที่คุณแจ้งใน v${version}</p>
    <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">ข้อความเดิมของคุณ:</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.7;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;">${safe}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0;">
        <a href="${link}" style="display:inline-block;padding:14px 32px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">📜 เปิดในระบบ</a>
      </td></tr>
    </table>
  `
  return { subject, html: wrap(subject, body) }
}
