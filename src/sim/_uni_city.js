// Maple Bay University — the campus in the city (helper of sim/university.js; no init of its own).
// The art `bld.arts.unihall` existed but stood nowhere in the Arts Quarter (the generator only uses it for Maplewood School), and the Campus Green block is filled by the
// Public Library. So the campus is an ADD on unused wild land at the top of Riverside Drive, across Campus Drive from the Blue Heron and beside Symphony Hall:
//   University Hall  x 167-185, y 24-33 (door poi `door:university` at 176, 33.75; the clock tower closes the view up Riverside Drive)
//   The Quad         x 166-184, y 34-54: lawn, a central walk from the gate on Campus Drive to the hall steps, a cross walk, the Founder's statue, noticeboard, banners,
//                    six clubs-fair stalls (hidden except on fair days), the pond deck for field classes (164.5, 45.5).
// Nothing existing is moved. Removed: the wild trees / flowers that stood inside x 164-186, y 22-55 (listed by `removed`). Ground tiles in the quad become park / plaza.
// Runs once per city world, at init (before places, lobbies' lazy scan is unaffected: the id `unihall` is not a lobby class and public_places skips it).
import { GT } from '../engine/world.js';

export const CAMPUS = { hall: { x: 167, y: 24 }, door: { x: 176, y: 33.75 }, quad: { x0: 166, y0: 34, x1: 184, y1: 54 }, gate: { x: 176, y: 53.4 }, statue: { x: 176, y: 44 }, notice: { x: 179.8, y: 50.2 }, pond: { x: 167.6, y: 46.5 }, centre: { x: 176, y: 44 } };
export const STALL_AT = [[170.8, 36], [170.8, 39], [170.8, 47.5], [170.8, 50.4], [167.6, 47.5], [167.6, 50.4]];
export const DOOR = 'door:university', NAME = 'Maple Bay University';
const safe = fn => { try { return fn(); } catch (e) { console.warn('university city', e); return null; } };

/** build the campus into a city world. returns { hall, door, stalls: [ob], banners: [ob], aboard, removed } (cached on the world) */
export function buildCampus(w) {
  if (!w || !Array.isArray(w.objs)) return null; if (w._uni) return w._uni;
  const out = w._uni = { hall: null, door: null, stalls: [], banners: [], aboard: null, removed: 0 }, Q = CAMPUS.quad;
  if (!w.objs.some(o => o.id === 'bld.arts.unihall' && o.x === CAMPUS.hall.x)) {
    for (const o of w.objs.slice()) { if (o.a && o.a.kind === 'building') continue; const cx = (o.B[0] + o.B[3]) / 2, cy = (o.B[1] + o.B[4]) / 2; if (cx > 164 && cx < 186 && cy > 22 && cy < 55 && /^prop\.(nature|park)\./.test(o.id)) { w.remove(o); out.removed++; } }
    /* ground: lawn + paths (tile types only; heights untouched) */
    w.ground(Q.x0, Q.y0, Q.x1, Q.y1, GT.park); w.ground(167, 33, 185, 35, GT.plaza); w.ground(175, 34, 177, 54, GT.plaza); w.ground(167, 43, 182, 45, GT.plaza); w.ground(173, 41, 179, 47, GT.plaza); w.ground(174, 53, 178, 54, GT.plaza); w.version++;
    out.hall = safe(() => w.place('bld.arts.unihall', CAMPUS.hall.x, CAMPUS.hall.y, { p: { seed: 2 } }));
    const P = (id, x, y, p, o) => safe(() => w.place(id, x, y, Object.assign({ p: p || {} }, o)));
    P('prop.uni.gate', 173.2, 53, {}); w.block(173.2, 53, 174, 53.8); w.block(178, 53, 178.8, 53.8);
    P('prop.uni.wall', 166, 53.2, { w: 7 }); P('prop.uni.wall', 179, 53.2, { w: 5 });
    P('prop.uni.statue', 175.2, 43.2, {});
    for (const [x, y] of [[173.2, 41.2], [177.4, 41.2], [173.2, 45.4], [177.4, 45.4]]) P('prop.uni.bed', x, y, { w: 1.4, d: 1.4, k: 'yew', seed: x });
    P('prop.uni.bed', 169, 35.2, { w: 4, d: 1.2, seed: 4 }); P('prop.uni.bed', 179, 35.2, { w: 4, d: 1.2, seed: 9 });
    P('prop.uni.notice', 178.6, 49, { seed: 3 });
    for (const [x, y] of [[174.4, 49.5], [177.3, 49.5], [174.4, 38.5], [177.3, 38.5]]) { const b = P('prop.uni.banner', x, y, { k: 'term' }); if (b) out.banners.push(b); }
    P('prop.uni.lawnsign', 179.6, 46.4, { t: 'THE QUAD' }, { solid: false });
    P('prop.uni.jetty', 164.5, 45.5, {}, { z: 3, solid: false });
    out.aboard = P('prop.uni.aboard', 178.4, 51.6, {}); if (out.aboard) { out.aboard.hidden = true; w.free(out.aboard.B[0], out.aboard.B[1], out.aboard.B[3], out.aboard.B[4]); }
    for (const [x, y, f] of [[172.6, 42.2, 0], [179.4, 42.2, 0], [168.4, 42.2, 0]]) P('prop.street.bench.wood', x, y, {}, { flip: !!f });
    for (const [x, y] of [[173.9, 36.2], [177.8, 36.2], [173.9, 51], [177.8, 51]]) P('prop.street.lamp.modern', x, y, {});
    P('prop.park.bikerack', 180.4, 35.4, { n: 3 });
    const TREES = [['cherry', 168, 38.2], ['maple', 182, 37], ['cherry', 181.6, 47.6], ['maple', 168.4, 51.4], ['birch', 182.4, 51.6], ['cherry', 172, 46], ['maple', 166.6, 40.4]];
    TREES.forEach(([k, x, y], i) => P('prop.nature.tree.' + k, x, y, { seed: 311 + i * 17 }));
    STALL_AT.forEach(([x, y], i) => { const s = P('prop.uni.stall', x, y, { k: i, name: ['CHESS', 'FILM SOC', 'GARDENERS', 'RADIO MBU', 'ROWING', 'DEBATE'][i], c: ['#2f3f72', '#8a3848', '#3f7a54', '#c8683f', '#2f6a7a', '#5a4a8a'][i] }); if (s) { s.hidden = true; w.free(s.B[0], s.B[1], s.B[3], s.B[4]); out.stalls.push(s); } });
    if (Array.isArray(w.walkways)) w.walkways.push({ x0: 175, y0: 34, x1: 177, y1: 54, axis: 'y', district: 'arts', kind: 'path' }, { x0: 167, y0: 43, x1: 182, y1: 45, axis: 'x', district: 'arts', kind: 'path' });
    if (!w.pois.some(p => p.id === 'lm:university')) w.poi({ type: 'landmark', id: 'lm:university', name: 'The Quad', x: CAMPUS.centre.x, y: CAMPUS.centre.y + 3 });
  } else { out.hall = w.objs.find(o => o.id === 'bld.arts.unihall' && o.x === CAMPUS.hall.x); out.stalls = w.objs.filter(o => o.id === 'prop.uni.stall'); out.banners = w.objs.filter(o => o.id === 'prop.uni.banner'); out.aboard = w.objs.find(o => o.id === 'prop.uni.aboard') || null; }
  out.door = w.pois.find(p => p.id === DOOR) || w.poi({ type: 'door', id: DOOR, room: 'university', name: NAME, x: CAMPUS.door.x, y: CAMPUS.door.y, dir: 1, district: 'arts', showpiece: true });
  return out;
}
/** show / hide a placed prop together with its nav footprint */
export function showProp(w, o, on) { if (!o || o.hidden === !on) return; o.hidden = !on; if (o.solid) { if (on) w.block(o.B[0], o.B[1], o.B[3], o.B[4]); else w.free(o.B[0], o.B[1], o.B[3], o.B[4]); } }
export function setProp(o, q) { if (!o) return; for (const k in q) if (o.p[k] !== q[k]) { o.p = Object.assign({}, o.p, q); o._key = null; return; } }
