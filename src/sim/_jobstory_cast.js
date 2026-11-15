// _jobstory_cast.js — who speaks in a job story (helper of sim/jobstory.js): names, portraits, and the coworkers who stand in the room while you work.
//
//   who(id) -> { id, name, short, spec | null, cast: bool }
//       'narrator' (caption) · 'player' · a cast.js person (name / portrait from G.social) · anyone else in story/jobs_arcs.js SPEAKERS: a new person or a
//       named member of a showpiece's staff. Those have no character sheet yet, so their look is DERIVED: a seeded citizen (always the same for the same id)
//       adjusted by the words of the designer's `look` brief (age, hair, glasses, hat, the color and kind of coat). Real art can replace a row in LOOKS below.
//   figures.set(scene, people, spotsFor(k), onTap) / figures.clear()   up to three non-cast people of the job's cast stand near the job's stations during a worked shift
//       (own Chars in the room, tap = they say a line). Cast people are left to the social system: if they are in the room they speak for themselves.
//   figures.char(id) -> Char | null    the figure, or the social system's Char for a cast person who is in the room right now.
import { G } from '../core/game.js';
import { Char, charArt } from '../core/char.js';
import { rng } from '../engine/raster.js';
import { CAST_BY_ID } from '../story/cast.js';
import { SPEAKERS, CASTS } from '../story/jobs_arcs.js';
import { buildSpecs } from './_social_data.js';

const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const pname = () => (G.state.player && G.state.player.name) || 'You';

/* hand-set looks (override the derived one). Keep to keys of the character art spec. */
const LOOKS = {
  odile: { age: 'adult', hair: 'bun', hairColor: '#4a3022', top: 'jacket', topColor: '#33303f', bottom: 'skirt', bottomColor: '#33303f', glasses: false },
  gus_door: { age: 'elder', hairColor: '#c8c8d0', top: 'coat', topColor: '#7a2e3a', hat: 'cap', hatColor: '#7a2e3a', beard: false },
  connie: { age: 'adult', hair: 'bun', hairColor: '#8a8a98', top: 'jacket', topColor: '#2f3f72', bottom: 'slacks', bottomColor: '#2f3f72' },
  pops: { age: 'elder', hairColor: '#e8e8ee', top: 'shirt', topColor: '#f4f0e8', bottom: 'slacks', bottomColor: '#33303f', beard: true },
  pet: { age: 'elder', hair: 'bun', hairColor: '#a9a9b4', top: 'long', topColor: '#6f7a48', bottom: 'slacks', bottomColor: '#7a5238' },
  ada: { age: 'adult', hair: 'locs', hairColor: '#a9a9b4', top: 'coat', topColor: '#2b2d42', bottom: 'slacks', bottomColor: '#2b2d42', hat: 'cap', hatColor: '#2b2d42' },
  bastien: { age: 'adult', hair: 'buzz', hairColor: '#a9a9b4', outfit: 'chef' },
  lena: { age: 'adult', top: 'hoodie', topColor: '#e8b83a', bottom: 'cargo', bottomColor: '#4a4a58' },
};
const COLORS = [[/\bnavy\b/, '#2f3f72'], [/\bgr[ae]y\b/, '#8a8a98'], [/\bgreen\b/, '#4a7a58'], [/\bpink\b/, '#f08ab0'], [/\byellow\b/, '#e8b83a'], [/\bpurple\b|\blilac\b/, '#9a7ac8'], [/\bbrown\b|\bcamel\b/, '#8a6238'], [/\bwhite\b|\bwhites\b/, '#f4f0e8'], [/\bblack\b|\bdark\b/, '#33303f'], [/\bred\b/, '#c8483b'], [/\bblue\b/, '#3b6fd0']];
function derive(p) {
  const A = charArt(), L = String(p.look || '') + ' ' + String(p.role || ''), l = L.toLowerCase(), has = (list, v) => (list || []).includes(v);
  const kid = p.age === 'kid' || /\b(second-grade|eight|nine|small, serious)\b/.test(l) && /\b(twin|hood up|braids)\b/.test(l), elder = !kid && /(sixt|sevent|eight)ies|sixty|retired|silver|gray|grey|white bob|stooped|walking stick|cane|pearls|thirty years/.test(l), teen = /teenager|school blazer|nineteen/.test(l);
  const s = A.randomSpec(rng(1 + hash('js:' + p.id) % 1e6), { age: kid ? 'kid' : elder ? 'elder' : 'adult', season: 0, style: /blazer|suit|bow tie|tie\b|waistcoat|uniform|stripes/.test(l) ? 'business' : /hi-vis|apron|boiler|waders|work coat|rubber/.test(l) ? 'workwear' : /tracksuit|kit\b|wetsuit/.test(l) ? 'athleisure' : undefined });
  s.outfit = null; s.bag = null; if (teen) s.height = 'avg';
  if (/glasses/.test(l)) s.glasses = true; else if (!/sun/.test(l)) s.glasses = false;
  if (/must?ache|beard/.test(l)) s.beard = true;
  if (/bun\b|pinned up|beehive/.test(l) && has(A.HAIRS, 'bun')) s.hair = 'bun'; else if (/braid|puffs/.test(l) && has(A.HAIRS, 'braids')) s.hair = 'braids'; else if (/\bbob\b/.test(l) && has(A.HAIRS, 'bob')) s.hair = 'bob'; else if (/crop|crew cut|close-cropped/.test(l) && has(A.HAIRS, 'buzz')) s.hair = 'buzz'; else if (/locs/.test(l) && has(A.HAIRS, 'locs')) s.hair = 'locs';
  if (/silver|gray-|gray |grey|white bob/.test(l)) s.hairColor = '#c8c8d0'; if (/bleached/.test(l)) s.hairColor = '#f0e4b8';
  if (/flat cap/.test(l) && has(A.HATS, 'flatcap')) s.hat = 'flatcap'; else if (/hard hat/.test(l) && has(A.HATS, 'hardhat')) { s.hat = 'hardhat'; s.hatColor = '#f2c230'; } else if (/woolly hat|pom-pom|beanie/.test(l) && has(A.HATS, 'beanie')) s.hat = 'beanie'; else if (/peaked cap|visor/.test(l) && has(A.HATS, 'cap')) s.hat = 'cap'; else if (/headscarf|bandana/.test(l) && has(A.HATS, 'headband')) s.hat = 'headband'; else if (!/hat\b/.test(l)) s.hat = null;
  const top = /cardigan/.test(l) ? 'cardigan' : /blazer|jacket/.test(l) ? 'jacket' : /raincoat|coat\b/.test(l) ? 'coat' : /hoodie/.test(l) ? 'hoodie' : /suit\b/.test(l) ? 'suit' : /shirt/.test(l) ? 'shirt' : null;
  if (top && (has(A.ALL_TOPS, top) || has(A.TOPS, top))) s.top = top;
  const m = /(\w+)\s+(cardigan|blazer|raincoat|coat|apron|tracksuit|fleece|uniform|jacket|suit|shirt)/.exec(l); if (m) for (const [re, c] of COLORS) if (re.test(m[1])) { s.topColor = c; break; }
  if (/hi-vis/.test(l)) s.topColor = '#e8d83a'; if (/whites|white barber|white coat/.test(l)) s.topColor = '#f4f0e8';
  return s;
}
const specs = {};
function specOf(id) {
  if (specs[id] !== undefined) return specs[id]; const p = SPEAKERS[id]; if (!p) return specs[id] = null;
  let s = null; try { s = derive(p); if (LOOKS[id]) Object.assign(s, LOOKS[id]); } catch (e) { s = null; }
  return specs[id] = s;
}
export function who(id) {
  if (id === 'narrator') return { id, name: '', short: '', spec: null };
  if (id === 'player') return { id, name: pname(), short: pname(), spec: G.player && G.player.spec };
  const c = CAST_BY_ID[id];
  if (c) { const n = safe(() => G.social.npc(id), null); return { id, name: c.name, short: c.short || c.name, spec: (n && n.spec) || safe(() => buildSpecs(c).base, null), cast: true }; }
  const p = SPEAKERS[id]; if (p) return { id, name: p.name, short: p.short || p.name, spec: specOf(id), role: p.role };
  return { id, name: id, short: id, spec: null };
}
export const isCast = id => !!CAST_BY_ID[id];

/* ---------- coworkers in the room ---------- */
let figs = [];
function freeNear(w, x, y) { if (!w.isBlocked(x, y)) return { x, y }; for (const r of [.6, 1, 1.5, 2, 2.6]) for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, qx = x + Math.cos(a) * r, qy = y + Math.sin(a) * r; if (!w.isBlocked(qx, qy)) return { x: qx, y: qy }; } return null; }
export const figures = {
  /** people = speaker ids in order of preference; spotsFor(k) = [{ x, y }] candidate places for the k-th figure (near the job's stations) */
  set(scene, people, spotsFor, onTap) {
    figures.clear(); if (!scene || !scene.world) return;
    const w = scene.world, used = [];
    for (const id of people) {
      if (figs.length >= 3 || isCast(id)) continue; const spec = specOf(id); if (!spec) continue;
      let at = null; for (const sp of spotsFor(figs.length)) { const q = freeNear(w, sp.x, sp.y); if (!q) continue; if (used.some(u => Math.hypot(u.x - q.x, u.y - q.y) < 1.4) || Math.hypot(G.player.x - q.x, G.player.y - q.y) < 1) continue; at = q; break; }
      if (!at) continue; used.push(at);
      let c; try { c = new Char(spec, at.x, at.y); } catch (e) { continue; }
      c.jobFig = id; c.label = who(id).short; c.t = Math.random() * 3; c.z = safe(() => w.heightAt(c.x, c.y), 0);
      c.update = dt => { c.t += dt; c.moving = false; if (Math.floor(c.t) % 5 === 0 && Math.hypot(G.player.x - c.x, G.player.y - c.y) < 4) c.faceTo(G.player.x, G.player.y); };
      scene.ents.push(c);
      const it = { x: c.x, y: c.y, h: 1.5, hit: 12, range: 2.4, label: who(id).short, use: () => { safe(() => { G.player.faceTo(c.x, c.y); c.faceTo(G.player.x, G.player.y); }); if (onTap) onTap(id, c); } };
      scene.interactables.push(it); figs.push({ id, c, it, scene });
    }
  },
  clear() { for (const f of figs) { let i = f.scene.ents.indexOf(f.c); if (i >= 0) f.scene.ents.splice(i, 1); i = f.scene.interactables.indexOf(f.it); if (i >= 0) f.scene.interactables.splice(i, 1); } figs = []; },
  char(id) { const f = figs.find(x => x.id === id && x.scene === G.scene); if (f) return f.c; return isCast(id) ? safe(() => (G.social.present(id) ? G.social.char(id) : null), null) : null; },
  ids: () => figs.map(f => f.id),
  castOf: job => (CASTS[job] ? CASTS[job].people.map(p => p.id) : []),
};
