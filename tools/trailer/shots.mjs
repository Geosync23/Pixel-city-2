import { R8 } from './shots_r8.mjs';
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

/* round 3 (owner msg 212): close views of the character doing things, no panels (all UI hidden).
   act: the game's own activity (G.activities.start(id, { fx, force })) at a fixture of the room (by function tag) or, in the city, at a world interactable; camera on the player, zoom z.
   job: G.jobs.debugStart(job) (hire + go to the workplace + clock in), then the shift's steps are completed one after another (G.jobs.debugStep) so the character moves between its stations. */
const act = (room, id, tag, z = 5, o = {}) => ({ url: city(o.h || 15), sec: o.sec || 3.5, settle: 3,
  setup: c => c.ev(async ([room, id, tag, z, o]) => { const p = G.player; if (room) await G.go(room.startsWith('city') ? 'city' : 'int:' + room, Object.assign({ fade: false }, o.at ? { x: o.at[0], y: o.at[1] } : {})); p.hidden = false; G.camTarget = null;
    let fx = null; if (G.scene.fixtures) { const L = G.scene.fixtures.filter(f => f.tags.includes(tag)); fx = L[o.n || 0] || L[0]; }
    if (fx && fx.use) { p.x = fx.use.x; p.y = fx.use.y; }
    let r = null; if (fx) r = G.activities.start(id, { fx, force: true, minutes: 600 }); else { const it = G.scene.interactables.find(q => q.x !== undefined && Math.hypot(q.x - p.x, q.y - p.y) < 6 && new RegExp(o.label || '.', 'i').test(q.label || '')); window._it = it ? it.label : null; r = G.activities.start(id, { force: true, minutes: 600, spot: it, poi: it && it.poi }); }
    if (G.busy) G.busy.rate = .5; G.setZoom(z); G.snapCam(); return [!!fx, !!r, G.busy && G.busy.label, p.pose, window._it]; }, [room, id, tag, z, o]).then(r => console.log('act', id, JSON.stringify(r))),
  frame: c => c.ev(() => { for (const w of document.querySelectorAll('#ui .ftw')) { w.remove(); G.modal = 0; } const p = G.player; TR.cam.x = p.x; TR.cam.y = p.y; TR.cam.z = p.z; G.camTarget = TR.cam; G.camDY = 0; }) });
const job = (id, z = 5, o = {}) => ({ url: city(o.h || 10), sec: o.sec || 8, settle: 2,
  setup: async c => { c.ev(id => { G.player.hidden = false; G.camTarget = null; window._j = G.jobs.debugStart(id); window._log = []; window._mg = 0; window._cool = 0; }, id); await wait(2500); console.log('job', id, JSON.stringify(await c.ev(z => { G.setZoom(z); G.snapCam(); return [G.scene.id, G.jobs.onShift(), G.player.x, G.player.y, JSON.stringify(G.jobs.hud()).slice(0, 300)]; }, z))); },
  /* play the shift the way a player does: tap the current step's station (G.jobs.goStep -> the character walks there); the step's mini-game sheet is hidden, held for a second with the work pose, then finished through the game's test hook */
  frame: (c, t, i) => c.ev(i => { const p = G.player; for (const w of document.querySelectorAll('#ui .ftw')) { w.remove(); G.modal = Math.max(0, G.modal - 1); }
    TR.cam.x += (p.x - TR.cam.x) * .15; TR.cam.y += (p.y - TR.cam.y) * .15; TR.cam.z = p.z; if (i === 0) { TR.cam.x = p.x; TR.cam.y = p.y; } G.camTarget = TR.cam; G.camDY = 0;
    const open = G.minigame.isOpen() || G.modal > 0 || !!G.busy; if (open) { window._mg++; if (!G.busy) p.pose = 'work'; if (window._mg > 32) { try { G.minigame.abort(); } catch (e) { } if (G.busy) G.endActivity(false); const id = G.jobs.debugStep(); for (const w of document.querySelectorAll('#ui .modal, #ui .mg')) w.remove(); G.modal = 0; p.pose = null; window._mg = 0; window._cool = 6; window._log.push([i, 'done', id]); } return; }
    if (window._cool-- > 0 || p.path) return; const hh = G.jobs.hud(), h = hh && hh.orders; if (h && h[0]) { G.jobs.goStep(h[0].id); window._cool = 10; window._log.push([i, 'go', h[0].title, +p.x.toFixed(1), +p.y.toFixed(1), !!p.path]); } }, i).then(async () => { if (i === 235) console.log(JSON.stringify(await c.ev(() => window._log))); }) });

/* ---- density pass (owner msg 215): the held city shots at each place's really busy hour, nothing added. ----
   busy(): let the simulation run `min` seconds at the take's start position (the game fills the view by its own rules), reading what is in view once a second;
   then wait up to `max` seconds in all for a moment at least as busy as the 85th percentile of what was seen. Only waiting; nothing is spawned or changed. */
const busy = (min = 45, max = 75) => async c => { const seen = []; const score = d => d ? d[0] + 4 * d[1] : 0; for (let k = 0; k < max; k++) { await c.settle(1); const d = await c.ev(() => TR.count()); seen.push(score(d));
    if (k >= min) { const srt = seen.slice().sort((a, b) => a - b), p85 = srt[Math.floor(srt.length * .85)]; if (score(d) >= p85) { console.log('busy: waited', k + 1, 's; in view', JSON.stringify(d), 'p85', p85, 'median', srt[srt.length >> 1]); return; } } } console.log('busy: took the moment at', max, 's'); };
/* the clock runs while the street fills (1 s = 0.85 game minutes), so each shot starts about an hour before the time it is filmed at: START 16:12 -> filmed about 17:00-17:20 */
const RUSH = 16.2;   // a weekday (day 0 = Monday), evening rush: traffic at its daily maximum (src/sim/traffic.js timeF = 1 from 16 to 19), crowd factor at its cap (weather.js crowdFactor: afternoon 1.0 x rush 1.3, capped at 1)
const D = {
  /* opening: same corner, hour, zoom and pan as before; 45-90 s of running instead of 14 */
  d_open: { url: city(16.2), setup: free(236, 257, 3), ready: busy(), sec: 6, frame: pan([236, 257], [241.6, 257], 6) },
  /* on foot: same walk across the City Hall plaza */
  d_foot: { url: city(RUSH), setup: walk([216, 226], [238, 226], 3), ready: async c => { await busy()(c); await c.ev(() => window._walk()); }, sec: 3.4 },
  /* bus: same follow shot from the same corner */
  d_bus: Object.assign({ url: city(RUSH), sec: 3.4 }, bus(207, 244, 3), { settle: 55 }),   // the old helper (camera on the nearest moving bus), from the street the earlier bus shot was on, after 55 s of running
  /* train: the camera waits at Central for 45 s, then for the next real departure (no clock jump), then follows the train as before */
  d_train: { url: city(RUSH), sec: 3.4, setup: c => c.ev(() => { const S = G.rail.station('central'); TR.free(S.x, S.y - 2, 2); }),
    ready: async c => { await busy(45, 60)(c); for (let k = 0; k < 400; k++) { const r = await c.ev(() => { const s = G.rail.trains().find(s => s.at === 'central' && s.toDepart < .3 && s.v < .01); if (!s) return null; window._tr = [s.dir, s.train]; return [s.dir, s.train, s.x, s.y, G.now().clock]; }); if (r) { console.log('train', JSON.stringify(r)); break; } await c.settle(.25); } await c.settle(2.5); },
    frame: c => c.ev(() => { const s = G.rail.trainState(window._tr[0], window._tr[1]); TR.cam.x += (s.x - TR.cam.x) * .5; TR.cam.y += (s.y - TR.cam.y) * .5; TR.move(TR.cam.x, TR.cam.y); }) },
  /* boardwalk: same place, hour, zoom and pan */
  d_board: { url: city(17.65), setup: free(98, 344.5, 2), ready: busy(), sec: 3, frame: pan([98, 344.5], [98 + 5.6 / 2, 344.5], 3) },
  /* cab: a real ride (G.transit.callTaxi, clinic to grocery) along the same Old Town river road. New: the camera does not ride with the cab. It waits on the river road (the game's crowd and
     traffic live around the camera, so the street is in its steady state when the cab arrives; around a cab at full speed the game cannot fill the street fast enough) and drifts a little with the cab as it passes.
     The see-through effect for things in front of the ridden cab stays switched off, as in the previous take. */
  d_cab: { url: city(16.35), sec: 29,
    setup: async c => { c.ev(async () => { await G.go('city', { x: 130, y: 196, fade: false }); const p = G.player; p.hidden = false; G.setZoom(3); TR.cam.x = 147; TR.cam.y = 233; TR.cam.z = G.world.heightAt(147, 233); G.camTarget = TR.cam; G.snapCam(); G.renderer.warm(G.world, G.cam); window._wait = 1; }); await wait(1200); },
    ready: async c => { await busy(40, 60)(c); await c.ev(() => { window._p = G.transit.callTaxi('grocery', { silent: true }); }); },
    frame: (c, t, i) => c.ev(i => { const r = G.transit.ride, v = r && r.vehicle; if (r && !window._rs) { window._rs = i; } if (v) { v.ghost = false; G.player.ghost = false; for (const e of G.scene.ents) if (e.ghost) e.ghost = false; }
      const cx = v ? Math.max(146, Math.min(154, 150 + (v.x - 150) * .3)) : 147; TR.cam.x += (cx - TR.cam.x) * .2; TR.cam.y = 233; G.camTarget = TR.cam; const on = v && Math.abs(v.y - 233) < 1.5 && v.x > 137 && v.x < 163; if (on && !window._in) { window._in = i; return ['in', i, +v.x.toFixed(1)]; } if (!on && window._in && !window._out) { window._out = i; return ['out', i]; } return null; }, i).then(r => { if (r) { console.log('cab', JSON.stringify(r)); if (r[0] === 'in') c.meta({ in: r[1] }); else c.meta({ out: r[1] }); } }) },
};

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
  a16_end: { url: city(20.3), setup: free(236.2, 253.8, 1), settle: 8, sec: 4.2, frame: pan([236.2, 253.8], [232.8, 258.3], 4.2) },

  /* ================= TRAILER B: the mix ================= */
  /* revision (owner msg 211): the film opens on a dense, close downtown street corner under the title card. Candidates c1-c3; the EDL names the one used. Pans move whole canvas pixels per frame. */
  b00_c1: { url: city(12.4), setup: free(219, 229.5, 3), settle: 14, sec: 6, frame: pan([219, 229.5], [224.6, 229.5 + 5.6 - 11.25 + 5.65], 6) },
  b00_c2: { url: city(12.4), setup: free(212, 243, 3), settle: 14, sec: 6, frame: pan([212, 243], [217.6, 243], 6) },
  b00_c3: { url: city(17.2), setup: free(236, 257, 3), settle: 14, sec: 6, frame: pan([236, 257], [241.6, 257], 6) },
  b01_vista: { url: city(13), setup: free(96.6, 357.35, 1), settle: 8, sec: 2.8, frame: pan([96.6, 357.35], [102.4, 352.65], 2.8) },
  b03_foot: { url: city(13.5), setup: walk([216, 226], [238, 226], 3), settle: 8, sec: 3.4, ready: c => c.ev(() => window._walk()) },
  b04_bus: Object.assign({ url: city(13.2), sec: 2.6 }, bus(220, 240, 3)),
  b05_train: Object.assign({ url: city(13), sec: 2.6 }, train('central', 2)),
  b_job: { url: city(10), sec: 3.2, setup: async c => { c.ev(() => { document.body.classList.add('tr-ui'); G.player.hidden = false; G.jobs.debugStart('barista'); }); await wait(2500); await c.ev(() => { G.setZoom(4); G.snapCam(); }); }, settle: 3 },
  b_gym: { url: city(17.5), sec: 3.2, setup: async c => { await c.ev(async () => { document.body.classList.add('tr-ui'); await G.go('int:gym', { fade: false }); const p = G.player; p.hidden = false; G.camTarget = null; const it = G.scene.interactables.find(q => /Treadmill/.test(q.label)); if (it && it.spot) { p.x = it.spot.x; p.y = it.spot.y; } G.setZoom(4); G.snapCam(); window._r = G.skillplay.demo('stride'); }); await wait(600); }, settle: 1, frame: tap },
  b_cook: { url: city(18.5), sec: 3.2, setup: async c => { await c.ev(async () => { document.body.classList.add('tr-ui'); await G.go('int:home:marlowe_1br', { fade: false }); const p = G.player; p.hidden = false; G.camTarget = null; const it = G.scene.fixtures.find(f => f.tags.includes('stove')); if (it && it.use) { p.x = it.use.x; p.y = it.use.y; p.dir = 3; } G.setZoom(4); G.snapCam(); window._r = G.skillplay.demo('ck_chop'); }); await wait(600); }, settle: 1, frame: tap },
  b_fish: { url: city(18.3), sec: 3.2, setup: async c => { await c.ev(async () => { document.body.classList.add('tr-ui'); await G.go('city', { x: 148, y: 250.6, fade: false }); const p = G.player; p.hidden = false; G.camTarget = null; G.setZoom(3); G.snapCam(); window._r = G.skillplay.demo('fish'); }); await wait(600); }, settle: 3, frame: tap },
  /* polish pass: the player walks across the lamplit plaza in the rain (same place and hour as the rough cut, closer: zoom 4, and on the path that works) */
  b_rain: { url: city(19.4, 'rain'), setup: walk([217, 226], [229, 226], 4), settle: 8, sec: 3.2, ready: async c => { console.log('rain', JSON.stringify(await c.ev(() => { for (const w of document.querySelectorAll('#ui .ftw, #ui .modal')) w.remove(); const m = G.modal; G.modal = 0; window._walk(); return [m, G.player.path && G.player.path.length]; }))); await c.settle(.5); },
    frame: c => c.ev(() => { if (G.modal) { for (const w of document.querySelectorAll('#ui .ftw, #ui .modal')) w.remove(); G.modal = 0; } if (!G.player.path && G.player.x < 228) window._walk(); }) },   // the game's first-time 'rain' card pauses the world; it is removed
  /* polish pass: Tasha is in the picture. The date scene (G.rel.debug.fire('fd.tasha')) brings its own companion figure and stands her one tile diagonally from the player, which on screen is right behind / in front of the player. The player is moved one tile so the two stand side by side at the River Walk rail, facing each other; camera between them, zoom 4. */
  b_date: { url: city(19), sec: 3.2, setup: async c => { c.ev(async () => { document.body.classList.add('tr-ui'); await G.go('city', { x: 164, y: 219, fade: false }); G.player.hidden = false; G.camTarget = null; window._r = G.rel.debug.fire('fd.tasha'); }); await wait(3000);
      console.log('date', JSON.stringify(await c.ev(() => { const p = G.player, e = G.scene.ents.find(e => e.chComp && Math.hypot(e.x - p.x, e.y - p.y) < 3); if (!e) return null; p.x = e.x - 1.1; p.y = e.y; p.z = G.world.heightAt(p.x, p.y); p.dir = 0; e.dir = 2; window._mid = { x: (p.x + e.x) / 2, y: p.y, z: p.z }; G.camTarget = window._mid; G.setZoom(4); G.snapCam(); return [p.x, p.y, e.x, e.y, G.world.isBlocked(p.x, p.y)]; }))); }, settle: 3, frame: c => c.ev(() => { const p = G.player, e = G.scene.ents.find(e => e.chComp); p.dir = 0; if (e) e.dir = 2; }) },
  b_fest: { url: city(19), sec: 4.2, setup: c => c.ev(() => { G.cityEvents.debug.start('lantern_parade'); G.cityEvents.debug.parade(.35); TR.free(109, 277, 2); }), settle: 6, frame: pan([109, 277], [104, 280], 4.2) },
  b_home: { url: city(20.5), sec: 3.2, setup: c => c.ev(async () => { await G.go('int:home:villa_belvedere', { fade: false }); const p = G.player; p.hidden = false; G.camTarget = null; G.setZoom(3); const it = G.scene.interactables.find(q => /^Sit/.test(q.label || '')); window._sit = it ? it.label : null; if (it) G.useInteractable(it); G.snapCam(); return window._sit; }).then(r => console.log('sit', r)), settle: 6, ready: c => c.ev(() => { const p = G.player; window._h = [p.x, p.y]; TR.cam.x = p.x; TR.cam.y = p.y; TR.cam.z = p.z; G.camTarget = TR.cam; G.snapCam(); }), frame: (c, t) => c.ev(u => { TR.move(window._h[0] - 1.5 + 6 * u, window._h[1], false); }, t / 3.2) },   // polish pass: a slow drift toward the fireplace instead of a locked-off still
  b_sunset: { url: city(19.2), setup: free(40.75, 350.75, 2), settle: 6, sec: 3.2, frame: pan([40.75, 350.75], [36.25, 352.25], 3.2, { mins: 20 }) },
  /* round 5: a cab ride on low-rise streets inside the rail loop (no viaduct, no tower in front of the cab): Old Town to the clinic / to the bakery. The game's own ride and ride camera. */
  b_cab2: { url: city(13.3), sec: 18,
    setup: async c => { c.ev(async () => { await G.go('city', { x: 96, y: 278, fade: false }); G.player.hidden = false; G.camTarget = null; G.setZoom(3); G.snapCam(); window._p = G.transit.callTaxi('clinic', { silent: true }); }); await wait(1200); }, settle: 2,
    ready: async c => { for (let k = 0; k < 80; k++) { if (await c.ev(() => !!G.transit.ride)) break; await c.settle(.5); } },
    frame: (c, t, i) => c.ev(i => { if (!G.transit.ride && !window._e) { window._e = i; return i; } return null; }, i).then(r => { if (r) { console.log('rideEnd@' + r); c.meta({ end: r }); } }) },
  b_cab4: { url: city(13.3), sec: 18,
    setup: async c => { c.ev(async () => { await G.go('city', { x: 130, y: 196, fade: false }); G.player.hidden = false; G.camTarget = null; G.setZoom(3); G.snapCam(); window._p = G.transit.callTaxi('grocery', { silent: true }); }); await wait(1200); }, settle: 2,
    ready: async c => { for (let k = 0; k < 80; k++) { if (await c.ev(() => !!G.transit.ride)) break; await c.settle(.5); } },
    /* the game fades whatever stands in front of the ridden cab; switched off for this shot (ghost = false every frame) so nothing on screen turns see-through */
    frame: (c, t, i) => c.ev(i => { for (const e of G.scene.ents) if (e.ghost && e !== G.player) { e.ghost = false; window._gh = (window._gh || 0) + 1; } G.player.ghost = false; if (!G.transit.ride && !window._e) { window._e = i; return i; } return null; }, i).then(r => { if (r) { console.log('rideEnd@' + r); c.meta({ end: r }); } }) },
  b_cab5: { url: city(13.3), sec: 18,
    setup: async c => { c.ev(async () => { await G.go('city', { x: 282, y: 183, fade: false }); G.player.hidden = false; G.camTarget = null; G.setZoom(3); G.snapCam(); window._p = G.transit.callTaxi('clinic', { silent: true }); }); await wait(1200); }, settle: 2,
    ready: async c => { for (let k = 0; k < 80; k++) { if (await c.ev(() => !!G.transit.ride)) break; await c.settle(.5); } },
    frame: (c, t, i) => c.ev(i => { if (!G.transit.ride && !window._e) { window._e = i; return i; } return null; }, i).then(r => { if (r) { console.log('rideEnd@' + r); c.meta({ end: r }); } }) },
  b_cab3: { url: city(13.3), sec: 18,
    setup: async c => { c.ev(async () => { await G.go('city', { x: 130, y: 196, fade: false }); G.player.hidden = false; G.camTarget = null; G.setZoom(3); G.snapCam(); window._p = G.transit.callTaxi('bakery', { silent: true }); }); await wait(1200); }, settle: 2,
    ready: async c => { for (let k = 0; k < 80; k++) { if (await c.ev(() => !!G.transit.ride)) break; await c.settle(.5); } },
    frame: (c, t, i) => c.ev(i => { if (!G.transit.ride && !window._e) { window._e = i; return i; } return null; }, i).then(r => { if (r) { console.log('rideEnd@' + r); c.meta({ end: r }); } }) },
  b_city2: { url: city(18.6), setup: free(98, 344.5, 2), settle: 12, sec: 3, frame: pan([98, 344.5], [98 + 5.6 / 2, 344.5], 3) },
  /* round 3 candidates */
  x_barista: job('barista', 4), x_station: job('station_agent', 4), x_cook: job('line_cook', 4), x_fire: job('firefighter', 4), x_dj: job('radio_dj'), x_aqua: job('aquarist', 4), x_florist: job('florist'),
  x_tread: act('gym', 'gym_treadmill', 'treadmill', 4), x_weights: act('gym', 'gym_weights', 'weights'), x_dance: act('bar', 'dance', 'dancefloor', 4, { h: 21 }), x_piano: act('home:villa_belvedere', 'practice_instrument', 'instrument', 5, { h: 19 }),
  x_cookhome: act('home:marlowe_1br', 'cook', 'stove', 5, { h: 18.5 }), x_fish: act('city', 'fish_pier', 'fishing_spot', 4, { h: 18.3, at: [148, 250.6], label: 'fish' }), x_paint: act('home:easel_house', 'paint', 'easel', 4), x_pool: act('bar', 'play_pool', 'pool', 5, { h: 21 }),
  /* round 8 (owner msg 217) candidates */
  x_gate: job('gate_agent', 4), x_bag: job('baggage_handler', 4), x_hair: job('hair_stylist', 4), x_dock: job('dock_worker', 4), x_courier: job('courier', 4),
  x_garden: act('city', 'garden', 'garden_plot', 4, { h: 14, at: [347.3, 211.5], label: 'garden' }), x_swing: act('city', 'swing', 'swing', 4, { h: 14, at: [65, 186], label: 'swing' }),
  x_ferris: act('city', 'ride_ferris_wheel', 'ferris_wheel', 3, { h: 14, at: [100, 372.6], label: 'wheel' }), x_picnic: act('city', 'picnic', 'picnic_spot', 4, { h: 14, at: [129, 169.5], label: 'picnic' }), x_ducks: act('city', 'feed_ducks', 'duck_pond', 4, { h: 14, at: [96, 171.5], label: 'duck' }),
  ...R8({ city, free, pan, walk, busy }),
  ...D, d_cab2: D.d_cab, d_cab3: D.d_cab, d_bus2: D.d_bus, d_foot2: D.d_foot, d_open2: D.d_open, d_board2: D.d_board, d_foot3: D.d_foot, d_foot4: D.d_foot, d_bus3: D.d_bus, d_train2: D.d_train,
};
