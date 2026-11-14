// Ambient life for the airport rooms (private helper of airport.js): static crowd from def.npcSpots, lane walkers that ride the moving
// walkways, the boarding-gate queue cycle, carousel bags, the cabin deboarding choreography.
import { G } from '../../core/game.js';
import { Char, charArt } from '../../core/char.js';
import { asset } from '../../art/registry.js';
import { assetSprite } from '../../engine/sprites.js';
import { rng } from '../../engine/raster.js';
import { bubble } from '../../ui/kit.js';

export const TUNE = { BELT: 1.9, WALK: [1.5, 2.3], RUN: 4.3, FILL: .64, CAROUSEL: .85, AISLE: 3.1, ROW_GAP: .46 };
const BAGCOL = ['#c0392b', '#2f6fb0', '#3d4a54', '#3fa45b', '#8a5aa8', '#e08a2c', '#d86a8f', '#5fb7c9'];
const SEAT = ['sit', 'sit', 'phone', 'phone', 'read', 'sit', 'drink', 'talk', 'eat'], STAND = [null, null, 'phone', null, 'talk'];
const LINES = {
  traveller: ['Is this the line for B6? ...There is no line? Oh.', 'My connection is in forty minutes. I am very calm about it.', 'Third coffee. Do not judge me.', 'First time in Maple Bay? You will love the harbor.', 'They said the tram is "just past the pond". There is a POND.', 'I always forget which pocket my passport is in.', 'Window seat next time. I promised myself.', 'The noodle bar here is honestly worth a layover.', 'Have you seen a small blue backpack? No? Okay.', 'I love airports. Everybody is going somewhere.'],
  staff: ['Welcome to Maple Bay International!', 'Boarding passes ready, please. Not you - you just got here.', 'Tram to Baggage Claim is at the end of the concourse.', 'Let me know if you need anything.', 'Have a wonderful stay in Maple Bay.'],
  crew: ['Smooth landing, right? I thought so.', 'Back to Lisbon in two hours. No rest for the winged.', 'Best coffee is the kiosk by B5. Trust me.'],
  kid: ['We flew over the WHOLE ocean!', 'I saw the lighthouse from the plane!', 'Are we there yet? We are? Oh.'],
  greeter: ['Any minute now...', 'Was that them? No. Not them.', 'I made a sign and everything.', 'Flight landed twenty minutes ago. Where ARE they?'],
  claim: ['Mine is the black one. Yes, I know.', 'Carousel roulette. My favorite game.', 'If my bag went to Oslo again I swear...', 'Here it comes... nope. Not mine.'],
};
const pick = a => a[Math.floor(Math.random() * a.length)];
let POOL = null;
export function specs() {
  if (POOL) return POOL; const A = charArt(), r = rng(4711), s = G.now().season, mk = (n, o) => Array.from({ length: n }, () => A.randomSpec(r, Object.assign({ season: s }, o)));
  return POOL = { adult: mk(40, {}), kid: mk(6, { age: 'kid' }), elder: mk(6, { age: 'elder' }), crew: mk(4, { outfit: 'pilot' }), staff: mk(8, { outfit: 'office' }), cook: mk(3, { outfit: 'barista' }) };
}
export function anySpec(r = Math.random) { const P = specs(), k = r(); return k < .09 ? P.kid[Math.floor(r() * P.kid.length)] : k < .2 ? P.elder[Math.floor(r() * P.elder.length)] : P.adult[Math.floor(r() * P.adult.length)]; }
export function talk(c) { const k = c.kind || 'traveller'; c._hold = 3; if (!c.poseOpts || !c.poseOpts.seated) c.faceTo(G.player.x, G.player.y); bubble(c, pick(LINES[c.spec && c.spec.age === 'kid' ? 'kid' : k] || LINES.traveller)); G.emit('airport:talk', c); try { G.needs && G.needs.add && G.needs.add('social', 1); } catch (e) { } }
function addTalk(sc, c, label) { const it = { ent: c, x: c.x, y: c.y, label: label || 'Traveller', h: 1.2, hit: 6, range: 1.7, visible: () => !c.hidden && (c.alpha === undefined || c.alpha > .6), use: () => talk(c) }; sc.interactables.push(it); return it; }

/** static crowd from def.npcSpots. Returns { list, update(dt) } */
export function populate(sc, o = {}) {
  const r = rng(o.seed || 7), P = specs(), list = [];
  for (const s of sc.def.npcSpots || []) {
    const staff = s.kind === 'staff'; if (!staff && r() > (s.p !== undefined ? s.p : o.fill || TUNE.FILL)) continue;
    const w = sc.toWorld(s.x, s.y), spec = s.outfit === 'pilot' ? P.crew[Math.floor(r() * P.crew.length)] : s.outfit === 'cook' ? P.cook[Math.floor(r() * P.cook.length)] : staff ? P.staff[Math.floor(r() * P.staff.length)] : s.age === 'kid' ? P.kid[Math.floor(r() * P.kid.length)] : anySpec(r);
    const c = new Char(spec, w.x, w.y), seated = s.seated !== undefined ? s.seated : s.anim === 'sit'; c.z = s.z || 0; c.dir = s.dir !== undefined ? s.dir : 1; c.kind = s.role || (staff ? (s.outfit === 'pilot' ? 'crew' : 'staff') : 'traveller');
    c.poseOpts = seated ? { seated: true } : null; c.anims = seated ? SEAT : s.anim && s.anim !== 'stand' && s.anim !== 'sit' ? [s.anim, s.anim, null] : staff ? [null, 'work', null, 'talk'] : STAND; c.pose = seated ? 'sit' : null; c.think = r() * 9; c.spot = s; if (s.key) c.key = s.key;
    sc.ents.push(c); list.push(c); addTalk(sc, c, staff ? (s.label || 'Staff') : s.role === 'greeter' ? 'Someone waiting' : 'Traveller');
  }
  return { list, update(dt) { for (let i = 0; i < list.length; i++) { const c = list[i]; c.t += dt; if (c._hold > 0) { c._hold -= dt; continue; } if ((c.think -= dt) <= 0) { c.think = 4 + Math.random() * 10; const a = pick(c.anims); c.pose = c.poseOpts ? (a || 'sit') : a; if (!c.poseOpts) c.dir = c.spot.dir !== undefined ? c.spot.dir : c.dir; } } } };
}

/** belt lookup: belts = [{x0,x1,y0,y1,dir}] in world coords -> dir (+1/-1) or 0 */
export function beltAt(belts, x, y) { for (let i = 0; i < belts.length; i++) { const b = belts[i]; if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return b.dir; } return 0; }

/**
 * lane walkers. cfg: { n, belts, route(): { pts: [{x,y,wait?,pose?}] (world), kind? } }
 * kinds: bag (carry), walk, run, crew, stroll, kid (follows the previous walker)
 */
export function walkers(sc, cfg) {
  const P = specs(), list = [], belts = cfg.belts || [];
  const setup = (wk, initial) => {
    const R = cfg.route(), c = wk.ch, k = wk.follow ? 'kid' : R.kind || (Math.random() < .5 ? 'bag' : Math.random() < .12 ? 'run' : Math.random() < .2 ? 'crew' : Math.random() < .3 ? 'stroll' : 'walk');
    wk.pts = R.pts; wk.i = 1; wk.kind = k; wk.wait = 0; wk.dead = 0; wk.ride = Math.random() < .55;
    c.setSpec(k === 'kid' ? pick(P.kid) : k === 'crew' ? pick(P.crew) : Math.random() < .12 ? pick(P.elder) : pick(P.adult)); c.kind = k === 'crew' ? 'crew' : 'traveller';
    c.carry = k === 'bag' || (k === 'crew' && Math.random() < .5); c.poseOpts = c.carry ? { item: 'bag', itemColor: pick(BAGCOL) } : null; c.pose = null; wk.run = k === 'run';
    wk.spd = k === 'run' ? TUNE.RUN : k === 'stroll' ? 1.15 : k === 'kid' ? 2.4 : TUNE.WALK[0] + Math.random() * (TUNE.WALK[1] - TUNE.WALK[0]);
    let p0 = wk.pts[0]; if (initial && wk.pts.length > 2) { const j = Math.floor(Math.random() * (wk.pts.length - 1)), a = wk.pts[j], b = wk.pts[j + 1], t = Math.random(); p0 = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; wk.i = j + 1; }
    if (wk.follow) { const L = wk.follow.ch; wk.pts = wk.follow.pts; wk.i = wk.follow.i; p0 = { x: L.x - .4, y: L.y + .3 }; }
    c.x = p0.x + (Math.random() - .5) * .3; c.y = p0.y + (Math.random() - .5) * .3; c.z = 0; c.alpha = 0; c.hidden = false; c.moving = false;
  };
  for (let i = 0; i < cfg.n; i++) { const c = new Char(P.adult[0], 0, 0), wk = { ch: c }; if (i % 7 === 6 && list.length) wk.follow = list[list.length - 1]; list.push(wk); setup(wk, true); sc.ents.push(c); addTalk(sc, c); }
  return { list, update(dt) {
    for (let n = 0; n < list.length; n++) {
      const wk = list[n], c = wk.ch; c.t += dt;
      if (wk.dead > 0) { c.alpha = Math.max(0, (c.alpha === undefined ? 1 : c.alpha) - dt * 3); if ((wk.dead -= dt) <= 0) { if (wk.follow && wk.follow.dead > 0) { wk.dead = .3; continue; } setup(wk, false); } continue; }
      if (c.alpha !== undefined) { c.alpha += dt * 2.5; if (c.alpha >= 1) c.alpha = undefined; }
      if (c._hold > 0) { c._hold -= dt; c.moving = false; continue; }
      if (wk.wait > 0) { wk.wait -= dt; c.moving = false; if (wk.wait <= 0) c.pose = null; continue; }
      let tx, ty; const F = wk.follow;
      if (F) { if (F.dead > 0) { wk.dead = .5; continue; } tx = F.ch.x - .35; ty = F.ch.y + .35; if (Math.hypot(tx - c.x, ty - c.y) < .5) { c.moving = false; c.pose = null; continue; } }
      else { const q = wk.pts[wk.i]; if (!q) { wk.dead = .6 + Math.random() * 3; continue; } tx = q.x; ty = q.y; }
      const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy) || 1e-6, b = beltAt(belts, c.x, c.y), along = b && Math.sign(dx) === b && Math.abs(dx) > Math.abs(dy);
      let v = wk.spd, walking = true; if (along) { if (wk.ride && !wk.run) { v = TUNE.BELT; walking = false; } else v += TUNE.BELT; }
      const st = v * dt;
      if (d <= st) { c.x = tx; c.y = ty; if (!F) { const q = wk.pts[wk.i]; if (q.wait) { wk.wait = q.wait * (.6 + Math.random() * .8); c.pose = q.pose || null; if (q.dir !== undefined) c.dir = q.dir; } wk.i++; } }
      else { c.x += dx / d * st; c.y += dy / d * st; if (walking) c.face(dx, dy); else c.dir = b > 0 ? 0 : 2; }
      c.moving = walking; c.pose = walking && wk.run ? 'run' : null;
    }
  } };
}

/** boarding queue that forms and drains. cfg: { door:{x,y}, head:{x,y}, step:[dx,dy], from:{x,y}, n, flights:[...], onPhase(phase, flight) } (world coords) */
export function gateCycle(sc, cfg) {
  const q = [], gone = [], st = { phase: 'form', t: 0, k: 0, fl: 0 }, N = cfg.n || 8;
  const add = () => { const c = new Char(anySpec(), cfg.from.x + (Math.random() - .5), cfg.from.y + Math.random() * .6); c.alpha = 0; c.carry = Math.random() < .6; c.poseOpts = c.carry ? { item: 'bag', itemColor: pick(BAGCOL) } : null; c.kind = 'traveller'; c.it = addTalk(sc, c); sc.ents.push(c); q.push(c); };
  const drop = c => { let i = sc.ents.indexOf(c); if (i >= 0) sc.ents.splice(i, 1); i = sc.interactables.indexOf(c.it); if (i >= 0) sc.interactables.splice(i, 1); };
  const go = (c, x, y, v, dt) => { const dx = x - c.x, dy = y - c.y, d = Math.hypot(dx, dy); if (d < .06) { c.moving = false; return true; } const s = Math.min(d, v * dt); c.x += dx / d * s; c.y += dy / d * s; c.face(dx, dy); c.moving = true; return false; };
  const phase = p => { st.phase = p; st.t = 0; st.k = 0; if (cfg.onPhase) try { cfg.onPhase(p, cfg.flights[st.fl % cfg.flights.length]); } catch (e) { console.warn(e); } };
  for (let i = 0; i < 4; i++) { add(); const c = q[i]; c.x = cfg.head.x + cfg.step[0] * i; c.y = cfg.head.y + cfg.step[1] * i; c.alpha = undefined; }
  return { st, queue: q, flight: () => cfg.flights[st.fl % cfg.flights.length], start() { phase('form'); }, update(dt) {
    st.t += dt; st.k += dt;
    if (st.phase === 'form') { if (q.length < N && st.k > 2.4) { st.k = 0; add(); } if (q.length >= N && st.t > 10) phase('hold'); }
    else if (st.phase === 'hold') { if (st.t > 6) phase('board'); }
    else if (st.phase === 'board') { if (q.length && st.k > 1.5) { st.k = 0; const c = q.shift(); c.out = 1; gone.push(c); } if (!q.length && !gone.length) phase('gap'); }
    else if (st.t > 12) { st.fl++; phase('form'); }
    for (let i = 0; i < q.length; i++) { const c = q[i]; c.t += dt; if (c.alpha !== undefined) { c.alpha += dt * 2; if (c.alpha >= 1) c.alpha = undefined; } if (c._hold > 0) { c._hold -= dt; c.moving = false; continue; } if (go(c, cfg.head.x + cfg.step[0] * i, cfg.head.y + cfg.step[1] * i, 1.7, dt)) c.dir = cfg.qdir === undefined ? 3 : cfg.qdir; }
    for (let i = gone.length - 1; i >= 0; i--) { const c = gone[i]; c.t += dt; if (go(c, cfg.door.x, cfg.door.y, 1.9, dt) || c.out > 1) { c.out = 2; c.alpha = (c.alpha === undefined ? 1 : c.alpha) - dt * 3; if (c.alpha <= 0) { drop(c); gone.splice(i, 1); } } }
  } };
}

/** bags riding a carousel (flat carousel object origin x,y in world coords) */
export function carouselBags(sc, x, y, n, seed = 1) {
  const A = asset('furn.airport.bag'), r = rng(seed * 31 + 5), PER = 8 + Math.PI * 2, bags = [], st = { run: true };
  const pos = u => { u = ((u % PER) + PER) % PER; if (u < 4) return [1.5 + u, 2.5]; u -= 4; if (u < Math.PI) return [5.5 + Math.sin(u), 1.5 + Math.cos(u)]; u -= Math.PI; if (u < 4) return [5.5 - u, .5]; u -= 4; return [1.5 - Math.sin(u), 1.5 - Math.cos(u)]; };
  const place = b => { const q = pos(b.u); b.x = x + q[0] - .32; b.y = y + q[1] - .22; };
  const mk = (p, u) => { const b = { u, p, x: 0, y: 0, z: .44, bb: [0, 0, .64, .44, .3], sprite() { return assetSprite(A, this.p); } }; place(b); bags.push(b); sc.ents.push(b); return b; };
  const KINDS = ['case', 'case', 'duffel', 'box', 'pack', 'case'];
  for (let i = 0; i < n; i++) mk({ c: Math.floor(r() * 10), kind: KINDS[Math.floor(r() * KINDS.length)] }, i * PER / n + r() * .5);
  return { bags, st, pos, add(p) { const b = mk(p, 1.0); b.alpha = 0; return b; }, remove(b) { let i = bags.indexOf(b); if (i >= 0) bags.splice(i, 1); i = sc.ents.indexOf(b); if (i >= 0) sc.ents.splice(i, 1); },
    update(dt) { if (!st.run) return; for (let i = 0; i < bags.length; i++) { const b = bags[i]; b.u += TUNE.CAROUSEL * dt; place(b); if (b.alpha !== undefined) { b.alpha += dt * 2; if (b.alpha >= 1) b.alpha = undefined; } } } };
}

/** cabin: seated passengers + the deboarding choreography. o: { aisleY, doorX, doorY, seat: {x,y} (player's seat, world) } */
export function cabinLife(sc, o) {
  const pax = [], st = { on: false, t: 0, left: 0 }, r0 = rng(99);
  const seats = []; for (const fx of sc.fixtures) if (fx.tags.includes('plane_seat')) for (const s of fx.seats) seats.push({ x: s.x, y: s.y, z: s.z, row: fx.ob.x });
  const mine = seats.reduce((a, b) => Math.hypot(b.x - o.seat.x, b.y - o.seat.y) < Math.hypot(a.x - o.seat.x, a.y - o.seat.y) ? b : a); mine.mine = true;
  const maxRow = Math.max(...seats.map(s => s.row));
  function reset() {
    for (const p of pax) { const i = sc.ents.indexOf(p.ch); if (i >= 0) sc.ents.splice(i, 1); } pax.length = 0; st.on = false; st.t = 0; st.free = false; st.freeT = 0; const r = rng(1234); let kid = false, strug = false;
    for (const s of seats) {
      if (s.mine || r() > .6 || (s.row === mine.row && (s.y > o.aisleY) === (mine.y > o.aisleY))) continue; const near = Math.abs(s.y - o.aisleY), isKid = !kid && s.row < mine.row - 1 && s.row > mine.row - 5 && near < 1 && s.y < o.aisleY, c = new Char(isKid ? specs().kid[1] : anySpec(r), s.x, s.y);
      if (isKid) kid = true; c.z = s.z; c.dir = 0; c.poseOpts = { seated: true }; c.pose = r() < .3 ? 'phone' : 'sit'; c.kind = 'traveller';
      const p = { ch: c, s, st: 0, at: (maxRow - s.row) * TUNE.ROW_GAP + near * .85 + r() * .6, w: 0, kid: isKid, bag: r() < .7 ? BAGCOL[Math.floor(r() * BAGCOL.length)] : null, v: TUNE.AISLE * (.9 + r() * .25) };
      if (!strug && !isKid && s.row > mine.row + 1 && s.row < mine.row + 4 && near < 1) { p.strug = strug = true; p.bag = '#e08a2c'; }
      pax.push(p); sc.ents.push(c);
    }
    st.left = pax.length;
  }
  const blocked = (p, x0, x1) => { for (let i = 0; i < pax.length; i++) { const q = pax[i]; if (q !== p && (q.st === 3 || q.st === 4) && q.ch.x > x0 && q.ch.x < x1 && Math.abs(q.ch.y - o.aisleY) < .45) return true; }
    const pl = G.player; if (st.free && pl && !pl.hidden && pl.pose !== 'sit' && pl.x > x0 && pl.x < x1 && Math.abs(pl.y - o.aisleY) < .45) return true; return false; };
  // deboarding is front-to-back: the player's turn comes when every row ahead has filed past; rows behind wait for release()
  const behind = p => p.s.row < mine.row, backOff = () => st.freeT + 1.6 - (maxRow - mine.row) * TUNE.ROW_GAP;
  function myTurn() { if (!st.on) return false; for (let i = 0; i < pax.length; i++) { const q = pax[i]; if (behind(q) || q.st >= 5) continue; if (q.st < 3 || q.ch.x < mine.row + 1.5) return false; } return true; }
  function release() { if (!st.free) { st.free = true; st.freeT = st.t; } }
  function update(dt) {
    for (let i = 0; i < pax.length; i++) pax[i].ch.t += dt;
    if (!st.on) return; st.t += dt; let left = 0;
    for (let i = 0; i < pax.length; i++) {
      const p = pax[i], c = p.ch; if (p.st === 6) continue; left++;
      if (p.st === 0) { if (behind(p) ? st.free && st.t >= p.at + backOff() : st.t >= p.at) { p.st = 1; p.w = p.bag ? .9 : .4; c.poseOpts = null; c.z = 0; c.x = p.s.row + .72; c.pose = p.bag ? 'lift' : null; c.dir = p.s.y < o.aisleY ? 3 : 1; } }
      else if (p.st === 1) { if ((p.w -= dt) <= 0) { p.st = 2; c.pose = null; if (p.bag) { c.carry = true; c.poseOpts = { item: 'bag', itemColor: p.bag }; } } }
      else if (p.st === 2) { const dy = o.aisleY - c.y, ad = Math.abs(dy); if (ad < .55 && blocked(p, c.x - .75, c.x + .6)) { c.moving = false; continue; } const s = Math.min(ad, 1.9 * dt); c.y += Math.sign(dy) * s; c.face(0, dy); c.moving = true; if (ad < .05) { p.st = 3; if (p.strug) { p.st = 4; p.w = 3.4; c.pose = 'lift'; c.poseOpts = null; c.dir = 3; c.moving = false; bubble(c, 'Hnngh... it fit on the way IN...'); } } }
      else if (p.st === 4) { if ((p.w -= dt) <= 0) { p.st = 3; c.pose = null; c.poseOpts = { item: 'bag', itemColor: p.bag }; bubble(c, 'Got it! Sorry, sorry!'); } }
      else if (p.st === 3) {
        if (p.kid && !p.waved && c.x > mine.x - .5 && !G.player.hidden) { p.waved = 1; p.w = 1.6; c.pose = 'wave'; c.dir = 1; c.moving = false; bubble(c, 'Bye, seat neighbor!'); }
        if (p.w > 0) { p.w -= dt; if (p.w <= 0) c.pose = null; continue; }
        if (blocked(p, c.x + .01, c.x + .62)) { c.moving = false; continue; }
        c.x += p.v * dt; c.dir = 0; c.moving = true; if (c.x >= o.doorX) { c.x = o.doorX; p.st = 5; }
      } else if (p.st === 5) { c.y -= 2.2 * dt; c.dir = 3; c.moving = true; if (c.y < o.doorY + .5) { c.alpha = (c.alpha === undefined ? 1 : c.alpha) - dt * 4; if (c.alpha <= 0) { p.st = 6; c.hidden = true; } } }
    }
    st.left = left;
  }
  function fast() { for (const p of pax) { p.st = 6; p.ch.hidden = true; } st.left = 0; st.on = true; release(); }
  reset();
  return { pax, st, mine, reset, update, fast, myTurn, release, start() { st.on = true; st.t = 0; }, remaining: () => st.left };
}
