// opportunities_kit.js — the tiny row builders shared by the Opportunity pool files (data/opportunities_a.js, _b.js, _c.js).
// The full field reference is at the top of data/opportunities.js.

/** one pool row. x = extras: { ttl, until, appt, once, wt, npc, stamp, lines } */
export const row = (pool, src) => (id, title, text, at, d, when, reward, x) => { pool.push(Object.assign({ id, src, title, text, at: at || null, do: d || { type: 'visit', stay: 3 }, when: when || {}, reward: reward || {} }, x || null)); };

// ---- what completes it (`do`) ----
/** be at the place (inside the room, or within r units of an outdoor spot) for `stay` game minutes */
export const visit = (stay = 3, r) => (r ? { type: 'visit', stay, r } : { type: 'visit', stay });
/** a button appears on the person / counter / spot there: label is what it says. x: { minutes, anim, bring: [itemId, qty], pay, lines: [..], find, npc } */
export const use = (label, x) => Object.assign({ type: 'use', label }, x || null);
/** finish an activity (id, list of ids, or 're:<regex on the id>'); x: { here: true (must be at the place), min: minutes } */
export const act = (a, x) => Object.assign({ type: 'act', act: a }, x || null);
/** buy something: an item id, 'cat:<category>' or 're:<regex on the id>'; x: { here: true (at the opportunity's place) } */
export const buy = (item, x) => Object.assign({ type: 'buy', item }, x || null);
/** any game event; x: { a0: first argument must equal this, here: true } */
export const ev = (name, x) => Object.assign({ type: 'ev', ev: name }, x || null);
/** talk to a named person (any verb) */
export const talk = npc => ({ type: 'talk', npc });

// ---- small vocabulary for `when` ----
export const WEEKEND = [5, 6], WEEKDAYS = [0, 1, 2, 3, 4];
export const SPRING = 0, SUMMER = 1, AUTUMN = 2, WINTER = 3;
export const DRY = ['clear', 'cloudy'], WET = ['rain', 'storm'];
