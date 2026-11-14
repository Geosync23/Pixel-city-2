// _jobs_work.js — the on-shift work loop engine (private helper of sim/jobs.js).
//
// A shift is a stream of ORDERS ("tickets"). An order is a chain of STEPS; a step = one task from data/jobs.js workLoop.tasks done at
// a fixture carrying the task's station tag (or at a city door for the courier), optionally preceded by a micro-interaction (ui/jobs.js
// mini()). Per-job SCRIPTS below say which chains spawn, how often, with which customer and which mini; all names/minutes/anims/bonuses
// come from the data. Customers are light Chars living in the room scene (max 4) with a patience bar.
//   start(job, level, sh)  stop()  pause(bool)  update(dt)  onScene()  hud()  goStep(orderId)  debugStep()  city.set(key, target|null)
// `sh` is the persistent shift record (G.state.jobs.shift); the engine adds to sh.tasks / count / bonus / tipSum / tipN / missed.
import { G } from '../core/game.js';
import { Char, charArt } from '../core/char.js';
import { rng } from '../engine/raster.js';
import { toast, bubble } from '../ui/kit.js';
import { mini } from '../ui/jobs.js';
import { getCity } from '../world/_city.js';

const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const COLORS = { red: '#e05a3a', blue: '#4f7df0', green: '#3fae5a', yellow: '#f2c230', purple: '#a66bea' };
const INK = '#2a2733', GOLD = '#ffd84a';
export const MAX_CUSTOMERS = 4, MAX_ORDERS = 3;

/* ---------- content for the micro-interactions ---------- */
const ING = ['Espresso', 'Steamed milk', 'Chocolate', 'Tea', 'Ice', 'Hot water', 'Spice', 'Caramel'];
const DRINKS = [['Latte', ['Espresso', 'Steamed milk']], ['Mocha', ['Espresso', 'Chocolate', 'Steamed milk']], ['Iced Tea', ['Tea', 'Ice']], ['Americano', ['Espresso', 'Hot water']],
  ['Chai Latte', ['Tea', 'Spice', 'Steamed milk']], ['Iced Mocha', ['Espresso', 'Chocolate', 'Ice']], ['Caramel Latte', ['Espresso', 'Caramel', 'Steamed milk']]];
const BOTTLES = ['Gin', 'Blue curacao', 'Lemon', 'Whiskey', 'Maple syrup', 'Vodka', 'Ginger beer', 'Lime', 'Mint', 'Soda', 'Orange'];
const COCKTAILS = [['Blue Heron', ['Gin', 'Blue curacao', 'Lemon']], ['Maple Sour', ['Whiskey', 'Maple syrup', 'Lemon']], ['Harbor Mule', ['Vodka', 'Ginger beer', 'Lime']], ['Nojito', ['Mint', 'Lime', 'Soda']], ['Sunset Fizz', ['Gin', 'Orange', 'Soda']]];
const DISHES = [['Burger', 'grill'], ['Pancakes', 'grill'], ['Fries', 'fry'], ['Eggs & toast', 'grill'], ['Fish & chips', 'fry'], ['Grilled cheese', 'grill'], ['Onion rings', 'fry']];
const GROC = ['Milk', 'Eggs', 'Bread', 'Apples', 'Soup', 'Rice', 'Cheese', 'Tea', 'Pasta', 'Jam'];
const BOOKS = [['Dinosaurs A-Z', 'green'], ['Moby Duck', 'red'], ['Stars & Planets', 'blue'], ['A History of Maple Bay', 'purple'], ['The Secret Garden Gnome', 'red'], ['Bake It Easy', 'yellow'], ['Robots for Kids', 'green'], ['The Deep Sea', 'blue'], ['Lantern Row Recipes', 'yellow'], ['Old Harbor Days', 'purple']];
const SECTION = { red: 'Fiction', blue: 'Science', green: 'Kids', yellow: 'Cooking', purple: 'History' };
const ASKS = [['Anything with dragons in it?', 'Fantasy', ['Tax Law', 'Gardening']], ['My sourdough keeps dying.', 'Baking', ['Thrillers', 'Astronomy']], ['I want to learn the constellations.', 'Astronomy', ['Poetry', 'Car Repair']],
  ['Something to make me cry on the train?', 'Romance', ['Plumbing', 'Chess Openings']], ['My kid loves trucks. LOVES them.', 'Picture Books', ['Philosophy', 'True Crime']], ['Who built the lighthouse?', 'Local History', ['Sci-Fi', 'Knitting']]];
const AILS = [['a scraped knee', 'Bandage'], ['a bumped elbow', 'Ice pack'], ['the sniffles', 'Tissues'], ['a very brave face', 'Lollipop'], ['a paper cut', 'Bandage'], ['a twisted ankle', 'Ice pack']];
const SUPPLIES = ['Bandage', 'Ice pack', 'Tissues', 'Lollipop'];
const LIFT = [['"My arms are jelly..."', 'Two more. You have got this!', ['Maybe just go home.', 'Did you see the game last night?']], ['"Is my form okay?"', 'Elbows in, nice and slow. Looking good!', ['No idea, honestly.', 'Form is a myth.']], ['"This is so heavy!"', 'Breathe out and push. I am right here.', ['Yeah, I would not try that.', 'Heavier next time!']]];
const RUN = [['"One more minute... I cannot..."', 'Sixty seconds. Eyes up, you are flying!', ['You look terrible.', 'Minutes are long, huh.']], ['"Am I even getting faster?"', 'Faster than last week. I checked!', ['Probably not.', 'Speed is relative.']], ['"My playlist ran out."', 'Then run to my counting: one, two, one, two!', ['Tragic.', 'I only listen to podcasts.']]];
const THANKS = ['Thanks!', 'Perfect!', 'Lovely.', 'You rock!', 'Just right.', 'Cheers!'];
const CUSTOM = { // tasks the brief asks for that the data does not list
  triage: { id: 'triage', name: 'Triage at Reception', station: 'reception', minutes: 2, anim: 'talk', bonus: 0.5 },
  last_call: { id: 'last_call', name: 'Ring Last Call', station: 'bar_counter', minutes: 2, anim: 'wave', bonus: 1 },
};

const pickMini = (title, prompt, need, pool, ordered) => { const options = shuffle([...new Set([...need, ...shuffle(pool.filter(x => !need.includes(x))).slice(0, Math.max(2, 6 - need.length))])]); return { kind: 'pick', title, prompt, need, options, answer: need.map(n => options.indexOf(n)), ordered: !!ordered }; };
const choiceMini = (title, prompt, right, wrong) => { const options = shuffle([right, ...wrong]); return { kind: 'pick', title, prompt, options, answer: [options.indexOf(right)], wide: true }; };
const mash = (title, label, n) => ({ kind: 'taps', mode: 'mash', title, label, n, prompt: 'Tap the button (or any key) to fill the bar' });
const meter = (mode, title, prompt, label) => ({ kind: 'meter', mode, title, prompt, label, zone: mode === 'hold' ? [.72, .9] : [.56, .84] });
const s = (t, o) => Object.assign({ t }, o);

/* ---------- per-job scripts: l = job level ---------- */
const SCRIPTS = {
  barista: l => [
    { id: 'order', every: () => { const h = G.now().hf; return h >= 7.5 && h < 9 ? [5, 9] : [8, 14]; }, first: 1, max: 3, patience: 45, make() { const d = pick(DRINKS), pastry = Math.random() < .35;
      return { title: d[0] + (pastry ? ' + pastry' : ''), custAt: { tag: 'till' }, steps: [s('take_order'), s('make_drink', { mini: pickMini('Make: ' + d[0], 'Tap the ingredients on the ticket', d[1], ING) }), pastry && s('plate_pastry', { item: 'box' }), s('serve', { cust: { tag: 'pickup_counter' } })] }; } },
    { id: 'wipe', filler: 1, make: () => ({ title: 'Quiet moment', steps: [s('wipe_tables', { any: 1 })] }) },
    { id: 'case', filler: 1, make: () => ({ title: 'Pastry case', steps: [s('plate_pastry', { name: 'Restock Pastry Case' })] }) },
  ],
  grocery_clerk: l => [
    { id: 'restock', every: [12, 18], first: 1, make: () => ({ title: 'Empty shelf', steps: [s('fetch_crate', { any: 1, carry: 'box' }), s('restock_shelf', { any: 1 })] }) },
    { id: 'checkout', every: [10, 15], first: 4, lvl: 2, max: 2, patience: 40, make: () => ({ title: 'Customer at the till', custAt: { tag: 'till' }, steps: [s('checkout', { mini: { kind: 'taps', mode: 'belt', title: 'Ring it up', prompt: 'Tap each item as it slides past', labels: shuffle(GROC).slice(0, 5) } })] }) },
    { id: 'carts', every: [150, 200], first: 60, limit: 2, make: () => ({ title: 'Stray carts', steps: [s('collect_carts', { any: 1 })] }) },
    { id: 'mist', filler: 1, make: () => ({ title: 'Sad lettuce', steps: [s('mist_produce', { any: 1 })] }) },
    { id: 'tidy', filler: 1, make: () => ({ title: 'Tidy up', steps: [s('mist_produce', { any: 1, name: 'Tidy the Produce' })] }) },
  ],
  line_cook: l => [
    { id: 'ticket', every: () => { const h = G.now().hf; return (h >= 12 && h < 14) || h >= 17.5 ? [7, 10] : [10, 16]; }, first: 1, max: l >= 2 ? 2 : 1, patience: 55, make() { const d = pick(DISHES);
      return { title: 'Ticket: ' + d[0], steps: [s('read_ticket'), s('prep', { mini: mash('Prep: ' + d[0], 'Chop!', 6) }), s(d[1], { mini: meter('timing', d[1] === 'grill' ? 'On the grill' : 'In the fryer', 'Take it off while the marker is in the green', 'Take it off!') }), s('plate_up', { item: 'box' })] }; } },
    { id: 'dishes', filler: 1, make: () => ({ title: 'Between tickets', steps: [s('wash_dishes')] }) },
  ],
  office_analyst: l => [
    { id: 'report', every: [2, 5], first: 0, make: () => ({ title: 'Report for the boss', steps: [s('crunch_numbers', { mini: mash('Crunch numbers', 'Type', 9) }), s('crunch_numbers', { name: 'Check the Figures', mini: mash('Check the figures', 'Type', 9) }), s('print_report', { any: 1, carry: 'box' }), s('deliver_report')] }) },
    { id: 'meeting', at: [10, 15], make: () => ({ title: 'Team meeting', steps: [s('attend_meeting')] }) },
    { id: 'coffee', every: [999, 999], first: 70, limit: 1, make: () => ({ title: 'Coffee run', steps: [s('coffee_run', { onDone: () => { G.needs && G.needs.add('energy', 10); G.needs && G.needs.add('social', 5); } })] }) },
    { id: 'file', every: [35, 55], first: 20, make: () => ({ title: 'Loose paperwork', steps: [s('file_documents', { any: 1 })] }) },
  ],
  courier: l => [{ id: 'run', every: [1, 3], first: 0, make: () => courierRun(l) }],
  fitness_trainer: l => [
    { id: 'member', every: [8, 14], first: 1, max: 2, patience: 40, make() { const k = pick(['greet', 'spot', 'coach']);
      if (k === 'greet') return { title: 'Member at the desk', custAt: { tag: 'front_desk' }, steps: [s('greet_member')] };
      const q = pick(k === 'spot' ? LIFT : RUN);
      return k === 'spot' ? { title: 'Lifter needs a spotter', custAt: { tag: 'weights', mode: 'pose', anim: 'lift' }, steps: [s('spot_lifter', { mini: choiceMini('Spot a lifter', q[0], q[1], q[2]) })] }
        : { title: 'Runner is flagging', custAt: { tag: 'treadmill', mode: 'pose', anim: 'treadmill' }, steps: [s('coach_runner', { mini: choiceMini('Coach a runner', q[0], q[1], q[2]) })] }; } },
    { id: 'clutter', every: [28, 34], first: 8, make: () => (Math.random() < .5 ? { title: 'Loose dumbbells', steps: [s('rerack_weights', { any: 1 })] } : { title: 'Towel shelf is empty', steps: [s('restock_towels')] }) },
    { id: 'class', at: [12], lvl: 2, make: () => ({ title: 'Noon yoga class', steps: [s('lead_class', { pose: 1 })] }) },
    { id: 'towels', filler: 1, make: () => ({ title: 'Quiet floor', steps: [s('restock_towels')] }) },
  ],
  librarian: l => [
    { id: 'returns', every: [18, 24], first: 1, make() { const st = [s('collect_returns', { any: 1, carry: 'box' })]; for (const b of shuffle(BOOKS).slice(0, 3)) st.push(s('shelve_books', { name: `Shelve "${b[0]}"`, color: b[1], hint: SECTION[b[1]], keep: 1 })); st[st.length - 1].keep = 0; return { title: 'Returns cart', steps: st }; } },
    { id: 'patron', every: [12, 18], first: 3, patience: 40, make() { const q = pick(ASKS); return { title: 'Patron at the desk', custAt: { tag: 'front_desk' }, steps: [l >= 2 && Math.random() < .55 ? s('recommend', { mini: choiceMini('Which section?', '"' + q[0] + '"', q[1], q[2]) }) : s('check_out')] }; } },
    { id: 'shush', every: [25, 35], first: 10, make: () => ({ title: 'Noise in the reading room', steps: [s('shush', { any: 1 })] }) },
    { id: 'story', at: [11], lvl: 3, when: () => G.now().weekday === 5, make: () => ({ title: 'Story time', steps: [s('story_time')] }) },
    { id: 'straighten', filler: 1, make: () => ({ title: 'Quiet hour', steps: [s('shelve_books', { any: 1, name: 'Straighten a Shelf' })] }) },
  ],
  nurse: l => [
    { id: 'patient', every: [15, 25], first: 1, max: l >= 2 ? 2 : 1, patience: 110, make() { const a = pick(AILS);
      return { title: 'Patient with ' + a[0], custAt: { tag: 'reception' }, steps: [s('triage'), s('call_patient', { cust: { tag: 'waiting_room', mode: 'seat', anim: 'sit' } }), s('take_vitals', { cust: { tag: 'exam_room', mode: 'bed' } }),
        s('fetch_supplies', { carry: 'box', mini: pickMini('Supply cabinet', 'The patient has ' + a[0] + '. Fetch the right thing.', [a[1]], SUPPLIES) }), s('treat'), s('update_chart', { mini: mash('Update the chart', 'Type', 7), custLeave: 1 })] }; } },
    { id: 'charts', filler: 1, make: () => ({ title: 'Paperwork', steps: [s('update_chart', { name: 'Tidy the Charts' })] }) },
  ],
  dock_worker: l => [
    { id: 'crate', every: [6, 9], first: 0, max: 2, make() { const c = pick(['red', 'blue', 'green', 'yellow']); return { title: c[0].toUpperCase() + c.slice(1) + ' crate', steps: [s('unload_crate', { any: 1, carry: 'box', name: 'Unload the ' + c + ' crate' }), s('stack_crate', { color: c, hint: c + ' pallet', onDone: w => w.cnt.stack++ })] }; } },
    { id: 'pallet', when: w => w.cnt.stack >= 4, make(w) { w.cnt.stack -= 4; return { title: 'Full pallet', steps: [s('check_manifest', { any: 1 }), l >= 3 ? s('drive_forklift', { any: 1 }) : s('load_ship', { any: 1, item: 'box' })] }; } },
    { id: 'manifest', filler: 1, make: () => ({ title: 'Waiting on a truck', steps: [s('check_manifest', { any: 1, name: 'Read the Manifest' })] }) },
  ],
  bartender: l => [
    { id: 'order', every: () => (G.now().hf >= 21 ? [4, 6] : [6, 10]), first: 1, max: 3, patience: 35, make() { const c = l >= 2 && Math.random() < .5 ? pick(l >= 3 ? COCKTAILS : COCKTAILS.slice(1)) : null;
      return { title: c ? c[0] : 'Draft beer', custAt: { tag: 'bar_counter' }, steps: [s('take_order'), c ? s('mix_cocktail', { mini: pickMini('Mix: ' + c[0], 'Add the three ingredients in ticket order', c[1], BOTTLES, true) }) : s('pour_beer', { mini: meter('hold', 'Pour a draft', 'Hold to pour. Let go when the glass reaches the green line.', 'Hold to pour') }), s('serve_drink', { onDone: w => w.cnt.drinks++ })] }; } },
    { id: 'wash', when: w => w.cnt.drinks >= 6, make(w) { w.cnt.drinks -= 6; return { title: 'Out of clean glasses', steps: [s('wash_glasses')] }; } },
    { id: 'ear', every: [110, 150], first: 45, limit: 2, patience: 60, make: () => ({ title: 'A regular wants to talk', custAt: { tag: 'bar_stool', mode: 'seat', anim: 'sit' }, steps: [s('lend_an_ear')] }) },
    { id: 'lastcall', when: w => !w.cnt.last && w.sh.end - G.state.t < 30, make(w) { w.cnt.last = 1; return { title: 'Last call!', steps: [s('last_call')] }; } },
    { id: 'polish', filler: 1, make: () => ({ title: 'Quiet bar', steps: [s('wash_glasses', { name: 'Polish Glasses' })] }) },
  ],
};

/* ---------- courier runs (the outdoor job) ---------- */
export const cityWorld = () => { const c = G.sceneCache.get('city'); if (c && c.world) return c.world; try { return getCity(); } catch (e) { return null; } };
/** door pois sorted by distance from a point */
export function doorsNear(x, y, filter) { const w = cityWorld(); if (!w) return []; return w.pois.filter(p => p.type === 'door' && (!filter || filter(p))).map(p => ({ p, d: Math.hypot(p.x - x, p.y - y) })).sort((a, b) => a.d - b.d).map(e => e.p); }
function courierRun(l) {
  const w = cityWorld(); if (!w) return null; const dep = w.pois.find(p => p.id === 'door:courier') || { x: G.player.x, y: G.player.y };
  const doors = doorsNear(dep.x, dep.y, p => p.id !== 'door:courier'); if (!doors.length) return null;
  const express = l >= 3 && Math.random() < .3, n = express ? 1 : l >= 3 ? 4 : 3;
  let pool = express ? doors.slice(-12) : doors.slice(0, [8, 14, 22, 40][l - 1]), chosen = [], at = dep; pool = shuffle(pool).slice(0, n);
  while (pool.length) { pool.sort((a, b) => Math.hypot(a.x - at.x, a.y - at.y) - Math.hypot(b.x - at.x, b.y - at.y)); at = pool.shift(); chosen.push(at); } // nearest-neighbour route
  const steps = [s('load_parcels', { any: 1, carry: 'box' })]; at = dep;
  chosen.forEach((p, i) => { const d = Math.hypot(p.x - at.x, p.y - at.y); at = p; steps.push(s(express ? 'express_parcel' : 'deliver_door', { name: 'Deliver to ' + (p.name || 'the marked door'), city: { x: p.x, y: p.y, name: p.name || 'Delivery', id: p.id }, budget: express ? Math.max(40, d * .6) : (i ? 20 : 45) + d * .7, keep: i < chosen.length - 1 })); });
  steps.push(s('scan_in'));
  return { title: express ? 'EXPRESS parcel' : `Run: ${n} parcels`, steps };
}

/* ---------- city targets (courier doors, gig waypoints): marker + interactable + phone waypoint ---------- */
const cityT = new Map();
export const city = {
  set(key, t) {
    const old = cityT.get(key);
    if (old) { if (t && old.t.x === t.x && old.t.y === t.y && old.t.label === t.label) { old.t = t; return; } old.rm(); cityT.delete(key); if (!t) try { G.phone && G.phone.setWaypoint && G.phone.setWaypoint(null); } catch (e) { /* optional */ } }
    if (!t) return; const e = { t, rm: null }; const z = () => { const w = cityWorld(); return w ? w.heightAt(t.x, t.y) : 0; };
    e.it = { scene: 'city', x: t.x, y: t.y, z: z() + 1.2, h: 2.2, hit: 15, range: 2.4, label: t.label, use: () => e.t.use() }; e.rm = G.addInteractable(e.it); cityT.set(key, e);
    try { G.phone && G.phone.setWaypoint && G.phone.setWaypoint({ x: t.x, y: t.y, name: t.name, label: t.name }); } catch (err) { /* optional */ }
  },
  get: key => { const e = cityT.get(key); return e ? e.it : null; },
};

/* ---------- engine ---------- */
let W = null;
export const cur = () => W;
const inRoom = () => !!W && G.scene === W.scene && G.scene.id === W.roomId;
const fxList = tag => (inRoom() && W.scene.byTag ? W.scene.byTag(tag) : []);
const taskOf = id => W.job.workLoop.tasks.find(t => t.id === id) || CUSTOM[id];
const SEATED = { sit: 1, type: 1, read: 1 };
/** where the player walks to and where the body is snapped while working at a fixture */
function posOf(fx, st) {
  const w = W.scene.world, free = q => q && !w.isBlocked(q.x, q.y), anim = st.task.anim; let at = null;
  if (st.pose && fx.pose) at = fx.pose; else if (SEATED[anim] && fx.seats.length) at = fx.seats.find(q => q.staff) || (!fx.staff ? fx.seats[0] : null);
  if (!at && fx.staff) at = fx.staff;
  const spot = at && !at.z && free(at) ? at : fx.use || null;
  return { spot: spot ? { x: spot.x, y: spot.y } : undefined, at: at ? { x: at.x, y: at.y, z: at.z || 0, dir: at.dir } : null };
}

export function start(job, level, sh) {
  stop();
  W = { job, level, sh, scene: G.scene, roomId: 'int:' + job.venue, orders: [], custs: [], next: {}, n: {}, cnt: { stack: 0, drinks: 0 }, fired: {}, seq: 0, paused: false, its: [], res: [], carry: null, lock: false, active: null };
  W.tpl = (SCRIPTS[job.id] ? SCRIPTS[job.id](level) : []).filter(t => !t.lvl || level >= t.lvl);
  for (const t of W.tpl) if (t.every) W.next[t.id] = G.state.t + (t.first || 0);
  if (inRoom() && G.crowd && G.crowd.reserve) for (const tag of job.workLoop.stations) for (const fx of fxList(tag)) if (fx.staff || tag === 'own_desk') { try { G.crowd.reserve(fx); W.res.push(fx); } catch (e) { /* optional */ } }
  update(0);
}
function dropCarry() { const p = G.player; if (W) W.carry = null; p.carry = false; p.poseOpts = null; }
export function stop() {
  if (!W) return; clearIts(); for (const c of W.custs.slice()) removeCust(c); for (const fx of W.res) try { G.crowd.release(fx); } catch (e) { /* optional */ }
  city.set('shift', null); dropCarry(); W = null; G.emit('jobs:hud');
}
/** pause the stream (auto-work): customers leave, tickets are cleared */
export function pause(b) { if (!W) return; W.paused = b; if (b) { for (const o of W.orders) if (o.cust) leave(o.cust); W.orders = []; dropCarry(); } sync(); }
export function onScene() { if (!W) return; if (G.scene.id === W.roomId && G.scene !== W.scene) { W.scene = G.scene; W.custs = []; W.its = []; for (const o of W.orders) { o.cust = null; const st = o.steps[o.i]; if (st && !st.city) resolve(o, st); } } sync(); }

function spawn(t) {
  const m = t.make(W); if (!m) return null;
  const steps = m.steps.filter(Boolean).map(sp => { const task = taskOf(sp.t); return task && !(task.unlockLevel > W.level) ? Object.assign({ task, tag: task.station, name: task.name }, sp) : null; }).filter(Boolean); if (!steps.length) return null;
  const o = { id: ++W.seq, tpl: t.id, title: m.title, steps, i: 0, t0: G.state.t, patience: t.patience || 0, due: t.patience ? G.state.t + t.patience : 0, qs: [], cust: null, custAt: null };
  W.n[t.id] = (W.n[t.id] || 0) + 1; W.orders.push(o);
  if (m.custAt) { if (inRoom() && W.custs.length < MAX_CUSTOMERS) o.cust = spawnCust(); moveCust(o, m.custAt); }
  activate(o); return o;
}
function resolve(o, st) { // pick the concrete fixture(s) for a step
  const list = fxList(st.tag); if (!list.length) return false; const idx = list.map((_, i) => i);
  if (st.fi === undefined || st.fi >= list.length) st.fi = o.custAt && o.custAt.tag === st.tag ? o.custAt.fi : st.any ? pick(idx) : 0;
  if (st.color && !st.opts) { const others = shuffle(Object.keys(COLORS).filter(c => c !== st.color)), fis = shuffle(idx).slice(0, Math.min(3, list.length)); st.opts = shuffle(fis.map((fi, k) => ({ fi, color: k ? others[k - 1] : st.color, ok: !k }))); }
  return true;
}
function activate(o) {
  for (;;) { const st = o.steps[o.i]; if (!st) return finish(o);
    if (st.cust) moveCust(o, st.cust);
    if (st.city) { if (st.budget) st.due = G.state.t + st.budget; break; }
    if (!inRoom() || resolve(o, st)) break; o.i++; } // a room without that station: skip the step rather than block the chain
  sync();
}
function stepUse(o, oi) {
  const st = o.steps[o.i]; if (!W || !st || W.lock || W.paused || G.busy || W.orders.indexOf(o) < 0) return;
  if (st.opts && oi !== undefined && !st.opts[oi].ok) { st.wrong = (st.wrong || 0) + 1; toast(`Not this one. Find the ${st.color} marker${st.hint ? ' (' + st.hint + ')' : ''}.`, 'bad'); return; }
  const go = q => {
    const t = st.task, fx = st.city ? null : fxList(st.tag)[st.opts && oi !== undefined ? st.opts[oi].fi : st.fi], ps = fx ? posOf(fx, st) : {}, p = G.player, item = st.item || (t.anim === 'carry' ? 'box' : null), dur = Math.min(3.4, 1 + t.minutes * .12);
    const back = () => { W && (W.active = null); p.poseOpts = W && W.carry ? { item: W.carry } : null; };
    if (item) p.poseOpts = { item }; W.active = o; if (fx) p.faceTo(fx.x, fx.y);
    G.startActivity({ label: st.name, anim: t.anim, minutes: t.minutes, rate: t.minutes / dur, at: ps.at || undefined, jobTask: true, done: () => { back(); if (W && W.orders.indexOf(o) >= 0) complete(o, q); }, cancel: back });
  };
  if (!st.mini) return go(st.wrong ? .5 : 1);
  W.lock = true; mini(st.mini).then(q => { if (!W) return; W.lock = false; if (q === null || q === undefined || W.orders.indexOf(o) < 0 || o.steps[o.i] !== st) return; go(q); });
}
/** a step is finished with quality q 0..1 (the UI path and debugStep both end here) */
export function complete(o, q = 1) {
  const st = o.steps[o.i], t = st.task, sh = W.sh, p = G.player; let bonus = t.bonus || 0, note = '';
  if (st.due) { if (G.state.t <= st.due) { bonus += 1; note = ' on time'; } else q = Math.min(q, .6); }
  if (st.mini && q >= .99) { bonus += .5; note = ' perfect'; sh.perfect = (sh.perfect || 0) + 1; } else if (q < .5) bonus *= .5;
  sh.tasks += (t.countsAs || 1) * (.6 + .4 * q); sh.count++; sh.bonus += bonus; o.qs.push(q); st.done = true;
  if (bonus > 0) bubble(p, `+$${bonus.toFixed(2)}${note}`, 900);
  if (st.carry) { W.carry = st.carry; p.carry = true; p.poseOpts = { item: st.carry }; } else if (W.carry && !st.keep) dropCarry();
  if (st.onDone) st.onDone(W);
  if (st.custLeave && o.cust) { bubble(o.cust, pick(THANKS), 1600); leave(o.cust); o.cust = null; }
  G.emit('job:task', W.job.id, t.id, q); o.i++; activate(o);
}
function finish(o) {
  const i = W.orders.indexOf(o); if (i >= 0) W.orders.splice(i, 1); const sh = W.sh, avg = o.qs.length ? o.qs.reduce((a, b) => a + b, 0) / o.qs.length : 1;
  const speed = o.due ? .6 + .4 * Math.min(1, Math.max(0, (o.due - G.state.t) / o.patience) * 2) : 1;
  if (o.cust || o.due) { sh.tipSum += avg * speed; sh.tipN++; }
  if (o.cust) { bubble(o.cust, avg * speed > .75 ? pick(THANKS) : 'Hm. Okay.', 1600); leave(o.cust); }
  sync();
}
function expire(o) {
  const i = W.orders.indexOf(o); if (i >= 0) W.orders.splice(i, 1); W.sh.missed++; W.sh.tipN++;
  if (o.cust) { bubble(o.cust, '...', 1400); leave(o.cust); toast('A customer gave up waiting.', 'bad'); } else toast(`"${o.title}" went cold.`, 'bad');
  if (W.carry) dropCarry(); sync();
}

export function update(dt) {
  if (!W || W.paused) return; const now = G.state.t;
  for (const o of W.orders.slice()) if (o.due && now > o.due && W.active !== o && !W.lock) expire(o);
  for (const t of W.tpl) {
    if (t.filler || (t.limit && (W.n[t.id] || 0) >= t.limit)) continue; const n = W.orders.filter(o => o.tpl === t.id).length;
    if (t.at) { const hf = G.now().hf; for (const h of t.at) if (hf >= h && hf < h + .5 && !W.fired[t.id + h] && (!t.when || t.when(W))) { W.fired[t.id + h] = 1; spawn(t); } continue; }
    if (!t.every) { if (n < (t.max || 1) && t.when(W)) spawn(t); continue; }
    if (now >= W.next[t.id] && n < (t.max || 1) && W.orders.length < MAX_ORDERS) { spawn(t); const e = typeof t.every === 'function' ? t.every() : t.every; W.next[t.id] = now + rnd(e[0], e[1]); }
  }
  if (!W.orders.length) { const f = W.tpl.filter(t => t.filler); if (f.length) spawn(pick(f)); }
}

/* ---------- interactables + markers ---------- */
function clearIts() { if (!W) return; const a = W.scene && W.scene.interactables; if (a) for (const it of W.its) { const i = a.indexOf(it); if (i >= 0) a.splice(i, 1); } W.its = []; }
export function sync() {
  if (!W) return; clearIts(); let ct = null;
  for (const o of W.orders) {
    const st = o.steps[o.i]; if (!st) continue;
    if (st.city) { if (!ct) ct = Object.assign({}, st.city, { label: st.name, use: () => stepUse(o) }); continue; }
    if (!inRoom()) continue;
    (st.opts || [{ fi: st.fi }]).forEach((op, k) => { const fx = fxList(st.tag)[op.fi]; if (!fx) return; const ps = posOf(fx, st);
      const it = { x: fx.x, y: fx.y, h: Math.min(1.6, (fx.ob.size && fx.ob.size[2]) || 1), label: st.name, spot: ps.spot, range: ps.spot ? undefined : 2.2, use: () => stepUse(o, st.opts ? k : undefined), _fx: fx, _color: op.color ? COLORS[op.color] : null, _o: o };
      W.scene.interactables.unshift(it); W.its.push(it); });
  }
  city.set('shift', ct); G.emit('jobs:hud');
}
/** HUD ticket tapped: walk to that ticket's current station */
export function goStep(id) {
  if (!W || G.busy) return; const o = W.orders.find(x => x.id === id), st = o && o.steps[o.i]; if (!st) return;
  if (st.city) { const it = city.get('shift'); if (it && G.scene.id === 'city') G.useInteractable(it); else toast('Head out into the city: ' + st.name + '.'); return; }
  if (!inRoom()) return toast('Back at the workplace: ' + st.name + '.');
  if (st.opts) return toast(`Tap the fixture with the ${st.color} marker${st.hint ? ' (' + st.hint + ')' : ''}.`);
  const it = W.its.find(x => x._o === o); if (it) G.useInteractable(it);
}
/** test hook: finish the current step of the first ticket without walking or minis. Returns the task id. */
export function debugStep() { if (!W) return null; if (!W.orders.length) { W.paused = false; update(0); } const o = W.orders[0]; if (!o) return null; const id = o.steps[o.i].task.id; complete(o, 1); return id; }
export function hud() {
  if (!W) return null; const now = G.state.t;
  return W.orders.map(o => ({ id: o.id, title: o.title, pat: o.due ? Math.max(0, Math.min(1, (o.due - now) / o.patience)) : null,
    steps: o.steps.map((st, i) => ({ name: st.name, done: i < o.i, cur: i === o.i, color: i === o.i && st.color ? COLORS[st.color] : null, hint: i === o.i ? st.hint : null, left: i === o.i && st.due ? Math.round(st.due - now) : null })) }));
}

/* ---------- customers ---------- */
function spawnCust() {
  const A = charArt(), sp = W.scene.spawn || { x: 2, y: 2 }, c = new Char(A.randomSpec(rng(1 + Math.floor(Math.random() * 1e6)), { season: G.now().season }), sp.x + rnd(-.3, .3), sp.y - .3);
  c.jobCust = true; c.update = dt => custUpdate(c, dt); W.scene.ents.push(c); W.custs.push(c); return c;
}
function removeCust(c) { if (!W) return; let i = W.custs.indexOf(c); if (i >= 0) W.custs.splice(i, 1); i = W.scene.ents.indexOf(c); if (i >= 0) W.scene.ents.splice(i, 1); }
function custGo(c, x, y, snap) { c.pose = null; c.zoff = 0; c.snap = snap || null; c.going = true; c.gx = x; c.gy = y; if (!c.goTo(W.scene.world, x, y, { snap: 8 })) { c.x = x; c.y = y; } }
function leave(c) { const sp = W.scene.spawn || { x: 2, y: 2 }; c.leaving = true; custGo(c, sp.x, sp.y - .2); }
function custUpdate(c, dt) {
  if (!W) return; if (c.going) { c.move(W.scene.world, dt); if (!c.path || !c.path.length || Math.hypot(c.x - c.gx, c.y - c.gy) < .25) { c.going = false; c.path = null; if (c.leaving) return removeCust(c);
    const q = c.snap; if (q) { c.x = q.x; c.y = q.y; c.zoff = q.z || 0; if (q.dir !== undefined) c.dir = q.dir; c.pose = q.anim || null; c.z = W.scene.world.heightAt(c.x, c.y) + c.zoff; } else if (c.look) c.faceTo(c.look.x, c.look.y); } }
  else { c.t += dt; c.moving = false; }
}
function moveCust(o, at) {
  const list = fxList(at.tag); if (!list.length) { o.custAt = { tag: at.tag, fi: 0 }; return; }
  const used = W.orders.filter(x => x !== o && x.custAt && x.custAt.tag === at.tag).map(x => x.custAt.fi), free = list.map((_, i) => i).filter(i => !used.includes(i));
  const fi = free.length ? pick(free) : Math.floor(Math.random() * list.length), fx = list[fi], mode = at.mode || 'use', c = o.cust; o.custAt = { tag: at.tag, fi }; if (!c) return;
  let sn = null; if (mode === 'pose') sn = fx.pose; else if (mode === 'seat') sn = fx.seats.find(q => !q.staff) || null; else if (mode === 'bed') sn = fx.bed || fx.seats[0] || null;
  const u = fx.use || { x: fx.x, y: fx.y }, k = used.filter(i => i === fi).length; c.look = { x: fx.x, y: fx.y };
  custGo(c, u.x + (sn ? 0 : k * .5), u.y + (sn ? 0 : k * .7), sn ? { x: sn.x, y: sn.y, z: sn.z || 0, dir: sn.dir, anim: at.anim || sn.anim || (mode === 'bed' ? 'sit' : 'sit') } : null);
}

/* ---------- canvas markers: bouncing arrows over current stations / doors, patience bars over customers ---------- */
function arrow(ctx, x, y, z, col, sq) {
  const sc = G.cssScale || 1, p = G.toScreen(x, y, z), px = Math.round(p.x / sc), py = Math.round(p.y / sc + Math.sin(performance.now() / 160) * 1.6) - 7;
  ctx.fillStyle = INK; for (let i = 0; i < 5; i++) ctx.fillRect(px - 5 + i, py + i - 1, 11 - 2 * i, 3);
  ctx.fillStyle = col; for (let i = 0; i < 5; i++) ctx.fillRect(px - 4 + i, py + i, 9 - 2 * i, 1);
  if (sq) { ctx.fillStyle = INK; ctx.fillRect(px - 4, py - 9, 9, 8); ctx.fillStyle = col; ctx.fillRect(px - 3, py - 8, 7, 6); }
}
function draw(ctx) {
  if (!G.scene || G.cutscene) return;
  if (G.scene.id === 'city') { for (const e of cityT.values()) arrow(ctx, e.t.x, e.t.y, G.world.heightAt(e.t.x, e.t.y) + 2.9, e.t.color || GOLD, true); }
  if (!W || !inRoom() || W.paused) return; const sc = G.cssScale || 1;
  for (const it of W.its) { const fx = it._fx; arrow(ctx, fx.x, fx.y, ((fx.ob.size && fx.ob.size[2]) || 1) + (fx.ob.z || 0) + .5, it._color || GOLD, !!it._color); }
  for (const o of W.orders) { const c = o.cust; if (!c || !o.due) continue; const f = Math.max(0, Math.min(1, (o.due - G.state.t) / o.patience)), p = G.toScreen(c.x, c.y, (c.z || 0) + 2.05), px = Math.round(p.x / sc) - 6, py = Math.round(p.y / sc);
    ctx.fillStyle = INK; ctx.fillRect(px - 1, py - 1, 14, 4); ctx.fillStyle = f > .5 ? '#3fae5a' : f > .25 ? '#f2c230' : '#e05a3a'; ctx.fillRect(px, py, Math.max(1, Math.round(12 * f)), 2); }
}
let hooked = false;
export function initWork() { if (hooked) return; hooked = true; G.overlays.push(draw); }
