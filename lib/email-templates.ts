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
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">🩺 TB JOURNEY &amp; CARE</h1>
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
