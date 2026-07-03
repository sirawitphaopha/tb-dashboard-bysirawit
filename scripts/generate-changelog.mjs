// scripts/generate-changelog.mjs
// generate public/tb-changelog.js from git log
// run: node scripts/generate-changelog.mjs > public/tb-changelog.js

import { execSync } from 'node:child_process';

// ─── Tag detection by keyword in bullet text ─────────────────────────────
const TAG_RULES = [
  { tag: 'security', keys: ['security','rls','xss','csp','rate limit','brute','auth','bypass','escape','sanitiz','permission','sensitive','privacy','enumer','session expired','signOut','sign out','sign-out'] },
  { tag: 'bug',      keys: ['fix:','bug','race','crash','typo','revert','rollback','hotfix','แก้บั๊ก','แก้ปัญหา'] },
  { tag: 'ui',       keys: ['ui','ux','design','redesign','animation','modal','popup','banner','sticky','color','สี','rounded','gradient','tooltip','badge','chip','sidebar','dashboard','polish','revamp','โฉม','ดีไซน์','ปรับ ui'] },
  { tag: 'backend',  keys: ['supabase','api','endpoint','middleware','script','sql','schema','migration','table','view','rls','resend','cloudflare','build','deploy','env','config','realtime','subscribe'] },
  { tag: 'text',     keys: ['ภาษา','คำว่า','ข้อความ','ทางการ','คำนำหน้า','wording','copy'] },
  { tag: 'remove',   keys: ['ลบหน้า','remove','delete page','retire','deprecate','retired','obsolete','cleanup','revert','ตัดทิ้ง'] },
];
function detectTag(text) {
  const t = (text || '').toLowerCase();
  // priority order: security > bug > backend > ui > text > remove > feature
  for (const r of TAG_RULES) {
    if (r.keys.some(k => t.includes(k))) return r.tag;
  }
  return 'feature';
}

// ─── Parse versions from git log ─────────────────────────────────────────
const log = execSync('git log --reverse --format="===%H===%n===SUBJECT===%n%s%n===DATE===%n%ad%n===BODY===%n%b%n===END==="', { encoding: 'utf-8', cwd: process.cwd() });
const re = /===([0-9a-f]{40})===\n===SUBJECT===\n([^\n]+)\n===DATE===\n([^\n]+)\n===BODY===\n([\s\S]*?)\n===END===/g;

const commits = [];
let m;
while ((m = re.exec(log)) !== null) {
  commits.push({ hash: m[1], short: m[1].slice(0,7), full: m[1], subject: m[2], date: m[3], body: m[4] });
}

// ─── Extract version from subject ────────────────────────────────────────
function extractVersion(subject) {
  const m = subject.match(/v?(\d+\.\d+(?:\.\d+){0,3})/);
  return m ? m[1] : null;
}
function getMajor(version) {
  const parts = version.split('.');
  return `${parts[0]}.${parts[1]}`;
}

// ─── Convert date to Thai พ.ศ. ─────────────────────────────────────────
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
function thaiDate(d) {
  // d is like "Wed May 30 12:34:56 2026 +0700"
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear()+543}`;
}

// ─── Trim body: remove Co-Authored-By + empty lines at end ──────────────
function trimBody(body) {
  let lines = body.split('\n');
  // remove Co-Authored-By + Claude-Session trailer lines (noise from cloud/mobile commits)
  lines = lines.filter(l => !/^co-?authored-by:/i.test(l.trim()) && !/^claude-session:/i.test(l.trim()));
  // strip trailing empty lines
  while (lines.length && lines[lines.length-1].trim() === '') lines.pop();
  while (lines.length && lines[0].trim() === '') lines.shift();
  return lines.join('\n');
}

// ─── Extract title from subject (strip "vX.Y.Z" / "feat: " / etc.) ──────
function extractTitle(subject) {
  let s = subject;
  // strip type prefixes (รองรับ scope เช่น refactor(split-r3-4): )
  s = s.replace(/^(feat|fix|chore|docs|refactor|security|style|test)(\([^)]*\))?:\s*/i, '');
  // ตัด "หัว" ที่ไม่ใช่เนื้อหา — ชื่อโปรเจกต์ / เลข version / ตัวคั่น — วนจนไม่เหลือ
  // (commit เก่ามีทั้ง "TB-CARE LINK vX — ..." และ "vX · TB-CARE LINK — ..." สลับลำดับกัน จึงต้องวน)
  // \p{Pd} = dash ทุกชนิดใน Unicode (-, –, —, ―, ‒) · · = middot · : = colon
  let prev;
  do {
    prev = s;
    s = s.replace(/^TB[- ]?(CARE\s*&?\s*JOURNEY|CARE LINK)\s*/iu, '');    // ชื่อโปรเจกต์
    s = s.replace(/^v?\d+\.\d+(?:\.\d+){0,3}\s*(?:hotfix|hf)?\s*/iu, ''); // เลข version (+hotfix)
    s = s.replace(/^[\p{Pd}·:]\s*/u, '');                                 // ตัวคั่นนำหน้า
  } while (s !== prev);
  // strip trailing dash + vX.Y.Z(.W) (ซ้ำกับเลข version ที่โชว์อยู่แล้ว)
  s = s.replace(/\s*[\p{Pd}·]\s*v?\d+\.\d+(?:\.\d+){0,3}\s*$/u, '');
  return s.trim();
}

// ─── Extract bullets from body ───────────────────────────────────────────
function extractBullets(body, maxCount = 15) {
  const lines = body.split('\n');
  const bullets = [];
  let currentBullet = null;
  for (const line of lines) {
    const trimmed = line.trim();
    // start of new bullet: "- ..." or "• ..." or "* ..." or "·" (sub-bullet)
    const bulletMatch = trimmed.match(/^[-•*·]\s+(.+)$/);
    if (bulletMatch) {
      if (currentBullet) {
        bullets.push(currentBullet);
        if (bullets.length >= maxCount) break;
      }
      currentBullet = bulletMatch[1];
    } else if (currentBullet && trimmed && !trimmed.match(/^[═━─━]+$/) && !trimmed.match(/^[🇹🇭🇺🇸=]/)) {
      // continuation line — append (but limit length)
      if (currentBullet.length < 200) {
        currentBullet += ' ' + trimmed;
      }
    } else if (!bulletMatch && currentBullet) {
      // hit non-bullet non-continuation: finalize current
      bullets.push(currentBullet);
      currentBullet = null;
      if (bullets.length >= maxCount) break;
    }
  }
  if (currentBullet && bullets.length < maxCount) bullets.push(currentBullet);
  return bullets.map(b => b.replace(/\s+/g, ' ').trim()).filter(b => b.length > 5 && b.length < 250);
}

// ─── Pick best 7-15 bullets, prefer diverse tags ─────────────────────────
function pickBullets(allBullets, target = 12) {
  // dedupe similar
  const seen = new Set();
  const uniq = allBullets.filter(b => {
    const k = b.toLowerCase().slice(0, 40);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  // limit
  return uniq.slice(0, target).map(text => ({ tag: detectTag(text), text }));
}

// ─── Major metadata ──────────────────────────────────────────────────────
const MAJOR_META = {
  '0.5': { era: 'Genesis',           icon: '🌱', color: '#65a30d', description: 'จุดเริ่มต้น — ลองวาง concept TB-CARE LINK + แปลงโปรเจกต์เป็น Next.js' },
  '0.6': { era: 'First Real Build',  icon: '🚀', color: '#0891b2', description: 'Full App Build ครั้งแรก — Dashboard, Patient List, Modal ทุกอย่างเปิดตัวพร้อมกัน' },
  '0.7': { era: 'Auth + Audit Era',  icon: '⚡', color: '#0f766e', description: 'ระบบ login จริง + Audit Log ครบวงจร + Admin Approval + ดีไซน์ใหม่ทั้งหมด' },
};

// ─── Build entries grouped by major ──────────────────────────────────────
const versionMap = new Map(); // version → { commit, date, title, body }
for (const c of commits) {
  const v = extractVersion(c.subject);
  if (!v) continue;
  // prefer the FIRST commit that introduces a version (in case there are multiple touch-ups)
  if (versionMap.has(v)) continue;
  versionMap.set(v, c);
}

// Group by major
const byMajor = new Map();
for (const [version, c] of versionMap) {
  const major = getMajor(version);
  if (!byMajor.has(major)) byMajor.set(major, []);
  byMajor.get(major).push({ version, c });
}

// Sort versions within each major (descending)
function compareVerDesc(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return y - x;
  }
  return 0;
}

// ─── Period for each major ───────────────────────────────────────────────
function getMajorPeriod(versions) {
  const dates = versions.map(v => new Date(v.c.date));
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  const fmt = d => `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`;
  if (fmt(min) === fmt(max)) return `${fmt(min)} ${min.getFullYear()+543}`;
  return `${fmt(min)} – ${fmt(max)} ${max.getFullYear()+543}`;
}

// ─── Render the output ───────────────────────────────────────────────────
function jsString(s) {
  return JSON.stringify(s);
}

let out = '';
out += `// tb-changelog.js — ประวัติเวอร์ชัน TB JOURNEY & CARE\n`;
out += `// ⚠️ AUTO-GENERATED จาก git log โดย scripts/generate-changelog.mjs\n`;
out += `// แก้ไขด้วยมือได้ แต่ run script ใหม่จะ overwrite\n`;
out += `// ทุกครั้งที่ push version ใหม่ → run script generate ใหม่\n\n`;

out += `window.TB_TAGS = {\n`;
out += `  feature:  { emoji: '🆕', label: 'ฟีเจอร์ใหม่',    bg: '#d1fae5', fg: '#065f46', border: '#6ee7b7' },\n`;
out += `  ui:       { emoji: '🎨', label: 'ปรับ UI',         bg: '#f3e8ff', fg: '#6b21a8', border: '#d8b4fe' },\n`;
out += `  bug:      { emoji: '🐛', label: 'แก้บั๊ก',         bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },\n`;
out += `  security: { emoji: '🔒', label: 'ความปลอดภัย',     bg: '#dbeafe', fg: '#1e3a8a', border: '#93c5fd' },\n`;
out += `  backend:  { emoji: '⚙️', label: 'ระบบหลังบ้าน',    bg: '#f1f5f9', fg: '#334155', border: '#cbd5e1' },\n`;
out += `  remove:   { emoji: '🗑',  label: 'ลบ/ยกเลิก',       bg: '#e2e8f0', fg: '#475569', border: '#cbd5e1' },\n`;
out += `  text:     { emoji: '📝', label: 'ข้อความ/UX',      bg: '#fef3c7', fg: '#92400e', border: '#fcd34d' },\n`;
out += `};\n\n`;

out += `window.TB_CHANGELOG = [\n`;

// Sort majors descending
const sortedMajors = [...byMajor.keys()].sort((a,b)=>compareVerDesc(a,b));
for (const major of sortedMajors) {
  const meta = MAJOR_META[major] || { era: 'Unknown', icon: '📦', color: '#6b7280', description: '' };
  const entries = byMajor.get(major).sort((a,b)=>compareVerDesc(a.version, b.version));
  const period = getMajorPeriod(entries);

  out += `  {\n`;
  out += `    major: ${jsString(major)},\n`;
  out += `    era: ${jsString(meta.era)},\n`;
  out += `    icon: ${jsString(meta.icon)},\n`;
  out += `    color: ${jsString(meta.color)},\n`;
  out += `    period: ${jsString(period)},\n`;
  out += `    description: ${jsString(meta.description)},\n`;
  out += `    versions: [\n`;

  for (const { version, c } of entries) {
    const trimmed = trimBody(c.body);
    const bullets = pickBullets(extractBullets(trimmed), 14);
    const title = extractTitle(c.subject);
    out += `      {\n`;
    out += `        version: ${jsString(version)},\n`;
    out += `        date: ${jsString(thaiDate(c.date))},\n`;
    out += `        commit: ${jsString(c.short)},\n`;
    out += `        commitFull: ${jsString(c.full)},\n`;
    out += `        title: ${jsString(title)},\n`;
    out += `        changes: [\n`;
    if (bullets.length === 0) {
      // fallback: 1 bullet from title
      out += `          { tag: ${jsString(detectTag(title))}, text: ${jsString(title)} },\n`;
    } else {
      for (const b of bullets) {
        out += `          { tag: ${jsString(b.tag)}, text: ${jsString(b.text)} },\n`;
      }
    }
    out += `        ],\n`;
    if (trimmed && trimmed.trim().length > 0) {
      out += `        body: ${JSON.stringify(trimmed)},\n`;
    }
    out += `      },\n`;
  }

  out += `    ],\n`;
  out += `  },\n`;
}

out += `];\n`;

process.stdout.write(out);
