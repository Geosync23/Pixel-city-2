// Aircraft cabin cutaway, jet bridge mouth and the automated tram car (furn.airport.cabin.* / .jetbridge / .tram.*).
import { box, qy, qx, qz, fq, lw, lit, glow, cyl, dk, lt, mix, rng, signY, textY } from '../../engine/raster.js';
import { WH, GR, STEEL, DARK, TEAL, YEL, NAVY, RED, GREEN, T, SKY, wp, we, rowsY, screenY } from './_lib.js';

const CAB = '#e6eaee', CARPET = '#34466e';
export default [
  { id: 'furn.airport.cabin.wall', kind: 'furniture', tags: T(['cabin']), wall: true, mount: 0, solid: false, size: p => [p.n || 4, .1, 2.2], variants: [{ n: 4 }, { n: 4, sky: 2 }],
    draw(p) {
      const n = p.n || 4, S = SKY(p.sky || 0), r = rng((p.seed || 3) + n), Y = .05;
      qy(0, n, Y, 0, 2.2, CAB); qy(0, n, Y, 0, .45, '#bcc6d2'); qy(0, n, Y, .45, .5, '#8e9aaa'); qy(0, n, Y, 1.75, 2.2, dk(CAB, .12));
      for (let i = 0; i < n; i++) {
        const cx = i + .5; lw([i, Y, .5], [i, Y, 1.75], dk(CAB, .14));
        we(Y, cx, 1.12, .2, .3, '#f8fafb'); we(Y, cx, 1.12, .15, .25, S.top); wp(Y, [[cx - .14, .98], [cx + .14, .98], [cx + .1, .9], [cx - .1, .9]], S.gnd);
        if (S.n) lit(() => we(Y, cx + .04, 1.0, .02, .02, '#ffd98a')); else we(Y, cx - .04, 1.2, .05, .03, '#ffffff');
        if (r() < .22) wp(Y, [[cx - .14, 1.37], [cx + .14, 1.37], [cx + .15, 1.12], [cx - .15, 1.12]], '#dfe4e9');
      }
    } },
  { id: 'furn.airport.cabin.door', kind: 'furniture', tags: T(['cabin', 'door']), wall: true, mount: 0, solid: false, size: [1.5, .1, 2.2], variants: [{}],
    draw() {
      const Y = .05; qy(0, 1.5, Y, 0, 2.2, CAB); qy(.2, 1.3, Y, 0, 1.9, '#59616e');
      wp(Y, [[.25, .0], [1.25, .0], [1.05, .25], [.45, .25]], '#7d8794'); wp(Y, [[.25, 0], [.45, .25], [.45, 1.6], [.25, 1.85]], '#aab3be'); wp(Y, [[1.25, 0], [1.05, .25], [1.05, 1.6], [1.25, 1.85]], '#959fab'); wp(Y, [[.45, 1.6], [1.05, 1.6], [1.25, 1.85], [.25, 1.85]], '#c4ccd4');
      glow(() => wp(Y, [[.45, .25], [1.05, .25], [1.05, 1.6], [.45, 1.6]], '#ffe9b8')); wp(Y, [[.5, .25], [1.0, .25], [1.0, 1.55], [.5, 1.55]], '#d9e6ee'); lit(() => wp(Y, [[.6, 1.3], [.9, 1.3], [.9, 1.5], [.6, 1.5]], '#fff6d8'));
      box(-.08, .05, .05, .26, .1, 1.85, '#dfe4e9'); we(.16, .05, 1.25, .07, .1, '#8fc9ea'); qy(-.04, .14, .16, .8, .86, RED);
      signY('EXIT', .45, 1.05, Y + .01, 1.95, 2.15, '#1c5a36', '#d8ffe4', { lit: true });
    } },
  { id: 'furn.airport.cabin.bulkhead', kind: 'furniture', tags: T(['cabin']), wall: true, mount: 0, solid: false, size: p => [p.w || 2, .1, 2.2], variants: [{ w: 2 }],
    draw(p) { const w = p.w || 2, Y = .05; qy(0, w, Y, 0, 2.2, '#d9dfe5'); qy(0, w, Y, 0, .45, '#bcc6d2'); qy(w / 2 - .4, w / 2 + .4, Y, 0, 1.8, '#c3ccd6'); lw([w / 2 - .4, Y, 0], [w / 2 - .4, Y, 1.8], '#7d8794'); lw([w / 2 + .4, Y, 0], [w / 2 + .4, Y, 1.8], '#7d8794'); lw([w / 2 - .4, Y, 1.8], [w / 2 + .4, Y, 1.8], '#7d8794'); qy(w / 2 + .22, w / 2 + .3, Y, .85, .95, '#59616e'); lit(() => qy(w / 2 - .2, w / 2 + .2, Y, 1.86, 2.0, '#3fa45b')); } },
  { id: 'furn.airport.cabin.seats', kind: 'furniture', tags: T(['cabin', 'plane_seat']), size: [.2, 1.5, 1.2], vb: [0, -.05, 0, .72, 1.56, 1.3], variants: [{}, { c: '#2f7f86' }],
    seats: [0, 1, 2].map(i => ({ x: .4, y: i * .5 + .25, z: .44, dir: 0 })),
    draw(p) {
      const c = p.c || '#3b5a8c';
      qx(.12, 0, 1.5, 0, .22, '#59616e');
      for (let i = 0; i < 3; i++) { const y = i * .5 + .04; box(0, y, .22, .15, .42, .86, c, { ol: false }); box(0, y + .04, 1.0, .16, .34, .2, lt(c, .12), { ol: false }); qx(.16, y + .06, y + .36, 1.02, 1.17, '#edf0f3'); }
      for (let i = 0; i < 3; i++) { const y = i * .5 + .04; box(.15, y, .3, .47, .42, .14, lt(c, .06), { ol: false }); qx(.62, y, y + .42, .3, .44, dk(c, .3)); }
      for (let i = 0; i <= 3; i++) { const y = Math.min(1.44, Math.max(0, i * .5 - .03)); box(.15, y, .44, .42, .06, .14, '#7d8794', { ol: false }); }
      lw([0, 1.5, .22], [0, 1.5, 1.08], dk(c, .5)); lw([.15, 1.5, 1.08], [.15, 1.5, .44], dk(c, .5));
    } },
  { id: 'furn.airport.cabin.bins', kind: 'furniture', tags: T(['cabin', 'overhead']), solid: false, overhead: true, size: p => [p.len || 4, .6, .45], variants: [{ len: 4 }, { len: 4, open: 1 }],
    draw(p) {
      const L = p.len || 4, r = rng((p.seed || 1) + L), n = Math.round(L / 1.25), w = L / n;
      box(0, 0, 0, L, .6, .45, '#f3f5f7', { ol: false }); qy(0, L, .6, 0, .08, '#aab3be'); lw([0, .6, .45], [L, .6, .45], '#ffffff'); lw([0, .6, 0], [L, .6, 0], '#7d8794');
      for (let i = 0; i < n; i++) { const x = i * w; lw([x, .6, .08], [x, .6, .45], '#b8c0ca'); qy(x + w / 2 - .12, x + w / 2 + .12, .6, .12, .16, '#7d8794'); if (p.open && r() < .5) { qy(x + .06, x + w - .06, .6, .1, .42, '#3a4250'); qy(x + .15, x + .5, .6, .1, .3, ['#c0392b', '#2f6fb0', '#e08a2c'][i % 3]); } glow(() => qy(x + w * .3, x + w * .36, .6, .02, .06, '#fff2c4')); }
    } },
  { id: 'furn.airport.cabin.aisle', kind: 'furniture', tags: T(['cabin']), flat: true, solid: false, size: p => [p.len || 6, 1, .02], variants: [{ len: 6 }],
    draw(p) { const L = p.len || 6; qz(0, L, 0, 1, .01, (x, y) => (y < .08 || y > .92) ? '#22304a' : ((Math.floor(x * 4) + Math.floor(y * 4)) % 4 === 0 ? lt(CARPET, .12) : CARPET)); for (let x = .25; x < L; x += .5) { qz(x, x + .1, .02, .07, .012, '#b9e36a'); qz(x, x + .1, .93, .98, .012, '#b9e36a'); } } },
  { id: 'furn.airport.cabin.galley', kind: 'furniture', tags: T(['cabin', 'galley']), size: [1.5, 1, 2], variants: [{}],
    draw() {
      box(0, 0, 0, 1.5, 1, 2, '#cfd6dd'); qy(.05, .7, 1, .05, .95, '#aab3be'); qy(.78, 1.45, 1, .05, .95, '#aab3be'); lw([.05, 1, .5], [.7, 1, .5], '#7d8794'); lw([.78, 1, .5], [1.45, 1, .5], '#7d8794'); qy(.3, .45, 1, .7, .76, DARK); qy(1.05, 1.2, 1, .7, .76, DARK);
      qy(.05, 1.45, 1, 1.05, 1.6, '#59616e'); box(.15, .8, 1.05, .22, .2, .3, '#e8e2d4', { ol: false }); box(.5, .8, 1.05, .22, .2, .3, '#c0392b', { ol: false }); box(.95, .8, 1.05, .35, .2, .22, STEEL, { ol: false });
      qy(.05, 1.45, 1, 1.65, 1.95, '#e6eaee'); lit(() => qy(.1, 1.4, 1, 1.6, 1.64, '#fff2c4')); qx(1.5, .1, .9, .2, 1.8, '#b6bfc9');
    } },
  { id: 'furn.airport.jetbridge', kind: 'furniture', tags: T(['jetbridge', 'boarding_door']), size: [2, 1.5, 2.5], variants: [{ text: 'B1' }, { text: 'B4' }],
    draw(p) {
      box(0, 0, 0, .15, 1.5, 2.2, '#b9c2cc', { ol: false }); qz(.15, 1.85, 0, 1.5, .02, '#4a5a78'); qy(.15, 1.85, .1, 0, 2.2, '#2a3140');
      wp(.12, [[.5, .15], [1.5, .15], [1.5, 1.7], [.5, 1.7]], '#59616e'); glow(() => wp(.13, [[.6, .2], [1.4, .2], [1.4, 1.6], [.6, 1.6]], '#ffe9b8')); wp(.14, [[.65, .2], [1.35, .2], [1.35, 1.55], [.65, 1.55]], '#8b96a4');
      fq([[.15, .1, 2.2], [.5, .12, 1.7], [.5, .12, .15], [.15, .1, 0]], '#7d8794'); fq([[1.85, .1, 2.2], [1.5, .12, 1.7], [1.5, .12, .15], [1.85, .1, 0]], '#6a7482');
      for (let y = .3; y < 1.5; y += .3) lw([.15, y, .05], [.15, y, 2.2], '#8e9aaa');
      box(1.85, 0, 0, .15, 1.5, 2.2, '#c9d0d6', { r: (u, v) => u % 5 === 0 ? '#8e9aaa' : '#bcc5cf', ol: false }); box(0, 0, 2.2, 2, 1.5, .3, '#d9dfe5'); qy(0, 2, 1.5, 2.2, 2.5, TEAL);
      signY(p.text || 'B1', .6, 1.4, 1.52, 2.22, 2.48, '#1c222b', '#ffd98a', { lit: true }); qz(.15, 1.85, 1.3, 1.5, .03, YEL);
    } },
  /* ---- tram ---- */
  { id: 'furn.airport.tram.wall', kind: 'furniture', tags: T(['tram']), size: p => [p.len || 9, .25, 2.3], variants: [{ len: 9, doors: [3.7], text: 'MAIN TERMINAL' }],
    draw(p) {
      const L = p.len || 9, doors = p.doors || [3.7], dw = 1.6, Y = .25, spans = []; let a = 0;
      for (const d of doors) { spans.push([a, d]); a = d + dw; } spans.push([a, L]);
      for (const [x0, x1] of spans) {
        box(x0, 0, 0, x1 - x0, Y, .8, WH, { t: DARK, ol: false }); qy(x0, x1, Y, 0, .1, '#59616e'); qy(x0, x1, Y, .6, .72, TEAL);
        box(x0, 0, .8, .2, Y, 1.1, WH, { ol: false }); box(x1 - .2, 0, .8, .2, Y, 1.1, WH, { ol: false });
        qy(x0 + .2, x1 - .2, Y, .8, 1.9, '#bfe3ee', 'glass'); lw([x0 + .2, Y, .8], [x1 - .2, Y, .8], '#59616e'); lw([x0 + .2, Y, 1.9], [x1 - .2, Y, 1.9], '#59616e');
        for (let x = x0 + .2; x < x1 - .5; x += 1.4) { lw([x + .15, Y, 1.8], [x + .5, Y, 1.45], '#ffffff'); lw([x, Y, .8], [x, Y, 1.9], '#7d8794'); }
      }
      box(0, 0, 1.9, L, Y, .4, WH, { ol: false }); lw([0, Y, 1.9], [L, Y, 1.9], '#8e9aaa'); lw([0, Y, 2.3], [L, Y, 2.3], '#8e9aaa');
      for (const d of doors) { screenY(d + .1, d + dw - .1, Y + .01, 1.98, 2.22); rowsY([[(p.text || 'TERMINAL').slice(0, 6), '#7df0c0']], d + .14, Y + .02, 2.2); }
      lit(() => { for (let x = .6; x < L; x += 2.2) if (!doors.some(d => x > d - .7 && x < d + dw)) qy(x, x + .5, Y, 2.05, 2.12, '#fff6d8'); });
    } },
  { id: 'furn.airport.tram.door', kind: 'furniture', tags: T(['tram']), solid: false, size: [1.6, .1, 1.95], variants: [{ open: 0 }, { open: .5 }, { open: 1 }],
    draw(p) {
      const o = Math.max(0, Math.min(1, p.open || 0)) * .72;
      for (const s of [0, 1]) { const x0 = s ? .8 + o : 0, x1 = s ? 1.6 : .8 - o; if (x1 - x0 < .06) continue; qy(x0, x1, .05, 0, .75, TEAL); qy(x0, x1, .05, .75, 1.9, '#bfe3ee', 'glass'); const e = s ? x0 : x1; qy(Math.max(x0, e - .05), Math.min(x1, e + .05), .05, 0, 1.9, YEL); lw([x0, .05, .75], [x1, .05, .75], '#1d5f65'); lw([x0, .05, 1.9], [x1, .05, 1.9], '#59616e'); lw([x0, .05, 0], [x0, .05, 1.9], '#59616e'); lw([x1, .05, 0], [x1, .05, 1.9], '#59616e'); }
    } },
  { id: 'furn.airport.tram.end', kind: 'furniture', tags: T(['tram']), size: p => [.25, p.d || 4, 2.3], variants: [{ d: 4, text: 'TERMINAL' }],
    draw(p) {
      const d = p.d || 4; box(0, 0, 0, .25, d, 2.3, WH, { ol: false, t: DARK }); qx(.25, 0, d, 0, .1, '#59616e'); qx(.25, 0, d, .6, .72, dk(TEAL, .15));
      qx(.25, .5, d - .5, .85, 1.75, '#a9d3e0', 'glass'); lw([.25, .5, .85], [.25, d - .5, .85], '#59616e'); lw([.25, .5, 1.75], [.25, d - .5, 1.75], '#59616e'); lw([.25, .5, .85], [.25, .5, 1.75], '#59616e'); lw([.25, d - .5, .85], [.25, d - .5, 1.75], '#59616e');
      qx(.26, .6, d - .6, 1.88, 2.18, '#1c222b'); lit(() => qx(.26, .7, d - .7, 1.92, 2.14, '#18202c'));
    } },
  { id: 'furn.airport.tram.floor', kind: 'furniture', tags: T(['tram']), flat: true, solid: false, size: p => [p.len || 9, p.d || 4, .02], variants: [{ len: 9, d: 4, doors: [3.7] }],
    draw(p) { const L = p.len || 9, d = p.d || 4; qz(0, L, 0, d, .01, (x, y) => ((Math.floor(x * 8) * 7 + Math.floor(y * 8) * 13) % 11 === 0) ? '#6a7482' : '#59616e'); qz(0, L, d / 2 - .06, d / 2 + .06, .012, TEAL); for (const x of p.doors || [3.7]) { qz(x, x + 1.6, .25, .5, .014, (a, b) => (Math.floor((a + b) * 6) & 1) ? YEL : DARK); } } },
  { id: 'furn.airport.tram.perch', kind: 'furniture', tags: T(['tram', 'tram_seat']), size: p => [(p.n || 3) * .55, .2, 1.1], vb: p => [0, -.05, 0, (p.n || 3) * .55, .7, 1.2], variants: [{ n: 3 }],
    seats: p => Array.from({ length: p.n || 3 }, (_, i) => ({ x: i * .55 + .28, y: .42, z: .5, dir: 1 })),
    draw(p) { const n = p.n || 3, w = n * .55; box(0, 0, 0, w, .15, 1.1, WH, { ol: false }); for (let i = 0; i < n; i++) { box(i * .55 + .04, .12, .55, .47, .08, .45, TEAL, { ol: false }); box(i * .55 + .04, .15, .38, .47, .45, .12, lt(TEAL, .1), { ol: false }); qy(i * .55 + .04, i * .55 + .51, .6, .38, .5, dk(TEAL, .25)); } lw([0, .6, .38], [w, .6, .38], dk(TEAL, .5)); box(.1, .3, 0, .08, .08, .38, STEEL, { ol: false }); box(w - .18, .3, 0, .08, .08, .38, STEEL, { ol: false }); } },
  { id: 'furn.airport.tram.pdoors', kind: 'furniture', tags: T(['tram', 'tram_doors']), wall: true, mount: 0, solid: false, size: p => [p.w || 6, .1, 3], variants: [{ w: 6, text: 'TRAM > MAIN TERMINAL' }, { w: 6, open: 1, text: 'TRAM > GATES B1-B6' }],
    draw(p) {
      const w = p.w || 6, Y = .05, o = p.open ? .6 : 0;
      qy(0, w, Y, 0, 3, '#dfe4e9'); qy(.15, w - .15, Y, .0, 2.2, '#27303c'); if (p.open) { glow(() => qy(.15, w - .15, Y, 0, 2.2, '#4a5568')); qy(.15, w - .15, Y, .0, .7, TEAL); qy(.15, w - .15, Y, .7, 1.9, '#e6eef2'); qy(.15, w - .15, Y, 1.9, 2.2, WH); lit(() => qy(.4, w - .4, Y, 2.0, 2.08, '#fff6d8')); }
      const n = Math.max(1, Math.round((w - .3) / 2.8)), bw = (w - .3) / n;
      for (let i = 0; i < n; i++) {
        const x0 = .15 + i * bw, m = x0 + bw / 2, Y2 = Y + .02;
        qy(x0, m - .75, Y2, 0, 2.2, '#bfe3ee', 'glass'); qy(m + .75, x0 + bw, Y2, 0, 2.2, '#bfe3ee', 'glass');
        for (const s of [-1, 1]) { const a = m + s * o, b = m + s * .75; const l = Math.min(a, b), r = Math.max(a, b); if (!p.open) { qy(l, r, Y2, 0, 2.2, '#cfe9f1', 'glass'); } else qy(s < 0 ? l - .0 : r - .15, s < 0 ? l + .15 : r, Y2, 0, 2.2, '#cfe9f1'); lw([s < 0 ? l : r, Y2, 0], [s < 0 ? l : r, Y2, 2.2], '#59616e'); if (!p.open) qy(m - .04, m + .04, Y2, 0, 2.2, YEL); }
        qy(m - .75, m + .75, Y2, 0, .08, (u, v) => (Math.floor(u / 3) & 1) ? YEL : DARK); lw([x0, Y2, 0], [x0, Y2, 2.2], '#59616e'); lw([x0 + bw, Y2, 0], [x0 + bw, Y2, 2.2], '#59616e'); lw([x0, Y2, 1.1], [m - .75, Y2, 1.1], '#8e9aaa'); lw([m + .75, Y2, 1.1], [x0 + bw, Y2, 1.1], '#8e9aaa');
        lit(() => qy(m - .3, m + .3, Y2, 2.08, 2.16, p.open ? GREEN : RED));
      }
      qy(0, w, Y + .03, 2.2, 2.28, STEEL); signY(p.text || 'TRAM', .3, w - .3, Y + .03, 2.4, 2.85, '#1c222b', '#ffd98a', { lit: true }); lit(() => qy(.3, .5, Y + .04, 2.45, 2.8, TEAL));
    } },
];
