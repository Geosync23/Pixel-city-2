// Living water: small sun glints and drifting wavelets on every open water surface (bay, river, ponds), drawn right after the ground
// (G.underlays) so boats, piers and people cover them. Purely visual; no state, nothing saved.
// Pre-allocated pool, a few hundred 1-3 px rects per frame at most. Frozen water (winter ponds) and indoor scenes get none.
import { G } from '../core/game.js';
import { GT } from '../engine/world.js';
import { isFrozen } from '../engine/terrainfx.js';

export const order = 45;
export function init() {
  const N = 240, px = new Float32Array(N), py = new Float32Array(N), age = new Float32Array(N), life = new Float32Array(N), kind = new Uint8Array(N), len = new Uint8Array(N);
  for (let i = 0; i < N; i++) life[i] = 0;
  let last = 0, acc = 0, cur = 0;
  const R = Math.random;
  function waterAt(lx, ly, w) { // world px -> is there open water under it?
    let z = 0, x = 0, y = 0;
    for (let k = 0; k < 3; k++) { const a = lx / 16, b = (ly + z * 16) / 8; x = (a + b) / 2; y = (b - a) / 2; z = w.heightAt(x, y); }
    const t = w.tileType(x, y); if (t !== GT.water && t !== GT.deepwater) return false;
    return !isFrozen(w, x, y);
  }
  G.underlays.push((ctx, cam) => {
    const w = G.world; if (!w || !G.scene || G.scene.indoor) return;
    const now = G.time, dt = Math.min(.1, Math.max(0, now - last)); last = now;
    const W = G.W, H = G.H, dark = G.env ? G.env.dark || 0 : 0, wx = G.state.weather, dull = wx === 'rain' || wx === 'storm' || wx === 'fog';
    const target = Math.min(N, W * H / 1000);
    acc += target / 1.6 * dt; let tries = 0;
    while (acc >= 1 && tries++ < 24) {
      acc -= 1; const sx = R() * W, sy = R() * H; if (!waterAt(sx + cam.x, sy + cam.y, w)) continue;
      // find a free slot (round robin)
      let i = -1; for (let k = 0; k < N; k++) { const j = (cur + k) % N; if (age[j] >= life[j]) { i = j; cur = j + 1; break; } } if (i < 0) break;
      const spark = !dull && R() < (dark > .5 ? .25 : .55);
      px[i] = sx + cam.x; py[i] = sy + cam.y; age[i] = 0; kind[i] = spark ? 0 : 1; life[i] = spark ? .7 + R() * .7 : 2 + R() * 1.6; len[i] = 4 + (R() * 6 | 0);
    }
    if (acc > 4) acc = 4;
    for (let i = 0; i < N; i++) {
      if (age[i] >= life[i]) continue; age[i] += dt; const p = age[i] / life[i]; if (p >= 1) continue;
      const x = (px[i] - cam.x) | 0, y = (py[i] - cam.y) | 0; if (x < -12 || y < -4 || x > W + 4 || y > H + 4) { age[i] = life[i]; continue; }
      if (kind[i] === 0) { // glint: dot -> dash -> star -> dash -> dot
        ctx.globalAlpha = 1;
        if (p < .18 || p > .82) { ctx.fillStyle = '#d3eefa'; ctx.fillRect(x, y, 1, 1); }
        else if (p < .38 || p > .62) { ctx.fillStyle = '#eaf8fd'; ctx.fillRect(x - 1, y, 3, 1); }
        else { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
      } else { // wavelet: a short crest that swells, slides and fades
        const a = Math.sin(p * Math.PI); ctx.globalAlpha = a > .75 ? .85 : a > .4 ? .55 : .28; ctx.fillStyle = '#c4e8f7';
        const l = len[i], xx = x + ((p * 7) | 0); ctx.fillRect(xx, y, l, 1); ctx.fillRect(xx + l - 1, y + 1, 3, 1);
      }
    }
    ctx.globalAlpha = 1;
  });
}
