// Intro sequence + first-days onboarding, driven by src/story/intro.js. An ordered list of named STEPS; other modules can add more
// (e.g. the airport interiors before 'curb') without touching this file.
//
// G.intro
//   steps            ordered step ids (default: 'arrival_plane_cinematic', 'curb', 'cab_ride', 'apartment_arrival', 'first_evening')
//   at               current step id | null          active -> bool (a step is running)
//   register(stepDef, { before | after: id }?)   stepDef = { id, enter(ctx), update?(dt, ctx), exit?(), done?: eventName | predicate(ctx) }
//        enter may be async. When `done` (event fired / predicate true) the intro moves to the next step; a step can also call
//        ctx.next() / ctx.goto(id) itself. exit() must undo everything the step set up (it also runs on skip and on load).
//        ctx = { G, state (G.state.intro, JSON only), fresh (new game, not a resume), hint, caption, next, goto, home() }.
//        Re-registering an id replaces that step. Without before/after the step is appended; pre-curb steps use { before: 'curb' }.
//   goto(id)   next()   skip() (jump straight into the apartment; first evening goals start)   start() (replay from the first step)
//   hint(text | null, target?, opts?)   the tutorial bubble of ui/goals.js with a "Skip intro" button while the intro runs
// Flow: 'game:new' -> G.introHandled = true -> steps. Dev launches (?scene=...) do nothing unless the URL also has &intro.
//   Continuing a save mid-intro resumes: before the cab -> 'curb'; standing at the building -> 'apartment_arrival'; inside -> done.
// State G.state.intro = { at, done, sub (curb sub-step), welcomed, keys, day0, nudges: { id: 1 }, hints: { id: 1 } }.
// Flags: firstCabFree (set for the first ride), introDone.   Events: 'intro:step'(id), 'intro:done'.
// After the intro: NUDGES (day 1-3 texts / tips that add 'settling_in' goals) and one-time TUTORIAL_HINTS toasts.
import { G } from '../core/game.js';
import { say, toast } from '../ui/kit.js';
import { hint as uiHint, caption, skipButton } from '../ui/goals.js';
import { INTRO_SEQUENCE, TAXI_RIDE, STARTER_BUILDINGS, KEY_HANDOVER, NUDGES, TUTORIAL_HINTS } from '../story/intro.js';
import { CAST_BY_ID } from '../story/cast.js';

export const order = 110;
const safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const SEQ = Object.fromEntries(INTRO_SEQUENCE.map(s => [s.id, s]));
const fill = t => String(t).replace(/\{name\}/g, (G.state.player && G.state.player.name) || 'friend');
const hm = s => { const [h, m] = String(s).split(':'); return (+h) * 60 + (+m || 0); };
const I = () => { let s = G.state.intro; if (!s || typeof s !== 'object') s = G.state.intro = { at: null, done: 0, nudges: {}, hints: {} }; if (!s.nudges) s.nudges = {}; if (!s.hints) s.hints = {}; return s; };
const cityW = () => { const c = G.sceneCache.get('city'); return c ? c.world : null; };
const short = id => (CAST_BY_ID[id] ? CAST_BY_ID[id].short : id);
const dev = () => !!(G.query && G.query.has('scene'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- step machine ---------- */
const steps = []; let cur = null, offDone = null, token = 0, fresh = false, skipping = false;
function register(def, o = {}) {
  if (!def || !def.id) return; const old = steps.findIndex(s => s.id === def.id); if (old >= 0) { steps.splice(old, 1, def); return; }
  let i = o.before ? steps.findIndex(s => s.id === o.before) : o.after ? steps.findIndex(s => s.id === o.after) + 1 : steps.length;
  if (i < 0 || (o.after && i === 0)) i = steps.length; steps.splice(i, 0, def);
}
const hint = (text, target, opts = {}) => uiHint(text, target, Object.assign(cur && cur.id !== 'first_evening' ? { skip } : {}, opts));
const ctx = { G, get state() { return I(); }, get fresh() { return fresh; }, hint, caption, next: () => next(), goto: id => goto(id), home: () => home() };
function leave() { if (offDone) { offDone(); offDone = null; } const c = cur; cur = null; token++; if (c && c.exit) safe(() => c.exit()); uiHint(null); }
async function goto(id) {
  leave(); const def = steps.find(s => s.id === id); if (!def) return finish();
  I().at = id; I().done = 0; cur = def; G.emit('intro:step', id);
  if (typeof def.done === 'string') offDone = G.on(def.done, () => { if (cur === def) next(); });
  try { await def.enter(ctx); } catch (e) { console.warn('intro step ' + id, e); }
}
function next() { const i = steps.indexOf(cur), n = i >= 0 ? steps[i + 1] : null; return n ? goto(n.id) : finish(); }
function finish() { leave(); I().at = null; I().done = 1; }
const live = t => t === token;

/* ---------- helpers ---------- */
function home() { let h = safe(() => G.housing.current(), null); if (!h && G.housing) { safe(() => G.housing.start('juniper_court')); h = safe(() => G.housing.current(), null); } return h; }
function doorPoi() { const h = home(), w = cityW(); return h && w ? w.pois.find(p => p.id === h.door) || null : null; }
function freeNear(x, y, r0 = 1) { const w = cityW(); if (!w) return { x, y }; for (let r = r0; r < r0 + 5; r += .5) for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6 + r, cx = Math.round((x + Math.cos(a) * r) * 2) / 2, cy = Math.round((y + Math.sin(a) * r) * 2) / 2; if (!safe(() => w.isBlocked(cx, cy), true)) return { x: cx, y: cy }; } return { x, y }; }
const nearDoor = (d = 18) => { const p = doorPoi(); return !!p && G.scene && G.scene.id === 'city' && Math.hypot(G.player.x - p.x, G.player.y - p.y) < d; };
const phoneOpen = () => !!(G.phone && G.phone.isOpen);
const appBtn = re => () => (phoneOpen() ? [...document.querySelectorAll('.ph-appbtn')].find(b => re.test(b.getAttribute('aria-label') || '')) || null : document.querySelector('.hud-phone'));
const callBtn = () => { if (!phoneOpen()) return document.querySelector('.hud-phone'); const h = home(), nm = h && h.home ? h.home.name : 'Home'; return document.querySelector('.ph-app-taxi .ph-btn.gold') || [...document.querySelectorAll('.ph-app-taxi button, .ph-app-taxi [role=button]')].find(b => b.textContent.includes(nm)) || null; };
function sendWelcome() {
  const s = I(); if (s.welcomed) return; s.welcomed = 1; const T = SEQ.sibling_welcome.texts;
  T.forEach((text, i) => safe(() => G.messages.send(Object.assign({ from: SEQ.sibling_welcome.from, text }, i === T.length - 1 ? { replies: [{ label: "Made it! Got my keys.", value: 'keys', then: 'YESSS. Okay: unpack, eat something, SLEEP. Dinner at ours soon. So glad you are here!' }, { label: 'On my way to the apartment now!', value: 'omw', then: 'Go go go! Tell Walt I said hi. He will pretend not to care.' }] } : {}))));
}

/* ---------- step: arrival_plane_cinematic (exterior landing shot) ---------- */
let tOff = 0;
const inside = () => { try { return !!(G.intro && G.intro.steps && G.intro.steps.indexOf('cabin') >= 0); } catch (e) { return false; } };
{
  let cut = null, fl = null, t = 0, li = 0, z0 = 0, unSkip = null;
  register({ id: 'arrival_plane_cinematic',
    async enter(c) {
      const my = token; t = 0; li = 0; fl = null; tOff = 0;
      if (c.fresh || !G.scene || G.scene.id !== 'city') { G.player.hidden = true; await G.go('city', { poi: 'spawn:airport' }); if (!live(my)) return; }
      G.player.hidden = true; cut = G.cutscene = { update() {} }; z0 = G.zoom;
      if (G.planes) { G.planes.quiet = true; if (G.planes.clear) G.planes.clear(); fl = G.planes.landNow('airliner'); if (fl) G.camTarget = fl.cam; }
      safe(() => { if (G.zoom === G.zmin) G.setZoom(G.zmin + 1); G.setZoom(G.zmin); }); // also snaps the camera onto the plane
      unSkip = skipButton('Skip', () => { if (cur && cur.id === 'arrival_plane_cinematic') next(); });
    },
    update(dt) {
      if (!cut) return; t += dt; const L = SEQ.landing.lines;
      if (li < L.length && t > .4 + li * 2.9) { const l = L[li++]; caption(l.speaker === 'pa' ? 'Captain' : l.speaker === 'narrator' ? null : short(l.speaker), fill(l.text), 3500); }
      if (!inside() && fl && fl.phase === 'roll' && fl.v < 12 && G.camTarget === fl.cam) G.camTarget = null; // legacy flow only: pan to the arrivals curb (the airport-interior opening cuts to the cabin instead)
      // end the shot as the plane starts to pull off the runway (never linger until it despawns)
      if (fl && fl.turn) { tOff = tOff || t; if (t - tOff > 1.4) return next(); }
      if (t > Math.min(18, (SEQ.landing.durationSec || 12) + 6) || (!fl && t > 8) || (fl && fl.done)) next();
    },
    exit() {
      // when the opening continues inside the plane, cut to black instantly so the old curb-side view never flashes between the landing shot and the cabin
      if (inside() && G.fadeEl) { const f = G.fadeEl; f.style.transition = 'none'; f.classList.add('on'); void f.offsetWidth; f.style.transition = ''; }
      if (G.cutscene === cut) G.cutscene = null; cut = null; G.camTarget = null; G.player.hidden = false; if (z0) safe(() => G.setZoom(z0)); if (unSkip) unSkip(); unSkip = null; caption(); if (G.planes) G.planes.quiet = false; },
  });
}

/* ---------- step: curb (phone + MapleCab tutorial) ---------- */
{
  let offs = [], lug = null, p0 = null, tm = 0, idle = 0;
  const T = id => SEQ[id].prompt;
  const SUBS = {
    move: () => hint(T('tut_move')),
    phone: () => hint(T('tut_phone'), '.hud-phone'),
    read: () => hint(T('tut_read'), appBtn(/^Messages/i)),
    taxi_app: () => hint(T('tut_taxi_app'), appBtn(/^(MapleCab|Taxi)/i)),
    call: () => hint(T('tut_call_cab'), callBtn, { onTap: () => { const h = home(); if (h && !phoneOpen()) safe(() => G.phone.open('taxi', { place: h.roomId })); } }),
    wait: () => hint(T('tut_wait'), () => safe(() => G.transit.pending.cab, null)),
    get_in: () => hint(T('tut_get_in'), () => safe(() => G.transit.pending.cab, null)),
  };
  const sub = s => { I().sub = s; idle = 0; SUBS[s](); };
  const toTaxi = () => { safe(() => G.phone.unlock('taxi')); sub('taxi_app'); };
  register({ id: 'curb',
    async enter(c) {
      const my = token, s = I();
      if (!G.scene || G.scene.id !== 'city') { await G.go('city', { poi: 'spawn:airport' }); if (!live(my)) return; }
      const P = G.player; G.state.flags.firstCabFree = true; p0 = { x: P.x, y: P.y }; tm = 0;
      const w = cityW(), sp = w && w.pois.find(p => p.id === 'spawn:airport');
      if (sp && Math.hypot(P.x - sp.x, P.y - sp.y) < 12) lug = safe(() => w.place('prop.airport.luggage', P.x + .6, P.y - .2, { p: { kind: 'single' }, solid: false }), null);
      if (c.fresh || !s.sub) { caption(null, SEQ.curb.text, 3600); safe(() => G.phone.lock('taxi')); sub('move'); }
      else sub(s.welcomed ? (safe(() => G.messages.unread(), 0) && !safe(() => G.phone.isUnlocked('taxi'), true) ? 'phone' : 'taxi_app') : 'move');
      if (I().sub === 'taxi_app') safe(() => G.phone.unlock('taxi', true));
      const on = (ev, fn) => offs.push(G.on(ev, (...a) => { if (cur && cur.id === 'curb') fn(...a); }));
      on('phone:open', app => { const k = I().sub; if (k === 'move') sendWelcome(); if (k === 'phone' || k === 'move') sub('read'); if (app === 'messages' && /phone|read|move/.test(k)) toTaxi(); if (app === 'taxi' && I().sub === 'taxi_app') sub('call'); });
      on('phone:app', app => { const k = I().sub; if (app === 'messages' && /phone|read/.test(k)) toTaxi(); else if (app === 'taxi' && /taxi_app|read|phone/.test(k)) { safe(() => G.phone.unlock('taxi', true)); sub('call'); } });
      on('msg:read', () => { if (/phone|read/.test(I().sub)) toTaxi(); });
      on('phone:close', () => { const k = I().sub; if (k === 'read') sub('phone'); else if (k === 'call' && !safe(() => G.transit.pending, null)) sub('taxi_app'); });
      on('taxi:request', () => sub('wait')); on('taxi:here', () => sub('get_in')); on('taxi:cancel', () => sub('taxi_app'));
    },
    update(dt) {
      const k = I().sub, P = G.player, pend = safe(() => G.transit.pending, null); tm += dt;
      if (k === 'move' && p0 && (Math.hypot(P.x - p0.x, P.y - p0.y) > 1.2 || tm > 8)) { sendWelcome(); sub('phone'); }
      else if (/taxi_app|call/.test(k) && pend && !phoneOpen()) sub(pend.state === 'waiting' ? 'get_in' : 'wait');
      else if (/wait|get_in/.test(k) && !pend) { idle += dt; if (idle > 2.5) sub('taxi_app'); } else idle = 0;
    },
    done: () => !!safe(() => G.transit.ride && G.transit.ride.kind === 'taxi', false),
    exit() { for (const f of offs) f(); offs = []; if (lug) safe(() => cityW().remove(lug)); lug = null; safe(() => G.phone.unlock('taxi', true)); },
  });
}

/* ---------- step: cab_ride (Manny's tour) ---------- */
{
  let offs = [], q = [], t = 0, nextAt = 0, fillers = 0, seen = {};
  register({ id: 'cab_ride',
    enter() {
      const h = home(); q = TAXI_RIDE.pickup.slice(); t = 0; nextAt = 1.2; fillers = 0; seen = {};
      if (!safe(() => G.transit.ride, null)) { G.state.flags.firstCabFree = true; if (!safe(() => G.transit.pending, null) && h) safe(() => G.transit.callTaxi(h.roomId, { free: true })); }
      const me = cur;
      offs.push(G.on('ride:district', k => { if (seen[k]) return; seen[k] = 1; const L = TAXI_RIDE.districts[k]; if (L) { if (q.length > 2) q.length = 2; q.push(...L.slice(0, 2)); } }));
      offs.push(G.on('ride:end', kind => { if (cur !== me || kind !== 'taxi') return; if (nearDoor(22)) next(); else { I().sub = 'taxi_app'; goto('curb'); } }));
    },
    update(dt) {
      if (!safe(() => G.transit.ride, null)) return; t += dt;
      if (t < nextAt) return;
      if (q.length) { caption(short('manny'), fill(q.shift()), 3500); nextAt = t + 3.9; }
      else if (t > nextAt + 5 && fillers < 3) { const F = TAXI_RIDE.filler; q.push(F[(fillers++ * 3 + (G.state.player.name || '').length) % F.length]); }
    },
    exit() { for (const f of offs) f(); offs = []; caption(); },
  });
}

/* ---------- step: apartment_arrival (Walt, keys, go inside) ---------- */
register({ id: 'apartment_arrival',
  async enter() {
    const my = token, h = home(), s = I(); let door = doorPoi(); if (!h || !door) return next();
    if (!nearDoor(22)) { const f = freeNear(door.x, door.y + 2, 0); await G.go('city', { x: f.x, y: f.y }); if (!live(my)) return; door = doorPoi(); }
    const w = cityW(), dk = safe(() => w.districtAt(door.x, door.y), null), B = STARTER_BUILDINGS[dk] || null, bname = (h.home && h.home.name) || (B && B.name) || 'the building';
    const spot = freeNear(door.x + 1.5, door.y + 1.5, 0);
    safe(() => G.social.place('walt', h.roomId, { x: spot.x, y: spot.y, minutes: 300, anim: 'stand' })); safe(() => G.social.refresh());
    if (!s.keys) {
      await sleep(900); if (!live(my)) return;
      const lines = [], M = short('manny'), arr = (TAXI_RIDE.arrival[dk] || [])[0];
      if (arr) lines.push({ who: M, text: arr }); lines.push({ who: M, text: TAXI_RIDE.fare[0] }, { who: M, text: TAXI_RIDE.fare[1] });
      for (const st of KEY_HANDOVER) { if (st.text === 'DISTRICT_LINE') { if (B) lines.push({ who: short('walt'), text: B.walt }); continue; } lines.push({ who: st.speaker === 'narrator' ? '' : short(st.speaker), text: st.text, anim: st.anim, sp: st.speaker }); }
      lines.push({ who: M, text: TAXI_RIDE.fare[2] }, { who: M, text: TAXI_RIDE.fare[3] });
      for (const l of lines) {
        const ch = l.sp === 'walt' ? safe(() => G.social.char('walt'), null) : null; if (ch && l.anim) ch.pose = l.anim === 'stand' ? null : l.anim;
        await say([{ who: l.who, text: fill(l.text).replace(/\{building\}/g, bname) }]); if (!live(my)) return;
      }
      s.keys = 1; safe(() => G.social.meet('walt')); safe(() => G.social.meet('manny')); toast('Got the keys to ' + bname + '!', 'good', 3200);
    }
    hint(SEQ.tut_enter.prompt, { x: door.x, y: door.y, h: 3.2 });
  },
  done: () => !!safe(() => G.housing.isHome(), false),
  exit() { safe(() => G.social.place('walt')); },
});

/* ---------- step: first_evening (intro complete; goals) ---------- */
register({ id: 'first_evening',
  enter() {
    const s = I(); G.state.flags.introDone = true; if (s.day0 === undefined) s.day0 = Math.floor(G.state.t / 1440);
    caption(null, SEQ.home_first_look.text, 4200); safe(() => G.goals.addList(SEQ.first_evening.listId));
    safe(() => G.phone.unlock('taxi', true)); G.emit('intro:done');
    setTimeout(() => { if (!dev()) safe(() => G.save()); }, 900);
    queueMicrotask(() => { if (cur && cur.id === 'first_evening') finish(); });
  },
});

async function skip() {
  if (skipping || (!cur && I().done)) return; skipping = true; leave();
  try {
    safe(() => G.phone.close()); const s = I(); sendWelcome(); s.keys = 1; home();
    if (safe(() => G.transit.ride, null)) { await new Promise(r => { const off = G.on('ride:end', () => { off(); r(); }); setTimeout(() => { off(); r(); }, 6000); safe(() => G.transit.skipRide()); }); }
    else safe(() => G.transit.cancel());
    if (!safe(() => G.housing.isHome(), false)) await G.housing.goHome();
  } catch (e) { console.warn('intro skip', e); }
  skipping = false; goto('first_evening');
}
function start() { G.state.intro = { at: null, done: 0, nudges: {}, hints: {} }; G.state.flags.introDone = false; fresh = true; return goto(steps[0].id); }
function resume() {
  const s = I(); if (!s.at || s.done || G.state.flags.introDone) return; fresh = false; const id = s.at;
  if (safe(() => G.housing.isHome(), false)) return goto('first_evening');
  if (id === 'cab_ride' || id === 'apartment_arrival') return goto(nearDoor(22) ? 'apartment_arrival' : 'curb');
  if (id === 'arrival_plane_cinematic') return goto('curb');
  return goto(steps.some(x => x.id === id) ? id : 'curb');
}

/* ---------- after the intro: nudges + one-time hints ---------- */
function nudges() {
  const s = I(); if (!G.state.flags.introDone || s.day0 === undefined || G.modal) return; const T = G.state.t, d = Math.floor(T / 1440) - s.day0, tod = T % 1440;
  for (const n of NUDGES) {
    if (s.nudges[n.id] || d < n.day || (d === n.day && tod < hm(n.at))) continue; s.nudges[n.id] = 1;
    const g = n.goal; if (g && safe(() => G.goals.isDone(g.id), false)) continue;
    const beat = /^STORY_BEAT:(.+)$/.exec(n.text);
    if (beat) { if (safe(() => G.story.beat(beat[1]).st, 'done') === 'pending') safe(() => G.story.offer(beat[1])); }
    else if (n.from === 'system') { if (!safe(() => G.phone.notify({ app: 'messages', title: 'Maple Bay tip', text: n.text.replace(/^Tip:\s*/, '') }), null)) toast(n.text, 'info', 5000); }
    else safe(() => G.messages.send({ from: n.from, text: n.text }));
    if (g) safe(() => G.goals.addFromList(g.list, g.id));
    break;
  }
}
function tip(id) { const s = I(); if (s.hints[id] || !TUTORIAL_HINTS[id] || !G.state.flags.introDone) return; s.hints[id] = 1; toast(TUTORIAL_HINTS[id], 'info', 4600); }
const NEED_TIP = { hunger: 'hungry', energy: 'tired', hygiene: 'grubby', fun: 'bored', social: 'lonely', fitness: 'out_of_shape' };

export function init() {
  G.defineState('intro', () => ({ at: null, done: 0, nudges: {}, hints: {} }));
  G.intro = { get steps() { return steps.map(s => s.id); }, get at() { return cur ? cur.id : null; }, get active() { return !!cur; }, register, goto, next, skip, start, hint };
  G.on('game:new', () => { if (dev() && !G.query.has('intro')) return; G.introHandled = true; start(); });
  G.on('load', () => { if (cur) leave(); });
  G.on('game:start', o => { if (o && o.isNew === false) setTimeout(resume, 400); });
  G.on('ready', () => { if (dev() && G.query.has('intro')) setTimeout(start, 300); });
  G.on('frame', dt => { const c = cur; if (!c) return; if (c.update) safe(() => c.update(dt, ctx)); if (cur === c && typeof c.done === 'function' && safe(() => c.done(ctx), false)) next(); });
  G.on('minutes', () => safe(nudges));
  G.on('needs:low', k => tip(NEED_TIP[k])); G.on('friend:up', () => tip('first_friend')); G.on('appt:add', () => tip('appointment'));
  G.on('ride:end', kind => { if (I().done) tip(kind === 'taxi' ? 'first_taxi' : kind === 'train' ? 'first_train' : kind === 'bus' ? 'first_bus' : ''); });
  G.on('activity:done', id => { if (id === 'sleep') tip('save'); }); G.on('job:hired', () => tip('first_shift'));
}
