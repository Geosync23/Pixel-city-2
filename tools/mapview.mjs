// Headless city preview: node tools/mapview.mjs [--scale 3] [--seed n]  -> out/map/{minimap,height,nav,zone}.png + stats / reachability report
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
import { ROOT, genIndex } from './artfiles.mjs'; import { encodePNG } from './png.mjs';
const args = process.argv.slice(2), opt = { scale: 3, seed: undefined }; for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) opt[args[i].slice(2)] = +args[++i];
genIndex(); const imp = f => import(pathToFileURL(path.join(ROOT, f)));
await imp('src/art/index.js'); const { getCity } = await imp('src/world/_city.js'); const { renderMinimap } = await imp('src/world/minimap.js'); const { GT } = await imp('src/engine/world.js');
const t0 = Date.now(), w = getCity(opt.seed), ms = Date.now() - t0, S = opt.scale;
const dir = path.join(ROOT, 'out/map'); fs.mkdirSync(dir, { recursive: true });
const save = (name, W, H, data) => fs.writeFileSync(path.join(dir, name + '.png'), encodePNG(W, H, new Uint8Array(data.buffer)));
const mm = renderMinimap(w, S); save('minimap', mm.w, mm.h, mm.data);
const img = (fn) => { const d = new Uint8ClampedArray(w.w * S * w.h * S * 4); for (let y = 0; y < w.h * S; y++) for (let x = 0; x < w.w * S; x++) { const c = fn(x / S, y / S), o = (y * w.w * S + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; } return d; };
save('height', w.w * S, w.h * S, img((x, y) => { const t = w.tileType(x, y); if (t === GT.water || t === GT.deepwater) return [60, 120, 190]; const z = w.heightAt(x, y), k = Math.max(0, Math.min(1, z / 11)); const st = w.steep(Math.floor(x), Math.floor(y)) > .7; return st ? [200, 40, 40] : [40 + 215 * k, 90 + 140 * k, 60 + 60 * k]; }));
// reachability flood fill from the spawn
const nav = w.nav, NW = w.nw, NH = w.nh, seen = new Uint8Array(NW * NH); const sp = w.pois.find(p => p.type === 'spawn') || { x: 200, y: 200 };
let q = [Math.floor(sp.y * 2) * NW + Math.floor(sp.x * 2)]; if (nav[q[0]]) console.log('!! spawn is blocked'); seen[q[0]] = 1;
while (q.length) { const n = []; for (const i of q) { const x = i % NW, y = i / NW | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= NW || Y >= NH) continue; const j = Y * NW + X; if (seen[j] || nav[j]) continue; seen[j] = 1; n.push(j); } } q = n; }
save('nav', w.w * S, w.h * S, img((x, y) => { const i = Math.floor(y * 2) * NW + Math.floor(x * 2); return nav[i] ? [40, 40, 50] : seen[i] ? [200, 220, 200] : [230, 80, 200]; }));
const ZC = [[90, 90, 90], [111, 143, 216], [201, 120, 92], [79, 163, 160], [185, 143, 208], [224, 168, 78], [224, 111, 154], [138, 143, 153], [95, 174, 106], [127, 143, 176]];
save('zone', w.w * S, w.h * S, img((x, y) => ZC[w.zoneAt(x, y)] || [0, 0, 0]));
const bad = w.pois.filter(p => !seen[Math.floor(p.y * 2) * NW + Math.floor(p.x * 2)] && p.type !== 'landmark' && p.type !== 'bench');
const kinds = {}; for (const o of w.objs) kinds[o.a.kind] = (kinds[o.a.kind] || 0) + 1; const pk = {}; for (const p of w.pois) pk[p.type] = (pk[p.type] || 0) + 1;
console.log(`generated in ${ms} ms (gen ${w.genMs} ms); objects ${w.objs.length}`, JSON.stringify(kinds), 'lights', w.lights.length, 'pois', JSON.stringify(pk));
console.log('unreachable pois:', bad.length, bad.slice(0, 40).map(p => `${p.id || p.type}@${p.x},${p.y}`).join(' '));
if (args.includes('--pois')) for (const p of w.pois) if (['door', 'station', 'spawn', 'taxistand', 'busstop'].includes(p.type)) console.log(p.type, p.id, p.name || '', p.x, p.y);
