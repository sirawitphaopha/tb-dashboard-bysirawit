// tb-db.js — Supabase browser client bootstrap (window._sb) + async data-layer functions
// โหลดหลัง setup (ต้องมี window.supabase แล้ว) — sensitive: มี publishable anon key + session bridge
// ========== SUPABASE ==========
const _SUPA_URL = 'https://cioswzdbonnbhbyynrhh.supabase.co';
const _SUPA_KEY = 'sb_publishable_SuzwNfnSbCFCdNmDsMhydA_Yd8Nl0Yc';
window._sb = window.supabase.createClient(_SUPA_URL, _SUPA_KEY);

// ดึง session จาก Next.js (ชั้นนอก) แล้วบอก _sb ว่า "user คนนี้ login อยู่"
// ต้องเรียกก่อน loadPatients() เพื่อให้ RLS รู้ว่าใครเป็นคน query
window._sbReady = (async () => {
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) { console.warn('No session found'); return; }
    const { session } = await res.json();
    if (session?.access_token && session?.refresh_token) {
      await window._sb.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  } catch (e) { console.error('Session bridge error:', e); }
})();

window.dbToPatient = r => ({
  id:r.id, hn:r.hn, prefix:r.prefix, firstName:r.first_name, lastName:r.last_name,
  name:r.name, age:r.age, gender:r.gender, weight:r.weight, regimen:r.regimen,
  regimenHistory:r.regimen_history||[], phase:r.phase, month:r.month, day:r.day,
  status:r.status, adherence:r.adherence, patientType:r.patient_type,
  diseaseLocation:r.disease_location, extraPulmonaryType:r.extra_pulmonary_type,
  subdistrict:r.subdistrict, comorbidities:r.comorbidities||[],
  concomitantDrugs:r.concomitant_drugs||[], hivStatus:r.hiv_status, hivNote:r.hiv_note,
  nextAppt:r.next_appt, daysUntil:r.days_until, startDate:r.start_date,
  labs:r.labs||[], sputum:r.sputum||[], adr:r.adr||{}, visits:r.visits||[],
  dot:r.dot||{}, customDoses:r.custom_doses||null,
  drugStrengths:r.drug_strengths||null, extraTbDrugs:r.extra_tb_drugs||[],
  outcome:r.outcome||null, archived:r.archived||false,
});

window.patientToDb = p => ({
  id:p.id, hn:p.hn, prefix:p.prefix, first_name:p.firstName, last_name:p.lastName,
  name:p.name, age:p.age, gender:p.gender, weight:p.weight, regimen:p.regimen,
  regimen_history:p.regimenHistory||[], phase:p.phase, month:p.month, day:p.day,
  status:p.status, adherence:p.adherence, patient_type:p.patientType,
  disease_location:p.diseaseLocation, extra_pulmonary_type:p.extraPulmonaryType,
  subdistrict:p.subdistrict, comorbidities:p.comorbidities||[],
  concomitant_drugs:p.concomitantDrugs||[], hiv_status:p.hivStatus, hiv_note:p.hivNote,
  next_appt:p.nextAppt, days_until:p.daysUntil, start_date:p.startDate,
  labs:p.labs||[], sputum:p.sputum||[], adr:p.adr||{}, visits:p.visits||[],
  dot:p.dot||{}, custom_doses:p.customDoses||null,
  drug_strengths:p.drugStrengths||null, extra_tb_drugs:p.extraTbDrugs||[],
  outcome:p.outcome||null, archived:p.archived||false,
  updated_at: new Date().toISOString(),
});

window.loadPatients = async () => {
  // กรองออกคนที่อยู่ในถังขยะ (deleted_at != null) — หน้าหลักไม่ต้องเห็น
  const { data, error } = await window._sb.from('tb_patients').select('*').is('deleted_at', null).order('created_at');
  if (error) { console.error('Supabase load error:', error); return []; }
  return (data||[]).map(window.dbToPatient);
};

// โหลดคนในถังขยะ (สำหรับหน้าถังขยะ)
window.loadTrashedPatients = async () => {
  const { data, error } = await window._sb.from('tb_patients').select('*').not('deleted_at','is',null).order('deleted_at',{ascending:false});
  if (error) { console.error('Supabase load trash error:', error); return []; }
  const patients = (data||[]).map(r => ({ ...window.dbToPatient(r), deletedAt: r.deleted_at, deletedBy: r.deleted_by, deleteReason: r.delete_reason, requestedBy: null }));
  // โหลด requestedBy จาก delete_requests สำหรับส่งเมลแจ้ง user เมื่อกู้คืน/ลบถาวร
  const ids = patients.map(p => p.id);
  if (ids.length > 0) {
    const { data: reqs } = await window._sb.from('tb_delete_requests').select('patient_id, requested_by').in('patient_id', ids).in('status', ['approved','pending']);
    const reqMap = {};
    (reqs||[]).forEach(r => { reqMap[r.patient_id] = r.requested_by; });
    patients.forEach(p => { p.requestedBy = reqMap[p.id] || null; });
  }
  return patients;
};

window.savePatient = async p => {
  const { error } = await window._sb.from('tb_patients').upsert(window.patientToDb(p));
  if (error) console.error('Supabase save error:', error);
};

window.removePatient = async id => {
  const { error } = await window._sb.from('tb_patients').delete().eq('id', id);
  if (error) console.error('Supabase delete error:', error);
};

// ── User name snapshot helper ─────────────────────────────────────────
// ดึง "ชื่อ + นามสกุล" จาก profiles เพื่อ snapshot เก็บลงตาราง
// (ใช้ตอน insert/update เพื่อให้ชื่อยังอยู่แม้ user ถูกลบในอนาคต)
window._fetchUserDisplayName = async (userId) => {
  if (!userId) return null;
  const { data } = await window._sb
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;
  const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
  return name || null;
};

// soft delete — ย้ายเข้าถังขยะ 60 วัน
window.softDeletePatient = async (id, deletedBy, reason) => {
  const deleterName = await window._fetchUserDisplayName(deletedBy);
  const { error } = await window._sb.from('tb_patients').update({
    deleted_at: new Date().toISOString(),
    deleted_by: deletedBy,
    deleter_name_at_delete: deleterName,
    delete_reason: reason,
  }).eq('id', id);
  if (error) { console.error('Soft delete error:', error); return false; }
  return true;
};

// restore — เอากลับมาจากถังขยะ
window.restorePatient = async id => {
  const { error } = await window._sb.from('tb_patients').update({
    deleted_at: null, deleted_by: null, deleter_name_at_delete: null, delete_reason: null,
  }).eq('id', id);
  if (error) { console.error('Restore error:', error); return false; }
  await window._sb.from('tb_delete_requests')
    .update({ status: 'restored' })
    .eq('patient_id', id)
    .eq('status', 'pending');
  return true;
};

// hard delete — ลบถาวรจาก DB (trigger จะ log อัตโนมัติ)
window.hardDeletePatient = async id => {
  // ดึง requestedBy ก่อนลบ (เพื่อส่งเมลแจ้ง user)
  const { data: req } = await window._sb.from('tb_delete_requests').select('requested_by').eq('patient_id', id).maybeSingle();
  // ลบรูปผู้ป่วยออกจาก R2 + DB ก่อน (กันไฟล์กำพร้าค้างใน R2) — ลบฝั่ง client ตรงไม่ได้ ต้องผ่าน API server
  // ถ้า purge ล้มเหลว ก็ปล่อยให้ลบผู้ป่วยต่อ (ไม่บล็อกการลบ · ไฟล์ที่ค้างกู้ทีหลังได้)
  try {
    await fetch('/api/patient/images/purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: id }),
    });
  } catch (e) { console.warn('Purge patient images failed:', e); }
  // ลบ delete_requests ก่อน (FK constraint)
  await window._sb.from('tb_delete_requests').delete().eq('patient_id', id);
  // ลบผู้ป่วย
  const { error } = await window._sb.from('tb_patients').delete().eq('id', id);
  if (error) { console.error('Hard delete error:', error); return { ok: false, requestedBy: null }; }
  return { ok: true, requestedBy: req?.requested_by || null };
};

// ── Delete Request (คำขอลบจาก user ทั่วไป) ──────────────────────────────────

window.submitDeleteRequest = async (patientId, requestedBy, reason) => {
  const requesterName = await window._fetchUserDisplayName(requestedBy);
  const { error } = await window._sb.from('tb_delete_requests').insert({
    patient_id: patientId,
    requested_by: requestedBy,
    requester_name_at_request: requesterName,
    reason: reason,
    status: 'pending',
  });
  if (error) { console.error('Submit delete request error:', error); return false; }
  return true;
};

window.loadPendingDeleteRequests = async () => {
  const { data, error } = await window._sb.from('tb_delete_requests')
    .select('*, patient:tb_patients(hn, name), requester:profiles!requested_by(first_name, last_name, profession)')
    .eq('status','pending').order('requested_at',{ascending:false});
  if (error) { console.error('Load delete requests error:', error); return []; }
  return data || [];
};

// คำขอแก้ไขข้อมูลโปรไฟล์ที่รออนุมัติ (admin) — พร้อมชื่อผู้ขอ
// join เอง ไม่พึ่ง foreign-key embed เพื่อกัน error ถ้าชื่อ FK ไม่ตรง
window.loadPendingEditRequests = async () => {
  const { data, error } = await window._sb.from('tb_profile_edit_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) { console.error('Load edit requests error:', error); return []; }
  const reqs = data || [];
  if (reqs.length === 0) return [];

  const userIds = Array.from(new Set(reqs.map(r => r.user_id).filter(Boolean)));
  const { data: profs } = await window._sb.from('profiles')
    .select('id, first_name, last_name, profession')
    .in('id', userIds);
  const byId = {};
  (profs || []).forEach(p => { byId[p.id] = p; });
  return reqs.map(r => ({ ...r, requester: byId[r.user_id] || null }));
};

window.loadMyPendingDeleteRequests = async (userId) => {
  const { data } = await window._sb.from('tb_delete_requests')
    .select('id, patient_id, status, requested_by')
    .eq('requested_by', userId)
    .eq('status', 'pending');
  return data || [];
};

window.loadCancelledDeleteCount = async () => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await window._sb.from('tb_delete_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .is('acknowledged_at', null)
    .gte('requested_at', since);
  return count || 0;
};

window.acknowledgeCancelledRequests = async () => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await window._sb.from('tb_delete_requests')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('status', 'cancelled')
    .is('acknowledged_at', null)
    .gte('requested_at', since);
  return !error;
};

window.cancelDeleteRequest = async (patientId, userId) => {
  const { error } = await window._sb.from('tb_delete_requests')
    .update({ status: 'cancelled' })
    .eq('patient_id', patientId)
    .eq('requested_by', userId)
    .eq('status', 'pending');
  if (error) { console.error('Cancel delete request error:', error); return false; }
  return true;
};

window.approveDeleteRequest = async (requestId, patientId, reviewedBy, reason) => {
  const ok = await window.softDeletePatient(patientId, reviewedBy, reason);
  if (!ok) return false;
  const reviewerName = await window._fetchUserDisplayName(reviewedBy);
  await window._sb.from('tb_delete_requests').update({
    status: 'approved',
    reviewed_by: reviewedBy,
    reviewer_name_at_review: reviewerName,
    reviewed_at: new Date().toISOString(),
  }).eq('id', requestId);
  return true;
};

window.rejectDeleteRequest = async (requestId, reviewedBy, note) => {
  const reviewerName = await window._fetchUserDisplayName(reviewedBy);
  const { error } = await window._sb.from('tb_delete_requests').update({
    status: 'rejected',
    reviewed_by: reviewedBy,
    reviewer_name_at_review: reviewerName,
    reviewed_at: new Date().toISOString(),
    review_note: note || null,
  }).eq('id', requestId);
  return !error;
};

// v0.7.14.5 — ดึง notifications ทั้ง read + unread (จำกัด 50 ล่าสุด)
// ที่อ่านแล้วจะแสดงในกระดิ่งแบบจาง + ไม่นับใน badge unread
window.loadUserNotifications = async () => {
  // ผ่าน API (admin client) เพื่อแนบ avatar ของคนที่มาตอบ/mention (RLS กัน user อ่าน avatar คนอื่น)
  try {
    const r = await fetch('/api/notifications');
    if (r.ok) { const d = await r.json(); return d.notifications || []; }
  } catch {}
  // fallback: ดึงตรง (ไม่มี avatar) เผื่อ API ล่ม
  const { data } = await window._sb
    .from('tb_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
};

window.markUserNotificationRead = async (id) => {
  await window._sb
    .from('tb_notifications')
    .update({ is_read: true })
    .eq('id', id);
};

window.loadUserRejectLog = async () => {
  const { data: logs, error } = await window._sb
    .from('tb_user_reject_log')
    .select('id, user_id, rejected_by, rejected_reason, rejected_at, username_at_reject, first_name_at_reject, last_name_at_reject, email_at_reject')
    .order('rejected_at', { ascending: false });
  if (error || !logs) return [];

  const ids = Array.from(new Set(logs.flatMap(l => [l.user_id, l.rejected_by]).filter(Boolean)));
  if (!ids.length) return logs;

  // ดึง profile ปัจจุบัน — ใช้สำหรับคนปฏิเสธ (admin) และ fallback ถ้า snapshot ว่าง
  const { data: profs } = await window._sb
    .from('profiles')
    .select('id, first_name, last_name, username, email, role')
    .in('id', ids);
  const byId = Object.fromEntries((profs || []).map(p => [p.id, p]));

  return logs.map(l => ({
    ...l,
    // ใช้ snapshot ก่อน ถ้าไม่มีค่อย fallback ไป profile ปัจจุบัน (สำหรับ record เก่า)
    user: {
      first_name: l.first_name_at_reject || byId[l.user_id]?.first_name || '',
      last_name:  l.last_name_at_reject  || byId[l.user_id]?.last_name  || '',
      username:   l.username_at_reject   || byId[l.user_id]?.username   || '',
      email:      l.email_at_reject      || byId[l.user_id]?.email      || '',
      isSnapshot: !!l.username_at_reject,
    },
    rejecter: byId[l.rejected_by] || null,
  }));
};

// โหลดประวัติการเปิด-ปิดบัญชี (tb_user_action_log) — admin เท่านั้น (RLS กั้นไว้)
window.loadUserActionLog = async () => {
  const { data: logs, error } = await window._sb
    .from('tb_user_action_log')
    .select('id, user_id, action, reason, performed_by, performed_at, first_name_at_action, last_name_at_action, email_at_action, profile_snapshot, performer_name_at_action')
    .order('performed_at', { ascending: false });
  if (error || !logs) return [];

  // ดึงชื่อปัจจุบันจาก profiles (FK ชี้ auth.users จึงต้องดึงแยก)
  const ids = Array.from(new Set(logs.flatMap(l => [l.user_id, l.performed_by]).filter(Boolean)));
  const { data: profs } = ids.length
    ? await window._sb.from('profiles').select('id, first_name, last_name, username, email, role, profession, license_number, hospital_name, hospital_type, department, department_other').in('id', ids)
    : { data: [] };
  const byId = Object.fromEntries((profs || []).map(p => [p.id, p]));

  return logs.map(l => {
    const snap = l.profile_snapshot || {};       // สำเนาโปรไฟล์ทั้งใบ ณ ตอนนั้น
    const cur = byId[l.user_id] || {};           // profile ปัจจุบัน (ถ้ายังอยู่)
    return {
      ...l,
      // ลำดับ: สำเนาทั้งใบ → field แยกเก่า → profile ปัจจุบัน — กันข้อมูลหายตอนลบ user
      user: {
        first_name:       snap.first_name       || l.first_name_at_action || cur.first_name || '',
        last_name:        snap.last_name        || l.last_name_at_action  || cur.last_name  || '',
        email:            snap.email            || l.email_at_action      || cur.email      || '',
        username:         snap.username         || cur.username         || '',
        profession:       snap.profession       || cur.profession       || '',
        license_number:   snap.license_number   || cur.license_number   || '',
        hospital_name:    snap.hospital_name    || cur.hospital_name    || '',
        hospital_type:    snap.hospital_type    || cur.hospital_type    || '',
        department:       snap.department       || cur.department       || '',
        department_other: snap.department_other || cur.department_other || '',
        isDeleted:        !l.user_id,           // user_id ถูก set null = บัญชีถูกลบถาวรแล้ว
      },
      performer: byId[l.performed_by]
        ? { first_name: byId[l.performed_by].first_name, last_name: byId[l.performed_by].last_name }
        : (l.performer_name_at_action ? { first_name: l.performer_name_at_action, last_name: '' } : null),
    };
  });
};
