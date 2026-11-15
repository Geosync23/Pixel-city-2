// Maple Bay City Hall — rendered "look closer" pictures (DOM canvases, drawn in chunky pixels and scaled up by the caller): the painted dome seen from the seal, the plaza from the mayor's balcony / the
// clock tower, the 1962 fountain blueprint, a microfilm frame, an old map and the Resident Card. Pure painters: no state, no game calls except the sprite passed in.
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.className = 'pix'; c.style.width = '100%'; c.style.maxWidth = w * 2 + 'px'; c.style.imageRendering = 'pixelated'; c.style.display = 'block'; c.style.margin = '0 auto 8px'; c.style.border = '3px solid #2a2733'; return c; };
const hs = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const skyOf = h => (h < 5.5 || h >= 20.5 ? ['#0f1430', '#1a2350', '#2a3568'] : h < 7.5 || h >= 18 ? ['#5a5a9a', '#e88a70', '#ffd09a'] : ['#6fb8e6', '#9fd4f0', '#d4eef6']);
const R = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), w, h); };
// tiny scenes for the dome panels, drawn around (cx, cy)
const SCENES = [
  (x, cx, cy) => { R(x, '#7a5a3a', cx - 1, cy - 2, 2, 8); for (const [a, b] of [[0, -8], [-4, -5], [4, -5], [-2, -9], [2, -9], [0, -4]]) R(x, '#c8402e', cx + a - 2, cy + b - 2, 5, 5); R(x, '#f4ecd8', cx - 12, cy + 2, 7, 5); R(x, '#8a6a4a', cx - 11, cy, 5, 2); },      // the founding maple + a tent
  (x, cx, cy) => { R(x, '#f4f0e8', cx - 2, cy - 8, 5, 14); R(x, '#c8402e', cx - 2, cy - 4, 5, 3); R(x, '#ffe9a0', cx - 3, cy - 12, 7, 4); R(x, '#2a2733', cx - 1, cy - 14, 3, 2); R(x, '#8a8478', cx - 7, cy + 6, 15, 3); R(x, '#ffe9a0', cx + 4, cy - 11, 8, 1); }, // lighthouse
  (x, cx, cy) => { R(x, '#c8402e', cx - 9, cy - 3, 18, 8); R(x, '#f4ecd8', cx - 9, cy - 3, 18, 2); for (let i = 0; i < 4; i++) R(x, '#bfe6f6', cx - 7 + i * 4, cy, 3, 3); R(x, '#2a2733', cx - 7, cy + 5, 3, 2); R(x, '#2a2733', cx + 4, cy + 5, 3, 2); R(x, '#2a2733', cx, cy - 8, 1, 5); }, // the tram
  (x, cx, cy) => { R(x, '#e8a23a', cx - 1, cy - 12, 3, 18); R(x, '#e8a23a', cx - 1, cy - 12, 12, 2); R(x, '#2a2733', cx + 9, cy - 10, 1, 6); R(x, '#5a7ad8', cx + 7, cy - 4, 5, 4); R(x, '#3a6a8a', cx - 10, cy + 6, 22, 2); },                                  // a harbour crane
  (x, cx, cy) => { for (let a = 0; a < 16; a++) R(x, a % 2 ? '#e0608e' : '#f2c230', cx + Math.cos(a * .393) * 9 - 1, cy - 2 + Math.sin(a * .393) * 9 - 1, 2, 2); R(x, '#6a5a48', cx - 1, cy - 2, 2, 11); R(x, '#6a5a48', cx - 5, cy + 8, 10, 2); },             // the Bay Wheel
  (x, cx, cy, fixed) => { R(x, '#b9b4a8', cx - 9, cy + 3, 18, 4); R(x, fixed ? '#6ab8dc' : '#9a9488', cx - 8, cy + 2, 16, 2); R(x, '#b9b4a8', cx - 1, cy - 6, 3, 9); R(x, '#b9b4a8', cx - 4, cy - 3, 9, 2); if (fixed) { for (let j = 0; j < 7; j++) R(x, '#e8f6fb', cx, cy - 13 + j, 1, 1); for (const s of [-1, 1]) for (let j = 0; j < 5; j++) R(x, '#c8ecf8', cx + s * (2 + j), cy - 10 + j * j * .4, 1, 1); } else { R(x, '#4a78b0', cx - 3, cy - 11, 7, 6); } }, // the fountain
  (x, cx, cy) => { R(x, '#f4f0e8', cx - 10, cy - 2, 18, 4); R(x, '#f4f0e8', cx - 3, cy - 7, 4, 14); R(x, '#c8402e', cx - 12, cy - 5, 3, 5); R(x, '#5a7ad8', cx + 5, cy - 1, 2, 2); },                                                                              // the first flight
  (x, cx, cy) => { R(x, '#e8dcc4', cx - 9, cy - 2, 18, 9); R(x, '#b0563a', cx - 10, cy - 4, 20, 2); R(x, '#e8dcc4', cx - 2, cy - 12, 4, 8); R(x, '#5fa890', cx - 3, cy - 14, 6, 2); R(x, '#ffe9a0', cx - 1, cy - 9, 2, 2); for (let i = 0; i < 4; i++) R(x, '#7a5a3a', cx - 7 + i * 4, cy + 1, 2, 6); }, // this building
];
/** the dome from directly below: eight painted panels, gilded ribs, the oculus showing the sky of the hour */
export function domeView(fixed, hour) {
  const S = 184, c = mk(S, S), x = c.getContext('2d'), sky = skyOf(hour), C0 = S / 2;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const dx = i + .5 - C0, dy = j + .5 - C0, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); let col;
    if (r > 90) col = '#3a2a20'; else if (r > 86) col = (Math.floor(a * 16 + 100) & 1) ? '#c89a4a' : '#e8c06a'; else if (r > 82) col = '#8a5a34';
    else if (r > 26) { const k = ((a / (Math.PI / 4)) % 1 + 1) % 1, p = Math.floor((a + Math.PI) / (Math.PI / 4)) % 8; if (k < .035 || k > .965) col = '#d8a848'; else { const t = (r - 26) / 56, base = [['#f6e2a8', '#f0cc78'], ['#bfe6f6', '#9fd4f0'], ['#f6d8c0', '#f0bca0'], ['#cfe6c8', '#b4d6a8']][p % 4]; col = t > .86 ? (p % 2 ? '#3a8aa8' : '#4f9a45') : ((i + j) & 1 && hs(i >> 2, j >> 2) > .55 ? base[1] : base[0]); if (Math.abs(r - 58) < .7 && k > .1 && k < .9) col = '#e8d8b0'; } }
    else if (r > 22) col = '#d8a848'; else if (r > 20) col = '#8a5a34'; else col = r > 13 ? sky[1] : sky[0];
    x.fillStyle = col; x.fillRect(i, j, 1, 1); }
  for (let p = 0; p < 8; p++) { const a = -Math.PI + (p + .5) * Math.PI / 4; SCENES[p](x, Math.round(C0 + Math.cos(a) * 60), Math.round(C0 + Math.sin(a) * 60), fixed); }
  if (hour < 5.5 || hour >= 20.5) { for (let k = 0; k < 9; k++) R(x, '#fff4d0', C0 - 14 + hs(k, 3) * 28, C0 - 14 + hs(k, 9) * 28, 1, 1); R(x, '#f4f0d8', C0 + 5, C0 - 9, 4, 4); } else { R(x, '#ffffff', C0 - 9, C0 + 2, 9, 3); R(x, '#ffffff', C0 - 6, C0, 5, 2); if (hour > 7.5 && hour < 18) R(x, '#fff4a0', C0 + 5, C0 - 9, 5, 5); }
  return c;
}
/** City Hall Plaza seen from above and behind the balustrade. o: { fixed, hour, crowd (0..1), bunting (colour | null) } */
export function plazaView(o = {}) {
  const Wd = 240, Hd = 150, c = mk(Wd, Hd), x = c.getContext('2d'), h = o.hour === undefined ? 12 : o.hour, sky = skyOf(h), night = h < 5.5 || h >= 20.5, dusk = !night && (h < 7.5 || h >= 18), pave = night ? '#3a3e58' : dusk ? '#b89a88' : '#d8ccb4';
  R(x, sky[0], 0, 0, Wd, 14); R(x, sky[1], 0, 14, Wd, 14); R(x, sky[2], 0, 28, Wd, 12);
  for (let b = 0; b < 16; b++) { const bw = 10 + Math.floor(hs(b, 1) * 12), bh = 12 + Math.floor(hs(b, 2) * 26), bx = b * 15 + Math.floor(hs(b, 3) * 5); R(x, night ? '#1a2244' : dusk ? '#5a4a70' : ['#9aa4b8', '#b0a898', '#8a94a8'][b % 3], bx, 40 - bh, bw, bh); for (let wy = 42 - bh; wy < 38; wy += 4) for (let wx = bx + 2; wx < bx + bw - 2; wx += 3) if (hs(wx, wy) > (night ? .5 : .82)) R(x, night || dusk ? '#ffd98a' : '#cfe6f2', wx, wy, 2, 2); }
  for (let j = 40; j < Hd; j++) for (let i = 0; i < Wd; i++) { const t = (j - 40) / (Hd - 40), u = (i - Wd / 2) / (1 + t * 1.6), tile = (Math.floor(u / 9 + 100) + Math.floor(t * t * 14)) & 1; x.fillStyle = tile ? pave : (night ? '#343850' : dusk ? '#ac9080' : '#cfc2a8'); x.fillRect(i, j, 1, 1); }
  // planters, benches
  for (const [px, py] of [[46, 70], [194, 70], [34, 112], [206, 112]]) { R(x, '#c0623a', px - 6, py, 12, 5); R(x, '#4f9a45', px - 5, py - 5, 10, 6); R(x, '#62b356', px - 3, py - 7, 6, 3); }
  // fountain
  const fx = 120, fy = 92; x.fillStyle = '#a8a294'; x.beginPath(); x.ellipse(fx, fy, 46, 20, 0, 0, 7); x.fill(); x.fillStyle = '#b9b4a8'; x.beginPath(); x.ellipse(fx, fy - 2, 46, 20, 0, 0, 7); x.fill();
  x.fillStyle = o.fixed ? (night ? '#3a7aa8' : '#6ab8dc') : '#9a9488'; x.beginPath(); x.ellipse(fx, fy - 3, 40, 16, 0, 0, 7); x.fill();
  if (o.fixed) { for (let k = 0; k < 60; k++) R(x, '#d8f0f8', fx + Math.cos(k * .7) * (8 + (k % 5) * 6.5), fy - 3 + Math.sin(k * .7) * (3 + (k % 5) * 2.6), 2, 1); }
  else { for (let k = 0; k < 26; k++) R(x, ['#b8742a', '#8a5a2a', '#c89a3a'][k % 3], fx + (hs(k, 5) - .5) * 70, fy - 3 + (hs(k, 6) - .5) * 24, 2, 1); }
  R(x, '#b9b4a8', fx - 3, fy - 24, 6, 20); x.fillStyle = '#c4c0b4'; x.beginPath(); x.ellipse(fx, fy - 16, 16, 6, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(fx, fy - 27, 9, 3.5, 0, 0, 7); x.fill();
  if (o.fixed) { x.fillStyle = '#8fd0e8'; x.beginPath(); x.ellipse(fx, fy - 17, 14, 4.5, 0, 0, 7); x.fill(); for (let j = 0; j < 22; j++) { R(x, j % 3 ? '#e8f6fb' : '#ffffff', fx - 1 + (j % 2), fy - 30 - j, 2, 1); } for (const s of [-1, 1]) for (let k = 0; k < 4; k++) for (let j = 0; j < 14; j++) R(x, '#c8ecf8', fx + s * (3 + k * 3 + j * (.6 + k * .25)), fy - 44 + j * j * .16 + k * 3, 1, 1); for (let k = -14; k <= 14; k += 2) R(x, '#e8f6fb', fx + k, fy - 14, 1, 9); }
  else { x.fillStyle = '#4a78b0'; x.beginPath(); x.ellipse(fx, fy - 32, 12, 10, 0, 0, 7); x.fill(); R(x, '#d8c8a0', fx - 11, fy - 30, 22, 1); R(x, '#f2c230', fx - 44, fy + 6, 22, 10); R(x, '#2a2733', fx - 42, fy + 9, 18, 1); R(x, '#c8402e', fx - 40, fy + 12, 14, 1); for (let k = -40; k <= 40; k += 4) R(x, k % 8 ? '#f2c230' : '#2a2733', fx + k, fy + 15 - Math.abs(k) * .12, 3, 1); }
  // people
  const n = Math.round((o.crowd === undefined ? (night ? .15 : .6) : o.crowd) * 46); for (let k = 0; k < n; k++) { let px = 12 + hs(k, 11) * 216, py = 56 + hs(k, 12) * 78; if (o.gather) { const a = hs(k, 13) * Math.PI; px = fx + Math.cos(a) * (56 + hs(k, 14) * 30); py = fy + 14 + Math.sin(a) * (10 + hs(k, 15) * 22); } else if (Math.hypot((px - fx) / 48, (py - fy) / 22) < 1) continue; const s = py > 100 ? 2 : 1; R(x, ['#c8402e', '#3b6fd0', '#e8b63a', '#4fa860', '#8a5aa8', '#f4f0e8', '#2a2733'][k % 7], px, py, 2 + s, 3 + s); R(x, ['#e8b890', '#8a5a3a', '#f0c8a8', '#c88a60'][k % 4], px, py - 2 - s, 2 + s, 2 + s); }
  for (let k = 0; k < 7; k++) { const px = 60 + hs(k, 21) * 120, py = 104 + hs(k, 22) * 30; R(x, '#8a8f9a', px, py, 3, 2); R(x, '#6a7078', px + 2, py - 1, 1, 1); }
  if (o.bunting) for (let k = 0; k < 24; k++) R(x, k % 2 ? o.bunting : '#f4ecd8', 4 + k * 10, 44 + Math.sin(k / 23 * Math.PI) * 5, 5, 4);
  // balustrade
  R(x, '#cdbf9f', 0, Hd - 22, Wd, 4); R(x, '#e8dcc4', 0, Hd - 24, Wd, 3); for (let i = 4; i < Wd; i += 9) { R(x, '#e8dcc4', i, Hd - 18, 4, 14); R(x, '#cdbf9f', i + 3, Hd - 18, 1, 14); } R(x, '#cdbf9f', 0, Hd - 5, Wd, 5);
  return c;
}
/** drawing 62-F: section through the plaza fountain, valve V-7 marked */
export function blueprintView() {
  const c = mk(240, 150), x = c.getContext('2d'); R(x, '#2a4a8a', 0, 0, 240, 150); for (let i = 0; i < 240; i += 12) R(x, '#34569a', i, 0, 1, 150); for (let j = 0; j < 150; j += 12) R(x, '#34569a', 0, j, 240, 1);
  x.strokeStyle = '#e8f0ff'; x.lineWidth = 1; const L = (...p) => { x.beginPath(); x.moveTo(p[0] + .5, p[1] + .5); for (let i = 2; i < p.length; i += 2) x.lineTo(p[i] + .5, p[i + 1] + .5); x.stroke(); };
  L(30, 112, 190, 112); L(40, 112, 40, 100, 180, 100, 180, 112); L(46, 100, 46, 94, 174, 94, 174, 100); L(106, 94, 106, 60, 114, 60, 114, 94); L(84, 60, 136, 60, 132, 54, 88, 54, 84, 60); L(107, 54, 107, 34, 113, 34, 113, 54); L(96, 34, 124, 34, 121, 30, 99, 30, 96, 34); L(110, 30, 110, 18);
  L(110, 112, 110, 130, 200, 130); L(196, 124, 204, 124, 204, 136, 196, 136, 196, 124); x.setLineDash([2, 2]); L(110, 18, 96, 26); L(110, 18, 124, 26); L(40, 122, 180, 122); x.setLineDash([]);
  x.fillStyle = '#ffd060'; x.fillRect(197, 127, 6, 6); x.fillStyle = '#e8f0ff'; x.font = '8px monospace'; x.fillText('CITY PLAZA FOUNTAIN  DWG 62-F', 8, 12); x.fillText('SECTION A-A', 8, 22); x.fillText('SUPPLY 2 in.', 120, 142); x.fillStyle = '#ffd060'; x.fillText('VALVE V-7', 186, 118); x.fillText('SQUARE KEY 3/4', 152, 146);
  x.fillStyle = '#e8f0ff'; x.fillText('H. LATHROP 1962', 150, 12); return c;
}
/** one frame of the Bay Courier microfilm; blur 0..1 smears it sideways while the reel runs */
export function reelView(fr, blur = 0, idx = 0, of = 1) {
  const c = mk(240, 140), x = c.getContext('2d'); R(x, '#0c1410', 0, 0, 240, 140); R(x, blur > .05 ? '#9ac8a8' : '#cfe8d4', 14, 8, 212, 124);
  if (blur > .05) { for (let j = 12; j < 128; j += 3) { const w = 40 + hs(j, Math.floor(blur * 97)) * 150; R(x, '#5a7a66', 20 + hs(j, 4) * 30, j, w, 1 + (j % 9 === 0 ? 2 : 0)); } }
  else if (fr) { x.fillStyle = '#1c2a22'; x.font = 'bold 10px monospace'; x.fillText('THE BAY COURIER', 72, 22); R(x, '#1c2a22', 20, 26, 200, 1); x.font = '7px monospace'; x.fillText(fr.d.toUpperCase(), 22, 36); R(x, '#1c2a22', 20, 39, 200, 1);
    x.font = 'bold 9px monospace'; const words = fr.h.split(' '); let line = '', y = 52; for (const w of words) { if ((line + ' ' + w).length > 34) { x.fillText(line, 22, y); y += 11; line = w; } else line = line ? line + ' ' + w : w; } x.fillText(line, 22, y); y += 8;
    for (let col = 0; col < 3; col++) for (let j = y; j < 124; j += 4) R(x, '#4a6a56', 22 + col * 68, j, 40 + hs(j, col + fr.y) * 22, 1); R(x, '#7a9a86', 158, y + 2, 60, 30); R(x, '#4a6a56', 176, y + 10, 24, 20); R(x, '#4a6a56', 184, y + 6, 8, 6); }
  for (let i = 0; i < 12; i++) { R(x, '#0c1410', 6 + i * 20, 2, 8, 4); R(x, '#0c1410', 6 + i * 20, 134, 8, 4); } R(x, '#ffd060', 14 + (of > 1 ? idx / (of - 1) : 0) * 208, 136, 4, 3); return c;
}
/** an old map from the drawers */
export function mapView(kind) {
  const c = mk(220, 150), x = c.getContext('2d'); R(x, '#eadfc4', 0, 0, 220, 150); for (let k = 0; k < 400; k++) R(x, '#dccfae', hs(k, 1) * 220, hs(k, 2) * 150, 2, 1);
  x.fillStyle = '#9ac0d0'; x.beginPath(); x.moveTo(0, 150); x.lineTo(0, 118); x.quadraticCurveTo(60, 96, 120, 122); x.quadraticCurveTo(170, 140, 220, 110); x.lineTo(220, 150); x.fill(); R(x, '#9ac0d0', 70, 0, 3, 110);
  x.strokeStyle = '#6a5a48'; x.lineWidth = 1; const L = (a, b, d, e) => { x.beginPath(); x.moveTo(a + .5, b + .5); x.lineTo(d + .5, e + .5); x.stroke(); };
  if (kind === 'survey') { for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { x.strokeRect(92.5 + i * 18, 20.5 + j * 18, 14, 14); } x.fillStyle = '#6a5a48'; x.font = '8px monospace'; x.fillText('MUD', 130, 104); x.fillText('to the maples ->', 96, 14); R(x, '#8a6a4a', 100, 112, 26, 3); }
  else if (kind === 'tram') { x.strokeStyle = '#c8402e'; x.lineWidth = 2; x.beginPath(); x.ellipse(120, 62, 78, 40, 0, 0, 7); x.stroke(); for (const [a, b, t] of [[42, 62, 'OLD TOWN'], [120, 22, 'HILLCREST'], [198, 62, 'CENTRAL'], [120, 102, 'BOARDWALK']]) { R(x, '#2a2733', a - 2, b - 2, 5, 5); x.fillStyle = '#2a2733'; x.font = '7px monospace'; x.fillText(t, a - 18, b - 5); } x.fillStyle = '#6a5a48'; x.font = '6px monospace'; x.fillText('clock 4 min fast. do NOT tell the public', 30, 142); }
  else { x.strokeRect(40.5, 20.5, 140, 84); x.beginPath(); x.ellipse(110, 62, 30, 16, 0, 0, 7); x.stroke(); x.beginPath(); x.ellipse(110, 62, 8, 4, 0, 0, 7); x.stroke(); for (const [a, b] of [[56, 34], [164, 34], [56, 90], [164, 90]]) { x.beginPath(); x.ellipse(a, b, 6, 4, 0, 0, 7); x.stroke(); } L(110, 62, 176, 100); x.fillStyle = '#c8402e'; x.font = 'bold 9px monospace'; x.fillText('62-F', 184, 16); x.fillStyle = '#6a5a48'; x.font = '7px monospace'; x.fillText('CITY PLAZA 1962', 44, 14); x.fillText('V-7', 178, 108); }
  x.strokeStyle = '#8a7a60'; x.strokeRect(3.5, 3.5, 213, 143); return c;
}
/** the Resident Card: sprite = { c: canvas } of the holder (or null) */
export function idCard(sprite, name, no, year) {
  const c = mk(200, 120), x = c.getContext('2d'); R(x, '#2f6f5f', 0, 0, 200, 120); R(x, '#f4ecd8', 4, 22, 192, 94); R(x, '#e8dcc4', 4, 22, 192, 3); x.fillStyle = '#f4ecd8'; x.font = 'bold 10px monospace'; x.fillText('CITY OF MAPLE BAY', 8, 15); x.fillStyle = '#ffd060'; x.font = '7px monospace'; x.fillText('RESIDENT', 150, 15);
  R(x, '#bfd8e6', 12, 32, 60, 72); x.strokeStyle = '#2a2733'; x.strokeRect(11.5, 31.5, 61, 73);
  if (sprite && sprite.c) { try { x.imageSmoothingEnabled = false; const s = sprite.c, k = Math.min(3, Math.floor(70 / s.height * 2) / 2 || 2); x.drawImage(s, 0, 0, s.width, Math.min(s.height, 22), 42 - s.width * k / 2, 36, s.width * k, Math.min(s.height, 22) * k); } catch (e) { } }
  x.fillStyle = '#2a2733'; x.font = 'bold 10px monospace'; x.fillText(String(name || 'RESIDENT').toUpperCase().slice(0, 16), 82, 46); x.font = '8px monospace'; x.fillText('No. MB-' + String(no).padStart(5, '0'), 82, 62); x.fillText('ISSUED ' + year, 82, 76); x.fillText('WINDOW 2', 82, 90);
  x.fillStyle = '#c8402e'; for (const [a, b] of [[0, -7], [-5, -3], [5, -3], [-3, 2], [3, 2], [0, -2]]) x.fillRect(172 + a - 3, 92 + b - 3, 6, 6); x.fillRect(171, 96, 2, 8); x.strokeStyle = '#c89a4a'; x.beginPath(); x.arc(172.5, 92.5, 14, 0, 7); x.stroke(); return c;
}
