// Chapter cast (helper of sim/chapters.js): who is speaking, what they look like, and the companions that stand and walk with the player.
//
//   who(id) -> { id, name, short, spec, kid }        cast.js people (through G.social), the speakers of SPEAKERS_EXTRA (Dad, Silas, Hester Quill,
//                                                    Mrs. Pym, the auctioneer), 'player', 'narrator', 'nell'.
//   comp.set(ids, o?)   the companions who should be with the player NOW: missing ones appear near the player (or at o.at = { x, y }),
//                       others leave. They are our own Char entities: the social system's copy of the same person is tucked away meanwhile
//                       (G.social.place(id, null)) and handed back by comp.clear().
//   comp.char(id) -> Char | null     the companion, or an existing figure of the room with that role (the keeper, the archivist, the registrar,
//                                    the auctioneer are room entities of the showpieces: we speak through them instead of doubling them).
//   comp.clear()        everybody goes home.          comp.ids() -> [ids]          comp.follow(on)     walk with the player (default on)
//   comp.rescene()      called on every scene change: companions re-appear around the player in the new scene.
//   comp.update(dt)     the follow loop (called from the chapters system every unpaused frame).
//   comp.pose(id, anim | null)
// Dad (Frank) is a new person: spec + name live here (DAD). He is registered as a phone contact by sim/chapters.js when the story gives him.
import { G } from '../core/game.js';
import { Char } from '../core/char.js';
import { CAST, CAST_BY_ID } from '../story/cast.js';
import { SPEAKERS_EXTRA } from '../story/chapters.js';
import { buildSpecs } from './_social_data.js';
import { freeNear } from './_chapters_places.js';

const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
/* looks for the speakers that are not in cast.js (used when the room has no figure of its own to speak through) */
const LOOKS = {
  dad: { age: 62, look: 'grey moustache', spec: { skin: 'tan', hair: 'balding', hairColor: '#9a958c', top: 'work-jacket', topColor: '#6b705c', bottom: 'slacks', bottomColor: '#4a4238', hat: 'flat-cap', hatColor: '#5b5348', glasses: 'none', bag: 'none', age: 'elder', outfit: 'casual' } },
  silas: { age: 71, look: 'white beard', spec: { skin: 'light', hair: 'short', hairColor: '#e8e8e8', top: 'peacoat', topColor: '#2b3a55', bottom: 'slacks', bottomColor: '#3a3f4a', hat: 'beanie', hatColor: '#8a3a2e', glasses: 'none', bag: 'none', age: 'elder', outfit: 'casual' } },
  hester: { age: 66, look: '', spec: { skin: 'light', hair: 'bun', hairColor: '#b8b8b8', top: 'cardigan', topColor: '#6d597a', bottom: 'skirt', bottomColor: '#3d405b', hat: 'none', glasses: 'chain', bag: 'none', age: 'elder', outfit: 'librarian' } },
  pym: { age: 68, look: '', spec: { skin: 'brown', hair: 'bob', hairColor: '#d0d0d0', top: 'blazer', topColor: '#7a2e3a', bottom: 'skirt', bottomColor: '#2b2d42', hat: 'none', glasses: 'half-moon', bag: 'none', age: 'elder', outfit: 'office' } },
  crier: { age: 55, look: '', spec: { skin: 'tan', hair: 'short', hairColor: '#5a4a3a', top: 'waistcoat', topColor: '#3a5a78', bottom: 'slacks', bottomColor: '#2b2d42', hat: 'flat-cap', glasses: 'none', bag: 'none', age: 'adult', outfit: 'casual' } },
};
/* DAD (Frank): a new person, added to the cast at load so the social system, the phone contacts and the Talk panel know him. He has no routine in town
   (he lives in Pinehollow: "At home" to the social system) and is not met until the story gives his number (Chapter 7). In Chapter 15 he is a companion. */
export const DAD = {
  id: 'dad', name: 'Frank', short: 'Dad', age: 62, pronouns: 'he/him', group: 'family', role: 'Your dad, in Pinehollow', district: 'maplewood', home: 'pinehollow', work: null,
  personality: ['quiet', 'dry', 'steady'], likes: { gifts: ['postcard', 'jam_jar', 'wool_socks', 'fresh_fish'], topics: ['weather', 'history', 'food'] }, dislikes: { gifts: ['gadget'], topics: ['tech', 'money'] },
  birthday: { season: 'autumn', day: 9 }, flirtable: false, routine: [],
  look: 'Grey moustache, flat cap, a work jacket older than you, hands like tools.', spec: LOOKS.dad.spec,
  background: 'Retired quarry fitter from Pinehollow. Kept the ferry Marigold running for two summers, a long time ago.', bio: 'Four words at a time. Would rather be shown.',
  greetings: { low: ['There you are.', 'Hello, you.'], mid: ['{name}. Good.', 'What am I looking at, then.'], high: ['Keep on. I am listening.', "You're not bad at that."] },
};
if (!CAST_BY_ID.dad) { CAST.push(DAD); CAST_BY_ID.dad = DAD; }
const FIGURE = { silas: /keeper|silas/i, hester: /quill|archivist/i, pym: /pym|registrar/i, crier: /auctioneer/i };
const specs = {};
function extraSpec(id) {
  if (specs[id]) return specs[id]; const L = LOOKS[id]; if (!L) return null;
  return specs[id] = safe(() => buildSpecs({ id: 'ch_' + id, age: L.age, look: L.look, spec: L.spec }).base, null);
}
const pname = () => (G.state.player && G.state.player.name) || 'You';
export function who(id) {
  if (id === 'narrator') return { id, name: '', short: '', spec: null };
  if (id === 'player') return { id, name: pname(), short: pname(), spec: G.player && G.player.spec };
  if (id === 'nell') return { id, name: 'Mom', short: 'Mom', spec: null };
  const c = CAST_BY_ID[id];
  if (c) { const n = safe(() => G.social.npc(id), null); return { id, name: c.name, short: c.short || c.name, spec: (n && n.spec) || safe(() => buildSpecs(c).base, null), kid: c.age < 14 }; }
  const x = SPEAKERS_EXTRA[id];
  if (x) { const f = figure(id); return { id, name: x.name, short: x.short || x.name, spec: (f && f.spec) || extraSpec(id) }; }
  return { id, name: id, short: id, spec: null };
}
function figure(id) {
  const re = FIGURE[id]; if (!re || !G.scene) return null;
  return G.scene.ents.find(e => e && e.spec && !e.isPlayer && !e.chComp && !e.hidden && (re.test(String(e.label || '')) || re.test(String(e.name || '')) || e.who === id || e.id === id)) || null;
}

/* ---------- companions ---------- */
let list = [], following = true, acc = 0, hid = {};
function spotFor(i, at) {
  const p = at || G.player, w = G.world, ang = [2.2, 3.6, .8, 4.6, 5.6, 1.5, 3, 0], r = 1.3 + Math.floor(i / 8) * .9, a = ang[i % 8];
  return freeNear(w, Math.round((p.x + Math.cos(a) * r) * 2) / 2, Math.round((p.y + Math.sin(a) * r) * 2) / 2, 3);
}
function add(id, i, at) {
  const info = who(id); if (!info.spec) return null;
  const s = spotFor(i, at), ch = new Char(info.spec, s.x, s.y); ch.chComp = id; ch.label = info.short; ch.speed = info.kid ? 3.9 : 3.5; ch.ghost = true;
  ch.z = safe(() => G.world.heightAt(ch.x, ch.y), 0); ch.faceTo(G.player.x, G.player.y);
  if (G.scene && !G.scene.ents.includes(ch)) G.scene.ents.push(ch);
  return { id, ch, i };
}
function drop(c) { for (const sc of (G.sceneCache ? G.sceneCache.values() : [])) { const k = sc.ents ? sc.ents.indexOf(c.ch) : -1; if (k >= 0) sc.ents.splice(k, 1); } }
function tuck(id) { if (!CAST_BY_ID[id] || !G.social) return; hid[id] = 1; safe(() => G.social.place(id, null, { minutes: 240 })); }
function untuck(id) { if (!hid[id]) return; delete hid[id]; safe(() => G.social.place(id)); }
export const comp = {
  set(ids, o = {}) {
    ids = (ids || []).filter((id, k, a) => a.indexOf(id) === k && id !== 'narrator' && id !== 'player' && id !== 'nell');
    for (const c of list.slice()) if (!ids.includes(c.id)) { drop(c); list.splice(list.indexOf(c), 1); if (!o.keepHidden) untuck(c.id); }
    ids.forEach((id, i) => {
      if (list.find(c => c.id === id)) return;
      if (figure(id)) return;                       /* the room already has this person standing in it */
      tuck(id); const c = add(id, list.length, o.at); if (c) list.push(c);
    });
  },
  ids: () => list.map(c => c.id),
  char(id) { const c = list.find(x => x.id === id); return c ? c.ch : figure(id); },
  has: id => !!list.find(x => x.id === id),
  clear() { for (const c of list) drop(c); list = []; for (const id of Object.keys(hid)) untuck(id); },
  release(id) { untuck(id); },
  follow(on) { following = on !== false; },
  pose(id, anim) { const ch = comp.char(id); if (ch) ch.pose = !anim || anim === 'stand' ? null : anim; },
  retuck() { for (const c of list) tuck(c.id); },
  rescene(at) {
    if (!G.scene) return;
    list.forEach((c, i) => { drop(c); const s = spotFor(i, at); c.ch.x = s.x; c.ch.y = s.y; c.ch.path = null; c.ch.pose = null; c.ch.z = safe(() => G.world.heightAt(s.x, s.y), 0); c.ch.faceTo(G.player.x, G.player.y); G.scene.ents.push(c.ch); });
  },
  hide(on) { for (const c of list) c.ch.hidden = !!on; },
  /** send one companion to a point of the current scene (stage / walk steps) */
  send(id, x, y) { const c = list.find(q => q.id === id); if (!c) return false; c.hold = { x, y }; return c.ch.goTo(G.world, x, y, { snap: 6 }); },
  free(id) { for (const c of list) if (!id || c.id === id) c.hold = null; },
  update(dt) {
    if (!list.length || !G.scene || !G.world) return; const P = G.player, w = G.world; acc += dt; const think = acc > .45; if (think) acc = 0;
    list.forEach((c, i) => {
      const ch = c.ch; if (ch.hidden) return;
      if (!G.scene.ents.includes(ch)) G.scene.ents.push(ch);
      if (c.hold) { ch.move(w, dt); if (!ch.path && !ch.pose) ch.faceTo(P.x, P.y); return; }
      const d = Math.hypot(ch.x - P.x, ch.y - P.y);
      if (following && think) {
        if (d > 16 || (d > 6 && !ch.path && c.stuck > 3)) { const s = spotFor(i); ch.x = s.x; ch.y = s.y; ch.path = null; c.stuck = 0; }
        else if (d > 2.6 + (i % 3) * .5) { const s = spotFor(i); if (!ch.goTo(w, s.x, s.y, { snap: 6, limit: 6000 })) c.stuck = (c.stuck || 0) + 1; else c.stuck = 0; ch.pose = null; }
      }
      ch.speed = d > 7 ? 5.2 : P.speed ? Math.max(3.2, P.speed * 1.02) : 3.6;
      ch.move(w, dt);
      if (!ch.path && !ch.moving && !ch.pose && d < 4) ch.faceTo(P.x, P.y);
    });
  },
};
