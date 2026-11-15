// Maple Bay University — campus exterior art (the quad in front of University Hall). ids prop.uni.*
//   gate            brick piers + iron arch with the name board (walk under it; only the piers are solid: sim/_uni_city.js blocks them)
//   wall {w}        low brick wall with a stone cap and iron railings      statue          the Founder in bronze on a stone plinth
//   notice {seed}   outdoor noticeboard under a little roof                banner {k: 'term'|'exam'|'fair'|'grad', c}  lamp-post banner
//   stall {k 0-5, name, c, c2}  clubs-fair table under a striped canopy    jetty           pond-dipping deck with buckets and a net
//   bed {w, d, k}   flower bed (seasonal)        aboard {a, b}  chalk A-board        lawnsign {t}  small staked sign
import { R, NAVY, NAVY_D, NAVY_L, GOLD, GOLD_D, GOLD_L, BRICK, BRICK_D, STONE, STONE_D, OAK, OAK_D, OAK_L, CREAM, PAPER, INK, CHALK, CHALKW, GREEN, GREEN_L, RED, IRON, BRONZE, BRONZE_L, POSTER, S2, dot, ctext, crestY, sheet, post } from './_uni_lib.js';
const { box, qy, qx, qz, fq, lw, cyl, ball, cone, dk, lt, mix, glow, lit, px, C, PAT, rng, textY, textW, ENV, foliage, hash2 } = R;

const winter = () => ENV.season === 3;
function pier(x, y, h) {
  box(x, y, 0, .8, .8, h, BRICK, { l: PAT.brick(BRICK), r: PAT.brick(dk(BRICK, .18)) }); box(x, y, 0, .8, .8, .3, STONE, { ol: false });
  box(x - .1, y - .1, h, 1, 1, .18, STONE); box(x + .05, y + .05, h + .18, .7, .7, .12, STONE_D, { ol: false });
  /* lantern */
  post(x + .4, y + .4, h + .3, .35, IRON, .08); box(x + .22, y + .22, h + .62, .36, .36, .42, '#fff2c0', { ol: false, l: '#ffe9a0', r: '#f0d080' }); glow(() => box(x + .22, y + .22, h + .62, .36, .36, .42, '#fff6c8', { ol: false }));
  for (const [a, b] of [[.22, .22], [.58, .22], [.22, .58], [.58, .58]]) lw([x + a, y + b, h + .62], [x + a, y + b, h + 1.04], IRON); box(x + .16, y + .16, h + 1.04, .48, .48, .08, IRON, { ol: false }); cone(x + .4, y + .4, h + 1.12, .22, .26, IRON);
  if (winter()) qz(x - .1, x + .9, y - .1, y + .9, h + .19, '#f4f8fb', '#e2ecf2');
}
function gate() {
  const W = 5.6, y = .4;
  pier(0, 0, 3);
  /* iron arch: two rails with scrollwork, name board hanging between */
  const z0 = 2.75, z1 = 3.75;
  for (let i = 0; i <= 40; i++) { const t = i / 40, x = .8 + t * (W - 1.6), zz = z1 + .5 * Math.sin(t * Math.PI); dot(x, y, zz, IRON); dot(x, y, zz, IRON, 0, 1); if (i % 4 === 2) lw([x, y, z1 - .02], [x, y, zz], IRON); }
  qy(.8, W - .8, y, z0, z1, NAVY); qy(.8, W - .8, y, z0, z0 + .06, GOLD_D); qy(.8, W - .8, y, z1 - .06, z1, GOLD_D);
  ctext('MAPLE BAY', .8, W - .8, y + .01, z1 - .14, GOLD_L); ctext('UNIVERSITY', .8, W - .8, y + .01, z1 - .56, GOLD_L);
  crestY(W / 2, y + .01, z1 + .78, 1); dot(W / 2, y, z1 + .5 + .5, GOLD);
  lw([.8, y, z0], [.8, y, z1], IRON); lw([W - .8, y, z0], [W - .8, y, z1], IRON);
  pier(W - .8, 0, 3);
}
function wall(p) {
  const w = p.w || 4;
  box(0, 0, 0, w, .4, .55, BRICK, { l: PAT.brick(BRICK), r: PAT.brick(dk(BRICK, .18)) }); box(-.03, -.03, .55, w + .06, .46, .1, STONE);
  for (let x = .15; x < w; x += .3) lw([x, .2, .65], [x, .2, 1.2], IRON);
  lw([0, .2, 1.12], [w, .2, 1.12], IRON); lw([0, .2, .78], [w, .2, .78], IRON);
  for (let x = .15; x < w; x += .9) dot(x, .2, 1.26, GOLD_D);
  if (winter()) qz(0, w, 0, .4, .66, '#f4f8fb', '#e2ecf2');
}
function statue() {
  /* plinth */
  box(0, 0, 0, 1.6, 1.6, .25, STONE_D); box(.2, .2, .25, 1.2, 1.2, 1.15, STONE, { l: PAT.stone(STONE), r: PAT.stone(dk(STONE, .16)) }); box(.12, .12, 1.4, 1.36, 1.36, .14, STONE);
  qy(.42, 1.18, 1.401, .6, 1.02, GOLD_D); qy(.46, 1.14, 1.402, .64, .98, '#3a3028'); textY('ASHBY', .5, 1.403, .93, GOLD_L); textY('1891', .56, 1.403, .78, GOLD);
  /* the Founder: long coat, one hand on a stack of books, the other holding a lantern up */
  const B = BRONZE, BL = BRONZE_L, cx = .8, cy = .8, z = 1.54;
  box(cx - .26, cy - .2, z, .52, .4, .9, B, { l: BL, r: dk(B, .25), t: BL });               /* coat skirt */
  box(cx - .24, cy - .17, z + .9, .48, .34, .62, B, { l: BL, r: dk(B, .25), t: BL });         /* chest */
  ball(cx, cy, z + 1.72, .2, B, { t: BL });                                                    /* head */
  box(cx - .2, cy - .18, z + 1.82, .4, .36, .08, dk(B, .2), { ol: false });                    /* hat brim */
  box(cx - .13, cy - .12, z + 1.9, .26, .24, .16, dk(B, .2), { ol: false });
  box(cx + .24, cy - .06, z + 1.2, .14, .14, .5, B, { ol: false, r: dk(B, .25) });             /* raised arm */
  box(cx + .22, cy - .08, z + 1.7, .18, .18, .26, '#fff2c0', { ol: false }); glow(() => box(cx + .22, cy - .08, z + 1.7, .18, .18, .26, '#fff6c8', { ol: false })); lw([cx + .31, cy + .01, z + 1.96], [cx + .31, cy + .01, z + 2.08], dk(B, .3));
  box(cx - .5, cy + .02, z, .26, .3, .46, dk(B, .12), { l: B, t: BL });                        /* books */
  lw([cx - .5, cy + .32, z + .16], [cx - .24, cy + .32, z + .16], dk(B, .4)); lw([cx - .5, cy + .32, z + .31], [cx - .24, cy + .32, z + .31], dk(B, .4));
  if (winter()) { qz(.12, 1.48, .12, 1.48, 1.55, '#f4f8fb', '#e2ecf2'); qz(cx - .2, cx + .2, cy - .18, cy + .18, z + 2.07, '#f4f8fb'); }
}
function notice(p) {
  const r = rng((p.seed || 3) * 13), W = 2.4, y = .22;
  post(.12, .2, 0, 2.05, OAK_D, .14); post(W - .12, .2, 0, 2.05, OAK_D, .14);
  qy(.19, W - .19, y, .6, 1.95, '#c9a070'); qy(.19, W - .19, y, .6, .68, OAK_D); qy(.19, W - .19, y, 1.87, 1.95, OAK_D);
  for (let i = 0; i < 9; i++) { const w = .26 + r() * .2, h = .3 + r() * .22, x = .26 + (i % 5) * .4 + r() * .06, z = (i < 5 ? 1.3 : .76) + r() * .08; if (x + w > W - .22) continue; sheet(x, y + .01, z, w, Math.min(h, 1.86 - z), POSTER[Math.floor(r() * POSTER.length)], i); }
  /* little shingled roof */
  fq([[-.05, .5, 2.02], [W + .05, .5, 2.02], [W + .05, .2, 2.34], [-.05, .2, 2.34]], winter() ? '#f4f8fb' : NAVY, winter() ? '#e2ecf2' : NAVY_L); lw([-.05, .5, 2.02], [W + .05, .5, 2.02], NAVY_D); lw([-.05, .2, 2.34], [W + .05, .2, 2.34], GOLD_D);
  ctext('NOTICES', .19, W - .19, y + .02, 1.94, GOLD_L);
}
function banner(p) {
  const k = p.k || 'term', c = k === 'exam' ? '#8a3848' : k === 'fair' ? '#3f7a54' : k === 'grad' ? GOLD : (p.c || NAVY), f = k === 'grad' ? NAVY : GOLD_L, y = .2;
  post(.15, .15, 0, 3.9, IRON, .1); ball(.15, .15, 3.98, .09, GOLD, { ol: false });
  lw([.15, y, 3.7], [1.05, y, 3.7], IRON); lw([.15, y, 2.0], [1.05, y, 2.0], IRON);
  qy(.28, 1.0, y, 2.05, 3.66, c); fq([[.28, y, 2.05], [1.0, y, 2.05], [.64, y, 1.86]], c);
  qy(.28, 1.0, y, 3.5, 3.56, f); qy(.28, 1.0, y, 2.16, 2.22, f);
  crestY(.64, y + .01, 3.42, 1, k === 'term' ? { n: NAVY_D } : { n: dk(c, .3) });
  const t = k === 'exam' ? ['EXAM', 'WEEK'] : k === 'fair' ? ['CLUB', 'FAIR'] : k === 'grad' ? ['WELL', 'DONE'] : ['MBU', '1891'];
  t.forEach((s, i) => textY(s, .64 - textW(s) / 32, y + .01, 2.62 - i * .4, f));
}
const STALL_PROPS = [
  /* 0 chess */ () => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) qz(.5 + i * .12, .62 + i * .12, .4 + j * .12, .52 + j * .12, .93, (i + j) & 1 ? '#3a3028' : CREAM); box(.6, .5, .93, .08, .08, .16, CREAM, { ol: false }); box(.85, .7, .93, .08, .08, .2, '#3a3028', { ol: false }); },
  /* 1 film */ () => { box(.5, .4, .92, .5, .36, .3, '#3a3a48'); cyl(.62, .52, 1.22, .13, .05, '#6a7482'); cyl(.86, .52, 1.22, .13, .05, '#6a7482'); box(1.0, .48, 1.0, .2, .14, .12, '#22304e', { ol: false }); },
  /* 2 garden */ () => { for (const [x, c] of [[.5, '#e0527a'], [.82, '#f2c230'], [1.14, '#8a5aa8']]) { box(x, .5, .92, .2, .2, .16, '#b8683f', { ol: false }); ball(x + .1, .6, 1.2, .14, GREEN_L, { ol: false }); dot(x + .1, .6, 1.34, c); dot(x + .1, .6, 1.3, c, 1, 0); } },
  /* 3 radio */ () => { box(.5, .45, .92, .6, .3, .34, '#7a5238'); qy(.56, .78, .751, 1.0, 1.2, '#3a3028'); dot(.92, .75, 1.12, GOLD, 0, 0); dot(1.0, .75, 1.12, RED, 0, 0); lw([1.06, .5, 1.26], [1.3, .5, 1.8], STEEL_C); },
  /* 4 rowing */ () => { lw([.3, .6, .96], [2.1, .6, 1.5], '#c8a070'); lw([.3, .64, .96], [2.1, .64, 1.5], '#c8a070'); box(2.02, .56, 1.42, .2, .12, .3, NAVY, { ol: false }); box(.6, .4, .92, .3, .2, .1, GOLD, { ol: false }); },
  /* 5 debate */ () => { box(.55, .45, .92, .34, .3, .36, OAK); qy(.55, .89, .751, 1.0, 1.24, OAK_L); box(1.05, .5, .92, .14, .14, .2, '#f4f0e8', { ol: false }); lw([1.2, .56, .94], [1.5, .56, .94], '#6a4428'); box(1.48, .5, .92, .1, .12, .06, '#6a4428', { ol: false }); },
];
const STEEL_C = '#9aa4b0';
function stall(p) {
  const W = 2.4, D = 1.4, c = p.c || NAVY, c2 = p.c2 || CREAM, k = p.k || 0;
  for (const [x, y] of [[.08, .08], [W - .08, .08]]) post(x, y, 0, 2.2, OAK_D, .1);
  /* table with a cloth */
  box(.2, .25, 0, W - .4, .8, .9, c, { l: PAT.vstripes(c, dk(c, .12), 6), r: dk(c, .25), t: c2 }); qy(.2, W - .2, 1.051, .62, .9, c2);
  ctext(String(p.name || 'CLUB').toUpperCase().slice(0, 12), .2, W - .2, 1.06, .84, dk(c, .2));
  (STALL_PROPS[k % STALL_PROPS.length])();
  for (const [x, y] of [[.08, D - .08], [W - .08, D - .08]]) post(x, y, 0, 2.2, OAK_D, .1);
  /* striped canopy */
  const st = PAT.vstripes(c, c2, 6);
  fq([[-.1, -.05, 2.5], [W + .1, -.05, 2.5], [W + .1, D + .15, 2.15], [-.1, D + .15, 2.15]], (X, Y) => ((Math.floor(X / 6)) & 1 ? c : c2));
  qy(-.1, W + .1, D + .15, 1.95, 2.15, st); qx(W + .1, -.05, D + .15, 1.95, 2.3, dk(c, .25));
  for (let x = -.1; x < W + .1; x += .375) fq([[x, D + .15, 1.95], [x + .375, D + .15, 1.95], [x + .19, D + .15, 1.82]], (Math.round(x / .375)) & 1 ? c2 : c);
  if (winter()) fq([[-.1, -.05, 2.52], [W + .1, -.05, 2.52], [W + .1, .5, 2.4], [-.1, .5, 2.4]], '#f4f8fb', '#e2ecf2');
}
function jetty() {
  const pl = PAT.fboards('#a8804e', .3);
  for (const [x, y] of [[.1, .1], [2.9, .1], [.1, 1.9], [2.9, 1.9], [1.5, 1.9]]) post(x, y, -.5, .7, OAK_D, .14);
  box(0, 0, .1, 3, 2, .12, '#a8804e', { t: pl });
  /* buckets, a net, a tray of jars */
  cyl(.5, .5, .22, .2, .34, '#3b6fd0'); cyl(1.1, .4, .22, .18, .3, '#d9483b'); qz(.38, .62, .38, .62, .57, '#7fb6d0');
  lw([2.6, .3, .24], [1.7, 1.5, 1.3], '#c8a070'); for (let i = 0; i < 6; i++) dot(1.7, 1.5, 1.3, GREEN_L, i % 3 - 1, (i >> 1) - 1);
  box(1.9, .9, .22, .7, .4, .06, '#f4f0e8'); for (let i = 0; i < 3; i++) cyl(2.05 + i * .2, 1.1, .28, .07, .16, '#cfe8f0', { ol: false });
  for (const [x, y] of [[.1, 1.9], [2.9, 1.9]]) post(x, y, .22, .7, OAK_D, .1); lw([.1, 1.9, .86], [2.9, 1.9, .86], OAK_D);
}
function bed(p) {
  const w = p.w || 2, d = p.d || 2, r = rng((p.seed || 1) * 7 + w * 3), s = ENV.season, cols = s === 0 ? ['#f08ab0', '#f6d878', '#f4f0e8', '#e0527a'] : s === 1 ? ['#e0527a', '#f09a3a', '#8a5aa8', '#f6d878'] : s === 2 ? ['#c8683f', '#e8b83a', '#8a3848'] : [];
  box(0, 0, 0, w, d, .16, STONE_D, { t: '#6a4a36' }); qz(.1, w - .1, .1, d - .1, .17, winter() ? '#f4f8fb' : '#5a3f2e', winter() ? '#e2ecf2' : '#6a4a36');
  if (!winter()) for (let i = 0; i < w * d * 22; i++) { const x = .18 + r() * (w - .36), y = .18 + r() * (d - .36); dot(x, y, .2, foliage('leaf', r()), 0, 0); dot(x, y, .2, foliage('leaf', r()), 1, 0); if (r() < .7) { const c = cols[Math.floor(r() * cols.length)]; dot(x, y, .34, c); dot(x, y, .34, c, 1, 0); dot(x, y, .34, c, 0, -1); } }
  if (p.k === 'yew') { ball(w / 2, d / 2, .7, Math.min(w, d) * .28, winter() ? '#4a6a52' : '#3f7a4a'); if (winter()) ball(w / 2, d / 2, .92, Math.min(w, d) * .2, '#f4f8fb', { ol: false }); }
}
function aboard(p) {
  post(.06, .1, 0, 1.15, OAK_D, .08); post(1.14, .1, 0, 1.15, OAK_D, .08); qy(0, 1.2, .16, .2, 1.2, OAK); qy(.06, 1.14, .165, .26, 1.14, CHALK);
  const a = String(p.a || 'OPEN').toUpperCase().slice(0, 7), b = String(p.b || 'LECTURE').toUpperCase().slice(0, 7), c = String(p.c || 'TONIGHT').toUpperCase().slice(0, 7);
  ctext(a, 0, 1.2, .17, 1.08, CHALKW); ctext(b, 0, 1.2, .17, .78, GOLD_L); ctext(c, 0, 1.2, .17, .48, '#f6b8c4');
}
function lawnsign(p) { post(.3, .1, 0, .5, OAK_D, .06); post(1.5, .1, 0, .5, OAK_D, .06); qy(0, 1.8, .14, .36, .8, CREAM); qy(0, 1.8, .14, .36, .4, NAVY); qy(0, 1.8, .14, .76, .8, NAVY); const t = String(p.t || 'THE QUAD').toUpperCase().slice(0, 8); ctext(t, 0, 1.8, .15, .7, NAVY); }

const P = (name, size, draw, o) => Object.assign({ id: 'prop.uni.' + name, kind: 'prop', tags: ['university', 'campus', 'arts'], size, draw }, o);
export default [
  P('gate', [5.6, .8, 3], gate, { solid: false, vb: [-.2, -.2, 0, 5.8, 1, 5.6], light: { x: 2.8, y: 1.4, z: 0, r: 4 }, variants: [{}] }),
  P('wall', p => [p.w || 4, .4, .65], wall, { vb: p => [-.1, -.1, 0, (p.w || 4) + .1, .5, 1.4], variants: [{ w: 4 }, { w: 7 }] }),
  P('statue', [1.6, 1.6, 3.6], statue, { vb: [-.1, -.1, 0, 1.8, 1.8, 3.9], variants: [{}] }),
  P('notice', [2.4, .5, 2.3], notice, { vb: [-.2, -.1, 0, 2.6, .7, 2.5], use: { x: 1.2, y: 1.1 }, variants: [{ seed: 3 }, { seed: 8 }] }),
  P('banner', [.3, .3, 4], banner, { vb: [-.1, -.1, 0, 1.2, .5, 4.2], variants: [{ k: 'term' }, { k: 'exam' }, { k: 'fair' }, { k: 'grad' }] }),
  P('stall', [2.4, 1.4, 2.5], stall, { vb: [-.3, -.2, 0, 2.7, 1.7, 2.7], use: { x: 1.2, y: 2 }, variants: [{ k: 0, name: 'CHESS' }, { k: 1, name: 'FILM SOC', c: '#8a3848' }, { k: 2, name: 'GARDENERS', c: '#3f7a54' }, { k: 3, name: 'RADIO MBU', c: '#c8683f' }, { k: 4, name: 'ROWING', c: '#2f6a7a' }, { k: 5, name: 'DEBATE', c: '#5a4a8a' }] }),
  P('jetty', [3, 2, .25], jetty, { solid: false, vb: [-.2, -.2, -.5, 3.2, 2.2, 1.5], variants: [{}] }),
  P('bed', p => [p.w || 2, p.d || 2, .2], bed, { vb: p => [-.1, -.1, 0, (p.w || 2) + .1, (p.d || 2) + .1, 1.4], variants: [{ w: 2, d: 2 }, { w: 4, d: 1.2, seed: 4 }, { w: 1.4, d: 1.4, k: 'yew' }] }),
  P('aboard', [1.2, .3, 1.2], aboard, { vb: [-.1, -.1, 0, 1.3, .4, 1.3], variants: [{}, { a: 'CLUBS', b: 'FAIR', c: 'TODAY' }] }),
  P('lawnsign', [1.8, .2, .8], lawnsign, { solid: false, vb: [-.1, -.1, 0, 1.9, .3, .9], variants: [{}, { t: 'PLEASE' }] }),
];
