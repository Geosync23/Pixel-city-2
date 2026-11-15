// Crowd internals shared by crowd.js / _crowd_animals.js / _crowd_rooms.js: the Cit entity, spec pools, helpers, ambient lines.
// Event 'crowd:say'(citizen, text) whenever an anonymous citizen's bubble is shown (QA round 3; for tests and listeners).
import { G } from '../core/game.js';
import { Char, charArt } from '../core/char.js';
import { pixSprite } from '../engine/sprites.js';
import { U } from '../engine/raster.js';
import { GT } from '../engine/world.js';
import { stepToward } from '../engine/nav.js';
import { AMBIENT } from '../story/dialogue.js';
import { cityLine, roomVenueKey } from './_crowd_lines.js';
import { bubble } from '../ui/kit.js';

export const rnd = Math.random, ri = n => (rnd() * n) | 0, pick = a => a[(rnd() * a.length) | 0], rr = (a, b) => a + rnd() * (b - a);
/** shared live context (filled by crowd.js) */
export const X = { world: null, city: null, cits: [], fx: 0, fy: 0, frozen: false, mult: 1, wet: false, hour: 12, wd: 0, season: 0, night: false, cf: 1, playerOk: false, px: 0, py: 0, pmove: false, clear: true };
/** is world point within m px of the screen (m < 0 shrinks) */
export function onScreen(x, y, m) { const sx = (x - y) * U - G.cam.x, sy = (x + y) * U / 2 - X.world.heightAt(x, y) * U - G.cam.y; return sx > -m && sx < G.W + m && sy > -m - 6 && sy < G.H + m + 34; }
const BADT = new Set([GT.asphalt, GT.water, GT.deepwater, GT.void, GT.tarmac, GT.ballast]);
/** free nav cell that is not road / water */
export function okCell(x, y) { const w = X.world; return !w.isBlocked(x, y) && !BADT.has(w.tileType(x, y)); }
export const isRoad = (x, y) => X.world.tileType(x, y) === GT.asphalt;
export const dirOf = (dx, dy) => Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);

const FPS = { walk: 7, run: 10, stand: 1.2, talk: 4, type: 5, work: 4, lift: 3, treadmill: 10, dance: 6, eat: 3, drink: 2, wave: 5, cheer: 5, carry: 7, sleep: .6, read: .5, phone: .8, sit: .5 };
const AI = {}; let AIN = 0, CID = 0; const cids = new WeakMap();
export class Cit extends Char {
  constructor() { super(null, 0, 0); this.isCitizen = true; this.active = false; this.hidden = true; this.alpha = 1; this.sid = 0; this.clear(); }
  clear() {
    this.kind = 'stroll'; this.st = 0; this.tx = 0; this.ty = 0; this.ww = -1; this.pw = -1; this.link = null; this.spd = 1.8; this.think = rnd() * .5; this.wait = 0; this.stuck = 0;
    this.lead = null; this.mate = null; this.side = 1; this.anchor = null; this.slot = -1; this.sl = null; this.fade = 0; this.pet = null; this.mood = 'ok'; this.district = ''; this.path = null; this.goal = null;
    this.pose = null; this.poseOpts = null; this.seated = false; this.carry = false; this.run = false; this.zoff = 0; this.hold = 0; this.sx = 0; this.chat = false; this.moving = false; this._sk = -1; this._spr = null; this.spot = null; this.stay = 0; this.named = false;
  }
  setSpec(s) { this.spec = s; let i = cids.get(s); if (!i) cids.set(s, i = ++CID); this.sid = i; this._sk = -1; }
  sprite() {
    const A = charArt(), AN = A.ANIMS; let a = this.pose || (this.moving ? (this.carry ? 'carry' : this.run ? 'run' : 'walk') : this.carry ? 'carry' : 'stand'), n = AN[a]; if (!n) { a = 'stand'; n = AN.stand || 1; }
    const f = (!this.moving && !this.pose && this.carry) ? 0 : Math.floor(this.t * (FPS[a] || 4)) % n, dir = this.dir, seated = this.seated; let ai = AI[a]; if (ai === undefined) ai = AI[a] = ++AIN;
    const k = ai * 256 + f * 16 + dir * 2 + (seated ? 1 : 0); if (k === this._sk && this._spr) return this._spr; this._sk = k; const spec = this.spec, item = a === 'carry';
    return this._spr = pixSprite('cz' + this.sid + a + f + dir + (seated ? 's' : ''), A.CHAR_SB, () => A.drawChar(spec, seated ? { anim: a, frame: f, dir, seated: true } : item ? { anim: a, frame: f, dir, item: 'bag' } : { anim: a, frame: f, dir }));
  }
}
/** straight step toward a point with nav sliding; sets moving/facing/z. Returns distance moved. */
export function walkTo(c, tx, ty, dist) { const ox = c.x, oy = c.y, m = stepToward(X.world, c, tx, ty, dist); c.moving = m > 1e-4; if (c.moving) c.face(c.x - ox, c.y - oy); c.z = X.world.heightAt(c.x, c.y); return m; }

/* ---------- spec pools (sprites are cached per spec, so citizens share a rotating wardrobe of specs per district) ---------- */
const pools = new Map(); let seed = 9173;
const lcg = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export function clearSpecs() { pools.clear(); }
function mkPool(district, outfit, age, n) {
  const A = charArt(), d = district === 'harbor' ? 'harborside' : district, out = [], skins = {};
  for (let i = 0; i < n; i++) {
    let s = null, a = age || (!outfit && n >= 12 ? (i === 0 || i === 7 ? 'elder' : i === 3 && d !== 'downtown' && d !== 'railyard' ? 'kid' : undefined) : undefined);
    for (let k = 0; k < 5; k++) { s = A.randomSpec(lcg, { district: d, season: X.season, age: a || (outfit ? 'adult' : undefined), outfit }); if ((skins[s.skin] || 0) < Math.max(2, n / 6)) break; }
    skins[s.skin] = (skins[s.skin] || 0) + 1; if (outfit) { s.outfit = outfit; if (outfit !== 'office') s.bag = null; } s._n = 0; out.push(s);
  }
  return out;
}
/** a citizen look for a district; opts { outfit, age }. Prefers specs not currently worn by someone. */
export function getSpec(district, outfit, age) {
  const key = district + '|' + (outfit || '') + '|' + (age || ''); let p = pools.get(key); if (!p) pools.set(key, p = mkPool(district, outfit, age, outfit || age ? 6 : 26));
  let s = p[ri(p.length)]; for (let k = 0; k < 4 && s._n > 0; k++) s = p[ri(p.length)]; return s;
}

/* ---------- ambient lines & bubbles ---------- */
const bubEnd = [0, 0];
const DNAME = { downtown: 'Downtown', oldtown: 'Old Town', harbor: 'Harborside', hillcrest: 'Hillcrest', maplewood: 'Maplewood', arts: 'the Arts Quarter', railyard: 'the Railyard', park: 'Central Park', airport: 'the airport' };
const fill = (s, c) => s.replace('{name}', (G.state.player && G.state.player.name) || 'friend').replace('{district}', DNAME[c.district] || 'Maple Bay');
const usable = s => s && s.indexOf('{npc}') < 0 && s.indexOf('{gift}') < 0 && s.indexOf('{venue}') < 0;
const fromPool = (p, c) => { if (!p || !p.length) return null; for (let k = 0; k < 4; k++) { const s = p[ri(p.length)]; if (usable(s)) return fill(s, c); } return null; };
export const dayPart = () => X.hour < 5 ? 'night' : X.hour < 11 ? 'morning' : X.hour < 17 ? 'midday' : X.hour < 21 ? 'evening' : 'night';
function weatherKey() { const w = G.weather && G.weather.current ? G.weather.current() : null, k = w ? w.kind : 'clear'; return k === 'rain' || k === 'storm' ? 'rain' : k === 'snow' ? 'snow' : k === 'fog' ? 'fog' : k === 'cloudy' ? 'cloudy' : w && w.tempC > 28 ? 'heat' : 'sunny'; }
/** a line an anonymous citizen might say right now. ctx: { venue: AMBIENT.venue key, event: AMBIENT.events key, reaction: AMBIENT.reactions key } */
export function ambientLine(c, ctx) {
  // the big written pools with no repeats (src/sim/_crowd_lines.js); the old picker below stays as the fallback
  try { const pl = G.player, near = !!pl && !pl.hidden && !G.cutscene && Math.hypot(c.x - pl.x, c.y - pl.y) < 5, indoor = !!(G.scene && G.scene.indoor), A0 = AMBIENT;
    const leg = ctx && ctx.reaction ? ['reaction.' + ctx.reaction, A0.reactions[ctx.reaction]] : ctx && ctx.event ? ['event.' + ctx.event, A0.events[ctx.event]] : ctx && ctx.venue && !indoor ? ['venue.' + ctx.venue, A0.venue[ctx.venue]] : null;
    const t = cityLine(c, { near, state: ctx && ctx.state, kind: (ctx && ctx.kind) || c.kind, eventId: ctx && ctx.eventId, venue: indoor ? (ctx && ctx.venue === 'queue' && Math.random() < .5 ? 'restroom_queue' : roomVenueKey(G.scene.roomId)) : null, legacy: leg && leg[1], legacyKey: leg && leg[0] });
    if (t) return t; } catch (e) { console.warn('cityLine', e); }
  const A = AMBIENT, r = rnd(); let s = null;
  if (ctx && ctx.reaction) s = fromPool(A.reactions[ctx.reaction], c);
  if (!s && ctx && ctx.event && r < .6) s = fromPool(A.events[ctx.event], c);
  if (!s && ctx && ctx.venue && r < .7) s = fromPool(A.venue[ctx.venue], c);
  if (!s && (X.hour >= 23 || X.hour < 4) && r < .3) s = fromPool(A.reactions.late_night, c);
  if (!s) s = r < .3 ? fromPool(A.district[c.district], c) : r < .5 ? fromPool(A.timeOfDay[dayPart()], c) : r < .68 ? fromPool(A.weather[weatherKey()], c) : r < .84 ? fromPool(A.season[['spring', 'summer', 'autumn', 'winter'][X.season]], c) : fromPool(A.district[c.district], c);
  return s || fromPool(A.timeOfDay[dayPart()], c) || 'Lovely day in Maple Bay.';
}
export function greeting(c) { return rnd() < .6 ? fromPool(AMBIENT.reactions.greeting, c) || 'Hi there!' : rnd() < .5 ? fromPool(AMBIENT.reactions.friendly_stranger, c) || 'Hello!' : ambientLine(c); }
/* QA round 3: a bubble must be fully on screen and clear of the HUD (portrait phones: the clock/needs cluster top-left, money/speed top-right, bag/phone bottom-right) */
let hudR = null, hudT = -9;
function hudRects() {
  if (G.time - hudT < 1 && hudR) return hudR; hudT = G.time; hudR = [];
  for (const q of ['.hud-tl', '.hud-tr', '.hud-br', '.hud-bc', '#nav-trip', '#nav-arrow', '.ride-hud']) { const e = document.querySelector(q); if (!e) continue; const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0) hudR.push(r); }
  return hudR;
}
/** cheap pre-check: is citizen c's head on screen with room for a bubble above it (below the top HUD cluster)? */
export function bubbleOk(c) {
  if (typeof document === 'undefined' || !G.toScreen) return true;
  const s = G.toScreen(c.x, c.y, (c.z || 0) + (c.bubbleH || 1.9)), W = innerWidth, H = innerHeight;
  if (s.x < 10 || s.x > W - 10 || s.y > H - 8 || s.y < 40) return false;
  for (const q of hudRects()) if (s.x > q.left - 30 && s.x < q.right + 30 && s.y - 30 < q.bottom && s.y > q.top) return false;
  return true;
}
/** place a just-created bubble element: natural width (not squeezed by the screen edge), slid sideways to stay on screen; false = it would still be cut off or cover the HUD */
function fitBubble(b, force) {
  b.style.width = 'max-content'; const r = b.getBoundingClientRect(), W = innerWidth, H = innerHeight; if (!r.width) return true;
  const sh = r.left < 4 ? 4 - r.left : r.right > W - 4 ? W - 4 - r.right : 0; if (sh) b.style.marginLeft = Math.round(sh) + 'px'; if (force) return true;
  const L = r.left + sh, R = r.right + sh; if (r.top < 4 || r.bottom > H - 4) return false;
  for (const q of hudRects()) if (L < q.right && R > q.left && r.top < q.bottom && r.bottom > q.top) return false;
  return true;
}
/** speech bubble with a global cap of two visible. force: true = always show (player tapped); 'slot' = may take a bubble slot but must still fit (a duet's answer) */
export function speak(c, text, force) {
  if (!text || typeof document === 'undefined') return false; if (!force && !bubbleOk(c)) return false; const now = G.time, i = bubEnd[0] <= now ? 0 : bubEnd[1] <= now ? 1 : force ? 0 : -1; if (i < 0) return false;
  const ms = Math.min(4200, 1700 + text.length * 38), el = bubble(c, text, ms); if (el && !fitBubble(el, force === true)) { el.remove(); return false; }   // (removed before it is ever painted)
  bubEnd[i] = now + ms / 1000 + .3; G.emit('crowd:say', c, text); return true;
}
/** tap handler shared by city citizens and room NPCs */
export function talkTo(c, venue) {
  if (!c.active) return; if (G.scene === X.city && X.world && !c.seated && isRoad(c.x, c.y)) return;   // QA round 3: someone crossing the road does not stop to answer a tap const p = G.player; c.hold = 3.2; c.moving = false; c.dir = dirOf(p.x - c.x, p.y - c.y); if (!c.seated) c.hpose = c.pose, c.pose = 'talk'; else c.hpose = c.pose;
  const info = { char: c, spec: c.spec, district: c.district, mood: c.mood, kind: c.kind };
  if (G.social && G.social.talkToCitizen) { let r = null; try { r = G.social.talkToCitizen(info); } catch (e) { console.error(e); } if (r && r.then) { c.hold = 600; r.then(() => { c.hold = Math.min(c.hold, .6); }, () => { c.hold = .1; }); } return; }
  speak(c, greeting(c), true); c.mood = 'happy';
}
const talkers = new Set();
/** make a pooled citizen tappable (once per instance) */
export function registerTalk(c) { if (talkers.has(c)) return; talkers.add(c); G.addInteractable({ ent: c, x: 0, y: 0, label: 'Talk', hit: 7, h: 1.2, range: 1.5, visible: () => c.active && !c.hidden && c.alpha > .7 && !c.named && !G.player.hidden, use: () => talkTo(c) }); }
