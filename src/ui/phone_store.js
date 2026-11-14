// Phone app: APPY — the app store (app id 'store'). Catalogue, install state and releases live in src/sim/apps.js (G.apps); styles in phone_apps.css.
// Pages: Discover (featured banner, New this week, categories, Coming soon) / Installed (open, remove) -> app page (Install / Open / Remove).
// Deep link: G.phone.open('store', { app: id } | { tab: 'installed' }).
// Also exports small helpers shared by the store-released apps: pickIcon, iconOf, goTo, cityPois, walkMin, injectCss.
import { G } from '../core/game.js';
import { el, iconEl, hasIcon, appIcon, btn, section, chip, empty, safe, cityPos, place } from './phone_util.js';
import { toast } from './kit.js';
import { CATALOG, CATEGORIES, STORE_NAME } from '../sim/apps.js';
export const order = 121;

export const pickIcon = ids => (ids || []).find(i => hasIcon(i)) || (ids && ids[0]) || 'ui.star';
export const iconOf = a => appIcon(a.id, 48, { iconId: a.iconIds ? pickIcon(a.iconIds) : undefined, color: a.color });
export const regDef = id => { const a = CATALOG.find(c => c.id === id) || { id, name: id }; return { id, name: a.name, question: a.tagline, iconId: pickIcon(a.iconIds), color: a.color, slot: 50 }; };
export const cityPois = () => safe(() => G.sceneCache.get('city').world.pois, []) || [];
export const walkMin = (a, b) => (a && b ? Math.max(1, Math.round((Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) / 3.8)) : null);
export const walkText = m => (m === null || m === undefined ? '' : m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min walk` : `${m} min walk`);
/** set a waypoint to a place id, a city poi id or {x, y, name}; closes the phone */
export function goTo(target, ctx, name) {
  let p = target; if (typeof target === 'string') p = place(target) || cityPois().find(q => q.id === target || q.id === 'door:' + target) || null;
  if (!p || typeof p.x !== 'number') { toast('Not sure where that is yet. Try Wander or the Map.'); return false; }
  const nm = name || p.name || 'Waypoint'; G.phone.setWaypoint(p.id && place(p.id) ? p.id : { x: p.x, y: p.y, name: nm }); if (ctx) ctx.close(); toast(`Waypoint set: ${nm}. Follow the arrow.`, 'good', 3200); return true;
}
export function injectCss() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/phone_apps.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/phone_apps.css' })); }

let tab = 'discover';
const A = () => G.apps;
const stars = r => el('span.as-stars', { 'aria-label': `Rated ${r} out of 5` }, [1, 2, 3, 4, 5].map(i => el('i' + (r >= i - .25 ? '.on' : r >= i - .75 ? '.half' : ''))), el('small', { text: r.toFixed(1) }));
const stateLabel = a => (a.soon ? 'Soon' : a.installed ? 'Open' : a.released ? 'Get' : 'Later');
function act(a, ctx) {
  if (a.soon) return toast(`${a.name} is still being built. We will tell you when it lands.`);
  if (a.installed) return G.phone.isUnlocked(a.id) ? G.phone.open(a.id) : toast(`${a.name} needs a little more before it works. ${a.desc}`);
  if (!a.released) return toast(`${a.name} is not out yet.`);
  if (A().install(a.id)) { toast(`${a.name} installed. It is on your home screen.`, 'good'); safe(() => G.audio.sfx('notify'), 0); ctx.refresh(); }
}
function appRow(a, ctx) {
  return el('div.as-row' + (a.soon ? '.soon' : ''), null,
    el('button.as-row-main', { 'aria-label': `${a.name}. ${a.tagline}`, onclick: () => ctx.push(a.name, (b, c) => page(b, c, a.id), 'app:' + a.id) }, iconOf(a),
      el('span.as-row-t', null, el('b', null, a.name, a.isNew && !a.installed ? el('em.as-new', { text: 'NEW' }) : null), el('small', { text: a.tagline }))),
    el('button.as-get' + (a.installed ? '.open' : a.released && !a.soon ? '.get' : '.off'), { text: stateLabel(a), onclick: () => act(a, ctx) }));
}
function page(b, ctx, id) {
  const a = A().get(id); if (!a) { b.append(empty('ui.warning', 'App not found', '')); return; }
  A().markSeen(id); b.classList.add('as-body');
  const main = a.soon ? btn('Coming soon', () => act(a, ctx), 'wide big') : a.installed ? btn('Open', () => act(a, ctx), 'good wide big') : a.released ? btn('Install  ·  Free', () => act(a, ctx), 'pri wide big') : btn('Not released yet', () => act(a, ctx), 'wide big');
  b.append(el('div.as-hero', { style: { background: (a.color || '#8a8fa3') + '33' } }, iconOf(a), el('div', null, el('b', { text: a.name }), el('span', { text: a.tagline }), a.rating ? stars(a.rating) : el('small', { text: 'Not rated yet' }))),
    main,
    el('div.as-facts', null, el('span', null, el('b', { text: a.soon ? 'TBA' : 'Free' }), el('small', { text: 'Price' })), el('span', null, el('b', { text: a.size || '?' }), el('small', { text: 'Size' })),
      el('span', null, el('b', { text: (CATEGORIES.find(c => c[0] === a.cat) || [0, 'App'])[1] }), el('small', { text: 'Category' })), el('span', null, el('b', { text: a.core ? 'Built in' : a.soon ? 'Soon' : a.released ? 'Out now' : 'Later' }), el('small', { text: 'Status' }))),
    el('p.as-desc', { text: a.desc }));
  if (a.does && a.does.length) b.append(section('What it does'), el('ul.as-does', null, a.does.map(t => el('li', { text: t }))));
  if (!a.released && !a.soon && a.release) b.append(el('p.as-note', { text: `Comes out after ${a.release.text}.` }));
  if (a.installed && !a.core) b.append(btn('Remove from phone', () => { if (A().uninstall(a.id)) { toast(`${a.name} removed. You can get it back here any time.`); ctx.refresh(); } }, 'wide'));
  if (a.core) b.append(el('p.as-note', { text: 'Part of the phone. It cannot be removed.' }));
}
function render(b, ctx) {
  if (!A()) { b.append(empty('ui.warning', 'Store is closed', 'Try again in a moment.')); return; }
  if (ctx.arg && ctx.arg.app) { const id = ctx.arg.app; ctx.arg.app = null; setTimeout(() => ctx.push((A().get(id) || {}).name || 'App', (bb, c) => page(bb, c, id), 'app:' + id), 0); return; } // pushing inside a render would be overwritten by it
  if (ctx.arg && ctx.arg.tab) { tab = ctx.arg.tab; ctx.arg.tab = null; }
  b.classList.add('as-body'); const cat = A().catalog(), live = cat.filter(a => !a.soon), pend = live.filter(a => a.pending);
  b.append(el('div.as-tabs', null, [['discover', 'Discover'], ['installed', `Installed (${live.filter(a => a.installed).length})`]].map(([k, n]) => el('button' + (tab === k ? '.on' : ''), { text: n, onclick: () => { tab = k; ctx.refresh(); } }))));
  if (tab === 'installed') {
    b.append(el('p.as-note', { text: 'Apps on your home screen. Built-in apps stay; anything else can be removed and fetched again later.' }));
    for (const a of live.filter(x => x.installed)) b.append(el('div.as-row', null,
      el('button.as-row-main', { onclick: () => ctx.push(a.name, (bb, c) => page(bb, c, a.id), 'app:' + a.id) }, iconOf(a), el('span.as-row-t', null, el('b', { text: a.name }), el('small', { text: a.core ? 'Built in' : `${a.size} · Free` }))),
      a.core ? el('span.as-core', { text: 'Core' }) : el('button.as-get.off', { text: 'Remove', onclick: () => { if (A().uninstall(a.id)) { toast(`${a.name} removed.`); ctx.refresh(); } } })));
    return;
  }
  const feat = pend[pend.length - 1] || live.filter(a => a.isNew).pop() || cat.find(a => a.id === 'tips');
  if (feat) b.append(el('button.as-feat', { style: { background: feat.color || '#3b82d6' }, 'aria-label': `Featured: ${feat.name}`, onclick: () => ctx.push(feat.name, (bb, c) => page(bb, c, feat.id), 'app:' + feat.id) },
    el('small', { text: feat.pending ? 'NEW ON ' + STORE_NAME.toUpperCase() : 'FEATURED' }), el('span.as-feat-r', null, iconOf(feat), el('span', null, el('b', { text: feat.name }), el('span', { text: feat.tagline })))));
  const fresh = live.filter(a => a.isNew || a.pending);
  b.append(section('New this week', fresh.length ? chip(String(fresh.length)) : null));
  if (fresh.length) for (const a of fresh.reverse()) b.append(appRow(a, ctx));
  else b.append(el('p.as-note', { text: 'Nothing new just yet. Apps come out as the days pass and as you try new things: ride a train, meet people, buy an outfit.' }));
  for (const [k, name] of CATEGORIES) { const list = live.filter(a => a.cat === k && a.released); if (!list.length) continue; b.append(section(name)); for (const a of list) b.append(appRow(a, ctx)); }
  const soon = cat.filter(a => a.soon), later = live.filter(a => !a.released);
  b.append(section('Coming soon'));
  for (const a of later) b.append(el('div.as-row.soon', null, el('span.as-row-main', null, el('span.as-mystery', { text: '?' }), el('span.as-row-t', null, el('b', { text: 'Something new' }), el('small', { text: `Comes out after ${a.release ? a.release.text : 'a while'}.` })))));
  for (const a of soon) b.append(appRow(a, ctx));
}

export function init() {
  injectCss(); if (!G.phone || !G.phone.registerApp || !G.apps) return;
  G.phone.registerApp(Object.assign(regDef('store'), { slot: 7.5, render, ownsLog: true, badge: () => safe(() => G.apps.pending().length, 0) }));
  safe(() => G.phone.unlock('store', true), 0);
}
