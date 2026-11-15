// Maple Bay Natatorium — entrance hall, changing village and competition-pool pieces. ids furn.nat.* (leisure pool, wellness, cafe, lido and city props: natatorium_leisure.js; helpers: _nat_lib.js)
//   desk {w}   turnstile {n, open}   rail {len}   shoprack {k: goggles|towels|suits|floats}   shopcounter   vending {k: drinks|snacks}   viewwin {w} (wall)   recordboard {filled} (wall)   honours {name} (wall)
//   noticeboard (wall)   mural {on} (wall)   bench {w, c, kit}   lockers {w, seed}   cubicles {n, seed}   showers {n} (wall)   dryer {n} (wall)   towelcart   footbath {w}   block {n}   guardchair {c}
//   bleacher {w, h, c}   flags {len}   divetower   judges   podium   kit {k: boards|reel|firstaid|whiteboard|rings|noodles}   glasswall {w, h, time: day|dusk|night, seed} (wall)   inflatable {len}
//   buoy   ladder   sign {t, w, c, fg, lit} (wall)   plant {h, seed}   wetsign   doorway {t, w, c} (wall)   stair (the stand's end steps)
import { R, box, qy, qx, qz, fq, lw, cyl, ball, dk, lt, mix, hash2, PW, px, C, lit, glow, rng, TEAL, TEAL_D, NAVY, BLUE, YEL, RED, ORG, WHITE, TILE, TILE_D, GROUT, DECK, STEEL, STEEL_D, INK, WOOD, WOOD_D, GLASS, WATER, WATER_L, WATER_D, LEAF, PINK, LIME, FLOATS,
  S2, dot, tiles, railX, railY, glassY, glassX, palm, towel, textC, ring } from './_nat_lib.js';
const { signY, textY, textW, PAT } = R;
const wave = (c, a = 2, k = 5, base = 6) => (u, v) => (v > base + Math.sin(u / k) * a ? null : c);

function desk(p) {
  const w = p.w || 5; box(0, .15, 0, w, .75, 1, WHITE, { l: (u, v) => (v < 3 ? TEAL_D : v < 5 ? TEAL : '#f4f8f8'), t: '#fbfdfd' }); box(0, .15, 1, w, .2, .14, TEAL, { ol: false });
  signY('RECEPTION', w / 2 - 1.5, w / 2 + 1.5, .91, .42, .9, NAVY, '#ffffff', { lit: true });
  for (const x of [w * .25, w * .72]) { box(x - .22, .42, 1, .44, .08, .34, INK, { ol: false }); lit(() => qy(x - .19, x + .19, .5, 1.04, 1.3, '#8fe0ea', '#bff0f6')); box(x - .08, .4, 1, .16, .14, .04, STEEL_D, { ol: false }); }
  box(w * .5 - .2, .6, 1, .4, .25, .12, YEL, { ol: false }); lw([w * .5 - .2, .86, 1.12], [w * .5 + .2, .86, 1.12], lt(YEL, .5)); box(w - .6, .5, 1, .3, .3, .22, '#f4f0e8', { ol: false }); dot(w - .45, .8, 1.26, RED, 2);
}
function turnstile(p) {
  const n = p.n || 3, open = !!p.open;
  for (let i = n; i >= 0; i--) { const y = i; box(0, y, 0, .5, .3, 1, STEEL, { t: lt(STEEL, .3) }); qx(.5, y + .04, y + .26, .2, .8, NAVY); if (i < n) { const c = open ? '#58e07a' : '#e8483a'; lit(() => { qx(.5, y + .08, y + .22, .84, .96, c); dot(.25, y + .15, 1.02, c, 2); }); lw([.25, y + .3, .72], [.25, y + .95, .72], STEEL_D); lw([.25, y + .3, .72], [.25, y + .7, .3], lt(STEEL, .3)); lw([.3, y + .3, .74], [.3, y + .95, .74], lt(STEEL, .4)); } }
}
function rail(p) { const L = p.len || 4; box(0, 0, 0, L, .1, .12, STEEL_D, { ol: false }); for (let x = 0; x < L - .01; x += 1) glassY(x + .04, Math.min(L, x + 1) - .04, .06, .12, 1); lw([0, .06, 1.02], [L, .06, 1.02], lt(STEEL, .4)); }
function shoprack(p) {
  const k = p.k || 'goggles', r = rng((p.seed || 3) * 7 + k.length), CO = [BLUE, YEL, RED, PINK, LIME, '#8a5cc2', TEAL, ORG];
  box(0, 0, 0, 2, .25, 2.1, '#f4f0e8', { l: '#e8e2d4' }); for (const z of [.25, .85, 1.45]) box(0, .2, z, 2, .38, .06, WHITE, { ol: false });
  signY(k === 'goggles' ? 'GOGGLES' : k === 'towels' ? 'TOWELS' : k === 'suits' ? 'SWIMWEAR' : 'FLOATS', .2, 1.8, .26, 1.86, 2.08, TEAL, '#ffffff');
  if (k === 'goggles') { for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) { const x = .2 + i * .3, z = .98 + j * .58, c = CO[Math.floor(r() * 8)]; qy(x - .1, x + .1, .3, z, z + .34, '#fbfbf4'); const s = S2(x, .3, z + .14); px(s[0] - 2, s[1], C(c)); px(s[0] - 1, s[1], C(c)); px(s[0] + 1, s[1] + 1, C(c)); px(s[0] + 2, s[1] + 1, C(c)); px(s[0], s[1], C(INK)); } for (let i = 0; i < 5; i++) ball(.28 + i * .36, .42, .42, .13, CO[(i * 3 + 1) % 8], { squash: .8 }); }
  else if (k === 'towels') for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) for (let q = 0; q < 2 + ((i + j) & 1); q++) towel(.12 + i * .46, .26, .31 + j * .6 + q * .11, CO[Math.floor(r() * 8)], .4);
  else if (k === 'suits') { lw([.1, .42, 1.4], [1.9, .42, 1.4], STEEL_D); for (let i = 0; i < 8; i++) { const x = .2 + i * .22, c = CO[Math.floor(r() * 8)], l = .5 + (i % 3) * .08; fq([[x - .09, .44, 1.38], [x + .09, .44, 1.38], [x + .11, .44, 1.38 - l], [x - .11, .44, 1.38 - l]], c); lw([x, .44, 1.38], [x, .44, 1.38 - l], lt(c, .3)); dot(x, .44, 1.42, STEEL_D); } for (let i = 0; i < 4; i++) box(.15 + i * .45, .26, .31, .36, .26, .16, CO[(i * 2 + 3) % 8], { ol: false }); }
  else { for (let i = 0; i < 9; i++) { const x = .18 + i * .2, c = FLOATS[i % 7], h = .9 + r() * .5; lw([x, .46, .3], [x, .46, .3 + h], c); lw([x + .05, .46, .3], [x + .05, .46, .3 + h], dk(c, .2)); dot(x, .46, .32 + h, lt(c, .3)); } box(.05, .3, .28, 1.9, .3, .34, BLUE, { ol: false }); for (let i = 0; i < 3; i++) { const s = S2(.4 + i * .6, .4, 1.72); R.ellipse(s[0], s[1], 5, 3, FLOATS[i * 2 + 1]); R.ellipse(s[0], s[1], 2, 1, '#e8e2d4'); } }
}
function shopcounter() { box(0, 0, 0, 1.6, .7, 1, '#f4f0e8', { l: wave(YEL, 2, 4, 8), t: '#fbfdfd' }); qy(0, 1.6, .7, 0, .22, TEAL_D); box(.2, .2, 1, .5, .34, .3, INK, { ol: false }); lit(() => qy(.24, .66, .55, 1.08, 1.26, '#9fe8b0')); for (let i = 0; i < 3; i++) ball(1 + i * .2, .4, 1.1, .1, FLOATS[i + 1], { squash: .8 }); }
function vending(p) {
  const snack = p.k === 'snacks', c = snack ? '#e8843a' : BLUE; box(0, 0, 0, 1, .8, 2, c, { t: dk(c, .1) });
  lit(() => { qy(.08, .7, .81, .55, 1.85, snack ? '#fff2c8' : '#cfeffa'); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = .14 + i * .14, z = .64 + j * .3, q = snack ? ['#d8a04a', '#e8483a', '#f2c230', '#8a5cc2'][(i + j) % 4] : ['#3b9be8', '#f4f8f8', '#58c06a', '#e8483a'][(i * 3 + j) % 4]; qy(x, x + .09, .82, z, z + (snack ? .14 : .2), q); } qy(.76, .94, .81, 1.2, 1.5, '#2a2733'); dot(.85, .82, 1.4, '#58e07a'); });
  qy(.1, .7, .81, .12, .4, dk(c, .45)); signY(snack ? 'SNACKS' : 'DRINKS', .08, .92, .81, 1.87, 2, NAVY, '#ffffff', { lit: true, frame: false });
}
function viewwin(p) { const w = p.w || 7; box(0, 0, 0, w, .12, .12, STEEL, { ol: false }); qy(0, w, .1, .12, 1.7, '#2f8fb8'); for (let x = 0; x <= w + .001; x += w / 4) lw([x, .11, .12], [x, .11, 1.7], STEEL); lw([0, .11, 1.7], [w, .11, 1.7], STEEL); lw([0, .11, .12], [w, .11, .12], lt(STEEL, .3)); signY('THE POOL', w / 2 - 1, w / 2 + 1, .11, 1.74, 1.98, NAVY, '#ffffff'); }
function recordboard(p) {
  qy(0, 3.4, .06, 0, 2.2, NAVY); qy(.04, 3.36, .07, 1.78, 2.16, BLUE); textY('CLUB RECORDS', .22, .08, 2.12, '#ffffff'); lw([0, .07, 2.2], [3.4, .07, 2.2], YEL); lw([0, .07, 0], [3.4, .07, 0], YEL);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 2; i++) { const x = .1 + i * 1.65, z = 1.52 - j * .2; qy(x, x + 1.55, .07, z, z + .15, '#e8c06a'); const s = S2(x + .06, .07, z + .11); for (let u = 0; u < 20; u++) if (hash2(u, j * 2 + i, 4) > .3) px(s[0] + u, s[1] + (u >> 1), C('#6a4a1c')); }
  qy(.1, 3.3, .07, .04, .66, p.filled ? '#f2d27a' : '#b8a888'); textY('BACK 1974', .18, .08, .6, INK); textY(p.filled ? 'CASTELLANOS' : '. . . . . .', .18, .08, .32, p.filled ? '#7a2a1c' : '#7a705c'); if (p.filled) { const s = S2(3.16, .08, .44); for (const [i, j] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) px(s[0] + i, s[1] + j, C('#fff8d0')); }
}
function honours(p) {
  qy(0, 2.1, .06, 0, 2.1, '#3a2a30'); qy(.06, 2.04, .07, .06, 2.04, '#22304e'); textY('FRIENDS', .22, .08, 2.0, YEL); textY('OF THE', .34, .08, 1.58, '#e8c06a'); textY('MARLINS', .22, .08, 1.16, YEL);
  for (let j = 0; j < 2; j++) { const s = S2(.2, .08, .68 - j * .14); for (let u = 0; u < 26; u++) if (hash2(u, j, 9) > .35) px(s[0] + u, s[1] + (u >> 1), C('#b8a888')); }
  if (p.name) { qy(.08, 2.02, .08, .06, .44, '#f2d27a'); textY(String(p.name).toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 7), .16, .09, .4, '#7a2a1c'); }
}
function noticeboard() {
  qy(0, 1.9, .05, 0, 1.5, WOOD_D); qy(.06, 1.84, .06, .06, 1.44, '#c8a070'); qy(.14, .98, .07, .3, 1.36, '#fbfbf4'); textY('TIMETABLE', .18, .08, 1.32, NAVY);
  for (let j = 0; j < 7; j++) { const s = S2(.18, .08, 1.14 - j * .11); for (let u = 0; u < 11; u++) px(s[0] + u, s[1] + (u >> 1), C(j % 2 ? '#8fa8c0' : '#5a7a9a')); px(s[0] - 1, s[1], C([TEAL, YEL, RED, LIME, PINK, ORG, BLUE][j])); }
  qy(1.06, 1.76, .07, .8, 1.34, YEL); textY('MEET', 1.12, .08, 1.2, RED); qy(1.06, 1.5, .07, .2, .7, PINK); qy(1.54, 1.78, .07, .3, .72, '#bfe8f0'); for (const [x, z] of [[.56, 1.38], [1.4, 1.36], [1.28, .72], [1.66, .74]]) dot(x, .08, z, RED);
}
function mural(p) {
  qy(0, 3.6, .05, 0, 2.3, STEEL_D); if (!p.on) { qy(.08, 3.52, .06, .08, 2.22, '#eef0ec'); textY('COMMUNITY', .9, .07, 1.7, '#a8b0b4'); textY('WALL', 1.4, .07, 1.2, '#a8b0b4'); for (let i = 0; i < 5; i++) dot(.5 + i * .65, .07, .5, FLOATS[i], 2); return; }
  qy(.08, 3.52, .06, .08, 2.22, (u, v) => (v > 24 ? (v > 30 ? '#f6b88a' : '#f8d0a0') : v > 20 ? '#f08a8a' : ((u + v * 2) % 9 < 2 ? '#8fe0ea' : v > 10 ? '#3fa8d0' : '#2f8fb8')));
  { const s = S2(2.8, .07, 1.72); R.ellipse(s[0], s[1], 5, 5, '#fff2a8'); }
  { const s = S2(1.2, .07, 1.0); for (let i = 0; i < 16; i++) { px(s[0] + i, s[1] + (i >> 1), C('#e8b890')); px(s[0] + i, s[1] + (i >> 1) + 1, C(i < 6 ? '#e8b890' : '#d8402e')); } for (let i = 0; i < 8; i++) px(s[0] + 14 + i, s[1] + 3 - i, C('#e8b890')); R.ellipse(s[0] + 17, s[1] + 9, 2.4, 2.4, '#e8b890'); px(s[0] + 18, s[1] + 7, C('#4a3022')); px(s[0] + 17, s[1] + 7, C('#4a3022')); for (const [i, j] of [[-3, 2], [-5, 4], [22, 14], [24, 12], [8, -1]]) px(s[0] + i, s[1] + j, C('#ffffff')); }
  textY('THE DAWN SWIMMER', .2, .07, .34, '#ffffff');
}
function bench(p) { const w = p.w || 2, c = p.c || WOOD; for (const x of [.15, w - .25]) box(x, .08, 0, .1, .34, .4, STEEL_D, { ol: false }); for (let k = 0; k < 3; k++) box(0, .04 + k * .15, .4, w, .12, .06, k % 2 ? c : lt(c, .1), { ol: false }); R.outline(0, .04, .4, w, .42, .06, c); if (p.kit) { towel(.3, .1, .46, p.kit === 2 ? PINK : TEAL); box(w - .8, .1, .46, .5, .3, .28, p.kit === 2 ? NAVY : RED, { ol: false }); lw([w - .7, .25, .74], [w - .4, .25, .74], '#f4f0e8'); } }
function lockers(p) {
  const w = p.w || 3, r = rng((p.seed || 1) * 11 + 3), CO = [TEAL, YEL, ORG, WHITE, TEAL, '#5ab0e0']; box(0, 0, 0, w, .6, 2, STEEL, { t: lt(STEEL, .2) });
  for (let i = 0; i < Math.round(w / .5); i++) for (let j = 0; j < 2; j++) { const x = i * .5, z = .1 + j * .95, c = CO[Math.floor(r() * 6)], open = r() < .1; if (open) { qy(x + .04, x + .46, .6, z, z + .88, '#3a4450'); qy(x + .1, x + .4, .6, z + .05, z + .3, PINK); qy(x + .02, x + .08, .6, z, z + .88, dk(c, .2)); } else { qy(x + .03, x + .47, .6, z, z + .88, c); lw([x + .03, .6, z + .88], [x + .47, .6, z + .88], lt(c, .4)); lw([x + .47, .6, z], [x + .47, .6, z + .88], dk(c, .3)); const s = S2(x + .36, .6, z + .46); px(s[0], s[1], C(INK)); px(s[0], s[1] + 1, C(STEEL_D)); for (let k = 0; k < 3; k++) px(s[0] - 5 + k * 2, s[1] - 6, C(dk(c, .4))); } }
}
function cubicles(p) {
  const n = p.n || 4, r = rng((p.seed || 2) * 5 + 1), CO = [TEAL, YEL, ORG, '#5ab0e0', PINK]; box(0, 0, .12, n * 1.1 + .1, .9, 2, WHITE, { l: '#eef2f2', t: '#fbfdfd' }); qy(0, n * 1.1 + .1, .9, 0, .12, '#3a4450');
  for (let i = 0; i < n; i++) { const x = .1 + i * 1.1, c = CO[i % 5], busy = r() < .45; box(x - .1, 0, 0, .1, .9, 2.12, STEEL, { ol: false }); qy(x + .06, x + .94, .91, .22, 1.95, c); lw([x + .06, .91, 1.95], [x + .94, .91, 1.95], lt(c, .4)); lw([x + .94, .91, .22], [x + .94, .91, 1.95], dk(c, .3)); dot(x + .82, .91, 1.1, busy ? '#e8483a' : '#58e07a', 2); dot(x + .82, .91, .98, STEEL_D); if (busy) { const s = S2(x + .4, .91, .12); px(s[0], s[1] - 1, C('#e8b890')); px(s[0] + 1, s[1] - 1, C('#e8b890')); px(s[0] + 4, s[1] + 1, C('#e8b890')); px(s[0] + 5, s[1] + 1, C('#e8b890')); } }
  box(n * 1.1, 0, 0, .1, .9, 2.12, STEEL, { ol: false });
}
function showers(p) {
  const n = p.n || 4; qy(0, n, .04, 0, 2.3, tiles(TILE, 4, TEAL, 22, 26)); qy(0, n, .05, 0, .1, TILE_D);
  for (let i = 0; i < n; i++) { const x = i + .5; lw([x, .06, 1.2], [x, .06, 2.05], STEEL); lw([x, .06, 2.05], [x, .34, 2.05], STEEL); box(x - .1, .26, 1.96, .2, .2, .06, STEEL_D, { ol: false }); dot(x, .07, 1.2, RED, 2); dot(x + .2, .07, 1.25, '#f4f0e8', 2); dot(x + .2, .07, 1.15, LIME); if (i) lw([i, .06, 0], [i, .06, 1.5], GROUT); }
}
function dryer(p) {
  const n = p.n || 2; for (let i = 0; i < n; i++) { const x = i * 1.2; qy(x + .08, x + 1.0, .04, .3, 1.6, '#cfe9f4', '#dff2f8'); lw([x + .08, .05, 1.6], [x + 1, .05, 1.6], STEEL); lw([x + .08, .05, .3], [x + .08, .05, 1.6], STEEL); lw([x + 1, .05, .3], [x + 1, .05, 1.6], STEEL_D); const s = S2(x + .3, .05, 1.45); for (let k = 0; k < 5; k++) px(s[0] + k, s[1] + 3 + k, C('#ffffff')); box(x + 1.02, .02, .9, .16, .14, .34, WHITE, { ol: false }); lw([x + 1.1, .16, .9], [x + 1.02, .22, .6], INK); dot(x + 1.1, .17, 1.1, RED); }
  box(0, .02, .2, n * 1.2, .22, .06, WHITE, { ol: false });
}
function towelcart() { box(0, 0, .15, 1, .6, .5, STEEL, { l: '#3f8a8a', r: '#2f6a6a' }); for (const [x, y] of [[.08, .08], [.86, .08], [.08, .5], [.86, .5]]) dot(x, y, .08, INK, 2); for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) towel(.08 + i * .46, .15, .65 + j * .11, j % 2 ? WHITE : '#bfe8f0', .4); lw([1, .05, .6], [1, .05, 1.05], STEEL_D); lw([1, .55, .6], [1, .55, 1.05], STEEL_D); lw([1, .05, 1.05], [1, .55, 1.05], STEEL); }
function footbath(p) { const w = p.w || 2; qz(0, w, 0, 1, .02, TILE_D); qz(.08, w - .08, .08, .92, .025, (x, y) => (Math.sin(x * 9 + y * 5) > .7 ? '#bff0f6' : '#7fd8e4')); lw([0, 1, .02], [w, 1, .02], GROUT); lw([w, 0, .02], [w, 1, .02], GROUT); }
function block(p) { box(.25, .2, 0, .3, .3, .5, STEEL, { ol: false }); box(0, 0, .5, .8, .7, .14, WHITE, { t: (x, y) => ((Math.floor(x * 8) + Math.floor(y * 8)) & 1 ? '#3b8fd8' : BLUE) }); qy(.14, .66, .7, .5, .64, NAVY); textC(String(p.n || 1), .4, .71, .64, '#ffffff'); lw([.1, .7, .64], [.1, .7, .9], STEEL_D); lw([.7, .7, .64], [.7, .7, .9], STEEL_D); lw([.1, .7, .9], [.7, .7, .9], STEEL); }
function guardchair(p) {
  const c = p.c || RED; for (const [x, y] of [[.08, .08], [.92, .08], [.08, .92], [.92, .92]]) { lw([x, y, 0], [x * .7 + .15, y * .7 + .15, 1.55], WHITE); lw([x + .04, y, 0], [x * .7 + .19, y * .7 + .15, 1.55], STEEL_D); }
  for (const z of [.35, .75, 1.15]) lw([.14 + z * .06, .92 - z * .08, z], [.86 - z * .06, .92 - z * .08, z], WHITE);
  box(.18, .18, 1.55, .64, .64, .08, WHITE); box(.18, .18, 1.63, .64, .08, .6, c, { ol: false }); R.outline(.18, .18, 1.63, .64, .08, .6, c); lw([.18, .82, 1.63], [.18, .82, 1.95], WHITE); lw([.82, .82, 1.63], [.82, .82, 1.95], WHITE); lw([.18, .26, 1.95], [.18, .82, 1.95], WHITE);
  { const s = S2(.96, .5, 1.3); for (let k = 0; k < 9; k++) { px(s[0], s[1] + k, C(RED)); px(s[0] + 1, s[1] + k, C('#e86a5a')); } px(s[0], s[1] - 1, C(INK)); }
  lw([.5, .2, 2.23], [.5, .2, 2.9], STEEL_D); const t = [.5, .2, 3.05]; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, b = (i + 1) / 8 * 6.283; fq([t, [.5 + Math.cos(a) * .95, .2 + Math.sin(a) * .95, 2.75], [.5 + Math.cos(b) * .95, .2 + Math.sin(b) * .95, 2.75]], i % 2 ? WHITE : c); }
  textC('LIFEGUARD', .5, .26, 1.92, '#ffffff');
}
function bleacher(p) {
  const w = p.w || 6, h = p.h || .5, c = p.c || BLUE; box(0, 0, 0, w, .9, h, '#c8d0d4', { l: '#b4bec4', t: '#d8e0e2' });
  for (let x = .1; x < w - .5; x += .7) { box(x, .2, h, .55, .5, .07, c, { ol: false }); box(x, .2, h + .07, .55, .08, .3, lt(c, .12), { ol: false }); lw([x, .7, h + .07], [x + .55, .7, h + .07], lt(c, .45)); }
  lw([0, .9, h], [w, .9, h], YEL);
}
function flags(p) {
  const L = p.len || 10; for (const y of [0, L]) { lw([.05, y, -1.95], [.05, y, .12], STEEL); lw([.1, y, -1.95], [.1, y, .12], STEEL_D); } lw([.05, 0, .1], [.05, L, .1], '#f4f8f8');
  for (let y = .15, i = 0; y < L - .2; y += .36, i++) fq([[.05, y, .1], [.05, y + .3, .1], [.05, y + .15, -.2]], [BLUE, YEL, WHITE, RED][i % 4]);
}
function divetower() {
  const num = (t, x, y, z) => { qy(x - .28, x + .28, y, z - .16, z + .16, NAVY); textC(t, x, y + .01, z + .15, '#ffffff'); };
  // five-metre platform: concrete tower, cantilever slab, stairs zig-zag on the right face
  box(6.9, .2, 0, 1.6, 1.6, 3.5, '#eef2f2', { l: (u, v) => (v % 14 === 0 ? TILE_D : v > 20 && v < 26 ? TEAL : '#e4eaea'), r: (u, v) => { const k = Math.floor(v / 9), on = Math.abs(((u + k * 6) % 24) - (v % 9) * 1.3) < 1.6; return on ? STEEL_D : '#cfd8da'; } });
  box(6.9, .2, 3.5, 1.6, 3.6, .2, '#f4f8f8', { l: '#dfe6e6', t: (x, y) => ((Math.floor(x * 6) + Math.floor(y * 6)) & 1 ? '#bfe8f0' : '#d8f2f6') });
  railY(6.9, .2, 3.4, 3.7, .7); railY(8.5, .2, 3.4, 3.7, .7); railX(6.9, 8.5, .2, 3.7, .7); num('5 M', 7.7, 1.81, 2.6);
  // three-metre springboard on a steel frame with a ladder
  for (const [x, y] of [[3.85, .5], [4.95, .5], [3.85, 1.9], [4.95, 1.9]]) box(x - .06, y - .06, 0, .12, .12, 2.15, STEEL, { ol: false });
  lw([3.85, 1.9, 0], [4.95, 1.9, 2.1], STEEL_D); lw([4.95, 1.9, 0], [3.85, 1.9, 2.1], STEEL_D); box(3.75, .4, 2.15, 1.3, 1.65, .1, '#f4f8f8', { t: '#d8f2f6' }); railX(3.75, 5.05, .4, 2.25, .7); railY(3.75, .4, 2, 2.25, .7); railY(5.05, .4, 1.2, 2.25, .7);
  for (let z = .2; z < 2.2; z += .25) lw([5.12, 1.5, z], [5.12, 1.9, z], STEEL); lw([5.12, 1.5, 0], [5.12, 1.5, 2.9], STEEL); lw([5.12, 1.9, 0], [5.12, 1.9, 2.9], STEEL);
  box(4.15, 1.2, 2.25, .5, 3.2, .07, '#7fd0e0', { t: (x, y) => (Math.floor(y * 10) % 2 ? '#8fdcea' : '#6fc4d6'), l: '#4fa8bc' }); cyl(4.4, 2.2, 2.2, .1, .06, STEEL_D, { ol: false }); num('3 M', 4.4, 1.92, 1.5);
  // one-metre springboard
  box(1, .7, 0, .8, 1.1, .72, STEEL, { l: '#aab4c0', t: lt(STEEL, .25) }); box(1.15, 1, .8, .5, 3.2, .07, '#7fd0e0', { t: (x, y) => (Math.floor(y * 10) % 2 ? '#8fdcea' : '#6fc4d6'), l: '#4fa8bc' }); cyl(1.4, 2, .74, .1, .06, STEEL_D, { ol: false }); lw([1, 1, .72], [1, 1, 1.5], STEEL); lw([1.8, 1, .72], [1.8, 1, 1.5], STEEL); lw([1, 1, 1.5], [1, 1.8, 1.5], STEEL); lw([1.8, 1, 1.5], [1.8, 1.8, 1.5], STEEL); num('1 M', 1.4, 1.81, .4);
  signY('DIVING WELL  3.8 M DEEP', 1.9, 6.8, 2.38, .1, .4, RED, '#ffffff');
}
function judges() {
  for (let i = 0; i < 3; i++) { const y = .45 + i * 1.1; box(.05, y - .2, 0, .4, .4, .42, BLUE, { ol: false }); box(.05, y - .2, .42, .06, .4, .5, lt(BLUE, .1), { ol: false }); }
  box(.55, 0, 0, .55, 3.4, .8, '#f4f8f8', { r: (u, v) => (v > 9 ? '#f4f8f8' : v > 6 + Math.sin(u / 4) * 1.5 ? TEAL : NAVY), t: '#fbfdfd' }); R.signX('JUDGES', 1.1, 1, 2.4, .42, .72, NAVY, YEL);
  for (let i = 0; i < 3; i++) { const y = .45 + i * 1.1; box(.75, y - .12, .8, .2, .24, .03, '#fbfbf4', { ol: false }); dot(.9, y + .2, .85, INK); }
}
function podium() { const P = (x, h, t, c) => { box(x, 0, 0, .9, .9, h, '#f4f8f8', { l: c, t: '#fbfdfd' }); textC(t, x + .45, .91, Math.max(.3, h * .5 + .16), '#ffffff'); }; P(0, .5, '2', '#9aa4b0'); P(1.8, .32, '3', '#c8843a'); P(.9, .75, '1', '#e8b830'); lw([0, .9, 0], [2.7, .9, 0], INK); }
function kit(p) {
  const k = p.k || 'boards';
  if (k === 'boards') { box(0, 0, 0, 1.2, .5, .12, STEEL_D, { ol: false }); for (let i = 0; i < 9; i++) { const x = .06 + i * .125; box(x, .06, .12, .09, .38, .6 + (i % 3) * .04, FLOATS[i % 7], { ol: false }); } R.outline(0, 0, .12, 1.2, .5, .62, YEL); }
  else if (k === 'reel') { for (const x of [.1, 1.2]) { lw([x, .4, 0], [x, .4, .7], STEEL_D); lw([x, .1, 0], [x, .4, .7], STEEL_D); lw([x, .7, 0], [x, .4, .7], STEEL_D); } for (let i = 0; i < 11; i++) { const x = .14 + i * .1; cyl(x, .4, .32, .34, .1, i % 3 === 1 ? WHITE : i % 3 ? RED : BLUE, { ol: false }); } R.outline(.1, .06, .3, 1.14, .68, .1, RED); }
  else if (k === 'firstaid') { lw([.25, .15, 0], [.25, .15, 1.5], STEEL_D); box(.02, .08, .9, .46, .14, .5, WHITE); const s = S2(.25, .23, 1.2); for (let i = -2; i <= 2; i++) { px(s[0] + i, s[1], C('#2f9e44')); px(s[0], s[1] + i, C('#2f9e44')); } ring(.25, .24, .55); }
  else if (k === 'whiteboard') { for (const x of [.1, 1.3]) { lw([x, .15, 0], [x, .15, 1.6], STEEL_D); dot(x, .15, .04, INK, 2); } box(0, .1, .6, 1.4, .08, 1, WHITE, { l: '#fbfdfd' }); for (let j = 0; j < 6; j++) { const s = S2(.1, .19, 1.48 - j * .14); for (let u = 0; u < 16 - (j % 3) * 4; u++) if (hash2(u, j, 2) > .25) px(s[0] + u, s[1] + (u >> 1), C(j === 0 ? RED : j % 2 ? BLUE : INK)); } textY('8X50', .8, .19, 1.0, RED); }
  else if (k === 'rings') { for (let i = 0; i < 5; i++) { const s = S2(.5, .5, .1 + i * .16); R.ellipse(s[0], s[1], 8, 4, dk(FLOATS[i], .2)); R.ellipse(s[0], s[1] - 1, 8, 4, FLOATS[i]); R.ellipse(s[0], s[1] - 1, 3, 1.5, i === 4 ? '#c8d8dc' : dk(FLOATS[i], .35)); } }
  else { box(0, 0, 0, .9, .9, .7, BLUE, { l: (u, v) => (v % 4 === 0 ? dk(BLUE, .2) : BLUE), t: '#2a3a5a' }); for (let i = 0; i < 9; i++) { const x = .15 + (i % 3) * .3, y = .2 + Math.floor(i / 3) * .25, c = FLOATS[i % 7], h = .7 + ((i * 7) % 5) * .14; lw([x, y, .7], [x + .04, y, .7 + h], c); lw([x + .05, y, .7], [x + .09, y, .7 + h], dk(c, .2)); dot(x + .05, y, .72 + h, lt(c, .3)); } }
}
function glasswall(p) {
  const w = p.w || 4, h = p.h || 3, tm = p.time || 'day', sd = p.seed || 1, sky = tm === 'night' ? ['#16204a', '#1c2858'] : tm === 'dusk' ? ['#f6a878', '#f08a8a'] : ['#bfe6f6', '#cfeefa'];
  qy(0, w, .04, 0, h, (u, v) => { const k = hash2(Math.floor(u / 9), Math.floor(v / 5), sd); if (tm === 'night') return hash2(u, v, sd) > .992 ? '#fff8d0' : v > h * 10 ? sky[0] : sky[1]; if (tm === 'dusk') return v > h * 11 ? '#8a6ab0' : v > h * 7 ? sky[1] : (k > .8 ? '#f8c8a0' : sky[0]); return k > .82 && v > 14 ? '#ffffff' : (u + v) & 1 ? sky[0] : sky[1]; });
  if (tm !== 'night') qy(0, w, .04, 0, .5, tm === 'dusk' ? '#5a6a70' : '#8fbf8a', tm === 'dusk' ? '#4a5a66' : '#7fb080'); else lit(() => { for (let i = 0; i < w * 2; i++) if (hash2(i, 3, sd) > .5) dot(.2 + i * .5, .05, .2 + hash2(i, 1, sd) * .25, '#ffd98a'); });
  for (let x = 0; x <= w + .001; x += 1) lw([x, .05, 0], [x, .05, h], STEEL); for (const z of [0, h * .5, h]) lw([0, .05, z], [w, .05, z], z === h ? lt(STEEL, .3) : STEEL); box(0, 0, -.1, w, .14, .1, '#dfe6e6', { ol: false });
}
function inflatable(p) {
  const L = p.len || 18, D = 3.6; box(0, 0, 0, L, D, .34, BLUE, { l: (u, v) => (u % 16 < 2 ? dk(BLUE, .2) : BLUE), t: (x, y) => (y < .3 || y > D - .3 ? YEL : Math.floor(x / 1.5) % 2 ? '#3b8fd8' : BLUE) });
  const arch = (x, c) => { for (let i = 0; i < 10; i++) { const a = i / 10 * 3.1416, b = (i + 1) / 10 * 3.1416; for (const dx of [0, .22]) fq([[x + dx, D / 2 - Math.cos(a) * 1.4, .34 + Math.sin(a) * 1.3], [x + dx, D / 2 - Math.cos(b) * 1.4, .34 + Math.sin(b) * 1.3], [x + dx, D / 2 - Math.cos(b) * 1.1, .34 + Math.sin(b) * 1], [x + dx, D / 2 - Math.cos(a) * 1.1, .34 + Math.sin(a) * 1]], dx ? c : dk(c, .25)); } };
  fq([[.2, .5, .34], [1.8, .5, .9], [1.8, D - .5, .9], [.2, D - .5, .34]], YEL); fq([[1.8, .5, .9], [1.8, D - .5, .9], [1.8, D - .5, .34], [1.8, .5, .34]], dk(YEL, .2));
  arch(3.6, RED); for (let i = 0; i < 3; i++) cyl(5.6 + i * .9, 1 + (i % 2) * 1.5, .34, .38, .5, [ORG, PINK, LIME][i]);
  box(8.4, .4, .34, .9, D - .8, 1.1, '#8a5cc2', { l: lt('#8a5cc2', .1) }); for (let i = 0; i < 6; i++) dot(8.4 + .15 + (i % 2) * .5, D - .4, .6 + i * .13, [YEL, PINK, LIME][i % 3], 2);
  arch(10.8, ORG); box(12, D / 2 - .3, .34, 2.6, .6, .3, PINK, { t: lt(PINK, .2) }); for (let i = 0; i < 2; i++) cyl(15.2 + i * .8, 1 + i * 1.4, .34, .42, .4, i ? LIME : YEL);
  fq([[L - 2, .5, 1], [L - .2, .5, .34], [L - .2, D - .5, .34], [L - 2, D - .5, 1]], LIME); fq([[L - 2, D - .5, 1], [L - .2, D - .5, .34], [L - 2, D - .5, .34]], dk(LIME, .25)); box(L - 2.5, .5, .34, .5, D - 1, .66, '#58b84a', { ol: false });
}
function buoy() { ball(.25, .25, .22, .24, ORG); dot(.25, .25, .5, INK); const s = S2(.25, .3, .22); px(s[0] - 1, s[1], C(WHITE)); px(s[0], s[1], C(WHITE)); px(s[0] + 1, s[1], C(WHITE)); }
function ladder() { for (const x of [.08, .42]) { lw([x, .05, -.2], [x, .05, .7], STEEL); lw([x, .05, .7], [x, -.25, .7], STEEL); lw([x, -.25, .7], [x, -.25, 0], lt(STEEL, .3)); } }
function sign(p) { const w = p.w || 2, d = () => signY(p.t || 'NO RUNNING', 0, w, .05, 0, .42, p.c || NAVY, p.fg || '#ffffff', { lit: !!p.lit }); d(); }
function plant(p) { const h = p.h || 1.6; cyl(.4, .4, 0, .3, .42, p.pot || '#e8e2d4', { l: '#d8d0c0', r: '#c0b8a6' }); cyl(.4, .4, .42, .26, .02, '#6a4a34', { ol: false }); palm(.4, .4, .4, h, p.seed || 1); }
function wetsign() { fq([[0, .15, 0], [.2, .15, .6], [.4, .15, 0]], YEL); fq([[.4, .15, 0], [.2, .15, .6], [.4, 0, 0]], dk(YEL, .25)); const s = S2(.2, .15, .34); px(s[0], s[1], C(INK)); px(s[0], s[1] + 2, C(INK)); px(s[0] - 1, s[1] + 4, C(INK)); px(s[0] + 1, s[1] + 4, C(INK)); }
function doorway(p) {
  const w = p.w || 2, c = p.c || TEAL; qy(0, w, .05, 0, 2.6, c); qy(.16, w - .16, .06, 0, 2, '#243848', '#2c4458'); glow(() => qy(.16, w - .16, .06, 0, 2, '#8ff0f0', '#5fd8e8')); lw([w / 2, .07, 0], [w / 2, .07, 2], dk(c, .4)); lw([.16, .07, 2], [w - .16, .07, 2], lt(c, .4));
  signY(p.t || 'POOL', .08, w - .08, .07, 2.1, 2.5, '#ffffff', dk(c, .35), { lit: true });
}
function stair() { for (let i = 0; i < 3; i++) box(0, i * .3, 0, 1, .3, 1.35 - i * .45, '#c8d0d4', { l: '#b4bec4', t: '#d8e0e2', ol: false }); R.outline(0, 0, 0, 1, .9, .45, '#c8d0d4'); }

const F = (id, tags, size, draw, x) => Object.assign({ id: 'furn.nat.' + id, kind: 'furniture', tags: ['nat'].concat(tags), size, draw, variants: [{}] }, x);
const benchSeats = p => { const w = p.w || 2, o = []; for (let x = .4; x < w - .2; x += .75) o.push({ x, y: .25, z: .46, dir: 1 }); return o; };
export default [
  F('desk', ['nat_desk'], p => [p.w || 5, .9, 1.15], desk, { vb: p => [0, 0, 0, p.w || 5, .95, 1.4], use: p => ({ x: (p.w || 5) / 2, y: 1.5 }), staff: p => ({ x: (p.w || 5) * .28, y: -.3, dir: 1 }), variants: [{ w: 5 }] }),
  F('turnstile', ['nat_turnstile'], p => [.5, (p.n || 3) + .3, 1.05], turnstile, { variants: [{ n: 3 }, { n: 3, open: 1 }] }),
  F('rail', ['nat_rail'], p => [p.len || 4, .1, 1.05], rail, { variants: [{ len: 4 }] }),
  F('shoprack', ['nat_shop'], [2, .6, 2.1], shoprack, { use: { x: 1, y: 1.1 }, variants: [{ k: 'goggles' }, { k: 'towels' }, { k: 'suits' }, { k: 'floats' }] }),
  F('shopcounter', ['nat_shop'], [1.6, .7, 1.3], shopcounter, { use: { x: .8, y: 1.3 }, staff: { x: .8, y: -.35, dir: 1 } }),
  F('vending', ['nat_vending'], [1, .8, 2], vending, { use: { x: .5, y: 1.3 }, light: { x: .5, y: 1.2, z: 0, r: 1.6, c: '#bfe8ff' }, variants: [{ k: 'drinks' }, { k: 'snacks' }] }),
  F('viewwin', ['nat_view'], p => [p.w || 7, .12, 2], viewwin, { solid: false, variants: [{ w: 7 }] }),
  F('recordboard', ['nat_records'], [3.4, .1, 2.2], recordboard, { solid: false, variants: [{}, { filled: 1 }] }),
  F('honours', ['nat_honours'], [2.1, .1, 2.1], honours, { solid: false, variants: [{}, { name: 'ALEX' }] }),
  F('noticeboard', ['nat_notice'], [1.9, .1, 1.5], noticeboard, { solid: false }),
  F('mural', ['nat_mural'], [3.6, .1, 2.3], mural, { solid: false, variants: [{}, { on: 1 }] }),
  F('bench', ['nat_bench'], p => [p.w || 2, .5, .5], bench, { vb: p => [0, 0, 0, p.w || 2, .55, .9], seats: benchSeats, variants: [{ w: 2 }, { w: 3, kit: 1 }] }),
  F('lockers', ['nat_locker'], p => [p.w || 3, .6, 2], lockers, { use: p => ({ x: (p.w || 3) / 2, y: 1.1 }), variants: [{ w: 3, seed: 1 }, { w: 3, seed: 4 }] }),
  F('cubicles', ['nat_cubicle'], p => [(p.n || 4) * 1.1 + .1, .9, 2.12], cubicles, { variants: [{ n: 4 }] }),
  F('showers', ['nat_shower'], p => [p.n || 4, .4, 2.3], showers, { solid: false, variants: [{ n: 4 }] }),
  F('dryer', ['nat_dryer'], p => [(p.n || 2) * 1.2, .26, 1.7], dryer, { solid: false, variants: [{ n: 2 }] }),
  F('towelcart', ['nat_cart'], [1, .6, 1.15], towelcart, { use: { x: .5, y: 1.1 } }),
  F('footbath', ['nat_footbath'], p => [p.w || 2, 1, .04], footbath, { solid: false, variants: [{ w: 2 }] }),
  F('block', ['nat_block'], [.8, .7, .95], block, { variants: [{ n: 1 }, { n: 4 }, { n: 8 }] }),
  F('guardchair', ['nat_guard'], [1, 1, 2.3], guardchair, { vb: [-.6, -.9, 0, 1.6, 1.3, 3.2], seats: [{ x: .5, y: .55, z: 1.66, dir: 1 }], variants: [{}] }),
  F('bleacher', ['nat_stand'], p => [p.w || 6, .9, p.h || .5], bleacher, { vb: p => [0, 0, 0, p.w || 6, .95, (p.h || .5) + .45], variants: [{ w: 6, h: .45 }, { w: 6, h: 1.35 }] }),
  F('flags', ['nat_flags'], p => [.12, p.len || 10, .16], flags, { solid: false, vb: p => [-.1, -.1, -2, .3, (p.len || 10) + .1, .3], variants: [{ len: 10 }] }),
  F('divetower', ['nat_dive'], [9.4, 2.4, 4.6], divetower, { vb: [0, 0, 0, 9.4, 4.6, 4.7] }),
  F('judges', ['nat_judges'], [1.1, 3.4, 1.1], judges, { vb: [0, 0, 0, 1.15, 3.4, 1.2], seats: [0, 1, 2].map(i => ({ x: .25, y: .45 + i * 1.1, z: .46, dir: 0 })) }),
  F('podium', ['nat_podium'], [2.7, .9, .75], podium, { vb: [0, 0, 0, 2.7, .95, .8] }),
  F('kit', ['nat_kit'], p => (p.k === 'reel' ? [1.4, .8, .75] : p.k === 'firstaid' ? [.5, .3, 1.5] : p.k === 'whiteboard' ? [1.4, .3, 1.7] : p.k === 'rings' ? [1, 1, .9] : p.k === 'noodles' ? [.9, .9, 1.7] : [1.2, .5, .8]), kit, { vb: p => (p.k === 'noodles' ? [0, 0, 0, 1, .9, 2.3] : p.k === 'rings' ? [-.1, -.1, 0, 1.1, 1.1, 1.1] : p.k === 'reel' ? [-.1, -.1, 0, 1.5, .9, 1.1] : p.k === 'firstaid' ? [-.2, -.1, 0, .7, .5, 1.6] : p.k === 'whiteboard' ? [-.1, -.1, 0, 1.5, .4, 1.8] : [-.1, -.1, 0, 1.3, .6, 1]), variants: [{ k: 'boards' }, { k: 'reel' }, { k: 'firstaid' }, { k: 'whiteboard' }, { k: 'rings' }, { k: 'noodles' }] }),
  F('glasswall', ['nat_glass'], p => [p.w || 4, .14, p.h || 3], glasswall, { solid: false, vb: p => [0, 0, -.1, p.w || 4, .16, (p.h || 3) + .05], variants: [{ w: 4, time: 'day' }, { w: 4, time: 'dusk' }, { w: 4, time: 'night' }] }),
  F('inflatable', ['nat_inflatable'], p => [p.len || 18, 3.6, 1.7], inflatable, { solid: false, variants: [{ len: 18 }] }),
  F('buoy', ['nat_buoy'], [.5, .5, .5], buoy, { solid: false }),
  F('ladder', ['nat_ladder'], [.5, .1, .75], ladder, { solid: false, vb: [0, -.3, -.25, .5, .12, .8] }),
  F('sign', ['nat_sign'], p => [p.w || 2, .06, .42], sign, { solid: false, variants: [{ t: 'NO RUNNING', w: 2.8, c: '#d8402e' }, { t: 'SHALLOW 1.0 M', w: 3.4 }] }),
  F('plant', ['nat_plant'], p => [.8, .8, (p.h || 1.6) + .9], plant, { vb: p => [-.9, -.8, 0, 1.7, 1.5, (p.h || 1.6) + 1.2], variants: [{ h: 1.6 }, { h: 2.4, seed: 4 }] }),
  F('wetsign', ['nat_wet'], [.4, .3, .6], wetsign, { solid: false }),
  F('doorway', ['nat_door'], p => [p.w || 2, .12, 2.6], doorway, { solid: false, light: { x: 1, y: .9, z: 0, r: 1.8, c: '#b0f0f4' }, variants: [{ t: 'POOL' }, { t: 'CHANGING', w: 2.6, c: '#e8843a' }] }),
  F('stair', ['nat_stand'], [1, .9, 1.35], stair, {}),
];
