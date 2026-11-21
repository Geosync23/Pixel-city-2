// pushdoor_check: hold-and-steer INTO a door walks you through it (owner msg 273), with a buffer.   node tools/pushdoor_check.mjs
// Real pointer holds on the built game at 390x844. Checks: flat -> out by pushing the Leave door; no bounce back while still holding; street door of
// your building by pushing into it; walking PAST a door along the wall does not go in; a short brush (under the hold time) does not go in.
import { boot } from './fe_lib.mjs';
const B = await boot({ w: 390, h: 844 }); const { pg, ev } = B; let fails = 0;
const ok = (c, name, d = '') => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + name + (d ? '  [' + d + ']' : '')); };
await B.newGame(); await ev(() => { G.firstEvening.skip(); G.firstTime.setEnabled(false); }); await pg.waitForTimeout(800);
/* the screen point whose WORLD point (as the game's own hold-steering reads it, G.toWorld) is (x, y): on raised ground the plain projection is off by the height */
const scr = (x, y) => ev(([x, y]) => { const r = G.cv.getBoundingClientRect(); let tx = x, ty = y, p; for (let k = 0; k < 4; k++) { p = G.toScreen(tx, ty, 0); const w = G.toWorld(p.x + r.left, p.y + r.top); tx += x - w.x; ty += y - w.y; } p = G.toScreen(tx, ty, 0); return [p.x + r.left, p.y + r.top]; }, [x, y]);
const st = () => ev(() => ({ sc: G.scene.id, x: +G.player.x.toFixed(2), y: +G.player.y.toFixed(2), modal: G.modal }));
const door = re => ev(src => { const x = new RegExp(src, 'i'); const it = G.interactables().filter(i => !i.ent && x.test(i.label || '')).sort((a, b) => Math.hypot(a.x - G.player.x, a.y - G.player.y) - Math.hypot(b.x - G.player.x, b.y - G.player.y))[0]; return it ? { x: it.x, y: it.y, label: it.label } : null; }, re.source);
/* hold the pointer at a world point that lies `far` tiles beyond (tx,ty) on the line from the player, for ms; the camera follows, so the hold point is re-aimed */
async function holdToward(tx, ty, ms, { far = 1.5, until = null, arg = null } = {}) {
  const p0 = await st(), d0 = Math.hypot(tx - p0.x, ty - p0.y) || 1, ux = (tx - p0.x) / d0, uy = (ty - p0.y) / d0;   /* a thumb keeps ONE direction: 3 tiles ahead of the player along the first player->door line */
  const aim = async () => { const p = await st(); const c = await scr(p.x + ux * 3, p.y + uy * 3); return [Math.max(20, Math.min(370, c[0])), Math.max(160, Math.min(700, c[1]))]; };
  let c = await aim(); await pg.mouse.move(c[0], c[1]); await pg.mouse.down(); const t0 = Date.now(); let hit = null;
  while (Date.now() - t0 < ms) { await pg.waitForTimeout(120); if (process.env.PD_V) console.log('   ', JSON.stringify(c), JSON.stringify(await ev(() => ({ sc: G.scene.id, x: +G.player.x.toFixed(2), y: +G.player.y.toFixed(2), hold: !!G.input.hold, modal: G.modal })))); if (until && (hit = await ev(until, arg))) break; c = await aim(); await pg.mouse.move(c[0], c[1]); }
  return { release: () => pg.mouse.up(), hit, ms: Date.now() - t0 };
}
// 1. out of the flat
let s0 = await st(), d = await door(/^Leave|Exit|door/); console.log('flat', JSON.stringify(s0), JSON.stringify(d));
let h = await holdToward(d.x, d.y, 6000, { until: () => !/^int:home/.test(G.scene.id) }); let s1 = await st();
ok(!/^int:home/.test(s1.sc), 'flat: holding into the Leave door walks out', s1.sc + ' after ' + h.ms + ' ms');
// 2. still holding: nothing else is used until the finger lifts
await pg.waitForTimeout(2500); let s2 = await st(); ok(s2.sc === s1.sc, 'after arriving, still holding: no bounce through another door', s2.sc); await h.release(); await pg.waitForTimeout(500);
// 3. street door of the building
await ev(() => { G.go('city'); }); await pg.waitForTimeout(2500); await ev(() => { const it = G.interactables().find(i => /^Juniper Court/.test(i.label || '')); G.player.stop(); G.player.x = it.x + .2; G.player.y = it.y + 2.6; G.snapCam && G.snapCam(); }); await pg.waitForTimeout(700);
d = await door(/Juniper Court/); let c0 = await st(); console.log('street', JSON.stringify(c0), JSON.stringify(d));
const inside = () => !/^city$/.test(G.scene.id);
// 3a. a short brush: stand a step from the door, steer into it for about 0.2 s (a hold needs 0.3 s to become steering), let go -> still on the street
await ev(([x, y]) => { G.player.stop(); G.player.x = x + .1; G.player.y = y + 1.0; }, [d.x, d.y]); await pg.waitForTimeout(500);
h = await holdToward(d.x, d.y, 500); await h.release(); await pg.waitForTimeout(700); let s3 = await st();
ok(s3.sc === 'city', 'street: a short brush toward the door (about 0.2 s of steering) does not go in', JSON.stringify(s3));
// 3b. walking PAST the door along the wall does not go in
if (s3.sc !== 'city') { await ev(() => { G.go('city'); }); await pg.waitForTimeout(2000); }
await ev(([x, y]) => { G.player.stop(); G.player.x = x - 3; G.player.y = y + 1.45; }, [d.x, d.y]); await pg.waitForTimeout(600);
h = await holdToward(d.x + 4, d.y + 1.45, 2600, { far: 3 }); await h.release(); await pg.waitForTimeout(500); let s4 = await st();
ok(s4.sc === 'city' && s4.x > d.x + 1, 'street: walking past the door along the wall does not go in', JSON.stringify(s4));
// 3c. pushing into it does
await ev(([x, y]) => { G.player.stop(); G.player.x = x + .2; G.player.y = y + 2.6; }, [d.x, d.y]); await pg.waitForTimeout(600);
h = await holdToward(d.x, d.y, 6000, { until: inside }); let s5 = await st(); await h.release();
ok(s5.sc !== 'city', 'street: holding into the building door walks in', s5.sc + ' after ' + h.ms + ' ms');
await pg.waitForTimeout(800);
// ---- owner msg 281: the MAT / box in front of a door does nothing; the DOOR does ----
const pt = async (x, y, up) => { const c = await ev(([x, y, up]) => { const z = G.world.heightAt(x, y), p = G.toScreen(x, y, z + up), r = G.cv.getBoundingClientRect(); return [Math.round(p.x + r.left), Math.round(p.y + r.top)]; }, [x, y, up]); if (c[0] < 5 || c[0] > 385 || c[1] < 130 || c[1] > 780) console.log('   (tap point off the playfield: ' + c + ')'); return c; };
const goCity = async () => { await ev(() => { G.go('city'); }); await pg.waitForTimeout(2200); await ev(() => { const it = G.interactables().find(i => /^Juniper Court/.test(i.label || '')); G.player.stop(); G.player.x = it.x + .2; G.player.y = it.y + 2.6; G.snapCam(); }); await pg.waitForTimeout(700); };
// 5. street: walk straight ACROSS the mat (through the threshold point, along the wall) -> stays out
await goCity(); d = await door(/Juniper Court/);
await ev(([x, y]) => { G.player.stop(); G.player.x = x - 2.5; G.player.y = y + .15; }, [d.x, d.y]); await pg.waitForTimeout(500);
h = await holdToward(d.x + 3, d.y + .15, 2400, { far: 3 }); await h.release(); await pg.waitForTimeout(500); let s6 = await st();
ok(s6.sc === 'city' && s6.x > d.x + .8, 'street: walking over the mat in front of the door (not pushing the door) does not go in', JSON.stringify(s6));
// 6. street: TAP the mat -> walks there, stays out; TAP the door -> goes in
await ev(([x, y]) => { G.player.stop(); G.player.x = x + .1; G.player.y = y + 2.1; G.snapCam(); }, [d.x, d.y]); await pg.waitForTimeout(600);
let c = await pt(d.x, d.y, 0); await B.tap(c[0], c[1], 2600); let s7 = await st();
ok(s7.sc === 'city', 'street: a tap on the mat / ground in front of the door only walks there', JSON.stringify(s7));
await ev(([x, y]) => { G.player.stop(); G.player.x = x + .1; G.player.y = y + 2.1; G.snapCam(); }, [d.x, d.y]); await pg.waitForTimeout(600);
c = await pt(d.x, d.y, 1.3); await B.tap(c[0], c[1], 3200); let s8 = await st();
ok(s8.sc !== 'city', 'street: a tap on the door itself goes in', s8.sc);
// 7. a room with a floor exit (cafe): mat = nothing, past the mat = out
await ev(() => { G.go('int:cafe', { fresh: true }); }); await pg.waitForTimeout(2500); d = await door(/^Exit/);
const out = await ev(([x, y]) => { const it = G.interactables().find(i => i.exit && Math.hypot(i.x - x, i.y - y) < .1); let v = null, bk = 9; for (const [ax, ay] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) for (const k of [.5, .8, 1.1, 1.4]) { if (k >= bk) break; if (G.world.isBlocked(it.x + ax * k, it.y + ay * k)) { bk = k; v = [ax, ay]; break; } } return v; }, [d.x, d.y]);
console.log('cafe exit', JSON.stringify(d), 'out', JSON.stringify(out));
await ev(([x, y, o]) => { G.player.stop(); G.player.x = x - o[0] * 1.9 + .1; G.player.y = y - o[1] * 1.9; G.snapCam(); }, [d.x, d.y, out]); await pg.waitForTimeout(600);
c = await pt(d.x, d.y, 0); await B.tap(c[0], c[1], 2800); let s9 = await st();
ok(s9.sc === 'int:cafe' && Math.hypot(s9.x - d.x, s9.y - d.y) < 1, 'cafe: a tap on the doormat walks onto it and stays in', JSON.stringify(s9));
await pg.waitForTimeout(1500); let s9b = await st(); ok(s9b.sc === 'int:cafe', 'cafe: standing on the doormat does not leave', s9b.sc);
h = await holdToward(d.x + out[0] * 3, d.y + out[1] * 3, 4000, { until: () => G.scene.id !== 'int:cafe' }); let s10 = await st(); await h.release(); await pg.waitForTimeout(600);
ok(s10.sc !== 'int:cafe', 'cafe: pushing on past the mat (into the way out) leaves', s10.sc + ' after ' + h.ms + ' ms');
await ev(() => { G.go('int:cafe', { fresh: true }); }); await pg.waitForTimeout(2500);
await ev(([x, y, o]) => { G.player.stop(); G.player.x = x - o[0] * 1.9 + .1; G.player.y = y - o[1] * 1.9; G.snapCam(); }, [d.x, d.y, out]); await pg.waitForTimeout(600);
await ev(([x, y, o]) => { G.player.stop(); G.player.x = x - o[0] * .4; G.player.y = y - o[1] * .4; G.snapCam(); }, [d.x, d.y, out]); await pg.waitForTimeout(1200); ok((await st()).sc === 'int:cafe', 'cafe: (set-up) standing by the mat, still inside');
c = await pt(d.x + out[0] * 1.6, d.y + out[1] * 1.6, 0); await B.tap(c[0], c[1], 3500); let s11 = await st();
ok(s11.sc !== 'int:cafe', 'cafe: a tap on the way out past the mat leaves', s11.sc);
// 8. the flat: tap the floor in front of the Leave door -> stays; tap the door -> out
await ev(() => { G.housing.goHome(); }); await pg.waitForTimeout(3500); d = await door(/^Leave/);
await ev(([x, y]) => { G.player.stop(); G.player.x = x - .2; G.player.y = y + 2.3; G.snapCam(); }, [d.x, d.y]); await pg.waitForTimeout(600);
c = await pt(d.x, d.y + .85, 0); await B.tap(c[0], c[1], 2600); let s12 = await st(); ok(/^int:home/.test(s12.sc), 'flat: a tap on the floor in front of the door only walks there', JSON.stringify(s12));
await ev(([x, y]) => { G.player.stop(); G.player.x = x - .2; G.player.y = y + 2.3; G.snapCam(); }, [d.x, d.y]); await pg.waitForTimeout(600);
c = await pt(d.x, d.y, 1.1); await B.tap(c[0], c[1], 3200); let s13 = await st(); ok(!/^int:home/.test(s13.sc), 'flat: a tap on the door itself leaves', s13.sc);
ok(!B.errs.length, 'zero page errors', B.errs.join(' | '));
console.log(fails ? fails + ' FAILED' : 'ALL PASS'); await B.close(); process.exit(fails ? 1 : 0);
