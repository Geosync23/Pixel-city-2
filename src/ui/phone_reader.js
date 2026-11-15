// Phone app: PAGES (app id 'pages') — read a book. Rules, state and the fun table: src/sim/media.js + src/data/media.js. Styles: phone_media.css.
//   Library   26 original short reads you actually read on screen, page by page (src/story/shortreads.js): shelves by genre, "New this week",
//             the six-part serial arriving over the first days, bookmarks, a reading streak, Continue.
//   My books  every novel and skill book in your backpack: read it here in 15 / 30 / 60-minute sittings with the SAME progress, xp and
//             Good Book moodlet as at a bookshelf (G.state.inv.books), a little slower and less fun than the armchair. More titles: bookshops.
//   Reading   Aa (three sizes), night mode, bookmark, tap the right / left half or the buttons to turn, Skim (finish the page at once).
//             Time passes at reading speed while a page is open (it stops counting if you leave the page open and walk away).
// Deep link: G.phone.open('pages', { read: id } | { tab: 'books' }).
// Also exports the small helpers the three media apps share: injectMediaCss, screenBar, onTick, fmtMin.
import { G } from '../core/game.js';
import { el, iconEl, btn, section, chip, empty, safe, bar, row } from './phone_util.js';
import { toast } from './kit.js';
import { regDef, goTo } from './phone_store.js';
import { GENRES } from '../story/shortreads.js';
import { TUNE } from '../data/media.js';
import '../art/icons/media.js';
export const order = 126;

/* ---------- shared by Pages / Reel / PlayBox ---------- */
export function injectMediaCss() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/phone_media.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/phone_media.css' })); }
export const fmtMin = m => { m = Math.round(m); return m >= 60 ? (m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`) : `${m} min`; };
/** the "how much fun is this right now" strip every media app shows on its home page */
export function screenBar(kind) {
  const M = G.media, r = M.rate(kind), p = M.pool(), C = TUNE.SCREEN, tired = p.minutes >= C.taper;
  const txt = tired ? 'Screen time is used up for today: hardly any fun left in it.' : p.minutes > C.full ? 'Getting square-eyed: the fun is running thin.' : `About ${Math.round(p.left)} good minutes of screen time left today.`;
  return el('div.md-screen' + (tired ? '.low' : ''), null,
    el('div.md-screen-top', null, iconEl('need.fun', 1), el('b', { text: `Fun +${r.fun.toFixed(1)}/h` }), el('span', { text: txt })),
    bar(Math.min(p.minutes, C.taper), C.taper, tired ? '#b8b0a0' : p.minutes > C.full ? '#f2c230' : '#e0703a', `Screen time today: ${Math.round(p.minutes)} minutes`),
    r.label && !tired ? el('small.md-ctx', { text: r.label }) : null);
}
/** per-frame callback while `node` is on screen; stops by itself (and calls onStop) when the node leaves the page or the phone closes */
const ticks = new Set(); let hooked = false;
export function onTick(node, fn, onStop) {
  const t = { node, fn, onStop, seen: false }; ticks.add(t);
  if (!hooked) { hooked = true; G.on('frame', dt => { for (const k of [...ticks]) { if (k.node.isConnected) { k.seen = true; try { k.fn(Math.min(.1, dt)); } catch (e) { console.error('media tick', e); ticks.delete(k); } } else if (k.seen || (k.age = (k.age || 0) + 1) > 30) { ticks.delete(k); try { k.onStop && k.onStop(); } catch (e) { console.error(e); } } } }); }
  return () => { if (ticks.delete(t)) try { onStop && onStop(); } catch (e) { console.error(e); } };
}

/* ---------- Pages ---------- */
const M = () => G.media;
let tab = 'library';
const FONT = [15, 17, 21], LH = 1.5;
const dayName = d => { const t = Math.floor(G.state.t / 1440), k = d - t; return k <= 0 ? 'today' : k === 1 ? 'tomorrow' : safe(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][((d % 7) + 7) % 7], `in ${k} days`); };

function readRow(r, ctx) {
  const st = r.done ? 'Read' : r.page > 0 ? `Page ${r.page + 1}` : r.isNew ? 'NEW' : '';
  return el('button.md-read' + (r.done ? '.done' : ''), { onclick: () => openRead(ctx, r.id) },
    el('span.md-read-m', null, el('b', { text: r.title }), el('small', { text: `${r.by} · ${fmtMin(r.minutes)}` })),
    st ? el('em.md-tag' + (st === 'NEW' ? '.new' : r.done ? '.ok' : ''), { text: st }) : null);
}
function library(b, ctx) {
  const L = M().reads(), rel = L.filter(r => r.released), st = M().streak(), last = M().lastRead();
  b.append(el('div.md-top', null, chip(st.n ? `${st.n}-day reading streak` : 'No streak yet: finish a read today', st.n ? 'gold' : ''), st.best > 1 ? chip('Best ' + st.best) : null), screenBar('read'));
  const cont = last && last.kind === 'read' ? rel.find(r => r.id === last.id && r.page > 0 && !r.done) : null;
  if (cont) b.append(section('Continue'), el('button.md-cont', { onclick: () => openRead(ctx, cont.id) }, iconEl('novel_lighthouse', 2), el('span', null, el('b', { text: cont.title }), el('small', { text: `Page ${cont.page + 1} · ${cont.by}` })), el('em', { text: 'Read' })));
  const fresh = rel.filter(r => r.isNew);
  if (fresh.length) { b.append(section('New this week', chip(String(fresh.length), 'gold'))); for (const r of fresh) b.append(readRow(r, ctx)); }
  const marks = M().marks();
  if (marks.length) { b.append(section('Bookmarks')); for (const m of marks.slice(0, 6)) { const r = L.find(x => x.id === m.id); if (r) b.append(el('div.md-mark', null, el('button', { onclick: () => openRead(ctx, r.id, m.page) }, iconEl('ui.star', 1), el('span', null, el('b', { text: r.title }), el('small', { text: `Page ${m.page + 1}` }))), el('button.md-x', { 'aria-label': 'Remove bookmark', text: 'x', onclick: () => { M().unmark(m.id, m.page); ctx.refresh(); } }))); } }
  for (const [gid, gname] of GENRES) {
    const list = rel.filter(r => r.genre === gid); if (!list.length) continue;
    b.append(section(gname, chip(`${list.filter(r => r.done).length}/${list.length}`)));
    for (const r of list) b.append(readRow(r, ctx));
    const nx = L.find(r => r.genre === gid && !r.released && r.serial && rel.some(q => q.serial && q.serial.id === r.serial.id));
    if (nx) b.append(el('div.md-soon', { text: `Part ${nx.serial.part} of ${nx.serial.of} arrives ${dayName(nx.day)}.` }));
  }
  const later = L.filter(r => !r.released && !r.serial).length;
  if (later) b.append(el('p.md-note', { text: `${later} more ${later === 1 ? 'piece arrives' : 'pieces arrive'} over the next days. Pages tells you when.` }));
}
function myBooks(b, ctx) {
  const L = M().books();
  b.append(screenBar('book_novel'));
  if (!L.length) b.append(empty('novel_lighthouse', 'No books in your bag', 'Buy a novel or a skill book and it appears here, ready to read anywhere.'));
  else b.append(section('In your backpack', chip(String(L.length))));
  for (const k of L) {
    const it = k.item, skill = k.kind === 'skill';
    b.append(el('div.ph-card.md-book', null,
      el('div.md-book-top', null, iconEl(it.id, 3, 'book'), el('span', null, el('b', { text: it.name }), el('small', { text: skill ? `${it.skill[0].toUpperCase() + it.skill.slice(1)} skill book · levels ${it.minLevel}-${it.maxLevel}` : `Novel · ${fmtMin(it.readMinutes)} to read` }))),
      el('div.md-book-bar', null, bar(k.pct * 100, 100, skill ? '#3b5bdb' : '#e0703a'), el('small', { text: Math.round(k.pct * 100) + '%' })),
      k.blocked ? el('small.md-warn', { text: k.blocked }) : null,
      el('div.md-sit', null, el('span', { text: 'Read for' }), TUNE.bookSittings.map(m => el('button', { text: m + ' min', disabled: !!k.blocked && k.pct >= 1, onclick: () => ctx.push(it.name, (bb, c) => sitting(bb, c, it.id, m), 'sit') })))));
  }
  b.append(el('div.ph-card.md-shop', null, el('b', { text: 'More titles' }), el('small', { text: 'Dog-Eared Books in Old Town sells novels and skill books. The library lends them free, and an armchair at home is still the best place to read one.' }),
    el('div.md-acts', null, btn('Dog-Eared Books', () => goTo('bookstore', ctx, 'Dog-Eared Books'), 'pri', 'ui.pin'), btn('Library', () => goTo('library', ctx, 'Maple Bay Library'), '', 'ui.pin'))));
}
function render(b, ctx) {
  injectMediaCss(); b.classList.add('md-body');
  const a = ctx.arg; if (a && a.tab) { tab = a.tab; a.tab = null; }
  if (a && a.read) { const id = a.read; a.read = null; const r = M().read(id); if (r && r.released) setTimeout(() => openRead(ctx, id), 0); }
  b.append(el('div.md-tabs', null, [['library', 'Library'], ['books', 'My books']].map(([id, name]) => el('button' + (tab === id ? '.on' : ''), { text: name, onclick: () => { tab = id; ctx.refresh(); } }))));
  if (tab === 'books') myBooks(b, ctx); else library(b, ctx);
}

/* ---------- reading a short read ---------- */
let meas = null;
function paginate(text, fontPx, width, height) {
  if (!meas) meas = document.createElement('canvas').getContext('2d');
  meas.font = `500 ${fontPx}px "Pixelify Sans", ui-rounded, "Trebuchet MS", system-ui, sans-serif`;
  const lineH = fontPx * LH, cap = Math.max(6, Math.floor(height / lineH)), gap = .55;
  const linesOf = s => s.split('\n').reduce((n, ln) => n + Math.max(1, Math.ceil(meas.measureText(ln).width * 1.06 / width)), 0);
  const pages = []; let cur = [], used = 0;
  const flush = () => { if (cur.length) { pages.push(cur); cur = []; used = 0; } };
  for (const para of String(text).trim().split(/\n\s*\n/)) {
    const need = linesOf(para) + (cur.length ? gap : 0);
    if (used + need <= cap) { cur.push(para); used += need; continue; }
    const poem = para.includes('\n');
    if (!poem && linesOf(para) > 4) {   // split a long paragraph by sentences across the page break
      const sents = para.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [para]; let part = '';
      for (const s of sents) {
        const tryP = part + s, n = linesOf(tryP.trim()) + (cur.length ? gap : 0);
        if (used + n > cap && (part || cur.length)) { if (part) { cur.push(part.trim()); } flush(); part = s; } else part = tryP;
      }
      if (part.trim()) { cur.push(part.trim()); used += linesOf(part.trim()) + (cur.length > 1 ? gap : 0); }
    } else if (poem && linesOf(para) > cap) {   // a stanza taller than a page: break it by lines
      flush(); let grp = []; for (const ln of para.split('\n')) { const n = linesOf(ln); if (used + n > cap) { cur.push(grp.join('\n')); grp = []; flush(); } grp.push(ln); used += n; } if (grp.length) cur.push(grp.join('\n'));
    } else { flush(); cur.push(para); used = linesOf(para); }
  }
  flush(); return pages.length ? pages : [['']];
}
function openRead(ctx, id, page) { const r = M().read(id); if (!r || !r.released) return toast('That one is not out yet.'); ctx.push(r.serial ? `${r.serial.name} ${r.serial.part}/${r.serial.of}` : r.title, (b, c) => reading(b, c, id, page), 'read:' + id); }
function reading(b, ctx, id, startPage) {
  injectMediaCss(); const r = M().read(id), P = M().prefs(); if (!r) { b.append(empty('novel_lighthouse', 'Not found', '')); return; }
  const view = document.querySelector('#phone-layer .ph-view'), vw = (view && view.clientWidth) || 340, vh = (view && view.clientHeight) || 560;
  const fontPx = FONT[P.font] || FONT[1], pages = paginate(r.text, fontPx, vw - 44, vh - 52 - 46 - 64 - 30);
  let page = Math.max(0, Math.min(pages.length - 1, startPage !== undefined ? startPage : (r.page || 0))), acc = 0, shown = false, finished = false;
  if (page >= pages.length) page = 0;
  const mine = M().begin('pages', id);
  b.classList.add('md-page'); if (P.night) b.classList.add('night');
  const words = () => pages[page].join(' ').split(/\s+/).filter(Boolean).length, expect = () => Math.max(3, words() / TUNE.READ_WPM * 60);
  const txt = el('div.md-text', { style: { fontSize: fontPx + 'px', lineHeight: String(LH) } }), prog = el('span.md-pg'), clock = el('span.md-clock');
  const marked = () => M().marks().some(m => m.id === id && m.page === page), bm = el('button.md-tool', { 'aria-label': 'Bookmark this page', onclick: () => { if (marked()) M().unmark(id, page); else { M().bookmark(id, page); ctx.tip('Bookmarked. Find it on the Library page.'); } paint(); } });
  const tools = el('div.md-tools', null,
    el('button.md-tool', { 'aria-label': 'Text size', text: 'Aa', onclick: () => { settle(); P.font = ((P.font || 0) + 1) % FONT.length; M().readProgress(id, page); ctx.refresh(); } }),
    el('button.md-tool', { 'aria-label': 'Night mode', onclick: () => { settle(); P.night = P.night ? 0 : 1; M().readProgress(id, page); ctx.refresh(); } }, iconEl(P.night ? 'weather.sun' : 'weather.moon', 1)), bm, prog, clock);
  /** charge the reading time of the page so far (never more than 1.6x a normal read of it) */
  const settle = full => { const e = expect(), sec = full ? Math.max(0, e - Math.min(acc, e)) : 0; if (sec > 0) M().spend('read', sec * TUNE.CLOCK.read); if (full) acc = e * 1.6; };
  function paint() {
    txt.replaceChildren(...(page === 0 ? [el('h3.md-h', { text: r.title }), el('p.md-by', { text: r.by })] : []), ...pages[page].map(p => el('p' + (p.includes('\n') ? '.verse' : ''), { text: p })));
    txt.scrollTop = 0; prog.textContent = `${page + 1} / ${pages.length}`; clock.textContent = G.now().clock;
    bm.replaceChildren(iconEl('ui.star', 1)); bm.classList.toggle('on', marked());
    prev.disabled = page === 0; next.lastChild.textContent = page === pages.length - 1 ? 'Finish' : 'Next';
  }
  const go = d => {
    if (finished) return; const n = page + d; if (n < 0) return;
    if (n >= pages.length) return finish();
    page = n; acc = 0; M().readProgress(id, page); paint();
  };
  function finish() {
    finished = true; const s = M().session(), mins = s ? s.minutes : 0, fun = s ? s.fun : 0, first = M().finishRead(id); M().end();
    const all = M().reads(), nx = r.serial ? all.find(q => q.serial && q.serial.id === r.serial.id && q.serial.part === r.serial.part + 1) : null, st = M().streak();
    txt.replaceChildren(el('div.md-end', null, iconEl('novel_lighthouse', 3), el('b', { text: r.serial && r.serial.part < r.serial.of ? 'To be continued' : 'The end' }), el('p', { text: r.title }),
      el('div.md-end-stats', null, chip(`${fmtMin(Math.max(1, mins))} read`), chip(`Fun +${fun.toFixed(1)}`, fun > .05 ? 'good' : ''), st.n ? chip(`${st.n}-day streak`, 'gold') : null),
      first ? null : el('small', { text: 'You had read this one before.' }),
      nx ? (nx.released ? btn(`Next: Part ${nx.serial.part}`, () => { ctx.back(); setTimeout(() => openRead(ctx, nx.id), 30); }, 'pri wide') : el('small.md-soon', { text: `Part ${nx.serial.part} arrives ${dayName(nx.day)}.` })) : null,
      btn('Back to the library', () => ctx.back(), 'wide')));
    ctx.foot.replaceChildren(); prog.textContent = 'Done'; clock.textContent = G.now().clock;
  }
  const prev = btn('Back', () => go(-1), '', 'ui.arrow_left'), skim = btn('Skim', () => { if (finished) return; settle(true); go(1); }, 'md-skim'), next = btn('Next', () => { if (!finished) go(1); }, 'pri');
  txt.addEventListener('click', e => { if (finished || e.target.closest('button')) return; const q = txt.getBoundingClientRect(); if (e.clientX > q.left + q.width * .6) go(1); else if (e.clientX < q.left + q.width * .3) go(-1); });
  b.append(tools, txt); ctx.foot.append(el('div.md-nav', null, prev, skim, next)); paint();
  onTick(b, dt => { if (finished) return; shown = true; const e = expect(); if (acc < e * 1.6) { const d = Math.min(dt, e * 1.6 - acc); acc += d; M().spend('read', d * TUNE.CLOCK.read); } if (Math.floor(G.time * 2) % 4 === 0) clock.textContent = G.now().clock; },
    () => { if (!finished && shown) M().readProgress(id, page); if (M().session() === mine) M().end(); });
}

/* ---------- a sitting with a book you own ---------- */
function sitting(b, ctx, id, minutes) {
  injectMediaCss(); const k0 = M().books().find(k => k.id === id); if (!k0) { b.append(empty('novel_lighthouse', 'Not in your bag', 'The book has to be in your backpack.')); return; }
  const it = k0.item, rate = minutes / TUNE.bookSecondsPerSitting; let left = minutes, fun = 0, xp = 0, done = false, cancelled = false;
  const mine = M().begin('pages', id); b.classList.add('md-sitting');
  const pg = el('div.md-flip', null, el('i'), el('i'), el('i')), pbar = el('div.md-book-bar', null, bar(k0.pct * 100, 100, it.kind === 'skill' ? '#3b5bdb' : '#e0703a'), el('small', { text: Math.round(k0.pct * 100) + '%' })), status = el('p.md-sit-st'), out = el('div.md-sit-out');
  b.append(el('div.md-sit-hero', null, iconEl(it.id, 5, 'book'), pg), el('b.md-sit-t', { text: it.name }), status, pbar, out,
    el('p.md-note', { text: it.kind === 'skill' ? 'Same book, same progress as on your shelf. Studying on a small screen is a little slower than at a desk.' : 'Same bookmark as on your shelf at home. An armchair is nicer, but this is the bus.' }));
  const stop = btn('Stop reading', () => { cancelled = true; finish(); }, 'wide'); ctx.foot.append(stop);
  const upd = () => { const k = M().books().find(q => q.id === id) || k0; pbar.firstChild.firstChild.style.width = (k.pct * 100).toFixed(1) + '%'; pbar.lastChild.textContent = Math.round(k.pct * 100) + '%'; status.textContent = `Reading on your phone · ${Math.round(minutes - left)} of ${minutes} min · ${G.now().clock}`; };
  function finish(fin) {
    if (done) return; done = true; const read = minutes - left; M().end(); b.classList.add('over'); upd();
    status.textContent = fin ? 'You reached the last page.' : cancelled ? `You put the book down after ${Math.round(read)} minutes.` : `${minutes} minutes, gone like that.`;
    out.replaceChildren(chip(`${fmtMin(Math.max(1, read))} read`), chip(`Fun ${fun >= 0 ? '+' : ''}${fun.toFixed(1)}`, fun > .05 ? 'good' : ''), xp > .5 ? chip(`${it.kind === 'skill' ? it.skill[0].toUpperCase() + it.skill.slice(1) : 'Creativity'} +${Math.round(xp)} xp`, 'gold') : null);
    ctx.foot.replaceChildren(el('div.md-nav', null, btn('Read on', () => { ctx.back(); setTimeout(() => ctx.push(it.name, (bb, c) => sitting(bb, c, id, minutes), 'sit'), 30); }, 'pri'), btn('Done', () => ctx.back())));
  }
  upd();
  onTick(b, dt => { if (done) return; const gm = Math.min(left, rate * dt); left -= gm; const res = M().readBook(id, gm); fun += res.fun; xp += res.xp; upd(); if (res.finished && it.kind === 'novel') return finish(true); if (left <= 1e-6) finish(); },
    () => { if (!done) { done = true; if (M().session() === mine) M().end(); } });
}

export function init() {
  injectMediaCss(); if (!G.phone || !G.phone.registerApp || !G.media) return;
  G.phone.registerApp(Object.assign(regDef('pages'), { render }));
  safe(() => G.tips.register({ id: 'pages', topic: 'phone', title: 'Pages: a book in your pocket', text: 'Pages has short reads you actually read, page by page, and every book in your bag. It is a nice way to fill a bus ride or a queue. It gives a little Fun, less than an armchair at home, and screen time runs thin after about 45 minutes a day.', go: { app: 'pages' }, goLabel: 'Open Pages' }), 0);
}
