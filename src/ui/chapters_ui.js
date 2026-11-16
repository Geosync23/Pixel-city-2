// Chapter UI (the main story, src/sim/chapters.js): the dialogue sheet, choices, the back-log, the start card, the end card,
// the "what to do now" chip, Mom's book reader and the two microfilm frames. Styles: chapters.css.
//
//   say(line)      line = { who, name, spec?, text, style?: 'narrator' | 'hand' | 'phone' | '' , sub? }  -> Promise<'next' | 'out'>
//                  One bubble in the bottom sheet: portrait + name, text that types out (tap = finish, tap again = next).
//                  The sheet stays open between lines; close() hides it. While it is open the game is paused (G.modal) unless setModal(false).
//   choice(opts)   opts = [{ id, text }] -> Promise<id | 'out'>     big buttons under the last line.
//   beat(ms)       a held pause (the sheet dims its text).
//   close()        hide the dialogue sheet (and release the pause).            setModal(on)   pause the game while the sheet is open (default on).
//   log()          the last lines, as a scrollable list (also the "Log" button).
//   card(info)     the start card: { kicker, title, hook, who: [{ name, spec }], minutes, ready, closed?, resume?, canBegin } -> Promise<'begin' | 'later'>
//   endCard(info)  { kicker, title, lines: [text] } -> Promise
//   chip(info)     null hides it. { kicker, text, go?: { label, fn }, skip?: { label, fn }, out?: fn }   the small strip that says what the Chapter asks next.
//   book(o)        o = { title, pages: [{ n, title, text: [..], state, note? }], at: index } -> Promise    Mom's exercise book, in her handwriting.
//   frame(o)       o = { head, date, title, cols: [text], photo?: fn(g, w, h), caption } -> Promise     a newspaper page on the microfilm reader.
//   toastGold(text) one gentle gold notice.
// Nothing here knows about Chapter rules; sim/chapters.js drives it.
import { G } from '../core/game.js';
import { el, root } from './kit.js';
import { charArt } from '../core/char.js';
import { render } from '../engine/raster.js';
import { toSprite } from '../engine/sprites.js';

function injectCss() {
  handCheck();
  if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/chapters.css"]')) return;
  document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/chapters.css' }));
}

/* Mom's handwriting: the css asks for a script face ("Segoe Script", "Bradley Hand", "Snell Roundhand", "Dancing Script", then the device's `cursive`).
   Where none of them exists the browser's `cursive` is just its ordinary serif or sans face: then <html> gets .ch-nohand and the css uses a chosen italic book hand. */
function hasHand() {
  try {
    const g = document.createElement('canvas').getContext('2d'), probe = 'Maple Bay, for F. Go late in the day. 1987', w = f => { g.font = 'italic 24px ' + f; return g.measureText(probe).width; };
    const ser = w('serif'), san = w('sans-serif'), mono = w('monospace');
    for (const f of ['"Segoe Script"', '"Bradley Hand"', '"Snell Roundhand"', '"Dancing Script"']) if (w(f + ',serif') === w(f + ',sans-serif') && w(f + ',monospace') === w(f + ',serif')) return true;
    const cur = w('cursive'); return cur !== ser && cur !== san && cur !== mono;
  } catch (e) { return true; }
}
let handChecked = false;
function handCheck() { if (handChecked) return; handChecked = true; if (!hasHand()) document.documentElement.classList.add('ch-nohand'); }

/* ---------- portraits ---------- */
const PW = 16, PH = 17, faces = new WeakMap();
export function face(spec, scale) {
  const cv = el('canvas.pix.chd-pc'); cv.width = PW; cv.height = PH;
  if (scale) { cv.style.width = PW * scale + 'px'; cv.style.height = PH * scale + 'px'; }
  if (!spec) return cv;
  try {
    let spr = faces.get(spec);
    if (!spr) { const A = charArt(); spr = { c: toSprite(render(A.CHAR_SB, () => A.drawChar(spec, { anim: 'stand', frame: 0, dir: 1 }), null, 0)).c, A }; faces.set(spec, spr); }
    const A = spr.A; cv.getContext('2d').drawImage(spr.c, -A.CHAR_SB[0] - PW / 2, -A.CHAR_SB[1] - (spec.age === 'kid' ? 19 : 22), PW, PH, 0, 0, PW, PH);
  } catch (e) { /* no portrait */ }
  return cv;
}

/* ---------- the dialogue sheet ---------- */
let D = null, modalOn = true, held = false;
const LOG = [];
const hold = on => { if (on && !held) { held = true; G.modal++; } else if (!on && held) { held = false; G.modal--; } };
export function setModal(on) { modalOn = !!on; if (D) hold(modalOn); }
function build() {
  injectCss();
  const d = { wrap: el('div.chd-wrap'), typing: null, full: '', res: null, mode: null };
  d.face = el('div.chd-face'); d.name = el('b.chd-name'); d.sub = el('small.chd-sub');
  d.logB = el('button.chd-b', { text: 'Log', 'data-pad': 'aside' /* PAD HOOK */, onclick: e => { e.stopPropagation(); log(); } });
  d.outB = el('button.chd-b', { text: '...', 'aria-label': 'More', 'data-pad': 'aside', onclick: e => { e.stopPropagation(); menu(); } });
  d.text = el('div.chd-text', { 'data-pad': 'line' /* PAD HOOK: A on the line = a tap on the sheet (the click bubbles to d.wrap) */ }); d.more = el('div.chd-more', { text: '▼' });
  d.opts = el('div.chd-opts');
  d.box = el('div.chd', null, el('div.chd-head', null, d.face, el('div.chd-id', null, d.name, d.sub), d.logB, d.outB), d.text, d.more, d.opts);
  d.wrap.append(d.box);
  d.wrap.addEventListener('click', () => tap());
  d.key = e => { if (!D || D.over) return; if (e.key === ' ' || e.key === 'Enter' || e.key === 'e') { e.preventDefault(); e.stopPropagation(); tap(); } };
  addEventListener('keydown', d.key, true);
  root().append(d.wrap);
  return d;
}
function open() { if (!D) { D = build(); hold(modalOn); } return D; }
export function close() {
  if (!D) return; stopType(); removeEventListener('keydown', D.key, true); D.wrap.remove(); const r = D.res; D = null; hold(false); guard(); if (r) r('closed');
}
/* When the sheet goes away the world is under the thumb that was tapping through the lines: for a moment taps on the world do nothing, so one tap too many
   does not walk the player off (out of a room's door, as it happens: doors sit at the bottom of the screen). Buttons, the chip and the HUD stay live. */
let guardEl = null, guardT = 0;
function guard(ms = 420) {
  if (!guardEl) { guardEl = el('div.chd-guard'); for (const ev of ['pointerdown', 'pointerup', 'click', 'touchstart']) guardEl.addEventListener(ev, e => { e.stopPropagation(); e.preventDefault(); }); }
  if (!guardEl.isConnected) root().prepend(guardEl); clearTimeout(guardT); guardT = setTimeout(() => guardEl.remove(), ms);
}
export const isOpen = () => !!D;
function stopType() { if (D && D.typing) { clearInterval(D.typing); D.typing = null; } }
function finish(v) { if (!D || !D.res) return; const r = D.res; D.res = null; D.mode = null; r(v); }
function tap() {
  if (!D || D.over) return;
  if (D.mode === 'say') { if (D.typing) { stopType(); D.text.textContent = D.full; D.more.style.visibility = ''; } else finish('next'); }
}
function head(line) {
  const d = D, st = line.style || '';
  d.box.className = 'chd' + (st ? ' ' + st : '');
  d.face.replaceChildren(); d.face.style.display = st === 'narrator' || st === 'hand' ? 'none' : '';
  if (st !== 'narrator' && st !== 'hand') d.face.append(face(line.spec));
  d.name.textContent = line.name || ''; d.sub.textContent = line.sub || (st === 'phone' ? 'on the phone' : st === 'hand' ? 'in her handwriting' : '');
  d.name.parentNode.style.visibility = line.name || st === 'hand' ? '' : 'hidden';
}
export function say(line) {
  const d = open(); head(line); d.opts.replaceChildren(); d.box.classList.remove('choosing');
  LOG.push({ who: line.name || '', text: line.text, st: line.style || '' }); if (LOG.length > 60) LOG.shift();
  return new Promise(res => {
    d.res = res; d.mode = 'say'; d.full = line.text; d.text.textContent = ''; d.more.style.visibility = 'hidden';
    let i = 0; stopType();
    const quick = G.query && G.query.has('chfast');
    if (quick) { d.text.textContent = d.full; d.more.style.visibility = ''; return; }
    d.typing = setInterval(() => { i += 2; d.text.textContent = d.full.slice(0, i); if (i >= d.full.length) { stopType(); d.more.style.visibility = ''; } }, 22);
  });
}
/** show a line at once, without waiting for a tap (the line a choice answers, when the sheet opens straight onto the choice after a reload) */
export function context(line) { const d = open(); head(line); stopType(); d.full = line.text; d.text.textContent = line.text; d.more.style.visibility = 'hidden'; if (!LOG.length || LOG[LOG.length - 1].text !== line.text) LOG.push({ who: line.name || '', text: line.text, st: line.style || '' }); }
export function choice(options) {
  const d = open(); stopType(); d.more.style.visibility = 'hidden'; d.box.classList.add('choosing');
  return new Promise(res => {
    d.res = res; d.mode = 'choice'; d.opts.replaceChildren();
    for (const o of options) d.opts.append(el('button.chd-opt', { 'data-opt': o.id, text: o.text, onclick: e => { e.stopPropagation(); if (D && D.mode === 'choice') { LOG.push({ who: 'You', text: o.text, st: 'you' }); d.opts.replaceChildren(); d.box.classList.remove('choosing'); finish(o.id); } } }));
  });
}
export function beat(ms) {
  if (G.query && G.query.has('chfast')) ms = 30;
  return new Promise(res => { if (D) D.box.classList.add('beat'); setTimeout(() => { if (D) D.box.classList.remove('beat'); res(); }, ms); });
}
/* overlays on top of the sheet (log / menu): simple panels */
function over(title, body, onClose) {
  if (!D) return null; D.over = true;
  const p = el('div.chd-over', { onclick: e => e.stopPropagation() }, el('div.chd-over-h', null, el('b', { text: title }), el('button.chd-b', { text: 'x', 'aria-label': 'Close', onclick: () => shut() })), body);
  const shut = () => { p.remove(); if (D) D.over = false; if (onClose) onClose(); };
  D.wrap.append(p); return shut;
}
export function log() {
  const list = el('div.chd-log'); for (const l of LOG.slice(-40)) list.append(el('p' + (l.st ? '.' + l.st : ''), null, l.who ? el('b', { text: l.who + '  ' }) : null, l.text));
  over('What was said', list); setTimeout(() => { list.scrollTop = list.scrollHeight; }, 0);
}
let onOut = null;
export function setOut(fn) { onOut = fn; }
function menu() {
  if (!D) return; let shut = null; const job = !!(G.jobStory && G.jobStory.active && G.jobStory.active()), rel = !!(G.rel && G.rel.active && G.rel.active());   /* J2: the same sheet plays job scenes */
  const body = el('div.chd-menu', null,
    el('p', { text: rel ? 'No rush. It keeps your place, and so do they.' : job ? 'No rush. The moment waits for your next shift.' : 'No rush. The Chapter keeps your place.' }),
    el('button.chd-opt', { 'data-out': '1', text: "Let's pick this up later", onclick: () => { shut(); const r = D && D.res; if (D) { D.res = null; D.mode = null; } if (r) r('out'); else if (onOut) onOut(); } }),
    el('button.chd-opt', { text: 'Carry on', onclick: () => shut() }));
  shut = over(rel ? 'Together' : job ? 'At work' : 'Chapter', body);
}

/* ---------- cards ---------- */
function sheet(cls, kids, pause = true) {
  injectCss();
  const wrap = el('div.chc-wrap'), box = el('div.chc.' + cls, null, ...kids); wrap.append(box); root().append(wrap); if (pause) G.modal++;
  let openNow = true;
  return { wrap, box, close() { if (!openNow) return; openNow = false; wrap.remove(); if (pause) G.modal--; } };
}
export function card(info) {
  return new Promise(res => {
    const who = el('div.chc-who'); for (const w of info.who || []) who.append(el('span.chc-p', null, face(w.spec, 2), el('i', { text: w.name })));
    const done = v => { s.close(); res(v); };
    const s = sheet('start', [
      el('div.chc-kick', { text: info.kicker }), el('h2.chc-title', { text: info.title }), el('p.chc-hook', { text: info.hook }),
      (info.who || []).length ? who : null,
      el('p.chc-meta', { text: info.meta || '' }),
      info.closed ? el('p.chc-closed', { text: info.closed }) : el('p.chc-ready', { text: info.ready || '' }),
      el('div.chc-btns', null,
        info.canBegin ? el('button.chc-go', { 'data-ch': 'begin', text: info.resume ? 'Pick it up' : 'Begin', onclick: () => done('begin') }) : null,
        el('button.chc-no', { 'data-ch': 'later', text: info.canBegin ? 'Not now' : 'All right', onclick: () => done('later') })),
    ]);
  });
}
export function endCard(info) {
  return new Promise(res => {
    const list = el('div.chc-list'); for (const l of info.lines || []) list.append(el('p', { text: l }));
    const s = sheet('end', [
      el('div.chc-kick', { text: info.kicker }), el('h2.chc-title', { text: info.title }),
      (info.lines || []).length ? el('div.chc-sec', { text: 'You come away with' }) : null, list,
      info.next ? el('p.chc-ready', { text: info.next }) : null,
      el('div.chc-btns', null, el('button.chc-go', { 'data-ch': 'done', text: 'Lovely', onclick: () => { s.close(); res(); } })),
    ]);
  });
}

/* ---------- the chip ---------- */
let C = null;
export function chip(info) {
  injectCss();
  if (!info) { if (C) { C.remove(); C = null; } return; }
  if (!C) { C = el('div.chp'); root().append(C); }
  const key = [info.kicker, info.text, info.go && info.go.label, info.skip && info.skip.label].join('|'); if (C._k === key) { C._i = info; return; } C._k = key; C._i = info;
  C.classList.toggle('solo', !info.go && !info.skip);
  C.replaceChildren(
    el('div.chp-main', null, el('small', { text: info.kicker || '' }), el('span', { text: info.text || '' })),
    el('div.chp-btns', null,
      info.go ? el('button.chp-go', { 'data-ch': 'go', text: info.go.label, onclick: () => C && C._i.go && C._i.go.fn() }) : null,
      info.skip ? el('button.chp-skip', { 'data-ch': 'skip', text: info.skip.label, onclick: () => C && C._i.skip && C._i.skip.fn() }) : null,
      info.out ? el('button.chp-out', { 'data-ch': 'out', text: '...', 'aria-label': 'Pick this up later', onclick: () => chipMenu() }) : null));
}
function chipMenu() {
  if (!C || !C._i.out) return; const fn = C._i.out;
  const s = sheet('menu', [
    el('div.chc-kick', { text: 'Chapter' }), el('p.chc-hook', { text: 'No rush. The Chapter keeps your place.' }),
    el('div.chc-btns.col', null,
      el('button.chc-no', { 'data-out': '1', text: "Let's pick this up later", onclick: () => { s.close(); fn(); } }),
      el('button.chc-go', { text: 'Carry on', onclick: () => s.close() })),
  ]);
}

/* ---------- Mom's book ---------- */
export function book(o) {
  return new Promise(res => {
    let i = Math.max(0, Math.min(o.pages.length - 1, o.at || 0));
    const pg = el('div.bk-page'), nav = el('div.bk-nav');
    const s = sheet('book', [el('div.bk-cover', { text: o.title }), pg, nav]);
    const draw = () => {
      const p = o.pages[i]; pg.replaceChildren();
      pg.className = 'bk-page ' + (p.state || 'written');
      if (p.n) pg.append(el('div.bk-n', { text: String(p.n) }));
      pg.append(el('h3', { text: p.title }));
      for (const t of p.text) pg.append(el('p', { text: t }));
      if (p.by) pg.append(el('p.bk-by', { text: p.by }));
      if (p.note) pg.append(el('div.bk-note', { text: p.note }));
      nav.replaceChildren(
        el('button.bk-b', { 'data-bk': 'prev', text: '<', disabled: i <= 0 || undefined, onclick: () => { i--; draw(); } }),
        el('span', { text: o.pages.length > 1 ? (i + 1) + ' / ' + o.pages.length : '' }),
        el('button.bk-b', { 'data-bk': 'next', text: '>', disabled: i >= o.pages.length - 1 || undefined, onclick: () => { i++; draw(); } }),
        el('button.bk-close', { 'data-bk': 'close', text: 'Close the book', onclick: () => { s.close(); res(); } }));
      pg.scrollTop = 0;
    };
    draw();
  });
}

/* ---------- microfilm frame ---------- */
export function frame(o) {
  return new Promise(res => {
    const kids = [el('div.mf-head', { text: o.head }), el('div.mf-date', { text: o.date }), el('h3.mf-title', { text: o.title })];
    if (o.photo) { const cv = el('canvas.pix.mf-photo'); cv.width = 120; cv.height = 72; try { o.photo(cv.getContext('2d'), 120, 72); } catch (e) { /* no picture */ } kids.push(cv); if (o.caption) kids.push(el('div.mf-cap', { text: o.caption })); }
    const cols = el('div.mf-cols'); for (const t of o.cols || []) cols.append(el('p', { text: t })); kids.push(cols);
    const s = sheet('film', [el('div.mf-paper', null, ...kids), el('div.chc-btns', null, el('button.chc-go', { 'data-ch': 'film', text: o.button || 'Wind on', onclick: () => { s.close(); res(); } }))]);
  });
}

export function toastGold(text, ms = 5200) {
  injectCss(); let box = document.getElementById('toasts'); if (!box) { box = el('div', { id: 'toasts' }); root().append(box); }
  const t = el('div.toast.chgold', { text }); box.append(t); setTimeout(() => t.classList.add('out'), ms); setTimeout(() => t.remove(), ms + 400);
}

export const UI = { say, context, choice, beat, close, setModal, setOut, isOpen, log, card, endCard, chip, book, frame, face, toastGold };
