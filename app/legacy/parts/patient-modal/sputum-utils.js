/**
 * patient-modal/sputum-utils.js — helper วิเคราะห์เสมหะ (แยกรอบ 3) — leaf ใช้ร่วม diagnosis+timeline+index
 * hasResistance, afbCombined, isAfbPositive, getSputumConversion, isDelayedConversion (pure)
 */
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

export { hasResistance, afbCombined, isAfbPositive, getSputumConversion, isDelayedConversion }
