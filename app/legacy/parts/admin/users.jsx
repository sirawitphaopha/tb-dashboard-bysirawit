'use client'
/**
 * parts/admin/users.jsx — จัดการผู้ใช้ (admin) : รออนุมัติ, ผู้ใช้ทั้งหมด, แก้ไข, ประวัติ
 * ย้ายจาก parts/admin.jsx (แยกรอบ 2) — โค้ดเดิม ไม่แก้ logic
 *   EditRow, ActionHistoryTable, ActionPairTable, RejectHistoryTable, AdminUsersTab
 *   + consts HOSPITAL_TYPES_LIST, DEPARTMENTS_LIST, STATUS_STYLE
 */
import * as React from 'react'
const { useState, useEffect, useRef, useMemo } = React
import { ToastModal, Field, AvatarCircle } from '../shared'
import { PROFESSION_LABELS_TH } from '../globals'

function EditRow({ label, original, changed, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start py-2.5 border-b border-gray-50 last:border-0">
      {/* ฝั่งซ้าย: ค่าเดิม */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1">{label} <span className="font-normal">(เดิม)</span></label>
        <div className="px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-500 border border-gray-100 break-words min-h-[38px] flex items-center">
          {original || '—'}
        </div>
      </div>
      {/* ฝั่งขวา: ช่องแก้ */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          {label}
          {changed && (
            <span className="ml-1.5 text-[10px] font-bold text-amber-600">
              <i className="fa-solid fa-pen mr-0.5"></i>แก้แล้ว
            </span>
          )}
        </label>
        <div className={changed ? 'rounded-lg p-1 -m-1 bg-amber-50 ring-1 ring-amber-300' : ''}>
          {children}
        </div>
      </div>
    </div>
  );
}
const HOSPITAL_TYPES_LIST = [
  'โรงพยาบาลศูนย์ (ระดับ A)', 'โรงพยาบาลทั่วไป (ระดับ S)',
  'โรงพยาบาลทั่วไป (ระดับ M1)', 'โรงพยาบาลชุมชน (ระดับ M2)',
  'โรงพยาบาลชุมชน (ระดับ F1)', 'โรงพยาบาลชุมชน (ระดับ F2)',
  'โรงพยาบาลชุมชน (ระดับ F3)', 'โรงพยาบาลเอกชน',
  'สำนักงานสาธารณสุข (สสจ./สสอ.)', 'โรงพยาบาลส่งเสริมสุขภาพตำบล (รพ.สต.)',
];
const DEPARTMENTS_LIST = ['กลุ่มงานเภสัชกรรม', 'กลุ่มงานการพยาบาล', 'กลุ่มงานแพทย์', 'อื่นๆ'];
const STATUS_STYLE = {
  pending:  { bg:'#fef3c7', fg:'#92400e', label:'⏳ รออนุมัติ' },
  approved: { bg:'#d1fae5', fg:'#065f46', label:'✅ อนุมัติแล้ว' },
  rejected: { bg:'#fee2e2', fg:'#991b1b', label:'❌ ปฏิเสธ' },
};

// ToastModal ย้ายไป parts/shared.jsx (เฟส 1c)

// ประวัติการเปิด-ปิดบัญชี — รายการเรียงเวลา (ใหม่สุดอยู่บน)
function ActionHistoryTable({ logs, loading }) {
  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { year:'numeric', month:'2-digit', day:'2-digit' }) + ' ' +
           d.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
  };
  const nameOf = (p) => p ? `${p.first_name||''} ${p.last_name||''}`.trim() || p.username || p.email || '—' : '(บัญชีถูกลบแล้ว)';

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        <i className="fa-solid fa-spinner fa-spin text-3xl mb-2 block text-teal-500"></i>
        <p className="text-sm">กำลังโหลดประวัติ...</p>
      </div>
    );
  }
  if (!logs.length) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
        <i className="fa-solid fa-user-clock text-5xl text-gray-300 mb-3 block"></i>
        <p className="text-sm text-gray-400">ยังไม่มีประวัติการเปิด-ปิดบัญชี</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
      {logs.map(l => {
        const cfg = l.action === 'deactivate'
          ? { icon:'fa-user-slash', color:'#c2410c', bg:'#fff7ed', border:'#fed7aa', label:'ปิดบัญชี' }
          : l.action === 'restore'
          ? { icon:'fa-rotate-left', color:'#0f766e', bg:'#f0fdfa', border:'#99f6e4', label:'กู้คืนบัญชี' }
          : l.action === 'approve'
          ? { icon:'fa-check-circle', color:'#0d9488', bg:'#ccfbf1', border:'#99f6e4', label:'อนุมัติ' }
          : { icon:'fa-fire', color:'#dc2626', bg:'#fee2e2', border:'#fecaca', label:'ลบบัญชีถาวร' };
        return (
          <div key={l.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50/60 transition-colors">
            <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background:cfg.bg, border:'1px solid '+cfg.border }}>
              <i className={'fa-solid '+cfg.icon+' text-sm'} style={{ color:cfg.color }}></i>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
                <span className="font-bold text-gray-800 text-sm truncate">{nameOf(l.user)}</span>
                {l.user?.username && <span className="text-xs text-indigo-500 font-mono flex-shrink-0">@{l.user.username}</span>}
                {l.user?.isDeleted && l.action !== 'delete' && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full flex-shrink-0">ลบบัญชีแล้ว</span>}
                {l.user?.email && <span className="text-xs text-gray-400 truncate">{l.user.email}</span>}
              </div>
              {(l.user?.profession || l.user?.license_number || l.user?.hospital_name) && (
                <p className="text-xs text-gray-500 mt-1">
                  {l.user.profession && <span className="text-gray-600 font-medium">{PROFESSION_LABELS_TH[l.user.profession] || l.user.profession}</span>}
                  {l.user.license_number && <span> · เลขใบ {l.user.license_number}</span>}
                  {l.user.hospital_name && <span> · {l.user.hospital_name}</span>}
                  {(l.user.department === 'อื่นๆ' ? l.user.department_other : l.user.department) && <span> · {l.user.department === 'อื่นๆ' ? l.user.department_other : l.user.department}</span>}
                </p>
              )}
              <p className="text-sm text-gray-700 mt-1"><span className="text-gray-400">เหตุผล:</span> {l.reason || '—'}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                <i className="fa-solid fa-user-shield mr-1 text-gray-400"></i>โดย {l.performer ? nameOf(l.performer) + ' (แอดมิน)' : '—'}
                <span className="mx-1.5">·</span>
                <i className="fa-regular fa-clock mr-1 text-gray-400"></i>{fmt(l.performed_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ประวัติปิด-กู้คืน แบบ 2 คอลัมน์ จับคู่ ปิด↔กู้คืน ต่อรอบ (ซ้าย=ปิด, ขวา=กู้คืน)
function ActionPairTable({ logs, loading }) {
  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { year:'numeric', month:'2-digit', day:'2-digit' }) + ' ' +
           d.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
  };
  const nameOf = (p) => p ? `${p.first_name||''} ${p.last_name||''}`.trim() || p.username || p.email || '(ไม่ทราบชื่อ)' : '—';

  // จับคู่ ปิด→กู้คืน ต่อ user (เรียงเก่า→ใหม่ แล้วจับ deactivate กับ restore ที่ตามมา)
  const pairs = (() => {
    const byUser = {};
    for (const l of logs) {
      const key = l.user_id || (l.user && l.user.email) || l.id;
      (byUser[key] = byUser[key] || []).push(l);
    }
    const result = [];
    Object.values(byUser).forEach(evs => {
      const sorted = evs.slice().sort((a,b)=> new Date(a.performed_at) - new Date(b.performed_at));
      let pend = null;
      sorted.forEach(e => {
        if (e.action === 'deactivate') { if (pend) result.push({ deactivate: pend, restore: null }); pend = e; }
        else if (e.action === 'restore') { result.push({ deactivate: pend, restore: e }); pend = null; }
      });
      if (pend) result.push({ deactivate: pend, restore: null });
    });
    // เรียงรอบล่าสุดอยู่บน
    result.sort((a,b)=> new Date((b.restore||b.deactivate).performed_at) - new Date((a.restore||a.deactivate).performed_at));
    return result;
  })();

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        <i className="fa-solid fa-spinner fa-spin text-3xl mb-2 block text-indigo-500"></i>
        <p className="text-sm">กำลังโหลดประวัติ...</p>
      </div>
    );
  }
  if (!pairs.length) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
        <i className="fa-solid fa-user-clock text-5xl text-gray-300 mb-3 block"></i>
        <p className="text-sm text-gray-400">ยังไม่มีประวัติการปิด-กู้คืนบัญชี</p>
      </div>
    );
  }

  const cell = (e) => e ? (
    <div className="px-4 py-3">
      <p className="font-bold text-gray-800 text-sm truncate">
        {nameOf(e.user)}
        {e.user?.username && <span className="text-xs text-indigo-500 font-mono ml-1">@{e.user.username}</span>}
      </p>
      <p className="text-xs text-gray-600 mt-0.5"><span className="text-gray-400">เหตุผล:</span> {e.reason || '—'}</p>
      <p className="text-xs text-gray-400 mt-0.5">
        <i className="fa-solid fa-user-shield mr-1"></i>{e.performer ? nameOf(e.performer) + ' (แอดมิน)' : '—'}
        <span className="mx-1">·</span><i className="fa-regular fa-clock mr-1"></i>{fmt(e.performed_at)}
      </p>
    </div>
  ) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-2 gap-px bg-gray-100">
        <div className="bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700"><i className="fa-solid fa-user-slash mr-1"></i>ปิดบัญชี</div>
        <div className="bg-teal-50 px-4 py-2 text-xs font-bold text-teal-700"><i className="fa-solid fa-rotate-left mr-1"></i>กู้คืน</div>
      </div>
      <div className="divide-y divide-gray-100">
        {pairs.map((pr, i) => (
          <div key={i} className="grid grid-cols-2 gap-px bg-gray-100">
            <div className="bg-white">{cell(pr.deactivate) || <div className="px-4 py-3 text-xs text-gray-300 italic">—</div>}</div>
            <div className="bg-white">{pr.restore ? cell(pr.restore) : (
              pr.deactivate?.user?.isDeleted
                ? <div className="px-4 py-3 flex items-center"><span className="text-[11px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full"><i className="fa-solid fa-fire mr-1"></i>ลบบัญชีแล้ว</span></div>
                : <div className="px-4 py-3 flex items-center text-xs text-gray-300 italic">— ยังไม่กู้คืน</div>
            )}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RejectHistoryTable({ logs, loading, expandedId, onToggle }) {
  const fmt = (iso) => {
    if (!iso) return { date:'—', time:'—' };
    const d = new Date(iso);
    const date = d.toLocaleDateString('th-TH', { year:'numeric', month:'2-digit', day:'2-digit' });
    const time = d.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
    return { date, time };
  };
  const nameOf = (p) => p ? `${p.first_name||''} ${p.last_name||''}`.trim() || p.username || p.email || '—' : '—';
  const rejecterLabel = (p) => {
    if (!p) return '—';
    const name = nameOf(p);
    return p.role === 'admin' ? `${name} (admin)` : name;
  };

  // จัดกลุ่ม logs ตาม user_id — 1 อีเมล = 1 แถวหลัก
  const grouped = (() => {
    const map = new Map();
    for (const l of logs) {
      const key = l.user_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(l);
    }
    return Array.from(map.entries()).map(([userId, attempts]) => ({
      userId,
      // logs เรียงจากใหม่ → เก่าอยู่แล้ว
      attempts,
      latest: attempts[0],
      count: attempts.length,
      email: attempts[0]?.user?.email || '—',
    }));
  })();

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        <i className="fa-solid fa-spinner fa-spin text-3xl mb-2 block text-purple-500"></i>
        <p className="text-sm">กำลังโหลดประวัติ...</p>
      </div>
    );
  }
  if (!grouped.length) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
        <i className="fa-solid fa-clock-rotate-left text-5xl text-gray-300 mb-3 block"></i>
        <p className="text-sm text-gray-400">ยังไม่มีประวัติการปฏิเสธ</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-gray-100 text-xs font-bold text-purple-900">
        <div className="col-span-5">อีเมล</div>
        <div className="col-span-2 text-center">จำนวนครั้ง</div>
        <div className="col-span-3">ครั้งล่าสุด</div>
        <div className="col-span-2">คนปฏิเสธล่าสุด</div>
      </div>
      <div className="divide-y divide-gray-100">
        {grouped.map(g => {
          const { date, time } = fmt(g.latest?.rejected_at);
          const isOpen = expandedId === g.userId;
          return (
            <div key={g.userId}>
              <button type="button" onClick={()=>onToggle(g.userId)}
                className="w-full grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-purple-50/40 transition-colors text-sm text-left">
                <div className="col-span-5 flex items-center gap-2 min-w-0">
                  <i className={'fa-solid text-xs text-purple-500 '+(isOpen?'fa-chevron-down':'fa-chevron-right')}></i>
                  <i className="fa-solid fa-envelope text-purple-400 text-xs"></i>
                  <p className="font-bold text-purple-900 truncate">{g.email}</p>
                </div>
                <div className="col-span-2 text-center">
                  <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                    {g.count} {g.count > 1 ? 'ครั้ง' : 'ครั้ง'}
                  </span>
                </div>
                <div className="col-span-3 text-xs text-gray-600">
                  <p>{date}</p>
                  <p className="text-gray-400">{time}</p>
                </div>
                <div className="col-span-2 text-xs text-gray-700 truncate">{rejecterLabel(g.latest?.rejecter)}</div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 bg-purple-50/30">
                  <div className="bg-white rounded-xl border border-purple-100 p-4 space-y-3">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">
                      <i className="fa-solid fa-clock-rotate-left mr-1"></i>
                      ประวัติทั้งหมด {g.count} ครั้ง (ใหม่สุดอยู่บน)
                    </p>
                    <div className="space-y-3">
                      {g.attempts.map((a, idx) => {
                        const t = fmt(a.rejected_at);
                        const attemptNo = g.count - idx;  // ครั้งล่าสุด = เลขสูงสุด
                        return (
                          <div key={a.id} className="border-l-4 border-purple-300 pl-3 py-2 bg-purple-50/40 rounded-r-lg">
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-200 text-purple-900">
                                <i className="fa-solid fa-hashtag text-[10px]"></i>
                                ครั้งที่ {attemptNo}
                              </span>
                              <span className="text-xs text-gray-500">
                                <i className="fa-solid fa-clock mr-1"></i>
                                {t.date} {t.time}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-2">
                              <div>
                                <p className="text-[11px] text-gray-400">👤 ชื่อ-นามสกุล (ตอนนั้น)</p>
                                <p className="font-medium text-gray-800">{nameOf(a.user)}</p>
                              </div>
                              <div>
                                <p className="text-[11px] text-gray-400">🆔 Username (ตอนนั้น)</p>
                                <p className="font-medium text-gray-800">{a.user?.username ? '@'+a.user.username : '—'}</p>
                              </div>
                            </div>
                            <div className="mb-2">
                              <p className="text-[11px] text-gray-400 mb-0.5">📝 เหตุผล</p>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap bg-amber-50 border-l-4 border-amber-300 p-2 rounded">
                                {a.rejected_reason || '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-gray-400">👨‍💼 ปฏิเสธโดย</p>
                              <p className="text-sm font-medium text-gray-700">{rejecterLabel(a.rejecter)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminUsersTab({ currentUser, onPendingChange, highlightUserId, onClearHighlight }) {
  const [profiles, setProfiles] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');  // 'list' = แถวกะทัดรัด, 'card' = การ์ดละเอียด
  const [hardDelTarget, setHardDelTarget] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [hardDelReason, setHardDelReason] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateError, setDeactivateError] = useState('');
  const [restoreUserTarget, setRestoreUserTarget] = useState(null);
  const [restoreUserReason, setRestoreUserReason] = useState('');
  const [restoreUserError, setRestoreUserError] = useState('');
  const [approveUserTarget, setApproveUserTarget] = useState(null);
  const [rejectLogs, setRejectLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [actionLogs, setActionLogs] = useState([]);
  const [actionLogLoading, setActionLogLoading] = useState(false);
  const [historyTab, setHistoryTab] = useState('approve');  // sub-tab ในแท็บประวัติ: approve/reject/updown/delete
  const [historySearch, setHistorySearch] = useState('');   // ค้นหาในหน้าประวัติ
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [toast, setToast] = useState(null);  // {kind:'success'|'error'|'info', title?, message}
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');
  // ── ระบบคำขอแก้ไขข้อมูล ──
  const [editRequests, setEditRequests] = useState([]);   // คำขอที่ pending ทั้งหมด
  const [editReqBusy, setEditReqBusy] = useState(null);    // id ของคำขอที่กำลังดำเนินการ
  const [rejectReqTarget, setRejectReqTarget] = useState(null);  // คำขอที่กำลังจะปฏิเสธ
  const [rejectReqNote, setRejectReqNote] = useState('');
  const [flashUserId, setFlashUserId] = useState(null);    // user ที่ไฮไลต์ชั่วคราว
  const userRefs = React.useRef({});

  const load = async () => {
    setLoading(true);
    const { data } = await window._sb.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data || []);
    setLoading(false);
    // อัปเดต badge ใน sidebar
    if (onPendingChange) onPendingChange((data||[]).filter(p => p.status === 'pending').length);
  };
  const loadEditRequests = async () => {
    const data = await window.loadPendingEditRequests();
    setEditRequests(data || []);
  };
  useEffect(() => { load(); loadEditRequests(); }, []);

  // คำขอแก้ไข จัดกลุ่มตาม user_id เพื่อแสดงใต้ผู้ใช้แต่ละคน
  const editReqByUser = React.useMemo(() => {
    const m = {};
    editRequests.forEach(r => { (m[r.user_id] = m[r.user_id] || []).push(r); });
    return m;
  }, [editRequests]);

  // เมื่อกดจากกระดิ่ง → เลื่อนไปหา user + ไฮไลต์ชั่วคราว
  useEffect(() => {
    if (!highlightUserId || loading) return;
    setFilter('all');           // ให้แน่ใจว่าเห็น user ทุกสถานะ
    setSearch('');
    const t = setTimeout(() => {
      const el = userRefs.current[highlightUserId];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setFlashUserId(highlightUserId);
      setTimeout(() => setFlashUserId(null), 2600);
      if (onClearHighlight) onClearHighlight();
    }, 250);
    return () => clearTimeout(t);
  }, [highlightUserId, loading]);

  // อนุมัติ / ปฏิเสธ คำขอแก้ไขข้อมูล
  const handleEditRequest = async (requestId, action, note) => {
    setEditReqBusy(requestId);
    const res = await fetch('/api/admin/approve-edit-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action, note: note || '' }),
    });
    setEditReqBusy(null);
    if (res.ok) {
      setToast({
        kind: action === 'approve' ? 'success' : 'info',
        title: action === 'approve' ? 'อนุมัติคำขอแล้ว' : 'ปฏิเสธคำขอแล้ว',
        message: action === 'approve' ? 'อัปเดตข้อมูลผู้ใช้และส่งเมลแจ้งแล้ว' : 'ส่งเมลแจ้งผู้ใช้แล้ว',
      });
      setRejectReqTarget(null); setRejectReqNote('');
      await loadEditRequests();
      await load();
    } else {
      const e = await res.json();
      setToast({ kind: 'error', title: 'เกิดข้อผิดพลาด', message: e.error });
    }
  };

  const loadRejectLog = async (showSpinner = true) => {
    if (showSpinner) setLogLoading(true);
    const data = await window.loadUserRejectLog();
    setRejectLogs(data || []);
    if (showSpinner) setLogLoading(false);
  };
  const loadActionLog = async (showSpinner = true) => {
    if (showSpinner) setActionLogLoading(true);
    const data = await window.loadUserActionLog();
    setActionLogs(data || []);
    if (showSpinner) setActionLogLoading(false);
  };
  // โหลดทันทีตั้งแต่เปิดหน้า (เพื่อให้ badge แสดงเลขถูก) — ไม่แสดง spinner เพราะ user ยังไม่เห็นแท็บนั้น
  useEffect(() => { loadRejectLog(false); loadActionLog(false); }, []);
  // รีเฟรชอีกครั้งเมื่อ user สลับมาที่แท็บนี้
  useEffect(() => {
    // โหลดเงียบๆ (false) — ข้อมูลโหลดไว้ตั้งแต่เปิดหน้าแล้ว แสดงทันที ไม่ขึ้น spinner
    if (filter === 'history') { loadRejectLog(false); loadActionLog(false); }
  }, [filter]);

  // กดปุ่มอนุมัติ → เปิด popup ยืนยัน (ไม่ทำทันที)
  const handleApprove = (p) => setApproveUserTarget(p);

  // กดยืนยันใน popup → อนุมัติจริง
  const doApproveUser = async () => {
    if (!approveUserTarget) return;
    setBusy(true);
    const res = await fetch('/api/admin/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: approveUserTarget.id }),
    });
    setBusy(false);
    if (res.ok) { setToast({ kind:'success', title:'อนุมัติเรียบร้อย', message:'ส่งเมลแจ้งผู้ใช้แล้ว ✉️' }); setApproveUserTarget(null); load(); loadActionLog(false); }
    else { const e = await res.json(); setToast({ kind:'error', title:'เกิดข้อผิดพลาด', message: e.error }); }
  };

  const handleHardDeleteUser = async () => {
    if (!hardDelTarget) return;
    setBusy(true);
    const res = await fetch('/api/admin/hard-delete-user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: hardDelTarget.id, reason: hardDelReason.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      const name = `${hardDelTarget.first_name||''} ${hardDelTarget.last_name||''}`.trim();
      setToast({ kind:'success', title:'ลบบัญชีถาวรเรียบร้อย', message:`${name}\nอีเมลนี้สามารถใช้สมัครใหม่ได้แล้ว` });
      setHardDelTarget(null); setConfirmText(''); setHardDelReason('');
      load(); loadActionLog(false);
    } else {
      const e = await res.json();
      setToast({ kind:'error', title:'เกิดข้อผิดพลาด', message: e.error });
    }
  };

  const handleResetRejectionLimit = async (p) => {
    setBusy(true);
    const res = await fetch('/api/admin/reset-rejection-limit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: p.id }),
    });
    setBusy(false);
    if (!res.ok) { const e = await res.json(); setToast({ kind:'error', title:'เกิดข้อผิดพลาด', message: e.error }); }
    else load();
  };

  // กดปุ่มกู้คืน → เปิด popup ยืนยัน + กรอกเหตุผล (ไม่ทำทันที)
  const handleRestoreUser = (p) => {
    setRestoreUserTarget(p);
    setRestoreUserReason('');
    setRestoreUserError('');
  };

  // กดยืนยันใน popup → กู้คืนจริง
  const doRestoreUser = async () => {
    if (!restoreUserTarget) return;
    if (!restoreUserReason.trim()) { setRestoreUserError('กรุณาระบุเหตุผลในการกู้คืน'); return; }
    setBusy(true);
    const res = await fetch('/api/admin/restore-user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: restoreUserTarget.id, reason: restoreUserReason.trim() }),
    });
    setBusy(false);
    if (!res.ok) { const e = await res.json(); setRestoreUserError(e.error || 'กู้คืนไม่สำเร็จ'); }
    else { setRestoreUserTarget(null); setRestoreUserReason(''); setRestoreUserError(''); load(); loadActionLog(false); }
  };

  const doDeactivateUser = async () => {
    if (!deactivateTarget) return;
    if (!deactivateReason.trim()) { setDeactivateError('กรุณาระบุเหตุผลในการปิดบัญชี'); return; }
    setBusy(true);
    const res = await fetch('/api/admin/deactivate-user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: deactivateTarget.id, reason: deactivateReason.trim() }),
    });
    setBusy(false);
    if (res.ok) { setDeactivateTarget(null); setDeactivateReason(''); setDeactivateError(''); load(); loadActionLog(false); }
    else { const e = await res.json(); setDeactivateError(e.error || 'ปิดบัญชีไม่สำเร็จ'); }
  };

  const openEdit = (p) => {
    setEditingUser(p);
    setEditForm({
      title: p.title || '',
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      hospital_name: p.hospital_name || '',
      hospital_type: p.hospital_type || '',
      department: p.department || '',
      department_other: p.department_other || '',
      profession: p.profession || '',
      // เก็บเฉพาะตัวเลขในช่องกรอก — เซิร์ฟเวอร์จะเติมคำนำหน้าตามวิชาชีพให้เอง
      license_number: window.tbLicenseDigits(p.license_number),
      phone: window.tbFormatPhone(p.phone),
    });
    setEditError('');
  };
  const closeEdit = () => { setEditingUser(null); setEditError(''); };
  const submitEdit = async () => {
    if (!editingUser) return;
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      setEditError('กรุณากรอกชื่อและนามสกุล'); return;
    }
    // ตรวจเบอร์ก่อนส่ง (เฉพาะถ้ากรอก)
    if (editForm.phone && editForm.phone.trim()) {
      const chk = window.tbValidatePhone(editForm.phone);
      if (!chk.ok) { setEditError(chk.msg); return; }
    }
    setEditBusy(true); setEditError('');
    const res = await fetch('/api/admin/edit-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: editingUser.id, ...editForm }),
    });
    setEditBusy(false);
    if (res.ok) {
      setToast({ kind:'success', title:'บันทึกเรียบร้อย', message:'อัปเดตข้อมูลผู้ใช้แล้ว' });
      closeEdit(); load();
    } else {
      const e = await res.json();
      setEditError(e.error || 'เกิดข้อผิดพลาด');
    }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return setToast({ kind:'info', title:'ขาดข้อมูล', message:'กรุณาระบุเหตุผลในการปฏิเสธ' });
    setBusy(true);
    const res = await fetch('/api/admin/reject', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: rejectingId, reason: rejectReason }),
    });
    setBusy(false);
    if (res.ok) {
      setToast({ kind:'success', title:'ปฏิเสธเรียบร้อย', message:'ส่งเมลแจ้งผู้ใช้แล้ว ✉️' });
      setRejectingId(null); setRejectReason(''); load();
    }
    else { const e = await res.json(); setToast({ kind:'error', title:'เกิดข้อผิดพลาด', message: e.error }); }
  };

  // กล่องแสดงคำขอแก้ไขของผู้ใช้ — ใช้ทั้ง list view และ card view
  const renderEditReqBox = (p) => {
    const reqs = editReqByUser[p.id];
    if (!reqs || reqs.length === 0) return null;
    return (
      <div className="mt-3 space-y-2">
        {reqs.map(r => {
          const working = editReqBusy === r.id;
          return (
            <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <i className="fa-solid fa-pen-clip text-amber-600 text-sm"></i>
                <span className="text-xs font-bold text-amber-800">คำขอแก้ไขข้อมูล · {r.field_label}</span>
              </div>
              <div className="bg-white rounded-lg border border-amber-100 px-3 py-2 mb-2 text-xs">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-gray-400 w-16 flex-shrink-0">ค่าเดิม</span>
                  <span className="text-gray-500 line-through break-all">{r.old_value || '—'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 w-16 flex-shrink-0">ขอเปลี่ยนเป็น</span>
                  <span className="text-teal-700 font-bold break-all">{r.new_value}</span>
                </div>
                {r.reason && (
                  <div className="flex items-start gap-2 mt-1 pt-1 border-t border-gray-100">
                    <span className="text-gray-400 w-16 flex-shrink-0">เหตุผล</span>
                    <span className="text-gray-600 break-all">{r.reason}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={working}
                  onClick={()=>handleEditRequest(r.id, 'approve')}
                  className="flex-1 px-3 py-1.5 rounded-lg font-bold text-white text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-50">
                  {working ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังดำเนินการ...</> : <><i className="fa-solid fa-check mr-1"></i>อนุมัติ</>}
                </button>
                <button type="button" disabled={working}
                  onClick={()=>{ setRejectReqTarget(r); setRejectReqNote(''); }}
                  className="flex-1 px-3 py-1.5 rounded-lg font-bold text-white text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50">
                  <i className="fa-solid fa-xmark mr-1"></i>ปฏิเสธ
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-16">
        <i className="fa-solid fa-lock text-5xl text-red-400 mb-3"></i>
        <p className="text-sm text-gray-500">เฉพาะ Admin เท่านั้น</p>
      </div>
    );
  }

  const counts = {
    pending: profiles.filter(p => p.status === 'pending').length,
    approved: profiles.filter(p => p.status === 'approved').length,
    // ปฏิเสธ = ปฏิเสธคำขอสมัคร (ไม่มี deactivated_at) | ถูกปิดบัญชี = เคย approved แล้วถูกปิด (มี deactivated_at)
    rejected: profiles.filter(p => p.status === 'rejected' && !p.deactivated_at).length,
    deactivated: profiles.filter(p => p.status === 'rejected' && p.deactivated_at).length,
  };
  const searchLower = search.trim().toLowerCase();
  const filtered = (
    filter === 'all' ? profiles
    : filter === 'rejected' ? profiles.filter(p => p.status === 'rejected' && !p.deactivated_at)
    : filter === 'deactivated' ? profiles.filter(p => p.status === 'rejected' && p.deactivated_at)
    : profiles.filter(p => p.status === filter)
  )
    .filter(p => {
      if (!searchLower) return true;
      const hay = `${p.first_name||''} ${p.last_name||''} ${p.username||''} ${p.email||''} ${p.hospital_name||''} ${p.license_number||''}`.toLowerCase();
      return hay.includes(searchLower);
    });

  // v0.7.17.1 — Lazy render สำหรับ user list (50 ก่อน + ดูเพิ่ม)
  const [visibleUserCount, setVisibleUserCount] = useState(50);
  useEffect(() => { setVisibleUserCount(50); }, [filter, searchLower]);
  const visibleUsers = filtered.slice(0, visibleUserCount);

  // ค้นหาในหน้าประวัติ — กรอง log ตามชื่อ/username/email ของผู้ถูกกระทำ
  const hsLower = historySearch.trim().toLowerCase();
  const matchHist = (l) => {
    if (!hsLower) return true;
    const u = l.user || {};
    return `${u.first_name||''} ${u.last_name||''} ${u.username||''} ${u.email||''} ${u.hospital_name||''} ${u.license_number||''}`.toLowerCase().includes(hsLower);
  };

  return (
    <div className="space-y-4 tb-fade">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <i className="fa-solid fa-user-shield text-2xl"></i>
          </div>
          <div>
            <h2 className="font-bold text-lg">จัดการผู้ใช้</h2>
            <p className="text-xs text-teal-100">ระบบจัดการสมาชิกและบัญชีผู้ใช้ · เฉพาะ Admin</p>
          </div>
        </div>
      </div>

      {/* Filter cards — compact, hover-state, ข้อความตรงกลาง
           Roadmap: ในอนาคตเพิ่ม view mode (list/grid/timeline) ดูที่ pending master ข้อ 30 */}
      {(() => {
        const renderTab = (c) => {
          const active = filter === c.key;
          return (
            <button key={c.key} type="button" onClick={()=>setFilter(c.key)}
              className="rounded-xl px-3 py-2.5 transition-all border"
              style={{ background: active ? c.color : '#fff', borderColor: active ? c.color : '#e5e7eb', boxShadow: active ? '0 4px 12px '+c.color+'40' : 'none' }}
              onMouseEnter={e=>{ if(!active) e.currentTarget.style.background = c.hover; }}
              onMouseLeave={e=>{ if(!active) e.currentTarget.style.background = '#fff'; }}>
              <div className="flex items-center justify-center gap-2">
                <i className={'fa-solid '+c.icon} style={{ fontSize:'13px', color: active ? '#fff' : c.color }}></i>
                <span className="text-sm font-bold" style={{ color: active ? '#fff' : '#374151' }}>{c.label}</span>
                <span className="text-sm font-bold px-1.5 rounded-md" style={{ background: active ? 'rgba(255,255,255,0.25)' : c.bg, color: active ? '#fff' : c.color }}>{c.count}</span>
              </div>
            </button>
          );
        };
        return (<>
          {/* แถว 1: การพิจารณาสมัคร */}
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1.5 ml-1"><i className="fa-solid fa-clipboard-check mr-1"></i>การพิจารณาสมัคร</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key:'pending',  label:'รออนุมัติ',  count:counts.pending,  color:'#f59e0b', bg:'#fef3c7', hover:'#fde68a', icon:'fa-clock' },
                { key:'approved', label:'อนุมัติแล้ว', count:counts.approved, color:'#0d9488', bg:'#ccfbf1', hover:'#99f6e4', icon:'fa-check-circle' },
                { key:'rejected', label:'ปฏิเสธ',     count:counts.rejected, color:'#ef4444', bg:'#fee2e2', hover:'#fecaca', icon:'fa-circle-xmark' },
              ].map(renderTab)}
            </div>
          </div>
          {/* แถว 2: การจัดการผู้ใช้ */}
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1.5 ml-1"><i className="fa-solid fa-users-gear mr-1"></i>การจัดการผู้ใช้</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { key:'all',         label:'ผู้ใช้ทั้งหมด',  count:profiles.length,    color:'#0f766e', bg:'#f0fdfa', hover:'#ccfbf1', icon:'fa-layer-group' },
                { key:'deactivated', label:'ถูกปิดบัญชี',   count:counts.deactivated, color:'#ea580c', bg:'#fff7ed', hover:'#fed7aa', icon:'fa-user-slash' },
                { key:'history',     label:'ประวัติ',       count:rejectLogs.length + actionLogs.length, color:'#7c3aed', bg:'#ede9fe', hover:'#ddd6fe', icon:'fa-clock-rotate-left' },
              ].map(renderTab)}
            </div>
          </div>
        </>);
      })()}

      {/* Search + view mode toggle */}
      {filter !== 'history' && (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ / username / email / รพ. / เลขใบประกอบ"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 bg-white"/>
        </div>
        <div className="flex bg-white rounded-xl border border-gray-200 p-1">
          {[
            { key:'list', icon:'fa-list', title:'มุมมองรายการ (กะทัดรัด)' },
            { key:'card', icon:'fa-grip', title:'มุมมองการ์ด (ละเอียด)' },
          ].map(v => (
            <button key={v.key} type="button" onClick={()=>setViewMode(v.key)} title={v.title}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ background: viewMode===v.key ? '#0f766e' : 'transparent', color: viewMode===v.key ? '#fff' : '#6b7280' }}>
              <i className={'fa-solid '+v.icon}></i>
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">{filtered.length} คน</span>
      </div>
      )}

      {/* ประวัติเปิด-ปิดบัญชี — รายการเรียงเวลา */}
      {filter === 'history' ? (
        <div>
          {/* sub-tab: อนุมัติ / ปฏิเสธ / เปิด-ปิด / ลบ + ช่องค้นหา */}
          <div className="flex gap-2 mb-3 flex-wrap items-center">
            {[
              { key:'approve', label:'อนุมัติเข้าระบบ',  icon:'fa-check-circle', color:'#0d9488' },
              { key:'reject',  label:'ปฏิเสธคำขอสมัคร',  icon:'fa-circle-xmark', color:'#ef4444' },
              { key:'updown',  label:'ปิด-กู้คืนบัญชี',   icon:'fa-user-clock',   color:'#4f46e5' },
              { key:'delete',  label:'ลบบัญชีถาวร',      icon:'fa-user-xmark',   color:'#dc2626' },
            ].map(s => {
              const act = historyTab === s.key;
              return (
                <button key={s.key} type="button" onClick={()=>setHistoryTab(s.key)}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors"
                  style={{ background: act?s.color:'#fff', color: act?'#fff':s.color, borderColor: act?s.color:'#e5e7eb' }}>
                  <i className={'fa-solid '+s.icon+' mr-1'}></i>{s.label}
                </button>
              );
            })}
            <div className="relative flex-1 min-w-[200px]">
              <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input type="text" value={historySearch} onChange={e=>setHistorySearch(e.target.value)}
                placeholder="ค้นหาชื่อ / username / email / รพ. / เลขใบประกอบ"
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-purple-400 bg-white"/>
            </div>
          </div>
          {historyTab === 'reject' ? (
            <RejectHistoryTable logs={rejectLogs.filter(matchHist)} loading={logLoading} expandedId={expandedLogId} onToggle={(id) => setExpandedLogId(prev => prev === id ? null : id)} />
          ) : historyTab === 'approve' ? (
            <ActionHistoryTable logs={actionLogs.filter(l=>l.action==='approve' && matchHist(l))} loading={actionLogLoading} />
          ) : historyTab === 'updown' ? (
            <ActionPairTable logs={actionLogs.filter(l=>(l.action==='deactivate'||l.action==='restore') && matchHist(l))} loading={actionLogLoading} />
          ) : (
            <ActionHistoryTable logs={actionLogs.filter(l=>l.action==='delete' && matchHist(l))} loading={actionLogLoading} />
          )}
        </div>
      ) : loading ? (
        <div className="text-center py-16 text-gray-400">
          <i className="fa-solid fa-spinner fa-spin text-3xl mb-2 block text-teal-500"></i>
          <p className="text-sm">กำลังโหลด...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
          <i className="fa-solid fa-inbox text-5xl text-gray-300 mb-3 block"></i>
          <p className="text-sm text-gray-400">{search ? 'ไม่พบผู้ใช้ตามคำค้นหา' : 'ไม่มีผู้ใช้ในหมวดนี้'}</p>
        </div>
      ) : viewMode === 'list' ? (
        /* ── List view: แถวกะทัดรัด เหมาะกับเยอะๆ ── */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500">
            <div className="col-span-3">ชื่อ</div>
            <div className="col-span-2">วิชาชีพ</div>
            <div className="col-span-3">โรงพยาบาล / แผนก</div>
            <div className="col-span-2">สถานะ</div>
            <div className="col-span-2 text-right">การกระทำ</div>
          </div>
          <div className="divide-y divide-gray-100">
            {visibleUsers.map(p => {
              const sc = STATUS_STYLE[p.status];
              const dept = p.department === 'อื่นๆ' ? (p.department_other || 'อื่นๆ') : p.department;
              const hasReq = !!editReqByUser[p.id];
              const flashing = flashUserId === p.id;
              return (
                <div key={p.id} ref={el => { if (el) userRefs.current[p.id] = el; }}
                  className={'px-4 py-3 transition-colors ' + (flashing ? 'bg-amber-100 ring-2 ring-amber-400 ring-inset' : hasReq ? 'bg-amber-50/40' : 'hover:bg-teal-50/40')}>
                <div className="grid grid-cols-12 gap-3 items-center text-sm">
                  <div className="col-span-3 min-w-0 flex items-center gap-2">
                    <AvatarCircle urlKey={p.avatar_url} updatedAt={p.avatar_updated_at} colorKey={p.id} name={`${p.first_name||''} ${p.last_name||''}`} fallback={(((p.first_name||'')[0]||'')+((p.last_name||'')[0]||'')).toUpperCase()||'?'} size={34} />
                    <div className="min-w-0">
                      <p className="font-bold text-teal-900 truncate">{p.first_name} {p.last_name} {p.role === 'admin' && <span className="text-xs">👑</span>}</p>
                      <p className="text-xs text-gray-400 truncate">@{p.username} · {p.email || '—'}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-xs text-gray-600 truncate">
                    <p>{PROFESSION_LABELS_TH[p.profession] || p.profession}</p>
                    {p.license_number && <p className="text-gray-400">{p.license_number}</p>}
                  </div>
                  <div className="col-span-3 text-xs text-gray-600 truncate">
                    <p className="truncate">{p.hospital_name}</p>
                    <p className="text-gray-400 truncate">{dept}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md inline-block" style={{ background:sc.bg, color:sc.fg }}>{sc.label}</span>
                    {hasReq && <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-800" title="มีคำขอแก้ไข">{editReqByUser[p.id].length} คำขอ</span>}
                  </div>
                  <div className="col-span-2 flex justify-end gap-1.5">
                    {filter === 'approved' && (
                      <button type="button" onClick={()=>openEdit(p)} disabled={busy}
                        className="px-2.5 py-1 rounded-lg font-bold text-white text-xs bg-teal-700 hover:bg-teal-800 disabled:opacity-50" title="แก้ไขข้อมูล">
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                    )}
                    {p.status === 'pending' && (
                      <>
                        <button type="button" onClick={()=>handleApprove(p)} disabled={busy}
                          className="px-2.5 py-1 rounded-lg font-bold text-white text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-50" title="อนุมัติ">
                          <i className="fa-solid fa-check"></i>
                        </button>
                        <button type="button" onClick={()=>{ setRejectingId(p.id); setRejectReason(''); }} disabled={busy}
                          className="px-2.5 py-1 rounded-lg font-bold text-white text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50" title="ปฏิเสธ">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </>
                    )}
                    {p.status === 'approved' && p.role !== 'admin' && (
                      <button type="button" onClick={()=>setDeactivateTarget(p)} disabled={busy}
                        className="px-2.5 py-1 rounded-lg font-bold text-white text-xs bg-orange-500 hover:bg-orange-600 disabled:opacity-50" title="ปิดบัญชี">
                        <i className="fa-solid fa-user-slash"></i>
                      </button>
                    )}
                    {p.status === 'rejected' && (() => {
                      const ws = p.rejection_week_start ? new Date(p.rejection_week_start) : null;
                      const isBlocked = ws && (new Date() - ws) < 7*24*60*60*1000 && (p.rejection_week_count||0) >= 3;
                      const isDeactivated = !!p.deactivated_at;
                      return (
                        <>
                          {isDeactivated && (
                            <button type="button" onClick={()=>handleRestoreUser(p)} disabled={busy}
                              className="px-2.5 py-1 rounded-lg font-bold text-white text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-50" title="กู้คืนบัญชี">
                              <i className="fa-solid fa-rotate-left"></i>
                            </button>
                          )}
                          {!isDeactivated && isBlocked && (
                            <button type="button" onClick={()=>handleResetRejectionLimit(p)} disabled={busy}
                              className="px-2.5 py-1 rounded-lg font-bold text-white text-xs bg-amber-500 hover:bg-amber-600 disabled:opacity-50" title="ปลดล็อก — ให้สมัครใหม่ได้">
                              <i className="fa-solid fa-lock-open"></i>
                            </button>
                          )}
                          <button type="button" onClick={()=>{ setHardDelTarget(p); setConfirmText(''); }} disabled={busy}
                            className="px-2.5 py-1 rounded-lg font-bold text-white text-xs bg-gray-600 hover:bg-red-600 disabled:opacity-50" title="ลบถาวร">
                            <i className="fa-solid fa-fire"></i>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
                {renderEditReqBox(p)}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Card view: ละเอียด เหมือนเดิม ── */
        <div className="space-y-3">
          {visibleUsers.map(p => {
            const sc = STATUS_STYLE[p.status];
            const dept = p.department === 'อื่นๆ' ? (p.department_other || 'อื่นๆ') : p.department;
            const hasReq = !!editReqByUser[p.id];
            const flashing = flashUserId === p.id;
            return (
              <div key={p.id} ref={el => { if (el) userRefs.current[p.id] = el; }}
                className={'bg-white rounded-2xl p-5 shadow-sm border transition-all ' + (flashing ? 'border-amber-400 ring-2 ring-amber-400' : hasReq ? 'border-amber-200' : 'border-gray-100 hover:border-teal-200 hover:shadow-md')}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <AvatarCircle urlKey={p.avatar_url} updatedAt={p.avatar_updated_at} colorKey={p.id} name={`${p.first_name||''} ${p.last_name||''}`} fallback={(((p.first_name||'')[0]||'')+((p.last_name||'')[0]||'')).toUpperCase()||'?'} size={42} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-bold text-teal-900">{p.first_name} {p.last_name}</h3>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background:sc.bg, color:sc.fg }}>{sc.label}</span>
                        {p.role === 'admin' && <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">👑 Admin</span>}
                        {hasReq && <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-800"><i className="fa-solid fa-pen-clip mr-1"></i>{editReqByUser[p.id].length} คำขอแก้ไข</span>}
                      </div>
                      <p className="text-xs text-gray-500">
                        {PROFESSION_LABELS_TH[p.profession] || p.profession}
                        {p.license_number && ` · ${p.license_number}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    {filter === 'approved' && (
                      <button type="button" onClick={()=>openEdit(p)} disabled={busy}
                        className="px-3 py-2 rounded-xl font-bold text-white text-xs bg-teal-700 hover:bg-teal-800 disabled:opacity-50">
                        <i className="fa-solid fa-pen-to-square mr-1"></i>แก้ไข
                      </button>
                    )}
                    {p.status === 'pending' && (
                      <>
                        <button type="button" onClick={() => handleApprove(p)} disabled={busy}
                          className="px-4 py-2 rounded-xl font-bold text-white text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-50">
                          <i className="fa-solid fa-check mr-1"></i>อนุมัติ
                        </button>
                        <button type="button" onClick={() => { setRejectingId(p.id); setRejectReason(''); }} disabled={busy}
                          className="px-4 py-2 rounded-xl font-bold text-white text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50">
                          <i className="fa-solid fa-xmark mr-1"></i>ปฏิเสธ
                        </button>
                      </>
                    )}
                  </div>
                  {p.status === 'approved' && p.role !== 'admin' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button type="button" onClick={()=>setDeactivateTarget(p)} disabled={busy}
                        className="px-4 py-2 rounded-xl font-bold text-white text-xs bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
                        <i className="fa-solid fa-user-slash mr-1"></i>ปิดบัญชี
                      </button>
                    </div>
                  )}
                  {p.status === 'rejected' && (() => {
                    const ws = p.rejection_week_start ? new Date(p.rejection_week_start) : null;
                    const isBlocked = ws && (new Date() - ws) < 7*24*60*60*1000 && (p.rejection_week_count||0) >= 3;
                    const isDeactivated = p.rejected_reason === 'ปิดบัญชีโดย Admin';
                    return (
                      <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                        {isDeactivated && (
                          <button type="button" onClick={()=>handleRestoreUser(p)} disabled={busy}
                            className="px-4 py-2 rounded-xl font-bold text-white text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-50">
                            <i className="fa-solid fa-rotate-left mr-1"></i>กู้คืนบัญชี
                          </button>
                        )}
                        {!isDeactivated && isBlocked && (
                          <button type="button" onClick={()=>handleResetRejectionLimit(p)} disabled={busy}
                            className="px-4 py-2 rounded-xl font-bold text-white text-xs bg-amber-500 hover:bg-amber-600 disabled:opacity-50">
                            <i className="fa-solid fa-lock-open mr-1"></i>ปลดล็อก
                          </button>
                        )}
                        <button type="button" onClick={()=>{ setHardDelTarget(p); setConfirmText(''); }} disabled={busy}
                          className="px-4 py-2 rounded-xl font-bold text-white text-xs bg-gray-600 hover:bg-red-600 disabled:opacity-50">
                          <i className="fa-solid fa-fire mr-1"></i>ลบถาวร
                        </button>
                      </div>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs pt-3 border-t border-gray-100">
                  <Field label="โรงพยาบาล" value={p.hospital_name} />
                  <Field label="ประเภท" value={p.hospital_type} />
                  <Field label="แผนก" value={dept} />
                  <Field label="Username" value={p.username} />
                  <Field label="Email" value={p.email || '—'} />
                  <Field label="เบอร์โทร" value={p.phone || '—'} />
                </div>
                {p.status === 'rejected' && p.rejected_reason && (
                  <div className="mt-3 p-3 rounded-xl text-xs bg-red-50 text-red-800 border border-red-100">
                    <strong>เหตุผลปฏิเสธ:</strong> {p.rejected_reason}
                  </div>
                )}
                {renderEditReqBox(p)}
              </div>
            );
          })}
        </div>
      )}
      {/* v0.7.17.1 — ปุ่มดูเพิ่ม (ใช้ร่วม list view + card view) */}
      {filtered.length > visibleUserCount && (
        <div className="text-center py-2">
          <button type="button" onClick={()=>setVisibleUserCount(c=>c+50)}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-1.5 rounded-full transition-colors">
            <i className="fa-solid fa-chevron-down mr-1.5"></i>
            ดูผู้ใช้เพิ่มอีก {Math.min(50, filtered.length - visibleUserCount)} คน
            <span className="text-gray-400 font-normal ml-2">({visibleUserCount} / {filtered.length})</span>
          </button>
        </div>
      )}

      {/* Hard delete user modal — ลบถาวร rejected user */}
      {hardDelTarget && (
        <div className="fixed inset-0 tb-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <h3 className="text-lg font-bold text-red-700 mb-2">
              <i className="fa-solid fa-fire mr-2"></i>ลบถาวร "{hardDelTarget.first_name} {hardDelTarget.last_name}"
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-900">
              <p className="font-bold mb-1"><i className="fa-solid fa-triangle-exclamation mr-1"></i>คำเตือน</p>
              <p>• ระบบจะลบทั้งโปรไฟล์ + บัญชี auth ออกจากระบบ</p>
              <p>• อีเมล <strong>{hardDelTarget.email}</strong> จะใช้สมัครใหม่ได้</p>
              <p>• กู้คืนไม่ได้</p>
            </div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              พิมพ์ Username เพื่อยืนยัน: <span className="font-mono text-red-600">{hardDelTarget.username}</span>
            </label>
            <input type="text" value={confirmText} onChange={e=>setConfirmText(e.target.value)}
              placeholder="พิมพ์ username ที่นี่"
              className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 mb-4"/>
            <label className="block text-xs font-bold text-gray-700 mb-1">เหตุผลในการลบบัญชี <span className="text-red-500">*</span></label>
            <textarea value={hardDelReason} onChange={e=>setHardDelReason(e.target.value)}
              rows={2} placeholder="เช่น บัญชีซ้ำ / สมัครผิด / ผู้ใช้ขอลบ"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 resize-none mb-4"/>
            <div className="flex gap-2">
              <button type="button" onClick={handleHardDeleteUser}
                disabled={confirmText !== hardDelTarget.username || !hardDelReason.trim() || busy}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold">
                {busy ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังลบ...</> : 'ลบถาวร'}
              </button>
              <button type="button" onClick={()=>{ setHardDelTarget(null); setConfirmText(''); setHardDelReason(''); }} disabled={busy}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate user modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 tb-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <h3 className="text-lg font-bold text-orange-600 mb-2">
              <i className="fa-solid fa-user-slash mr-2"></i>ปิดบัญชี "{deactivateTarget.first_name} {deactivateTarget.last_name}"
            </h3>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-xs text-orange-900">
              <p className="font-bold mb-1"><i className="fa-solid fa-circle-info mr-1"></i>รายละเอียด</p>
              <p>• สถานะจะเปลี่ยนเป็น "ปฏิเสธ" — user เข้าระบบไม่ได้ทันที</p>
              <p>• กู้คืนได้ โดยกดปุ่ม "กู้คืนบัญชี" ภายหลัง</p>
              <p>• ข้อมูลผู้ป่วยที่เพิ่มไว้ยังคงอยู่ในระบบ</p>
            </div>
            <label className="block text-xs font-bold text-gray-700 mb-1">เหตุผลในการปิดบัญชี <span className="text-red-500">*</span></label>
            <textarea value={deactivateReason} onChange={e=>{ setDeactivateReason(e.target.value); setDeactivateError(''); }}
              rows={3} placeholder="เช่น ลาออก / ย้ายหน่วยงาน / ขอปิดบัญชีชั่วคราว"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-400 resize-none"/>
            {deactivateError && <p className="text-xs text-red-600 mt-1.5"><i className="fa-solid fa-circle-exclamation mr-1"></i>{deactivateError}</p>}
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={doDeactivateUser} disabled={busy}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl text-sm font-bold">
                {busy ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังดำเนินการ...</> : 'ยืนยัน ปิดบัญชี'}
              </button>
              <button type="button" onClick={()=>{ setDeactivateTarget(null); setDeactivateReason(''); setDeactivateError(''); }} disabled={busy}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog อนุมัติผู้ใช้ — ยืนยัน (ไม่ต้องกรอกเหตุผล) ── */}
      {approveUserTarget && (
        <div className="fixed inset-0 tb-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <h3 className="text-lg font-bold text-teal-700 mb-2">
              <i className="fa-solid fa-circle-check mr-2"></i>อนุมัติ "{approveUserTarget.first_name} {approveUserTarget.last_name}"
            </h3>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-5 text-xs text-teal-900">
              <p className="font-bold mb-1"><i className="fa-solid fa-circle-info mr-1"></i>รายละเอียด</p>
              <p>• ผู้ใช้จะเข้าสู่ระบบได้ทันที</p>
              <p>• ระบบจะส่งอีเมลแจ้งผู้ใช้ว่าได้รับอนุมัติ</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={doApproveUser} disabled={busy}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-bold">
                {busy ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังดำเนินการ...</> : 'ยืนยัน อนุมัติ'}
              </button>
              <button type="button" onClick={()=>setApproveUserTarget(null)} disabled={busy}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog กู้คืนบัญชีผู้ใช้ — ยืนยัน + ใส่เหตุผล ── */}
      {restoreUserTarget && (
        <div className="fixed inset-0 tb-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <h3 className="text-lg font-bold text-teal-700 mb-2">
              <i className="fa-solid fa-rotate-left mr-2"></i>กู้คืนบัญชี "{restoreUserTarget.first_name} {restoreUserTarget.last_name}"
            </h3>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4 text-xs text-teal-900">
              <p className="font-bold mb-1"><i className="fa-solid fa-circle-info mr-1"></i>รายละเอียด</p>
              <p>• สถานะจะกลับเป็น "อนุมัติ" — user เข้าระบบได้ทันที</p>
              <p>• ระบบจะส่งอีเมลแจ้งผู้ใช้ว่าบัญชีถูกกู้คืนแล้ว</p>
            </div>
            <label className="block text-xs font-bold text-gray-700 mb-1">เหตุผลในการกู้คืน <span className="text-red-500">*</span></label>
            <textarea value={restoreUserReason} onChange={e=>{ setRestoreUserReason(e.target.value); setRestoreUserError(''); }}
              rows={3} placeholder="เช่น กลับเข้าทำงาน / ปิดบัญชีผิดคน / ผู้ใช้ขอกลับเข้าระบบ"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 resize-none"/>
            {restoreUserError && <p className="text-xs text-red-600 mt-1.5"><i className="fa-solid fa-circle-exclamation mr-1"></i>{restoreUserError}</p>}
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={doRestoreUser} disabled={busy}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-bold">
                {busy ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังดำเนินการ...</> : 'ยืนยัน กู้คืนบัญชี'}
              </button>
              <button type="button" onClick={()=>{ setRestoreUserTarget(null); setRestoreUserReason(''); setRestoreUserError(''); }} disabled={busy}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject edit-request modal — ปฏิเสธคำขอแก้ไขข้อมูล (ใส่เหตุผลได้) */}
      {rejectReqTarget && (
        <div className="fixed inset-0 tb-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <h3 className="text-lg font-bold text-red-600 mb-2">
              <i className="fa-solid fa-xmark mr-2"></i>ปฏิเสธคำขอแก้ไขข้อมูล
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-900">
              <p><strong>ข้อมูลที่ขอแก้:</strong> {rejectReqTarget.field_label}</p>
              <p className="mt-1"><strong>ค่าที่ขอ:</strong> {rejectReqTarget.new_value}</p>
            </div>
            <label className="block text-xs font-bold text-gray-700 mb-1">เหตุผลในการปฏิเสธ (ไม่บังคับ)</label>
            <textarea value={rejectReqNote} onChange={e=>setRejectReqNote(e.target.value)}
              rows={3} placeholder="ระบุเหตุผล เพื่อแจ้งผู้ใช้ทางอีเมล"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 mb-4 resize-none"/>
            <div className="flex gap-2">
              <button type="button" onClick={()=>handleEditRequest(rejectReqTarget.id, 'reject', rejectReqNote)}
                disabled={editReqBusy === rejectReqTarget.id}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl text-sm font-bold">
                {editReqBusy === rejectReqTarget.id ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังดำเนินการ...</> : 'ยืนยัน ปฏิเสธคำขอ'}
              </button>
              <button type="button" onClick={()=>{ setRejectReqTarget(null); setRejectReqNote(''); }} disabled={editReqBusy === rejectReqTarget.id}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast (แทน alert() ของเบราว์เซอร์) */}
      <ToastModal toast={toast} onClose={()=>setToast(null)} />

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 tb-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto modal-A">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-teal-900">
                <i className="fa-solid fa-pen-to-square mr-2 text-teal-600"></i>แก้ไขข้อมูล
              </h3>
              <button type="button" onClick={closeEdit} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <p className="text-xs mb-4 px-3 py-2 rounded-lg bg-teal-50 text-teal-800">
              <i className="fa-solid fa-circle-info mr-1.5"></i>
              แก้ไขข้อมูลของ <strong>{editingUser.first_name} {editingUser.last_name}</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">ค่าเดิม</span>
              <span className="text-[11px] font-bold uppercase tracking-wide text-teal-700 hidden sm:block">แก้เป็น</span>
            </div>
            <div className="space-y-0">
              <EditRow label="คำนำหน้าชื่อ" original={editingUser.title || '—'} changed={editForm.title !== (editingUser.title || '')}>
                <select value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white">
                  <option value="">— เลือก —</option>
                  {window.TB_NAME_PREFIXES.map(t=>(
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </EditRow>
              <EditRow label="ชื่อ" original={editingUser.first_name} changed={editForm.first_name !== (editingUser.first_name||'')}>
                <input value={editForm.first_name} onChange={e=>setEditForm(f=>({...f,first_name:e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white"/>
              </EditRow>
              <EditRow label="นามสกุล" original={editingUser.last_name} changed={editForm.last_name !== (editingUser.last_name||'')}>
                <input value={editForm.last_name} onChange={e=>setEditForm(f=>({...f,last_name:e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white"/>
              </EditRow>
              <EditRow label="ชื่อโรงพยาบาล" original={editingUser.hospital_name} changed={editForm.hospital_name !== (editingUser.hospital_name||'')}>
                <input value={editForm.hospital_name} onChange={e=>setEditForm(f=>({...f,hospital_name:e.target.value}))}
                  placeholder="เช่น โรงพยาบาลปรางค์กู่"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white"/>
              </EditRow>
              <EditRow label="ประเภทโรงพยาบาล" original={editingUser.hospital_type} changed={editForm.hospital_type !== (editingUser.hospital_type||'')}>
                <select value={editForm.hospital_type} onChange={e=>setEditForm(f=>({...f,hospital_type:e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white">
                  <option value="">— เลือก —</option>
                  {HOSPITAL_TYPES_LIST.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </EditRow>
              <EditRow label="แผนก" original={editingUser.department} changed={editForm.department !== (editingUser.department||'')}>
                <select value={editForm.department} onChange={e=>setEditForm(f=>({...f,department:e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white">
                  <option value="">— เลือก —</option>
                  {DEPARTMENTS_LIST.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </EditRow>
              {editForm.department === 'อื่นๆ' && (
                <EditRow label="ระบุแผนก" original={editingUser.department_other} changed={editForm.department_other !== (editingUser.department_other||'')}>
                  <input value={editForm.department_other} onChange={e=>setEditForm(f=>({...f,department_other:e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white"/>
                </EditRow>
              )}
              <EditRow label="วิชาชีพ" original={PROFESSION_LABELS_TH[editingUser.profession] || editingUser.profession} changed={editForm.profession !== (editingUser.profession||'')}>
                <select value={editForm.profession} onChange={e=>setEditForm(f=>({...f,profession:e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white">
                  <option value="">— เลือก —</option>
                  {Object.entries(PROFESSION_LABELS_TH).map(([key,label])=>(
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </EditRow>
              <EditRow label="เลขใบประกอบวิชาชีพ" original={editingUser.license_number} changed={editForm.license_number !== window.tbLicenseDigits(editingUser.license_number)}>
                <div className="flex items-center gap-2">
                  {window.tbProfPrefix(editForm.profession) && (
                    <span className="text-sm font-bold shrink-0 px-3 py-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                      {window.tbProfPrefix(editForm.profession)}
                    </span>
                  )}
                  <input value={editForm.license_number} onChange={e=>setEditForm(f=>({...f,license_number:e.target.value.replace(/\D/g,'')}))}
                    placeholder="กรอกเฉพาะตัวเลข"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white"/>
                </div>
                <p className="text-xs mt-1 text-gray-400">กรอกเฉพาะตัวเลข ระบบจะเติมคำนำหน้าตามวิชาชีพให้อัตโนมัติ</p>
              </EditRow>
              <EditRow label="เบอร์โทรศัพท์" original={editingUser.phone} changed={editForm.phone !== window.tbFormatPhone(editingUser.phone)}>
                <input value={editForm.phone} onChange={e=>setEditForm(f=>({...f,phone:window.tbFormatPhone(e.target.value)}))}
                  placeholder="08x-xxx-xxxx"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white"/>
              </EditRow>
            </div>
            {editError && <p className="mt-3 text-xs text-center font-semibold text-red-500">{editError}</p>}
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={closeEdit} disabled={editBusy}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">ยกเลิก</button>
              <button type="button" onClick={submitEdit} disabled={editBusy}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white"
                style={{ background: editBusy ? '#5eead4' : '#0f766e' }}>
                {editBusy ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังบันทึก...</> : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 tb-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <h3 className="text-lg font-bold text-red-700 mb-2">
              <i className="fa-solid fa-circle-xmark mr-2"></i>ปฏิเสธคำขอสมัคร
            </h3>
            <p className="text-xs text-gray-500 mb-3">กรุณาระบุเหตุผล (จะแจ้งผู้สมัครทางเมล)</p>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={4}
              placeholder="เช่น ข้อมูลไม่ครบถ้วน, ไม่ใช่บุคลากรในระบบ ฯลฯ"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 bg-gray-50"/>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={()=>{ setRejectingId(null); setRejectReason(''); }} disabled={busy}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">ยกเลิก</button>
              <button type="button" onClick={submitReject} disabled={busy || !rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50">
                {busy ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังส่ง...</> : 'ยืนยันปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { AdminUsersTab }
