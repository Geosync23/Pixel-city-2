// Fallback test town: only used when no real 'city' scene has been registered. Exercises terrain, objects, lighting.
import { World, GT } from '../engine/world.js';
import { rng } from '../engine/raster.js';
import { Char, charArt } from '../core/char.js';
export const order = 900;
export function init(G) {
  if (G.scenes.has('city')) return;
  G.registerScene('city', () => {
    const w = new World(96, 96, { name: 'testtown' }); const r = rng(5);
    w.ground(0, 0, 96, 96, GT.grass);
    // terraces rising toward the back (low x/y), a hill, and a river
    w.sculpt(0, 0, 96, 96, (x, y) => { let z = 0; if (y < 40) z = 2; if (y < 22) z = 5; if (x < 20 && y < 60) z += 2; const d = Math.hypot(x - 70, y - 20); if (d < 14) z += Math.round((14 - d) * .5 * 4) / 4; return z; });
    w.ramp(44, 40, 52, 46, 'y', 2, 0); w.ramp(44, 22, 52, 28, 'y', 5, 2);
    w.ground(0, 62, 96, 70, GT.water); w.sculpt(0, 62, 96, 70, () => -0.5); w.ground(0, 60, 96, 62, GT.sand); w.ground(0, 70, 96, 72, GT.sand);
    w.ground(44, 0, 52, 62, GT.sidewalk); w.ground(46, 0, 50, 62, GT.asphalt);
    w.ground(0, 48, 96, 56, GT.sidewalk); w.ground(0, 50, 96, 54, GT.asphalt);
    w.ground(20, 40, 24, 46, GT.stairs); w.ramp(20, 40, 24, 46, 'y', 2, 0);
    w.ground(54, 30, 70, 44, GT.plaza); w.ground(26, 28, 40, 38, GT.park);
    w.bakeTerrainNav();
    for (let i = 0; i < 6; i++) w.place('ex.shop', 54 + i * 7, 41, { p: { w: 6, d: 5, floors: 2 + (i % 2), seed: i + 1, name: ['CAFE', 'BOOKS', 'DELI', 'TEA', 'ART', 'PIES'][i] }, flip: false });
    for (let i = 0; i < 4; i++) w.place('ex.shop', 36, 2 + i * 9, { p: { w: 6, d: 5, floors: 2, seed: 20 + i, name: 'SHOP' }, flip: true });
    for (let i = 0; i < 60; i++) { const x = 2 + r() * 92, y = 2 + r() * 92; if (w.tileType(x, y) !== GT.grass && w.tileType(x, y) !== GT.park) continue; if (w.steep(Math.floor(x), Math.floor(y)) > .1) continue; w.place('ex.tree', x, y, { p: { seed: 1 + (r() * 3 | 0) } }); }
    for (let x = 4; x < 92; x += 8) { w.place('ex.lamp', x, 48.5); w.place('ex.lamp', x + 4, 55.2); }
    const ents = [], A = charArt(); const walkers = [];
    for (let i = 0; i < 30; i++) { const c = new Char(A.randomSpec(r, {}), 4 + r() * 88, r() < .5 ? 49 : 55); c.speed = 1.5 + r() * 1.5; c.vx = r() < .5 ? 1 : -1; ents.push(c); walkers.push(c); }
    return { world: w, ents, spawn: { x: 60, y: 47 }, update(dt) { for (const c of walkers) { c.move(w, dt, [c.vx, 0]); if (c.x > 94) c.vx = -1; if (c.x < 2) c.vx = 1; } } };
  });
}
