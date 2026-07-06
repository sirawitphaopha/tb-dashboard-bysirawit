'use client'
/**
 * parts/misc.jsx — domain: หน้าเบ็ดเตล็ด (misc)
 * ย้ายจาก tb-monolith.jsx (เฟส 4) — โค้ดเดิม ไม่แก้ logic
 *   - TrashList     : ถังขยะผู้ป่วย (กู้คืน/ลบถาวร/อนุมัติคำขอลบ) — ใช้ window.loadTrashedPatients / window._sb
 *   - KnowledgeBase : คลังความรู้วัณโรค (การ์ดแนวทาง/บทความ — self-contained)
 */
import * as React from 'react'
const { useState, useEffect } = React

// ═══════════════ TrashList — ถังขยะผู้ป่วย ═══════════════
function TrashList({ currentUser, onRestore, onHardDelete, pendingDeleteRequests, onApproveDelete, onRejectDelete, onAcknowledgeCancelled }) {
  const [items, setItems] = useState([]);
  // v0.7.17.1 — Lazy render
  const [visibleTrashCount, setVisibleTrashCount] = useState(30);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);     // id ที่กำลังทำงาน (loading)
  const [hardDelTarget, setHardDelTarget] = useState(null);  // patient ที่จะลบถาวร
  const [confirmHn, setConfirmHn] = useState('');
  const [confirmCheck, setConfirmCheck] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  const refresh = async () => {
    setLoading(true);
    const data = await window.loadTrashedPatients();
    setItems(data);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  // ── คำขอลบ + cancelled ──
  const [reqActionId, setReqActionId] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreError, setRestoreError] = useState('');
  const [cancelledRequests, setCancelledRequests] = useState([]);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await window._sb.from('tb_delete_requests')
        .select('*, patient:tb_patients(hn, name), requester:profiles!requested_by(first_name, last_name)')
        .eq('status', 'cancelled')
        .gte('requested_at', since)
        .order('requested_at', { ascending: false });
      setCancelledRequests(data || []);
    })();
  }, []);

  const handleApprove = async () => {
    if (!approveTarget) return;
    const name = approveTarget.patient?.name || approveTarget.patient_id;
    setReqActionId(approveTarget.id);
    await onApproveDelete(approveTarget.id, approveTarget.patient_id, approveTarget.requested_by, name);
    setReqActionId(null);
    setApproveTarget(null);
    refresh();
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const name = rejectTarget.patient?.name || rejectTarget.patient_id;
    setReqActionId(rejectTarget.id);
    await onRejectDelete(rejectTarget.id, rejectNote, rejectTarget.requested_by, name, rejectTarget.patient_id);
    setReqActionId(null);
    setRejectTarget(null);
    setRejectNote('');
  };

  // คำนวณวันที่เหลือ (60 - days since deleted_at)
  const daysLeft = (deletedAt) => {
    if (!deletedAt) return 60;
    const elapsed = Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000);
    return Math.max(0, 60 - elapsed);
  };

  const isValidReason = t => t.trim().length >= 3 && /[a-zA-Zก-๙]/.test(t.trim());

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setActionId(restoreTarget.id);
    setRestoreError('');
    const ok = await onRestore(restoreTarget.id, restoreTarget.name, restoreTarget.requestedBy);
    setActionId(null);
    if (ok) { setRestoreTarget(null); refresh(); }
    else setRestoreError('กู้คืนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  };

  const handleConfirmHardDelete = async () => {
    if (!hardDelTarget) return;
    setActionId(hardDelTarget.id);
    const ok = await onHardDelete(hardDelTarget.id, hardDelTarget.name, hardDelTarget.requestedBy);
    setActionId(null);
    if (ok) {
      setHardDelTarget(null);
      setConfirmHn(''); setConfirmCheck(false);
      refresh();
    } else {
      alert('ลบถาวรไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Section คำขอลบ (admin เท่านั้น) ── */}
      {isAdmin && pendingDeleteRequests && pendingDeleteRequests.length > 0 && (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-paper-plane text-red-600 text-xl mt-0.5"></i>
              <div>
                <p className="font-bold text-red-800 text-sm">คำขอลบผู้ป่วย — รออนุมัติ ({pendingDeleteRequests.length} รายการ)</p>
                <p className="text-xs text-red-700 mt-0.5">ผู้ใช้ขอลบผู้ป่วยออกจากระบบ — กรุณาพิจารณาอนุมัติหรือปฏิเสธ</p>
              </div>
            </div>
          </div>
          {pendingDeleteRequests.map(req => (
            <div key={req.id} className="bg-white border border-red-200 rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <i className="fa-solid fa-user-minus text-sm"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm">
                  {req.patient?.name || 'ไม่ทราบชื่อ'}
                  {req.patient?.hn && <span className="text-xs text-gray-400 font-mono ml-2">HN: {req.patient.hn}</span>}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  ขอลบเมื่อ {new Date(req.requested_at).toLocaleDateString('th-TH',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                </p>
                <p className="text-xs text-gray-700 mt-1 italic">เหตุผล: {req.reason}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button type="button" disabled={reqActionId===req.id} onClick={()=>setApproveTarget(req)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200 disabled:opacity-50">
                  {reqActionId===req.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}อนุมัติ
                </button>
                <button type="button" disabled={reqActionId===req.id} onClick={()=>{ setRejectTarget(req); setRejectNote(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 disabled:opacity-50">
                  <i className="fa-solid fa-xmark"></i>ปฏิเสธ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Section คำขอที่ยกเลิกแล้ว (admin เท่านั้น) ── */}
      {isAdmin && cancelledRequests.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-ban text-gray-400 text-sm"></i>
              <p className="text-xs font-bold text-gray-400">คำขอที่ถูกยกเลิกโดยผู้ใช้ ({cancelledRequests.length} รายการ)</p>
            </div>
            {onAcknowledgeCancelled && (
              <button
                onClick={onAcknowledgeCancelled}
                className="text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-lg transition-colors"
              >
                รับทราบทั้งหมด
              </button>
            )}
          </div>
          {cancelledRequests.map(req => {
            const requesterName = req.requester
              ? `${req.requester.first_name || ''} ${req.requester.last_name || ''}`.trim() || 'ผู้ใช้'
              : (req.requester_name_at_request
                  ? `${req.requester_name_at_request} (ผู้ใช้ถูกลบออกจากระบบแล้ว)`
                  : 'ผู้ใช้ไม่ทราบ')
            return (
              <div key={req.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3 opacity-70">
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                  <i className="fa-solid fa-ban text-xs"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">
                    {req.patient?.name || 'ไม่ทราบชื่อ'}
                    {req.patient?.hn && <span className="text-xs text-gray-400 font-mono ml-2">HN: {req.patient.hn}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">ขอโดย {requesterName} — เหตุผลเดิม: {req.reason}</p>
                </div>
                <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-gray-200 text-gray-500">
                  ผู้ใช้ยกเลิกแล้ว
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Section ถังขยะปกติ ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <i className="fa-solid fa-trash text-amber-600 text-xl mt-0.5"></i>
          <div>
            <p className="font-bold text-amber-800 text-sm">ถังขยะ — ผู้ป่วยที่ถูกลบ</p>
            <p className="text-xs text-amber-700 mt-0.5">เก็บไว้ 60 วัน หลังจากนั้นจะลบถาวรอัตโนมัติ · กู้คืน/ลบถาวร = Admin เท่านั้น</p>
            {!isAdmin && <p className="text-xs text-amber-800 mt-1.5 font-medium"><i className="fa-solid fa-circle-info mr-1"></i>หากเปลี่ยนใจต้องการกู้คืนข้อมูล กรุณาติดต่อ Admin ภายใน 60 วัน ที่ <a href="mailto:siravitphoapha9928@gmail.com" className="underline font-bold">siravitphoapha9928@gmail.com</a></p>}
          </div>
        </div>
      </div>

      {loading && <p className="text-center text-gray-400 py-10"><i className="fa-solid fa-spinner fa-spin mr-2"></i>กำลังโหลด...</p>}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <i className="fa-solid fa-inbox text-5xl mb-3 block"></i>
          <p className="text-sm">ถังขยะว่าง</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.slice(0, visibleTrashCount).map(p => {
            const left = daysLeft(p.deletedAt);
            const isBusy = actionId === p.id;
            return (
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 font-bold flex-shrink-0">{(p.firstName||p.name||'?').substring(0,1)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{p.name} <span className="text-xs text-gray-400 font-mono ml-2">HN: {p.hn}</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ลบเมื่อ {new Date(p.deletedAt).toLocaleDateString('th-TH',{year:'numeric',month:'short',day:'numeric'})} ·
                    เหลือ <strong className={left<=7?'text-red-600':'text-amber-700'}>{left} วัน</strong>
                  </p>
                  {p.deleteReason && <p className="text-xs text-gray-600 mt-1 italic">เหตุผล: {p.deleteReason}</p>}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button type="button" disabled={isBusy} onClick={()=>{ setRestoreTarget(p); setRestoreError(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold border border-teal-200 disabled:opacity-50">
                      <i className="fa-solid fa-rotate-left"></i>กู้คืน
                    </button>
                    <button type="button" disabled={isBusy} onClick={()=>{ setHardDelTarget(p); setConfirmHn(''); setConfirmCheck(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200 disabled:opacity-50">
                      <i className="fa-solid fa-fire"></i>ลบถาวร
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {items.length > visibleTrashCount && (
            <div className="text-center pt-2">
              <button type="button" onClick={()=>setVisibleTrashCount(c=>c+30)}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-1.5 rounded-full transition-colors">
                <i className="fa-solid fa-chevron-down mr-1.5"></i>
                ดูถังขยะเพิ่มอีก {Math.min(30, items.length - visibleTrashCount)} รายการ
                <span className="text-gray-400 font-normal ml-2">({visibleTrashCount} / {items.length})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Dialog ลบถาวร: พิมพ์ HN + checkbox ── */}
      {hardDelTarget && (
        <div className="fixed inset-0 tb-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><i className="fa-solid fa-fire"></i></div>
              <h3 className="font-bold text-gray-800">ลบถาวร "{hardDelTarget.name}"</h3>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-900">
              <p className="font-bold mb-1"><i className="fa-solid fa-triangle-exclamation mr-1"></i>คำเตือน — กู้คืนไม่ได้</p>
              <p>ข้อมูลทั้งหมดของผู้ป่วยจะถูกลบออกจากระบบถาวร — กู้คืนไม่ได้แล้ว</p>
              <p className="mt-1">(จะมีการบันทึก audit log: ใคร/เมื่อไหร่/HN/ชื่อ ไว้ตรวจสอบ)</p>
            </div>

            <label className="block text-xs font-bold text-gray-700 mb-1">พิมพ์ HN เพื่อยืนยัน: <span className="font-mono text-red-600">{hardDelTarget.hn}</span></label>
            <input value={confirmHn} onChange={e=>setConfirmHn(e.target.value)} placeholder="พิมพ์ HN ที่นี่"
              className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 mb-3"/>

            <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer mb-4">
              <input type="checkbox" checked={confirmCheck} onChange={e=>setConfirmCheck(e.target.checked)} className="mt-0.5"/>
              <span>ข้าพเจ้าเข้าใจว่าข้อมูลนี้จะถูกลบถาวรและกู้คืนไม่ได้</span>
            </label>

            <div className="flex gap-2">
              <button type="button" onClick={handleConfirmHardDelete}
                disabled={confirmHn !== hardDelTarget.hn || !confirmCheck || actionId===hardDelTarget.id}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold">
                {actionId===hardDelTarget.id ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังลบ...</> : 'ลบถาวร'}
              </button>
              <button type="button" onClick={()=>setHardDelTarget(null)} disabled={actionId===hardDelTarget.id}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog กู้คืนผู้ป่วย ── */}
      {restoreTarget && (
        <div className="fixed inset-0 tb-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                <i className="fa-solid fa-rotate-left text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">ยืนยันกู้คืนผู้ป่วย</h3>
                <p className="text-xs text-gray-400">ผู้ป่วยจะกลับมาอยู่ในระบบตามปกติ</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
              <p className="text-sm font-bold text-gray-800">{restoreTarget.name}</p>
              {restoreTarget.hn && <p className="text-xs text-gray-400 font-mono">HN: {restoreTarget.hn}</p>}
            </div>
            {restoreError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3"><i className="fa-solid fa-triangle-exclamation mr-1"></i>{restoreError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={handleRestore} disabled={actionId===restoreTarget.id}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors">
                {actionId===restoreTarget.id ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังกู้คืน...</> : 'ยืนยันกู้คืน'}
              </button>
              <button type="button" onClick={()=>setRestoreTarget(null)} disabled={actionId===restoreTarget.id}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog อนุมัติลบ ── */}
      {approveTarget && (
        <div className="fixed inset-0 tb-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <i className="fa-solid fa-trash text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">ยืนยันอนุมัติลบผู้ป่วย</h3>
                <p className="text-xs text-gray-400">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
              <p className="text-sm font-bold text-gray-800">{approveTarget.patient?.name || approveTarget.patient_id}</p>
              {approveTarget.patient?.hn && <p className="text-xs text-gray-400 font-mono">HN: {approveTarget.patient.hn}</p>}
              <p className="text-xs text-gray-500 mt-1">เหตุผลที่ขอลบ: <span className="italic">{approveTarget.reason}</span></p>
            </div>
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
              <i className="fa-solid fa-triangle-exclamation mr-1"></i>
              ผู้ป่วยจะถูกย้ายเข้าถังขยะ และลบถาวรอัตโนมัติหลัง 60 วัน
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={handleApprove} disabled={reqActionId===approveTarget.id}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors">
                {reqActionId===approveTarget.id ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังดำเนินการ...</> : 'ยืนยันอนุมัติลบ'}
              </button>
              <button type="button" onClick={()=>setApproveTarget(null)} disabled={reqActionId===approveTarget.id}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog ปฏิเสธคำขอลบ ── */}
      {rejectTarget && (
        <div className="fixed inset-0 tb-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600"><i className="fa-solid fa-xmark"></i></div>
              <h3 className="font-bold text-gray-800">ปฏิเสธคำขอลบ</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">ผู้ป่วย: <strong>{rejectTarget.patient?.name || rejectTarget.patient_id}</strong> · เหตุผลที่ขอลบ: <em>{rejectTarget.reason}</em></p>
            <label className="block text-xs font-bold text-gray-700 mb-1">เหตุผลที่ปฏิเสธ <span className="text-red-500">*</span></label>
            <textarea value={rejectNote} onChange={e=>setRejectNote(e.target.value)} rows={2}
              placeholder="เช่น ยังอยู่ในระหว่างการรักษา, ข้อมูลถูกต้องแล้ว"
              className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"/>
            {rejectNote.trim().length > 0 && !isValidReason(rejectNote) && (
              <p className="text-xs text-red-500 mt-1">กรุณาระบุเหตุผลเป็นข้อความ (ไม่ใช่ตัวเลขหรืออักขระพิเศษเท่านั้น)</p>
            )}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleReject} disabled={!isValidReason(rejectNote)||reqActionId===rejectTarget.id}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold">
                {reqActionId===rejectTarget.id ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังส่ง...</> : 'ยืนยันปฏิเสธ'}
              </button>
              <button type="button" onClick={()=>setRejectTarget(null)} disabled={reqActionId===rejectTarget.id} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════ KnowledgeBase — คลังความรู้วัณโรค ═══════════════
function KnowledgeBase({ onOpenPdf }) {
  const [activeTab, setActiveTab] = useState('all');

  const GUIDELINES = [
    { title:'แนวทางการรักษาวัณโรค (NTBC 2021)', desc:'แนวทางการดูแลรักษาผู้ป่วยวัณโรคของประเทศไทย ฉบับปรับปรุง', icon:'fa-book-medical', color:'text-teal-600', bg:'bg-teal-50' },
    { title:'WHO TB Treatment Guidelines 2022', desc:'มาตรฐานการรักษาสากลขององค์การอนามัยโลก', icon:'fa-globe', color:'text-blue-600', bg:'bg-blue-50' },
    { title:'แนวทางการรักษา MDR-TB / XDR-TB', desc:'การจัดการวัณโรคดื้อยาหลายขนาน และดื้อยาอย่างกว้างขวาง', icon:'fa-shield-virus', color:'text-red-600', bg:'bg-red-50' },
    { title:'Latent TB Infection (LTBI)', desc:'การตรวจคัดกรองและรักษาวัณโรคแฝง ในกลุ่มเสี่ยง', icon:'fa-magnifying-glass', color:'text-amber-600', bg:'bg-amber-50' },
  ];

  const ARTICLES = [
    { title:'HRZE: ยาสายแรกมาตรฐาน', desc:'กลไก ขนาดยา ผลข้างเคียง และการติดตามผู้ป่วย', icon:'fa-capsules', color:'text-teal-600', bg:'bg-teal-50' },
    { title:'Bedaquiline (Bdq) ในการรักษา MDR-TB', desc:'ยาใหม่สำหรับวัณโรคดื้อยา — ข้อบ่งใช้ ความปลอดภัย QTc', icon:'fa-flask', color:'text-purple-600', bg:'bg-purple-50' },
    { title:'ปรับขนาดยาในผู้ป่วยไตบกพร่อง', desc:'การคำนวณขนาดยา TB เมื่อ eGFR ลดลง พร้อมตารางอ้างอิง', icon:'fa-filter-circle-xmark', color:'text-orange-600', bg:'bg-orange-50' },
    { title:'Drug Interaction ที่พบบ่อยในคลินิก TB', desc:'ปฏิกิริยาระหว่างยา TB กับยาอื่น — Rifampicin enzyme induction', icon:'fa-pills', color:'text-pink-600', bg:'bg-pink-50' },
    { title:'TB/HIV Co-infection', desc:'การดูแลผู้ป่วยวัณโรคร่วมกับ HIV — timing ของ ART', icon:'fa-virus', color:'text-red-600', bg:'bg-red-50' },
    { title:'Drug-induced Hepatotoxicity', desc:'การติดตามตับและจัดการ DILI จากยา TB ในทางปฏิบัติ', icon:'fa-triangle-exclamation', color:'text-amber-600', bg:'bg-amber-50' },
  ];

  const tabs = [
    { id:'all', label:'ทั้งหมด' },
    { id:'guideline', label:'แนวทางการรักษา' },
    { id:'article', label:'บทความเรื่องยา' },
  ];

  const Card = ({ item }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-teal-200 transition-all group cursor-pointer flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
          <i className={`fa-solid ${item.icon} ${item.color}`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm leading-snug group-hover:text-teal-700 transition-colors">{item.title}</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium">เร็วๆ นี้</span>
        <span className="text-xs text-gray-300 flex items-center gap-1"><i className="fa-solid fa-lock text-xs"></i>ยังไม่เปิด</span>
      </div>
    </div>
  );

  const shown = { all:[...GUIDELINES,...ARTICLES], guideline:GUIDELINES, article:ARTICLES }[activeTab];

  return (
    <div className="space-y-6 tb-fade">

      {/* Hero */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <i className="fa-solid fa-book-open-reader text-2xl opacity-90"></i>
          <h2 className="text-xl font-bold">คลังความรู้วัณโรค</h2>
        </div>
        <p className="text-teal-100 text-sm">แนวทางการรักษา · บทความเรื่องยา · ข้อมูลอ้างอิงทางคลินิก<br/>สำหรับเภสัชกรและบุคลากรสาธารณสุข โรงพยาบาลปรางค์กู่</p>
        <div className="flex gap-4 mt-4">
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <p className="text-lg font-bold">{GUIDELINES.length}</p>
            <p className="text-xs text-teal-100">แนวทาง</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <p className="text-lg font-bold">{ARTICLES.length}</p>
            <p className="text-xs text-teal-100">บทความ</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <p className="text-lg font-bold">0</p>
            <p className="text-xs text-teal-100">วิดีโอ</p>
          </div>
        </div>
      </div>

      {/* เข้าคลังเอกสาร PDF (ระบบใหม่ v0.8) */}
      <div className="bg-white rounded-2xl border border-teal-100 p-5 flex items-center gap-4 flex-wrap shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-file-pdf text-white text-xl"></i>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-base">คลังเอกสาร PDF</p>
          <p className="text-xs text-gray-500 mt-0.5">แนวทางการรักษา · งานวิจัย/Trial เก็บไฟล์ PDF อ่านได้เลยในเว็บ</p>
        </div>
        <button onClick={onOpenPdf} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
          <i className="fa-solid fa-folder-open"></i>เปิดคลัง PDF
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab===t.id?'bg-teal-600 text-white shadow-sm':'bg-white text-gray-500 border border-gray-200 hover:border-teal-300 hover:text-teal-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Section: แนวทาง */}
      {(activeTab==='all'||activeTab==='guideline') && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-book-medical text-teal-500"></i>แนวทางการรักษา
          </h3>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {GUIDELINES.map((g,i) => <Card key={i} item={g}/>)}
          </div>
        </div>
      )}

      {/* Section: บทความยา */}
      {(activeTab==='all'||activeTab==='article') && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-pills text-teal-500"></i>บทความเรื่องยา
          </h3>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {ARTICLES.map((a,i) => <Card key={i} item={a}/>)}
          </div>
        </div>
      )}

    </div>
  );
}

export { TrashList, KnowledgeBase }
