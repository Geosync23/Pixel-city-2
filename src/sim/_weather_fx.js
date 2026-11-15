// Weather visual FX, drawn into the low-res game canvas after lighting (G.overlays).
// Everything is pre-allocated: typed-array particle pools, pre-rendered sprite canvases. No per-frame allocations.
// Layers wrap around the screen in "layer space" with a parallax factor so they move with the world, not the glass.
import { GT } from '../engine/world.js';

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const SPACE = 4096; // particle layer-space period
/** dithered blob: fn(nx, ny) -> density 0..1 (nx, ny in -1..1); pixels on where density beats the Bayer threshold */
function dither(w, h, col, fn) {
  const c = mk(w, h), x = c.getContext('2d'); x.fillStyle = col;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const d = fn((i + .5) / w * 2 - 1, (j + .5) / h * 2 - 1); if (d > (BAYER[(j & 3) * 4 + (i & 3)] + .5) / 16) x.fillRect(i, j, 1, 1); }
  return c;
}
function pix(w, h, list) { // list: [x, y, colour, ...]
  const c = mk(w, h), x = c.getContext('2d'); for (let i = 0; i < list.length; i += 3) { x.fillStyle = list[i + 2]; x.fillRect(list[i], list[i + 1], 1, 1); } return c;
}
const smooth = e => e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e);

export function createFX(G) {
  const R = Math.random;
  /* ---------- sprites ---------- */
  const DROP = { // [mild slant, steep slant] x [far, near]
    far: [pix(2, 3, [1, 0, '#a9bcdc', 1, 1, '#b8c9e6', 0, 2, '#c8d6ee']), pix(3, 3, [2, 0, '#a9bcdc', 1, 1, '#b8c9e6', 0, 2, '#c8d6ee'])],
    near: [pix(2, 4, [1, 0, '#bccce8', 1, 1, '#cfdcf2', 0, 2, '#dfe8f8', 0, 3, '#eef3fc']), pix(3, 4, [2, 0, '#bccce8', 1, 1, '#cfdcf2', 1, 2, '#dfe8f8', 0, 3, '#eef3fc'])],
  };
  DROP.gust = pix(4, 6, [3, 0, '#bccce8', 3, 1, '#cfdcf2', 2, 2, '#cfdcf2', 2, 3, '#dfe8f8', 1, 4, '#dfe8f8', 0, 5, '#eef3fc']); // long slanted streak for storms
  const SPL = mk(24, 4); { // 3 frames of 8x4: drop hit, small ring, wide faint ring
    const x = SPL.getContext('2d'); x.fillStyle = '#dce8fa';
    x.fillRect(3, 3, 2, 1); x.fillRect(2, 1, 1, 1); x.fillRect(5, 0, 1, 1);
    x.fillRect(10, 2, 1, 1); x.fillRect(13, 2, 1, 1); x.fillRect(11, 1, 2, 1); x.fillRect(11, 3, 2, 1);
    x.globalAlpha = .6; x.fillRect(16, 2, 1, 1); x.fillRect(23, 2, 1, 1); x.fillRect(17, 1, 2, 1); x.fillRect(21, 1, 2, 1); x.fillRect(19, 0, 2, 1); x.fillRect(17, 3, 2, 1); x.fillRect(21, 3, 2, 1);
  }
  const BW = 128, BH = 36, FOGT = ['#e2e6ee', '#a9b2c6', '#6c7896', '#3d4766'];
  const fogFn = (nx, ny) => { const q = nx * nx * .9 + ny * ny * 1.1; return Math.max(0, 1 - q) * .85 * (1 - .25 * Math.sin(nx * 7.0 + ny * 3.0) * Math.sin(nx * 3.1)); };
  const FOG = FOGT.map(c => dither(BW, BH, c, fogFn));
  const CW = 176, CHh = 88;
  const cloudFn = (nx, ny) => { // three overlapping lobes; solid core with dithered rim
    const a = 1 - ((nx + .25) ** 2 * 1.6 + ny * ny * 1.4), b = 1 - ((nx - .35) ** 2 * 2.2 + (ny + .15) ** 2 * 2.6), c = 1 - ((nx - .05) ** 2 * 3 + (ny - .3) ** 2 * 3.4);
    return Math.max(a, b, c) * 2.4;
  };
  const CLOUD = dither(CW, CHh, '#1a1630', cloudFn);
  const BIRD = [pix(5, 2, [0, 0, '#2a2733', 1, 1, '#2a2733', 3, 1, '#2a2733', 4, 0, '#2a2733', 2, 1, '#2a2733']), pix(5, 2, [0, 1, '#2a2733', 1, 1, '#2a2733', 2, 1, '#2a2733', 3, 1, '#2a2733', 4, 1, '#2a2733']), pix(5, 2, [1, 0, '#2a2733', 2, 1, '#2a2733', 3, 0, '#2a2733'])];
  const FLY = [pix(3, 3, [1, 1, '#f8ffb0', 0, 1, '#9fd35a', 2, 1, '#9fd35a', 1, 0, '#9fd35a', 1, 2, '#9fd35a'])];
  const BFLY_COLS = ['#ffe066', '#ffffff', '#ffa94d', '#9ad0ff'];
  const BFLY = BFLY_COLS.map(c => [pix(3, 2, [0, 0, c, 2, 0, c, 1, 1, '#3b2f2f', 0, 1, c, 2, 1, c]), pix(3, 2, [1, 0, c, 1, 1, '#3b2f2f'])]);

  /* ---------- pools ---------- */
  const pool = n => ({ n, u: new Float32Array(n), v: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n), ph: new Float32Array(n), a: new Float32Array(n), t: new Uint8Array(n) });
  const AREA0 = 36500, MAXS = 5; // particle counts were tuned for a phone at zoom 3 (about 130 x 281 px); wider views get proportionally more
  const rainFar = pool(230 * MAXS), rainNear = pool(170 * MAXS), snowFar = pool(170 * MAXS), snowNear = pool(110 * MAXS), amb = pool(40), spl = pool(40), flies = pool(22), glints = pool(18);
  for (const p of [rainFar, rainNear]) for (let i = 0; i < p.n; i++) { p.u[i] = R() * SPACE; p.v[i] = R() * SPACE; p.vy[i] = (p === rainNear ? 250 : 165) + R() * 60; }
  for (const p of [snowFar, snowNear]) for (let i = 0; i < p.n; i++) { p.u[i] = R() * SPACE; p.v[i] = R() * SPACE; p.vy[i] = (p === snowNear ? 20 : 11) + R() * 10; p.vx[i] = 2 + R() * 4; p.ph[i] = R() * 6.28; p.a[i] = 1.5 + R() * 4; }
  for (let i = 0; i < amb.n; i++) { amb.u[i] = R() * SPACE; amb.v[i] = R() * SPACE; amb.ph[i] = R() * 6.28; amb.a[i] = .6 + R() * 1.2; amb.t[i] = (R() * 4) | 0; amb.vx[i] = R(); amb.vy[i] = R(); }
  for (let i = 0; i < spl.n; i++) spl.a[i] = 9;
  for (let i = 0; i < flies.n; i++) flies.a[i] = -R() * 6;
  for (let i = 0; i < glints.n; i++) glints.a[i] = -R() * 3;
  const CLOUDS = []; { let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 6; i++) CLOUDS.push(r() * 900, r() * 600, .7 + r() * .3); }
  const birds = { on: false, x: 0, y: 0, vx: 0, vy: 0, n: 0, t: 0, next: 8 + R() * 20 };
  const L = { t: 0, next: 4 + R() * 6, flash: -1, thunder: -1, loud: 0 };
  let T = 0, lcx = 0, lcy = 0, first = true;
  const PAD = 12;
  const wrapX = (u, p, cx, RW) => { let s = (u - cx * p) % RW; if (s < 0) s += RW; return s - PAD; };

  function rainLayer(ctx, p, spr, count, cam, par, wind, dt, RW, RH) {
    const cx = cam.x, cy = cam.y;
    for (let i = 0; i < count; i++) {
      let v = p.v[i] + p.vy[i] * dt, u = p.u[i] - p.vy[i] * wind * dt; if (v > SPACE) v -= SPACE; if (u < 0) u += SPACE; p.v[i] = v; p.u[i] = u;
      ctx.drawImage(spr, wrapX(u, par, cx, RW) | 0, wrapX(v, par, cy, RH) | 0);
    }
  }
  function snowLayer(ctx, p, count, cam, par, size, dt, RW, RH, big) {
    const cx = cam.x, cy = cam.y;
    for (let i = 0; i < count; i++) {
      let v = p.v[i] + p.vy[i] * dt, u = p.u[i] + p.vx[i] * dt; if (v > SPACE) v -= SPACE; if (u > SPACE) u -= SPACE; p.v[i] = v; p.u[i] = u;
      const sx = wrapX(u, par, cx, RW) + Math.sin(T * (.7 + p.a[i] * .15) + p.ph[i]) * p.a[i];
      const X = sx | 0, Y = wrapX(v, par, cy, RH) | 0;
      if (big && i % 3 === 0) { ctx.fillRect(X - 1, Y, 3, 1); ctx.fillRect(X, Y - 1, 1, 3); } else ctx.fillRect(X, Y, size, size);
    }
  }
  function toTile(sx, sy, cam) { // screen px -> ground type under it (approximate terrain height)
    const w = G.world; if (!w) return 0; const lx = sx + cam.x, ly = sy + cam.y; let z = 0, x = 0, y = 0;
    for (let k = 0; k < 3; k++) { const a = lx / 16, b = (ly + z * 16) / 8; x = (a + b) / 2; y = (b - a) / 2; z = w.heightAt(x, y); }
    return w.tileType(x, y);
  }

  /**
   * I: { kind, int, dark, hf (hour float), season, indoor, still (no wind) }
   */
  function draw(ctx, cam, dt, I) {
    T += dt; const W = G.W, H = G.H, RW = W + PAD * 2, RH = H + PAD * 2;
    let dcx = cam.x - lcx, dcy = cam.y - lcy; lcx = cam.x; lcy = cam.y; if (first || Math.abs(dcx) > 300 || Math.abs(dcy) > 300) { dcx = dcy = 0; first = false; }
    const k = I.kind, it = I.int, dark = I.dark, storm = k === 'storm' ? it : 0;
    const wet = k === 'rain' || k === 'storm' ? it : 0, snow = k === 'snow' ? it : 0, fog = k === 'fog' ? it : 0, dry = k === 'clear' || k === 'cloudy' ? it : 0;
    // lightning + thunder (thunder is emitted indoors too: it's a sound cue)
    if (storm > .6) { L.next -= dt; if (L.next <= 0) { L.next = 5 + R() * 14; L.flash = 0; L.thunder = .4 + R() * 1.8; L.loud = 1 - L.thunder / 2.6; } }
    if (L.thunder >= 0) { L.thunder -= dt; if (L.thunder < 0) G.emit('thunder', I.indoor ? L.loud * .6 : L.loud); }
    if (I.indoor || !G.scene) { if (L.flash >= 0) { L.flash += dt; if (L.flash > .4) L.flash = -1; } return; }
    const nightA = 1 - dark * .55, scale = Math.max(1, Math.min(MAXS, W * H / AREA0));
    // --- overcast: by day, rain and storms pull the whole picture down to a cool grey (night and dusk keep their own light) ---
    const oc = wet * (1 - smooth(dark / .7));
    if (oc > .02) { ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = oc; ctx.fillStyle = storm > 0 ? '#8f9ab3' : '#b3bccd'; ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = 'source-over';

    // --- cloud shadows (ground, world space) ---
    const cs = dry * (k === 'cloudy' ? 1.25 : 1) * (1 - smooth((dark - .2) / .5));
    if (cs > .02) {
      ctx.globalAlpha = .14 * cs; const TW = 900, TH = 600, ox = T * 7, oy = T * 3.5;
      for (let i = 0; i < CLOUDS.length; i += 3) {
        if (k === 'clear' && i >= 12) break;
        let sx = (CLOUDS[i] + ox - cam.x) % TW; if (sx < 0) sx += TW; sx -= CW; let sy = (CLOUDS[i + 1] + oy - cam.y) % TH; if (sy < 0) sy += TH; sy -= CHh;
        for (let yy = sy; yy < H; yy += TH) for (let xx = sx; xx < W; xx += TW) ctx.drawImage(CLOUD, xx | 0, yy | 0);
      }
    }
    // --- rain splashes (ground, world space) ---
    if (wet > .05) {
      const rate = wet * (storm > 0 ? 70 : 34) * (W * H) / 120000; spl.ph[0] += rate * dt;
      while (spl.ph[0] >= 1) { spl.ph[0] -= 1; for (let i = 0; i < spl.n; i++) if (spl.a[i] >= .36) { spl.a[i] = 0; spl.u[i] = cam.x + R() * W; spl.v[i] = cam.y + 10 + R() * (H - 10); break; } }
    }
    ctx.globalAlpha = .75 * nightA;
    for (let i = 0; i < spl.n; i++) { if (spl.a[i] >= .36) continue; spl.a[i] += dt; const f = spl.a[i] < .08 ? 0 : spl.a[i] < .2 ? 1 : 2; ctx.drawImage(SPL, f * 8, 0, 8, 4, (spl.u[i] - cam.x - 4) | 0, (spl.v[i] - cam.y - 2) | 0, 8, 4); }

    // --- seasonal ambient (only on dry weather) ---
    const s = I.season, day = 1 - smooth((dark - .3) / .3);
    if (dry > .05) {
      // fireflies: summer (and late spring) nights over park/grass
      if ((s === 1 || s === 0) && dark > .55) {
        const n = Math.round(flies.n * dry * (s === 1 ? 1 : .5));
        for (let i = 0; i < n; i++) {
          if (flies.a[i] < 0) { flies.a[i] += dt; if (flies.a[i] >= 0) { const sx = R() * W, sy = R() * H, gt = toTile(sx, sy, cam); if (gt === GT.park || gt === GT.grass || gt === GT.lawn) { flies.u[i] = sx + cam.x; flies.v[i] = sy + cam.y - 6; flies.vy[i] = 4 + R() * 5; flies.ph[i] = R() * 6.28; } else flies.a[i] = -R() * 2; } continue; }
          flies.a[i] += dt; if (flies.a[i] > flies.vy[i]) { flies.a[i] = -R() * 3; continue; }
          const b = Math.sin(flies.a[i] * 2.2 + flies.ph[i]), x = flies.u[i] - cam.x + Math.sin(T * .7 + flies.ph[i]) * 5, y = flies.v[i] - cam.y + Math.sin(T * 1.1 + flies.ph[i] * 2) * 3;
          if (b > .2) { ctx.globalAlpha = Math.min(1, b) * dry; ctx.drawImage(FLY[0], (x - 1) | 0, (y - 1) | 0); } else if (b > -.3) { ctx.globalAlpha = .5 * dry; ctx.fillStyle = '#b7d86a'; ctx.fillRect(x | 0, y | 0, 1, 1); }
        }
      }
      if (day > .05) {
        const a = dry * day;
        if (s === 0) { // petals
          const n = Math.round(26 * a); ctx.globalAlpha = .95;
          for (let i = 0; i < n; i++) {
            const u = amb.u[i] = (amb.u[i] + (10 + amb.vx[i] * 8) * dt) % SPACE, v = amb.v[i] = (amb.v[i] + (8 + amb.vy[i] * 8) * dt) % SPACE, sw = Math.sin(T * 2 * amb.a[i] + amb.ph[i]);
            const x = (wrapX(u, 1, cam.x, RW) + sw * 4) | 0, y = wrapX(v, 1, cam.y, RH) | 0; ctx.fillStyle = amb.t[i] & 1 ? '#f7b6cf' : '#ffe1ec'; ctx.fillRect(x, y, sw > 0 ? 2 : 1, 1);
          }
        } else if (s === 1) { // dandelion fluff + butterflies
          const n = Math.round(10 * a); ctx.fillStyle = '#fffbe8'; ctx.globalAlpha = .85;
          for (let i = 0; i < n; i++) { const u = amb.u[i] = (amb.u[i] + (6 + amb.vx[i] * 6) * dt) % SPACE, v = amb.v[i] = (amb.v[i] + (Math.sin(T * .5 + amb.ph[i]) * 4) * dt + SPACE) % SPACE; ctx.fillRect(wrapX(u, 1.05, cam.x, RW) | 0, wrapX(v, 1.05, cam.y, RH) | 0, 1, 1); }
          const nb = Math.round(5 * a); ctx.globalAlpha = 1;
          for (let i = 20; i < 20 + nb; i++) {
            const ang = Math.sin(T * .37 * amb.a[i] + amb.ph[i]) * 3 + amb.ph[i];
            const u = amb.u[i] = (amb.u[i] + Math.cos(ang) * 12 * dt + SPACE) % SPACE, v = amb.v[i] = (amb.v[i] + Math.sin(ang) * 8 * dt + SPACE) % SPACE;
            const fr = ((T * 9 + i) | 0) & 1; ctx.drawImage(BFLY[amb.t[i]][fr], wrapX(u, 1, cam.x, RW) | 0, (wrapX(v, 1, cam.y, RH) + Math.sin(T * 6 + i) * 1.5) | 0);
          }
        } else if (s === 2) { // falling leaves, tumbling 2-frame
          const n = Math.round(30 * a), LC = LEAF; ctx.globalAlpha = 1;
          for (let i = 0; i < n; i++) {
            const u = amb.u[i] = (amb.u[i] + (12 + amb.vx[i] * 10) * dt) % SPACE, v = amb.v[i] = (amb.v[i] + (13 + amb.vy[i] * 10) * dt) % SPACE, sw = Math.sin(T * 1.6 * amb.a[i] + amb.ph[i]);
            const x = (wrapX(u, 1, cam.x, RW) + sw * 6) | 0, y = wrapX(v, 1, cam.y, RH) | 0; ctx.fillStyle = LC[amb.t[i]];
            if (((T * 5 * amb.a[i] + amb.ph[i]) | 0) & 1) { ctx.fillRect(x, y, 3, 1); ctx.fillRect(x + 1, y + 1, 1, 1); } else { ctx.fillRect(x, y, 1, 2); ctx.fillRect(x + 1, y + 1, 1, 1); }
          }
        } else if (s === 3) { // winter sparkle (cold glints in the air)
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < glints.n; i++) {
            if (glints.a[i] < 0) { glints.a[i] += dt; if (glints.a[i] >= 0) { glints.u[i] = cam.x + R() * W; glints.v[i] = cam.y + R() * H; } continue; }
            glints.a[i] += dt; const g = glints.a[i]; if (g > 1.2) { glints.a[i] = -R() * 2.5; continue; }
            const b = Math.sin(g / 1.2 * Math.PI) * a, x = (glints.u[i] - cam.x) | 0, y = (glints.v[i] - cam.y - g * 3) | 0;
            ctx.globalAlpha = b; ctx.fillRect(x, y, 1, 1); if (b > .6) { ctx.globalAlpha = b * .5; ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1); }
          }
        }
      }
    }
    // --- birds: a small V flock crossing the sky now and then (fair daytime weather) ---
    const fair = (dry + fog * .5) * (1 - smooth((dark - .25) / .3));
    if (!birds.on) { birds.next -= dt; if (birds.next <= 0) { birds.next = 22 + R() * 40; if (fair > .5) { const ltr = R() < .5; birds.on = true; birds.vx = (ltr ? 1 : -1) * (26 + R() * 12); birds.x = ltr ? -40 : W + 40; birds.y = 8 + R() * H * .5; birds.n = 3 + ((R() * 5) | 0); birds.t = R() * 5; birds.vy = (R() - .5) * 6; } } }
    if (birds.on) {
      birds.x += birds.vx * dt - dcx * .5; birds.y += birds.vy * dt - dcy * .5; birds.t += dt; ctx.globalAlpha = .9 * nightA; const dir = birds.vx > 0 ? -1 : 1;
      for (let i = 0; i < birds.n; i++) { const rank = (i + 1) >> 1, side = i & 1 ? -1 : 1, fr = ((birds.t * 6 + i * .7) | 0) % 4, f = fr === 3 ? 1 : fr === 1 ? 1 : fr === 0 ? 0 : 2; ctx.drawImage(BIRD[f], (birds.x + dir * rank * 6) | 0, (birds.y + side * rank * 4 + Math.sin(birds.t * 1.3 + i) * 1) | 0); }
      if (birds.x < -80 || birds.x > W + 80 || birds.y < -60 || birds.y > H + 60) birds.on = false;
    }

    // --- fog bands (world space, drifting), stronger at dawn ---
    if (fog > .02) {
      const hf = I.hf, dawn = hf >= 4 && hf < 10 ? 1 : .7, st = fog * dawn, tint = FOG[Math.min(3, Math.round(dark * 3))];
      ctx.globalAlpha = .2 * st; ctx.fillStyle = FOGT[Math.min(3, Math.round(dark * 3))]; ctx.fillRect(0, 0, W, H);
      const ROW = 26, SPX = 150, r0 = Math.floor((cam.y - BH) / ROW), r1 = Math.ceil((cam.y + H) / ROW);
      for (let r = r0; r <= r1; r++) {
        const rr = ((r % 7) + 7) % 7, drift = T * (4 + rr * 1.5) + rr * 53, y = r * ROW - cam.y - (rr & 1) * 9;
        ctx.globalAlpha = (.22 + (rr % 3) * .08) * st; let x = (rr * 41 + drift - cam.x) % SPX; if (x > 0) x -= SPX; x -= 10;
        for (; x < W; x += SPX) ctx.drawImage(tint, x | 0, y | 0);
      }
    }
    // --- precipitation ---
    if (wet > .02) {
      const sl = storm > .3 ? 1 : 0, wind = sl ? .42 : .2;
      const dens = Math.min(scale, 1.8) * (storm ? 1.4 : .7); /* capped: a phone at its widest zoom draws about 1000 streaks in a storm */
      ctx.globalAlpha = (storm ? .65 : .55) * nightA; rainLayer(ctx, rainFar, DROP.far[sl], Math.min(rainFar.n, Math.round(230 * wet * dens)), cam, .8, wind, dt, RW, RH);
      ctx.globalAlpha = (storm ? .9 : .8) * nightA; rainLayer(ctx, rainNear, sl ? DROP.gust : DROP.near[0], Math.min(rainNear.n, Math.round(170 * wet * dens)), cam, 1.25, wind, dt, RW, RH);
      ctx.globalAlpha = .07 * wet * (1 + storm); ctx.fillStyle = dark > .5 ? '#2c3550' : '#8e9ab4'; ctx.fillRect(0, 0, W, H);
    }
    if (snow > .02) {
      const out = scale > 1.6; // zoomed out: more and bigger flakes so the snowfall still reads
      ctx.fillStyle = '#e6edf8'; ctx.globalAlpha = (out ? .9 : .75) * nightA; snowLayer(ctx, snowFar, Math.min(snowFar.n, Math.round(170 * snow * scale * 1.25)), cam, .8, 1, dt, RW, RH, false);
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = .95 * nightA; snowLayer(ctx, snowNear, Math.min(snowNear.n, Math.round(110 * snow * scale * 1.25)), cam, 1.3, 2, dt, RW, RH, out);
      ctx.globalAlpha = .06 * snow; ctx.fillStyle = dark > .5 ? '#3a4466' : '#dfe6f2'; ctx.fillRect(0, 0, W, H);
    }
    // --- lightning flash ---
    if (L.flash >= 0) {
      const f = L.flash; L.flash += dt; const a = f < .05 ? .6 : f < .1 ? .08 : f < .16 ? .45 : f < .45 ? .45 * (1 - (f - .16) / .29) : 0;
      if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = '#eef3ff'; ctx.fillRect(0, 0, W, H); } if (f > .45) L.flash = -1;
    }
    ctx.globalAlpha = 1;
  }
  const LEAF = ['#d9622b', '#c23b22', '#e8a33a', '#a8452a'];

  /* ---------- wet ground: puddles + sheen (drawn right after the ground, under everything that stands on it) ---------- */
  const PUD = []; { // six puddle shapes: sky-grey body, light upper rim, dark lower rim
    const shapes = [[13, 6, [[0, 0, 1, 1]]], [18, 8, [[-.3, 0, .7, .8], [.35, .1, .6, .9]]], [24, 9, [[-.4, .1, .6, .8], [.1, -.1, .55, .7], [.5, .2, .45, .7]]], [10, 5, [[0, 0, 1, 1]]], [20, 7, [[-.45, 0, .5, .9], [.3, 0, .68, .75]]], [15, 8, [[0, -.1, .8, .8], [.2, .3, .6, .6]]]];
    for (const [w, h, el] of shapes) {
      const inside = (i, j) => { const nx = (i + .5) / w * 2 - 1, ny = (j + .5) / h * 2 - 1; for (const e of el) { const a = (nx - e[0]) / e[2], b = (ny - e[1]) / e[3]; if (a * a + b * b < 1) return true; } return false; };
      const c = mk(w, h + 1), x = c.getContext('2d');
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if (!inside(i, j)) continue; const top = !inside(i, j - 1), bot = !inside(i, j + 1); x.fillStyle = top ? '#c3d0e0' : bot ? '#6f7d95' : ((i * 3 + j * 5) % 11 === 0) ? '#b4c2d4' : '#98a8be'; x.fillRect(i, j, 1, 1); if (bot) { x.fillStyle = 'rgba(40,44,62,.45)'; x.fillRect(i, j + 1, 1, 1); } }
      PUD.push(c);
    }
  }
  const GLEAM = [pix(7, 1, [0, 0, '#aab6c8', 1, 0, '#c6d0de', 2, 0, '#c6d0de', 3, 0, '#c6d0de', 4, 0, '#c6d0de', 5, 0, '#c6d0de', 6, 0, '#aab6c8']), pix(4, 1, [0, 0, '#aab6c8', 1, 0, '#c6d0de', 2, 0, '#c6d0de', 3, 0, '#aab6c8'])];
  const PUDT = { [GT.asphalt]: .085, [GT.sidewalk]: .06, [GT.plaza]: .06, [GT.cobble]: .07, [GT.brickpave]: .07, [GT.concrete]: .05, [GT.tarmac]: .05, [GT.boardwalk]: .03 };
  const hsh = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const CHK = 16;
  /** puddle list of one chunk: Float32Array [world px x, world px y, sprite (0-5 puddle, 6-7 gleam)] x n */
  function chunkPuddles(w, cx, cy) {
    const m = w._puddles || (w._puddles = new Map()), key = cx * 4096 + cy; let L = m.get(key); if (L) return L;
    const a = [];
    for (let ty = cy * CHK; ty < Math.min(w.h, cy * CHK + CHK); ty++) for (let tx = cx * CHK; tx < Math.min(w.w, cx * CHK + CHK); tx++) {
      const t = w.gt[ty * w.w + tx], p = PUDT[t]; if (!p || w.steep(tx, ty) > .02) continue; const k = hsh(tx, ty, 81);
      const x = tx + .3 + hsh(tx, ty, 83) * .4, y = ty + .3 + hsh(tx, ty, 84) * .4, z = w.H(tx, ty), sx = (x - y) * 16, sy = (x + y) * 8 - z * 16;
      if (k < p) { const i = (hsh(tx, ty, 85) * 6) | 0; a.push(Math.round(sx - PUD[i].width / 2), Math.round(sy - PUD[i].height / 2), i); }
      else if (t === GT.asphalt && k > .8) a.push(Math.round(sx - 3), Math.round(sy), 6 + (k > .9 ? 1 : 0));
    }
    L = new Float32Array(a); m.set(key, L); return L;
  }
  const rings = pool(26); for (let i = 0; i < rings.n; i++) rings.a[i] = 9;
  let ringAcc = 0;
  /** I: { kind, int, dark, indoor, wetness 0..1 } */
  function under(ctx, cam, dt, I) {
    const wn = I.wetness; if (!(wn > .03) || I.indoor) return; const w = G.world; if (!w || !w.gt) return;
    const W = G.W, H = G.H, zr = 14 * 16, raining = (I.kind === 'rain' || I.kind === 'storm') && I.int > .25;
    // visible chunk range (same maths as the renderer)
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let q = 0; q < 4; q++) { const sx = cam.x + (q & 1 ? W : 0), sy = q & 2 ? cam.y + H + zr : cam.y - 64, a = sx / 16, b = sy / 8, x = (a + b) / 2, y = (b - a) / 2; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const c0x = Math.max(0, Math.floor(x0 / CHK)), c0y = Math.max(0, Math.floor(y0 / CHK)), c1x = Math.min(Math.ceil(w.w / CHK) - 1, Math.floor(x1 / CHK)), c1y = Math.min(Math.ceil(w.h / CHK) - 1, Math.floor(y1 / CHK));
    ctx.globalAlpha = Math.min(1, wn * 1.15); let seen = 0, pick = -1, pkx = 0, pky = 0, pkw = 0;
    ringAcc += raining ? dt * 9 * Math.min(4, W * H / AREA0) : 0; const want = ringAcc >= 1; if (want) ringAcc -= 1;
    for (let cy = c0y; cy <= c1y; cy++) for (let cx = c0x; cx <= c1x; cx++) {
      const L = chunkPuddles(w, cx, cy);
      for (let i = 0; i < L.length; i += 3) {
        const x = L[i] - cam.x, y = L[i + 1] - cam.y; if (x < -26 || y < -10 || x > W || y > H) continue; const k = L[i + 2];
        if (k < 6) { ctx.drawImage(PUD[k], x, y); if (want && R() * ++seen < 1) { pick = k; pkx = L[i]; pky = L[i + 1]; pkw = PUD[k].width; } } /* reservoir pick: one random visible puddle gets the next ring */
        else ctx.drawImage(GLEAM[k - 6], x, y);
      }
    }
    if (pick >= 0) for (let i = 0; i < rings.n; i++) if (rings.a[i] >= .5) { rings.a[i] = 0; rings.u[i] = pkx + pkw * (.3 + R() * .4); rings.v[i] = pky + PUD[pick].height * (.3 + R() * .3); break; }
    ctx.globalAlpha = .8;
    for (let i = 0; i < rings.n; i++) { if (rings.a[i] >= .5) continue; rings.a[i] += dt; const f = rings.a[i] < .12 ? 0 : rings.a[i] < .28 ? 1 : 2; ctx.drawImage(SPL, f * 8, 0, 8, 4, (rings.u[i] - cam.x - 4) | 0, (rings.v[i] - cam.y - 2) | 0, 8, 4); }
    ctx.globalAlpha = 1;
  }
  return { draw, under, birds: () => { birds.next = 0; }, lightning: () => { L.flash = 0; L.thunder = .6; L.loud = .8; } };
}
