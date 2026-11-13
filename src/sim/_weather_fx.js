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
  const rainFar = pool(230), rainNear = pool(170), snowFar = pool(170), snowNear = pool(110), amb = pool(40), spl = pool(40), flies = pool(22), glints = pool(18);
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
  function snowLayer(ctx, p, count, cam, par, size, dt, RW, RH) {
    const cx = cam.x, cy = cam.y;
    for (let i = 0; i < count; i++) {
      let v = p.v[i] + p.vy[i] * dt, u = p.u[i] + p.vx[i] * dt; if (v > SPACE) v -= SPACE; if (u > SPACE) u -= SPACE; p.v[i] = v; p.u[i] = u;
      const sx = wrapX(u, par, cx, RW) + Math.sin(T * (.7 + p.a[i] * .15) + p.ph[i]) * p.a[i];
      ctx.fillRect(sx | 0, wrapX(v, par, cy, RH) | 0, size, size);
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
    const nightA = 1 - dark * .55;
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
      ctx.globalAlpha = .55 * nightA; rainLayer(ctx, rainFar, DROP.far[sl], Math.round(rainFar.n * wet * (storm ? 1 : .7)), cam, .8, wind, dt, RW, RH);
      ctx.globalAlpha = .8 * nightA; rainLayer(ctx, rainNear, DROP.near[sl], Math.round(rainNear.n * wet * (storm ? 1 : .65)), cam, 1.25, wind, dt, RW, RH);
      ctx.globalAlpha = .07 * wet * (1 + storm); ctx.fillStyle = dark > .5 ? '#2c3550' : '#8e9ab4'; ctx.fillRect(0, 0, W, H);
    }
    if (snow > .02) {
      ctx.fillStyle = '#e6edf8'; ctx.globalAlpha = .75 * nightA; snowLayer(ctx, snowFar, Math.round(snowFar.n * snow), cam, .8, 1, dt, RW, RH);
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = .95 * nightA; snowLayer(ctx, snowNear, Math.round(snowNear.n * snow), cam, 1.3, 2, dt, RW, RH);
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
  return { draw, birds: () => { birds.next = 0; }, lightning: () => { L.flash = 0; L.thunder = .6; L.loud = .8; } };
}
