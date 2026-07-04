'use client'
/**
 * parts/dashboard/overview.jsx — หน้าแดชบอร์ดหลัก + กราฟ (แยกรอบ 2)
 * Dashboard (⚠️ Chart.js กราฟผู้ป่วยรายเดือน/รายปี) + MONTH_LABELS/FAKE_MONTHLY/FAKE_YEARLY
 */
import * as React from 'react'
const { useState, useEffect, useRef, useMemo } = React
import { Chart } from '../globals'
import { StorageMiniCard } from '../storage'
import { getTotalMonths } from './helpers'

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
        <div className="tb-backdrop" style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowSputumModal(false)}>
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

export { Dashboard }
