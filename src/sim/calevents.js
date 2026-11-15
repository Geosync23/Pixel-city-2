// QA11 (round 11, item 4): the small calendar festivals that had NOTHING at their place.
// The calendar rows below (data/calendar.js) were "Done" the moment you arrived, with nothing to see but a bigger crowd (crowdMult) and the promised weather.
// Owner's rule: add, do not remove. This adds, from existing art and systems only:
//   - an arrival moment: one honest line saying what is there today, the row's own moodlet (festival_spirit / holiday_cheer), once per occurrence;
//   - small sky effects from the big events' own FX layer (sim/_cityevents_fx.js): petals by the Duck Pond, paper lanterns, leaves, sparkles,
//     fireworks at the time the row promised (Summer Fireworks 22:00, New Year's Eve midnight) with the `fireworks_awe` moodlet for watching;
//   - Founders' Day: the free slice of cake on the plaza that the row promised (hunger +15, fun +10).
// The rows' blurbs were re-worded at the same time so they promise only what is there (see docs/reports/qa_round11.md, item 4).
// Nothing is saved but which arrivals were greeted (G.state.calev.seen).
import { G } from '../core/game.js';
import { EVENTS, eventOnDay } from '../data/calendar.js';
import { FX } from './_cityevents_fx.js';
import { toast } from '../ui/kit.js';

export const order = 132;
const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const PINK = ['#ffc7d9', '#ffe3ec', '#f59ab8', '#ffffff'];

/* what is really there, per row. near = units from the place that count as "here"; fx(L, h, dt) runs while you are within 60 units in the city */
const THIN = {
  blossom_festival: { near: 22, line: 'The Spring Blossom Festival: petals on the wind and half the town out on the grass by the Duck Pond. Paper lanterns go out on the pond at seven.',
    fx: (L, h, k) => { if (k % 3 === 0) FX.petals(L.x + (Math.random() - .5) * 16, L.y + (Math.random() - .5) * 10, 6, PINK); if (h >= 19 && h < 19.25 && k % 20 === 0) FX.lanterns(L.x, L.y, 8); } },
  summer_fireworks: { near: 24, line: 'Summer Fireworks: the boardwalk is busy all evening, and the fireworks go up over the water at ten.', fireworks: [22, 22.25] },
  boardwalk_days: { near: 22, line: 'Boardwalk Days: the pier rail is full of people fishing, and the ice-cream stand does scoops at half price.' },
  harvest_fair: { near: 22, line: 'The Autumn Harvest Fair: the market sells its produce at a quarter off, the bakery at a fifth off, and Old Town smells of cinnamon.',
    fx: (L, h, k) => { if (k % 4 === 0) FX.leaves(L.x + (Math.random() - .5) * 16, L.y + (Math.random() - .5) * 10, 5); } },
  lantern_night: { near: 22, line: 'Lantern Night: after dark the paper lanterns drift up over Lantern Row, and the ramen bar is a fifth off.',
    fx: (L, h, k) => { if (h >= 19 && k % 25 === 0) FX.lanterns(L.x, L.y + 2, 6); } },
  winter_lights: { near: 22, line: 'The Winter Lights Market: City Hall Plaza is busy under the lights, and winter coats and knits are a fifth off at Thread & Co.',
    fx: (L, h, k) => { if (h >= 16 && k % 6 === 0) FX.sparkle(L.x + (Math.random() - .5) * 14, L.y + (Math.random() - .5) * 8, 6, 12); } },
  founders_day: { near: 20, cake: true, line: "Founders' Day: Maple Bay is another year older, and there is free cake on the plaza. A slice for you, with a paper flag in it." },
  new_years_eve: { near: 24, line: "New Year's Eve: the boardwalk counts down by the lighthouse, and the fireworks go up at midnight.", fireworks: [24, 24.25] },
};

let S = null, k = 0, acc = 0, watchFw = 0;
const fresh = () => ({ seen: {} });
const row = id => EVENTS.find(e => e.id === id);
/* the occurrence that is on now: { e, d (its day), h (hours since that day began: past midnight runs on as 24+) } */
function liveNow(e) {
  if (!e || !e.hours) return null; const n = G.now(), d = n.day, h = n.hf;
  if (safe(() => eventOnDay(e, d), false) && h >= e.hours[0] && h < e.hours[1]) return { e, d, h };
  if (e.hours[1] > 24 && safe(() => eventOnDay(e, d - 1), false) && h + 24 < e.hours[1]) return { e, d: d - 1, h: h + 24 };
  return null;
}
const locOf = e => (e._loc && isFinite(e._loc.x) ? e._loc : null);
const venueRoom = e => (e.place && e.place.venue ? 'int:' + e.place.venue : null);
function arrive(o, def) {
  const key = o.e.id + ':' + o.d; if (S.seen[key]) return; S.seen[key] = 1;
  toast(def.line, 'good', 6000);
  const md = o.e.special && o.e.special.moodlet; if (md) safe(() => G.needs.addMoodlet(md));
  if (def.cake) safe(() => { G.needs.add('hunger', 15); G.needs.add('fun', 10); });
  G.emit('calevent:arrive', o.e.id);
  for (const q of Object.keys(S.seen)) if (+q.split(':').pop() < o.d - 3) delete S.seen[q];
}
function tick(dt) {
  if (!S || G.onTitle || !G.scene) return; acc += dt || 0; if (acc < .25) return; const step = acc; acc = 0; k++;
  const inCity = G.scene.id === 'city';
  for (const id in THIN) {
    const def = THIN[id], o = liveNow(row(id)); if (!o) continue; const L = locOf(o.e);
    if (inCity && L) {
      const d = Math.hypot(G.player.x - L.x, G.player.y - L.y);
      if (d < def.near && !G.cutscene && !(G.modal > 0)) arrive(o, def);
      if (d < 60) {
        safe(() => def.fx && def.fx(L, o.h, k));
        if (def.fireworks && o.h >= def.fireworks[0] && o.h < def.fireworks[1]) { if (Math.random() < step * 2.2) FX.firework(L.x + (Math.random() - .5) * 10, L.y + (Math.random() - .5) * 6);
          watchFw += step; if (watchFw > 20) { watchFw = -1e9; safe(() => G.needs.addMoodlet('fireworks_awe')); } }
      }
    } else if (!inCity && venueRoom(o.e) === G.scene.id && !G.cutscene && !(G.modal > 0)) arrive(o, def);
  }
}
export function init() {
  S = G.defineState('calev', fresh);
  G.on('load', () => { S = G.state.calev || (G.state.calev = fresh()); if (!S.seen) S.seen = {}; });
  G.on('day', () => { watchFw = 0; });
  G.on('frame', tick);
  G.calEvents = { THIN, live: () => Object.keys(THIN).map(id => liveNow(row(id))).filter(Boolean).map(o => ({ id: o.e.id, day: o.d, h: o.h, loc: locOf(o.e) })) };
}
