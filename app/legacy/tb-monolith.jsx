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
import Cropper from 'react-easy-crop'
import V2Skeleton from '../components/V2Skeleton'
import { ADR_LIST, migrateAdr, calcDoses, calcCrCl, crClStage,
         DRUG_RANGES, REGIMENS, PREFIXES, PATIENT_TYPES, DISEASE_LOCATIONS,
         EXTRA_PULMONARY_TYPES, TAMBONS, DEFAULT_COMORBIDITIES,
         CONSULT_TYPES, DRP_TYPES, LAB_GROUPS, getLabStatus, LAB_STATUS_STYLE,
         Chart, INITIAL_PATIENTS, generateAlerts, DEFAULT_DRUGS, DEFAULT_RESTART_REASONS } from './parts/globals'
import { useModalAnim, INP, FormSection, FieldError, RangeStatus, Badge,
         ConfirmModal, ToastModal, Field, FilterSelect, StatusBadge, ScrollNav,
         relTime, r2AvatarUrl, normName, nameInitials, AVATAR_PALETTE, colorFromName, AvatarCircle,
         loadImageEl, AvatarLightbox } from './parts/shared'
import { ChangelogPage } from './parts/changelog'
import { StorageMiniCard, StorageDetail, StorageAlert } from './parts/storage'
import { AdminUsersTab, ActivityLogTab, AuditLogTab, AdminSettings } from './parts/admin'
import { TrashList, KnowledgeBase } from './parts/misc'
import { TrashHub, PatientImagesTab, ImageLibraryPage } from './parts/patient-images'
const { useState, useEffect, useRef } = React

/* ════════════════ tb-modals.jsx ════════════════ */

// useModalAnim, INP, FormSection, FieldError, RangeStatus, Badge ย้ายไป parts/shared.jsx (เฟส 1b)
// window globals ย้ายไป parts/globals.js (เฟส 1a)
const HOSP_STRENGTHS = {
  R:  [{label:'R300',value:300},{label:'R450',value:450}],
  H:  [{label:'I100',value:100},{label:'Iso Syrup 50mg/ml',value:'syrup'}],
  Z:  [{label:'Z500',value:500}],
  E:  [{label:'E400',value:400},{label:'E500',value:500}],
  Lfx:[{label:'Lfx 250',value:250},{label:'Lfx 500',value:500},{label:'Lfx 750',value:750}],
  Am: [{label:'Am 250',value:250},{label:'Am 500',value:500}],
};

// FormSection, FieldError, RangeStatus, Badge ย้ายไป parts/shared.jsx (เฟส 1b)

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
            {a.actorName
              ? <AvatarCircle urlKey={a.actorAvatarUrl} updatedAt={a.actorAvatarAt} name={a.actorName} colorKey={a.actorId} fallback={nameInitials(a.actorName)} size={32} style={{marginTop:'2px'}} />
              : (isAdmin && <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5"><i className="fa-solid fa-user-shield text-sm"></i></div>)}
            <div className="flex-1 min-w-0">
              {isAdmin && !a.actorName && <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-0.5">Admin · จัดการผู้ใช้</p>}
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
// ConfirmModal ย้ายไป parts/shared.jsx (เฟส 1c)

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

// ── meta หมวดรูปผู้ป่วย ────────────────────────────────────────────────────
// รูปภาพผู้ป่วย (PATIENT_IMG_TYPES, loadCache/saveCache/invalidateImgCaches, ImgViewToolbar, CXRComparePanel/Modal, ImageTrashPage, TrashHub, PatientImagesTab, ImageLibraryPage) ย้ายไป parts/patient-images.jsx (เฟส 5)
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
    {id:'images',icon:'fa-images',label:'รูปภาพ'},
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
          {tab==='images'&&<PatientImagesTab patient={patient} currentUser={currentUser} locked={hasPendingRequest}/>}

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
const MONTH_LABELS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const FAKE_MONTHLY = { 2025:[8,11,9,14,15,20,18,25,22,19,13,10], 2026:[12,15,10,18,6,0,0,0,0,0,0,0] };
const FAKE_YEARLY = { 2025:184, 2026:61 };
// StorageMiniCard, StorageDonut, StorageDetail, StorageAlert ย้ายไป parts/storage.jsx (เฟส 3a)

function Dashboard({ patients, archivePatients, onDashFilter, onGoArchiveDelayed, onGoAllPatients, onGoArchiveSuccess, onOpen, onOpenStorage, currentUser }) {
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
      <div className={currentUser?.role==='admin' ? "grid grid-cols-2 lg:grid-cols-5 gap-4" : "grid grid-cols-2 lg:grid-cols-4 gap-4"}>
        {currentUser?.role==='admin' && <StorageMiniCard onOpen={onOpenStorage}/>}
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
const APP_VERSION = '0.7.19.6.9';
const BUILD_DATE = '3 ก.ค. 2569';
// bridge: ให้ parts/* (เช่น changelog.jsx) อ่านเวอร์ชันผ่าน window.APP_VERSION ได้ (เฟส 2)
if (typeof window !== 'undefined') window.APP_VERSION = APP_VERSION;
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

// ChangelogPage, CommitDetailModal, CHANGELOG_STATUS_META, ChangelogCommentSection ย้ายไป parts/changelog.jsx (เฟส 2)
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
// relTime ย้ายไป parts/shared.jsx (เฟส 1d)
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
async function cropToWebp(src, pixels, outMax = 512) {
  const img = await loadImageEl(src);
  const out = Math.max(1, Math.min(outMax, Math.round(pixels.width)));
  const canvas = document.createElement('canvas');
  canvas.width = out; canvas.height = out;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';        // พื้นขาว — โผล่เฉพาะตอนซูมออกจนรูปไม่เต็มกรอบ (กันขอบดำ/โปร่งใส)
  ctx.fillRect(0, 0, out, out);
  ctx.drawImage(img, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, out, out);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 1.0));  // WebP 100%
}
// ย่อรูป "ต้นฉบับ" คงสัดส่วนเดิม (max maxEdge ด้านยาว, ไม่ขยายเกินรูปจริง) → สำหรับกดดูเต็ม/ซูม
async function resizeToWebp(src, maxEdge = 1920) {
  const img = await loadImageEl(src);
  let w = img.naturalWidth, h = img.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 1.0));  // WebP 100%
}
// image helpers (compressToWebp, putWithProgress, blobToDataURL, decodeImageToDataURL, isAnimatedGif, JustifiedGallery, fmtFileSize, mimeLabel, detectDevice, IMG_SORTS, imgInRange, imgSortCmp, patientImgInfo) ย้ายไป parts/patient-images.jsx (เฟส 5)

function AvatarCropModal({ src, uploading, error, onCancel, onConfirm }) {
  const [crop, setCrop]   = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom]   = React.useState(1);
  const [pixels, setPixels] = React.useState(null);
  const onComplete = React.useCallback((_, p) => setPixels(p), []);
  return createPortal(
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={uploading?undefined:onCancel}>
      <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'400px',overflow:'hidden',boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #f3f4f6'}}>
          <p style={{fontSize:'15px',fontWeight:700,color:'#0f766e',margin:0}}><i className="fa-solid fa-crop-simple" style={{marginRight:'8px'}}></i>ปรับรูปโปรไฟล์</p>
          <p style={{fontSize:'12px',color:'#9ca3af',margin:'4px 0 0'}}>ลากเลื่อน และซูม — ซูมออกเพื่อเห็นรูปทั้งใบ</p>
        </div>
        {/* กรอบจัตุรัส (paddingBottom 100%) + objectFit cover → วงกลมครอบเต็มขอบทุกด้าน
            ไม่ว่ารูปแนวตั้ง/แนวนอน (cover = รูปเต็มกรอบเสมอ เหมือน avatar LINE/FB) */}
        <div style={{position:'relative',width:'100%',paddingBottom:'100%',background:'#1f2937'}}>
          <div style={{position:'absolute',inset:0}}>
            <Cropper image={src} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
              objectFit="cover" minZoom={0.4} restrictPosition={false}
              onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onComplete}/>
          </div>
          {/* เส้นช่วยจัดองค์ประกอบ: rule of thirds (9 ช่อง) + เส้นแบ่งครึ่งกลาง (เข้มกว่า) */}
          <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
            <div style={{position:'absolute',top:0,bottom:0,left:'33.33%',width:'1px',background:'rgba(255,255,255,0.30)'}}/>
            <div style={{position:'absolute',top:0,bottom:0,left:'66.66%',width:'1px',background:'rgba(255,255,255,0.30)'}}/>
            <div style={{position:'absolute',left:0,right:0,top:'33.33%',height:'1px',background:'rgba(255,255,255,0.30)'}}/>
            <div style={{position:'absolute',left:0,right:0,top:'66.66%',height:'1px',background:'rgba(255,255,255,0.30)'}}/>
            <div style={{position:'absolute',top:0,bottom:0,left:'50%',width:'1px',background:'rgba(255,255,255,0.55)'}}/>
            <div style={{position:'absolute',left:0,right:0,top:'50%',height:'1px',background:'rgba(255,255,255,0.55)'}}/>
          </div>
        </div>
        <div style={{padding:'14px 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
            <i className="fa-solid fa-magnifying-glass-minus" style={{color:'#9ca3af',fontSize:'12px'}}></i>
            <input type="range" min={0.4} max={3} step={0.05} value={zoom} disabled={uploading}
              onChange={e=>setZoom(Number(e.target.value))} style={{flex:1,accentColor:'#0d9488'}}/>
            <i className="fa-solid fa-magnifying-glass-plus" style={{color:'#9ca3af',fontSize:'12px'}}></i>
          </div>
          {error && <p style={{fontSize:'12px',color:'#dc2626',margin:'0 0 10px',textAlign:'center'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{error}</p>}
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={onCancel} disabled={uploading}
              style={{flex:1,padding:'11px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:uploading?'not-allowed':'pointer'}}>ยกเลิก</button>
            <button onClick={()=>pixels && onConfirm(pixels)} disabled={uploading || !pixels}
              style={{flex:1,padding:'11px',borderRadius:'10px',background:uploading?'#5eead4':'#0d9488',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:uploading?'wait':'pointer'}}>
              {uploading ? <><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'6px'}}></i>กำลังอัปโหลด</> : <><i className="fa-solid fa-check" style={{marginRight:'6px'}}></i>ใช้รูปนี้</>}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── ดูรูปโปรไฟล์เต็ม (lightbox) — เครื่องมือดูรูปสไตล์ Windows Photos ──────────
// แสดง "รูปต้นฉบับ" · เปิดแบบขยายจากตำแหน่งรูป · ลาก + สโครลซูม + หมุน + เลือก % + info (nerd)
// AvatarLightbox ย้ายไป parts/shared.jsx (เฟส 5 — ใช้ร่วมกับ avatar/UserProfileModal)
function AvatarDeleteConfirm({ uploading, error, onCancel, onConfirm }) {
  return createPortal(
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={uploading?undefined:onCancel}>
      <div className="modal-A" onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'360px',overflow:'hidden',boxShadow:'0 25px 60px rgba(0,0,0,0.3)'}}>
        <div style={{padding:'24px 22px 18px',textAlign:'center'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'50%',background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
            <i className="fa-solid fa-trash-can" style={{color:'#dc2626',fontSize:'20px'}}></i>
          </div>
          <p style={{fontSize:'16px',fontWeight:700,color:'#111827',margin:'0 0 8px'}}>ลบรูปโปรไฟล์</p>
          <p style={{fontSize:'13px',color:'#6b7280',margin:0,lineHeight:1.6}}>รูปโปรไฟล์จะถูกลบถาวร และกลับไปแสดงเป็นตัวอักษรย่อ หากต้องการรูปเดิมต้องอัปโหลดใหม่</p>
          {error && <p style={{fontSize:'12px',color:'#dc2626',margin:'12px 0 0'}}><i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{error}</p>}
        </div>
        <div style={{display:'flex',gap:'10px',padding:'0 20px 20px'}}>
          <button onClick={onCancel} disabled={uploading} style={{flex:1,padding:'11px',borderRadius:'10px',background:'#f3f4f6',color:'#4b5563',fontWeight:700,fontSize:'13px',border:'none',cursor:uploading?'not-allowed':'pointer'}}>ยกเลิก</button>
          <button onClick={onConfirm} disabled={uploading} style={{flex:1,padding:'11px',borderRadius:'10px',background:uploading?'#fca5a5':'#dc2626',color:'#fff',fontWeight:700,fontSize:'13px',border:'none',cursor:uploading?'wait':'pointer'}}>
            {uploading ? <><i className="fa-solid fa-spinner fa-spin" style={{marginRight:'6px'}}></i>กำลังลบ</> : <><i className="fa-solid fa-trash-can" style={{marginRight:'6px'}}></i>ลบรูป</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
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
  const [mode, setMode]                 = React.useState('profile');  // 'profile' | 'changePassword' | 'sessions'
  // v0.7.18.0 — avatar upload
  const [cropSrc, setCropSrc]                 = React.useState(null);  // dataURL รูปที่เลือก รอครอบ
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [avatarErr, setAvatarErr]             = React.useState('');
  const [lightbox, setLightbox]               = React.useState(null);  // {src} ดูรูปเต็ม (รูปต้นฉบับ)
  const [confirmDelAvatar, setConfirmDelAvatar] = React.useState(false);  // popup ยืนยันลบรูป
  const [cropFromOriginal, setCropFromOriginal] = React.useState(false);  // กำลัง "ครอบใหม่" จากรูปต้นฉบับ (ไม่ต้องอัปต้นฉบับซ้ำ)
  const avatarInputRef = React.useRef(null);
  const avatarCircleRef = React.useRef(null);  // วงกลม avatar (ใช้คำนวณตำแหน่งตอนเปิด lightbox)
  const {close: animClose, modalCls, overlayCls} = useModalAnim(onClose);

  const handleClose = () => {
    if (editingKey !== null) { setWarnClose(true); return; }
    animClose();
  };

  // v0.7.18.0 — เลือกไฟล์รูป → เปิดหน้าครอบ
  const pickAvatarFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';  // reset เผื่อเลือกไฟล์เดิมซ้ำ
    if (!file) return;
    if (!file.type.startsWith('image/')) { setAvatarErr('กรุณาเลือกไฟล์รูปภาพ'); return; }
    if (file.size > 50 * 1024 * 1024) { setAvatarErr('ไฟล์ใหญ่เกิน 50MB'); return; }
    setAvatarErr('');
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
  };
  // ครอบเสร็จ → ย่อ WebP → อัปโหลด
  // อัปครั้งแรก: เก็บ 2 ไฟล์ (รูปครอบ 512 + รูปต้นฉบับ max 1920) · "ครอบใหม่": อัปแค่รูปครอบ (ต้นฉบับเดิมคงไว้)
  const handleCropConfirm = async (pixels) => {
    setUploadingAvatar(true); setAvatarErr('');
    try {
      const isRecrop = cropFromOriginal;
      const croppedBlob = await cropToWebp(cropSrc, pixels, 512);   // รูปครอบ (โชว์ avatar เล็ก)
      const originalBlob = isRecrop ? null : await resizeToWebp(cropSrc, 1920);  // รูปต้นฉบับ (กดดูเต็ม)
      const pres = await fetch('/api/profile/avatar/presign', { method: 'POST' });
      const presData = await pres.json();
      if (!pres.ok) throw new Error(presData.error || 'ขอลิงก์อัปโหลดไม่สำเร็จ');
      const put = await fetch(presData.uploadUrl, { method: 'PUT', body: croppedBlob, headers: { 'content-type': 'image/webp' } });
      if (!put.ok) throw new Error('อัปโหลดรูปไม่สำเร็จ');
      if (originalBlob) {
        const put2 = await fetch(presData.uploadUrlOrig, { method: 'PUT', body: originalBlob, headers: { 'content-type': 'image/webp' } });
        if (!put2.ok) throw new Error('อัปโหลดรูปต้นฉบับไม่สำเร็จ');
      }
      const conf = await fetch('/api/profile/avatar/confirm', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hasOriginal: !isRecrop }),
      });
      const confData = await conf.json();
      if (!conf.ok) throw new Error(confData.error || 'บันทึกรูปไม่สำเร็จ');
      setForm(f => ({ ...f, avatarUrl: confData.key, avatarOriginalUrl: confData.keyOrig || f.avatarOriginalUrl, avatarUpdatedAt: confData.avatar_updated_at }));
      setCropSrc(null); setCropFromOriginal(false);
    } catch (err) {
      setAvatarErr(err.message || 'เกิดข้อผิดพลาด');
    }
    setUploadingAvatar(false);
  };
  // ลบรูปจริง → กลับเป็นตัวอักษรย่อ (เรียกหลังยืนยันใน popup)
  const doDeleteAvatar = async () => {
    setUploadingAvatar(true); setAvatarErr('');
    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
      if (!res.ok) throw new Error('ลบรูปไม่สำเร็จ');
      setForm(f => ({ ...f, avatarUrl: null, avatarOriginalUrl: null, avatarUpdatedAt: null }));
      setConfirmDelAvatar(false);
    } catch (err) { setAvatarErr(err.message || 'ลบรูปไม่สำเร็จ'); }
    setUploadingAvatar(false);
  };
  // กดที่รูป → เปิด popup ดูรูปเต็ม (ใช้รูปต้นฉบับ ถ้าไม่มีค่อย fallback รูปครอบ)
  const openLightbox = () => {
    const url = avatarOriginalPublicUrl || avatarPublicUrl;
    if (!url) return;
    const rect = avatarCircleRef.current ? avatarCircleRef.current.getBoundingClientRect() : null;
    const key = (form && (form.avatarOriginalUrl || form.avatarUrl)) || '';
    setLightbox({ src: url, rect, info: { name: key.split('/').pop(), updatedAt: form && form.avatarUpdatedAt } });
  };
  // "ครอบใหม่" → ดึงรูปต้นฉบับเป็น blob (object URL = same-origin) เข้าหน้าครอบ
  // ใช้ fetch→blob แทนใส่ URL ตรงๆ เพื่อกัน canvas tainted (เบราว์เซอร์ cache รูปแบบไม่มี CORS ไว้ตอนแสดง popup)
  const startRecrop = async () => {
    if (!avatarOriginalPublicUrl) return;
    setAvatarErr('');
    try {
      const res = await fetch(avatarOriginalPublicUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error('โหลดรูปต้นฉบับไม่สำเร็จ');
      const objUrl = URL.createObjectURL(await res.blob());
      setCropFromOriginal(true); setCropSrc(objUrl);
    } catch (err) {
      setAvatarErr('เปิดรูปต้นฉบับไม่สำเร็จ ลองอัปรูปใหม่');
    }
  };
  const avatarPublicUrl = form ? r2AvatarUrl(form.avatarUrl, form.avatarUpdatedAt) : null;
  const avatarOriginalPublicUrl = form ? r2AvatarUrl(form.avatarOriginalUrl, form.avatarUpdatedAt) : null;

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
      avatarUrl:      db.avatar_url || null,
      avatarOriginalUrl: db.avatar_original_url || null,
      avatarUpdatedAt: db.avatar_updated_at || null,
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
                <div ref={avatarCircleRef} onClick={openLightbox} title={avatarPublicUrl ? 'กดดูรูปเต็ม' : undefined}
                  style={{width:'90px',height:'90px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'3px solid rgba(255,255,255,0.3)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:(shownTitle||'').length>3?'15px':'22px',overflow:'hidden',cursor:avatarPublicUrl?'zoom-in':'default'}}>
                  {avatarPublicUrl
                    ? <img src={avatarPublicUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : shownTitle}
                </div>
                <button onClick={()=>avatarInputRef.current && avatarInputRef.current.click()} title="เปลี่ยนรูปโปรไฟล์"
                  style={{position:'absolute',bottom:'0',right:'0',width:'30px',height:'30px',borderRadius:'50%',background:'#fff',border:'2px solid #14b8a6',color:'#0f766e',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(0,0,0,0.15)'}}>
                  <i className="fa-solid fa-camera" style={{fontSize:'12px'}}></i>
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={pickAvatarFile} style={{display:'none'}}/>
              </div>
              {avatarPublicUrl && (
                <div style={{display:'flex',gap:'8px',justifyContent:'center',margin:'0 0 12px'}}>
                  {avatarOriginalPublicUrl && (
                    <button onClick={startRecrop} disabled={uploadingAvatar}
                      style={{fontSize:'11px',color:'#fff',background:'rgba(0,0,0,0.18)',border:'none',borderRadius:'8px',padding:'4px 12px',cursor:uploadingAvatar?'not-allowed':'pointer'}}>
                      <i className="fa-solid fa-crop-simple" style={{marginRight:'5px',fontSize:'10px'}}></i>ครอบใหม่
                    </button>
                  )}
                  <button onClick={()=>setConfirmDelAvatar(true)} disabled={uploadingAvatar}
                    style={{fontSize:'11px',color:'#fff',background:'rgba(0,0,0,0.18)',border:'none',borderRadius:'8px',padding:'4px 12px',cursor:uploadingAvatar?'not-allowed':'pointer'}}>
                    <i className="fa-solid fa-trash-can" style={{marginRight:'5px',fontSize:'10px'}}></i>ลบรูป
                  </button>
                </div>
              )}
              {avatarErr && !cropSrc && (
                <p style={{fontSize:'11px',color:'#fecaca',background:'rgba(0,0,0,0.15)',borderRadius:'8px',padding:'5px 10px',margin:'0 0 12px',display:'inline-block'}}>
                  <i className="fa-solid fa-circle-exclamation" style={{marginRight:'5px'}}></i>{avatarErr}
                </p>
              )}
              {cropSrc && (
                <AvatarCropModal src={cropSrc} uploading={uploadingAvatar} error={avatarErr}
                  onCancel={()=>{ if(!uploadingAvatar){ setCropSrc(null); setAvatarErr(''); } }}
                  onConfirm={handleCropConfirm}/>
              )}
              {lightbox && (
                <AvatarLightbox src={lightbox.src} originRect={lightbox.rect} info={lightbox.info} onClose={()=>setLightbox(null)}/>
              )}
              {confirmDelAvatar && (
                <AvatarDeleteConfirm uploading={uploadingAvatar} error={avatarErr}
                  onCancel={()=>{ if(!uploadingAvatar){ setConfirmDelAvatar(false); setAvatarErr(''); } }}
                  onConfirm={doDeleteAvatar}/>
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
