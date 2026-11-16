// The shot list of both trailers (interiors of the door montage: rooms.mjs). Each shot: { url, setup(ctx), settle, ready(ctx), sec, frame(ctx, t, i) }.
// ctx.ev(fn, arg) runs in the page (window.G, window.TR helpers from lib.mjs). All staging is done from outside; src/ is not touched.
// ctx.meta(obj) stores numbers the edit needs (e.g. the touchdown frame) in <scratch>/meta/<id>.json.
const lerp = (a, b, u) => a + (b - a) * u, ease = u => u * u * (3 - 2 * u);
const wait = ms => new Promise(r => setTimeout(r, ms));
/* free camera pan a -> b (world coords) over `sec`, optional time-lapse of `mins` game minutes over the shot */
const pan = (a, b, sec, o = {}) => async (ctx, t) => { const u = Math.min(1, t / sec), e = o.ease ? ease(u) : u; await ctx.ev(([x, y, m]) => { TR.move(x, y); if (m) G.advance(m); }, [lerp(a[0], b[0], e), lerp(a[1], b[1], e), o.mins ? o.mins / (sec * 30) : 0]); };
const city = (h, w = 'clear') => `?scene=city&t=${h}&debug&weather=${w}`;
const free = (x, y, z) => c => c.ev(([x, y, z]) => TR.free(x, y, z), [x, y, z]);
/* the player on foot in the city: appear at a, walk to b, the game's own camera follows */
const walk = (a, b, z) => c => c.ev(([a, b, z]) => { const p = G.player; p.hidden = false; G.camTarget = null; p.x = a[0]; p.y = a[1]; G.setZoom(z); G.snapCam(); window._walk = () => p.goTo(G.world, b[0], b[1]); }, [a, b, z]);
const auto = c => c.ev(() => { const b = [...document.querySelectorAll('#ui button')].find(b => b.textContent.trim() === 'Auto'); if (b) b.click(); return !!b; });
/* follow the trainset that is next to leave `st`: advance the clock to just before it departs, then keep the camera on it */
const train = (st, z) => ({
  setup: free(213, 300, z), settle: 1,
  ready: async c => { const r = await c.ev(st => { let best = null; for (let k = 0; k < 400 && !best; k++) { for (const s of G.rail.trains()) if (s.at === st && s.toDepart < .35 && s.v < .01) best = s; if (!best) G.advance(.25); } if (!best) return null; window._tr = [best.dir, best.train]; TR.free(best.x, best.y); return [best.dir, best.train, best.x, best.y, G.now().clock]; }, st); console.log('train', JSON.stringify(r)); await c.settle(2.5); },
  frame: c => c.ev(() => { const s = G.rail.trainState(window._tr[0], window._tr[1]); TR.cam.x += (s.x - TR.cam.x) * .5; TR.cam.y += (s.y - TR.cam.y) * .5; TR.move(TR.cam.x, TR.cam.y); }),
});
/* follow the moving bus nearest to the camera */
const bus = (x, y, z) => ({
  setup: free(x, y, z), settle: 8,
  ready: c => c.ev(() => { const b = G.traffic.buses.filter(b => b.veh && !b.atStop).sort((a, b) => Math.hypot(a.veh.x - TR.cam.x, a.veh.y - TR.cam.y) - Math.hypot(b.veh.x - TR.cam.x, b.veh.y - TR.cam.y))[0] || G.traffic.buses.find(b => b.veh); window._bus = b; if (b) TR.free(b.veh.x, b.veh.y); return b ? [b.id, b.veh.x, b.veh.y] : null; }).then(r => console.log('bus', JSON.stringify(r))),
  frame: c => c.ev(() => { const v = window._bus && window._bus.veh; if (v) TR.move(v.x, v.y); }),
});
/* play a mini-game from outside: a real mouse click on its canvas every 0.4 s */
const tap = async (c, t, i) => { if (i % 12 !== 6) return; const cv = await c.page.$$('#ui canvas'); const el = cv[cv.length - 1]; if (!el) return; const b = await el.boundingBox(); if (b) await c.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
const LUG = `try { G.state.intro = G.state.intro || {}; G.luggage.pickUp(); } catch (e) { }`;   // the intro suitcase, towed (the game's own G.luggage)

export const SHOTS = {
  /* ================= TRAILER A: The City Wakes Up ================= */
  a01_light: { url: city(4.6), setup: free(34, 346, 1), settle: 3, sec: 7.4, frame: pan([34, 346], [44, 350], 7.4, { mins: 112 }) },
  a02_harbor: { url: city(6.0), setup: free(99, 343, 2), settle: 6, sec: 2.8, frame: pan([99, 343], [103, 345], 2.8, { mins: 8 }) },
  a03_train: Object.assign({ url: city(6.2), sec: 3.2 }, train('central', 2)),
  a04_lamps: { url: city(5.9), setup: free(222, 236, 2), settle: 6, sec: 2.8, frame: pan([222, 236], [224, 238], 2.8, { mins: 85 }) },
  a05_bus: Object.assign({ url: city(7.2), sec: 3.2 }, bus(220, 240, 3)),
  a06_folk: { url: city(8.1), setup: free(222, 227, 3), settle: 10, sec: 2.8, frame: pan([222, 227], [224, 228], 2.8) },
  a07_vista: { url: city(8.5), setup: free(234, 258, 1), settle: 8, sec: 2.8, frame: pan([234, 258], [229, 266], 2.8) },
  a08_plane: { url: city(9), setup: free(372, 30, 1), settle: 2, sec: 9.5,
    ready: c => c.ev(() => { window._f = G.planes.landNow('airliner'); window._td = -1; }),
    frame: async (c, t, i) => { const r = await c.ev(i => { const f = window._f; TR.move(Math.max(318, Math.min(380, f.cx - 2)), 31, true); if (f.phase !== 'air' && window._td < 0) window._td = i; return window._td; }, i); if (r === i) c.meta({ touchdown: i }); } },
  a09_kerb: { url: city(10), setup: free(323, 101, 2), settle: 8, sec: 2.8, frame: pan([323, 101], [320, 102], 2.8) },
  a10_hall: { url: city(11), setup: c => c.ev(async () => { await G.go('int:airport:terminal', { fade: false }); const s = G.scene.spots; TR.free(s.claim.x + 4, s.claim.y + 1, 2); }), settle: 5, sec: 2.8,
    frame: async (c, t) => c.ev(u => { const s = G.scene.spots; TR.move(s.claim.x + 4 - 3 * u, s.claim.y + 1, false); }, t / 2.8) },
  a11_bag: { url: city(11), sec: 7,
    setup: c => c.ev(async () => { await G.go('int:airport:terminal', { fade: false }); const p = G.player, sc = G.scene; p.hidden = false; G.camTarget = null; p.x = sc.spots.claim.x + 1.6; p.y = sc.spots.claim.y + 1.6; p.dir = 3; G.setZoom(4); G.snapCam(); window._bag = sc.claim[1].add({ mine: 1 }); window._st = 0; }), settle: .2,
    frame: (c, t, i) => c.ev(i => { const p = G.player, b = window._bag, sc = G.scene, d = Math.hypot(p.x - b.x, p.y - b.y); if (window._st === 0 && i > 20) { p.goTo(G.world, b.x + .2, b.y + 1.5); window._st = 1; } if (window._st === 1 && i % 6 === 0 && d > 1.9) p.goTo(G.world, b.x + .2, b.y + 1.5);
      if (window._st === 1 && d < 1.9) { sc.claim[1].remove(b); G.state.intro = G.state.intro || {}; G.luggage.pickUp(); p.goTo(G.world, sc.spots.customs.x + 3, sc.spots.customs.y + 3.5); window._st = 2; return 'grab@' + i; } return null; }, i).then(r => { if (r) { console.log(r); c.meta({ grab: +r.split('@')[1] }); } }) },
  a12_kerbcab: { url: city(12), sec: 14,
    setup: async c => { c.ev(lg => { (0, eval)(lg); G.player.hidden = false; G.camTarget = null; G.setZoom(3); G.snapCam(); window._p = G.transit.callTaxi('diner', { silent: true }); }, LUG); await wait(800); }, settle: 2,
    frame: (c, t, i) => c.ev(i => { if (G.transit.ride && !window._r) { window._r = i; return i; } return null; }, i).then(r => { if (r) { console.log('ride@' + r); c.meta({ ride: r }); } }) },
  a13_cabtown: { url: city(12.5), sec: 16,
    setup: async c => { c.ev(async lg => { (0, eval)(lg); await G.go('city', { x: 189, y: 262.5, fade: false }); G.player.hidden = false; G.camTarget = null; G.setZoom(2); G.snapCam(); window._p = G.transit.callTaxi('diner', { silent: true }); }, LUG); await wait(1200); }, settle: 2,
    ready: async c => { for (let k = 0; k < 60; k++) { if (await c.ev(() => !!G.transit.ride)) break; await c.settle(.5); } },
    frame: (c, t, i) => c.ev(i => { if (!G.transit.ride && !window._e) { window._e = i; return i; } return null; }, i).then(r => { if (r) { console.log('rideEnd@' + r); c.meta({ end: r }); } }) },
  a15_door: { url: city(13), sec: 3, setup: c => c.ev(async lg => { (0, eval)(lg); const d = G.world.pois.find(p => p.id === 'door:diner'); await G.go('city', { x: d.x + 3.2, y: d.y + 1.4, fade: false }); const p = G.player; p.hidden = false; G.camTarget = null; G.setZoom(3); G.snapCam(); window._d = [d.x, d.y]; }, LUG), settle: 5,
    ready: c => c.ev(() => { G.player.goTo(G.world, window._d[0], window._d[1] + .3); }) },
  a16_end: { url: city(20.3), setup: free(236, 254, 1), settle: 8, sec: 4.2, frame: pan([236, 254], [233, 258], 4.2) },

  /* ================= TRAILER B: the mix ================= */
  b01_vista: { url: city(13), setup: free(97, 357, 1), settle: 8, sec: 2.8, frame: pan([97, 357], [102, 353], 2.8) },
  b03_foot: { url: city(13.5), setup: walk([216, 226], [228, 226], 3), settle: 8, sec: 2.2, ready: c => c.ev(() => window._walk()) },
  b04_bus: Object.assign({ url: city(13.2), sec: 2.6 }, bus(220, 240, 3)),
  b05_train: Object.assign({ url: city(13), sec: 2.6 }, train('central', 2)),
  b_job: { url: city(10), sec: 3.2, setup: async c => { c.ev(() => { document.body.classList.add('tr-ui'); G.player.hidden = false; G.jobs.debugStart('barista'); }); await wait(2500); await c.ev(() => { G.setZoom(4); G.snapCam(); }); }, settle: 3 },
  b_gym: { url: city(17.5), sec: 3.2, setup: async c => { await c.ev(async () => { document.body.classList.add('tr-ui'); await G.go('int:gym', { fade: false }); const p = G.player; p.hidden = false; G.camTarget = null; const it = G.scene.interactables.find(q => /Treadmill/.test(q.label)); if (it && it.spot) { p.x = it.spot.x; p.y = it.spot.y; } G.setZoom(4); G.snapCam(); window._r = G.skillplay.demo('stride'); }); await wait(600); }, settle: 1, frame: tap },
  b_cook: { url: city(18.5), sec: 3.2, setup: async c => { await c.ev(async () => { document.body.classList.add('tr-ui'); await G.go('int:home:marlowe_1br', { fade: false }); const p = G.player; p.hidden = false; G.camTarget = null; const it = G.scene.fixtures.find(f => f.tags.includes('stove')); if (it && it.use) { p.x = it.use.x; p.y = it.use.y; p.dir = 3; } G.setZoom(4); G.snapCam(); window._r = G.skillplay.demo('ck_chop'); }); await wait(600); }, settle: 1, frame: tap },
  b_fish: { url: city(18.3), sec: 3.2, setup: async c => { await c.ev(async () => { document.body.classList.add('tr-ui'); await G.go('city', { x: 148, y: 250.6, fade: false }); const p = G.player; p.hidden = false; G.camTarget = null; G.setZoom(3); G.snapCam(); window._r = G.skillplay.demo('fish'); }); await wait(600); }, settle: 3, frame: tap },
  b_rain: { url: city(19.4, 'rain'), setup: walk([214, 225.5], [232, 225.5], 3), settle: 8, sec: 3.2, ready: c => c.ev(() => window._walk()) },
  b_date: { url: city(19), sec: 3.2, setup: async c => { c.ev(async () => { document.body.classList.add('tr-ui'); await G.go('city', { x: 168, y: 221, fade: false }); { const p = G.player; let best = null; for (let dx = -8; dx <= 8; dx += .5) for (let dy = -6; dy <= 6; dy += .5) { const x = 168 + dx, y = 221 + dy, d = Math.hypot(dx, dy); if (d < 3.5 || G.world.isBlocked(x, y) || G.world.isBlocked(x + .5, y) || G.world.isBlocked(x, y + .5)) continue; const sc = Math.abs(d - 4.5) + Math.abs(dy + 2) * .2; if (!best || sc < best[0]) best = [sc, x, y]; } if (best) { p.x = best[1]; p.y = best[2]; } } G.player.hidden = false; G.camTarget = null; G.setZoom(3); G.snapCam(); window._r = G.rel.debug.fire('fd.tasha'); }); await wait(3000); }, settle: 3 },
  b_fest: { url: city(19), sec: 4.2, setup: c => c.ev(() => { G.cityEvents.debug.start('lantern_parade'); G.cityEvents.debug.parade(.35); TR.free(109, 277, 2); }), settle: 6, frame: pan([109, 277], [104, 280], 4.2) },
  b_home: { url: city(20.5), sec: 3.2, setup: c => c.ev(async () => { await G.go('int:home:villa_belvedere', { fade: false }); const p = G.player; p.hidden = false; G.camTarget = null; G.setZoom(3); const it = G.scene.interactables.find(q => /^Sit/.test(q.label || '')); window._sit = it ? it.label : null; if (it) G.useInteractable(it); G.snapCam(); return window._sit; }).then(r => console.log('sit', r)), settle: 6 },
  b_sunset: { url: city(19.2), setup: free(40, 352, 2), settle: 6, sec: 3.2, frame: pan([40, 352], [37, 351], 3.2, { mins: 20 }) },
};
