'use client'
/** patient-images/image-log.jsx — ประวัติทุก event ของรูปผู้ป่วย (ImageLogPage · แอดมินเท่านั้น)
 *  วางในหน้าคลังรูปภาพ (สลับมุมมอง คลังรูป/ประวัติ) · ดึงจาก /api/patient/images/log */
import * as React from 'react'
import { createPortal } from 'react-dom'

// meta ต่อชนิด event (ไอคอน/สี/ป้าย)
const EV = {
  uploaded:                 { ic:'fa-upload',       c:'#059669', bg:'#d1fae5', label:'อัปโหลดรูป' },
  metadata_updated:         { ic:'fa-pen',          c:'#2563eb', bg:'#dbeafe', label:'แก้ข้อมูลรูป' },
  delete_requested:         { ic:'fa-clock',        c:'#d97706', bg:'#fef3c7', label:'ขอลบรูป' },
  delete_request_cancelled: { ic:'fa-rotate-left',  c:'#6b7280', bg:'#f3f4f6', label:'ยกเลิกคำขอลบ' },
  delete_direct:            { ic:'fa-trash',        c:'#dc2626', bg:'#fee2e2', label:'แอดมินลบตรง' },
  delete_approved:          { ic:'fa-check-double', c:'#dc2626', bg:'#fee2e2', label:'อนุมัติลบ (เข้าถัง)' },
  delete_rejected:          { ic:'fa-xmark',        c:'#0d9488', bg:'#ccfbf1', label:'ปฏิเสธคำขอลบ' },
  restored:                 { ic:'fa-rotate-left',  c:'#0d9488', bg:'#ccfbf1', label:'กู้คืนจากถัง' },
  hard_deleted:             { ic:'fa-fire',         c:'#991b1b', bg:'#fee2e2', label:'ลบถาวร' },
  purged:                   { ic:'fa-fire',         c:'#991b1b', bg:'#fee2e2', label:'ลบอัตโนมัติ (60 วัน)' },
}
const EV_OPTS = [
  ['', 'ทุกเหตุการณ์'], ['uploaded','อัปโหลด'], ['metadata_updated','แก้ข้อมูล'],
  ['delete_requested','ขอลบ'], ['delete_request_cancelled','ยกเลิกคำขอ'], ['delete_direct','แอดมินลบตรง'],
  ['delete_approved','อนุมัติลบ'], ['delete_rejected','ปฏิเสธ'], ['restored','กู้คืน'],
  ['hard_deleted','ลบถาวร'], ['purged','ลบอัตโนมัติ'],
]
const DATE_OPTS = [['7d','7 วัน'], ['30d','30 วัน'], ['all','ทั้งหมด']]
const TYPE_LABEL = { cxr:'CXR', lab:'ผลแล็บ', document:'เอกสาร', other:'อื่นๆ' }

function computeSince(key) {
  const d = Date.now()
  if (key === '7d')  return new Date(d - 7 * 86400000).toISOString()
  if (key === '30d') return new Date(d - 30 * 86400000).toISOString()
  return ''
}
function fmtWhen(iso) {
  if (!iso) return '-'
  const dt = new Date(iso), now = new Date()
  const t = dt.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' })
  const sameDay = dt.toDateString() === now.toDateString()
  const yst = new Date(now.getTime() - 86400000).toDateString() === dt.toDateString()
  if (sameDay) return 'วันนี้ ' + t
  if (yst) return 'เมื่อวาน ' + t
  return dt.toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'numeric' }) + ' ' + t
}

function ImageLogPage() {
  const [logs, setLogs] = React.useState(null)
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [page, setPage] = React.useState(0)
  const [event, setEvent] = React.useState('')
  const [dateKey, setDateKey] = React.useState('7d')
  const [q, setQ] = React.useState('')
  const [snap, setSnap] = React.useState(null)   // {log} ที่กดดูข้อมูล

  const load = React.useCallback(async (pg, append) => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      p.set('page', String(pg)); p.set('pageSize', '50')
      if (event) p.set('event', event)
      if (q.trim()) p.set('q', q.trim())
      const since = computeSince(dateKey); if (since) p.set('since', since)
      const r = await fetch('/api/patient/images/log?' + p.toString())
      const d = await r.json()
      if (r.ok) { setTotal(d.total || 0); setLogs(prev => append ? [...(prev||[]), ...(d.logs||[])] : (d.logs||[])) }
      else setLogs([])
    } catch { setLogs([]) }
    setLoading(false)
  }, [event, q, dateKey])

  // โหลดใหม่เมื่อเปลี่ยนตัวกรอง (debounce ค้นหา)
  React.useEffect(() => {
    const t = setTimeout(() => { setPage(0); load(0, false) }, 300)
    return () => clearTimeout(t)
  }, [event, dateKey, q, load])

  const loadMore = () => { const np = page + 1; setPage(np); load(np, true) }
  const hasMore = (logs || []).length < total

  const chip = (on) => ({ border:'0.5px solid '+(on?'#0d9488':'#e5e7eb'), background:on?'#0d9488':'#fff', color:on?'#fff':'#6b7280', borderRadius:'999px', padding:'5px 12px', fontSize:'12px', cursor:'pointer' })

  return (
    <div>
      {/* แถบกรอง */}
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'6px 10px', flex:'1 1 180px', minWidth:'160px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize:'12px', color:'#9ca3af' }}></i>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาผู้ป่วย / HN / ผู้ทำ" style={{ flex:1, minWidth:0, border:'none', outline:'none', fontSize:'13px', background:'none' }}/>
        </div>
        <select value={event} onChange={e=>setEvent(e.target.value)} style={{ padding:'6px 10px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'12px', color:'#6b7280', cursor:'pointer' }}>
          {EV_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {DATE_OPTS.map(([v,l]) => <button key={v} onClick={()=>setDateKey(v)} style={chip(dateKey===v)}>{l}</button>)}
        <span style={{ marginLeft:'auto', fontSize:'12px', color:'#9ca3af' }}>{total} เหตุการณ์</span>
      </div>

      {/* รายการ */}
      {logs === null && <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>{[0,1,2,3].map(i=><div key={i} className="tb-skel" style={{ height:'66px', borderRadius:'11px' }}/>)}</div>}
      {logs !== null && logs.length === 0 && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'56px 20px' }}>
          <div style={{ width:'70px', height:'70px', borderRadius:'50%', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}><i className="fa-solid fa-clock-rotate-left" style={{ fontSize:'26px', color:'#cbd5e1' }}></i></div>
          <p style={{ fontSize:'14px', fontWeight:700, color:'#6b7280', margin:'0 0 4px' }}>ยังไม่มีประวัติที่ตรงกับตัวกรอง</p>
          <p style={{ fontSize:'12px', color:'#9ca3af', margin:0 }}>ลองเปลี่ยนช่วงเวลา หรือชนิดเหตุการณ์</p>
        </div>
      )}
      {(logs || []).map(lg => {
        const e = EV[lg.event_type] || { ic:'fa-circle', c:'#6b7280', bg:'#f3f4f6', label:lg.event_type }
        return (
          <div key={lg.id} style={{ display:'flex', gap:'12px', alignItems:'flex-start', background:'#fff', border:'1px solid #e5e7eb', borderRadius:'11px', padding:'11px 13px', marginBottom:'9px' }}>
            <div style={{ width:'38px', height:'38px', flexShrink:0, borderRadius:'50%', background:e.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><i className={'fa-solid '+e.ic} style={{ fontSize:'16px', color:e.c }}></i></div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'13.5px', fontWeight:700, color:e.c }}>{e.label}</span>
                <span style={{ fontSize:'11px', color:'#6b7280', background:'#f3f4f6', borderRadius:'5px', padding:'1px 7px' }}>{TYPE_LABEL[lg.image_type] || lg.image_type || '-'}</span>
              </div>
              <div style={{ fontSize:'12px', color:'#374151', marginTop:'3px' }}>{lg.patient_name || lg.patient_id || '-'}{lg.patient_hn ? <span style={{ color:'#9ca3af' }}> · HN {lg.patient_hn}</span> : null}</div>
              <div style={{ fontSize:'11.5px', color:'#6b7280', marginTop:'2px', wordBreak:'break-word' }}>
                โดย {lg.actor_name || '-'}{lg.actor_role ? ' (' + (lg.actor_role === 'admin' ? 'แอดมิน' : 'ผู้ใช้') + ')' : ''}
                {lg.owner_name ? ' · เจ้าของรูป ' + lg.owner_name : ''}
                {lg.reason ? ' · เหตุผล: ' + lg.reason : ''}
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:'11px', color:'#9ca3af', whiteSpace:'nowrap' }}>{fmtWhen(lg.created_at)}</div>
              {lg.snapshot && <button onClick={()=>setSnap(lg)} style={{ marginTop:'6px', border:'0.5px solid #d1d5db', borderRadius:'7px', padding:'3px 9px', fontSize:'11px', color:'#4b5563', background:'#fff', cursor:'pointer' }}>ดูข้อมูล</button>}
            </div>
          </div>
        )
      })}

      {hasMore && <div style={{ textAlign:'center', marginTop:'12px' }}><button onClick={loadMore} disabled={loading} style={{ border:'0.5px solid #d1d5db', borderRadius:'9px', padding:'8px 20px', fontSize:'13px', color:'#4b5563', background:'#fff', cursor:loading?'wait':'pointer' }}>{loading ? 'กำลังโหลด...' : 'โหลดเพิ่ม'}</button></div>}

      {/* popup ดูข้อมูล snapshot */}
      {snap && createPortal(
        <div className="tb-backdrop" style={{ position:'fixed', inset:0, zIndex:10002, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }} onClick={()=>setSnap(null)}>
          <div className="modal-A" onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'420px', maxHeight:'80vh', overflowY:'auto', padding:'20px', boxSizing:'border-box' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:(EV[snap.event_type]||{}).bg||'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}><i className={'fa-solid '+((EV[snap.event_type]||{}).ic||'fa-circle')} style={{ color:(EV[snap.event_type]||{}).c||'#6b7280', fontSize:'17px' }}></i></div>
              <div><p style={{ fontSize:'14px', fontWeight:700, color:'#111827', margin:0 }}>{(EV[snap.event_type]||{}).label || snap.event_type}</p><p style={{ fontSize:'11px', color:'#9ca3af', margin:0 }}>{fmtWhen(snap.created_at)}</p></div>
            </div>
            <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'11px 13px', fontSize:'12px', color:'#374151', lineHeight:1.9 }}>
              {[
                ['ผู้ป่วย', (snap.patient_name||'-') + (snap.patient_hn ? ' · HN '+snap.patient_hn : '')],
                ['ผู้ทำ', (snap.actor_name||'-') + (snap.actor_role ? ' ('+(snap.actor_role==='admin'?'แอดมิน':'ผู้ใช้')+')' : '')],
                ['เจ้าของรูป', snap.owner_name || '-'],
                ['เหตุผล', snap.reason || '-'],
                ['image_id', snap.image_id || '-'],
              ].map(([k,v]) => <div key={k}><span style={{ color:'#9ca3af', display:'inline-block', minWidth:'82px' }}>{k}</span><span style={{ wordBreak:'break-all' }}>{v}</span></div>)}
            </div>
            <p style={{ fontSize:'11px', fontWeight:700, color:'#6b7280', margin:'14px 0 6px' }}>ข้อมูลรูป ณ ตอนนั้น (snapshot)</p>
            <pre style={{ background:'#0b0f19', color:'#a5f3ea', borderRadius:'10px', padding:'12px', fontSize:'11px', overflowX:'auto', margin:0, whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{JSON.stringify(snap.snapshot, null, 2)}</pre>
            <div style={{ display:'flex', marginTop:'14px' }}><button onClick={()=>setSnap(null)} style={{ flex:1, padding:'10px', borderRadius:'10px', background:'#f3f4f6', color:'#4b5563', fontWeight:700, fontSize:'13px', border:'none', cursor:'pointer' }}>ปิด</button></div>
          </div>
        </div>, document.body
      )}
    </div>
  )
}

export { ImageLogPage }
