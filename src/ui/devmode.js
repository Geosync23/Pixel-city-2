// Developer mode (owner msg 103). Switched on in the phone's Settings app ("More"); while on, a small DEV button sits in the bottom-left corner of the
// game screen and opens the dev menu: freeze needs, endless money, unlock everything (apps, places, recipes, skills, passes, homes, jobs), time, weather,
// speed, teleport and "hire me". State: G.state.dev = { on, needs, money, all }.   G.dev = { on(), set(on), open(), unlockAll() }
import { G } from '../core/game.js';
import { el, modal, toast, choose } from './kit.js';
import { SKILL_XP } from '../data/needs.js';

const D = () => { let s = G.state.dev; if (!s || typeof s !== 'object') s = G.state.dev = { on: false, needs: false, money: false, all: false }; return s; };
const safe = (f, d) => { try { return f(); } catch (e) { console.warn('[dev]', e); return d; } };
const RICH = 999999, PASSES = ['conservatory_pass', 'observatory_pass', 'aquarium_pass', 'museum_member', 'nat_pass', 'hotel_friend'];
let button = null, menu = null;

function hold() {                                                 /* keeps the cheats topped up */
  const d = D(); if (!d.on) return;
  if (d.needs && G.state.needs && G.state.needs.v) { let ch = false; for (const k in G.state.needs.v) if (G.state.needs.v[k] < 100) { G.state.needs.v[k] = 100; ch = true; } if (ch) G.emit('needs:change'); }
  if (d.money && G.state.player && G.state.player.money < RICH) { G.state.player.money = RICH; G.emit('money'); safe(() => G.hud.refresh()); }
}
function fillNeeds() { for (const k in G.state.needs.v) G.state.needs.v[k] = 100; G.emit('needs:change'); toast('All needs filled.', 'good'); }
function maxSkills() { const xp = G.state.needs.xp, top = SKILL_XP[SKILL_XP.length - 1]; for (const k in xp) xp[k] = top; G.emit('skill:up'); return Object.keys(xp).length; }
function allApps() { let n = 0; for (const a of safe(() => G.apps.catalog(), [])) { safe(() => G.apps.release(a.id, true)); if (safe(() => G.apps.install(a.id))) n++; } return n; }
function allPlaces() { let n = 0; for (const p of safe(() => G.places.list(), [])) if (safe(() => G.places.discover(p.id, true))) n++; return n; }
function unlockAll() {
  const d = D(); d.all = true;
  if (G.intro && G.intro.active) safe(() => G.intro.skip());
  const a = allApps(), p = allPlaces(), r = safe(() => G.cooking.learnAll(), 0), s = maxSkills();
  const F = G.state.flags || (G.state.flags = {}); for (const k of PASSES) F[k] = true;
  safe(() => G.hud.refresh());
  toast(`Unlocked: ${a} apps, ${p} places, ${r} recipes, ${s} skills maxed, all passes, homes and jobs.`, 'good', 5000);
}
async function teleport() {
  const list = safe(() => G.places.list(), []).filter(p => p.kind === 'venue' || p.kind === 'landmark' || p.kind === 'station' || p.kind === 'airport' || p.kind === 'home').sort((a, b) => a.name.localeCompare(b.name) || (a.kind === 'landmark') - (b.kind === 'landmark'))
    .filter((q, i, a) => !i || q.name !== a[i - 1].name);   /* QA round 4: stations and homes were listed twice (as the place and as its landmark) */
  if (!list.length) return toast('No places loaded yet.');
  const p = await choose('Teleport to', list.map(q => ({ label: q.name, sub: q.districtName || q.kind, value: q })), { cls: 'dev-list' }); if (!p) return;
  await G.go('city', { x: p.x, y: p.y + .6 }); toast('At ' + p.name + '.');
}
async function hire() {
  const L = safe(() => G.jobs.listings('computer'), []); if (!L.length) return toast('No job listings found.');
  const id = await choose('Hire me as', L.map(j => ({ label: j.title + ' · ' + j.venueName, sub: j.days + ' ' + j.hours, value: j.jobId })), { cls: 'dev-list' }); if (!id) return;
  const need = (L.find(j => j.jobId === id) || {}).requires || {}, xp = G.state.needs.xp;
  for (const k in need) if (k in xp) xp[k] = Math.max(xp[k], SKILL_XP[Math.min(SKILL_XP.length - 1, need[k] - 1)] || 0);
  const h = G.state.jobs && G.state.jobs.history && G.state.jobs.history[id]; if (h) h.reapply = 0;
  if (!safe(() => G.jobs.apply(id))) toast('That one would not take.', 'bad');
}
function toMorning() { const n = G.now(), m = ((8 - n.hf + 24) % 24 || 24) * 60; G.advance(Math.round(m)); }

function render() {
  if (!menu) return; const d = D(), b = menu.body; b.textContent = '';
  const sec = t => b.append(el('div.dev-sec', { text: t })), row = (...k) => b.append(el('div.dev-row', null, ...k));
  const tog = (label, key, after) => el('button.dev-b' + (d[key] ? '.on' : ''), { text: label + ': ' + (d[key] ? 'ON' : 'off'), onclick: () => { d[key] = !d[key]; hold(); after && after(); render(); } });
  const act = (label, fn) => el('button.dev-b', { text: label, onclick: async () => { const keep = fn.keep; if (!keep) close(); await safe(fn); if (keep) render(); } });
  const k = f => { f.keep = 1; return f; };
  sec('Needs'); row(tog('Freeze needs at full', 'needs'), act('Fill once', k(fillNeeds)));
  sec('Money'); row(tog('Unlimited money', 'money'), act('+$1,000', k(() => G.money.add(1000, 'Dev mode'))), act('+$10,000', k(() => G.money.add(10000, 'Dev mode'))));
  sec('Progress'); row(act(d.all ? 'Unlock everything (again)' : 'Unlock everything', k(unlockAll)));
  row(act('All apps', k(() => toast(allApps() + ' apps installed.', 'good'))), act('All places', k(() => toast(allPlaces() + ' places on the map.', 'good'))), act('All recipes', k(() => toast(safe(() => G.cooking.learnAll(), 0) + ' recipes learned.', 'good'))),
    act('Max skills', k(() => toast(maxSkills() + ' skills at level 10.', 'good'))));
  if (G.intro && G.intro.active) row(act('Skip the intro', () => G.intro.skip()));
  if (G.chapters) row(act('Chapters…', () => G.chapters.debug.menu()), G.chapters.moments ? act('Family moments…', async () => { const v = await choose('Family moments', G.chapters.moments.list().map(m => ({ label: m.title, sub: m.when, value: m.id })), { cls: 'dev-list' }); if (v) G.chapters.moments.debug.stage(v); }) : null);
  sec('Jobs + travel'); row(act('Hire me as…', hire), act('Teleport…', teleport)); if (G.jobStory) row(act('Job stories…', () => G.jobStory.debug.menu()), G.rel ? act('Relationships…', () => G.rel.debug.menu()) : null);
  if (G.cityEvents) row(act('Start a city event…', async () => { const L = safe(() => G.cityEvents.list(), []); const id = await choose('Stage a city event now', L.map(e => ({ label: e.name || e.id, sub: 'Jumps you to it', value: e.id })), { cls: 'dev-list' }); if (!id) return; safe(() => G.cityEvents.debug.start(id)); const pl = safe(() => G.cityEvents.place(id)); if (pl) await G.go('city', { x: pl.x + 2, y: pl.y }); toast('Event staged. Stop it from this menu.'); }), act('Stop event', k(() => { safe(() => G.cityEvents.debug.stop()); toast('Event stopped.'); })));
  if (G.audio && G.audio.debug) { sec('Sound'); row(act('City ambience…', () => G.audio.debug.menu()), act('What is playing', k(() => { const a = G.audio.debug.ambience(); toast((a.scene || 'nothing') + ': ' + a.tracks.map(t => t.id + ' ' + t.voices.map(v => v.name).join('+')).join(', ')); }))); }
  sec('Time'); row(act('+1 hour', k(() => G.advance(60))), act('+6 hours', k(() => G.advance(360))), act('To 8 am', k(toMorning)), act('+1 day', k(() => G.advance(1440))));
  b.append(el('div.dev-row', null, el('span.dev-l', { text: 'Speed' }), ...[1, 2, 4, 8, 16].map(s => el('button.dev-b' + (G.state.speed === s ? '.on' : ''), { text: s + 'x', onclick: () => { G.state.speed = s; safe(() => G.hud.refresh()); render(); } }))));
  sec('Weather'); row(...['clear', 'cloudy', 'rain', 'storm', 'fog', 'snow'].map(w => act(w, k(() => { safe(() => G.weather.setWeather(w, 6)); toast('Weather: ' + w + '.'); }))));
  b.append(el('p.dev-note', { text: 'Turn developer mode off in Settings (phone) or here.' }));
  row(el('button.dev-b', { text: 'Turn dev mode off', onclick: () => { close(); set(false); } }));
}
function close() { if (menu) { const m = menu; menu = null; m.close(); } }
function open() { if (menu || !D().on) return; menu = modal({ title: 'Dev mode', cls: 'dev', onClose: () => { menu = null; } }); render(); }

function sync() {
  const on = !!D().on, ui = document.getElementById('ui'); if (!ui) return;
  if (on && !button) { button = el('button.dev-btn', { text: 'DEV', 'aria-label': 'Developer menu', onclick: open }); ui.append(button); }
  if (button) button.style.display = on ? '' : 'none';
}
function set(on) { const d = D(); d.on = !!on; if (!on) { d.needs = false; d.money = false; if (G.state.speed > 4) { G.state.speed = 4; safe(() => G.hud.refresh()); } /* QA round 4: 8x / 16x are dev-only; the HUD has no button to leave them */ } sync(); hold(); toast(on ? 'Developer mode on: DEV button, bottom-left.' : 'Developer mode off.'); }

const CSS = `.dev-btn{position:absolute;left:max(8px,env(safe-area-inset-left,0px));bottom:14px;z-index:6;min-height:0;padding:5px 9px;font:700 12px/1 inherit;letter-spacing:1px;color:#fff;background:#b3261e;border:2px solid #4a0d09;box-shadow:0 3px 0 #4a0d09;border-radius:8px;opacity:.9}
.win.dev{width:min(430px,94vw);max-height:86vh;display:flex;flex-direction:column}.win.dev .win-body{overflow:auto;padding:8px 10px 12px}
.dev-sec{font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:.8px;opacity:.7;margin:10px 0 4px}.dev-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;align-items:center}
.dev-b{min-height:38px;padding:6px 10px;font-weight:700;font-size:13px;border-radius:8px}.dev-b.on{background:#2e7d32;color:#fff}.dev-l{font-weight:700;font-size:13px}.dev-note{font-size:12px;opacity:.7;margin:10px 0 6px}
.win.dev-list{max-height:80vh;display:flex;flex-direction:column}.win.dev-list .win-body{overflow:auto}`;

export function init() {
  document.head.append(el('style', { text: CSS }));
  G.dev = { on: () => !!D().on, set, open, unlockAll, get frozen() { return !!(D().on && D().needs); }, get all() { return !!(D().on && D().all); } };
  G.on('minutes', hold); setInterval(hold, 700);
  for (const ev of ['game:new', 'game:load', 'load']) G.on(ev, () => setTimeout(sync, 0));
  setTimeout(sync, 0); setInterval(sync, 2000);
}
