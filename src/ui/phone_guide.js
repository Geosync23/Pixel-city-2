// Phone app: WANDER — the Maple Bay guidebook (app id 'guide'). Content comes from G.guide (src/sim/guide.js); styles in phone_guide.css.
// Pages: cover/home (search, Today strip, favourites, chapter tiles, districts) -> chapter (filters + cards) -> entry (picture, prose, facts, active links),
//        What's On (dated agenda with add-to-planner) and the Stamp Book (things to try).
// Deep links: G.phone.open('guide', { entry: id } | { chapter: id } | { district: key } | { tab: 'whatson' | 'stamps' }).
import { G } from '../core/game.js';
import { objSprite } from '../engine/sprites.js';
import { el, iconEl, btn, section, kv, empty, safe, cityPos, weatherNow, isNight, weatherIcon, DISTRICT_NAME } from './phone_util.js';
import { toast } from './kit.js';
import { CHAPTER_BY_ID, DISTRICT_INFO, hash } from '../sim/_guide_data.js';
export const order = 120;
const DAY = 1440, WD = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const g = () => G.guide, St = () => G.state.guide;
const walkMin = e => { const p = g().pos(e); if (!p) return null; const c = cityPos(); return Math.max(1, Math.round((Math.abs(p.x - c.x) + Math.abs(p.y - c.y)) / 3.8)); };
const walkText = m => (m === null ? '' : m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min walk` : `${m} min walk`);
const dname = k => DISTRICT_NAME[k] || '';
const scr = {}, filters = {}; let query = '';
function keepScroll(b, key) { b.addEventListener('scroll', () => { scr[key] = b.scrollTop; }, { passive: true }); const y = scr[key] || 0; if (y) requestAnimationFrame(() => { b.scrollTop = y; }); }

/* ---------- pictures: pixel glyph vignettes + building thumbnails ---------- */
const GLYPH = {
  cup: ['....b..b....', '...b..b.....', '....b..b....', '.#########..', '.#aaaaaaa###', '.#aaaaaaa#.#', '.#aaaaaaa#.#', '.#aaaaaaa###', '.#aaaaaaa#..', '..#aaaaa#...', '...#####....', '.#########..'],
  bag: ['....####....', '...#....#...', '...#....#...', '.##########.', '.#aaaaaaaa#.', '.#aabaaaba#.', '.#aaaaaaaa#.', '.#aaaaaaaa#.', '.#aaaccaaa#.', '.#aaaccaaa#.', '.#aaaaaaaa#.', '.##########.'],
  mask: ['.##########.', '#aaaaaaaaaa#', '#a##aaaa##a#', '#a##aaaa##a#', '#aaaaaaaaaa#', '#aaaaaaaaaa#', '#a#aaaaaa#a#', '#aa######aa#', '.#aaaaaaaa#.', '..#aaaaaa#..', '...######...', '............'],
  book: ['............', '.####..####.', '#bbbb##bbbb#', '#b##b##b##b#', '#bbbb##bbbb#', '#b##b##b##b#', '#bbbb##bbbb#', '#b##b##b##b#', '#bbbb##bbbb#', '#aaaa##aaaa#', '.####..####.', '............'],
  tree: ['....####....', '..##aaaa##..', '.#aaabaaaa#.', '#aabaaaaaaa#', '#aaaaaabaaa#', '#aaaaaaaaaa#', '.#aaaaaaaa#.', '..###cc###..', '.....cc.....', '.....cc.....', '....cccc....', '............'],
  bell: ['............', '............', '.##......##.', '#aa#....#aa#', '#aa#....#aa#', '#aa######aa#', '#aaccccccaa#', '#aa######aa#', '#aa#....#aa#', '#aa#....#aa#', '.##......##.', '............'],
  tower: ['.....##.....', '.....##.....', '....#aa#....', '....#ba#....', '...#aaaa#...', '...#abba#...', '...#aaaa#...', '..#aabbaa#..', '..#aaaaaa#..', '..#abbbba#..', '.#aaaaaaaa#.', '############'],
  key: ['............', '............', '..####......', '.#aaaa#.....', '#aa##aa#....', '#aa##aa#####', '#aaaaaaaaaa#', '.#aaaa###a#a', '..####..#.#.', '............', '............', '............'],
  train: ['............', '.##########.', '#aaaaaaaaaa#', '#abbbaabbba#', '#abbbaabbba#', '#aaaaaaaaaa#', '#accaaaacca#', '#aaaaaaaaaa#', '.##########.', '..##....##..', '.#..#..#..#.', '............'],
  stamp: ['.....##.....', '.....##.....', '....#aa#....', '#####aa#####', '#aaaaaaaaaa#', '.#aaaaaaaa#.', '..#aaaaaa#..', '..#aaaaaa#..', '.#aaa##aaa#.', '.#aa#..#aa#.', '##.#....#.##', '............'],
  leaf: ['.....##.....', '....#aa#....', '.#..#aa#..#.', '#a##aaaa##a#', '#aaaaaaaaaa#', '.#aaaaaaaa#.', '##aaaaaaaa##', '#aaaaaaaaaa#', '.##aaaaaa##.', '...##aa##...', '.....cc.....', '.....cc.....'],
};
const mk = (w, h, cls) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.className = 'pix ' + (cls || ''); return c; };
function glyph(x, name, ox, oy, k, col, light = '#fff4dc', acc = '#f2c230') { const m = GLYPH[name] || GLYPH.stamp, pal = { '#': '#2a2733', a: col, b: light, c: acc }; m.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(ox + i * k, oy + j * k, k, k); } })); }
const skyCols = () => { const h = G.now().hf; return h < 6 || h >= 20.5 ? ['#1d2440', '#33406a'] : h < 8 || h >= 18 ? ['#f0a070', '#ffd9a0'] : ['#8fd0f0', '#d8f0fa']; };
function backdrop(x, w, h, tint) {
  const s = skyCols(); x.fillStyle = s[0]; x.fillRect(0, 0, w, h); x.fillStyle = s[1]; x.fillRect(0, Math.round(h * .45), w, h); x.fillStyle = '#ffffff55'; x.fillRect(Math.round(w * .12), Math.round(h * .16), Math.round(w * .22), 3); x.fillRect(Math.round(w * .6), Math.round(h * .28), Math.round(w * .18), 3);
  x.fillStyle = tint || '#6fae5a'; x.fillRect(0, h - Math.round(h * .2), w, h); x.fillStyle = '#2a273322'; x.fillRect(0, h - Math.round(h * .2), w, 2);
}
function vignette(c, e) { const x = c.getContext('2d'), w = c.width, h = c.height, ch = CHAPTER_BY_ID[e.chapter] || { color: '#b8862c' }, k = Math.max(2, Math.floor(h / 16)); backdrop(x, w, h, ch.color + 'cc'); x.fillStyle = '#fff4dc'; const r = k * 8; x.fillRect(w / 2 - r, h / 2 - r, r * 2, r * 2); x.fillStyle = '#2a2733'; x.fillRect(w / 2 - r, h / 2 + r, r * 2, 2); glyph(x, e.glyph, Math.round(w / 2 - 6 * k), Math.round(h / 2 - 6 * k), k, ch.color); }
let bldWorld = null, blds = [];
function nearestBuilding(e) {
  const w = safe(() => G.sceneCache.get('city').world, null); if (!w || !w.objs) return null;
  if (bldWorld !== w) { bldWorld = w; blds = w.objs.filter(o => o.B && o.a && (/^bld\./.test(o.id) || (o.B[3] - o.B[0]) * (o.B[4] - o.B[1]) >= 20 && o.B[5] - o.B[2] >= 2)); }
  let best = null, bd = 7;
  for (const o of blds) { const B = o.B, dx = Math.max(B[0] - e.x, 0, e.x - B[3]), dy = Math.max(B[1] - e.y, 0, e.y - B[4]), d = Math.hypot(dx, dy) + (/^bld\./.test(o.id) ? 0 : 1.5); if (d < bd) { bd = d; best = o; } }
  return best;
}
const thumbSrc = new Map();
function drawThumb(c, e) {
  const key = e.id + '|' + c.width; let src = thumbSrc.get(key);
  if (!src) {
    src = mk(c.width, c.height); const x = src.getContext('2d'); let ok = false;
    if (e.thumb === 'bld' && e.x !== undefined) { const ob = nearestBuilding(e), sp = ob && safe(() => objSprite(ob), null);
      if (sp && sp.c && sp.w > 4) { backdrop(x, src.width, src.height, '#9aa78a'); const m = 3, k = Math.min((src.width - m * 2) / sp.w, (src.height - m) / sp.h); x.imageSmoothingEnabled = k < 1; x.imageSmoothingQuality = 'medium'; x.drawImage(sp.c, Math.round((src.width - sp.w * k) / 2), Math.round(src.height - sp.h * k - 1), Math.round(sp.w * k), Math.round(sp.h * k)); ok = true; } }
    if (!ok) vignette(src, e); if (thumbSrc.size > 400) thumbSrc.clear(); thumbSrc.set(key, src);
  }
  c.getContext('2d').drawImage(src, 0, 0); c._done = 1;
}
let io = null, ioRoot = null;
function thumb(e, w = 96, h = 72, cls = 'wg-thumb') {
  const c = mk(w, h, cls); c._e = e;
  if (thumbSrc.has(e.id + '|' + w) || e.thumb !== 'bld') { drawThumb(c, e); return c; }
  c.getContext('2d').fillStyle = '#d9c9a6'; c.getContext('2d').fillRect(0, 0, w, h); c._lazy = 1; return c;
}
function watchThumbs(b) { // lazy-render building thumbnails as they scroll into view (never blocks the page build)
  const cs = [...b.querySelectorAll('canvas')].filter(c => c._lazy && !c._done); if (!cs.length) return;
  if (typeof IntersectionObserver === 'undefined') { let i = 0; const step = () => { if (i < cs.length) { drawThumb(cs[i], cs[i++]._e); setTimeout(step, 30); } }; return step(); }
  if (ioRoot !== b) { if (io) io.disconnect(); ioRoot = b; const q = []; let busy = false; const pump = () => { const c = q.shift(); if (!c) { busy = false; return; } if (c.isConnected && !c._done) safe(() => drawThumb(c, c._e), 0); setTimeout(pump, 12); };
    io = new IntersectionObserver(es => { for (const en of es) if (en.isIntersecting) { io.unobserve(en.target); q.push(en.target); } if (!busy && q.length) { busy = true; setTimeout(pump, 0); } }, { root: b, rootMargin: '160px' }); }
  cs.forEach(c => io.observe(c));
}

/* ---------- small pieces ---------- */
const badge = (text, cls) => el('span.wg-badge' + (cls ? '.' + cls : ''), { text });
function badges(e) {
  const o = g().openNow(e), m = walkMin(e), out = [];
  if (o.open !== null) out.push(badge(o.text, o.open ? 'open' : 'closed'));
  if (e.price) out.push(badge(e.price, 'price'));
  if (m !== null) out.push(badge(walkText(m), 'walk'));
  if (e.kind === 'place' && !g().known(e)) out.push(badge('Undiscovered', 'new'));
  if (e.kind === 'activity' && St().stamps[e.id] !== undefined) out.push(badge('Stamped', 'open'));
  return out;
}
const openEntry = (ctx, e) => ctx.push(e.title, (b, c) => entryPage(b, c, e), 'e:' + e.id);
function entryCard(e, ctx) {
  return el('button.wg-card', { 'aria-label': e.title, onclick: () => openEntry(ctx, e) }, thumb(e),
    el('span.wg-card-t', null, el('b', { text: e.title }), el('small', { text: [e.type, dname(e.district) || (e.when || '')].filter(Boolean).join(' · ') }), el('span.wg-badges', null, badges(e))),
    g().isFav(e.id) ? el('i.wg-ribbon') : null);
}
const cards = (list, ctx) => list.map(e => entryCard(e, ctx));
const dayLabel = d => { const t = Math.floor(G.state.t / DAY); return d === t ? 'Today' : d === t + 1 ? 'Tomorrow' : WD[d % 7]; };
const dateLine = d => `${WD[d % 7].slice(0, 3)} ${(d % 14) + 1} ${['Spring', 'Summer', 'Autumn', 'Winter'][Math.floor(d / 14) % 4]}`;
const planned = (e, t) => safe(() => G.planner.list(t - 1, t + 1, { events: false }).some(a => a.data && a.data.guide === e.id), false);
function planBtn(e, t, ctx, small) {
  if (planned(e, t.t)) return el('span.wg-added', null, iconEl('ui.check', 1), small ? 'Planned' : 'In your planner');
  return btn(small ? 'Plan' : `Add to planner · ${dayLabel(t.day)} ${t.clock}`, ev => { ev.stopPropagation();
    const id = safe(() => G.planner.add({ title: e.title, placeId: e.placeId || undefined, t: t.t, dur: Math.min(t.dur || 60, 240), kind: 'event', data: { guide: e.id } }), null);
    ctx.tip(id ? `Added: ${e.title}, ${dayLabel(t.day)} ${t.clock}` : 'Could not add that to the planner.'); ctx.refresh(); }, small ? 'gold' : 'gold wide', 'ui.calendar');
}
function goThere(e, ctx) { const p = g().pos(e); if (!e.placeId && !p) return; const d = e.placeId || { x: p.x, y: p.y, name: e.title };
  if (G.phone.routeTo && G.phone.routeTo(d)) return;   // the Map's route card: on foot / bus / train / cab (owner msg 81)
  G.phone.setWaypoint(d); ctx.close(); toast(`Waypoint set: ${e.title}. Follow the arrow.`, 'good', 3200); }

/* ---------- cover / home ---------- */
function coverCanvas() {
  const c = mk(180, 60, 'wg-sky'), x = c.getContext('2d'), s = skyCols(); x.fillStyle = s[0]; x.fillRect(0, 0, 180, 60); x.fillStyle = s[1]; x.fillRect(0, 30, 180, 30);
  x.fillStyle = '#fff4dc'; x.fillRect(140, 8, 10, 10); let sx = 0, i = 0;
  while (sx < 180) { const r = hash('sk' + i++), w = 8 + r % 12, h = 12 + (r >> 4) % 30; x.fillStyle = ['#3a4466', '#4a557a', '#2f3858'][r % 3]; x.fillRect(sx, 52 - h, w, h); x.fillStyle = '#f2c23099'; for (let yy = 54 - h; yy < 48; yy += 5) for (let xx = sx + 2; xx < sx + w - 2; xx += 4) if ((hash(i + ':' + xx + ':' + yy) & 3) === 0) x.fillRect(xx, yy, 2, 2); sx += w + 1; }
  x.fillStyle = '#2f6f8c'; x.fillRect(0, 52, 180, 8); x.fillStyle = '#ffffff44'; for (let k = 0; k < 12; k++) x.fillRect((hash('w' + k) % 170), 54 + k % 3 * 2, 6, 1);
  return c;
}
function emblem() { const c = mk(28, 28, 'wg-emblem'), x = c.getContext('2d'); glyph(x, 'leaf', 2, 2, 2, '#e05a3a', '#fff4dc', '#8a5a2c'); return c; }
function resultsInto(box, ctx) {
  box.replaceChildren(); if (!query.trim()) return; const r = g().search(query).slice(0, 30);
  box.append(el('div.wg-sub', { text: r.length ? `${r.length}${r.length === 30 ? '+' : ''} result${r.length === 1 ? '' : 's'} for "${query}"` : `Nothing in the guide matches "${query}".` }), ...cards(r, ctx)); watchThumbs(ctx.body);
}
function homePage(b, ctx) {
  const n = G.now(), G_ = g(), st = G_.stats(), try_ = G_.thingsToTry(), done = try_.filter(t => t.done).length, day = Math.floor(G.state.t / DAY);
  b.classList.add('wg');
  b.append(el('div.wg-cover', null, coverCanvas(), el('div.wg-cover-t', null, emblem(), el('div', null, el('h1', { text: 'WANDER' }), el('span', { text: 'The Maple Bay Guidebook' }))),
    el('small', { text: `${n.seasonName} edition · Year ${n.year} · ${st.total} places & things to do` })));
  const res = el('div.wg-list'), inp = el('input.wg-search', { type: 'search', placeholder: 'Search places, food, things to do…', 'aria-label': 'Search the guide', value: query, oninput: () => { query = inp.value; resultsInto(res, ctx); } });
  b.append(inp, res); resultsInto(res, ctx);
  b.append(el('div.wg-two', null,
    el('button.wg-big.on', { onclick: () => ctx.push("What's On", whatsOnPage, 'whatson') }, iconEl('ui.calendar', 2), el('b', { text: "What's On" }), el('small', { text: 'This week' })),
    el('button.wg-big.st', { onclick: () => ctx.push('Stamp Book', stampPage, 'stamps') }, iconEl('ui.star', 2), el('b', { text: 'Stamp Book' }), el('small', { text: `${done} / ${try_.length} stamps` }))));
  // Today strip
  const strip = el('div.wg-strip'), w = weatherNow(), tile = (kicker, title, sub, onclick, pic) => el('button.wg-today', { onclick }, pic || null, el('em', { text: kicker }), el('b', { text: title }), el('small', { text: sub || '' }));
  if (w) strip.append(tile('Weather', `${w.name} ${w.tempC}°C`, w.wet ? 'Take an umbrella, or a cab.' : isNight() ? 'A fine night for a show.' : 'A good day for a walk.', () => ctx.push('Outdoors & Parks', (bb, c) => chapterPage(bb, c, 'outdoors'), 'ch:outdoors'), iconEl(weatherIcon(w.kind, isNight()), 2)));
  const on = G_.whatsOn().filter(o => o.day === day), seenT = new Set(), hi = []; for (const o of on) { if (!seenT.has(o.entryId)) { seenT.add(o.entryId); hi.push(o); } if (hi.length >= 3) break; }
  for (const o of hi) strip.append(tile(o.kind === 'event' ? 'Today' : 'Tonight · ' + o.clock, o.title, o.venue, () => openEntry(ctx, G_.get(o.entryId)), iconEl('ui.calendar', 2)));
  const gem = G_.hiddenGem(); if (gem) strip.append(tile('Hidden gem', gem.title, `${gem.type} · ${dname(gem.district)}`, () => openEntry(ctx, gem), thumb(gem, 64, 48, 'wg-tp')));
  const c = cityPos(), near = G_.near(c.x, c.y, 1, e => e.chapter !== 'transit')[0]; if (near) strip.append(tile('Near you', near.title, `${near.type} · ${walkText(walkMin(near))}`, () => openEntry(ctx, near), thumb(near, 64, 48, 'wg-tp')));
  b.append(section('Today in Maple Bay', el('small', { text: `${n.weekdayName} ${n.dayOfMonth} ${n.seasonName}` })), strip);
  const favs = G_.favs(); if (favs.length) b.append(section('Your bookmarks'), el('div.wg-list', null, cards(favs, ctx)));
  b.append(section('Chapters'));
  b.append(el('div.wg-chapters', null, G_.chapters().map(ch => { const cv = mk(64, 40, 'wg-chpic'); vignette(cv, { chapter: ch.id, glyph: ch.glyph });
    return el('button.wg-ch', { style: '--c:' + (ch.color), onclick: () => ctx.push(ch.name, (bb, cc) => chapterPage(bb, cc, ch.id), 'ch:' + ch.id) }, cv, el('b', { text: ch.name }), el('small', { text: `${st.byChapter[ch.id]} entries` })); })));
  b.append(section('Browse by district'));
  b.append(el('div.wg-districts', null, G_.districts().map(d => el('button.wg-dist', { style: '--c:' + (d.color || '#888'), onclick: () => ctx.push(d.name, (bb, cc) => districtPage(bb, cc, d), 'd:' + d.id) }, el('b', { text: d.name }), el('small', { text: d.line || '' }), el('em', { text: `${G_.byDistrict(d.id).length} entries` })))));
  b.append(el('p.wg-foot', { text: 'Wander lists every place in town, found or not. Tap "Take me there" on any page, pick how to travel, and follow the arrow.' }));
  keepScroll(b, 'home'); watchThumbs(b);
}

/* ---------- chapter / district lists ---------- */
function listPage(b, ctx, key, all, head, opts = {}) {
  b.classList.add('wg'); const f = filters[key] = filters[key] || { d: '', open: false, price: '', disc: '' };
  b.append(head);
  const out = el('div.wg-list'), bar = el('div.wg-filters'), count = el('div.wg-sub');
  const draw = () => {
    bar.replaceChildren();
    if (!opts.noDistrict) { const sel = el('select.wg-sel', { 'aria-label': 'District', onchange: () => { f.d = sel.value; draw(); } }, el('option', { value: '', text: 'All districts' }), G.guide.districts().map(d => el('option', { value: d.id, text: d.name }))); sel.value = f.d; bar.append(sel); }
    const tg = (label, on, fn) => bar.append(el('button.ph-chip' + (on ? '.on' : ''), { 'aria-pressed': String(!!on), onclick: () => { fn(); draw(); } }, label));
    tg('Open now', f.open, () => { f.open = !f.open; }); for (const p of ['Free', '$', '$$', '$$$']) tg(p, f.price === p, () => { f.price = f.price === p ? '' : p; });
    tg('New to me', f.disc === 'new', () => { f.disc = f.disc === 'new' ? '' : 'new'; }); tg('Discovered', f.disc === 'known', () => { f.disc = f.disc === 'known' ? '' : 'known'; });
    let l = all.filter(e => (!f.d || e.district === f.d) && (!f.open || g().openNow(e).open === true) && (!f.price || (f.price === 'Free' ? /free/i.test(e.price || '') : e.price === f.price)) && (!f.disc || (e.kind === 'place' && !e.parent && g().known(e) === (f.disc === 'known'))));
    const wm = new Map(l.map(e => [e, walkMin(e)])); l = l.slice().sort((a, c) => (a.kind === 'place' || a.kind === 'transit' ? 0 : 1) - (c.kind === 'place' || c.kind === 'transit' ? 0 : 1) || (wm.get(a) === null ? 1e6 : wm.get(a)) - (wm.get(c) === null ? 1e6 : wm.get(c)) || a.title.localeCompare(c.title));
    count.textContent = `${l.length} of ${all.length} entries · nearest first`;
    out.replaceChildren(...(l.length ? cards(l, ctx) : [empty('ui.search', 'No entries match', 'Loosen a filter or two.')])); watchThumbs(b);
  };
  b.append(bar, count, out); draw(); keepScroll(b, key);
}
function chapterPage(b, ctx, id) {
  const ch = CHAPTER_BY_ID[id], cv = mk(96, 60, 'wg-chhero'); vignette(cv, { chapter: id, glyph: ch.glyph });
  const head = el('div.wg-chhead', { style: '--c:' + (ch.color) }, cv, el('div', null, el('em', { text: 'Chapter ' + (G.guide.chapters().indexOf(ch) + 1) }), el('h2', { text: ch.name }), el('p', { text: ch.line })));
  const extra = id === 'shows' ? btn("What's on this week", () => ctx.push("What's On", whatsOnPage, 'whatson'), 'gold wide', 'ui.calendar') : id === 'try' ? btn('Open the Stamp Book', () => ctx.push('Stamp Book', stampPage, 'stamps'), 'gold wide', 'ui.star') : null;
  listPage(b, ctx, 'ch:' + id, g().byChapter(id), el('div', null, head, extra));
}
function districtPage(b, ctx, d) {
  const head = el('div.wg-chhead', { style: '--c:' + (d.color || '#888') }, el('div', null, el('em', { text: 'District' }), el('h2', { text: d.name }), el('p', { text: d.line || '' })));
  listPage(b, ctx, 'd:' + d.id, g().byDistrict(d.id), head, { noDistrict: true });
}

/* ---------- entry page ---------- */
function entryPage(b, ctx, e) {
  b.classList.add('wg'); St().seen[e.id] = 1; const G_ = g(), o = G_.openNow(e), m = walkMin(e), ch = CHAPTER_BY_ID[e.chapter] || {}, pos = G_.pos(e);
  const hero = thumb(e, 192, 120, 'wg-hero'); if (hero._lazy) setTimeout(() => safe(() => drawThumb(hero, e), 0), 30);
  const fav = el('button.wg-fav' + (G_.isFav(e.id) ? '.on' : ''), { 'aria-label': 'Bookmark', 'aria-pressed': String(G_.isFav(e.id)), onclick: () => { const on = G_.fav(e.id); fav.classList.toggle('on', on); fav.setAttribute('aria-pressed', String(on)); ctx.tip(on ? 'Bookmarked. It is on the Wander cover page.' : 'Bookmark removed.'); } });
  b.append(el('div.wg-herobox', null, hero, fav), el('div.wg-title', { style: '--c:' + (ch.color || '#b8862c') }, el('em', { text: [ch.name, e.type].filter(Boolean).join(' · ') }), el('h2', { text: e.title }), el('span.wg-badges', null, badges(e))), el('p.wg-prose', { text: e.blurb }));
  // hand-made rooms: the signature piece + "try this" list (src/sim/guide.js fills them from placeInfo)
  if (e.signature) b.append(el('p.wg-hint', null, el('b', { text: 'Don\'t miss: ' }), e.signature));
  if (e.tryThis && e.tryThis.length) b.append(section('Try this'), el('ul.wg-try', { style: 'margin:2px 0 6px;padding-left:20px;font-size:14px;line-height:1.45;color:#3a3026' }, e.tryThis.map(t => el('li', { text: t }))));
  // active links
  const acts = el('div.wg-actions');
  if (e.placeId || pos) acts.append(btn('Take me there', () => goThere(e, ctx), 'pri wide big', 'ui.pin'));
  const ts = e.kind === 'show' || e.kind === 'event' ? G_.times(e, e.kind === 'event' ? 56 : 7).slice(0, 5) : [];
  if (ts.length) acts.append(planBtn(e, ts[0], ctx));
  if (e.placeId && e.kind !== 'transit' || (e.placeId && e.type === 'Light rail station')) acts.append(el('div.wg-two', null, btn('Call a cab', () => ctx.open('taxi', { place: e.placeId }), '', 'transport.taxi'), btn('Show on map', () => ctx.open('map', { place: e.placeId }), '', 'ui.search')));
  b.append(acts);
  if (e.kind === 'show') b.append(el('p.wg-hint', { text: `Tickets ${e.price} at the box office${e.when ? ' — ' + e.when.replace(/^At /, 'in the lobby of ') : ''}. Doors open 15 minutes before the show.` }));
  if (ts.length) { b.append(section(e.kind === 'show' ? 'Showtimes' : 'Next dates')); b.append(el('div.wg-facts', null, ts.map(t => el('div.wg-time', null, el('span', null, el('b', { text: `${dayLabel(t.day)} ${t.clock}` }), el('small', { text: dateLine(t.day) })), planBtn(e, t, ctx, true))))); }
  else if (e.kind === 'event') b.append(el('p.wg-hint', { text: 'Not on in the next few weeks. ' + (e.when || '') }));
  // facts
  const facts = el('div.wg-facts');
  if (e.address) facts.append(kv('Address', e.address)); if (e.district) facts.append(kv('District', dname(e.district)));
  if (e.when) facts.append(kv('When', e.when)); if (e.minutes) facts.append(kv('Runs', e.minutes + ' min'));
  if (e.hours) { facts.append(kv('Today', (o.open ? 'Open · ' : 'Closed · ') + o.hours, o.open ? 'good' : 'bad')); const today = Math.floor(G.state.t / DAY) % 7;
    facts.append(el('details.wg-week', null, el('summary', { text: 'Hours all week' }), WD.map((dn, i) => { const h = e.hours[i]; return kv(dn + (i === today ? ' (today)' : ''), h ? (h[0] === 0 && h[1] >= 24 ? '24 hours' : `${fmtH(h[0])} - ${fmtH(h[1])}`) : 'Closed'); }))); }
  if (e.price) facts.append(kv(e.kind === 'transit' ? 'Fare' : 'Price', e.price)); if (m !== null) facts.append(kv('From here', walkText(m)));
  if (pos && e.kind !== 'transit') { const nt = G_.nearestTransit(e); if (nt.station) facts.append(kv('Nearest station', `${nt.station.name} · ${walkText(Math.max(1, Math.round(nt.station.dist / 3.8)))}`)); if (nt.stop) facts.append(kv('Nearest bus stop', `${nt.stop.name} · ${walkText(Math.max(1, Math.round(nt.stop.dist / 3.8)))}`)); }
  if (e.kind === 'place' && !e.parent) facts.append(kv('Status', G_.known(e) ? 'Discovered' : 'Not visited yet', G_.known(e) ? 'good' : ''));
  if (e.station) for (const t of safe(() => G.rail.nextTrains(e.station), []).slice(0, 2)) facts.append(kv('Next train', `${t.line || ''} to ${t.toward} · ${Math.max(0, Math.round(t.minutes))} min`));
  if (facts.children.length) b.append(section('The facts'), facts);
  const chips = (title, ids) => { const l = (ids || []).map(id => G_.get(id)).filter(Boolean); if (l.length) b.append(section(title), el('div.wg-chips', null, l.map(x => el('button.ph-chip', { onclick: () => openEntry(ctx, x) }, x.title)))); };
  if (e.line) { b.append(section('The loop, station by station'), el('div.wg-line', null, e.line.map(s => el('button.wg-stop', { onclick: () => { const x = G_.get(s.id); if (x) openEntry(ctx, x); } }, el('i'), el('span', { text: s.name }))))); }
  if (e.stops) b.append(section('Stops on this route'), el('div.wg-line', { style: '--c:' + (e.color || '#3a3644') }, e.stops.map(s => el('button.wg-stop', { onclick: () => { if (G.phone.routeTo && G.phone.routeTo(s.id)) return; G.phone.setWaypoint(s.id); ctx.close(); toast(`Waypoint set: ${s.name} bus stop.`, 'good'); } }   /* route card (owner msg 81) */, el('i'), el('span', { text: s.name })))));
  if (e.stands) chips('Taxi stands', e.stands.map(s => 'place:' + s.id));
  chips(e.kind === 'place' ? 'What you can do here' : 'Goes well with', e.acts);
  const kids = G_.all().filter(x => x.parent === e.id && !(e.acts || []).includes(x.id)); if (kids.length) b.append(section(e.id === 'place:deptstore' ? 'Shops inside' : 'Here you will find'), el('div.wg-list', null, cards(kids, ctx)));
  if (e.where && e.where.length) b.append(section(e.where.length > 1 ? 'Where to do it' : 'Where'), el('div.wg-list', null, cards(e.where.map(id => G_.get(id)).filter(Boolean).sort((a, c) => (walkMin(a) || 0) - (walkMin(c) || 0)).slice(0, 8), ctx)));
  if (e.parent && G_.get(e.parent)) b.append(section('Part of'), el('div.wg-list', null, cards([G_.get(e.parent)], ctx)));
  if (pos && !e.parent) { const nb = G_.near(pos.x, pos.y, 5).filter(x => x.id !== e.id && x.x !== e.x).slice(0, 3); if (nb.length) b.append(section('Also nearby'), el('div.wg-list', null, cards(nb, ctx))); }
  const like = G_.byChapter(e.chapter).filter(x => x.id !== e.id && x.kind === e.kind && (x.type === e.type || e.kind !== 'place')), off = like.length ? hash(e.id) % like.length : 0, more = [...like.slice(off), ...like.slice(0, off)].slice(0, 3);
  if (more.length) b.append(section('More like this'), el('div.wg-list', null, cards(more, ctx)));
  keepScroll(b, 'e:' + e.id); watchThumbs(b);
}
const fmtH = h => { const mm = Math.round(((h % 24) + 24) % 24 * 60); return String(Math.floor(mm / 60) % 24).padStart(2, '0') + ':' + String(mm % 60).padStart(2, '0'); };

/* ---------- What's On ---------- */
function whatsOnPage(b, ctx) {
  b.classList.add('wg'); const G_ = g(), on = G_.whatsOn();
  b.append(el('div.wg-chhead', { style: '--c:' + ('#8a4fc0') }, el('div', null, el('em', { text: 'This week' }), el('h2', { text: "What's On" }), el('p', { text: 'Films, concerts, plays and city events for the next seven days. Add anything to your planner and it will remind you.' }))));
  if (!on.length) return b.append(empty('ui.calendar', 'A quiet week', 'Nothing scheduled. Try the Things To Try chapter instead.'));
  let cur = -1;
  for (const o of on) { const e = G_.get(o.entryId);
    if (o.day !== cur) { cur = o.day; b.append(el('div.wg-day', null, el('b', { text: dayLabel(o.day) }), el('span', { text: dateLine(o.day) }))); }
    b.append(el('div.wg-on.' + o.kind, { role: 'button', tabindex: '0', onclick: () => openEntry(ctx, e) }, el('span.wg-clock', { text: o.clock }), el('span.wg-on-t', null, el('b', { text: o.title }), el('small', { text: [o.type, o.venue, o.price !== null ? safe(() => G.money.fmt(o.price), '$' + o.price) : ''].filter(Boolean).join(' · ') })), planBtn(e, o, ctx, true))); }
  keepScroll(b, 'whatson');
}

/* ---------- Stamp book ---------- */
function stampPage(b, ctx) {
  b.classList.add('wg', 'wg-stampbook'); const G_ = g(), items = G_.thingsToTry(), done = items.filter(i => i.done).length, fresh = new Set(G_.fresh());
  b.append(el('div.wg-chhead', { style: '--c:' + ('#b8862c') }, el('div', null, el('em', { text: 'Things To Try' }), el('h2', { text: 'Stamp Book' }), el('p', { text: 'Do it once, anywhere in Maple Bay, and it is stamped for good.' }),
    el('div.wg-prog', { role: 'progressbar', 'aria-valuenow': done, 'aria-valuemax': items.length, 'aria-label': `${done} of ${items.length} stamps` }, el('i', { style: { width: (items.length ? done / items.length * 100 : 0) + '%' } }), el('span', { text: `${done} / ${items.length} stamps` })))));
  for (const grp of G_.stampGroups()) { const l = items.filter(i => i.group === grp); if (!l.length) continue; const n = l.filter(i => i.done).length;
    b.append(section(grp, el('small', { text: n === l.length ? 'Complete!' : `${n} / ${l.length}` })));
    b.append(el('div.wg-stamps', null, l.map(it => { const cv = mk(28, 28, 'wg-stpic'), col = it.done ? ['#c2412f', '#2f6fb8', '#2f8a4a', '#8a4fc0', '#b8862c'][hash(it.id) % 5] : '#b9ad92'; glyph(cv.getContext('2d'), it.glyph, 2, 2, 2, col, '#fff4dc', it.done ? '#f2c230' : '#d9c9a6');
      return el('button.wg-stamp' + (it.done ? '.done' : '') + (fresh.has(it.id) ? '.fresh' : ''), { style: `--c:${col};--r:${hash(it.id + 'r') % 13 - 6}deg`, 'aria-label': `${it.title}, ${it.done ? 'stamped' : 'not yet'}`, onclick: () => { const e = it.entry && G_.get(it.entry); if (e) openEntry(ctx, e); else ctx.tip(it.hint || it.title); } },
        el('span.wg-ink', null, cv, it.done ? el('em', { text: 'Day ' + ((it.day || 0) + 1) }) : null), el('small', { text: it.title })); }))); }
  keepScroll(b, 'stamps');
}

/* ---------- app ---------- */
function render(b, ctx) {
  if (!g()) return b.append(empty('ui.search', 'Wander is being printed', 'The guidebook will be ready in a moment.'));
  const a = ctx.arg;
  if (a && !a._used) { a._used = 1; let go = null;
    if (a.entry && g().get(a.entry)) { const e = g().get(a.entry); go = () => openEntry(ctx, e); }
    else if (a.chapter && CHAPTER_BY_ID[a.chapter]) go = () => ctx.push(CHAPTER_BY_ID[a.chapter].name, (bb, c) => chapterPage(bb, c, a.chapter), 'ch:' + a.chapter);
    else if (a.district && DISTRICT_INFO[a.district]) { const d = g().districts().find(x => x.id === a.district); go = () => ctx.push(d.name, (bb, c) => districtPage(bb, c, d), 'd:' + d.id); }
    else if (a.tab === 'whatson') go = () => ctx.push("What's On", whatsOnPage, 'whatson'); else if (a.tab === 'stamps' || a.tab === 'try') go = () => ctx.push('Stamp Book', stampPage, 'stamps');
    if (go) setTimeout(go, 0);
  }
  homePage(b, ctx);
}
function injectCss() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/phone_guide.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/phone_guide.css' })); }
export function init() {
  injectCss(); if (!G.phone || !G.phone.registerApp) return;
  G.phone.registerApp({ id: 'guide', name: 'Wander', question: 'Where shall we go?', iconId: 'ui.star', color: '#b23a2e', slot: -1, render,
    noBadge: true, badge: () => 0 });   /* no notification counter on Wander at all (owner msg 87); new places still show a NEW tag inside the app */
  safe(() => G.phone.unlock && G.phone.unlock('guide'), 0);
}
