/**
 * parts/dashboard/helpers.js — helper ใช้ร่วมในโดเมน dashboard (แยกรอบ 2)
 * getTotalMonths — จำนวนเดือนรวมของสูตรยา (ใช้ทั้ง overview + patient-lists)
 */
function getTotalMonths(regimen) {
  if (!regimen) return null;
  const m = regimen.match(/^(\d+)[A-Z]+\/(\d+)/);
  if (m) return parseInt(m[1]) + parseInt(m[2]);
  if (/^6-9H/.test(regimen)) return 9;
  if (/^3HR/.test(regimen)) return 3;
  return null;
}

export { getTotalMonths }
