
// tb-app.jsx — App shell, pages, AdminSettings
const { useState, useEffect, useRef } = React;

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
  const active = patients.filter(p => p.status !== 'done');
  const criticals = patients.filter(p => p.status === 'critical');
  const intensive = patients.filter(p => p.phase === 'Intensive').length;
  const cont = patients.filter(p => p.phase === 'Continuation').length;
  const mdr = patients.filter(p => p.regimen && (p.regimen.includes('Bdq')||p.regimen.includes('Lzd')||p.regimen.includes('Mfx'))).length;
  const done = patients.filter(p => p.status === 'done').length;

  // ── helpers ──
  const isNeg = r => /neg/i.test(r||'');
  const isPos = r => /\+|scanty/i.test(r||'');

  // ── ใกล้เปลี่ยน Phase ──
  const getIntensiveMonths = r => { const m = r?.match(/^(\d+)/); return m ? parseInt(m[1]) : 2; };
  const nearPhaseChange = patients.filter(p =>
    p.phase === 'Intensive' && p.status !== 'done' &&
    p.month >= getIntensiveMonths(p.regimen) - 0.5
  );

  // ── Sputum Conversion Rate ──
  // smearPos: active patients ที่ M0 บวก
  const smearPos = patients.filter(p => (p.sputum||[]).length && isPos(p.sputum[0]?.result));
  // converted: smear+ ที่มี Neg อย่างน้อย 1 ครั้งหลัง M0 (รวม delayed-then-neg)
  const converted = smearPos.filter(p => (p.sputum||[]).slice(1).some(s => isNeg(s.result)));
  const convRate = smearPos.length > 0 ? Math.round(converted.length / smearPos.length * 100) : null;

  // delayedActive: active patients ที่มีเสมหะบวก/scanty ที่ M2 ขึ้นไป (โผล่ใน modal)
  const hasSputumDelayed = p => (p.sputum||[]).filter(s => s.tp !== 'M0').some(s => isPos(s.result));
  const delayedActive = patients.filter(p => hasSputumDelayed(p));

  // archivedDelayed: archived patients ที่เคย delayed (ปุ่ม Cured+Delayed)
  const archivedDelayed = (archivePatients||[]).filter(p => hasSputumDelayed(p));

  // ── Treatment Success Rate ──
  const cohortDone = patients.filter(p => p.status === 'done');
  const successRate = patients.length > 0 ? Math.round(cohortDone.length / patients.length * 100) : 0;

  // ── ใกล้จบรักษา (≤1 เดือน) ──
  const nearDone = patients.filter(p => {
    if (p.status === 'done') return false;
    const total = getTotalMonths(p.regimen);
    return total && (total - p.month) <= 1 && (total - p.month) > 0;
  });

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
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#0f766e', titleColor:'#ccfbf1', bodyColor:'#fff', padding:10, cornerRadius:10 } },
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
        plugins:{ legend:{position:'bottom',labels:{font:{size:11},boxWidth:10,padding:12,color:'#6b7280'}}, tooltip:{ backgroundColor:'#1f2937', padding:10, cornerRadius:10 } },
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
              border: `2px solid ${hoveredKpi===k.label ? k.hoverBorder : k.alert ? '#fecaca' : '#f1f5f9'}`,
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
          <div style={{background:'#fff',borderRadius:'24px',width:'90%',maxWidth:'560px',maxHeight:'82vh',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
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

const fmtDate = d => { if(!d) return '-'; const [y,m,day] = d.split('-'); return `${day}/${m}/${y.slice(2)}`; };

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
          <p className="font-mono text-gray-700">{fmtDate(latestDate)}</p>
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
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-auto">
        <table className="w-full min-w-max text-left">
          <thead className="bg-slate-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
            <tr>
              <th className="py-2 px-4 font-semibold sticky left-0 bg-slate-50 z-10 whitespace-nowrap">HN / ชื่อ</th>
              {visibleCols.map(col => <th key={col.id} className="py-2 px-4 font-semibold whitespace-nowrap">{col.label}</th>)}
              <th className="py-2 px-4 font-semibold whitespace-nowrap text-center">ผลการรักษา</th>
              <th className="py-2 px-4 font-semibold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length===0 ? (
              <tr><td colSpan={visibleCols.length+3} className="p-10 text-center text-gray-400"><i className="fa-solid fa-user-slash text-2xl mb-2 block text-gray-300"></i>ไม่พบผู้ป่วยที่ค้นหา</td></tr>
            ) : filtered.map(p => (
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
            ))}
          </tbody>
        </table>
        <div className="p-3 bg-slate-50/50 border-t border-gray-100 text-xs text-gray-400 text-right">
          แสดง {filtered.length} จาก {patients.length} ราย
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
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-auto">
        <table className="w-full min-w-max text-left">
          <thead className="bg-slate-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
            <tr>
              <th className="py-2 px-4 font-semibold sticky left-0 bg-slate-50 z-10 whitespace-nowrap">HN / ชื่อ</th>
              {visibleCols.map(col => <th key={col.id} className="py-2 px-4 font-semibold whitespace-nowrap">{col.label}</th>)}
              <th className="py-2 px-4 font-semibold whitespace-nowrap text-center">ผลการรักษา</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap">วันที่ครบ</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap">วันที่บันทึกผล</th>
              <th className="py-2 px-4 font-semibold text-center">ดูประวัติ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length === 0 ? (
              <tr><td colSpan={visibleCols.length+5} className="p-10 text-center text-gray-400">
                <i className="fa-solid fa-box-archive text-2xl mb-2 block text-gray-300"></i>
                {patients.length === 0 ? 'ยังไม่มีผู้ป่วยที่จบการรักษา' : 'ไม่พบผู้ป่วยที่ค้นหา'}
              </td></tr>
            ) : filtered.map(p => (
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
                  {p.outcome?.endDate ? fmtDate(p.outcome.endDate) : <span className="text-gray-300">—</span>}
                </td>
                {/* วันที่บันทึกผล — fixed */}
                <td className="py-2 px-4 text-xs whitespace-nowrap font-mono text-gray-600">
                  {p.outcome?.date ? fmtDate(p.outcome.date) : '—'}
                </td>
                <td className="py-2 px-4 text-center whitespace-nowrap">
                  <button onClick={e=>{e.stopPropagation();onOpen(p);}} className="text-teal-400 hover:text-teal-700 transition-colors p-1.5 rounded-lg hover:bg-teal-50">
                    <i className="fa-solid fa-file-medical"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 bg-slate-50/50 border-t border-gray-100 text-xs text-gray-400 text-right">
          จบการรักษาทั้งหมด {filtered.length} ราย
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
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-auto">
        <table className="w-full min-w-max text-left">
          <thead className="bg-slate-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
            <tr>
              <th className="py-2 px-4 font-semibold sticky left-0 bg-slate-50 z-10 whitespace-nowrap">HN / ชื่อ</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap">อายุ / เพศ / ตำบล</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap">ชนิด TB / สูตรยา</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap">ความคืบหน้า</th>
              <th className="py-2 px-4 font-semibold whitespace-nowrap text-center">สถานะ / ผลการรักษา</th>
              <th className="py-2 px-4 font-semibold text-center whitespace-nowrap">ดูประวัติ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-400"><i className="fa-solid fa-user-slash text-2xl mb-2 block text-gray-300"></i>ไม่พบผู้ป่วย</td></tr>
            ) : filtered.map(p => (
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
            ))}
          </tbody>
        </table>
        <div className="p-3 bg-slate-50/50 border-t border-gray-100 text-xs text-gray-400 text-right">
          แสดง {filtered.length} จาก {allPts.length} ราย · กำลังรักษา {patients.length} · จบแล้ว {(archivePatients||[]).length}
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
function AdminSettings({ settings, setSettings }) {
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
    { id:'lab', label:'ค่า Lab', icon:'fa-flask' },
    { id:'regimen', label:'สูตรยา', icon:'fa-pills' },
    { id:'restart', label:'เหตุผลเริ่มยาใหม่', icon:'fa-rotate-right' },
    { id:'interaction', label:'Drug Interaction', icon:'fa-triangle-exclamation' },
    { id:'consult', label:'Consult / DRP', icon:'fa-comments' },
  ];

  const effectiveLabGroups = settings.labGroups || LAB_GROUPS;

  return (
    <div className="space-y-5 tb-fade">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
        <i className="fa-solid fa-shield-halved text-amber-500 text-xl"></i>
        <div><p className="font-bold text-amber-800 text-sm">Admin Settings</p><p className="text-xs text-amber-600">การเปลี่ยนแปลงมีผลทันที — มองเห็นเฉพาะ Admin</p></div>
      </div>

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
              <div key={i} className="flex items-center justify-between bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:border-red-200 group transition-colors">
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
                <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
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
  const [page, setPage] = useState('login');
  const [nav, setNav] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [clinical, setClinical] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showFullNotifs, setShowFullNotifs] = useState(false);
  const [readAlerts, setReadAlerts] = useState(new Set());
  const [loggingIn, setLoggingIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
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

  const showDirtyToast = () => {
    if (dirtyToastTimer.current) clearTimeout(dirtyToastTimer.current);
    setDirtyToast(true);
    dirtyToastTimer.current = setTimeout(() => setDirtyToast(false), 3000);
  };

  const DEMO_IDS = new Set(INITIAL_PATIENTS.map(p => p.id));
  const [dashFilter, setDashFilter] = useState(null);
  const [archiveDashFilter, setArchiveDashFilter] = useState(null);

  useEffect(() => {
    loadPatients().then(data => {
      setPatients([...INITIAL_PATIENTS, ...data]);
      setDbLoading(false);
    });
  }, []);

  const alerts = generateAlerts(patients);
  const unreadCount = alerts.filter(a => !readAlerts.has(a.id)).length;
  const markRead = id => setReadAlerts(s => new Set([...s, id]));
  const markAllRead = () => setReadAlerts(new Set(alerts.map(a => a.id)));
  const openFromNotif = p => { setClinical(p); };

  const login = e => { e.preventDefault(); setLoggingIn(true); setTimeout(() => { setPage('app'); setLoggingIn(false); }, 700); };
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

  const handleLogoClick = () => {
    if (formDirty) { showDirtyToast(); return; }
    const next = logoClicks + 1;
    if (next >= 10) {
      setLogoClicks(0);
      if (easterRound === 2) { setPage('login'); setNav('dashboard'); }
      else setEasterMsgIdx(0);
    } else {
      setLogoClicks(next);
      setNav('dashboard');
    }
  };
  const closeEasterMsg = () => {
    if (easterMsgIdx < EASTER_MSGS.length - 1) setEasterMsgIdx(i => i + 1);
    else { setEasterMsgIdx(-1); setEasterRound(2); setNav('dashboard'); }
  };

  const navItems = [
    { id:'dashboard',     icon:'fa-chart-pie',        label:'Dashboard' },
    { id:'patient-list',  icon:'fa-users',            label:'ทะเบียนผู้ป่วย Active' },
    { id:'archive-list',  icon:'fa-box-archive',      label:'ทะเบียนจบการรักษา' },
    { id:'weekly-prep',   icon:'fa-calendar-check',   label:'เตรียมเคสรายสัปดาห์' },
    { id:'reports',       icon:'fa-file-contract',    label:'รายงาน & สถิติ' },
    { id:'knowledge',     icon:'fa-book-open-reader', label:'คลังความรู้วัณโรค' },
    { id:'settings',      icon:'fa-gear',             label:'ตั้งค่าระบบ (Admin)', divider:true },
  ];
  const titles = { dashboard:'Dashboard', 'patient-list':'ทะเบียนผู้ป่วย Active', 'archive-list':'ทะเบียนจบการรักษา', 'all-patients':'ทะเบียนผู้ป่วยทั้งหมด', 'add-patient':'ลงทะเบียนผู้ป่วยใหม่', 'weekly-prep':'เตรียมเคสรายสัปดาห์', reports:'รายงาน และ สถิติ', knowledge:'คลังความรู้วัณโรค', settings:'ตั้งค่าระบบ (Admin)' };
  const pageIcons = { dashboard:'fa-chart-pie', 'patient-list':'fa-users', 'archive-list':'fa-box-archive', 'all-patients':'fa-users', 'add-patient':'fa-user-plus', 'weekly-prep':'fa-calendar-check', reports:'fa-file-contract', knowledge:'fa-book-open-reader', settings:'fa-gear' };

  if (page === 'login') return (
    <div className="w-full h-screen bg-gradient-to-br from-teal-900 to-teal-700 flex items-center justify-center">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center tb-fade">
        <div className="mb-6"><i className="fa-solid fa-lungs-virus text-6xl text-teal-600"></i></div>
        <h1 className="text-4xl font-bold text-teal-800 mb-1">TB-CARE LINK</h1>
        <p className="text-gray-400 mb-8 text-sm">รพ.ปรางค์กู่ · กลุ่มงานเภสัชกรรม</p>
        <form onSubmit={login} className="space-y-4 text-left">
          <div><label className="text-sm font-medium text-gray-600 block mb-1">Username</label><input type="text" defaultValue="sirawit.p" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-teal-400 outline-none" required/></div>
          <div><label className="text-sm font-medium text-gray-600 block mb-1">รหัสผ่าน</label><input type="password" defaultValue="password" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-teal-400 outline-none" required/></div>
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white p-3.5 rounded-xl font-bold shadow-lg transition-all mt-2 flex items-center justify-center gap-2">
            {loggingIn ? <><i className="fa-solid fa-spinner fa-spin"></i>กำลังเข้าสู่ระบบ...</> : <><i className="fa-solid fa-right-to-bracket"></i>เข้าสู่ระบบ</>}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">พัฒนาโดย เภสัชกร สิรวิชญ์ เผ่าผา</p>
          <p className="text-xs text-gray-400">โรงพยาบาลปรางค์กู่</p>
          <p className="text-xs text-gray-300 mt-1">Version 0.6.20 · <span className="text-amber-400 font-medium">ยังไม่เผยแพร่</span></p>
        </div>
      </div>
    </div>
  );

  // Clinical view กินทั้งจอ — ซ่อน sidebar + header ทั้งหมด
  if (clinical) {
    return (
      <div className="flex h-screen bg-white overflow-hidden">
        <ClinicalModal patient={clinical} onClose={() => setClinical(null)} onUpdate={updatePatient} settings={settings} onArchive={archivePatient}/>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-teal-50 overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside style={{width:sidebarOpen?'240px':'72px',transition:'width 0.2s ease',overflow:'hidden',flexShrink:0,display:'flex',flexDirection:'column',background:'#fff',borderRight:'1px solid #f1f5f9',boxShadow:'1px 0 4px rgba(0,0,0,0.04)'}}>

        {/* Header: icon คงที่ + label fade + ปุ่ม toggle */}
        <div style={{display:'flex',alignItems:'center',height:'60px',padding:'0 10px',borderBottom:'1px solid #f1f5f9',flexShrink:0}}>
          <div onClick={handleLogoClick} title="กลับหน้าหลัก" style={{display:'flex',alignItems:'center',flex:1,cursor:'pointer',minWidth:0,height:'100%',borderRadius:'8px',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <i className="fa-solid fa-lungs-virus" style={{color:'#0f766e',fontSize:'18px'}}></i>
            </span>
            <span style={{overflow:'hidden',whiteSpace:'nowrap',fontWeight:700,fontSize:'15px',color:'#0f766e',flex:1,maxWidth:sidebarOpen?'140px':'0px',opacity:sidebarOpen?1:0,transition:'max-width 0.2s ease,opacity 0.15s ease'}}>TB-CARE LINK</span>
          </div>
          <button
            onClick={()=>setSidebarOpen(o=>!o)}
            title={sidebarOpen?'ซ่อนเมนู':'แสดงเมนู'}
            style={{width:'28px',height:'28px',borderRadius:'6px',border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#9ca3af',transition:'color 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.color='#0f766e'}
            onMouseLeave={e=>e.currentTarget.style.color='#9ca3af'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav style={{flex:1,overflowY:'auto',padding:'10px 8px'}}>
          {navItems.map(n => (
            <div key={n.id}>
              {n.divider && <div style={{margin:'6px 0',borderTop:'1px solid #f1f5f9'}}></div>}
              <button
                onClick={()=>{
                  if(formDirty && nav==='add-patient' && n.id!=='add-patient'){
                    showDirtyToast(); return;
                  }
                  setNav(n.id);setLogoClicks(0);if(n.id!=='add-patient')setFormDirty(false);
                }}
                title={!sidebarOpen?n.label:undefined}
                style={{display:'flex',width:'100%',alignItems:'center',padding:'9px 8px',borderRadius:'8px',border:'none',cursor:'pointer',marginBottom:'2px',transition:'background 0.15s',background:nav===n.id?'#ccfbf1':'transparent',fontWeight:nav===n.id?700:500,fontSize:'14px',color:nav===n.id?'#0f766e':'#374151'}}
                onMouseEnter={e=>{if(nav!==n.id){e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.color='#0f766e';}}}
                onMouseLeave={e=>{if(nav!==n.id){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#374151';}}}
              >
                {/* icon คงที่ 36px ไม่ขยับ */}
                <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <i className={`fa-solid ${n.icon}`} style={{fontSize:'17px',color:'#0f766e'}}></i>
                </span>
                {/* label fade */}
                <span style={{overflow:'hidden',whiteSpace:'nowrap',maxWidth:sidebarOpen?'160px':'0px',opacity:sidebarOpen?1:0,transition:'max-width 0.2s ease,opacity 0.15s ease'}}>{n.label}</span>
              </button>
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div style={{borderTop:'1px solid #f1f5f9',padding:'10px 8px',flexShrink:0}}>
          <button onClick={()=>setShowProfile(true)} style={{width:'100%',display:'flex',alignItems:'center',padding:'8px',borderRadius:'10px',cursor:'pointer',transition:'background 0.15s',border:'none',background:'transparent',textAlign:'left'}}
            onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#0f766e',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'11px'}}>ภก</div>
            </span>
            <div style={{overflow:'hidden',maxWidth:sidebarOpen?'160px':'0px',opacity:sidebarOpen?1:0,transition:'max-width 0.2s ease,opacity 0.15s ease',whiteSpace:'nowrap'}}>
              <p style={{fontWeight:700,fontSize:'12px',color:'#1f2937',margin:0}}>ภก.สิรวิชญ์ เผ่าผา</p>
              <p style={{fontSize:'11px',color:'#0f766e',margin:0}}>Pharmacist</p>
            </div>
          </button>
          {/* ปุ่มออกระบบ */}
          <button
            onClick={()=>{ setPage('login'); setNav('dashboard'); }}
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
            <div>
              <p style={{fontSize:'10px',color:'#9ca3af',margin:0,whiteSpace:'nowrap'}}>พัฒนาโดย เภสัชกร สิรวิชญ์ เผ่าผา</p>
              <p style={{fontSize:'10px',color:'#9ca3af',margin:'1px 0 0 0',whiteSpace:'nowrap'}}>โรงพยาบาลปรางค์กู่</p>
              <p style={{fontSize:'10px',color:'#d1d5db',margin:'2px 0 0 0',whiteSpace:'nowrap'}}>v0.6.20 · <span style={{color:'#fbbf24'}}>ยังไม่เผยแพร่</span></p>
            </div>
          ) : (
            <div style={{display:'flex',justifyContent:'center'}}>
              <span style={{fontSize:'9px',color:'#d1d5db',fontWeight:700}}>0.5</span>
            </div>
          )}
        </div>

      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white/90 backdrop-blur-md shadow-sm flex items-center gap-3 px-6 z-10 border-b border-gray-200 flex-shrink-0">
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

          {/* Quick search — แสดงเฉพาะหน้าอื่น (ไม่รวม archive-list ที่มี search ใน component) */}
          {nav!=='patient-list' && nav!=='archive-list' && (
            <div className="relative hidden md:block flex-1 max-w-xs ml-auto">
              <input type="text" placeholder="ค้นหาด่วน..." className="w-full p-2 pl-9 bg-gray-100 rounded-full text-sm focus:ring-2 focus:ring-teal-200 outline-none"/>
              <i className="fa-solid fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
            </div>
          )}

          <div className="relative flex-shrink-0 ml-auto">
            <button onClick={()=>setShowNotifs(!showNotifs)} className="relative p-2 text-gray-400 hover:text-teal-600 transition-colors">
              <i className="fa-regular fa-bell text-xl"></i>
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1 border-2 border-white animate-pulse">{unreadCount}</span>}
            </button>
            {showNotifs && <NotificationPanel
              alerts={alerts} patients={patients} readAlerts={readAlerts}
              onRead={markRead} onReadAll={markAllRead}
              onOpen={p=>{openFromNotif(p);setShowNotifs(false);}}
              onClose={()=>setShowNotifs(false)}
              onExpand={()=>{setShowNotifs(false);setShowFullNotifs(true);}}
            />}
          </div>
        </header>

        <div className={`flex-1 p-6 min-h-0 ${(nav==='patient-list'||nav==='archive-list'||nav==='all-patients')?'overflow-hidden':'overflow-y-auto'}`}>
          {dbLoading && <div className="flex items-center justify-center h-full"><div className="text-center text-gray-400"><i className="fa-solid fa-spinner fa-spin text-3xl mb-3 block text-teal-500"></i><p className="text-sm">กำลังโหลดข้อมูล...</p></div></div>}
          {!dbLoading && nav==='dashboard'     && <Dashboard patients={patients.filter(p=>!p.archived)} archivePatients={patients.filter(p=>p.archived)} onDashFilter={f=>{setDashFilter(f);setNav('patient-list');}} onGoArchiveDelayed={()=>{setArchiveDashFilter('delayed');setNav('archive-list');}} onGoAllPatients={()=>setNav('all-patients')} onGoArchiveSuccess={()=>{setArchiveDashFilter('success');setNav('archive-list');}} onOpen={setClinical}/>}
          {!dbLoading && nav==='all-patients'  && <AllPatientsPage patients={patients.filter(p=>!p.archived)} archivePatients={patients.filter(p=>p.archived)} onOpen={setClinical} onBack={()=>setNav('dashboard')}/>}
          {!dbLoading && nav==='patient-list'  && <PatientList patients={patients.filter(p=>!p.archived)} onAdd={addPatient} onOpen={setClinical} settings={settings} dashFilter={dashFilter} onClearDashFilter={()=>setDashFilter(null)} search={ptSearch} filter={ptFilter} showColMgr={ptShowColMgr} onToggleColMgr={()=>setPtShowColMgr(v=>!v)} onArchive={archivePatient}/>}
          {!dbLoading && nav==='archive-list'  && <ArchiveList patients={patients.filter(p=>p.archived)} onOpen={setClinical} archiveDashFilter={archiveDashFilter} onClearArchiveDashFilter={()=>setArchiveDashFilter(null)}/>}
          {!dbLoading && nav==='add-patient'   && <AddPatientPage onBack={()=>{setFormDirty(false);setNav('patient-list');}} onAdd={p=>{addPatient(p);setFormDirty(false);setNav('patient-list');}} settings={settings} onDirtyChange={setFormDirty}/>}
          {!dbLoading && nav==='weekly-prep'   && <WeeklyPrep patients={patients.filter(p=>!p.archived)} onOpen={setClinical}/>}
          {!dbLoading && nav==='reports'       && <Reports patients={patients}/>}
          {!dbLoading && nav==='knowledge'     && <KnowledgeBase/>}
          {!dbLoading && nav==='settings'      && <AdminSettings settings={settings} setSettings={setSettings}/>}
        </div>
      </main>

      {/* Dirty form toast */}
      {dirtyToast && (
        <div style={{position:'fixed',top:'80px',left:'50%',transform:'translateX(-50%)',background:'#fffbeb',color:'#92400e',padding:'12px 24px',borderRadius:'12px',zIndex:9999,fontSize:'14px',fontWeight:600,boxShadow:'0 4px 20px rgba(0,0,0,0.15)',border:'1.5px solid #f59e0b',display:'flex',alignItems:'center',gap:'10px',whiteSpace:'nowrap'}}>
          <i className="fa-solid fa-triangle-exclamation" style={{color:'#f59e0b'}}></i>
          กรุณาบันทึกข้อมูลก่อนนะคะ
        </div>
      )}

      {/* Easter egg popup */}
      {easterMsgIdx >= 0 && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'24px',padding:'48px 40px',maxWidth:'380px',width:'90%',textAlign:'center',boxShadow:'0 25px 60px rgba(0,0,0,0.3)',animation:'tbFadeIn 0.3s ease'}}>
            <div style={{fontSize:'56px',marginBottom:'16px'}}>🫁</div>
            <p style={{fontSize:'22px',fontWeight:700,color:'#0f766e',marginBottom:'32px',lineHeight:1.4}}>{EASTER_MSGS[easterMsgIdx]}</p>
            <button onClick={closeEasterMsg} style={{width:'44px',height:'44px',borderRadius:'50%',border:'none',background:'#f1f5f9',cursor:'pointer',fontSize:'18px',color:'#6b7280',transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='#e2e8f0'} onMouseLeave={e=>e.currentTarget.style.background='#f1f5f9'}>✕</button>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfile && <UserProfileModal onClose={()=>setShowProfile(false)}/>}
      {/* Notification Full Modal */}
      {showFullNotifs && <NotificationFullModal
        alerts={alerts} patients={patients} readAlerts={readAlerts}
        onRead={markRead} onReadAll={markAllRead}
        onOpen={p=>{openFromNotif(p);}}
        onClose={()=>setShowFullNotifs(false)}
      />}
    </div>
  );
}

const DEMO_USER = {
  name: 'ภก.สิรวิชญ์ เผ่าผา',
  nameEn: 'Sirawit Phaophan',
  position: 'เภสัชกร (Pharmacist)',
  hospital: 'โรงพยาบาลปรางค์กู่',
  department: 'กลุ่มงานเภสัชกรรม',
  licenseNo: 'ภก. 12345',
  username: 'sirawit.p',
  email: 'sirawit.p@pranggku.go.th',
  phone: '045-691-234 ต่อ 201',
  role: 'Admin',
  since: '1 ต.ค. 2567',
};

function UserProfileModal({ onClose }) {
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({...DEMO_USER});
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const editableFields = [
    {icon:'fa-hospital', label:'โรงพยาบาล',             key:'hospital'},
    {icon:'fa-pills',    label:'แผนก',                  key:'department'},
    {icon:'fa-id-card',  label:'เลขใบประกอบวิชาชีพ',    key:'licenseNo'},
    {icon:'fa-user',     label:'ชื่อผู้ใช้',             key:'username'},
    {icon:'fa-envelope', label:'อีเมล',                  key:'email'},
    {icon:'fa-phone',    label:'โทรศัพท์',               key:'phone'},
    {icon:'fa-calendar', label:'ใช้งานระบบตั้งแต่',      key:'since'},
  ];

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(2px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'480px',maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,0.15)',overflow:'hidden'}}>

        {/* Header — fixed */}
        <div style={{background:'linear-gradient(135deg,#0f766e,#14b8a6)',padding:'24px 24px 20px',textAlign:'center',position:'relative',flexShrink:0}}>
          <button onClick={onClose} style={{position:'absolute',top:'14px',right:'14px',width:'28px',height:'28px',borderRadius:'8px',border:'none',background:'rgba(255,255,255,0.2)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px'}}>
            <i className="fa-solid fa-xmark"></i>
          </button>
          <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'18px',margin:'0 auto 10px'}}>ภก</div>
          <p style={{fontWeight:800,fontSize:'17px',color:'#fff',margin:0}}>{form.name}</p>
          <p style={{fontSize:'12px',color:'rgba(255,255,255,0.8)',margin:'3px 0 0'}}>{form.position}</p>
          <span style={{display:'inline-block',marginTop:'7px',background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'20px'}}>
            <i className="fa-solid fa-shield-halved" style={{marginRight:'4px'}}></i>{form.role}
          </span>
        </div>

        {/* Info rows — scrollable */}
        <div style={{overflowY:'auto',flex:1,padding:'16px 24px'}}>
          {editableFields.map(row=>(
            <div key={row.key} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #f1f5f9'}}>
              <span style={{width:'32px',height:'32px',borderRadius:'8px',background:'#f0fdfa',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className={`fa-solid ${row.icon}`} style={{color:'#0f766e',fontSize:'13px'}}></i>
              </span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>{row.label}</p>
                {editing
                  ? <input value={form[row.key]} onChange={set(row.key)}
                      style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #14b8a6',outline:'none',background:'transparent',padding:'2px 0'}}/>
                  : <p style={{fontSize:'13px',fontWeight:600,color:'#1f2937',margin:0}}>{form[row.key]}</p>
                }
              </div>
            </div>
          ))}
        </div>

        {/* Footer — fixed */}
        <div style={{padding:'12px 24px 18px',display:'flex',gap:'8px',borderTop:'1px solid #f1f5f9',flexShrink:0}}>
          {editing ? <>
            <button onClick={()=>setEditing(false)} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#374151',fontWeight:600,fontSize:'13px',cursor:'pointer'}}>
              ยกเลิก
            </button>
            <button onClick={()=>setEditing(false)} style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',background:'#0f766e',color:'#fff',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>
              <i className="fa-solid fa-check" style={{marginRight:'6px'}}></i>บันทึก
            </button>
          </> : <>
            <button onClick={()=>setEditing(true)} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#374151',fontWeight:600,fontSize:'13px',cursor:'pointer'}}>
              <i className="fa-solid fa-pen" style={{marginRight:'6px'}}></i>แก้ไขข้อมูล
            </button>
            <button style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#374151',fontWeight:600,fontSize:'13px',cursor:'pointer'}}>
              <i className="fa-solid fa-key" style={{marginRight:'6px'}}></i>เปลี่ยนรหัสผ่าน
            </button>
            <button onClick={onClose} style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',background:'#0f766e',color:'#fff',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>
              ปิด
            </button>
          </>}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
