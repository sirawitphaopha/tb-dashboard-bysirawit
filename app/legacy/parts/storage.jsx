'use client'
/**
 * parts/storage.jsx — domain: มอนิเตอร์พื้นที่จัดเก็บ (admin)
 * ย้ายจาก tb-monolith.jsx (เฟส 3a) — โค้ดเดิม ไม่แก้ logic
 * _settingsWantTab (dashboard กดการ์ด → เปิดแท็บ storage) เปลี่ยนเป็น window._settingsWantTab
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
const { useState, useEffect, useRef } = React
let _storageCache = null, _storageAt = 0;
const STORAGE_TTL = 5*60*1000;
function _readStorageLS() {   // อ่านแคชจากเบราว์เซอร์ (ข้ามรีเฟรช) ถ้ายังสด
  try { const s = JSON.parse(localStorage.getItem('tb_storage')||'null'); if (s && (Date.now()-s.ts < STORAGE_TTL)) { _storageCache = s.d; _storageAt = s.ts; return s.d; } } catch {}
  return null;
}
async function fetchStorageUsage(force) {
  if (!force) {
    if (_storageCache && (Date.now()-_storageAt < STORAGE_TTL)) return _storageCache;
    const ls = _readStorageLS(); if (ls) return ls;
  }
  const r = await fetch('/api/admin/storage');
  if (!r.ok) throw new Error('storage ' + r.status);
  const d = await r.json(); _storageCache = d; _storageAt = Date.now();
  try { localStorage.setItem('tb_storage', JSON.stringify({ d, ts: _storageAt })); } catch {}
  return d;
}
const fmtStorageBytes = (b) => b==null?'—':(b<1024?b+' B':b<1048576?(b/1024).toFixed(0)+' KB':b<1073741824?(b/1048576).toFixed(1)+' MB':(b/1073741824).toFixed(2)+' GB');
const storagePct = (used, quota) => quota ? (used/quota*100) : 0;               // ตัวเลขดิบ
const storagePctStr = (used, quota) => storagePct(used, quota).toFixed(3);       // x.xxx
const R2_CAT_COLORS = { cxr:'#0d9488', lab:'#d97706', document:'#7c3aed', other:'#64748b' };
const R2_CAT_LABELS = { cxr:'CXR', lab:'Lab', document:'เอกสาร', other:'อื่นๆ' };

// การ์ดเล็กบน Dashboard (ขนาดเท่าการ์ด KPI · กดเข้าตั้งค่า) — ไม่ใช่แอดมิน → null
function StorageMiniCard({ onOpen }) {
  const [data, setData] = React.useState(() => _storageCache || (typeof window!=='undefined' ? _readStorageLS() : null));
  const [hovered, setHovered] = React.useState(false);
  React.useEffect(() => { let ok=true; fetchStorageUsage().then(d=>ok&&setData(d)).catch(()=>{}); return ()=>{ok=false;}; }, []);
  const dbP = data ? storagePct(data.db.total, data.db.quota) : null;
  const r2P = data ? storagePct(data.r2.total, data.r2.quota) : null;
  const row = (label, pct, color) => (
    <div style={{marginBottom:'8px'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}><span style={{fontSize:'11px',color:'#6b7280'}}>{label}</span><span style={{fontSize:'11px',fontWeight:700,color:pct==null?'#cbd5e1':(pct>=80?'#dc2626':color)}}>{pct==null?'···':pct.toFixed(3)+'%'}</span></div>
      <div style={{height:'6px',background:'#f1f5f9',borderRadius:'999px',overflow:'hidden'}}>{pct!=null && <div style={{height:'100%',width:(pct>0?Math.max(pct,1.5):0)+'%',background:pct>=80?'#dc2626':color,borderRadius:'999px',transition:'width 0.6s ease'}}/>}</div>
    </div>
  );
  return (
    <div onClick={onOpen} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{background:'#fff',border:'2px solid '+(hovered?'#0d9488':'#99f6e4'),borderRadius:'16px',overflow:'hidden',cursor:'pointer',boxShadow:hovered?'0 10px 28px rgba(0,0,0,0.13)':'0 1px 4px rgba(0,0,0,0.06)',transform:hovered?'translateY(-5px) scale(1.025)':'translateY(0) scale(1)',transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)'}}>
      <div style={{height:'3px',background:'#0d9488'}}></div>
      <div style={{padding:'15px',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
          <span style={{fontSize:'13px',fontWeight:700,color:'#0f766e'}}><i className="fa-solid fa-hard-drive" style={{marginRight:'6px'}}></i>พื้นที่จัดเก็บ</span>
          <i className="fa-solid fa-chevron-right" style={{fontSize:'11px',color:'#cbd5e1'}}></i>
        </div>
        {row('ฐานข้อมูล', dbP, '#0d9488')}
        {row('รูปภาพ', r2P, '#b45309')}
      </div>
    </div>
  );
}

// donut ด้วย conic-gradient · segments=[{color,pct}]
function StorageDonut({ segments, size=110 }) {
  const [on, setOn] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  React.useEffect(()=>{ const t=setTimeout(()=>setOn(true),80); return ()=>clearTimeout(t); },[]);
  let acc=0; const stops = segments.filter(s=>s.pct>0).map(s=>{ const f=acc; acc+=s.pct; return `${s.color} ${f}% ${acc}%`; });
  const bg = stops.length ? `conic-gradient(${stops.join(', ')})` : '#e5e7eb';
  return <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{width:size+'px',height:size+'px',borderRadius:'50%',background:bg,position:'relative',flexShrink:0,opacity:on?1:0,transform:on?(hovered?'scale(1.05)':'scale(1)'):'scale(0.85)',transition:'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)'}}><div style={{position:'absolute',inset:(size*0.2)+'px',borderRadius:'50%',background:'#fff'}}/></div>;
}

// รายละเอียดเต็มในหน้าตั้งค่า (บาร์แบ่งสี iPhone-style + กราฟวงกลม + ลิงก์)
function StorageDetail() {
  const [data, setData] = React.useState(() => _storageCache || (typeof window!=='undefined' ? _readStorageLS() : null));
  const [err, setErr] = React.useState(false);
  const [anim, setAnim] = React.useState(false);
  const [hov, setHov] = React.useState(null);
  React.useEffect(() => { let ok=true; fetchStorageUsage().then(d=>ok&&setData(d)).catch(()=>ok&&setErr(true)); return ()=>{ok=false;}; }, []);
  React.useEffect(() => { if(data){ const t=setTimeout(()=>setAnim(true),80); return ()=>clearTimeout(t); } }, [data]);
  if (err) return <p style={{fontSize:'13px',color:'#dc2626'}}>โหลดข้อมูลพื้นที่ไม่สำเร็จ</p>;
  if (!data) return <p style={{fontSize:'13px',color:'#6b7280'}}>กำลังโหลด...</p>;

  const usageBar = (used, quota, color) => {
    const p = storagePct(used, quota), warn = p>=80;
    return (
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'6px'}}>
          <span style={{fontSize:'13px',color:'#374151'}}>ใช้ไป <span style={{fontWeight:700,color:warn?'#dc2626':color}}>{fmtStorageBytes(used)}</span> จาก {fmtStorageBytes(quota)}</span>
          <span style={{fontSize:'13px',fontWeight:700,color:warn?'#dc2626':color}}>{storagePctStr(used,quota)}%</span>
        </div>
        <div style={{height:'14px',background:'#f1f5f9',border:'1px solid #e5e7eb',borderRadius:'999px',overflow:'hidden'}}>
          <div style={{height:'100%',width:(anim?(p>0?Math.max(p,0.8):0):0)+'%',background:warn?'#dc2626':color,borderRadius:'999px',transition:'width 0.9s cubic-bezier(0.34,1.2,0.64,1)'}}/>
        </div>
      </div>
    );
  };
  const segBar = (segs) => (
    <div>
      <div style={{height:'22px',marginBottom:'8px',fontSize:'12px',fontWeight:700,color:'#374151',display:'flex',alignItems:'center'}}>
        {hov ? <><span style={{width:'11px',height:'11px',borderRadius:'3px',background:hov.color,marginRight:'7px'}}/>{hov.label} · {fmtStorageBytes(hov.bytes)} · {hov.pct.toFixed(1)}%</> : <span style={{color:'#9ca3af',fontWeight:400}}>เลื่อนเมาส์ชี้แถบ / วงกลม เพื่อดูรายละเอียด</span>}
      </div>
      <div style={{display:'flex',height:'20px',borderRadius:'999px',overflow:'hidden',border:'1px solid #e5e7eb',background:'#f1f5f9'}}>
        {segs.filter(s=>s.pct>0).map((s,i)=><div key={i} onMouseEnter={()=>setHov(s)} onMouseLeave={()=>setHov(null)} style={{width:(anim?s.pct:0)+'%',background:s.color,minWidth:anim?'3px':0,opacity:(hov&&hov.label!==s.label)?0.4:1,transition:'width 0.9s cubic-bezier(0.34,1.3,0.64,1), opacity 0.2s ease'}}/>)}
      </div>
    </div>
  );
  const legend = (segs, interactive) => (
    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
      {segs.map((s,i)=>(
        <div key={i} onMouseEnter={interactive?()=>setHov(s):undefined} onMouseLeave={interactive?()=>setHov(null):undefined} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',cursor:'default',background:(interactive&&hov&&hov.label===s.label)?'#f1f5f9':'transparent',borderRadius:'6px',padding:'3px 5px',transition:'background 0.15s'}}>
          <span style={{width:'11px',height:'11px',borderRadius:'3px',background:s.color,flexShrink:0}}/>
          <span style={{color:'#374151',flex:1}}>{s.label}</span>
          <span style={{color:'#6b7280'}}>{fmtStorageBytes(s.bytes)}</span>
          <span style={{color:'#9ca3af',minWidth:'46px',textAlign:'right'}}>{s.pct.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );

  // Supabase composition: ข้อมูลจริง vs พื้นที่ระบบ (รวม = total เป๊ะ)
  const dbT = data.db.total || 1;
  const dbSegs = [
    { label:'ข้อมูลจริง (ตารางของเรา)', bytes:data.db.userTables, color:'#0d9488', pct:data.db.userTables/dbT*100 },
    { label:'พื้นที่ระบบ (Postgres + extension)', bytes:data.db.systemSpace, color:'#94a3b8', pct:data.db.systemSpace/dbT*100 },
  ];
  // R2 composition: หมวดรูป + โปรไฟล์ (สัดส่วน)
  const bt = data.r2.byType || {};
  const r2Raw = [
    { key:'cxr', bytes:bt.cxr||0 }, { key:'lab', bytes:bt.lab||0 },
    { key:'document', bytes:bt.document||0 }, { key:'other', bytes:bt.other||0 },
    { key:'avatar', bytes:data.r2.avatarTotal||0 },
  ];
  const compTotal = r2Raw.reduce((a,s)=>a+s.bytes,0) || 1;
  const r2Segs = r2Raw.map(s=>({
    label: s.key==='avatar' ? 'รูปโปรไฟล์' : R2_CAT_LABELS[s.key],
    bytes: s.bytes,
    color: s.key==='avatar' ? '#2563eb' : R2_CAT_COLORS[s.key],
    pct: s.bytes/compTotal*100,
  }));

  const linkBtn = (href, icon, label) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'#0d9488',fontWeight:700,textDecoration:'none',border:'1px solid #99f6e4',borderRadius:'8px',padding:'6px 12px'}}><i className={'fa-solid '+icon}></i>{label}<i className="fa-solid fa-arrow-up-right-from-square" style={{fontSize:'10px'}}></i></a>
  );

  const sectionStyle = {background:'#fff',border:'1px solid #e5e7eb',borderRadius:'14px',padding:'18px 20px',marginBottom:'16px'};

  return (
    <div>
      {/* ── Supabase ── */}
      <div style={sectionStyle}>
        <p style={{fontSize:'14px',fontWeight:700,color:'#0f766e',margin:'0 0 14px'}}><i className="fa-solid fa-database" style={{marginRight:'8px'}}></i>ฐานข้อมูล (Supabase)</p>
        {usageBar(data.db.total, data.db.quota, '#0d9488')}
        <div style={{display:'flex',gap:'20px',alignItems:'center',marginTop:'18px',flexWrap:'wrap'}}>
          <StorageDonut segments={dbSegs}/>
          <div style={{flex:1,minWidth:'220px'}}>{legend(dbSegs)}</div>
        </div>
        <p style={{fontSize:'11px',color:'#9ca3af',margin:'14px 0 12px',lineHeight:1.6}}><i className="fa-solid fa-circle-info" style={{marginRight:'5px'}}></i>"พื้นที่ระบบ" คือตารางระบบของ Postgres + extension ที่มีมาตั้งแต่โปรเจกต์ว่างๆ ลบไม่ได้ · ข้อมูลจริงของเราใช้แค่ {fmtStorageBytes(data.db.userTables)}</p>
        {linkBtn('https://supabase.com/dashboard/project/cioswzdbonnbhbyynrhh','fa-database','เปิด Supabase Dashboard')}
      </div>

      {/* ── R2 ── */}
      <div style={sectionStyle}>
        <p style={{fontSize:'14px',fontWeight:700,color:'#b45309',margin:'0 0 14px'}}><i className="fa-solid fa-images" style={{marginRight:'8px'}}></i>รูปภาพ (Cloudflare R2)</p>
        {usageBar(data.r2.total, data.r2.quota, '#b45309')}
        <p style={{fontSize:'12px',fontWeight:700,color:'#6b7280',margin:'18px 0 8px'}}>แบ่งตามหมวด (สัดส่วนการใช้พื้นที่รูป)</p>
        {segBar(r2Segs)}
        <div style={{display:'flex',gap:'20px',alignItems:'center',marginTop:'16px',flexWrap:'wrap'}}>
          <StorageDonut segments={r2Segs}/>
          <div style={{flex:1,minWidth:'220px'}}>{legend(r2Segs, true)}</div>
        </div>
        <p style={{fontSize:'11px',color:'#9ca3af',margin:'14px 0 12px',lineHeight:1.6}}><i className="fa-solid fa-circle-info" style={{marginRight:'5px'}}></i>รูปทั้งหมด {data.r2.count} ไฟล์ · สัดส่วนคิดจากขนาดที่บันทึกในระบบ (ทัมเนลนับรวมในถังคนไข้)</p>
        {linkBtn('https://dash.cloudflare.com/?to=/:account/r2/overview','fa-cloud','เปิด Cloudflare R2')}
      </div>

      <p style={{fontSize:'11px',color:'#9ca3af',margin:'2px 0 0'}}>โควตาอิงแพ็กเกจฟรี · Supabase 500 MB · R2 10 GB · ถ้าอัปเกรดแพ็กเกจแจ้งแคลร์เพื่อแก้โควตา</p>
    </div>
  );
}

function StorageAlert({ currentUser }) {   // popup เตือน >=80% ทุกครั้งที่เข้าเว็บ · แอดมินเท่านั้น
  const [alert, setAlert] = React.useState(null);
  const [closed, setClosed] = React.useState(false);
  React.useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    let ok=true;
    fetchStorageUsage().then(d=>{ if(ok && (storagePct(d.db.total,d.db.quota)>=80 || storagePct(d.r2.total,d.r2.quota)>=80)) setAlert(d); }).catch(()=>{});
    return ()=>{ok=false;};
  }, [currentUser?.role]);
  if (!alert || closed) return null;
  const items = [];
  if (storagePct(alert.db.total,alert.db.quota)>=80) items.push({ label:'ฐานข้อมูล (Supabase)', pct:storagePctStr(alert.db.total,alert.db.quota) });
  if (storagePct(alert.r2.total,alert.r2.quota)>=80) items.push({ label:'รูปภาพ (Cloudflare R2)', pct:storagePctStr(alert.r2.total,alert.r2.quota) });
  return createPortal(
    <div className="tb-backdrop" style={{position:'fixed',inset:0,zIndex:10005,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={()=>setClosed(true)}>
      <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'380px',padding:'24px',textAlign:'center'}}>
        <div style={{width:'54px',height:'54px',borderRadius:'50%',background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}><i className="fa-solid fa-triangle-exclamation" style={{color:'#dc2626',fontSize:'22px'}}></i></div>
        <p style={{fontSize:'16px',fontWeight:700,color:'#111827',margin:'0 0 8px'}}>พื้นที่จัดเก็บใกล้เต็ม</p>
        <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'12px',margin:'0 0 16px'}}>
          {items.map((it,i)=><p key={i} style={{fontSize:'13px',color:'#991b1b',margin:i?'6px 0 0':'0',fontWeight:700}}>{it.label} · ใช้ไป {it.pct}%</p>)}
        </div>
        <p style={{fontSize:'12px',color:'#6b7280',margin:'0 0 16px',lineHeight:1.6}}>แนะนำล้างถังขยะรูป / ลบข้อมูลเก่า หรือพิจารณาอัปเกรดแพ็กเกจ ก่อนพื้นที่เต็ม</p>
        <button onClick={()=>setClosed(true)} style={{width:'100%',padding:'11px',borderRadius:'10px',background:'#0d9488',color:'#fff',fontWeight:700,fontSize:'14px',border:'none',cursor:'pointer'}}>รับทราบ</button>
      </div>
    </div>, document.body
  );
}

export { StorageMiniCard, StorageDonut, StorageDetail, StorageAlert }
