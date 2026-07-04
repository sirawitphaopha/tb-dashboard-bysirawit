'use client'
/** patient-images/trash.jsx — ถังขยะรูป (ImageTrashPage) + TrashHub (สลับผู้ป่วย/รูป) (แยกรอบ 3) */
import * as React from 'react'
import { createPortal } from 'react-dom'
const { useState, useEffect, useCallback } = React
import { AvatarLightbox } from '../shared'
import { TrashList } from '../misc'
import { patientImgInfo, PATIENT_IMG_TYPES, invalidateImgCaches, IMG_VIEW_SIZES, ImgViewToolbar } from './helpers'

function ImageTrashPage({ currentUser, isAdmin }) {
  const [imgs, setImgs] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr]   = React.useState('');
  const [q, setQ]       = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('expiry');   // expiry = ใกล้ลบถาวรก่อน
  const [pSort, setPSort] = React.useState('name-asc');       // เรียงกลุ่มผู้ป่วย: name(ชื่อ) / hn
  const [mode, setMode] = React.useState('card');
  const [size, setSize] = React.useState(1);
  const [lightbox, setLightbox] = React.useState(null);
  const [restoreT, setRestoreT] = React.useState(null);
  const [hardT, setHardT]       = React.useState(null);
  const [hnInput, setHnInput]   = React.useState('');
  const [hardCheck, setHardCheck] = React.useState(false);
  const [hardStep2, setHardStep2] = React.useState(false);   // ยืนยันซ้ำก่อนลบถาวรจริง

  const load = React.useCallback(async () => {
    setErr('');
    try {
      const r = await fetch('/api/patient/images/all?trash=1');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'โหลดถังขยะไม่สำเร็จ');
      setImgs(d.images || []);
    } catch (e) { setErr(e.message); setImgs([]); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const daysLeft = (delAt) => { if (!delAt) return 60; const el = Math.floor((Date.now() - new Date(delAt).getTime()) / 86400000); return Math.max(0, 60 - el); };

  const doRestore = () => {   // optimistic: หายทันที + กู้คืนจริงเบื้องหลัง
    if (!restoreT) return; const id = restoreT.id;
    setImgs(a => (a||[]).filter(x => x.id !== id)); invalidateImgCaches(); setRestoreT(null); setLightbox(null); setErr('');
    fetch('/api/patient/images/' + id + '/restore', { method: 'POST' })
      .then(r => { if (!r.ok) { setErr('กู้คืนไม่สำเร็จ'); load(); } })
      .catch(() => { setErr('กู้คืนไม่สำเร็จ'); load(); });
  };
  const doHard = () => {   // optimistic: หายทันที + ลบจริงเบื้องหลัง
    if (!hardT) return;
    if (hnInput.trim() !== String(hardT.patient_hn || '') || !hardCheck) return;   // ต้องพิมพ์ HN ตรง + ติ๊ก
    const id = hardT.id;
    setImgs(a => (a||[]).filter(x => x.id !== id)); setHardT(null); setHardStep2(false); setLightbox(null); setErr('');
    fetch('/api/patient/images/' + id + '/hard', { method: 'POST' })
      .then(r => { if (!r.ok) { setErr('ลบถาวรไม่สำเร็จ'); load(); } })
      .catch(() => { setErr('ลบถาวรไม่สำเร็จ'); load(); });
  };

  const ql = q.trim().toLowerCase();
  const filtered = (imgs||[]).filter(im =>
    (typeFilter==='all' || im.type===typeFilter) &&
    (!ql || (im.patient_name||'').toLowerCase().includes(ql) || (im.patient_hn||'').toLowerCase().includes(ql)));
  const sorted = [...filtered].sort((a,b)=> sortBy==='expiry'
    ? new Date(a.deleted_at||0) - new Date(b.deleted_at||0)   // เก่าสุด = ใกล้ลบถาวรสุด → บนสุด
    : new Date(b.deleted_at||0) - new Date(a.deleted_at||0));  // ลบล่าสุดก่อน
  const groups = {};
  sorted.forEach(im => { const k = im.patient_id; if (!groups[k]) groups[k] = { name: im.patient_name, hn: im.patient_hn, items: [] }; groups[k].items.push(im); });
  const groupEntries = Object.entries(groups).sort((a,b)=>{
    const [pf,pd] = pSort.split('-');
    const r = pf==='hn'
      ? String(a[1].hn||'').localeCompare(String(b[1].hn||''), undefined, {numeric:true})
      : (a[1].name||'').localeCompare(b[1].name||'', 'th');
    return pd==='desc' ? -r : r;
  });
  const thumb = IMG_VIEW_SIZES[size].thumb;

  const actionsFor = (im, compact) => isAdmin ? (
    <div style={{display:'flex',gap:'6px'}}>
      <button title="กู้คืน" onClick={(e)=>{e.stopPropagation();setRestoreT(im);}} style={{flex:1,padding:'6px 4px',borderRadius:'8px',background:'#0d9488',color:'#fff',fontWeight:700,fontSize:'11px',border:'none',cursor:'pointer',whiteSpace:'nowrap',overflow:'hidden'}}><i className="fa-solid fa-rotate-left" style={{marginRight:compact?0:'4px'}}></i>{!compact && 'กู้คืน'}</button>
      <button title="ลบถาวร" onClick={(e)=>{e.stopPropagation();setHnInput('');setHardCheck(false);setHardStep2(false);setHardT(im);}} style={{flex:1,padding:'6px 4px',borderRadius:'8px',background:'#fee2e2',color:'#dc2626',fontWeight:700,fontSize:'11px',border:'none',cursor:'pointer',whiteSpace:'nowrap',overflow:'hidden'}}><i className="fa-solid fa-fire" style={{marginRight:compact?0:'4px'}}></i>{!compact && 'ลบถาวร'}</button>
    </div>
  ) : <p style={{fontSize:'10px',color:'#9ca3af',margin:0,textAlign:'center'}}>กู้คืน / ลบถาวร = แอดมิน</p>;

  const renderItem = (im) => {
    const meta = PATIENT_IMG_TYPES[im.type] || PATIENT_IMG_TYPES.other;
    const dl = daysLeft(im.deleted_at);
    const delWhen = im.deleted_at ? new Date(im.deleted_at).toLocaleString('th-TH',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '-';
    if (mode === 'row') {
      const up = new Date(im.uploaded_at).toLocaleString('th-TH',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
      const dimF = (im.width && im.height) ? im.width+' × '+im.height+' px' : '—';
      const qual = im.mime==='image/gif' ? 'GIF' : 'WebP '+(im.type==='cxr'?92:87)+'%';
      const col = (label, val, w) => <div style={{flexShrink:0,width:w}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>{label}</p><p style={{fontSize:'12px',color:'#374151',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{val||'—'}</p></div>;
      return (
        <div key={im.id} onClick={()=>setLightbox(im)} style={{display:'flex',alignItems:'center',gap:'10px',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'7px 10px',background:'#fff',cursor:'zoom-in'}}>
          <div style={{width:thumb+'px',height:thumb+'px',flexShrink:0,borderRadius:'8px',overflow:'hidden',background:'#0b0f19'}}><img src={im.thumbUrl||im.url} alt="" loading="lazy" draggable={false} onContextMenu={e=>e.preventDefault()} style={{width:'100%',height:'100%',objectFit:'cover',filter:'grayscale(0.35)'}}/></div>
          <span style={{flexShrink:0,width:'52px',fontSize:'10px',fontWeight:800,padding:'2px 0',textAlign:'center',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
          {col('ลบเมื่อ', delWhen, '126px')}
          {col('โดย', im.deleter_name, '92px')}
          {col('อัปโหลด', up, '126px')}
          {col('ขนาดภาพ', dimF, '106px')}
          {col('คุณภาพ', qual, '80px')}
          <div style={{flex:1,minWidth:'70px'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>เหตุผล</p><p style={{fontSize:'12px',color:'#374151',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{im.delete_reason||'—'}</p></div>
          <div style={{flexShrink:0,width:'64px',textAlign:'center'}}><p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>เหลือ</p><p style={{fontSize:'12px',fontWeight:700,color:dl<=7?'#dc2626':'#b45309',margin:0}}>{dl} วัน</p></div>
          <div onClick={e=>e.stopPropagation()} style={{flexShrink:0,width:'150px'}}>{actionsFor(im)}</div>
        </div>
      );
    }
    const th = Math.round(IMG_VIEW_SIZES[size].card * 0.72);
    return (
      <div key={im.id} style={{border:'1px solid #e5e7eb',borderRadius:'12px',overflow:'hidden',background:'#fff',display:'flex',flexDirection:'column',height:'100%'}}>
        <div onClick={()=>setLightbox(im)} style={{position:'relative',height:th+'px',flexShrink:0,background:'#0b0f19',cursor:'zoom-in'}}>
          <img src={im.thumbUrl||im.url} alt="" loading="lazy" draggable={false} onContextMenu={e=>e.preventDefault()} style={{width:'100%',height:'100%',objectFit:'cover',filter:'grayscale(0.35)',opacity:0.9}}/>
          <span style={{position:'absolute',top:'6px',right:'6px',fontSize:'10px',fontWeight:800,padding:'2px 7px',borderRadius:'999px',background:meta.bg,color:meta.fg}}>{meta.label}</span>
        </div>
        <div style={{padding:'8px 10px',flex:1,display:'flex',flexDirection:'column'}}>
          <p style={{fontSize:'11px',color:'#6b7280',margin:'0 0 2px'}}>ลบ {delWhen}</p>
          {im.deleter_name && <p style={{fontSize:'11px',color:'#6b7280',margin:'0 0 2px'}}>โดย {im.deleter_name}</p>}
          {im.delete_reason && <p style={{fontSize:'11px',color:'#9ca3af',margin:'0 0 3px',fontStyle:'italic',wordBreak:'break-word'}}>เหตุผล: {im.delete_reason}</p>}
          <div style={{marginTop:'auto'}}>
            <p style={{fontSize:'11px',fontWeight:700,color:dl<=7?'#dc2626':'#b45309',margin:'6px 0 8px'}}><i className="fa-solid fa-clock" style={{marginRight:'4px'}}></i>เหลืออีก {dl} วัน</p>
            {actionsFor(im, size===0)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:'12px',padding:'10px 14px',marginBottom:'14px',fontSize:'12px',color:'#92400e',lineHeight:1.5}}>
        <i className="fa-solid fa-trash" style={{marginRight:'6px'}}></i>รูปในถังขยะเก็บไว้ 60 วัน แล้วลบถาวรอัตโนมัติ · กู้คืน / ลบถาวร ทำได้เฉพาะแอดมิน
      </div>

      {/* แถบกรอง + มุมมอง */}
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center',marginBottom:'14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px',flex:'1 1 180px',minWidth:'160px',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'6px 10px'}}>
          <i className="fa-solid fa-magnifying-glass" style={{fontSize:'12px',color:'#9ca3af'}}></i>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาชื่อ / HN" style={{flex:1,minWidth:0,border:'none',outline:'none',fontSize:'13px',background:'none'}}/>
        </div>
        {['all',...Object.keys(PATIENT_IMG_TYPES)].map(k=>{
          const active=typeFilter===k; const v=PATIENT_IMG_TYPES[k];
          return <button key={k} onClick={()=>setTypeFilter(k)} style={{padding:'4px 12px',borderRadius:'999px',fontSize:'12px',fontWeight:700,border:'1px solid '+(active?'#0d9488':'#e5e7eb'),background:active?'#0d9488':'#fff',color:active?'#fff':'#6b7280',cursor:'pointer'}}>{k==='all'?'ทุกหมวด':v.label}</button>;
        })}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'5px 8px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'12px',color:'#6b7280',cursor:'pointer'}}>
          <option value="expiry">ใกล้ลบถาวรก่อน</option>
          <option value="recent">ลบล่าสุดก่อน</option>
        </select>
        <select value={pSort} onChange={e=>setPSort(e.target.value)} title="เรียงผู้ป่วย" style={{padding:'5px 8px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'12px',color:'#6b7280',cursor:'pointer'}}>
          <option value="name-asc">ชื่อ ก → ฮ</option>
          <option value="name-desc">ชื่อ ฮ → ก</option>
          <option value="hn-asc">HN น้อย → มาก</option>
          <option value="hn-desc">HN มาก → น้อย</option>
        </select>
        <div style={{marginLeft:'auto'}}><ImgViewToolbar mode={mode} setMode={setMode} size={size} setSize={setSize}/></div>
      </div>

      {err && <p style={{fontSize:'12px',color:'#dc2626',margin:'0 0 10px'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{err}</p>}
      {imgs===null && <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>{[0,1,2,3].map(i=><div key={i} className="tb-skel" style={{width:'150px',height:'170px',borderRadius:'10px'}}/>)}</div>}
      {imgs!==null && sorted.length===0 && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'56px 20px'}}>
          <div style={{width:'76px',height:'76px',borderRadius:'50%',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'14px'}}><i className="fa-solid fa-trash" style={{fontSize:'28px',color:'#cbd5e1'}}></i></div>
          <p style={{fontSize:'14px',fontWeight:700,color:'#6b7280',margin:'0 0 4px'}}>{(imgs.length>0)?'ไม่พบรูปที่ตรงกับตัวกรอง':'ถังขยะรูปว่าง'}</p>
          <p style={{fontSize:'12px',color:'#9ca3af',margin:0}}>{(imgs.length>0)?'ลองล้างตัวกรองหรือเปลี่ยนคำค้นหา':'ยังไม่มีรูปที่ถูกลบ'}</p>
        </div>
      )}
      {imgs!==null && sorted.length>0 && groupEntries.map(([pid,g])=>(
        <div key={pid} style={{marginBottom:'20px'}}>
          <p style={{fontWeight:700,fontSize:'13px',color:'#1f2937',margin:'0 0 8px',borderLeft:'3px solid #0d9488',paddingLeft:'8px'}}>{g.name}{g.hn?<span style={{color:'#9ca3af',fontWeight:400,fontSize:'12px'}}> · HN {g.hn}</span>:null} <span style={{color:'#9ca3af',fontWeight:400,fontSize:'12px'}}>({g.items.length})</span></p>
          {mode==='card'
            ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax('+IMG_VIEW_SIZES[size].card+'px,1fr))',gap:'12px'}}>{g.items.map(renderItem)}</div>
            : <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>{g.items.map(renderItem)}</div>}
        </div>
      ))}

      {lightbox && (()=>{
        const meta = PATIENT_IMG_TYPES[lightbox.type] || PATIENT_IMG_TYPES.other;
        const name = meta.label + ' · ' + (lightbox.patient_name||'') + (lightbox.patient_hn?' (HN '+lightbox.patient_hn+')':'');
        const info = patientImgInfo(lightbox, meta, name);
        const acts = isAdmin ? [
          { icon:'fa-rotate-left', label:'กู้คืนรูป', onClick:()=>{ setRestoreT(lightbox); } },   // ไม่ปิดตัวดูรูป → popup มาทับ
          { icon:'fa-fire', label:'ลบถาวร', danger:true, onClick:()=>{ setHnInput(''); setHardCheck(false); setHardStep2(false); setHardT(lightbox); } },
        ] : [];
        return <AvatarLightbox src={lightbox.url} thumb={lightbox.thumbUrl} info={info} menuActions={acts}
          hasPrev={false} hasNext={false} onPrev={()=>{}} onNext={()=>{}}
          onExpire={async()=>{ try{ const r=await fetch('/api/patient/images/'+lightbox.id+'/url'); if(r.ok){ const d=await r.json(); return d.url; } }catch{} return null; }}
          onClose={()=>setLightbox(null)}/>;
      })()}

      {restoreT && createPortal(
        <div className={lightbox?'':'tb-backdrop'} style={{position:'fixed',inset:0,...(lightbox?{background:'rgba(15,23,42,0.6)'}:{}),zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={busy?undefined:()=>setRestoreT(null)}>
          <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'340px',padding:'22px',textAlign:'center'}}>
            <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'#ccfbf1',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}><i className="fa-solid fa-rotate-left" style={{color:'#0d9488',fontSize:'19px'}}></i></div>
            <p style={{fontSize:'15px',fontWeight:700,color:'#111827',margin:'0 0 6px'}}>กู้คืนรูปนี้</p>
            <p style={{fontSize:'13px',fontWeight:700,color:'#0d9488',margin:'0 0 4px'}}>{restoreT.patient_name||'ผู้ป่วย'}{restoreT.patient_hn?' · HN '+restoreT.patient_hn:''}</p>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 16px'}}>รูปจะกลับไปแสดงในแท็บรูปตามปกติ</p>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setRestoreT(null)} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ยกเลิก</button>
              <button onClick={doRestore} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:busy?'#5eead4':'#0d9488',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:busy?'wait':'pointer'}}>{busy?'กำลังกู้คืน...':'ยืนยันกู้คืน'}</button>
            </div>
          </div>
        </div>, document.body
      )}
      {hardT && createPortal(
        <div className={lightbox?'':'tb-backdrop'} style={{position:'fixed',inset:0,...(lightbox?{background:'rgba(15,23,42,0.6)'}:{}),zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={busy?undefined:()=>{setHardT(null);setHardStep2(false);}}>
          <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'360px',padding:'22px',minHeight:'366px',display:'flex',flexDirection:'column',boxSizing:'border-box'}}>
            <div style={{width:'50px',height:'50px',borderRadius:'50%',background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}><i className="fa-solid fa-fire" style={{color:'#dc2626',fontSize:'19px'}}></i></div>
            <p style={{fontSize:'15px',fontWeight:700,color:'#111827',margin:'0 0 6px',textAlign:'center'}}>ลบรูปนี้ถาวร</p>
            <p style={{fontSize:'13px',fontWeight:700,color:'#0d9488',margin:'0 0 4px',textAlign:'center'}}>{hardT.patient_name||'ผู้ป่วย'}{hardT.patient_hn?' · HN '+hardT.patient_hn:''}</p>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 14px',textAlign:'center'}}>ไฟล์จะถูกลบออกจากระบบจริง <span style={{whiteSpace:'nowrap'}}>กู้คืนไม่ได้อีก</span></p>
            {!hardStep2 ? (<>
            <label style={{fontSize:'12px',fontWeight:700,color:'#4b5563',display:'block',marginBottom:'5px'}}>พิมพ์ HN <span style={{color:'#dc2626'}}>{hardT.patient_hn||'-'}</span> เพื่อยืนยัน</label>
            <input value={hnInput} onChange={e=>setHnInput(e.target.value)} disabled={busy} style={{width:'100%',padding:'9px 10px',borderRadius:'8px',border:'1px solid '+(hnInput&&hnInput.trim()!==String(hardT.patient_hn||'')?'#fca5a5':'#d1d5db'),fontSize:'13px',marginBottom:'10px',boxSizing:'border-box'}}/>
            <label style={{display:'flex',alignItems:'flex-start',gap:'8px',fontSize:'12px',color:'#4b5563',marginBottom:'14px',cursor:'pointer'}}>
              <input type="checkbox" checked={hardCheck} onChange={e=>setHardCheck(e.target.checked)} disabled={busy} style={{marginTop:'2px',flexShrink:0}}/>
              <span>ข้าพเจ้าเข้าใจว่ารูปนี้จะถูกลบถาวรและกู้คืนไม่ได้</span>
            </label>
            <div style={{display:'flex',gap:'10px',marginTop:'auto'}}>
              <button onClick={()=>{setHardT(null);setHardStep2(false);}} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ยกเลิก</button>
              <button onClick={()=>setHardStep2(true)} disabled={busy||hnInput.trim()!==String(hardT.patient_hn||'')||!hardCheck} style={{flex:1,padding:'10px',borderRadius:'10px',background:(busy||hnInput.trim()!==String(hardT.patient_hn||'')||!hardCheck)?'#fca5a5':'#dc2626',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:(busy||hnInput.trim()!==String(hardT.patient_hn||'')||!hardCheck)?'not-allowed':'pointer'}}>ลบถาวร</button>
            </div>
            </>) : (<>
            <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'11px 13px',marginBottom:'16px',fontSize:'12px',color:'#991b1b',lineHeight:1.6,textAlign:'center'}}><i className="fa-solid fa-triangle-exclamation" style={{marginRight:'6px'}}></i>ยืนยันครั้งสุดท้าย — กดแล้วลบถาวรทันที <span style={{whiteSpace:'nowrap'}}>กู้คืนไม่ได้อีก</span></div>
            <div style={{display:'flex',gap:'10px',marginTop:'auto'}}>
              <button onClick={doHard} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:busy?'#fca5a5':'#dc2626',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:busy?'wait':'pointer'}}>{busy?'กำลังลบ...':'ยืนยันลบถาวร'}</button>
              <button onClick={()=>setHardStep2(false)} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer'}}>ย้อนกลับ</button>
            </div>
            </>)}
          </div>
        </div>, document.body
      )}
    </div>
  );
}

// ── ศูนย์รวมถังขยะ (สลับ ผู้ป่วย / รูปภาพ) ─────────────────────────────────
function TrashHub(props) {
  const [sub, setSub] = React.useState('patients');
  const isAdmin = props.currentUser?.role === 'admin';
  const pCount = (props.pendingDeleteRequests || []).length;
  const seg = (on) => ({padding:'7px 16px',fontSize:'13px',fontWeight:700,border:'none',borderRadius:'8px',background:on?'#0f766e':'transparent',color:on?'#fff':'#6b7280',cursor:'pointer'});
  return (
    <div>
      <div style={{display:'inline-flex',background:'#f1f5f9',borderRadius:'10px',padding:'3px',marginBottom:'16px'}}>
        <button onClick={()=>setSub('patients')} style={seg(sub==='patients')}><i className="fa-solid fa-users" style={{marginRight:'6px'}}></i>ผู้ป่วย{pCount>0?' '+pCount:''}</button>
        <button onClick={()=>setSub('images')} style={seg(sub==='images')}><i className="fa-solid fa-images" style={{marginRight:'6px'}}></i>รูปภาพ</button>
      </div>
      {sub==='patients' && <TrashList {...props}/>}
      {sub==='images' && <ImageTrashPage currentUser={props.currentUser} isAdmin={isAdmin}/>}
    </div>
  );
}


export { TrashHub, ImageTrashPage }
