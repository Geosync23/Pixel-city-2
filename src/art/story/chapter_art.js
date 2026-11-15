// Chapter art (the main story): the gold Chapter marker (a canvas sprite for the city overlay, the phone Map and the UI), Nana's attic
// furniture, the ladder on her landing, the brass bell, and the pictures on the two microfilm frames.
// Assets (registry ids): furn.story.ladder, furn.story.hatch, furn.story.atticbox, furn.story.trunk, furn.story.sheetchair, furn.story.roundwindow,
//   furn.story.rafters, prop.story.bell, prop.story.stallsign, furn.home.story.kettlephoto, furn.home.story.yearphoto (the two photographs, framed, for a wall at home).
// Exports besides the default asset list: markerSprite(frame 0..3) -> canvas 17x26, pageSprite() -> canvas 9x11, photo1985(g, w, h), photo1988(g, w, h).
import { box, qz, qy, qx, lw, px, C, PW, dk, lt, glow, lit, ellipse, cyl, textY, rect, fq } from '../../engine/raster.js';

const GOLD = '#f2c230', GOLD2 = '#ffe9a6', GOLD3 = '#d99a1c', INK = '#4a3410', WOOD = '#8a5a3a', WOOD2 = '#6b4428', CARD = '#c9a26b', BRASS = '#d9a441';

/* ---------- the gold marker: a bookmark ribbon with a little page on it ---------- */
const mk = [];
export function markerSprite(f = 0) {
  f = ((f | 0) % 4 + 4) % 4; if (mk[f]) return mk[f];
  const c = document.createElement('canvas'); c.width = 17; c.height = 26; const g = c.getContext('2d');
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  for (let y = 0; y < 21; y++) for (let x = 3; x <= 13; x++) R(x, y, 1, 1, x === 3 || x === 13 || y === 0 ? INK : x <= 5 ? GOLD2 : x >= 11 ? GOLD3 : GOLD);
  for (let x = 4; x <= 12; x++) R(x, 1, 1, 1, GOLD2);
  /* the V notch at the bottom: two prongs */
  for (let i = 0; i < 5; i++) {
    const y = 21 + i, e = 7 - i;                         /* left prong x 3..e, right prong 16-e..13 */
    for (let x = 3; x <= e; x++) { const edge = x === 3 || x === e || i === 4; R(x, y, 1, 1, edge ? INK : x <= 5 ? GOLD2 : GOLD); R(16 - x, y, 1, 1, edge ? INK : GOLD3); }
  }
  /* the page */
  R(6, 5, 5, 7, INK); R(7, 6, 3, 5, '#fff8e0'); R(7, 7, 3, 1, '#c9b48a'); R(7, 9, 2, 1, '#c9b48a');
  /* a sparkle that travels (frames) */
  const sp = [[5, 2], [11, 4], [12, 15], [5, 17]][f]; R(sp[0], sp[1], 1, 1, '#ffffff'); R(sp[0] - 1, sp[1], 3, 1, '#fff8e0'); R(sp[0], sp[1] - 1, 1, 3, '#fff8e0'); R(sp[0], sp[1], 1, 1, '#ffffff');
  return mk[f] = c;
}
let pg = null;
export function pageSprite() {
  if (pg) return pg; const c = document.createElement('canvas'); c.width = 9; c.height = 11; const g = c.getContext('2d');
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  R(0, 0, 9, 11, '#2a2733'); R(1, 1, 7, 9, '#fbf6e4'); R(2, 3, 5, 1, '#2b3a67'); R(2, 5, 4, 1, '#2b3a67'); R(2, 7, 5, 1, '#2b3a67'); R(1, 1, 1, 9, '#e59a9a');
  return pg = c;
}

/* ---------- microfilm pictures (grey newsprint) ---------- */
const N = ['#1d1c1a', '#4a4843', '#8a877c', '#bdb8a6', '#e2dcc8'];
export function photo1985(g, w, h) {
  const R = (x, y, ww, hh, c) => { g.fillStyle = N[c]; g.fillRect(x, y, ww, hh); };
  R(0, 0, w, h, 3); R(0, 0, w, 14, 4);                           /* sky + street */
  R(10, 10, 100, 46, 2); R(10, 10, 100, 3, 1);                   /* shopfront */
  R(14, 16, 92, 9, 4); g.fillStyle = N[0]; g.font = '700 8px Georgia,serif'; g.fillText('THE COPPER KETTLE', 18, 24);
  R(16, 28, 34, 26, 4); R(18, 30, 30, 22, 3); R(33, 30, 1, 22, 1);   /* window */
  R(70, 28, 36, 26, 4); R(72, 30, 32, 22, 3); R(88, 30, 1, 22, 1);
  R(54, 28, 13, 28, 0); R(55, 29, 11, 27, 1);                    /* the door, held open */
  R(60, 24, 3, 3, 4); R(61, 27, 1, 1, 0);                        /* the bell over the door */
  R(0, 56, w, 16, 2); R(0, 56, w, 1, 1);
  const person = (x, y, s, hair, coat) => { R(x, y, 4, 4, 4); R(x, y - 1, 4, 2, hair); R(x - 1, y + 4, 6, 8 * s | 0, coat); R(x, y + 4 + (8 * s | 0), 2, 4, 0); R(x + 2, y + 4 + (8 * s | 0), 2, 4, 0); };
  person(24, 40, 1, 1, 4);      /* Bea, in the apron */
  person(34, 39, 1.1, 0, 1);    /* Ray */
  person(60, 40, 1, 0, 3);      /* Nell, in the doorway, laughing, one foot against the door */
  R(64, 55, 3, 2, 0);
  person(82, 43, .8, 1, 2);     /* June, pulling a face */
  R(57, 41, 2, 1, 0);           /* the laugh */
}
export function photo1988(g, w, h) {
  const R = (x, y, ww, hh, c) => { g.fillStyle = N[c]; g.fillRect(x, y, ww, hh); };
  R(0, 0, w, h, 4); for (let i = 0; i < 9; i++) { R(6, 8 + i * 7, 50 - (i * 7) % 13, 2, 2); R(64, 8 + i * 7, 48 - (i * 5) % 11, 2, 2); }
  R(58, 4, 1, h - 8, 1); R(4, 30, 52, 9, 3);
}

/* ---------- attic + landing furniture ---------- */
const rung = (x0, x1, y, z) => lw([x0, y, z], [x1, y, z], WOOD2);
export default [
  { id: 'furn.story.ladder', kind: 'furniture', tags: ['story', 'ladder'], solid: false, size: [.9, .5, 2.7], vb: [-.2, -.2, 0, 1.1, .8, 3],
    draw() {
      /* a loft ladder leaning on the back wall, under a dark hatch in the ceiling line */
      qy(.05, .85, .04, 2.35, 2.75, '#3a2c22', '#2a2018');
      for (const x of [.14, .76]) { lw([x, .46, 0], [x, .06, 2.4], WOOD); lw([x + .04, .46, 0], [x + .04, .06, 2.4], lt(WOOD, .15)); lw([x - .04, .46, 0], [x - .04, .06, 2.4], WOOD2); }
      for (let i = 1; i < 9; i++) { const t = i / 9; rung(.14, .8, .46 - .4 * t, 2.4 * t); }
    } },
  { id: 'furn.story.hatch', kind: 'furniture', tags: ['story', 'hatch'], solid: false, size: [1.2, 1, .1], vb: [-.2, -.2, 0, 1.4, 1.2, 1.3],
    draw() {
      qz(0, 1.2, 0, 1, .01, '#2a2018'); qz(.08, 1.12, .08, .92, .02, '#15110d');
      lw([0, 0, .02], [1.2, 0, .02], WOOD); lw([0, 1, .02], [1.2, 1, .02], WOOD); lw([0, 0, .02], [0, 1, .02], WOOD); lw([1.2, 0, .02], [1.2, 1, .02], WOOD);
      for (const x of [.3, .9]) { lw([x, .5, 0], [x, .5, 1.05], WOOD); lw([x + .04, .5, 0], [x + .04, .5, 1.05], lt(WOOD, .15)); }
      for (let i = 0; i < 4; i++) rung(.3, .94, .5, .2 + i * .25);
    } },
  { id: 'furn.story.atticbox', kind: 'furniture', tags: ['story', 'atticbox'], solid: true, size: [1.1, .9, .75], use: { x: .55, y: 1.35 },
    variants: [{ t: 'KETTLE' }, { t: 'GIRLS' }, { t: '' }],
    draw(p) {
      const c = p.c || CARD; box(0, 0, 0, 1.1, .9, .7, c, { l: dk(c, .12), r: dk(c, .26), t: lt(c, .08) });
      qz(.02, 1.08, .36, .54, .705, '#b99558');                       /* tape */
      if (p.open) { fq([[0, 0, .7], [1.1, 0, .7], [1.1, -.25, .95], [0, -.25, .95]], lt(c, .12)); qz(.1, 1, .1, .8, .6, '#3a2c22'); }
      if (p.t) textY(p.t, .08, .9, .5, '#3a2a18');
      if (p.t === 'KETTLE') textY('FRAGILE', .08, .9, .3, '#a8362a');
    } },
  { id: 'furn.story.trunk', kind: 'furniture', tags: ['story', 'trunk'], solid: true, size: [1.6, .9, .8],
    draw() {
      box(0, 0, 0, 1.6, .9, .55, '#5a3a2a', { l: '#4a2f22', r: '#3a241a', t: '#6a4632' }); box(0, 0, .55, 1.6, .9, .2, '#6a4632', { l: '#57382a', r: '#452c20', t: '#7a5440' });
      for (const x of [.25, 1.3]) { qy(x, x + .08, .9, 0, .75, BRASS); qz(x, x + .08, 0, .9, .755, BRASS); }
      qy(.74, .86, .9, .42, .56, BRASS); px(...PW(.8, .9, .47), C('#2a1c10'));
    } },
  { id: 'furn.story.sheetchair', kind: 'furniture', tags: ['story', 'sheetchair'], solid: true, size: [1.2, 1.1, 1.2], use: { x: .6, y: 1.55 },
    variants: [{}, { off: true }],
    draw(p) {
      if (p.off) {       /* the green velvet armchair itself, one arm worn smooth */
        const g1 = '#3f7a52', g2 = '#2f5f3f';
        box(.1, .1, 0, 1, .9, .42, g1, { l: g2, r: dk(g2, .15), t: lt(g1, .1) }); box(.1, .1, .42, 1, .25, .62, g1, { l: g2, r: dk(g2, .15), t: lt(g1, .12) });
        box(.1, .1, .42, .2, .9, .28, g1, { l: g2, r: dk(g2, .15), t: '#8fb79a' }); box(.9, .1, .42, .2, .9, .28, g1, { l: g2, r: dk(g2, .15), t: lt(g1, .1) });
        return;
      }
      const s = '#e9e4d6', s2 = '#cfc8b6', s3 = '#b5ad9a';      /* under a dust sheet */
      box(.05, .05, 0, 1.1, 1, .5, s, { l: s2, r: s3, t: s }); box(.05, .05, .5, 1.1, .32, .62, s, { l: s2, r: s3, t: lt(s, .2) });
      box(.05, .05, .5, .24, 1, .22, s, { l: s2, r: s3, t: lt(s, .15) }); box(.91, .05, .5, .24, 1, .22, s, { l: s2, r: s3, t: lt(s, .15) });
      for (const x of [.2, .5, .8, 1.05]) lw([x, 1.05, .45], [x - .04, 1.05, .02], s3);     /* folds */
      box(1.12, .7, 0, .16, .22, .14, '#b8443a', { t: '#d8d2c0' });                          /* a biscuit tin, down the side */
    } },
  { id: 'furn.story.roundwindow', kind: 'furniture', tags: ['story', 'window'], solid: false, size: [1.1, .1, 1.1], mount: 1.05, vb: [-.2, -.2, -.2, 1.3, .4, 1.4],
    light: { x: .55, y: 1.6, z: 0, r: 3.2, c: '#ffe9b0' },
    draw() {
      const c = PW(.55, .03, .55), X = Math.round(c[0]), Y = Math.round(c[1]);
      ellipse(X, Y, 10, 10, WOOD2); lit(() => { ellipse(X, Y, 8, 8, '#bfe3f2', '#d8f0f8'); });
      for (let i = -8; i <= 8; i++) { px(X + i, Y, C(WOOD2)); px(X, Y + i, C(WOOD2)); }
    } },
  { id: 'furn.story.rafters', kind: 'furniture', tags: ['story'], solid: false, size: [8, .1, .4], mount: 1.75, vb: [-.2, -.2, -.2, 8.2, .5, .7],
    draw(p) { const w = p.w || 8; qy(0, w, .03, .12, .3, WOOD2, dk(WOOD2, .15)); for (let x = .6; x < w; x += 1.6) qy(x, x + .16, .04, -.15, .3, WOOD, WOOD2); } },
  { id: 'furn.story.book', kind: 'furniture', tags: ['story', 'nells_book'], solid: false, size: [.7, .7, .6], vb: [-.2, -.2, 0, .9, .9, .9],
    draw() {      /* Mom's exercise book, on a little three-legged stool */
      for (const [x, y] of [[.12, .12], [.58, .12], [.35, .58]]) cyl(x, y, 0, .04, .36, WOOD2);
      cyl(.35, .35, .36, .3, .06, WOOD, { t: lt(WOOD, .15) });
      box(.16, .2, .42, .4, .3, .05, '#7d93b8', { l: '#6a7fa3', r: '#586c8f', t: '#8fa6cc' }); qz(.2, .52, .24, .3, .475, '#f4ecd8');
      glow(() => { const q = PW(.36, .35, .5); px(Math.round(q[0]), Math.round(q[1]) - 3, C('#ffe9a6')); });
    } },
  { id: 'prop.story.bell', kind: 'prop', tags: ['story', 'bell'], solid: false, size: [.5, .5, 1.5], vb: [-.3, -.3, 0, .8, .8, 1.8],
    draw() {
      cyl(.25, .25, 0, .06, 1.25, '#5a4a3a'); lw([.25, .25, 1.25], [.55, .25, 1.25], '#3a2c22'); lw([.25, .25, 1.26], [.55, .25, 1.26], '#3a2c22');
      const s = PW(.5, .25, 1.02), X = Math.round(s[0]), Y = Math.round(s[1]);
      rect(X - 2, Y - 3, 5, 4, BRASS); rect(X - 3, Y + 1, 7, 1, dk(BRASS, .2)); rect(X - 1, Y - 4, 3, 1, BRASS); px(X - 1, Y - 2, C('#fff0c0')); px(X, Y + 2, C('#3a2c22'));
      glow(() => px(X - 1, Y - 3, C('#fff8e0')));
    } },
  /* the two photographs, framed, for a wall at home (registered as home items by sim/chapters.js; ids under furn.home. so the home system can hang them) */
  { id: 'furn.home.story.kettlephoto', kind: 'furniture', tags: ['home', 'decor', 'wall', 'story', 'photo'], wall: true, solid: false, size: [1, .1, .8], mount: 1.2,
    draw() {      /* the Bay Courier print, June 1985: the shopfront, four people, the door held open */
      const y = .06, f = '#5a3a2a';
      qy(0, 1, y - .02, 0, .8, f); qy(.05, .95, y, .05, .75, '#e9e2cc'); qy(.09, .91, y + .005, .1, .7, '#b9b3a2');
      qy(.09, .91, y + .01, .6, .7, '#d8d2c0');                                    /* sky */
      qy(.13, .87, y + .01, .22, .62, '#8a877c'); qy(.16, .84, y + .012, .5, .58, '#e2dcc8');     /* the shopfront and its sign */
      qy(.18, .4, y + .012, .26, .46, '#d0cab8'); qy(.6, .82, y + .012, .26, .46, '#d0cab8');     /* windows */
      qy(.46, .55, y + .012, .22, .48, '#2a2823');                                  /* the open door */
      qy(.09, .91, y + .01, .1, .22, '#6e6b62');                                    /* pavement */
      for (const [x, h, c] of [[.24, .16, '#f2eee0'], [.31, .19, '#3a3832'], [.49, .16, '#c9c3b0'], [.68, .13, '#8a877c']]) { qy(x, x + .045, y + .014, .14, .14 + h, c); qy(x + .005, x + .04, y + .016, .14 + h, .14 + h + .045, '#e8dcc6'); }
      lw([0, y - .02, .8], [1, y - .02, .8], dk(f, .3)); lw([0, y - .02, 0], [1, y - .02, 0], dk(f, .3));
    } },
  { id: 'furn.home.story.yearphoto', kind: 'furniture', tags: ['home', 'decor', 'wall', 'story', 'photo'], wall: true, solid: false, size: [1.25, .1, .9], mount: 1.15,
    draw() {      /* everyone at the Lookout, squinting; the bay behind them; one small figure looking the other way, at a bird */
      const y = .06, f = '#c9a24a';
      qy(0, 1.25, y - .02, 0, .9, f); qy(.05, 1.2, y, .05, .85, '#fbf6e4'); qy(.1, 1.15, y + .005, .11, .79, '#9fd0ea');
      qy(.1, 1.15, y + .01, .11, .5, '#4f8fb8'); qy(.1, 1.15, y + .012, .11, .3, '#6f9a58');       /* the bay, the hill */
      qy(.1, 1.15, y + .014, .29, .31, '#e9e4d6');                                                 /* the railing */
      const P = [['#e8e8e8', '#b8443a', .26], ['#6b4a2e', '#3a5a78', .3], ['#2a2018', '#d9a23a', .3], ['#9a958c', '#6b705c', .31], ['#3a2c22', '#3f7a52', .29], ['#2a2018', '#7a2e3a', .3], ['#5a3a2a', '#d98a3a', .2], ['#2a2018', '#4f9a6a', .17]];
      P.forEach(([hair, coat, h], i) => { const x = .17 + i * .118; qy(x, x + .07, y + .016, .13, .13 + h, coat); qy(x + .01, x + .06, y + .018, .13 + h, .13 + h + .06, '#e8c9a8'); qy(x + .01, x + .06, y + .02, .13 + h + .045, .13 + h + .075, hair); });
      qy(1.06, 1.09, y + .02, .66, .68, '#3a3832'); qy(1.04, 1.06, y + .02, .68, .69, '#3a3832'); qy(1.09, 1.11, y + .02, .68, .69, '#3a3832');   /* the bird */
      lw([0, y - .02, .9], [1.25, y - .02, .9], dk(f, .25)); lw([0, y - .02, 0], [1.25, y - .02, 0], dk(f, .25));
    } },
  { id: 'prop.story.stallsign', kind: 'prop', tags: ['story'], solid: false, size: [2.4, .1, .6], vb: [-.2, -.2, -.1, 2.6, .4, .9],
    draw() { qy(0, 2.4, .05, 0, .55, '#fff4dc', '#f1e2bd'); lw([0, .05, 0], [2.4, .05, 0], INK); lw([0, .05, .55], [2.4, .05, .55], INK); textY('THE LITTLE KETTLE', .12, .06, .4, '#b8443a'); } },
];
