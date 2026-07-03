'use client'
/* eslint-disable */
// @ts-nocheck

/**
 * tb-monolith.jsx — Auto-generated for v0.7.17.0 Phase 3 Step 3
 *
 * Concatenation of:
 *   - public/tb-modals.jsx  (4,832 lines)
 *   - public/tb-app.jsx     (5,874 lines)
 *
 * ลำดับสำคัญ:
 *   1. './setup' โหลด React/Chart/Supabase → window globals (ทำใน wrapper)
 *   2. './tb-data.js' set window.X data + functions (ทำใน wrapper)
 *   3. './tb-changelog.js' set window.TB_CHANGELOG (ทำใน wrapper)
 *   4. ไฟล์นี้ — ใช้ window.X ที่ถูก set ไว้แล้ว
 *
 * ไม่แก้ logic เดิม — แค่ย้ายเข้า Next.js bundler
 *   - removed: `const { useState, ... } = React` (top of each source — สร้าง duplicate)
 *   - removed: `ReactDOM.createRoot(...)` ที่บรรทัดสุดท้าย tb-app.jsx
 *   - added: `const { useState, ... } = React` ครั้งเดียวที่ top
 *   - added: `export default App` ที่ bottom
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import V2Skeleton from '../components/V2Skeleton'
import { ADR_LIST, migrateAdr, calcDoses, calcCrCl, crClStage,
         DRUG_RANGES, REGIMENS, PREFIXES, PATIENT_TYPES, DISEASE_LOCATIONS,
         EXTRA_PULMONARY_TYPES, TAMBONS, DEFAULT_COMORBIDITIES,
         CONSULT_TYPES, DRP_TYPES, LAB_GROUPS, getLabStatus, LAB_STATUS_STYLE,
         Chart, INITIAL_PATIENTS, generateAlerts, DEFAULT_DRUGS, DEFAULT_RESTART_REASONS } from './parts/globals'
import { useModalAnim, INP, FormSection, FieldError, RangeStatus, Badge,
         ConfirmModal, ToastModal, Field, FilterSelect, StatusBadge, ScrollNav,
         relTime, r2AvatarUrl, normName, nameInitials, AVATAR_PALETTE, colorFromName, AvatarCircle } from './parts/shared'
import { ChangelogPage } from './parts/changelog'
import { StorageMiniCard, StorageDetail, StorageAlert } from './parts/storage'
import { AdminUsersTab, ActivityLogTab, AuditLogTab, AdminSettings } from './parts/admin'
import { TrashList, KnowledgeBase } from './parts/misc'
import { TrashHub, PatientImagesTab, ImageLibraryPage } from './parts/patient-images'
import { UserProfileModal } from './parts/account'
import { ClinicalModal, AddPatientPage } from './parts/patient-modal'
import { Dashboard, PatientList, ArchiveList, AllPatientsPage, WeeklyPrep, Reports } from './parts/dashboard'
import { NotificationPanel, NotificationFullModal } from './parts/notifications'
import { AboutModal } from './parts/about'
const { useState, useEffect, useRef } = React

/* ════════════════ tb-modals.jsx ════════════════ */

// useModalAnim, INP, FormSection, FieldError, RangeStatus, Badge ย้ายไป parts/shared.jsx (เฟส 1b)
// window globals ย้ายไป parts/globals.js (เฟส 1a)
// HOSP_STRENGTHS, DoseCalculator, DOTCalendar ย้ายไป parts/patient-modal.jsx (เฟส 7)

// useNotifHelpers, NotificationPanel, NotificationFullModal ย้ายไป parts/notifications.jsx (แยกรอบ 2)

// DrugInteractionPanel, RegimenHistoryTab, LabTab (Chart.js), ADRTab, TimelineTab, DiagnosisTab, MedsTab, VisitForm, InfoBar, ClinicalModal, AddPatientPage, PharmSummaryTab + helpers/consts ย้ายไป parts/patient-modal.jsx (เฟส 7)

// ─────────────────────────────────────────────────────
// หน้าถังขยะ — list คนที่ลบแล้ว + Restore / Hard delete
// ─────────────────────────────────────────────────────
// TrashList ย้ายไป parts/misc.jsx (เฟส 4)

// ─────────────────────────────────────────────────────
// AdminUsersTab — จัดการผู้ใช้ (admin เท่านั้น) — embedded ใน dashboard
// ─────────────────────────────────────────────────────
// ใช้บัญชีกลางจาก tb-data.js (โหลดก่อน tb-modals เสมอ) — แหล่งเดียวกับ lib/professions.ts
const PROFESSION_LABELS_TH = window.TB_PROFESSION_LABELS;

// แถวแก้ไขข้อมูลแบบ 2 ฝั่ง: ซ้าย = ค่าเดิม (อ่านอย่างเดียว) | ขวา = ช่องแก้ (ไฮไลต์อำพันเมื่อแก้)

// (ลบ Object.assign(window,{...}) — dead code มรดกตอน tb-modals/tb-app แยกไฟล์ ไม่มีใครอ่านจาก window เลย, เฟส 1b)

/* ════════════════ tb-app.jsx ════════════════ */

// ===================== STATUS BADGE =====================
// StatusBadge ย้ายไป parts/shared.jsx (เฟส 1c)

// ===================== DASHBOARD =====================
// MONTH_LABELS, FAKE_MONTHLY/YEARLY, Dashboard (Chart.js), col-config/render helpers, PatientList, ArchiveList, AllPatientsPage, WeeklyPrep, Reports ย้ายไป parts/dashboard.jsx (เฟส 8)

// ===================== ADMIN SETTINGS =====================

// ===================== KNOWLEDGE BASE =====================
// KnowledgeBase ย้ายไป parts/misc.jsx (เฟส 4)

// ===================== APP =====================
function App() {
  const [nav, setNavRaw] = useState('dashboard');
  const mainScrollRef = React.useRef(null);  // v0.7.17.3 — สำหรับ ScrollNav
  React.useEffect(() => { if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0; }, [nav]);   // เปลี่ยนหน้า → เลื่อนขึ้นบนสุด (กันค้างตำแหน่งหน้าเดิม)
  const [pendingLeave, setPendingLeave] = useState(null); // v0.7.14.7 — target nav รอ user ยืนยันออกจาก draft
  // v0.7.14.7 — wrapper setNav: ดัก draft ค้างก่อนเปลี่ยนหน้า
  const setNav = React.useCallback((target) => {
    if (nav === 'changelog' && target !== 'changelog' && window._hasUnsentChangelogDraft) {
      setPendingLeave(target);
      return;
    }
    setNavRaw(target);
  }, [nav]);
  const [patients, setPatients] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [clinical, setClinical] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const [showFullNotifs, setShowFullNotifs] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [readAlerts, setReadAlerts] = useState(new Set());
  // v0.7.17.0 — ย้าย userDbNotifs declaration ขึ้นมาก่อน useEffect ที่ใช้
  //   (เดิม declared ตอน line 6643 → SWC strict const TDZ → ReferenceError)
  //   ของเก่า iframe + Babel แปลง const→var ผ่าน TDZ ได้ → ไม่เห็นบั๊ก
  const [userDbNotifs, setUserDbNotifs] = useState([]);
  // sync readAlerts จาก DB (notification ที่ is_read=true อยู่แล้ว ต้องนับเป็น read)
  useEffect(() => {
    if (!userDbNotifs || userDbNotifs.length === 0) return;
    const readIds = userDbNotifs.filter(n => n.is_read).map(n => 'user-notif-' + n.id);
    if (readIds.length > 0) setReadAlerts(prev => new Set([...prev, ...readIds]));
  }, [userDbNotifs]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [changelogUnseen, setChangelogUnseen] = useState(false);
  // v0.7.17.1 — logout optimistic UI overlay
  const [loggingOut, setLoggingOut] = useState(false);

  // ── ป้าย "New" บน sidebar — ดูจาก localStorage tb_changelog_last_seen ──
  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem('tb_changelog_last_seen');
      if (!lastSeen || lastSeen !== APP_VERSION) setChangelogUnseen(true);
    } catch {/* localStorage ปิด → ไม่แสดง dot */}
  }, []);

  // v0.7.16.1 Phase 3 Step 2 — ส่ง signal ขึ้น parent (Next.js HomeShell) ว่า React mount แล้ว
  // parent ฟัง postMessage แล้วซ่อน skeleton + fade iframe เข้ามาแทน
  // อยู่ใน try/catch — กัน error ตอน iframe ไม่มี parent (เช่น เปิดตรง /app.html)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'tb-app-ready' }, '*');
      }
    } catch { /* noop — เปิดเดี่ยวๆไม่มี parent */ }
  }, []);
  const [settings, setSettings] = useState({ comorbidities: DEFAULT_COMORBIDITIES, drugs: DEFAULT_DRUGS, labGroups: null, customDrugInteractions: [], restartReasons: DEFAULT_RESTART_REASONS, regimens: [...REGIMENS] });
  const [ptSearch, setPtSearch] = useState('');
  const [ptFilter, setPtFilter] = useState('all');
  const [ptShowColMgr, setPtShowColMgr] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [easterRound, setEasterRound] = useState(1);
  const [easterMsgIdx, setEasterMsgIdx] = useState(-1);
  const [dirtyToast, setDirtyToast] = useState(false);
  const dirtyToastTimer = useRef(null);
  const EASTER_MSGS = ['จะกดอะไรกันนักกันหนา 😤','จะไม่กดแล้วใช่มั้ย','แน่นะ','หืมมมมมม','เชื่อก็ได้'];

  // Current user profile (จาก Supabase)
  const [currentUser, setCurrentUser] = useState(null);
  // จำนวน user ที่รออนุมัติ (สำหรับ badge ใน sidebar)
  const [pendingUserCount, setPendingUserCount] = useState(0);
  const [pendingDeleteRequests, setPendingDeleteRequests] = useState([]);
  const [cancelledDeleteCount, setCancelledDeleteCount] = useState(0);
  // v0.7.17.0 — userDbNotifs ย้ายขึ้นไป declared บนสุดแล้ว (ใกล้ readAlerts useEffect)
  // คำขอแก้ไขข้อมูลที่รออนุมัติ (admin) + user ที่จะ highlight เมื่อกดจากกระดิ่ง
  const [pendingEditRequests, setPendingEditRequests] = useState([]);
  const [highlightUserId, setHighlightUserId] = useState(null);
  const [highlightCommentTarget, setHighlightCommentTarget] = useState(null); // { version, commentId, ts }
  useEffect(() => {
    if (!currentUser?.id) return;
    if (currentUser.role === 'admin') {
      (async () => {
        try {
          const { count } = await window._sb.from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending');
          setPendingUserCount(count || 0);
          const reqs = await window.loadPendingDeleteRequests();
          setPendingDeleteRequests(reqs);
          const cancelled = await window.loadCancelledDeleteCount();
          setCancelledDeleteCount(cancelled);
          const editReqs = await window.loadPendingEditRequests();
          setPendingEditRequests(editReqs);
        } catch (e) { console.error('Load pending count failed:', e); }
      })();
    } else {
      window.loadMyPendingDeleteRequests(currentUser.id)
        .then(reqs => setPendingDeleteRequests(reqs))
        .catch(() => {});
    }
    // v0.7.14.x — โหลด user notifications ของตัวเอง (รวม admin — admin ถูก tag/reply ได้)
    window.loadUserNotifications()
      .then(notifs => setUserDbNotifs(notifs))
      .catch(() => {});
  }, [currentUser]);

  // Realtime: ฟังการเปลี่ยนแปลงของ tb_delete_requests (สำหรับ admin)
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    const channel = window._sb
      .channel('delete-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_delete_requests' }, async () => {
        try {
          const reqs = await window.loadPendingDeleteRequests();
          setPendingDeleteRequests(reqs);
          const cancelled = await window.loadCancelledDeleteCount();
          setCancelledDeleteCount(cancelled);
        } catch (e) { console.error('Realtime reload failed:', e); }
      })
      .subscribe();
    return () => { window._sb.removeChannel(channel); };
  }, [currentUser]);

  // Realtime: ฟังคำขอแก้ไขข้อมูลโปรไฟล์ (สำหรับ admin)
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    const channel = window._sb
      .channel('edit-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_profile_edit_requests' }, async () => {
        try {
          const editReqs = await window.loadPendingEditRequests();
          setPendingEditRequests(editReqs);
        } catch (e) { console.error('Realtime edit-requests failed:', e); }
      })
      .subscribe();
    return () => { window._sb.removeChannel(channel); };
  }, [currentUser]);

  // Realtime: ฟัง bell notification ของ user (รวม admin — admin ก็ถูก tag/reply ได้)
  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = window._sb
      .channel('user-notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_notifications', filter: `user_id=eq.${currentUser.id}` }, async () => {
        try {
          const notifs = await window.loadUserNotifications();
          setUserDbNotifs(notifs);
        } catch (e) { console.error('Realtime user notifs failed:', e); }
      })
      .subscribe();
    return () => { window._sb.removeChannel(channel); };
  }, [currentUser]);

  // Realtime: ฟังการเปลี่ยนแปลงของรายชื่อผู้ป่วย (ทุก user)
  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = window._sb
      .channel('patients-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_patients' }, async () => {
        try {
          const data = await loadPatients();
          setPatients([...INITIAL_PATIENTS, ...data]);
        } catch (e) { console.error('Realtime patients failed:', e); }
      })
      .subscribe();
    return () => { window._sb.removeChannel(channel); };
  }, [currentUser]);

  // Realtime: ฟัง user ใหม่สมัคร / เปลี่ยนสถานะ (สำหรับ admin)
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    const channel = window._sb
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, async () => {
        try {
          const { count } = await window._sb.from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending');
          setPendingUserCount(count || 0);
        } catch (e) { console.error('Realtime profiles failed:', e); }
      })
      .subscribe();
    return () => { window._sb.removeChannel(channel); };
  }, [currentUser]);
  useEffect(() => {
    fetch('/api/profile/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.profile) return;
        const p = data.profile;
        const prof = PROFESSIONS[p.profession] || PROFESSIONS.other;
        const shown = window.tbDisplayTitle(p.profession, p.title);  // ตัวย่อวิชาชีพตามเพศ (เช่น ภญ.) หรือคำนำหน้านาม
        setCurrentUser({
          id:          p.id,
          fullName:    `${shown} ${p.first_name || ''} ${p.last_name || ''}`.trim(),
          profession:  prof.label,
          avatar:      shown,
          avatarUrl:   p.avatar_url || null,
          avatarUpdatedAt: p.avatar_updated_at || null,
          role:        p.role,
        });
      })
      .catch(()=>{});
  }, []);

  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  // ── ปิด popup ค้นหาเมื่อกดที่อื่นนอก popup ──
  useEffect(() => {
    if (!showSearchModal) return;
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchModal(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSearchModal]);

  useEffect(() => { setShowNotifs(false); setShowSearchModal(false); }, [nav]);

  const showDirtyToast = () => {
    if (dirtyToastTimer.current) clearTimeout(dirtyToastTimer.current);
    setDirtyToast(true);
    dirtyToastTimer.current = setTimeout(() => setDirtyToast(false), 3000);
  };

  const DEMO_IDS = new Set(INITIAL_PATIENTS.map(p => p.id));
  const [dashFilter, setDashFilter] = useState(null);
  const [archiveDashFilter, setArchiveDashFilter] = useState(null);

  useEffect(() => {
    // รอ session bridge เสร็จก่อน (เพื่อให้ Supabase รู้ว่า user คนไหนกำลัง query)
    (window._sbReady || Promise.resolve())
      .then(() => loadPatients())
      .then(data => {
        setPatients([...INITIAL_PATIENTS, ...data]);
        setDbLoading(false);
      });
  }, []);

  // alerts = clinical alerts จากผู้ป่วย + admin alerts (pending users + delete requests)
  const adminAlerts = [
    ...(currentUser?.role === 'admin' && pendingUserCount > 0 ? [{
      id: 'admin-pending-users',
      type: 'warning',
      patient: null,
      patientId: null,
      navTarget: 'admin-users',
      msg: `มี ${pendingUserCount} ผู้ใช้ใหม่รออนุมัติ — คลิกเพื่อจัดการ`,
      time: 'ใหม่',
    }] : []),
    ...(currentUser?.role === 'admin' && pendingDeleteRequests.length > 0 ? [{
      id: 'admin-pending-deletes',
      type: 'warning',
      patient: null,
      patientId: null,
      navTarget: 'trash',
      msg: `มี ${pendingDeleteRequests.length} คำขอลบผู้ป่วยรออนุมัติ — คลิกเพื่อจัดการ`,
      time: 'ใหม่',
    }] : []),
    ...(currentUser?.role === 'admin' && cancelledDeleteCount > 0 ? [{
      id: 'admin-cancelled-deletes',
      type: 'info',
      patient: null,
      patientId: null,
      navTarget: 'trash',
      msg: `มี ${cancelledDeleteCount} คำขอลบที่ผู้ใช้ยกเลิกเองแล้ว — คลิกเพื่อดู`,
      time: 'ล่าสุด',
    }] : []),
    // คำขอแก้ไขข้อมูล — แยกรายตัว กดแล้วไปที่ผู้ใช้คนนั้นในหน้าจัดการผู้ใช้
    ...(currentUser?.role === 'admin'
      ? pendingEditRequests.map(r => {
          const name = `${r.requester?.first_name || ''} ${r.requester?.last_name || ''}`.trim() || 'ผู้ใช้';
          return {
            id: 'admin-edit-req-' + r.id,
            type: 'warning',
            patient: null,
            patientId: null,
            navTarget: 'admin-users',
            highlightUser: r.user_id,
            msg: `${name} ขอแก้ไข "${r.field_label}" — คลิกเพื่อพิจารณา`,
            time: 'ใหม่',
          };
        })
      : []),
  ];
  const userNotifAlerts = userDbNotifs.map(n => {
    const isComment = n.type === 'comment_reply' || n.type === 'comment_mention' || n.type === 'comment_resolved' || n.type === 'comment_new';
    return {
      id: 'user-notif-' + n.id,
      dbNotifId: n.id,
      type: (n.type === 'delete_rejected' || n.type === 'edit_request_rejected') ? 'warning' : 'info',
      patient: n.patient_name || null,
      patientId: (n.type === 'delete_rejected' || n.type === 'delete_restored') ? n.patient_id : null,
      navTarget: isComment ? 'changelog' : null,
      commentVersion: isComment ? n.comment_version : null,
      commentId: isComment ? n.comment_id : null,
      actorName: isComment ? (n.note || null) : null,
      actorId: isComment ? (n.actor_id || null) : null,
      actorAvatarUrl: isComment ? (n.actor_avatar_url || null) : null,
      actorAvatarAt: isComment ? (n.actor_avatar_updated_at || null) : null,
      msg: n.type === 'delete_approved'         ? `Admin อนุมัติลบ "${n.patient_name}" แล้ว`
         : n.type === 'delete_rejected'         ? `Admin ไม่อนุมัติลบ "${n.patient_name}"${n.note ? ` — ${n.note}` : ''}`
         : n.type === 'delete_restored'         ? `Admin กู้คืน "${n.patient_name}" จากถังขยะแล้ว`
         : n.type === 'edit_request_approved'   ? `Admin อนุมัติคำขอแก้ไข "${n.note}" แล้ว`
         : n.type === 'edit_request_rejected'   ? `Admin ไม่อนุมัติคำขอแก้ไข${n.note ? ` "${n.note}"` : ''}`
         : n.type === 'comment_reply'           ? `${n.note} ตอบกลับความคิดเห็นของคุณใน v${n.comment_version}`
         : n.type === 'comment_mention'         ? `${n.note} เรียกคุณในความคิดเห็น v${n.comment_version}`
         : n.type === 'comment_resolved'        ? `${n.note} ปิดประเด็นของคุณใน v${n.comment_version}`
         : n.type === 'comment_new'             ? `${n.note} เขียนความคิดเห็นใหม่ใน v${n.comment_version}`
         : `"${n.patient_name}" ถูกลบถาวรแล้ว`,
      time: new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
    };
  });
  const alerts = [...adminAlerts, ...userNotifAlerts, ...generateAlerts(patients)];
  const unreadCount = alerts.filter(a => !readAlerts.has(a.id)).length;
  const markRead = id => {
    setReadAlerts(s => new Set([...s, id]));
    const notif = userDbNotifs.find(n => 'user-notif-' + n.id === id);
    if (notif) window.markUserNotificationRead(notif.id).catch(() => {});
  };
  const markAllRead = () => {
    setReadAlerts(new Set(alerts.map(a => a.id)));
    userDbNotifs.forEach(n => window.markUserNotificationRead(n.id).catch(() => {}));
  };
  const openFromNotif = p => { setClinical(p); };

  const addPatient = async p => { await savePatient(p); setPatients(ps => [...ps, p]); };
  const updatePatient = async updated => {
    if (!DEMO_IDS.has(updated.id)) await savePatient(updated);
    setPatients(ps => ps.map(p => p.id===updated.id ? updated : p));
    if (clinical?.id === updated.id) setClinical(updated);
  };

  const archivePatient = (p) => {
    updatePatient({ ...p, archived: true });
    setClinical(null);
    setNav('archive-list');
  };

  // ขอลบผู้ป่วย (user ทั่วไป — ส่งให้ admin อนุมัติ)
  const requestDeletePatient = async (patient, reason) => {
    if (!currentUser?.id) return false;
    const ok = await window.submitDeleteRequest(patient.id, currentUser.id, reason);
    if (ok) {
      // Optimistic update — UI เร็วขึ้นทันที ไม่ต้องรอ reload
      setPendingDeleteRequests(prev => [...prev, {
        id: 'temp-' + Date.now(), patient_id: patient.id, reason, status: 'pending',
        patient: { hn: patient.hn, name: patient.name }, requested_by: currentUser.id,
      }]);
      // Fire-and-forget: ส่งเมล + reload จริง background
      fetch('/api/patient/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id, patientName: patient.name, patientHn: patient.hn, reason, requestedBy: currentUser.id }),
      }).catch(() => {});
      window.loadPendingDeleteRequests().then(reqs => setPendingDeleteRequests(reqs));
    }
    return ok;
  };

  // ยกเลิกคำขอลบ (user เจ้าของคำขอเท่านั้น) — ใช้ API route เพื่อ bypass RLS + ส่งเมล Admin
  const cancelDeletePatient = async (patient) => {
    if (!currentUser?.id) return false;
    const res = await fetch('/api/patient/cancel-delete-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id, patientName: patient.name, patientHn: patient.hn }),
    });
    if (!res.ok) return false;
    const reqs = await window.loadMyPendingDeleteRequests(currentUser.id);
    setPendingDeleteRequests(reqs);
    const cancelled = await window.loadCancelledDeleteCount();
    setCancelledDeleteCount(cancelled);
    return true;
  };

  // อนุมัติคำขอลบ (admin เท่านั้น)
  const approveDeleteRequest = async (requestId, patientId, requestedBy, patientName) => {
    if (!currentUser?.id) return false;
    const ok = await window.approveDeleteRequest(requestId, patientId, currentUser.id, '');
    if (ok) {
      setPatients(ps => ps.filter(p => p.id !== patientId));
      const reqs = await window.loadPendingDeleteRequests();
      setPendingDeleteRequests(reqs);
      // ส่งเมลแจ้ง user ที่ขอลบ
      if (requestedBy) {
        fetch('/api/patient/delete-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestedBy, patientName, action: 'approved', patientId }),
        }).catch(() => {});
      }
    }
    return ok;
  };

  // ปฏิเสธคำขอลบ (admin เท่านั้น)
  const rejectDeleteRequest = async (requestId, note, requestedBy, patientName, patientId) => {
    if (!currentUser?.id) return false;
    const ok = await window.rejectDeleteRequest(requestId, currentUser.id, note);
    if (ok) {
      const reqs = await window.loadPendingDeleteRequests();
      setPendingDeleteRequests(reqs);
      // ส่งเมลแจ้ง user ที่ขอลบ
      if (requestedBy) {
        fetch('/api/patient/delete-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestedBy, patientName, action: 'rejected', note, patientId }),
        }).catch(() => {});
      }
    }
    return ok;
  };

  // ลบผู้ป่วย (soft delete — admin เท่านั้น)
  const softDeletePatient = async (patientId, reason) => {
    if (!currentUser?.id) return false;
    const ok = await window.softDeletePatient(patientId, currentUser.id, reason);
    if (!ok) return false;
    setPatients(ps => ps.filter(p => p.id !== patientId));  // เอาออกจาก list ปัจจุบัน
    setClinical(null);  // ปิด clinical modal
    return true;
  };

  // กู้คืนจากถังขยะ (admin เท่านั้น)
  const restorePatient = async (patientId, patientName, requestedBy) => {
    const ok = await window.restorePatient(patientId);
    if (!ok) return false;
    const data = await loadPatients();
    setPatients([...INITIAL_PATIENTS, ...data]);
    // แจ้ง user ที่ขอลบว่ากู้คืนแล้ว
    if (requestedBy && patientName) {
      fetch('/api/patient/delete-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedBy, patientName, action: 'restored', patientId }),
      }).catch(() => {});
    }
    return true;
  };

  // ลบถาวร (admin เท่านั้น) — กู้คืนไม่ได้
  const hardDeletePatient = async (patientId, patientName, requestedBy) => {
    const result = await window.hardDeletePatient(patientId);
    if (!result.ok) return false;
    // แจ้ง user ที่ขอลบว่าลบถาวรแล้ว
    const notifyBy = requestedBy || result.requestedBy;
    if (notifyBy && patientName) {
      fetch('/api/patient/delete-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedBy: notifyBy, patientName, action: 'hard-deleted' }),
      }).catch(() => {});
    }
    return true;
  };

  const handleLogoClick = () => {
    if (formDirty) { showDirtyToast(); return; }
    const next = logoClicks + 1;
    if (next >= 10) {
      setLogoClicks(0);
      if (easterRound === 2) {
        // 🥚 ซนจริง — โดนเตะออก
        setLoggingOut(true);
        fetch('/api/easter-egg/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({event_type:'kicked_out'})}).catch(()=>{});
        fetch('/api/auth/signout', {method:'POST'}).finally(()=>{ window.top.location.href='/login'; });
      }
      else setEasterMsgIdx(0);
    } else {
      setLogoClicks(next);
      setNav('dashboard');
    }
  };
  const closeEasterMsg = () => {
    if (easterMsgIdx < EASTER_MSGS.length - 1) setEasterMsgIdx(i => i + 1);
    else {
      // 🥚 ปลดล็อก easter egg ครั้งแรก — บันทึกไว้ดูเล่นๆ
      fetch('/api/easter-egg/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({event_type:'discovered'})}).catch(()=>{});
      setEasterMsgIdx(-1); setEasterRound(2); setNav('dashboard');
    }
  };

  const navItems = [
    { id:'dashboard',     icon:'fa-chart-pie',        label:'Dashboard' },
    { id:'patient-list',  icon:'fa-users',            label:'ทะเบียนผู้ป่วย Active' },
    { id:'archive-list',  icon:'fa-box-archive',      label:'ทะเบียนจบการรักษา' },
    { id:'weekly-prep',   icon:'fa-calendar-check',   label:'เตรียมเคสรายสัปดาห์' },
    { id:'reports',       icon:'fa-file-contract',    label:'รายงาน & สถิติ' },
    { id:'knowledge',     icon:'fa-book-open-reader', label:'คลังความรู้วัณโรค' },
    { id:'image-library', icon:'fa-images',           label:'คลังรูปภาพ' },
    { id:'settings',      icon:'fa-gear',             label:'ตั้งค่าระบบ', divider:true },
    ...(currentUser?.role === 'admin' ? [{ id:'admin-users', icon:'fa-user-shield', label:'จัดการผู้ใช้', badge: pendingUserCount > 0 ? pendingUserCount : undefined }] : []),
    { id:'trash', icon:'fa-trash', label:'ถังขยะ', badge: currentUser?.role==='admin' && pendingDeleteRequests.length > 0 ? pendingDeleteRequests.length : undefined, greenBadge: currentUser?.role==='admin' && pendingDeleteRequests.length === 0 && cancelledDeleteCount > 0 },
    ...(currentUser?.role === 'admin' ? [{ id:'activity-log', icon:'fa-wave-square', label:'บันทึกกิจกรรม' }] : []),
    ...(currentUser?.role === 'admin' ? [{ id:'audit-log', icon:'fa-clock-rotate-left', label:'ประวัติลบถาวร' }] : []),
    { id:'changelog', icon:'fa-scroll', label:'ประวัติเวอร์ชั่น', divider:true, redDot: changelogUnseen },
  ];
  const titles = { dashboard:'Dashboard', 'patient-list':'ทะเบียนผู้ป่วย Active', 'archive-list':'ทะเบียนจบการรักษา', 'all-patients':'ทะเบียนผู้ป่วยทั้งหมด', 'add-patient':'ลงทะเบียนผู้ป่วยใหม่', 'weekly-prep':'เตรียมเคสรายสัปดาห์', reports:'รายงาน และ สถิติ', knowledge:'คลังความรู้วัณโรค', settings:'ตั้งค่าระบบ', 'admin-users':'จัดการผู้ใช้', trash:'ถังขยะ', 'activity-log':'บันทึกกิจกรรม', 'audit-log':'ประวัติการลบถาวร', changelog:'ประวัติเวอร์ชั่น', 'image-library':'คลังรูปภาพผู้ป่วย' };
  const pageIcons = { dashboard:'fa-chart-pie', 'patient-list':'fa-users', 'archive-list':'fa-box-archive', 'all-patients':'fa-users', 'add-patient':'fa-user-plus', 'weekly-prep':'fa-calendar-check', reports:'fa-file-contract', knowledge:'fa-book-open-reader', settings:'fa-gear', 'admin-users':'fa-user-shield', trash:'fa-trash', 'activity-log':'fa-wave-square', 'audit-log':'fa-clock-rotate-left', changelog:'fa-scroll', 'image-library':'fa-images' };

  // v0.7.17.3 — ขณะ fetch ข้อมูลครั้งแรก คงโครง V2Skeleton ไว้แทน spinner ใจกลาง
  //              (login → V2Skeleton → ของจริง · ไม่ตัดเป็น 2 ขั้น)
  if (dbLoading) {
    return <V2Skeleton />;
  }

  // Clinical view กินทั้งจอ — ซ่อน sidebar + header ทั้งหมด
  if (clinical) {
    return (
      <div className="flex h-screen bg-white overflow-hidden">
        <ClinicalModal patient={clinical} onClose={() => setClinical(null)} onUpdate={updatePatient} settings={settings} onArchive={archivePatient} currentUser={currentUser} onSoftDelete={softDeletePatient} onRequestDelete={requestDeletePatient} onCancelDeleteRequest={cancelDeletePatient} pendingDeleteRequests={pendingDeleteRequests}/>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-teal-50 overflow-hidden">
      {/* v0.7.17.1 — Logout optimistic overlay: เปลี่ยนหน้าทันทีตอนกด → fetch ใต้ดิน → redirect */}
      {loggingOut && (
        <div style={{position:'fixed',inset:0,background:'#f0fdfa',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,zIndex:99999,fontFamily:'Sarabun, sans-serif'}}>
          <div style={{width:56,height:56,border:'4px solid #ccfbf1',borderTopColor:'#0d9488',borderRadius:'50%',animation:'tbSpin 0.8s linear infinite'}}/>
          <div style={{fontSize:14,color:'#0f766e',fontWeight:600}}>กำลังออกจากระบบ...</div>
          <style>{`@keyframes tbSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      {/* v0.7.15.1 — zIndex:40 กันปุ่ม chevron toggle ถูก header (zIndex:30) ทับครึ่ง */}
      <div style={{position:'relative',width:sidebarOpen?'260px':'56px',transition:'width 0.2s ease',flexShrink:0,zIndex:40}} onMouseEnter={()=>setSidebarHovered(true)} onMouseLeave={()=>setSidebarHovered(false)}>
      <aside style={{width:'100%',height:'100%',overflow:'hidden',display:'flex',flexDirection:'column',background:'#fff',borderRight:'1px solid #e5e7eb'}}>

        {/* Header: icon คงที่ + label fade */}
        <div style={{display:'flex',alignItems:'center',height:'64px',padding:'0 10px',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
          <div onClick={handleLogoClick} title="กลับหน้าหลัก" style={{display:'flex',alignItems:'center',flex:1,cursor:'pointer',minWidth:0,height:'100%',borderRadius:'8px',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{width:'56px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:'-10px'}}>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="44" height="36"><path fill="#0d9488" d="M320 0c17.7 0 32 14.3 32 32l0 124.2c-8.5-7.6-19.7-12.2-32-12.2s-23.5 4.6-32 12.2L288 32c0-17.7 14.3-32 32-32zM444.5 195.5c-16.4-16.4-41.8-18.5-60.5-6.1l0-24.1C384 127 415 96 453.3 96c21.7 0 42.8 10.2 55.8 28.8c15.4 22.1 44.3 65.4 71 116.9c26.5 50.9 52.4 112.5 59.6 170.3c.2 1.3 .2 2.6 .2 4l0 7c0 49.1-39.8 89-89 89c-7.3 0-14.5-.9-21.6-2.7l-72.7-18.2c-20.9-5.2-38.7-17.1-51.5-32.9c14 1.5 28.5-3 39.2-13.8l-22.6-22.6 22.6 22.6c18.7-18.7 18.7-49.1 0-67.9c-1.1-1.1-1.4-2-1.5-2.5c-.1-.8-.1-1.8 .4-2.9s1.2-1.9 1.8-2.3c.5-.3 1.3-.8 2.9-.8c26.5 0 48-21.5 48-48s-21.5-48-48-48c-1.6 0-2.4-.4-2.9-.8c-.6-.4-1.3-1.2-1.8-2.3s-.5-2.2-.4-2.9c.1-.6 .4-1.4 1.5-2.5c18.7-18.7 18.7-49.1 0-67.9zM183.3 491.2l-72.7 18.2c-7.1 1.8-14.3 2.7-21.6 2.7c-49.1 0-89-39.8-89-89l0-7c0-1.3 .1-2.7 .2-4c7.2-57.9 33.1-119.4 59.6-170.3c26.8-51.5 55.6-94.8 71-116.9c13-18.6 34-28.8 55.8-28.8C225 96 256 127 256 165.3l0 24.1c-18.6-12.4-44-10.3-60.5 6.1c-18.7 18.7-18.7 49.1 0 67.9c1.1 1.1 1.4 2 1.5 2.5c.1 .8 .1 1.8-.4 2.9s-1.2 1.9-1.8 2.3c-.5 .3-1.3 .8-2.9 .8c-26.5 0-48 21.5-48 48s21.5 48 48 48c1.6 0 2.4 .4 2.9 .8c.6 .4 1.3 1.2 1.8 2.3s.5 2.2 .4 2.9c-.1 .6-.4 1.4-1.5 2.5c-18.7 18.7-18.7 49.1 0 67.9c10.7 10.7 25.3 15.3 39.2 13.8c-12.8 15.9-30.6 27.7-51.5 32.9z"/><path fill="#fbbf24" d="M421.8 421.8c-6.2 6.2-16.4 6.2-22.6 0C375.9 398.5 336 415 336 448c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-33-39.9-49.5-63.2-26.2c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6C241.5 375.9 225 336 192 336c-8.8 0-16-7.2-16-16s7.2-16 16-16c33 0 49.5-39.9 26.2-63.2c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0C264.1 241.5 304 225 304 192c0-8.8 7.2-16 16-16s16 7.2 16 16c0 33 39.9 49.5 63.2 26.2c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6C398.5 264.1 415 304 448 304c8.8 0 16 7.2 16 16s-7.2 16-16 16c-33 0-49.5 39.9-26.2 63.2c6.2 6.2 6.2 16.4 0 22.6z"/><path fill="#e11d48" d="M296 320a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm72 32a16 16 0 1 0 -32 0 16 16 0 1 0 32 0z"/></svg>
            </span>
            <span style={{overflow:'hidden',whiteSpace:'nowrap',fontFamily:"'Manrope', sans-serif",fontWeight:800,fontSize:'17px',color:'#0f766e',letterSpacing:'-0.3px',flex:1,maxWidth:sidebarOpen?'190px':'0px',opacity:sidebarOpen?1:0,transition:'max-width 0.2s ease,opacity 0.15s ease'}}>TB JOURNEY <span style={{fontFamily:"'Plus Jakarta Sans', sans-serif"}}>&amp;</span> CARE</span>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{flex:1,overflowY:'auto',padding:'10px 8px 10px 2px'}}>
          {navItems.map(n => {
            const hasBadge = n.badge && n.badge > 0;
            const hasGreenBadge = !hasBadge && n.greenBadge;
            return (
            <div key={n.id}>
              {n.divider && <div style={{margin:'6px 0',borderTop:'1px solid #f1f5f9'}}></div>}
              <button
                onClick={()=>{
                  if(formDirty && nav==='add-patient' && n.id!=='add-patient'){
                    showDirtyToast(); return;
                  }
                  if (n.external) { window.top.location.href = n.external; return; }
                  setNav(n.id);setLogoClicks(0);if(n.id!=='add-patient')setFormDirty(false);
                  // ล้างป้าย "New" บน sidebar เมื่อเข้าหน้า changelog
                  if (n.id==='changelog') {
                    try { localStorage.setItem('tb_changelog_last_seen', APP_VERSION); } catch {}
                    setChangelogUnseen(false);
                  }
                }}
                title={!sidebarOpen?n.label:undefined}
                style={{display:'flex',width:'100%',alignItems:'center',padding:'9px 8px',borderRadius:'8px',border:'none',cursor:'pointer',marginBottom:'2px',transition:'background 0.15s',background:hasBadge?'#fef2f2':(nav===n.id?'#ccfbf1':'transparent'),fontWeight:nav===n.id||hasBadge?700:500,fontSize:'14px',color:hasBadge?'#b91c1c':(nav===n.id?'#0f766e':'#374151')}}
                onMouseEnter={e=>{if(nav!==n.id&&!hasBadge){e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.color='#0f766e';}}}
                onMouseLeave={e=>{if(nav!==n.id&&!hasBadge){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#374151';}}}
              >
                {/* icon 36px · ล็อกตำแหน่งกลางไว้นิ่งสนิท (marginLeft คงที่ ไม่ขยับตอนเปิด/ปิด) */}
                <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative',marginLeft:'0px'}}>
                  <i className={`fa-solid ${n.icon}`} style={{fontSize:'17px',color:hasBadge?'#dc2626':'#0f766e'}}></i>
                  {n.redDot && <span className="tb-pulse-badge" style={{position:'absolute',top:'2px',right:'4px',width:'8px',height:'8px',background:'#ef4444',borderRadius:'50%',display:'block'}}/>}
                </span>
                <span style={{overflow:'hidden',whiteSpace:'nowrap',maxWidth:sidebarOpen?'160px':'0px',opacity:sidebarOpen?1:0,transition:'max-width 0.2s ease,opacity 0.15s ease',display:'flex',alignItems:'center',gap:'6px'}}>
                  {n.label}
                  {hasBadge && sidebarOpen && <span className="tb-pulse-badge" style={{background:'#ef4444',color:'#fff',fontSize:'10px',fontWeight:700,padding:'1px 7px',borderRadius:'10px'}}>{n.badge}</span>}
                  {hasGreenBadge && sidebarOpen && <span style={{background:'#16a34a',color:'#fff',fontSize:'10px',fontWeight:700,padding:'1px 7px',borderRadius:'10px'}}>{cancelledDeleteCount}</span>}
                  {n.redDot && sidebarOpen && <span style={{background:'#ef4444',color:'#fff',fontSize:'9px',fontWeight:700,padding:'1px 6px',borderRadius:'10px',marginLeft:'auto'}}>New</span>}
                </span>
              </button>
            </div>
          )})}
        </nav>

        {/* User profile */}
        <div style={{borderTop:'1px solid #f1f5f9',padding:'10px 8px',flexShrink:0}}>
          <button onClick={()=>setShowProfile(true)} style={{width:'100%',display:'flex',alignItems:'center',padding:'8px',borderRadius:'10px',cursor:'pointer',transition:'background 0.15s',border:'none',background:'transparent',textAlign:'left'}}
            onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:'-6px'}}>
              <AvatarCircle urlKey={currentUser?.avatarUrl} updatedAt={currentUser?.avatarUpdatedAt} fallback={currentUser?.avatar || '?'} name={currentUser?.fullName} colorKey={currentUser?.id} size={32} fontSize={(currentUser?.avatar||'').length>3?8:11} />
            </span>
            <div style={{overflow:'hidden',maxWidth:sidebarOpen?'160px':'0px',opacity:sidebarOpen?1:0,transition:'max-width 0.2s ease,opacity 0.15s ease',whiteSpace:'nowrap'}}>
              <p style={{fontWeight:700,fontSize:'12px',color:'#1f2937',margin:0}}>{currentUser?.fullName || '—'}</p>
              <p style={{fontSize:'11px',color:'#0f766e',margin:0}}>{currentUser?.profession || ''}</p>
            </div>
          </button>
          {/* ปุ่มออกระบบ — v0.7.17.1: optimistic overlay ทันที + fetch ใต้ดิน */}
          <button
            onClick={()=>{ setLoggingOut(true); fetch('/api/auth/signout', {method:'POST'}).finally(()=>{ window.top.location.href='/login'; }); }}
            title="ออกระบบ"
            style={{width:'100%',display:'flex',alignItems:'center',padding:'7px 8px',borderRadius:'10px',cursor:'pointer',border:'none',background:'transparent',textAlign:'left',marginTop:'2px',transition:'background 0.15s'}}
            onMouseEnter={e=>{ e.currentTarget.style.background='#fef2f2'; e.currentTarget.querySelector('i').style.color='#dc2626'; e.currentTarget.querySelector('span').style.color='#dc2626'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.querySelector('i').style.color='#f87171'; e.currentTarget.querySelector('span').style.color='#9ca3af'; }}
          >
            <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:'-6px'}}>
              <i className="fa-solid fa-right-from-bracket" style={{fontSize:'15px',color:'#f87171',transition:'color 0.15s'}}></i>
            </span>
            <span style={{overflow:'hidden',whiteSpace:'nowrap',maxWidth:sidebarOpen?'160px':'0px',opacity:sidebarOpen?1:0,transition:'max-width 0.2s ease,opacity 0.15s ease,color 0.15s'}}>
              <p style={{fontSize:'12px',fontWeight:700,color:'inherit',margin:0,lineHeight:1.3}}>Log out</p>
              <p style={{fontSize:'10px',fontWeight:500,color:'inherit',margin:0,lineHeight:1.3}}>ออกจากระบบ</p>
            </span>
          </button>
        </div>

        {/* Version info */}
        <div style={{padding:'8px 12px',borderTop:'1px solid #f1f5f9',flexShrink:0,overflow:'hidden'}}>
          {sidebarOpen ? (
            <div onClick={()=>setShowAbout(true)} title="ดูข้อมูลระบบ"
              style={{cursor:'pointer',borderRadius:'8px',padding:'4px 6px',margin:'-4px -6px',transition:'background 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <p style={{fontSize:'10px',color:'#9ca3af',margin:0,whiteSpace:'nowrap'}}>พัฒนาโดย เภสัชกร สิรวิชญ์ เผ่าผา</p>
              <p style={{fontSize:'10px',color:'#9ca3af',margin:'1px 0 0 0',whiteSpace:'nowrap'}}>โรงพยาบาลปรางค์กู่</p>
              <p style={{fontSize:'10px',color:'#d1d5db',margin:'2px 0 0 0',whiteSpace:'nowrap'}}>v{APP_VERSION} ·<span style={{color:'#fbbf24'}}>ยังไม่เผยแพร่</span> <i className="fa-solid fa-circle-info" style={{color:'#9ca3af'}}></i></p>
            </div>
          ) : (
            <div onClick={()=>setShowAbout(true)} title="ดูข้อมูลระบบ" style={{display:'flex',justifyContent:'flex-start',paddingLeft:'10px',cursor:'pointer'}}>
              <i className="fa-solid fa-circle-info" style={{fontSize:'12px',color:'#cbd5e1'}}></i>
            </div>
          )}
        </div>

      </aside>

      {/* Floating chevron toggle — v0.7.15.1: ขอบเทลตลอด + hover เทลทั้งอัน + icon ขาว */}
      <button
        onClick={()=>setSidebarOpen(o=>!o)}
        title={sidebarOpen?'ซ่อนเมนู':'แสดงเมนู'}
        style={{position:'absolute',right:'-10px',top:'20px',width:'24px',height:'24px',borderRadius:'50%',border:'1.5px solid #0d9488',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,transition:'all 0.15s',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}
        onMouseEnter={e=>{ e.currentTarget.style.background='#0d9488'; const icon = e.currentTarget.querySelector('i'); if (icon) icon.style.color='#fff'; }}
        onMouseLeave={e=>{ e.currentTarget.style.background='#fff'; const icon = e.currentTarget.querySelector('i'); if (icon) icon.style.color='#0d9488'; }}
      >
        <i className={`fa-solid ${sidebarOpen?'fa-chevron-left':'fa-chevron-right'}`} style={{fontSize:'9px',color:'#0d9488',transition:'color 0.15s'}}></i>
      </button>

      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white/90 backdrop-blur-md shadow-sm flex items-center gap-3 px-6 border-b border-gray-200 flex-shrink-0" style={{position:'relative',zIndex:30}}>
          <h1 className="text-lg font-bold text-teal-700 whitespace-nowrap flex-shrink-0 flex items-center gap-2">
            <i className={`fa-solid ${pageIcons[nav]||'fa-circle'} text-teal-500`}></i>
            {titles[nav]}
          </h1>

          {/* Patient list controls — แสดงเฉพาะหน้า patient-list */}
          {nav==='patient-list' && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 max-w-xs">
                <input value={ptSearch} onChange={e=>setPtSearch(e.target.value)} placeholder="ค้นหา HN, ชื่อ, ตำบล..."
                  className="w-full py-1.5 pl-8 pr-3 bg-gray-100 rounded-full text-sm focus:ring-2 focus:ring-teal-200 outline-none"/>
                <i className="fa-solid fa-search absolute left-2.5 top-2 text-gray-400 text-xs"></i>
              </div>
              <select value={ptFilter} onChange={e=>setPtFilter(e.target.value)}
                className="py-1.5 px-3 border border-gray-200 rounded-xl bg-white outline-none text-sm text-gray-600 flex-shrink-0">
                <option value="all">สถานะทั้งหมด</option>
                <option value="intensive">Intensive Phase</option>
                <option value="continuation">Continuation Phase</option>
                <option value="critical">Lab ผิดปกติ</option>
              </select>
              <button type="button" onClick={()=>setPtShowColMgr(v=>!v)} title="จัดการคอลัม"
                className={`py-1.5 px-3 border rounded-xl text-sm transition-colors flex-shrink-0 ${ptShowColMgr?'bg-teal-600 text-white border-teal-600':'bg-white text-gray-500 border-gray-200 hover:border-teal-300'}`}>
                <i className="fa-solid fa-table-columns"></i>
              </button>
              <button onClick={()=>setNav('add-patient')}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-xl font-bold text-sm whitespace-nowrap flex-shrink-0 shadow-sm shadow-teal-200 transition-all">
                <i className="fa-solid fa-user-plus mr-1.5"></i>ลงทะเบียนผู้ป่วยใหม่
              </button>
            </div>
          )}

          <div className="relative flex-shrink-0 ml-auto flex items-center gap-0.5">
            {/* Search placeholder button */}
            <div className="relative" ref={searchRef}>
              <button
                onClick={()=>setShowSearchModal(v=>!v)}
                className="relative p-2 text-teal-700 hover:text-teal-900 transition-colors"
                title="ค้นหาทุกอย่าง"
              >
                <i className="fa-solid fa-magnifying-glass text-lg"></i>
              </button>
              {showSearchModal && (
                <div
                  className="notif-modal absolute right-0 top-full mt-2"
                  style={{width:'340px',zIndex:1000}}
                  onClick={e=>e.stopPropagation()}
                >
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                          <i className="fa-solid fa-magnifying-glass text-teal-600 text-sm"></i>
                        </span>
                        <div>
                          <p className="font-bold text-gray-800 text-sm leading-tight">ค้นหาอัจฉริยะ</p>
                          <p className="text-xs text-gray-400">Global Search</p>
                        </div>
                      </div>
                      <button onClick={()=>setShowSearchModal(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
                        <i className="fa-solid fa-xmark text-base"></i>
                      </button>
                    </div>
                    {/* Coming soon banner */}
                    <div className="mx-4 mt-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                      <i className="fa-solid fa-clock text-amber-500 mt-0.5 flex-shrink-0"></i>
                      <div>
                        <p className="text-sm font-bold text-amber-800">ฟังก์ชั่นนี้ยังอยู่ในการพัฒนา</p>
                        <p className="text-xs text-amber-600 mt-0.5">กำลังสร้างระบบค้นหาขั้นสูง — ติดตามอัปเดต</p>
                      </div>
                    </div>
                    {/* Roadmap */}
                    <div className="px-4 pb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Roadmap — จะค้นหาได้</p>
                      <div className="space-y-1">
                        {[
                          {icon:'fa-id-card',bg:'#f0fdfa',color:'#0d9488',label:'ชื่อผู้ป่วย / HN',desc:'ค้นทั้งกำลังรักษาและจบแล้ว'},
                          {icon:'fa-heart-pulse',bg:'#fff1f2',color:'#e11d48',label:'โรคร่วม (HIV, DM, CKD ฯลฯ)',desc:'กรองผู้ป่วยตาม comorbidity'},
                          {icon:'fa-flask',bg:'#f5f3ff',color:'#7c3aed',label:'ผลตรวจ Lab',desc:'เสมหะ, DST, ค่าไต, ตับ'},
                          {icon:'fa-timeline',bg:'#eff6ff',color:'#2563eb',label:'บันทึก Timeline',desc:'ค้นจากข้อความบันทึกรายวัน'},
                          {icon:'fa-bolt',bg:'#fffbeb',color:'#d97706',label:'ผลลัพธ์เป็น popup ทันที',desc:'กดจากผลค้นหาเปิดโปรไฟล์เลย'},
                        ].map(({icon,bg,color,label,desc})=>(
                          <div key={label} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                            <span style={{width:'28px',height:'28px',borderRadius:'8px',background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'2px'}}>
                              <i className={`fa-solid ${icon}`} style={{fontSize:'11px',color}}></i>
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-700 leading-tight">{label}</p>
                              <p className="text-xs text-gray-400">{desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh all data — รีโหลดทั้งเว็บ */}
            <button
              onClick={()=>window.location.reload()}
              title="รีเฟรชข้อมูลทั้งเว็บ"
              className="p-2 text-teal-700 hover:text-teal-900 hover:rotate-180 transition-all duration-500">
              <i className="fa-solid fa-arrows-rotate text-xl"></i>
            </button>

            {/* Bell notification */}
            <div ref={notifRef} className="relative">
              <button onClick={()=>setShowNotifs(!showNotifs)} className="relative p-2 text-teal-700 hover:text-teal-900 transition-colors">
                <i className="fa-regular fa-bell text-xl"></i>
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1 border-2 border-white animate-pulse">{unreadCount}</span>}
              </button>
              {showNotifs && <NotificationPanel
                alerts={alerts} patients={patients} readAlerts={readAlerts}
                onRead={markRead} onReadAll={markAllRead}
                onOpen={p=>{openFromNotif(p);setShowNotifs(false);}}
                onNavTarget={(target, highlight, alert)=>{ setNav(target); if(highlight) setHighlightUserId(highlight); if(alert?.commentId){ setHighlightCommentTarget({ version: alert.commentVersion, commentId: alert.commentId, ts: Date.now() }); } setShowNotifs(false); }}
                onClose={()=>setShowNotifs(false)}
                onExpand={()=>{setShowNotifs(false);setShowFullNotifs(true);}}
              />}
            </div>
          </div>
        </header>

        <div ref={mainScrollRef} style={{ scrollbarGutter: 'stable' }} className={`flex-1 p-6 min-h-0 ${(nav==='patient-list'||nav==='archive-list'||nav==='all-patients')?'overflow-hidden':'overflow-y-auto'}`}>
          {/* v0.7.17.3 — dbLoading ใช้ V2Skeleton early-return ที่ระดับ App แล้ว → ที่นี่ไม่ต้องมี spinner */}
          {!dbLoading && nav==='dashboard'     && <Dashboard patients={patients.filter(p=>!p.archived)} archivePatients={patients.filter(p=>p.archived)} onDashFilter={f=>{setDashFilter(f);setNav('patient-list');}} onGoArchiveDelayed={()=>{setArchiveDashFilter('delayed');setNav('archive-list');}} onGoAllPatients={()=>setNav('all-patients')} onGoArchiveSuccess={()=>{setArchiveDashFilter('success');setNav('archive-list');}} onOpen={setClinical} onOpenStorage={()=>{window._settingsWantTab='storage';setNav('settings');}} currentUser={currentUser}/>}
          {!dbLoading && nav==='all-patients'  && <AllPatientsPage patients={patients.filter(p=>!p.archived)} archivePatients={patients.filter(p=>p.archived)} onOpen={setClinical} onBack={()=>setNav('dashboard')}/>}
          {!dbLoading && nav==='patient-list'  && <PatientList patients={patients.filter(p=>!p.archived)} onAdd={addPatient} onOpen={setClinical} settings={settings} dashFilter={dashFilter} onClearDashFilter={()=>setDashFilter(null)} search={ptSearch} filter={ptFilter} showColMgr={ptShowColMgr} onToggleColMgr={()=>setPtShowColMgr(v=>!v)} onArchive={archivePatient}/>}
          {!dbLoading && nav==='archive-list'  && <ArchiveList patients={patients.filter(p=>p.archived)} onOpen={setClinical} archiveDashFilter={archiveDashFilter} onClearArchiveDashFilter={()=>setArchiveDashFilter(null)}/>}
          {!dbLoading && nav==='add-patient'   && <AddPatientPage onBack={()=>{setFormDirty(false);setNav('patient-list');}} onAdd={p=>{addPatient(p);setFormDirty(false);setNav('patient-list');}} settings={settings} onDirtyChange={setFormDirty}/>}
          {!dbLoading && nav==='weekly-prep'   && <WeeklyPrep patients={patients.filter(p=>!p.archived)} onOpen={setClinical}/>}
          {!dbLoading && nav==='reports'       && <Reports patients={patients}/>}
          {!dbLoading && nav==='knowledge'     && <KnowledgeBase/>}
          {!dbLoading && nav==='image-library' && <ImageLibraryPage currentUser={currentUser}/>}
          {!dbLoading && nav==='settings'      && <AdminSettings settings={settings} setSettings={setSettings} setNav={setNav} currentUser={currentUser}/>}
          {!dbLoading && nav==='admin-users'   && <AdminUsersTab currentUser={currentUser} onPendingChange={setPendingUserCount} highlightUserId={highlightUserId} onClearHighlight={()=>setHighlightUserId(null)}/>}
          {!dbLoading && nav==='trash'         && <TrashHub currentUser={currentUser} onRestore={restorePatient} onHardDelete={hardDeletePatient} pendingDeleteRequests={pendingDeleteRequests} onApproveDelete={approveDeleteRequest} onRejectDelete={rejectDeleteRequest} onAcknowledgeCancelled={async () => { await window.acknowledgeCancelledRequests(); setCancelledDeleteCount(0); }}/>}
          {!dbLoading && nav==='activity-log'  && <ActivityLogTab/>}
          {!dbLoading && nav==='audit-log'     && <AuditLogTab/>}
          {!dbLoading && nav==='changelog'     && <ChangelogPage highlightCommentTarget={highlightCommentTarget} onClearHighlight={()=>setHighlightCommentTarget(null)}/>}
        </div>
        <StorageAlert currentUser={currentUser}/>
        {/* v0.7.17.3 — Floating Scroll up/down (มองเฉพาะหน้าที่ scroll ของ main content) */}
        <ScrollNav getContainer={() => mainScrollRef.current} />
      </main>

      {/* Dirty form toast */}
      {dirtyToast && (
        <div style={{position:'fixed',top:'80px',left:'50%',transform:'translateX(-50%)',background:'#fffbeb',color:'#92400e',padding:'12px 24px',borderRadius:'12px',zIndex:9999,fontSize:'14px',fontWeight:600,boxShadow:'0 4px 20px rgba(0,0,0,0.15)',border:'1.5px solid #f59e0b',display:'flex',alignItems:'center',gap:'10px',whiteSpace:'nowrap'}}>
          <i className="fa-solid fa-triangle-exclamation" style={{color:'#f59e0b'}}></i>
          กรุณาบันทึกข้อมูลก่อน
        </div>
      )}

      {/* Easter egg popup */}
      {easterMsgIdx >= 0 && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="modal-A" style={{background:'#fff',borderRadius:'24px',padding:'48px 40px',maxWidth:'380px',width:'90%',textAlign:'center',boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}}>
            <div style={{fontSize:'56px',marginBottom:'16px'}}>🫁</div>
            <p style={{fontSize:'22px',fontWeight:700,color:'#0f766e',marginBottom:'32px',lineHeight:1.4}}>{EASTER_MSGS[easterMsgIdx]}</p>
            <button onClick={closeEasterMsg} style={{width:'44px',height:'44px',borderRadius:'50%',border:'none',background:'#f1f5f9',cursor:'pointer',fontSize:'18px',color:'#6b7280',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#e2e8f0'} onMouseLeave={e=>e.currentTarget.style.background='#f1f5f9'}>✕</button>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfile && <UserProfileModal onClose={()=>setShowProfile(false)}/>}
      {showAbout && <AboutModal onClose={()=>setShowAbout(false)} onShowChangelog={()=>{setShowAbout(false);setNav('changelog');}}/>}
      {/* Notification Full Modal */}
      {showFullNotifs && <NotificationFullModal
        alerts={alerts} patients={patients} readAlerts={readAlerts}
        onRead={markRead} onReadAll={markAllRead}
        onOpen={p=>{openFromNotif(p);}}
        onNavTarget={(target, highlight, alert)=>{ setNav(target); if(highlight) setHighlightUserId(highlight); if(alert?.commentId){ setHighlightCommentTarget({ version: alert.commentVersion, commentId: alert.commentId, ts: Date.now() }); } setShowFullNotifs(false); }}
        onClose={()=>setShowFullNotifs(false)}
      />}

      {/* v0.7.14.7 — Modal เตือนเมื่อมี draft ค้าง กดออกจากหน้า Changelog */}
      {pendingLeave && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',backdropFilter:'blur(2px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}
          onClick={()=>setPendingLeave(null)}>
          <div onClick={e=>e.stopPropagation()} className="modal-A"
            style={{background:'#fff',borderRadius:'14px',padding:'22px 24px',maxWidth:'400px',width:'100%',textAlign:'center',boxShadow:'0 20px 50px rgba(0,0,0,0.25)'}}>
            <i className="fa-solid fa-triangle-exclamation" style={{fontSize:'34px',color:'#f59e0b',marginBottom:'12px',display:'block'}}></i>
            <p style={{fontSize:'15px',fontWeight:700,color:'#1f2937',margin:'0 0 6px'}}>มีข้อความที่ยังไม่ได้ส่ง</p>
            <p style={{fontSize:'12.5px',color:'#6b7280',margin:'0 0 16px',lineHeight:1.5}}>ออกจากหน้านี้แล้วข้อความที่กำลังพิมพ์จะหาย ต้องการออกไปหรืออยู่ต่อ</p>
            <div style={{display:'flex',gap:'8px'}}>
              <button type="button" onClick={()=>setPendingLeave(null)}
                style={{flex:1,padding:'10px',borderRadius:'8px',border:'1px solid #0d9488',background:'#fff',color:'#0f766e',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
                อยู่ต่อ
              </button>
              <button type="button" onClick={()=>{ window._hasUnsentChangelogDraft = false; const t = pendingLeave; setPendingLeave(null); setNavRaw(t); }}
                style={{flex:1,padding:'10px',borderRadius:'8px',border:'none',background:'#ef4444',color:'#fff',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
                ออกไป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ใช้บัญชีกลางจาก tb-data.js (window.TB_PROFESSIONS) — แหล่งเดียวกับ lib/professions.ts ฝั่งเซิร์ฟเวอร์
const PROFESSIONS = window.TB_PROFESSIONS;

// DEPARTMENTS, HOSPITAL_TYPES ย้ายไป parts/account.jsx (เฟส 6)
const DEMO_USER = {
  // identity (read-only)
  username: 'sirawit.p',
  email: 'sirawit.p@pranggku.go.th',
  role: 'Admin',
  since: '1 ต.ค. 2567',
  // self-editable
  phone: '089-980-8521',
  department: 'กลุ่มงานเภสัชกรรม',
  // admin-approval required
  firstName: 'สิรวิชญ์',
  lastName: 'เผ่าผา',
  profession: 'pharmacist',
  licenseNumber: '12345',
  hospitalName: 'โรงพยาบาลปรางค์กู่',
  hospitalType: 'โรงพยาบาลชุมชน (ระดับ F2)',
};

// ───── Sub-modal: ส่งคำขอแก้ไขข้อมูล (admin approval) ─────
// RequestEditModal ย้ายไป parts/account.jsx (เฟส 6)

// ───── About / เกี่ยวกับระบบ Modal ─────
// ⚠️ BUILD_DATE ต้องอัปเดตทุกครั้งที่ push version ใหม่ (คู่กับเลข version)
const APP_VERSION = '0.7.19.6.18';
const BUILD_DATE = '3 ก.ค. 2569';
// bridge: ให้ parts/* (เช่น changelog.jsx, about.jsx) อ่านเวอร์ชันผ่าน window.* ได้ (เฟส 2 + แยกรอบ 2)
if (typeof window !== 'undefined') { window.APP_VERSION = APP_VERSION; window.BUILD_DATE = BUILD_DATE; }
// AboutModal ย้ายไป parts/about.jsx (แยกรอบ 2)
export default App
