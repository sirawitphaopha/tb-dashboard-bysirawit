'use client'
/**
 * parts/admin/audit-log.jsx — ประวัติการลบผู้ป่วยถาวร (audit log, admin)
 * ย้ายจาก parts/admin.jsx (แยกรอบ 2) — โค้ดเดิม ไม่แก้ logic
 */
import * as React from 'react'
const { useState, useEffect } = React

// ─────────────────────────────────────────────────────
// AuditLogTab — ประวัติการลบผู้ป่วยถาวร (admin เท่านั้น)
// ─────────────────────────────────────────────────────
function AuditLogTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  // v0.7.17.1 — Lazy render
  const [visibleAuditCount, setVisibleAuditCount] = useState(50)

  useEffect(() => {
    (async () => {
      const { data } = await window._sb
        .from('tb_patients_deleted_log')
        .select('*, admin:deleted_by(first_name, last_name)')
        .order('deleted_at', { ascending: false })
      setLogs(data || [])
      setLoading(false)
    })()
  }, [])

  const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fee2e2' }}>
          <i className="fa-solid fa-clock-rotate-left" style={{ color: '#dc2626' }}></i>
        </div>
        <div>
          <h2 className="font-bold text-gray-800">ประวัติการลบถาวร</h2>
          <p className="text-xs text-gray-500">บันทึกอัตโนมัติทุกครั้งที่มีการลบผู้ป่วยออกจากระบบถาวร</p>
        </div>
        {!loading && (
          <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#fee2e2', color: '#991b1b' }}>
            {logs.length} รายการ
          </span>
        )}
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">
          <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
          <p className="text-sm">กำลังโหลด...</p>
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <i className="fa-solid fa-shield-check text-4xl mb-3" style={{ color: '#d1fae5' }}></i>
          <p className="font-semibold text-gray-500">ยังไม่มีประวัติการลบถาวร</p>
          <p className="text-xs mt-1">ระบบจะบันทึกที่นี่ทุกครั้งที่มีการลบผู้ป่วยออกจากระบบ</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#134e4a', color: 'white' }}>
                <th className="px-4 py-3 text-left font-semibold text-xs">HN</th>
                <th className="px-4 py-3 text-left font-semibold text-xs">ชื่อผู้ป่วย</th>
                <th className="px-4 py-3 text-left font-semibold text-xs">สูตรยา</th>
                <th className="px-4 py-3 text-left font-semibold text-xs">ลบโดย</th>
                <th className="px-4 py-3 text-left font-semibold text-xs">วันที่ลบ</th>
                <th className="px-4 py-3 text-left font-semibold text-xs">เหตุผล</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, visibleAuditCount).map((log, i) => {
                const adminName = log.admin
                  ? `${log.admin.first_name || ''} ${log.admin.last_name || ''}`.trim() || 'Admin'
                  : (log.deleter_name_at_delete
                      ? `${log.deleter_name_at_delete} (ผู้ใช้ถูกลบออกจากระบบแล้ว)`
                      : 'ผู้ใช้ไม่ทราบ')
                return (
                  <tr key={log.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.patient_hn || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{log.patient_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.regimen || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{adminName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(log.deleted_at)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{log.reason || '—'}</td>
                  </tr>
                )
              })}
              {logs.length > visibleAuditCount && (
                <tr><td colSpan={5} className="p-3 text-center">
                  <button type="button" onClick={()=>setVisibleAuditCount(c=>c+50)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-1.5 rounded-full transition-colors">
                    <i className="fa-solid fa-chevron-down mr-1.5"></i>
                    ดูประวัติเพิ่มอีก {Math.min(50, logs.length - visibleAuditCount)} รายการ
                    <span className="text-gray-400 font-normal ml-2">({visibleAuditCount} / {logs.length})</span>
                  </button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        <i className="fa-solid fa-circle-info mr-1"></i>
        ประวัตินี้ลบไม่ได้ — บันทึกเพื่อใช้เป็นหลักฐานตรวจสอบเท่านั้น
      </p>
    </div>
  )
}

export { AuditLogTab }
