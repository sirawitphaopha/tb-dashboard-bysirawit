'use client'
/** patient-modal/pharm-summary.jsx — PharmSummaryTab (สรุปเภสัช + delete workflow) (แยกรอบ 3) */
import * as React from 'react'
const { useState } = React
import { DRP_TYPES, ADR_LIST, migrateAdr } from '../globals'

function PharmSummaryTab({ patient, currentUser, onSoftDelete, onRequestDelete, onCancelDeleteRequest, pendingDeleteRequests }) {
  const visits = patient.visits || [];
  const consults = visits.filter(v => v.consult?.type);
  const drps = visits.flatMap(v => (v.drp||[]).map(d => ({...d, date:v.date})));
  const safeAdr = migrateAdr(patient.adr);
  const adrFound = ADR_LIST.filter(a => safeAdr[a.key]?.checked);

  // ── ระบบลบผู้ป่วย ──
  const isAdmin = currentUser?.role === 'admin';
  const hasPendingRequest = (pendingDeleteRequests||[]).some(r => r.patient_id === patient.id);
  const [deleteStep, setDeleteStep] = useState(0);  // 0=ปิด, 1=ใส่เหตุผล, 2=ยืนยัน60วัน
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const handleConfirmDelete = async () => {
    setDeleting(true);
    const ok = await onSoftDelete(patient.id, deleteReason.trim());
    setDeleting(false);
    if (!ok) alert('ลบไม่สำเร็จ — ลองอีกครั้งหรือเช็ค console');
  };

  // ── ระบบขอลบ (user ทั่วไป) ──
  const [requestStep, setRequestStep] = useState(0);  // 0=ปิด, 1=ใส่เหตุผล, 2=ยืนยัน
  const [requestReason, setRequestReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const handleCancelRequest = async () => {
    if (!onCancelDeleteRequest) return;
    setCancelling(true);
    setShowCancelConfirm(false);
    await onCancelDeleteRequest(patient);
    setCancelling(false);
  };
  const isValidReason = t => t.trim().length >= 3 && /[a-zA-Zก-๙]/.test(t.trim());
  const handleSubmitDeleteRequest = async () => {
    setRequesting(true);
    const ok = await onRequestDelete(patient, requestReason.trim());
    setRequesting(false);
    if (ok) { setRequestStep(0); }
    else alert('ส่งคำขอไม่สำเร็จ — ลองอีกครั้ง');
  };

  const exportCSV = () => {
    const rows = [['วันที่','BW','Vitals','ขนาดยา','Consult Type','Consult Note','DRP Code','DRP Note']];
    visits.forEach(v => {
      const vitalsStr = v.vitals?Object.entries(v.vitals).filter(([,val])=>val).map(([k,val])=>k+'='+val).join(' '):'';
      const hasDrp = (v.drp||[]).length > 0;
      const drpList = hasDrp ? v.drp : [{type:'',note:''}];
      drpList.forEach((d,i) => {
        rows.push([v.date, i===0?(v.weight||''):'', i===0?vitalsStr:'', i===0?(v.drugDoses||''):'', i===0?(v.consult?.type||''):'', i===0?(v.consult?.note||''):'', d.type||'', d.note||'']);
      });
    });
    const csv = rows.map(r=>r.map(c=>'"'+(String(c||'')).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=patient.name.replace(/ /g,'_')+'_pharm.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 tb-fade">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-chart-bar mr-2 text-teal-600"></i>สรุปการทำงานเภสัชกร</h3>
        <button type="button" onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"><i className="fa-solid fa-file-csv mr-1"></i>Export CSV</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:'Visit ทั้งหมด',value:visits.length,icon:'fa-calendar-check',color:'bg-teal-50 text-teal-600'},
          {label:'Consult',value:consults.length,icon:'fa-comments',color:'bg-amber-50 text-amber-600'},
          {label:'DRP พบ',value:drps.length,icon:'fa-circle-exclamation',color:'bg-red-50 text-red-600'},
          {label:'ADR บันทึก',value:adrFound.length,icon:'fa-heart-pulse',color:'bg-pink-50 text-pink-600'},
        ].map(k=>(
          <div key={k.label} className="p-4 rounded-2xl flex items-center gap-3 border border-gray-100 bg-white shadow-sm">
            <div className={'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 '+k.color}><i className={'fa-solid '+k.icon}></i></div>
            <div><p className="text-xs text-gray-500">{k.label}</p><p className="text-2xl font-bold text-gray-800">{k.value}</p></div>
          </div>
        ))}
      </div>
      {consults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100"><p className="text-xs font-bold text-amber-800"><i className="fa-solid fa-comments mr-1"></i>รายการ Consultation</p></div>
          <table className="w-full text-sm"><thead className="bg-gray-50 text-xs text-gray-500 border-b"><tr><th className="p-3 pl-4 text-left">วันที่</th><th className="p-3 text-left">ประเภท</th><th className="p-3 text-left">รายละเอียด</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{consults.map((v,i)=><tr key={i}><td className="p-3 pl-4 font-mono text-xs text-gray-500">{v.date}</td><td className="p-3 font-semibold text-amber-700 text-xs">{v.consult.type}</td><td className="p-3 text-xs text-gray-600">{v.consult.note||'-'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {drps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-red-50 px-4 py-2.5 border-b border-red-100"><p className="text-xs font-bold text-red-800"><i className="fa-solid fa-circle-exclamation mr-1"></i>Drug Related Problems</p></div>
          <table className="w-full text-sm"><thead className="bg-gray-50 text-xs text-gray-500 border-b"><tr><th className="p-3 pl-4 text-left">วันที่</th><th className="p-3 text-left">Code</th><th className="p-3 text-left">รายละเอียด</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{drps.map((d,i)=>{const info=(DRP_TYPES||[]).find(t=>t.code===d.type);return<tr key={i}><td className="p-3 pl-4 font-mono text-xs text-gray-500">{d.date}</td><td className="p-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{d.type||'-'}</span></td><td className="p-3 text-xs text-gray-600">{d.note||'-'}{info&&<span className="ml-1 text-gray-400 text-xs">({info.label})</span>}</td></tr>;})}</tbody>
          </table>
        </div>
      )}
      {adrFound.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-700 mb-3"><i className="fa-solid fa-heart-pulse mr-1 text-red-500"></i>ADR ที่บันทึกไว้</p>
          <div className="flex flex-wrap gap-2">{adrFound.map(a=><div key={a.key} className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl text-xs"><p className="font-bold text-red-700">{a.label}</p>{safeAdr[a.key]?.note&&<p className="text-gray-500 mt-0.5">{safeAdr[a.key].note}</p>}</div>)}</div>
        </div>
      )}
      {visits.length === 0 && <p className="text-center text-gray-400 py-10">ยังไม่มีข้อมูล Visit</p>}

      {/* ── โซนลบผู้ป่วย (ล่างสุด — ปุ่มเล็ก ชิดขวา) ── */}
      {(onSoftDelete || onRequestDelete) && (
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center gap-3">
          {isAdmin && onSoftDelete ? (
            <button type="button" onClick={()=>{ setDeleteStep(1); setDeleteReason(''); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-200 transition-colors">
              <i className="fa-solid fa-trash"></i>ลบผู้ป่วย
            </button>
          ) : hasPendingRequest ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200">
                <i className="fa-solid fa-clock"></i>รออนุมัติการลบจาก Admin
              </div>
              {onCancelDeleteRequest && (
                <button type="button" onClick={() => setShowCancelConfirm(true)} disabled={cancelling}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold border border-gray-200 transition-colors disabled:opacity-50">
                  <i className="fa-solid fa-xmark"></i>{cancelling ? 'กำลังยกเลิก...' : 'ยกเลิกคำขอ'}
                </button>
              )}
            </div>
          ) : onRequestDelete ? (
            <button type="button" onClick={()=>{ setRequestStep(1); setRequestReason(''); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200 transition-colors">
              <i className="fa-solid fa-paper-plane"></i>ขอลบผู้ป่วย
            </button>
          ) : null}
        </div>
      )}

      {/* ── Modal ยืนยันยกเลิกคำขอลบ ── */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 modal-A">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-rotate-left text-amber-600 text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">ยืนยันการยกเลิกคำขอ</h3>
                <p className="text-xs text-gray-500 mt-0.5">คำขอลบ "{patient.name}"</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-sm text-amber-800 leading-relaxed">
              คำขอลบจะถูกยกเลิก ผู้ป่วยจะกลับมาอยู่ในระบบตามปกติ<br/>
              <span className="text-xs text-amber-600 mt-1 block">ระบบจะส่งเมลแจ้ง Admin ให้ทราบด้วยอัตโนมัติ</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">
                ไม่ยกเลิก
              </button>
              <button type="button" onClick={handleCancelRequest} disabled={cancelling}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold">
                {cancelling ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังดำเนินการ...</> : 'ยืนยันยกเลิกคำขอ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog 1: ใส่เหตุผล ── */}
      {deleteStep === 1 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><i className="fa-solid fa-triangle-exclamation"></i></div>
              <h3 className="font-bold text-gray-800">ยืนยันการลบ "{patient.name}"</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">ข้อมูลทั้งหมด (Visit, Lab, ADR, DOT) จะถูกย้ายไปถังขยะ</p>
            <label className="block text-xs font-bold text-gray-700 mb-1">เหตุผลในการลบ <span className="text-red-500">*</span></label>
            <textarea value={deleteReason} onChange={e=>setDeleteReason(e.target.value)} rows={3}
              placeholder="เช่น ข้อมูลซ้ำ, ย้ายไป รพ. อื่น, ลงผิดราย"
              className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"/>
            {deleteReason.trim().length > 0 && !isValidReason(deleteReason) && (
              <p className="text-xs text-red-500 mt-1">กรุณาระบุเหตุผลเป็นข้อความ (ไม่ใช่ตัวเลขหรืออักขระพิเศษเท่านั้น)</p>
            )}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={()=>setDeleteStep(0)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">ยกเลิก</button>
              <button type="button" onClick={()=>setDeleteStep(2)} disabled={!isValidReason(deleteReason)}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold">ถัดไป</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog 2: ยืนยันสุดท้าย 60 วัน ── */}
      {deleteStep === 2 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><i className="fa-solid fa-trash-can"></i></div>
              <h3 className="font-bold text-gray-800">ลบไปถังขยะ 60 วัน</h3>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-900">
              <p className="font-bold mb-1"><i className="fa-solid fa-circle-info mr-1"></i>ข้อมูลจะถูกเก็บในถังขยะ 60 วัน</p>
              <p>• Admin สามารถกู้คืนได้ในระยะเวลานี้</p>
              <p>• หลัง 60 วัน ระบบจะลบถาวรอัตโนมัติ</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleConfirmDelete} disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {deleting ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังลบ...</> : 'ยืนยันลบ'}
              </button>
              <button type="button" onClick={()=>setDeleteStep(1)} disabled={deleting} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold disabled:opacity-50">ย้อนกลับ</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog ขอลบ step 1: ใส่เหตุผล ── */}
      {requestStep === 1 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><i className="fa-solid fa-paper-plane"></i></div>
              <h3 className="font-bold text-gray-800">ส่งคำขอลบ "{patient.name}"</h3>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-900">
              <p><i className="fa-solid fa-circle-info mr-1"></i>คำขอจะถูกส่งให้ Admin พิจารณา — ไม่ได้ลบทันที</p>
              <p className="mt-1"><i className="fa-solid fa-envelope mr-1"></i>เมื่อ Admin ตอบรับแล้ว ระบบจะแจ้งผลทางอีเมลอัตโนมัติ</p>
            </div>
            <label className="block text-xs font-bold text-gray-700 mb-1">เหตุผลในการขอลบ <span className="text-red-500">*</span></label>
            <textarea value={requestReason} onChange={e=>setRequestReason(e.target.value)} rows={3}
              placeholder="เช่น ข้อมูลซ้ำ, ย้ายไป รพ. อื่น, ลงผิดราย"
              className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400"/>
            {requestReason.trim().length > 0 && !isValidReason(requestReason) && (
              <p className="text-xs text-red-500 mt-1">กรุณาระบุเหตุผลเป็นข้อความ (ไม่ใช่ตัวเลขหรืออักขระพิเศษเท่านั้น)</p>
            )}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={()=>setRequestStep(0)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">ยกเลิก</button>
              <button type="button" onClick={()=>setRequestStep(2)} disabled={!isValidReason(requestReason)}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold">ถัดไป</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog ขอลบ step 2: ยืนยัน ── */}
      {requestStep === 2 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 modal-A">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><i className="fa-solid fa-circle-exclamation"></i></div>
              <h3 className="font-bold text-gray-800">ยืนยันส่งคำขอลบ</h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-xs text-gray-700">
              <p className="font-bold mb-1">ผู้ป่วย: {patient.name}</p>
              <p>เหตุผล: {requestReason}</p>
            </div>
            <p className="text-xs text-gray-500 mb-4">คำขอจะถูกส่งให้ Admin พิจารณา ระบบจะแจ้งผลทางอีเมลเมื่อมีการตอบรับ</p>
            <div className="flex gap-2">
              <button type="button" onClick={handleSubmitDeleteRequest} disabled={requesting}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold">
                {requesting ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังส่ง...</> : 'ยืนยันส่งคำขอ'}
              </button>
              <button type="button" onClick={()=>setRequestStep(1)} disabled={requesting} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">ย้อนกลับ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export { PharmSummaryTab }
