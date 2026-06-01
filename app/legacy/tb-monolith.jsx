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
const { useState, useEffect, useRef } = React

/* ════════════════ tb-modals.jsx ════════════════ */

// ── Modal Animation Helper ──────────────────────────────────────────────
// ใช้กับ popup ทุกตัวที่อยากให้มี animation เปิด/ปิดสม่ำเสมอ (เหมือน AboutModal)
// pattern: modal-A เปิด 0.9s / modal-A-out + modal-overlay-out ปิด 0.6s
// วาง global ที่นี่ (tb-modals.jsx โหลดก่อน tb-app.jsx) → ใช้ได้ทั้งสองไฟล์
function useModalAnim(onClose, opts = {}) {
  const fast = opts.fast === true;
  const duration = opts.duration ?? (fast ? 240 : 580);
  const [closing, setClosing] = React.useState(false);
  const close = React.useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, duration);
  }, [closing, onClose, duration]);
  return {
    closing,
    close,
    modalCls:   closing ? (fast ? 'modal-A-out-fast'       : 'modal-A-out')       : 'modal-A',
    overlayCls: closing ? (fast ? 'modal-overlay-out-fast' : 'modal-overlay-out') : '',
  };
}

// pull window globals into Babel scope
const { ADR_LIST, migrateAdr, calcDoses, calcCrCl, crClStage,
        DRUG_RANGES, REGIMENS, PREFIXES, PATIENT_TYPES, DISEASE_LOCATIONS,
        EXTRA_PULMONARY_TYPES, TAMBONS, DEFAULT_COMORBIDITIES,
        CONSULT_TYPES, DRP_TYPES, LAB_GROUPS, getLabStatus, LAB_STATUS_STYLE } = window;
const INP = `w-full p-2.5 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-teal-400 text-sm`;
const HOSP_STRENGTHS = {
  R:  [{label:'R300',value:300},{label:'R450',value:450}],
  H:  [{label:'I100',value:100},{label:'Iso Syrup 50mg/ml',value:'syrup'}],
  Z:  [{label:'Z500',value:500}],
  E:  [{label:'E400',value:400},{label:'E500',value:500}],
  Lfx:[{label:'Lfx 250',value:250},{label:'Lfx 500',value:500},{label:'Lfx 750',value:750}],
  Am: [{label:'Am 250',value:250},{label:'Am 500',value:500}],
};

function FormSection({icon,title,children}){return(<div><div className="flex items-center gap-2 mb-4"><div className="w-7 h-7 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center text-xs"><i className={`fa-solid ${icon}`}></i></div><h3 className="font-bold text-gray-800 text-sm">{title}</h3></div>{children}</div>);}
function FieldError({msg}){return msg?<p className="text-red-500 text-xs mt-1">{msg}</p>:null;}
function RangeStatus({status,mgkg}){const c={ok:{bg:'bg-green-100',t:'text-green-700',l:'เหมาะสม'},low:{bg:'bg-amber-100',t:'text-amber-700',l:'ต่ำ'},high:{bg:'bg-red-100',t:'text-red-700',l:'สูง'}}[status]||{bg:'bg-gray-100',t:'text-gray-500',l:'-'};return<div className="text-right flex-shrink-0"><p className={'font-bold text-sm '+c.t}>{mgkg}</p><span className={'text-xs px-2 py-0.5 rounded-full font-bold '+c.bg+' '+c.t}>{c.l}</span></div>;}
function Badge({label,color='bg-gray-100 text-gray-600'}){return<span className={'px-2.5 py-0.5 rounded-full text-xs font-bold '+color}>{label}</span>;}

function DoseCalculator({weight,regimen,manualMode,manualDoses,onToggle,onManualChange,strengths,onStrChange}){
  const w=parseFloat(weight);
  const base=calcDoses(weight,regimen,null);
  const autoTabs=(key,str)=>{if(!w||str==='syrup')return 1;const d=DRUG_RANGES[key];return Math.max(1,Math.round(Math.min(w*(d.min+d.max)/2,d.absMax)/str));};
  const getDose=d=>{
    const str=(strengths&&strengths[d.key]!=null)?strengths[d.key]:d.strength;
    if(str==='syrup'){const ml=w>0?+(w*5/50).toFixed(1):0;return{...d,strength:str,isSyrup:true,ml,mlMonth:+(ml*30).toFixed(0),bottles:Math.ceil(ml*30/30),mgkg:5,status:'ok'};}
    const tabs=manualMode?(manualDoses[d.key]??autoTabs(d.key,str)):autoTabs(d.key,str);
    const dose=tabs*str;const mgkg=w>0?+(dose/w).toFixed(1):0;
    return{...d,strength:str,tabs,dose,mgkg,status:(dose>d.absMax||mgkg>d.max)?'high':mgkg<d.min?'low':'ok',isSyrup:false};
  };
  const doses=base.map(getDose);
  return(
    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-teal-800"><i className="fa-solid fa-calculator mr-2"></i>คำนวณขนาดยา{w?` (${w} kg)`:''}</h4>
        <button type="button" onClick={onToggle} className="text-xs bg-white border border-teal-200 px-3 py-1.5 rounded-lg font-bold text-teal-700 hover:bg-teal-100 transition-colors">{manualMode?<><i className="fa-solid fa-rotate-left mr-1"></i>อัตโนมัติ</>:<><i className="fa-solid fa-pen mr-1"></i>Manual</>}</button>
      </div>
      {!w?<p className="text-sm text-teal-400 text-center py-2">กรอกน้ำหนักเพื่อคำนวณ</p>:doses.length===0?<p className="text-sm text-teal-400 text-center py-2">เลือกสูตรยา</p>:(
        <div className="space-y-2">
          {doses.map(d=>{
            const opts=HOSP_STRENGTHS[d.key]||[];
            const curTabs=manualMode?(manualDoses[d.key]??d.tabs):d.tabs;
            const curMgkg=d.isSyrup?5:w>0?+((curTabs*d.strength)/w).toFixed(1):0;
            const curSt=d.isSyrup?'ok':(curTabs*d.strength>d.absMax||curMgkg>d.max)?'high':curMgkg<d.min?'low':'ok';
            return(
              <div key={d.key} className="bg-white rounded-xl border border-teal-100 overflow-hidden">
                <div className="flex items-center gap-2 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap mb-0.5">
                      <span className="font-black text-sm text-teal-700 w-5">{d.key}</span>
                      {opts.map(o=><button key={String(o.value)} type="button" onClick={()=>onStrChange&&onStrChange(d.key,o.value)} className={'text-xs px-2 py-0.5 rounded-lg font-bold border transition-all '+(((strengths&&strengths[d.key]!=null)?strengths[d.key]:d.strength)===o.value?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-500 hover:border-teal-300')}>{o.label}</button>)}
                    </div>
                    <p className="text-xs text-gray-400">{d.min}–{d.max} mg/kg · max {d.absMax}mg</p>
                  </div>
                  {d.isSyrup?<div className="text-right mr-2 flex-shrink-0"><p className="font-bold text-teal-700 text-sm">{d.ml} ml OD</p><p className="text-xs text-gray-400">{d.bottles} ขวด/เดือน</p></div>
                  :manualMode?<div className="flex items-center gap-1 flex-shrink-0"><input type="number" min={0.5} max={12} step={0.5} value={curTabs} onChange={e=>onManualChange(d.key,Math.max(0.5,parseFloat(e.target.value)||0.5))} className="w-14 p-1.5 border-2 border-teal-300 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-teal-400"/><span className="text-xs text-gray-500">tab</span></div>
                  :<span className="bg-teal-600 text-white px-3 py-1.5 rounded-lg font-mono font-bold text-sm flex-shrink-0">{d.tabs} tab</span>}
                  {d.isSyrup?<div className="text-right flex-shrink-0"><p className="font-bold text-sm text-green-700">5 mg/kg</p><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">เหมาะสม</span></div>:<RangeStatus status={curSt} mgkg={curMgkg}/>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DOTCalendar({patient,onUpdate,locked}){
  const today=new Date();const yr=today.getFullYear();const mo=today.getMonth();
  const dim=new Date(yr,mo+1,0).getDate();const fd=new Date(yr,mo,1).getDay();const td=today.getDate();
  const gk=d=>`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const cells=[...Array(fd).fill(null),...Array.from({length:dim},(_,i)=>i+1)];
  const mks=Object.keys(patient.dot).filter(k=>k.startsWith(`${yr}-${String(mo+1).padStart(2,'0')}`));
  const taken=mks.filter(k=>patient.dot[k]).length;
  const pct=mks.length>0?Math.round((taken/mks.length)*100):0;
  const toggle=day=>{if(day>td||locked)return;const k=gk(day);onUpdate({...patient,dot:{...patient.dot,[k]:!patient.dot[k]}});};
  return(
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-calendar-check mr-2 text-teal-600"></i>DOT Calendar</h4><span className={'text-sm font-bold '+(pct>=90?'text-green-600':pct>=70?'text-amber-600':'text-red-600')}>เดือนนี้: {pct}%</span></div>
      <div className="grid grid-cols-7 gap-1 mb-1">{['อา','จ','อ','พ','พฤ','ศ','ส'].map(d=><div key={d} className="text-center text-xs text-gray-400 font-bold py-0.5">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">{cells.map((day,i)=>{if(!day)return<div key={'e'+i}/>;const tk=patient.dot[gk(day)];const fut=day>td;const isTd=day===td;const btnCls='aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all '+(isTd?'ring-2 ring-teal-400 ':' ')+(fut?'text-gray-200 cursor-not-allowed bg-gray-50':tk?'bg-teal-500 text-white hover:bg-teal-600':'bg-red-100 text-red-500 hover:bg-red-200 cursor-pointer');
          return<button key={day} onClick={()=>toggle(day)} disabled={fut} className={btnCls}>{day}</button>;})}</div>
      <div className="mt-3 flex gap-4 text-xs text-gray-500"><span className="flex items-center gap-1"><span className="w-3 h-3 bg-teal-500 rounded"></span>กินยาแล้ว</span><span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 rounded"></span>ไม่ได้กิน</span></div>
    </div>
  );
}

function useNotifHelpers(alerts,patients,readAlerts,onRead,onOpen,onClose,onNavTarget){
  const cols={admin:'border-l-4 border-teal-600',critical:'border-l-4 border-red-500',warning:'border-l-4 border-amber-400',info:'border-l-4 border-blue-400'};
  const unreadBg={admin:'bg-gradient-to-r from-teal-50 to-teal-100/40',critical:'bg-red-50',warning:'bg-amber-50',info:'bg-blue-50'};

  const sorted=React.useMemo(()=>{
    const order={critical:0,warning:1,info:2};
    const admins=alerts.filter(a=>a.navTarget);                          // admin → บนสุด
    const appts=alerts.filter(a=>!a.navTarget && a.id.startsWith('appt-'));
    const others=alerts.filter(a=>!a.navTarget && !a.id.startsWith('appt-'));
    const grouped=[...others];
    if(appts.length===1) grouped.unshift(appts[0]);
    else if(appts.length>1) grouped.unshift({id:'appt-group',type:'info',patient:null,patientId:null,msg:`มีนัดพรุ่งนี้ ${appts.length} ราย`,time:'วันนี้'});
    return [...admins, ...grouped.sort((a,b)=>(order[a.type]??2)-(order[b.type]??2))];
  },[alerts]);

  const handleClick=a=>{
    onRead(a.id);
    if(a.patientId&&onOpen){const p=(patients||[]).find(x=>x.id===a.patientId);if(p){onOpen(p);if(onClose)onClose();}}
    else if(a.navTarget&&onNavTarget){onNavTarget(a.navTarget,a.highlightUser,a);if(onClose)onClose();}
  };

  const renderItem=(a,i)=>{
    const isRead=readAlerts.has(a.id);
    const isAdmin=!!a.navTarget;
    const effectiveType=isAdmin?'admin':a.type;
    const bg=!isRead?(unreadBg[effectiveType]||'bg-blue-50'):'bg-white';
    return(
      <div key={a.id+i} onClick={()=>handleClick(a)} className={'p-4 transition-colors '+cols[effectiveType]+' '+bg+((a.patientId||a.navTarget)?' cursor-pointer':'')+' hover:bg-teal-50'}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0 flex items-start gap-2.5">
            {isAdmin && <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5"><i className="fa-solid fa-user-shield text-sm"></i></div>}
            <div className="flex-1 min-w-0">
              {isAdmin && <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-0.5">Admin · จัดการผู้ใช้</p>}
              {a.patient&&<p className="font-bold text-xs text-gray-700 mb-0.5">{a.patient}</p>}
              <p className={'text-sm '+(isRead?'text-gray-400':(isAdmin?'text-teal-900 font-bold':'text-gray-700 font-medium'))}>{a.msg}</p>
              <p className="text-xs text-gray-400 mt-1">{a.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            {!isRead&&<button type="button" onClick={e=>{e.stopPropagation();onRead(a.id);}} className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-lg hover:bg-teal-200 transition-colors font-bold" title="รับทราบ">✓</button>}
            {(a.patientId||a.navTarget)&&<i className="fa-solid fa-chevron-right text-xs text-teal-400"></i>}
          </div>
        </div>
      </div>
    );
  };
  return {sorted,renderItem};
}

function NotificationPanel({alerts,patients,readAlerts,onRead,onReadAll,onOpen,onClose,onExpand,onNavTarget}){
  const unread=alerts.filter(a=>!readAlerts.has(a.id)).length;
  const {sorted,renderItem}=useNotifHelpers(alerts,patients,readAlerts,onRead,onOpen,onClose,onNavTarget);
  return(
    <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 tb-fade overflow-hidden" style={{width:'360px'}}>
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm">การแจ้งเตือน {unread>0&&<span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{unread}</span>}</h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onExpand} className="p-1.5 text-gray-400 hover:text-teal-600 transition-colors" title="ขยายเต็มจอ"><i className="fa-solid fa-expand text-xs"></i></button>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"><i className="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {sorted.length===0?<p className="p-6 text-center text-gray-400 text-sm">ไม่มีการแจ้งเตือน</p>:sorted.map((a,i)=>renderItem(a,i))}
      </div>
      {alerts.length>0&&<div className="p-3 border-t border-gray-100 text-right"><button type="button" onClick={onReadAll} className="text-xs text-gray-400 hover:text-teal-600 transition-colors font-medium">ล้างการแจ้งเตือนทั้งหมด</button></div>}
    </div>
  );
}

function NotificationFullModal({alerts,patients,readAlerts,onRead,onReadAll,onOpen,onClose,onNavTarget}){
  const unread=alerts.filter(a=>!readAlerts.has(a.id)).length;
  const {closing, close, modalCls, overlayCls} = useModalAnim(onClose);
  const {sorted,renderItem}=useNotifHelpers(alerts,patients,readAlerts,onRead,onOpen,close,onNavTarget);
  return(
    <div className={"fixed inset-0 z-50 flex items-center justify-center p-4 "+overlayCls} style={{background:'rgba(0,0,0,0.45)'}}>
      <div className={"bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden "+modalCls} style={{width:'min(90vw,920px)',maxHeight:'82vh'}}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-800">การแจ้งเตือนทั้งหมด</h2>
            <p className="text-xs text-gray-400 mt-0.5">ยังไม่อ่าน {unread} รายการ &nbsp;·&nbsp; ทั้งหมด {alerts.length} รายการ</p>
          </div>
          <div className="flex items-center gap-3">
            {alerts.length>0&&<button type="button" onClick={onReadAll} className="text-sm text-gray-400 hover:text-teal-600 transition-colors font-medium"><i className="fa-solid fa-check-double mr-1"></i>ล้างทั้งหมด</button>}
            <button type="button" onClick={close} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 flex items-center justify-center transition-colors"><i className="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {sorted.length===0
            ?<p className="p-10 text-center text-gray-400">ไม่มีการแจ้งเตือน</p>
            :<div className="grid grid-cols-2 gap-3" style={{gridAutoRows:'max-content'}}>
              {sorted.map((a,i)=>(
                <div key={a.id} className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {renderItem(a,i)}
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}

function DrugInteractionPanel({patient}){
  const ix=[];const c=(patient.comorbidities||[]).join(' ');
  const drugs=(patient.concomitantDrugs||[]).join(' ');
  if(c.includes('HIV'))ix.push({s:'high',drug:'Rifampicin + ARV',effect:'Rifampicin เหนี่ยวนำ CYP3A4 ลดระดับ ARV',rec:'ปรึกษา HIV specialist — พิจารณา Efavirenz-based regimen'});
  if(c.includes('DM'))ix.push({s:'medium',drug:'Isoniazid + OHA/Insulin',effect:'INH รบกวนควบคุมน้ำตาล + เพิ่มเสี่ยง Neuropathy',rec:'Monitor FBS ทุกเดือน เสริม B6 50mg/day'});
  if(c.includes('HT'))ix.push({s:'medium',drug:'Rifampicin + CCB',effect:'Rifampicin ลดระดับ CCB อย่างมีนัยสำคัญ',rec:'Monitor BP ใกล้ชิด อาจต้องเพิ่มขนาด CCB'});
  if(c.includes('CKD'))ix.push({s:'high',drug:'Ethambutol + CKD',effect:'EMB สะสมในไต เพิ่มเสี่ยง Optic Neuritis',rec:'ปรับขนาด EMB ตาม eGFR หรือตัดออกถ้า <30'});
  if(c.includes('ตับแข็ง')||c.includes('Cirrhosis'))ix.push({s:'high',drug:'INH/RIF + Cirrhosis',effect:'เสี่ยง Hepatotoxicity สูงมาก',rec:'Monitor LFT ทุก 2 สัปดาห์ ปรึกษา ID'});
  if(drugs.includes('Warfarin'))ix.push({s:'high',drug:'Rifampicin + Warfarin',effect:'Rifampicin เหนี่ยวนำ CYP2C9 ลด INR อย่างมาก เสี่ยงลิ่มเลือด',rec:'Monitor INR ทุกสัปดาห์ อาจต้องเพิ่มขนาด Warfarin 2-5 เท่า'});
  if(drugs.includes('Phenytoin'))ix.push({s:'high',drug:'Rifampicin + Phenytoin',effect:'Rifampicin ลดระดับ Phenytoin อย่างมีนัยสำคัญ',rec:'Monitor ระดับยา Phenytoin และอาการชัก'});
  if(drugs.includes('Methadone'))ix.push({s:'high',drug:'Rifampicin + Methadone',effect:'Rifampicin ลดระดับ Methadone — เสี่ยง withdrawal',rec:'พิจารณาเพิ่มขนาด Methadone ปรึกษาแพทย์'});
  if(ix.length===0)return<div className="bg-green-50 border border-green-200 p-4 rounded-2xl"><p className="text-green-700 font-bold text-sm"><i className="fa-solid fa-check-circle mr-2"></i>ไม่พบ Drug Interaction ที่มีนัยสำคัญ</p></div>;
  const co={high:'bg-red-50 border-red-200 text-red-700',medium:'bg-amber-50 border-amber-200 text-amber-700'};
  return<div className="space-y-3">{ix.map((item,i)=><div key={i} className={'p-4 rounded-xl border '+co[item.s]}><p className="font-bold text-sm mb-1"><i className={'fa-solid '+(item.s==='high'?'fa-triangle-exclamation':'fa-circle-exclamation')+' mr-2'}></i>{item.drug}</p><p className="text-xs text-gray-600 mb-1">{item.effect}</p><p className="text-xs font-semibold text-gray-700">💊 {item.rec}</p></div>)}</div>;
}

function RegimenHistoryTab({patient,onUpdate,settings,locked}){
  const regimenList=(settings?.regimens)||REGIMENS;
  const reasonList=(settings?.restartReasons)||DEFAULT_RESTART_REASONS;
  const [showForm,setShowForm]=useState(false);
  const [nr,setNr]=useState({regimen:REGIMENS[0],custom:'',startDate:new Date().toISOString().split('T')[0],reason:'',customReason:''});
  const save=()=>{
    const finalReason=nr.reason==='อื่นๆ'?nr.customReason.trim():nr.reason;
    if(!nr.startDate||!finalReason)return;
    const final=nr.regimen==='อื่นๆ'?nr.custom:nr.regimen;
    const hist=patient.regimenHistory.map(r=>({...r,isCurrent:false,endDate:r.endDate||nr.startDate}));
    hist.push({regimen:final,startDate:nr.startDate,reason:finalReason,isCurrent:true});
    onUpdate({...patient,regimen:final,regimenHistory:hist});setShowForm(false);
  };
  return(
    <div className="space-y-5">
      <div className="flex justify-between items-center"><h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-clock-rotate-left mr-2 text-teal-600"></i>ประวัติสูตรยา</h3><button type="button" onClick={()=>{if(!locked)setShowForm(!showForm);}} disabled={locked} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${locked?'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-teal-600 hover:bg-teal-700 text-white'}`}><i className="fa-solid fa-plus mr-1"></i>เปลี่ยนสูตร</button></div>
      <div className="relative"><div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-3">{(patient.regimenHistory||[]).map((e,i)=>(
          <div key={i} className="flex gap-4">
            <div className={'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 '+(e.isCurrent?'bg-teal-500 border-teal-500 text-white':'bg-white border-gray-300 text-gray-400')}><i className={'fa-solid '+(e.isCurrent?'fa-pills':'fa-check')+' text-sm'}></i></div>
            <div className={'flex-1 p-3.5 rounded-2xl border '+(e.isCurrent?'bg-teal-50 border-teal-200':'bg-gray-50 border-gray-200')}>
              <div className="flex justify-between flex-wrap gap-2"><div><span className={'font-mono font-bold '+(e.isCurrent?'text-teal-800':'text-gray-600')}>{e.regimen}</span>{e.isCurrent&&<span className="ml-2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">ปัจจุบัน</span>}</div><div className="text-xs text-gray-400"><span className="font-semibold text-gray-600">เริ่ม: {e.startDate}</span>{e.endDate&&<span className="block">สิ้นสุด: {e.endDate}</span>}</div></div>
              <p className="text-xs text-gray-600 mt-1.5"><i className="fa-solid fa-note-sticky mr-1 text-gray-400"></i>{e.reason}</p>
            </div>
          </div>
        ))}</div>
      </div>
      {showForm&&(
        <div className="bg-teal-50 border-2 border-teal-200 p-4 rounded-2xl tb-fade">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs font-bold text-gray-600 block mb-1">สูตรยาใหม่</label>
              <select value={nr.regimen} onChange={e=>setNr(n=>({...n,regimen:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg font-mono text-teal-800 text-sm outline-none bg-white">{regimenList.map(r=><option key={r}>{r}</option>)}<option value="อื่นๆ">อื่นๆ (กรอกเอง)</option></select>
              {nr.regimen==='อื่นๆ'&&<input value={nr.custom} onChange={e=>setNr(n=>({...n,custom:e.target.value}))} placeholder="กรอกสูตรยา" className="w-full mt-1 p-2 border border-teal-300 rounded-lg text-sm font-mono outline-none bg-white"/>}
            </div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">วันที่เริ่ม</label><input type="date" value={nr.startDate} onChange={e=>setNr(n=>({...n,startDate:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg outline-none bg-white"/></div>
          </div>
          <div className="mb-3">
            <label className="text-xs font-bold text-gray-600 block mb-1">เหตุผล <span className="text-red-500">*</span></label>
            <select value={nr.reason} onChange={e=>setNr(n=>({...n,reason:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white">
              <option value="">-- เลือกเหตุผล --</option>
              {reasonList.filter(r=>!r.includes('Original')).map(r=><option key={r} value={r}>{r}</option>)}
              <option value="อื่นๆ">อื่นๆ (ระบุเอง)</option>
            </select>
            {nr.reason==='อื่นๆ'&&<input value={nr.customReason} onChange={e=>setNr(n=>({...n,customReason:e.target.value}))} placeholder="ระบุเหตุผล..." className="w-full mt-1 p-2 border border-teal-300 rounded-lg text-sm outline-none bg-white"/>}
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">ยกเลิก</button><button type="button" onClick={save} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold">บันทึก</button></div>
        </div>
      )}
    </div>
  );
}

function LabTab({patient,onUpdate,settings,locked}){
  const effectiveLAB_GROUPS = (settings?.labGroups) || LAB_GROUPS || [];
  const [showAdd,setShowAdd]=useState(false);
  const [tp,setTp]=useState('');const [date,setDate]=useState('');
  const [labData,setLabData]=useState({lft:{},cbc:{},renal:{}});
  const [hbsag,setHbsag]=useState('');const [hcv,setHcv]=useState('');
  const [inputTab,setInputTab]=useState('lft');
  const altRef=useRef(null);const uaRef=useRef(null);const scrRef=useRef(null);
  const latest=patient.labs[patient.labs.length-1]||{};
  const crcl=calcCrCl(patient.age,patient.weight,latest.scr,patient.gender);
  const crclInfo=crClStage(crcl);

  useEffect(()=>{
    if(patient.labs.length<2)return;
    const labels=patient.labs.map(l=>l.tp);const charts=[];
    if(altRef.current)charts.push(new Chart(altRef.current,{type:'line',data:{labels,datasets:[{label:'ALT',data:patient.labs.map(l=>l.alt||0),borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.06)',fill:true,tension:0.35,pointRadius:4,pointBackgroundColor:'#ef4444'},{label:'AST',data:patient.labs.map(l=>l.ast||null),borderColor:'#f97316',backgroundColor:'transparent',tension:0.35,pointRadius:4,borderDash:[4,2]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{boxWidth:8,font:{size:10}}}},scales:{y:{suggestedMax:200,grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}}));
    if(uaRef.current)charts.push(new Chart(uaRef.current,{type:'line',data:{labels,datasets:[{label:'Uric Acid',data:patient.labs.map(l=>l.ua||0),borderColor:'#0d9488',backgroundColor:'rgba(13,148,136,0.06)',fill:true,tension:0.35,pointRadius:4,pointBackgroundColor:'#0d9488'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{boxWidth:8,font:{size:10}}}},scales:{y:{suggestedMax:12,grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}}));
    if(scrRef.current)charts.push(new Chart(scrRef.current,{type:'bar',data:{labels,datasets:[{label:'Scr (mg/dL)',data:patient.labs.map(l=>l.scr||0),backgroundColor:'#6366f1',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{boxWidth:8,font:{size:10}}}},scales:{y:{suggestedMax:2,grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}}));
    return()=>charts.forEach(c=>c.destroy());
  },[patient.labs]);

  const addLab=()=>{
    if(!tp)return;
    const lft=labData.lft||{};const renal=labData.renal||{};
    const entry={tp,date:date||'',alt:+lft.alt||0,ast:+lft.ast||0,alp:+lft.alp||0,tbili:+lft.tbili||0,dbili:+lft.dbili||0,alb:+lft.alb||0,scr:+renal.scr||0,bun:+renal.bun||0,ua:+renal.ua||0,hbsag,hcv,cbc:labData.cbc||{}};
    const allData={...lft,...renal,...(labData.cbc||{})};
    const allFields=effectiveLAB_GROUPS.flatMap(g=>g.fields);
    const hasCritical=allFields.some(f=>f.critical&&getLabStatus(allData[f.key],f)==='critical');
    const hasAnyInput=Object.values(allData).some(v=>+v>0);
    const newStatus=hasCritical?'critical':hasAnyInput?'normal':patient.status;
    onUpdate({...patient,labs:[...patient.labs,entry],status:newStatus});
    setTp('');setDate('');setLabData({lft:{},cbc:{},renal:{}});setHbsag('');setHcv('');setShowAdd(false);
  };

  const serology=val=>{
    if(!val)return<span className="text-gray-300 text-xs">-</span>;
    const col=val==='Positive'?'bg-red-100 text-red-700':val==='Negative'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500';
    return<span className={'text-xs px-2 py-0.5 rounded-full font-bold '+col}>{val}</span>;
  };

  const altCls=v=>{ if(!v||+v===0)return''; const st=getLabStatus(v,{lo:0,hi:40,critical:120}); return LAB_STATUS_STYLE[st]||''; };

  return(
    <div className="space-y-5 tb-fade">
      {/* CrCl */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl flex-shrink-0"><i className="fa-solid fa-kidneys"></i></div>
        <div className="flex-1"><p className="text-xs font-bold text-indigo-700 mb-0.5">CrCl — Cockcroft-Gault</p><p className={'text-2xl font-black '+crclInfo.color}>{crclInfo.label} <span className="text-sm font-normal text-gray-400">mL/min</span></p><p className="text-xs text-gray-400 mt-0.5">(140-{patient.age||'?'}) × {patient.weight}kg ÷ (72 × {latest.scr||'Scr'}){patient.gender==='F'?' × 0.85':''}</p></div>
        <div className="text-right flex-shrink-0 text-xs text-gray-500"><p>อายุ: <strong>{patient.age||'-'}</strong></p><p>BW: <strong>{patient.weight}</strong> kg</p><p>Scr: <strong>{latest.scr||'-'}</strong></p></div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-flask mr-2 text-teal-600"></i>ผล Lab</h3>
        <button type="button" onClick={()=>{if(!locked)setShowAdd(!showAdd);}} disabled={locked} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${locked?'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-teal-600 hover:bg-teal-700 text-white'}`}><i className="fa-solid fa-plus mr-1"></i>เพิ่มผล Lab</button>
      </div>

      {showAdd&&(
        <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl tb-fade">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 mb-3">
            <div><label className="text-xs font-bold text-gray-600 block mb-1">Timepoint</label><input value={tp} onChange={e=>setTp(e.target.value)} placeholder="M3" className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"/></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">วันที่</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"/></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">HBsAg</label><select value={hbsag} onChange={e=>setHbsag(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"><option value="">-</option><option>Positive</option><option>Negative</option><option>Pending</option></select></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">Anti-HCV</label><select value={hcv} onChange={e=>setHcv(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"><option value="">-</option><option>Positive</option><option>Negative</option><option>Pending</option></select></div>
          </div>
          {/* Lab group tabs */}
          <div className="flex gap-1 mb-3">{(effectiveLAB_GROUPS).map(g=><button key={g.id} type="button" onClick={()=>setInputTab(g.id)} className={'px-3 py-1 rounded-lg text-xs font-bold transition-all '+(inputTab===g.id?'bg-teal-600 text-white':'bg-white text-gray-500 hover:bg-teal-50')}>{g.label}</button>)}</div>
          {(effectiveLAB_GROUPS).filter(g=>g.id===inputTab).map(grp=>(
            <div key={grp.id} className="grid grid-cols-5 gap-2 mb-3">
              {grp.fields.map(f=>{
                const val=(labData[grp.id]||{})[f.key]||'';
                const st=val?getLabStatus(val,f):'empty'; const stCls=LAB_STATUS_STYLE[st]||'';
                return<div key={f.key}><label className="text-xs text-gray-500 block mb-0.5 text-center">{f.label} <span className="text-gray-300 text-xs">({f.unit})</span></label>
                  <input type="number" step="0.01" value={val} onChange={e=>setLabData(d=>({...d,[grp.id]:{...(d[grp.id]||{}),[f.key]:e.target.value}}))} className={'w-full p-1.5 border rounded-lg text-xs text-center outline-none bg-white '+stCls} style={{borderColor:st==='critical'||st==='low-bad'?'#fca5a5':st==='high'?'#fcd34d':st==='normal'?'#86efac':'#e5e7eb'}}/>
                  <p className="text-xs text-gray-300 text-center">{f.lo}–{f.hi}</p></div>;
              })}
            </div>
          ))}
          <div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowAdd(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">ยกเลิก</button><button type="button" onClick={addLab} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold">บันทึก</button></div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 border-b uppercase"><tr>
              <th className="p-3 pl-4 text-left">TP</th><th className="p-3 text-left">วันที่</th>
              <th className="p-3 text-left">ALT</th><th className="p-3 text-left">AST</th><th className="p-3 text-left">ALP</th><th className="p-3 text-left">T.Bili</th><th className="p-3 text-left">Alb</th>
              <th className="p-3 text-left">Scr</th><th className="p-3 text-left">UA</th>
              <th className="p-3 text-left">HBsAg</th><th className="p-3 text-left">Anti-HCV</th><th className="p-3 text-left">CrCl</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {patient.labs.length===0?<tr><td colSpan={12} className="p-6 text-center text-gray-400">ยังไม่มีผล Lab</td></tr>:
                patient.labs.map((l,i)=>{
                  const lc=calcCrCl(patient.age,patient.weight,l.scr,patient.gender);
                  const altCl=altCls(l.alt); const astCl=altCls(l.ast);
                  return<tr key={i} className={l.alt>120?'bg-red-50':''}>
                    <td className="p-3 pl-4 font-bold font-mono">{l.tp}</td>
                    <td className="p-3 text-gray-400">{l.date||'-'}</td>
                    <td className={'p-3 font-bold '+altCl}>{l.alt||'-'}</td>
                    <td className={'p-3 '+astCl}>{l.ast||'-'}</td>
                    <td className="p-3 text-gray-600">{l.alp||'-'}</td>
                    <td className="p-3 text-gray-600">{l.tbili||'-'}</td>
                    <td className={'p-3 '+(l.alb&&l.alb<3.5?'text-blue-600 font-bold':'')}>{l.alb||'-'}</td>
                    <td className="p-3 text-gray-600">{l.scr||'-'}</td>
                    <td className={'p-3 '+(l.ua>9?'text-red-600 font-bold':l.ua>7.5?'text-amber-600':'')}>{l.ua||'-'}</td>
                    <td className="p-3">{serology(l.hbsag)}</td><td className="p-3">{serology(l.hcv)}</td>
                    <td className={'p-3 font-semibold '+crClStage(lc).color}>{lc||'-'}</td>
                  </tr>;
                })}
            </tbody>
          </table>
        </div>
      </div>

      {patient.labs.length>1&&(
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm"><p className="text-xs font-bold text-gray-700 mb-2">ALT / AST</p><div className="h-32"><canvas ref={altRef}></canvas></div></div>
          <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm"><p className="text-xs font-bold text-gray-700 mb-2">Uric Acid</p><div className="h-32"><canvas ref={uaRef}></canvas></div></div>
          <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm"><p className="text-xs font-bold text-gray-700 mb-2">Creatinine</p><div className="h-32"><canvas ref={scrRef}></canvas></div></div>
        </div>
      )}
    </div>
  );
}


function ADRTab({patient,onUpdate,locked}){
  const safeAdr=migrateAdr(patient.adr);

  // Build ADR events from visits + adr tab, grouped by date
  const adrEvents = {};
  // From ADR tab direct checks (no visit date) -> use 'recorded' bucket
  ADR_LIST.forEach(a=>{
    const v=safeAdr[a.key];
    if(v?.checked){
      // Find earliest visit that noted this ADR
      const mentionedVisit=(patient.visits||[]).filter(vis=>(vis.adrNoted||[]).includes(a.key)).sort((x,y)=>x.date.localeCompare(y.date))[0];
      const date=mentionedVisit?.date||'manual';
      if(!adrEvents[date])adrEvents[date]=[];
      adrEvents[date].push({...a,note:v.note||''});
    }
  });
  // From visits
  (patient.visits||[]).forEach(vis=>{
    (vis.adrNoted||[]).forEach(k=>{
      const a=ADR_LIST.find(x=>x.key===k);if(!a)return;
      const date=vis.date;
      if(!adrEvents[date])adrEvents[date]=[];
      if(!adrEvents[date].find(x=>x.key===k))
        adrEvents[date].push({...a,note:''});
    });
  });

  const setAdr=(key,field,val)=>{
    if(locked)return;
    const updated={...safeAdr,[key]:{...safeAdr[key],[field]:val}};
    onUpdate({...patient,adr:updated});
  };

  const hasAny=ADR_LIST.some(a=>safeAdr[a.key]?.checked);
  const adrDates=Object.keys(adrEvents).sort().reverse();

  return(
    <div className="space-y-5 tb-fade">
      {/* Checklist */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-heart-pulse mr-2 text-red-500"></i>ADR Checklist</h3>
        {hasAny&&<Badge label={'พบ '+ADR_LIST.filter(a=>safeAdr[a.key]?.checked).length+' รายการ'} color="bg-red-100 text-red-700"/>}
      </div>
      <div className="space-y-2">
        {ADR_LIST.map(a=>{
          const v=safeAdr[a.key]||{checked:false,note:''};
          return(
            <div key={a.key} className={'rounded-2xl border transition-all overflow-hidden '+(v.checked?'border-red-200 bg-red-50':'border-gray-200 bg-white')}>
              <div className="flex items-center gap-3 p-3">
                <div onClick={()=>setAdr(a.key,'checked',!v.checked)}
                  className={'w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-all cursor-pointer '+(v.checked?'bg-red-500 border-red-500':'border-gray-300 hover:border-red-300')}>
                  {v.checked&&<i className="fa-solid fa-check text-white" style={{fontSize:'9px'}}></i>}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>setAdr(a.key,'checked',!v.checked)}>
                  <p className={'font-bold text-sm '+(v.checked?'text-red-800':'text-gray-700')}>{a.label}</p>
                  <p className="text-xs text-gray-400">{a.sub} · <span className="font-mono text-teal-600">{a.drug}</span></p>
                </div>
                {v.checked&&<input value={v.note} onChange={e=>setAdr(a.key,'note',e.target.value)} onClick={e=>e.stopPropagation()}
                  placeholder="หมายเหตุ..." className="flex-1 p-2 border border-red-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-red-300 max-w-xs"/>}
              </div>
              {v.checked&&v.note&&<div className="px-4 pb-2.5"><p className="text-xs text-red-600 bg-red-100 px-3 py-1.5 rounded-lg"><i className="fa-solid fa-note-sticky mr-1"></i>{v.note}</p></div>}
            </div>
          );
        })}
      </div>

      {/* ADR mini-timeline — grouped by date */}
      {adrDates.length>0&&(
        <div>
          <h4 className="font-bold text-gray-700 text-sm mb-3"><i className="fa-solid fa-timeline mr-2 text-red-400"></i>Timeline ADR (รวมกลุ่มตามวันที่)</h4>
          <div className="relative space-y-3">
            <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-red-100 pointer-events-none"></div>
            {adrDates.map(date=>(
              <div key={date} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 z-10 mt-1">
                  <i className="fa-solid fa-heart-pulse text-white" style={{fontSize:'8px'}}></i>
                </div>
                <div className="flex-1 bg-white border border-red-100 rounded-2xl p-3 shadow-sm">
                  <p className="text-xs text-gray-400 font-mono mb-2">{date==='manual'?'บันทึกจาก ADR tab':date}</p>
                  <div className="flex flex-wrap gap-2">
                    {adrEvents[date].map(a=>(
                      <div key={a.key} className="bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl">
                        <p className="font-bold text-xs text-red-700">{a.label}</p>
                        <p className="text-xs text-gray-400">{a.sub}</p>
                        {a.note&&<p className="text-xs text-red-500 mt-0.5 italic">{a.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── TIMELINE HELPERS ────────────────────────────────────────────────────────

function detectDotMisses(dot) {
  const sorted = Object.entries(dot).sort((a,b)=>a[0].localeCompare(b[0]));
  const misses = [];
  let streak = 0; let streakStart = null;
  sorted.forEach(([date, taken]) => {
    if (!taken) { streak++; if (!streakStart) streakStart = date; }
    else {
      if (streak >= 2) misses.push({ date: streakStart, streak });
      streak = 0; streakStart = null;
    }
  });
  if (streak >= 2) misses.push({ date: streakStart, streak });
  return misses;
}

function buildGroupedTimeline(patient) {
  const raw = [];

  // start
  if (patient.startDate) raw.push({ type:'start', date:patient.startDate, label:'เริ่มต้นการรักษา', detail:'สูตรยา: '+(patient.regimenHistory?.[0]?.regimen||patient.regimen) });

  // regimen changes
  (patient.regimenHistory||[]).forEach((r,i) => {
    if (i > 0 || r.startDate !== patient.startDate)
      raw.push({ type:'regimen', date:r.startDate, label:'เปลี่ยนสูตรยา → '+r.regimen, detail:r.reason });
  });

  // labs + auto-alerts
  (patient.labs||[]).forEach(l => {
    if (!l.date) return;
    raw.push({ type:'lab', date:l.date, label:'ผล Lab '+l.tp, detail:'ALT '+l.alt+' | AST '+(l.ast||'-')+' | UA '+l.ua+' | Scr '+l.scr+(l.hbsag?' | HBsAg '+l.hbsag:'')+(l.hcv?' | Anti-HCV '+l.hcv:'') });
    if (l.alt > 120) raw.push({ type:'alert-high', date:l.date, label:'⚠ Hepatotoxicity (ALT '+l.alt+')', detail:'ALT > 3×ULN — พิจารณาหยุดยา' });
    else if (l.alt > 40) raw.push({ type:'alert-warn', date:l.date, label:'⚡ ALT สูงเล็กน้อย ('+l.alt+')', detail:'ติดตาม LFT ซ้ำ' });
    if (l.ua > 9) raw.push({ type:'alert-warn', date:l.date, label:'⚡ Hyperuricemia (UA '+l.ua+')', detail:'UA > 9 mg/dL — พิจารณาลด PZA' });
  });

  // sputum / diagnosis
  const sputumSorted = [...(patient.sputum||[])].sort((a,b)=>{
    const na=a.tp==='M0'?0:parseInt((a.tp||'').replace('M',''))||99;
    const nb=b.tp==='M0'?0:parseInt((b.tp||'').replace('M',''))||99;
    return na-nb;
  });
  const convInfo = getSputumConversion ? getSputumConversion(patient.sputum||[]) : {converted:false};
  const delayedConv = isDelayedConversion ? isDelayedConversion(patient.sputum||[]) : false;

  sputumSorted.forEach(s => {
    if (!s.date) return;
    const combined = afbCombined ? afbCombined(s) : (s.result||'-');
    const molecLabel = s.molecType || (s.genexpert ? 'GeneXpert' : '');
    const isTBConfirmed = s.mtbResult==='Detected' || s.mtbResult==='Detected very low' || (combined && combined!=='-' && combined!=='Neg');
    let detail = 'AFB: '+combined;
    if (molecLabel) detail += ' | '+molecLabel+': '+(s.mtbResult||s.genexpert||'-');
    if (s.rifResult) detail += ' | RIF: '+s.rifResult;
    if (s.inhResult) detail += ' | INH: '+s.inhResult;
    if (s.igraResult) detail += ' | IGRA: '+s.igraResult+(s.igraNote?' ('+s.igraNote+')':'');
    raw.push({ type:'sputum', date:s.date, label:'Diagnosis '+s.tp, detail, tbConfirmed: isTBConfirmed });

    // IGRA event if present
    if (s.igraResult) {
      const igraType = s.igraResult==='Positive'?'alert-high':s.igraResult==='Negative'?'alert-good':'alert-warn';
      raw.push({ type:igraType, date:s.date, label:'IGRA: '+s.igraResult, detail:(s.igraNote||'')+(s.igraDate?' วันที่ '+s.igraDate:'') });
    }

    // Extra labs per specimen
    if (s.extraLabsPerSpecimen) {
      Object.entries(s.extraLabsPerSpecimen).forEach(([specType, labs])=>{
        const hasData = labs && Object.values(labs).some(v=>v!==undefined&&v!=='');
        if (!hasData) return;
        const labStr = Object.entries(labs).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>k+': '+v).join(' | ');
        raw.push({ type:'lab', date:s.date, label:'Lab '+specType+' ('+s.tp+')', detail:labStr });
      });
    }

    // Resistance alert
    const isRes = hasResistance && hasResistance([s]);
    if (isRes) raw.push({ type:'alert-high', date:s.date, label:'⚠ พบเชื้อดื้อยา — '+[s.rifResult==='RIF resistant'?'RIF resistant':'',s.inhResult==='INH resistant'?'INH resistant':''].filter(Boolean).join(', '), detail:'ตรวจสอบสูตรยาและปรึกษาผู้เชี่ยวช��ญ MDR-TB' });

    // Delayed conversion
    if (delayedConv && s.tp === 'M2') raw.push({ type:'alert-warn', date:s.date, label:'⚡ Delayed Sputum Conversion (M2 ยังบวก)', detail:'ประเมิน adherence และพิจารณาทบทวนสูตรยา' });

    // Successful conversion
    if (!isAfbPositive(s) && s.tp !== 'M0') {
      if (convInfo.converted && convInfo.tp === s.tp)
        raw.push({ type:'alert-good', date:s.date, label:'✓ Sputum Conversion ('+s.tp+')', detail:'ผลเสมหะกลับมาเป็นลบ' });
    }
  });

  // DOT missed
  detectDotMisses(patient.dot||{}).forEach(m => {
    raw.push({ type:'alert-miss', date:m.date, label:'❌ ขาดยา '+m.streak+' วันติดต่อกัน', detail:'ตรวจสอบสาเหตุ — เริ่มจากวันที่ '+m.date });
  });

  // visits
  (patient.visits||[]).forEach(v => raw.push({ type:'visit', date:v.date, id:v.id, label:'Visit', vitals:v.vitals, weight:v.weight, note:v.note, adrNoted:v.adrNoted||[], labQuick:v.labQuick }));

  // group by date (newest first)
  const groups = {};
  raw.forEach(e => { if (!groups[e.date]) groups[e.date] = []; groups[e.date].push(e); });
  return Object.entries(groups).sort((a,b) => b[0].localeCompare(a[0]));
}

// ─── CONFIRM MODAL ───────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  const {closing, close, modalCls, overlayCls} = useModalAnim(onCancel);
  const doConfirm = () => { if (closing) return; setTimeout(onConfirm, 0); close(); };
  return (
    <div className={"fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 "+overlayCls}>
      <div className={"bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center "+modalCls}>
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
        </div>
        <p className="font-bold text-gray-800 text-base mb-2">{message}</p>
        <p className="text-sm text-gray-400 mb-6">การกระทำนี้ไม่สามารถยกเลิกได้</p>
        <div className="flex gap-3">
          <button type="button" onClick={close} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">ยกเลิก</button>
          <button type="button" onClick={doConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors">ยืนยันลบ</button>
        </div>
      </div>
    </div>
  );
}

// ─── VISIT FORM ───────────────────────────────────────────────────────────────
const EMPTY_VISIT = () => ({
  date: new Date().toISOString().split('T')[0],
  weight: '', vitals: {bp:'',hr:'',rr:'',temp:'',o2:''},
  drugDoses: '', note: '',
  consult: {type:'', note:''}, drp: [], adrNoted: [],
  addLab: false,
  labData: { lft:{}, cbc:{}, renal:{} },
  addSputum: false,
  sputumQuick: {tp:'', result:'', scantyCount:'', genexpert:'', genexpertRif:''},
  outcomeType: '', outcomeEndDate: '', outcomeNote: '',
});

// Helper: lab value color class
function labColor(val, field) {
  if (!field) return '';
  const st = getLabStatus(val, field);
  return LAB_STATUS_STYLE[st] || '';
}
function labFlag(val, field) {
  if (!field) return null;
  const st = getLabStatus(val, field);
  if (st === 'critical') return 'C';
  if (st === 'low-bad' || st === 'high') return st === 'high' ? 'H' : 'L';
  if (st === 'low') return 'L';
  return null;
}

function VisitForm({ initial, onSave, onCancel, patient }) {
  const [v, setV] = useState(initial || EMPTY_VISIT());
  const effectiveLAB_GROUPS = (patient?._labGroups) || LAB_GROUPS || [];
  const sf = (k,val) => setV(f=>({...f,[k]:val}));
  const sv = (k,val) => setV(f=>({...f,vitals:{...f.vitals,[k]:val}}));
  const sLab = (grp,k,val) => setV(f=>({...f,labData:{...f.labData,[grp]:{...(f.labData[grp]||{}),[k]:val}}}));
  const sSp = (k,val) => setV(f=>({...f,sputumQuick:{...(f.sputumQuick||{}),[k]:val}}));
  const sCo = (k,val) => setV(f=>({...f,consult:{...f.consult,[k]:val}}));
  const addDrp = () => setV(f=>({...f,drp:[...(f.drp||[]),{type:'',note:''}]}));
  const setDrp = (i,k,val) => setV(f=>{const d=[...(f.drp||[])];d[i]={...d[i],[k]:val};return{...f,drp:d};});
  const rmDrp = i => setV(f=>({...f,drp:(f.drp||[]).filter((_,j)=>j!==i)}));
  const toggleAdr = k => setV(f=>({...f,adrNoted:f.adrNoted.includes(k)?f.adrNoted.filter(x=>x!==k):[...f.adrNoted,k]}));
  const [labTab, setLabTab] = useState('lft');

  const autoFillDoses = () => {
    // Try to get latest drug doses from previous visits first
    const visitDoses = (patient.visits||[]).filter(v=>v.drugDoses).sort((a,b)=>b.date.localeCompare(a.date));
    if(visitDoses.length > 0) {
      sf('drugDoses', visitDoses[0].drugDoses);
    } else {
      // Fallback: calculate from weight
      const doses = calcDoses(patient.weight, patient.regimen, patient.customDoses);
      sf('drugDoses', doses.map(d=>d.key+(d.tabs*d.strength)).join(' ')+((patient.comorbidities||[]).join(' ').includes('DM')?' B6-50':''));
    }
  };

  const inp = 'w-full p-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-teal-300 bg-white';

  return (
    <div className="bg-white border-2 border-teal-300 rounded-2xl overflow-hidden tb-fade">
      <div className="bg-teal-700 px-4 py-2.5 flex justify-between items-center">
        <h4 className="font-bold text-white text-sm"><i className="fa-solid fa-pen-to-square mr-2"></i>บันทึก Visit</h4>
        <button type="button" onClick={onCancel} className="text-teal-200 hover:text-white text-lg"><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">

        {/* Row: Date + BW + Vitals */}
        <div className="bg-slate-50 border border-gray-100 rounded-xl p-3">
          <div className="grid grid-cols-[120px_70px_1fr] gap-3 items-end">
            <div><label className="text-xs text-gray-500 font-bold block mb-1">วันที่</label><input type="date" value={v.date} onChange={e=>sf('date',e.target.value)} className={inp+' text-left px-2'}/></div>
            <div><label className="text-xs text-gray-500 font-bold block mb-1 text-center">BW (kg)</label><input type="number" value={v.weight} onChange={e=>sf('weight',e.target.value)} className={inp+' text-center font-bold'}/></div>
            <div>
              <label className="text-xs text-gray-500 font-bold block mb-1">Vital Signs</label>
              <div className="grid grid-cols-5 gap-1">
                {[['bp','BP'],['hr','HR'],['rr','RR'],['temp','T°C'],['o2','O2%']].map(([k,l])=>(
                  <div key={k}><p className="text-xs text-gray-400 text-center mb-0.5">{l}</p><input value={v.vitals[k]} onChange={e=>sv(k,e.target.value)} className={inp+' text-center'}/></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drug doses */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-gray-600">ขนาดยา TB</label>
            <button type="button" onClick={autoFillDoses} className="text-xs text-teal-600 hover:text-teal-800 font-bold"><i className="fa-solid fa-wand-magic-sparkles mr-1"></i>Auto-fill</button>
          </div>
          <input value={v.drugDoses} onChange={e=>sf('drugDoses',e.target.value)} placeholder="H300 R450 Z1000 E800 B6-50" className={inp+' font-mono text-sm'}/>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">SOAP / Note</label>
          <textarea value={v.note} onChange={e=>sf('note',e.target.value)} rows={5}
            placeholder={"S: อาการ...\nO: ผลตรวจ...\n>>> CXR: ...\nA: การประเมิน...\nP: แผน..."}
            className="w-full p-3 border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-teal-300 resize-none bg-white leading-relaxed font-mono"/>
        </div>

        {/* Consult */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <label className="text-xs font-bold text-amber-800 block mb-2"><i className="fa-solid fa-comments mr-1"></i>Consultation</label>
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <select value={v.consult.type} onChange={e=>sCo('type',e.target.value)} className={inp.replace('border-gray-200','border-amber-200')}>
              <option value="">-- ไม่มี --</option>
              {(CONSULT_TYPES||[]).map(t=><option key={t}>{t}</option>)}
            </select>
            <input value={v.consult.note} onChange={e=>sCo('note',e.target.value)} placeholder="รายละเอียด..." className={inp.replace('border-gray-200','border-amber-200')}/>
          </div>
        </div>

        {/* DRP */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-red-800"><i className="fa-solid fa-exclamation-circle mr-1"></i>DRP</label>
            <button type="button" onClick={addDrp} className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg font-bold hover:bg-red-700"><i className="fa-solid fa-plus mr-1"></i>เพิ่ม</button>
          </div>
          {(v.drp||[]).length===0?<p className="text-xs text-red-300 text-center py-1">ไม่มี DRP</p>:(
            <div className="space-y-1.5">{(v.drp||[]).map((d,i)=>(
              <div key={i} className="grid grid-cols-[1fr_2fr_20px] gap-1.5 items-center">
                <select value={d.type} onChange={e=>setDrp(i,'type',e.target.value)} className={inp}><option value="">-- Code --</option>{(DRP_TYPES||[]).map(t=><option key={t.code} value={t.code}>{t.label}</option>)}</select>
                <input value={d.note} onChange={e=>setDrp(i,'note',e.target.value)} placeholder="รายละเอียด..." className={inp}/>
                <button type="button" onClick={()=>rmDrp(i)} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-xmark"></i></button>
              </div>
            ))}</div>
          )}
        </div>

        {/* Lab */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-bold text-gray-600">ผล Lab</label>
            <label className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer">
              <input type="checkbox" checked={v.addLab} onChange={e=>sf('addLab',e.target.checked)} className="accent-blue-600"/>เพิ่มผล Lab
            </label>
          </div>
          {v.addLab&&(
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 tb-fade">
              <div className="flex gap-1 mb-3">
                {(effectiveLAB_GROUPS).map(g=>(
                  <button key={g.id} type="button" onClick={()=>setLabTab(g.id)}
                    className={'px-3 py-1 rounded-lg text-xs font-bold transition-all '+(labTab===g.id?'bg-blue-600 text-white':'bg-white text-gray-500 hover:bg-blue-100')}>
                    {g.label}
                  </button>
                ))}
              </div>
              {(effectiveLAB_GROUPS).filter(g=>g.id===labTab).map(grp=>(
                <div key={grp.id} className="grid grid-cols-4 gap-2">
                  {grp.fields.map(f=>{
                    const val=(v.labData[grp.id]||{})[f.key]||'';
                    const st=val?getLabStatus(val,f):'empty';
                    const stCls=LAB_STATUS_STYLE[st]||'';
                    const bdrColor=st==='critical'||st==='low-bad'?'#fca5a5':st==='high'?'#fcd34d':st==='normal'?'#86efac':'#e5e7eb';
                    return(
                      <div key={f.key}>
                        <label className="text-xs text-gray-500 block mb-0.5 text-center">{f.label}</label>
                        <input type="number" step="0.01" value={val} onChange={e=>sLab(grp.id,f.key,e.target.value)}
                          className={'w-full p-1.5 border rounded-lg text-xs text-center outline-none focus:ring-1 focus:ring-blue-300 bg-white '+stCls}
                          style={{borderColor:bdrColor}}/>
                        <p className="text-xs text-gray-300 text-center mt-0.5">{f.lo}–{f.hi} {f.unit}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sputum */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-bold text-gray-600">ผลเสมหะ</label>
            <label className="flex items-center gap-1 text-xs text-cyan-600 cursor-pointer">
              <input type="checkbox" checked={v.addSputum||false} onChange={e=>sf('addSputum',e.target.checked)} className="accent-cyan-600"/>เพิ่มผลเสมหะ
            </label>
          </div>
          {v.addSputum&&(
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 tb-fade space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-xs text-gray-500 block mb-0.5">Timepoint</label><input value={(v.sputumQuick||{}).tp||''} onChange={e=>sSp('tp',e.target.value)} placeholder="M2" className={inp}/></div>
                <div><label className="text-xs text-gray-500 block mb-0.5">AFB Result</label>
                  <select value={(v.sputumQuick||{}).result||''} onChange={e=>sSp('result',e.target.value)} className={inp}>
                    <option value="">--</option><option>Neg</option><option>Scanty</option><option>1+</option><option>2+</option><option>3+</option>
                  </select>
                </div>
                {(v.sputumQuick||{}).result==='Scanty'&&<div className="tb-fade"><label className="text-xs text-gray-500 block mb-0.5">Scanty count</label><input value={(v.sputumQuick||{}).scantyCount||''} onChange={e=>sSp('scantyCount',e.target.value)} placeholder="1-2/100F" className={inp+' font-mono'}/></div>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-gray-500 block mb-0.5">GeneXpert / PCR-MTB</label>
                  <select value={(v.sputumQuick||{}).genexpert||''} onChange={e=>sSp('genexpert',e.target.value)} className={inp}>
                    <option value="">-- ไม่ได้ตรวจ --</option><option value="Detected">MTB Detected</option><option value="Not Detected">MTB Not Detected</option><option value="Invalid">Invalid</option><option value="Error">Error</option>
                  </select>
                </div>
                {(v.sputumQuick||{}).genexpert==='Detected'&&<div className="tb-fade"><label className="text-xs text-gray-500 block mb-0.5">RIF Resistance</label>
                  <select value={(v.sputumQuick||{}).genexpertRif||''} onChange={e=>sSp('genexpertRif',e.target.value)} className={inp}>
                    <option value="">--</option><option value="Sensitive">RIF Sensitive</option><option value="Resistant">RIF Resistant</option><option value="Indeterminate">Indeterminate</option>
                  </select>
                </div>}
              </div>
            </div>
          )}
        </div>

        {/* ADR */}
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1.5">ADR ใน Visit นี้</label>
          <div className="flex flex-wrap gap-1.5">
            {ADR_LIST.map(a=>(
              <button key={a.key} type="button" onClick={()=>toggleAdr(a.key)}
                className={'px-2.5 py-1 rounded-full text-xs font-semibold border transition-all '+(v.adrNoted.includes(a.key)?'bg-red-500 border-red-500 text-white':'border-gray-200 text-gray-500 hover:border-red-300')}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Treatment Outcome */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
          <label className="text-xs font-bold text-teal-700 block mb-1"><i className="fa-solid fa-flag-checkered mr-1.5"></i>ผลการรักษา (Treatment Outcome)</label>
          <p className="text-xs text-teal-600/70 mb-2">บันทึกเมื่อพร้อมปิดเคส — หากยังไม่มีผลให้ว่างไว้</p>
          <select value={v.outcomeType||''} onChange={e=>sf('outcomeType',e.target.value)} className={inp+' mb-2'}>
            <option value="">— ยังไม่ระบุผลการรักษา —</option>
            {(window.OUTCOME_TYPES||[]).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {v.outcomeType && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
                <label className="text-xs text-teal-600 font-semibold whitespace-nowrap">วันที่ครบ:</label>
                <input type="date" value={v.outcomeEndDate||''} onChange={e=>sf('outcomeEndDate',e.target.value)} className={inp}/>
              </div>
              <input placeholder="หมายเหตุ (ไม่บังคับ)" value={v.outcomeNote||''} onChange={e=>sf('outcomeNote',e.target.value)} className={inp}/>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">ยกเลิก</button>
        <button type="button" onClick={()=>onSave(v)} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold"><i className="fa-solid fa-save mr-2"></i>บันทึก Visit</button>
      </div>
    </div>
  );
}


const TL_ICONS = { start:'fa-flag', regimen:'fa-pills', lab:'fa-flask', sputum:'fa-microscope', visit:'fa-user-doctor', 'alert-high':'fa-triangle-exclamation', 'alert-warn':'fa-circle-exclamation', 'alert-good':'fa-check-circle', 'alert-miss':'fa-calendar-xmark' };
const TL_COLORS = { start:'bg-teal-500', regimen:'bg-purple-500', lab:'bg-blue-500', sputum:'bg-cyan-500', visit:'bg-slate-500', 'alert-high':'bg-red-500', 'alert-warn':'bg-amber-500', 'alert-good':'bg-green-500', 'alert-miss':'bg-orange-500' };
const TL_BORDER = { start:'border-teal-200 bg-teal-50', regimen:'border-purple-200 bg-purple-50', lab:'border-blue-200 bg-blue-50', sputum:'border-cyan-200 bg-cyan-50', visit:'border-gray-200 bg-white', 'alert-high':'border-red-200 bg-red-50', 'alert-warn':'border-amber-200 bg-amber-50', 'alert-good':'border-green-200 bg-green-50', 'alert-miss':'border-orange-200 bg-orange-50' };

function TimelineTab({ patient, onUpdate, settings, locked }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null); // visitId to delete

  const groups = buildGroupedTimeline(patient);

  const filteredGroups = groups.map(([date, events]) => [date, events.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'visit') return e.type === 'visit';
    if (filter === 'lab') return e.type === 'lab' || e.type.startsWith('alert');
    if (filter === 'alert') return e.type.startsWith('alert');
    if (filter === 'sputum') return e.type === 'sputum';
    if (filter === 'regimen') return e.type === 'regimen' || e.type === 'start';
    return true;
  })]).filter(([,evs]) => evs.length > 0);

  const saveVisit = (v) => {
    const newVisit = {
      id: editId || ('v' + Date.now()),
      date: v.date, weight: +v.weight || patient.weight,
      vitals: v.vitals || {}, note: v.note,
      drugDoses: v.drugDoses || '',
      consult: v.consult, drp: v.drp || [],
      adrNoted: v.adrNoted || [],
      labData: v.labData || {}, sputumQuick: v.sputumQuick || {},
      type: 'visit'
    };
    let visits = [...(patient.visits || [])];
    if (editId) { visits = visits.map(x => x.id === editId ? newVisit : x); }
    else { visits = [...visits, newVisit]; }

    // Sync → Labs tab (from labData)
    let labs = [...patient.labs];
    if (v.addLab && v.labData) {
      const tp = 'V-' + v.date.substring(5);
      const existing = labs.findIndex(l => l.date === v.date && l.tp === tp);
      const lft = v.labData.lft || {}; const renal = v.labData.renal || {};
      const entry = {
        tp, date: v.date,
        alt: +lft.alt||0, ast: +lft.ast||0, alp: +lft.alp||0,
        tbili: +lft.tbili||0, dbili: +lft.dbili||0, alb: +lft.alb||0,
        scr: +renal.scr||0, bun: +renal.bun||0, ua: +renal.ua||0,
        hbsag: '', hcv: '',
        cbc: v.labData.cbc || {}
      };
      if (existing >= 0) labs[existing] = entry; else labs = [...labs, entry];
    }

    // Sync → Sputum tab
    let sputum = [...patient.sputum];
    if (v.addSputum && v.sputumQuick?.tp && v.sputumQuick?.result) {
      const sq = v.sputumQuick;
      const existing = sputum.findIndex(s => s.tp === sq.tp);
      const entry = { tp: sq.tp, result: sq.result, date: v.date,
        scantyCount: sq.scantyCount || '', genexpert: sq.genexpert || '', genexpertRif: sq.genexpertRif || '' };
      if (existing >= 0) sputum[existing] = entry; else sputum = [...sputum, entry];
    }

    // Sync → ADR tab
    let adr = migrateAdr(patient.adr);
    (v.adrNoted || []).forEach(k => {
      if (!adr[k]) adr[k] = { checked: true, note: 'บันทึก ' + v.date };
      else adr[k] = { ...adr[k], checked: true };
    });

    const newStatus = labs.some(l => l.alt > 120) ? 'critical' : patient.status;
    const outcome = v.outcomeType
      ? { type: v.outcomeType, date: v.date, endDate: v.outcomeEndDate || '', note: v.outcomeNote || '' }
      : (patient.outcome || null);
    onUpdate({ ...patient, visits, labs, sputum, adr, status: newStatus, weight: +v.weight || patient.weight, outcome });
    setShowForm(false); setEditId(null);
  };

  const deleteVisit = (id) => { onUpdate({ ...patient, visits: (patient.visits||[]).filter(v => v.id !== id) }); setConfirmDelete(null); };

  const formRef = useRef(null);
  const editVisit = (v) => {
    setEditId(v.id); setShowForm(true);
    // scroll to form after render
    setTimeout(()=>{ if(formRef.current) formRef.current.scrollIntoView({block:'nearest',behavior:'smooth'}); },100);
  };
  const editInitial = editId ? (patient.visits||[]).find(v => v.id === editId) : null;
  const editInitialForm = editInitial ? {
    date: editInitial.date || new Date().toISOString().split('T')[0],
    weight: editInitial.weight || '',
    vitals: editInitial.vitals || {bp:'',hr:'',rr:'',temp:'',o2:''},
    drugDoses: editInitial.drugDoses || '',
    note: editInitial.note || '',
    consult: editInitial.consult || {type:'',note:''},
    drp: editInitial.drp || [],
    adrNoted: editInitial.adrNoted || [],
    labData: editInitial.labData || {lft:{},cbc:{},renal:{}},
    sputumQuick: editInitial.sputumQuick || {tp:'',result:'',scantyCount:'',genexpert:'',genexpertRif:''},
    addLab: false,
    addSputum: false,
    outcomeType: editInitial.outcome?.type || '',
    outcomeEndDate: editInitial.outcome?.endDate || '',
    outcomeNote: editInitial.outcome?.note || '',
  } : null;

  const FILTERS = [['all','ทั้งหมด'],['visit','Visit'],['lab','Lab'],['sputum','เสมหะ'],['alert','Alert'],['regimen','สูตรยา']];

  return (
    <div className="space-y-4 tb-fade">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-timeline mr-2 text-teal-600"></i>Timeline การรักษา</h3>
        <button type="button" onClick={() => { if(!locked){setEditId(null); setShowForm(!showForm);} }}
          disabled={locked}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${locked?'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-teal-600 hover:bg-teal-700 text-white'}`}>
          <i className="fa-solid fa-plus mr-1"></i>บันทึก Visit
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(([val, lbl]) => (
          <button key={val} type="button" onClick={() => setFilter(val)}
            className={'px-3 py-1.5 rounded-full text-xs font-bold border transition-all '+(filter===val?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-500 hover:border-teal-300')}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && <ConfirmModal message="ยืนยันการลบ Visit นี้" onConfirm={()=>deleteVisit(confirmDelete)} onCancel={()=>setConfirmDelete(null)}/>}
      <div ref={formRef}>{showForm && !locked && <VisitForm key={editId||'new'} initial={editInitialForm} onSave={saveVisit} onCancel={() => { setShowForm(false); setEditId(null); }} patient={{...patient,_labGroups:(settings?.labGroups)||LAB_GROUPS}}/>}</div>

      {/* Timeline */}
      {filteredGroups.length === 0 ? (
        <p className="text-center text-gray-400 py-10">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="relative space-y-4">
          {/* vertical line */}
          <div className="absolute left-[88px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-300 via-gray-200 to-transparent pointer-events-none"></div>
          {filteredGroups.map(([date, events]) => (
            <div key={date} className="flex gap-4 relative">
              {/* Date badge (left) */}
              <div className="flex-shrink-0 w-24 text-right pt-3">
                <div className="bg-teal-700 text-white rounded-xl px-2 py-1.5 inline-block text-center shadow-sm">
                  <p className="text-xs font-bold leading-none">{date.substring(5).replace('-','/')}</p>
                  <p className="text-xs opacity-70 mt-0.5">{date.substring(0,4)}</p>
                </div>
              </div>

              {/* Events card */}
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {events.map((e, ei) => {
                  const isTBConfirmed = e.type==='sputum' && e.tbConfirmed;
                  return (
                  <div key={ei} className={'border-b border-gray-100 last:border-b-0 px-4 py-3 '+(isTBConfirmed?'bg-red-50 border-l-4 border-l-red-500':e.type.startsWith('alert-high')?'bg-red-50':e.type.startsWith('alert-warn')?'bg-amber-50/50':e.type.startsWith('alert-good')?'bg-green-50/50':e.type.startsWith('alert-miss')?'bg-orange-50/50':'')}>
                    <div className="flex items-start gap-3">
                      <div className={'rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-0.5 '+(isTBConfirmed?'w-9 h-9 text-sm bg-red-600':'w-7 h-7 text-xs '+(TL_COLORS[e.type]||'bg-gray-400'))}>
                        <i className={'fa-solid '+(TL_ICONS[e.type]||'fa-circle')}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={isTBConfirmed?'font-black text-base text-red-700':'font-bold text-sm text-gray-800'}>{e.label}{isTBConfirmed&&<span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">TB Confirmed</span>}</p>
                          {e.type === 'visit' && (
                            <div className="flex gap-1 flex-shrink-0">
                              <button type="button" onClick={() => editVisit(e)} className="text-gray-400 hover:text-teal-600 text-xs p-1 transition-colors" title="แก้ไข"><i className="fa-solid fa-pen"></i></button>
                              <button type="button" onClick={() => setConfirmDelete(e.id)} className="text-gray-400 hover:text-red-500 text-xs p-1 transition-colors" title="ลบ"><i className="fa-solid fa-trash"></i></button>
                            </div>
                          )}
                        </div>
                        {/* Vitals row */}
                        {e.vitals && Object.values(e.vitals).some(v=>v) && (
                          <div className="flex gap-3 mt-1 flex-wrap">
                            {e.vitals.bp&&<span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">BP {e.vitals.bp}</span>}
                            {e.vitals.hr&&<span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">HR {e.vitals.hr}</span>}
                            {e.vitals.rr&&<span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">RR {e.vitals.rr}</span>}
                            {e.vitals.temp&&<span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">T {e.vitals.temp}°C</span>}
                            {e.vitals.o2&&<span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">O2 {e.vitals.o2}%</span>}
                            {e.weight&&<span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-mono font-bold">BW {e.weight} kg</span>}
                          </div>
                        )}
                        {/* Note */}
                        {e.note && <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed mt-1.5 font-mono">{e.note}</p>}
                        {/* Drug doses */}
                        {e.drugDoses && <p className="text-xs mt-1.5 font-mono bg-teal-50 text-teal-800 px-2 py-1 rounded-lg inline-block"><i className="fa-solid fa-pills mr-1"></i>{e.drugDoses}</p>}
                        {/* Consult */}
                        {e.consult?.type && <div className="mt-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg"><p className="text-xs font-bold text-amber-700"><i className="fa-solid fa-comments mr-1"></i>Consult: {e.consult.type}</p>{e.consult.note&&<p className="text-xs text-amber-600 mt-0.5">{e.consult.note}</p>}</div>}
                        {/* DRP */}
                        {e.drp&&e.drp.length>0&&<div className="mt-1.5 space-y-1">{e.drp.map((d,di)=><div key={di} className="bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg"><p className="text-xs font-bold text-red-700"><i className="fa-solid fa-circle-exclamation mr-1"></i>DRP {d.type}: {d.note}</p></div>)}</div>}
                        {/* Detail (non-visit) */}
                        {!e.note && e.detail && <p className="text-xs text-gray-600 mt-0.5">{e.detail}</p>}
                        {/* ADR noted */}
                        {e.adrNoted && e.adrNoted.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {e.adrNoted.map(k => { const a = ADR_LIST.find(x=>x.key===k); return a ? <span key={k} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold">{a.label}</span> : null; })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DIAGNOSIS (SPUTUM) TAB ───────────────────────────────────────────────────

// Timepoint options: Diag(M0), M1-M18
const TP_OPTIONS = [
  {value:'M0',label:'เดือนที่ 0 (วินิจฉัย)'},
  ...Array.from({length:18},(_,i)=>({value:'M'+(i+1),label:'เดือนที่ '+(i+1)}))
];

// Specimen types
const SPECIMEN_TYPES = ['Sputum','Pus','Stool','Bronchoalveolar Lavage (BAL)','Biopsy','CSF (น้ำไขสันหลัง)','Pleural fluid (น้ำในช่องเยื่อหุ้มปอด)','Urine','อื่นๆ'];

// Molecular test types
const MOLEC_TYPES = [
  'TB-PCR (Conventional PCR)',
  'GeneXpert MTB/RIF',
  'GeneXpert MTB/RIF Ultra',
  'Truenat MTB',
  'LPA (FL-LPA — First-Line)',
  'LPA (SL-LPA — Second-Line)',
  'TB Culture (Solid — LJ)',
  'TB Culture (Liquid — MGIT)',
  'TB Culture (อื่นๆ)',
  'อื่นๆ',
];

// AFB result options
const AFB_RESULTS = ['Neg','Scanty','1+','2+','3+'];

// Resistance result options
const RIF_RESULTS   = ['RIF susceptible','RIF resistant','RIF indeterminate','Invalid'];
const INH_RESULTS   = ['INH susceptible','INH resistant','INH indeterminate','Invalid'];
const SLD_DRUGS     = [
  {key:'flqs', label:'FLQS*', expand:'Fluoroquinolones', sub:['Levofloxacin','Ofloxacin','Moxifloxacin']},
  {key:'agcp',  label:'AG/CP*', expand:'Aminoglycoside/Cyclic peptide', sub:['Amikacin','Kanamycin','Capreomycin','Viomycin']},
  {key:'eto',   label:'ETO', expand:'Ethionamide', sub:[]},
];
const SLD_RES_OPTIONS = ['Susceptible','Resistant','Indeterminate','Not tested'];

// Check if any sputum record has resistance
function hasResistance(sputum) {
  return (sputum||[]).some(s => s.rifResult==='RIF resistant' || s.inhResult==='INH resistant' || (s.sldResults && Object.values(s.sldResults).some(v=>v==='Resistant')));
}

// Compute AFB combined display string for a sputum record
function afbCombined(s) {
  if (!s) return '-';
  // New format: specimens array
  if (s.specimens && s.specimens.length > 0) {
    const parts = s.specimens.map(sp => {
      const afb = (sp.afbSamples||[]).filter(a=>a.result);
      if (afb.length === 0) return null;
      const label = sp.type && sp.type!=='Sputum' ? '['+sp.type.split(' ')[0]+'] ' : '';
      const results = afb.map(a=>a.result==='Scanty'&&a.scantyCount?'Scanty '+a.scantyCount+' cells':a.result).join(' / ');
      return label + results;
    }).filter(Boolean);
    return parts.length > 0 ? parts.join(' | ') : '-';
  }
  // Legacy: afbSamples array
  if (s.afbSamples && s.afbSamples.length > 0) {
    const parts = s.afbSamples.map(sa => {
      if (!sa.result) return null;
      if (sa.result === 'Scanty' && sa.scantyCount) return 'Scanty '+sa.scantyCount+' cells';
      return sa.result;
    }).filter(Boolean);
    return parts.length > 0 ? parts.join(' / ') : '-';
  }
  // Legacy single result
  if (!s.result) return '-';
  if (s.result === 'Scanty' && s.scantyCount) return 'Scanty '+s.scantyCount+' cells';
  return s.result;
}

// Is positive (for conversion logic)
function isAfbPositive(s) {
  const combined = afbCombined(s);
  if (!combined || combined === '-' || combined === 'Neg') return false;
  // all parts Neg → negative
  const parts = combined.split(' / ');
  return parts.some(p => p !== 'Neg');
}

// Check sputum conversion — first month where NOT positive after M0
function getSputumConversion(sputumList) {
  const sorted = [...(sputumList||[])].sort((a,b) => {
    const na = a.tp === 'M0' ? 0 : parseInt((a.tp||'').replace('M',''))||99;
    const nb = b.tp === 'M0' ? 0 : parseInt((b.tp||'').replace('M',''))||99;
    return na - nb;
  });
  for (let i = 1; i < sorted.length; i++) {
    if (!isAfbPositive(sorted[i])) {
      return { converted: true, tp: sorted[i].tp, date: sorted[i].date };
    }
  }
  return { converted: false };
}

// Is delayed conversion: M2 still positive
function isDelayedConversion(sputumList) {
  const m2 = (sputumList||[]).find(s => s.tp === 'M2');
  if (!m2) return false;
  return isAfbPositive(m2);
}

// Empty add form state
const EMPTY_DX = () => ({
  tp: 'M0',
  date: new Date().toISOString().split('T')[0],
  // Each specimen has its own type + AFB samples
  specimens: [{type:'Sputum', otherLabel:'', afbSamples:[{result:'',scantyCount:''}]}],
  molecType: '',
  molecOther: '',
  mtbResult: '',
  rifResult: '',
  inhResult: '',
  showSld: false,
  sldResults: {flqs:'',agcp:'',eto:''},
  igraResult: '',
  igraDate: '',
  igraNote: '',
  extraLabsPerSpecimen: {}, // keyed by specimen type
  showExtraLabsPerSpecimen: {}, // keyed by specimen type
});

// Visible columns state
const DEFAULT_COLS = {tp:true, date:true, afb:true, molec:true, rif:true, inh:false, sld:false, igra:false};

// Helper: format date to DD/MM/YYYY
function fmtDate(d) {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  return parts[2]+'/'+parts[1]+'/'+parts[0];
}

// Specimen-specific lab fields
const SPECIMEN_LAB_FIELDS = {
  'Bronchoalveolar Lavage (BAL)': [
    {k:'balWbc',    label:'WBC (cells/μL)'},
    {k:'balLymph',  label:'Lymphocyte (%)'},
    {k:'balMacro',  label:'Macrophage (%)'},
    {k:'balNeutro', label:'Neutrophil (%)'},
    {k:'balProtein',label:'Protein (mg/dL)'},
    {k:'balGlucose',label:'Glucose (mg/dL)'},
    {k:'balLdh',    label:'LDH (U/L)'},
  ],
  'CSF (น้ำไขสันหลัง)': [
    {k:'csfAppear',  label:'ลักษณะ', type:'text', placeholder:'clear/turbid/xanthochromic'},
    {k:'csfProtein', label:'Protein (mg/dL)'},
    {k:'csfGlucose', label:'Glucose (mg/dL)'},
    {k:'csfSerum',   label:'Serum Glucose (mg/dL)'},
    {k:'csfWbc',     label:'WBC (cells/μL)'},
    {k:'csfLymph',   label:'Lymphocyte (%)'},
    {k:'csfPmn',     label:'PMN (%)'},
    {k:'csfRbc',     label:'RBC (cells/μL)'},
    {k:'csfCl',      label:'Chloride (mEq/L)'},
    {k:'csfAda',     label:'ADA (U/L)'},
    {k:'csfCrypto',  label:'Crypto Ag', tp:'select', opts:['','Positive','Negative','Not done']},
    {k:'csfGram',    label:'Gram stain', type:'text', placeholder:'no organism/...'},
    {k:'csfIndia',   label:'India ink', tp:'select', opts:['','Positive','Negative','Not done']},
  ],
  'Pleural fluid (น้ำในช่องเยื่อหุ้มปอด)': [
    {k:'pfAppear',   label:'ลักษณะ', type:'text', placeholder:'clear/turbid/bloody/chylous'},
    {k:'pfProtein',  label:'Protein fluid (g/dL)'},
    {k:'pfSerum',    label:'Protein serum (g/dL)'},
    {k:'pfLdh',      label:'LDH fluid (U/L)'},
    {k:'pfLdhSerum', label:'LDH serum (U/L)'},
    {k:'pfGlucose',  label:'Glucose (mg/dL)'},
    {k:'pfWbc',      label:'WBC (cells/μL)'},
    {k:'pfLymph',    label:'Lymphocyte (%)'},
    {k:'pfPmn',      label:'PMN (%)'},
    {k:'pfAda',      label:'ADA (U/L)'},
    {k:'pfPh',       label:'pH'},
    {k:'pfTrigly',   label:'Triglyceride (mg/dL)'},
    {k:'pfGram',     label:'Gram stain', type:'text', placeholder:'no organism/...'},
  ],
};

function DiagnosisTab({patient, onUpdate, locked}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_DX());
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [editIdx, setEditIdx] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const sf = (k,v) => setForm(f=>({...f,[k]:v}));
  // Specimen handlers
  const addSpecimen = () => setForm(f=>({...f,specimens:[...f.specimens,{type:'Sputum',otherLabel:'',afbSamples:[{result:'',scantyCount:''}]}]}));
  const rmSpecimen = (si) => setForm(f=>({...f,specimens:f.specimens.filter((_,i)=>i!==si)}));
  const setSpecimenType = (si,t) => setForm(f=>{const arr=[...f.specimens];arr[si]={...arr[si],type:t};return {...f,specimens:arr};});
  const setSpecimenOther = (si,v) => setForm(f=>{const arr=[...f.specimens];arr[si]={...arr[si],otherLabel:v};return {...f,specimens:arr};});
  const setSample = (si,ai,k,v) => setForm(f=>{
    const specs=[...f.specimens];
    const afb=[...specs[si].afbSamples];
    afb[ai]={...afb[ai],[k]:v};
    specs[si]={...specs[si],afbSamples:afb};
    return {...f,specimens:specs};
  });
  const addSample = (si) => setForm(f=>{
    const specs=[...f.specimens];
    if(specs[si].afbSamples.length>=3) return f;
    specs[si]={...specs[si],afbSamples:[...specs[si].afbSamples,{result:'',scantyCount:''}]};
    return {...f,specimens:specs};
  });
  const rmSample = (si,ai) => setForm(f=>{
    const specs=[...f.specimens];
    specs[si]={...specs[si],afbSamples:specs[si].afbSamples.filter((_,i)=>i!==ai)};
    return {...f,specimens:specs};
  });
  const setSld = (k,v) => setForm(f=>({...f,sldResults:{...f.sldResults,[k]:v}}));
  const setExtraLab = (specType,k,v) => sf('extraLabsPerSpecimen',{...form.extraLabsPerSpecimen,[specType]:{...(form.extraLabsPerSpecimen[specType]||{}),[k]:v}});
  const toggleExtraLabs = (specType) => sf('showExtraLabsPerSpecimen',{...form.showExtraLabsPerSpecimen,[specType]:!form.showExtraLabsPerSpecimen[specType]});

  const openAdd = () => { setForm(EMPTY_DX()); setEditIdx(null); setShowAdd(true); setConflictData(null); };
  const openEdit = (idx) => {
    const s = patient.sputum[idx];
    // Build specimens array from legacy or new format
    let specimens;
    if (s.specimens && s.specimens.length>0) {
      specimens = s.specimens;
    } else {
      const afb = s.afbSamples&&s.afbSamples.length>0 ? s.afbSamples : [{result:s.result||'',scantyCount:s.scantyCount||''}];
      specimens = [{type:s.specimenType||'Sputum', otherLabel:s.specimenOther||'', afbSamples:afb}];
    }
    setForm({
      tp: s.tp||'M0', date: s.date||new Date().toISOString().split('T')[0],
      specimens,
      molecType: s.molecType||'', molecOther: s.molecOther||'',
      mtbResult: s.mtbResult||s.genexpert||'',
      rifResult: s.rifResult||(s.genexpertRif==='Sensitive'?'RIF susceptible':s.genexpertRif==='Resistant'?'RIF resistant':s.genexpertRif==='Indeterminate'?'RIF indeterminate':'')||'',
      inhResult: s.inhResult||'',
      showSld: !!(s.sldResults&&Object.values(s.sldResults).some(v=>v)),
      sldResults: s.sldResults||{flqs:'',agcp:'',eto:''},
      igraResult: s.igraResult||'',
      igraDate: s.igraDate||'',
      igraNote: s.igraNote||'',
      extraLabsPerSpecimen: s.extraLabsPerSpecimen||{},
      showExtraLabsPerSpecimen: s.showExtraLabsPerSpecimen||{},
    });
    setEditIdx(idx); setShowAdd(true); setConflictData(null);
  };

  const mergeEntries = (existing, newE) => {
    // Merge specimens arrays (combine by type)
    const mergedSpecs = [...(existing.specimens||[])];
    (newE.specimens||[]).forEach(ns => {
      const ei = mergedSpecs.findIndex(es=>es.type===ns.type);
      if (ei>=0) { if(ns.afbSamples?.some(s=>s.result)) mergedSpecs[ei]={...mergedSpecs[ei],afbSamples:ns.afbSamples}; }
      else mergedSpecs.push(ns);
    });
    return {
      ...existing, specimens: mergedSpecs,
      molecType: newE.molecType||existing.molecType,
      molecOther: newE.molecOther||existing.molecOther,
      mtbResult: newE.mtbResult||existing.mtbResult,
      genexpert: newE.genexpert||existing.genexpert,
      rifResult: newE.rifResult||existing.rifResult,
      genexpertRif: newE.genexpertRif||existing.genexpertRif,
      inhResult: newE.inhResult||existing.inhResult,
      sldResults: {...(existing.sldResults||{}), ...(newE.sldResults||{})},
      igraResult: newE.igraResult||existing.igraResult,
      extraLabs: {...(existing.extraLabs||{}), ...(newE.extraLabs||{})},
    };
  };

  const buildEntry = () => {
    const specs = form.specimens||[];
    // Legacy compat: first specimen
    const firstSpec = specs[0]||{type:'Sputum',afbSamples:[]};
    const firstAfb = (firstSpec.afbSamples||[]).filter(s=>s.result);
    return {
      tp:form.tp, date:form.date,
      specimens: specs.map(sp=>({...sp, afbSamples:(sp.afbSamples||[]).filter(s=>s.result)})),
      // legacy fields
      specimenType: firstSpec.type,
      specimenOther: firstSpec.otherLabel||'',
      result: firstAfb[0]?.result||'',
      scantyCount: firstAfb[0]?.scantyCount||'',
      afbSamples: firstAfb,
      molecType:form.molecType, molecOther:form.molecOther,
      genexpert:form.mtbResult, mtbResult:form.mtbResult,
      genexpertRif:form.rifResult==='RIF resistant'?'Resistant':form.rifResult==='RIF susceptible'?'Sensitive':form.rifResult==='RIF indeterminate'?'Indeterminate':form.rifResult,
      rifResult:form.rifResult, inhResult:form.inhResult,
      sldResults:form.showSld?form.sldResults:{},
      igraResult:form.igraResult,
      igraDate:form.igraDate||'',
      igraNote:form.igraNote||'',
      extraLabsPerSpecimen:form.extraLabsPerSpecimen||{},
      showExtraLabsPerSpecimen:form.showExtraLabsPerSpecimen||{},
    };
  };

  const isEntryConflict = (existing, newE) => {
    if (existing.tp !== newE.tp || existing.date !== newE.date) return false;
    const existSpecs = existing.specimens||[];
    const newSpecs = newE.specimens||[];
    const hasBothAfb = newSpecs.some(ns=>{
      const es = existSpecs.find(s=>s.type===ns.type);
      return es && es.afbSamples?.some(s=>s.result) && ns.afbSamples?.some(s=>s.result);
    });
    const hasBothMolec = existing.mtbResult && newE.mtbResult && existing.mtbResult!==newE.mtbResult;
    return hasBothAfb || hasBothMolec;
  };

  const save = (forceNew=false, forceOld=false) => {
    const entry = buildEntry();
    const isRes = entry.rifResult==='RIF resistant'||entry.inhResult==='INH resistant'||(entry.sldResults&&Object.values(entry.sldResults).some(v=>v==='Resistant'));
    let sputum = [...(patient.sputum||[])];
    if (editIdx!==null) {
      sputum[editIdx] = entry;
    } else {
      const existingIdx = sputum.findIndex(s=>s.tp===entry.tp && s.date===entry.date);
      if (existingIdx>=0) {
        if (forceNew) { sputum[existingIdx] = entry; }
        else if (forceOld) { setShowAdd(false); setEditIdx(null); setConflictData(null); return; }
        else if (isEntryConflict(sputum[existingIdx], entry)) { setConflictData({existingIdx, newEntry:entry}); return; }
        else { sputum[existingIdx] = mergeEntries(sputum[existingIdx], entry); }
      } else { sputum.push(entry); }
    }
    onUpdate({...patient,sputum,status:isRes?'critical':patient.status,hasResistance:isRes||!!patient.hasResistance});
    setShowAdd(false); setEditIdx(null); setConflictData(null);
  };

  const del = (idx) => { onUpdate({...patient,sputum:(patient.sputum||[]).filter((_,i)=>i!==idx)}); };

  const sorted = [...(patient.sputum||[])].sort((a,b)=>{
    const na=a.tp==='M0'?0:parseInt((a.tp||'').replace('M',''))||99;
    const nb=b.tp==='M0'?0:parseInt((b.tp||'').replace('M',''))||99;
    if(na!==nb) return na-nb;
    return (a.date||'').localeCompare(b.date||'');
  });

  const conversion = getSputumConversion(patient.sputum||[]);
  const delayed = isDelayedConversion(patient.sputum||[]);
  const resistant = hasResistance(patient.sputum||[]);
  const allTps = [...new Set(sorted.map(s=>s.tp))];
  const toggleCol = k => setCols(c=>({...c,[k]:!c[k]}));
  const inp = 'w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:ring-1 focus:ring-teal-400';
  const isLTBI = patient.diseaseLocation==='LTBI';
  // specimen fields = union of all specimen types in form
  const specimenFields = (form.specimens||[]).reduce((acc,sp)=>{
    const f = SPECIMEN_LAB_FIELDS[sp.type];
    if (f) f.forEach(fi=>{ if (!acc.find(a=>a.k===fi.k)) acc.push(fi); });
    return acc;
  },[]);

  return (
    <div className="space-y-5 tb-fade">

      {resistant && (
        <div className="bg-red-600 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <i className="fa-solid fa-biohazard text-2xl flex-shrink-0"></i>
          <div>
            <p className="font-black text-base">⚠ พบเชื้อดื้อยา — ต้องประเมินสูตร MDR/XDR</p>
            <p className="text-red-100 text-xs mt-0.5">ตรวจสอบผล RIF / INH / SLD ด้านล่าง และปรึกษาผู้เชี่ยวชาญ</p>
          </div>
        </div>
      )}

      {/* Sputum conversion status */}
      {delayed && (
        <div className="bg-red-50 border-2 border-red-400 p-3 rounded-2xl flex items-center gap-3">
          <i className="fa-solid fa-circle-exclamation text-red-500 text-xl"></i>
          <div><p className="font-bold text-red-700 text-sm">Delayed Sputum Conversion</p><p className="text-xs text-red-600">เดือนที่ 2 ยังพบเชื้อ — ต้องประเมินการรักษาและ adherence</p></div>
        </div>
      )}
      {!delayed && conversion.converted && (
        <div className="bg-green-50 border border-green-300 p-3 rounded-2xl flex items-center gap-3">
          <i className="fa-solid fa-check-circle text-green-500 text-xl"></i>
          <div><p className="font-bold text-green-700 text-sm">Sputum Conversion สำเร็จ ({conversion.tp})</p><p className="text-xs text-green-600">{fmtDate(conversion.date)}</p></div>
        </div>
      )}

      {/* IGRA — LTBI */}


      {/* Header row */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-microscope mr-2 text-teal-600"></i>ผลการวินิจฉัย (Diagnosis)</h3>
        <button type="button" onClick={()=>{if(!locked)openAdd();}} disabled={locked} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${locked?'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-teal-600 hover:bg-teal-700 text-white'}`}><i className="fa-solid fa-plus mr-1"></i>เพิ่มผล</button>
      </div>

      {/* Add/Edit form */}
      {showAdd && (
        <div className="bg-teal-50 border-2 border-teal-300 p-4 rounded-2xl tb-fade space-y-4">
          <p className="font-bold text-teal-800 text-sm">{editIdx!==null?'แก้ไขผล':'เพิ่มผลการวินิจฉัย'}</p>

          {/* Row 1: เดือนที่ + วันที่ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">เดือนที่</label>
              <select value={form.tp} onChange={e=>sf('tp',e.target.value)} className={inp}>
                {TP_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">วันที่</label>
              <input type="date" value={form.date} onChange={e=>sf('date',e.target.value)} className={inp}/>
            </div>
          </div>

          {/* Specimens — each has own type + AFB */}
          <div className="space-y-3">
            {(form.specimens||[]).map((sp,si)=>(
              <div key={si} className="bg-white border border-gray-200 rounded-xl p-3">
                {/* Specimen header */}
                <div className="flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-vial text-amber-400 text-xs flex-shrink-0"></i>
                  <select value={sp.type} onChange={e=>setSpecimenType(si,e.target.value)} className="flex-1 p-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-1 focus:ring-teal-300">
                    {SPECIMEN_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                  {sp.type==='อื่นๆ' && <input value={sp.otherLabel||''} onChange={e=>setSpecimenOther(si,e.target.value)} placeholder="ระบุ..." className="flex-1 p-1.5 border border-teal-200 rounded-lg text-xs outline-none bg-white"/>}
                  {(form.specimens||[]).length>1 && <button type="button" onClick={()=>rmSpecimen(si)} className="text-gray-300 hover:text-red-400 ml-1 flex-shrink-0"><i className="fa-solid fa-xmark"></i></button>}
                </div>
                {/* AFB smear for this specimen */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-600"><i className="fa-solid fa-bacteria mr-1 text-amber-500"></i>AFB smear</p>
                    {sp.type==='Sputum' && (sp.afbSamples||[]).length < 3 &&
                      <button type="button" onClick={()=>addSample(si)} className="text-xs text-teal-600 hover:text-teal-800 font-semibold"><i className="fa-solid fa-plus mr-1"></i>เพิ่มครั้งที่ {(sp.afbSamples||[]).length+1}</button>}
                  </div>
                  {(sp.afbSamples||[]).map((sa,ai)=>(
                    <div key={ai} className="flex items-center gap-2">
                      {sp.type==='Sputum' && <span className="text-xs text-gray-400 font-mono w-12 flex-shrink-0">ครั้งที่ {ai+1}</span>}
                      <select value={sa.result} onChange={e=>setSample(si,ai,'result',e.target.value)} className="flex-1 p-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-1 focus:ring-teal-300">
                        <option value="">-- ผล AFB --</option>
                        {AFB_RESULTS.map(r=><option key={r}>{r}</option>)}
                      </select>
                      {sa.result==='Scanty' && (
                        <input value={sa.scantyCount||''} onChange={e=>setSample(si,ai,'scantyCount',e.target.value)} placeholder="จำนวน cells เช่น 3" className="flex-1 p-1.5 border border-amber-200 rounded-lg text-xs font-mono outline-none bg-white focus:ring-1 focus:ring-amber-300"/>
                      )}
                      {(sp.afbSamples||[]).length>1 && <button type="button" onClick={()=>rmSample(si,ai)} className="text-gray-300 hover:text-red-400"><i className="fa-solid fa-xmark text-xs"></i></button>}
                    </div>
                  ))}
                  {(sp.afbSamples||[]).some(s=>s.result) && (
                    <p className="text-xs text-teal-700 font-bold bg-teal-50 px-2 py-1 rounded-lg mt-1">
                      <i className="fa-solid fa-eye mr-1"></i>{(sp.afbSamples||[]).filter(s=>s.result).map(s=>s.result==='Scanty'&&s.scantyCount?'Scanty '+s.scantyCount+' cells':s.result).join(' / ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {/* Add specimen button */}
            <button type="button" onClick={addSpecimen} className="w-full py-2 border-2 border-dashed border-teal-300 rounded-xl text-xs font-semibold text-teal-600 hover:bg-teal-50 transition-colors">
              <i className="fa-solid fa-plus mr-1"></i>เพิ่มสิ่งส่งตรวจชนิดอื่น
            </button>
          </div>

          {/* Specimen-specific lab fields — one section per specimen type that has fields */}
          {(form.specimens||[]).filter(sp=>SPECIMEN_LAB_FIELDS[sp.type]).map(sp=>{
            const fields = SPECIMEN_LAB_FIELDS[sp.type]||[];
            const isOpen = form.showExtraLabsPerSpecimen[sp.type];
            return (
              <div key={sp.type} className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 tb-fade">
                <label className="flex items-center gap-2 text-xs text-indigo-700 font-bold cursor-pointer">
                  <input type="checkbox" checked={!!isOpen} onChange={()=>toggleExtraLabs(sp.type)} className="accent-indigo-600"/>
                  ผล Lab เฉพาะ {sp.type}
                </label>
                {isOpen && (
                  <div className="grid grid-cols-4 gap-2 mt-2 tb-fade">
                    {fields.map(f=>(
                      <div key={f.k}>
                        <label className="text-xs text-gray-500 block mb-0.5">{f.label}</label>
                        {f.tp==='select' ? (
                          <select value={((form.extraLabsPerSpecimen||{})[sp.type]||{})[f.k]||''} onChange={e=>setExtraLab(sp.type,f.k,e.target.value)} className="w-full p-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:ring-1 focus:ring-indigo-300">
                            {(f.opts||[]).map(o=><option key={o} value={o}>{o||'--'}</option>)}
                          </select>
                        ) : f.type==='text' ? (
                          <input type="text" value={((form.extraLabsPerSpecimen||{})[sp.type]||{})[f.k]||''} onChange={e=>setExtraLab(sp.type,f.k,e.target.value)} placeholder={f.placeholder||''} className="w-full p-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:ring-1 focus:ring-indigo-300"/>
                        ) : (
                          <input type="number" step="0.01" value={((form.extraLabsPerSpecimen||{})[sp.type]||{})[f.k]||''} onChange={e=>setExtraLab(sp.type,f.k,e.target.value)} className="w-full p-1.5 border border-gray-200 rounded-lg text-xs text-center outline-none bg-white focus:ring-1 focus:ring-indigo-300"/>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Molecular — must select type first */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-gray-700"><i className="fa-solid fa-dna mr-1 text-purple-500"></i>Molecular / Culture</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">ชนิดการตรวจ <span className="text-gray-300">(เลือกก่อน)</span></label>
                <select value={form.molecType} onChange={e=>{sf('molecType',e.target.value); if(!e.target.value) sf('mtbResult','');}} className={inp}>
                  <option value="">-- ไม่ได้ตรวจ --</option>
                  {MOLEC_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
                {form.molecType==='อื่นๆ' && <input value={form.molecOther} onChange={e=>sf('molecOther',e.target.value)} placeholder="ระบุ..." className={inp+' mt-1'}/>}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">
                  ผล MTB {!form.molecType && <span className="text-gray-300">(เลือกชนิดการตรวจก่อน)</span>}
                </label>
                <select value={form.mtbResult} onChange={e=>sf('mtbResult',e.target.value)} disabled={!form.molecType} className={inp+((!form.molecType)?' opacity-40 cursor-not-allowed':'')}>
                  <option value="">--</option>
                  <option value="Detected">MTB Detected</option>
                  <option value="Detected very low">MTB Detected (Very Low)</option>
                  <option value="Not Detected">MTB Not Detected</option>
                  <option value="Invalid">Invalid</option>
                  <option value="Error">Error</option>
                </select>
              </div>
            </div>

            {form.molecType && form.mtbResult==='Detected' && (
              <div className="space-y-2 tb-fade">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-0.5">RIF Resistance <span className="text-gray-300 font-normal">(Rifampicin)</span></label>
                    <select value={form.rifResult} onChange={e=>sf('rifResult',e.target.value)} className={inp+(form.rifResult==='RIF resistant'?' border-red-400 bg-red-50 font-bold text-red-700':'')}>
                      <option value="">--</option>
                      {RIF_RESULTS.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-0.5">INH Resistance <span className="text-gray-300 font-normal">(Isoniazid)</span></label>
                    <select value={form.inhResult} onChange={e=>sf('inhResult',e.target.value)} className={inp+(form.inhResult==='INH resistant'?' border-red-400 bg-red-50 font-bold text-red-700':'')}>
                      <option value="">--</option>
                      {INH_RESULTS.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {(form.rifResult==='RIF resistant'||form.inhResult==='INH resistant') && (
                  <div className="tb-fade">
                    <label className="flex items-center gap-2 text-xs text-red-700 font-bold cursor-pointer">
                      <input type="checkbox" checked={form.showSld} onChange={e=>sf('showSld',e.target.checked)} className="accent-red-600"/>
                      เพิ่มผล SLD (Second-Line Drug Susceptibility Testing)
                    </label>
                    {form.showSld && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2 space-y-2 tb-fade">
                        <p className="text-xs text-red-700 font-bold mb-1">Drug Susceptibility Testing — Second-Line Drugs (SLD)</p>
                        {SLD_DRUGS.map(d=>(
                          <div key={d.key} className="flex items-center gap-3">
                            <div className="w-36 flex-shrink-0">
                              <p className="text-xs font-bold text-gray-700">{d.label}</p>
                              <p className="text-xs text-gray-500">{d.expand}</p>
                              {d.sub.length>0 && <p className="text-xs text-gray-300 leading-tight">{d.sub.join(', ')}</p>}
                            </div>
                            <select value={form.sldResults[d.key]||''} onChange={e=>setSld(d.key,e.target.value)} className={'flex-1 p-1.5 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-300 '+(form.sldResults[d.key]==='Resistant'?'border-red-400 bg-red-50 font-bold text-red-700':'border-gray-200 bg-white')}>
                              <option value="">-- ยังไม่มีผล --</option>
                              {SLD_RES_OPTIONS.map(o=><option key={o}>{o}</option>)}
                            </select>
                          </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-red-100 text-xs text-gray-400 space-y-0.5">
                          <p><strong>FLQS</strong> = Fluoroquinolones: Levofloxacin, Ofloxacin, Moxifloxacin</p>
                          <p><strong>AG/CP</strong> = Aminoglycoside/Cyclic peptide: Amikacin, Kanamycin, Capreomycin, Viomycin</p>
                          <p><strong>ETO</strong> = Ethionamide &nbsp;·&nbsp; <strong>SLD</strong> = Second-Line Drugs</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* IGRA */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
            <p className="text-xs font-bold text-indigo-700 mb-2"><i className="fa-solid fa-vial mr-1"></i>IGRA (Interferon-Gamma Release Assay)</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">ผล IGRA</label>
                <select value={form.igraResult||''} onChange={e=>sf('igraResult',e.target.value)} className={inp}>
                  <option value="">-- ไม่ได้ตรวจ --</option>
                  <option>Positive</option><option>Negative</option><option>Indeterminate</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">วันที่ตรวจ IGRA</label>
                <input type="date" value={form.igraDate||''} onChange={e=>sf('igraDate',e.target.value)} className={inp}/>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">หมายเหตุ / ค่า IFN-γ</label>
                <input value={form.igraNote||''} onChange={e=>sf('igraNote',e.target.value)} placeholder="เช่น IFN-γ = 1.2 IU/mL" className={inp}/>
              </div>
            </div>
            {form.igraResult==='Positive' && <p className="text-xs text-indigo-700 font-semibold mt-1.5"><i className="fa-solid fa-circle-info mr-1"></i>IGRA Positive → พิจารณา LTBI treatment</p>}
          </div>

          {/* Conflict dialog */}
          {conflictData && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 tb-fade">
              <p className="font-bold text-amber-800 text-sm mb-1"><i className="fa-solid fa-triangle-exclamation mr-2"></i>พบข้อมูลซ้ำ — {conflictData.newEntry.tp} วันที่ {fmtDate(conflictData.newEntry.date)}</p>
              <p className="text-xs text-amber-700 mb-3">มีข้อมูลในวันนี้อยู่แล้ว และมีข้อมูล AFB/Molecular ที่ขัดแย้งกัน — จะใช้ข้อมูลใด?</p>
              <div className="flex gap-2">
                <button type="button" onClick={()=>save(false,true)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold">เก็บข้อมูลเดิม</button>
                <button type="button" onClick={()=>save(true,false)} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold">ใช้ข้อมูลใหม่แทน</button>
                <button type="button" onClick={()=>setConflictData(null)} className="px-3 py-2 text-gray-400 hover:text-gray-600 text-xs">ยกเลิก</button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>{setShowAdd(false);setEditIdx(null);setConflictData(null);}} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">ยกเลิก</button>
            <button type="button" onClick={()=>save()} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold"><i className="fa-solid fa-save mr-1"></i>บันทึก</button>
          </div>
        </div>
      )}

      {/* Dynamic month cards */}
      {allTps.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {allTps.map(tpKey=>{
            const entries = sorted.filter(x=>x.tp===tpKey);
            const pos = entries.some(s=>isAfbPositive(s));
            const isConvTp = conversion.converted && conversion.tp===tpKey;
            const isDelTp = delayed && tpKey==='M2';
            const isRes = entries.some(s=>hasResistance([s]));
            let cardCls = 'min-w-[120px] p-3 rounded-2xl border-2 text-center flex-shrink-0 relative ';
            if (isRes) cardCls += 'bg-red-100 border-red-500';
            else if (isDelTp) cardCls += 'bg-red-50 border-red-400';
            else if (isConvTp) cardCls += 'bg-green-50 border-green-400';
            else if (!pos) cardCls += 'bg-green-50 border-green-300';
            else cardCls += 'bg-amber-50 border-amber-300';
            const tpLabel = tpKey==='M0'?'วินิจฉัย':tpKey;
            return (
              <div key={tpKey} className={cardCls}>
                {isDelTp && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">Delayed</span>}
                {isConvTp && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">Converted</span>}
                <p className="text-xs font-bold text-gray-500 mb-1">{tpLabel}</p>
                {entries.length>0 ? entries.map((s,si)=>(
                  <div key={si} className={si>0?'mt-2 pt-2 border-t border-gray-200':''}>
                    {entries.length>1 && <p className="text-xs text-gray-400 mb-0.5">{(s.specimens&&s.specimens.length>0?s.specimens.map(sp=>sp.type.split(' ')[0]):[s.specimenType||'Sputum']).join('/')}</p>}
                    <p className={`text-sm font-black leading-tight ${isRes?'text-red-700':isAfbPositive(s)?'text-red-600':'text-green-600'}`}>{afbCombined(s)}</p>
                    {s.mtbResult==='Detected' && <p className="text-xs mt-0.5 font-semibold text-red-600">MTB Detected</p>}
                    {s.mtbResult==='Not Detected' && <p className="text-xs mt-0.5 font-semibold text-green-600">MTB Not Detected</p>}
                    {s.rifResult && <p className={`text-xs font-bold ${s.rifResult==='RIF resistant'?'text-red-700':s.rifResult==='RIF susceptible'?'text-green-600':'text-gray-400'}`}>RIF: {s.rifResult==='RIF resistant'?'Resistant':s.rifResult==='RIF susceptible'?'Susceptible':'?'}</p>}
                    {s.inhResult && <p className={`text-xs font-bold ${s.inhResult==='INH resistant'?'text-red-700':s.inhResult==='INH susceptible'?'text-green-600':'text-gray-400'}`}>INH: {s.inhResult==='INH resistant'?'Resistant':s.inhResult==='INH susceptible'?'Susceptible':'?'}</p>}
                  </div>
                )) : <p className="text-gray-300 text-xs mt-1">รอผล</p>}
                {entries.length>0 && <p className="text-xs text-gray-400 mt-1.5">{fmtDate(entries[0].date)}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Column selector */}
      {sorted.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-bold">แสดงคอลัมน์:</span>
          {[['tp','เดือนที่'],['date','วันที่'],['afb','AFB'],['molec','Molecular / Culture'],['rif','RIF'],['inh','INH'],['sld','SLD'],['igra','IGRA']].map(([k,lbl])=>(
            <button key={k} type="button" onClick={()=>toggleCol(k)} className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${cols[k]?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-400 hover:border-teal-300'}`}>{lbl}</button>
          ))}
        </div>
      )}

      {/* Results table */}
      {sorted.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  {cols.tp    && <th className="p-3 pl-4 text-left font-semibold">เดือนที่</th>}
                  {cols.date  && <th className="p-3 text-left font-semibold">วันที่</th>}
                  <th className="p-3 text-left font-semibold text-gray-400">Specimen</th>
                  {cols.afb   && <th className="p-3 text-left font-semibold">AFB</th>}
                  {cols.molec && <th className="p-3 text-left font-semibold">Molecular / Culture</th>}
                  {cols.rif   && <th className="p-3 text-left font-semibold">RIF (Rifampicin)</th>}
                  {cols.inh   && <th className="p-3 text-left font-semibold">INH (Isoniazid)</th>}
                  {cols.sld   && <th className="p-3 text-left font-semibold">SLD</th>}
                  {cols.igra  && <th className="p-3 text-left font-semibold">IGRA</th>}
                  <th className="p-3 text-left font-semibold">Conversion</th>
                  <th className="p-3 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((s,i)=>{
                  const pos = isAfbPositive(s);
                  const isRes = hasResistance([s]);
                  const isConvRow = conversion.converted && conversion.tp===s.tp && !pos;
                  const isDelRow = delayed && s.tp==='M2' && pos;
                  const monthNum = s.tp==='M0'?0:parseInt((s.tp||'').replace('M',''))||0;
                  const showConvCol = monthNum >= 2;
                  const molecShort = s.molecType
                    ? s.molecType.replace('TB-PCR (Conventional PCR)','TB-PCR').replace('GeneXpert MTB/RIF Ultra','GX-Ultra').replace('GeneXpert MTB/RIF','GeneXpert').replace('LPA (FL-LPA — First-Line)','LPA FL').replace('LPA (SL-LPA — Second-Line)','LPA SL')
                    : (s.genexpert?'GeneXpert':'');
                  const sldStr = s.sldResults && Object.values(s.sldResults).some(v=>v&&v!=='Not tested')
                    ? SLD_DRUGS.filter(d=>s.sldResults[d.key]&&s.sldResults[d.key]!=='Not tested').map(d=>d.label+': '+s.sldResults[d.key]).join(', ')
                    : '-';
                  return (
                    <React.Fragment key={i}>
                    <tr className={isRes?'bg-red-50':isDelRow?'bg-red-50/60':isConvRow?'bg-green-50/60':''}>
                      {cols.tp   && <td className="p-3 pl-4 font-mono font-bold">{s.tp==='M0'?'วินิจฉัย':s.tp}</td>}
                      {cols.date && <td className="p-3 text-gray-500">{fmtDate(s.date)}</td>}
                      <td className="p-3 text-gray-400 max-w-[120px]" title={(s.specimens||[]).map(sp=>sp.type).join(', ')||s.specimenType||'Sputum'}>{(s.specimens&&s.specimens.length>0?s.specimens.map(sp=>sp.type.split(' ')[0]):[s.specimenType||'Sputum']).join(', ')}</td>
                      {cols.afb  && <td className={'p-3 font-bold '+(isRes?'text-red-700':pos?'text-red-600':'text-green-600')}>{afbCombined(s)}</td>}
                      {cols.molec && (
                        <td className={'p-3 font-semibold '+(s.mtbResult==='Detected'?'text-red-600':s.mtbResult==='Not Detected'?'text-green-600':'text-gray-400')}>
                          {molecShort && <span className="text-gray-400 mr-1 font-normal text-xs">[{molecShort}]</span>}
                          {s.mtbResult==='Detected'?'MTB Detected':s.mtbResult==='Not Detected'?'MTB Not Detected':s.mtbResult||'-'}
                        </td>
                      )}
                      {cols.rif  && <td className={'p-3 font-semibold '+(s.rifResult==='RIF resistant'?'text-red-700 font-black':s.rifResult==='RIF susceptible'?'text-green-600':'text-gray-400')}>{s.rifResult||'-'}</td>}
                      {cols.inh  && <td className={'p-3 font-semibold '+(s.inhResult==='INH resistant'?'text-red-700 font-black':s.inhResult==='INH susceptible'?'text-green-600':'text-gray-400')}>{s.inhResult||'-'}</td>}
                      {cols.sld  && <td className="p-3 text-gray-500 max-w-xs">{sldStr}</td>}
                      {cols.igra && <td className={'p-3 font-semibold '+(s.igraResult==='Positive'?'text-red-600':s.igraResult==='Negative'?'text-green-600':s.igraResult?'text-amber-600':'text-gray-300')}>{s.igraResult||'-'}{s.igraNote?' ('+s.igraNote+')':''}</td>}
                      <td className="p-3">
                        {showConvCol ? (
                          isDelRow   ? <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">Delayed conversion</span>
                          : isConvRow? <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">Converted ✓</span>
                          : !pos     ? <span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full">Neg ✓</span>
                                     : <span className="bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded-full">Pos</span>
                        ) : <span className="text-gray-300 text-xs">-</span>}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {s.extraLabsPerSpecimen && Object.keys(s.extraLabsPerSpecimen).some(k=>Object.keys(s.extraLabsPerSpecimen[k]||{}).length>0) && (
                          <button type="button" onClick={()=>setExpandedRow(expandedRow===i?null:i)}
                            className={'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all mr-1 '+(expandedRow===i?'bg-indigo-100 text-indigo-700':'bg-indigo-50 text-indigo-500 hover:bg-indigo-100')}>
                            <i className={'fa-solid '+(expandedRow===i?'fa-chevron-up':'fa-chevron-down')+' text-xs'}></i>
                            ผล Lab
                          </button>
                        )}
                        <button type="button" onClick={()=>openEdit(i)} className="text-gray-300 hover:text-teal-500 mr-2 transition-colors"><i className="fa-solid fa-pen text-xs"></i></button>
                        <button type="button" onClick={()=>del(i)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-trash text-xs"></i></button>
                      </td>
                    </tr>
                    {expandedRow===i && s.extraLabsPerSpecimen && Object.entries(s.extraLabsPerSpecimen).map(([specType, labs])=>{
                      const fields = SPECIMEN_LAB_FIELDS[specType]||[];
                      const filled = fields.filter(f=>labs[f.k]!==undefined && labs[f.k]!=='');
                      if (filled.length===0) return null;
                      return (
                        <tr key={'exp-'+specType} className="bg-indigo-50/40">
                          <td colSpan={99} className="px-4 py-2">
                            <p className="text-xs font-bold text-indigo-700 mb-1"><i className="fa-solid fa-flask-vial mr-1"></i>ผล Lab {specType}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                              {filled.map(f=>(
                                <span key={f.k} className="text-xs text-gray-600"><span className="font-semibold text-gray-700">{f.label}:</span> {labs[f.k]}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Glossary */}
      <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-500">
        <p className="font-bold text-gray-700 mb-2"><i className="fa-solid fa-book-open mr-1 text-teal-500"></i>คำย่อและคำอธิบาย (Abbreviations)</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
          <p><strong className="text-gray-700">AFB</strong> = Acid-Fast Bacilli (เชื้อวัณโรคย้อมติดสีกรด)</p>
          <p><strong className="text-gray-700">MTB</strong> = Mycobacterium tuberculosis</p>
          <p><strong className="text-gray-700">TB-PCR</strong> = Conventional PCR สำหรับตรวจ MTB</p>
          <p><strong className="text-gray-700">GeneXpert MTB/RIF</strong> = Cartridge-based real-time PCR</p>
          <p><strong className="text-gray-700">LPA FL</strong> = Line Probe Assay First-Line drugs (H, R)</p>
          <p><strong className="text-gray-700">LPA SL</strong> = Line Probe Assay Second-Line drugs</p>
          <p><strong className="text-gray-700">RIF</strong> = Rifampicin (R) — ยาหลัก TB</p>
          <p><strong className="text-gray-700">INH</strong> = Isoniazid (H) — ยาหลัก TB</p>
          <p><strong className="text-gray-700">SLD</strong> = Second-Line Drugs (ยาสายที่สอง)</p>
          <p><strong className="text-gray-700">FLQS</strong> = Fluoroquinolones: Levofloxacin, Ofloxacin, Moxifloxacin</p>
          <p><strong className="text-gray-700">AG/CP</strong> = Aminoglycoside/Cyclic peptide: Amikacin, Kanamycin, Capreomycin, Viomycin</p>
          <p><strong className="text-gray-700">ETO</strong> = Ethionamide (Prothionamide)</p>
          <p><strong className="text-gray-700">BAL</strong> = Bronchoalveolar Lavage (การล้างหลอดลมเล็กผ่านกล้อง)</p>
          <p><strong className="text-gray-700">CSF</strong> = Cerebrospinal Fluid (น้ำไขสันหลัง)</p>
          <p><strong className="text-gray-700">ADA</strong> = Adenosine Deaminase (ช่วยวินิจฉัย TB นอกปอด)</p>
          <p><strong className="text-gray-700">IGRA</strong> = Interferon-Gamma Release Assay (ตรวจ LTBI)</p>
          <p><strong className="text-gray-700">LTBI</strong> = Latent TB Infection (วัณโรคแฝง)</p>
          <p><strong className="text-gray-700">MDR-TB</strong> = Multi-Drug Resistant TB (ดื้อ H+R)</p>
          <p><strong className="text-gray-700">XDR-TB</strong> = Extensively Drug Resistant TB</p>
          <p><strong className="text-gray-700">Scanty</strong> = พบเชื้อน้อยมาก (&lt;1/ลาน 100×)</p>
          <p><strong className="text-gray-700">1+/2+/3+</strong> = ระดับความหนาแน่นเชื้อ AFB (WHO scale)</p>
        </div>
      </div>

      {sorted.length === 0 && !showAdd && (
        <div className="text-center py-10 text-gray-300">
          <i className="fa-solid fa-microscope text-4xl mb-3 block"></i>
          <p className="text-sm">ยังไม่มีผลการวินิจฉัย — กดเพิ่มผลด้านบน</p>
        </div>
      )}
    </div>
  );
}


function MedsTab({patient,onUpdate,settings,locked}){
  const [editDoses,setEditDoses]=useState(false);
  const [customDoses,setCustomDoses]=useState(patient.customDoses||{});
  const [customStrengths,setCustomStrengths]=useState(patient.drugStrengths||{});
  const [extraTbDrugs,setExtraTbDrugs]=useState(patient.extraTbDrugs||[]);
  const [newExtraKey,setNewExtraKey]=useState('Lfx');
  const [newDrugName,setNewDrugName]=useState('');
  const [newDrugDose,setNewDrugDose]=useState('');
  const [newDrugRoute,setNewDrugRoute]=useState('');
  const drugList=(settings?.drugs)||DEFAULT_DRUGS||[];

  // Dose history from visits
  const doseHistory=(patient.visits||[]).filter(v=>v.drugDoses).map(v=>({date:v.date,doses:v.drugDoses})).sort((a,b)=>b.date.localeCompare(a.date));
  const doses=calcDoses(patient.weight,patient.regimen,editDoses?customDoses:patient.customDoses,editDoses?customStrengths:patient.drugStrengths);

  const saveDoses=()=>{
    onUpdate({...patient,customDoses,drugStrengths:customStrengths,extraTbDrugs});setEditDoses(false);
  };
  const resetDoses=()=>{setCustomDoses({});setCustomStrengths({});setExtraTbDrugs([]);onUpdate({...patient,customDoses:null,drugStrengths:null,extraTbDrugs:[]});setEditDoses(false);};
  const addExtraDrug=()=>{
    const d=DRUG_RANGES[newExtraKey];if(!d)return;
    const str=(HOSP_STRENGTHS[newExtraKey]||[])[0]?.value||d.strength;
    setExtraTbDrugs(prev=>[...prev,{key:newExtraKey,tabs:1,strength:str}]);
  };
  const removeExtraDrug=i=>setExtraTbDrugs(prev=>prev.filter((_,idx)=>idx!==i));

  const addDrug=()=>{
    if(!newDrugName.trim())return;
    const entry=newDrugName+(newDrugDose?' '+newDrugDose:'')+(newDrugRoute?' '+newDrugRoute:'');
    onUpdate({...patient,concomitantDrugs:[...(patient.concomitantDrugs||[]),entry]});
    setNewDrugName('');setNewDrugDose('');setNewDrugRoute('');
  };

  // Drug interactions — only show if patient has comorbidities OR concomitant drugs
  const hasConcomitant = (patient.concomitantDrugs||[]).length > 0;
  const hasComorbidity = (patient.comorbidities||[]).length > 0;
  const c=(patient.comorbidities||[]).join(' ');
  const ix=[];
  if(hasComorbidity || hasConcomitant) {
    if(c.includes('HIV'))   ix.push({s:'high',  drug:'Rifampicin + ARV',         effect:'CYP3A4 induction — ลดระดับ ARV',            rec:'ปรึกษา HIV specialist, พิจารณา Efavirenz'});
    if(c.includes('DM'))    ix.push({s:'medium', drug:'Isoniazid + OHA/Insulin',  effect:'INH รบกวนน้ำตาล + เพิ่มเสี่ยง Neuropathy', rec:'Monitor FBS เสริม B6 50mg/day'});
    if(c.includes('HT'))    ix.push({s:'medium', drug:'Rifampicin + CCB',          effect:'ลดระดับ CCB',                               rec:'Monitor BP อาจต้องเพิ่มขนาด'});
    if(c.includes('CKD'))   ix.push({s:'high',   drug:'Ethambutol + CKD',          effect:'EMB สะสม เสี่ยง Optic Neuritis',           rec:'ปรับขนาดตาม eGFR'});
    if(c.includes('ตับแข็ง')||c.includes('Cirrhosis'))ix.push({s:'high',drug:'INH/RIF + Cirrhosis',effect:'เสี่ยง Hepatotoxicity สูง',rec:'Monitor LFT ทุก 2 สัปดาห์'});
    if(c.includes('RA')||c.includes('รูมาตอยด์'))ix.push({s:'medium',drug:'Rifampicin + Methotrexate/Leflunomide',effect:'Rifampicin เหนี่ยวนำ metabolism ลดระดับยา',rec:'ติดตามความเข้มข้นยา RA'});
    if(c.includes('มะเร็ง')||c.includes('Cancer'))ix.push({s:'high',drug:'Rifampicin + Chemotherapy',effect:'Rifampicin ลดระดับยา chemo หลายตัว',rec:'ปรึกษาอายุรแพทย์มะเร็ง'});
    if(c.includes('ยากดภูมิ')||c.includes('Immunosuppressive'))ix.push({s:'high',drug:'Rifampicin + Immunosuppressants',effect:'ลดระดับ Tacrolimus, Cyclosporine, Steroid',rec:'Monitor drug level ใกล้ชิด'});
    (patient.concomitantDrugs||[]).forEach(d=>{
      if(/warfarin/i.test(d)) ix.push({s:'high',drug:'Rifampicin + Warfarin',effect:'ลด INR อย่างมาก — เสี่ยง thrombosis',rec:'Monitor INR ใกล้ชิด ปรับขนาด Warfarin'});
      if(/phenytoin/i.test(d))ix.push({s:'high',drug:'Rifampicin + Phenytoin',effect:'ลดระดับ Phenytoin — เสี่ยง seizure',rec:'Monitor drug level'});
      if(/fluconazole|itraconazole|voriconazole/i.test(d))ix.push({s:'high',drug:'Rifampicin + Azole antifungal',effect:'ลดระดับ Azole อย่างมาก',rec:'หลีกเลี่ยงการใช้ร่วม หรือเพิ่มขนาด Azole'});
      if(/methadone/i.test(d))ix.push({s:'high',drug:'Rifampicin + Methadone',effect:'ลดระดับ Methadone — เสี่ยง withdrawal',rec:'เพิ่มขนาด Methadone ติดตามอาการ'});
      if(/oral contraceptive|ยาเม็ดคุมกำเนิด/i.test(d))ix.push({s:'medium',drug:'Rifampicin + OCP',effect:'ลดประสิทธิภาพยาคุมกำเนิด',rec:'ใช้การคุมกำเนิดวิธีอื่นร่วมด้วย'});
    });
    // Custom interactions from settings
    (settings?.customDrugInteractions||[]).forEach(ci=>{
      const matchComorbidity = ci.triggerComorbidity && c.toLowerCase().includes(ci.triggerComorbidity.toLowerCase());
      const matchDrug = ci.triggerDrug && (patient.concomitantDrugs||[]).some(d=>d.toLowerCase().includes(ci.triggerDrug.toLowerCase()));
      if (matchComorbidity || matchDrug || (!ci.triggerComorbidity && !ci.triggerDrug)) {
        ix.push({s:ci.severity||'medium', drug:ci.drug, effect:ci.effect, rec:ci.rec});
      }
    });
  }

  return(
    <div className="space-y-5 tb-fade">
      {/* Interaction alert */}
      {(!hasComorbidity && !hasConcomitant) ? (
        <div className="bg-slate-50 border border-gray-200 p-3 rounded-2xl text-xs text-gray-400 flex items-center gap-2">
          <i className="fa-solid fa-circle-info text-gray-300"></i>
          <span>ยังไม่มีรายการยาโรคร่วม — เพิ่มยาโรคร่วมด้านล่างเพื่อตรวจสอบ Drug Interaction</span>
        </div>
      ) : ix.length>0?(
        <div className={'p-4 rounded-2xl border-2 '+(ix.some(i=>i.s==='high')?'border-red-300 bg-red-50':'border-amber-300 bg-amber-50')}>
          <p className={'font-bold text-sm mb-2 '+(ix.some(i=>i.s==='high')?'text-red-800':'text-amber-800')}><i className="fa-solid fa-triangle-exclamation mr-2"></i>Drug Interaction ({ix.length})</p>
          <div className="space-y-2">{ix.map((item,i)=>(
            <div key={i} className={'p-3 rounded-xl border '+(item.s==='high'?'bg-red-50 border-red-200':'bg-amber-50 border-amber-200')}>
              <p className={'font-bold text-xs mb-0.5 '+(item.s==='high'?'text-red-700':'text-amber-700')}>{item.drug}</p>
              <p className="text-xs text-gray-600">{item.effect}</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">💊 {item.rec}</p>
            </div>
          ))}</div>
        </div>
      ) : <div className="bg-green-50 border border-green-200 p-3 rounded-2xl text-xs text-green-700 font-semibold"><i className="fa-solid fa-check-circle mr-2"></i>ไม่พบ Drug Interaction ที่มีนัยสำคัญ</div>}

      {/* TB Drug table + inline edit */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-prescription-bottle-medical mr-2 text-teal-600"></i>ยา TB ปัจจุบัน</h3>
          <div className="flex items-center gap-2">
            <span className="bg-gray-100 px-3 py-1 text-xs font-mono rounded">{patient.regimen}</span>
            {editDoses?(
              <div className="flex gap-1.5">
                <button type="button" onClick={resetDoses} className="text-xs px-2.5 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">รีเซ็ต</button>
                <button type="button" onClick={saveDoses} className="text-xs px-2.5 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold">บันทึก</button>
              </div>
            ):(
              <button type="button" onClick={()=>{if(!locked){setCustomDoses(patient.customDoses||{});setEditDoses(true);}}} disabled={locked} className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold ${locked?'border border-gray-200 text-gray-300 cursor-not-allowed':'border border-gray-200 text-teal-600 hover:bg-teal-50'}`}><i className="fa-solid fa-pen mr-1"></i>แก้ไขโดส</button>
            )}
          </div>
        </div>
        <div className="bg-slate-50 border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-gray-100/60 border-b text-xs text-gray-500 uppercase"><tr><th className="p-3 pl-4 text-left">ยา</th><th className="p-3 text-left">mg/kg</th><th className="p-3 text-left">จำนวน</th><th className="p-3 text-left">/เดือน</th><th className="p-3 text-left">สถานะ</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{doses.map(d=>{
            const mgkgCls='p-3 font-bold '+(d.status==='ok'?'text-green-700':d.status==='high'?'text-red-600':'text-amber-600');
            const badge=d.status==='ok'?<Badge label="เหมาะสม" color="bg-green-100 text-green-700"/>:d.status==='high'?<Badge label="สูง" color="bg-red-100 text-red-700"/>:<Badge label="ต่ำ" color="bg-amber-100 text-amber-700"/>;
            const opts=(HOSP_STRENGTHS[d.key]||[]);
            return<tr key={d.key}>
              <td className="p-3 pl-4 font-bold">
                {d.name}
                {editDoses&&opts.length>1?(
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {opts.map(o=><button key={String(o.value)} type="button" onClick={()=>setCustomStrengths(s=>({...s,[d.key]:o.value}))} className={'text-xs px-2 py-0.5 rounded-lg border font-bold transition-all '+((customStrengths[d.key]??d.strength)===o.value?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-400 hover:border-teal-300')}>{o.label}</button>)}
                  </div>
                ):<span className="text-gray-400 font-normal text-xs ml-1">({d.strength}mg)</span>}
              </td>
              <td className={mgkgCls}>{d.mgkg}</td>
              <td className="p-3">
                {editDoses?(
                  <div className="flex items-center gap-1">
                    <input type="number" min={0.5} max={12} step={0.5} value={customDoses[d.key]??d.tabs}
                      onChange={e=>setCustomDoses(c=>({...c,[d.key]:Math.max(0.5,parseFloat(e.target.value)||0.5)}))}
                      className="w-14 p-1 border-2 border-teal-300 rounded-lg text-center font-bold text-sm outline-none"/>
                    <span className="text-xs text-gray-400">tab</span>
                  </div>
                ):<span className="font-semibold">{d.tabs} tab OD ac</span>}
              </td>
              <td className="p-3 font-mono font-bold text-teal-700">{(d.tabs*30).toFixed(d.tabs%1?1:0)} tab</td>
              <td className="p-3">{badge}</td>
            </tr>;
          })}</tbody></table>
        </div>
        {patient.status==='critical'&&<div className="mt-2 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-2xl"><p className="font-bold text-red-700 text-sm"><i className="fa-solid fa-hand mr-2"></i>HOLD ยาทุกตัว — ALT &gt; 3× ULN</p></div>}

        {/* Extra TB drugs (Lfx, Am etc.) */}
        {(extraTbDrugs.length>0||editDoses)&&(
          <div className="mt-3">
            {extraTbDrugs.length>0&&(
              <table className="w-full text-sm mt-2 border border-dashed border-teal-200 rounded-xl overflow-hidden">
                <thead className="bg-teal-50 text-xs text-teal-600 uppercase"><tr><th className="p-2 pl-3 text-left">ยาเสริม</th><th className="p-2 text-left">ความแรง</th><th className="p-2 text-left">จำนวน</th><th className="p-2 text-left">/เดือน</th><th className="p-2"></th></tr></thead>
                <tbody className="divide-y divide-teal-100">{extraTbDrugs.map((ex,i)=>{
                  const d=DRUG_RANGES[ex.key]||{};
                  const w=parseFloat(patient.weight);
                  const mgkg=w>0?+((ex.tabs*ex.strength)/w).toFixed(1):'-';
                  const unit=d.unit||'tab';
                  return<tr key={i}>
                    <td className="p-2 pl-3 font-bold text-teal-700">{d.name||ex.key}</td>
                    <td className="p-2">
                      {editDoses?(
                        <div className="flex gap-1 flex-wrap">
                          {(HOSP_STRENGTHS[ex.key]||[]).map(o=><button key={String(o.value)} type="button" onClick={()=>setExtraTbDrugs(prev=>prev.map((e,j)=>j===i?{...e,strength:o.value}:e))} className={'text-xs px-2 py-0.5 rounded border font-bold '+(ex.strength===o.value?'bg-teal-600 text-white border-teal-600':'border-gray-200 text-gray-400')}>{o.label}</button>)}
                        </div>
                      ):<span className="text-xs text-gray-500">{ex.strength}mg</span>}
                    </td>
                    <td className="p-2">
                      {editDoses?(
                        <div className="flex items-center gap-1">
                          <input type="number" min={0.5} max={12} step={0.5} value={ex.tabs}
                            onChange={e=>setExtraTbDrugs(prev=>prev.map((x,j)=>j===i?{...x,tabs:Math.max(0.5,parseFloat(e.target.value)||0.5)}:x))}
                            className="w-14 p-1 border-2 border-teal-300 rounded-lg text-center font-bold text-sm outline-none"/>
                          <span className="text-xs text-gray-400">{unit}</span>
                        </div>
                      ):<span className="font-semibold text-sm">{ex.tabs} {unit} · {mgkg} mg/kg</span>}
                    </td>
                    <td className="p-2 text-xs text-teal-700 font-mono font-bold">{(ex.tabs*30).toFixed(ex.tabs%1?1:0)} {unit}</td>
                    <td className="p-2 text-right">{editDoses&&<button type="button" onClick={()=>removeExtraDrug(i)} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-xmark text-xs"></i></button>}</td>
                  </tr>;
                })}</tbody>
              </table>
            )}
            {editDoses&&(
              <div className="flex items-center gap-2 mt-2">
                <select value={newExtraKey} onChange={e=>setNewExtraKey(e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
                  {['Lfx','Am'].map(k=><option key={k} value={k}>{DRUG_RANGES[k]?.name||k}</option>)}
                </select>
                <button type="button" onClick={()=>{if(!locked)addExtraDrug();}} disabled={locked} className={`px-3 py-2 rounded-lg text-sm font-bold ${locked?'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-teal-600 hover:bg-teal-700 text-white'}`}><i className="fa-solid fa-plus mr-1"></i>เพิ่มยาเสริม</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dose history mini-timeline */}
      {doseHistory.length>0&&(
        <div>
          <h4 className="font-bold text-gray-700 text-sm mb-3"><i className="fa-solid fa-clock-rotate-left mr-2 text-gray-400"></i>ประวัติขนาดยาจาก Visit</h4>
          <div className="relative space-y-2">
            <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-200 pointer-events-none"></div>
            {doseHistory.map((h,i)=>(
              <div key={i} className="flex gap-3 items-start">
                <div className={'w-5 h-5 rounded-full flex-shrink-0 z-10 mt-0.5 flex items-center justify-center '+(i===0?'bg-teal-500':'bg-gray-300')}>
                  <i className={'fa-solid fa-pills text-white '} style={{fontSize:'7px'}}></i>
                </div>
                <div className={'flex-1 px-3 py-2 rounded-xl border text-xs '+(i===0?'bg-teal-50 border-teal-200 font-semibold':'bg-gray-50 border-gray-200')}>
                  <span className="text-gray-400 font-mono mr-2">{h.date}</span>
                  <span className={'font-mono '+(i===0?'text-teal-800':'text-gray-600')}>{h.doses}</span>
                  {i===0&&<span className="ml-2 bg-teal-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">ล่าสุด</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concomitant drugs */}
      <div>
        <h4 className="font-bold text-gray-700 text-sm mb-3"><i className="fa-solid fa-capsules mr-2 text-gray-400"></i>ยาโรคร่วม</h4>
        <div className="flex flex-wrap gap-2 mb-3 min-h-8">
          {(patient.concomitantDrugs||[]).length===0?<p className="text-xs text-gray-400 py-1">ยังไม่มีรายการ</p>:
          (patient.concomitantDrugs||[]).map((d,i)=>(
            <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
              {d}<button type="button" onClick={()=>onUpdate({...patient,concomitantDrugs:(patient.concomitantDrugs||[]).filter((_,j)=>j!==i)})} className="text-blue-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark"></i></button>
            </span>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <div className="grid grid-cols-[1fr_80px_90px_36px] gap-2 items-end">
            <div><label className="text-xs font-bold text-gray-600 block mb-1">ชื่อยา</label>
              <select value={newDrugName} onChange={e=>setNewDrugName(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-blue-300">
                <option value="">-- เลือกยา --</option>
                {drugList.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">ขนาด</label><input value={newDrugDose} onChange={e=>setNewDrugDose(e.target.value)} placeholder="500mg" className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"/></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">วิธีใช้</label>
              <select value={newDrugRoute} onChange={e=>setNewDrugRoute(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white outline-none">
                <option value="">-</option><option>OD</option><option>BID</option><option>TID</option><option>QID</option><option>PRN</option><option>IM</option><option>SC</option><option>IV</option>
              </select>
            </div>
            <div className="flex items-end"><button type="button" onClick={addDrug} className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center transition-colors"><i className="fa-solid fa-plus text-sm"></i></button></div>
          </div>
        </div>
      </div>
    </div>
  );
}


function InfoBar({patient,onUpdate}){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState({weight:patient.weight,nextAppt:patient.nextAppt||'',hivStatus:patient.hivStatus||'',hivNote:patient.hivNote||''});
  const save=()=>{onUpdate({...patient,weight:+draft.weight||patient.weight,nextAppt:draft.nextAppt,hivStatus:draft.hivStatus||null,hivNote:draft.hivNote});setEditing(false);};
  return(
    <div className="bg-slate-50 border-b border-gray-200 px-6 py-2.5 flex-shrink-0">
      <div className="flex flex-wrap gap-x-5 gap-y-1 items-center text-sm">
        <span className="text-gray-500 text-xs">HN: <strong className="text-gray-800 font-mono">{patient.hn}</strong></span>
        {patient.age&&<span className="text-gray-500 text-xs">{patient.age} ปี · {patient.gender==='M'?'ชาย':'หญิง'}</span>}
        {patient.subdistrict&&<span className="text-gray-500 text-xs">ต.<strong>{patient.subdistrict}</strong></span>}
        {patient.patientType&&<Badge label={patient.patientType} color="bg-blue-100 text-blue-700"/>}
        {patient.diseaseLocation&&<Badge label={patient.diseaseLocation+(patient.extraPulmonaryType?' — '+patient.extraPulmonaryType:'')} color="bg-indigo-100 text-indigo-700"/>}
        {!editing?(<>
          <span className="text-gray-500 text-xs">น้ำหนัก: <strong className="text-teal-700">{patient.weight} kg</strong></span>
          {patient.nextAppt&&<span className="text-gray-500 text-xs">นัด: <strong>{patient.nextAppt}</strong></span>}
          {patient.hivStatus&&<Badge label={'HIV: '+patient.hivStatus} color={patient.hivStatus==='Positive'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}/>}
          <button type="button" onClick={()=>setEditing(true)} className="ml-auto text-teal-500 hover:text-teal-700 text-xs font-bold flex items-center gap-1"><i className="fa-solid fa-pen"></i>แก้ไข</button>
        </>):(<div className="flex items-center gap-3 flex-wrap ml-auto">
          <div className="flex items-center gap-1 text-xs"><label className="text-gray-500 font-bold">น้ำหนัก</label><input type="number" value={draft.weight} onChange={e=>setDraft(d=>({...d,weight:e.target.value}))} className="w-14 p-1 border border-teal-300 rounded-lg text-center font-bold outline-none bg-white text-xs"/><span className="text-gray-400">kg</span></div>
          <div className="flex items-center gap-1 text-xs"><label className="text-gray-500 font-bold">วันนัด</label><input value={draft.nextAppt} onChange={e=>setDraft(d=>({...d,nextAppt:e.target.value}))} className="p-1 border border-gray-200 rounded-lg outline-none bg-white text-xs w-28"/></div>
          <div className="flex items-center gap-1 text-xs"><label className="text-gray-500 font-bold">HIV</label>
            <select value={draft.hivStatus} onChange={e=>setDraft(d=>({...d,hivStatus:e.target.value}))} className="p-1 border border-gray-200 rounded-lg outline-none bg-white text-xs"><option value="">-</option><option value="Positive">Positive</option><option value="Negative">Negative</option></select>
            {draft.hivStatus==='Positive'&&<input value={draft.hivNote} onChange={e=>setDraft(d=>({...d,hivNote:e.target.value}))} placeholder="CD4..." className="p-1 border border-red-200 rounded-lg outline-none bg-white text-xs w-24"/>}
          </div>
          <div className="flex gap-2"><button type="button" onClick={()=>setEditing(false)} className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-200 rounded-lg">ยกเลิก</button><button type="button" onClick={save} className="px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold">บันทึก</button></div>
        </div>)}
      </div>
    </div>
  );
}

function ClinicalModal({patient,onClose,onUpdate,settings,onArchive,currentUser,onSoftDelete,onRequestDelete,onCancelDeleteRequest,pendingDeleteRequests}){
  const [tab,setTab]=useState('timeline');
  // ClinicalModal: เปิดมี animation แต่ปิดทันที (full-screen — ปิดช้ารู้สึกหน่วง)
  const modalCls = 'modal-A';
  const close = onClose;
  const hasPendingRequest=(pendingDeleteRequests||[]).some(r=>r.patient_id===patient.id);
  const safeUpdate=hasPendingRequest?()=>{}:onUpdate;
  const tabs=[
    {id:'timeline',icon:'fa-timeline',label:'Timeline'},
    {id:'meds',icon:'fa-pills',label:'ยา & Interaction'},
    {id:'regimen-history',icon:'fa-clock-rotate-left',label:'ประวัติสูตร'},
    {id:'labs',icon:'fa-flask',label:'Lab'},
    {id:'sputum',icon:'fa-microscope',label:'Diagnosis'},
    {id:'dot',icon:'fa-calendar-check',label:'DOT'},
    {id:'adr',icon:'fa-heart-pulse',label:'ADR'},
    {id:'summary',icon:'fa-chart-bar',label:'สรุปเภสัช'},
  ];
  const safeAdr=migrateAdr(patient.adr);
  const hasAdr=ADR_LIST.some(a=>safeAdr[a.key]?.checked);
  const last=patient.labs[patient.labs.length-1]||{};
  const crcl=calcCrCl(patient.age,patient.weight,last.scr,patient.gender);
  const isRes = hasResistance(patient.sputum||[]) || patient.hasResistance;
  const isCritical = patient.status==='critical' || isRes;
  return(
    <div className={`bg-white w-full h-full flex flex-col overflow-hidden ${modalCls} ${isRes?'ring-4 ring-red-500 ring-inset':''}`}>
        {/* ── 2-column compact header ── */}
        <div className={`flex items-center gap-4 px-5 border-b flex-shrink-0 ${isRes?'bg-red-50 border-red-200':'bg-white border-gray-100'}`} style={{minHeight:'80px',padding:'10px 20px'}}>

          {/* คอลัมน์ซ้าย — fit-content ไม่ stretch */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm text-white font-black flex-shrink-0 ${isCritical?'bg-red-500':'bg-teal-500'}`}>{(patient.firstName||patient.name).substring(0,2)}</div>
            <div className="flex flex-col gap-1 min-w-0">
              {/* แถว 1: ชื่อ + status badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-gray-900 text-sm leading-tight">{patient.name}</span>
                {isCritical&&<span className="animate-pulse bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold"><i className="fa-solid fa-triangle-exclamation mr-1"></i>Critical</span>}
                {isRes&&<span className="animate-pulse bg-red-700 text-white text-xs px-2 py-0.5 rounded-full font-bold"><i className="fa-solid fa-biohazard mr-1"></i>Resistant</span>}
                {hasAdr&&<span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">ADR {ADR_LIST.filter(a=>safeAdr[a.key]?.checked).length} รายการ</span>}
              </div>
              {/* แถว 2: HN · อายุ/เพศ · ตำบล · โรคประจำตัว */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400 font-mono">HN: <strong className="text-gray-600">{patient.hn}</strong></span>
                {patient.age&&<span className="text-xs text-gray-400">{patient.age} ปี · {patient.gender==='M'?'ชาย':'หญิง'}</span>}
                {patient.subdistrict&&<span className="text-xs text-gray-400">ต.<strong className="text-gray-600">{patient.subdistrict}</strong></span>}
                {(patient.comorbidities||[]).map(c=><span key={c} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">{c}</span>)}
              </div>
            </div>
          </div>

          {/* divider */}
          <div className="w-px bg-gray-100 flex-shrink-0" style={{alignSelf:'stretch',margin:'8px 0'}}></div>

          {/* คอลัมน์ขวา */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            {/* แถว 1: clinical */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{patient.regimen}</span>
              <span className="text-xs text-teal-600 font-semibold">{patient.phase} · M{patient.month} · Day {patient.day}</span>
              <span className="text-xs text-gray-500">Adherence: <strong className={patient.adherence>=90?'text-green-600':'text-amber-500'}>{patient.adherence}%</strong></span>
              {crcl&&<span className={'text-xs font-semibold '+crClStage(crcl).color}>CrCl: {crcl}</span>}
            </div>
            {/* แถว 2: demographic */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">น้ำหนัก: <strong className="text-teal-700">{patient.weight} kg</strong></span>
              {patient.nextAppt&&<span className="text-xs text-gray-400">นัด: <strong className="text-gray-600">{patient.nextAppt}</strong></span>}
              {patient.hivStatus&&<span className={`text-xs px-2 py-0.5 rounded-full font-bold ${patient.hivStatus==='Positive'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>HIV: {patient.hivStatus}</span>}
              {patient.patientType&&<span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">{patient.patientType}</span>}
              {patient.diseaseLocation&&<span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-bold">{patient.diseaseLocation}</span>}
            </div>
          </div>

          {/* ปุ่ม Archive — แสดงเมื่อมี outcome และยังไม่ archive */}
          {patient.outcome?.type && !patient.archived && onArchive && (
            <button type="button" onClick={()=>onArchive(patient)}
              className="tb-wiggle ml-auto flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-900 rounded-xl text-sm font-bold transition-colors flex-shrink-0 shadow-sm">
              <i className="fa-solid fa-flag-checkered"></i>ส่งเข้าทะเบียนจบ
            </button>
          )}
          {/* ปุ่มกลับ — เด่น สี teal */}
          <button type="button" onClick={close} className={`${patient.outcome?.type && !patient.archived && onArchive ? '' : 'ml-auto '}flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-colors flex-shrink-0 shadow-sm`}>
            <i className="fa-solid fa-arrow-left"></i>กลับ
          </button>
        </div>
        <div className="flex border-b border-gray-200 bg-white flex-shrink-0 overflow-x-auto">
          {tabs.map(t=><button key={t.id} type="button" onClick={()=>setTab(t.id)} className={'flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap '+(tab===t.id?'border-teal-600 text-teal-700 bg-teal-50/50':'border-transparent text-gray-500 hover:text-teal-600 hover:bg-gray-50')}><i className={'fa-solid '+t.icon}></i>{t.label}</button>)}
        </div>
        {hasPendingRequest&&<div style={{background:'#fef3c7',borderBottom:'1px solid #fcd34d',padding:'8px 20px',display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}><i className="fa-solid fa-clock" style={{color:'#d97706',fontSize:'12px'}}></i><span style={{fontSize:'12px',color:'#92400e',fontWeight:600}}>ผู้ป่วยรายนี้มีคำขอลบรออนุมัติ — ไม่สามารถบันทึกข้อมูลเพิ่มเติมได้จนกว่า Admin จะตัดสินใจ</span></div>}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {tab==='timeline'&&<TimelineTab patient={patient} onUpdate={safeUpdate} settings={settings} locked={hasPendingRequest}/>}
          {tab==='meds'&&<MedsTab patient={patient} onUpdate={safeUpdate} settings={settings} locked={hasPendingRequest}/>}
          {tab==='regimen-history'&&<RegimenHistoryTab patient={patient} onUpdate={safeUpdate} settings={settings} locked={hasPendingRequest}/>}
          {tab==='labs'&&<LabTab patient={patient} onUpdate={safeUpdate} settings={settings} locked={hasPendingRequest}/>}
          {tab==='sputum'&&<DiagnosisTab patient={patient} onUpdate={safeUpdate} locked={hasPendingRequest}/>}
          {tab==='dot'&&<div className="max-w-lg"><DOTCalendar patient={patient} onUpdate={safeUpdate} locked={hasPendingRequest}/></div>}
          {tab==='adr'&&<ADRTab patient={patient} onUpdate={safeUpdate} locked={hasPendingRequest}/>}

          {tab==='summary'&&<PharmSummaryTab patient={patient} currentUser={currentUser} onSoftDelete={onSoftDelete} onRequestDelete={onRequestDelete} onCancelDeleteRequest={onCancelDeleteRequest} pendingDeleteRequests={pendingDeleteRequests}/>}
        </div>
    </div>
  );
}

function AddPatientPage({onBack,onAdd,settings,onDirtyChange}){
  const comorbList=settings?.comorbidities||DEFAULT_COMORBIDITIES;
  const [form,setForm]=useState({hn:'',prefix:'นาย',firstName:'',lastName:'',age:'',gender:'M',patientType:'New',diseaseLocation:'Pulmonary',extraPulmonaryType:'',weight:'',regimen:'2HRZE/4HR',customRegimen:'',subdistrict:'พิมาย',comorbidities:[],concomitantDrugs:[],startDate:new Date().toISOString().split('T')[0]});
  const [manualMode,setManualMode]=useState(false);
  const [manualDoses,setManualDoses]=useState({});
  const [drugStrengths,setDrugStrengths]=useState({R:300,H:100,Z:500,E:400});
  const [errors,setErrors]=useState({});
  const [drugInput,setDrugInput]=useState('');
  const [showLeaveConfirm,setShowLeaveConfirm]=useState(false);
  const [isDirty,setIsDirty]=useState(false);
  const markDirty=()=>{ setIsDirty(true); onDirtyChange&&onDirtyChange(true); };
  const set=(k,v)=>{setForm(f=>({...f,[k]:v}));markDirty();};
  const handleBack=()=>{ if(isDirty) setShowLeaveConfirm(true); else onBack(); };
  const setPrefix=p=>{const gMap={นาย:'M',เด็กชาย:'M',นาง:'F',นางสาว:'F',เด็กหญิง:'F'};setForm(f=>({...f,prefix:p,gender:gMap[p]||f.gender}));markDirty();};
  const toggleCo=c=>{setForm(f=>({...f,comorbidities:f.comorbidities.includes(c)?f.comorbidities.filter(x=>x!==c):[...f.comorbidities,c]}));markDirty();};
  const addDrug=()=>{if(drugInput.trim()){setForm(f=>({...f,concomitantDrugs:[...f.concomitantDrugs,drugInput.trim()]}));setDrugInput('');markDirty();}};
  const removeDrug=i=>{setForm(f=>({...f,concomitantDrugs:f.concomitantDrugs.filter((_,idx)=>idx!==i)}));markDirty();};
  const finalReg=form.regimen==='อื่นๆ'?form.customRegimen:form.regimen;
  const validate=()=>{const e={};if(!form.hn.trim())e.hn='กรุณากรอก HN';if(!form.firstName.trim())e.firstName='กรุณากรอกชื่อ';if(!form.lastName.trim())e.lastName='กรุณากรอกนามสกุล';if(!form.weight||+form.weight<10)e.weight='น้ำหนักไม่ถูกต้อง';return e;};
  const submit=()=>{const e=validate();if(Object.keys(e).length){setErrors(e);return;}onAdd({id:'P'+Date.now(),hn:form.hn,prefix:form.prefix,firstName:form.firstName,lastName:form.lastName,name:form.prefix+' '+form.firstName+' '+form.lastName,age:+form.age,gender:form.gender,patientType:form.patientType,diseaseLocation:form.diseaseLocation,extraPulmonaryType:form.extraPulmonaryType,subdistrict:form.subdistrict,weight:+form.weight,regimen:finalReg,regimenHistory:[{regimen:finalReg,startDate:form.startDate,reason:'เริ่มรักษาครั้งแรก',isCurrent:true}],phase:'Intensive',month:0,day:1,status:'normal',adherence:100,comorbidities:form.comorbidities,concomitantDrugs:form.concomitantDrugs,hivStatus:null,hivNote:'',nextAppt:'นัดครั้งแรก',daysUntil:30,startDate:form.startDate,labs:[],sputum:[],adr:{},visits:[],dot:{},customDoses:manualMode?manualDoses:null,drugStrengths,extraTbDrugs:[]});onBack();};
  return(
    <div className="flex flex-col h-full tb-fade">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleBack} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-colors"><i className="fa-solid fa-arrow-left text-sm"></i></button>
          <div>
            <h2 className="text-lg font-bold text-gray-800"><i className="fa-solid fa-user-plus mr-2 text-teal-600"></i>ลงทะเบียนผู้ป่วยวัณโรครายใหม่</h2>
            <p className="text-xs text-gray-400">กรอกข้อมูลให้ครบถ้วนก่อนบันทึก</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleBack} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">ยกเลิก</button>
          <button type="button" onClick={submit} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md transition-all"><i className="fa-solid fa-save mr-2"></i>บันทึกและสร้างเคส</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-5">
            <FormSection icon="fa-user" title="ข้อมูลผู้ป่วย">
              <div className="space-y-3">
                <div className="grid grid-cols-[96px_1fr_1fr] gap-3">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">คำนำหน้า</label><select value={form.prefix} onChange={e=>setPrefix(e.target.value)} className={`${INP} border-gray-200 font-semibold`}>{PREFIXES.map(p=><option key={p}>{p}</option>)}</select></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">ชื่อ <span className="text-red-500">*</span></label><input value={form.firstName} onChange={e=>set('firstName',e.target.value)} className={INP+' '+(errors.firstName?'border-red-400':'border-gray-200')}/><FieldError msg={errors.firstName}/></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">นามสกุล <span className="text-red-500">*</span></label><input value={form.lastName} onChange={e=>set('lastName',e.target.value)} className={INP+' '+(errors.lastName?'border-red-400':'border-gray-200')}/><FieldError msg={errors.lastName}/></div>
                </div>
                <div className="grid grid-cols-[1fr_90px_auto] gap-3 items-end">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">HN <span className="text-red-500">*</span></label><input value={form.hn} onChange={e=>set('hn',e.target.value)} placeholder="12345/67" className={INP+' font-mono '+(errors.hn?'border-red-400':'border-gray-200')}/><FieldError msg={errors.hn}/></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">อายุ (ปี)</label><input type="number" min={0} max={120} value={form.age} onChange={e=>set('age',e.target.value)} className={`${INP} border-gray-200 text-center`}/></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">เพศ</label><div className="flex gap-1.5">{[['M','fa-person','ชาย'],['F','fa-person-dress','หญิง']].map(([v,ic,lbl])=><label key={v} className={'flex items-center gap-1.5 cursor-pointer px-3 py-2.5 rounded-xl border-2 transition-all font-semibold text-sm whitespace-nowrap '+(form.gender===v?'bg-teal-50 border-teal-400 text-teal-700':'border-gray-200 text-gray-500')}><input type="radio" className="hidden" checked={form.gender===v} onChange={()=>set('gender',v)}/><i className={`fa-solid ${ic}`}></i>{lbl}</label>)}</div></div>
                </div>
              </div>
            </FormSection>
            <hr className="border-gray-100"/>
            <FormSection icon="fa-hospital" title="ข้อมูลทางคลินิก">
              <div className="space-y-3">
                <div><label className="block text-xs font-bold text-gray-600 mb-2">ประเภทผู้ป่วย</label><div className="grid grid-cols-3 gap-2">{PATIENT_TYPES.map(t=><button key={t} type="button" onClick={()=>set('patientType',t)} className={'py-2 rounded-xl border-2 text-xs font-bold transition-all '+(form.patientType===t?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-600 hover:border-teal-300')}>{t}</button>)}</div></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-2">ตำแหน่งโรค</label><div className="grid grid-cols-3 gap-2">{DISEASE_LOCATIONS.map(l=><button key={l} type="button" onClick={()=>set('diseaseLocation',l)} className={'py-2.5 rounded-xl border-2 text-sm font-semibold transition-all '+(form.diseaseLocation===l?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-600 hover:border-teal-300')}>{l}</button>)}</div></div>
                {form.diseaseLocation==='Extra-pulmonary'&&<div className="tb-fade"><label className="block text-xs font-bold text-gray-600 mb-1">ระบุตำแหน่ง</label><select value={form.extraPulmonaryType} onChange={e=>set('extraPulmonaryType',e.target.value)} className={`${INP} border-teal-300 bg-teal-50`}><option value="">-- เลือก --</option>{EXTRA_PULMONARY_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>}
                <div><label className="block text-xs font-bold text-gray-600 mb-1">ตำบล</label><select value={form.subdistrict} onChange={e=>set('subdistrict',e.target.value)} className={`${INP} border-gray-200`}>{TAMBONS.map(t=><option key={t} value={t}>ต.{t}</option>)}</select></div>
              </div>
            </FormSection>
            <hr className="border-gray-100"/>
            <FormSection icon="fa-capsules" title="ยาร่วมรักษา (Concomitant Drugs)">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={drugInput} onChange={e=>setDrugInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addDrug())} placeholder="พิมพ์ชื่อยา แล้วกด Enter หรือ +" className={`${INP} border-gray-200 flex-1`}/>
                  <button type="button" onClick={addDrug} className="px-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors"><i className="fa-solid fa-plus"></i></button>
                </div>
                {form.concomitantDrugs.length>0&&<div className="flex flex-wrap gap-2 pt-1">{form.concomitantDrugs.map((d,i)=><span key={i} className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold px-3 py-1.5 rounded-full">{d}<button type="button" onClick={()=>removeDrug(i)} className="text-teal-400 hover:text-red-500 transition-colors ml-0.5"><i className="fa-solid fa-xmark"></i></button></span>)}</div>}
              </div>
            </FormSection>
          </div>
          <div className="space-y-5">
            <FormSection icon="fa-pills" title="น้ำหนักและสูตรยา">
              <div className="space-y-4">
                <div className="grid grid-cols-[110px_1fr_1fr] gap-3 items-end">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">น้ำหนัก (kg) <span className="text-red-500">*</span></label><input type="number" value={form.weight} onChange={e=>set('weight',e.target.value)} className={'w-full p-2.5 border rounded-xl bg-white text-center font-bold text-xl outline-none focus:ring-2 focus:ring-teal-400 '+(errors.weight?'border-red-400':'border-gray-200')}/><FieldError msg={errors.weight}/></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">สูตรยาเริ่มต้น</label><select value={form.regimen} onChange={e=>set('regimen',e.target.value)} className={`${INP} border-gray-200 font-mono text-teal-800 font-bold`}>{(settings?.regimens||REGIMENS).map(r=><option key={r}>{r}</option>)}<option value="อื่นๆ">อื่นๆ</option></select>{form.regimen==='อื่นๆ'&&<input value={form.customRegimen} onChange={e=>set('customRegimen',e.target.value)} placeholder="กรอกสูตรยา" className="w-full mt-2 p-2.5 border-2 border-teal-300 rounded-xl bg-teal-50 outline-none font-mono text-sm"/>}</div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">วันที่เริ่มรักษา</label><input type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} className={`${INP} border-gray-200`}/></div>
                </div>
                <DoseCalculator weight={form.weight} regimen={finalReg} manualMode={manualMode} manualDoses={manualDoses} onToggle={()=>setManualMode(m=>!m)} onManualChange={(k,v)=>setManualDoses(d=>({...d,[k]:v}))} strengths={drugStrengths} onStrChange={(k,v)=>setDrugStrengths(s=>({...s,[k]:v}))}/>
              </div>
            </FormSection>
            <hr className="border-gray-100"/>
            <FormSection icon="fa-heart-pulse" title="โรคประจำตัว">
              <div className="grid grid-cols-2 gap-2">{comorbList.map(c=><button key={c.abbr} type="button" onClick={()=>toggleCo(c.abbr)} className={'flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-xs text-left '+(form.comorbidities.includes(c.abbr)?'bg-teal-50 border-teal-400 text-teal-800 font-semibold':'border-gray-200 text-gray-600 hover:border-teal-200')}><div className={'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 '+(form.comorbidities.includes(c.abbr)?'bg-teal-500':'border-2 border-gray-300')}>{form.comorbidities.includes(c.abbr)&&<i className="fa-solid fa-check text-white" style={{fontSize:'8px'}}></i>}</div><span className="truncate">{c.name} <span className="opacity-50 font-normal">({c.abbr})</span></span></button>)}</div>
            </FormSection>
          </div>
        </div>
      </div>

      {/* Leave confirmation dialog */}
      {showLeaveConfirm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="modal-A" style={{background:'#fff',borderRadius:'20px',overflow:'hidden',maxWidth:'360px',width:'90%',textAlign:'center',boxShadow:'0 20px 50px rgba(0,0,0,0.2)'}}>
              <div style={{padding:'32px 32px 28px'}}>
              <p style={{fontWeight:700,fontSize:'16px',color:'#1f2937',marginBottom:'8px'}}>ยืนยันการออกจากหน้านี้</p>
              <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'24px'}}>ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก</p>
              <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
                <button onClick={()=>setShowLeaveConfirm(false)} style={{padding:'10px 24px',borderRadius:'12px',border:'2px solid #0d9488',background:'#fff',fontWeight:700,fontSize:'14px',color:'#0d9488',cursor:'pointer'}}>อยู่ต่อ</button>
                <button onClick={onBack} style={{padding:'10px 24px',borderRadius:'12px',border:'none',background:'#ef4444',fontWeight:700,fontSize:'14px',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}><i className="fa-solid fa-arrow-right-from-bracket"></i>ออกเลย</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── PHARM SUMMARY TAB ───────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────
// หน้าถังขยะ — list คนที่ลบแล้ว + Restore / Hard delete
// ─────────────────────────────────────────────────────
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
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

// ─────────────────────────────────────────────────────
// AdminUsersTab — จัดการผู้ใช้ (admin เท่านั้น) — embedded ใน dashboard
// ─────────────────────────────────────────────────────
// ใช้บัญชีกลางจาก tb-data.js (โหลดก่อน tb-modals เสมอ) — แหล่งเดียวกับ lib/professions.ts
const PROFESSION_LABELS_TH = window.TB_PROFESSION_LABELS;

// แถวแก้ไขข้อมูลแบบ 2 ฝั่ง: ซ้าย = ค่าเดิม (อ่านอย่างเดียว) | ขวา = ช่องแก้ (ไฮไลต์อำพันเมื่อแก้)
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

function ToastModal({ toast, onClose }) {
  const [closing, setClosing] = React.useState(false);
  // reset closing state เมื่อ toast ใหม่เข้ามา
  React.useEffect(() => { if (toast) setClosing(false); }, [toast]);
  const close = React.useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 280);
  }, [closing, onClose]);
  if (!toast) return null;
  const palette = {
    success: { bg:'#ecfdf5', bd:'#10b981', fg:'#065f46', icon:'fa-circle-check', btn:'#0d9488', btnHover:'#0f766e' },
    error:   { bg:'#fef2f2', bd:'#ef4444', fg:'#991b1b', icon:'fa-circle-xmark', btn:'#dc2626', btnHover:'#b91c1c' },
    info:    { bg:'#eff6ff', bd:'#3b82f6', fg:'#1e3a8a', icon:'fa-circle-info',  btn:'#2563eb', btnHover:'#1d4ed8' },
  };
  const c = palette[toast.kind] || palette.info;
  return (
    <div className={"fixed inset-0 z-50 flex items-center justify-center p-4 "+(closing?'modal-overlay-out':'')} style={{ background:'rgba(15,23,42,0.45)' }}>
      <div className={"bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden "+(closing?'modal-toast-out':'modal-toast')}>
        <div className="px-6 py-5" style={{ background: c.bg, borderLeft: `5px solid ${c.bd}` }}>
          <div className="flex items-start gap-3">
            <i className={'fa-solid '+c.icon+' text-2xl mt-0.5'} style={{ color: c.bd }}></i>
            <div className="flex-1">
              {toast.title && <h3 className="font-bold text-base mb-1" style={{ color: c.fg }}>{toast.title}</h3>}
              <p className="text-sm whitespace-pre-line" style={{ color: c.fg }}>{toast.message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-3 bg-white flex justify-end">
          <button type="button" onClick={close}
            className="px-5 py-2 rounded-xl text-white text-sm font-bold transition-colors"
            style={{ background: c.btn }}
            onMouseEnter={e=>e.currentTarget.style.background=c.btnHover}
            onMouseLeave={e=>e.currentTarget.style.background=c.btn}>
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}

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
                  <div className="col-span-3 min-w-0">
                    <p className="font-bold text-teal-900 truncate">{p.first_name} {p.last_name} {p.role === 'admin' && <span className="text-xs">👑</span>}</p>
                    <p className="text-xs text-gray-400 truncate">@{p.username} · {p.email || '—'}</p>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
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

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold mt-0.5 text-gray-800">{value}</p>
    </div>
  );
}

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
function FilterSelect({ icon, value, onChange, children }) {
  return (
    <div style={{position:'relative'}}>
      <i className={`fa-solid ${icon}`} style={{position:'absolute',left:'11px',top:'50%',transform:'translateY(-50%)',color:'#0d9488',fontSize:'11px',pointerEvents:'none'}}></i>
      <select value={value} onChange={onChange}
        style={{fontSize:'12px',fontWeight:value?600:400,padding:'9px 26px 9px 30px',borderRadius:'9px',border:`1px solid ${value?'#5eead4':'#e5e7eb'}`,background:value?'#f0fdfa':'#fff',color:value?'#0f766e':'#374151',outline:'none',cursor:'pointer',appearance:'none',WebkitAppearance:'none',MozAppearance:'none'}}>
        {children}
      </select>
      <i className="fa-solid fa-chevron-down" style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'9px',pointerEvents:'none'}}></i>
    </div>
  )
}
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

Object.assign(window,{DoseCalculator,DOTCalendar,DrugInteractionPanel,RegimenHistoryTab,NotificationPanel,NotificationFullModal,AddPatientPage,ClinicalModal,InfoBar,LabTab,ADRTab,TimelineTab,DiagnosisTab,MedsTab,PharmSummaryTab,TrashList,AdminUsersTab,AuditLogTab,ConfirmModal,hasResistance,afbCombined,isAfbPositive,getSputumConversion,isDelayedConversion});

/* ════════════════ tb-app.jsx ════════════════ */

// ===================== STATUS BADGE =====================
function StatusBadge({ status }) {
  if (status === 'critical') return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit animate-pulse"><i className="fa-solid fa-triangle-exclamation"></i>Lab ผิดปกติ</span>;
  if (status === 'warning') return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">⚠ ติดตาม</span>;
  return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">✓ ปกติ</span>;
}

// ===================== DASHBOARD =====================
const MONTH_LABELS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const FAKE_MONTHLY = { 2025:[8,11,9,14,15,20,18,25,22,19,13,10], 2026:[12,15,10,18,6,0,0,0,0,0,0,0] };
const FAKE_YEARLY = { 2025:184, 2026:61 };

function Dashboard({ patients, archivePatients, onDashFilter, onGoArchiveDelayed, onGoAllPatients, onGoArchiveSuccess, onOpen }) {
  const barRef = useRef(null); const pieRef = useRef(null);
  const [chartMode, setChartMode] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showSputumModal, setShowSputumModal] = useState(false);
  const [hoveredKpi, setHoveredKpi] = useState(null);
  // v0.7.15.1 — useMemo KPI ทั้งหมด → คำนวณครั้งเดียวต่อ patients/archive เปลี่ยน
  // เดิม: 10 .filter() ครั้ง × N rows = 5000 ops ทุก render
  // ใหม่: 1 pass loop คำนวณทุก KPI พร้อมกัน + cache จน patients เปลี่ยน
  const isNeg = r => /neg/i.test(r||'');
  const isPos = r => /\+|scanty/i.test(r||'');
  const getIntensiveMonths = r => { const m = r?.match(/^(\d+)/); return m ? parseInt(m[1]) : 2; };
  const hasSputumDelayed = p => (p.sputum||[]).filter(s => s.tp !== 'M0').some(s => isPos(s.result));

  // หมายเหตุ: ใช้ชื่อ kpiCalc แทน kpis เพราะ kpis array (KPI cards) อยู่ใน scope แล้ว
  const kpiCalc = React.useMemo(() => {
    const active = []; const criticals = []; const smearPos = []; const delayedActive = []; const nearPhaseChange = []; const nearDone = []; const cohortDone = [];
    let intensive = 0, cont = 0, mdr = 0, done = 0;
    for (const p of patients) {
      if (p.status !== 'done') active.push(p); else { done++; cohortDone.push(p); }
      if (p.status === 'critical') criticals.push(p);
      if (p.phase === 'Intensive') intensive++;
      if (p.phase === 'Continuation') cont++;
      if (p.regimen && (p.regimen.includes('Bdq')||p.regimen.includes('Lzd')||p.regimen.includes('Mfx'))) mdr++;
      if (p.phase === 'Intensive' && p.status !== 'done' && p.month >= getIntensiveMonths(p.regimen) - 0.5) nearPhaseChange.push(p);
      const sp = p.sputum||[];
      if (sp.length && isPos(sp[0]?.result)) smearPos.push(p);
      if (hasSputumDelayed(p)) delayedActive.push(p);
      if (p.status !== 'done') {
        const total = getTotalMonths(p.regimen);
        if (total && (total - p.month) <= 1 && (total - p.month) > 0) nearDone.push(p);
      }
    }
    const converted = smearPos.filter(p => (p.sputum||[]).slice(1).some(s => isNeg(s.result)));
    const convRate = smearPos.length > 0 ? Math.round(converted.length / smearPos.length * 100) : null;
    const successRate = patients.length > 0 ? Math.round(done / patients.length * 100) : 0;
    return { active, criticals, intensive, cont, mdr, done, smearPos, converted, convRate, delayedActive, nearPhaseChange, nearDone, cohortDone, successRate };
  }, [patients]);

  const archivedDelayed = React.useMemo(() =>
    (archivePatients||[]).filter(p => hasSputumDelayed(p)),
  [archivePatients]);

  // destructure ออกมาเป็นตัวแปรเดิม → ไม่ต้องแก้ JSX ที่ใช้ตัวแปรเหล่านี้
  const { active, criticals, intensive, cont, mdr, done, smearPos, converted, convRate, delayedActive, nearPhaseChange, nearDone, cohortDone, successRate } = kpiCalc;

  useEffect(() => {
    if (!barRef.current) return;
    const isYearly = chartMode === 'yearly';
    const labels = isYearly ? Object.keys(FAKE_YEARLY) : MONTH_LABELS;
    const data = isYearly ? Object.values(FAKE_YEARLY) : (FAKE_MONTHLY[selectedYear] || Array(12).fill(0));
    const c = new Chart(barRef.current, {
      type: 'bar',
      data: { labels, datasets:[{ label:'ผู้ป่วยใหม่', data, backgroundColor:'#0d9488', borderRadius:8, hoverBackgroundColor:'#99f6e4', borderSkipped:false }] },
      options: {
        responsive:true, maintainAspectRatio:false,
        animation: false,  // ปิดอนิเมชั่นตอนโหลด (แท่งโตขึ้น) — ยังเก็บ hover สีเปลี่ยนไว้
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#f0fdfa', titleColor:'#0f766e', bodyColor:'#134e4a', borderColor:'#99f6e4', borderWidth:1, padding:12, cornerRadius:12, titleFont:{weight:'bold'} } },
        scales:{ y:{ grid:{color:'rgba(0,0,0,0.03)'},border:{display:false},beginAtZero:true,ticks:{font:{size:11},color:'#9ca3af'} }, x:{ grid:{display:false},border:{display:false},ticks:{font:{size:11},color:'#9ca3af'} } },
        onHover:(e,el)=>{ e.native.target.style.cursor = el.length ? 'pointer' : 'default'; },
        onClick:(e,el)=>{
          if(!el.length) return;
          const idx=el[0].index;
          if(chartMode==='monthly') onDashFilter({type:'startMonth',month:idx+1,year:selectedYear,label:`เริ่มยา ${MONTH_LABELS[idx]} ${selectedYear}`});
          else { const yr=parseInt(Object.keys(FAKE_YEARLY)[idx]); onDashFilter({type:'startYear',year:yr,label:`เริ่มยา ปี ${yr}`}); }
        }
      }
    });
    return () => c.destroy();
  }, [chartMode, selectedYear, onDashFilter]);

  useEffect(() => {
    if (!pieRef.current) return;
    const pieFilters = [
      {type:'phase',phase:'Intensive',label:'Intensive Phase'},
      {type:'phase',phase:'Continuation',label:'Continuation Phase'},
      {type:'mdr',label:'MDR-TB'},
    ];
    const c = new Chart(pieRef.current, {
      type: 'doughnut',
      data: { labels:['Intensive','Continuation','MDR-TB'], datasets:[{ data:[intensive||1,cont,mdr], backgroundColor:['#f59e0b','#0d9488','#ef4444'], borderWidth:3, borderColor:'#fff', hoverOffset:8 }] },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'60%',
        animation: false,  // ปิดอนิเมชั่นตอนโหลด (โดนัทค่อยๆเต็ม) — ยังเก็บ hover ขยายชิ้นไว้
        plugins:{ legend:{position:'bottom',labels:{font:{size:11},boxWidth:10,padding:12,color:'#6b7280'}}, tooltip:{ backgroundColor:'#f0fdfa', titleColor:'#0f766e', bodyColor:'#134e4a', borderColor:'#99f6e4', borderWidth:1, padding:12, cornerRadius:12, titleFont:{weight:'bold'} } },
        onHover:(e,el)=>{ e.native.target.style.cursor = el.length ? 'pointer' : 'default'; },
        onClick:(e,el)=>{ if(el.length) onDashFilter(pieFilters[el[0].index]); }
      }
    });
    return () => c.destroy();
  }, [intensive, cont, mdr, onDashFilter]);

  const totalAll = patients.length + (archivePatients||[]).length;
  const successArchived = (archivePatients||[]).filter(p => ['Cured','Completed'].includes(p.outcome?.type));

  const kpis = [
    { label:'ขึ้นทะเบียนทั้งหมด', value:totalAll.toLocaleString(), icon:'fa-users', accent:'#0f766e', iconBg:'#ccfbf1', iconColor:'#0f766e', hoverBorder:'#5eead4', hoverBg:'#f0fdfa', onClick: onGoAllPatients },
    { label:'กำลังรักษา (Active)', value:active.length, icon:'fa-lungs', accent:'#f59e0b', iconBg:'#fef3c7', iconColor:'#d97706', hoverBorder:'#fcd34d', hoverBg:'#fffbeb', onClick: ()=>onDashFilter({type:'active',label:'กำลังรักษา (Active)'}) },
    { label:'จบการรักษา (Success)', value:successArchived.length, icon:'fa-check-double', accent:'#10b981', iconBg:'#d1fae5', iconColor:'#059669', hoverBorder:'#6ee7b7', hoverBg:'#ecfdf5', onClick: onGoArchiveSuccess },
    { label:'Lab ผิดปกติ / ADR', value:criticals.length, icon:'fa-vial', accent:criticals.length>0?'#ef4444':'#f59e0b', iconBg:criticals.length>0?'#fee2e2':'#fef3c7', iconColor:criticals.length>0?'#dc2626':'#d97706', hoverBorder:criticals.length>0?'#f87171':'#fcd34d', hoverBg:criticals.length>0?'#fff1f2':'#fffbeb', alert:criticals.length>0, onClick: ()=>onDashFilter({type:'critical',label:'Lab ผิดปกติ / ADR'}) },
  ];

  return (
    <div className="space-y-5 tb-fade">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} onClick={k.onClick}
            onMouseEnter={()=>setHoveredKpi(k.label)}
            onMouseLeave={()=>setHoveredKpi(null)}
            className="cursor-pointer group overflow-hidden"
            style={{
              borderRadius:'16px',
              background: hoveredKpi===k.label ? k.hoverBg : '#fff',
              boxShadow: hoveredKpi===k.label ? '0 10px 28px rgba(0,0,0,0.13)' : '0 1px 4px rgba(0,0,0,0.06)',
              border: `2px solid ${hoveredKpi===k.label ? k.accent : k.alert ? '#fecaca' : k.hoverBorder}`,
              transform: hoveredKpi===k.label ? 'translateY(-5px) scale(1.025)' : 'translateY(0) scale(1)',
              transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)'
            }}>
            <div style={{height:'3px',background:k.accent}}></div>
            <div className="p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-105"
                style={{background:k.iconBg}}>
                <i className={`fa-solid ${k.icon}`} style={{color:k.iconColor}}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium leading-tight">{k.label}</p>
                <p className="text-3xl font-bold mt-0.5" style={{color:k.alert?'#dc2626':'#0f172a'}}>{k.value}</p>
              </div>
              <i className="fa-solid fa-chevron-right text-xs text-gray-300 group-hover:text-teal-400 transition-colors flex-shrink-0"></i>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">

        {/* Bar Chart */}
        <div className="bg-white rounded-3xl col-span-2 overflow-hidden tb-dash-card" style={{boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
          <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-50">
            <div>
              <h2 className="text-sm font-bold text-gray-800">แนวโน้มผู้ป่วยใหม่</h2>
              <p className="text-xs text-gray-400 mt-0.5">กดแท่งกราฟเพื่อกรองข้อมูล</p>
            </div>
            <div className="flex items-center gap-2">
              {chartMode==='monthly' && (
                <select value={selectedYear} onChange={e=>setSelectedYear(+e.target.value)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 outline-none focus:ring-2 focus:ring-teal-300 text-gray-600">
                  {Object.keys(FAKE_MONTHLY).map(y=><option key={y} value={+y}>{y}</option>)}
                </select>
              )}
              <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-semibold">
                <button type="button" onClick={()=>setChartMode('monthly')} className={'px-3 py-1.5 transition-all '+(chartMode==='monthly'?'bg-teal-600 text-white':'text-gray-400 hover:text-teal-600 hover:bg-teal-50')}>รายเดือน</button>
                <button type="button" onClick={()=>setChartMode('yearly')} className={'px-3 py-1.5 transition-all '+(chartMode==='yearly'?'bg-teal-600 text-white':'text-gray-400 hover:text-teal-600 hover:bg-teal-50')}>รายปี</button>
              </div>
            </div>
          </div>
          <div className="p-6 pt-4"><div className="h-52"><canvas ref={barRef}></canvas></div></div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-3xl overflow-hidden tb-dash-card" style={{boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
          <div className="px-5 pt-5 pb-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-800">สัดส่วนตามระยะ</h2>
            <p className="text-xs text-gray-400 mt-0.5">กดกราฟเพื่อกรองข้อมูล</p>
          </div>
          <div className="p-5 pt-4">
            <div className="h-52"><canvas ref={pieRef}></canvas></div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Phase Change + Metrics ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* ใกล้เปลี่ยน Phase */}
        <div className="col-span-2 bg-white rounded-3xl overflow-hidden tb-dash-card" style={{boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <i className="fa-solid fa-rotate text-amber-500 text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">ใกล้เปลี่ยนระยะการรักษา</p>
                <p className="text-xs text-gray-400">Intensive → Continuation ภายใน 2 สัปดาห์</p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{background:'#fef3c7',color:'#d97706'}}>{nearPhaseChange.length} ราย</span>
          </div>
          {nearPhaseChange.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-300">
              <i className="fa-solid fa-circle-check text-3xl mb-2 block text-teal-200"></i>
              <p className="text-sm">ไม่มีผู้ป่วยใกล้เปลี่ยนระยะในขณะนี้</p>
            </div>
          ) : (
            <div style={{overflowY:'auto',maxHeight:'260px'}}
              className={nearPhaseChange.length >= 5 ? 'grid grid-cols-2 divide-x divide-gray-50' : 'divide-y divide-gray-50'}>
              {nearPhaseChange.map(p => {
                const intMo = getIntensiveMonths(p.regimen);
                const remaining = intMo - p.month;
                return (
                  <div key={p.id} onClick={()=>onOpen(p)} className="px-6 py-3.5 flex items-center justify-between hover:bg-amber-50/40 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-amber-700 transition-colors">{p.name}</p>
                        <p className="text-xs text-gray-400">เดือนที่ {p.month} · สูตร {p.regimen}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-xs font-bold text-amber-600">{remaining <= 0 ? 'ใกล้ครบ Intensive แล้ว' : `~${Math.round(remaining * 4)} สัปดาห์`}</p>
                        <p className="text-xs text-gray-300">Intensive เดือน {intMo}</p>
                      </div>
                      <i className="fa-solid fa-chevron-right text-xs text-gray-200 group-hover:text-amber-400 transition-colors"></i>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Metrics stacked */}
        <div className="flex flex-col gap-4">

          {/* Sputum Conversion Rate */}
          <div onClick={()=>delayedActive.length>0&&setShowSputumModal(true)} className="bg-white rounded-3xl p-5 flex-1 flex flex-col justify-between tb-dash-card" style={{boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9',cursor:delayedActive.length>0?'pointer':'default'}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-700">Sputum Conversion Rate</p>
              <div className="flex items-center gap-2">
                {delayedActive.length>0 && <span className="text-xs text-red-500 font-semibold">Delayed: {delayedActive.length} ราย</span>}
                <div className="w-7 h-7 rounded-xl bg-teal-50 flex items-center justify-center">
                  <i className="fa-solid fa-microscope text-teal-500 text-xs"></i>
                </div>
              </div>
            </div>
            {convRate === null ? (
              <p className="text-xs text-gray-300 text-center py-2">ไม่มีข้อมูล smear</p>
            ) : (
              <>
                <div className="flex items-end gap-2 mb-2">
                  <p className="text-4xl font-black" style={{color: convRate >= 85 ? '#0d9488' : '#f59e0b'}}>{convRate}<span className="text-lg font-semibold text-gray-400">%</span></p>
                  <p className="text-xs text-gray-400 mb-1">({converted.length}/{smearPos.length} ราย)</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                  <div className="h-1.5 rounded-full transition-all" style={{width:`${Math.min(convRate,100)}%`, background: convRate >= 85 ? '#0d9488' : '#f59e0b'}}></div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-300">WHO target ≥85%</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background: convRate>=85?'#ccfbf1':'#fef3c7', color: convRate>=85?'#0f766e':'#d97706'}}>{convRate >= 85 ? '✓ ผ่าน' : '⚠ ต่ำกว่าเป้า'}</span>
                </div>
                {archivedDelayed.length > 0 && (
                  <button type="button"
                    onClick={e=>{e.stopPropagation();onGoArchiveDelayed&&onGoArchiveDelayed();}}
                    className="mt-2 w-full text-xs font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-100 flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 transition-all"
                  >
                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-box-archive text-xs"></i>Cured + Delayed: {archivedDelayed.length} ราย</span>
                    <span>→</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Treatment Success Rate */}
          <div className="bg-white rounded-3xl p-5 flex-1 flex flex-col justify-between tb-dash-card" style={{boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-700">Treatment Success Rate</p>
              <div className="w-7 h-7 rounded-xl bg-teal-50 flex items-center justify-center">
                <i className="fa-solid fa-trophy text-teal-500 text-xs"></i>
              </div>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <p className="text-4xl font-black" style={{color: successRate >= 90 ? '#0d9488' : '#f59e0b'}}>{successRate}<span className="text-lg font-semibold text-gray-400">%</span></p>
              <p className="text-xs text-gray-400 mb-1">({cohortDone.length}/{patients.length} ราย)</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
              <div className="h-1.5 rounded-full transition-all" style={{width:`${Math.min(successRate,100)}%`, background: successRate >= 90 ? '#0d9488' : '#f59e0b'}}></div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-300">WHO target ≥90%</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background: successRate>=90?'#ccfbf1':'#fef3c7', color: successRate>=90?'#0f766e':'#d97706'}}>{successRate >= 90 ? '✓ ผ่าน' : '⚠ ต่ำกว่าเป้า'}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── ใกล้จบรักษา (skeleton) ── */}
      <div className="bg-white rounded-3xl overflow-hidden tb-dash-card" style={{boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #f1f5f9'}}>
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
              <i className="fa-solid fa-flag-checkered text-teal-500 text-sm"></i>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">ผู้ป่วยใกล้จบการรักษา</p>
              <p className="text-xs text-gray-400">เหลือระยะเวลาการรักษา ≤ 1 เดือน</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-700">{nearDone.length} ราย</span>
        </div>
        {nearDone.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-300">
            <i className="fa-solid fa-hourglass-half text-3xl mb-2 block text-teal-100"></i>
            <p className="text-sm">ยังไม่มีผู้ป่วยใกล้จบการรักษาในขณะนี้</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {nearDone.map(p => {
              const total = getTotalMonths(p.regimen);
              const remaining = total - p.month;
              return (
                <div key={p.id} onClick={()=>onOpen(p)} className="px-6 py-3.5 flex items-center justify-between hover:bg-teal-50/30 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-700 transition-colors">{p.name}</p>
                      <p className="text-xs text-gray-400">เดือนที่ {p.month} / {total} · สูตร {p.regimen}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-xs font-bold text-teal-600">เหลือ {remaining} เดือน</p>
                      <div className="w-24 bg-gray-100 rounded-full h-1 mt-1">
                        <div className="h-1 rounded-full bg-teal-400" style={{width:`${Math.round(p.month/total*100)}%`}}></div>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-gray-200 group-hover:text-teal-400 transition-colors"></i>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Critical Cases */}
      {criticals.length > 0 && (
        <div className="rounded-3xl overflow-hidden tb-dash-card" style={{border:'1px solid #fecaca',boxShadow:'0 1px 4px rgba(239,68,68,0.08)'}}>
          <div className="bg-red-50 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-triangle-exclamation text-red-600 text-sm"></i>
            </div>
            <div>
              <p className="font-bold text-red-700 text-sm">เคสที่ต้องดูแลด่วน</p>
              <p className="text-xs text-red-400">{criticals.length} ราย — กรุณาตรวจสอบผลแลบและนัดหมาย</p>
            </div>
          </div>
          <div className="bg-white divide-y divide-red-50">
            {criticals.map(p => { const last = p.labs[p.labs.length-1]; return (
              <div key={p.id} onClick={()=>onOpen(p)} className="px-6 py-3.5 flex items-center justify-between hover:bg-red-50/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm group-hover:text-red-700 transition-colors">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">ALT {last?.alt} U/L · นัด {p.nextAppt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">ด่วน</span>
                  <i className="fa-solid fa-chevron-right text-xs text-gray-200 group-hover:text-red-400 transition-colors"></i>
                </div>
              </div>
            );})}
          </div>
        </div>
      )}
      {/* Sputum Detail Modal — Delayed patients only */}
      {showSputumModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowSputumModal(false)}>
          <div className="modal-A" style={{background:'#fff',borderRadius:'24px',width:'90%',maxWidth:'560px',maxHeight:'82vh',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'20px 24px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
              <div>
                <p style={{fontWeight:700,fontSize:'15px',color:'#1f2937'}}>Sputum Delayed — รายละเอียด</p>
                <p style={{fontSize:'12px',color:'#9ca3af',marginTop:'2px'}}>เสมหะบวก/scanty ตั้งแต่ M2 ขึ้นไป · {delayedActive.length} ราย</p>
              </div>
              <button onClick={()=>setShowSputumModal(false)} style={{width:'32px',height:'32px',borderRadius:'50%',border:'none',background:'#f1f5f9',cursor:'pointer',fontSize:'14px',color:'#6b7280',flexShrink:0}}>✕</button>
            </div>
            <div style={{overflowY:'auto',flex:1,padding:'8px 0'}}>
              {delayedActive.length === 0 ? (
                <div style={{padding:'40px 24px',textAlign:'center',color:'#9ca3af'}}>
                  <p style={{fontSize:'14px'}}>ไม่มีผู้ป่วย Delayed ในขณะนี้</p>
                </div>
              ) : delayedActive.map(p => {
                const latestResult = (p.sputum||[]).length > 0 ? p.sputum[p.sputum.length-1].result : '';
                const isConverted = isNeg(latestResult);
                return (
                  <div key={p.id}
                    onClick={()=>{onOpen(p);setShowSputumModal(false);}}
                    style={{padding:'12px 24px',borderBottom:'1px solid #f9fafb',cursor:'pointer',transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{width:'8px',height:'8px',borderRadius:'50%',background:isConverted?'#0d9488':'#ef4444',flexShrink:0}}></div>
                        <div>
                          <p style={{fontWeight:600,fontSize:'14px',color:'#1f2937',margin:0}}>{p.name}</p>
                          <p style={{fontSize:'11px',color:'#9ca3af',margin:0}}>HN: {p.hn} · M{p.month} · {p.regimen}</p>
                        </div>
                      </div>
                      <span style={{fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'20px',background:isConverted?'#ccfbf1':'#fef3c7',color:isConverted?'#0f766e':'#d97706',flexShrink:0,whiteSpace:'nowrap',marginLeft:'8px'}}>
                        {isConverted ? '✓ Converted' : '⚠ ยังบวกอยู่'}
                      </span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:'4px',marginLeft:'18px'}}>
                      {(p.sputum||[]).map((s, i) => {
                        const pos = isPos(s.result);
                        const neg = isNeg(s.result);
                        return (
                          <React.Fragment key={s.tp||i}>
                            {i > 0 && <span style={{color:'#d1d5db',fontSize:'10px'}}>→</span>}
                            <span style={{fontSize:'11px'}}>
                              <span style={{color:'#9ca3af'}}>{s.tp}: </span>
                              <span style={{fontWeight:700,color:pos?'#ef4444':neg?'#0d9488':'#6b7280'}}>{s.result||'—'}</span>
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {archivedDelayed.length > 0 && (
              <div style={{padding:'12px 24px',borderTop:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fffbeb'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <i className="fa-solid fa-box-archive" style={{color:'#d97706',fontSize:'13px'}}></i>
                  <span style={{fontSize:'12px',color:'#92400e',fontWeight:600}}>จบการรักษา + มีประวัติ Delayed: {archivedDelayed.length} ราย</span>
                </div>
                <button
                  onClick={()=>{setShowSputumModal(false);onGoArchiveDelayed&&onGoArchiveDelayed();}}
                  style={{fontSize:'12px',fontWeight:700,padding:'5px 14px',borderRadius:'20px',background:'#f59e0b',color:'#78350f',border:'none',cursor:'pointer',whiteSpace:'nowrap',transition:'background 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#d97706'}
                  onMouseLeave={e=>e.currentTarget.style.background='#f59e0b'}
                >
                  ดูทะเบียนจบ →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== PATIENT LIST =====================
// ─── patient list helpers ────────────────────────────────────────
const DEFAULT_COL_CONFIG = [
  { id:'info',          label:'อายุ / เพศ / ตำบล',  visible:true  },
  { id:'tb_regimen',    label:'ชนิด TB / สูตรยา',   visible:true  },
  { id:'progress',      label:'ความคืบหน้า',         visible:true  },
  { id:'weight',        label:'น้ำหนัก',             visible:true  },
  { id:'start_date',    label:'วันเริ่ม',             visible:true  },
  { id:'next_appt',     label:'วันนัดถัดไป',          visible:true  },
  { id:'comorbidities', label:'โรคร่วม',              visible:false },
  { id:'status',        label:'สถานะ',               visible:true  },
];

const DEFAULT_ARCHIVE_COL_CONFIG = [
  { id:'info',          label:'อายุ / เพศ / ตำบล',  visible:true  },
  { id:'tb_regimen',    label:'ชนิด TB / สูตรยา',   visible:true  },
  { id:'progress',      label:'ความคืบหน้า',         visible:true  },
  { id:'weight',        label:'น้ำหนัก',             visible:true  },
  { id:'adherence',     label:'Adherence',           visible:true  },
  { id:'start_date',    label:'วันเริ่ม',             visible:true  },
  { id:'comorbidities', label:'โรคร่วม',              visible:false },
];

function getTotalMonths(regimen) {
  if (!regimen) return null;
  const m = regimen.match(/^(\d+)[A-Z]+\/(\d+)/);
  if (m) return parseInt(m[1]) + parseInt(m[2]);
  if (/^6-9H/.test(regimen)) return 9;
  if (/^3HR/.test(regimen)) return 3;
  return null;
}

// v0.7.17.0 — renamed (collision กับ fmtDate ของ tb-modals หลังรวมไฟล์)
const fmtDateApp = d => { if(!d) return '-'; const [y,m,day] = d.split('-'); return `${day}/${m}/${y.slice(2)}`; };

// ─── shared cell renderer (ใช้ร่วมกันทั้ง PatientList และ ArchiveList) ───
const renderPatientCell = (colId, p) => {
  switch(colId) {
    case 'info': return (
      <td key={colId} className="py-2 px-4 text-xs whitespace-nowrap">
        <p className={`font-semibold ${p.gender==='M'?'text-blue-600':'text-pink-500'}`}>
          <i className={`fa-solid ${p.gender==='M'?'fa-person':'fa-person-dress'} mr-1`}></i>
          {p.age} ปี · {p.gender==='M'?'ชาย':'หญิง'}
        </p>
        {p.subdistrict && <p className="text-teal-600 font-medium mt-0.5">ต.{p.subdistrict}</p>}
      </td>
    );
    case 'tb_regimen': return (
      <td key={colId} className="py-2 px-4 whitespace-nowrap">
        <p className="text-xs text-gray-500 mb-0.5">{p.diseaseLocation==='Extra-pulmonary'?(p.extraPulmonaryType||'Extra-pulmonary'):p.diseaseLocation||'Pulmonary'}</p>
        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-xs">{p.regimen}</span>
      </td>
    );
    case 'progress': {
      const total = getTotalMonths(p.regimen);
      const pct = total ? Math.min(100, Math.round((p.month/total)*100)) : null;
      const isInt = p.phase==='Intensive';
      return (
        <td key={colId} className="py-2 px-4 min-w-[130px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={`font-bold ${isInt?'text-amber-600':'text-green-600'}`}>{isInt?'Intensive':'Cont.'}</span>
            <span className="text-gray-500 font-mono">{total?`M${p.month}/${total}`:` M${p.month}`}</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            {pct!==null && <div className={`h-2 rounded-full ${isInt?'bg-amber-400':'bg-green-500'}`} style={{width:`${pct}%`}}></div>}
          </div>
        </td>
      );
    }
    case 'weight': return <td key={colId} className="py-2 px-4 text-sm font-semibold text-gray-700 whitespace-nowrap">{p.weight} kg</td>;
    case 'adherence': return (
      <td key={colId} className="py-2 px-4">
        <div className="flex items-center gap-2">
          <div className="bg-gray-200 rounded-full h-1.5 w-16 overflow-hidden">
            <div className={`h-1.5 rounded-full ${p.adherence>=90?'bg-green-500':p.adherence>=70?'bg-amber-500':'bg-red-500'}`} style={{width:`${p.adherence}%`}}></div>
          </div>
          <span className={`text-xs font-bold w-8 ${p.adherence<80?'text-red-600':p.adherence<90?'text-amber-600':'text-gray-600'}`}>{p.adherence}%</span>
        </div>
      </td>
    );
    case 'start_date': {
      const hist = p.regimenHistory||[];
      const latest = hist.length>0 ? hist[hist.length-1] : null;
      const latestDate = latest?.startDate || p.startDate;
      const hasRestart = hist.length > 1;
      return (
        <td key={colId} className="py-2 px-4 text-xs whitespace-nowrap">
          <p className="font-mono text-gray-700">{fmtDateApp(latestDate)}</p>
          {hasRestart && <span className="inline-flex items-center gap-1 mt-0.5 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">↺ Re-start</span>}
        </td>
      );
    }
    case 'next_appt': {
      const du = p.daysUntil ?? null;
      const color = du===null?'text-gray-400':du<0?'text-red-600':du===0?'text-orange-600':du<=3?'text-amber-600':'text-gray-600';
      const sub = du===null?'':du<0?`เลย ${Math.abs(du)} วัน`:du===0?'วันนี้!':du===1?'พรุ่งนี้':`อีก ${du} วัน`;
      return (
        <td key={colId} className="py-2 px-4 text-xs whitespace-nowrap">
          <p className={`font-semibold ${color}`}>{p.nextAppt||'-'}</p>
          {sub && <p className={`mt-0.5 ${color}`}>{sub}</p>}
        </td>
      );
    }
    case 'comorbidities': return (
      <td key={colId} className="py-2 px-4">
        <div className="flex flex-wrap gap-1 max-w-[140px]">
          {(p.comorbidities||[]).slice(0,3).map(c=><span key={c} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">{c}</span>)}
          {(p.comorbidities||[]).length>3 && <span className="text-gray-400 text-xs self-center">+{p.comorbidities.length-3}</span>}
        </div>
      </td>
    );
    case 'status': return <td key={colId} className="py-2 px-4 whitespace-nowrap"><StatusBadge status={p.status}/></td>;
    default: return <td key={colId} className="py-2 px-4"></td>;
  }
};

const getBannerColors = f => {
  if (!f) return { bg:'#f0fdfa', border:'#0d9488', text:'#134e4a' };
  const M = {
    active:   { bg:'#fffbeb', border:'#f59e0b', text:'#78350f' },
    critical: { bg:'#fff1f2', border:'#ef4444', text:'#7f1d1d' },
    done:     { bg:'#ecfdf5', border:'#10b981', text:'#064e3b' },
    mdr:      { bg:'#fff1f2', border:'#ef4444', text:'#7f1d1d' },
  };
  if (f.type === 'phase') return f.phase === 'Intensive' ? M.active : { bg:'#f0fdfa', border:'#0d9488', text:'#134e4a' };
  return M[f.type] || { bg:'#f0fdfa', border:'#0d9488', text:'#134e4a' };
};

function PatientList({ patients, onAdd, onOpen, settings, dashFilter, onClearDashFilter, search, filter, showColMgr, onToggleColMgr, onArchive }) {
  const [colConfig, setColConfig] = useState(() => {
    try { const s = localStorage.getItem('tbColCfg'); return s ? JSON.parse(s) : DEFAULT_COL_CONFIG; }
    catch { return DEFAULT_COL_CONFIG; }
  });

  useEffect(() => { try { localStorage.setItem('tbColCfg', JSON.stringify(colConfig)); } catch {} }, [colConfig]);

  const toggleCol = id => setColConfig(c => c.map(col => col.id===id ? {...col, visible:!col.visible} : col));
  const moveCol = (id, dir) => setColConfig(c => {
    const i = c.findIndex(col => col.id===id);
    const ni = i + dir;
    if (ni < 0 || ni >= c.length) return c;
    const next = [...c]; [next[i], next[ni]] = [next[ni], next[i]]; return next;
  });
  const resetCols = () => { setColConfig(DEFAULT_COL_CONFIG); localStorage.removeItem('tbColCfg'); };

  const visibleCols = colConfig.filter(c => c.visible);

  const applyDashFilter = p => {
    if (!dashFilter) return true;
    switch(dashFilter.type) {
      case 'all': return true;
      case 'active': return p.status !== 'done';
      case 'done': return p.status === 'done';
      case 'critical': return p.status === 'critical';
      case 'phase': return p.phase === dashFilter.phase;
      case 'mdr': return p.regimen && (p.regimen.includes('Bdq')||p.regimen.includes('Lzd')||p.regimen.includes('Mfx'));
      case 'startMonth': { if(!p.startDate) return false; const d=new Date(p.startDate); return d.getMonth()+1===dashFilter.month && d.getFullYear()===dashFilter.year; }
      case 'startYear': return p.startDate && new Date(p.startDate).getFullYear()===dashFilter.year;
      default: return true;
    }
  };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const ok = !q || p.name.toLowerCase().includes(q) || p.hn.includes(q) || (p.armyId||'').includes(q) || (p.subdistrict||'').includes(q);
    const fs = filter==='all' || (filter==='intensive'&&p.phase==='Intensive') || (filter==='continuation'&&p.phase==='Continuation') || (filter==='critical'&&p.status==='critical');
    return ok && fs && applyDashFilter(p);
  });

  // v0.7.17.1 — Lazy render: แสดง 50 รายแรก + ปุ่ม "ดูเพิ่ม" — เผื่อ data เยอะ (multi-tenant ในอนาคต)
  const [visiblePtCount, setVisiblePtCount] = useState(50);
  useEffect(() => { setVisiblePtCount(50); }, [search, filter, dashFilter]);
  const visiblePatients = filtered.slice(0, visiblePtCount);

  return (
    <div className="flex flex-col gap-3 tb-fade h-full">
      {/* Column manager panel */}
      {showColMgr && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm tb-fade flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-700"><i className="fa-solid fa-table-columns mr-2 text-teal-600"></i>จัดการคอลัม</p>
            <button onClick={resetCols} className="text-xs text-gray-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-rotate-left mr-1"></i>รีเซ็ตค่าเริ่มต้น</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {colConfig.map((col, i) => (
              <div key={col.id} className={`flex items-center gap-1 border rounded-xl px-2.5 py-1.5 text-xs transition-all ${col.visible?'bg-teal-50 border-teal-300 text-teal-800':'bg-gray-50 border-gray-200 text-gray-400'}`}>
                <button onClick={()=>toggleCol(col.id)} className="font-semibold mr-1">
                  {col.visible?<i className="fa-solid fa-check text-teal-500 w-3"></i>:<i className="fa-regular fa-square w-3 text-gray-300"></i>}
                  <span className="ml-1.5">{col.label}</span>
                </button>
                <button onClick={()=>moveCol(col.id,-1)} disabled={i===0} className="text-gray-300 hover:text-teal-500 disabled:opacity-20 transition-colors px-0.5"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                <button onClick={()=>moveCol(col.id,1)} disabled={i===colConfig.length-1} className="text-gray-300 hover:text-teal-500 disabled:opacity-20 transition-colors px-0.5"><i className="fa-solid fa-chevron-right text-xs"></i></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard filter banner */}
      {dashFilter && (() => { const bc = getBannerColors(dashFilter); return (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm flex-shrink-0 shadow-sm font-medium"
          style={{background:bc.bg, border:`1.5px solid ${bc.border}`, color:bc.text}}>
          <i className="fa-solid fa-filter text-xs" style={{color:bc.border}}></i>
          <span>กรองจาก Dashboard: <strong>{dashFilter.label}</strong></span>
          <button type="button" onClick={onClearDashFilter}
            className="ml-auto flex items-center gap-1 text-xs font-bold hover:opacity-60 transition-opacity px-1"
            style={{color:bc.text}}>
            <i className="fa-solid fa-xmark"></i> ล้าง
          </button>
        </div>
      ); })()}

      {/* Table — flex-1 + min-h-0 ทำให้ scroll container ลอยอยู่ขอบล่างเสมอ */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="w-full h-full overflow-auto">
        <table className="w-full min-w-max text-left">
          <thead className="bg-teal-600 text-white text-xs uppercase tracking-wide border-b border-teal-400">
            <tr>
              <th className="py-2 px-4 font-semibold sticky left-0 bg-teal-600 z-10 whitespace-nowrap">HN / ชื่อ</th>
              {visibleCols.map(col => <th key={col.id} className="py-2 px-4 font-semibold whitespace-nowrap">{col.label}</th>)}
              <th className="py-2 px-4 font-semibold whitespace-nowrap text-center">ผลการรักษา</th>
              <th className="py-2 px-4 font-semibold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-100 text-sm">
            {filtered.length===0 ? (
              <tr><td colSpan={visibleCols.length+3} className="p-10 text-center text-gray-400"><i className="fa-solid fa-user-slash text-2xl mb-2 block text-gray-300"></i>ไม่พบผู้ป่วยที่ค้นหา</td></tr>
            ) : (<>{visiblePatients.map(p => (
              <tr key={p.id} onClick={()=>onOpen(p)}
                className={`tb-pt-row hover:bg-teal-50/40 transition-colors cursor-pointer group ${p.status==='critical'?'border-l-4 border-l-red-400':''}`}>
                {/* HN / ชื่อ — fixed left */}
                <td className="py-2 px-4 sticky left-0 bg-white group-hover:bg-teal-50/30 z-10 transition-colors">
                  <p className="font-mono text-gray-400 text-xs">{p.hn}</p>
                  <p className="font-bold text-gray-800 group-hover:text-teal-700 mt-0.5">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.patientType||'New'} · {p.diseaseLocation==='Extra-pulmonary'?'Extra-pulmonary':p.diseaseLocation||'Pulmonary'}</p>
                </td>
                {visibleCols.map(col => renderPatientCell(col.id, p))}
                {/* Outcome status */}
                <td className="py-2 px-4 whitespace-nowrap text-center">
                  {p.outcome?.type ? (
                    <span
                      className="tb-wiggle inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm transition-colors"
                      title="คลิกเพื่อส่งเข้าทะเบียนจบการรักษา"
                      onClick={e=>{e.stopPropagation();onArchive&&onArchive(p);}}
                    >
                      <i className="fa-solid fa-flag-checkered text-xs"></i>มีผลลัพธ์
                    </span>
                  ) : (
                    <span
                      className="tb-wiggle inline-flex items-center gap-1 border-2 border-amber-300 text-amber-600 hover:bg-amber-50 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                      title="คลิกเพื่อเปิดโปรไฟล์และบันทึกผลการรักษา"
                      onClick={e=>{e.stopPropagation();onOpen(p);}}
                    >
                      ยังไม่มีผล
                    </span>
                  )}
                </td>
                {/* จัดการ — fixed right */}
                <td className="py-2 px-4 text-center whitespace-nowrap">
                  <button onClick={e=>{e.stopPropagation();onOpen(p);}} className="text-teal-400 hover:text-teal-700 transition-colors p-1.5 rounded-lg hover:bg-teal-50">
                    <i className="fa-solid fa-file-medical"></i>
                  </button>
                </td>
              </tr>
            ))}{filtered.length > visiblePtCount && (
              <tr><td colSpan={visibleCols.length+3} className="p-3 text-center">
                <button type="button" onClick={()=>setVisiblePtCount(c=>c+50)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-1.5 rounded-full transition-colors">
                  <i className="fa-solid fa-chevron-down mr-1.5"></i>
                  ดูเพิ่มอีก {Math.min(50, filtered.length - visiblePtCount)} ราย
                  <span className="text-gray-400 font-normal ml-2">({visiblePtCount} / {filtered.length})</span>
                </button>
              </td></tr>
            )}</>)}
          </tbody>
        </table>
        <div className="p-3 bg-slate-50/50 border-t border-gray-100 text-xs text-gray-400 text-right">
          แสดง {filtered.length} จาก {patients.length} ราย
        </div>
        </div>
      </div>
    </div>
  );
}

// ===================== ARCHIVE LIST =====================
function ArchiveList({ patients, onOpen, archiveDashFilter, onClearArchiveDashFilter }) {
  const ARC_KEY = 'tbArchiveColCfg_v2';
  const isPos = r => /\+|scanty/i.test(r||'');
  const hasSputumDelayed = p => (p.sputum||[]).filter(s => s.tp !== 'M0').some(s => isPos(s.result));
  const [colConfig, setColConfig] = useState(() => {
    try { const s = localStorage.getItem(ARC_KEY); return s ? JSON.parse(s) : DEFAULT_ARCHIVE_COL_CONFIG; }
    catch { return DEFAULT_ARCHIVE_COL_CONFIG; }
  });
  const [search, setSearch] = useState('');
  const [showColMgr, setShowColMgr] = useState(false);

  useEffect(() => { try { localStorage.setItem(ARC_KEY, JSON.stringify(colConfig)); } catch {} }, [colConfig]);
  const toggleCol = id => setColConfig(c => c.map(col => col.id===id ? {...col, visible:!col.visible} : col));
  const moveCol = (id, dir) => setColConfig(c => {
    const i = c.findIndex(col => col.id===id); const ni = i+dir;
    if (ni<0||ni>=c.length) return c;
    const next=[...c]; [next[i],next[ni]]=[next[ni],next[i]]; return next;
  });
  const resetCols = () => { setColConfig(DEFAULT_ARCHIVE_COL_CONFIG); localStorage.removeItem(ARC_KEY); };
  const visibleCols = colConfig.filter(c => c.visible);

  const getOutcomeStyle = type => { const o=(window.OUTCOME_TYPES||[]).find(x=>x.value===type); return o?o.color:'text-gray-600 bg-gray-100'; };
  const getOutcomeLabel = type => { const o=(window.OUTCOME_TYPES||[]).find(x=>x.value===type); return o?o.label.split(' (')[0]:type; };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.hn.includes(q) || (p.subdistrict||'').includes(q);
    const matchFilter = !archiveDashFilter ||
      (archiveDashFilter === 'delayed' && hasSputumDelayed(p)) ||
      (archiveDashFilter === 'success' && ['Cured','Completed'].includes(p.outcome?.type));
    return matchSearch && matchFilter;
  });

  // v0.7.17.1 — Lazy render: 50 รายแรก + ปุ่ม "ดูเพิ่ม"
  const [visibleArcCount, setVisibleArcCount] = useState(50);
  useEffect(() => { setVisibleArcCount(50); }, [search, archiveDashFilter]);
  const visibleArchive = filtered.slice(0, visibleArcCount);

  return (
    <div className="flex flex-col gap-3 tb-fade h-full">

      {/* Column manager panel */}
      {showColMgr && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm tb-fade flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-700"><i className="fa-solid fa-table-columns mr-2 text-teal-600"></i>จัดการคอลัม</p>
            <button onClick={resetCols} className="text-xs text-gray-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-rotate-left mr-1"></i>รีเซ็ต</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {colConfig.map((col, i) => (
              <div key={col.id} className={`flex items-center gap-1 border rounded-xl px-2.5 py-1.5 text-xs transition-all ${col.visible?'bg-teal-50 border-teal-300 text-teal-800':'bg-gray-50 border-gray-200 text-gray-400'}`}>
                <button onClick={()=>toggleCol(col.id)} className="font-semibold mr-1">
                  {col.visible?<i className="fa-solid fa-check text-teal-500 w-3"></i>:<i className="fa-regular fa-square w-3 text-gray-300"></i>}
                  <span className="ml-1.5">{col.label}</span>
                </button>
                <button onClick={()=>moveCol(col.id,-1)} disabled={i===0} className="text-gray-300 hover:text-teal-500 disabled:opacity-20 px-0.5"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                <button onClick={()=>moveCol(col.id,1)} disabled={i===colConfig.length-1} className="text-gray-300 hover:text-teal-500 disabled:opacity-20 px-0.5"><i className="fa-solid fa-chevron-right text-xs"></i></button>
              </div>
            ))}
            <div className="flex items-center gap-1 border-2 border-dashed border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-amber-600 font-semibold">
              <i className="fa-solid fa-lock text-xs mr-1"></i>ผลการรักษา
            </div>
            <div className="flex items-center gap-1 border-2 border-dashed border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-amber-600 font-semibold">
              <i className="fa-solid fa-lock text-xs mr-1"></i>วันที่ครบ
            </div>
            <div className="flex items-center gap-1 border-2 border-dashed border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-amber-600 font-semibold">
              <i className="fa-solid fa-lock text-xs mr-1"></i>วันที่บันทึกผล
            </div>
          </div>
        </div>
      )}

      {/* Archive dash filter banner */}
      {archiveDashFilter && (() => {
        const isSuccess = archiveDashFilter === 'success';
        const bc = isSuccess
          ? { bg:'#ecfdf5', border:'#10b981', text:'#064e3b' }
          : { bg:'#fffbeb', border:'#f59e0b', text:'#78350f' };
        return (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm flex-shrink-0 shadow-sm font-medium"
            style={{background:bc.bg, border:`1.5px solid ${bc.border}`, color:bc.text}}>
            <i className="fa-solid fa-filter text-xs" style={{color:bc.border}}></i>
            <span>กรองจาก Dashboard: <strong>{isSuccess ? 'Cured + Treatment Completed' : 'ผู้ป่วยจบการรักษา + มีประวัติ Sputum Delayed'}</strong></span>
            <button type="button" onClick={onClearArchiveDashFilter}
              className="ml-auto flex items-center gap-1 text-xs font-bold hover:opacity-60 transition-opacity px-1"
              style={{color:bc.text}}>
              <i className="fa-solid fa-xmark"></i> ล้าง
            </button>
          </div>
        );
      })()}

      {/* Search + col manager */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหา HN, ชื่อ, ตำบล..."
            className="w-full py-1.5 pl-8 pr-3 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-teal-200 outline-none shadow-sm"/>
          <i className="fa-solid fa-search absolute left-2.5 top-2 text-gray-400 text-xs"></i>
        </div>
        <button type="button" onClick={()=>setShowColMgr(v=>!v)} title="จัดการคอลัม"
          className={`py-1.5 px-3 border rounded-xl text-sm transition-colors flex-shrink-0 ${showColMgr?'bg-teal-600 text-white border-teal-600':'bg-white text-gray-500 border-gray-200 hover:border-teal-300'}`}>
          <i className="fa-solid fa-table-columns"></i>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="w-full h-full overflow-auto">
        <table className="w-full min-w-max text-left">
          <thead className="bg-teal-600 text-white text-xs uppercase tracking-wide border-b border-teal-400">
            <tr>
              <th className="py-2 px-4 font-semibold sticky left-0 bg-teal-600 z-10 whitespace-nowrap">HN / ชื่อ</th>
              {visibleCols.map(col => <th key={col.id} className="py-2 px-4 font-semibold whitespace-nowrap">{col.label}</th>)}
              <th className="py-2 px-4 font-semibold whitespace-nowrap text-center">ผลการรักษา</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap">วันที่ครบ</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap">วันที่บันทึกผล</th>
              <th className="py-2 px-4 font-semibold text-center">ดูประวัติ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-100 text-sm">
            {filtered.length === 0 ? (
              <tr><td colSpan={visibleCols.length+5} className="p-10 text-center text-gray-400">
                <i className="fa-solid fa-box-archive text-2xl mb-2 block text-gray-300"></i>
                {patients.length === 0 ? 'ยังไม่มีผู้ป่วยที่จบการรักษา' : 'ไม่พบผู้ป่วยที่ค้นหา'}
              </td></tr>
            ) : (<>{visibleArchive.map(p => (
              <tr key={p.id} onClick={()=>onOpen(p)} className="tb-pt-row hover:bg-teal-50/40 transition-colors cursor-pointer group">
                <td className="py-2 px-4 sticky left-0 bg-white group-hover:bg-teal-50/30 z-10 transition-colors">
                  <p className="font-mono text-gray-400 text-xs">{p.hn}</p>
                  <p className="font-bold text-gray-800 group-hover:text-teal-700 mt-0.5">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.patientType||'New'} · {p.diseaseLocation==='Extra-pulmonary'?'Extra-pulmonary':p.diseaseLocation||'Pulmonary'}</p>
                </td>
                {visibleCols.map(col => renderPatientCell(col.id, p))}
                {/* ผลการรักษา — fixed */}
                <td className="py-2 px-4 whitespace-nowrap text-center">
                  {p.outcome?.type ? (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getOutcomeStyle(p.outcome.type)}`}>
                      <i className="fa-solid fa-circle-check text-xs"></i>
                      {getOutcomeLabel(p.outcome.type)}
                    </span>
                  ) : <span className="text-gray-400 text-xs">—</span>}
                </td>
                {/* วันที่ครบ — fixed */}
                <td className="py-2 px-4 text-xs whitespace-nowrap font-mono text-gray-600">
                  {p.outcome?.endDate ? fmtDateApp(p.outcome.endDate) : <span className="text-gray-300">—</span>}
                </td>
                {/* วันที่บันทึกผล — fixed */}
                <td className="py-2 px-4 text-xs whitespace-nowrap font-mono text-gray-600">
                  {p.outcome?.date ? fmtDateApp(p.outcome.date) : '—'}
                </td>
                <td className="py-2 px-4 text-center whitespace-nowrap">
                  <button onClick={e=>{e.stopPropagation();onOpen(p);}} className="text-teal-400 hover:text-teal-700 transition-colors p-1.5 rounded-lg hover:bg-teal-50">
                    <i className="fa-solid fa-file-medical"></i>
                  </button>
                </td>
              </tr>
            ))}{filtered.length > visibleArcCount && (
              <tr><td colSpan={visibleCols.length+5} className="p-3 text-center">
                <button type="button" onClick={()=>setVisibleArcCount(c=>c+50)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-1.5 rounded-full transition-colors">
                  <i className="fa-solid fa-chevron-down mr-1.5"></i>
                  ดูเพิ่มอีก {Math.min(50, filtered.length - visibleArcCount)} ราย
                  <span className="text-gray-400 font-normal ml-2">({visibleArcCount} / {filtered.length})</span>
                </button>
              </td></tr>
            )}</>)}
          </tbody>
        </table>
        <div className="p-3 bg-slate-50/50 border-t border-gray-100 text-xs text-gray-400 text-right">
          จบการรักษาทั้งหมด {filtered.length} ราย
        </div>
        </div>
      </div>
    </div>
  );
}

// ===================== ALL PATIENTS PAGE (hidden — เข้าได้จาก Dashboard KPI เท่านั้น) =====================
function AllPatientsPage({ patients, archivePatients, onOpen, onBack }) {
  const [search, setSearch] = useState('');
  const allPts = [...patients, ...(archivePatients||[])];
  const getOutcomeStyle = type => { const o=(window.OUTCOME_TYPES||[]).find(x=>x.value===type); return o?o.color:'text-gray-600 bg-gray-100'; };
  const getOutcomeLabel = type => { const o=(window.OUTCOME_TYPES||[]).find(x=>x.value===type); return o?o.label.split(' (')[0]:type; };
  const filtered = allPts.filter(p => { const q=search.toLowerCase(); return !q||p.name.toLowerCase().includes(q)||p.hn.includes(q)||(p.subdistrict||'').toLowerCase().includes(q); });
  // v0.7.17.1 — Lazy render
  const [visibleAllCount, setVisibleAllCount] = useState(50);
  useEffect(() => { setVisibleAllCount(50); }, [search]);
  const visibleAll = filtered.slice(0, visibleAllCount);
  return (
    <div className="flex flex-col gap-3 tb-fade h-full">
      <div className="flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors px-4 py-2 rounded-xl flex-shrink-0 shadow-sm">
          <i className="fa-solid fa-arrow-left text-xs"></i>กลับ Dashboard
        </button>
        <div className="relative flex-1 max-w-xs">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหา HN, ชื่อ, ตำบล..."
            className="w-full py-1.5 pl-8 pr-3 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-teal-200 outline-none shadow-sm"/>
          <i className="fa-solid fa-search absolute left-2.5 top-2 text-gray-400 text-xs"></i>
        </div>
        <div className="flex items-center gap-2 ml-auto text-xs">
          <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-bold">กำลังรักษา: {patients.length}</span>
          <span className="bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-bold">จบแล้ว: {(archivePatients||[]).length}</span>
          <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold">รวม: {allPts.length}</span>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="w-full h-full overflow-auto">
        <table className="w-full min-w-max text-left">
          <thead className="bg-teal-600 text-white text-xs uppercase tracking-wide border-b border-teal-400">
            <tr>
              <th className="py-2 px-4 font-semibold sticky left-0 bg-teal-600 z-10 whitespace-nowrap">HN / ชื่อ</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap">อายุ / เพศ / ตำบล</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap">ชนิด TB / สูตรยา</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap">ความคืบหน้า</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap text-center">สถานะ / ผลการรักษา</th>
              <th className="py-2 px-4 font-semibold text-center whitespace-nowrap">ดูประวัติ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-100 text-sm">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-400"><i className="fa-solid fa-user-slash text-2xl mb-2 block text-gray-300"></i>ไม่พบผู้ป่วย</td></tr>
            ) : (<>{visibleAll.map(p => (
              <tr key={p.id} onClick={()=>onOpen(p)} className="tb-pt-row hover:bg-teal-50/40 transition-colors cursor-pointer group">
                <td className="py-2 px-4 sticky left-0 bg-white group-hover:bg-teal-50/30 z-10 transition-colors">
                  <p className="font-mono text-gray-400 text-xs">{p.hn}</p>
                  <p className="font-bold text-gray-800 group-hover:text-teal-700 mt-0.5">{p.name}</p>
                  <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-semibold mt-0.5 ${p.archived?'bg-teal-50 text-teal-600':'bg-amber-50 text-amber-600'}`}>
                    {p.archived ? <><i className="fa-solid fa-box-archive text-xs"></i>จบแล้ว</> : <><i className="fa-solid fa-lungs text-xs"></i>Active</>}
                  </span>
                </td>
                {renderPatientCell('info', p)}
                {renderPatientCell('tb_regimen', p)}
                {renderPatientCell('progress', p)}
                <td className="py-2 px-4 whitespace-nowrap text-center">
                  {p.archived && p.outcome?.type ? (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getOutcomeStyle(p.outcome.type)}`}>
                      <i className="fa-solid fa-circle-check text-xs"></i>{getOutcomeLabel(p.outcome.type)}
                    </span>
                  ) : (
                    <StatusBadge status={p.status}/>
                  )}
                </td>
                <td className="py-2 px-4 text-center whitespace-nowrap">
                  <button onClick={e=>{e.stopPropagation();onOpen(p);}} className="text-teal-400 hover:text-teal-700 transition-colors p-1.5 rounded-lg hover:bg-teal-50">
                    <i className="fa-solid fa-file-medical"></i>
                  </button>
                </td>
              </tr>
            ))}{filtered.length > visibleAllCount && (
              <tr><td colSpan={6} className="p-3 text-center">
                <button type="button" onClick={()=>setVisibleAllCount(c=>c+50)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-1.5 rounded-full transition-colors">
                  <i className="fa-solid fa-chevron-down mr-1.5"></i>
                  ดูเพิ่มอีก {Math.min(50, filtered.length - visibleAllCount)} ราย
                  <span className="text-gray-400 font-normal ml-2">({visibleAllCount} / {filtered.length})</span>
                </button>
              </td></tr>
            )}</>)}
          </tbody>
        </table>
        <div className="p-3 bg-slate-50/50 border-t border-gray-100 text-xs text-gray-400 text-right">
          แสดง {filtered.length} จาก {allPts.length} ราย · กำลังรักษา {patients.length} · จบแล้ว {(archivePatients||[]).length}
        </div>
        </div>
      </div>
    </div>
  );
}

// ===================== WEEKLY PREP =====================
function WeeklyPrep({ patients, onOpen }) {
  const upcoming = patients.filter(p => p.daysUntil <= 7).sort((a, b) => a.daysUntil - b.daysUntil);
  const [printed, setPrinted] = useState(false);
  return (
    <div className="space-y-5 tb-fade">
      <div className="bg-gradient-to-r from-teal-800 to-teal-600 p-6 rounded-2xl text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold mb-1">เตรียมเคสรายสัปดาห์</h2>
          <p className="text-teal-100 text-sm"><i className="fa-solid fa-circle-info mr-1"></i>ดึงผู้ป่วยนัดล่วงหน้า 7 วันอัตโนมัติ — {upcoming.length} ราย</p>
        </div>
        <button onClick={() => { setPrinted(true); setTimeout(() => setPrinted(false),2000); }}
          className={`px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors text-sm ${printed?'bg-teal-900 text-teal-300':'bg-white text-teal-800 hover:bg-teal-50'}`}>
          {printed ? <><i className="fa-solid fa-check mr-2"></i>ส่งไปยังเครื่องพิมพ์</> : <><i className="fa-solid fa-print mr-2"></i>พิมพ์ใบจัดยา</>}
        </button>
      </div>
      {upcoming.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl text-center text-gray-400 border border-gray-100"><i className="fa-solid fa-calendar-check text-4xl mb-3 block text-gray-300"></i>ไม่มีนัดในสัปดาห์นี้</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {upcoming.map(p => {
            const doses = calcDoses(p.weight, p.regimen, p.customDoses);
            const last = p.labs[p.labs.length-1];
            const isCrit = p.status === 'critical';
            return (
              <div key={p.id} className={`bg-white p-5 rounded-2xl shadow-sm border space-y-4 relative overflow-hidden ${isCrit?'border-red-200':'border-gray-200'}`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${isCrit?'bg-red-500':p.daysUntil<=2?'bg-amber-400':'bg-green-500'}`}></div>
                <div className="pl-2 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">HN: {p.hn} · {p.weight}kg · {p.regimen}</p>
                    {p.subdistrict && <p className="text-xs text-teal-600 font-medium mt-0.5">ต.{p.subdistrict}</p>}
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`text-sm font-bold ${p.daysUntil<=1?'text-red-600':'text-teal-700'}`}>นัด {p.nextAppt}</p>
                    <p className="text-xs text-gray-400">{p.daysUntil<=1?'🔴 พรุ่งนี้!':p.daysUntil<=3?`⚠ อีก ${p.daysUntil} วัน`:`อีก ${p.daysUntil} วัน`}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-xs grid grid-cols-2 gap-1.5">
                  {doses.map(d => (
                    <div key={d.key} className="flex justify-between items-center">
                      <span className="text-gray-500">{d.name.split('(')[0].trim()}</span>
                      <span className={`font-bold font-mono px-2 py-0.5 rounded ${d.status==='ok'?'bg-green-100 text-green-700':d.status==='high'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{d.tabs} tab ×30</span>
                    </div>
                  ))}
                </div>
                {isCrit && last && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                    <p className="text-xs font-bold text-red-800 mb-1"><i className="fa-solid fa-triangle-exclamation mr-1"></i>Critical Alert:</p>
                    <p className="text-sm text-red-700 font-semibold">ALT = {last.alt} U/L — HOLD ยาทั้งหมด</p>
                  </div>
                )}
                <button onClick={() => onOpen(p)} className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${isCrit?'bg-red-600 hover:bg-red-700 text-white':'bg-gray-50 hover:bg-teal-50 text-teal-700 border border-gray-200'}`}>
                  เตรียมเคส / ดูประวัติ <i className="fa-solid fa-arrow-right ml-1"></i>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== REPORTS =====================
function Reports({ patients }) {
  const [fb, setFb] = useState(null);
  const sim = t => { setFb(t); setTimeout(() => setFb(null), 2000); };
  const avgAdh = patients.length ? Math.round(patients.reduce((s,p) => s+p.adherence, 0) / patients.length) : 0;

  const allConsults = patients.flatMap(p => (p.visits||[]).filter(v=>v.consult?.type).map(v=>({...v, patientName:p.name, hn:p.hn})));
  const allDrps = patients.flatMap(p => (p.visits||[]).flatMap(v=>(v.drp||[]).map(d=>({...d, date:v.date, patientName:p.name, hn:p.hn}))));

  const exportAllDRP = () => {
    const rows = [['HN','ชื่อผู้ป่วย','วันที่','DRP Code','รายละเอียด DRP']];
    allDrps.forEach(d => rows.push([d.hn, d.patientName, d.date, d.type||'', d.note||'']));
    const csv = rows.map(r=>r.map(c=>'"'+String(c||'').replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='DRP_all_cases.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportDiagnosis = () => {
    const rows = [['HN','ชื่อผู้ป่วย','เดือนที่','วันที่','Specimen','AFB','Molecular Type','MTB Result','RIF','INH','SLD FLQS','SLD AG/CP','SLD ETO']];
    patients.forEach(p => {
      (p.sputum||[]).forEach(s => {
        const afb = (s.afbSamples&&s.afbSamples.length>0)
          ? s.afbSamples.filter(x=>x.result).map(x=>x.result==='Scanty'&&x.scantyCount?'Scanty '+x.scantyCount+' cells':x.result).join(' / ')
          : (s.result||'-');
        rows.push([
          p.hn, p.name,
          s.tp==='M0'?'วินิจฉัย':s.tp,
          s.date||'',
          s.specimenType||'Sputum',
          afb,
          s.molecType||'',
          s.mtbResult||s.genexpert||'',
          s.rifResult||'',
          s.inhResult||'',
          s.sldResults?.flqs||'',
          s.sldResults?.agcp||'',
          s.sldResults?.eto||'',
        ]);
      });
    });
    const csv = rows.map(r=>r.map(c=>'"'+(String(c||'')).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='Diagnosis_all_cases.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllConsult = () => {
    const rows = [['HN','ชื่อผู้ป่วย','วันที่','ประเภท Consult','รายละเอียด']];
    allConsults.forEach(v => rows.push([v.hn, v.patientName, v.date, v.consult?.type||'', v.consult?.note||'']));
    const csv = rows.map(r=>r.map(c=>'"'+String(c||'').replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='Consult_all_cases.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 tb-fade">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-file-excel"></i></div>
            <h3 className="font-bold text-gray-800">รายงาน Adherence & ทะเบียนผู้ป่วย</h3>
            <p className="text-sm text-gray-500 mt-2">สรุปรายชื่อผู้ป่วยทั้งหมด พร้อม Pill Count และประวัติขาดนัด</p>
            <div className="mt-3 bg-slate-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">ผู้ป่วยทั้งหมด: <strong>{patients.length}</strong></div>
              <div className="text-gray-500">Adherence เฉลี่ย: <strong className={avgAdh>=90?'text-green-600':'text-amber-600'}>{avgAdh}%</strong></div>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <select className="p-2 border border-gray-200 rounded-lg text-sm flex-1 bg-gray-50"><option>ตุลาคม 2567</option><option>กันยายน 2567</option></select>
            <button onClick={() => sim('excel')} className={'px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors '+(fb==='excel'?'bg-green-700':'bg-green-600 hover:bg-green-700')}>
              {fb==='excel' ? <><i className="fa-solid fa-check mr-1"></i>ส่งออกแล้ว!</> : 'Export Excel'}
            </button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-file-pdf"></i></div>
            <h3 className="font-bold text-gray-800">รายงานผลข้างเคียง (ADR & Lab)</h3>
            <p className="text-sm text-gray-500 mt-2">สรุปเคส Drug-Induced Hepatitis, Hyperuricemia, Visual loss</p>
            <div className="mt-3 bg-slate-50 p-3 rounded-xl text-sm">
              <span className="text-gray-500">เคส ADR: <strong className="text-red-600">{patients.filter(p=>p.status==='critical').length} ราย</strong></span>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <select className="p-2 border border-gray-200 rounded-lg text-sm flex-1 bg-gray-50"><option>ไตรมาส 3/2567</option></select>
            <button onClick={() => sim('pdf')} className={'px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors '+(fb==='pdf'?'bg-red-700':'bg-red-600 hover:bg-red-700')}>
              {fb==='pdf' ? <><i className="fa-solid fa-check mr-1"></i>ส่งออกแล้ว!</> : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Diagnosis Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-teal-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-microscope"></i></div>
            <h3 className="font-bold text-gray-800">ส่งออกผล Diagnosis ทุกเคส</h3>
            <p className="text-sm text-gray-500 mt-2">AFB, GeneXpert-PCR, RIF/INH Resistance, SLD ทุกผู้ป่วย</p>
            <div className="mt-3 bg-teal-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">ผู้ป่วยที่มีผล Dx: <strong className="text-teal-700">{patients.filter(p=>(p.sputum||[]).length>0).length} ราย</strong></div>
              <div className="text-gray-500">รายการทั้งหมด: <strong className="text-teal-700">{patients.reduce((s,p)=>s+(p.sputum||[]).length,0)} รายการ</strong></div>
            </div>
          </div>
          <button type="button" onClick={exportDiagnosis} className="mt-5 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-colors">
            <i className="fa-solid fa-file-csv mr-2"></i>Export Diagnosis ทุกเคส (.csv)
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-red-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-biohazard"></i></div>
            <h3 className="font-bold text-gray-800">เคสดื้อยา (Drug Resistant TB)</h3>
            <p className="text-sm text-gray-500 mt-2">รายชื่อผู้ป่วยที่พบ RIF / INH / SLD resistant</p>
            <div className="mt-3 bg-red-50 p-3 rounded-xl text-sm">
              <span className="text-gray-500">เคส Resistant: <strong className="text-red-600">{patients.filter(p=>p.hasResistance||(p.sputum||[]).some(s=>s.rifResult==='RIF resistant'||s.inhResult==='INH resistant')).length} ราย</strong></span>
            </div>
          </div>
          <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
            {patients.filter(p=>p.hasResistance||(p.sputum||[]).some(s=>s.rifResult==='RIF resistant'||s.inhResult==='INH resistant')).map(p=>(
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">{p.name}</span>
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  {(p.sputum||[]).some(s=>s.rifResult==='RIF resistant')?'RIF-R':''}{(p.sputum||[]).some(s=>s.inhResult==='INH resistant')?' INH-R':''}
                </span>
              </div>
            ))}
            {patients.filter(p=>p.hasResistance||(p.sputum||[]).some(s=>s.rifResult==='RIF resistant'||s.inhResult==='INH resistant')).length===0&&<p className="text-xs text-gray-400 text-center">ไม่พบเคสดื้อยา</p>}
          </div>
        </div>
      </div>

      {/* DRP + Consult System-wide Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-amber-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-comments"></i></div>
            <h3 className="font-bold text-gray-800">สรุป Consultation ทุกเคส</h3>
            <p className="text-sm text-gray-500 mt-2">รวม Consult ทุก Visit ของทุกผู้ป่วย แยกประเภท</p>
            <div className="mt-3 bg-amber-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Consult ทั้งหมด: <strong className="text-amber-700">{allConsults.length} รายการ</strong></div>
              <div className="text-gray-500">ผู้ป่วยที่มี: <strong>{new Set(allConsults.map(c=>c.hn)).size} ราย</strong></div>
            </div>
          </div>
          <button type="button" onClick={exportAllConsult} className="mt-5 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-colors">
            <i className="fa-solid fa-file-csv mr-2"></i>Export Consult ทุกเคส (.csv)
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-red-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-circle-exclamation"></i></div>
            <h3 className="font-bold text-gray-800">สรุป DRP ทุกเคส</h3>
            <p className="text-sm text-gray-500 mt-2">Drug Related Problems ทุก Visit ทุกผู้ป่วย แยก C-code</p>
            <div className="mt-3 bg-red-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">DRP ทั้งหมด: <strong className="text-red-700">{allDrps.length} รายการ</strong></div>
              <div className="text-gray-500">ผู้ป่วยที่มี: <strong>{new Set(allDrps.map(d=>d.hn)).size} ราย</strong></div>
            </div>
          </div>
          <button type="button" onClick={exportAllDRP} className="mt-5 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors">
            <i className="fa-solid fa-file-csv mr-2"></i>Export DRP ทุกเคส (.csv)
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200">
        <h3 className="font-bold text-gray-800 text-sm mb-4"><i className="fa-solid fa-chart-bar mr-2 text-teal-600"></i>Adherence รายผู้ป่วย</h3>
        <div className="space-y-3">
          {patients.map(p => (
            <div key={p.id} className="flex items-center gap-4">
              <div className="w-44 text-sm font-medium text-gray-700 truncate flex-shrink-0">{p.name}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                <div className={'h-5 rounded-full flex items-center justify-end pr-2 '+(p.adherence>=90?'bg-green-500':p.adherence>=70?'bg-amber-400':'bg-red-400')} style={{width:p.adherence+'%',transition:'width 0.7s ease'}}>
                  <span className="text-white text-xs font-bold">{p.adherence}%</span>
                </div>
              </div>
              <StatusBadge status={p.status}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================== ADMIN SETTINGS =====================
function AdminSettings({ settings, setSettings, setNav }) {
  const [newComorbidity, setNewComorbidity] = useState({ name: '', abbr: '' });
  const [newDrug, setNewDrug] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newLabField, setNewLabField] = useState({ label:'', key:'', unit:'', lo:'', hi:'', group:'lft' });
  const [activeTab, setActiveTab] = useState('comorbidity');


  const addComorbidity = () => {
    const name = newComorbidity.name.trim();
    const abbr = newComorbidity.abbr.trim().toUpperCase();
    if (!name || !abbr || settings.comorbidities.some(c => c.abbr === abbr)) return;
    setSettings(s => ({ ...s, comorbidities: [...s.comorbidities, { name, abbr }] }));
    setNewComorbidity({ name: '', abbr: '' });
  };
  const removeComorbidity = abbr => setSettings(s => ({ ...s, comorbidities: s.comorbidities.filter(c => c.abbr !== abbr) }));
  const addReason = () => {
    const v = newReason.trim();
    if (!v || (settings.restartReasons||[]).includes(v)) return;
    setSettings(s => ({ ...s, restartReasons: [...(s.restartReasons||[]), v] }));
    setNewReason('');
  };
  const removeReason = r => setSettings(s => ({ ...s, restartReasons: (s.restartReasons||[]).filter(x => x !== r) }));
  const [newRegimen, setNewRegimen] = useState('');
  const addRegimen = () => {
    const v = newRegimen.trim().toUpperCase();
    if (!v || (settings.regimens||[]).includes(v)) return;
    setSettings(s => ({ ...s, regimens: [...(s.regimens||[]), v] }));
    setNewRegimen('');
  };
  const removeRegimen = r => setSettings(s => ({ ...s, regimens: (s.regimens||[]).filter(x => x !== r) }));

  const addDrug = () => {
    const v = newDrug.trim();
    if (!v || settings.drugs.includes(v)) return;
    setSettings(s => ({ ...s, drugs: [...s.drugs, v] }));
    setNewDrug('');
  };
  const removeDrug = d => setSettings(s => ({ ...s, drugs: s.drugs.filter(x => x !== d) }));

  const addLabField = () => {
    if (!newLabField.label.trim() || !newLabField.key.trim()) return;
    const key = newLabField.key.trim().toLowerCase().replace(/\s/g,'_');
    const field = { key, label: newLabField.label, unit: newLabField.unit, lo: +newLabField.lo||0, hi: +newLabField.hi||999, critical: null };
    setSettings(s => {
      const labs = s.labGroups ? s.labGroups.map(g => g.id === newLabField.group ? {...g, fields:[...g.fields, field]} : g) : LAB_GROUPS.map(g => g.id === newLabField.group ? {...g, fields:[...g.fields, field]} : g);
      return { ...s, labGroups: labs };
    });
    setNewLabField({ label:'', key:'', unit:'', lo:'', hi:'', group:'lft' });
  };
  const removeLabField = (groupId, fieldKey) => {
    setSettings(s => {
      const base = s.labGroups || LAB_GROUPS;
      return { ...s, labGroups: base.map(g => g.id === groupId ? {...g, fields: g.fields.filter(f => f.key !== fieldKey)} : g) };
    });
  };

  const TagPill = ({ label, onRemove }) => (
    <span className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium hover:border-red-300 group transition-colors">
      {label}
      <button onClick={onRemove} className="text-gray-300 hover:text-red-500 transition-colors group-hover:text-red-400"><i className="fa-solid fa-xmark text-xs"></i></button>
    </span>
  );

  const adminTabs = [
    { id:'comorbidity', label:'โรคประจำตัว', icon:'fa-heart-pulse' },
    { id:'drugs', label:'ยาโรคร่วม', icon:'fa-capsules' },
    { id:'tb-drugs', label:'ยาวัณโรค', icon:'fa-prescription-bottle-medical' },
    { id:'lab', label:'ค่า Lab', icon:'fa-flask' },
    { id:'regimen', label:'สูตรยา', icon:'fa-pills' },
    { id:'restart', label:'เหตุผลเริ่มยาใหม่', icon:'fa-rotate-right' },
    { id:'interaction', label:'Drug Interaction', icon:'fa-triangle-exclamation' },
    { id:'consult', label:'Consult / DRP', icon:'fa-comments' },
  ];

  const effectiveLabGroups = settings.labGroups || LAB_GROUPS;

  return (
    <div className="space-y-5 tb-fade">
      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {adminTabs.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            className={'px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 '+(activeTab===t.id?'bg-teal-700 text-white shadow':'bg-white text-gray-600 border border-gray-200 hover:bg-teal-50')}>
            <i className={'fa-solid '+t.icon}></i>{t.label}
          </button>
        ))}
      </div>

      {/* Comorbidity */}
      {activeTab==='comorbidity'&&(
        <div className="bg-white p-6 rounded-2xl border border-gray-200 tb-fade">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-heart-pulse"></i></div>
            <div><h3 className="font-bold text-gray-800">โรคประจำตัว</h3><p className="text-xs text-gray-400">{settings.comorbidities.length} รายการ</p></div>
          </div>
          <div className="flex flex-wrap gap-2 min-h-20 bg-slate-50 p-3 rounded-xl mb-4">
            {settings.comorbidities.map(c => <TagPill key={c.abbr} label={`${c.name} (${c.abbr})`} onRemove={() => removeComorbidity(c.abbr)}/>)}
          </div>
          <p className="text-xs text-gray-400 mb-2"><i className="fa-solid fa-circle-info mr-1"></i>ชื่อเต็มแสดงใน Profile ผู้ป่วย · ชื่อย่อแสดงเป็น badge ในตาราง</p>
          <div className="grid grid-cols-[1fr_120px_auto] gap-2">
            <input value={newComorbidity.name} onChange={e => setNewComorbidity(n => ({...n, name: e.target.value}))} onKeyDown={e => e.key==='Enter'&&addComorbidity()} placeholder="ชื่อเต็ม เช่น โรคเกาต์" className="p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-300"/>
            <input value={newComorbidity.abbr} onChange={e => setNewComorbidity(n => ({...n, abbr: e.target.value}))} onKeyDown={e => e.key==='Enter'&&addComorbidity()} placeholder="ย่อ เช่น Gout" className="p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-300 font-mono text-center"/>
            <button onClick={addComorbidity} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-colors"><i className="fa-solid fa-plus"></i></button>
          </div>
        </div>
      )}

      {/* Drugs */}
      {activeTab==='drugs'&&(
        <div className="bg-white p-6 rounded-2xl border border-gray-200 tb-fade">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-capsules"></i></div>
            <div><h3 className="font-bold text-gray-800">รายการยาโรคร่วม</h3><p className="text-xs text-gray-400">{settings.drugs.length} รายการ</p></div>
          </div>
          <div className="flex flex-wrap gap-2 min-h-20 bg-slate-50 p-3 rounded-xl mb-4">
            {settings.drugs.map(d => <TagPill key={d} label={d} onRemove={() => removeDrug(d)}/>)}
          </div>
          <div className="flex gap-2">
            <input value={newDrug} onChange={e => setNewDrug(e.target.value)} onKeyDown={e => e.key==='Enter'&&addDrug()} placeholder="เพิ่มยา เช่น Omeprazole 20mg" className="flex-1 p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-300"/>
            <button onClick={addDrug} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"><i className="fa-solid fa-plus"></i></button>
          </div>

          {/* แผนพัฒนา — note ไว้กันลืม (โชว์ในเว็บ) */}
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-bold text-amber-800 mb-2"><i className="fa-solid fa-lightbulb mr-2"></i>แผนพัฒนาระบบยา (ยังพัฒนาไม่เสร็จ)</p>
            <ul className="text-xs text-amber-800 leading-relaxed list-disc pl-5 space-y-1">
              <li>เพิ่มรายการยาให้ครบ 100+ รายการ (ครอบคลุมยาที่พบบ่อยในเวชปฏิบัติ)</li>
              <li>จัดกลุ่มยาตามหมวด เช่น เบาหวาน / ความดัน-หัวใจ / ยาต้านไวรัส HIV / ระบบทางเดินอาหาร ฯลฯ</li>
              <li>เชื่อมรายการยานี้กับประวัติผู้ป่วย — เลือกยาโรคร่วมตอนสร้าง/แก้ไขเคสได้โดยตรง</li>
              <li>เชื่อมกับระบบตรวจปฏิกิริยาระหว่างยา (Drug Interaction) อัตโนมัติ</li>
              <li>ผู้ใช้เพิ่มยาที่ไม่มีในระบบเองได้ <span className="text-green-700 font-semibold">(ทำแล้ว — ช่องด้านบน)</span></li>
            </ul>
          </div>
        </div>
      )}

      {/* Lab fields */}
      {activeTab==='lab'&&(
        <div className="space-y-4 tb-fade">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
            <h3 className="font-bold text-blue-800 text-sm mb-3"><i className="fa-solid fa-flask mr-2"></i>เพิ่มค่า Lab ใหม่</h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div><label className="text-xs font-bold text-gray-600 block mb-1">กลุ่ม</label>
                <select value={newLabField.group} onChange={e=>setNewLabField(f=>({...f,group:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
                  {effectiveLabGroups.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-bold text-gray-600 block mb-1">ชื่อแสดง</label><input value={newLabField.label} onChange={e=>setNewLabField(f=>({...f,label:e.target.value}))} placeholder="เช่น GGT" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"/></div>
              <div><label className="text-xs font-bold text-gray-600 block mb-1">Key (code)</label><input value={newLabField.key} onChange={e=>setNewLabField(f=>({...f,key:e.target.value}))} placeholder="เช่น ggt" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white font-mono outline-none"/></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div><label className="text-xs font-bold text-gray-600 block mb-1">หน่วย</label><input value={newLabField.unit} onChange={e=>setNewLabField(f=>({...f,unit:e.target.value}))} placeholder="U/L" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"/></div>
              <div><label className="text-xs font-bold text-gray-600 block mb-1">ค่าต่ำสุด (normal)</label><input type="number" value={newLabField.lo} onChange={e=>setNewLabField(f=>({...f,lo:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"/></div>
              <div><label className="text-xs font-bold text-gray-600 block mb-1">ค่าสูงสุด (normal)</label><input type="number" value={newLabField.hi} onChange={e=>setNewLabField(f=>({...f,hi:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"/></div>
            </div>
            <div className="flex justify-end">
              <button onClick={addLabField} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"><i className="fa-solid fa-plus mr-1"></i>เพิ่ม Lab Field</button>
            </div>
          </div>
          {effectiveLabGroups.map(g => (
            <div key={g.id} className="bg-white p-5 rounded-2xl border border-gray-200">
              <h4 className="font-bold text-gray-700 text-sm mb-3">{g.label}</h4>
              <div className="flex flex-wrap gap-2">
                {g.fields.map(f => (
                  <span key={f.key} className="flex items-center gap-1.5 bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium group hover:border-red-300 transition-colors">
                    <span className="font-bold text-gray-700">{f.label}</span>
                    <span className="text-gray-400">{f.lo}–{f.hi} {f.unit}</span>
                    <button onClick={() => removeLabField(g.id, f.key)} className="text-gray-300 hover:text-red-500 transition-colors group-hover:text-red-400"><i className="fa-solid fa-xmark text-xs"></i></button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regimen */}
      {activeTab==='regimen'&&(
        <div className="bg-white p-6 rounded-2xl border border-gray-200 tb-fade">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-pills"></i></div>
            <div><h3 className="font-bold text-gray-800">สูตรยามาตรฐาน</h3><p className="text-xs text-gray-400">สูตรยาที่แสดงใน dropdown หน้าลงทะเบียน — {(settings.regimens||[]).length} สูตร</p></div>
          </div>
          <div className="flex flex-wrap gap-2 min-h-16 bg-slate-50 p-3 rounded-xl mb-4">
            {(settings.regimens||[]).map(r => (
              <span key={r} className="flex items-center gap-1.5 bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full text-sm font-mono font-bold hover:border-red-300 group transition-colors">
                {r}
                <button onClick={() => removeRegimen(r)} className="text-gray-300 hover:text-red-500 transition-colors group-hover:text-red-400"><i className="fa-solid fa-xmark text-xs"></i></button>
              </span>
            ))}
            <span className="bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-semibold">+ อื่นๆ (กรอกเอง)</span>
          </div>
          <div className="flex gap-2">
            <input value={newRegimen} onChange={e => setNewRegimen(e.target.value)} onKeyDown={e => e.key==='Enter'&&addRegimen()} placeholder="เช่น 4RH หรือ BPaLM" className="flex-1 p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-purple-300 font-mono"/>
            <button onClick={addRegimen} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-colors"><i className="fa-solid fa-plus"></i></button>
          </div>
        </div>
      )}

      {/* Restart Reasons */}
      {activeTab==='restart'&&(
        <div className="bg-white p-6 rounded-2xl border border-gray-200 tb-fade">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-rotate-right"></i></div>
            <div><h3 className="font-bold text-gray-800">เหตุผลที่เริ่มยาใหม่</h3><p className="text-xs text-gray-400">ใช้เป็น dropdown ในแถบ "ประวัติสูตรยา" ของผู้ป่วย — {(settings.restartReasons||[]).length} รายการ</p></div>
          </div>
          <div className="flex flex-col gap-2 min-h-24 bg-slate-50 p-3 rounded-xl mb-4">
            {(settings.restartReasons||[]).map((r,i) => (
              <div key={`${i}-${r}`} className="flex items-center justify-between bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:border-red-200 group transition-colors">
                <span><span className="text-gray-400 font-mono text-xs mr-2">{i+1}.</span>{r}</span>
                <button onClick={() => removeReason(r)} className="text-gray-300 hover:text-red-500 transition-colors group-hover:text-red-400 ml-2 flex-shrink-0"><i className="fa-solid fa-xmark text-xs"></i></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newReason} onChange={e => setNewReason(e.target.value)} onKeyDown={e => e.key==='Enter'&&addReason()} placeholder="เช่น เริ่มใหม่หลัง MDR-TB confirmed" className="flex-1 p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-orange-300"/>
            <button onClick={addReason} className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors"><i className="fa-solid fa-plus"></i></button>
          </div>
        </div>
      )}

      {/* Drug Interaction admin */}
      {activeTab==='interaction'&&(
        <div className="space-y-4 tb-fade">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
            <p className="font-bold text-amber-800 text-sm mb-1"><i className="fa-solid fa-triangle-exclamation mr-2"></i>Custom Drug Interactions</p>
            <p className="text-xs text-amber-600">เพิ่มคู่ยาที่ต้องการแจ้งเตือนเพิ่มเติม นอกเหนือจากที่ระบบมีอยู่แล้ว</p>
          </div>

          {/* Built-in interactions (read-only display) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <h4 className="font-bold text-gray-700 text-sm mb-3"><i className="fa-solid fa-lock mr-1 text-gray-400"></i>Built-in Drug Interactions (ระบบ)</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {[
                {s:'high',  drug:'Rifampicin + ARV',         effect:'CYP3A4 induction — ลดระดับ ARV',           trigger:'HIV'},
                {s:'medium',drug:'Isoniazid + OHA/Insulin',  effect:'INH รบกวนน้ำตาล + เพิ่มเสี่ยง Neuropathy',trigger:'DM'},
                {s:'medium',drug:'Rifampicin + CCB',          effect:'ลดระดับ CCB อย่างมีนัยสำคัญ',             trigger:'HT'},
                {s:'high',  drug:'Ethambutol + CKD',          effect:'EMB สะสมในไต เสี่ยง Optic Neuritis',      trigger:'CKD'},
                {s:'high',  drug:'INH/RIF + Cirrhosis',       effect:'เสี่ยง Hepatotoxicity สูง',               trigger:'ตับแข็ง'},
                {s:'high',  drug:'Rifampicin + Warfarin',     effect:'ลด INR อย่างมาก',                         trigger:'Warfarin'},
                {s:'high',  drug:'Rifampicin + Phenytoin',    effect:'ลดระดับ Phenytoin',                       trigger:'Phenytoin'},
                {s:'high',  drug:'Rifampicin + Azole',        effect:'ลดระดับ Azole antifungal',                trigger:'Fluconazole'},
                {s:'high',  drug:'Rifampicin + Methadone',    effect:'ลดระดับ Methadone',                       trigger:'Methadone'},
                {s:'medium',drug:'Rifampicin + OCP',          effect:'ลดประสิทธิภาพยาคุมกำเนิด',               trigger:'OCP'},
              ].map((item,i)=>(
                <div key={i} className={'flex items-start gap-3 p-2 rounded-lg '+(item.s==='high'?'bg-red-50':'bg-amber-50')}>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${item.s==='high'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{item.s==='high'?'High':'Med'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700">{item.drug}</p>
                    <p className="text-xs text-gray-500">{item.effect}</p>
                    <p className="text-xs text-gray-400">Trigger: {item.trigger}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom interactions */}
          <div className="bg-white p-5 rounded-2xl border border-red-200">
            <h4 className="font-bold text-gray-700 text-sm mb-3"><i className="fa-solid fa-plus mr-1 text-red-500"></i>เพิ่ม Drug Interaction (Custom)</h4>
            <div className="space-y-3">
              {(settings.customDrugInteractions||[]).map((ci,i)=>(
                <div key={ci.id || `${i}-${ci.drug||''}`} className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-[80px_1fr_1fr_24px] gap-2 items-start">
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">ระดับ</label>
                      <select value={ci.severity||'medium'} onChange={e=>{const arr=[...(settings.customDrugInteractions||[])];arr[i]={...arr[i],severity:e.target.value};setSettings(s=>({...s,customDrugInteractions:arr}));}} className="w-full p-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none">
                        <option value="high">High</option><option value="medium">Medium</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">คู่ยา</label>
                      <input value={ci.drug||''} onChange={e=>{const arr=[...(settings.customDrugInteractions||[])];arr[i]={...arr[i],drug:e.target.value};setSettings(s=>({...s,customDrugInteractions:arr}));}} placeholder="เช่น Rifampicin + Statin" className="w-full p-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"/>
                    </div>
                    <div className="flex items-end">
                      <button type="button" onClick={()=>setSettings(s=>({...s,customDrugInteractions:(s.customDrugInteractions||[]).filter((_,j)=>j!==i)}))} className="p-1.5 text-red-400 hover:text-red-600 transition-colors"><i className="fa-solid fa-trash text-xs"></i></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-0.5">ผลกระทบ (Effect)</label>
                    <input value={ci.effect||''} onChange={e=>{const arr=[...(settings.customDrugInteractions||[])];arr[i]={...arr[i],effect:e.target.value};setSettings(s=>({...s,customDrugInteractions:arr}));}} placeholder="อธิบายผลกระทบ" className="w-full p-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"/>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">คำแนะนำ (Rec)</label>
                      <input value={ci.rec||''} onChange={e=>{const arr=[...(settings.customDrugInteractions||[])];arr[i]={...arr[i],rec:e.target.value};setSettings(s=>({...s,customDrugInteractions:arr}));}} placeholder="คำแนะนำ" className="w-full p-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"/>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">Trigger (โรค/ยา)</label>
                      <input value={ci.triggerComorbidity||''} onChange={e=>{const arr=[...(settings.customDrugInteractions||[])];arr[i]={...arr[i],triggerComorbidity:e.target.value};setSettings(s=>({...s,customDrugInteractions:arr}));}} placeholder="เช่น HIV หรือ Statin" className="w-full p-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"/>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={()=>setSettings(s=>({...s,customDrugInteractions:[...(s.customDrugInteractions||[]),{severity:'medium',drug:'',effect:'',rec:'',triggerComorbidity:'',triggerDrug:''}]}))} className="w-full py-2 border-2 border-dashed border-red-300 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                <i className="fa-solid fa-plus mr-1"></i>เพิ่ม Drug Interaction ใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consult / DRP types */}
      {activeTab==='tb-drugs'&&(
        <div className="bg-white p-6 rounded-2xl border border-gray-200 tb-fade">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-prescription-bottle-medical"></i></div>
            <div>
              <h3 className="font-bold text-gray-800">ยาวัณโรคในระบบ</h3>
              <p className="text-xs text-gray-400">รายการยา TB ที่ระบบรู้จัก พร้อมความแรงและช่วงขนาดยา</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="p-3 text-left rounded-l-xl">ตัวยา</th>
                <th className="p-3 text-left">ชื่อ</th>
                <th className="p-3 text-left">ความแรงที่มี</th>
                <th className="p-3 text-left">ช่วง mg/kg</th>
                <th className="p-3 text-left rounded-r-xl">โดสสูงสุด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(DRUG_RANGES).map(([key, d]) => {
                const strengths = (window.HOSP_STRENGTHS||{})[key] || [{label:`${key}${d.strength}`, value:d.strength}];
                return (
                  <tr key={key}>
                    <td className="p-3 pl-4 font-black text-teal-700 text-base">{key}</td>
                    <td className="p-3 text-gray-700 font-medium">{d.name}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {strengths.map(s => (
                          <span key={String(s.value)} className="bg-teal-50 border border-teal-200 text-teal-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-gray-600 font-mono text-xs">{d.min}–{d.max} mg/kg</td>
                    <td className="p-3 text-gray-600 font-mono text-xs">{d.absMax} mg</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-gray-400"><i className="fa-solid fa-circle-info mr-1"></i>อนาคต: จะเพิ่มยา MDR-TB เช่น Bedaquiline, Linezolid, Clofazimine ที่นี่</p>
        </div>
      )}

      {activeTab==='consult'&&(
        <div className="grid grid-cols-2 gap-5 tb-fade">
          <div className="bg-white p-5 rounded-2xl border border-amber-200">
            <h3 className="font-bold text-amber-800 text-sm mb-3"><i className="fa-solid fa-comments mr-1"></i>ประเภท Consultation</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {CONSULT_TYPES.map((t,i) => <div key={i} className="flex items-center justify-between bg-amber-50 px-3 py-2 rounded-lg text-xs text-amber-800 font-medium"><span>{t}</span></div>)}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-red-200">
            <h3 className="font-bold text-red-800 text-sm mb-3"><i className="fa-solid fa-exclamation-circle mr-1"></i>DRP Classification (C1–C8)</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {DRP_TYPES.map(t => <div key={t.code} className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg text-xs"><span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold font-mono">{t.code}</span><span className="text-red-700">{t.label}</span></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== KNOWLEDGE BASE =====================
function KnowledgeBase() {
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

// ===================== APP =====================
function App() {
  const [nav, setNavRaw] = useState('dashboard');
  const mainScrollRef = React.useRef(null);  // v0.7.17.3 — สำหรับ ScrollNav
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
    { id:'settings',      icon:'fa-gear',             label:'ตั้งค่าระบบ', divider:true },
    ...(currentUser?.role === 'admin' ? [{ id:'admin-users', icon:'fa-user-shield', label:'จัดการผู้ใช้', badge: pendingUserCount > 0 ? pendingUserCount : undefined }] : []),
    { id:'trash', icon:'fa-trash', label:'ถังขยะ', badge: currentUser?.role==='admin' && pendingDeleteRequests.length > 0 ? pendingDeleteRequests.length : undefined, greenBadge: currentUser?.role==='admin' && pendingDeleteRequests.length === 0 && cancelledDeleteCount > 0 },
    ...(currentUser?.role === 'admin' ? [{ id:'activity-log', icon:'fa-wave-square', label:'บันทึกกิจกรรม' }] : []),
    ...(currentUser?.role === 'admin' ? [{ id:'audit-log', icon:'fa-clock-rotate-left', label:'ประวัติลบถาวร' }] : []),
    { id:'changelog', icon:'fa-scroll', label:'ประวัติเวอร์ชั่น', divider:true, redDot: changelogUnseen },
  ];
  const titles = { dashboard:'Dashboard', 'patient-list':'ทะเบียนผู้ป่วย Active', 'archive-list':'ทะเบียนจบการรักษา', 'all-patients':'ทะเบียนผู้ป่วยทั้งหมด', 'add-patient':'ลงทะเบียนผู้ป่วยใหม่', 'weekly-prep':'เตรียมเคสรายสัปดาห์', reports:'รายงาน และ สถิติ', knowledge:'คลังความรู้วัณโรค', settings:'ตั้งค่าระบบ', 'admin-users':'จัดการผู้ใช้', trash:'ถังขยะ', 'activity-log':'บันทึกกิจกรรม', 'audit-log':'ประวัติการลบถาวร', changelog:'ประวัติเวอร์ชั่น' };
  const pageIcons = { dashboard:'fa-chart-pie', 'patient-list':'fa-users', 'archive-list':'fa-box-archive', 'all-patients':'fa-users', 'add-patient':'fa-user-plus', 'weekly-prep':'fa-calendar-check', reports:'fa-file-contract', knowledge:'fa-book-open-reader', settings:'fa-gear', 'admin-users':'fa-user-shield', trash:'fa-trash', 'activity-log':'fa-wave-square', 'audit-log':'fa-clock-rotate-left', changelog:'fa-scroll' };

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
      <div style={{position:'relative',width:sidebarOpen?'260px':'72px',transition:'width 0.2s ease',flexShrink:0,zIndex:40}} onMouseEnter={()=>setSidebarHovered(true)} onMouseLeave={()=>setSidebarHovered(false)}>
      <aside style={{width:'100%',height:'100%',overflow:'hidden',display:'flex',flexDirection:'column',background:'#fff',borderRight:'1px solid #e5e7eb'}}>

        {/* Header: icon คงที่ + label fade */}
        <div style={{display:'flex',alignItems:'center',height:'64px',padding:'0 10px',borderBottom:'1px solid #e5e7eb',flexShrink:0}}>
          <div onClick={handleLogoClick} title="กลับหน้าหลัก" style={{display:'flex',alignItems:'center',flex:1,cursor:'pointer',minWidth:0,height:'100%',borderRadius:'8px',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{width:'56px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
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
                {/* v0.7.15.1 — icon คงที่ 36px + ขยับขวา 10px ตอน collapsed ให้ center ตรงกับ logo ปอด */}
                <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative',marginLeft:sidebarOpen?'0':'10px',transition:'margin-left 0.2s ease'}}>
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
            <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:sidebarOpen?'0':'10px',transition:'margin-left 0.2s ease'}}>
              <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#0f766e',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:(currentUser?.avatar||'').length>3?'8px':'11px'}}>{currentUser?.avatar || '?'}</div>
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
            <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
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
            <div onClick={()=>setShowAbout(true)} title="ดูข้อมูลระบบ" style={{display:'flex',justifyContent:'center',cursor:'pointer'}}>
              <i className="fa-solid fa-circle-info" style={{fontSize:'12px',color:'#cbd5e1'}}></i>
            </div>
          )}
        </div>

      </aside>

      {/* Floating chevron toggle — v0.7.15.1: ขอบเทลตลอด + hover เทลทั้งอัน + icon ขาว */}
      <button
        onClick={()=>setSidebarOpen(o=>!o)}
        title={sidebarOpen?'ซ่อนเมนู':'แสดงเมนู'}
        style={{position:'absolute',right:'-12px',top:'20px',width:'24px',height:'24px',borderRadius:'50%',border:'1.5px solid #0d9488',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,transition:'all 0.15s',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}
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
          {!dbLoading && nav==='dashboard'     && <Dashboard patients={patients.filter(p=>!p.archived)} archivePatients={patients.filter(p=>p.archived)} onDashFilter={f=>{setDashFilter(f);setNav('patient-list');}} onGoArchiveDelayed={()=>{setArchiveDashFilter('delayed');setNav('archive-list');}} onGoAllPatients={()=>setNav('all-patients')} onGoArchiveSuccess={()=>{setArchiveDashFilter('success');setNav('archive-list');}} onOpen={setClinical}/>}
          {!dbLoading && nav==='all-patients'  && <AllPatientsPage patients={patients.filter(p=>!p.archived)} archivePatients={patients.filter(p=>p.archived)} onOpen={setClinical} onBack={()=>setNav('dashboard')}/>}
          {!dbLoading && nav==='patient-list'  && <PatientList patients={patients.filter(p=>!p.archived)} onAdd={addPatient} onOpen={setClinical} settings={settings} dashFilter={dashFilter} onClearDashFilter={()=>setDashFilter(null)} search={ptSearch} filter={ptFilter} showColMgr={ptShowColMgr} onToggleColMgr={()=>setPtShowColMgr(v=>!v)} onArchive={archivePatient}/>}
          {!dbLoading && nav==='archive-list'  && <ArchiveList patients={patients.filter(p=>p.archived)} onOpen={setClinical} archiveDashFilter={archiveDashFilter} onClearArchiveDashFilter={()=>setArchiveDashFilter(null)}/>}
          {!dbLoading && nav==='add-patient'   && <AddPatientPage onBack={()=>{setFormDirty(false);setNav('patient-list');}} onAdd={p=>{addPatient(p);setFormDirty(false);setNav('patient-list');}} settings={settings} onDirtyChange={setFormDirty}/>}
          {!dbLoading && nav==='weekly-prep'   && <WeeklyPrep patients={patients.filter(p=>!p.archived)} onOpen={setClinical}/>}
          {!dbLoading && nav==='reports'       && <Reports patients={patients}/>}
          {!dbLoading && nav==='knowledge'     && <KnowledgeBase/>}
          {!dbLoading && nav==='settings'      && <AdminSettings settings={settings} setSettings={setSettings} setNav={setNav}/>}
          {!dbLoading && nav==='admin-users'   && <AdminUsersTab currentUser={currentUser} onPendingChange={setPendingUserCount} highlightUserId={highlightUserId} onClearHighlight={()=>setHighlightUserId(null)}/>}
          {!dbLoading && nav==='trash'         && <TrashList currentUser={currentUser} onRestore={restorePatient} onHardDelete={hardDeletePatient} pendingDeleteRequests={pendingDeleteRequests} onApproveDelete={approveDeleteRequest} onRejectDelete={rejectDeleteRequest} onAcknowledgeCancelled={async () => { await window.acknowledgeCancelledRequests(); setCancelledDeleteCount(0); }}/>}
          {!dbLoading && nav==='activity-log'  && <ActivityLogTab/>}
          {!dbLoading && nav==='audit-log'     && <AuditLogTab/>}
          {!dbLoading && nav==='changelog'     && <ChangelogPage highlightCommentTarget={highlightCommentTarget} onClearHighlight={()=>setHighlightCommentTarget(null)}/>}
        </div>
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

const DEPARTMENTS = ['กลุ่มงานเภสัชกรรม','กลุ่มงานการพยาบาล','กลุ่มงานแพทย์','อื่นๆ'];

const HOSPITAL_TYPES = [
  'โรงพยาบาลศูนย์ (ระดับ A)',
  'โรงพยาบาลทั่วไป (ระดับ S)',
  'โรงพยาบาลทั่วไป (ระดับ M1)',
  'โรงพยาบาลชุมชน (ระดับ M2)',
  'โรงพยาบาลชุมชน (ระดับ F1)',
  'โรงพยาบาลชุมชน (ระดับ F2)',
  'โรงพยาบาลชุมชน (ระดับ F3)',
  'โรงพยาบาลเอกชน',
  'สำนักงานสาธารณสุข (สสจ./สสอ.)',
  'โรงพยาบาลส่งเสริมสุขภาพตำบล (รพ.สต.)',
];

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
function RequestEditModal({ field, currentValue, onClose }) {
  const [newValue, setNewValue] = React.useState('');
  const [reason,   setReason]   = React.useState('');
  const [busy,     setBusy]     = React.useState(false);
  const [sent,     setSent]     = React.useState(false);
  const {close, modalCls, overlayCls} = useModalAnim(onClose);

  const submit = async () => {
    if (!newValue.trim()) { alert('กรุณากรอกค่าใหม่'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/profile/request-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_name:  field.key,
          field_label: field.label,
          old_value:   currentValue || '',
          new_value:   newValue.trim(),
          reason:      reason.trim() || '',
        }),
      });
      if (res.ok) {
        setSent(true);
        // ไม่ปิดอัตโนมัติ — ให้ผู้ใช้กดปุ่มปิดเอง
      } else {
        const e = await res.json();
        alert('เกิดข้อผิดพลาด: ' + (e.error || 'ไม่ทราบสาเหตุ'));
      }
    } catch {
      alert('ไม่สามารถส่งคำขอได้ กรุณาลองใหม่');
    }
    setBusy(false);
  };

  // เลือก input ตามประเภท field
  const renderInput = () => {
    if (field.options) {
      return (
        <select value={newValue} onChange={e=>setNewValue(e.target.value)}
          style={{width:'100%',padding:'10px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',background:'#f9fafb',fontSize:'14px',outline:'none',cursor:'pointer'}}>
          <option value="">-- เลือกใหม่ --</option>
          {field.options.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input type="text" value={newValue} onChange={e=>setNewValue(e.target.value)}
        placeholder="กรอกค่าใหม่"
        style={{width:'100%',padding:'10px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',background:'#f9fafb',fontSize:'14px',outline:'none',boxSizing:'border-box'}}/>
    );
  };

  return (
    <div className={overlayCls} style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(3px)',zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}
      onClick={e=>{if(e.target===e.currentTarget)close();}}>
      <div className={modalCls} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'420px',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',overflow:'hidden'}}>

        <div style={{background:'linear-gradient(135deg,#f59e0b,#fbbf24)',padding:'18px 20px',color:'#fff',display:'flex',alignItems:'center',gap:'10px'}}>
          <i className="fa-solid fa-shield" style={{fontSize:'20px'}}></i>
          <div style={{flex:1}}>
            <p style={{fontSize:'11px',margin:0,opacity:0.9}}>ส่งคำขอแก้ไขข้อมูล</p>
            <p style={{fontSize:'15px',fontWeight:700,margin:'2px 0 0'}}>{field.label}</p>
          </div>
          <button onClick={close} style={{width:'28px',height:'28px',borderRadius:'8px',border:'none',background:'rgba(255,255,255,0.25)',color:'#fff',cursor:'pointer'}}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style={{padding:'18px 20px'}}>
          <p style={{fontSize:'11px',color:'#9ca3af',margin:'0 0 4px',fontWeight:600}}>ค่าปัจจุบัน</p>
          <div style={{padding:'10px 12px',background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'10px',fontSize:'14px',color:'#6b7280',marginBottom:'14px'}}>
            {currentValue || '—'}
          </div>

          <p style={{fontSize:'11px',color:'#9ca3af',margin:'0 0 4px',fontWeight:600}}>ค่าใหม่ที่ต้องการ</p>
          {renderInput()}
          {field.hint && (
            <p style={{fontSize:'11px',color:'#0d9488',margin:'6px 0 0',display:'flex',alignItems:'flex-start',gap:'5px'}}>
              <i className="fa-solid fa-circle-info" style={{marginTop:'2px'}}></i>
              <span>{field.hint}</span>
            </p>
          )}

          <p style={{fontSize:'11px',color:'#9ca3af',margin:'14px 0 4px',fontWeight:600}}>เหตุผล <span style={{fontWeight:400}}>(ไม่บังคับ)</span></p>
          <textarea value={reason} onChange={e=>setReason(e.target.value)}
            placeholder="ระบุเหตุผลที่ต้องการแก้ไข เช่น พิมพ์ผิด, เปลี่ยนตำแหน่งงาน ฯลฯ"
            rows={3}
            style={{width:'100%',padding:'10px 12px',border:'1px solid #e5e7eb',borderRadius:'10px',background:'#f9fafb',fontSize:'13px',outline:'none',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit'}}/>

          {sent ? (
            <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'14px 12px',marginTop:'14px',textAlign:'center'}}>
              <i className="fa-solid fa-circle-check" style={{color:'#16a34a',fontSize:'22px',marginBottom:'6px',display:'block'}}></i>
              <p style={{fontSize:'13px',color:'#15803d',fontWeight:700,margin:0}}>ส่งคำขอเรียบร้อยแล้ว</p>
              <p style={{fontSize:'11px',color:'#166534',margin:'4px 0 0'}}>ระบบส่งอีเมลยืนยันให้ท่านแล้ว และแจ้งผู้ดูแลระบบเพื่อพิจารณา</p>
            </div>
          ) : (
            <div style={{background:'#fef3c7',border:'1px solid #fde68a',borderRadius:'10px',padding:'10px 12px',marginTop:'14px',display:'flex',gap:'8px',alignItems:'flex-start'}}>
              <i className="fa-solid fa-circle-info" style={{color:'#d97706',fontSize:'13px',marginTop:'2px'}}></i>
              <p style={{fontSize:'11px',color:'#92400e',margin:0,lineHeight:1.5}}>
                เมื่อส่งคำขอแล้ว ผู้ดูแลระบบจะได้รับแจ้งทันที และดำเนินการให้
              </p>
            </div>
          )}
        </div>

        <div style={{padding:'12px 20px 18px',display:'flex',gap:'8px',borderTop:'1px solid #f1f5f9'}}>
          <button onClick={close} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#374151',fontWeight:600,fontSize:'13px',cursor:'pointer'}}>
            {sent ? 'ปิด' : 'ยกเลิก'}
          </button>
          {!sent && (
            <button onClick={submit} disabled={busy} style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',background: busy ? '#fcd34d' : '#f59e0b',color:'#fff',fontWeight:700,fontSize:'13px',cursor: busy ? 'not-allowed' : 'pointer'}}>
              {busy
                ? <><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'6px'}}></i>กำลังส่ง...</>
                : <><i className="fa-solid fa-paper-plane" style={{marginRight:'6px'}}></i>ส่งคำขอ</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ───── About / เกี่ยวกับระบบ Modal ─────
// ⚠️ BUILD_DATE ต้องอัปเดตทุกครั้งที่ push version ใหม่ (คู่กับเลข version)
const APP_VERSION = '0.7.17.3';
const BUILD_DATE = '2 มิ.ย. 2569';
function AboutModal({ onClose, onShowChangelog }) {
  const [closing, setClosing] = React.useState(false);
  const handleClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 580); };
  const openChangelog = () => {
    if (closing) return;
    if (onShowChangelog) onShowChangelog();
  };
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.45)',backdropFilter:'blur(2px)',zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} className={closing?'modal-overlay-out':''} onClick={handleClose}>
      <div onClick={e=>e.stopPropagation()} className={closing?'modal-A-out':'modal-A'} style={{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'380px',boxShadow:'0 20px 60px rgba(0,0,0,0.25)',overflow:'hidden'}}>
        {/* Header */}
        <div style={{background:'linear-gradient(160deg,#0f766e,#14b8a6)',padding:'28px 24px',textAlign:'center'}}>
          <div style={{width:'64px',height:'64px',borderRadius:'16px',background:'#ffffff',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="48" height="40"><path fill="#0d9488" d="M320 0c17.7 0 32 14.3 32 32l0 124.2c-8.5-7.6-19.7-12.2-32-12.2s-23.5 4.6-32 12.2L288 32c0-17.7 14.3-32 32-32zM444.5 195.5c-16.4-16.4-41.8-18.5-60.5-6.1l0-24.1C384 127 415 96 453.3 96c21.7 0 42.8 10.2 55.8 28.8c15.4 22.1 44.3 65.4 71 116.9c26.5 50.9 52.4 112.5 59.6 170.3c.2 1.3 .2 2.6 .2 4l0 7c0 49.1-39.8 89-89 89c-7.3 0-14.5-.9-21.6-2.7l-72.7-18.2c-20.9-5.2-38.7-17.1-51.5-32.9c14 1.5 28.5-3 39.2-13.8l-22.6-22.6 22.6 22.6c18.7-18.7 18.7-49.1 0-67.9c-1.1-1.1-1.4-2-1.5-2.5c-.1-.8-.1-1.8 .4-2.9s1.2-1.9 1.8-2.3c.5-.3 1.3-.8 2.9-.8c26.5 0 48-21.5 48-48s-21.5-48-48-48c-1.6 0-2.4-.4-2.9-.8c-.6-.4-1.3-1.2-1.8-2.3s-.5-2.2-.4-2.9c.1-.6 .4-1.4 1.5-2.5c18.7-18.7 18.7-49.1 0-67.9zM183.3 491.2l-72.7 18.2c-7.1 1.8-14.3 2.7-21.6 2.7c-49.1 0-89-39.8-89-89l0-7c0-1.3 .1-2.7 .2-4c7.2-57.9 33.1-119.4 59.6-170.3c26.8-51.5 55.6-94.8 71-116.9c13-18.6 34-28.8 55.8-28.8C225 96 256 127 256 165.3l0 24.1c-18.6-12.4-44-10.3-60.5 6.1c-18.7 18.7-18.7 49.1 0 67.9c1.1 1.1 1.4 2 1.5 2.5c.1 .8 .1 1.8-.4 2.9s-1.2 1.9-1.8 2.3c-.5 .3-1.3 .8-2.9 .8c-26.5 0-48 21.5-48 48s21.5 48 48 48c1.6 0 2.4 .4 2.9 .8c.6 .4 1.3 1.2 1.8 2.3s.5 2.2 .4 2.9c-.1 .6-.4 1.4-1.5 2.5c-18.7 18.7-18.7 49.1 0 67.9c10.7 10.7 25.3 15.3 39.2 13.8c-12.8 15.9-30.6 27.7-51.5 32.9z"/><path fill="#fbbf24" d="M421.8 421.8c-6.2 6.2-16.4 6.2-22.6 0C375.9 398.5 336 415 336 448c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-33-39.9-49.5-63.2-26.2c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6C241.5 375.9 225 336 192 336c-8.8 0-16-7.2-16-16s7.2-16 16-16c33 0 49.5-39.9 26.2-63.2c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0C264.1 241.5 304 225 304 192c0-8.8 7.2-16 16-16s16 7.2 16 16c0 33 39.9 49.5 63.2 26.2c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6C398.5 264.1 415 304 448 304c8.8 0 16 7.2 16 16s-7.2 16-16 16c-33 0-49.5 39.9-26.2 63.2c6.2 6.2 6.2 16.4 0 22.6z"/><path fill="#e11d48" d="M296 320a24 24 0 1 0 0-48 24 24 0 1 0 0 48zm72 32a16 16 0 1 0 -32 0 16 16 0 1 0 32 0z"/></svg>
          </div>
          <p style={{fontFamily:"'Manrope', sans-serif",fontWeight:800,fontSize:'18px',color:'#fff',margin:0,letterSpacing:'-0.3px'}}>TB JOURNEY <span style={{fontFamily:"'Plus Jakarta Sans', sans-serif"}}>&amp;</span> CARE</p>
          <p style={{fontSize:'12px',color:'rgba(255,255,255,0.85)',margin:'5px 0 0',lineHeight:1.4}}>ระบบเก็บข้อมูลผู้ป่วยวัณโรคและติดตามการรักษา</p>
        </div>
        {/* Body */}
        <div style={{padding:'20px 24px'}}>
          <div style={{textAlign:'center',marginBottom:'16px'}}>
            <p style={{fontSize:'14px',fontWeight:700,color:'#0f766e',margin:0}}>เวอร์ชัน {APP_VERSION}</p>
            <p style={{fontSize:'12px',color:'#f59e0b',fontWeight:600,margin:'3px 0 0'}}>ยังไม่เผยแพร่ (อยู่ระหว่างพัฒนา)</p>
            <p onClick={openChangelog} style={{fontSize:'11px',color:'#9ca3af',margin:'3px 0 0',cursor:'pointer',display:'inline-block',padding:'2px 8px',borderRadius:'6px',transition:'background 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.color='#0d9488';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#9ca3af';}} title="ดูประวัติเวอร์ชัน"><i className="fa-solid fa-screwdriver-wrench" style={{marginRight:'5px'}}></i>Build {BUILD_DATE}</p>
            <p onClick={openChangelog} style={{fontSize:'11px',color:'#0d9488',margin:'6px 0 0',cursor:'pointer',fontWeight:600}} title="ดูประวัติเวอร์ชัน"><i className="fa-solid fa-clock-rotate-left" style={{marginRight:'5px'}}></i>ดูประวัติเวอร์ชัน</p>
          </div>
          <div style={{borderTop:'1px solid #f1f5f9',paddingTop:'14px',textAlign:'center'}}>
            <p style={{fontSize:'11px',color:'#9ca3af',margin:'0 0 4px'}}>พัฒนาโดย</p>
            <p style={{fontSize:'14px',fontWeight:700,color:'#1f2937',margin:0}}>เภสัชกร สิรวิชญ์ เผ่าผา (ภ.47186)</p>
            <p style={{fontSize:'12px',color:'#6b7280',margin:'3px 0 0'}}>กลุ่มงานเภสัชกรรม โรงพยาบาลปรางค์กู่</p>
            <p style={{fontSize:'12px',fontWeight:600,color:'#6b7280',margin:'10px 0 3px'}}>
              <i className="fa-solid fa-envelope" style={{marginRight:'5px',color:'#0d9488'}}></i>ติดต่อ
            </p>
            <a href="mailto:siravitphoapha9928@gmail.com" style={{display:'block',fontSize:'12px',color:'#0d9488',fontWeight:600,margin:0,textDecoration:'none',wordBreak:'break-all'}}>
              siravitphoapha9928@gmail.com
            </a>
            <a href="mailto:siravitphoapha9928@hotmail.com" style={{display:'block',fontSize:'12px',color:'#0d9488',fontWeight:600,margin:'2px 0 0',textDecoration:'none',wordBreak:'break-all'}}>
              siravitphoapha9928@hotmail.com
            </a>
          </div>
          <div style={{borderTop:'1px solid #f1f5f9',marginTop:'14px',paddingTop:'14px',textAlign:'center'}}>
            <p style={{fontSize:'12px',color:'#6b7280',margin:0}}><i className="fa-solid fa-robot" style={{marginRight:'5px',color:'#8b5cf6'}}></i>ช่วยพัฒนาโดย Claude Code + Gemini</p>
          </div>
          <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'12px',padding:'12px 14px',marginTop:'14px',textAlign:'center'}}>
            <p style={{fontSize:'13px',color:'#b45309',fontWeight:600,margin:0,fontStyle:'italic',lineHeight:1.5}}>“ เภสัชควรใช้ Claude เขียนโค้ดให้เป็นนะจ๊ะ ”</p>
          </div>
          <button onClick={handleClose} style={{width:'100%',marginTop:'16px',padding:'11px',borderRadius:'12px',border:'none',background:'#0f766e',color:'#fff',fontWeight:700,fontSize:'14px',cursor:'pointer'}}>ปิด</button>
          <p style={{fontSize:'10px',color:'#cbd5e1',textAlign:'center',margin:'10px 0 0'}}>© 2026 TB JOURNEY &amp; CARE</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ChangelogPage — หน้าประวัติเวอร์ชัน (mini-wiki ในเว็บ)
// data จาก window.TB_CHANGELOG + window.TB_TAGS ใน public/tb-changelog.js
// ═══════════════════════════════════════════════════════════════════════════
function ChangelogPage({ highlightCommentTarget, onClearHighlight } = {}) {
  // เป็น tab page (ไม่ใช่ modal) — render ภายใต้ main content area เหมือน AdminUsersTab/ActivityLog
  const [view, setView] = useState('timeline'); // 'timeline' | 'grouped'
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState(new Set());
  // v0.7.17.0 — lazy timeline: render แค่ N แรก กดดูเพิ่มเอง → ลด jank ตอน sidebar collapse
  const [visibleTimelineCount, setVisibleTimelineCount] = useState(15);
  // v0.7.17.3 — Filter sidebar (ซ้าย, พับได้) แทน filter bars 2 แถบเดิม
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(() => {
    try { const s = localStorage.getItem('tb_cl_filter_open'); return s === null ? true : s === '1'; }
    catch { return true; }
  });
  // v0.7.17.3 — แต่ละ section เริ่มพับ (เห็นแค่หัวข้อ 2 แถว) — กดเปิดเอง
  const [filterVerOpen, setFilterVerOpen] = useState(false);
  const [filterCmtOpen, setFilterCmtOpen] = useState(false);
  // v0.7.17.3 — Back-to-top button สำหรับฝั่งขวา (version cards)
  const rightColRef = React.useRef(null);
  React.useEffect(() => {
    try { localStorage.setItem('tb_cl_filter_open', filterSidebarOpen ? '1' : '0'); } catch {}
  }, [filterSidebarOpen]);
  const [expandedMajors, setExpandedMajors] = useState(new Set([window.TB_CHANGELOG[0]?.major]));
  const [expandedMinors, setExpandedMinors] = useState(new Set());
  const [expandedVersions, setExpandedVersions] = useState(new Set());
  const [copiedHash, setCopiedHash] = useState(null);
  const [copiedFull, setCopiedFull] = useState(null); // version string ที่เพิ่ง copy ฉบับเต็ม
  const [commitDetailEntry, setCommitDetailEntry] = useState(null); // {entry, color}
  const [localToast, setLocalToast] = useState(null); // {text, type}
  const [expandedComments, setExpandedComments] = useState(new Set()); // version ที่เปิด comments ใน Timeline view
  // v0.7.15.4 — track version ที่เคยเปิด (keep mounted) → เปิด/ปิดครั้งถัดไป instant
  const [everOpenedVersions, setEverOpenedVersions] = useState(new Set());
  const [commentCounts, setCommentCounts] = useState({}); // {version: active count รวม reply}
  const [commentDeletedCounts, setCommentDeletedCounts] = useState({}); // {version: deleted count รวม reply}
  const [onlyWithComments, setOnlyWithComments] = useState(false); // filter: เฉพาะมี comment
  // ── Bulk comments store — fetch รวด 1 ครั้งแทน fetch ต่อ version ──
  const [allCommentsByVersion, setAllCommentsByVersion] = useState({}); // {version: [comments]}
  const [commentsMeta, setCommentsMeta] = useState({ currentUserId: null, isAdmin: false });

  // ── แถบที่ 2: Comment-specific filters (v0.7.14.7) ──
  const [commentSearch, setCommentSearch] = useState('');
  const [debouncedCommentSearch, setDebouncedCommentSearch] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(new Set());
  const [selectedMentionUserIds, setSelectedMentionUserIds] = useState(new Set());
  const [resolvedFilter, setResolvedFilter] = useState('all'); // 'all'|'open'|'resolved'
  const [onlyMyComments, setOnlyMyComments] = useState(false);
  // extra filters: liked / my_replies / unread (multi-select)
  const [extraFilters, setExtraFilters] = useState(new Set());
  const [unreadCommentIds, setUnreadCommentIds] = useState(new Set());
  // Mention dropdown
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);
  // v0.7.17.3 — fixed position สำหรับ mention dropdown (กัน overflow ของ sidebar ที่มี internal scroll)
  const [mentionPos, setMentionPos] = useState({top:0,left:0,width:260});
  const [mentionUsers, setMentionUsers] = useState(null);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [hoveredMentionId, setHoveredMentionId] = useState(null);
  const mentionPickerRef = React.useRef(null);

  // โหลด comment ทั้งหมดรวด 1 ครั้ง + auto-expand version ที่มี comment
  const refreshAllComments = React.useCallback(async () => {
    try {
      const r = await fetch('/api/changelog/comments-all');
      const j = await r.json();
      if (!r.ok) return;
      const byVersion = j.byVersion || {};
      setAllCommentsByVersion(byVersion);
      setCommentsMeta({ currentUserId: j.current_user_id, isAdmin: !!j.is_admin });
      // คำนวณ counts จากข้อมูลที่ได้ — รวม reply, แยก active vs deleted
      const counts = {};
      const dcounts = {};
      Object.entries(byVersion).forEach(([v, list]) => {
        let a = 0, d = 0;
        for (const c of list) {
          if (c.deleted_at) d += 1; else a += 1;
          if (Array.isArray(c.replies)) for (const r of c.replies) { if (r.deleted_at) d += 1; else a += 1; }
        }
        counts[v] = a;
        dcounts[v] = d;
      });
      setCommentCounts(counts);
      setCommentDeletedCounts(dcounts);
      // auto-expand version ที่มี comment
      const withComments = Object.keys(byVersion);
      if (withComments.length > 0) {
        setExpandedComments(prev => {
          const next = new Set(prev);
          withComments.forEach(v => next.add(v));
          return next;
        });
        // v0.7.15.4 — auto-expand version → mark เป็น ever-opened ด้วย
        setEverOpenedVersions(prev => {
          const next = new Set(prev);
          withComments.forEach(v => next.add(v));
          return next;
        });
      }
    } catch {/* network fail */}
  }, []);
  useEffect(() => { refreshAllComments(); }, [refreshAllComments]);

  // ── Realtime subscription — comments + likes (v0.7.14.5) ──
  React.useEffect(() => {
    if (!window._sb) return;
    let pending = null;
    // v0.7.15.1 — debounce 500ms (เดิม 300ms) → ลด API call ตอน batch updates ครึ่งหนึ่ง
    // (เริ่มที่ 500ms ก่อน — Plan agent แนะนำ ถ้าไม่บ่นค่อยขยับ 600ms)
    const debounced = () => { clearTimeout(pending); pending = setTimeout(refreshAllComments, 500); };
    const chC = window._sb.channel('changelog-comments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_changelog_comments' }, debounced)
      .subscribe();
    const chL = window._sb.channel('changelog-comment-likes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_changelog_comment_likes' }, debounced)
      .subscribe();
    return () => { clearTimeout(pending); try { window._sb.removeChannel(chC); } catch {} try { window._sb.removeChannel(chL); } catch {} };
  }, [refreshAllComments]);

  // ── Highlight comment เมื่อกดจากกระดิ่ง ──
  // CommentSection อาจ mount ช้า (รอ Realtime/render) → retry หา element ทุก 100ms นาน 4 วินาที
  React.useEffect(() => {
    if (!highlightCommentTarget) return;
    const { version, commentId } = highlightCommentTarget;
    if (!version || !commentId) return;
    setView('timeline');
    setExpandedComments(prev => { const n = new Set(prev); n.add(version); return n; });
    setEverOpenedVersions(prev => { const n = new Set(prev); n.add(version); return n; });
    // v0.7.17.2 fix — ขยาย visibleTimelineCount ถ้า version ที่กระดิ่งชี้ไปอยู่นอก slice (15)
    //   ไม่งั้น version ไม่ถูก render → ChangelogCommentSection ไม่ mount → DOM ไม่มี comment
    const targetIdx = allVersions.findIndex(v => v.version === version);
    if (targetIdx >= 0) {
      setVisibleTimelineCount(c => Math.max(c, targetIdx + 1));
    }
    let tries = 0;
    const scrollTimers = [];
    const interval = setInterval(() => {
      tries += 1;
      const el = document.getElementById('cmt-' + commentId);
      if (el) {
        clearInterval(interval);
        // v0.7.17.2 fix — scroll ซ้ำหลายรอบเผื่อ layout shift (lazy mount + comments loading
        //   ทำให้ page height โต → scroll smooth ไปตำแหน่งเก่า → หยุดก่อนถึงเป้า)
        //   scroll 4 รอบ: ทันที + 300ms + 700ms + 1200ms ครอบคลุม fetch + mount + reflow
        const scrollIt = () => {
          try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
        };
        scrollIt();
        scrollTimers.push(setTimeout(scrollIt, 300));
        scrollTimers.push(setTimeout(scrollIt, 700));
        scrollTimers.push(setTimeout(scrollIt, 1200));
        // flash หลัง scroll รอบสุดท้าย — มั่นใจว่าอยู่ในจอแล้ว
        scrollTimers.push(setTimeout(() => {
          el.classList.remove('comment-flash');
          void el.offsetWidth;  // force reflow
          el.classList.add('comment-flash');
        }, 1300));
        scrollTimers.push(setTimeout(() => {
          if (onClearHighlight) onClearHighlight();
        }, 1800));
      } else if (tries > 40) {  // 4 วินาที
        clearInterval(interval);
        console.warn('[ChangelogPage] comment not found:', commentId);
        if (onClearHighlight) onClearHighlight();
      }
    }, 100);
    return () => { clearInterval(interval); scrollTimers.forEach(clearTimeout); };
  }, [highlightCommentTarget, onClearHighlight]);

  const toggleComments = (version) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version); else next.add(version);
      return next;
    });
    // v0.7.15.4 — mark ว่า version นี้เคยเปิด → keep CommentSection mounted ตลอด
    setEverOpenedVersions(prev => {
      if (prev.has(version)) return prev;
      const n = new Set(prev); n.add(version); return n;
    });
  };
  const setCommentCount = React.useCallback((version, n) => {
    setCommentCounts(prev => {
      const cur = prev[version] ?? 0;
      if (cur === n) return prev;             // กัน update ซ้ำ → กัน loop
      return { ...prev, [version]: n };
    });
  }, []);

  // ── Copy commit hash → clipboard + flash "copied" badge ────────────────
  const copyHash = (hash) => {
    if (!hash || hash==='pending') return;
    if (navigator.clipboard) navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(()=>setCopiedHash(prev => prev===hash ? null : prev), 1500);
  };

  // ── Copy commit ฉบับเต็ม (title + body + meta) → clipboard + toast ────
  const copyFullCommit = (entry) => {
    if (!entry) return;
    const lines = [
      `v${entry.version} · ${entry.date}` + (entry.commit && entry.commit!=='pending' ? ` · ${entry.commit}` : ''),
      entry.title || '',
      '',
      entry.body || '(ไม่มี commit body)',
    ];
    const text = lines.join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopiedFull(entry.version);
    setTimeout(()=>setCopiedFull(prev => prev===entry.version ? null : prev), 1800);
    setLocalToast({ text: 'คัดลอกฉบับเต็มแล้ว', type: 'success' });
    setTimeout(()=>setLocalToast(null), 2000);
  };

  // ── Copy commit ฉบับย่อ (title + version + date + hash + bullets) ────
  const copyShortCommit = (entry) => {
    if (!entry) return;
    const lines = [
      `v${entry.version} · ${entry.date}` + (entry.commit && entry.commit!=='pending' ? ` · ${entry.commit}` : ''),
      entry.title || '',
    ];
    if (entry.changes && entry.changes.length > 0) {
      lines.push('');
      entry.changes.forEach(c => {
        const tag = TAGS[c.tag];
        lines.push(`${tag?tag.emoji:'•'} ${c.text}`);
      });
    }
    const text = lines.join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopiedFull(entry.version);
    setTimeout(()=>setCopiedFull(prev => prev===entry.version ? null : prev), 1800);
    setLocalToast({ text: 'คัดลอกฉบับย่อแล้ว', type: 'success' });
    setTimeout(()=>setLocalToast(null), 2000);
  };

  // ── Highlight ส่วนที่ค้นหาเจอ (พื้นเหลือง) ──────────────────────────────
  const highlightMatch = (text) => {
    const q = debouncedSearch;
    if (!q || !text) return text;
    const t = String(text);
    const idx = t.toLowerCase().indexOf(q);
    if (idx < 0) return t;
    return (
      <>{t.slice(0, idx)}
        <mark style={{background:'#fef08a',padding:'0 2px',borderRadius:'3px',color:'inherit'}}>{t.slice(idx, idx+q.length)}</mark>
        {t.slice(idx+q.length)}</>
    );
  };

  // debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // v0.7.14.7 — debounce comment search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCommentSearch(commentSearch.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [commentSearch]);

  // v0.7.14.7 — pre-fetch mentionable users ตอน ChangelogPage mount → popup เปิดทันที (ใช้ global cache)
  React.useEffect(() => {
    if (window._mentionUsersCache?.users) {
      setMentionUsers(window._mentionUsersCache.users);
      return;
    }
    setMentionLoading(true);
    (async () => {
      try {
        const r = await fetch('/api/changelog/mentionable-users');
        const j = await r.json();
        const users = r.ok ? (j.users || []) : [];
        window._mentionUsersCache = { users, fetchedAt: Date.now() };
        setMentionUsers(users);
      } catch { setMentionUsers([]); }
      finally { setMentionLoading(false); }
    })();
  }, []);
  // backward compat — ใช้ใน onClick ของปุ่มเปิด dropdown (no-op ตอนนี้)
  const ensureMentionUsersLoaded = React.useCallback(() => {}, []);

  // v0.7.14.7 — outside-click ปิด mention picker
  useEffect(() => {
    if (!mentionPickerOpen) return;
    const handler = (e) => {
      if (mentionPickerRef.current && !mentionPickerRef.current.contains(e.target)) {
        setMentionPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mentionPickerOpen]);

  // v0.7.14.7 — toggle helpers
  const toggleStatus = (s) => {
    const n = new Set(selectedStatuses);
    if (n.has(s)) n.delete(s); else n.add(s);
    setSelectedStatuses(n);
  };
  const toggleMentionUser = (id) => {
    const n = new Set(selectedMentionUserIds);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelectedMentionUserIds(n);
  };
  const toggleExtra = (k) => {
    const n = new Set(extraFilters);
    if (n.has(k)) n.delete(k); else n.add(k);
    setExtraFilters(n);
  };

  // v0.7.14.7 — ดึง notification ของ user → derive set ของ comment_id ที่ "ยังไม่อ่าน"
  // unread = comment ที่ user ได้รับ notif (reply/mention/resolved/new) แต่ยังไม่กดอ่าน
  useEffect(() => {
    if (!window.loadUserNotifications) return;
    let cancel = false;
    (async () => {
      try {
        const notifs = await window.loadUserNotifications();
        if (cancel) return;
        const set = new Set();
        for (const n of notifs) {
          if (!n.is_read && n.comment_id && (n.type === 'comment_reply' || n.type === 'comment_mention' || n.type === 'comment_resolved' || n.type === 'comment_new')) {
            set.add(n.comment_id);
          }
        }
        setUnreadCommentIds(set);
      } catch {}
    })();
    return () => { cancel = true; };
  }, [allCommentsByVersion]);  // refetch เมื่อ comment data อัป (realtime หรือ refresh)

  const TAGS = window.TB_TAGS || {};
  const CHANGELOG = window.TB_CHANGELOG || [];

  // นับ stats รวม
  const stats = React.useMemo(() => {
    let totalVersions = 0;
    const byTag = {};
    CHANGELOG.forEach(major => {
      major.versions.forEach(v => {
        totalVersions++;
        v.changes.forEach(c => { byTag[c.tag] = (byTag[c.tag] || 0) + 1; });
      });
    });
    return { totalVersions, byTag };
  }, [CHANGELOG]);

  // v0.7.14.7 — สถิติของแถบ 2 (นับ #versions ต่อ axis)
  const commentFilterStats = React.useMemo(() => {
    const byStatus = { feedback:0, bug_report:0, request:0, note:0 };
    const byMentionedId = {};
    let openCount = 0, resolvedCount = 0, mineCount = 0;
    let likedCount = 0, myRepliesCount = 0, unreadCount = 0;
    const me = commentsMeta.currentUserId;
    Object.values(allCommentsByVersion).forEach(list => {
      const seenStatus = new Set();
      const seenMention = new Set();
      let hasOpen=false, hasResolved=false, hasMine=false;
      let hasLiked=false, hasMyReply=false, hasUnread=false;
      const walk = (c) => {
        if (c.deleted_at) return;
        seenStatus.add(c.status);
        if (Array.isArray(c.mentioned_user_ids)) c.mentioned_user_ids.forEach(uid => seenMention.add(uid));
        if (c.resolved_at) hasResolved = true; else hasOpen = true;
        if (me && c.user_id === me) hasMine = true;
        if (c.liked_by_me) hasLiked = true;
        if (c.parent_comment_id && me && c.user_id === me) hasMyReply = true;
        if (unreadCommentIds.has(c.id)) hasUnread = true;
      };
      list.forEach(c => { walk(c); (c.replies||[]).forEach(walk); });
      seenStatus.forEach(s => { if (s in byStatus) byStatus[s]++; });
      seenMention.forEach(uid => { byMentionedId[uid] = (byMentionedId[uid]||0)+1; });
      if (hasOpen) openCount++;
      if (hasResolved) resolvedCount++;
      if (hasMine) mineCount++;
      if (hasLiked) likedCount++;
      if (hasMyReply) myRepliesCount++;
      if (hasUnread) unreadCount++;
    });
    return { byStatus, byMentionedId, openCount, resolvedCount, mineCount, likedCount, myRepliesCount, unreadCount };
  }, [allCommentsByVersion, commentsMeta.currentUserId, unreadCommentIds]);

  // v0.7.14.7 — comment-level filter logic
  const hasCommentFilter = (
    debouncedCommentSearch ||
    selectedStatuses.size > 0 ||
    selectedMentionUserIds.size > 0 ||
    resolvedFilter !== 'all' ||
    onlyMyComments ||
    extraFilters.size > 0
  );

  const commentMatchesAxes = React.useCallback((c) => {
    if (c.deleted_at) return false;
    if (selectedStatuses.size > 0 && !selectedStatuses.has(c.status)) return false;
    if (selectedMentionUserIds.size > 0) {
      const ids = Array.isArray(c.mentioned_user_ids) ? c.mentioned_user_ids : [];
      if (!ids.some(uid => selectedMentionUserIds.has(uid))) return false;
    }
    if (resolvedFilter === 'open' && c.resolved_at) return false;
    if (resolvedFilter === 'resolved' && !c.resolved_at) return false;
    if (onlyMyComments && commentsMeta.currentUserId && c.user_id !== commentsMeta.currentUserId) return false;
    if (debouncedCommentSearch && !(c.comment_text || '').toLowerCase().includes(debouncedCommentSearch)) return false;
    // extra
    if (extraFilters.has('liked') && !c.liked_by_me) return false;
    if (extraFilters.has('my_replies') && !(c.parent_comment_id && commentsMeta.currentUserId && c.user_id === commentsMeta.currentUserId)) return false;
    if (extraFilters.has('unread') && !unreadCommentIds.has(c.id)) return false;
    return true;
  }, [selectedStatuses, selectedMentionUserIds, resolvedFilter, onlyMyComments, debouncedCommentSearch, extraFilters, unreadCommentIds, commentsMeta.currentUserId]);

  const versionHasMatchingComment = (version) => {
    const list = allCommentsByVersion[version];
    if (!list?.length) return false;
    for (const c of list) {
      if (commentMatchesAxes(c)) return true;
      if (Array.isArray(c.replies)) {
        for (const r of c.replies) if (commentMatchesAxes(r)) return true;
      }
    }
    return false;
  };

  // ฟิลเตอร์ version ตาม search + tag + comment filters (แถบ 2)
  const matchesFilters = (v) => {
    if (onlyWithComments && !(commentCounts[v.version] > 0)) return false;
    if (selectedTags.size > 0) {
      const hasTag = v.changes.some(c => selectedTags.has(c.tag));
      if (!hasTag) return false;
    }
    if (debouncedSearch) {
      const hay = (v.version + ' ' + v.title + ' ' + v.changes.map(c=>c.text).join(' ')).toLowerCase();
      if (!hay.includes(debouncedSearch)) return false;
    }
    // v0.7.14.7 — comment-level filter (AND กับด้านบน)
    if (hasCommentFilter && !versionHasMatchingComment(v.version)) return false;
    return true;
  };

  // ฟิลเตอร์ change list ภายใน version (ถ้ามี tag filter)
  const filterChanges = (changes) => {
    if (selectedTags.size === 0) return changes;
    return changes.filter(c => selectedTags.has(c.tag));
  };

  const toggleTag = (tag) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) next.delete(tag); else next.add(tag);
    setSelectedTags(next);
  };
  const clearFilters = () => {
    setSearch(''); setSelectedTags(new Set()); setOnlyWithComments(false);
    // v0.7.14.7 — reset แถบ 2 ด้วย
    setCommentSearch(''); setSelectedStatuses(new Set()); setSelectedMentionUserIds(new Set());
    setResolvedFilter('all'); setOnlyMyComments(false); setExtraFilters(new Set());
    setMentionPickerOpen(false); setMentionQuery('');
  };
  // v0.7.14.7 — แยกปุ่มล้างค่าตาม "แถว/ระบบ"
  const clearTagFilters = () => {
    setSearch(''); setSelectedTags(new Set()); setOnlyWithComments(false);
  };
  const clearCommentFilters = () => {
    setCommentSearch(''); setSelectedStatuses(new Set()); setSelectedMentionUserIds(new Set());
    setResolvedFilter('all'); setOnlyMyComments(false); setExtraFilters(new Set());
    setMentionPickerOpen(false); setMentionQuery('');
  };
  const hasTagRowFilter = debouncedSearch || selectedTags.size > 0 || onlyWithComments;
  const hasCommentRowFilter = debouncedCommentSearch || selectedStatuses.size > 0 || selectedMentionUserIds.size > 0
    || resolvedFilter !== 'all' || onlyMyComments || extraFilters.size > 0;

  const toggleMajor = (major) => {
    const next = new Set(expandedMajors);
    if (next.has(major)) next.delete(major); else next.add(major);
    setExpandedMajors(next);
  };
  const toggleMinor = (key) => {
    const next = new Set(expandedMinors);
    if (next.has(key)) next.delete(key); else next.add(key);
    setExpandedMinors(next);
  };
  const toggleVersion = (v) => {
    const next = new Set(expandedVersions);
    if (next.has(v)) next.delete(v); else next.add(v);
    setExpandedVersions(next);
  };

  // ── Group versions by minor (e.g. "0.7.13.5" → group "0.7.13") ──────────
  const compareVersionDesc = (a, b) => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const x = pa[i] || 0, y = pb[i] || 0;
      if (x !== y) return y - x;
    }
    return 0;
  };
  const groupByMinor = (versions) => {
    const groups = {};
    versions.forEach(v => {
      const parts = v.version.split('.');
      const minorKey = parts.slice(0, 3).join('.');
      if (!groups[minorKey]) groups[minorKey] = [];
      groups[minorKey].push(v);
    });
    return Object.entries(groups)
      .map(([minorKey, vs]) => ({
        minorKey,
        versions: vs.sort((a,b) => compareVersionDesc(a.version, b.version)),
      }))
      .sort((a,b) => compareVersionDesc(a.minorKey, b.minorKey));
  };

  // ── Tag chip ─────────────────────────────────────────────────────────────
  const TagChip = ({ tagKey, small }) => {
    const t = TAGS[tagKey];
    if (!t) return null;
    return (
      <span style={{display:'inline-flex',alignItems:'center',gap:'3px',padding: small?'1px 6px':'2px 8px',borderRadius:'999px',background:t.bg,color:t.fg,border:`1px solid ${t.border}`,fontSize: small?'10px':'11px',fontWeight:600,whiteSpace:'nowrap'}}>
        <span>{t.emoji}</span>
        <span>{t.label}</span>
      </span>
    );
  };

  // ── ChangeRow ────────────────────────────────────────────────────────────
  const ChangeRow = ({ change }) => (
    <div style={{display:'flex',gap:'8px',padding:'6px 0',alignItems:'flex-start'}}>
      <TagChip tagKey={change.tag} small />
      <span style={{fontSize:'13px',color:'#374151',lineHeight:1.6,flex:1}}>{highlightMatch(change.text)}</span>
    </div>
  );

  // ── Tag breakdown ของ version (mini chips กดได้ = filter) ────────────
  const TagBreakdown = ({ changes, small }) => {
    const counts = {};
    (changes || []).forEach(c => { counts[c.tag] = (counts[c.tag] || 0) + 1; });
    const entries = Object.entries(counts).filter(([k])=>TAGS[k]);
    if (entries.length === 0) return null;
    const noFocus = (e) => e.preventDefault();
    return (
      <span style={{display:'inline-flex',gap:'3px',flexWrap:'wrap'}} onClick={e=>e.stopPropagation()}>
        {entries.map(([k,n])=>{
          const t = TAGS[k];
          const active = selectedTags.has(k);
          return (
            <button key={k} type="button" tabIndex={-1} onMouseDown={noFocus} onClick={e=>{e.stopPropagation();toggleTag(k);}} title={`กรอง ${t.label}`}
              style={{cursor:'pointer',border:active?`1px solid ${t.fg}`:'1px solid '+t.border,background: active ? t.bg : '#fff',color:t.fg,padding: small?'1px 5px':'2px 6px',borderRadius:'999px',fontSize: small?'9px':'10px',fontWeight:700,lineHeight:1.2,transition:'all 0.15s'}}>
              {t.emoji}{n}
            </button>
          );
        })}
      </span>
    );
  };

  // ── CommitChip — กดได้, แสดง copied state, กับปุ่ม "บันทึกฉบับเต็ม" ──────
  const CommitChip = ({ v, color, small }) => {
    if (!v.commit) return null;
    const justCopied = copiedHash === v.commit;
    // กัน event bubbling + กัน focus (browser auto-scroll button เข้าหา viewport ตอนได้ focus)
    const noFocus = (e) => e.preventDefault();
    const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
    return (
      <span style={{display:'inline-flex',gap:'4px',alignItems:'center'}} onClick={e=>e.stopPropagation()}>
        <button type="button" tabIndex={-1} onMouseDown={noFocus} onClick={stop(()=>copyHash(v.commit))} title="คลิกเพื่อ copy commit hash"
          style={{cursor:'pointer',border:'none',fontSize: small?'9px':'10px',fontFamily:'monospace',background:justCopied?'#d1fae5':'#f3f4f6',color:justCopied?'#065f46':'#9ca3af',padding:'2px 7px',borderRadius:'4px',fontWeight:600,transition:'all 0.15s'}}>
          {justCopied ? '✓ copied' : v.commit}
        </button>
        {v.body && (
          <>
            <button type="button" tabIndex={-1} onMouseDown={noFocus} onClick={stop(()=>setCommitDetailEntry({entry:v, color}))} title="ดูบันทึก commit ฉบับเต็ม"
              style={{cursor:'pointer',border:'none',fontSize: small?'9px':'10px',background:'#eff6ff',color:'#1d4ed8',padding:'2px 7px',borderRadius:'4px',fontWeight:700,transition:'all 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#dbeafe'}
              onMouseLeave={e=>e.currentTarget.style.background='#eff6ff'}>
              <i className="fa-solid fa-file-lines" style={{marginRight:'3px'}}></i>บันทึกฉบับเต็ม
            </button>
            <button type="button" tabIndex={-1} onMouseDown={noFocus} onClick={stop(()=>copyShortCommit(v))} title="คัดลอก commit ฉบับย่อ (หัวเรื่อง + รายการแก้ไข)"
              style={{cursor:'pointer',border:'none',fontSize: small?'9px':'10px',background: copiedFull===v.version ? '#d1fae5' : '#fef3c7',color: copiedFull===v.version ? '#065f46' : '#92400e',padding:'2px 7px',borderRadius:'4px',fontWeight:700,transition:'all 0.15s'}}
              onMouseEnter={e=>{if(copiedFull!==v.version)e.currentTarget.style.background='#fde68a';}}
              onMouseLeave={e=>{if(copiedFull!==v.version)e.currentTarget.style.background='#fef3c7';}}>
              <i className={copiedFull===v.version ? 'fa-solid fa-check' : 'fa-regular fa-copy'}></i>
            </button>
          </>
        )}
      </span>
    );
  };

  // ── VersionCard ถูก inline ใน Timeline map แทนเป็น component (ลดการ recreate function) ─

  // ── Flat list สำหรับ Timeline view ───────────────────────────────────────
  const allVersions = React.useMemo(() => {
    const list = [];
    CHANGELOG.forEach(major => {
      major.versions.forEach(v => {
        list.push({ ...v, _major: major.major, _color: major.color });
      });
    });
    return list;
  }, [CHANGELOG]);

  const filteredTimeline = React.useMemo(
    () => allVersions.filter(matchesFilters),
    [allVersions, debouncedSearch, selectedTags, onlyWithComments, commentCounts,
     allCommentsByVersion, debouncedCommentSearch, selectedStatuses, selectedMentionUserIds, resolvedFilter, onlyMyComments, commentsMeta.currentUserId, extraFilters, unreadCommentIds]
  );
  // v0.7.17.0 — reset visible count ตอน filter เปลี่ยน (กัน scroll ลึกแล้ว filter ติด)
  React.useEffect(() => { setVisibleTimelineCount(15); },
    [debouncedSearch, selectedTags, onlyWithComments, debouncedCommentSearch,
     selectedStatuses, selectedMentionUserIds, resolvedFilter, onlyMyComments, extraFilters]
  );
  // คำนวณ list ที่จะ render จริง (slice แค่ N แรก)
  const timelineToRender = React.useMemo(
    () => filteredTimeline.slice(0, visibleTimelineCount),
    [filteredTimeline, visibleTimelineCount]
  );
  const latestVersion = allVersions[0]?.version;

  const hasActiveFilters = debouncedSearch || selectedTags.size > 0 || onlyWithComments
    || debouncedCommentSearch || selectedStatuses.size > 0 || selectedMentionUserIds.size > 0
    || resolvedFilter !== 'all' || onlyMyComments || extraFilters.size > 0;

  return (
    <div className="tb-fade">
      {/* ── Sticky header กลุ่ม: Banner + Filter ติดกันเป็นชั้นเดียว ── */}
      <div style={{position:'sticky',top:'-24px',zIndex:20,paddingTop:'0',marginBottom:'16px'}}>
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {/* v0.7.17.3 — ทุกอย่างบรรทัดเดียว: รวม 83 เวอร์ชัน + range + chips */}
            <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap',color:'#fff',fontSize:'13px'}}>
              <span style={{display:'inline-flex',alignItems:'baseline',gap:'6px'}}>
                <span>รวม</span>
                <span style={{fontSize:'28px',fontWeight:800,lineHeight:1,fontFamily:"'Manrope', sans-serif",letterSpacing:'-0.5px'}}>{stats.totalVersions}</span>
                <span>เวอร์ชัน · ตั้งแต่ v0.5.0 ถึง v{APP_VERSION}</span>
              </span>
              {Object.entries(stats.byTag).filter(([k,n])=>n>0 && TAGS[k]).map(([k,n])=>{
                const active = selectedTags.has(k);
                return (
                  <button key={k} type="button" onClick={()=>toggleTag(k)} title={`กรอง ${TAGS[k].label}`}
                    style={{cursor:'pointer',border:active?'1px solid #fff':'1px solid rgba(255,255,255,0.3)',background: active ? '#fff' : 'rgba(255,255,255,0.15)',color: active ? TAGS[k].fg : '#fff',padding:'2px 8px',borderRadius:'999px',fontSize:'11px',fontWeight:700,transition:'all 0.15s',lineHeight:1.3}}>
                    {TAGS[k].emoji}{n}
                  </button>
                );
              })}
              {(() => {
                const totalComments = Object.values(commentCounts).reduce((a,b)=>a+b,0);
                if (totalComments === 0) return null;
                return (
                  <button type="button" onClick={()=>setOnlyWithComments(v=>!v)} title="กรองเฉพาะที่มีความคิดเห็น"
                    style={{cursor:'pointer',border:onlyWithComments?'1px solid #fff':'1px solid rgba(255,255,255,0.3)',background: onlyWithComments ? '#fff' : 'rgba(255,255,255,0.15)',color: onlyWithComments ? '#92400e' : '#fff',padding:'2px 8px',borderRadius:'999px',fontSize:'11px',fontWeight:700,transition:'all 0.15s',lineHeight:1.3,display:'inline-flex',alignItems:'center',gap:'3px'}}>
                    <i className="fa-regular fa-comment"></i>{totalComments}
                  </button>
                );
              })()}
            </div>
          </div>
          {/* View toggle — อยู่ในแบนเนอร์ */}
          <div style={{display:'flex',background:'rgba(255,255,255,0.15)',borderRadius:'10px',padding:'3px',gap:'2px',flexShrink:0}}>
            <button type="button" onClick={()=>setView('timeline')}
              style={{padding:'6px 12px',borderRadius:'8px',border:'none',background:view==='timeline'?'#fff':'transparent',color:view==='timeline'?'#0f766e':'#fff',fontSize:'12px',fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
              <i className="fa-solid fa-stream" style={{marginRight:'5px'}}></i>Timeline
            </button>
            <button type="button" onClick={()=>setView('grouped')}
              style={{padding:'6px 12px',borderRadius:'8px',border:'none',background:view==='grouped'?'#fff':'transparent',color:view==='grouped'?'#0f766e':'#fff',fontSize:'12px',fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
              <i className="fa-solid fa-layer-group" style={{marginRight:'5px'}}></i>แยกตามเวอร์ชั่น
            </button>
          </div>
        </div>
      </div>
      </div>{/* /sticky header group (เหลือเฉพาะ banner) */}

      {/* ── v0.7.17.3 — Layout 2 ช่อง แยก scroll อิสระ — Gmail-style ── */}
      {/* outer height: calc(100vh - 200px) คือพื้นที่หลังจาก banner + margins */}
      <div style={{display:'flex',gap:'16px',alignItems:'stretch',height:'calc(100vh - 200px)',minHeight:'400px',position:'relative'}}>

      {/* ── Left aside: filter sidebar (พับได้, scroll อิสระ) ── */}
      <aside style={{width:filterSidebarOpen?'260px':'40px',flexShrink:0,transition:'width 0.2s ease',position:'relative',height:'100%'}}>
        {/* Chevron toggle button — ลอยขอบบน */}
        <button type="button" onClick={()=>setFilterSidebarOpen(o=>!o)}
          title={filterSidebarOpen?'ย่อแถบตัวกรอง':'ขยายแถบตัวกรอง'}
          style={{position:'absolute',right:filterSidebarOpen?'-12px':'8px',top:'12px',width:'24px',height:'24px',borderRadius:'50%',border:'1.5px solid #0d9488',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:5,boxShadow:'0 1px 3px rgba(0,0,0,0.08)',transition:'all 0.15s'}}
          onMouseEnter={e=>{ e.currentTarget.style.background='#0d9488'; const icon=e.currentTarget.querySelector('i'); if (icon) icon.style.color='#fff'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='#fff'; const icon=e.currentTarget.querySelector('i'); if (icon) icon.style.color='#0d9488'; }}>
          <i className={`fa-solid ${filterSidebarOpen?'fa-chevron-left':'fa-chevron-right'}`} style={{fontSize:'9px',color:'#0d9488',transition:'color 0.15s'}}></i>
        </button>
        {filterSidebarOpen ? (<div style={{display:'flex',flexDirection:'column',gap:'10px',height:'100%',overflowY:'auto',overscrollBehavior:'contain',scrollbarGutter:'stable',paddingBottom:'12px'}}>

      {/* ── v0.7.17.3 — Filter bar (แถบ 1: ตัวกรองระบบ) — collapsible ── */}
      <div style={{background:'#fff',borderRadius:'14px',border:'1px solid #e5e7eb',boxShadow:'0 4px 12px rgba(0,0,0,0.06)',flexShrink:0}}>
        {/* Header — กดเปิด/พับ */}
        <button type="button" className="tb-cl-header-ver" onClick={()=>setFilterVerOpen(o=>!o)}
          style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:filterVerOpen?'#f0fdfa':'#fff',border:'none',cursor:'pointer',transition:'background 0.15s',borderBottom:filterVerOpen?'1px solid #d1faf3':'none',borderRadius:filterVerOpen?'14px 14px 0 0':'14px'}}>
          <i className="fa-solid fa-sliders" style={{color:'#0d9488',fontSize:'13px'}}></i>
          <span style={{fontSize:'13px',fontWeight:700,color:'#0f766e',flex:1,textAlign:'left'}}>ตัวกรองเวอร์ชั่น</span>
          {hasTagRowFilter && <span style={{fontSize:'9px',fontWeight:700,color:'#fff',background:'#0d9488',padding:'2px 6px',borderRadius:'999px'}}>มีกรอง</span>}
          <i className={`fa-solid ${filterVerOpen?'fa-chevron-up':'fa-chevron-down'}`} style={{color:'#9ca3af',fontSize:'10px'}}></i>
        </button>
        {filterVerOpen && (
        <div className="tb-cl-chips-ver" style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:'6px'}}>
          {/* ค้นหา full-width */}
          <div style={{position:'relative'}}>
            <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'11px'}}></i>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเวอร์ชัน/หัวเรื่อง"
              style={{width:'100%',boxSizing:'border-box',padding:'7px 10px 7px 28px',borderRadius:'8px',border:'1px solid #e5e7eb',background:'#f9fafb',fontSize:'12px',outline:'none',color:'#1f2937',caretColor:'#0d9488'}}
              onFocus={e=>{e.currentTarget.style.borderColor='#14b8a6';e.currentTarget.style.background='#fff';}}
              onBlur={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.background='#f9fafb';}}
            />
          </div>
          {/* Chips — แถวละอัน text-left + icon-right + count */}
          {Object.entries(TAGS).map(([key,t])=>{
            const active = selectedTags.has(key);
            const count = stats.byTag[key] || 0;
            return (
              <button key={key} type="button" onClick={()=>toggleTag(key)}
                style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border:active?`1.5px solid ${t.fg}`:'1px solid #e5e7eb',background:active?t.bg:'#fff',color:active?t.fg:'#4b5563',fontSize:'12px',fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>
                <span>{t.label}</span>
                <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px',color:active?t.fg:'#9ca3af'}}>
                  <span>{t.emoji}</span>
                  <span>({count})</span>
                </span>
              </button>
            );
          })}
          {/* "เฉพาะมีความคิดเห็น" — สีเทาเหมือน chips อื่นๆ */}
          <button type="button" onClick={()=>setOnlyWithComments(v=>!v)}
            title="แสดงเฉพาะเวอร์ชั่นที่มีความคิดเห็น"
            style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border: onlyWithComments?'1.5px solid #6b7280':'1px solid #e5e7eb',background: onlyWithComments?'#f3f4f6':'#fff',color: onlyWithComments?'#374151':'#4b5563',fontSize:'12px',fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>
            <span>เฉพาะมีความคิดเห็น</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px',color: onlyWithComments?'#374151':'#9ca3af'}}>
              <i className="fa-regular fa-comment"></i>
              <span>({Object.values(commentCounts).filter(n=>n>0).length})</span>
            </span>
          </button>
          {hasTagRowFilter && (
            <button type="button" onClick={clearTagFilters}
              style={{padding:'6px 10px',borderRadius:'8px',border:'1.5px solid #ef4444',background:'#fef2f2',color:'#b91c1c',fontSize:'11px',fontWeight:700,cursor:'pointer',marginTop:'2px'}}>
              <i className="fa-solid fa-xmark" style={{marginRight:'4px'}}></i>ล้างตัวกรอง
            </button>
          )}
        </div>
        )}
      </div>

      {/* ── v0.7.17.3 — Filter bar (แถบ 2: ตัวกรองความคิดเห็น) — collapsible — สีอำพันเดิม ── */}
      <div style={{background:'#fffbeb',borderRadius:'14px',border:'1px solid #fde68a',boxShadow:'0 4px 12px rgba(245,158,11,0.08)',flexShrink:0}}>
        {/* Header — กดเปิด/พับ (สีอำพัน) */}
        <button type="button" className="tb-cl-header-cmt" onClick={()=>setFilterCmtOpen(o=>!o)}
          style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:filterCmtOpen?'#fef3c7':'#fffbeb',border:'none',cursor:'pointer',transition:'background 0.15s',borderBottom:filterCmtOpen?'1px solid #fde68a':'none',borderRadius:filterCmtOpen?'14px 14px 0 0':'14px'}}>
          <i className="fa-solid fa-comments" style={{color:'#d97706',fontSize:'13px'}}></i>
          <span style={{fontSize:'13px',fontWeight:700,color:'#92400e',flex:1,textAlign:'left'}}>ตัวกรองความคิดเห็น</span>
          {hasCommentRowFilter && <span style={{fontSize:'9px',fontWeight:700,color:'#fff',background:'#d97706',padding:'2px 6px',borderRadius:'999px'}}>มีกรอง</span>}
          <i className={`fa-solid ${filterCmtOpen?'fa-chevron-up':'fa-chevron-down'}`} style={{color:'#9ca3af',fontSize:'10px'}}></i>
        </button>
        {filterCmtOpen && (
        <div className="tb-cl-chips-cmt" style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:'6px'}}>
          {/* ค้นหา full-width */}
          <div style={{position:'relative'}}>
            <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'11px'}}></i>
            <input type="text" value={commentSearch} onChange={e=>setCommentSearch(e.target.value)} placeholder="ค้นหาข้อความในความคิดเห็น"
              style={{width:'100%',boxSizing:'border-box',padding:'7px 10px 7px 28px',borderRadius:'8px',border:'1px solid #fbbf24',background:'#fff',fontSize:'12px',outline:'none',color:'#1f2937',caretColor:'#d97706'}}
              onFocus={e=>{e.currentTarget.style.borderColor='#d97706';}}
              onBlur={e=>{e.currentTarget.style.borderColor='#fbbf24';}}
            />
          </div>

          {/* Status chips — แถวละอัน text-left + emoji-right + count */}
          {Object.entries(CHANGELOG_STATUS_META).map(([key,meta])=>{
            const active = selectedStatuses.has(key);
            const count = commentFilterStats.byStatus[key] || 0;
            return (
              <button key={key} type="button" onClick={()=>toggleStatus(key)}
                style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border:active?`1.5px solid ${meta.fg}`:'1px solid #e5e7eb',background:active?meta.bg:'#fff',color:active?meta.fg:'#4b5563',fontSize:'12px',fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>
                <span>{meta.label}</span>
                <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px',color:active?meta.fg:'#9ca3af'}}>
                  <span>{meta.emoji}</span>
                  <span>({count})</span>
                </span>
              </button>
            );
          })}

          {/* @ Mention picker — full-width, dropdown ออกจาก button ตรงๆ */}
          <div ref={mentionPickerRef} style={{position:'relative'}}>
          <button type="button" onClick={()=>{ const next = !mentionPickerOpen; setMentionPickerOpen(next); if (next) ensureMentionUsersLoaded(); }}
            style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border:selectedMentionUserIds.size>0?'1.5px solid #0d9488':'1px solid #5eead4',background:selectedMentionUserIds.size>0?'#ccfbf1':'#f0fdfa',color:'#0f766e',fontSize:'12px',fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
            <span>แท็กผู้ใช้</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px'}}>
              {selectedMentionUserIds.size>0 && <span style={{fontSize:'10px',background:'#0d9488',color:'#fff',padding:'1px 6px',borderRadius:'999px'}}>{selectedMentionUserIds.size}</span>}
              <i className="fa-solid fa-at"></i>
              <i className={`fa-solid ${mentionPickerOpen?'fa-chevron-up':'fa-chevron-down'}`} style={{fontSize:'9px'}}></i>
            </span>
          </button>

          {mentionPickerOpen && (
            <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:60,background:'#fff',border:'2px solid #0d9488',borderRadius:'10px',maxHeight:'240px',overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,0.18)'}}>
              {/* Search ภายใน */}
              <div style={{position:'sticky',top:0,background:'#fff',padding:'8px',borderBottom:'1px solid #f1f5f9'}}>
                <input type="text" value={mentionQuery} onChange={e=>setMentionQuery(e.target.value)} placeholder="ค้นหาชื่อ"
                  style={{width:'100%',padding:'5px 8px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'6px',outline:'none',color:'#1f2937',caretColor:'#0d9488'}}/>
              </div>
              {mentionLoading && (
                <div style={{padding:'12px',fontSize:'11px',color:'#9ca3af',textAlign:'center'}}>
                  <i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...
                </div>
              )}
              {!mentionLoading && mentionUsers !== null && (() => {
                const q = mentionQuery.trim().toLowerCase();
                const filtered = q
                  ? mentionUsers.filter(u => (u.username||'').toLowerCase().includes(q) || (u.display_name||'').toLowerCase().includes(q))
                  : mentionUsers;
                if (filtered.length === 0) {
                  return <div style={{padding:'12px',fontSize:'11px',color:'#9ca3af',textAlign:'center',fontStyle:'italic'}}>ไม่พบผู้ใช้</div>;
                }
                return filtered.map(u => {
                  const checked = selectedMentionUserIds.has(u.id);
                  const isAdminUser = u.role === 'admin';
                  // v0.7.17.3 — 2-line layout: username บรรทัดบน, full name บรรทัดล่าง + title tooltip
                  return (
                    <label key={u.id} className={'tb-mention-filter-row' + (isAdminUser ? ' is-admin' : '')}
                      title={`@${u.username} · ${u.display_name}${u.profession_label?' · '+u.profession_label:''}`}
                      style={{display:'flex',flexDirection:'column',gap:'2px',padding:'7px 10px',cursor:'pointer',fontSize:'12px',color:'#1f2937',background:isAdminUser?'#fef3c7':(checked?'#ecfdf5':'transparent'),borderLeft:isAdminUser?'3px solid #d97706':'3px solid transparent',borderBottom:'1px solid #f1f5f9'}}>
                      {/* บรรทัดบน: checkbox + @username + ADMIN + count */}
                      <div style={{display:'flex',alignItems:'center',gap:'6px',width:'100%'}}>
                        <input type="checkbox" checked={checked} onChange={()=>toggleMentionUser(u.id)} style={{cursor:'pointer',flexShrink:0}}/>
                        <b style={{color:isAdminUser?'#92400e':'#0f766e',flexShrink:0}}>@{u.username}</b>
                        {isAdminUser && <span style={{fontSize:'9px',fontWeight:800,color:'#fff',background:'#d97706',padding:'1px 5px',borderRadius:'999px',flexShrink:0}}>ADMIN</span>}
                        <span style={{marginLeft:'auto',fontSize:'10px',color:'#9ca3af',flexShrink:0}}>({commentFilterStats.byMentionedId[u.id]||0})</span>
                      </div>
                      {/* บรรทัดล่าง: display_name + profession (เยื้องตาม checkbox) */}
                      <div style={{display:'flex',alignItems:'center',gap:'4px',paddingLeft:'24px',fontSize:'11px'}}>
                        <span style={{color:'#374151',fontWeight:600,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',flex:'1 1 auto',minWidth:0}}>{u.display_name}</span>
                        {u.profession_label && <span style={{color:'#6b7280',fontSize:'10px',flexShrink:0}}>· {u.profession_label}</span>}
                      </div>
                    </label>
                  );
                });
              })()}
              <div style={{padding:'6px 10px',borderTop:'1px solid #f1f5f9',textAlign:'right'}}>
                <button type="button" onClick={()=>setMentionPickerOpen(false)}
                  style={{padding:'4px 12px',borderRadius:'6px',border:'1px solid #0d9488',background:'#fff',color:'#0f766e',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pills user ที่เลือก */}
        {selectedMentionUserIds.size > 0 && (
          <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
            {[...selectedMentionUserIds].map(id => {
              const u = (mentionUsers||[]).find(x=>x.id===id);
              if (!u) return null;
              return (
                <span key={id} style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 8px',borderRadius:'999px',background:'#ccfbf1',color:'#0f766e',fontSize:'10px',fontWeight:700,border:'1px solid #5eead4'}}>
                  @{u.username}
                  <button type="button" onClick={(e)=>{e.stopPropagation();toggleMentionUser(id);}}
                    style={{cursor:'pointer',border:'none',background:'transparent',color:'#0f766e',fontSize:'12px',padding:0,lineHeight:1,marginLeft:'2px'}}>×</button>
                </span>
              );
            })}
          </div>
        )}

          {/* Resolved tri-state — full-width 3-button group */}
          <div style={{display:'flex',width:'100%',border:'1px solid #fbbf24',borderRadius:'8px',overflow:'hidden'}}>
            {[
              { v:'all', label:'ทั้งหมด', count: null },
              { v:'open', label:'ยังไม่จัดการ', count: commentFilterStats.openCount },
              { v:'resolved', label:'จัดการแล้ว', count: commentFilterStats.resolvedCount },
            ].map(({v,label,count}, i) => {
              const active = resolvedFilter === v;
              return (
                <button key={v} type="button"
                  onClick={()=>setResolvedFilter(active && v !== 'all' ? 'all' : v)}
                  style={{flex:1,padding:'7px 4px',border:'none',borderLeft:i>0?'1px solid #fbbf24':'none',background:active?'#d97706':'#fff',color:active?'#fff':'#92400e',fontSize:'11px',fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
                  {label}{count !== null && <span style={{fontSize:'10px',opacity:0.8,marginLeft:'3px'}}>({count})</span>}
                </button>
              );
            })}
          </div>

          {/* v0.7.17.3 — ความคิดเห็นของฉัน + extras: สีเทาเหมือน status chips */}
          <button type="button" onClick={()=>setOnlyMyComments(v=>!v)}
            disabled={!commentsMeta.currentUserId}
            title={!commentsMeta.currentUserId ? 'ต้องเข้าสู่ระบบก่อน' : 'แสดงเฉพาะความคิดเห็นของคุณ'}
            style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border:onlyMyComments?'1.5px solid #6b7280':'1px solid #e5e7eb',background:onlyMyComments?'#f3f4f6':'#fff',color:onlyMyComments?'#374151':'#4b5563',fontSize:'12px',fontWeight:600,cursor:commentsMeta.currentUserId?'pointer':'not-allowed',opacity:commentsMeta.currentUserId?1:0.5,transition:'all 0.15s'}}>
            <span>ความคิดเห็นของฉัน</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px',color:onlyMyComments?'#374151':'#9ca3af'}}>
              <i className="fa-solid fa-user"></i>
              <span>({commentFilterStats.mineCount})</span>
            </span>
          </button>

          {[
            { k:'liked',      icon:'fa-solid fa-thumbs-up',     label:'ที่ฉันถูกใจ',    count: commentFilterStats.likedCount },
            { k:'my_replies', icon:'fa-solid fa-reply',         label:'ที่ฉันตอบ',      count: commentFilterStats.myRepliesCount },
            { k:'unread',     icon:'fa-regular fa-envelope',    label:'ยังไม่อ่าน',     count: commentFilterStats.unreadCount },
          ].map(({k,icon,label,count})=>{
            const active = extraFilters.has(k);
            const disabled = !commentsMeta.currentUserId;
            return (
              <button key={k} type="button" onClick={()=>{ if(!disabled) toggleExtra(k); }}
                disabled={disabled}
                title={disabled ? 'ต้องเข้าสู่ระบบก่อน' : label}
                style={{display:'flex',width:'100%',boxSizing:'border-box',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:'8px',border:active?'1.5px solid #6b7280':'1px solid #e5e7eb',background:active?'#f3f4f6':'#fff',color:active?'#374151':'#4b5563',fontSize:'12px',fontWeight:600,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,transition:'all 0.15s'}}>
                <span>{label}</span>
                <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'11px',color:active?'#374151':'#9ca3af'}}>
                  <i className={icon}></i>
                  <span>({count})</span>
                </span>
              </button>
            );
          })}

          {/* ปุ่มล้างค่า */}
          {hasCommentRowFilter && (
            <button type="button" onClick={clearCommentFilters}
              style={{padding:'6px 10px',borderRadius:'8px',border:'1.5px solid #ef4444',background:'#fef2f2',color:'#b91c1c',fontSize:'11px',fontWeight:700,cursor:'pointer',marginTop:'2px'}}>
              <i className="fa-solid fa-xmark" style={{marginRight:'4px'}}></i>ล้างตัวกรอง
            </button>
          )}
        </div>
        )}
      </div>

      </div>) : (
        /* ตอนพับ — เห็นแค่ไอคอน 🎚 (กดปุ่ม chevron เพื่อขยาย) */
        <div style={{padding:'40px 8px 12px',textAlign:'center'}}>
          <i className="fa-solid fa-sliders" style={{color:'#0d9488',fontSize:'18px'}}></i>
        </div>
      )}
      </aside>

      {/* ── Right column: body (timeline / grouped) — scroll อิสระ ── */}
      <div ref={rightColRef}
        style={{flex:1,minWidth:0,height:'100%',overflowY:'auto',overscrollBehavior:'contain',paddingRight:'8px',position:'relative'}}>
        {view === 'timeline' ? (
          // ─── Timeline view — ขยาย 780→936px (+20%) ───
          <div style={{maxWidth:'936px',margin:'0 auto'}}>
            {filteredTimeline.length === 0 ? (
              <div style={{textAlign:'center',padding:'60px 20px',color:'#9ca3af'}}>
                <i className="fa-solid fa-magnifying-glass-minus" style={{fontSize:'32px',marginBottom:'12px',display:'block'}}></i>
                <p style={{fontSize:'14px',fontWeight:600,margin:0}}>ไม่พบเวอร์ชันที่ตรงกับตัวกรอง</p>
                <button type="button" onClick={clearFilters} style={{marginTop:'12px',padding:'8px 16px',borderRadius:'8px',border:'1px solid #14b8a6',background:'#fff',color:'#0d9488',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>ล้างตัวกรอง</button>
              </div>
            ) : (
              timelineToRender.map((v) => {
                const color = v._color;
                const isLatest = v.version === latestVersion;
                const visibleChanges = filterChanges(v.changes);
                if (visibleChanges.length === 0 && selectedTags.size > 0) return null;
                const isOpen = expandedComments.has(v.version);
                return (
                  <div key={v.version} className="cl-version-row" style={{display:'flex',gap:'14px',marginBottom:'14px'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0,paddingTop:'6px'}}>
                      <div style={{width:'12px',height:'12px',borderRadius:'50%',background:color,boxShadow:`0 0 0 3px ${color}22`}}></div>
                      <div style={{width:'2px',flex:1,background:'#e5e7eb',marginTop:'4px'}}></div>
                    </div>
                    <div style={{flex:1,background:'#fff',border:'1px solid #e5e7eb',borderRadius:'14px',padding:'14px 16px',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginBottom:'6px'}}>
                        <span style={{fontWeight:800,fontSize:'15px',color}}>v{highlightMatch(v.version)}</span>
                        <span style={{fontSize:'11px',color:'#9ca3af'}}>{v.date}</span>
                        <CommitChip v={v} color={color}/>
                        {isLatest && <span style={{fontSize:'10px',fontWeight:700,color:'#92400e',background:'#fef3c7',padding:'2px 8px',borderRadius:'999px'}}>ล่าสุด</span>}
                        {commentCounts[v.version] > 0 && (
                          <button type="button" tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                            onClick={e=>{e.stopPropagation();setOnlyWithComments(v=>!v);}}
                            title={`มี ${commentCounts[v.version]} ความคิดเห็น — กดเพื่อกรองเฉพาะที่มีความคิดเห็น`}
                            style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:700,color:onlyWithComments?'#fff':'#92400e',background:onlyWithComments?'#d97706':'#fef3c7',border:onlyWithComments?'1px solid #b45309':'1px solid #fbbf24',padding:'2px 7px',borderRadius:'999px',transition:'all 0.15s'}}>
                            <i className="fa-regular fa-comment"></i>{commentCounts[v.version]}
                          </button>
                        )}
                        <TagBreakdown changes={v.changes}/>
                      </div>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#1f2937',margin:'0 0 8px'}}>{highlightMatch(v.title)}</p>
                      {visibleChanges.map((c,i)=><ChangeRow key={`${i}-${c.tag}`} change={c}/>)}
                      {(() => {
                        const hasComments = commentCounts[v.version] > 0;
                        // มี comment → สีอำพัน / ไม่มี → สี teal
                        const border = hasComments
                          ? (isOpen ? '#d97706' : '#fbbf24')
                          : (isOpen ? '#0d9488' : '#5eead4');
                        const bg = hasComments
                          ? (isOpen ? '#fef3c7' : '#fffbeb')
                          : (isOpen ? '#ccfbf1' : '#f0fdfa');
                        const fg = hasComments ? '#92400e' : '#0f766e';
                        const badgeBg = hasComments ? '#d97706' : '#0d9488';
                        return (
                          <button type="button" tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                            onClick={e=>{e.stopPropagation();toggleComments(v.version);}}
                            style={{cursor:'pointer',width:'100%',marginTop:'10px',padding:'10px 14px',border:'1.5px solid '+border,background:bg,color:fg,fontSize:'13px',borderRadius:'10px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'space-between',transition:'all 0.15s'}}>
                            <span>
                              <i className="fa-regular fa-comment" style={{marginRight:'8px'}}></i>ความคิดเห็น
                              {hasComments && <span style={{background:badgeBg,color:'#fff',fontSize:'10px',padding:'1px 7px',borderRadius:'999px',marginLeft:'4px'}}>{commentCounts[v.version]}</span>}
                              {commentsMeta.isAdmin && commentDeletedCounts[v.version] > 0 && (
                                <span style={{marginLeft:'6px',fontSize:'11px',color:'#991b1b',fontWeight:600}}>
                                  · <i className="fa-solid fa-trash" style={{fontSize:'9px'}}></i> ลบไป {commentDeletedCounts[v.version]}
                                </span>
                              )}
                            </span>
                            <span style={{fontSize:'12px',fontWeight:600,opacity:0.85}}>
                              {isOpen ? 'ซ่อน' : (hasComments ? 'ดูความคิดเห็น' : 'เขียนความคิดเห็น')} <i className={'fa-solid '+(isOpen?'fa-chevron-up':'fa-chevron-down')} style={{marginLeft:'4px',fontSize:'10px'}}></i>
                            </span>
                          </button>
                        );
                      })()}
                      {/* v0.7.15.4 — keep mounted ตลอดหลังเปิดครั้งแรก → ปิด/เปิดครั้งถัดไป instant */}
                      {everOpenedVersions.has(v.version) && (
                        <div style={{display: isOpen ? 'block' : 'none'}}>
                          <ChangelogCommentSection key={'cmt-'+v.version} version={v.version}
                            theme={commentCounts[v.version] > 0 ? 'amber' : 'teal'}
                            initialComments={allCommentsByVersion[v.version] || []}
                            currentUserId={commentsMeta.currentUserId}
                            isAdmin={commentsMeta.isAdmin}
                            onRefresh={refreshAllComments}
                            onCountChange={n=>setCommentCount(v.version, n)}
                            highlightCommentId={highlightCommentTarget?.version === v.version ? highlightCommentTarget.commentId : null}
                            pageFilter={{ hasFilter: hasCommentFilter, matches: commentMatchesAxes }}/>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {/* v0.7.17.0 — ปุ่มดูเพิ่ม (lazy load timeline) */}
            {filteredTimeline.length > visibleTimelineCount && (
              <div style={{textAlign:'center',padding:'16px 0 24px'}}>
                <button type="button"
                  onClick={()=>setVisibleTimelineCount(c => c + 20)}
                  style={{cursor:'pointer',padding:'10px 24px',border:'1.5px solid #14b8a6',background:'#fff',color:'#0d9488',fontSize:'13px',fontWeight:700,borderRadius:'999px',boxShadow:'0 1px 3px rgba(13,148,136,0.12)',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.borderColor='#0d9488';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.borderColor='#14b8a6';}}>
                  <i className="fa-solid fa-chevron-down" style={{marginRight:'6px',fontSize:'11px'}}></i>
                  ดูเวอร์ชั่นเก่าอีก {Math.min(20, filteredTimeline.length - visibleTimelineCount)} เวอร์ชั่น
                  <span style={{marginLeft:'8px',fontSize:'11px',color:'#9ca3af',fontWeight:500}}>
                    ({visibleTimelineCount} / {filteredTimeline.length})
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // ─── Grouped view ───
          <div style={{maxWidth:'1056px',margin:'0 auto'}}>
            {CHANGELOG.map(major => {
              const expanded = expandedMajors.has(major.major);
              const filteredVersions = major.versions.filter(matchesFilters);
              if (filteredVersions.length === 0 && hasActiveFilters) return null;
              return (
                <div key={major.major} style={{marginBottom:'14px',background:'#fff',border:'1px solid #e5e7eb',borderRadius:'16px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
                  {/* Major header */}
                  <div onClick={()=>toggleMajor(major.major)}
                    style={{padding:'16px 20px',background:`linear-gradient(135deg,${major.color}11,${major.color}05)`,borderLeft:`5px solid ${major.color}`,cursor:'pointer',display:'flex',alignItems:'center',gap:'14px',transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background=`linear-gradient(135deg,${major.color}1f,${major.color}0a)`}
                    onMouseLeave={e=>e.currentTarget.style.background=`linear-gradient(135deg,${major.color}11,${major.color}05)`}>
                    <div style={{fontSize:'28px'}}>{major.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:800,fontSize:'16px',color:major.color,margin:0}}>รุ่น v{major.major}.x — {major.era}</p>
                      <p style={{fontSize:'12px',color:'#6b7280',margin:'2px 0 0',lineHeight:1.5}}>{major.description}</p>
                      <p style={{fontSize:'11px',color:'#9ca3af',margin:'3px 0 0'}}>
                        <i className="fa-solid fa-calendar" style={{marginRight:'5px'}}></i>{major.period} · {filteredVersions.length} เวอร์ชัน
                      </p>
                    </div>
                    <i className={`fa-solid fa-chevron-${expanded?'up':'down'}`} style={{color:major.color,fontSize:'14px'}}></i>
                  </div>
                  {/* Minor groups list (e.g. 0.7.1, 0.7.2, ..., 0.7.13) */}
                  {expanded && (
                    <div style={{padding:'4px 20px 16px'}}>
                      {groupByMinor(filteredVersions).map(({minorKey, versions}) => {
                        const minorOpen = expandedMinors.has(minorKey);
                        const hasMultiple = versions.length > 1;
                        const latestInMinor = versions[0]; // ใหม่สุดในกลุ่ม
                        return (
                          <div key={minorKey} style={{borderTop:'1px solid #f1f5f9',padding:'8px 0'}}>
                            {/* Minor header */}
                            <div onClick={()=>toggleMinor(minorKey)}
                              style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',borderRadius:'10px',transition:'background 0.15s',background:minorOpen?`${major.color}0d`:'transparent'}}
                              onMouseEnter={e=>{if(!minorOpen)e.currentTarget.style.background='#f9fafb'}}
                              onMouseLeave={e=>{if(!minorOpen)e.currentTarget.style.background='transparent'}}>
                              <i className={`fa-solid fa-chevron-${minorOpen?'down':'right'}`} style={{color:major.color,fontSize:'11px',width:'11px'}}></i>
                              <span style={{fontWeight:800,fontSize:'14px',color:major.color,minWidth:'90px'}}>v{highlightMatch(minorKey)}</span>
                              <span style={{fontSize:'12px',color:'#6b7280',flex:1}}>{highlightMatch(latestInMinor.title)}</span>
                              {hasMultiple && <span style={{fontSize:'11px',fontWeight:700,color:major.color,background:`${major.color}1a`,padding:'2px 8px',borderRadius:'999px'}}>{versions.length} เวอร์ชันย่อย</span>}
                              {!hasMultiple && <span style={{fontSize:'11px',color:'#9ca3af'}}>{latestInMinor.date}</span>}
                            </div>
                            {/* Patch-level versions inside this minor */}
                            {minorOpen && (
                              <div style={{padding:'4px 4px 4px 24px',borderLeft:`2px dashed ${major.color}33`,marginLeft:'9px',marginTop:'4px'}}>
                                {versions.map(v => {
                                  const isOpen = expandedVersions.has(v.version);
                                  const visibleChanges = filterChanges(v.changes);
                                  const isLatest = v.version === latestVersion;
                                  return (
                                    <div key={v.version} style={{padding:'4px 0'}}>
                                      <div onClick={()=>toggleVersion(v.version)}
                                        style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'10px',padding:'6px 8px',borderRadius:'8px',transition:'background 0.15s'}}
                                        onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                        <i className={`fa-solid fa-chevron-${isOpen?'down':'right'}`} style={{color:'#9ca3af',fontSize:'10px',width:'10px'}}></i>
                                        <span style={{fontWeight:700,fontSize:'12px',color:major.color,minWidth:'78px'}}>v{highlightMatch(v.version)}</span>
                                        <span style={{fontSize:'11px',color:'#9ca3af',minWidth:'90px'}}>{v.date}</span>
                                        <span style={{fontSize:'12px',color:'#374151',flex:1}}>{highlightMatch(v.title)}</span>
                                        {isLatest && <span style={{fontSize:'9px',fontWeight:700,color:'#92400e',background:'#fef3c7',padding:'2px 7px',borderRadius:'999px'}}>ล่าสุด</span>}
                                        <TagBreakdown changes={v.changes} small/>
                                      </div>
                                      {isOpen && (
                                        <div style={{padding:'4px 4px 4px 24px',borderLeft:`2px solid ${major.color}22`,marginLeft:'5px',marginTop:'2px'}}>
                                          {visibleChanges.map((c,i)=><ChangeRow key={`${i}-${c.tag}`} change={c}/>)}
                                          {v.commit && <div style={{margin:'8px 0 0'}}><CommitChip v={v} color={major.color} small/></div>}
                                          {(() => {
                                            const has = commentCounts[v.version] > 0;
                                            const bg = has ? '#fffbeb' : '#f0fdfa';
                                            const bd = has ? '#fbbf24' : '#5eead4';
                                            const fg = has ? '#92400e' : '#0f766e';
                                            const bdgBg = has ? '#d97706' : '#0d9488';
                                            return (
                                              <div style={{marginTop:'10px',padding:'8px 12px',background:bg,border:'1px solid '+bd,borderRadius:'8px',fontSize:'12px',fontWeight:700,color:fg,display:'flex',alignItems:'center',gap:'6px'}}>
                                                <i className="fa-regular fa-comment"></i>
                                                <span>ความคิดเห็น {has && <span style={{background:bdgBg,color:'#fff',padding:'1px 7px',borderRadius:'999px',marginLeft:'4px',fontSize:'10px'}}>{commentCounts[v.version]}</span>} — เขียน หรือดูความคิดเห็นด้านล่าง</span>
                                              </div>
                                            );
                                          })()}
                                          <ChangelogCommentSection version={v.version}
                                            theme={commentCounts[v.version] > 0 ? 'amber' : 'teal'}
                                            initialComments={allCommentsByVersion[v.version] || []}
                                            currentUserId={commentsMeta.currentUserId}
                                            isAdmin={commentsMeta.isAdmin}
                                            onRefresh={refreshAllComments}
                                            onCountChange={n=>setCommentCount(v.version, n)}
                                            highlightCommentId={highlightCommentTarget?.version === v.version ? highlightCommentTarget.commentId : null}/>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>{/* /right column */}

      {/* v0.7.17.3 — ScrollNav ของคอลัมน์ขวา (ขึ้น/ลง auto-detect) */}
      <ScrollNav getContainer={()=>rightColRef.current} />
      </div>{/* /2-column layout */}

      {/* Commit detail popup */}
      {commitDetailEntry && (
        <CommitDetailModal
          entry={commitDetailEntry.entry}
          color={commitDetailEntry.color}
          copiedHash={copiedHash}
          copiedFull={copiedFull}
          onCopy={copyHash}
          onCopyFull={()=>copyFullCommit(commitDetailEntry.entry)}
          onClose={()=>setCommitDetailEntry(null)}
        />
      )}

      {/* Local toast (มุมขวาล่าง — เด้งแล้วหายเอง 2 วินาที) */}
      {localToast && (
        <div style={{position:'fixed',bottom:'24px',right:'24px',zIndex:80,background:'#065f46',color:'#fff',padding:'12px 20px',borderRadius:'10px',fontSize:'13px',fontWeight:600,boxShadow:'0 8px 24px rgba(0,0,0,0.25)',display:'flex',alignItems:'center',gap:'8px'}}
          className="modal-toast">
          <i className="fa-solid fa-circle-check" style={{fontSize:'16px'}}></i>
          {localToast.text}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CommitDetailModal — popup กลางจอ แสดง commit body ฉบับเต็ม
// ═══════════════════════════════════════════════════════════════════════════
function CommitDetailModal({ entry, color, copiedHash, copiedFull, onCopy, onCopyFull, onClose }) {
  const {closing, close, modalCls, overlayCls} = useModalAnim(onClose);
  const fullHash = entry.commitFull || entry.commit;
  const justCopiedHash = copiedHash === fullHash;
  const justCopiedFull = copiedFull === entry.version;
  const ghUrl = (entry.commitFull || entry.commit) && entry.commit !== 'pending'
    ? `https://github.com/sirawitphaopha/tb-dashboard-bysirawit/commit/${entry.commitFull || entry.commit}`
    : null;
  return (
    <div className={"fixed inset-0 z-[70] flex items-center justify-center p-4 "+overlayCls}
      style={{background:'rgba(15,23,42,0.55)',backdropFilter:'blur(3px)'}}
      onClick={close}>
      <div className={modalCls} onClick={e=>e.stopPropagation()}
        style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'760px',maxHeight:'85vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 24px 60px rgba(0,0,0,0.3)'}}>
        {/* Header */}
        <div style={{padding:'18px 22px',background:`linear-gradient(135deg,${color||'#0f766e'},${color||'#0f766e'}dd)`,color:'#fff',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:'12px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <i className="fa-solid fa-file-lines" style={{fontSize:'18px'}}></i>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:800,fontSize:'15px',margin:0,lineHeight:1.4}}>{entry.title}</p>
              <p style={{fontSize:'12px',margin:'4px 0 0',opacity:0.9}}>v{entry.version} · {entry.date}</p>
              <div style={{display:'flex',gap:'6px',marginTop:'8px',flexWrap:'wrap',alignItems:'center'}}>
                <button type="button" tabIndex={-1} onMouseDown={e=>e.preventDefault()} onClick={()=>onCopy(fullHash)}
                  title="คลิกเพื่อ copy commit hash (full SHA-1, 40 ตัว)"
                  style={{cursor:'pointer',border:'none',fontSize:'10px',fontFamily:'monospace',background: justCopiedHash ? '#d1fae5' : 'rgba(255,255,255,0.12)',color: justCopiedHash ? '#065f46' : '#fff',padding:'4px 10px',borderRadius:'6px',fontWeight:600,wordBreak:'break-all',maxWidth:'100%',textAlign:'left',transition:'all 0.15s'}}>
                  <i className={'fa-solid '+(justCopiedHash?'fa-check':'fa-code-commit')} style={{marginRight:'5px'}}></i>{justCopiedHash ? 'คัดลอกแล้ว' : fullHash}
                </button>
                <button type="button" onClick={onCopyFull} title="คัดลอก commit ฉบับเต็ม (รวม body)"
                  style={{cursor:'pointer',border:'none',fontSize:'11px',background: justCopiedFull ? '#d1fae5' : '#fef3c7',color: justCopiedFull ? '#065f46' : '#92400e',padding:'4px 10px',borderRadius:'6px',fontWeight:700,transition:'all 0.15s'}}>
                  <i className={(justCopiedFull ? 'fa-solid fa-check' : 'fa-regular fa-copy')} style={{marginRight:'5px'}}></i>{justCopiedFull ? 'คัดลอกแล้ว' : 'คัดลอกทั้งหมด'}
                </button>
                {ghUrl && (
                  <a href={ghUrl} target="_blank" rel="noopener noreferrer"
                    style={{fontSize:'11px',background:'rgba(255,255,255,0.2)',color:'#fff',padding:'4px 10px',borderRadius:'6px',fontWeight:700,textDecoration:'none'}}>
                    <i className="fa-brands fa-github" style={{marginRight:'5px'}}></i>เปิดใน GitHub
                  </a>
                )}
              </div>
            </div>
            <button type="button" onClick={close}
              style={{width:'32px',height:'32px',borderRadius:'8px',border:'none',background:'rgba(255,255,255,0.2)',color:'#fff',cursor:'pointer',flexShrink:0}}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
        {/* Body — scrollable monospace */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px',background:'#fafafa'}}>
          {entry.body
            ? <pre style={{margin:0,fontFamily:'monospace',fontSize:'12.5px',color:'#374151',lineHeight:1.7,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{entry.body}</pre>
            : <p style={{fontSize:'13px',color:'#9ca3af',textAlign:'center',padding:'40px 20px'}}>
                <i className="fa-solid fa-file-circle-question" style={{fontSize:'24px',display:'block',marginBottom:'10px'}}></i>
                ยังไม่มีรายละเอียด commit body สำหรับเวอร์ชันนี้
              </p>
          }
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ChangelogCommentSection — ระบบ comment ต่อ version
// • ทุกคนเห็น comment ของทุกคน
// • เขียน/แก้ไข/ลบ ของตัวเอง (admin ลบของคนอื่นได้)
// • 4 status: feedback / bug_report / request / note
// ═══════════════════════════════════════════════════════════════════════════
const CHANGELOG_STATUS_META = {
  feedback:   { emoji:'💬', label:'ความเห็น',   bg:'#dbeafe', fg:'#1e3a8a', border:'#93c5fd' },
  bug_report: { emoji:'🐛', label:'แจ้งบั๊ก',   bg:'#fee2e2', fg:'#991b1b', border:'#fca5a5' },
  request:    { emoji:'✨', label:'ขอฟีเจอร์', bg:'#f3e8ff', fg:'#6b21a8', border:'#d8b4fe' },
  note:       { emoji:'📝', label:'บันทึก',     bg:'#f1f5f9', fg:'#334155', border:'#cbd5e1' },
};

const ChangelogCommentSection = React.memo(function ChangelogCommentSection({ version, onCountChange, theme, initialComments, currentUserId: propsUserId, isAdmin: propsIsAdmin, onRefresh, pageFilter, highlightCommentId }) {
  const T = theme === 'amber'
    ? { bg:'#fffbeb', border:'#f59e0b', accent:'#92400e', accent2:'#d97706', sub:'#b45309', cardBorder:'#fbbf24', formBorder:'#f59e0b' }
    : { bg:'#f0fdfa', border:'#99f6e4', accent:'#0f766e', accent2:'#0d9488', sub:'#5eead4', cardBorder:'#ccfbf1', formBorder:'#5eead4' };
  const [comments, setComments] = React.useState(initialComments || []);
  const [loading, setLoading]   = React.useState(!initialComments);
  const [error, setError]       = React.useState('');
  const [currentUserId, setCurrentUserId] = React.useState(propsUserId || null);
  const [isAdmin, setIsAdmin]   = React.useState(!!propsIsAdmin);
  React.useEffect(() => {
    if (initialComments) {
      // v0.7.15.1 fix — merge optimistic _pending comments ที่ parent ยังไม่เห็น
      // match ด้วย signature (user_id + comment_text + version + parent_comment_id)
      // เพราะ id ของ optimistic = tmp-xxx ไม่ตรงกับ id จริงของ server
      setComments(prev => {
        // flatten incoming: parents + replies
        const flatIncoming = [];
        for (const c of initialComments) {
          flatIncoming.push(c);
          if (Array.isArray(c.replies)) flatIncoming.push(...c.replies);
        }
        const stillPending = prev.filter(c => {
          if (!c._pending) return false;
          // เก็บไว้ถ้า server ยังไม่มี comment ที่ match
          const matched = flatIncoming.some(ic =>
            ic.user_id === c.user_id &&
            ic.comment_text === c.comment_text &&
            ic.version === c.version &&
            (ic.parent_comment_id || null) === (c.parent_comment_id || null)
          );
          return !matched;
        });
        return stillPending.length > 0 ? [...initialComments, ...stillPending] : initialComments;
      });
      setLoading(false);
    }
    if (propsUserId !== undefined) setCurrentUserId(propsUserId);
    if (propsIsAdmin !== undefined) setIsAdmin(!!propsIsAdmin);
  }, [initialComments, propsUserId, propsIsAdmin]);
  // v0.7.16.7+ — draft auto-save keys (localStorage)
  const draftKey = 'tb_draft_' + version;
  const draftStatusKey = 'tb_draft_status_' + version;
  const [draftText, setDraftText] = React.useState(() => {
    try { return localStorage.getItem(draftKey) || ''; } catch { return ''; }
  });
  const [draftStatus, setDraftStatus] = React.useState(() => {
    try { return localStorage.getItem(draftStatusKey) || 'feedback'; } catch { return 'feedback'; }
  });
  const [draftSavedAt, setDraftSavedAt] = React.useState(null); // indicator "บันทึกเมื่อ HH:MM"
  const [uploadToast, setUploadToast] = React.useState(false); // toast แสดง "ฟีเจอร์อัปโหลดยังไม่เปิด"
  const showUploadToast = React.useCallback(() => {
    setUploadToast(true);
    setTimeout(() => setUploadToast(false), 2800);
  }, []);
  // Save draft → localStorage (debounced 1.5s)
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (draftText) {
          localStorage.setItem(draftKey, draftText);
          localStorage.setItem(draftStatusKey, draftStatus);
          setDraftSavedAt(Date.now());
        } else {
          localStorage.removeItem(draftKey);
          localStorage.removeItem(draftStatusKey);
        }
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [draftText, draftStatus, draftKey, draftStatusKey]);
  const [submitting, setSubmitting]   = React.useState(false);
  const [editingId, setEditingId]   = React.useState(null);
  const [editText, setEditText]     = React.useState('');
  const [editStatus, setEditStatus] = React.useState('feedback');
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [confirmDelId, setConfirmDelId] = React.useState(null);
  // v0.7.14.5 states
  const [filterMode, setFilterMode] = React.useState('all');
  const [sortMode, setSortMode]     = React.useState('oldest');
  const [hideResolved, setHideResolved] = React.useState(false);
  const [replyingToId, setReplyingToId] = React.useState(null);
  const [replyText, setReplyText]       = React.useState('');
  const [replyStatus, setReplyStatus]   = React.useState('feedback');
  const [savingReply, setSavingReply]   = React.useState(false);
  // v0.7.16.7+ — reply draft auto-save per parentId
  React.useEffect(() => {
    if (!replyingToId) return;
    const t = setTimeout(() => {
      try {
        const k = 'tb_draft_reply_' + replyingToId;
        if (replyText) localStorage.setItem(k, replyText);
        else localStorage.removeItem(k);
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [replyText, replyingToId]);
  // edit draft auto-save per commentId
  React.useEffect(() => {
    if (!editingId) return;
    const t = setTimeout(() => {
      try {
        const k = 'tb_draft_edit_' + editingId;
        if (editText) localStorage.setItem(k, editText);
        else localStorage.removeItem(k);
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [editText, editingId]);
  const [historyOpenId, setHistoryOpenId] = React.useState(null);
  const [historyData, setHistoryData]     = React.useState(null);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [mentionState, setMentionState] = React.useState(null);
  const [revealDeletedIds, setRevealDeletedIds] = React.useState(new Set());
  const toggleRevealDeleted = (id) => setRevealDeletedIds(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });
  // Tick state — บังคับ re-render ทุก 30s เพื่ออัป relative time ("4 นาทีที่แล้ว")
  // v0.7.15.1 — tick 60s (เดิม 30s) → ลด re-render ครึ่งหนึ่ง
  // relative time "4 นาทีที่แล้ว" → "5 นาที" — ไม่ละเอียดวินาที ยอมรับได้
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const onCountChangeRef = React.useRef(onCountChange);
  const onRefreshRef = React.useRef(onRefresh);
  React.useEffect(() => { onCountChangeRef.current = onCountChange; onRefreshRef.current = onRefresh; });

  // นับ active + deleted (admin เห็นทั้งคู่)
  const { activeCount, deletedCount } = React.useMemo(() => {
    let a = 0, d = 0;
    for (const c of comments) {
      if (c.deleted_at) d += 1; else a += 1;
      if (Array.isArray(c.replies)) for (const r of c.replies) { if (r.deleted_at) d += 1; else a += 1; }
    }
    return { activeCount: a, deletedCount: d };
  }, [comments]);
  React.useEffect(() => { if (onCountChangeRef.current) onCountChangeRef.current(activeCount); }, [activeCount]);

  // กรอง + เรียง parent (deleted ยังคงแสดงเป็น tombstone — ไม่ filter ออก ยกเว้น status filter)
  const visibleParents = React.useMemo(() => {
    let arr = comments.filter(c => !c.parent_comment_id);
    if (filterMode === 'unresolved_bug')          arr = arr.filter(c => c.status === 'bug_report' && !c.resolved_at && !c.deleted_at);
    else if (filterMode === 'unresolved_request') arr = arr.filter(c => c.status === 'request' && !c.resolved_at && !c.deleted_at);
    else if (filterMode === 'bug')      arr = arr.filter(c => c.status === 'bug_report' && !c.deleted_at);
    else if (filterMode === 'request')  arr = arr.filter(c => c.status === 'request' && !c.deleted_at);
    else if (filterMode === 'feedback') arr = arr.filter(c => c.status === 'feedback' && !c.deleted_at);
    else if (filterMode === 'note')     arr = arr.filter(c => c.status === 'note' && !c.deleted_at);
    if (hideResolved) arr = arr.filter(c => !c.resolved_at);
    arr = [...arr];
    if (sortMode === 'newest')    arr.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortMode === 'oldest') arr.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortMode === 'most_liked') arr.sort((a,b) => (b.likes_count||0) - (a.likes_count||0));
    return arr;
  }, [comments, filterMode, sortMode, hideResolved]);

  // v0.7.17.1 — Lazy render comments (15 ก่อน + ดูเพิ่ม)
  // v0.7.17.2 — fix: ถ้ามี highlightCommentId (กระดิ่ง navigate) ที่ตรงกับ comment ใน list → render ครบ
  //              กัน scroll หา cmt-{id} ไม่เจอเพราะอยู่นอกช่วง lazy
  const [visibleCmtCount, setVisibleCmtCount] = React.useState(15);
  React.useEffect(() => { setVisibleCmtCount(15); }, [filterMode, sortMode, hideResolved]);
  const hasHighlightInList = React.useMemo(() => {
    if (!highlightCommentId) return false;
    return visibleParents.some(c =>
      c.id === highlightCommentId || (c.replies||[]).some(r => r.id === highlightCommentId)
    );
  }, [highlightCommentId, visibleParents]);
  const visibleCommentParents = React.useMemo(
    () => hasHighlightInList ? visibleParents : visibleParents.slice(0, visibleCmtCount),
    [visibleParents, visibleCmtCount, hasHighlightInList]
  );

  const load = React.useCallback(async () => {
    if (onRefreshRef.current) { await onRefreshRef.current(); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`/api/changelog/comments?version=${encodeURIComponent(version)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'load failed');
      setComments(j.comments || []);
      setCurrentUserId(j.current_user_id);
      setIsAdmin(!!j.is_admin);
    } catch (e) { setError(e.message || 'โหลด comment ล้มเหลว'); }
    finally { setLoading(false); }
  }, [version]);

  // ถ้า parent ไม่ส่ง initialComments มา → fallback โหลดเอง
  React.useEffect(() => {
    if (initialComments === undefined && !onRefresh) load();
  }, [initialComments, onRefresh, load]);

  // v0.7.14.7 — หา snapshot ของ user ปัจจุบันจาก comment เก่า (display_name + profession_label)
  const findMySnapshot = () => {
    for (const c of comments) {
      if (c.user_id === currentUserId) return { display_name: c.display_name, profession_label: c.profession_label, role: c.role };
      if (Array.isArray(c.replies)) {
        for (const r of c.replies) {
          if (r.user_id === currentUserId) return { display_name: r.display_name, profession_label: r.profession_label, role: r.role };
        }
      }
    }
    return { display_name: 'คุณ', profession_label: '', role: isAdmin ? 'admin' : 'user' };
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const t = draftText.trim();
    if (!t) return;
    if (t.length > 2000) { setError('comment ยาวเกิน 2000 ตัวอักษร'); return; }
    setSubmitting(true); setError('');
    // ── Optimistic: push comment ทันที ──
    const tempId = 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2,8);
    const me = findMySnapshot();
    const optimistic = {
      id: tempId,
      version,
      user_id: currentUserId,
      display_name: me.display_name,
      profession_label: me.profession_label,
      role: me.role,
      comment_text: t,
      status: draftStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      edited: false,
      parent_comment_id: null,
      resolved_at: null,
      mentioned_user_ids: [],
      deleted_at: null,
      likes_count: 0,
      liked_by_me: false,
      replies: [],
      _pending: true,
    };
    setComments(prev => [...prev, optimistic]);
    setDraftText(''); setDraftStatus('feedback');
    // clear localStorage draft (success path)
    try { localStorage.removeItem(draftKey); localStorage.removeItem(draftStatusKey); } catch {}
    setDraftSavedAt(null);
    try {
      const r = await fetch('/api/changelog/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version, comment_text: t, status: draftStatus }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'submit failed');
      await load(); // refetch → replace temp ด้วย real
    } catch (e) {
      setError(e.message || 'ส่ง comment ล้มเหลว');
      // rollback + คืน text + restore draft
      setComments(prev => prev.filter(c => c.id !== tempId));
      setDraftText(t);
    } finally { setSubmitting(false); }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    // ถ้ามี draft edit เก่าใน localStorage → ใช้ค่านั้น (กันหาย)
    let savedDraft = '';
    try { savedDraft = localStorage.getItem('tb_draft_edit_' + c.id) || ''; } catch {}
    setEditText(savedDraft || c.comment_text);
    setEditStatus(c.status);
  };
  const cancelEdit = () => {
    if (editingId) { try { localStorage.removeItem('tb_draft_edit_' + editingId); } catch {} }
    setEditingId(null); setEditText('');
  };
  const saveEdit = async (id) => {
    const t = editText.trim();
    if (!t) return;
    setSavingEdit(true); setError('');
    // Backup เพื่อ rollback
    const before = comments;
    const nowIso = new Date().toISOString();
    // ── Optimistic: update local ทันที ──
    const applyEdit = (c) => c.id === id
      ? { ...c, comment_text: t, status: editStatus, edited: true, updated_at: nowIso }
      : c;
    setComments(prev => prev.map(c => {
      const updated = applyEdit(c);
      if (Array.isArray(c.replies)) {
        const nr = c.replies.map(applyEdit);
        if (nr.some((r,i) => r !== c.replies[i])) return { ...updated, replies: nr };
      }
      return updated;
    }));
    try { localStorage.removeItem('tb_draft_edit_' + id); } catch {}
    setEditingId(null);
    try {
      const r = await fetch(`/api/changelog/comment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: t, status: editStatus }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'edit failed');
      await load();
    } catch (e) {
      setError(e.message || 'แก้ไขล้มเหลว');
      setComments(before); // rollback
    } finally { setSavingEdit(false); }
  };

  const doDelete = async (id) => {
    setError('');
    const nowIso = new Date().toISOString();
    setComments(prev => prev.map(p => {
      if (p.id === id) return { ...p, deleted_at: nowIso, deleted_by: currentUserId };
      if (Array.isArray(p.replies)) {
        let t = false;
        const nr = p.replies.map(r => { if (r.id === id) { t = true; return { ...r, deleted_at: nowIso, deleted_by: currentUserId }; } return r; });
        if (t) return { ...p, replies: nr };
      }
      return p;
    }));
    setConfirmDelId(null);
    try {
      const r = await fetch(`/api/changelog/comment/${id}`, { method: 'DELETE' });
      if (!r.ok) { const j = await r.json(); setError(j.error || 'ลบล้มเหลว'); await load(); }
    } catch (e) { setError(e.message || 'ลบล้มเหลว'); await load(); }
  };

  // v0.7.14.5 handlers
  const toggleLike = async (c) => {
    const wasLiked = c.liked_by_me;
    setComments(prev => prev.map(p => {
      if (p.id === c.id) return { ...p, liked_by_me: !wasLiked, likes_count: (p.likes_count||0) + (wasLiked ? -1 : 1) };
      if (Array.isArray(p.replies)) {
        const nr = p.replies.map(r => r.id === c.id ? { ...r, liked_by_me: !wasLiked, likes_count: (r.likes_count||0) + (wasLiked ? -1 : 1) } : r);
        if (nr !== p.replies) return { ...p, replies: nr };
      }
      return p;
    }));
    try { await fetch(`/api/changelog/comment/${c.id}/like`, { method: wasLiked ? 'DELETE' : 'POST' }); } catch {}
  };
  const openHistory = async (id) => {
    setHistoryOpenId(id); setHistoryLoading(true); setHistoryData(null);
    try { const r = await fetch(`/api/changelog/comment/${id}/history`); const j = await r.json(); if (r.ok) setHistoryData(j); }
    finally { setHistoryLoading(false); }
  };
  const closeHistory = () => { setHistoryOpenId(null); setHistoryData(null); };
  const startReply = (parentId, defaultStatus) => {
    setReplyingToId(parentId);
    // ดึง draft reply เก่าจาก localStorage (ถ้ามี)
    let savedDraft = '';
    try { savedDraft = localStorage.getItem('tb_draft_reply_' + parentId) || ''; } catch {}
    setReplyText(savedDraft);
    setReplyStatus(defaultStatus || 'feedback');
  };
  const cancelReply = () => {
    // ลบ draft + clear state
    if (replyingToId) { try { localStorage.removeItem('tb_draft_reply_' + replyingToId); } catch {} }
    setReplyingToId(null); setReplyText('');
  };
  const submitReply = async (parentId) => {
    const t = replyText.trim(); if (!t) return;
    if (t.length > 2000) { setError('ตอบกลับยาวเกิน 2000 ตัวอักษร'); return; }
    setSavingReply(true); setError('');
    // ── Optimistic: push reply ใน parent.replies ทันที ──
    const tempId = 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2,8);
    const me = findMySnapshot();
    const optimisticReply = {
      id: tempId,
      version,
      user_id: currentUserId,
      display_name: me.display_name,
      profession_label: me.profession_label,
      role: me.role,
      comment_text: t,
      status: replyStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      edited: false,
      parent_comment_id: parentId,
      resolved_at: null,
      mentioned_user_ids: [],
      deleted_at: null,
      likes_count: 0,
      liked_by_me: false,
      _pending: true,
    };
    setComments(prev => prev.map(c => c.id === parentId
      ? { ...c, replies: [...(c.replies||[]), optimisticReply] }
      : c
    ));
    try { localStorage.removeItem('tb_draft_reply_' + parentId); } catch {}
    cancelReply();
    try {
      const r = await fetch(`/api/changelog/comment/${parentId}/reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment_text: t, status: replyStatus }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'reply failed');
      await load();
    } catch (e) {
      setError(e.message || 'ตอบกลับล้มเหลว');
      // rollback: ลบ reply temp ออก
      setComments(prev => prev.map(c => c.id === parentId
        ? { ...c, replies: (c.replies||[]).filter(r => r.id !== tempId) }
        : c
      ));
    } finally { setSavingReply(false); }
  };
  const toggleResolve = async (c) => {
    // ── Optimistic: update resolved_at ทันที ──
    const newResolvedAt = c.resolved_at ? null : new Date().toISOString();
    setComments(prev => prev.map(p => p.id === c.id ? { ...p, resolved_at: newResolvedAt } : p));
    try {
      const r = await fetch(`/api/changelog/comment/${c.id}/resolve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resolved: !c.resolved_at }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'resolve failed');
      await load();
    } catch (e) {
      setError(e.message || 'ทำเครื่องหมายล้มเหลว');
      // rollback
      setComments(prev => prev.map(p => p.id === c.id ? { ...p, resolved_at: c.resolved_at } : p));
    }
  };

  // ── Mention autocomplete + caret position ──
  // v0.7.14.7 — ใช้ global cache (window scope) → persist ข้าม component mount → ไม่ต้องโหลดซ้ำเมื่อกลับมาหน้านี้
  // v0.7.14.7 — เตือนก่อนปิดแท็บ/รีโหลด + ตั้ง window flag สำหรับ App component
  React.useEffect(() => {
    const hasDraft = !!(draftText.trim() || editText.trim() || replyText.trim());
    window._hasUnsentChangelogDraft = hasDraft;
    if (!hasDraft) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = 'มีข้อความที่ยังไม่ได้ส่ง — ออกจากหน้านี้แล้วข้อความจะหาย';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      window._hasUnsentChangelogDraft = false;
    };
  }, [draftText, editText, replyText]);
  // cleanup เมื่อ unmount — กัน flag ค้าง
  React.useEffect(() => {
    return () => { window._hasUnsentChangelogDraft = false; };
  }, []);

  if (!window._mentionUsersCache) window._mentionUsersCache = { users: null, fetchedAt: 0 };
  const mentionCacheRef = React.useRef(window._mentionUsersCache);
  // tick → trigger re-render เมื่อ cache โหลดเสร็จ → renderCommentText แสดงสีตาม role ถูก
  const [, setMentionTick] = useState(0);
  // Pre-fetch users ตอน mount + sync กับ global cache
  React.useEffect(() => {
    if (window._mentionUsersCache.users) { mentionCacheRef.current = window._mentionUsersCache; return; }
    (async () => {
      try {
        const r = await fetch('/api/changelog/mentionable-users');
        const j = await r.json();
        if (r.ok) {
          window._mentionUsersCache = { users: j.users || [], fetchedAt: Date.now() };
          mentionCacheRef.current = window._mentionUsersCache;
          setMentionTick(t => t + 1);  // trigger re-render → render mention ถูกสี
        }
      } catch {/* ignore */}
    })();
  }, []);
  const getCaretPx = (ta) => {
    try {
      const div = document.createElement('div');
      const s = window.getComputedStyle(ta);
      ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','width','boxSizing'].forEach(p => div.style[p] = s[p]);
      div.style.position='absolute'; div.style.visibility='hidden'; div.style.top='0'; div.style.left='0'; div.style.whiteSpace='pre-wrap'; div.style.wordWrap='break-word';
      div.textContent = ta.value.substring(0, ta.selectionStart);
      const sp = document.createElement('span'); sp.textContent='​'; div.appendChild(sp);
      document.body.appendChild(div);
      const sr = sp.getBoundingClientRect(); const dr = div.getBoundingClientRect();
      const top = sr.top - dr.top + parseFloat(s.lineHeight || s.fontSize);
      const left = sr.left - dr.left;
      document.body.removeChild(div);
      return { top, left };
    } catch { return { top: 24, left: 0 }; }
  };
  const checkMention = async (text, caretPos, context, ta) => {
    const before = text.slice(0, caretPos);
    const m = before.match(/@([\w.\-ก-๛]*)$/);
    if (!m) { setMentionState(null); return; }
    const query = m[1].toLowerCase();
    const px = ta ? getCaretPx(ta) : { top: 24, left: 0 };
    // v0.7.14.7 — ถ้ามี cache แล้ว → ใช้ทันที (ไม่ขึ้น loading)
    let all = window._mentionUsersCache?.users;
    const cacheValid = all && Date.now() - (window._mentionUsersCache?.fetchedAt || 0) < 60000;
    if (cacheValid) {
      const filtered = query ? all.filter(u => (u.username||'').toLowerCase().startsWith(query) || (u.display_name||'').toLowerCase().includes(query)) : all;
      setMentionState({ context, query, users: filtered.slice(0, 8), idx: 0, caretPos, loading: false, top: px.top, left: px.left });
      return;
    }
    // ไม่มี cache → fetch + แสดง loading
    setMentionState({ context, query, users: [], idx: 0, caretPos, loading: true, top: px.top, left: px.left });
    try {
      const r = await fetch('/api/changelog/mentionable-users');
      const j = await r.json();
      if (r.ok) {
        all = j.users || [];
        window._mentionUsersCache = { users: all, fetchedAt: Date.now() };
        mentionCacheRef.current = window._mentionUsersCache;
      } else { all = []; }
    } catch { all = []; }
    const filtered = query ? all.filter(u => (u.username||'').toLowerCase().startsWith(query) || (u.display_name||'').toLowerCase().includes(query)) : all;
    setMentionState({ context, query, users: filtered.slice(0, 8), idx: 0, caretPos, loading: false, top: px.top, left: px.left });
  };
  const applyMention = (u, context) => {
    const ins = '@' + u.username + ' ';
    const apply = (text, caret) => {
      const before = text.slice(0, caret); const after = text.slice(caret);
      const replaced = before.replace(/@([\w.\-ก-๛]*)$/, ins);
      return replaced + after;
    };
    if (context === 'draft') setDraftText(apply(draftText, mentionState?.caretPos ?? draftText.length));
    else if (context === 'edit') setEditText(apply(editText, mentionState?.caretPos ?? editText.length));
    else if (context === 'reply') setReplyText(apply(replyText, mentionState?.caretPos ?? replyText.length));
    setMentionState(null);
  };
  // Keyboard handler สำหรับ textarea — รองรับ mention navigation + Enter ส่ง
  const handleTextareaKey = (e, context, submitFn) => {
    // ถ้า popup mention เปิดอยู่ → ใช้ลูกศร/Enter เลือกชื่อ
    if (mentionState && mentionState.context === context && mentionState.users.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionState(prev => prev ? { ...prev, idx: Math.min(prev.users.length - 1, prev.idx + 1) } : prev);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionState(prev => prev ? { ...prev, idx: Math.max(0, prev.idx - 1) } : prev);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const u = mentionState.users[mentionState.idx];
        if (u) applyMention(u, context);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionState(null);
        return;
      }
    }
    // Enter (ไม่กด Shift) → submit · Shift+Enter → ขึ้นบรรทัดใหม่ (default)
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && submitFn) {
      e.preventDefault();
      submitFn();
    }
  };

  const renderCommentText = (text) => {
    if (!text) return null;
    const users = window._mentionUsersCache?.users || [];
    const userRoleMap = {};
    for (const u of users) {
      if (u.username) userRoleMap[u.username.toLowerCase()] = u.role;
    }
    // v0.7.16.7+ — split รวม URL (https?://) + mention เดียวกัน
    const splitRegex = /((?:https?:\/\/[^\s<>"'()]+)|(?:@[\w.\-ก-๛]+(?:@[\w.\-]+\.[A-Za-z]{2,})?))/g;
    return text.split(splitRegex).map((p, i) => {
      if (!p) return p;
      // URL → ลิงก์คลิกได้
      if (/^https?:\/\//.test(p)) {
        // ตัดเครื่องหมายวรรคตอนท้าย URL (. , ; ) เป็นต้น)
        const trailing = p.match(/[.,;!?]+$/);
        const url = trailing ? p.slice(0, -trailing[0].length) : p;
        const after = trailing ? trailing[0] : '';
        return (
          <React.Fragment key={i}>
            <a href={url} target="_blank" rel="noopener noreferrer"
              style={{color:'#1d4ed8',textDecoration:'underline',wordBreak:'break-all',fontWeight:500}}>
              {url}
            </a>{after}
          </React.Fragment>
        );
      }
      // Mention
      if (p.startsWith('@')) {
        const uname = p.slice(1).toLowerCase();
        const role = userRoleMap[uname];
        const isAdmin = role === 'admin';
        const style = isAdmin
          ? { background:'#fef3c7', color:'#92400e', fontWeight:700, padding:'1px 5px', borderRadius:'4px', boxShadow:'0 0 6px 1px rgba(217,119,6,0.45)' }
          : role === 'user'
          ? { background:'#ccfbf1', color:'#1f2937', fontWeight:700, padding:'1px 5px', borderRadius:'4px', boxShadow:'0 0 6px 1px rgba(13,148,136,0.45)' }
          : { background:'#f3f4f6', color:'#6b7280', fontWeight:600, padding:'1px 5px', borderRadius:'4px' };
        return <span key={i} style={style}>{p}</span>;
      }
      return p;
    });
  };

  const initials = (name) => {
    const parts = (name || '').split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts.slice(0,2).map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={{marginTop:'14px',background:T.bg,border:'1px solid '+T.border,borderRadius:'12px',padding:'14px 16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px',flexWrap:'wrap',gap:'8px'}}>
        <p style={{fontWeight:700,fontSize:'13px',color:T.accent,margin:0}}>
          💬 ความคิดเห็น <span style={{color:T.sub,fontWeight:600}}>({activeCount})</span>
          {isAdmin && deletedCount > 0 && (
            <span style={{marginLeft:'8px',fontSize:'11px',color:'#991b1b',fontWeight:600}}>
              · <i className="fa-solid fa-trash" style={{fontSize:'9px'}}></i> ลบไป {deletedCount}
            </span>
          )}
        </p>
        <button type="button" onClick={(e)=>{e.stopPropagation();load();}} tabIndex={-1} onMouseDown={e=>e.preventDefault()}
          style={{cursor:'pointer',border:'1px solid '+T.sub,background:'#fff',color:T.accent2,fontSize:'11px',padding:'4px 10px',borderRadius:'6px',fontWeight:600}}>
          <i className="fa-solid fa-rotate" style={{marginRight:'4px'}}></i>โหลดใหม่
        </button>
      </div>

      {!loading && comments.length > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap',marginBottom:'10px',padding:'8px 10px',background:'#fff',border:'1px solid '+T.cardBorder,borderRadius:'8px'}}>
          <span style={{fontSize:'11px',color:'#6b7280',fontWeight:600}}>กรอง:</span>
          <select value={filterMode} onChange={e=>setFilterMode(e.target.value)} style={{fontSize:'11px',padding:'3px 8px',borderRadius:'5px',border:'1px solid #e5e7eb',color:'#1f2937',background:'#fff'}}>
            <option value="all">ทั้งหมด</option>
            <option value="unresolved_bug">บั๊กที่ยังไม่จัดการ</option>
            <option value="unresolved_request">คำขอที่ยังไม่จัดการ</option>
            <option value="feedback">💬 ความเห็น</option>
            <option value="bug">🐛 แจ้งบั๊ก</option>
            <option value="request">✨ ขอฟีเจอร์</option>
            <option value="note">📝 บันทึก</option>
          </select>
          <span style={{fontSize:'11px',color:'#6b7280',fontWeight:600,marginLeft:'4px'}}>เรียง:</span>
          <select value={sortMode} onChange={e=>setSortMode(e.target.value)} style={{fontSize:'11px',padding:'3px 8px',borderRadius:'5px',border:'1px solid #e5e7eb',color:'#1f2937',background:'#fff'}}>
            <option value="oldest">ใหม่สุดอยู่ล่าง</option>
            <option value="newest">ใหม่สุดอยู่บน</option>
            <option value="most_liked">ถูกใจมากสุด</option>
          </select>
          <label style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'#6b7280',fontWeight:600,cursor:'pointer',marginLeft:'auto'}}>
            <input type="checkbox" checked={hideResolved} onChange={e=>setHideResolved(e.target.checked)} style={{cursor:'pointer'}}/>
            ซ่อนที่จัดการแล้ว
          </label>
        </div>
      )}

      {loading && (
        <div style={{padding:'20px',textAlign:'center',color:'#9ca3af',fontSize:'12px'}}>
          <i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...
        </div>
      )}

      {!loading && error && (
        <div style={{padding:'10px 12px',background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:'8px',fontSize:'12px',color:'#991b1b',marginBottom:'10px'}}>
          ⚠️ {error}
        </div>
      )}

      {!loading && comments.length === 0 && (
        <div style={{padding:'24px',textAlign:'center',color:T.accent2,fontSize:'12px',background:'#fff',border:'1px dashed '+T.sub,borderRadius:'8px',marginBottom:'10px'}}>
          ยังไม่มีความคิดเห็น — เริ่มเขียนเป็นคนแรก!
        </div>
      )}

      {!loading && comments.length > 0 && visibleParents.length === 0 && (
        <div style={{padding:'14px',textAlign:'center',color:'#9ca3af',fontSize:'12px',background:'#fff',border:'1px dashed #e5e7eb',borderRadius:'8px',marginBottom:'10px'}}>ไม่มีความคิดเห็นตามตัวกรองนี้</div>
      )}

      {!loading && visibleParents.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'12px'}}>
          {visibleCommentParents.map(c => {
            const meta = CHANGELOG_STATUS_META[c.status] || CHANGELOG_STATUS_META.feedback;
            const isOwner = c.user_id === currentUserId;
            const canDelete = isOwner || isAdmin;
            const editing = editingId === c.id;
            const canResolve = isAdmin && !c.parent_comment_id;  // เฉพาะ admin เท่านั้น (user ไม่ใช่คนแก้บั๊ก)
            const isResolved = !!c.resolved_at;
            const isDeleted = !!c.deleted_at;
            const resolvedLabel = c.status === 'bug_report' ? 'แก้ไขบั๊กแล้ว' : c.status === 'request' ? 'เพิ่มฟีเจอร์นี้แล้ว' : 'รับทราบ';
            const cta = c.status === 'bug_report' ? { icon: 'fa-wrench', text: 'แก้ไขบั๊กนี้แล้ว' }
                      : c.status === 'request'    ? { icon: 'fa-circle-plus', text: 'เพิ่มฟีเจอร์นี้แล้ว' }
                      : c.status === 'feedback'   ? { icon: 'fa-thumbs-up', text: 'รับทราบ' }
                                                  : { icon: 'fa-bookmark', text: 'รับทราบ' };
            return (
              <div key={c.id} id={'cmt-'+c.id} className="cm-card" style={{background:(pageFilter?.hasFilter && pageFilter.matches(c))?'#fef3c7':'#fff',border:'1.5px solid '+((pageFilter?.hasFilter && pageFilter.matches(c))?'#fbbf24':T.cardBorder),borderLeft:`3px solid ${meta.fg}`,opacity:isDeleted?0.85:(c._pending?0.7:1)}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px',flexWrap:'wrap'}}>
                  <div style={{minWidth:'34px',height:'26px',padding:'0 8px',borderRadius:'999px',background:meta.bg,color:meta.fg,border:`1px solid ${meta.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'11px',flexShrink:0,lineHeight:1}}>
                    {c.profession_label || initials(c.display_name)}
                  </div>
                  <span style={{fontWeight:700,fontSize:'12px',color:'#1f2937'}}>{c.display_name}</span>
                  {c.role === 'admin' && <span style={{fontSize:'9px',fontWeight:700,color:'#0f766e',background:'#ccfbf1',padding:'1px 6px',borderRadius:'999px'}}>ADMIN</span>}
                  <span style={{display:'inline-flex',alignItems:'center',gap:'3px',padding:'2px 8px',borderRadius:'999px',background:meta.bg,color:meta.fg,border:`1px solid ${meta.border}`,fontSize:'10px',fontWeight:700}}>{meta.emoji} {meta.label}</span>
                  {isResolved && <span style={{display:'inline-flex',alignItems:'center',gap:'3px',padding:'2px 8px',borderRadius:'999px',background:'#d1fae5',color:'#065f46',border:'1px solid #6ee7b7',fontSize:'10px',fontWeight:700}} title={c.resolved_at ? `จัดการเมื่อ ${new Date(c.resolved_at).toLocaleString('th-TH')}` : ''}>✓ {resolvedLabel}</span>}
                  {isDeleted && <span style={{display:'inline-flex',alignItems:'center',gap:'3px',padding:'2px 8px',borderRadius:'999px',background:'#fee2e2',color:'#991b1b',border:'1px solid #fca5a5',fontSize:'10px',fontWeight:700}}><i className="fa-solid fa-trash" style={{fontSize:'8px'}}></i> ลบแล้ว</span>}
                  <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                    {!isDeleted && (
                      <button type="button" onClick={()=>toggleLike(c)} tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                        style={{cursor:'pointer',border:'1px solid '+(c.liked_by_me?'#d97706':'#e5e7eb'),background:c.liked_by_me?'#fef3c7':'#fff',color:c.liked_by_me?'#92400e':'#6b7280',fontSize:'11px',padding:'2px 8px',borderRadius:'6px',fontWeight:700}}>
                        👍 {c.likes_count || 0}
                      </button>
                    )}
                    {canResolve && !isResolved && !editing && !isDeleted && (
                      <button type="button" onClick={()=>toggleResolve(c)} tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                        style={{cursor:'pointer',border:'1.5px dashed #0d9488',background:'#fff',color:'#0f766e',fontSize:'10px',padding:'3px 10px',borderRadius:'6px',fontWeight:700}}
                        title="กดเพื่อบอกว่าจัดการแล้ว">
                        <i className={`fa-solid ${cta.icon}`} style={{marginRight:'4px',fontSize:'9px'}}></i>{cta.text}
                      </button>
                    )}
                    {canResolve && isResolved && !editing && !isDeleted && (
                      <button type="button" onClick={()=>toggleResolve(c)} tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                        style={{cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'10px',padding:'3px 10px',borderRadius:'6px',fontWeight:700}}>
                        <i className="fa-solid fa-rotate-left" style={{marginRight:'4px',fontSize:'9px'}}></i>ยกเลิกสถานะ
                      </button>
                    )}
                    {!editing && isOwner && !isDeleted && (
                      <button type="button" onClick={()=>startEdit(c)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} style={{cursor:'pointer',border:'none',background:'transparent',color:'#0d9488',fontSize:'11px',padding:'2px 4px',fontWeight:600}}>
                        <i className="fa-solid fa-pen" style={{marginRight:'3px',fontSize:'9px'}}></i>แก้ไข
                      </button>
                    )}
                    {!editing && canDelete && !isDeleted && (
                      <button type="button" onClick={()=>setConfirmDelId(c.id)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} style={{cursor:'pointer',border:'none',background:'transparent',color:'#dc2626',fontSize:'11px',padding:'2px 4px',fontWeight:600}}>
                        <i className="fa-solid fa-trash" style={{marginRight:'3px',fontSize:'9px'}}></i>ลบ
                      </button>
                    )}
                    <span style={{fontSize:'11px',color:'#9ca3af',whiteSpace:'nowrap'}} title={new Date(c.created_at).toLocaleString('th-TH')}>
                      {(() => {
                        const d = new Date(c.created_at); if (isNaN(d.getTime())) return '';
                        const M = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
                        return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()+543} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                      })()}
                      <span style={{marginLeft:'6px',opacity:0.75}}>({relTime(c.created_at)})</span>
                      {c.edited && (isOwner || isAdmin) ? (
                        <button type="button" onClick={()=>openHistory(c.id)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} title="กดเพื่อดูข้อความก่อนแก้ไข (เฉพาะคุณ/admin)"
                          style={{marginLeft:'6px',cursor:'pointer',border:'none',background:'transparent',color:'#0d9488',fontSize:'11px',padding:'0',fontWeight:600,textDecoration:'underline',fontStyle:'italic'}}>
                          · แก้ไขแล้ว (ดูประวัติ)
                        </button>
                      ) : c.edited && (
                        <span style={{marginLeft:'6px',fontStyle:'italic'}}>· แก้ไขแล้ว</span>
                      )}
                    </span>
                  </span>
                </div>

                {!editing && isDeleted && !(isAdmin && revealDeletedIds.has(c.id)) && (
                  <p style={{fontSize:'13px',color:'#9ca3af',fontStyle:'italic',margin:'2px 0 0',lineHeight:1.6}}>
                    [ข้อความนี้ถูกลบ]
                    {isAdmin && (
                      <button type="button" onClick={()=>toggleRevealDeleted(c.id)}
                        style={{marginLeft:'8px',cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'10px',padding:'1px 8px',borderRadius:'5px',fontWeight:600}}>
                        <i className="fa-regular fa-eye" style={{marginRight:'3px',fontSize:'8px'}}></i>ดูข้อความเดิม (admin)
                      </button>
                    )}
                  </p>
                )}
                {!editing && isDeleted && isAdmin && revealDeletedIds.has(c.id) && (
                  <div style={{margin:'2px 0 0'}}>
                    <p style={{fontSize:'17px',color:'#7c2d12',fontWeight:500,background:'#fef2f2',border:'1px dashed #fca5a5',borderRadius:'6px',padding:'10px 12px',margin:0,lineHeight:1.55,whiteSpace:'pre-wrap',wordBreak:'break-word',overflowWrap:'anywhere'}}>
                      {renderCommentText(c.comment_text)}
                    </p>
                    <button type="button" onClick={()=>toggleRevealDeleted(c.id)} style={{marginTop:'4px',cursor:'pointer',border:'none',background:'transparent',color:'#9ca3af',fontSize:'10px',padding:'1px 4px',fontWeight:600}}>
                      <i className="fa-regular fa-eye-slash" style={{marginRight:'3px'}}></i>ซ่อน
                    </button>
                  </div>
                )}
                {!editing && !isDeleted && (
                  <p className="cm-card-text">{renderCommentText(c.comment_text)}</p>
                )}

                {editing && (
                  <div style={{marginTop:'4px',position:'relative'}}>
                    <select value={editStatus} onChange={e=>setEditStatus(e.target.value)} style={{fontSize:'11px',padding:'3px 6px',borderRadius:'5px',border:'1px solid #e5e7eb',marginBottom:'6px'}}>
                      {Object.entries(CHANGELOG_STATUS_META).map(([k,m])=>(<option key={k} value={k}>{m.emoji} {m.label}</option>))}
                    </select>
                    <textarea value={editText}
                      onChange={e=>{ setEditText(e.target.value); checkMention(e.target.value, e.target.selectionStart, 'edit', e.target); }}
                      onKeyDown={e=>handleTextareaKey(e, 'edit', () => saveEdit(c.id))}
                      rows={3} maxLength={2000}
                      style={{width:'100%',padding:'8px 10px',borderRadius:'6px',border:'1px solid #d1d5db',fontSize:'13px',outline:'none',fontFamily:'inherit',resize:'vertical',color:'#1f2937',caretColor:'#0d9488',background:'#fff'}}/>
                    {mentionState && mentionState.context === 'edit' && (
                      <div style={{position:'absolute',top:(mentionState.top||24)+'px',left:(mentionState.left||0)+'px',zIndex:9999,background:'#fff',border:'2px solid #0d9488',borderRadius:'8px',padding:'4px',boxShadow:'0 8px 24px rgba(0,0,0,0.18)',minWidth:'260px',maxHeight:'220px',overflowY:'auto'}}>
                        {mentionState.loading && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280'}}><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'5px'}}></i>กำลังโหลด...</div>}
                        {!mentionState.loading && mentionState.users.length === 0 && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280',fontStyle:'italic'}}>ไม่พบผู้ใช้</div>}
                        {!mentionState.loading && mentionState.users.map((u, i) => {
                          const isAdminUser = u.role === 'admin';
                          const isActive = i === mentionState.idx;
                          const rowBg = isActive
                            ? (isAdminUser ? '#fcd34d' : '#ccfbf1')
                            : (isAdminUser ? '#fef3c7' : 'transparent');
                          return (
                            <div key={u.id} onClick={()=>applyMention(u,'edit')} onMouseDown={e=>e.preventDefault()}
                              onMouseEnter={()=>setMentionState(prev => prev ? {...prev, idx: i} : prev)}
                              style={{padding:'7px 10px',cursor:'pointer',borderRadius:'5px',fontSize:'13px',color:'#1f2937',background:rowBg,borderBottom:'1px solid #f1f5f9',borderLeft:isAdminUser?'3px solid #d97706':'3px solid transparent',transition:'background 0.12s ease'}}>
                              <b style={{color:isAdminUser?'#92400e':'#0f766e'}}>@{u.username}</b>
                              {isAdminUser && <span style={{marginLeft:'5px',fontSize:'9px',fontWeight:800,color:'#fff',background:'#d97706',padding:'1px 6px',borderRadius:'999px'}}>ADMIN</span>}
                              <span style={{color:'#374151',fontWeight:600,marginLeft:'4px'}}>· {u.display_name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{display:'flex',gap:'6px',marginTop:'6px',justifyContent:'flex-end'}}>
                      <button type="button" onClick={showUploadToast} title="แนบรูป (กำลังพัฒนา)"
                        style={{cursor:'pointer',border:'1px dashed #9ca3af',background:'#f9fafb',color:'#6b7280',fontSize:'11px',padding:'5px 10px',borderRadius:'6px',fontWeight:600}}>
                        <i className="fa-solid fa-paperclip" style={{marginRight:'3px'}}></i>แนบรูป
                      </button>
                      <button type="button" onClick={cancelEdit} disabled={savingEdit} style={{cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'11px',padding:'5px 12px',borderRadius:'6px',fontWeight:600}}>ยกเลิก</button>
                      <button type="button" onClick={()=>saveEdit(c.id)} disabled={savingEdit || !editText.trim()} style={{cursor:'pointer',border:'none',background:'#0f766e',color:'#fff',fontSize:'11px',padding:'5px 14px',borderRadius:'6px',fontWeight:700,opacity:savingEdit||!editText.trim()?0.5:1}}>{savingEdit ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                    </div>
                  </div>
                )}

                {!editing && !c.parent_comment_id && replyingToId !== c.id && !isDeleted && (
                  <div style={{marginTop:'6px'}}>
                    <button type="button" onClick={()=>startReply(c.id, c.status)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} style={{cursor:'pointer',border:'none',background:'transparent',color:T.accent2,fontSize:'11px',padding:'2px 6px',fontWeight:600}}>
                      <i className="fa-solid fa-reply" style={{marginRight:'4px'}}></i>ตอบกลับ
                    </button>
                  </div>
                )}

                {replyingToId === c.id && (
                  <div style={{marginTop:'8px',padding:'10px',background:'#f9fafb',borderRadius:'8px',border:'1px dashed '+T.cardBorder,position:'relative'}}>
                    <p style={{fontSize:'11px',color:'#6b7280',margin:'0 0 6px',fontWeight:600}}>↩ ตอบกลับ {c.display_name}</p>
                    <select value={replyStatus} onChange={e=>setReplyStatus(e.target.value)} style={{fontSize:'11px',padding:'3px 6px',borderRadius:'5px',border:'1px solid #e5e7eb',marginBottom:'6px'}}>
                      {Object.entries(CHANGELOG_STATUS_META).map(([k,m])=>(<option key={k} value={k}>{m.emoji} {m.label}</option>))}
                    </select>
                    <textarea value={replyText}
                      onChange={e=>{ setReplyText(e.target.value); checkMention(e.target.value, e.target.selectionStart, 'reply', e.target); }}
                      onKeyDown={e=>handleTextareaKey(e, 'reply', () => submitReply(c.id))}
                      rows={2} maxLength={2000} placeholder="พิมพ์ตอบกลับ... (Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่)"
                      style={{width:'100%',padding:'8px 10px',borderRadius:'6px',border:'1px solid #d1d5db',fontSize:'13px',outline:'none',fontFamily:'inherit',resize:'vertical',color:'#1f2937',caretColor:'#0d9488',background:'#fff'}}/>
                    {mentionState && mentionState.context === 'reply' && (
                      <div style={{position:'absolute',top:(mentionState.top||24)+'px',left:(mentionState.left||10)+'px',zIndex:9999,background:'#fff',border:'2px solid #0d9488',borderRadius:'8px',padding:'4px',boxShadow:'0 8px 24px rgba(0,0,0,0.18)',minWidth:'260px',maxHeight:'220px',overflowY:'auto'}}>
                        {mentionState.loading && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280'}}><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'5px'}}></i>กำลังโหลด...</div>}
                        {!mentionState.loading && mentionState.users.length === 0 && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280',fontStyle:'italic'}}>ไม่พบผู้ใช้</div>}
                        {!mentionState.loading && mentionState.users.map((u, i) => {
                          const isAdminUser = u.role === 'admin';
                          const isActive = i === mentionState.idx;
                          const rowBg = isActive
                            ? (isAdminUser ? '#fcd34d' : '#ccfbf1')
                            : (isAdminUser ? '#fef3c7' : 'transparent');
                          return (
                            <div key={u.id} onClick={()=>applyMention(u,'reply')} onMouseDown={e=>e.preventDefault()}
                              onMouseEnter={()=>setMentionState(prev => prev ? {...prev, idx: i} : prev)}
                              style={{padding:'7px 10px',cursor:'pointer',borderRadius:'5px',fontSize:'13px',color:'#1f2937',background:rowBg,borderBottom:'1px solid #f1f5f9',borderLeft:isAdminUser?'3px solid #d97706':'3px solid transparent',transition:'background 0.12s ease'}}>
                              <b style={{color:isAdminUser?'#92400e':'#0f766e'}}>@{u.username}</b>
                              {isAdminUser && <span style={{marginLeft:'5px',fontSize:'9px',fontWeight:800,color:'#fff',background:'#d97706',padding:'1px 6px',borderRadius:'999px'}}>ADMIN</span>}
                              <span style={{color:'#374151',fontWeight:600,marginLeft:'4px'}}>· {u.display_name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'6px'}}>
                      <span style={{fontSize:'10px',color:replyText.length>1900?'#dc2626':'#9ca3af'}}>{replyText.length} / 2000</span>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button type="button" onClick={showUploadToast} title="แนบรูป (กำลังพัฒนา)"
                          style={{cursor:'pointer',border:'1px dashed #9ca3af',background:'#f9fafb',color:'#6b7280',fontSize:'11px',padding:'5px 10px',borderRadius:'6px',fontWeight:600}}>
                          <i className="fa-solid fa-paperclip" style={{marginRight:'3px'}}></i>แนบรูป
                        </button>
                        <button type="button" onClick={cancelReply} disabled={savingReply} style={{cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'11px',padding:'5px 12px',borderRadius:'6px',fontWeight:600}}>ยกเลิก</button>
                        <button type="button" onClick={()=>submitReply(c.id)} disabled={savingReply || !replyText.trim()} style={{cursor:'pointer',border:'none',background:'#0f766e',color:'#fff',fontSize:'11px',padding:'5px 14px',borderRadius:'6px',fontWeight:700,opacity:savingReply||!replyText.trim()?0.5:1}}>{savingReply ? 'กำลังส่ง...' : 'ส่ง'}</button>
                      </div>
                    </div>
                  </div>
                )}

                {Array.isArray(c.replies) && c.replies.length > 0 && (
                  <div style={{marginTop:'10px',paddingLeft:'18px',borderLeft:'2px dashed '+T.cardBorder,display:'flex',flexDirection:'column',gap:'6px'}}>
                    {c.replies.map(r => {
                      const rmeta = CHANGELOG_STATUS_META[r.status] || CHANGELOG_STATUS_META.feedback;
                      const rIsOwner = r.user_id === currentUserId;
                      const rIsDeleted = !!r.deleted_at;
                      const rRevealed = isAdmin && revealDeletedIds.has(r.id);
                      return (
                        <div key={r.id} id={'cmt-'+r.id} className="cm-card-reply" style={{background:(pageFilter?.hasFilter && pageFilter.matches(r))?'#fef3c7':'#fff',border:'1px solid '+((pageFilter?.hasFilter && pageFilter.matches(r))?'#fbbf24':T.cardBorder),borderLeft:`2px solid ${rmeta.fg}`,opacity:rIsDeleted?0.75:(r._pending?0.7:1)}}>
                          <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px',flexWrap:'wrap'}}>
                            <div style={{minWidth:'30px',height:'22px',padding:'0 6px',borderRadius:'999px',background:rmeta.bg,color:rmeta.fg,border:`1px solid ${rmeta.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'10px',flexShrink:0,lineHeight:1}}>{r.profession_label || initials(r.display_name)}</div>
                            <span style={{fontWeight:700,fontSize:'11.5px',color:'#1f2937'}}>{r.display_name}</span>
                            {r.role === 'admin' && <span style={{fontSize:'9px',fontWeight:700,color:'#0f766e',background:'#ccfbf1',padding:'1px 5px',borderRadius:'999px'}}>ADMIN</span>}
                            {rIsDeleted && <span style={{fontSize:'9px',fontWeight:700,color:'#991b1b',background:'#fee2e2',border:'1px solid #fca5a5',padding:'1px 5px',borderRadius:'999px'}}><i className="fa-solid fa-trash" style={{fontSize:'7px'}}></i> ลบแล้ว</span>}
                            <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:'6px'}}>
                              {!rIsDeleted && (
                                <button type="button" onClick={()=>toggleLike(r)} tabIndex={-1} onMouseDown={e=>e.preventDefault()}
                                  style={{cursor:'pointer',border:'1px solid '+(r.liked_by_me?'#d97706':'#e5e7eb'),background:r.liked_by_me?'#fef3c7':'#fff',color:r.liked_by_me?'#92400e':'#6b7280',fontSize:'10px',padding:'1px 6px',borderRadius:'5px',fontWeight:700}}>
                                  👍 {r.likes_count || 0}
                                </button>
                              )}
                              {rIsOwner && !rIsDeleted && editingId !== r.id && <button type="button" onClick={()=>startEdit(r)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} style={{cursor:'pointer',border:'none',background:'transparent',color:'#0d9488',fontSize:'10px',padding:'1px 3px',fontWeight:600}}><i className="fa-solid fa-pen" style={{fontSize:'8px',marginRight:'2px'}}></i>แก้</button>}
                              {(rIsOwner || isAdmin) && !rIsDeleted && editingId !== r.id && <button type="button" onClick={()=>setConfirmDelId(r.id)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} style={{cursor:'pointer',border:'none',background:'transparent',color:'#dc2626',fontSize:'10px',padding:'1px 3px',fontWeight:600}}><i className="fa-solid fa-trash" style={{fontSize:'8px',marginRight:'2px'}}></i>ลบ</button>}
                              <span style={{fontSize:'10px',color:'#9ca3af',whiteSpace:'nowrap'}} title={new Date(r.created_at).toLocaleString('th-TH')}>
                                {relTime(r.created_at)}
                                {r.edited && !rIsDeleted && (rIsOwner || isAdmin) ? (
                                  <button type="button" onClick={()=>openHistory(r.id)} tabIndex={-1} onMouseDown={e=>e.preventDefault()} title="ดูข้อความก่อนแก้ไข" style={{marginLeft:'4px',cursor:'pointer',border:'none',background:'transparent',color:'#0d9488',fontSize:'10px',padding:'0',fontWeight:600,textDecoration:'underline'}}>· แก้แล้ว (ดู)</button>
                                ) : r.edited && !rIsDeleted && <span> · แก้แล้ว</span>}
                              </span>
                            </span>
                          </div>
                          {editingId === r.id ? (
                            <div style={{marginTop:'4px'}}>
                              <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2} maxLength={2000} style={{width:'100%',padding:'6px 8px',borderRadius:'5px',border:'1px solid #d1d5db',fontSize:'12px',outline:'none',fontFamily:'inherit',resize:'vertical',color:'#1f2937',caretColor:'#0d9488',background:'#fff'}}/>
                              <div style={{display:'flex',gap:'6px',marginTop:'4px',justifyContent:'flex-end'}}>
                                <button type="button" onClick={cancelEdit} style={{cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'10px',padding:'3px 10px',borderRadius:'5px',fontWeight:600}}>ยกเลิก</button>
                                <button type="button" onClick={()=>saveEdit(r.id)} disabled={savingEdit || !editText.trim()} style={{cursor:'pointer',border:'none',background:'#0f766e',color:'#fff',fontSize:'10px',padding:'3px 12px',borderRadius:'5px',fontWeight:700,opacity:savingEdit||!editText.trim()?0.5:1}}>{savingEdit?'กำลังบันทึก...':'บันทึก'}</button>
                              </div>
                            </div>
                          ) : rIsDeleted && !rRevealed ? (
                            <p style={{fontSize:'12.5px',color:'#9ca3af',fontStyle:'italic',margin:'2px 0 0',lineHeight:1.55}}>
                              [ข้อความนี้ถูกลบ]
                              {isAdmin && <button type="button" onClick={()=>toggleRevealDeleted(r.id)} style={{marginLeft:'6px',cursor:'pointer',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'9px',padding:'1px 6px',borderRadius:'4px',fontWeight:600}}><i className="fa-regular fa-eye" style={{marginRight:'2px',fontSize:'7px'}}></i>ดูเดิม</button>}
                            </p>
                          ) : rIsDeleted && rRevealed ? (
                            <div style={{margin:'2px 0 0'}}>
                              <p style={{fontSize:'15px',color:'#7c2d12',fontWeight:500,background:'#fef2f2',border:'1px dashed #fca5a5',borderRadius:'5px',padding:'8px 10px',margin:0,lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word',overflowWrap:'anywhere'}}>{renderCommentText(r.comment_text)}</p>
                              <button type="button" onClick={()=>toggleRevealDeleted(r.id)} style={{marginTop:'3px',cursor:'pointer',border:'none',background:'transparent',color:'#9ca3af',fontSize:'9px',padding:'1px 3px',fontWeight:600}}><i className="fa-regular fa-eye-slash" style={{marginRight:'2px'}}></i>ซ่อน</button>
                            </div>
                          ) : (
                            <p className="cm-card-text-reply">{renderCommentText(r.comment_text)}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {!hasHighlightInList && visibleParents.length > visibleCmtCount && (
            <div style={{textAlign:'center',padding:'6px 0'}}>
              <button type="button" onClick={()=>setVisibleCmtCount(c=>c+15)}
                style={{cursor:'pointer',padding:'6px 18px',border:'1px solid '+T.border,background:'#fff',color:T.accent,fontSize:'12px',fontWeight:700,borderRadius:'999px',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.bg;}}
                onMouseLeave={e=>{e.currentTarget.style.background='#fff';}}>
                <i className="fa-solid fa-chevron-down" style={{marginRight:'6px',fontSize:'10px'}}></i>
                ดูความคิดเห็นเพิ่มอีก {Math.min(15, visibleParents.length - visibleCmtCount)} อัน
                <span style={{marginLeft:'8px',fontSize:'10px',color:'#9ca3af',fontWeight:500}}>
                  ({visibleCmtCount} / {visibleParents.length})
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{background:'#fff',border:'1.5px solid '+T.formBorder,borderRadius:'8px',padding:'10px 12px'}}>
        <div style={{display:'flex',gap:'6px',alignItems:'center',marginBottom:'6px',flexWrap:'wrap'}}>
          <label style={{fontSize:'11px',color:'#6b7280',fontWeight:600}}>ประเภท:</label>
          <select value={draftStatus} onChange={e=>setDraftStatus(e.target.value)} style={{fontSize:'11px',padding:'3px 6px',borderRadius:'5px',border:'1px solid #e5e7eb'}}>
            {Object.entries(CHANGELOG_STATUS_META).map(([k,m])=>(<option key={k} value={k}>{m.emoji} {m.label}</option>))}
          </select>
          <span style={{marginLeft:'auto',fontSize:'10px',color:'#9ca3af',fontStyle:'italic'}} title="พิมพ์ @ แล้วเลือกชื่อจากรายการ เพื่อเรียกผู้ใช้คนนั้นในระบบ">
            <i className="fa-regular fa-circle-question" style={{marginRight:'3px',color:'#0d9488'}}></i>
            พิมพ์ <b>@</b> เพื่อเรียกผู้ใช้
          </span>
        </div>
        <div style={{position:'relative'}}>
          <textarea value={draftText}
            onChange={e=>{ setDraftText(e.target.value); checkMention(e.target.value, e.target.selectionStart, 'draft', e.target); }}
            onKeyDown={e=>handleTextareaKey(e, 'draft', () => handleSubmit())}
            rows={3} maxLength={2000}
            placeholder="เขียนความคิดเห็น ข้อเสนอแนะ หรือแจ้งบั๊กที่นี่... (พิมพ์ @ เพื่อเรียกผู้ใช้ · Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่)"
            style={{width:'100%',padding:'8px 10px',borderRadius:'6px',border:'1px solid #d1d5db',fontSize:'13px',outline:'none',fontFamily:'inherit',resize:'vertical',color:'#1f2937',caretColor:'#0d9488',background:'#fff'}}/>
          {mentionState && mentionState.context === 'draft' && (
            <div style={{position:'absolute',top:(mentionState.top||24)+'px',left:(mentionState.left||0)+'px',zIndex:9999,background:'#fff',border:'2px solid #0d9488',borderRadius:'8px',padding:'4px',boxShadow:'0 8px 24px rgba(0,0,0,0.18)',minWidth:'260px',maxHeight:'260px',overflowY:'auto'}}>
              {mentionState.loading && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280'}}><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'5px'}}></i>กำลังโหลด...</div>}
              {!mentionState.loading && mentionState.users.length === 0 && <div style={{padding:'8px 10px',fontSize:'12px',color:'#6b7280',fontStyle:'italic'}}>ไม่พบผู้ใช้</div>}
              {!mentionState.loading && mentionState.users.map((u, i) => {
                const isAdminUser = u.role === 'admin';
                const isActive = i === mentionState.idx;
                // v0.7.14.7 — admin active = อำพันเข้ม, user active = เทลจาง, idle: admin=อำพันอ่อน, user=ใส
                const rowBg = isActive
                  ? (isAdminUser ? '#fcd34d' : '#ccfbf1')
                  : (isAdminUser ? '#fef3c7' : 'transparent');
                return (
                  <div key={u.id} onClick={()=>applyMention(u,'draft')} onMouseDown={e=>e.preventDefault()}
                    onMouseEnter={()=>setMentionState(prev => prev ? {...prev, idx: i} : prev)}
                    style={{padding:'7px 10px',cursor:'pointer',borderRadius:'5px',fontSize:'13px',color:'#1f2937',background:rowBg,borderBottom:'1px solid #f1f5f9',borderLeft:isAdminUser?'3px solid #d97706':'3px solid transparent',transition:'background 0.12s ease'}}>
                    <b style={{color:isAdminUser?'#92400e':'#0f766e'}}>@{u.username}</b>
                    {isAdminUser && <span style={{marginLeft:'5px',fontSize:'9px',fontWeight:800,color:'#fff',background:'#d97706',padding:'1px 6px',borderRadius:'999px'}}>ADMIN</span>}
                    <span style={{color:'#374151',fontWeight:600,marginLeft:'4px'}}>· {u.display_name}</span>
                    {u.profession_label && <span style={{color:'#6b7280',fontSize:'11px'}}> · {u.profession_label}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'6px',gap:'8px',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'10px',color:'#9ca3af'}}>
            <span style={{color:draftText.length>1900?'#dc2626':'#9ca3af'}}>{draftText.length} / 2000</span>
            {draftSavedAt && draftText && (
              <span style={{color:'#0d9488',fontWeight:600}}><i className="fa-solid fa-cloud-arrow-up" style={{marginRight:'3px'}}></i>บันทึกอัตโนมัติแล้ว</span>
            )}
          </div>
          <div style={{display:'flex',gap:'6px'}}>
            <button type="button" onClick={showUploadToast}
              title="แนบรูป (กำลังพัฒนา)"
              style={{cursor:'pointer',border:'1px dashed #9ca3af',background:'#f9fafb',color:'#6b7280',fontSize:'12px',padding:'7px 12px',borderRadius:'6px',fontWeight:600}}>
              <i className="fa-solid fa-paperclip" style={{marginRight:'4px'}}></i>แนบรูป
            </button>
            <button type="button" onClick={()=>{ setDraftText(''); setDraftStatus('feedback'); try { localStorage.removeItem(draftKey); localStorage.removeItem(draftStatusKey); } catch {} }}
              disabled={submitting || !draftText.trim()}
              style={{cursor:(submitting||!draftText.trim())?'not-allowed':'pointer',border:'1.5px solid #ef4444',background:'#fef2f2',color:'#b91c1c',fontSize:'12px',padding:'7px 14px',borderRadius:'6px',fontWeight:700,opacity:(submitting||!draftText.trim())?0.5:1}}>
              <i className="fa-solid fa-xmark" style={{marginRight:'4px'}}></i>ยกเลิก
            </button>
            <button type="submit" disabled={submitting || !draftText.trim()} style={{cursor:'pointer',border:'none',background:'#0f766e',color:'#fff',fontSize:'12px',padding:'7px 18px',borderRadius:'6px',fontWeight:700,opacity:(submitting||!draftText.trim())?0.5:1}}>
              <i className="fa-solid fa-paper-plane" style={{marginRight:'5px'}}></i>{submitting ? 'กำลังส่ง...' : 'ส่ง'}
            </button>
          </div>
        </div>
      </form>

      {/* v0.7.16.7+ — toast แนบรูป (coming soon) */}
      {uploadToast && (
        <div style={{position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',zIndex:9999,background:'#1f2937',color:'#fff',padding:'10px 18px',borderRadius:'10px',fontSize:'13px',fontWeight:600,boxShadow:'0 8px 20px rgba(0,0,0,0.3)',display:'flex',alignItems:'center',gap:'8px'}} className="modal-toast">
          <i className="fa-solid fa-paperclip" style={{color:'#fbbf24'}}></i>
          <span>ฟีเจอร์แนบรูปกำลังพัฒนา จะเปิดในเวอร์ชั่นถัดไป</span>
        </div>
      )}

      {historyOpenId && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(2px)',zIndex:80,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={closeHistory}>
          <div onClick={e=>e.stopPropagation()} className="modal-A" style={{background:'#fff',borderRadius:'14px',padding:'18px 22px',maxWidth:'520px',width:'100%',maxHeight:'80vh',overflowY:'auto',boxShadow:'0 20px 50px rgba(0,0,0,0.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:'#1f2937',margin:0}}><i className="fa-regular fa-clock" style={{marginRight:'6px',color:'#0d9488'}}></i>ประวัติการแก้ไข</p>
              <button type="button" onClick={closeHistory} style={{cursor:'pointer',border:'none',background:'transparent',color:'#9ca3af',fontSize:'18px'}}>×</button>
            </div>
            {historyLoading && <div style={{padding:'20px',textAlign:'center',color:'#9ca3af',fontSize:'12px'}}><i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...</div>}
            {!historyLoading && historyData && (
              <div>
                <p style={{fontSize:'11px',color:'#0d9488',fontWeight:700,margin:'10px 0 6px'}}>เวอร์ชันปัจจุบัน</p>
                <div style={{background:'#f0fdfa',border:'1px solid #5eead4',borderRadius:'8px',padding:'10px 12px',marginBottom:'14px'}}>
                  <p style={{fontSize:'12.5px',color:'#374151',margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',lineHeight:1.5}}>{historyData.current.comment_text}</p>
                  <p style={{fontSize:'10px',color:'#9ca3af',margin:'4px 0 0'}}>ประเภท: {CHANGELOG_STATUS_META[historyData.current.status]?.label}</p>
                </div>
                {historyData.edits && historyData.edits.length > 0 ? (
                  <>
                    <p style={{fontSize:'11px',color:'#6b7280',fontWeight:700,margin:'14px 0 6px'}}>เวอร์ชันก่อนหน้า ({historyData.edits.length})</p>
                    {historyData.edits.map(ed => (
                      <div key={ed.id} style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'10px 12px',marginBottom:'8px'}}>
                        <p style={{fontSize:'10px',color:'#6b7280',margin:'0 0 4px'}}>{new Date(ed.edited_at).toLocaleString('th-TH')} · ประเภท: {CHANGELOG_STATUS_META[ed.old_status]?.label}</p>
                        <p style={{fontSize:'12.5px',color:'#374151',margin:0,whiteSpace:'pre-wrap',wordBreak:'break-word',lineHeight:1.5}}>{ed.old_text}</p>
                      </div>
                    ))}
                  </>
                ) : <p style={{fontSize:'11px',color:'#9ca3af',textAlign:'center',padding:'14px',fontStyle:'italic'}}>ไม่มีประวัติเก่า (อาจถูกแก้ก่อนระบบบันทึก)</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── popup ยืนยันลบ ────────────────────────────────── */}
      {confirmDelId && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',backdropFilter:'blur(2px)',zIndex:80,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}
          onClick={()=>setConfirmDelId(null)}>
          <div onClick={e=>e.stopPropagation()} className="modal-A"
            style={{background:'#fff',borderRadius:'14px',padding:'20px 22px',maxWidth:'360px',width:'100%',textAlign:'center',boxShadow:'0 20px 50px rgba(0,0,0,0.25)'}}>
            <i className="fa-solid fa-triangle-exclamation" style={{fontSize:'24px',color:'#ef4444',marginBottom:'10px',display:'block'}}></i>
            <p style={{fontSize:'14px',fontWeight:700,color:'#1f2937',margin:'0 0 6px'}}>ยืนยันลบ comment</p>
            <p style={{fontSize:'12px',color:'#6b7280',margin:'0 0 14px'}}>ลบแล้วจะไม่สามารถกู้คืนได้</p>
            <div style={{display:'flex',gap:'8px'}}>
              <button type="button" onClick={()=>setConfirmDelId(null)}
                style={{flex:1,padding:'8px',borderRadius:'8px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
                ยกเลิก
              </button>
              <button type="button" onClick={()=>doDelete(confirmDelId)}
                style={{flex:1,padding:'8px',borderRadius:'8px',border:'none',background:'#ef4444',color:'#fff',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}, (prev, next) =>
  prev.version === next.version &&
  prev.theme === next.theme &&
  prev.initialComments === next.initialComments &&
  prev.currentUserId === next.currentUserId &&
  prev.isAdmin === next.isAdmin &&
  prev.pageFilter?.hasFilter === next.pageFilter?.hasFilter &&
  prev.pageFilter?.matches === next.pageFilter?.matches
);

// ───── Main Profile Modal ─────
// ── Password Eye icon (รูปแบบเดียวกับหน้า login) ─────────────────────────────
function PwEye({ show, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:disabled?'not-allowed':'pointer',color:'#0d9488',padding:'4px',lineHeight:0,display:'flex',alignItems:'center'}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12 C7 18 17 18 22 12" />
        <path d="M2 12 C7 6 17 6 22 12" style={{transformBox:'fill-box',transformOrigin:'50% 100%',transform: show ? 'scaleY(1)':'scaleY(0)',transition:'transform 0.12s ease'}} />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" style={{transformBox:'fill-box',transformOrigin:'50% 50%',transform: show ? 'scale(1)':'scale(0)',transition:'transform 0.12s ease'}} />
      </svg>
    </button>
  );
}

// ── ฟอร์มเปลี่ยนรหัสผ่าน (แสดงในฝั่งขวาของ UserProfileModal) ───────────────────
// โลจิก + กฎความแข็งแรงรหัส เหมือนหน้าสมัคร (app/register/page.tsx) เป๊ะ
function checkPasswordStrength(pw) {
  return {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  };
}
function getPasswordStrength(checks) {
  const passed = Object.values(checks).filter(Boolean).length;
  if (passed <= 2)  return { label: 'อ่อนแอ',    color: '#ef4444', width: '20%' };
  if (passed <= 3)  return { label: 'พอใช้',     color: '#f59e0b', width: '50%' };
  if (passed === 4) return { label: 'ดี',         color: '#3b82f6', width: '75%' };
  return              { label: 'แข็งแกร่ง',   color: '#22c55e', width: '100%' };
}

function ChangePasswordPanel({ email, onBack }) {
  const [oldPw, setOldPw]             = React.useState('');
  const [newPw, setNewPw]             = React.useState('');
  const [confirmPw, setConfirmPw]     = React.useState('');
  const [showOld, setShowOld]         = React.useState(false);
  const [showNew, setShowNew]         = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading]         = React.useState(false);
  const [error, setError]             = React.useState('');
  const [success, setSuccess]         = React.useState(false);

  const checks      = checkPasswordStrength(newPw);
  const strength    = getPasswordStrength(checks);
  const passedCount = Object.values(checks).filter(Boolean).length;
  const passwordOk  = passedCount >= 4 && checks.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!oldPw || !newPw || !confirmPw) { setError('กรุณากรอกข้อมูลให้ครบทุกช่อง'); return; }
    if (!passwordOk)                    { setError('รหัสผ่านยังไม่ผ่านเกณฑ์ความปลอดภัย (ต้องผ่านอย่างน้อย 4/5 ข้อ และมีความยาว 8 ตัวอักษรขึ้นไป)'); return; }
    if (newPw !== confirmPw)            { setError('รหัสผ่านไม่ตรงกัน'); return; }
    if (newPw === oldPw)                { setError('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม'); return; }

    setLoading(true);

    // ส่งคำขอเปลี่ยนรหัสผ่านไป API กลาง (ตรวจ rate limit + verify + update + log + ส่งเมล)
    try {
      const { data: { session } } = await window._sb.auth.getSession();
      if (!session?.access_token) {
        setError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        setLoading(false);
        return;
      }

      // เปลี่ยนสำเร็จ → refresh session ใน browser ด้วยรหัสใหม่ (เพราะ admin updateUser revoke session เก่า)
      await window._sb.auth.signInWithPassword({ email, password: newPw }).catch(() => {});
    } catch (e) {
      setError('เกิดข้อผิดพลาด: ' + (e.message || 'unknown'));
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
  };

  const inputStyle = {
    width:'100%', padding:'12px 44px 12px 14px', border:'1px solid #e5e7eb', borderRadius:'12px',
    background:'#f9fafb', fontSize:'14px', outline:'none', boxSizing:'border-box',
  };
  const onFocus = (e) => { e.target.style.border = '1.5px solid #0d9488'; e.target.style.background = '#fff'; };
  const onBlur  = (e) => { e.target.style.border = '1px solid #e5e7eb';   e.target.style.background = '#f9fafb'; };

  return (
    <div>
      {/* Header: ปุ่มกลับ + ไอคอน + หัวข้อ */}
      <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'4px 0 14px',borderBottom:'1px solid #e5e7eb',marginBottom:'18px'}}>
        <button onClick={onBack} disabled={loading||success} title="กลับไปดูข้อมูลโปรไฟล์"
          style={{background:'#f3f4f6',border:'none',color:'#4b5563',cursor:loading||success?'not-allowed':'pointer',fontSize:'12px',fontWeight:600,padding:'7px 12px',borderRadius:'8px',display:'flex',alignItems:'center',gap:'6px',transition:'background 0.15s, color 0.15s'}}
          onMouseEnter={e=>{if(!loading&&!success){e.currentTarget.style.background='#ccfbf1';e.currentTarget.style.color='#0d9488';}}}
          onMouseLeave={e=>{if(!loading&&!success){e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.color='#4b5563';}}}>
          <i className="fa-solid fa-arrow-left"></i>กลับ
        </button>
        <i className="fa-solid fa-key" style={{color:'#0d9488',fontSize:'13px',marginLeft:'4px'}}></i>
        <p style={{fontSize:'13px',fontWeight:700,color:'#0d9488',margin:0,textTransform:'uppercase',letterSpacing:'0.5px'}}>เปลี่ยนรหัสผ่าน</p>
      </div>

      <p style={{fontSize:'12px',color:'#9ca3af',margin:'0 0 18px 0'}}>กรุณายืนยันรหัสผ่านเดิมก่อนตั้งรหัสผ่านใหม่</p>

        {success ? (
          <div style={{textAlign:'center',padding:'24px 0'}}>
            <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'#d1fae5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
              <i className="fa-solid fa-check" style={{fontSize:'22px',color:'#059669'}}></i>
            </div>
            <p style={{fontSize:'15px',fontWeight:700,color:'#065f46',margin:0}}>เปลี่ยนรหัสผ่านสำเร็จ</p>

            <div style={{background:'#f0fdfa',border:'1px solid #99f6e4',borderRadius:'10px',padding:'14px 16px',margin:'16px auto 0',maxWidth:'420px',textAlign:'center',wordBreak:'break-word'}}>
              <p style={{fontSize:'12px',color:'#0f766e',margin:'0 0 6px 0',fontWeight:700}}>
                <i className="fa-solid fa-envelope" style={{marginRight:'6px'}}></i>อีเมลแจ้งเตือน
              </p>
              <p style={{fontSize:'12px',color:'#134e4a',margin:0,lineHeight:1.6}}>
                ระบบได้ส่งอีเมลแจ้งเตือนการเปลี่ยนรหัสผ่านไปยังอีเมลของท่านแล้ว<br/>เพื่อความปลอดภัยของบัญชี
              </p>
            </div>

            <button onClick={onBack}
              style={{marginTop:'18px',padding:'12px 28px',borderRadius:'12px',background:'#0d9488',color:'#fff',fontWeight:700,fontSize:'14px',border:'none',cursor:'pointer',boxShadow:'0 4px 14px rgba(13,148,136,0.4)',transition:'background 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#0f766e'}
              onMouseLeave={e=>e.currentTarget.style.background='#0d9488'}>
              <i className="fa-solid fa-arrow-left" style={{marginRight:'6px'}}></i>กลับไปหน้าโปรไฟล์
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{textAlign:'left'}}>
            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'13px',fontWeight:600,color:'#4b5563',display:'block',marginBottom:'6px'}}>รหัสผ่านเดิม</label>
              <div style={{position:'relative'}}>
                <input type={showOld?'text':'password'} value={oldPw} onChange={e=>setOldPw(e.target.value)} placeholder="กรอกรหัสผ่านเดิม"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} required disabled={loading}/>
                <PwEye show={showOld} onClick={()=>setShowOld(v=>!v)} disabled={loading}/>
              </div>
            </div>

            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'13px',fontWeight:600,color:'#4b5563',display:'block',marginBottom:'6px'}}>รหัสผ่านใหม่</label>
              <div style={{position:'relative'}}>
                <input type={showNew?'text':'password'} value={newPw}
                  onChange={e=>setNewPw(e.target.value.replace(/\s/g,''))}
                  onKeyDown={e=>{if(e.key===' ') e.preventDefault();}}
                  name="new-password" autoComplete="new-password"
                  placeholder="กรอกรหัสผ่านใหม่"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} required disabled={loading}/>
                <PwEye show={showNew} onClick={()=>setShowNew(v=>!v)} disabled={loading}/>
              </div>

              {newPw && (
                <div style={{marginTop:'10px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                    <span style={{fontSize:'11px',color:'#6b7280'}}>ความแข็งแกร่ง</span>
                    <span style={{fontSize:'11px',fontWeight:700,color:strength.color}}>{strength.label}</span>
                  </div>
                  <div style={{width:'100%',height:'6px',borderRadius:'999px',background:'#f3f4f6',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:'999px',width:strength.width,background:strength.color,transition:'width 0.3s, background 0.3s'}}/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px 8px',marginTop:'8px'}}>
                    {[
                      { key:'length',  label:'อย่างน้อย 8 ตัวอักษร' },
                      { key:'upper',   label:'ตัวพิมพ์ใหญ่ (A-Z)' },
                      { key:'lower',   label:'ตัวพิมพ์เล็ก (a-z)' },
                      { key:'number',  label:'ตัวเลข (0-9)' },
                      { key:'special', label:'อักขระพิเศษ (!@#$...)' },
                    ].map(({key,label}) => (
                      <div key={key} style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <i className={`fa-solid ${checks[key]?'fa-circle-check':'fa-circle-xmark'}`}
                          style={{fontSize:'11px',color:checks[key]?'#22c55e':'#d1d5db'}}/>
                        <span style={{fontSize:'11px',color:checks[key]?'#374151':'#9ca3af'}}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{marginBottom:'8px'}}>
              <label style={{fontSize:'13px',fontWeight:600,color:'#4b5563',display:'block',marginBottom:'6px'}}>ยืนยันรหัสผ่านใหม่</label>
              <div style={{position:'relative'}}>
                <input type={showConfirm?'text':'password'} value={confirmPw}
                  onChange={e=>setConfirmPw(e.target.value.replace(/\s/g,''))}
                  onKeyDown={e=>{if(e.key===' ') e.preventDefault();}}
                  name="confirm-password" autoComplete="new-password"
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  style={{...inputStyle, border: confirmPw && confirmPw !== newPw ? '1px solid #ef4444' : '1px solid #e5e7eb'}}
                  onFocus={e=>{e.target.style.border=`1.5px solid ${confirmPw && confirmPw !== newPw ? '#ef4444' : '#0d9488'}`;e.target.style.background='#fff';}}
                  onBlur={e=>{e.target.style.border=`1px solid ${confirmPw && confirmPw !== newPw ? '#ef4444' : '#e5e7eb'}`;e.target.style.background='#f9fafb';}}
                  required disabled={loading}/>
                <PwEye show={showConfirm} onClick={()=>setShowConfirm(v=>!v)} disabled={loading}/>
              </div>
              {confirmPw && confirmPw !== newPw && (
                <p style={{fontSize:'11px',color:'#ef4444',margin:'4px 0 0'}}>รหัสผ่านไม่ตรงกัน</p>
              )}
            </div>

            {error && (
              <div style={{fontSize:'13px',padding:'10px 14px',borderRadius:'10px',background:'#fef2f2',color:'#dc2626',display:'flex',alignItems:'center',gap:'8px',marginTop:'10px',marginBottom:'4px'}}>
                <i className="fa-solid fa-circle-exclamation"></i>{error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{width:'100%',padding:'14px',borderRadius:'12px',background:loading?'#5eead4':'#0d9488',color:'#fff',fontWeight:700,fontSize:'15px',border:'none',cursor:loading?'not-allowed':'pointer',marginTop:'14px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',boxShadow:'0 4px 14px rgba(13,148,136,0.4)',transition:'background 0.2s'}}
              onMouseEnter={e=>{if(!loading) e.currentTarget.style.background='#0f766e';}}
              onMouseLeave={e=>{if(!loading) e.currentTarget.style.background='#0d9488';}}>
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลังเปลี่ยนรหัสผ่าน...</>
                : <><i className="fa-solid fa-key"></i> เปลี่ยนรหัสผ่าน</>}
            </button>
          </form>
        )}
    </div>
  );
}

// ── ฟอร์ม "อุปกรณ์ที่เข้าใช้งาน" (B3) ───────────────────────────────────────
// helper: relative time ภาษาไทย
function relTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60000);
  if (m < 1)  return 'เมื่อสักครู่';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} วันที่แล้ว`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} เดือนที่แล้ว`;
  return new Date(iso).toLocaleDateString('th-TH');
}
// FontAwesome 6.0.0 — ใช้ชื่อ icon ที่มีในเวอร์ชันนี้
// (fa-mobile-screen / fa-tablet-screen-button เพิ่งเพิ่มใน 6.1.0 → ใช้ไม่ได้)
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
function ScrollNav({ getContainer, zIndex = 30 }) {
  const [canUp, setCanUp]     = React.useState(false)
  const [canDown, setCanDown] = React.useState(false)
  const [pos, setPos]         = React.useState({ right: 22, bottom: 22 })  // px จาก viewport edges

  React.useEffect(() => {
    const el = getContainer ? getContainer() : null
    const target = el || window
    const computePos = () => {
      if (el) {
        const r = el.getBoundingClientRect()
        // ฝัง padding 16px ภายในกรอบ
        setPos({
          right:  Math.max(8, window.innerWidth  - r.right  + 16),
          bottom: Math.max(8, window.innerHeight - r.bottom + 16),
        })
      } else {
        setPos({ right: 22, bottom: 22 })
      }
    }
    const onScroll = () => {
      let top, scrollHeight, clientHeight
      if (el) {
        top = el.scrollTop; scrollHeight = el.scrollHeight; clientHeight = el.clientHeight
      } else {
        top = window.scrollY || document.documentElement.scrollTop
        scrollHeight = document.documentElement.scrollHeight
        clientHeight = window.innerHeight
      }
      setCanUp(top > 50)
      setCanDown(top + clientHeight < scrollHeight - 50)
    }
    computePos()
    onScroll()
    target.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', () => { computePos(); onScroll(); })
    // re-compute ตำแหน่งทุก 1s เผื่อ modal/layout เปลี่ยน
    const id = setInterval(computePos, 800)
    return () => {
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      clearInterval(id)
    }
  }, [getContainer])

  const scrollTo = (kind) => {
    const el = getContainer ? getContainer() : null
    const opts = { behavior: 'smooth' }
    if (kind === 'up') {
      if (el) el.scrollTo({ top: 0, ...opts }); else window.scrollTo({ top: 0, ...opts })
    } else {
      if (el) el.scrollTo({ top: el.scrollHeight, ...opts }); else window.scrollTo({ top: document.documentElement.scrollHeight, ...opts })
    }
  }

  if (!canUp && !canDown) return null
  if (typeof document === 'undefined') return null

  // สีอ่อนใสตอนปกติ → hover ค่อยเข้ม
  const btn = {
    width:'40px',height:'40px',borderRadius:'50%',
    border:'1px solid rgba(13,148,136,0.25)',
    background:'rgba(255,255,255,0.7)',
    color:'#0d9488',
    cursor:'pointer',
    boxShadow:'0 2px 6px rgba(0,0,0,0.06)',
    backdropFilter:'blur(4px)',
    WebkitBackdropFilter:'blur(4px)',
    fontSize:'14px',display:'inline-flex',alignItems:'center',justifyContent:'center',
    transition:'transform 0.15s, background 0.2s, color 0.2s, box-shadow 0.2s, border-color 0.2s'
  }
  const btnHoverEnter = (e)=>{
    e.currentTarget.style.background='#0d9488';
    e.currentTarget.style.color='#fff';
    e.currentTarget.style.borderColor='#0d9488';
    e.currentTarget.style.boxShadow='0 6px 18px rgba(13,148,136,0.45)';
    e.currentTarget.style.transform='translateY(-2px)';
  }
  const btnHoverLeave = (e)=>{
    e.currentTarget.style.background='rgba(255,255,255,0.7)';
    e.currentTarget.style.color='#0d9488';
    e.currentTarget.style.borderColor='rgba(13,148,136,0.25)';
    e.currentTarget.style.boxShadow='0 2px 6px rgba(0,0,0,0.06)';
    e.currentTarget.style.transform='translateY(0)';
  }

  // Render ผ่าน Portal ไปที่ document.body → หนีออกจาก subtree ของ modal-A
  // (modal-A ใช้ transform ใน animation → จะดักให้ position:fixed กลายเป็น relative ต่อ modal)
  return createPortal(
    <div style={{position:'fixed',right:pos.right,bottom:pos.bottom,display:'flex',flexDirection:'column',gap:'8px',zIndex}}>
      {canUp && (
        <button title="ขึ้นบนสุด" onClick={()=>scrollTo('up')} style={btn}
          onMouseEnter={btnHoverEnter} onMouseLeave={btnHoverLeave}>
          <i className="fa-solid fa-chevron-up"></i>
        </button>
      )}
      {canDown && (
        <button title="ลงล่างสุด" onClick={()=>scrollTo('down')} style={btn}
          onMouseEnter={btnHoverEnter} onMouseLeave={btnHoverLeave}>
          <i className="fa-solid fa-chevron-down"></i>
        </button>
      )}
    </div>,
    document.body
  )
}

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
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}} onClick={()=>setConfirmOpen(false)}>
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

function UserProfileModal({ onClose }) {
  const [form, setForm]                 = React.useState(null);
  const [loading, setLoading]           = React.useState(true);
  const [editingKey, setEditingKey]     = React.useState(null);
  const [tempValue, setTempValue]       = React.useState('');
  const [requestField, setRequestField] = React.useState(null);
  const [saving, setSaving]             = React.useState(false);
  const [warnClose, setWarnClose]       = React.useState(false);
  const [editErr, setEditErr]           = React.useState('');  // ข้อความเตือนใต้ช่องที่กำลังแก้ (แทน popup)
  const [showAvatarSoon, setShowAvatarSoon] = React.useState(false);  // ป้าย "เร็วๆ นี้" ตอนกดไอคอนกล้อง (ฟีเจอร์อัปโหลดรูป)
  const [mode, setMode]                 = React.useState('profile');  // 'profile' | 'changePassword' | 'sessions'
  const {close: animClose, modalCls, overlayCls} = useModalAnim(onClose);

  const handleClose = () => {
    if (editingKey !== null) { setWarnClose(true); return; }
    animClose();
  };

  // Map DB profile → form ที่ modal ใช้
  const mapDb = (db) => {
    if (!db) return null;
    // license_number ใน DB เก็บแบบเต็ม (เช่น "ภ.12345") → ตัดเหลือเฉพาะตัวเลขเพื่อให้ UI เติมคำนำหน้ากลับ
    const licenseDigits = window.tbLicenseDigits(db.license_number);
    return {
      username:       db.username,
      email:          db.email,
      role:           db.role === 'admin' ? 'Admin' : 'User',
      since:          db.approved_at
                        ? new Date(db.approved_at).toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' })
                        : '—',
      phone:          db.phone || '—',
      department:     db.department === 'อื่นๆ' ? (db.department_other || 'อื่นๆ') : db.department,
      firstName:      db.first_name,
      lastName:       db.last_name,
      profession:     db.profession,
      title:          db.title || '',  // คำนำหน้านามที่ผู้ใช้เลือก (นาย/นาง/นางสาว) — ระบบแปลงเป็นตัวย่อวิชาชีพตอนแสดง
      licenseNumber:  licenseDigits,
      hospitalName:   db.hospital_name,
      hospitalType:   db.hospital_type,
    };
  };

  // Fetch profile on mount
  React.useEffect(() => {
    fetch('/api/profile/me')
      .then(r => r.json())
      .then(data => { setForm(mapDb(data.profile)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !form) {
    return (
      <div className={overlayCls} style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(2px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center'}}
        onClick={animClose}>
        <div className={modalCls} style={{background:'#fff',borderRadius:'20px',padding:'40px',textAlign:'center',color:'#6b7280'}}>
          <i className="fa-solid fa-spinner fa-spin" style={{fontSize:'24px',color:'#0f766e'}}></i>
          <p style={{marginTop:'12px',fontSize:'14px'}}>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }


  const prof = PROFESSIONS[form.profession] || PROFESSIONS.other;
  const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim() || '—';
  const fullLicense = (prof.prefix || '') + (form.licenseNumber || '');
  const shownTitle = window.tbDisplayTitle(form.profession, form.title);  // ตัวย่อวิชาชีพตามเพศ (ภญ.) หรือคำนำหน้านาม

  // Self-editable fields (เบอร์โทร + แผนก)
  const selfFields = [
    { key:'phone',      icon:'fa-phone',   label:'เบอร์โทรศัพท์', type:'text' },
    { key:'department', icon:'fa-pills',   label:'แผนก',          type:'select', options: DEPARTMENTS },
  ];

  // Admin-approval required fields
  // key = ชื่อคอลัมน์จริงในฐานข้อมูล / currentValue = ค่าดิบ (ไม่จัดรูป) เพื่อให้บันทึกถูกตอนอนุมัติ
  const approvalFields = [
    { key:'title',          icon:'fa-user-tag',       label:'คำนำหน้าชื่อ',        currentValue: form.title, options: window.TB_NAME_PREFIXES },
    { key:'first_name',     icon:'fa-user',           label:'ชื่อ',                currentValue: form.firstName },
    { key:'last_name',      icon:'fa-user',           label:'นามสกุล',             currentValue: form.lastName },
    { key:'profession',     icon:'fa-user-doctor',    label:'วิชาชีพ',             currentValue: prof.label, options: Object.values(PROFESSIONS).map(p=>p.label) },
    { key:'license_number', icon:'fa-id-card',        label:'เลขใบประกอบ',         currentValue: form.licenseNumber, displayValue: fullLicense, hint:'กรอกเฉพาะตัวเลข ระบบจะเติมคำนำหน้าตามวิชาชีพให้อัตโนมัติ' },
    { key:'hospital_name',  icon:'fa-hospital',       label:'โรงพยาบาล',           currentValue: form.hospitalName },
    { key:'hospital_type',  icon:'fa-location-dot',   label:'ประเภทโรงพยาบาล',     currentValue: form.hospitalType, options: HOSPITAL_TYPES },
  ];

  // Read-only system fields
  const systemFields = [
    { key:'email',    icon:'fa-envelope',       label:'อีเมล',              value: form.email },
    { key:'username', icon:'fa-at',             label:'ชื่อผู้ใช้',          value: form.username },
    { key:'role',     icon: form.role === 'Admin' ? 'fa-shield' : 'fa-user',  label:'สิทธิ์การใช้งาน',     value: form.role },
    { key:'since',    icon:'fa-calendar',       label:'ใช้งานระบบตั้งแต่',   value: form.since },
  ];

  const startEdit = (field) => {
    setEditingKey(field.key);
    setEditErr('');
    setTempValue(form[field.key] === '—' ? '' : form[field.key]);
  };
  const saveEdit = async () => {
    setEditErr('');
    // ตรวจ + จัดรูปแบบเบอร์ก่อนส่ง
    let valueToSave = tempValue;
    if (editingKey === 'phone') {
      const chk = window.tbValidatePhone(tempValue);
      if (!chk.ok) { setEditErr(chk.msg); return; }
      valueToSave = window.tbFormatPhone(tempValue);
    }
    setSaving(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editingKey]: valueToSave }),
      });
      if (!res.ok) { const e = await res.json(); setEditErr('บันทึกไม่สำเร็จ: ' + e.error); setSaving(false); return; }
      setForm(f => ({ ...f, [editingKey]: valueToSave || '—' }));
      setEditingKey(null);
    } catch (e) {
      setEditErr('เกิดข้อผิดพลาด: ' + e.message);
    } finally { setSaving(false); }
  };
  const cancelEdit = () => { setEditingKey(null); setEditErr(''); };

  const saveAdminSelf = async (dbKey) => {
    setEditErr('');
    // ตรวจ + จัดรูปแบบเบอร์ก่อนส่ง
    let valueToSave = tempValue;
    if (dbKey === 'phone') {
      const chk = window.tbValidatePhone(tempValue);
      if (!chk.ok) { setEditErr(chk.msg); return; }
      valueToSave = window.tbFormatPhone(tempValue);
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/edit-self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [dbKey]: valueToSave }),
      });
      if (!res.ok) { const e = await res.json(); setEditErr('บันทึกไม่สำเร็จ: ' + e.error); setSaving(false); return; }
      // map dbKey กลับเป็น form key
      const DB_TO_FORM = {
        first_name:'firstName', last_name:'lastName', phone:'phone',
        department:'department', hospital_name:'hospitalName',
        hospital_type:'hospitalType', license_number:'licenseNumber',
      };
      const formKey = DB_TO_FORM[dbKey] || dbKey;
      setForm(f => ({ ...f, [formKey]: valueToSave || '—' }));
      setEditingKey(null);
    } catch (e) {
      setEditErr('เกิดข้อผิดพลาด: ' + e.message);
    } finally { setSaving(false); }
  };

  // Render row helpers
  const SectionHeader = ({ icon, color, label, hint }) => (
    <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'14px 0 6px',borderBottom:'1px solid #e5e7eb',marginBottom:'4px'}}>
      <i className={`fa-solid ${icon}`} style={{color,fontSize:'11px'}}></i>
      <p style={{fontSize:'11px',fontWeight:700,color,margin:0,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</p>
      {hint && <span style={{fontSize:'10px',color:'#9ca3af',marginLeft:'auto'}}>{hint}</span>}
    </div>
  );

  const RowShell = ({ icon, label, children, action }) => (
    <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #f1f5f9'}}>
      <span style={{width:'32px',height:'32px',borderRadius:'8px',background:'#fffbeb',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <i className={`fa-solid ${icon}`} style={{color:'#d97706',fontSize:'13px'}}></i>
      </span>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>{label}</p>
        {children}
      </div>
      {action}
    </div>
  );

  return (
    <>
      <div className={overlayCls} style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(2px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
        <div className={modalCls} style={{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'920px',
          // v0.7.17.3 — หน้าโปรไฟล์ปล่อยให้กรอบหดตาม content (ไม่โล่ง)
          //             หน้าอื่น (อุปกรณ์ / เปลี่ยนรหัสผ่าน) ล็อค height ไว้ ไม่ขยับตอนกรอง
          ...(mode === 'profile'
            ? { maxHeight: 'min(88vh, 720px)' }
            : { height: '88vh', maxHeight: '720px' }),
          display:'flex',flexDirection:'row',boxShadow:'0 20px 60px rgba(0,0,0,0.15)',overflow:'hidden'}}>

          {/* ═══ LEFT: Header column ═══ */}
          <div style={{background:'linear-gradient(160deg,#0f766e,#14b8a6)',padding:'32px 24px',width:'280px',flexShrink:0,display:'flex',flexDirection:'column',position:'relative'}}>

            <div style={{textAlign:'center',marginTop:'10px'}}>
              <div style={{position:'relative',width:'90px',margin:'0 auto 16px'}}>
                <div style={{width:'90px',height:'90px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'3px solid rgba(255,255,255,0.3)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:(shownTitle||'').length>3?'15px':'22px'}}>
                  {shownTitle}
                </div>
                <button onClick={()=>setShowAvatarSoon(true)} title="อัปโหลดรูปโปรไฟล์ (เร็วๆ นี้)"
                  style={{position:'absolute',bottom:'0',right:'0',width:'30px',height:'30px',borderRadius:'50%',background:'#fff',border:'2px solid #14b8a6',color:'#0f766e',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,0.15)'}}>
                  <i className="fa-solid fa-camera" style={{fontSize:'12px'}}></i>
                </button>
              </div>
              {showAvatarSoon && (
                <p style={{fontSize:'11px',color:'#fef3c7',background:'rgba(0,0,0,0.15)',borderRadius:'8px',padding:'5px 10px',margin:'0 0 12px',display:'inline-block'}}>
                  <i className="fa-solid fa-clock" style={{marginRight:'5px'}}></i>อัปโหลดรูปโปรไฟล์ — เร็วๆ นี้ (กำลังพัฒนา)
                </p>
              )}
              <p style={{fontWeight:800,fontSize:'18px',color:'#fff',margin:0,lineHeight:1.3}}>{shownTitle} {fullName}</p>
              <p style={{fontSize:'13px',color:'rgba(255,255,255,0.85)',margin:'5px 0 0'}}>{prof.label}</p>
              {fullLicense && <p style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',margin:'2px 0 0'}}><i className="fa-solid fa-id-card" style={{marginRight:'5px',fontSize:'11px'}}></i>{fullLicense}</p>}
              <span style={{display:'inline-block',marginTop:'12px',background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:'11px',fontWeight:700,padding:'4px 12px',borderRadius:'20px'}}>
                <i className={"fa-solid " + (form.role === 'Admin' ? 'fa-shield' : 'fa-user')} style={{marginRight:'5px'}}></i>{form.role}
              </span>
            </div>

            {/* Mini stats / quick info */}
            <div style={{marginTop:'24px',padding:'14px',background:'rgba(255,255,255,0.1)',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.15)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                <i className="fa-solid fa-hospital" style={{color:'rgba(255,255,255,0.8)',fontSize:'12px',width:'14px'}}></i>
                <p style={{fontSize:'11px',color:'#fff',margin:0,fontWeight:600,lineHeight:1.3}}>{form.hospitalName}</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                <i className="fa-solid fa-pills" style={{color:'rgba(255,255,255,0.8)',fontSize:'12px',width:'14px'}}></i>
                <p style={{fontSize:'11px',color:'#fff',margin:0,fontWeight:600}}>{form.department}</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <i className="fa-solid fa-calendar" style={{color:'rgba(255,255,255,0.8)',fontSize:'12px',width:'14px'}}></i>
                <p style={{fontSize:'11px',color:'#fff',margin:0,fontWeight:600}}>เริ่มใช้ {form.since}</p>
              </div>
            </div>

            {/* Footer buttons inside left col */}
            <div style={{marginTop:'auto',paddingTop:'20px',display:'flex',flexDirection:'column',gap:'8px'}}>
              <button onClick={()=>setMode('changePassword')}
                style={{width:'100%',padding:'10px',borderRadius:'10px',border:'1.5px solid rgba(255,255,255,0.35)',background:'rgba(255,255,255,0.15)',color:'#fff',fontWeight:600,fontSize:'12px',cursor:'pointer',transition:'background 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.25)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
                <i className="fa-solid fa-key" style={{marginRight:'6px'}}></i>เปลี่ยนรหัสผ่าน
              </button>
              <button onClick={()=>setMode('sessions')}
                style={{width:'100%',padding:'10px',borderRadius:'10px',border:'1.5px solid rgba(255,255,255,0.35)',background:'rgba(255,255,255,0.15)',color:'#fff',fontWeight:600,fontSize:'12px',cursor:'pointer',transition:'background 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.25)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
                <i className="fa-solid fa-shield-halved" style={{marginRight:'6px'}}></i>อุปกรณ์ที่เข้าใช้งาน
              </button>
              <button onClick={handleClose} style={{width:'100%',padding:'11px',borderRadius:'10px',border:'none',background:'rgba(255,255,255,0.95)',color:'#0f766e',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>

          {/* ═══ RIGHT: Content column ═══ */}
          <div style={{flex:1,overflowY:'auto',padding:'20px 28px'}}>

            {mode === 'changePassword' ? (
              <ChangePasswordPanel email={form.email} onBack={()=>setMode('profile')} />
            ) : mode === 'sessions' ? (
              <SessionsPanel onBack={()=>setMode('profile')} />
            ) : (
            <>
            {/* Sections */}
            {form.role === 'Admin' ? (
              <>
                <SectionHeader icon="fa-user" color="#d97706" label="ข้อมูลโปรไฟล์" hint="✏️ กดปุ่มปากกาเพื่อแก้ไข" />
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
                  {[
                    { key:'title',       dbKey:'title',         icon:'fa-user-tag',     label:'คำนำหน้าชื่อ',       type:'select', options: window.TB_NAME_PREFIXES },
                    { key:'firstName',   dbKey:'first_name',    icon:'fa-user',         label:'ชื่อ',               type:'text' },
                    { key:'lastName',    dbKey:'last_name',     icon:'fa-user',         label:'นามสกุล',            type:'text' },
                    { key:'phone',       dbKey:'phone',         icon:'fa-phone',        label:'เบอร์โทรศัพท์',      type:'text' },
                    { key:'department',  dbKey:'department',    icon:'fa-pills',        label:'แผนก',               type:'select', options: DEPARTMENTS },
                    { key:'hospitalName',dbKey:'hospital_name', icon:'fa-hospital',     label:'โรงพยาบาล',          type:'text' },
                    { key:'hospitalType',dbKey:'hospital_type', icon:'fa-location-dot', label:'ประเภทโรงพยาบาล',    type:'select', options: HOSPITAL_TYPES },
                    { key:'licenseNumber',dbKey:'license_number',icon:'fa-id-card',    label:'เลขใบประกอบ',         type:'text' },
                  ].map(field => (
                    <div key={field.key} style={field.key==='title'?{gridColumn:'1 / -1'}:undefined}>
                    <RowShell icon={field.icon} label={field.label}
                      action={editingKey === field.key
                        ? (
                          <div style={{display:'flex',gap:'4px'}}>
                            <button onClick={cancelEdit} style={{width:'28px',height:'28px',borderRadius:'7px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',cursor:'pointer'}}>
                              <i className="fa-solid fa-xmark" style={{fontSize:'11px'}}></i>
                            </button>
                            <button onClick={()=>saveAdminSelf(field.dbKey)} style={{width:'28px',height:'28px',borderRadius:'7px',border:'none',background:'#d97706',color:'#fff',cursor:'pointer'}}>
                              <i className="fa-solid fa-check" style={{fontSize:'11px'}}></i>
                            </button>
                          </div>
                        ) : (
                          <button onClick={()=>startEdit(field)} title="แก้ไข"
                            style={{width:'28px',height:'28px',borderRadius:'7px',border:'1px solid #d1fae5',background:'#f0fdfa',color:'#0d9488',cursor:'pointer'}}>
                            <i className="fa-solid fa-pen" style={{fontSize:'11px'}}></i>
                          </button>
                        )}>
                      {editingKey === field.key
                        ? (<>
                            {field.type === 'select'
                            ? <select value={tempValue} onChange={e=>setTempValue(e.target.value)} autoFocus
                                style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #d97706',outline:'none',background:'transparent',padding:'2px 0',cursor:'pointer'}}>
                                <option value="">— เลือก —</option>
                                {(field.options||[]).map(o=><option key={o} value={o}>{o}</option>)}
                              </select>
                            : field.key === 'phone'
                              ? <input value={tempValue} onChange={e=>setTempValue(window.tbFormatPhone(e.target.value))} autoFocus
                                  placeholder="08x-xxx-xxxx"
                                  style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #d97706',outline:'none',background:'transparent',padding:'2px 0'}}/>
                            : field.key === 'licenseNumber'
                              ? <div style={{display:'flex',alignItems:'center',gap:'6px',borderBottom:'1.5px solid #d97706'}}>
                                  {prof.prefix && <span style={{fontSize:'13px',fontWeight:700,color:'#0d9488',flexShrink:0}}>{prof.prefix}</span>}
                                  <input value={tempValue} onChange={e=>setTempValue(e.target.value.replace(/\D/g,''))} autoFocus
                                    placeholder="กรอกเฉพาะตัวเลข"
                                    style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',outline:'none',background:'transparent',padding:'2px 0'}}/>
                                </div>
                              : <input value={tempValue} onChange={e=>setTempValue(e.target.value)} autoFocus
                                  style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #d97706',outline:'none',background:'transparent',padding:'2px 0'}}/>}
                            {editErr && <p style={{fontSize:'11px',color:'#ef4444',margin:'4px 0 0'}}>{editErr}</p>}
                          </>)
                        : <p style={{fontSize:'13px',fontWeight:600,color:'#1f2937',margin:0}}>{field.key === 'licenseNumber' ? (((prof.prefix||'') + (form.licenseNumber||'')) || '—') : (form[field.key] || '—')}</p>
                      }
                    </RowShell>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <SectionHeader icon="fa-pen-to-square" color="#0d9488" label="ข้อมูลที่แก้ไขได้เอง" />
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
                  {selfFields.map(field => (
                    <RowShell key={field.key} icon={field.icon} label={field.label}
                      action={editingKey === field.key
                        ? (
                          <div style={{display:'flex',gap:'4px'}}>
                            <button onClick={cancelEdit} style={{width:'28px',height:'28px',borderRadius:'7px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',cursor:'pointer'}}>
                              <i className="fa-solid fa-xmark" style={{fontSize:'11px'}}></i>
                            </button>
                            <button onClick={saveEdit} style={{width:'28px',height:'28px',borderRadius:'7px',border:'none',background:'#0d9488',color:'#fff',cursor:'pointer'}}>
                              <i className="fa-solid fa-check" style={{fontSize:'11px'}}></i>
                            </button>
                          </div>
                        ) : (
                          <button onClick={()=>startEdit(field)} title="แก้ไขข้อมูลนี้"
                            style={{width:'28px',height:'28px',borderRadius:'7px',border:'1px solid #d1fae5',background:'#f0fdfa',color:'#0d9488',cursor:'pointer'}}>
                            <i className="fa-solid fa-pen" style={{fontSize:'11px'}}></i>
                          </button>
                        )}>
                      {editingKey === field.key
                        ? (<>
                            {field.type === 'select'
                            ? <select value={tempValue} onChange={e=>setTempValue(e.target.value)} autoFocus
                                style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #14b8a6',outline:'none',background:'transparent',padding:'2px 0',cursor:'pointer'}}>
                                {field.options.map(o=><option key={o} value={o}>{o}</option>)}
                              </select>
                            : field.key === 'phone'
                              ? <input value={tempValue} onChange={e=>setTempValue(window.tbFormatPhone(e.target.value))} autoFocus
                                  placeholder="08x-xxx-xxxx"
                                  style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #14b8a6',outline:'none',background:'transparent',padding:'2px 0'}}/>
                            : <input value={tempValue} onChange={e=>setTempValue(e.target.value)} autoFocus
                                style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #14b8a6',outline:'none',background:'transparent',padding:'2px 0'}}/>}
                            {editErr && <p style={{fontSize:'11px',color:'#ef4444',margin:'4px 0 0'}}>{editErr}</p>}
                          </>)
                        : <p style={{fontSize:'13px',fontWeight:600,color:'#1f2937',margin:0}}>{form[field.key]}</p>
                      }
                    </RowShell>
                  ))}
                </div>
                <SectionHeader icon="fa-shield" color="#d97706" label="ต้องขออนุมัติแก้ไข" hint="🔒 ส่งคำขอถึง admin" />
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
                  {approvalFields.map(field => (
                    <div key={field.key} style={field.key==='title'?{gridColumn:'1 / -1'}:undefined}>
                    <RowShell icon={field.icon} label={field.label}
                      action={
                        <button onClick={()=>setRequestField(field)} title="ต้องขออนุมัติจากผู้ดูแลระบบ"
                          style={{width:'28px',height:'28px',borderRadius:'7px',border:'1px solid #fde68a',background:'#fef3c7',color:'#d97706',cursor:'pointer'}}>
                          <i className="fa-solid fa-lock" style={{fontSize:'11px'}}></i>
                        </button>
                      }>
                      <p style={{fontSize:'13px',fontWeight:600,color:'#1f2937',margin:0}}>{field.displayValue || field.currentValue || '—'}</p>
                    </RowShell>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Section 3: Read-only */}
            <SectionHeader icon="fa-circle-info" color="#6b7280" label="ข้อมูลระบบ" hint="แก้ไขไม่ได้" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
              {systemFields.map(field => (
                <RowShell key={field.key} icon={field.icon} label={field.label}>
                  <p style={{fontSize:'13px',fontWeight:600,color:'#1f2937',margin:0,wordBreak:'break-all'}}>{field.value}</p>
                </RowShell>
              ))}
            </div>
            </>
            )}

          </div>
        </div>
      </div>

      {/* Sub-modal: ขอแก้ไข */}
      {requestField && (
        <RequestEditModal
          field={requestField}
          currentValue={requestField.currentValue}
          onClose={()=>setRequestField(null)}
        />
      )}

      {/* Warn close popup */}
      {warnClose && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div className="modal-A" style={{background:'#fff',borderRadius:'16px',padding:'24px',maxWidth:'340px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',textAlign:'center'}}>
            <i className="fa-solid fa-triangle-exclamation" style={{fontSize:'28px',color:'#f59e0b',marginBottom:'10px',display:'block'}}></i>
            <p style={{fontSize:'15px',fontWeight:700,color:'#1f2937',margin:'0 0 6px'}}>ยังไม่ได้บันทึก</p>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 20px',lineHeight:1.5}}>มีข้อมูลที่กำลังแก้ไขอยู่ หากปิดตอนนี้ข้อมูลจะหายไป</p>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>setWarnClose(false)}
                style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#374151',fontWeight:600,fontSize:'13px',cursor:'pointer'}}>
                กลับไปแก้ต่อ
              </button>
              <button onClick={()=>{ setEditingKey(null); setWarnClose(false); onClose(); }}
                style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',background:'#ef4444',color:'#fff',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>
                ปิดทิ้งเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


export default App
