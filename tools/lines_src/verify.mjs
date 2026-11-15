const m = await import('/home/user/Pixel-city-2/src/story/ambient_lines.js');
const d = await import('/home/user/Pixel-city-2/src/story/dialogue.js');
const L = m.LINES; const out = []; const seen = new Map(); let total = 0; const problems = [];
const amb = []; const wa = x => { if (typeof x === 'string') amb.push(x); else if (x && typeof x === 'object') Object.values(x).forEach(wa); }; wa(d.AMBIENT);
for (const a of amb) seen.set(a.toLowerCase().trim(), 'AMBIENT');
const chk = (s, p) => {
  if (typeof s !== 'string' || !s.trim()) { problems.push('NOT A STRING ' + p); return; }
  total++;
  if (s.length > 90) problems.push(`LONG ${s.length} ${p}: ${s}`);
  for (const t of s.match(/\{(\w+)\}/g) || []) {
    if (t === '{name}' && !/player\.(regular|birthday)$/.test(p)) problems.push('NAME TOKEN ' + p + ': ' + s);
    else if (t === '{district}' && !p.startsWith('general')) problems.push('DISTRICT TOKEN ' + p + ': ' + s);
    else if (t !== '{name}' && t !== '{district}') problems.push('UNKNOWN TOKEN ' + p + ': ' + s);
  }
  const k = s.toLowerCase().trim(); if (seen.has(k)) problems.push(`DUP ${p} vs ${seen.get(k)}: ${s}`); seen.set(k, p);
};
const isDuetPool = p => p === 'duets' || p.startsWith('duets_by');
const walk = (x, p) => {
  if (Array.isArray(x)) {
    if (!x.length) problems.push('EMPTY ' + p);
    if (isDuetPool(p)) { x.forEach((pair, i) => { if (!Array.isArray(pair) || pair.length !== 2) problems.push(`BAD DUET ${p}[${i}]`); else pair.forEach(s => chk(s, p)); }); out.push([p, x.length + ' pairs']); }
    else { x.forEach(s => chk(s, p)); out.push([p, x.length]); }
  } else Object.entries(x).forEach(([k, v]) => walk(v, p ? p + '.' + k : k));
};
walk(L, '');
const sum = {}; for (const [p, n] of out) { const g = p.split('.')[0]; sum[g] = (sum[g] || 0) + (typeof n === 'number' ? n : parseInt(n)); }
for (const [p, n] of out) console.log(p.padEnd(36), n);
console.log('GROUP TOTALS', JSON.stringify(sum));
console.log('TOTAL strings', total, '| pools', out.length, '| problems', problems.length);
problems.forEach(x => console.log(x));
