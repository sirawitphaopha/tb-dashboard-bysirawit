
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

  // ── ป้าย "New" บน sidebar — ดูจาก localStorage tb_changelog_last_seen ──
  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem('tb_changelog_last_seen');
      if (!lastSeen || lastSeen !== APP_VERSION) setChangelogUnseen(true);
    } catch {/* localStorage ปิด → ไม่แสดง dot */}
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
  const [userDbNotifs, setUserDbNotifs] = useState([]);
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
        fetch('/api/easter-egg/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({event_type:'kicked_out'})}).catch(()=>{});
        fetch('/api/auth/signout', {method:'POST'}).then(()=>{ window.top.location.href='/login'; });
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

      {/* ── SIDEBAR ── */}
      <div style={{position:'relative',width:sidebarOpen?'260px':'72px',transition:'width 0.2s ease',flexShrink:0}} onMouseEnter={()=>setSidebarHovered(true)} onMouseLeave={()=>setSidebarHovered(false)}>
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
                <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative'}}>
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
            <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#0f766e',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:(currentUser?.avatar||'').length>3?'8px':'11px'}}>{currentUser?.avatar || '?'}</div>
            </span>
            <div style={{overflow:'hidden',maxWidth:sidebarOpen?'160px':'0px',opacity:sidebarOpen?1:0,transition:'max-width 0.2s ease,opacity 0.15s ease',whiteSpace:'nowrap'}}>
              <p style={{fontWeight:700,fontSize:'12px',color:'#1f2937',margin:0}}>{currentUser?.fullName || '—'}</p>
              <p style={{fontSize:'11px',color:'#0f766e',margin:0}}>{currentUser?.profession || ''}</p>
            </div>
          </button>
          {/* ปุ่มออกระบบ */}
          <button
            onClick={async ()=>{ await fetch('/api/auth/signout', {method:'POST'}); window.top.location.href='/login'; }}
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

      {/* Floating chevron toggle — option 1 */}
      <button
        onClick={()=>setSidebarOpen(o=>!o)}
        title={sidebarOpen?'ซ่อนเมนู':'แสดงเมนู'}
        style={{position:'absolute',right:'-12px',top:'32px',width:'24px',height:'24px',borderRadius:'50%',border:'1.5px solid #e5e7eb',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:20,color:'#0d9488',transition:'border-color 0.15s'}}
        onMouseEnter={e=>e.currentTarget.style.borderColor='#0d9488'}
        onMouseLeave={e=>e.currentTarget.style.borderColor='#e5e7eb'}
      >
        <i className={`fa-solid ${sidebarOpen?'fa-chevron-left':'fa-chevron-right'}`} style={{fontSize:'9px',color:'#0d9488'}}></i>
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

        <div style={{ scrollbarGutter: 'stable' }} className={`flex-1 p-6 min-h-0 ${(nav==='patient-list'||nav==='archive-list'||nav==='all-patients')?'overflow-hidden':'overflow-y-auto'}`}>
          {dbLoading && <div className="flex items-center justify-center h-full"><div className="text-center text-gray-400"><i className="fa-solid fa-spinner fa-spin text-3xl mb-3 block text-teal-500"></i><p className="text-sm">กำลังโหลดข้อมูล...</p></div></div>}
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
const APP_VERSION = '0.7.14.8';
const BUILD_DATE = '31 พ.ค. 2569';
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
  const [expandedMajors, setExpandedMajors] = useState(new Set([window.TB_CHANGELOG[0]?.major]));
  const [expandedMinors, setExpandedMinors] = useState(new Set());
  const [expandedVersions, setExpandedVersions] = useState(new Set());
  const [copiedHash, setCopiedHash] = useState(null);
  const [copiedFull, setCopiedFull] = useState(null); // version string ที่เพิ่ง copy ฉบับเต็ม
  const [commitDetailEntry, setCommitDetailEntry] = useState(null); // {entry, color}
  const [localToast, setLocalToast] = useState(null); // {text, type}
  const [expandedComments, setExpandedComments] = useState(new Set()); // version ที่เปิด comments ใน Timeline view
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
      }
    } catch {/* network fail */}
  }, []);
  useEffect(() => { refreshAllComments(); }, [refreshAllComments]);

  // ── Realtime subscription — comments + likes (v0.7.14.5) ──
  React.useEffect(() => {
    if (!window._sb) return;
    let pending = null;
    const debounced = () => { clearTimeout(pending); pending = setTimeout(refreshAllComments, 300); };
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
    let tries = 0;
    const interval = setInterval(() => {
      tries += 1;
      const el = document.getElementById('cmt-' + commentId);
      if (el) {
        clearInterval(interval);
        // อยู่ใน iframe — ใช้ scrollIntoView พร้อม container scroll
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.remove('comment-flash');
        void el.offsetWidth;  // force reflow
        el.classList.add('comment-flash');
        setTimeout(() => { if (onClearHighlight) onClearHighlight(); }, 500);
      } else if (tries > 40) {  // 4 วินาที
        clearInterval(interval);
        console.warn('[ChangelogPage] comment not found:', commentId);
        if (onClearHighlight) onClearHighlight();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [highlightCommentTarget, onClearHighlight]);

  const toggleComments = (version) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version); else next.add(version);
      return next;
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
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-scroll text-2xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg">ประวัติเวอร์ชั่น</h2>
            <p className="text-xs text-teal-100" style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
              <span>รวม {stats.totalVersions} เวอร์ชัน</span>
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
                  <button type="button" onClick={()=>setOnlyWithComments(v=>!v)} title="กรองเฉพาะที่มีคอมเม้น"
                    style={{cursor:'pointer',border:onlyWithComments?'1px solid #fff':'1px solid rgba(255,255,255,0.3)',background: onlyWithComments ? '#fff' : 'rgba(255,255,255,0.15)',color: onlyWithComments ? '#92400e' : '#fff',padding:'2px 8px',borderRadius:'999px',fontSize:'11px',fontWeight:700,transition:'all 0.15s',lineHeight:1.3,display:'inline-flex',alignItems:'center',gap:'3px'}}>
                    <i className="fa-regular fa-comment"></i>{totalComments}
                  </button>
                );
              })()}
            </p>
            <p className="text-xs text-teal-100/80" style={{marginTop:'2px'}}>ตั้งแต่ v0.5.0 ถึง v{APP_VERSION}</p>
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

      {/* ── Filter bar (แถบ 1: ตัวกรองระบบ) ── */}
      <div style={{padding:'12px 16px',marginTop:'12px',background:'#fff',borderRadius:'14px',border:'1px solid #e5e7eb',boxShadow:'0 4px 12px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}>
          <i className="fa-solid fa-sliders" style={{color:'#0d9488',fontSize:'12px'}}></i>
          <span style={{fontSize:'12px',fontWeight:700,color:'#0f766e'}}>ตัวกรองเวอร์ชั่น</span>
        </div>
        <div style={{display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'0 0 260px'}}>
          <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'12px'}}></i>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเวอร์ชัน/หัวเรื่อง/รายละเอียด"
            style={{width:'100%',padding:'8px 12px 8px 32px',borderRadius:'10px',border:'1px solid #e5e7eb',background:'#f9fafb',fontSize:'12px',outline:'none',color:'#1f2937',caretColor:'#0d9488'}}
            onFocus={e=>{e.currentTarget.style.borderColor='#14b8a6';e.currentTarget.style.background='#fff';}}
            onBlur={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.background='#f9fafb';}}
          />
        </div>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',flex:1}}>
          {Object.entries(TAGS).map(([key,t])=>{
            const active = selectedTags.has(key);
            const count = stats.byTag[key] || 0;
            return (
              <button key={key} type="button" onClick={()=>toggleTag(key)}
                style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'5px 10px',borderRadius:'999px',border:active?`1.5px solid ${t.fg}`:'1px solid #e5e7eb',background:active?t.bg:'#fff',color:active?t.fg:'#6b7280',fontSize:'11px',fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>
                <span>{t.emoji}</span>
                <span>{t.label}</span>
                <span style={{fontSize:'10px',opacity:0.7}}>({count})</span>
              </button>
            );
          })}
          {/* ── ปุ่ม filter "เฉพาะมีคอมเม้น" สีอำพัน (ตรงกับกรอบคอมเม้น) ── */}
          <button type="button" onClick={()=>setOnlyWithComments(v=>!v)}
            title="แสดงเฉพาะเวอร์ชั่นที่มีคอมเม้น"
            style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'5px 10px',borderRadius:'999px',border: onlyWithComments?'1.5px solid #d97706':'1px solid #fbbf24',background: onlyWithComments?'#fef3c7':'#fffbeb',color:'#92400e',fontSize:'11px',fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
            <i className="fa-regular fa-comment"></i>
            <span>เฉพาะมีคอมเม้น</span>
            <span style={{fontSize:'10px',opacity:0.7}}>({Object.values(commentCounts).filter(n=>n>0).length})</span>
          </button>
        </div>
        {hasTagRowFilter && (
          <button type="button" onClick={clearTagFilters}
            style={{padding:'6px 12px',borderRadius:'8px',border:'1.5px solid #ef4444',background:'#fef2f2',color:'#b91c1c',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
            <i className="fa-solid fa-xmark" style={{marginRight:'4px'}}></i>ล้างค่า
          </button>
        )}
        </div>{/* /flex row */}
      </div>

      {/* ── แถบที่ 2: ตัวกรองคอมเม้น (v0.7.14.7) ── */}
      <div style={{padding:'10px 14px',marginTop:'8px',background:'#fffbeb',borderRadius:'14px',border:'1px solid #fde68a',boxShadow:'0 4px 12px rgba(245,158,11,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'5px',marginBottom:'8px'}}>
          <i className="fa-solid fa-comments" style={{color:'#d97706',fontSize:'12px'}}></i>
          <span style={{fontSize:'12px',fontWeight:700,color:'#92400e'}}>ตัวกรองคอมเม้น</span>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
        {/* ช่องค้นหา comment text */}
        <div style={{position:'relative',flex:'0 0 260px'}}>
          <i className="fa-solid fa-magnifying-glass" style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af',fontSize:'11px'}}></i>
          <input type="text" value={commentSearch} onChange={e=>setCommentSearch(e.target.value)} placeholder="ค้นหาข้อความในคอมเม้น"
            style={{width:'100%',padding:'7px 10px 7px 28px',borderRadius:'8px',border:'1px solid #fbbf24',background:'#fff',fontSize:'12px',outline:'none',color:'#1f2937',caretColor:'#d97706'}}
            onFocus={e=>{e.currentTarget.style.borderColor='#d97706';}}
            onBlur={e=>{e.currentTarget.style.borderColor='#fbbf24';}}
          />
        </div>

        {/* Status chips — 4 ประเภท */}
        <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
          {Object.entries(CHANGELOG_STATUS_META).map(([key,meta])=>{
            const active = selectedStatuses.has(key);
            const count = commentFilterStats.byStatus[key] || 0;
            return (
              <button key={key} type="button" onClick={()=>toggleStatus(key)}
                style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'5px 9px',borderRadius:'999px',border:active?`1.5px solid ${meta.fg}`:'1px solid #e5e7eb',background:active?meta.bg:'#fff',color:active?meta.fg:'#6b7280',fontSize:'11px',fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}>
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
                <span style={{fontSize:'10px',opacity:0.7}}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* @ Mention picker */}
        <div ref={mentionPickerRef} style={{position:'relative'}}>
          <button type="button" onClick={()=>{ const next = !mentionPickerOpen; setMentionPickerOpen(next); if (next) ensureMentionUsersLoaded(); }}
            style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'5px 10px',borderRadius:'999px',border:selectedMentionUserIds.size>0?'1.5px solid #0d9488':'1px solid #5eead4',background:selectedMentionUserIds.size>0?'#ccfbf1':'#f0fdfa',color:'#0f766e',fontSize:'11px',fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
            <i className="fa-solid fa-at"></i>
            <span>แท็กผู้ใช้</span>
            {selectedMentionUserIds.size>0 && <span style={{fontSize:'10px',background:'#0d9488',color:'#fff',padding:'1px 6px',borderRadius:'999px'}}>{selectedMentionUserIds.size}</span>}
            <i className={`fa-solid ${mentionPickerOpen?'fa-chevron-up':'fa-chevron-down'}`} style={{fontSize:'9px'}}></i>
          </button>

          {mentionPickerOpen && (
            <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,zIndex:60,background:'#fff',border:'2px solid #0d9488',borderRadius:'10px',minWidth:'360px',maxWidth:'440px',maxHeight:'360px',overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,0.18)'}}>
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
                  return (
                    <label key={u.id} className={'tb-mention-filter-row' + (isAdminUser ? ' is-admin' : '')}
                      style={{display:'flex',alignItems:'center',gap:'6px',padding:'7px 10px',cursor:'pointer',fontSize:'12px',color:'#1f2937',background:isAdminUser?'#fef3c7':(checked?'#ecfdf5':'transparent'),borderLeft:isAdminUser?'3px solid #d97706':'3px solid transparent',borderBottom:'1px solid #f1f5f9',flexWrap:'nowrap',whiteSpace:'nowrap',overflow:'hidden'}}>
                      <input type="checkbox" checked={checked} onChange={()=>toggleMentionUser(u.id)} style={{cursor:'pointer',flexShrink:0}}/>
                      <b style={{color:isAdminUser?'#92400e':'#0f766e',flexShrink:0}}>@{u.username}</b>
                      {isAdminUser && <span style={{fontSize:'9px',fontWeight:800,color:'#fff',background:'#d97706',padding:'1px 5px',borderRadius:'999px',flexShrink:0}}>ADMIN</span>}
                      <span style={{color:'#374151',fontWeight:600,fontSize:'11px',overflow:'hidden',textOverflow:'ellipsis',flex:'1 1 auto',minWidth:0}} title={u.display_name}>· {u.display_name}</span>
                      {u.profession_label && <span style={{color:'#6b7280',fontSize:'10px',flexShrink:0}}>· {u.profession_label}</span>}
                      <span style={{marginLeft:'4px',fontSize:'10px',color:'#9ca3af',flexShrink:0}}>({commentFilterStats.byMentionedId[u.id]||0})</span>
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

        {/* Resolved tri-state — กดซ้ำ active button เพื่อกลับเป็น 'all' */}
        <div style={{display:'inline-flex',border:'1px solid #fbbf24',borderRadius:'8px',overflow:'hidden'}}>
          {[
            { v:'all', label:'ทั้งหมด', count: null },
            { v:'open', label:'ยังไม่จัดการ', count: commentFilterStats.openCount },
            { v:'resolved', label:'จัดการแล้ว', count: commentFilterStats.resolvedCount },
          ].map(({v,label,count}, i) => {
            const active = resolvedFilter === v;
            return (
              <button key={v} type="button"
                onClick={()=>setResolvedFilter(active && v !== 'all' ? 'all' : v)}
                style={{padding:'5px 10px',border:'none',borderLeft:i>0?'1px solid #fbbf24':'none',background:active?'#d97706':'#fff',color:active?'#fff':'#92400e',fontSize:'11px',fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}>
                {label}{count !== null && <span style={{fontSize:'10px',opacity:0.8,marginLeft:'3px'}}>({count})</span>}
              </button>
            );
          })}
        </div>

        {/* คอมเม้นของฉัน */}
        <button type="button" onClick={()=>setOnlyMyComments(v=>!v)}
          disabled={!commentsMeta.currentUserId}
          title={!commentsMeta.currentUserId ? 'ต้องเข้าสู่ระบบก่อน' : 'แสดงเฉพาะคอมเม้นของคุณ'}
          style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'5px 10px',borderRadius:'999px',border:onlyMyComments?'1.5px solid #d97706':'1px solid #fbbf24',background:onlyMyComments?'#fef3c7':'#fffbeb',color:'#92400e',fontSize:'11px',fontWeight:700,cursor:commentsMeta.currentUserId?'pointer':'not-allowed',opacity:commentsMeta.currentUserId?1:0.5,transition:'all 0.15s'}}>
          <i className="fa-solid fa-user"></i>
          <span>คอมเม้นของฉัน</span>
          <span style={{fontSize:'10px',opacity:0.7}}>({commentFilterStats.mineCount})</span>
        </button>

        {/* Extra chips: liked / my replies / unread (v0.7.14.7) */}
        {[
          { k:'liked',      icon:'fa-solid fa-thumbs-up',     label:'ที่ฉันถูกใจ',    count: commentFilterStats.likedCount,      fg:'#b45309', bg:'#fef3c7', border:'#d97706' },
          { k:'my_replies', icon:'fa-solid fa-reply',         label:'ที่ฉันตอบ',      count: commentFilterStats.myRepliesCount,  fg:'#6b21a8', bg:'#f3e8ff', border:'#9333ea' },
          { k:'unread',     icon:'fa-regular fa-envelope',    label:'ยังไม่อ่าน',     count: commentFilterStats.unreadCount,     fg:'#991b1b', bg:'#fee2e2', border:'#dc2626' },
        ].map(({k,icon,label,count,fg,bg,border})=>{
          const active = extraFilters.has(k);
          const disabled = !commentsMeta.currentUserId;
          return (
            <button key={k} type="button" onClick={()=>{ if(!disabled) toggleExtra(k); }}
              disabled={disabled}
              title={disabled ? 'ต้องเข้าสู่ระบบก่อน' : label}
              style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'5px 10px',borderRadius:'999px',border:active?`1.5px solid ${border}`:`1px solid ${border}`,background:active?bg:'#fff',color:active?fg:'#6b7280',fontSize:'11px',fontWeight:700,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,transition:'all 0.15s'}}>
              <i className={icon}></i>
              <span>{label}</span>
              <span style={{fontSize:'10px',opacity:0.7}}>({count})</span>
            </button>
          );
        })}

        {/* ปุ่มล้างค่า — เฉพาะแถบ 2 (v0.7.14.7) */}
        {hasCommentRowFilter && (
          <button type="button" onClick={clearCommentFilters}
            style={{marginLeft:'auto',padding:'6px 12px',borderRadius:'8px',border:'1.5px solid #ef4444',background:'#fef2f2',color:'#b91c1c',fontSize:'11px',fontWeight:700,cursor:'pointer'}}>
            <i className="fa-solid fa-xmark" style={{marginRight:'4px'}}></i>ล้างค่า
          </button>
        )}
        </div>{/* /flex row */}
      </div>

      </div>{/* /sticky header group */}

      {/* ── Body — parent (main content area) จัดการ scroll เอง ── */}
      <div>
        {view === 'timeline' ? (
          // ─── Timeline view ───
          <div style={{maxWidth:'780px',margin:'0 auto'}}>
            {filteredTimeline.length === 0 ? (
              <div style={{textAlign:'center',padding:'60px 20px',color:'#9ca3af'}}>
                <i className="fa-solid fa-magnifying-glass-minus" style={{fontSize:'32px',marginBottom:'12px',display:'block'}}></i>
                <p style={{fontSize:'14px',fontWeight:600,margin:0}}>ไม่พบเวอร์ชันที่ตรงกับตัวกรอง</p>
                <button type="button" onClick={clearFilters} style={{marginTop:'12px',padding:'8px 16px',borderRadius:'8px',border:'1px solid #14b8a6',background:'#fff',color:'#0d9488',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>ล้างตัวกรอง</button>
              </div>
            ) : (
              filteredTimeline.map((v) => {
                const color = v._color;
                const isLatest = v.version === latestVersion;
                const visibleChanges = filterChanges(v.changes);
                if (visibleChanges.length === 0 && selectedTags.size > 0) return null;
                const isOpen = expandedComments.has(v.version);
                return (
                  <div key={v.version} style={{display:'flex',gap:'14px',marginBottom:'14px'}}>
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
                            title={`มี ${commentCounts[v.version]} ความคิดเห็น — กดเพื่อกรองเฉพาะที่มีคอมเม้น`}
                            style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:700,color:onlyWithComments?'#fff':'#92400e',background:onlyWithComments?'#d97706':'#fef3c7',border:onlyWithComments?'1px solid #b45309':'1px solid #fbbf24',padding:'2px 7px',borderRadius:'999px',transition:'all 0.15s'}}>
                            <i className="fa-regular fa-comment"></i>{commentCounts[v.version]}
                          </button>
                        )}
                        <TagBreakdown changes={v.changes}/>
                      </div>
                      <p style={{fontSize:'14px',fontWeight:700,color:'#1f2937',margin:'0 0 8px'}}>{highlightMatch(v.title)}</p>
                      {visibleChanges.map((c,i)=><ChangeRow key={i} change={c}/>)}
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
                      {isOpen && (
                        <ChangelogCommentSection key={'cmt-'+v.version} version={v.version}
                          theme={commentCounts[v.version] > 0 ? 'amber' : 'teal'}
                          initialComments={allCommentsByVersion[v.version] || []}
                          currentUserId={commentsMeta.currentUserId}
                          isAdmin={commentsMeta.isAdmin}
                          onRefresh={refreshAllComments}
                          onCountChange={n=>setCommentCount(v.version, n)}
                          pageFilter={{ hasFilter: hasCommentFilter, matches: commentMatchesAxes }}/>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // ─── Grouped view ───
          <div style={{maxWidth:'880px',margin:'0 auto'}}>
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
                                          {visibleChanges.map((c,i)=><ChangeRow key={i} change={c}/>)}
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
                                            onCountChange={n=>setCommentCount(v.version, n)}/>
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
      </div>

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

const ChangelogCommentSection = React.memo(function ChangelogCommentSection({ version, onCountChange, theme, initialComments, currentUserId: propsUserId, isAdmin: propsIsAdmin, onRefresh, pageFilter }) {
  const T = theme === 'amber'
    ? { bg:'#fffbeb', border:'#f59e0b', accent:'#92400e', accent2:'#d97706', sub:'#b45309', cardBorder:'#fbbf24', formBorder:'#f59e0b' }
    : { bg:'#f0fdfa', border:'#99f6e4', accent:'#0f766e', accent2:'#0d9488', sub:'#5eead4', cardBorder:'#ccfbf1', formBorder:'#5eead4' };
  const [comments, setComments] = React.useState(initialComments || []);
  const [loading, setLoading]   = React.useState(!initialComments);
  const [error, setError]       = React.useState('');
  const [currentUserId, setCurrentUserId] = React.useState(propsUserId || null);
  const [isAdmin, setIsAdmin]   = React.useState(!!propsIsAdmin);
  React.useEffect(() => {
    if (initialComments) { setComments(initialComments); setLoading(false); }
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
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
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
          {visibleParents.map(c => {
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
              <div key={c.id} id={'cmt-'+c.id} style={{background:(pageFilter?.hasFilter && pageFilter.matches(c))?'#fef3c7':'#fff',border:'1.5px solid '+((pageFilter?.hasFilter && pageFilter.matches(c))?'#fbbf24':T.cardBorder),borderLeft:`3px solid ${meta.fg}`,borderRadius:'8px',padding:'10px 12px',minWidth:0,opacity:isDeleted?0.85:(c._pending?0.7:1),transition:'all 0.2s'}}>
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
                  <p style={{fontSize:'18px',color:'#0f766e',fontWeight:600,margin:'6px 0 0',lineHeight:1.55,whiteSpace:'pre-wrap',wordBreak:'break-word',overflowWrap:'anywhere',letterSpacing:'-0.2px'}}>{renderCommentText(c.comment_text)}</p>
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
                        <div key={r.id} id={'cmt-'+r.id} style={{background:(pageFilter?.hasFilter && pageFilter.matches(r))?'#fef3c7':'#fff',border:'1px solid '+((pageFilter?.hasFilter && pageFilter.matches(r))?'#fbbf24':T.cardBorder),borderLeft:`2px solid ${rmeta.fg}`,borderRadius:'6px',padding:'8px 10px',opacity:rIsDeleted?0.75:(r._pending?0.7:1),transition:'all 0.2s'}}>
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
                            <p style={{fontSize:'16px',color:'#0f766e',fontWeight:600,margin:'4px 0 0',lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word',overflowWrap:'anywhere',letterSpacing:'-0.2px'}}>{renderCommentText(r.comment_text)}</p>
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
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res  = await fetch('/api/auth/sessions/history');
      const data = await res.json();
      if (res.ok) setHistory(data.sessions || []);
    } catch {}
    setHistoryLoading(false);
  };

  React.useEffect(() => { loadActive(); }, []);
  React.useEffect(() => { if (showHistory) loadHistory(); }, [showHistory]);

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
    return (
      <div>
        <div style={{position:'sticky',top:'-20px',zIndex:5,background:'#fff',margin:'-20px -28px 14px',padding:'20px 28px 0',boxShadow:'0 4px 8px -6px rgba(0,0,0,0.15)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'4px 0 14px',borderBottom:'1px solid #e5e7eb',marginBottom:'14px'}}>
            <button onClick={()=>setShowHistory(false)} title="กลับไปดูอุปกรณ์ที่กำลังเข้าใช้งาน"
              style={{background:'#f3f4f6',border:'none',color:'#4b5563',cursor:'pointer',fontSize:'12px',fontWeight:600,padding:'7px 12px',borderRadius:'8px',display:'flex',alignItems:'center',gap:'6px',transition:'background 0.15s, color 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#ccfbf1';e.currentTarget.style.color='#0d9488';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.color='#4b5563';}}>
              <i className="fa-solid fa-arrow-left"></i>กลับ
            </button>
            <i className="fa-solid fa-clock-rotate-left" style={{color:'#0d9488',fontSize:'13px',marginLeft:'4px'}}></i>
            <p style={{fontSize:'13px',fontWeight:700,color:'#0d9488',margin:0,textTransform:'uppercase',letterSpacing:'0.5px'}}>ประวัติการเข้าใช้งานทั้งหมด</p>
          </div>
          <StatusLegend/>
        </div>

        {historyLoading ? (
          <div style={{textAlign:'center',padding:'40px 0',color:'#9ca3af',fontSize:'13px'}}>
            <i className="fa-solid fa-spinner fa-spin" style={{marginRight:'8px'}}></i>กำลังโหลด...
          </div>
        ) : history.length === 0 ? (
          <div style={{textAlign:'center',padding:'40px 0',color:'#9ca3af',fontSize:'13px'}}>ไม่พบประวัติ</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {history.map(s => {
              const reason = endReasonLabel(s.end_reason);
              const isActive = !s.ended_at;
              return (
                <div key={s.id} style={{padding:'12px 14px',borderRadius:'10px',border:'1px solid #e5e7eb',background:'#fff'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
                    <i className={`fa-solid ${deviceIcon(s.device_type)}`} style={{color:'#0d9488',fontSize:'16px',width:'18px',textAlign:'center'}}></i>
                    <p style={{fontSize:'13px',fontWeight:700,color:'#134e4a',margin:0,flex:1}}>{s.device_label || 'ไม่ทราบอุปกรณ์'}</p>
                    <span style={{display:'inline-flex',alignItems:'center',gap:'5px',fontSize:'10px',fontWeight:700,padding:'3px 9px',borderRadius:'999px',background:reason.bg,color:reason.color,whiteSpace:'nowrap'}}>
                      <span style={{width:'7px',height:'7px',borderRadius:'50%',background:reason.color,flexShrink:0}}></span>{reason.label}
                    </span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 16px',fontSize:'11px',color:'#6b7280',marginLeft:'28px'}}>
                    <span><i className="fa-solid fa-globe" style={{marginRight:'5px'}}></i>{s.ip_address || '-'}</span>
                    <span><i className="fa-solid fa-right-to-bracket" style={{marginRight:'5px'}}></i>เข้า {relTime(s.started_at)}</span>
                    {s.ended_at && <span><i className="fa-solid fa-right-from-bracket" style={{marginRight:'5px'}}></i>ออก {relTime(s.ended_at)}</span>}
                    {!s.ended_at && <span><i className="fa-solid fa-circle" style={{color:'#22c55e',marginRight:'5px',fontSize:'8px'}}></i>ใช้งานล่าสุด {relTime(s.last_active_at)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
        <div className={modalCls} style={{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'920px',maxHeight:'88vh',display:'flex',flexDirection:'row',boxShadow:'0 20px 60px rgba(0,0,0,0.15)',overflow:'hidden'}}>

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

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
