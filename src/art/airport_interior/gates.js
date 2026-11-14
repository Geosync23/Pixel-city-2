// Gate lounges, windows onto the apron, moving walkways, flight boards, hanging signs, floor decals, structure (furn.airport.*).
import { box, qy, qx, qz, fq, lw, lit, glow, cyl, dk, lt, mix, rng, signY, signX, textY } from '../../engine/raster.js';
import { WH, GR, STEEL, DARK, TEAL, YEL, NAVY, RED, GREEN, BAGC, T, SKY, wp, we, rowsY, screenY, counter } from './_lib.js';

const LIV = ['#d2412f', '#2f6fb0', '#2f8f96', '#e08a2c', '#8a5aa8', '#3fa45b'];
const STATC = { BOARDING: '#7df0a0', 'GO TO GATE': '#7df0a0', 'ON TIME': '#e8f0ff', DELAYED: '#ff8a70', ARRIVED: '#9fd0ff', 'LAST CALL': '#ffd35a', CLOSED: '#ff8a70', LANDED: '#9fd0ff' };
const GLY = { B: '65656', A: '25755', C: '34443', 0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716' };
function floorText(str, x, y, s, c) { for (let i = 0; i < str.length; i++) { const g = GLY[str[i]]; if (!g) continue; for (let r = 0; r < 5; r++) for (let b = 0; b < 3; b++) if (+g[r] & (4 >> b)) qz(x + (i * 4 + b) * s, x + (i * 4 + b + 1) * s, y + r * s, y + (r + 1) * s, .012, c); } }

/** the apron seen through a terminal window, painted on the wall plane */
function view(kind, w, Y, z0, z1, S, liv, r) {
  const hz = z0 + (z1 - z0) * .34, body = S.body, sh = dk(S.gnd, .22);
  qy(0, w, Y, hz, z1, S.top); qy(0, w, Y, hz, hz + .3, S.lo); qy(0, w, Y, hz + .3, hz + .55, S.lo, S.top);
  if (!S.n) { we(Y, w * .2 + r() * w * .5, z1 - .45, .5, .09, '#ffffff'); we(Y, w * .5 + r() * w * .4, z1 - .7, .32, .06, '#f4fbff'); } else lit(() => { for (let i = 0; i < 7; i++) we(Y, r() * w, hz + .7 + r() * (z1 - hz - .8), .012, .012, '#fff6d8'); });
  wp(Y, [[0, hz], [w, hz], [w, hz + .1], [w * .7, hz + .16], [w * .35, hz + .08], [0, hz + .14]], mix(S.gnd, S.top, .55));
  qy(0, w, Y, z0, hz, S.gnd); qy(0, w, Y, hz - .12, hz, S.gnd2); wp(Y, [[0, z0 + .3], [w, z0 + .42], [w, z0 + .46], [0, z0 + .34]], S.line);
  if (S.n) lit(() => { for (let x = .2; x < w; x += .45) we(Y, x, hz - .04, .02, .02, '#6ea8ff'); });
  const gz = z0 + .22;
  if (kind === 'nose') {
    const cx = w / 2, fz = gz + .78, rr = .56;
    we(Y, cx, gz, 1.7, .07, sh);
    wp(Y, [[cx - .9, fz + .72], [cx + .9, fz + .72], [cx + .1, fz + .84], [cx - .1, fz + .84]], dk(body, .18));
    wp(Y, [[cx - .08, fz + .4], [cx + .08, fz + .4], [cx + .05, fz + 1.5], [cx - .05, fz + 1.5]], liv);
    for (const s of [-1, 1]) {
      wp(Y, [[cx + s * .4, fz - .22], [cx + s * 1.95, fz + .02], [cx + s * 1.95, fz + .09], [cx + s * .4, fz + .06]], dk(body, .14)); wp(Y, [[cx + s * 1.9, fz + .05], [cx + s * 1.97, fz + .05], [cx + s * 1.99, fz + .3], [cx + s * 1.95, fz + .3]], liv);
      lw([cx + s * 1.05, Y, fz - .1], [cx + s * 1.05, Y, fz - .2], dk(body, .4)); we(Y, cx + s * 1.05, fz - .36, .21, .21, dk(body, .2)); we(Y, cx + s * 1.05, fz - .36, .15, .15, '#2a3140'); we(Y, cx + s * 1.05, fz - .36, .04, .04, STEEL);
      lw([cx + s * .42, Y, fz - .3], [cx + s * .42, Y, gz + .05], '#3a4250'); we(Y, cx + s * .42, gz + .06, .07, .08, '#1f2630');
    }
    we(Y, cx, fz, rr, rr, body); we(Y, cx, fz - .24, rr * .8, rr * .5, dk(body, .1)); wp(Y, [[cx - rr * .97, fz - .04], [cx + rr * .97, fz - .04], [cx + rr * .93, fz - .13], [cx - rr * .93, fz - .13]], liv);
    wp(Y, [[cx - .36, fz + .2], [cx + .36, fz + .2], [cx + .27, fz + .36], [cx - .27, fz + .36]], '#27303c'); if (S.n) lit(() => wp(Y, [[cx - .3, fz + .23], [cx + .3, fz + .23], [cx + .24, fz + .33], [cx - .24, fz + .33]], '#ffe2a0')); lw([cx, Y, fz + .2], [cx, Y, fz + .36], body); lw([cx - .2, Y, fz + .2], [cx - .16, Y, fz + .36], body); lw([cx + .2, Y, fz + .2], [cx + .16, Y, fz + .36], body);
    we(Y, cx, fz - .05, .05, .05, dk(body, .25)); lw([cx, Y, fz - rr], [cx, Y, gz + .05], '#3a4250'); we(Y, cx - .06, gz + .05, .05, .07, '#1f2630'); we(Y, cx + .06, gz + .05, .05, .07, '#1f2630');
    if (S.n) lit(() => { we(Y, cx, fz + 1.5, .03, .03, '#ff5a4a'); we(Y, cx - 1.95, fz + .3, .025, .025, '#ff5a4a'); we(Y, cx + 1.95, fz + .3, .025, .025, '#7df0a0'); });
  } else if (kind === 'tail') {
    const fz = gz + .8, a = w * .52, b = w * .82;
    we(Y, w * .35, gz, w * .5, .07, sh);
    wp(Y, [[a - .1, fz + .25], [a + .5, fz + 1.35], [b + .05, fz + 1.35], [b - .25, fz + .2]], liv); wp(Y, [[a + .35, fz + 1.0], [b - .05, fz + 1.0], [b - .1, fz + .8], [a + .25, fz + .8]], lt(liv, .35));
    wp(Y, [[0, fz - .3], [a, fz - .3], [b, fz + .02], [b, fz + .14], [a, fz + .3], [0, fz + .3]], body); wp(Y, [[0, fz - .3], [a, fz - .3], [b - .2, fz - .04], [0, fz - .1]], dk(body, .1)); wp(Y, [[0, fz - .02], [a + .2, fz - .02], [a + .3, fz + .04], [0, fz + .04]], liv);
    for (let x = .15; x < a - .1; x += .22) { wp(Y, [[x, fz + .1], [x + .08, fz + .1], [x + .08, fz + .2], [x, fz + .2]], S.n ? '#3a4250' : '#27303c'); if (S.n && r() < .6) lit(() => wp(Y, [[x, fz + .1], [x + .08, fz + .1], [x + .08, fz + .2], [x, fz + .2]], '#ffe2a0')); }
    wp(Y, [[a + .15, fz + .08], [b + .25, fz + .16], [b + .25, fz + .1], [a + .15, fz + .0]], dk(body, .22));
    wp(Y, [[0, fz - .34], [w * .3, fz - .34], [w * .34, fz - .5], [0, fz - .58]], dk(body, .16)); we(Y, w * .16, fz - .55, .3, .15, dk(body, .25)); we(Y, w * .16 + .27, fz - .55, .05, .12, '#2a3140');
    lw([w * .26, Y, fz - .4], [w * .26, Y, gz + .05], '#3a4250'); we(Y, w * .26, gz + .07, .09, .09, '#1f2630');
  } else if (kind === 'tug') {
    let x = w * .14; box0(Y, x, gz, .5, .32, YEL); wp(Y, [[x + .08, gz + .32], [x + .34, gz + .32], [x + .34, gz + .52], [x + .12, gz + .52]], '#27303c'); x += .62;
    for (let i = 0; i < 3 && x + .6 < w; i++, x += .68) { lw([x - .1, Y, gz + .1], [x, Y, gz + .1], '#3a4250'); box0(Y, x, gz + .04, .58, .08, '#59616e'); for (let k = 0; k < 3; k++) box0(Y, x + .03 + k * .18, gz + .12, .16, .14 + r() * .12, BAGC[Math.floor(r() * BAGC.length)]); we(Y, x + .12, gz + .03, .05, .05, '#1f2630'); we(Y, x + .46, gz + .03, .05, .05, '#1f2630'); }
    wp(Y, [[w * .62, hz], [w * .62, hz + .28], [w * .98, hz + .28], [w * .98, hz]], mix(S.gnd2, S.top, .35)); if (S.n) lit(() => { for (let q = w * .65; q < w * .96; q += .12) we(Y, q, hz + .16, .02, .03, '#ffe2a0'); });
  } else if (kind === 'takeoff') {
    const px = w * .55, pz = hz + (z1 - hz) * .55; wp(Y, [[0, hz - .2], [w, hz - .14], [w, hz - .08], [0, hz - .14]], dk(S.gnd, .2));
    wp(Y, [[px - .1, pz - .05], [px - 1.4, pz - .5], [px - 1.4, pz - .46], [px - .1, pz + .02]], mix(S.top, '#ffffff', .5));
    wp(Y, [[px - .45, pz - .16], [px + .35, pz + .12], [px + .47, pz + .2], [px + .35, pz + .24], [px - .5, pz - .06]], body); wp(Y, [[px - .5, pz - .06], [px - .45, pz - .16], [px - .58, pz + .12], [px - .5, pz + .14]], liv); wp(Y, [[px - .1, pz - .02], [px + .08, pz + .05], [px - .22, pz - .22], [px - .3, pz - .22]], dk(body, .25));
    if (S.n) lit(() => we(Y, px + .44, pz + .2, .03, .03, '#ffffff'));
  } else { // tower: quiet apron with the control tower and far terminal
    const tx = w * .3; wp(Y, [[tx - .06, hz], [tx + .06, hz], [tx + .05, hz + .9], [tx - .05, hz + .9]], mix(body, S.top, .35)); wp(Y, [[tx - .16, hz + .9], [tx + .16, hz + .9], [tx + .2, hz + 1.08], [tx - .2, hz + 1.08]], '#3a5a78'); wp(Y, [[tx - .18, hz + 1.08], [tx + .18, hz + 1.08], [tx + .1, hz + 1.16], [tx - .1, hz + 1.16]], mix(body, S.top, .2)); if (S.n) lit(() => wp(Y, [[tx - .14, hz + .94], [tx + .14, hz + .94], [tx + .16, hz + 1.04], [tx - .16, hz + 1.04]], '#9fe0d0'));
    wp(Y, [[w * .55, hz], [w * .55, hz + .22], [w, hz + .22], [w, hz]], mix(S.gnd2, S.top, .4)); lw([w * .55, Y, hz + .22], [w, Y, hz + .22], mix(body, S.top, .3));
    const bx = w * .6; box0(Y, bx, gz, .9, .2, body); wp(Y, [[bx + .1, gz + .2], [bx + .3, gz + .2], [bx + .25, gz + .34], [bx + .12, gz + .34]], '#27303c'); box0(Y, bx, gz + .05, .9, .05, liv); we(Y, bx + .2, gz, .06, .06, '#1f2630'); we(Y, bx + .7, gz, .06, .06, '#1f2630');
  }
}
function box0(Y, x, z, w, h, c) { wp(Y, [[x, z], [x + w, z], [x + w, z + h], [x, z + h]], c); }

export default [
  { id: 'furn.airport.window', kind: 'furniture', tags: T(['window', 'apron_view']), wall: true, mount: 0, solid: false, size: p => [p.w || 4, .1, p.h || 3.6],
    variants: [{ view: 'nose', liv: 0 }, { view: 'tail', liv: 1 }, { view: 'tug' }, { view: 'tower' }, { view: 'takeoff', liv: 3 }, { view: 'nose', liv: 2, sky: 2 }, { view: 'tail', liv: 4, sky: 1 }],
    draw(p) {
      const w = p.w || 4, H = p.h || 3.6, Y = .05, z0 = .45, z1 = H - .3, S = SKY(p.sky || 0), r = rng((p.seed || 1) * 7 + 3);
      qy(0, w, Y, 0, H, WH); view(p.view || 'tower', w, Y + .01, z0, z1, S, LIV[(p.liv || 0) % LIV.length], r);
      const F = '#4a5462', Y2 = Y + .02; qy(0, w, Y2, 0, z0, '#dfe4e9'); qy(0, w, Y2, z0 - .08, z0, STEEL); qy(0, w, Y2, z1, H, '#dfe4e9'); qy(0, w, Y2, z1, z1 + .06, F);
      for (let x = 0; x <= w + .01; x += w / Math.round(w / 1.34)) { const a = Math.min(w - .05, Math.max(0, x - .025)); qy(a, a + .05, Y2, z0, z1, F); }
      lw([0, Y2, z0 + (z1 - z0) * .62], [w, Y2, z0 + (z1 - z0) * .62], F); lw([.2, Y2, z1 - .15], [.75, Y2, z1 - .75], '#ffffff'); lw([.4, Y2, z1 - .15], [.75, Y2, z1 - .5], '#e8f6fb');
      qy(.2, w - .2, Y2, .08, .3, '#c9d0d6'); for (let x = .3; x < w - .3; x += .12) lw([x, Y2, .1], [x, Y2, .28], '#aab3be');
    } },
  { id: 'furn.airport.seats', kind: 'furniture', tags: T(['lounge_seat', 'gate_seat']), size: p => [(p.n || 4) * .5 + (p.post ? .3 : 0), .2, .95], vb: p => [0, p.back ? -.5 : -.02, 0, (p.n || 4) * .5 + (p.post ? .3 : 0), p.back ? .22 : .68, p.post ? 1.25 : 1.0],
    variants: [{ n: 4 }, { n: 5, post: 1, c: '#2f8f96' }, { n: 4, back: 1 }, { n: 3, c: '#e08a2c', post: 1, back: 1 }],
    seats: p => Array.from({ length: p.n || 4 }, (_, i) => ({ x: i * .5 + .25, y: p.back ? -.22 : .38, z: .44, dir: p.back ? 3 : 1 })),
    draw(p) {
      const n = p.n || 4, c = p.c || '#3b5a8c', w = n * .5, bk = !!p.back;
      const cush = () => { for (let i = 0; i < n; i++) { const x = i * .5 + .03, y = bk ? -.46 : .14; box(x, y, .32, .44, .46, .12, lt(c, .06), { ol: false }); if (!bk) qy(x, x + .44, .6, .32, .44, dk(c, .3)); } for (let i = 0; i <= n; i++) { const x = Math.min(w - .05, Math.max(0, i * .5 - .025)); box(x, bk ? -.42 : .12, .44, .05, .44, .12, '#59616e', { ol: false }); } };
      const back = () => { box(.05, .04, .2, w - .1, .08, .14, STEEL, { ol: false }); for (let i = 0; i < n; i++) { box(i * .5 + .03, .02, .4, .44, .12, .52, c, { ol: false }); lw([i * .5 + .03, .14, .92], [i * .5 + .47, .14, .92], lt(c, .3)); if (bk) lw([i * .5 + .03, .14, .4], [i * .5 + .03, .14, .92], dk(c, .4)); } };
      const legs = () => { for (const x of [.1, w - .18]) { box(x, bk ? -.3 : .05, 0, .08, .5, .06, '#59616e', { ol: false }); box(x, bk ? -.12 : .22, 0, .08, .08, .34, STEEL, { ol: false }); } };
      legs(); if (bk) { cush(); back(); } else { back(); cush(); }
      if (p.post) { box(w + .06, bk ? -.2 : .12, 0, .18, .18, 1.1, DARK); lit(() => { qy(w + .09, w + .21, bk ? -.02 : .3, .8, .88, '#7df0a0'); qy(w + .09, w + .21, bk ? -.02 : .3, .62, .7, '#8fd0ff'); }); box(w + .03, bk ? -.23 : .09, 1.1, .24, .24, .06, TEAL, { ol: false }); }
    } },
  { id: 'furn.airport.gatedesk', kind: 'furniture', tags: T(['gate_desk', 'desk']), size: [2, .6, 1.1], vb: [0, 0, 0, 2, .6, 1.6], staff: { x: 1, y: -.4, dir: 1 }, use: { x: 1, y: 1.15 }, variants: [{ text: 'B4' }, { text: 'B6', c: '#2f8f96' }],
    draw(p) {
      const c = p.c || NAVY; counter(0, 0, 2, .6, 1.05, c, WH); qy(.1, 1.9, .6, .2, .9, lt(c, .08)); lit(() => qy(.1, 1.9, .6, .9, .96, '#8fe0e8')); signY(p.text || 'B4', .65, 1.35, .61, .35, .8, WH, c, { lit: true });
      box(.3, .1, 1.05, .45, .12, .34, '#1c222b', { ol: false }); lit(() => qy(.33, .72, .1, 1.1, 1.36, '#8fd0ff')); box(1.35, .15, 1.05, .3, .25, .1, '#59616e', { ol: false }); box(1.75, .2, 1.05, .08, .08, .45, STEEL, { ol: false }); lit(() => qy(1.72, 1.86, .3, 1.42, 1.5, '#7df0a0'));
    } },
  { id: 'furn.airport.gatesign', kind: 'furniture', tags: T(['gate_sign']), wall: true, mount: 2.5, solid: false, size: [3, .1, 1], variants: [{ gate: 'B4', text: 'PARIS', status: 'BOARDING' }, { gate: 'B2', text: 'TOKYO', status: 'DELAYED' }],
    draw(p) {
      const Y = .08, sc = STATC[p.status || 'ON TIME'] || '#e8f0ff'; box(0, 0, 0, 3, .08, 1, '#1c222b', { ol: false });
      lit(() => { qy(.05, 2.95, Y, .05, .95, '#18202c'); qy(.08, .78, Y, .12, .88, YEL); qy(.86, 2.92, Y, .5, .52, '#3a4658'); });
      lit(() => { textY(p.gate || 'B4', .2, Y + .01, .68, '#1c222b'); textY((p.text || 'PARIS').slice(0, 8), .92, Y + .01, .93, '#ffffff'); textY((p.status || 'ON TIME').slice(0, 8), .92, Y + .01, .44, sc); });
    } },
  { id: 'furn.airport.gatedoor', kind: 'furniture', tags: T(['boarding_door', 'door']), wall: true, mount: 0, solid: false, size: [2, .1, 2.5], variants: [{}, { open: 1 }],
    draw(p) {
      const Y = .06; qy(0, 2, Y, 0, 2.5, '#dfe4e9'); qy(.2, 1.8, Y, 0, 2.05, '#59616e');
      if (p.open) { qy(.25, 1.75, Y + .01, 0, 2, '#7d8794'); glow(() => qy(.25, 1.75, Y + .01, 0, 2, '#ffe9b8')); wp(Y + .02, [[.25, 0], [1.75, 0], [1.4, .35], [.6, .35]], '#4a5a78'); wp(Y + .02, [[.6, .35], [1.4, .35], [1.4, 1.6], [.6, 1.6]], '#aab3be'); wp(Y + .02, [[.75, .35], [1.25, .35], [1.25, 1.45], [.75, 1.45]], '#d9e6ee'); }
      else { qy(.25, .98, Y + .01, 0, 2, '#b4d6e2', '#c6e2ec'); qy(1.02, 1.75, Y + .01, 0, 2, '#b4d6e2', '#c6e2ec'); qy(.25, 1.75, Y + .01, 0, .3, STEEL); lw([.45, Y + .01, 1.8], [.8, Y + .01, 1.3], '#ffffff'); qy(.9, .96, Y + .02, .9, 1.2, '#59616e'); qy(1.04, 1.1, Y + .02, .9, 1.2, '#59616e'); }
      lit(() => qy(.3, 1.7, Y + .02, 2.12, 2.2, p.open ? GREEN : '#ff8a70')); signY('BOARDING', .25, 1.75, Y + .02, 2.24, 2.46, '#1c222b', p.open ? '#7df0a0' : '#8e9aaa', { lit: true });
    } },
  { id: 'furn.airport.totem', kind: 'furniture', tags: T(['gate_totem']), size: [.5, .5, 2.6], variants: [{ text: 'B4' }, { text: 'B7', c: '#2f8f96' }],
    draw(p) { const c = p.c || DARK; box(.1, .1, 0, .3, .3, 2.6, c); box(.05, .05, 0, .4, .4, .12, STEEL, { ol: false }); lit(() => { qy(.1, .4, .4, 1.95, 2.5, YEL); qx(.4, .1, .4, 1.95, 2.5, dk(YEL, .12)); }); lit(() => textY(p.text || 'B4', .13, .41, 2.38, '#1c222b')); lit(() => qy(.14, .36, .4, 1.6, 1.85, '#8fd0ff')); qy(.1, .4, .4, .2, .28, TEAL); } },
  { id: 'furn.airport.walkway', kind: 'furniture', tags: T(['walkway', 'moving_walkway']), flat: true, solid: false, frames: 4, size: p => [p.len || 8, 1, .04], variants: [{ len: 8, dir: 1 }, { len: 8, dir: -1, frame: 2 }],
    draw(p) {
      const L = p.len || 8, d = p.dir < 0 ? -1 : 1, f = (p.frame || 0) / 4 * .5;
      qz(-.1, L + .1, -.05, 1.05, .005, '#59616e');
      qz(0, L, 0, 1, .01, (x, y) => { if (y < .07 || y > .93) return YEL; if (x < .3 || x > L - .3) return ((Math.floor(y * 16) & 1) ? '#aab3be' : '#7d8794'); const s = (((x * d - f) % .5) + .5) % .5; const ch = (((x * d - f) % 2) + 2) % 2; if (Math.abs(ch - 1 + (.5 - Math.abs(y - .5)) * .8) < .09 && y > .2 && y < .8) return '#8e9aaa'; return s < .06 ? '#4f5968' : '#3a4250'; });
    } },
  { id: 'furn.airport.walkway.rail', kind: 'furniture', tags: T(['walkway']), size: p => [p.len || 8, p.d || .3, 1], variants: [{ len: 8 }, { len: 6, d: .5 }],
    draw(p) {
      const L = p.len || 8, d = p.d || .3, ys = p.at !== undefined ? [p.at] : d > .4 ? [.06, d - .14] : [d / 2 - .04];
      box(0, 0, 0, L, d, .12, STEEL, { ol: false });
      for (const y of ys) { qy(.05, L - .05, y + .04, .12, .92, '#bfe3ee', 'glass'); for (let x = 0; x <= L; x += 2) lw([Math.min(x, L - .02), y + .04, .12], [Math.min(x, L - .02), y + .04, .92], '#8e9aaa'); box(0, y, .92, L, .08, .08, '#1f2630', { ol: false }); lw([0, y + .08, 1.0], [L, y + .08, 1.0], '#59616e'); }
      box(L - .12, 0, 0, .12, d, .6, STEEL, { ol: false }); box(0, 0, 0, .12, d, .6, STEEL, { ol: false });
    } },
  { id: 'furn.airport.fids', kind: 'furniture', tags: T(['fids', 'flight_board']), size: p => [p.w || 3, .4, 2.75], variants: [{ w: 3, rows: [['1420 LISBON', '#7df0a0'], ['1435 TOKYO'], ['1450 PARIS', '#ff8a70']] }, { w: 5, title: 'DEPARTURES', rows: [['1420 LISBON  B6 BOARD', '#7df0a0'], ['1435 TOKYO   B2 ON TIME'], ['1450 PARIS   B4 DELAYED', '#ff8a70'], ['1505 OSLO    B5 ON TIME']] }],
    draw(p) {
      const w = p.w || 3, nc = Math.floor((w * 16 - 8) / 4), rows = (p.rows || []).slice(0, 3).map(r => [String(r[0]).slice(0, nc), r[1] || '#e8f0ff']);
      box(.15, .12, 0, .16, .16, 1.0, STEEL, { ol: false }); box(w - .31, .12, 0, .16, .16, 1.0, STEEL, { ol: false }); box(0, .05, 0, w, .3, .08, '#59616e', { ol: false });
      box(0, .08, .95, w, .24, 1.8, '#1c222b'); lit(() => { qy(.06, w - .06, .32, 1.0, 2.7, '#18202c'); qy(.06, w - .06, .32, 2.38, 2.7, YEL); qy(.06, w - .06, .32, 1.46, 1.9, '#1f2a3a'); });
      lit(() => textY((p.title || 'DEPARTURES').slice(0, nc), .12, .33, 2.63, '#1c222b')); rowsY(rows, .12, .33, 2.25, .43);
      qx(w, .08, .32, .95, 2.75, '#11161d');
    } },
  { id: 'furn.airport.sign', kind: 'furniture', tags: T(['sign', 'wayfinding', 'overhead']), solid: false, overhead: true, size: p => [p.w || 4, .15, .6], vb: p => [0, 0, 0, p.w || 4, .15, 1.6],
    variants: [{ text: 'BAGGAGE CLAIM >' }, { text: '< TRAM', w: 3, c: '#2f8f96' }, { text: 'GATES B1-B6', w: 4 }, { text: 'ARRIVALS ^', w: 3.5, c: '#3fa45b' }],
    draw(p) {
      const w = p.w || 4; for (const x of [.3, w - .3]) lw([x, .08, .6], [x, .08, 1.6], '#7d8794');
      box(0, 0, 0, w, .15, .6, '#1c222b', { ol: false }); lit(() => { qy(.04, w - .04, .15, .04, .56, '#1f2630'); qy(.04, .5, .15, .04, .56, p.c || YEL); }); signY(p.text || 'EXIT', .55, w - .05, .151, .08, .52, '#1f2630', '#fff2c4', { lit: true, frame: false }); qx(w, 0, .15, 0, .6, '#11161d');
    } },
  { id: 'furn.airport.decal', kind: 'furniture', tags: T(['decal']), flat: true, solid: false, size: p => [p.w || 2, p.d || 1, .02],
    variants: [{ kind: 'gate', text: 'B4', w: 2, d: 1 }, { kind: 'arrow', w: 2, d: 1, dir: 1 }, { kind: 'carpet', w: 6, d: 4 }, { kind: 'line', w: 6, d: .5 }, { kind: 'carpet', w: 6, d: 4, c: '#7a4e6a', c2: '#e0a04a' }],
    draw(p) {
      const w = p.w || 2, d = p.d || 1, k = p.kind || 'gate', c = p.c || TEAL;
      if (k === 'gate') { qz(0, w, 0, d, .01, c); qz(.06, w - .06, .06, d - .06, .011, dk(c, .18)); const s = Math.min((w - .3) / ((p.text || 'B4').length * 4 - 1), (d - .3) / 5); floorText(p.text || 'B4', (w - ((p.text || 'B4').length * 4 - 1) * s) / 2, (d - 5 * s) / 2, s, '#ffffff'); }
      else if (k === 'arrow') { const dr = p.dir < 0 ? -1 : 1, m = d / 2, a = dr > 0 ? w - .1 : .1, b = dr > 0 ? w - .7 : .7, t = dr > 0 ? .15 : w - .15; qz(Math.min(t, b), Math.max(t, b), m - .12, m + .12, .012, p.c || YEL); fq([[a, m, .012], [b, m - .38, .012], [b, m + .38, .012]], p.c || YEL); }
      else if (k === 'line') qz(0, w, d / 2 - .06, d / 2 + .06, .012, p.c || YEL);
      else { const c2 = p.c2 || lt(c, .38), c3 = dk(c, .22), c4 = lt(c, .14); qz(0, w, 0, d, .01, (x, y) => { if (x < .12 || y < .12 || x > w - .12 || y > d - .12) return c3; const u = Math.floor((x + y) * 4), v = Math.floor((x - y + 80) * 4); if ((u % 12 === 0) || (v % 12 === 0)) return c2; return (((u / 2 | 0) + (v / 2 | 0)) & 1) ? c : c4; }); }
    } },
  { id: 'furn.airport.column', kind: 'furniture', tags: T(['column']), size: p => [.5, .5, p.h || 3.6], variants: [{}, { h: 3 }],
    draw(p) { const h = p.h || 3.6; cyl(.25, .25, 0, .2, h, WH); cyl(.25, .25, 0, .24, .15, STEEL, { ol: false }); cyl(.25, .25, 1.0, .21, .12, TEAL, { ol: false }); cyl(.25, .25, h - .3, .28, .3, '#dfe4e9', { ol: false }); glow(() => cyl(.25, .25, h - .42, .21, .1, '#fff2c4', { ol: false })); } },
  { id: 'furn.airport.partition', kind: 'furniture', tags: T(['partition']), size: p => [p.len || 4, .3, p.h || 2.4], variants: [{ len: 4 }, { len: 6, text: 'BAGGAGE CLAIM' }],
    draw(p) {
      const L = p.len || 4, h = p.h || 2.4; box(0, .05, 0, L, .2, .5, '#dfe4e9', { ol: false }); box(0, .1, .5, L, .1, h - .62, '#cfe6ee', { l: '#cfe6ee', l2: '#e3f1f5', r: '#b9d6e0', t: '#e3f1f5', ol: false }); box(0, .05, h - .12, L, .2, .12, STEEL, { ol: false });
      for (let x = 0; x <= L + .01; x += L / Math.max(1, Math.round(L / 2))) { const a = Math.min(L - .08, Math.max(0, x - .04)); box(a, .05, 0, .08, .2, h, STEEL, { ol: false }); }
      qy(0, L, .25, .0, .08, '#59616e'); qy(0, L, .25, 1.1, 1.16, '#ffffff'); if (p.text) signY(p.text, .3, Math.min(L - .3, .3 + p.text.length * .27 + .3), .26, h - .75, h - .3, '#1c222b', '#ffd98a', { lit: true });
      lw([0, .25, h], [L, .25, h], '#59616e'); lw([L, .05, h], [L, .25, h], '#59616e');
    } },
  { id: 'furn.airport.barrier', kind: 'furniture', tags: T(['barrier', 'rail']), size: p => [p.len || 4, .15, .95], variants: [{ len: 4 }, { len: 6 }],
    draw(p) { const L = p.len || 4; qy(.05, L - .05, .1, .1, .82, '#bfe3ee', 'glass'); for (let x = 0; x <= L + .01; x += L / Math.max(1, Math.round(L / 1.5))) { const a = Math.min(L - .1, Math.max(0, x - .05)); box(a, .02, 0, .1, .1, .9, STEEL, { ol: false }); } box(0, 0, .86, L, .15, .08, '#59616e', { ol: false }); lw([0, .15, .94], [L, .15, .94], '#aab3be'); lw([0, .1, .1], [L, .1, .1], '#8e9aaa'); } },
];
