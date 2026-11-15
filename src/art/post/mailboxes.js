// Mailboxes (Direction update 23, owner msg 115): where the post arrives now that the basket in the home is gone.
//   furn.post.mailwall  {w, m, rows, seed, z0, text, mine, no, has}   the lobby's wall of little doors (same look and size as furn.lobby.mailboxes) with YOUR box:
//                         mine = column of your box in the top row (-1 / undefined = none of them is yours): a cream enamel door in a red frame; has = 1 when post waits
//                         (an envelope in the door, a red flag over it with a small light that also shows at night). `no` is kept in the params for labels only.
//   prop.post.curbbox   {style: 'wood' | 'metal' | 'brick', c, no, flag, post}   the curb mailbox of a house: a painted wooden box on a post, a US-style metal box with a red flag,
//                         a brick pillar box with a brass slot for the grander houses. flag = 1: the red flag is up (post has come).
//   prop.post.doorparcel {n, c}   a parcel (or two) left on the doorstep / by the lobby's parcel shelf, with a red "for you" tag.
import { box, qy, qx, qz, lw, fq, lit, dk, lt, PAT, signY, spx, hash2, ENV, U } from '../../engine/raster.js';

const METAL = { brass: '#d8a848', steel: '#b8bcc0', bronze: '#9a6a3a', black: '#3a3f4c', copper: '#c0704a', white: '#e8e4dc' };
const PX = 1 / U, RED = '#d2392f', INK = '#2a2733', PAPER = '#f8f4ea', SNOW = '#f4f8fb';
const mt = p => METAL[p.m] || p.m || METAL.brass;
const frameY = (x0, x1, y, z0, z1, c) => { lw([x0, y, z0], [x1, y, z0], c); lw([x0, y, z1], [x1, y, z1], c); lw([x0, y, z0], [x0, y, z1], c); lw([x1, y, z0], [x1, y, z1], c); };
const snow = () => ENV.season === 3;

/* ---------- the lobby wall ---------- */
function mailwall(p) {
  const w = p.w || 2, c = mt(p), rows = p.rows || 3, z0 = p.z0 || .75, ch = .26, cols = Math.max(2, Math.round((w - .16) / .3)), cw = (w - .16) / cols, z1 = z0 + rows * ch;
  const mine = p.mine === undefined || p.mine === null || p.mine < 0 ? -1 : Math.min(cols - 1, p.mine);
  box(0, 0, z0 - .12, w, .1, z1 - z0 + .3, dk(c, .35)); qy(0, w, .1, z0 - .12, z1 + .18, dk(c, .22));
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
    const x = .08 + i * cw, z = z0 + r * ch, k = hash2(i, r, p.seed || 3), me = mine === i && r === rows - 1;
    qy(x + PX, x + cw - PX, .11, z + PX, z + ch - PX, me ? '#f4ecd6' : k > .8 ? lt(c, .12) : c); frameY(x + PX, x + cw - PX, .11, z + PX, z + ch - PX, me ? RED : dk(c, .45));
    lw([x + .07, .11, z + ch - .09], [x + cw - .07, .11, z + ch - .09], me ? INK : '#f4f0e8'); spx(x + cw / 2, .11, z + .08, 0, 0, INK);
    if (me && p.has) { qy(x + .05, x + cw - .05, .12, z + ch - .1, z + ch + .03, PAPER); lw([x + .05, .12, z + ch - .1], [x + cw - .05, .12, z + ch - .1], dk(PAPER, .3)); spx(x + cw - .07, .12, z + ch, 0, 0, RED); }
    else if (!me && k < .14) qy(x + .06, x + cw - .08, .12, z + ch - .06, z + ch + .02, PAPER);
  }
  qy(.08, w - .08, .11, z0 - .1, z0 - .02, INK); lw([.08, .11, z0 - .02], [w - .08, .11, z0 - .02], lt(c, .3));
  signY(p.text || 'MAIL', w / 2 - .45, w / 2 + .45, .11, z1 + .02, z1 + .16, dk(c, .5), lt(c, .5), { frame: false });
  if (mine >= 0 && p.has) lit(() => { const fx = .08 + (mine + .5) * cw; lw([fx, .12, z1 + .18], [fx, .12, z1 + .5], INK); qy(fx, fx + .16, .12, z1 + .36, z1 + .5, RED); spx(fx, .12, z1 + .5, 0, -2, '#ffe9a0'); });
}

/* ---------- the curb mailbox of a house ---------- */
const flagY = (x, y, z, up) => { if (up) lit(() => { lw([x, y, z], [x, y, z + .3], INK); qy(x, x + .14, y, z + .19, z + .31, RED); }); else { lw([x, y, z], [x + .2, y, z], dk(RED, .3)); qy(x + .08, x + .2, y, z - .01, z + .07, dk(RED, .15)); } };
function curbbox(p) {
  const st = p.style || 'wood', up = !!(p.flag || p.post);
  if (st === 'brick') {
    const c = p.c || '#a8553f', br = '#d8a848'; box(.03, .03, 0, .46, .46, .06, '#8a8a86', { ol: false }); box(.06, .06, .06, .4, .4, .92, c, { l: PAT.brick(c), r: PAT.brick(dk(c, .16)) });
    box(.02, .02, .98, .48, .48, .08, '#d8d0c0'); box(.1, .1, 1.06, .32, .32, .05, '#c4bcac', { ol: false });
    if (snow()) qz(.02, .5, .02, .5, 1.115, SNOW);
    qy(.14, .38, .461, .5, .82, dk(br, .08)); frameY(.14, .38, .461, .5, .82, dk(br, .5)); qy(.17, .35, .462, .68, .75, INK); lw([.17, .462, .76], [.35, .462, .76], lt(br, .4)); spx(.26, .462, .58, 0, 0, dk(br, .5));
    if (up) lit(() => { qy(.19, .33, .463, .66, .8, PAPER); spx(.31, .463, .78, 0, 0, RED); });
    flagY(.47, .3, .86, up); return;
  }
  if (st === 'metal') {
    const c = p.c || '#3f5a8a', pc = '#6a5a4a';
    box(.2, .2, 0, .1, .1, .78, pc, { ol: true }); box(.14, .16, .74, .22, .18, .05, dk(pc, .1), { ol: false });
    box(.03, .14, .79, .44, .22, .15, c); box(.03, .16, .94, .44, .18, .05, c, { ol: false }); box(.03, .19, .99, .44, .12, .03, lt(c, .1), { ol: false });   /* the rounded top, in steps */
    lw([.03, .36, .79], [.03, .36, .94], dk(c, .5)); lw([.47, .36, .79], [.47, .36, .94], dk(c, .5)); lw([.03, .36, .79], [.47, .36, .79], dk(c, .5));
    qx(.471, .16, .34, .81, .97, lt(c, .18)); spx(.471, .25, .9, 0, 0, INK);   /* the door on the street end, its little latch */
    if (snow()) qz(.03, .47, .19, .31, 1.021, SNOW);
    if (up) lit(() => spx(.471, .25, .93, 0, -1, PAPER));
    flagY(.3, .362, .88, up); return;
  }
  /* wood: a painted clapboard box under a little pitched roof, on a post with two braces */
  const c = p.c || '#f1ede4', rc = p.rc || '#3f8a6a', pc = '#8a6a4a';
  box(.2, .2, 0, .1, .1, .7, pc, { ol: true }); lw([.3, .31, .46], [.4, .31, .68], dk(pc, .35)); lw([.2, .31, .46], [.1, .31, .68], dk(pc, .35));
  box(.04, .12, .68, .42, .26, .26, c, { l: PAT.siding(c, 3), r: dk(c, .12) });
  fq([[0, .42, .92], [.5, .42, .92], [.5, .25, 1.1], [0, .25, 1.1]], rc); fq([[.5, .42, .92], [.5, .08, .92], [.5, .25, 1.1]], dk(rc, .22)); lw([0, .42, .92], [.5, .42, .92], dk(rc, .5)); lw([0, .25, 1.1], [.5, .25, 1.1], lt(rc, .25));
  if (snow()) fq([[0, .38, .96], [.5, .38, .96], [.5, .25, 1.11], [0, .25, 1.11]], SNOW);
  qy(.13, .37, .381, .8, .85, INK); if (up) lit(() => { qy(.16, .34, .382, .8, .91, PAPER); spx(.32, .382, .89, 0, 0, RED); });
  flagY(.46, .3, .78, up);
}

/* ---------- a parcel left for you ---------- */
function doorparcel(p) {
  const c = p.c || '#b98a52', n = p.n || 1, one = (x, y, z, w, d, h, cc) => { box(x, y, z, w, d, h, cc); lw([x + w / 2, y + d, z], [x + w / 2, y + d, z + h], PAPER); lw([x + w / 2, y, z + h], [x + w / 2, y + d, z + h], PAPER); lw([x, y + d / 2, z + h], [x + w, y + d / 2, z + h], PAPER); lw([x + w, y + d / 2, z], [x + w, y + d / 2, z + h], dk(PAPER, .2)); };
  one(.04, .06, 0, .4, .32, .26, c); if (n > 1) one(.12, .1, .26, .26, .22, .16, dk(c, .12));
  lit(() => { qy(.08, .2, .381, .1, .2, RED); spx(.14, .382, .16, 0, 0, PAPER); });
}

export default [
  { id: 'furn.post.mailwall', kind: 'furniture', tags: ['lobby', 'lobby_mail', 'post'], wall: true, mount: 0, solid: false, size: p => [p.w || 2, .15, 2.3], use: p => ({ x: (p.w || 2) / 2, y: .6 }), draw: mailwall,
    variants: [{ mine: 1, no: '3B' }, { mine: 1, no: '3B', has: 1 }, { w: 3, m: 'steel', rows: 4, mine: 8, no: '14', has: 1 }, { w: 2.5, m: 'copper', rows: 3, mine: 0, no: 'PH', has: 1 }, { w: 2.5, m: 'black', rows: 3 }] },
  { id: 'prop.post.curbbox', kind: 'prop', tags: ['post', 'mailbox', 'residential'], solid: false, size: [.5, .5, 1.15], vb: [-.1, -.1, 0, .75, .65, 1.35], draw: curbbox,
    variants: [{ style: 'wood', no: '38' }, { style: 'wood', no: '7', flag: 1, c: '#cfe0ea', rc: '#3f6f9f' }, { style: 'metal', no: '12' }, { style: 'metal', no: '12', flag: 1, c: '#8a2f2f' }, { style: 'brick', no: '4' }, { style: 'brick', no: '21', flag: 1, c: '#c8b89a' }] },
  { id: 'prop.post.doorparcel', kind: 'prop', tags: ['post', 'parcel'], solid: false, size: [.5, .45, .45], vb: [-.05, -.05, 0, .6, .55, .55], draw: doorparcel, variants: [{}, { n: 2 }] },
];
