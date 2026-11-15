// Mailboxes (Direction update 23, owner msg 115): no mail basket in the home any more. Apartments have a lobby with a wall of mailboxes and YOUR box; houses have a mailbox at the curb.
// Data + THE ROUTING TUNABLE: src/data/mailboxes.js (MAIL.ROUTE 'lobby' | 'direct'; URL `?mailroute=direct|lobby`). The mail itself (menu, round, parcels) is sim/post.js.
// Order 57.9: after lobbies (57) + homes_city (57.8, the doors of the newer homes), before places (58: the side doors of 'direct' mode become places) and housing (60).
//
// What it does (all runtime, nothing in the world files, nothing saved except G.state.post.mbx):
//   LOBBIES   every apartment-type home (data APARTMENTS) has a lobby: nine new rooms `lobby:h_<homeId>` built by the lobby generator (scenes/rooms/lobbies.js) + three buildings that had one.
//             Route 'lobby': the street door of YOUR apartment -> lobby; stairs / lift there ("... up to Flat 3B") -> your flat; "Leave" in the flat -> lobby (you arrive at the stairs);
//             the lobby's street door -> outside your building. A home that is not yours keeps its listing card ("Look inside"). Route 'direct': door <-> flat as before, the new lobbies
//             get a side door poi `door:lobby:h_<homeId>` next to the front door.
//   YOUR BOX  in the lobby of the building you live in: "Your mailbox" (G.post.homeMail()), your box is the cream door in the red frame, a red flag + light over it when post waits;
//             the parcel shelf says "Your parcel" when a small parcel waits. Other lobbies keep "Mailboxes" / "Post your letters".
//   CURB      every house-type home (data HOUSES) + the family's two houses: a curb mailbox entity (prop.post.curbbox) between the front path and the road, never on the roadway or a doorstep,
//             not solid. Yours: flag up when post waits, tap -> the mail menu. A small parcel waits on your doorstep (prop.post.doorparcel) and comes in with you.
//   WRITING   "Write a letter" on a desk / table of your own home (needs Writing Paper), since the basket's entry is gone.
// G.mailboxes = { route() -> 'lobby' | 'direct', kind(homeId?) -> 'apartment' | 'house', lobbyOf(homeId) -> room id | null, homeOfLobby(roomId) -> homeId | null, livesIn(scene?) -> bool,
//   through(homeId?) -> bool (your flat is entered through its lobby), enter(homeId?) (street -> lobby), up(homeId?) (lobby -> flat), leave(roomId) -> Promise | null (hook of rooms/homes.js leaveHome),
//   leaveTo(sceneId) / navEdges(sceneId) / doorOf(root) (hooks of sim/navgoals.js), spot() -> { scene, x, y } | null (where your mailbox is), guide() (arrow to your mailbox until the post is
//   collected), whereText(short?), title(), sync(), curb() -> [{ id, x, y, mine }], boxes: APARTMENTS / HOUSES }
import { G } from '../core/game.js';
import { toast, choose } from '../ui/kit.js';
import { ROOMS, defineRoom } from '../scenes/interior.js';
import { lobbyRoom } from '../scenes/rooms/lobbies.js';
import { propEnt } from '../scenes/rooms/hotel.js';
import { GT } from '../engine/world.js';
import { HOME_BY_ID } from '../data/homes.js';
import { MAIL, APARTMENTS, HOUSES, FAMILY_BOXES } from '../data/mailboxes.js';
import { WINDOW_BY_ID } from '../data/firsttime.js';
import { SYSTEM_BY_ID } from '../data/systems.js';

export const order = 57.9;
const safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const O = 1, WALL = 'furn.post.mailwall';
const route = () => { const q = safe(() => G.query.get('mailroute'), null); return q === 'direct' || q === 'lobby' ? q : MAIL.ROUTE === 'direct' ? 'direct' : 'lobby'; };
const cur = () => safe(() => G.housing.current(), null);
const curId = () => { const h = cur(); return h ? h.id : null; };
const lobbyOf = id => { const a = APARTMENTS[id]; return a ? a.share || 'lobby:h_' + id : null; };
const BY_LOBBY = {}; for (const id in APARTMENTS) BY_LOBBY[lobbyOf(id)] = id;
const homeOfLobby = rid => BY_LOBBY[String(rid || '').replace(/^int:/, '')] || null;
const kind = id => { id = id || curId(); return id && APARTMENTS[id] && ROOMS.has(lobbyOf(id)) ? 'apartment' : 'house'; };
const through = id => { id = id || curId(); return !!id && route() === 'lobby' && kind(id) === 'apartment'; };
const livesIn = sc => { sc = sc || G.scene; const h = sc && sc.def && sc.def.lobby ? homeOfLobby(sc.roomId) : null; return !!h && h === curId(); };
const unit = id => (APARTMENTS[id] || {}).unit || 'your flat';
const P = () => G.post || null;
const cityScene = () => (G.sceneCache && G.sceneCache.get('city')) || null;
const cityPoi = id => safe(() => cityScene().world.pois.find(p => p.id === id), null);

/* ---------- the new lobby rooms (static: a save made inside one loads) ---------- */
let seq = 0;
for (const id in APARTMENTS) {
  const a = APARTMENTS[id], spec = a.lobby; if (!spec) continue; const rid = lobbyOf(id), n = 61 + seq++ * 3;
  const def = lobbyRoom(Object.assign({}, spec, { id: rid, n, homeId: id, district: (HOME_BY_ID[id] || {}).district, c: Object.assign({}, spec.c) }));
  for (const x of spec.extra || []) def.items.push(Object.assign({}, x, { id: 'furn.' + x.id }));
  def.exits = def.exits.map(e => Object.assign({}, e, { to: 'city', use: () => G.go('city', { poi: exitPoi(id) }) }));
  for (const it of def.items) if (it.id === 'furn.lobby.mailboxes') it.id = WALL;
  defineRoom(def);
}
const exitPoi = id => (route() === 'direct' && cityPoi('door:' + lobbyOf(id)) ? 'door:' + lobbyOf(id) : 'door:home:' + id);
/** where you stand when you come down from your flat: in front of the lift / stairs (room coords -> world) */
function upSpot(rid, pref) {
  const def = safe(() => ROOMS.get(rid), null); if (!def || !def.items) return null; const want = pref === 'lift' ? ['furn.lobby.lift', 'furn.lobby.stairs'] : ['furn.lobby.stairs', 'furn.lobby.lift'];
  for (const k of want) { const it = def.items.find(i => i.id === k && i.wall && !i.gated); if (!it) continue; const w = k.endsWith('lift') ? 2 : 1.5; return it.wall === 'y' ? { x: O + it.at + w / 2, y: O + .9, dir: 1 } : { x: O + .9, y: O + it.at + w / 2, dir: 0 }; }
  return null;
}

/* ---------- routing ---------- */
function enter(id) { id = id || curId(); const rid = lobbyOf(id); if (!rid || !ROOMS.has(rid)) return null; G.state.flags.lastDoor = 'door:home:' + id; return G.go('int:' + rid, {}); }
function up(id) { id = id || curId(); if (!id || id !== curId()) return null; return G.housing.goHome(); }
/** hook of scenes/rooms/homes.js leaveHome(roomId): YOUR flat, route 'lobby' -> down into the lobby (never while only viewing a home) */
function leave(roomId) {
  const id = String(roomId || '').replace(/^home:/, ''); if (id !== curId() || !through(id) || safe(() => G.housing.viewing(), null)) return null;
  const rid = lobbyOf(id), sp = upSpot(rid, APARTMENTS[id].up); if (!safe(() => G.state.flags.lastDoor, null)) G.state.flags.lastDoor = 'door:home:' + id;
  return G.go('int:' + rid, sp || {});
}
const leaveTo = sid => { const m = /^int:home:([^:]+)$/.exec(String(sid || '')); return m && m[1] === curId() && through(m[1]) ? 'int:' + lobbyOf(m[1]) : null; };
function navEdges(sid) { const h = homeOfLobby(sid); if (!h || h !== curId()) return null; const sp = upSpot(lobbyOf(h), APARTMENTS[h].up) || { x: 2, y: 2 }; return [{ x: sp.x, y: sp.y - .3, label: 'Stairs', to: 'int:home:' + h }]; }
const doorOf = root => { const h = homeOfLobby(root); return h && APARTMENTS[h].lobby ? cityPoi(exitPoi(h)) : null; };

/* ---------- the city: side doors ('direct'), curb boxes, doorstep parcels ---------- */
let C = null;
const ROAD = new Set([GT.asphalt, GT.tarmac, GT.water, GT.deepwater, GT.void, GT.ballast]);
function bldOf(w, p) { let b = null, bd = 4; for (const ob of w.objs) { if (!ob.a || ob.a.kind !== 'building' || !ob.B) continue; const d = Math.hypot(Math.max(ob.B[0] - p.x, 0, p.x - ob.B[3]), Math.max(ob.B[1] - p.y, 0, p.y - ob.B[4])); if (d < bd) { bd = d; b = ob; } } return b; }
function outDir(p, b) { if (!b) return [0, 1]; const B = b.B; if (p.y >= B[4] - .01) return [0, 1]; if (p.x >= B[3] - .01) return [1, 0]; if (p.y <= B[1] + .01) return [0, -1]; return [-1, 0]; }
/** the curb spot of a house: between the doorstep and the road, one step beside the front path */
function curbSpot(w, p, b) {
  const [ox, oy] = outDir(p, b), sx = oy, sy = ox, doors = w.pois.filter(q => q.type === 'door' || q.type === 'stall' || q.type === 'busstop');
  const ok = (x, y) => x > 1 && y > 1 && x < w.w - 1 && y < w.h - 1 && !w.isBlocked(x, y) && !ROAD.has(w.tileType(x, y)) && !ROAD.has(w.tileType(x + ox * .45, y + oy * .45)) && !doors.some(q => Math.hypot(q.x - x, q.y - y) < 1.15) && !C.curb.some(q => Math.hypot(q.x - x, q.y - y) < 1.2);
  let road = 0; for (let k = .5; k <= 7; k += .5) if (ROAD.has(w.tileType(p.x + ox * k, p.y + oy * k))) { road = k; break; }
  for (const d of road ? [road - .7, road - 1.2, road - 1.7] : [1.25, .75, 1.75]) { if (d < .4) continue; for (const s of [1.25, -1.25, 1.75, -1.75, .9, -.9, 2.5, -2.5]) { const x = Math.round((p.x + ox * d + sx * s) * 4) / 4, y = Math.round((p.y + oy * d + sy * s) * 4) / 4; if (ok(x, y)) return { x, y }; } }
  return null;
}
function ensureCity(s) {
  const w = s.world; if (C && C.w === w) return; C = { w, curb: [], side: [], step: null };
  for (const id of ['lantern_garret', 'sunny_court_flat', 'netloft_3']) { const a = APARTMENTS[id], L = safe(() => G.lobbies.get(a.share), null), hp = w.pois.find(p => p.id === 'door:home:' + id); if (hp && !(L && L.kind === 'res' && Math.hypot(L.x - hp.x, L.y - hp.y) < 6)) console.warn('mailboxes: lobby of', id, 'is not', a.share); }
  /* route 'direct': the new lobbies get their own side door beside the front door */
  if (route() === 'direct') for (const id in APARTMENTS) {
    const a = APARTMENTS[id]; if (!a.lobby) continue; const hp = w.pois.find(p => p.id === 'door:home:' + id), rid = lobbyOf(id); if (!hp || w.pois.some(p => p.id === 'door:' + rid)) continue;
    const b = bldOf(w, hp), [ox, oy] = outDir(hp, b), doors = w.pois.filter(q => q.type === 'door' || q.type === 'stall'); let sp = null;
    for (const d of [1.75, -1.75, 2.25, -2.25, 2.75, -2.75, 1.5, -1.5]) { const x = Math.round((hp.x + oy * d) * 4) / 4, y = Math.round((hp.y + ox * d) * 4) / 4; if (!w.isBlocked(x, y) && !doors.some(q => Math.hypot(q.x - x, q.y - y) < 1.4)) { sp = { x, y }; break; } }
    if (!sp) continue;
    const poi = w.poi({ type: 'door', id: 'door:' + rid, room: rid, name: a.lobby.name + ' Lobby', x: sp.x, y: sp.y, dir: hp.dir, district: hp.district, lobby: 'res', blurb: a.lobby.blurb }); C.side.push({ id, poi });
  }
  /* curb mailboxes */
  const put = (hp, look, id) => { const b = bldOf(w, hp), sp = curbSpot(w, hp, b); if (!sp) { console.warn('mailboxes: no curb spot for', hp.id); return; } C.curb.push({ id, x: sp.x, y: sp.y, look, poi: hp, who: look.who || null }); };
  for (const id in HOUSES) { const hp = w.pois.find(p => p.id === 'door:home:' + id); if (hp) put(hp, HOUSES[id], id); }
  for (const pid in FAMILY_BOXES) { const hp = w.pois.find(p => p.id === pid); if (hp) put(hp, FAMILY_BOXES[pid], null); }
}
const NOTYOURS = ['Somebody else\'s post. You resist. It is a near thing.', 'A catalogue is sticking out. Garden furniture. You leave it be.', 'Not your mailbox. The flag is down anyway.'];
function wire(s) {
  ensureCity(s); if (s._mbx === C) return; s._mbx = C; const w = s.world;
  for (const q of C.side) if (!s.interactables.some(it => it.poi === q.poi)) s.interactables.push({ x: q.poi.x, y: q.poi.y, label: 'Enter lobby — ' + APARTMENTS[q.id].lobby.name, h: 1.2, range: 1.3, poi: q.poi, use: () => { G.state.flags.lastDoor = q.poi.id; return G.go('int:' + q.poi.room, {}); } });
  for (const q of C.curb) {
    const e = propEnt('prop.post.curbbox', { style: q.look.style, c: q.look.c, rc: q.look.rc, flag: 0 }, s); e.x = q.x - .25; e.y = q.y - .25; e.z = w.heightAt(q.x, q.y); q.ent = e;
    const mine = () => !!q.id && q.id === curId(), name = q.id ? (HOME_BY_ID[q.id] || {}).name : q.who + '\'s house';
    s.interactables.push({ x: q.x, y: q.y, h: 1.1, hit: 8, range: 1.5, get label() { return mine() ? 'Your mailbox' : 'Mailbox: ' + name; },
      use: () => { if (mine()) return safe(() => P().homeMail()); toast(q.who ? `${q.who}'s mailbox. ${q.who === 'Nana' ? 'She still gets the seed catalogue, the parish letter and a postcard from her sister every month.' : 'Mostly things with windows in the envelopes.'}` : `The mailbox of ${name}. ${NOTYOURS[Math.floor(q.x * 7 + q.y) % NOTYOURS.length]}`, 'info', 4200); } });
  }
  /* a parcel on YOUR doorstep (houses) */
  const pe = propEnt('prop.post.doorparcel', {}, s); pe.hidden = true; C.step = pe;
  s.interactables.push({ get x() { return pe.x + .25; }, get y() { return pe.y + .2; }, h: .5, hit: 9, range: 1.5, label: 'Your parcel: take it in', visible: () => !pe.hidden, use: () => safe(() => P().takeParcels()) });
}
/** homes that are entered through their lobby: the street door (after housing has set its own onUse) */
function wrapDoors(w) {
  for (const id in APARTMENTS) { const p = w.pois.find(q => q.id === 'door:home:' + id); if (!p || (p.onUse && p.onUse._mbx)) continue; const orig = p.onUse;
    const f = (g, q) => { if (orig && orig(g, q) === true) return true; if (id === curId() && through(id)) { enter(id); return true; } return false; }; f._mbx = 1; p.onUse = f; }
}

/* ---------- what you see: flags, your box ---------- */
function sync() {
  const sc = G.scene, post = P(); if (!sc || !post) return; const n = safe(() => post.waiting('home').length, 0), pc = safe(() => post.waitingParcels().length, 0), id = curId();
  if (sc.def && sc.def.lobby && sc.fixtures) { const mine = livesIn(sc); for (const fx of sc.fixtures) { if (fx.asset.id !== WALL) continue; const m = mine ? (id.length * 3) % 5 : -1, has = mine && n ? 1 : 0, o = fx.ob; if (o.p.mine !== m || o.p.has !== has) { o.p = Object.assign({}, o.p, { mine: m, has }); o._key = null; } } }
  if (sc.id === 'city' && C && sc._mbx === C) {
    for (const q of C.curb) { const f = q.id && q.id === id && n ? 1 : 0; if (q.ent && q.ent.p.flag !== f) q.ent.set({ flag: f }); }
    const pe = C.step, hp = id && kind(id) === 'house' && pc ? C.w.pois.find(p => p.id === 'door:home:' + id) : null;
    if (pe) { if (hp) { const b = bldOf(C.w, hp), [ox, oy] = outDir(hp, b); let x = hp.x + oy * .9 - ox * .1, y = hp.y + ox * .9 - oy * .1; if (C.w.isBlocked(x, y)) { x = hp.x - oy * .9; y = hp.y - ox * .9; } pe.x = x - .25; pe.y = y - .2; pe.z = C.w.heightAt(x, y); pe.set({ n: Math.min(2, pc) }); pe.hidden = false; } else pe.hidden = true; }
  }
}
const whereText = short => { const id = curId(), k = id ? kind(id) : 'house', has = k === 'apartment' || (id && HOUSES[id]);
  return k === 'apartment' ? (short ? 'your mailbox in the lobby' : 'in your mailbox in the lobby') : has ? (short ? 'the mailbox at your curb' : 'in the mailbox at your curb') : short ? 'your mailbox' : 'in your mailbox'; };
const title = () => { const id = curId(); return id && kind(id) === 'apartment' ? `Your mailbox · ${unit(id)}` : 'Your mailbox at the curb'; };
/** where your mailbox is: { scene, x, y } (the lobby's wall, or the curb box in the city) */
function spot() {
  const id = curId(); if (!id) return null;
  if (kind(id) === 'apartment') return { scene: 'int:' + lobbyOf(id), room: lobbyOf(id) };
  const q = C && C.curb.find(c => c.id === id); return q ? { scene: 'city', room: 'city', x: q.x, y: q.y } : null;
}
/** the arrow leads to YOUR mailbox (through the lobby door, down from your flat...) until the post is collected */
function guide() {
  const sp = spot(), post = P(); if (!sp || !G.navGoals) return false;
  const done = () => !safe(() => post.waiting('home').length + (kind() === 'apartment' ? post.waitingParcels().length : 0), 0);
  if (done()) return false;
  G.navGoals.set({ room: sp.room, find: sp.room === 'city' ? { x: sp.x, y: sp.y, h: 1.6 } : { label: /^Your mailbox/ }, label: 'Your mailbox: take out the post', short: 'your mailbox', far: 'Your mailbox', name: 'your mailbox', done });
  return true;
}

/* ---------- rooms ---------- */
function dressLobby(sc) {
  const h = homeOfLobby(sc.roomId), post = () => P(); if (!h) {
    /* any other lobby: "Mailboxes" (flavour) and "Post your letters" sat on the same spot; show one */
    for (const it of sc.interactables) if (it.fx && it.fx.tags.includes('lobby_mail') && !it.postSlot) { const v0 = it.visible; it.visible = () => !safe(() => post().held().length, 0) && (!v0 || v0()); }
    return;
  }
  const lives = () => h === curId(), add = [];
  for (const it of sc.interactables) {
    const fx = it.fx; if (!fx || it._mbx) continue; const T = fx.tags, v0 = it.visible, base = { x: it.x, y: it.y, h: it.h, spot: it.spot, fx, _mbx: 1 };
    if (T.includes('lobby_stairs') || (T.includes('lobby_lift') && !fx.item.gated)) { it.visible = () => !lives() && (!v0 || v0()); add.push(Object.assign(base, { label: (T.includes('lobby_lift') ? 'Lift: up to ' : 'Stairs: up to ') + unit(h), navTo: 'int:home:' + h, visible: lives, use: () => up(h) })); }
    else if (T.includes('lobby_mail') && !it.postSlot) { it.visible = () => !lives() && !safe(() => post().held().length, 0) && (!v0 || v0()); add.push(Object.assign(base, { label: 'Your mailbox · ' + unit(h), visible: lives, use: () => safe(() => post().homeMail()) })); }
    else if (T.includes('lobby_packages')) { const mineNow = () => lives() && safe(() => post().waitingParcels().length, 0) > 0; it.visible = () => !mineNow() && (!v0 || v0()); add.push(Object.assign(base, { label: 'Parcel shelf: one for you', visible: mineNow, use: () => safe(() => post().takeParcels()) })); }
  }
  sc.interactables.push(...add);
}
/** "Write a letter" on a desk or table of your own home (the basket's entry moved here) */
function dressHome(sc) {
  if (!sc.def || sc.def.home !== true || sc.def.bath) return; const post = () => P();
  const fxs = sc.fixtures.filter(f => (f.tags.includes('desk') || f.tags.includes('table')) && f.tags.includes('home')), busy = f => sc.interactables.find(i => i.fx === f);
  const rank = f => (busy(f) ? 10 : 0) + (f.tags.includes('desk') ? 0 : f.tags.includes('coffeetable') ? 3 : 1); fxs.sort((a, b) => rank(a) - rank(b));
  const write = fx => safe(() => post().desk(fx, sc, true));
  for (const fx of fxs) {
    const it = busy(fx);
    if (!it) { sc.interactables.push({ x: fx.x, y: fx.y, h: Math.min(1.2, fx.ob.size[2]), spot: fx.use || undefined, fx, label: 'Write a letter', use: () => write(fx) }); continue; }
    if (it._mbxW || fxs.some(f => !busy(f))) continue; it._mbxW = 1; const use0 = it.use, lab = it.label || 'Use';   /* only a busy desk in the home: offer both */
    it.use = (g, i) => choose('At the desk', [{ label: lab, value: 'use' }, { label: 'Write a letter', sub: 'Needs Writing Paper & Envelopes', value: 'write' }]).then(v => { if (v === 'use') return use0(g, i); if (v === 'write') write(fx); });
    break;
  }
}

/* ---------- old saves, the intro ---------- */
let note = false;
function migrate() { const S = G.state.post; if (!S || S.mbx) return; S.mbx = 1; if ((G.state.t || 0) > 600 || (S.mail && S.mail.length)) note = true; }
function showNote() {
  if (!note || !curId() || G.onTitle) return; note = false; const n = safe(() => P().waiting('home').length, 0), apt = kind() === 'apartment';
  const text = `Your post is ${apt ? 'in your mailbox downstairs' : 'in the mailbox at the curb'} now${n ? ` (${n} waiting)` : ''}. The basket by the door is gone. To write a letter, use a desk or table at home.`;
  if (G.phone && G.phone.notify) safe(() => G.phone.notify({ app: 'post', title: 'Maple Post', text, icon: 'post_letter', data: { tab: 'inbox' } })); toast(text, 'info', 7000);
}
function introHint(s) {
  if (!G.intro || G.intro.at !== 'apartment_arrival') return; const id = curId(); if (!id) return;
  if (s.id === 'city') { const d = cityPoi('door:home:' + id); if (d && G.state.intro && G.state.intro.keys) G.intro.hint('Tap your door to go inside.', { x: d.x, y: d.y, h: 3.2 }); }
  else if (livesIn(s)) { const sp = upSpot(lobbyOf(id), APARTMENTS[id].up); if (sp) G.intro.hint(`Your flat is upstairs. Tap the ${APARTMENTS[id].up === 'lift' && s.fixtures.some(f => f.tags.includes('lobby_lift') && !f.item.gated) ? 'lift' : 'stairs'}.`, { x: sp.x, y: sp.y - .5, h: 2.6 }); }
}

export function init() {
  G.mailboxes = { route, kind, lobbyOf, homeOfLobby, livesIn, through, enter, up, leave, leaveTo, navEdges, doorOf, spot, guide, whereText, title, sync, curb: () => (C ? C.curb.map(q => ({ id: q.id, x: q.x, y: q.y, style: q.look.style, mine: !!q.id && q.id === curId() })) : []), boxes: { APARTMENTS, HOUSES } };
  /* texts that named the basket (data/firsttime.js, data/systems.js are lead-owned: the same wording is in docs/reports/mailboxes.md as a patch) */
  if (WINDOW_BY_ID.mail) WINDOW_BY_ID.mail.text = 'Letters wait in your mailbox: in the lobby of your building, or at the curb if you live in a house. To write back, use a desk or table at home, or any post office: they have paper, stamps and a counter for parcels.';
  if (SYSTEM_BY_ID.post && SYSTEM_BY_ID.post.how) SYSTEM_BY_ID.post.how[0] = 'Letters come to your mailbox: in the lobby of your building, or at the curb of your house. Write back at a desk at home or from any post office.';
  G.on('room:build', sc => { try { if (sc.def && sc.def.lobby) dressLobby(sc); else dressHome(sc); } catch (e) { console.warn('mailboxes room', e); } });
  G.on('scene', s => {
    if (!s) return;
    if (s.id === 'city' && s.world) { try { wire(s); } catch (e) { console.warn('mailboxes city', e); } queueMicrotask(() => safe(() => wrapDoors(s.world))); }
    try { sync(); introHint(s); } catch (e) { console.warn('mailboxes', e); }
    /* a small parcel waiting downstairs / on the doorstep comes in with you */
    if (s.def && s.def.home === true && !s.def.bath && s.def.room === 'main' && safe(() => P().waitingParcels().length, 0)) setTimeout(() => { if (G.scene === s && !G.busy && !G.cutscene) safe(() => P().takeParcels()); }, 700);
    if (note) setTimeout(showNote, 1600);
  });
  G.on('load', () => { migrate(); C = C && cityScene() && C.w === cityScene().world ? C : null; });
  G.on('game:new', () => { if (G.state.post) G.state.post.mbx = 1; });
  G.on('game:start', o => { if (o && o.isNew) { if (G.state.post) G.state.post.mbx = 1; } else { migrate(); if (note) setTimeout(showNote, 2200); } });
  for (const ev of ['post:mail', 'post:collected', 'post:parcel', 'home:move', 'post:posted']) G.on(ev, () => safe(sync));
  G.on('home:move', () => { safe(() => G.navGoals.clear()); const s = cityScene(); if (s && s.world) queueMicrotask(() => safe(() => wrapDoors(s.world))); });
}
