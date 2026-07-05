'use client'
/** patient-images/image-hash.js — คำนวณ hash ของรูป (ฝั่งเบราว์เซอร์ · ตอนอัป)
 *  - sha256/md5/crc32 = จาก "ไฟล์ต้นฉบับ" (นิ่ง ไม่เปลี่ยนตามการบีบอัด)
 *  - phash (dHash) = จาก "ภาพที่ถอดรหัสแล้ว" → จับ "ภาพเดียวกันแม้คนละไฟล์/บีบอัดต่าง"
 *  self-contained ไม่พึ่ง lib ภายนอก */

// ---------- CRC32 ----------
const _CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
function crc32Hex(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = _CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return ((c ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0'); }

// ---------- MD5 (RFC 1321 · classic) ----------
function _md5(u8) {
  function rl(x, c) { return (x << c) | (x >>> (32 - c)); }
  function ad(a, b) { const l = (a & 0xFFFF) + (b & 0xFFFF); return (((a >> 16) + (b >> 16) + (l >> 16)) << 16) | (l & 0xFFFF); }
  function cmn(q, a, b, x, s, t) { return ad(rl(ad(ad(a, q), ad(x, t)), s), b); }
  function ff(a,b,c,d,x,s,t){return cmn((b&c)|(~b&d),a,b,x,s,t);}
  function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&~d),a,b,x,s,t);}
  function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
  function ii(a,b,c,d,x,s,t){return cmn(c^(b|~d),a,b,x,s,t);}
  const n = u8.length;
  const words = [];
  for (let i = 0; i < n; i++) words[i >> 2] = (words[i >> 2] || 0) | (u8[i] << ((i % 4) * 8));
  words[n >> 2] = (words[n >> 2] || 0) | (0x80 << ((n % 4) * 8));
  const bits = n * 8;
  const len = (((n + 8) >> 6) + 1) * 16;
  while (words.length < len) words.push(0);
  words[len - 2] = bits & 0xFFFFFFFF;
  words[len - 1] = Math.floor(bits / 0x100000000);
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (let i = 0; i < words.length; i += 16) {
    const oa=a,ob=b,oc=c,od=d, x=words;
    a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330);
    a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
    a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
    a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
    a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302);
    a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
    a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);
    a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);
    a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
    a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);
    a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);
    a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);
    a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
    a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799);
    a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
    a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551);
    a=ad(a,oa);b=ad(b,ob);c=ad(c,oc);d=ad(d,od);
  }
  const hex = (w) => { let s = ''; for (let j = 0; j < 4; j++) s += ((w >> (j * 8)) & 0xFF).toString(16).padStart(2, '0'); return s; };
  return hex(a) + hex(b) + hex(c) + hex(d);
}

// ---------- SHA-256 (pure JS · fallback) ----------
// ใช้ตอน crypto.subtle ใช้ไม่ได้ (เปิดผ่าน IP http:// ที่ไม่ใช่ secure context เช่น LAN 192.168.x.x)
function _sha256(u8) {
  const K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
  const l = u8.length;
  const k = Math.ceil((l + 9) / 64) * 64;
  const m = new Uint8Array(k);
  m.set(u8); m[l] = 0x80;
  const dv = new DataView(m.buffer);
  dv.setUint32(k - 8, Math.floor(l / 0x20000000) >>> 0, false);   // ความยาว (บิต) big-endian 64-bit
  dv.setUint32(k - 4, (l * 8) >>> 0, false);
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < k; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15] >>> 3);
      const s1 = rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2] >>> 10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0;
    }
    let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
    }
    h0=(h0+a)>>>0;h1=(h1+b)>>>0;h2=(h2+c)>>>0;h3=(h3+d)>>>0;h4=(h4+e)>>>0;h5=(h5+f)>>>0;h6=(h6+g)>>>0;h7=(h7+h)>>>0;
  }
  const x = (v) => (v >>> 0).toString(16).padStart(8, '0');
  return x(h0)+x(h1)+x(h2)+x(h3)+x(h4)+x(h5)+x(h6)+x(h7);
}
// SHA-256 — ใช้ native (เร็ว) ถ้ามี · ไม่งั้น fallback pure JS (ทำงานได้ทุก context)
async function sha256Hex(buf) {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const h = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {}
  return _sha256(new Uint8Array(buf));
}

// ---------- dHash (perceptual · 64-bit → hex 16) ----------
function _loadImg(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
async function dHashHex(imgSrc) {
  const img = await _loadImg(imgSrc);
  const W = 9, H = 8;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;
  const g = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  let bits = 0n;
  for (let y = 0; y < H; y++) for (let x = 0; x < W - 1; x++) { bits = (bits << 1n) | (g[y * W + x] > g[y * W + x + 1] ? 1n : 0n); }
  return bits.toString(16).padStart(16, '0');
}

// ---------- Hamming distance ระหว่าง 2 dHash (hex) → จำนวน bit ต่าง ----------
function phashDistance(a, b) {
  if (!a || !b) return 64;
  let x = BigInt('0x' + a) ^ BigInt('0x' + b), c = 0;
  while (x) { c += Number(x & 1n); x >>= 1n; }
  return c;
}

// ---------- byte hashes (sha256/md5/crc32) ของ blob/file ----------
async function computeByteHashes(blob) {
  const out = { sha256: null, md5: null, crc32: null };
  try {
    const buf = await blob.arrayBuffer();
    const u8 = new Uint8Array(buf);
    // แยกแต่ละตัว — ตัวใดพังไม่ลากตัวอื่น (md5/crc32 = pure JS ทำงานได้เสมอ · sha256 มี fallback)
    try { out.md5 = _md5(u8); } catch (e) { console.error('md5 failed', e); }
    try { out.crc32 = crc32Hex(u8); } catch (e) { console.error('crc32 failed', e); }
    try { out.sha256 = await sha256Hex(buf); } catch (e) { console.error('sha256 failed', e); }
  } catch (e) { console.error('byte hash failed', e); }
  return out;
}
// ---------- perceptual hash (dHash) ของภาพ (จาก data URL/URL) ----------
async function computePerceptualHash(imgSrc) {
  try { return await dHashHex(imgSrc); } catch (e) { console.error('phash failed', e); return null; }
}

export { computeByteHashes, computePerceptualHash, phashDistance }
