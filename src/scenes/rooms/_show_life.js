// Ambient life for the showpiece rooms (private helper of mall.js / skydeck.js): a static crowd from spot lists and lane walkers carrying shopping bags.
import { G } from '../../core/game.js';
import { Char } from '../../core/char.js';
import { rng } from '../../engine/raster.js';
import { bubble } from '../../ui/kit.js';
import { specs, anySpec } from './_airport_life.js';

const pick = a => a[Math.floor(Math.random() * a.length)];
export const BAGCOL = ['#d9483b', '#3b6fd0', '#e8b83a', '#4fa860', '#8a5aa8', '#f08ab0', '#2f9a94', '#f4f0e8'];
const SEAT = ['sit', 'sit', 'phone', 'talk', 'drink', 'eat', 'sit', 'read'], STAND = [null, null, 'phone', null, 'talk'];
export function talk(c, lines) { c._hold = 3; if (!c.poseOpts || !c.poseOpts.seated) c.faceTo(G.player.x, G.player.y); bubble(c, pick(lines)); try { G.needs && G.needs.add && G.needs.add('social', 1); } catch (e) { } }
function addTalk(sc, c, label, lines) { sc.interactables.push({ ent: c, x: c.x, y: c.y, label, h: 1.2, hit: 6, range: 1.7, visible: () => !c.hidden && (c.alpha === undefined || c.alpha > .6), use: () => talk(c, typeof lines === 'function' ? lines(c) : lines) }); }

/** static crowd. spots: [{x, y (room coords), z, dir, anim, kind: 'staff'|'customer', age, outfit, seated, p (presence 0..1), busy (only when busy), label, lines: [..]}]. o: { seed, fill, lines(c) }
 *  returns { list, update(dt), show(open, busy), count() } */
export function crowd(sc, spots, o = {}) {
  const r = rng(o.seed || 7), P = specs(), list = [];
  for (const s of spots) {
    const staff = s.kind === 'staff', w = sc.toWorld(s.x, s.y), spec = s.outfit === 'cook' ? P.cook[Math.floor(r() * P.cook.length)] : staff ? P.staff[Math.floor(r() * P.staff.length)] : s.age === 'kid' ? P.kid[Math.floor(r() * P.kid.length)] : s.age === 'elder' ? P.elder[Math.floor(r() * P.elder.length)] : anySpec(r);
    const c = new Char(spec, w.x, w.y), seated = s.seated !== undefined ? s.seated : s.anim === 'sit'; c.z = s.z || 0; c.dir = s.dir !== undefined ? s.dir : 1; c.kind = staff ? 'staff' : 'customer'; c.spot = s; c.roll = r();
    c.poseOpts = seated ? { seated: true } : !staff && r() < .3 ? { item: 'bag', itemColor: BAGCOL[Math.floor(r() * BAGCOL.length)] } : null; if (c.poseOpts && c.poseOpts.item) c.carry = true;
    c.anims = seated ? SEAT : s.anim && s.anim !== 'stand' && s.anim !== 'sit' ? [s.anim, s.anim, null] : staff ? [null, 'work', null, 'talk'] : STAND; c.pose = seated ? 'sit' : s.anim && s.anim !== 'stand' ? s.anim : null; c.think = r() * 9;
    sc.ents.push(c); list.push(c); addTalk(sc, c, s.label || (staff ? 'Staff' : s.age === 'kid' ? 'Kid' : 'Visitor'), s.lines || o.lines);
  }
  return { list, count: () => list.filter(c => !c.hidden).length,
    show(open, busy) { const fill = o.fill === undefined ? .7 : o.fill; for (const c of list) { const s = c.spot; c.hidden = !open || (s.busy && !busy) || (s.kind !== 'staff' && !s.busy && c.roll > (s.p !== undefined ? s.p : fill)); } },
    update(dt) { for (let i = 0; i < list.length; i++) { const c = list[i]; if (c.hidden) continue; c.t += dt; if (c._hold > 0) { c._hold -= dt; continue; } if ((c.think -= dt) <= 0) { c.think = 4 + Math.random() * 10; const a = pick(c.anims); c.pose = c.poseOpts && c.poseOpts.seated ? (a || 'sit') : a; if (!(c.poseOpts && c.poseOpts.seated)) c.dir = c.spot.dir !== undefined ? c.spot.dir : c.dir; } } } };
}

/** lane walkers. cfg: { n, route() -> { pts: [{x, y, wait?, pose?, dir?}] (world coords), kind?: 'bag'|'stroll'|'walk'|'kid' }, lines, label }. returns { list, update(dt), setActive(n), count() } */
export function walkers(sc, cfg) {
  const P = specs(), list = []; let active = cfg.n;
  const setup = (wk, initial) => {
    const R = cfg.route(), c = wk.ch, k = wk.follow ? 'kid' : R.kind || (Math.random() < .6 ? 'bag' : Math.random() < .4 ? 'stroll' : 'walk');
    wk.pts = R.pts; wk.i = 1; wk.kind = k; wk.wait = 0; wk.dead = 0;
    c.setSpec(k === 'kid' ? pick(P.kid) : Math.random() < .14 ? pick(P.elder) : pick(P.adult)); c.kind = 'customer';
    c.carry = k === 'bag'; c.poseOpts = c.carry ? { item: 'bag', itemColor: pick(BAGCOL) } : null; c.pose = null; wk.spd = k === 'stroll' ? 1.1 : k === 'kid' ? 2.3 : 1.35 + Math.random() * .7;
    let p0 = wk.pts[0]; if (initial && wk.pts.length > 2) { const j = Math.floor(Math.random() * (wk.pts.length - 1)), a = wk.pts[j], b = wk.pts[j + 1], t = Math.random(); p0 = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; wk.i = j + 1; }
    if (wk.follow) { const L = wk.follow.ch; wk.pts = wk.follow.pts; wk.i = wk.follow.i; p0 = { x: L.x - .4, y: L.y + .3 }; }
    c.x = p0.x + (Math.random() - .5) * .3; c.y = p0.y + (Math.random() - .5) * .3; c.z = 0; c.alpha = 0; c.hidden = false; c.moving = false;
  };
  for (let i = 0; i < cfg.n; i++) { const c = new Char(P.adult[0], 0, 0), wk = { ch: c, n: i }; if (i % 6 === 5 && list.length) wk.follow = list[list.length - 1]; list.push(wk); setup(wk, true); sc.ents.push(c); addTalk(sc, c, cfg.label || 'Shopper', cfg.lines); }
  return { list, count: () => list.filter(w => !w.ch.hidden).length, setActive(n) { active = n; },
    update(dt) {
      for (let n = 0; n < list.length; n++) {
        const wk = list[n], c = wk.ch; if (c.hidden) { if (wk.n < active && (wk.dead -= dt) <= 0) setup(wk, false); continue; } c.t += dt;
        if (wk.dead > 0) { c.alpha = Math.max(0, (c.alpha === undefined ? 1 : c.alpha) - dt * 3); if ((wk.dead -= dt) <= 0) { if (wk.n >= active) { c.hidden = true; wk.dead = 1 + Math.random() * 4; continue; } if (wk.follow && wk.follow.dead > 0) { wk.dead = .3; continue; } setup(wk, false); } continue; }
        if (c.alpha !== undefined) { c.alpha += dt * 2.5; if (c.alpha >= 1) c.alpha = undefined; }
        if (c._hold > 0) { c._hold -= dt; c.moving = false; continue; }
        if (wk.wait > 0) { wk.wait -= dt; c.moving = false; if (wk.wait <= 0) c.pose = null; continue; }
        let tx, ty; const F = wk.follow;
        if (F) { if (F.dead > 0 || F.ch.hidden) { wk.dead = .5; continue; } tx = F.ch.x - .35; ty = F.ch.y + .35; if (Math.hypot(tx - c.x, ty - c.y) < .5) { c.moving = false; continue; } }
        else { const q = wk.pts[wk.i]; if (!q) { wk.dead = .6 + Math.random() * 3; continue; } tx = q.x; ty = q.y; }
        const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy) || 1e-6, st = wk.spd * dt;
        if (d <= st) { c.x = tx; c.y = ty; if (!F) { const q = wk.pts[wk.i]; if (q.wait) { wk.wait = q.wait * (.6 + Math.random() * .8); c.pose = q.pose || null; if (q.dir !== undefined) c.dir = q.dir; } wk.i++; } }
        else { c.x += dx / d * st; c.y += dy / d * st; c.face(dx, dy); }
        c.moving = true;
      }
    } };
}
