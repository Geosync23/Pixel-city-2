// The shot list of both trailers. Each shot: { url, setup(ctx), settle, ready(ctx), sec, frame(ctx, t, i) }.
// ctx.ev(fn, arg) runs in the page (window.G, window.TR helpers from lib.mjs). All staging is done from outside; src/ is not touched.
const lerp = (a, b, u) => a + (b - a) * u, ease = u => u * u * (3 - 2 * u);
/* free camera pan a -> b (world coords) over `sec`, optional time-lapse of `mins` game minutes over the shot */
const pan = (a, b, sec, o = {}) => async (ctx, t, i) => { const u = Math.min(1, t / sec), e = o.ease ? ease(u) : u; await ctx.ev(([x, y, m]) => { TR.move(x, y); if (m) G.advance(m); }, [lerp(a[0], b[0], e), lerp(a[1], b[1], e), o.mins ? o.mins / (sec * 30) : 0]); };
const city = (h, extra = '') => `?scene=city&t=${h}&debug&weather=clear${extra}`;

export const SHOTS = {
  /* ---------- TRAILER A ---------- */
  a_dawn_light: { url: city(4.6), setup: c => c.ev(() => TR.free(34, 346, 1)), settle: 3, sec: 7.2, frame: pan([34, 346], [44, 350], 7.2, { mins: 110 }) },
  t_train: { url: city(6.6), setup: c => c.ev(() => { TR.free(213, 300, 2); }), settle: 1, sec: 4,
    ready: c => c.ev(() => { const ts = G.rail.trains().map(s => [s.dir, s.train, Math.round(s.x), Math.round(s.y), +s.v.toFixed(2), s.at || '', s.next || '', +(s.toDepart || 0).toFixed(1)]); window._ts = ts; return ts; }).then(r => console.log(JSON.stringify(r))),
    frame: (c) => c.ev(() => { const s = G.rail.trains().filter(s => s.v > 0.1).sort((a, b) => Math.hypot(a.x - 213, a.y - 305) - Math.hypot(b.x - 213, b.y - 305))[0]; if (s) TR.move(s.x, s.y); }) },
  t_bus: { url: city(7), setup: c => c.ev(() => { TR.free(220, 230, 2); }), settle: 6, sec: 4,
    ready: c => c.ev(() => G.traffic.buses.map(b => [b.id, b.route, b.veh ? [Math.round(b.veh.x), Math.round(b.veh.y)] : null, b.atStop])).then(r => console.log(JSON.stringify(r))),
    frame: (c) => c.ev(() => { const b = G.traffic.buses.filter(b => b.veh).sort((a, b) => Math.hypot(a.veh.x - TR.cam.x, a.veh.y - TR.cam.y) - Math.hypot(b.veh.x - TR.cam.x, b.veh.y - TR.cam.y))[0]; if (b) TR.move(b.veh.x, b.veh.y); }) },
  t_plane: { url: city(9), setup: c => c.ev(() => { TR.free(330, 40, 1); }), settle: 1, sec: 8,
    ready: c => c.ev(() => { const f = G.planes.landNow('airliner'); window._f = f; return f ? [f.cx, f.cy, f.alt, f.phase] : null; }).then(r => console.log(JSON.stringify(r))),
    frame: (c, t, i) => c.ev(i => { const f = window._f; if (i % 30 === 0) console.log; return [Math.round(f.cx), Math.round(f.cy), Math.round(f.alt), f.phase]; }, i).then(r => { if (i % 30 === 0) console.log(JSON.stringify(r)); }) },
  t_cook: { url: city(18), setup: async c => { await c.ev(async () => { document.body.classList.add('tr-ui'); await G.go('int:home:marlowe_1br', { fade: false }); G.player.hidden = false; G.camTarget = null; window._r = G.skillplay.demo('ck_chop'); }); }, settle: 1, sec: 4 },
  t_fish: { url: city(18), setup: async c => { await c.ev(async () => { document.body.classList.add('tr-ui'); await G.go('city', { x: 104.8, y: 361, fade: false }); G.player.hidden = false; G.camTarget = null; window._r = G.skillplay.demo('fish'); }); }, settle: 1, sec: 4 },
  t_job: { url: city(10), setup: async c => { c.ev(async () => { document.body.classList.add('tr-ui'); window._r = G.jobs.debugStart('barista'); }); await new Promise(r => setTimeout(r, 2500)); }, settle: 2, sec: 4 },
  t_date: { url: city(19), setup: async c => { c.ev(async () => { document.body.classList.add('tr-ui'); window._r = G.rel.debug.fire('fd.tasha'); }); await new Promise(r => setTimeout(r, 2500)); }, settle: 2, sec: 4 },
  t_fest: { url: city(19), setup: async c => { c.ev(async () => { G.cityEvents.debug.start('lantern_parade'); G.cityEvents.debug.parade(); }); await new Promise(r => setTimeout(r, 2500)); }, settle: 3, sec: 4, ready: c => c.ev(() => [G.player.x, G.player.y, G.now().clock, G.zoom]).then(r => console.log(r)) },
  t_rain: { url: city(19.5, '').replace('weather=clear', 'weather=rain'), setup: c => c.ev(() => { TR.free(222, 232, 2); }), settle: 5, sec: 3 },
};
