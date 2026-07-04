'use client'
/**
 * patient-modal/index.jsx — ClinicalModal + AddPatientPage (export หลัก)
 * import แท็บทั้งหมด + sputum-utils + PatientImagesTab (cross-part)
 */
import * as React from 'react'
const { useState } = React
import { INP, FormSection, FieldError } from '../shared'
import { calcCrCl, crClStage, REGIMENS, PREFIXES, PATIENT_TYPES, DISEASE_LOCATIONS,
         EXTRA_PULMONARY_TYPES, TAMBONS, DEFAULT_COMORBIDITIES, ADR_LIST, migrateAdr } from '../globals'
import { hasResistance } from './sputum-utils'
import { DiagnosisTab } from './diagnosis'
import { TimelineTab } from './timeline'
import { LabTab } from './lab'
import { MedsTab } from './meds'
import { DoseCalculator } from './dose-calculator'
import { RegimenHistoryTab } from './regimen'
import { DOTCalendar } from './dot'
import { ADRTab } from './adr'
import { PharmSummaryTab } from './pharm-summary'
import { PatientImagesTab } from '../patient-images'

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
        <div className="tb-backdrop" style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
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

export { ClinicalModal, AddPatientPage }
