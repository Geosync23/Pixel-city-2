// The intro suitcase (owner msg 165, docs/BIBLE.md Direction update 34, docs/reports/luggage.md).
// From the moment you take your bag off carousel 2 you TOW it: a small rolling case follows you as its own entity (art fx.luggage.tow, src/art/home/luggage.js),
// tilted on its wheels with the pulled-out handle in your hand, on the side away from where you walk; it stands upright beside you when you stop (and beside your
// seat). It goes along through the terminal, the air tram, out to the kerb; while you ride (cab / bus / train: you are hidden) it is "in the back" and not drawn;
// it is towed again when you step out, through the lobby, the lift and the corridor. When you first walk into your flat it leaves your hand and stands by the
// front door as one more intro moving box (G.housing.addLuggage(): furn.home.suitcase, the same unpack activity and mini-game as the boxes, gives clothes).
//
// G.luggage = { pickUp() (intro_airport.js grab), state() -> 'none' | 'tow' | 'home', ent (the follower entity), drop() (debug: park it now when at home) }
// State: G.state.intro.lug = 1 towing | 2 parked at home (the box lives in G.state.home.boxes until unpacked). Missing = not picked up yet / not part of this game.
//   Old saves made mid-intro after the pick-up (intro.ap.bag, intro running, no lug) tow from the next frame. Saves past the intro never get a suitcase.
//   Skip intro: at 'intro:done' a suitcase that never reached home is parked by the door all the same.
// Events: 'luggage:pickup', 'luggage:home'(box).
import { G } from '../core/game.js';
import { asset } from '../art/registry.js';
import { assetSprite } from '../engine/sprites.js';
import { LUG } from '../art/home/luggage.js';
import { toast } from '../ui/kit.js';

export const order = 116;
const safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
/* geometry (world units): the hand hangs HH above the floor, HX to the side (3 px of the 16 px tile, on screen); the case leans so its grip meets the hand */
const HH = .5, HX = 3 / 32, L = LUG.H + LUG.HD, STAND = .34, SIDE_A = 45 * Math.PI / 180;
const gripZ = th => LUG.WHL + .2 * LUG.D * Math.sin(th) + L * Math.cos(th);   /* (art: lift + the grip row at .3 D along the case's depth axis) */
const TH0 = (() => { let a = 0, b = 1.4; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (gripZ(m) > HH) a = m; else b = m; } return (a + b) / 2; })();
const REACH = .3 * LUG.D * Math.cos(TH0) + L * Math.sin(TH0);
const BACK = [[-1, 0], [0, -1], [1, 0], [0, 1]];   /* by facing (Char.dir: 0 +x, 1 +y, 2 -x, 3 -y): the way behind you */
const HSX = [-1, 1, 1, -1];                          /* which side of you (screen left / right) the trailing hand is on: the side the case trails to */
const st = () => { const s = G.state && G.state.intro; return s && typeof s === 'object' ? s : null; };
function towing() {
  const s = st(); if (!s) return false; if (s.lug === 1) return true;
  if (s.lug === undefined && s.ap && s.ap.bag && s.at && !s.done && !(G.state.flags || {}).introDone) { s.lug = 1; return true; }   /* an old save made mid-intro, after the pick-up */
  return false;
}
const ent = { x: 0, y: 0, z: 0, bb: [-.12, -.12, .12, .12, .5], hidden: false, isLuggage: true, th: 0, ph: 0, sc: null,
  sprite() { return assetSprite(A(), { th: this.th, ph: this.ph }); } };
let A_ = null; const A = () => A_ || (A_ = asset('fx.luggage.tow'));
let ready = null, ox = 0, oy = 0, s = 0, snap = true, lx = 0, ly = 0, still = 9, side = -1, drop = null;
function attach(sc) { if (ent.sc === sc && sc.ents.includes(ent)) return; detach(); sc.ents.push(ent); ent.sc = sc; snap = true; }
function detach() { if (ent.sc) { const i = ent.sc.ents.indexOf(ent); if (i >= 0) ent.sc.ents.splice(i, 1); } for (const sc of (G.sceneCache ? G.sceneCache.values() : [])) { const i = sc.ents ? sc.ents.indexOf(ent) : -1; if (i >= 0) sc.ents.splice(i, 1); } ent.sc = null; }
const blocked = (w, x, y) => safe(() => w.isBlocked(x, y), false);

/* where the case should be, as an offset from the player: towing (k = 1) or standing beside you (k = 0) */
function want(P, w) {
  const d = P.dir & 3, B = BACK[d], hs = HSX[d], hx = hs * HX, hy = -hs * HX;
  /* it trails behind you and out to the side of the towing hand (SIDE_A), so on screen it rolls along beside you rather than hiding straight behind you */
  const tx = B[0] * Math.cos(SIDE_A) + hs * .7071 * Math.sin(SIDE_A), ty = B[1] * Math.cos(SIDE_A) - hs * .7071 * Math.sin(SIDE_A), tn = Math.hypot(tx, ty) || 1;
  const tow = [hx + tx / tn * REACH, hy + ty / tn * REACH];
  let sx = hs * STAND * .7071 + B[0] * .1, sy = -hs * STAND * .7071 + B[1] * .1;
  if (blocked(w, P.x + sx, P.y + sy) && !blocked(w, P.x - hs * STAND * .7071 + B[0] * .1, P.y + hs * STAND * .7071 + B[1] * .1)) { sx = -hs * STAND * .7071 + B[0] * .1; sy = hs * STAND * .7071 + B[1] * .1; }
  return { tow, stand: [sx, sy], hand: [hx, hy], B };
}
function update(dt) {
  const P = G.player, sc = G.scene, w = G.world;
  if (!P || !sc || !w || !towing()) { if (ent.sc) detach(); drop = null; return; }
  attach(sc);
  const riding = !!(G.cutscene && G.cutscene.ride) || !!P.hidden;
  if (riding) { ent.hidden = true; snap = true; return; }
  ent.hidden = false;
  const moved = Math.hypot(P.x - lx, P.y - ly); lx = P.x; ly = P.y;
  if (moved > 2) snap = true;
  still = moved > 1e-3 && moved < 2 && !P.pose ? 0 : still + dt;
  const k = Math.min(1, dt * 5), seated = !!(P.pose === 'sit' || (P.poseOpts && P.poseOpts.seated) || P.zoff > .05);
  const goal = still < .18 && !seated ? 1 : 0; s += Math.sign(goal - s) * Math.min(Math.abs(goal - s), k);
  const g = want(P, w);
  /* home: the first time you walk into your flat the case leaves your hand and stands by the door */
  if (drop || (ready === sc && safe(() => G.housing.isHome(), false) && safe(() => G.housing.room(), 'main') === 'main')) { if (homeDrop(dt, P, w, g)) return; }   /* (counted from the 'scene' event: not during the fade in) */
  const tx = g.stand[0] + (g.tow[0] - g.stand[0]) * s, ty = g.stand[1] + (g.tow[1] - g.stand[1]) * s;
  if (snap) { ox = tx; oy = ty; snap = false; } else { const q = 1 - Math.exp(-dt * 14); ox += (tx - ox) * q; oy += (ty - oy) * q; }
  place(P, w, g);
}
/* the entity at the player + offset; the handle leans to the hand (tilt grows with s), with a small wheel wobble while rolling */
function place(P, w, g) {
  ent.x = P.x + ox; ent.y = P.y + oy; ent.z = safe(() => w.heightAt(ent.x, ent.y), 0);
  const vx = g.hand[0] - ox, vy = g.hand[1] - oy, dh = Math.hypot(vx, vy);
  const ph = s > .5 && dh > .15 ? Math.atan2(vy, vx) : Math.atan2(-g.B[1], -g.B[0]);
  const th = s * TH0 * Math.min(1.15, dh / REACH) + (s > .5 && Math.floor(G.time * 9) % 2 ? .06 : 0);   /* (wobble: a few degrees every other ~0.1 s while rolling) */
  ent.ph = (Math.round(ph * 180 / Math.PI / 15) * 15 + 360) % 360; ent.th = Math.max(0, Math.round(th * 180 / Math.PI / 3) * 3);
}
/* returns true while it is handling the frame */
function homeDrop(dt, P, w, g) {
  if (!drop) drop = { t: 0 };
  drop.t += dt;
  if (!drop.box) {
    if (drop.t < 1.3 || G.modal > 0 || G.busy || !G.housing || !G.housing.addLuggage) return false;
    const b = G.housing.addLuggage(); if (!b) { finish(null); return true; }
    const def = safe(() => G.housing.roomDef(G.housing.current().id, 'main'), null), it = def && def.items.find(q => q.box === b.uid), wp = it && G.scene.toWorld ? G.scene.toWorld(it.x + .25, it.y + .25) : null;
    drop.box = b; drop.k = 0; drop.from = [ent.x, ent.y]; drop.to = wp ? [wp.x, wp.y] : null; safe(() => G.audio.sfx('clack'));
    if (!drop.to) { finish(b); return true; }
  }
  drop.k = Math.min(1, drop.k + dt / .45); const e = 1 - Math.pow(1 - drop.k, 2);
  ent.x = drop.from[0] + (drop.to[0] - drop.from[0]) * e; ent.y = drop.from[1] + (drop.to[1] - drop.from[1]) * e; ent.z = safe(() => w.heightAt(ent.x, ent.y), 0);
  ent.th = Math.max(0, Math.round(ent.th * (1 - e) / 3) * 3); ent.ph = 90;
  if (drop.k >= 1) finish(drop.box);
  return true;
}
function finish(b) {
  const S = st(); if (S) S.lug = 2; drop = null; detach();
  if (b) { const re = () => { if (!safe(() => G.housing.isHome(), false)) return; if (G.busy || G.modal > 0) return setTimeout(re, 500); safe(() => G.housing.refresh()); }; re(); toast('You park your suitcase by the door. Unpack it whenever you like.', 'info', 3600); }
  G.emit('luggage:home', b);
}
function pickUp() { const S = st(); if (!S || S.lug === 2) return false; S.lug = 1; snap = true; still = 9; s = 0; G.emit('luggage:pickup'); return true; }
/* the interactable of the parked suitcase says what it is (the boxes' activity, its mini-game and its count stay as they are) */
function label(sc) {
  if (!sc || !sc.interactables || !sc.fixtures) return; const b = safe(() => G.housing.boxes().find(x => x.lug), null); if (!b) return;
  for (const it of sc.interactables) { const fx = it.fx; if (!fx || !fx.item || fx.item.box !== b.uid || it._lug) continue; it._lug = 1; it.label = 'Unpack your suitcase';
    const u = it.use; it.use = (...a) => (G.activities && G.activities.menu && fx.tags ? G.activities.menu({ fx, tags: G.activities.tagsFor(fx, sc), label: 'Unpacking your suitcase' }) : u(...a)); }
}

export function init() {
  G.luggage = { pickUp, state: () => (towing() ? 'tow' : (st() || {}).lug === 2 ? 'home' : 'none'), ent, drop: () => { const S = st(); if (S && S.lug === 1) drop = { t: 9 }; }, TH0, REACH };
  G.on('frame', dt => safe(() => update(dt)));
  G.on('scene', sc => { snap = true; drop = null; ready = sc; safe(() => label(sc)); });
  G.on('load', () => { detach(); drop = null; snap = true; });
  /* Skip intro (or a resume straight into the flat): a suitcase that never reached home comes along all the same */
  G.on('intro:done', () => { const S = st(); if (!S || S.lug === 2 || safe(() => G.housing.boxes().some(b => b.lug), false)) return; S.lug = 1; snap = true; });
}
