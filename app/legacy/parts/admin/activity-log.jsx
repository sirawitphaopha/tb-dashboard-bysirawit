'use client'
/**
 * parts/admin/activity-log.jsx — บันทึกกิจกรรม (timeline เข้า/ออก/รหัสผ่าน ฯลฯ)
 * ย้ายจาก parts/admin.jsx (แยกรอบ 2) — โค้ดเดิม ไม่แก้ logic
 *   activityMeta, activityReason, activityDeviceIcon, ActivityLogTab
 */
import * as React from 'react'
const { useState, useEffect } = React
import { FilterSelect } from '../shared'

// ─────────────────────────────────────────────────────
// ActivityLogTab — บันทึกกิจกรรม (timeline รวม เข้า/ออก/รหัสผ่าน/easter)
// ดึงจาก /api/admin/activity-log (view tb_activity_log ผ่าน service_role)
// ─────────────────────────────────────────────────────
function activityMeta(eventKey) {
  switch (eventKey) {
    case 'login_success':           return { icon:'fa-right-to-bracket',  color:'#16a34a', bg:'#dcfce7', label:'เข้าสู่ระบบ' };
    case 'login_failed':            return { icon:'fa-circle-xmark',      color:'#dc2626', bg:'#fef2f2', label:'เข้าสู่ระบบไม่สำเร็จ' };
    case 'logout_manual':           return { icon:'fa-right-from-bracket', color:'#0d9488', bg:'#f0fdfa', label:'ออกจากระบบ' };
    case 'logout_session_expired':  return { icon:'fa-clock',             color:'#6b7280', bg:'#f3f4f6', label:'เซสชันหมดอายุ' };
    case 'logout_forced_by_user':   return { icon:'fa-right-from-bracket', color:'#d97706', bg:'#fffbeb', label:'ออกจากอุปกรณ์อื่น' };
    case 'logout_forced_by_admin':  return { icon:'fa-user-shield',       color:'#dc2626', bg:'#fef2f2', label:'ผู้ดูแลระบบบังคับออก' };
    case 'password_change_success': return { icon:'fa-key',               color:'#16a34a', bg:'#dcfce7', label:'เปลี่ยนรหัสผ่าน' };
    case 'password_change_failed':  return { icon:'fa-key',               color:'#dc2626', bg:'#fef2f2', label:'เปลี่ยนรหัสผ่านไม่สำเร็จ' };
    case 'password_reset_success':  return { icon:'fa-key',               color:'#16a34a', bg:'#dcfce7', label:'ตั้งรหัสผ่านใหม่' };
    case 'password_reset_failed':   return { icon:'fa-key',               color:'#dc2626', bg:'#fef2f2', label:'ตั้งรหัสผ่านใหม่ไม่สำเร็จ' };
    case 'password_reset_request':  return { icon:'fa-envelope',          color:'#2563eb', bg:'#eff6ff', label:'ขอลิงก์ลืมรหัสผ่าน' };
    case 'easter_discovered':       return { icon:'fa-egg',               color:'#8b5cf6', bg:'#f5f3ff', label:'ค้นพบ Easter Egg 🥚' };
    case 'easter_kicked_out':       return { icon:'fa-egg',               color:'#d97706', bg:'#fffbeb', label:'เล่น Easter Egg จนถูกเตะออก' };
    default:                        return { icon:'fa-circle-info',       color:'#6b7280', bg:'#f3f4f6', label:eventKey };
  }
}
function activityReason(detail) {
  const map = {
    wrong_password:      'รหัสผ่านไม่ถูกต้อง',
    user_not_found:      'ไม่พบบัญชีผู้ใช้',
    username_not_found:  'ไม่พบชื่อผู้ใช้',
    rate_limited_email:  'ถูกระงับชั่วคราว (กรอกผิดหลายครั้ง)',
    rate_limited_ip:     'ถูกระงับชั่วคราว (IP ผิดปกติ)',
    rate_limited:        'ถูกระงับชั่วคราว',
    wrong_old_password:  'รหัสผ่านเดิมไม่ถูกต้อง',
    weak_password:       'รหัสผ่านไม่ผ่านเกณฑ์ความปลอดภัย',
    invalid_token:       'ลิงก์หมดอายุหรือไม่ถูกต้อง',
    update_failed:       'อัปเดตไม่สำเร็จ',
    failed:              'ส่งเมลไม่สำเร็จ',
  };
  return map[detail] || null;
}
// ไอคอนตามชนิดอุปกรณ์ (FA 6.0.0)
function activityDeviceIcon(t) {
  if (t === 'mobile')  return 'fa-mobile'
  if (t === 'tablet')  return 'fa-tablet'
  if (t === 'unknown') return 'fa-circle-question'
  return 'fa-desktop'
}
// dropdown ที่มีไอคอนนำหน้า + ลูกศรเอง (สวย consistent)
// FilterSelect ย้ายไป parts/shared.jsx (เฟส 1c)
function ActivityLogTab() {
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage]           = useState(0)
  const [hasMore, setHasMore]     = useState(false)
  const [total, setTotal]         = useState(null)
  const [error, setError]         = useState('')

  // v0.7.16.0 — Phase 2 MV refresh
  const [refreshing, setRefreshing]     = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null)
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/activity-log/refresh', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setLastRefreshedAt(data.refreshed_at)
        loadPage(0)  // reload ทันที
      }
    } catch {}
    setRefreshing(false)
  }

  // filter state (รอบ 2)
  const [users, setUsers]   = useState([])
  const [fUser, setFUser]   = useState('')   // user_id
  const [fType, setFType]   = useState('')   // login/login_failed/logout/password/easter
  // v0.7.17.3 Phase 4A — default '30d' (เห็นเฉพาะ 30 วันล่าสุด เพิ่ม performance + ความเกี่ยวข้อง)
  const [fTime, setFTime]   = useState('30d')   // today/7d/30d/custom
  const [fDevice, setFDevice] = useState('') // desktop/mobile/tablet/unknown
  const [fDeviceFp, setFDeviceFp] = useState('') // device_fp (แยกเครื่องจริง)
  const [fDateFrom, setFDateFrom] = useState('')   // YYYY-MM-DD (กำหนดเอง)
  const [fDateTo, setFDateTo]     = useState('')
  const [searchInput, setSearchInput] = useState('')  // ช่องพิมพ์ (raw)
  const [fSearch, setFSearch]         = useState('')  // คำค้นหลัง debounce
  const [fSuspicious, setFSuspicious] = useState(false)  // เฉพาะเหตุการณ์น่าสงสัย

  // debounce ช่องค้นหา 400ms (ไม่ยิง API ทุกตัวอักษร)
  useEffect(() => {
    const t = setTimeout(() => setFSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // ดึงรายชื่อผู้ใช้สำหรับ dropdown (admin อ่าน profiles ได้ผ่าน RLS)
  useEffect(() => {
    (async () => {
      const { data } = await window._sb
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name', { ascending: true })
      setUsers(data || [])
    })()
  }, [])

  const computeSince = (key) => {
    const now = new Date()
    if (key === 'today') { const d = new Date(now); d.setHours(0,0,0,0); return d.toISOString() }
    if (key === '7d')    return new Date(now.getTime() - 7  * 86400000).toISOString()
    if (key === '30d')   return new Date(now.getTime() - 30 * 86400000).toISOString()
    return null
  }

  const buildParams = (p) => {
    const params = new URLSearchParams()
    params.set('page', String(p))
    params.set('pageSize', '50')
    if (fUser) params.set('userId', fUser)
    if (fType === 'login_failed') { params.set('category', 'login'); params.set('failedOnly', '1') }
    else if (fType)               { params.set('category', fType) }
    // ช่วงเวลา
    if (fTime === 'custom') {
      if (fDateFrom) params.set('since', new Date(fDateFrom + 'T00:00:00').toISOString())
      if (fDateTo)   params.set('until', new Date(fDateTo + 'T23:59:59.999').toISOString())
    } else {
      const since = computeSince(fTime)
      if (since) params.set('since', since)
    }
    if (fDevice)     params.set('device', fDevice)
    if (fDeviceFp)   params.set('deviceFp', fDeviceFp)
    if (fSearch)     params.set('q', fSearch)
    if (fSuspicious) params.set('suspicious', '1')
    return params
  }

  const loadPage = async (p) => {
    p === 0 ? setLoading(true) : setLoadingMore(true)
    setError('')
    try {
      const res  = await fetch(`/api/admin/activity-log?${buildParams(p).toString()}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'โหลดข้อมูลล้มเหลว') }
      else {
        setEvents(prev => p === 0 ? data.events : [...prev, ...data.events])
        setHasMore(data.hasMore)
        if (typeof data.total === 'number') setTotal(data.total)
        setPage(p)
      }
    } catch { setError('เกิดข้อผิดพลาด กรุณาลองใหม่') }
    setLoading(false); setLoadingMore(false)
  }

  // โหลดใหม่ทุกครั้งที่เปลี่ยนฟิลเตอร์ (รวมตอน mount)
  useEffect(() => { loadPage(0) }, [fUser, fType, fTime, fDevice, fDeviceFp, fDateFrom, fDateTo, fSearch, fSuspicious])

  const selStyle = { fontSize:'12px', padding:'7px 10px', borderRadius:'9px', border:'1px solid #e5e7eb', background:'#fff', color:'#374151', outline:'none', cursor:'pointer' }

  const fmtDateTime = (iso) => iso
    ? new Date(iso).toLocaleString('th-TH', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
    : '—'

  // มีตัวกรอง active ไหม (ใช้ย่อช่องค้นหา + โชว์ปุ่มล้าง)
  const hasActiveFilter = !!(fUser || fType || fTime || fDevice || fDeviceFp || fSearch || fSuspicious)

  // แปลง event → ค่า fType สำหรับกรอง (กดที่การกระทำในแถว)
  const eventToFType = (e) => {
    if (e.category === 'login') return e.success === false ? 'login_failed' : 'login'
    return e.category  // logout / password / easter
  }
  // กดที่วันที่ในแถว → ตั้งช่วงเวลาเป็นวันนั้นทั้งวัน
  const pickDate = (iso) => {
    const d = new Date(iso)
    const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    setFTime('custom'); setFDateFrom(ymd); setFDateTo(ymd)
  }

  return (
    <div style={{padding:'16px',maxWidth:'960px',margin:'0 auto'}}>
      {/* ส่วนหัว + แถบฟิลเตอร์ ตรึงไว้ด้านบน (sticky) ตอนเลื่อนดูรายการ */}
      <div style={{position:'sticky',top:'-24px',zIndex:20,background:'#f0fdfa',margin:'-16px -16px 8px',padding:'4px 16px 0'}}>
      {/* Header banner */}
      <div style={{background:'linear-gradient(135deg,#0f766e 0%,#0d9488 100%)',borderRadius:'16px',padding:'18px 20px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'14px',boxShadow:'0 2px 8px rgba(13,148,136,0.2)'}}>
        <div style={{width:'48px',height:'48px',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)',flexShrink:0}}>
          <i className="fa-solid fa-wave-square" style={{color:'#fff',fontSize:'20px'}}></i>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <h2 style={{fontWeight:700,color:'#fff',margin:0,fontSize:'18px'}}>บันทึกกิจกรรม</h2>
          <p style={{fontSize:'12px',color:'#ccfbf1',margin:'2px 0 0'}}>ประวัติการเข้า/ออกจากระบบ การเปลี่ยนรหัสผ่าน และกิจกรรมอื่นของผู้ใช้ทุกคน</p>
        </div>
        {!loading && (
          <span style={{fontSize:'12px',fontWeight:700,padding:'5px 13px',borderRadius:'999px',background:'#fff',color:'#0f766e',flexShrink:0,whiteSpace:'nowrap'}}>
            {total != null ? total : events.length} รายการ
          </span>
        )}
        {/* v0.7.16.0 — ปุ่ม Refresh MV + indicator */}
        <button type="button" onClick={handleRefresh} disabled={refreshing}
          title={lastRefreshedAt ? `รีเฟรชล่าสุด: ${new Date(lastRefreshedAt).toLocaleTimeString('th-TH')}` : 'รีเฟรชข้อมูลล่าสุด (ข้อมูลอาจเก่าสุด 5 นาที)'}
          style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px',fontWeight:700,padding:'5px 11px',borderRadius:'999px',background:'rgba(255,255,255,0.15)',color:'#fff',border:'1px solid rgba(255,255,255,0.3)',cursor:refreshing?'wait':'pointer',flexShrink:0,whiteSpace:'nowrap',opacity:refreshing?0.6:1}}>
          <i className={`fa-solid fa-rotate ${refreshing?'fa-spin':''}`}></i>
          {refreshing ? 'กำลังรีเฟรช' : 'รีเฟรชล่าสุด'}
        </button>
      </div>

      {/* Filter panel */}
      <div style={{background:'linear-gradient(135deg,#f0fdfa 0%,#f8fafc 100%)',border:'1px solid #d1fae5',borderRadius:'14px',padding:'12px',marginBottom:'0'}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}}>
          {/* ช่องค้นหาทุกอย่าง — ย่อแคบลงเมื่อมีตัวกรอง active เพื่อให้อยู่แถวเดียว */}
          <div style={{position:'relative',flex: hasActiveFilter ? '1 1 130px' : '1 1 200px',minWidth: hasActiveFilter ? '120px' : '170px',transition:'flex 0.2s'}}>
            <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'#0d9488',fontSize:'12px'}}></i>
            <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
              placeholder="ค้นหาชื่อ / อีเมล / IP"
              style={{width:'100%',fontSize:'12px',padding:'9px 30px 9px 32px',borderRadius:'9px',border:'1px solid #e5e7eb',outline:'none',boxSizing:'border-box',background:'#fff'}}/>
            {searchInput && (
              <i className="fa-solid fa-xmark" onClick={()=>setSearchInput('')}
                style={{position:'absolute',right:'11px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'12px',cursor:'pointer'}}></i>
            )}
          </div>
          <FilterSelect icon="fa-user" value={fUser} onChange={e=>setFUser(e.target.value)}>
            <option value="">ผู้ใช้ทั้งหมด</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{`${u.first_name||''} ${u.last_name||''}`.trim() || u.id}</option>
            ))}
          </FilterSelect>
          <FilterSelect icon="fa-tag" value={fType} onChange={e=>setFType(e.target.value)}>
            <option value="">ทุกกิจกรรม</option>
            <option value="login">เข้าสู่ระบบ</option>
            <option value="login_failed">เข้าระบบไม่สำเร็จ</option>
            <option value="logout">ออกจากระบบ</option>
            <option value="password">รหัสผ่าน</option>
            <option value="easter">Easter Egg</option>
          </FilterSelect>
          <FilterSelect icon="fa-laptop" value={fDevice} onChange={e=>setFDevice(e.target.value)}>
            <option value="">ทุกอุปกรณ์</option>
            <option value="desktop">คอมพิวเตอร์</option>
            <option value="mobile">มือถือ</option>
            <option value="tablet">แท็บเล็ต</option>
            <option value="unknown">ไม่ทราบ</option>
          </FilterSelect>
          <FilterSelect icon="fa-calendar" value={fTime} onChange={e=>setFTime(e.target.value)}>
            <option value="">ทุกช่วงเวลา</option>
            <option value="today">วันนี้</option>
            <option value="7d">7 วันล่าสุด</option>
            <option value="30d">30 วันล่าสุด</option>
            <option value="custom">กำหนดเอง</option>
          </FilterSelect>
          {/* chip: กำลังกรองตามเครื่อง (device fingerprint) */}
          {fDeviceFp && (
            <span style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'12px',fontWeight:600,padding:'8px 12px',borderRadius:'9px',background:'#f5f3ff',border:'1px solid #ddd6fe',color:'#7c3aed'}}>
              <i className="fa-solid fa-fingerprint" style={{fontSize:'11px'}}></i>เครื่อง {fDeviceFp.slice(0,8)}
              <i className="fa-solid fa-xmark" onClick={()=>setFDeviceFp('')} style={{cursor:'pointer',marginLeft:'2px'}}></i>
            </span>
          )}
          {/* ปุ่มด่วน: เหตุการณ์น่าสงสัย */}
          <button onClick={()=>setFSuspicious(v=>!v)}
            style={{fontSize:'12px',fontWeight:600,padding:'9px 13px',borderRadius:'9px',border:`1px solid ${fSuspicious?'#dc2626':'#fecaca'}`,background:fSuspicious?'#dc2626':'#fff',color:fSuspicious?'#fff':'#b91c1c',cursor:'pointer',transition:'all 0.15s',boxShadow:fSuspicious?'0 2px 8px rgba(220,38,38,0.3)':'none'}}>
            <i className="fa-solid fa-triangle-exclamation" style={{marginRight:'5px'}}></i>น่าสงสัย
          </button>
          {hasActiveFilter && (
            <button onClick={()=>{ setFUser(''); setFType(''); setFTime(''); setFDevice(''); setFDeviceFp(''); setFDateFrom(''); setFDateTo(''); setSearchInput(''); setFSearch(''); setFSuspicious(false); }}
              title="ล้างตัวกรองทั้งหมด"
              style={{fontSize:'12px',fontWeight:600,padding:'9px 12px',borderRadius:'9px',border:'1px solid #fcd34d',background:'#fffbeb',color:'#b45309',cursor:'pointer',whiteSpace:'nowrap'}}>
              <i className="fa-solid fa-rotate-left" style={{marginRight:'5px'}}></i>ล้างค่า
            </button>
          )}
        </div>

        {/* ช่วงวันที่กำหนดเอง */}
        {fTime === 'custom' && (
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center',marginTop:'10px',paddingTop:'10px',borderTop:'1px dashed #99f6e4'}}>
            <span style={{fontSize:'12px',color:'#0f766e',fontWeight:600}}><i className="fa-solid fa-calendar-day" style={{marginRight:'5px'}}></i>จากวันที่</span>
            <input type="date" value={fDateFrom} max={fDateTo || undefined} onChange={e=>setFDateFrom(e.target.value)} style={{...selStyle,background:'#fff'}}/>
            <span style={{fontSize:'12px',color:'#0f766e',fontWeight:600}}>ถึงวันที่</span>
            <input type="date" value={fDateTo} min={fDateFrom || undefined} onChange={e=>setFDateTo(e.target.value)} style={{...selStyle,background:'#fff'}}/>
          </div>
        )}
      </div>
      </div>{/* /sticky ส่วนหัว+ฟิลเตอร์ */}

      {loading ? (
        <div style={{textAlign:'center',padding:'60px 0',color:'#9ca3af',fontSize:'13px'}}>
          <i className="fa-solid fa-spinner fa-spin" style={{fontSize:'22px',marginBottom:'8px',display:'block'}}></i>กำลังโหลด...
        </div>
      ) : error ? (
        <div style={{padding:'14px',borderRadius:'10px',background:'#fef2f2',color:'#dc2626',fontSize:'13px'}}>
          <i className="fa-solid fa-circle-exclamation" style={{marginRight:'8px'}}></i>{error}
        </div>
      ) : events.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 0',color:'#9ca3af',fontSize:'13px'}}>
          {hasActiveFilter ? 'ไม่พบรายการตามเงื่อนไขที่กรอง' : 'ยังไม่มีบันทึกกิจกรรม'}
        </div>
      ) : (
        <>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {events.map((e, i) => {
              const m = activityMeta(e.event_key)
              const reason = e.success === false ? activityReason(e.detail) : null
              return (
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'12px 14px',borderRadius:'10px',border:'1px solid #e5e7eb',background:'#fff'}}>
                  <div style={{width:'34px',height:'34px',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',background:m.bg,flexShrink:0}}>
                    <i className={`fa-solid ${m.icon}`} style={{color:m.color,fontSize:'14px'}}></i>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                      {e.user_id
                        ? <span onClick={()=>setFUser(e.user_id)} title="กรองเฉพาะผู้ใช้คนนี้"
                            style={{fontSize:'13px',fontWeight:700,color:'#1f2937',cursor:'pointer',textDecorationLine:'underline',textDecorationColor:'#d1d5db',textUnderlineOffset:'2px'}}>{e.display_name}</span>
                        : <span style={{fontSize:'13px',fontWeight:700,color:'#1f2937'}}>{e.display_name}</span>}
                      {e.role === 'admin'
                        ? <span style={{fontSize:'9px',fontWeight:700,padding:'1px 7px',borderRadius:'999px',background:'#fef3c7',color:'#92400e'}}>ADMIN</span>
                        : e.role === 'user'
                          ? <span style={{fontSize:'9px',fontWeight:700,padding:'1px 7px',borderRadius:'999px',background:'#e0f2fe',color:'#0369a1'}}>ผู้ใช้</span>
                          : null}
                      <span onClick={()=>setFType(eventToFType(e))} title="กรองเฉพาะกิจกรรมประเภทนี้"
                        style={{fontSize:'12px',fontWeight:600,color:m.color,cursor:'pointer'}}>{m.label}</span>
                    </div>
                    {reason && (
                      <p style={{fontSize:'11px',color:'#dc2626',margin:'3px 0 0'}}>
                        <i className="fa-solid fa-circle-exclamation" style={{marginRight:'4px'}}></i>{reason}
                      </p>
                    )}
                    <div style={{display:'flex',flexWrap:'wrap',gap:'4px 14px',fontSize:'11px',color:'#9ca3af',marginTop:'4px'}}>
                      <span onClick={()=>pickDate(e.event_time)} title="กรองเฉพาะวันนี้"
                        style={{cursor:'pointer'}}>
                        <i className="fa-solid fa-clock" style={{marginRight:'4px'}}></i>{fmtDateTime(e.event_time)}
                      </span>
                      {e.ip_address && (
                        <span onClick={()=>setSearchInput(e.ip_address)} title="กรองดูทุกกิจกรรมจาก IP นี้"
                          style={{cursor:'pointer',color:'#0d9488',fontWeight:600}}>
                          <i className="fa-solid fa-globe" style={{marginRight:'4px'}}></i>{e.ip_address}
                        </span>
                      )}
                      {e.device_label && (
                        <span onClick={()=>e.device_type && setFDevice(e.device_type)} title={e.user_agent || e.device_label}
                          style={{cursor:'pointer'}}>
                          <i className={`fa-solid ${activityDeviceIcon(e.device_type)}`} style={{marginRight:'4px'}}></i>{e.device_label}
                        </span>
                      )}
                      {e.session_short && (
                        <span title={`รหัสครั้งการเข้าใช้ (session)\n${e.session_id || ''}`} style={{color:'#9ca3af',cursor:'help'}}>
                          <i className="fa-solid fa-arrows-rotate" style={{marginRight:'4px'}}></i>session {e.session_short}
                        </span>
                      )}
                      {e.device_fp_short && (
                        <span onClick={()=>setFDeviceFp(e.device_fp)} title={`รหัสประจำเครื่อง (กดเพื่อกรอง)\n${e.device_fp || ''}`}
                          style={{cursor:'pointer',color:'#7c3aed',fontWeight:600}}>
                          <i className="fa-solid fa-fingerprint" style={{marginRight:'4px'}}></i>เครื่อง {e.device_fp_short}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {hasMore && (
            <div style={{textAlign:'center',marginTop:'16px'}}>
              <button onClick={()=>loadPage(page + 1)} disabled={loadingMore}
                style={{padding:'10px 24px',borderRadius:'10px',background:'#f0fdfa',color:'#0d9488',fontWeight:700,fontSize:'13px',border:'1px solid #99f6e4',cursor:loadingMore?'not-allowed':'pointer'}}>
                {loadingMore
                  ? <><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'6px'}}></i>กำลังโหลด...</>
                  : <><i className="fa-solid fa-chevron-down" style={{marginRight:'6px'}}></i>โหลดเพิ่ม</>}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export { ActivityLogTab }
