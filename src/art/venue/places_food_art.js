// Signature fixtures for the unique food & drink interiors (src/scenes/rooms/places_food*.js). Ids `furn.pf.*`.
// Front is +y (see docs/reports/venue_art.md). Counters: customer at `use` (+y), worker at `staff` (-y).
import { box, qy, qx, qz, lw, fq, glow, lit, ball, cyl, spx, hash2, dk, lt, PAT, textY, signY, textW } from '../../engine/raster.js';
import { F, K, bx, tube, post, posts, table, chair, stool, counter, till, frameY } from './_lib.js';

const STEEL = '#b8bcc0', STEELD = '#7d858e', BAMBOO = '#d8b070', COPPER = '#c8743a';
const steam = (x, y, z, n = 3, s = 1) => { for (let i = 0; i < n; i++) ball(x + (hash2(i, 3, s) - .5) * .22, y, z + i * .2, .06 + i * .025, i % 2 ? '#f4f2ee' : '#e4e6ea', { ol: false }); };
const PALS = {
  tea: ['#3f6a4a', '#5f8a5a', '#d8a848', '#8a2a2a', '#2f4a3a', '#c8b070', '#e8dcc4'],
  spice: ['#e8843a', '#f2c230', '#c0392b', '#8a5a2a', '#d8a03a', '#7a3a1a', '#e8dcc4', '#a8553f'],
  jam: ['#c0392b', '#e8843a', '#7a55b0', '#f2c230', '#8a2a4a', '#3f8a55'],
  donut: ['#e87aa0', '#5a3222', '#f6f0e0', '#f2c230', '#b07af8', '#8a4a2a'], bagel: ['#c8904a', '#d8a860', '#b87830', '#e0c080'],
  bread: ['#d8a050', '#c88838', '#e0b468', '#b87830'], pie: ['#e8b860', '#c0563a', '#f4d8a0', '#8a3a4a'],
  picado: ['#e87aa0', '#f2c230', '#2f8f8a', '#e8843a', '#7a55b0', '#5af07a', '#3c64ad'],
  eth: ['#3f8a55', '#f2c230', '#d63a3a'], flags: ['#d63a3a', '#f1ede4', '#3c64ad', '#f2c230'],
};
const pal = p => Array.isArray(p.pal) ? p.pal : PALS[p.pal] || null;

const A = [
  /* ---- service counter with a name sign on the front and a choice of counter-top (case | jars | tea | boba | juice | none) ---- */
  F('pf.counter', ['till', 'counter', 'checkout', 'pf'], p => [p.w || 2.5, .5, 1.5], p => {
    const w = p.w || 2.5, c = p.c || '#c0563a', c2 = p.c2 || '#f1ede4', top = p.top || 'case', t = String(p.text || 'OPEN'), cw = w - 1.05, ic = p.ic || ['#e8b860', '#c0563a', '#f4d8a0'];
    counter(0, 0, w, .5, 1, c2, p.slab || '#d8d2c4', { panels: false });
    qy(0, w, .5, .1, .92, p.stripes === false ? c : PAT.vstripes(c2, c, 4));
    const tw = (textW(t) + 6) / 16, x0 = Math.max(.05, w / 2 - tw / 2), x1 = Math.min(w - .05, w / 2 + tw / 2);
    signY(t, x0, x1, .5, .44, .88, p.stripes === false ? dk(c, .25) : c2, p.stripes === false ? c2 : dk(c, .15), { frame: p.stripes === false });
    if (top === 'case') {
      lit(() => { bx(.1, .06, 1, cw, .38, .03, '#3a3f4c'); const n = Math.max(2, Math.floor(cw / .36)); for (let i = 0; i < n; i++) { const x = .1 + cw * (i + .5) / n; cyl(x, .25, 1.03, .13, .03, ic[i % ic.length], { ol: false, t: lt(ic[i % ic.length], .2) }); spx(x, .25, 1.07, 0, 0, ic[(i + 1) % ic.length]); } });
      glow(() => qz(.1, .1 + cw, .06, .44, 1.04, '#ffd070', 'glass'));
      qy(.1, .1 + cw, .46, 1, 1.35, '#e4f6fa', 'glass'); frameY(.1, .1 + cw, .46, 1, 1.35, '#7a8690'); box(.08, .04, 1.35, cw + .04, .44, .06, c); lit(() => lw([.12, .46, 1.34], [.08 + cw, .46, 1.34], '#ffb040'));
    } else if (top === 'jars') {
      const n = Math.max(2, Math.floor(cw / .3)); for (let i = 0; i < n; i++) { const x = .25 + (cw - .2) * i / n, col = ic[i % ic.length]; cyl(x, .25, 1, .1, .26, '#dcecf0', { t: '#8a5a3a', l: col, r: dk(col, .15) }); spx(x, .25, 1.3, 0, 0, '#d8a848'); }
    } else if (top === 'tea') {
      cyl(.35, .25, 1, .16, .2, '#3a3f4c', { t: '#4a4f5c' }); tube([.35, .25, 1.2], [.35, .25, 1.3], '#d8a848'); lw([.5, .25, 1.1], [.62, .25, 1.2], '#3a3f4c'); steam(.35, .25, 1.36, 2, 4);
      const n = Math.max(1, Math.floor((cw - .7) / .28)); for (let i = 0; i < n; i++) { const x = .85 + i * .28; cyl(x, .25, 1, .08, .1, i % 2 ? '#f1ede4' : ic[i % ic.length], { ol: false, t: '#8a5a2a' }); }
    } else if (top === 'boba') {
      const n = Math.max(2, Math.floor(cw / .45)); for (let i = 0; i < n; i++) { const x = .3 + (cw - .3) * i / n, col = ic[i % ic.length]; cyl(x, .2, 1, .15, .5, STEEL, { t: '#d5dbe0' }); qy(x - .1, x + .1, .36, 1.12, 1.32, col); spx(x, .36, 1.05, 0, 0, '#2a2733'); }
      for (let i = 0; i < 4; i++) cyl(.12 + cw, .25, 1 + i * .05, .07, .05, i % 2 ? '#f4b8c8' : '#f1ede4', { ol: i === 3 });
    } else if (top === 'juice') {
      const n = Math.max(2, Math.floor((cw - .5) / .36)); for (let i = 0; i < n; i++) { const x = .25 + i * .36, col = ic[i % ic.length]; cyl(x, .25, 1, .1, .1, '#3a3f4c', { ol: false }); cyl(x, .25, 1.1, .09, .3, '#dcecf0', { l: col, r: dk(col, .12), t: lt(col, .2) }); cyl(x, .25, 1.4, .06, .04, '#2a2733', { ol: false }); }
      const bxx = cw - .15; cyl(bxx, .25, 1, .2, .08, '#c8a068', { t: '#8a5a3a' }); ball(bxx - .08, .25, 1.14, .08, '#f28a30', { ol: false }); ball(bxx + .08, .22, 1.14, .08, '#f6e04a', { ol: false }); ball(bxx, .28, 1.22, .08, '#d63a3a', { ol: false });
    }
    till(w - .9, .08, 1); for (let i = 0; i < 4; i++) box(w - .45, .08, 1 + i * .05, .38, .36, .05, i % 2 ? '#e8dcc4' : '#f1ede4', { ol: i === 3 });
  }, { use: p => ({ x: (p.w || 2.5) - .75, y: 1 }), staff: p => ({ x: (p.w || 2.5) - .75, y: -.5, dir: 1 }), variants: [{ text: 'TACOS' }, { w: 3.5, text: 'BOBA & ICE', c: '#6fb6d8', top: 'boba', ic: ['#c8904a', '#e87aa0', '#8cc84a'] }, { w: 3, text: 'JUICE', c: '#3f8a55', top: 'juice', ic: ['#f28a30', '#8cc84a', '#d63a3a'] }] }),

  /* ---- big stock pots on a low range, steaming (pho / soul / bagel kettle) ---- */
  F('pf.pots', ['pf', 'kitchen', 'cookstation', 'stove'], [2, 1, 2], p => {
    const n = p.n || 2, soup = p.soup || '#e8d8a0';
    bx(0, 0, .7, 2, .06, .9, '#d5dbe0'); box(0, .06, 0, 2, .94, .7, STEEL); qy(0, 2, 1, .52, .62, '#3a3f4c'); for (let i = 0; i < 4; i++) spx(.3 + i * .45, 1, .57, 0, 0, '#d63a3a');
    lit(() => { for (let i = 0; i < n; i++) lw([.2 + i * 2 / n, 1, .3], [2 / n - .2 + i * 2 / n, 1, .3], '#ff8a3a'); });
    for (let i = 0; i < n; i++) { const x = (i + .5) * 2 / n, r = n === 1 ? .46 : n === 2 ? .38 : .28; cyl(x, .52, .7, r, .62, '#c8ccd0', { t: soup, t2: lt(soup, .15) }); lw([x - r - .08, .52, 1.2], [x - r, .52, 1.2], '#3a3f4c'); lw([x + r, .52, 1.2], [x + r + .08, .52, 1.2], '#3a3f4c'); steam(x, .52, 1.42, 3, i + 1); }
  }, { use: { x: 1, y: 1.5 }, light: { x: 1, y: 1.2, z: 0, r: 2 }, variants: [{}, { n: 3, soup: '#c8862a' }, { n: 1, soup: '#9fd0e8' }] }),

  /* ---- bamboo steamer towers on a steam table ---- */
  F('pf.steamers', ['pf', 'kitchen', 'cookstation'], [1.5, 1, 2.1], p => {
    const n = p.n || 4;
    box(0, 0, 0, 1.5, 1, .85, STEEL); qy(0, 1.5, 1, .6, .7, '#3a3f4c');
    for (const [x, y, k] of [[.4, .35, n], [1.1, .4, n - 1], [.75, .72, Math.max(1, n - 2)]]) { for (let i = 0; i < k; i++) { cyl(x, y, .85 + i * .15, .27, .13, BAMBOO, { t: '#e8c888' }); lw([x - .27, y + .19, .92 + i * .15], [x + .27, y + .19, .92 + i * .15], '#8a6a3a'); } cyl(x, y, .85 + k * .15, .28, .05, '#c89a58', { t: '#d8b070' }); spx(x, y, .93 + k * .15, 0, 0, '#8a6a3a'); steam(x, y, 1.02 + k * .15, 2, k); }
  }, { use: { x: .75, y: 1.5 }, variants: [{}, { n: 5 }] }),

  /* ---- dim sum trolley ---- */
  F('pf.steamcart', ['pf', 'cart', 'decor'], [1, .5, 1.4], p => {
    const c = p.c || '#c0392b';
    for (const [x, y] of [[.1, .08], [.9, .08], [.1, .42], [.9, .42]]) cyl(x, y, 0, .06, .08, '#2a2733', { ol: false });
    posts(.05, .04, .9, .42, .08, .95, STEELD); box(.03, .02, .3, .94, .46, .05, STEEL); box(.03, .02, .78, .94, .46, .06, c);
    for (let i = 0; i < 3; i++) { cyl(.2 + i * .3, .25, .35, .12, .1, BAMBOO, { ol: false, t: '#e8c888' }); cyl(.2 + i * .3, .25, .45, .12, .1, '#c89a58', { ol: false, t: '#e8c888' }); }
    for (let i = 0; i < 3; i++) { const k = 2 + (i % 2); for (let j = 0; j < k; j++) cyl(.2 + i * .3, .25, .84 + j * .11, .13, .1, j % 2 ? '#c89a58' : BAMBOO, { t: '#e8c888' }); steam(.2 + i * .3, .25, .9 + k * .11, 1, i); }
    tube([1, .04, .95], [1, .46, .95], '#d8a848');
  }, { variants: [{}, { c: '#d8a848' }] }),

  /* ---- hot pot table for four: split broth pot in the middle ---- */
  F('pf.hotpot', ['pf', 'table', 'seating'], [2, 2, 1.3], p => {
    const c = p.c || '#5a3a28', sc = p.sc || '#c0392b', b1 = p.b1 || '#c0392b', b2 = p.b2 || '#f0e4c0';
    stool(1, .25, .45, sc); stool(.25, 1, .45, sc);
    table(.5, .5, 1, 1, .75, c, { thick: true });
    cyl(1, 1, .75, .32, .1, '#c8ccd0', { t: b1 });
    lit(() => { cyl(1, 1, .84, .27, .01, b1, { ol: false, t: b1 }); fq([[1, .73, .86], [1.27, 1, .86], [1, 1.27, .86], [1, 1, .86]], b2); lw([1, .73, .86], [1, 1.27, .86], '#8a9098'); for (let i = 0; i < 5; i++) spx(1, 1, .86, -5 + i * 2, [1, -1, 2, 0, -2][i], i % 2 ? '#f6e04a' : '#5af07a'); });
    for (const [x, y] of [[.72, .68], [1.3, .7], [.7, 1.3], [1.32, 1.3]]) cyl(x, y, .75, .07, .03, '#f1ede4', { ol: false, t: '#e8dcc4' });
    steam(1, 1, .98, 2, 2);
    stool(1.75, 1, .45, sc); stool(1, 1.75, .45, sc);
  }, { seats: [{ x: 1, y: .25, z: .4, dir: 1 }, { x: 1.75, y: 1, z: .4, dir: 2 }, { x: .25, y: 1, z: .4, dir: 0 }, { x: 1, y: 1.75, z: .4, dir: 3 }], variants: [{}, { c: '#2a2733', sc: '#d8a848' }] }),

  /* ---- Korean BBQ table: inset charcoal grill + copper extraction pipe ---- */
  F('pf.grilltable', ['pf', 'table', 'seating', 'grill'], [2, 1, 2.6], p => {
    const c = p.c || '#3a3f4c', cc = p.cc || '#8a5a3a';
    chair(0, .25, 0, cc);
    table(.5, 0, 1, 1, .75, c, { thick: true });
    cyl(1, .5, .75, .26, .04, '#2a2733', { t: '#3a2a22' }); lit(() => { for (let i = 0; i < 7; i++) spx(1, .5, .8, -6 + i * 2, [0, 1, -1, 2, 0, -2, 1][i], i % 2 ? '#ff8a3a' : '#d63a3a'); });
    for (const [dx, dy, col] of [[-3, -1, '#a8553f'], [1, 1, '#c87a5a'], [4, -1, '#a8553f']]) { spx(1, .5, .81, dx, dy, col); spx(1, .5, .81, dx + 1, dy, col); }
    for (const [x, y, col] of [[.62, .2, '#d63a3a'], [.65, .8, '#6fb858'], [1.38, .22, '#f1ede4'], [1.36, .8, '#e8c030']]) cyl(x, y, .75, .07, .03, '#f1ede4', { ol: false, t: col });
    chair(1.5, .25, 2, cc);
    cyl(1, .5, 1.45, .2, .1, COPPER, { t: '#3a2a22' }); cyl(1, .5, 1.55, .09, 1.05, COPPER, { ol: false }); lw([.91, .5, 1.9], [1.09, .5, 1.9], dk(COPPER, .3)); lw([.91, .5, 2.3], [1.09, .5, 2.3], dk(COPPER, .3));
  }, { seats: [{ x: .25, y: .5, z: .45, dir: 0 }, { x: 1.75, y: .5, z: .45, dir: 2 }], variants: [{}, { c: '#5a3a28', cc: '#2a2733' }] }),

  /* ---- low tea table with four floor cushions ---- */
  F('pf.lowtable', ['pf', 'table', 'seating'], [2, 2, .7], p => {
    const c = p.c || '#5a3a28', cc = p.cc || '#8a2a2a', c2 = p.cc2 || cc;
    box(.75, .08, 0, .5, .4, .08, cc, { t: lt(cc, .12) }); box(.08, .75, 0, .4, .5, .08, c2, { t: lt(c2, .12) });
    posts(.56, .56, .88, .88, 0, .26, dk(c, .4)); box(.5, .5, .26, 1, 1, .08, c, { t: lt(c, .08) });
    cyl(1, .95, .34, .11, .12, p.pot || '#3f6a5a', { t: '#2a2733' }); lw([1.11, .95, .42], [1.2, .95, .48], p.pot || '#3f6a5a'); spx(1, .95, .48, 0, 0, '#d8a848');
    for (const [x, y] of [[.72, .75], [1.28, 1.2], [.78, 1.25]]) cyl(x, y, .34, .05, .05, '#f1ede4', { ol: false, t: '#9ab86a' });
    box(1.52, .75, 0, .4, .5, .08, c2, { t: lt(c2, .12) }); box(.75, 1.52, 0, .5, .4, .08, cc, { t: lt(cc, .12) });
  }, { seats: [{ x: 1, y: .28, z: .08, dir: 1 }, { x: 1.72, y: 1, z: .08, dir: 2 }, { x: .28, y: 1, z: .08, dir: 0 }, { x: 1, y: 1.72, z: .08, dir: 3 }], variants: [{}, { c: '#2a2733', cc: '#2f3f6a', cc2: '#d8a848' }] }),

  /* ---- mesob: woven basket table with a shared platter and four low stools ---- */
  F('pf.mesob', ['pf', 'table', 'seating'], [2, 2, 1], p => {
    const c = p.c || '#c89a50', sc = p.sc || '#7a4e2d', band = p.band || ['#d63a3a', '#3f8a55', '#f2c230'];
    stool(1, .28, .35, sc, { leg: dk(sc, .3) }); stool(.28, 1, .35, sc, { leg: dk(sc, .3) });
    cyl(1, 1, 0, .3, .12, c); cyl(1, 1, .12, .2, .3, c, { ol: false }); for (let i = 0; i < 3; i++) lw([.8, 1.14, .18 + i * .08], [1.2, 1.14, .18 + i * .08], band[i]);
    cyl(1, 1, .42, .5, .08, c, { t: '#e8dcb8' }); for (let i = 0; i < 3; i++) lw([.52, 1.3, .44 + i * .02], [1.48, 1.3, .44 + i * .02], band[i]);
    for (const [dx, dy, col] of [[-5, -1, '#c0392b'], [0, -2, '#e8843a'], [5, -1, '#6fb858'], [-3, 2, '#f2c230'], [3, 2, '#8a5a2a'], [0, 1, '#c0392b']]) { spx(1, 1, .5, dx, dy, col); spx(1, 1, .5, dx + 1, dy, col); spx(1, 1, .5, dx, dy + 1, col); }
    stool(1.72, 1, .35, sc, { leg: dk(sc, .3) }); stool(1, 1.72, .35, sc, { leg: dk(sc, .3) });
  }, { seats: [{ x: 1, y: .28, z: .28, dir: 1 }, { x: 1.72, y: 1, z: .28, dir: 2 }, { x: .28, y: 1, z: .28, dir: 0 }, { x: 1, y: 1.72, z: .28, dir: 3 }], variants: [{}] }),

  /* ---- long communal table with a bench on each side ---- */
  F('pf.communal', ['pf', 'table', 'seating'], p => [p.w || 4, 2, 1], p => {
    const w = p.w || 4, c = p.c || '#b07444', bc = p.bc || dk(c, .18), n = Math.floor(w), it = p.items || ['#f1ede4', '#e8c030', '#f1ede4', '#c0563a'];
    posts(.2, .12, w - .4, .3, 0, .4, dk(bc, .4)); box(.1, .08, .4, w - .2, .4, .07, bc);
    table(.1, .55, w - .2, .9, .75, c, { thick: true });
    for (let i = 0; i < n; i++) { cyl(i + .5, .78, .75, .09, .04, it[i % it.length], { ol: false, t: lt(it[i % it.length], .15) }); cyl(i + .55, 1.22, .75, .09, .04, it[(i + 1) % it.length], { ol: false, t: lt(it[(i + 1) % it.length], .15) }); }
    if (p.mid !== false) { cyl(w / 2, 1, .75, .06, .18, p.mid || '#8a9098', { ol: false }); spx(w / 2, 1, .96, 0, 0, '#d63a3a'); }
    posts(.2, 1.58, w - .4, .3, 0, .4, dk(bc, .4)); box(.1, 1.52, .4, w - .2, .4, .07, bc);
  }, { seats: p => { const n = Math.floor(p.w || 4), o = []; for (let i = 0; i < n; i++) o.push(i % 2 ? { x: i + .5, y: 1.72, z: .45, dir: 3 } : { x: i + .5, y: .28, z: .45, dir: 1 }); for (let i = 0; i < n; i++) o.push(i % 2 ? { x: i + .5, y: .28, z: .45, dir: 1 } : { x: i + .5, y: 1.72, z: .45, dir: 3 }); return o; }, variants: [{}, { w: 3, c: '#d2a26a' }] }),

  /* ---- donut fryer with a cooling conveyor ---- */
  F('pf.fryer', ['pf', 'kitchen', 'cookstation', 'fryer'], [2, 1, 1.9], p => {
    bx(0, 0, .9, 2, .06, .75, '#d5dbe0'); box(0, .06, 0, 2, .94, .9, STEEL); qy(.1, 1.1, 1, .5, .62, '#3a3f4c'); spx(.3, 1, .56, 0, 0, '#5af07a'); spx(.5, 1, .56, 0, 0, '#d63a3a');
    lit(() => qz(.1, 1.15, .15, .9, .91, '#d8a030', '#c08820')); for (const [x, y] of [[.3, .35], [.62, .3], [.92, .4], [.4, .68], [.78, .7]]) { cyl(x, y, .9, .1, .03, '#c8904a', { ol: false, t: '#d8a860' }); spx(x, y, .94, 0, 0, '#c08820'); }
    frameY(.1, 1.15, .9, .9, .92, STEELD);
    box(1.25, .2, .9, .7, .65, .1, STEELD, { t: '#4a4f5c' }); for (const [x, y, col] of [[1.42, .4, '#e87aa0'], [1.72, .4, '#5a3222'], [1.42, .68, '#f6f0e0'], [1.72, .68, '#e87aa0']]) { cyl(x, y, 1, .1, .03, '#c8904a', { ol: false, t: col }); spx(x, y, 1.04, 0, 0, '#4a4f5c'); }
    post(.04, .1, .9, 1.6, STEELD); post(1.96, .1, .9, 1.6, STEELD); box(0, 0, 1.6, 2, .6, .2, STEEL, { l: '#a8acb0' }); lit(() => lw([.1, .6, 1.62], [1.9, .6, 1.62], '#ffd070'));
  }, { use: { x: 1, y: 1.5 }, variants: [{}] }),

  /* ---- baker's rack full of trays (kind: donut | bagel | bread | pie) ---- */
  F('pf.rack', ['pf', 'bakery', 'shelf', 'decor'], [1, .5, 1.9], p => {
    const pl = PALS[p.kind || 'donut'] || PALS.donut, s = p.seed || 1, ring = (p.kind || 'donut') === 'donut' || p.kind === 'bagel';
    for (const [x, y] of [[.05, .05], [.95, .05]]) post(x, y, 0, 1.85, STEELD);
    for (let t = 0; t < 5; t++) { const z = .25 + t * .32; bx(.05, .04, z, .9, .42, .03, '#c8ccd0'); for (let i = 0; i < 4; i++) { const col = pl[Math.floor(hash2(i, t, s) * pl.length)]; cyl(.17 + i * .22, .27, z + .03, .095, .05, ring ? '#c8904a' : dk(col, .15), { ol: false, t: col }); if (ring) spx(.17 + i * .22, .27, z + .09, 0, 0, dk(col, .45)); } }
    for (const [x, y] of [[.05, .45], [.95, .45]]) post(x, y, 0, 1.85, STEELD); lw([.05, .45, 1.85], [.95, .45, 1.85], STEELD); lw([.05, .05, 1.85], [.95, .05, 1.85], STEELD);
    for (const [x, y] of [[.08, .45], [.92, .45]]) cyl(x, y, 0, .04, .05, '#2a2733', { ol: false });
  }, { variants: [{ kind: 'donut' }, { kind: 'bagel' }, { kind: 'bread' }, { kind: 'pie' }] }),

  /* ---- wall TV (kind: sport | menu | ocean) ---- */
  F('pf.tv', ['pf', 'screen', 'decor'], p => [p.w || 1.5, .1, 2.4], p => {
    const w = p.w || 1.5, k = p.kind || 'sport';
    box(0, 0, 1.5, w, .06, .85, '#2a2733');
    lit(() => {
      if (k === 'sport') { qy(.05, w - .05, .06, 1.55, 2.3, '#3f8a45', '#4a9a50'); lw([w / 2, .06, 1.55], [w / 2, .06, 2.18], '#e8f4e0'); frameY(.12, w - .12, .06, 1.6, 2.16, '#e8f4e0'); qy(.05, w - .05, .06, 2.2, 2.3, '#2a2733'); textY(p.text || '2-1', .12, .06, 2.3, '#f6e04a'); spx(w / 2 + .2, .06, 1.9, 0, 0, '#f1ede4'); for (let i = 0; i < 6; i++) spx(.3 + i * (w - .6) / 5, .06, 1.75 + (i % 3) * .12, 0, 0, i % 2 ? '#d63a3a' : '#3c64ad'); }
      else if (k === 'ocean') { qy(.05, w - .05, .06, 1.55, 2.3, '#2f6f9a', '#3c82b0'); for (let i = 0; i < 5; i++) { const x = .2 + hash2(i, 2) * (w - .5), z = 1.65 + hash2(i, 7) * .5; lw([x, .06, z], [x + .12, .06, z], i % 2 ? '#f28a30' : '#f6e04a'); } }
      else { qy(.05, w - .05, .06, 1.55, 2.3, '#1b2630'); textY(p.text || 'MENU', .12, .06, 2.26, p.c || '#f6e04a'); for (let r = 0; r < 4; r++) { lw([.12, .06, 1.98 - r * .1], [.12 + (w - .6) * (.5 + hash2(r, 3) * .5), .06, 1.98 - r * .1], '#cfe0e8'); lw([w - .3, .06, 1.98 - r * .1], [w - .12, .06, 1.98 - r * .1], p.c || '#f6e04a'); } }
    });
    frameY(.05, w - .05, .06, 1.55, 2.3, '#4a4f5c');
  }, { wall: true, mount: .9, solid: false, variants: [{ kind: 'sport' }, { kind: 'menu', text: 'BOBA', c: '#4ad8f0' }, { kind: 'ocean' }] }),

  /* ---- strings along a wall (kind: picado | flags | lanterns) ---- */
  F('pf.bunting', ['pf', 'decor'], p => [p.w || 3, .1, 2.7], p => {
    const w = p.w || 3, k = p.kind || 'picado', pl = pal(p) || (k === 'lanterns' ? ['#d63a3a'] : k === 'flags' ? PALS.flags : PALS.picado), z = 2.55;
    const n = k === 'lanterns' ? Math.max(2, Math.floor(w / .75)) : Math.floor(w / (k === 'flags' ? .3 : .42));
    for (let i = 0; i < n; i++) { const a = w * i / n, b = w * (i + 1) / n; lw([a, .03, z], [(a + b) / 2, .03, z - .05], '#5a4a3a'); lw([(a + b) / 2, .03, z - .05], [b, .03, z], '#5a4a3a'); }
    for (let i = 0; i < n; i++) { const a = w * i / n, b = w * (i + 1) / n, m = (a + b) / 2, col = pl[i % pl.length];
      if (k === 'lanterns') { lw([m, .04, z - .05], [m, .04, z - .14], '#5a4a3a'); lit(() => ball(m, .1, z - .3, .13, col, { squash: 1 })); lw([m - .08, .12, z - .16], [m + .08, .12, z - .16], '#d8a848'); lw([m - .08, .12, z - .44], [m + .08, .12, z - .44], '#d8a848'); lw([m, .12, z - .44], [m, .12, z - .56], '#d8a848'); }
      else if (k === 'flags') fq([[a + .03, .04, z - .03], [b - .03, .04, z - .03], [m, .04, z - .3]], col);
      else { qy(a + .04, b - .04, .04, z - .36, z - .04, col); for (const [u, v] of [[.3, .12], [.7, .12], [.5, .22], [.3, .3], [.7, .3]]) spx(a + (b - a) * u, .04, z - v, 0, 0, lt(col, .6)); }
    }
  }, { wall: true, mount: .9, solid: false, variants: [{ kind: 'picado' }, { kind: 'flags' }, { kind: 'lanterns' }] }),

  /* ---- hanging cloth banner / noren with a word on it ---- */
  F('pf.banner', ['pf', 'decor', 'sign'], p => [Math.max(1, Math.ceil(((textW(String(p.text || 'OPEN')) + 8) / 16) * 2) / 2), .1, 2.5], p => {
    const t = String(p.text || 'OPEN'), w = Math.max(1, Math.ceil(((textW(t) + 8) / 16) * 2) / 2), c = p.c || '#2f3f6a', fg = p.fg || '#f4f0e8';
    tube([0, .03, 2.4], [w, .03, 2.4], '#8a5a3a'); qy(.05, w - .05, .04, 1.5, 2.38, c, dk(c, .08));
    signY(t, .05, w - .05, .05, 1.92, 2.3, c, fg, { frame: false }); lw([.1, .05, 1.86], [w - .1, .05, 1.86], p.a || '#d8a848');
    const n = Math.max(2, Math.round(w / .5)); for (let i = 1; i < n; i++) lw([w * i / n, .05, 1.5], [w * i / n, .05, 1.8], dk(c, .45));
    for (let i = 0; i < n; i++) spx(w * (i + .5) / n, .05, 1.68, 0, 0, p.a || '#d8a848');
  }, { wall: true, mount: .9, solid: false, variants: [{ text: 'TEA' }, { text: 'SAKE', c: '#8a2a2a' }] }),

  /* ---- drum coffee roaster with a cooling tray ---- */
  F('pf.roaster', ['pf', 'cookstation', 'roaster'], [1.5, 1.5, 2.4], p => {
    const c = p.c || '#3a3f4c', a = p.a || '#d8a848';
    box(.1, .1, 0, .9, .9, .5, dk(c, .2)); cyl(.55, .55, .5, .42, .75, c, { t: lt(c, .1) }); lw([.13, .55, .75], [.97, .55, .75], a); lw([.13, .55, 1.05], [.97, .55, 1.05], a);
    lit(() => { cyl(.55, .9, .78, .09, .02, '#ffb040', { ol: false, t: '#ff8a3a' }); }); spx(.75, .95, .95, 0, 0, '#f1ede4');
    cyl(.55, .55, 1.25, .2, .08, a, { ol: false }); cyl(.55, .55, 1.33, .3, .28, a, { t: '#5a3a22' });
    tube([.2, .2, 1.25], [.2, .2, 2.35], STEELD); tube([.2, .2, 2.35], [.2, .05, 2.35], STEELD);
    cyl(1.08, 1.08, 0, .1, .4, dk(c, .2), { ol: false }); cyl(1.08, 1.08, .4, .36, .12, STEEL, { t: '#5a3a22', t2: '#6a4a2c' }); tube([.8, .8, .62], [1.08, 1.08, .56], STEELD);
  }, { use: { x: .75, y: 2 }, light: { x: .75, y: 1.6, z: 0, r: 2 }, variants: [{}, { c: '#8a2a2a' }] }),

  /* ---- offset barrel smoker with a chimney ---- */
  F('pf.smoker', ['pf', 'cookstation', 'smoker'], [1.5, 1, 2.4], p => {
    const c = p.c || '#2a2733';
    posts(.1, .15, .9, .7, 0, .35, '#4a4f5c'); box(0, .1, .35, 1.1, .8, .85, c, { t: lt(c, .12) });
    frameY(.1, 1, .9, .45, 1.1, '#5a606c'); tube([.3, .92, .78], [.8, .92, .78], '#b8bcc0'); cyl(.55, .9, .95, .07, .02, '#f1ede4', { ol: false, t: '#f1ede4' }); spx(.55, .92, .97, 0, 0, '#d63a3a');
    box(1.1, .25, .3, .4, .5, .5, lt(c, .08)); lit(() => { qy(1.16, 1.44, .75, .38, .5, '#ff8a3a'); lw([1.16, .75, .44], [1.44, .75, .44], '#f6e04a'); });
    cyl(.2, .3, 1.2, .08, .95, '#3a3f4c', { ol: false }); cyl(.2, .3, 2.15, .13, .04, '#3a3f4c', { ol: false });
    for (let i = 0; i < 3; i++) ball(.2 + (hash2(i, 5) - .5) * .2, .3, 2.25 - i * 0 + i * .0, .07 + i * .02, '#9a9aa2', { ol: false });
  }, { use: { x: .6, y: 1.5 }, light: { x: 1.3, y: 1.2, z: 0, r: 1.6 }, variants: [{}] }),

  /* ---- live seafood / fish tank on a cabinet ---- */
  F('pf.tank', ['pf', 'tank', 'decor'], p => [p.w || 2, .5, 1.7], p => {
    const w = p.w || 2, c = p.c || '#5a3a28', fish = p.fish || ['#f28a30', '#d63a3a', '#f6e04a', '#f1ede4'];
    counter(0, 0, w, .5, .7, c, dk(c, .2));
    lit(() => { box(.04, .03, .7, w - .08, .44, .78, '#5aa8d0', { l: '#4a98c8', l2: '#62b4dc', t: '#9fd8ee' }); qy(.04, w - .04, .47, .7, .78, '#c8b890');
      for (let i = 0; i < Math.round(w * 3.5); i++) { const x = .2 + hash2(i, 1, 4) * (w - .5), z = .9 + hash2(i, 2, 4) * .45, col = fish[i % fish.length]; lw([x, .47, z], [x + .1, .47, z], col); spx(x + (i % 2 ? .12 : -.02), .47, z, 0, -1, col); }
      for (let i = 0; i < 3; i++) { const x = .25 + i * (w - .5) / 2; lw([x, .47, .78], [x + .04, .47, 1.0 + hash2(i, 9) * .2], '#3f8a55'); spx(x + .3, .47, 1.1 + i * .12, 0, 0, '#e4f6fa'); } });
    frameY(.04, w - .04, .47, .7, 1.48, '#3a3f4c'); box(.02, .01, 1.48, w - .04, .48, .08, '#2a2733');
  }, { light: { x: 1, y: .8, z: 0, r: 2 }, variants: [{}, { w: 3 }] }),

  /* ---- stainless fermenter / bright tank ---- */
  F('pf.brewtank', ['pf', 'tank', 'decor'], [1, 1, 2.6], p => {
    const c = p.c || '#c0c6cc';
    for (const [x, y] of [[.2, .25], [.8, .25], [.5, .82]]) tube([x, y, 0], [x, y, .5], STEELD);
    cyl(.5, .5, .32, .16, .16, dk(c, .2), { ol: false }); cyl(.5, .5, .45, .42, 1.55, c, { t: lt(c, .12) });
    for (const z of [.7, 1.2, 1.75]) lw([.08, .66, z], [.92, .66, z], dk(c, .22));
    cyl(.5, .5, 2.0, .3, .12, c, { ol: false, t: lt(c, .12) }); cyl(.5, .5, 2.12, .12, .2, dk(c, .1)); tube([.5, .5, 2.32], [.5, .2, 2.5], STEELD);
    cyl(.5, .93, 1.0, .06, .02, '#f1ede4', { ol: false, t: '#f1ede4' }); spx(.5, .95, 1.02, 0, 0, '#d63a3a'); tube([.3, .9, .62], [.3, 1, .56], '#d8a848'); qy(.56, .86, .92, 1.3, 1.5, p.tag || '#f6e08a'); lw([.6, .92, 1.42], [.82, .92, 1.42], '#5a4a3a');
  }, { variants: [{}, { c: '#c8743a' }] }),

  /* ---- shelves of big jars / tins (pal: tea | spice | jam) ---- */
  F('pf.jars', ['pf', 'shelf'], p => [p.w || 2, .5, 2.1], p => {
    const w = p.w || 2, c = p.c || '#8a5a3a', pl = pal(p) || PALS.tea, s = p.seed || 1, tins = (p.pal || 'tea') === 'tea';
    box(0, 0, 0, w, .5, 2.05, c, { l: dk(c, .55) });
    for (let r = 0; r < 4; r++) { const z = .12 + r * .48; qy(0, w, .5, z - .06, z, lt(c, .1)); const n = Math.floor((w - .1) / .3); for (let i = 0; i < n; i++) { const x = .08 + i * (w - .16) / n, col = pl[Math.floor(hash2(i, r, s) * pl.length)], h = tins ? .3 : .26 + hash2(i, r, s + 3) * .1;
      qy(x, x + .22, .5, z, z + h, col, tins ? undefined : lt(col, .12)); lw([x, .5, z + h], [x + .22, .5, z + h], tins ? '#d8a848' : '#8a5a3a'); if (tins) qy(x + .06, x + .16, .5, z + .1, z + .2, '#f1ede4'); else lw([x + .04, .5, z + h - .06], [x + .04, .5, z + .04], lt(col, .4)); } }
    qy(0, .06, .5, 0, 2.05, c); qy(w - .06, w, .5, 0, 2.05, c); qy(0, w, .5, 1.98, 2.05, lt(c, .12));
  }, { use: p => ({ x: (p.w || 2) / 2, y: 1 }), variants: [{ pal: 'tea' }, { pal: 'spice' }, { pal: 'jam', c: '#f1ede4' }] }),

  /* ---- vertical spit: al pastor (pineapple on top) or shawarma ---- */
  F('pf.trompo', ['pf', 'kitchen', 'cookstation', 'grill'], [1, 1, 2.1], p => {
    const sh = p.kind === 'shawarma', m = sh ? '#a8703c' : '#c0563a';
    box(0, 0, 0, 1, 1, .9, STEEL); qy(0, 1, 1, .6, .7, '#3a3f4c');
    box(.08, .04, .9, .84, .1, 1, '#4a4f5c'); lit(() => { for (let i = 0; i < 5; i++) lw([.14, .14, 1.05 + i * .17], [.86, .14, 1.05 + i * .17], i % 2 ? '#ff8a3a' : '#ffb040'); });
    cyl(.5, .55, .9, .3, .04, '#c8ccd0', { t: '#8a5a3a' }); post(.5, .55, .94, 1.98, STEELD);
    cyl(.5, .55, 1.0, .17, .2, dk(m, .1), { ol: false }); cyl(.5, .55, 1.2, .23, .28, m, { t: lt(m, .1) }); cyl(.5, .55, 1.48, .19, .2, lt(m, .08), { ol: false }); cyl(.5, .55, 1.68, .13, .1, dk(m, .12), { ol: false });
    for (let i = 0; i < 6; i++) spx(.5, .7, 1.1 + i * .1, [-2, 2, -3, 1, -1, 2][i], 0, dk(m, .35));
    if (!sh) { ball(.5, .55, 1.86, .1, '#f2c230', { ol: false }); spx(.5, .55, 1.98, 0, 0, '#3f8a55'); spx(.5, .55, 1.98, 1, -1, '#3f8a55'); spx(.5, .55, 1.98, -1, -1, '#3f8a55'); } else ball(.5, .55, 1.82, .07, '#e04a3a', { ol: false });
  }, { use: { x: .5, y: 1.5 }, light: { x: .5, y: 1.2, z: 0, r: 1.6 }, variants: [{}, { kind: 'shawarma' }] }),

  /* ---- barrels / kegs ---- */
  F('pf.keg', ['pf', 'decor', 'barrel'], p => [(p.n || 2) > 1 ? 1 : .5, .5, 1.6], p => {
    const n = p.n || 2, c = p.c || '#8a5a3a', band = p.band || '#3a3f4c';
    const keg = (x, z) => { cyl(x, .25, z, .22, .62, c, { t: lt(c, .15) }); lw([x - .22, .37, z + .12], [x + .22, .37, z + .12], band); lw([x - .22, .37, z + .5], [x + .22, .37, z + .5], band); if (p.mark) qy(x - .08, x + .08, .47, z + .22, z + .4, p.mark); };
    keg(.25, 0); if (n > 1) keg(.75, 0); if (n > 2) keg(.5, .64);
  }, { variants: [{}, { n: 3 }, { n: 2, c: '#e8dcc4', band: '#c8a868', mark: '#8a2a2a' }] }),
];
export default A;
