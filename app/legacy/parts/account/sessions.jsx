'use client'
/**
 * parts/account/sessions.jsx — จัดการเซสชัน (แยกรอบ 2)
 * deviceIcon, endReasonLabel, StatusLegend, SessionPagination, SessionsPanel
 */
import * as React from 'react'
const { useState, useEffect, useRef, useCallback } = React
import { FilterSelect, ScrollNav, relTime, r2AvatarUrl, normName, nameInitials,
         AVATAR_PALETTE, colorFromName, AvatarCircle, loadImageEl } from '../shared'

function deviceIcon(type) {
  if (type === 'mobile') return 'fa-mobile';   // มือถือ
  if (type === 'tablet') return 'fa-tablet';   // แท็บเล็ต / iPad
  return 'fa-desktop';                          // คอมพิวเตอร์
}
function endReasonLabel(reason) {
  switch (reason) {
    case 'manual':           return { label: 'ออกจากระบบเอง',     color: '#0d9488', bg: '#f0fdfa' };
    case 'session_expired':  return { label: 'หมดอายุการใช้งาน',  color: '#9ca3af', bg: '#f3f4f6' };
    case 'forced_by_user':   return { label: 'ถูกบังคับออก',       color: '#d97706', bg: '#fffbeb' };
    case 'forced_by_admin':  return { label: 'ผู้ดูแลระบบบังคับออก', color: '#dc2626', bg: '#fef2f2' };
    default:                 return { label: 'ยังใช้งานอยู่',       color: '#22c55e', bg: '#dcfce7' };
  }
}
// ป้ายสีแถวเดียว (legend) — อธิบายความหมายของแต่ละสถานะ
function StatusLegend() {
  const items = [
    { color: '#22c55e', label: 'ยังใช้งานอยู่' },
    { color: '#0d9488', label: 'ออกจากระบบเอง' },
    { color: '#9ca3af', label: 'หมดอายุการใช้งาน' },
    { color: '#d97706', label: 'ถูกบังคับออก' },
    { color: '#dc2626', label: 'ผู้ดูแลระบบบังคับออก' },
  ];
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:'6px 14px',padding:'10px 14px',background:'#f9fafb',borderRadius:'10px',border:'1px solid #f3f4f6'}}>
      {items.map(it => (
        <div key={it.label} style={{display:'flex',alignItems:'center',gap:'5px'}}>
          <span style={{width:'9px',height:'9px',borderRadius:'50%',background:it.color,flexShrink:0}}></span>
          <span style={{fontSize:'11px',color:'#6b7280',whiteSpace:'nowrap'}}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// v0.7.17.3 Phase 4B — ปุ่มลอยขวาล่าง (เลื่อนขึ้น/ลงรวดเดียว) ใช้กับ container ที่ scroll ได้
//   props: getContainer? () => HTMLElement   ถ้าไม่ส่งจะใช้ window
//          zIndex? number                    default 30 (ต่ำกว่า modals ที่ 50)
//   - แสดงเฉพาะเมื่อเลื่อนลงได้/ขึ้นได้ (ซ่อนเองอัตโนมัติ)
//   - ใช้ React Portal → render ที่ document.body
//     (สำคัญ: ป้องกัน position:fixed ผิดที่ เมื่ออยู่ใน modal-A ที่มี transform)
//   - คำนวณตำแหน่งจาก bounding rect ของ container → เกาะมุมล่างขวาของ "กรอบ"
// ScrollNav ย้ายไป parts/shared.jsx (เฟส 1c)

// v0.7.17.3 Phase 4B — Pagination component สำหรับ Session History (เลขหน้า 1 2 3 ... N)
function SessionPagination({ page, totalPages, total, pageSize, onChange }) {
  // สร้าง list ของหมายเลขหน้า + ellipsis
  // window 5 (รอบหน้าปัจจุบัน ±2) + first + last + ellipsis
  const pageWindow = () => {
    const cur = page + 1; // 1-indexed สำหรับแสดงผล
    const last = totalPages;
    const set = new Set([1, last, cur, cur-1, cur+1, cur-2, cur+2]);
    const arr = [...set].filter(n => n >= 1 && n <= last).sort((a,b)=>a-b);
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      out.push(arr[i]);
      if (i < arr.length - 1 && arr[i+1] - arr[i] > 1) out.push('…');
    }
    return out;
  };
  const items = pageWindow();
  const from  = page * pageSize + 1;
  const to    = Math.min(total, from + pageSize - 1);

  const btnBase = { minWidth:'30px',height:'30px',padding:'0 9px',borderRadius:'8px',border:'1px solid #e5e7eb',background:'#fff',color:'#374151',fontSize:'12px',fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s' };
  const btnActive = { borderColor:'#0d9488',background:'#0d9488',color:'#fff',boxShadow:'0 2px 6px rgba(13,148,136,0.3)' };
  const btnDisabled = { opacity:0.4,cursor:'not-allowed' };

  return (
    <div style={{marginTop:'18px',paddingTop:'14px',borderTop:'1px solid #f3f4f6'}}>
      <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:'5px',marginBottom:'8px'}}>
        <button onClick={()=>page>0 && onChange(page-1)} disabled={page===0}
          style={{...btnBase, ...(page===0?btnDisabled:{})}} title="หน้าก่อนหน้า">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        {items.map((it, idx) => (
          it === '…'
            ? <span key={`e${idx}`} style={{padding:'0 4px',color:'#9ca3af',fontSize:'12px'}}>…</span>
            : <button key={it} onClick={()=>onChange(it-1)}
                style={{...btnBase, ...(it === page+1 ? btnActive : {})}}>
                {it}
              </button>
        ))}
        <button onClick={()=>page<totalPages-1 && onChange(page+1)} disabled={page>=totalPages-1}
          style={{...btnBase, ...(page>=totalPages-1?btnDisabled:{})}} title="หน้าถัดไป">
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
      <div style={{textAlign:'center',fontSize:'11px',color:'#9ca3af'}}>
        แสดง {from}-{to} จาก {total} รายการ · หน้า {page+1} / {totalPages}
      </div>
    </div>
  );
}

function SessionsPanel({ onBack }) {
  const [sessions, setSessions]   = React.useState([]);
  const [currentId, setCurrentId] = React.useState(null);
  const [loading, setLoading]     = React.useState(true);
  const [error, setError]         = React.useState('');
  const [showHistory, setShowHistory] = React.useState(false);
  const [history, setHistory]     = React.useState([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [resultMsg, setResultMsg] = React.useState('');

  // v0.7.17.3 Phase 4B — history filter + pagination
  const [hPage, setHPage]               = React.useState(0)
  const [hPageSize]                     = React.useState(50)
  const [hTotal, setHTotal]             = React.useState(0)
  const [hHasMore, setHHasMore]         = React.useState(false)
  const [hfTime, setHfTime]             = React.useState('30d')  // today/7d/30d/all/custom
  const [hfDevice, setHfDevice]         = React.useState('')      // desktop/mobile/tablet/unknown
  const [hfStatus, setHfStatus]         = React.useState('')      // ''=all, active, manual, session_expired, forced_by_user, forced_by_admin
  const [hfDateFrom, setHfDateFrom]     = React.useState('')
  const [hfDateTo, setHfDateTo]         = React.useState('')
  const [hSearchInput, setHSearchInput] = React.useState('')
  const [hfSearch, setHfSearch]         = React.useState('')
  // refreshing = filter/page change (ไม่โชว์ skeleton); historyLoading = first mount เท่านั้น
  const [historyRefreshing, setHistoryRefreshing] = React.useState(false)
  const [historyEverLoaded, setHistoryEverLoaded] = React.useState(false)
  // ref ไปยัง root → ใช้หา parent scroll container สำหรับ ScrollNav
  const panelRootRef = React.useRef(null);
  const getScrollContainer = React.useCallback(() => {
    let el = panelRootRef.current && panelRootRef.current.parentElement;
    while (el) {
      const s = window.getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY)) return el;
      el = el.parentElement;
    }
    return null; // fallback → window
  }, []);

  const loadActive = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/sessions');
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'โหลดข้อมูลล้มเหลว'); setLoading(false); return; }
      setSessions(data.sessions || []);
      setCurrentId(data.current_session_id || null);
    } catch { setError('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
    setLoading(false);
  };
  // v0.7.17.3 Phase 4B — สร้าง params จาก filter state
  const buildHistoryParams = (p) => {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    sp.set('pageSize', String(hPageSize))
    // ช่วงเวลา
    const now = new Date()
    if (hfTime === 'today') {
      const d = new Date(now); d.setHours(0,0,0,0)
      sp.set('since', d.toISOString())
    } else if (hfTime === '7d') {
      sp.set('since', new Date(now.getTime() - 7 * 86400000).toISOString())
    } else if (hfTime === '30d') {
      sp.set('since', new Date(now.getTime() - 30 * 86400000).toISOString())
    } else if (hfTime === 'custom') {
      if (hfDateFrom) sp.set('since', new Date(hfDateFrom + 'T00:00:00').toISOString())
      if (hfDateTo)   sp.set('until', new Date(hfDateTo + 'T23:59:59.999').toISOString())
    }
    if (hfDevice) sp.set('device', hfDevice)
    if (hfStatus) sp.set('status', hfStatus)
    if (hfSearch) sp.set('q', hfSearch)
    return sp
  }

  const loadHistory = async (p = 0) => {
    // ตอนเปิดหน้าครั้งแรก → skeleton เต็ม; ครั้งถัดไป (filter / page) → spinner เบาๆ คงข้อมูลเก่าไว้
    if (!historyEverLoaded) setHistoryLoading(true);
    else                    setHistoryRefreshing(true);
    try {
      const res  = await fetch(`/api/auth/sessions/history?${buildHistoryParams(p).toString()}`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data.rows || data.sessions || []);
        setHTotal(typeof data.total === 'number' ? data.total : (data.rows?.length || 0));
        setHHasMore(!!data.hasMore);
        setHPage(p);
        setHistoryEverLoaded(true);
      }
    } catch {}
    setHistoryLoading(false);
    setHistoryRefreshing(false);
  };

  React.useEffect(() => { loadActive(); }, []);
  // debounce ช่องค้นหา 400ms
  React.useEffect(() => {
    const t = setTimeout(() => setHfSearch(hSearchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [hSearchInput])
  // โหลดใหม่ทุกครั้งที่เปลี่ยน filter (รวมตอนเปิดหน้าประวัติ)
  React.useEffect(() => {
    if (showHistory) loadHistory(0);
  }, [showHistory, hfTime, hfDevice, hfStatus, hfDateFrom, hfDateTo, hfSearch]);

  const hHasActiveFilter = !!(hfTime !== '30d' || hfDevice || hfStatus || hfSearch || hfDateFrom || hfDateTo);
  const hTotalPages = Math.max(1, Math.ceil(hTotal / hPageSize));

  // กดที่ chip ในแถว → ใส่ filter อัตโนมัติ
  const applyIpFilter     = (ip)     => { setHSearchInput(ip); setHfSearch(ip); }
  const applyDeviceFilter = (dtype)  => setHfDevice(dtype || 'unknown');
  const applyStatusFilter = (reason) => setHfStatus(reason || 'active');

  const otherCount = sessions.filter(s => !s.is_current).length;

  const doSignoutOthers = async () => {
    setConfirmOpen(false);
    setSigningOut(true); setResultMsg('');
    try {
      const res  = await fetch('/api/auth/signout-others', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setResultMsg(data.error || 'เกิดข้อผิดพลาด'); }
      else { setResultMsg(`ออกจากระบบสำเร็จ ${data.count} อุปกรณ์`); await loadActive(); }
    } catch { setResultMsg('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
    setSigningOut(false);
  };

  if (showHistory) {
    const selStyleH = { fontSize:'12px', padding:'7px 10px', borderRadius:'9px', border:'1px solid #e5e7eb', background:'#fff', color:'#374151', outline:'none', cursor:'pointer' };
    return (
      <div ref={panelRootRef}>
        <div style={{position:'sticky',top:'-20px',zIndex:5,background:'#fff',margin:'-20px -28px 14px',padding:'20px 28px 0',boxShadow:'0 4px 8px -6px rgba(0,0,0,0.15)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'4px 0 14px',borderBottom:'1px solid #e5e7eb',marginBottom:'14px'}}>
            <button onClick={()=>setShowHistory(false)} title="กลับไปดูอุปกรณ์ที่กำลังเข้าใช้งาน"
              style={{background:'#f3f4f6',border:'none',color:'#4b5563',cursor:'pointer',fontSize:'12px',fontWeight:600,padding:'7px 12px',borderRadius:'8px',display:'flex',alignItems:'center',gap:'6px',transition:'background 0.15s, color 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#ccfbf1';e.currentTarget.style.color='#0d9488';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.color='#4b5563';}}>
              <i className="fa-solid fa-arrow-left"></i>กลับ
            </button>
            <i className="fa-solid fa-clock-rotate-left" style={{color:'#0d9488',fontSize:'13px',marginLeft:'4px'}}></i>
            <p style={{fontSize:'13px',fontWeight:700,color:'#0d9488',margin:0,textTransform:'uppercase',letterSpacing:'0.5px',flex:1}}>ประวัติการเข้าใช้งานทั้งหมด</p>
            {!historyLoading && (
              <span style={{fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'999px',background:'#ccfbf1',color:'#0f766e',whiteSpace:'nowrap'}}>
                {hTotal} รายการ
              </span>
            )}
          </div>

          {/* v0.7.17.3 Phase 4B — Filter panel */}
          <div style={{background:'linear-gradient(135deg,#f0fdfa 0%,#f8fafc 100%)',border:'1px solid #d1fae5',borderRadius:'12px',padding:'10px',marginBottom:'10px'}}>
            <div style={{display:'flex',flexWrap:'nowrap',gap:'7px',alignItems:'center'}}>
              <div style={{position:'relative',flex:'1 1 80px',minWidth:'80px'}}>
                <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#0d9488',fontSize:'11px'}}></i>
                <input value={hSearchInput} onChange={e=>setHSearchInput(e.target.value)}
                  placeholder="ค้นหา IP / อุปกรณ์"
                  style={{width:'100%',fontSize:'12px',padding:'8px 26px 8px 28px',borderRadius:'9px',border:'1px solid #e5e7eb',outline:'none',boxSizing:'border-box',background:'#fff'}}/>
                {hSearchInput && (
                  <i className="fa-solid fa-xmark" onClick={()=>setHSearchInput('')}
                    style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'11px',cursor:'pointer'}}></i>
                )}
              </div>
              <FilterSelect icon="fa-laptop" value={hfDevice} onChange={e=>setHfDevice(e.target.value)}>
                <option value="">ทุกอุปกรณ์</option>
                <option value="desktop">คอมพิวเตอร์</option>
                <option value="mobile">มือถือ</option>
                <option value="tablet">แท็บเล็ต</option>
                <option value="unknown">ไม่ทราบ</option>
              </FilterSelect>
              <FilterSelect icon="fa-calendar" value={hfTime} onChange={e=>setHfTime(e.target.value)}>
                <option value="all">ทุกช่วงเวลา</option>
                <option value="today">วันนี้</option>
                <option value="7d">7 วันล่าสุด</option>
                <option value="30d">30 วันล่าสุด</option>
                <option value="custom">กำหนดเอง</option>
              </FilterSelect>
              <FilterSelect icon="fa-flag" value={hfStatus} onChange={e=>setHfStatus(e.target.value)}>
                <option value="">ทุกสถานะ</option>
                <option value="active">ยังใช้งานอยู่</option>
                <option value="manual">ออกจากระบบเอง</option>
                <option value="session_expired">หมดอายุการใช้งาน</option>
                <option value="forced_by_user">ถูกบังคับออก</option>
                <option value="forced_by_admin">ผู้ดูแลระบบบังคับออก</option>
              </FilterSelect>
              {hHasActiveFilter && (
                <button onClick={()=>{ setHfTime('30d'); setHfDevice(''); setHfStatus(''); setHfDateFrom(''); setHfDateTo(''); setHSearchInput(''); setHfSearch(''); }}
                  title="กลับเป็นค่าตั้งต้น (30 วันล่าสุด)"
                  style={{fontSize:'12px',fontWeight:600,padding:'8px 11px',borderRadius:'9px',border:'1px solid #fcd34d',background:'#fffbeb',color:'#b45309',cursor:'pointer',whiteSpace:'nowrap'}}>
                  <i className="fa-solid fa-rotate-left" style={{marginRight:'5px'}}></i>ล้างค่า
                </button>
              )}
            </div>
            {hfTime === 'custom' && (
              <div style={{display:'flex',flexWrap:'wrap',gap:'7px',alignItems:'center',marginTop:'9px',paddingTop:'9px',borderTop:'1px dashed #99f6e4'}}>
                <span style={{fontSize:'12px',color:'#0f766e',fontWeight:600}}><i className="fa-solid fa-calendar-day" style={{marginRight:'5px'}}></i>จากวันที่</span>
                <input type="date" value={hfDateFrom} max={hfDateTo || undefined} onChange={e=>setHfDateFrom(e.target.value)} style={{...selStyleH,background:'#fff'}}/>
                <span style={{fontSize:'12px',color:'#0f766e',fontWeight:600}}>ถึงวันที่</span>
                <input type="date" value={hfDateTo} min={hfDateFrom || undefined} onChange={e=>setHfDateTo(e.target.value)} style={{...selStyleH,background:'#fff'}}/>
              </div>
            )}
          </div>

          <StatusLegend/>
        </div>

        {/* v0.7.17.3 — Container ขนาดคงที่ ป้องกัน filter panel หดตอน loading
             - first mount เท่านั้นที่ขึ้น skeleton
             - filter/page change คงข้อมูลเก่าไว้ + dim overlay เบาๆ */}
        <div style={{position:'relative',minHeight:'200px'}}>
          {historyLoading ? (
            <div style={{textAlign:'center',padding:'40px 0',color:'#9ca3af',fontSize:'13px'}}>
              <i className="fa-solid fa-spinner fa-spin" style={{marginRight:'8px'}}></i>กำลังโหลด...
            </div>
          ) : history.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px 0',color:'#9ca3af',fontSize:'13px'}}>
              {hHasActiveFilter ? 'ไม่พบรายการตามเงื่อนไขที่กรอง' : 'ไม่พบประวัติ'}
            </div>
          ) : (
            <>
              <div style={{display:'flex',flexDirection:'column',gap:'10px',opacity:historyRefreshing?0.55:1,transition:'opacity 0.15s',pointerEvents:historyRefreshing?'none':'auto'}}>
                {history.map(s => {
                  const reason = endReasonLabel(s.end_reason);
                  const statusKey = s.end_reason || 'active';
                  return (
                    <div key={s.id} style={{padding:'12px 14px',borderRadius:'10px',border:'1px solid #e5e7eb',background:'#fff'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
                        <i className={`fa-solid ${deviceIcon(s.device_type)}`} style={{color:'#0d9488',fontSize:'16px',width:'18px',textAlign:'center'}}></i>
                        <span onClick={()=>applyDeviceFilter(s.device_type)} title={`กรองเฉพาะ ${s.device_label || 'อุปกรณ์นี้'}`}
                          style={{fontSize:'13px',fontWeight:700,color:'#134e4a',margin:0,flex:1,cursor:'pointer'}}
                          onMouseEnter={e=>e.currentTarget.style.color='#0d9488'}
                          onMouseLeave={e=>e.currentTarget.style.color='#134e4a'}>
                          {s.device_label || 'ไม่ทราบอุปกรณ์'}
                        </span>
                        <span onClick={()=>applyStatusFilter(statusKey)} title="กรองตามสถานะนี้"
                          style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'10px',fontWeight:700,padding:'3px 9px',borderRadius:'999px',background:reason.bg,color:reason.color,whiteSpace:'nowrap',cursor:'pointer'}}>
                          <span style={{width:'7px',height:'7px',borderRadius:'50%',background:reason.color,flexShrink:0}}></span>{reason.label}
                        </span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 16px',fontSize:'11px',color:'#6b7280',marginLeft:'28px'}}>
                        <span>
                          <i className="fa-solid fa-globe" style={{marginRight:'5px'}}></i>
                          {s.ip_address
                            ? <span onClick={()=>applyIpFilter(s.ip_address)} title={`กรองเฉพาะ IP ${s.ip_address}`}
                                style={{cursor:'pointer',textDecoration:'underline dotted',textUnderlineOffset:'2px'}}
                                onMouseEnter={e=>e.currentTarget.style.color='#0d9488'}
                                onMouseLeave={e=>e.currentTarget.style.color='#6b7280'}>
                                {s.ip_address}
                              </span>
                            : '-'}
                        </span>
                        <span><i className="fa-solid fa-right-to-bracket" style={{marginRight:'5px'}}></i>เข้า {relTime(s.started_at)}</span>
                        {s.ended_at && <span><i className="fa-solid fa-right-from-bracket" style={{marginRight:'5px'}}></i>ออก {relTime(s.ended_at)}</span>}
                        {!s.ended_at && <span><i className="fa-solid fa-circle" style={{color:'#22c55e',marginRight:'5px',fontSize:'8px'}}></i>ใช้งานล่าสุด {relTime(s.last_active_at)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* v0.7.17.3 Phase 4B — Pagination */}
              {hTotalPages > 1 && (
                <SessionPagination
                  page={hPage}
                  totalPages={hTotalPages}
                  total={hTotal}
                  pageSize={hPageSize}
                  onChange={(p) => loadHistory(p)}
                />
              )}
            </>
          )}

          {/* Spinner overlay เบาๆ ตอน refresh (ไม่ใช่ skeleton เต็ม) */}
          {historyRefreshing && history.length > 0 && (
            <div style={{position:'absolute',top:'10px',right:'10px',display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'11px',fontWeight:600,padding:'5px 11px',borderRadius:'999px',background:'rgba(13,148,136,0.95)',color:'#fff',boxShadow:'0 2px 8px rgba(13,148,136,0.3)'}}>
              <i className="fa-solid fa-spinner fa-spin"></i>กำลังกรอง
            </div>
          )}
        </div>
        <ScrollNav getContainer={getScrollContainer} zIndex={9990} />
      </div>
    );
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'4px 0 14px',borderBottom:'1px solid #e5e7eb',marginBottom:'18px'}}>
        <button onClick={onBack} title="กลับไปดูข้อมูลโปรไฟล์"
          style={{background:'#f3f4f6',border:'none',color:'#4b5563',cursor:'pointer',fontSize:'12px',fontWeight:600,padding:'7px 12px',borderRadius:'8px',display:'flex',alignItems:'center',gap:'6px',transition:'background 0.15s, color 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='#ccfbf1';e.currentTarget.style.color='#0d9488';}}
          onMouseLeave={e=>{e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.color='#4b5563';}}>
          <i className="fa-solid fa-arrow-left"></i>กลับ
        </button>
        <i className="fa-solid fa-shield-halved" style={{color:'#0d9488',fontSize:'13px',marginLeft:'4px'}}></i>
        <p style={{fontSize:'13px',fontWeight:700,color:'#0d9488',margin:0,textTransform:'uppercase',letterSpacing:'0.5px'}}>อุปกรณ์ที่เข้าใช้งาน</p>
      </div>

      <p style={{fontSize:'12px',color:'#9ca3af',margin:'0 0 14px 0'}}>รายการอุปกรณ์/เครื่องที่บัญชีนี้กำลังเข้าใช้งานอยู่</p>

      {loading ? (
        <div style={{textAlign:'center',padding:'40px 0',color:'#9ca3af',fontSize:'13px'}}>
          <i className="fa-solid fa-spinner fa-spin" style={{marginRight:'8px'}}></i>กำลังโหลด...
        </div>
      ) : error ? (
        <div style={{padding:'14px',borderRadius:'10px',background:'#fef2f2',color:'#dc2626',fontSize:'13px'}}>
          <i className="fa-solid fa-circle-exclamation" style={{marginRight:'8px'}}></i>{error}
        </div>
      ) : (
        <>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {sessions.map(s => (
              <div key={s.id} style={{padding:'14px 16px',borderRadius:'12px',border: s.is_current?'1.5px solid #0d9488':'1px solid #e5e7eb',background: s.is_current?'#f0fdfa':'#fff'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                  <i className={`fa-solid ${deviceIcon(s.device_type)}`} style={{color:'#0d9488',fontSize:'18px',width:'20px',textAlign:'center'}}></i>
                  <p style={{fontSize:'13px',fontWeight:700,color:'#134e4a',margin:0,flex:1}}>{s.device_label || 'ไม่ทราบอุปกรณ์'}</p>
                  {s.is_current && (
                    <span style={{fontSize:'10px',fontWeight:700,padding:'3px 9px',borderRadius:'999px',background:'#0d9488',color:'#fff'}}>
                      <i className="fa-solid fa-circle" style={{fontSize:'7px',marginRight:'5px'}}></i>เครื่องนี้
                    </span>
                  )}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 16px',fontSize:'11px',color:'#6b7280',marginLeft:'32px'}}>
                  <span><i className="fa-solid fa-globe" style={{marginRight:'5px'}}></i>IP: {s.ip_address || '-'}</span>
                  <span><i className="fa-solid fa-right-to-bracket" style={{marginRight:'5px'}}></i>เริ่ม {relTime(s.started_at)}</span>
                  <span style={{gridColumn:'1 / -1'}}><i className="fa-solid fa-circle" style={{color:'#22c55e',marginRight:'5px',fontSize:'8px'}}></i>ใช้งานล่าสุด {relTime(s.last_active_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {resultMsg && (
            <div style={{marginTop:'14px',padding:'10px 14px',borderRadius:'10px',background:resultMsg.includes('สำเร็จ')?'#d1fae5':'#fef2f2',color:resultMsg.includes('สำเร็จ')?'#065f46':'#dc2626',fontSize:'12px',textAlign:'center'}}>
              <i className={`fa-solid ${resultMsg.includes('สำเร็จ')?'fa-circle-check':'fa-circle-exclamation'}`} style={{marginRight:'6px'}}></i>{resultMsg}
            </div>
          )}

          <button onClick={()=>otherCount>0 && setConfirmOpen(true)} disabled={signingOut || otherCount===0}
            style={{width:'100%',marginTop:'18px',padding:'13px',borderRadius:'12px',background: otherCount===0?'#e5e7eb':(signingOut?'#fdba74':'#ea580c'),color: otherCount===0?'#9ca3af':'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:(signingOut||otherCount===0)?'not-allowed':'pointer',boxShadow:otherCount===0?'none':'0 4px 14px rgba(234,88,12,0.3)',transition:'background 0.2s'}}
            onMouseEnter={e=>{if(!signingOut && otherCount>0) e.currentTarget.style.background='#c2410c';}}
            onMouseLeave={e=>{if(!signingOut && otherCount>0) e.currentTarget.style.background='#ea580c';}}>
            {signingOut
              ? <><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'6px'}}></i>กำลังออกจากระบบ...</>
              : otherCount===0
                ? <><i className="fa-solid fa-circle-check" style={{marginRight:'6px'}}></i>ไม่มีอุปกรณ์อื่นที่เข้าใช้งาน</>
                : <><i className="fa-solid fa-right-from-bracket" style={{marginRight:'6px'}}></i>ออกจากระบบทุกอุปกรณ์ยกเว้นเครื่องนี้ ({otherCount})</>}
          </button>

          <div style={{textAlign:'center',marginTop:'18px',paddingTop:'14px',borderTop:'1px solid #f3f4f6'}}>
            <button onClick={()=>setShowHistory(true)}
              style={{background:'none',border:'none',color:'#0d9488',fontSize:'12px',fontWeight:600,cursor:'pointer',textDecoration:'none'}}
              onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
              onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
              <i className="fa-solid fa-clock-rotate-left" style={{marginRight:'6px'}}></i>ดูประวัติการเข้าใช้งานทั้งหมด
            </button>
          </div>
        </>
      )}

      {/* Confirm popup */}
      {confirmOpen && (
        <div className="tb-backdrop" style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}} onClick={()=>setConfirmOpen(false)}>
          <div className="modal-A" style={{background:'#fff',borderRadius:'16px',padding:'28px',maxWidth:'400px',width:'90%',textAlign:'center',boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}} onClick={e=>e.stopPropagation()}>
            <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'#fff7ed',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
              <i className="fa-solid fa-triangle-exclamation" style={{fontSize:'22px',color:'#ea580c'}}></i>
            </div>
            <p style={{fontSize:'15px',fontWeight:700,color:'#134e4a',margin:'0 0 8px'}}>ยืนยันออกจากระบบทุกอุปกรณ์</p>
            <p style={{fontSize:'12px',color:'#6b7280',margin:'0 0 18px',lineHeight:1.5}}>
              อุปกรณ์อื่นๆ ทั้งหมด ({otherCount} อุปกรณ์) จะถูกออกจากระบบทันที<br/>เครื่องนี้จะยังใช้งานต่อได้ปกติ
            </p>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setConfirmOpen(false)}
                style={{flex:1,padding:'11px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>
                ยกเลิก
              </button>
              <button onClick={doSignoutOthers}
                style={{flex:1,padding:'11px',borderRadius:'10px',background:'#ea580c',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Avatar helpers (v0.7.18.x) ────────────────────────────────────────────
// สร้าง public URL ของรูป avatar จาก key ที่เก็บใน DB · มี fallback domain (กันกรณี
// NEXT_PUBLIC_R2_AVATAR_URL ไม่ถูก inline ตอน build บน Cloudflare Worker)
// r2AvatarUrl, normName, nameInitials, AVATAR_PALETTE, colorFromName, AvatarCircle ย้ายไป parts/shared.jsx (เฟส 1d)

// ── Avatar crop + upload (v0.7.18.0) ──────────────────────────────────────
// loadImageEl ย้ายไป parts/shared.jsx (เฟส 5 — ใช้ร่วม images + avatar crop)
// ครอบ + ย่อเป็น WebP จัตุรัส (EXIF/GPS หายอัตโนมัติ เพราะวาดลง canvas ใหม่)
// เก็บเป็น "สี่เหลี่ยม" เต็มกรอบครอบ (รวมมุม/ผมที่อยู่นอกวงกลม) → avatar เล็กแสดงเป็นวงกลมด้วย CSS
// รูปครอบนี้ใช้แสดง avatar เล็กเท่านั้น (≤90px) → เก็บแค่ 512px พอ · รูปกดดูเต็มใช้ "ต้นฉบับ" แทน
// out = min(outMax, ความละเอียดจริงของบริเวณที่ครอบ) → ไม่ขยายเกินรูปจริง (กันรูปแตก)

export { SessionsPanel }
