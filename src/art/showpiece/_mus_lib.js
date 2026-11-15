// Shared helpers for the Museum of Maple Bay art (museum*.js) + the picture library used by the room / sim (the "look closer" window, sketches, old photographs).
// Pictures are resolution-free functions f(x, y) -> '#rrggbb' with x, y in [0, 1) (y down), so the same painting can hang on a wall at 24 px and fill a window at 120 px.
//   PAINTINGS [{ id, t (title), by, yr, note, asp (w / h), f }]   PHOTOS [{ id, t, note, asp, f }] (sepia)   pic(id) -> entry   pencil(f, skill 0..1) -> f (a visitor's sketch)
//   hang(id, x0, x1, y, z0, z1, frame?) paints a framed picture on a +y face (flip-safe)     strokes(y, segs, c) thick outlined "bone" lines in a vertical plane
import * as R from '../../engine/raster.js';
const { PW, px, C, dk, lt, mix, hash2, qy, lw, isFlipped } = R;

export const STONE = '#e6dfcc', STONE_D = '#b9b09a', MARBLE = '#efe9dc', BONE = '#eadfc4', BONE_D = '#7a6850', BRASS = '#d8a848', BRONZE = '#8a6a48', WOOD = '#8a5a3a', WOOD_D = '#5e3c28', NAVY = '#2c3a5e', TEAL = '#2f7f86', GLASS = '#bfe4ec', RED = '#b8402f', VELVET = '#8a2f3a', GOLD = '#e8c06a', INK = '#2a2733';
export const SEASON_C = [['#3f8fd0', '#f4f0e0', '#e8483b'], ['#1f5f8a', '#9fe0e8', '#f08a2a'], ['#c8402f', '#f2c230', '#2f7f86'], ['#5a7ab8', '#e8f4fb', '#8fd6c0']];
export const SEASON_NAME = ['WINGS', 'DEEP BLUE', 'TIN TOYS', 'ICE AGE'];
export const S2 = (x, y, z) => { const s = PW(x, y, z); return [Math.round(s[0]), Math.round(s[1])]; };
export const dot = (x, y, z, c, dx = 0, dy = 0) => { const s = S2(x, y, z); px(s[0] + (isFlipped() ? -dx : dx), s[1] + dy, C(c)); };
export const blob = (x, y, z, rx, ry, c, c2) => { const s = PW(x, y, z); R.ellipse(s[0], s[1], rx, ry, c, c2); };
/** thick lines in the vertical plane y = const. segs: [[x0, z0, x1, z1, r(px)], ...]; drawn outline first, so joints merge */
export function strokes(y, segs, c = BONE, oc = BONE_D) {
  const run = (grow, col, hi) => { const cc = C(col), ch = hi ? C(hi) : 0; for (const [x0, z0, x1, z1, r] of segs) { const a = PW(x0, y, z0), b = PW(x1, y, z1), n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]))), rr = (r || 1) + grow; for (let i = 0; i <= n; i++) { const X = a[0] + (b[0] - a[0]) * i / n, Y = a[1] + (b[1] - a[1]) * i / n; for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) if (dx * dx + dy * dy <= rr * rr + .5) px(X + dx, Y + dy, hi && dy < 0 && dy <= -rr + .5 ? ch : cc); } } };
  run(1, oc); run(0, c, lt(c, .35));
}

/* ---------- pictures ---------- */
const cir = (x, y, cx, cy, r, k = 1) => (x - cx) * (x - cx) + (y - cy) * (y - cy) * k < r * r;
const rc = (x, y, x0, y0, x1, y1) => x >= x0 && x < x1 && y >= y0 && y < y1;
const tri = (x, y, cx, top, base, hw) => y >= top && y < base && Math.abs(x - cx) < hw * (y - top) / (base - top);
const n = (x, y, s = 48, sd = 0) => hash2(Math.floor(x * s), Math.floor(y * s), sd);
const od = (x, y, s = 48) => (Math.floor(x * s) + Math.floor(y * s)) & 1;
const grad = (t, cols, x, y) => { const k = Math.max(0, Math.min(.9999, t)) * (cols.length - 1), i = Math.floor(k), f = k - i; return f > .7 || (f > .3 && od(x, y)) ? cols[i + 1] : cols[i]; };
const P = (id, t, by, yr, asp, note, f) => ({ id, t, by, yr, asp, note, f });

export const PAINTINGS = [
  P('dawn', 'Harbour at Dawn', 'Elspeth Marrow', 1907, 1.6, 'The picture the museum was built around. Marrow painted it from the end of the fish pier in a single cold morning, and never managed it again.', (x, y) => {
    if (rc(x, y, .2, .22, .215, .6) || rc(x, y, .44, .3, .452, .6)) return '#3a2c34'; if (tri(x, y, .262, .26, .56, .09) && x > .215) return '#f4e6c8'; if (tri(x, y, .4, .34, .56, .07) && x < .44) return '#e8c8a0';
    if (rc(x, y, .14, .57, .33, .64) || rc(x, y, .37, .57, .5, .63)) return y > .6 ? '#4a2c2c' : '#8a3a30'; if (rc(x, y, 0, .7, .16, 1) || (rc(x, y, 0, .66, .24, .7))) return od(x, y, 30) ? '#3a2c34' : '#4a3a3c';
    if (y < .5) { if (cir(x, y, .7, .43, .06, 1.5)) return '#fff4c8'; if (cir(x, y, .7, .43, .12, 1.5)) return od(x, y) ? '#ffd98a' : '#f8b878'; return grad(y / .5, ['#4a5a9a', '#8a6aa0', '#d8808a', '#f6b478', '#fbd28a'], x, y); }
    if (Math.abs(x - .7) < .05 + (y - .5) * .12 && n(x * .3, y, 60, 3) > .45) return '#ffe4a0'; return grad((y - .5) / .5, ['#e8a888', '#8a7aa8', '#4a5a8a', '#34406a'], x, y); }),
  P('cannery', 'The Cannery, Low Tide', 'Elspeth Marrow', 1911, 1.6, 'Three red sheds on stilts and a mudflat the colour of tea. The cannery whistle could be heard in Hillcrest.', (x, y) => {
    for (const [cx, w, h] of [[.22, .13, .24], [.5, .17, .3], [.8, .12, .2]]) { if (tri(x, y, cx, .56 - h - .1, .56 - h, w + .02)) return '#4a3038'; if (rc(x, y, cx - w, .56 - h, cx + w, .56)) return rc(x, y, cx - .02, .56 - h * .6, cx + .02, .56 - h * .25) ? '#f4d890' : (Math.floor(x * 80) % 4 === 0 ? '#8a2c28' : '#b8402f'); if (rc(x, y, cx - w, .56, cx + w, .66) && Math.floor(x * 50) % 4 === 0) return '#3a2c34'; }
    if (rc(x, y, .58, .12, .62, .3)) return '#6a4a44'; if (cir(x, y, .64, .09, .05) || cir(x, y, .7, .06, .04)) return '#d8d4d0';
    if (y < .6) return (n(x, y, 20, 2) > .97 && y < .4) ? '#ffffff' : grad(y / .6, ['#9ab4c8', '#c8d4d8', '#e8dcc8'], x, y);
    return n(x, y * 3, 40, 5) > .8 && y < .82 ? '#a85a48' : grad((y - .6) / .4, ['#8a7860', '#a08a68', '#6a5a4a'], x, y); }),
  P('maple7', 'Maple No. 7', 'Tomas Okonkwo-Reyes', 1964, 1, 'One leaf, seven feet across in the original. The artist said he was not painting a leaf, he was painting October.', (x, y) => {
    const dx = x - .5, dy = y - .47, a = Math.atan2(dx, -dy), r = Math.hypot(dx, dy), lobe = .2 + .2 * Math.pow(Math.abs(Math.cos(a * 2.5)), 1.6) - (Math.abs(a) > 2.6 ? .1 : 0);
    if (rc(x, y, .49, .6, .515, .92)) return '#7a2a20'; if (r < lobe * .55) return od(x, y) ? '#f08a2a' : '#e8483b'; if (r < lobe) return Math.abs(Math.sin(a * 5)) < .12 ? '#8a2018' : '#c8342a';
    return n(x, y, 32, 1) > .93 ? '#e8dcc0' : '#f4ecd8'; }),
  P('planes', 'Three Planes of Afternoon', 'Ilse Varga', 1958, 1, 'Varga worked in the old ferry office and painted only what the light did to its walls between two and five.', (x, y) => {
    if (cir(x, y, .68, .3, .13)) return '#2c3a5e'; const v = x * .55 + y, k = Math.floor(v * 3.2); if (Math.abs(v * 3.2 - k) < .03) return '#f4ecd8';
    return ['#2f7f86', '#e8b83a', '#c8553a', '#f4ecd8', '#8a9a6a'][k % 5]; }),
  P('tram', 'Night Tram', 'Dov Halloran', 1949, 1.6, 'The last Number 4 of the night crossing Maple Avenue in the rain. Halloran drove it for eleven years before he painted it.', (x, y) => {
    if (rc(x, y, .22, .36, .8, .64)) { if (rc(x, y, .25, .41, .77, .52) && Math.floor(x * 30) % 3 !== 0) return n(x, y, 14, 4) > .7 ? '#3a2c34' : '#ffe08a'; if (y > .58) return '#7a2a24'; return '#c8402f'; }
    if (rc(x, y, .3, .64, .36, .7) || rc(x, y, .66, .64, .72, .7)) return '#1a1a24'; if (rc(x, y, .5, .22, .505, .36)) return '#1a1a24';
    if (cir(x, y, .83, .55, .03)) return '#fff8d0'; if (x > .83 && Math.abs(y - .56) < (x - .83) * .5) return od(x, y) ? '#f4d880' : '#3a4270';
    if (cir(x, y, .1, .2, .03) || cir(x, y, .93, .16, .025)) return '#ffe9a0'; if (cir(x, y, .1, .2, .07) || cir(x, y, .93, .16, .06)) return od(x, y) ? '#5a5a80' : '#2a3058';
    if (y > .7) return Math.abs(x - .5) < .28 && n(x, y * .3, 50, 2) > .6 ? (y < .85 ? '#f4c860' : '#a84a40') : (od(x, y, 30) ? '#232848' : '#1c2040');
    return Math.floor(x * 90 + y * 30) % 9 === 0 && n(x, y, 30, 7) > .5 ? '#5a6a98' : (y < .3 ? '#1a1e3c' : '#2a3058'); }),
  P('bright', 'Mrs. Adaeze Bright, Fishmonger', 'Cornelius Pike', 1926, .75, 'She ran the corner stall at the fish market for forty years. The sea bass was, she insisted, also a good likeness.', (x, y) => {
    if (cir(x, y, .5, .3, .15, .8)) { if (rc(x, y, .42, .29, .46, .31) || rc(x, y, .54, .29, .58, .31)) return '#2a1c18'; if (rc(x, y, .45, .38, .55, .395)) return '#8a3a34'; return x > .56 ? '#7a4a30' : '#9a6240'; }
    if (cir(x, y, .5, .22, .19, .9) && y < .27) return '#c8402f'; if (rc(x, y, .44, .42, .56, .5)) return '#8a5638';
    if (cir(x, y, .5, .78, .17, 4) && y > .66) return x > .74 ? '#5a6a78' : (od(x, y, 40) ? '#c8d4dc' : '#9ab0bc'); if (tri(x, y, .28, .7, .86, .06)) return '#9ab0bc';
    if (y > .46 && Math.abs(x - .5) < .2 + (y - .46) * .45) return Math.abs(x - .5) < .13 ? '#f4ecd8' : '#34506a';
    return grad(y, ['#2f7f86', '#256a70', '#1f5a60'], x, y); }),
  P('storm', 'Lighthouse, Force Nine', 'Dov Halloran', 1953, .75, 'Painted from memory. Nobody stood on that rock with an easel.', (x, y) => {
    const tw = .05 + (y - .2) * .05; if (rc(x, y, .44, .14, .56, .2)) return rc(x, y, .47, .15, .53, .19) ? '#fff4b0' : '#3a3440'; if (y >= .2 && y < .74 && Math.abs(x - .5) < tw) return Math.floor(y * 9) % 2 ? '#c8402f' : '#f0ece0';
    if (y < .22 && y > .1 && Math.abs(y - .17) < Math.abs(x - .5) * .22 + .008 && Math.abs(x - .5) > .06) return od(x, y) ? '#f4e8a0' : '#6a6a80';
    const wv = .7 + .05 * Math.sin(x * 14) + .03 * Math.sin(x * 31 + 2); if (y > wv) return y < wv + .03 ? '#f0f4f4' : (n(x, y, 40, 3) > .9 ? '#c8d8dc' : grad((y - .7) / .3, ['#3a5a6a', '#243a4c', '#1a2838'], x, y));
    if (y > .66 && Math.abs(x - .5) < .22 - (.74 - y) * 1.6) return '#2a2630';
    return Math.floor(x * 50 + y * 70) % 11 === 0 ? '#8a94a8' : grad(y / .7, ['#2a2e44', '#4a5068', '#6a7088'], x, y); }),
  P('pears', 'Three Pears', 'Ilse Varga', 1961, 1, 'Bought at the Old Town market for nine cents and eaten the moment the paint was dry.', (x, y) => {
    for (const [cx, c] of [[.27, '#c8c048'], [.5, '#a8b840'], [.73, '#d8b040']]) { if (rc(x, y, cx - .008, .3, cx + .008, .4)) return '#5a3a20'; if (cir(x, y, cx, .62, .12) || cir(x, y, cx, .46, .07)) return x > cx + .04 ? dk(c, .3) : cir(x, y, cx - .04, .56, .03) ? lt(c, .5) : c; }
    if (y > .7) return cir(x, y, .5, .76, .42, 9) ? '#3a2a2c' : (y > .9 ? '#4a3430' : '#6a4a3a'); return n(x, y, 24, 4) > .9 ? '#c8a050' : '#d8ac58'; }),
  P('rain', 'Rain on Maple Avenue', 'Suki Lindqvist', 1978, .75, 'Three umbrellas and the 5:15 crowd. Lindqvist said the yellow one was hers.', (x, y) => {
    for (const [cx, cy, c] of [[.28, .5, '#c8402f'], [.55, .58, '#e8b83a'], [.8, .47, '#3a6ab0']]) { if (cir(x, y, cx, cy, .14) && y < cy) return Math.abs(Math.sin((x - cx) * 30)) < .15 ? dk(c, .3) : c; if (rc(x, y, cx - .006, cy, cx + .006, cy + .1)) return '#2a2733'; if (y > cy + .06 && y < cy + .34 && Math.abs(x - cx) < .06) return '#2a2e44'; }
    if ((x < .12 || x > .9) && y > .2 && y < .6 && Math.floor(y * 14) % 2) return '#f4c860';
    if (y > .86) return n(x, y * .2, 40, 2) > .7 ? '#8a8aa8' : '#4a4a68'; return Math.floor(x * 60) % 5 === 0 && n(x, y, 12, 9) > .35 ? '#a8b0c8' : grad(y, ['#5a5a7a', '#6a6a8a', '#7a7898'], x, y); }),
  P('wheel', 'The Wheel at Dusk', 'Suki Lindqvist', 1981, 1, 'The fun pier wheel, lit for the first night of the season.', (x, y) => {
    const dx = x - .5, dy = y - .46, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (y > .86) return y > .9 ? '#2a2440' : '#4a3a4a';
    if (r < .34 && r > .3 && Math.abs(((a / .5236) % 1 + 1) % 1 - .5) > .38) return '#fff0a0'; if (Math.abs(r - .32) < .014) return '#3a2c44'; if (r < .32 && Math.abs(Math.sin(a * 6)) < .05 / Math.max(.05, r * 3)) return '#3a2c44'; if (r < .035) return '#e8483b';
    if (tri(x, y, .5, .46, .88, .14) && !tri(x, y, .5, .52, .88, .11)) return '#3a2c44';
    return grad(y / .86, ['#3a3a78', '#7a4a8a', '#d8687a', '#f8a868', '#fbd088'], x, y); }),
  P('koi', 'Koi', 'Hana Whitfield', 1992, 1, 'Two fish, one circle. Whitfield painted the conservatory pond every week for a year; this is week thirty-one.', (x, y) => {
    const dx = x - .5, dy = y - .5, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    for (const s of [0, Math.PI]) { const t = ((a + s + 9.42) % 6.283), w = .085 * Math.sin(Math.min(1, t / 2.6) * Math.PI); if (t < 2.6 && Math.abs(r - .25) < w) return s ? (n(x, y, 10, 3) > .55 ? '#e8483b' : '#f8f0e0') : (n(x, y, 10, 5) > .6 ? '#f8f0e0' : '#f08a2a'); }
    if (Math.abs(r - .42) < .008 || Math.abs(r - .1) < .006) return '#5aa0a0'; return n(x, y, 30, 2) > .95 ? '#3a8a88' : '#1f5a60'; }),
  P('roofs', 'Winter Rooftops', 'Cornelius Pike', 1934, 1.6, 'Old Town from the library window, the morning after the big snow.', (x, y) => {
    for (let k = 3; k >= 0; k--) { const by = .42 + k * .16, u = x * (4 + k) + k * .37, cx = (Math.floor(u) + .5) / (4 + k) - k * .37 / (4 + k), hw = .45 / (4 + k), col = ['#b8563a', '#d8b070', '#7a8aa8', '#c8785a', '#8a6a5a'][(Math.floor(u) + k * 2) % 5];
      if (y > by - .1 && y < by && rc(x, y, cx + hw * .4, by - .16, cx + hw * .62, by)) return '#6a4a44'; if (tri(x, y, cx, by - .11, by, hw * 1.15)) return y < by - .03 ? '#f8fbfc' : '#d8e0e8'; if (y >= by && y < by + .16) return rc(x, y, cx - hw * .3, by + .04, cx + hw * .1, by + .1) ? '#f8d070' : col; }
    return n(x, y, 30, 4) > .96 ? '#ffffff' : grad(y / .4, ['#b8c4d8', '#d8dce4', '#f0e8e0'], x, y); }),
  P('field', 'Late Summer, Hillcrest', 'Tomas Okonkwo-Reyes', 1959, 1.6, 'Before the terraces were built, the hill was barley and one red barn.', (x, y) => {
    for (const cx of [.12, .2, .86]) if (cir(x, y, cx, .36, .045, .22)) return x > cx ? '#2a5a3a' : '#3a7a48'; if (rc(x, y, .56, .36, .7, .5)) return rc(x, y, .61, .42, .65, .5) ? '#4a2a24' : '#b8402f'; if (tri(x, y, .63, .28, .36, .09)) return '#5a3a38';
    if (y < .3) return cir(x, y, .3, .14, .1, 6) || cir(x, y, .72, .1, .08, 7) ? '#f8f4ec' : grad(y / .3, ['#6aa0d8', '#9ac4e8'], x, y); if (y < .36 + .04 * Math.sin(x * 7)) return '#6a9a8a';
    return Math.floor((x + y * 1.5) * 26) % 3 === 0 ? '#c89830' : grad((y - .4) / .6, ['#e8c850', '#d8b040', '#b89030'], x, y); }),
  P('conductor', 'The Conductor', 'Suki Lindqvist', 1986, .75, 'Painted from the third row of Symphony Hall with a sketchbook hidden in a programme.', (x, y) => {
    if (cir(x, y, .5, .2, .075)) return y < .17 ? '#3a2c28' : '#e8b890'; if (Math.abs((x - .5) * 1.4 + (y - .3)) < .012 && x > .62 && y < .26) return '#fff8e0';
    if (Math.abs(Math.abs(x - .5) - (.1 + (.42 - y) * .9)) < .035 && y > .16 && y < .44) return '#1a1e30'; if (y > .28 && Math.abs(x - .5) < .14 + (y - .28) * .16) return Math.abs(x - .5) < .035 && y < .56 ? '#f4f0e8' : '#1a1e30';
    if (cir(x, y, .5, .4, .4)) return od(x, y) && !cir(x, y, .5, .4, .3) ? '#3a2a20' : '#c89038'; return '#241a1c'; }),
  P('orbit', 'Orbit II', 'Ilse Varga', 1967, 1, 'Varga\'s only round painting on a square canvas. She called it "the argument".', (x, y) => {
    if (cir(x, y, .7, .28, .03)) return '#2a2733'; if (Math.abs((x - .7) + (y - .28)) < .006 && x < .7) return '#2a2733'; if (cir(x, y, .44, .56, .12)) return '#e8b83a'; if (cir(x, y, .4, .52, .24)) return '#e86a5a'; if (cir(x, y, .48, .5, .37)) return '#2c3a5e';
    return n(x, y, 28, 6) > .94 ? '#e8dcc0' : '#f4ecd8'; }),
  P('tide', 'Tide Lines', 'Hana Whitfield', 1995, 1.6, 'Every stripe is a real tide mark, measured on the harbour wall over one June.', (x, y) => { const v = (y + .035 * Math.sin(x * 11 + y * 9) + .012 * Math.sin(x * 37)) * 11, k = Math.floor(v); return v - k < .12 ? '#f4f0e4' : ['#1f4a6a', '#2f6f8a', '#4a94a8', '#7ab8c0', '#a8d4d0', '#d8e4c8', '#e8d8a8', '#d8bc88', '#c8a070', '#b88a60', '#a87858'][k % 11]; }),
  P('viaduct', 'Under the Viaduct', 'Cornelius Pike', 1931, 1.6, 'The railway arches the year they opened, with the first freight train on top and washing hung beneath.', (x, y) => {
    if (rc(x, y, .1, .1, .46, .19)) return rc(x, y, .12, .12, .44, .16) && Math.floor(x * 40) % 3 ? '#f4d890' : '#8a2a24'; if (rc(x, y, .46, .07, .56, .19)) return '#2a2733'; if (cir(x, y, .6, .04, .04) || cir(x, y, .68, .02, .05)) return '#e8e4e0';
    const u = (x * 4) % 1, arch = cir(u, y, .5, .62, .36, .55) || (y > .62 && Math.abs(u - .5) < .36);
    if (y > .19 && !arch) return y < .24 ? '#5a4a48' : (Math.floor(y * 40) % 3 === 0 || Math.floor(x * 60 + Math.floor(y * 13) * 1.5) % 5 === 0 ? '#7a5a4a' : '#a87a5a');
    if (arch && y > .4 && y < .44 && Math.floor(x * 30) % 4 < 3) return ['#f4f0e8', '#c8402f', '#3a6ab0'][Math.floor(x * 30) % 3]; if (y > .88) return '#6a5a50';
    return y > .19 ? grad((y - .3) / .6, ['#f8d8a0', '#e8b888', '#b89a8a'], x, y) : grad(y / .2, ['#8ab0d0', '#c8d8e0'], x, y); }),
  P('cat', 'Cat on a Windowsill', 'Hana Whitfield', 1989, 1, 'The bookshop cat, Biscuit, who sat for the portrait and then on it.', (x, y) => {
    if (x < .14 || x > .86 || y < .1) return x < .2 && y > .1 ? (Math.floor(x * 50) % 3 ? '#a8343a' : '#8a2830') : '#e8dcc0'; if (y > .8) return y < .84 ? '#f4ecd8' : '#b89a78';
    if (cir(x, y, .5, .66, .17, .7) || cir(x, y, .56, .44, .09) || tri(x, y, .5, .3, .4, .045) || tri(x, y, .62, .3, .4, .045)) return (cir(x, y, .53, .43, .014) || cir(x, y, .6, .43, .014)) ? '#e8d040' : '#1a1820';
    if (Math.abs(Math.hypot(x - .3, y - .68) - .1) < .02 && y > .64 && x < .36) return '#1a1820'; if (Math.abs(x - .5) < .012 || Math.abs(y - .45) < .012) return '#e8dcc0';
    if (cir(x, y, .72, .25, .07)) return cir(x, y, .75, .23, .06) ? '#2a3868' : '#fff4c8'; return n(x, y, 30, 3) > .97 ? '#f4f0d0' : grad((y - .1) / .7, ['#1c2850', '#2a3868', '#3a4a80'], x, y); }),
  P('six', 'Airport, 6 a.m.', 'Marisol Etxeberria', 2004, 1.6, 'The first departure of the day seen from the Runway Viewpoint, a few steps from where you are standing.', (x, y) => {
    if (y > .3 && y < .78 && x > .18 + (.78 - y) * .5 && x < .5 + (.78 - y) * .1) return cir(x, y, .43, .5, .05) ? '#f4f0e8' : '#c8342a'; if (rc(x, y, .1, .7, .95, .8)) return y > .77 ? '#8a94a0' : '#f0f0ec';
    if (rc(x, y, .8, .34, .83, .7) || rc(x, y, .77, .3, .86, .36)) return rc(x, y, .78, .31, .85, .34) ? '#a8e0e8' : '#3a3a50'; if (y > .8) return y > .9 && Math.floor(x * 40) % 5 === 0 ? '#ffe9a0' : (y > .86 ? '#3a3e50' : '#5a6a58');
    return grad(y / .8, ['#5a6ab0', '#a888b8', '#f0a0a0', '#fbd0a0', '#fbe8c0'], x, y); }),
  P('diner', 'Self-Portrait in a Diner Window', 'Marisol Etxeberria', 2011, 1.6, 'Dot\'s Diner at 2 a.m. The artist is the reflection holding the coffee.', (x, y) => {
    if (rc(x, y, .1, .14, .6, .22)) return rc(x, y, .14, .16, .56, .2) && Math.floor(x * 50) % 5 ? '#f86aa0' : '#3a1a30';
    if (rc(x, y, .08, .26, .92, .76)) { if (Math.abs(x - .5) < .008) return '#2a2733'; if (cir(x, y, .3, .46, .05) || (y > .5 && y < .7 && Math.abs(x - .3) < .07)) return '#3a2c34'; if (rc(x, y, .12, .62, .88, .66)) return '#c8402f'; if (cir(x, y, .7, .5, .06) || (y > .55 && Math.abs(x - .7) < .08)) return od(x, y) ? '#f4d890' : '#5a5a80'; if (cir(x, y, .2, .32, .025) || cir(x, y, .5, .32, .025) || cir(x, y, .8, .32, .025)) return '#fff8d8'; return y > .66 ? '#d8a850' : '#f4d080'; }
    return y > .8 ? (n(x, y * .3, 40, 2) > .75 ? '#5a3a58' : '#221c30') : '#1a1626'; }),
  P('fog', 'Hillcrest in Fog', 'Tomas Okonkwo-Reyes', 1971, 1.6, 'Five ridges, each a little less sure of itself than the last.', (x, y) => {
    if (cir(x, y, .7, .22, .07, 2)) return '#fff8e0'; for (let i = 4; i >= 0; i--) { const b = .3 + (4 - i) * .13 + .05 * Math.sin(x * (5 + i * 2) + i * 1.7) + .02 * Math.sin(x * 23 + i); if (y > b && (i === 0 || y < b + .16)) return mix('#2f5a58', '#d8e0dc', i / 5); }
    return grad(y / .5, ['#c8d0d4', '#e0e4e0', '#f0ece0'], x, y); }),
  P('dancers', 'Three Dancers', 'Ilse Varga', 1955, 1.6, 'The Lantern Playhouse chorus, drawn in the wings on the back of a call sheet and painted that night.', (x, y) => {
    for (const [cx, c, t] of [[.25, '#f4f0e8', .1], [.5, '#3a6ab0', -.08], [.75, '#e8b83a', .06]]) { const xx = x - cx - (y - .5) * t; if (cir(xx + cx, y, cx, .24, .05)) return '#6a3a28'; if (y > .28 && y < .8 && Math.abs(xx) < .03 + (y - .28) * .22) return c; if (y > .8 && y < .92 && Math.abs(Math.abs(xx) - .04) < .012) return '#6a3a28'; if (y > .14 && y < .36 && Math.abs(Math.abs(xx) - (.36 - y) * .5 - .03) < .012) return '#6a3a28'; }
    return y > .9 ? '#7a3a28' : (n(x, y, 26, 8) > .92 ? '#c8684a' : '#d8765a'); }),
  P('market', 'Market Square, Saturday', 'Marisol Etxeberria', 2008, 1.6, 'Eight stalls, one fountain and everybody you know.', (x, y) => {
    for (const [by, s] of [[.28, 5], [.56, 4]]) { const k = Math.floor(x * s), u = x * s - k, col = ['#c8402f', '#3a6ab0', '#e8b83a', '#3a8a58', '#8a5aa8'][(k + (s === 4 ? 2 : 0)) % 5]; if (u > .08 && u < .92) { if (y > by - .1 && y < by) return Math.floor(u * 9) % 2 ? col : '#f4f0e8'; if (y >= by && y < by + .1) return Math.abs(u - .5) < .3 ? ['#f08a2a', '#c8d848', '#e8483b'][Math.floor(u * 12) % 3] : '#6a4a3a'; } }
    if (cir(x, y, .5, .86, .08, 3)) return '#7ab8d0'; if (n(x, y, 22, 5) > .86 && y > .4) return ['#2a2e44', '#c8402f', '#f4f0e8', '#3a6ab0'][Math.floor(n(x, y, 22, 9) * 4)]; if (y < .16) return '#9ac4e8';
    return od(x, y, 20) ? '#c8b89a' : '#bca888'; }),
  P('moon', 'Moon over the Bay', 'Dov Halloran', 1957, .75, 'Halloran\'s last painting. The single lit window is the lighthouse keeper\'s kitchen.', (x, y) => {
    if (cir(x, y, .55, .26, .15)) return cir(x, y, .5, .22, .03) || cir(x, y, .6, .3, .04) || cir(x, y, .53, .33, .02) ? '#d8cca0' : '#f8f0c8'; if (cir(x, y, .55, .26, .2)) return od(x, y) ? '#3a4a80' : '#2a3868';
    if (y > .6 && x < .34 - (y - .6) * .1 && y < .7 + x * .4) return rc(x, y, .12, .64, .15, .67) ? '#ffd870' : '#12141f'; if (y > .62) return Math.abs(x - .55) < .1 && Math.floor(y * 40) % 3 === 0 && n(x, y, 30, 4) > .3 ? '#f8f0c8' : grad((y - .62) / .38, ['#1c2850', '#141c3a'], x, y);
    return n(x, y, 36, 2) > .975 ? '#f8f4e0' : grad(y / .62, ['#141a36', '#1c2850', '#2a3868'], x, y); }),
];
const BY = new Map(PAINTINGS.map(p => [p.id, p]));
const lum = h => { const v = parseInt(h.slice(1, 7), 16); return ((v >> 16) * .3 + (v >> 8 & 255) * .59 + (v & 255) * .11) / 255; };
const SEP = ['#3a2a1c', '#5e4630', '#8a6c4a', '#b89a70', '#dcc49a', '#f0e2c0'];
const sepia = f => (x, y) => { if (x < .04 || x > .96 || y < .05 || y > .95) return '#f0e6cc'; const l = lum(f(x, y)) * .92 + (n(x, y, 40, 11) - .5) * .1; return SEP[Math.max(0, Math.min(5, Math.floor(l * 6)))]; };
const crew = (x, y) => { for (let i = 0; i < 6; i++) { const cx = .14 + i * .145, t = i % 2 ? .3 : .36; if (cir(x, y, cx, t, .045)) return '#d8c0a0'; if (rc(x, y, cx - .05, t - .07, cx + .05, t - .035)) return '#3a2c28'; if (y > t + .04 && y < .86 && Math.abs(x - cx) < .06) return i % 3 ? '#4a4048' : '#e8e0d0'; } if (y > .86) return '#6a5a4a'; return y < .5 ? (Math.floor(x * 30) % 4 ? '#b8a890' : '#8a7a68') : '#9a8a78'; };
const biplane = (x, y) => { if (rc(x, y, .2, .36, .8, .4) || rc(x, y, .24, .52, .76, .56)) return '#f0e8d8'; if (rc(x, y, .3, .4, .31, .52) || rc(x, y, .69, .4, .7, .52) || rc(x, y, .44, .4, .45, .52)) return '#3a2c28'; if (cir(x, y, .5, .5, .07, .5) || rc(x, y, .5, .47, .86, .53)) return '#6a5a50'; if (tri(x, y, .86, .38, .5, .04)) return '#6a5a50'; if (cir(x, y, .36, .68, .035) || cir(x, y, .6, .68, .035)) return '#2a2420'; if (Math.abs(x - .42) < .006 && y > .3 && y < .7) return '#2a2420'; if (y > .72) return Math.floor(x * 40 + y * 9) % 5 ? '#8a8068' : '#6a6050'; return cir(x, y, .2, .16, .1, 5) ? '#f4f0e8' : '#c8c0b0'; };
const PH = (id, t, src, note, asp = 1.4) => ({ id, t, note, asp, photo: true, f: sepia(typeof src === 'string' ? BY.get(src).f : src) });
export const PHOTOS = [
  PH('ph_harbour', 'The Harbour, 1898', 'dawn', 'Schooners at the fish pier. The town had four hundred people and eleven boats.'),
  PH('ph_crew', 'Cannery Crew, 1911', crew, 'The packing-floor shift of the Maple Bay Cannery. Third from left is Adaeze Bright, aged nineteen.'),
  PH('ph_cannery', 'The Cannery at Low Tide, 1912', 'cannery', 'The sheds that are now the Cannery Row lofts. The whistle blew at six, noon and six.'),
  PH('ph_viaduct', 'Opening of the Viaduct, 1931', 'viaduct', 'The first freight train crosses. The arches are the same ones the light rail runs over today.'),
  PH('ph_tram', 'The Number 4 Tram, 1946', 'tram', 'Maple Avenue by night. The trams ran until 1962; the light rail follows much of the old route.'),
  PH('ph_air', 'Bay Airfield, 1938', biplane, 'The airmail biplane "Maple Leaf" on the grass strip that became Maple Bay International.'),
  PH('ph_market', 'Market Square, 1952', 'market', 'The Saturday market has not missed a week since 1887, except for the snow of 1934.'),
  PH('ph_pier', 'The Fun Pier Wheel, 1961', 'wheel', 'Opening night of the Ferris wheel. Rides were a dime.'),
];
for (const p of PHOTOS) BY.set(p.id, p);
export const pic = id => BY.get(id) || null;
/** a visitor's pencil sketch of a picture; skill 0..1 steadies the hand */
export function pencil(f, skill = .5) { const w = (1 - skill) * .035; return (x, y) => { const xx = Math.max(0, Math.min(.999, x + w * Math.sin(y * 31 + x * 7))), yy = Math.max(0, Math.min(.999, y + w * Math.cos(x * 27))), l = lum(f(xx, yy)), o = od(x, y, 90), h = (Math.floor(x * 90) + Math.floor(y * 90)) % 3 === 0; if (x < .03 || y < .03 || x > .97 || y > .97) return '#f4ecd8'; return l < .22 ? '#4a4852' : l < .45 ? (o ? '#6a6872' : '#b8b0a0') : l < .68 ? (h ? '#8a8890' : '#f4ecd8') : (n(x, y, 60, 4) > .97 ? '#d8d0c0' : '#f4ecd8'); }; }
/** hang a framed picture on a +y face between x0..x1, z0..z1 (frame included). flip-safe (uses qy patterns). */
export function hang(id, x0, x1, y, z0, z1, frame = GOLD) {
  const p = BY.get(id), fw = 1 / 16; qy(x0, x1, y, z0, z1, frame); lw([x0, y, z0], [x1, y, z0], dk(frame, .5)); lw([x1, y, z0], [x1, y, z1], dk(frame, .4)); lw([x0, y, z1], [x1, y, z1], lt(frame, .4)); lw([x0, y, z0], [x0, y, z1], lt(frame, .2));
  if (!p) return; qy(x0 + fw, x1 - fw, y, z0 + fw, z1 - fw, (u, v, w, h) => p.f(Math.min(.999, (u + .5) / w), Math.min(.999, Math.max(0, 1 - (v + .5) / h))));
}
/** frame size (world units) for a picture of height h */
export const picW = (id, h) => { const p = BY.get(id); return Math.round((p ? p.asp : 1.4) * h * 16) / 16; };
