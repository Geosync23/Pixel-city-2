// Minimal DOM UI kit shared by all UI modules. Pixel-styled via src/ui/style.css.
import { G } from '../core/game.js';
/** el('div.cls.cls2', {attrs/onclick/text/html}, ...children) */
export function el(sel, props, ...kids) {
  const [tag, ...cls] = sel.split('.'); const e = document.createElement(tag || 'div'); if (cls.length) e.className = cls.join(' ');
  if (props) for (const k in props) { const v = props[k]; if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v; else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v); else if (k.startsWith('on')) { if (v) { e.addEventListener(k.slice(2), v); if (k === 'onclick' || k === 'onpointerdown' || k === 'onpointerup') e._pn = 1; /* PAD HOOK (ui/padnav.js): this element can be pressed, so a controller / the arrow keys can focus it */ } } else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v); }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
export const root = () => document.getElementById('ui');
/** transient message at the top of the screen. kind: 'info'|'good'|'bad'|'money' */
export function toast(text, kind = 'info', ms = 2600) { let box = document.getElementById('toasts'); if (!box) { box = el('div', { id: 'toasts' }); root().append(box); } 
  for (const o of box.children) if (o.textContent === text && !o.classList.contains('out')) return o;   /* QA7: the same words twice at once: once */
  const live = [...box.children].filter(o => !o.classList.contains('out')); if (live.length >= 2) { const old = live[0]; old.classList.add('out'); setTimeout(() => old.remove(), 400); }   /* QA7: at most two; the oldest makes room */
  if (live.length) ms = Math.min(ms, 2200);   /* QA7: shorter while others queue */
  const t = el('div.toast.' + kind, { text }); box.append(t); setTimeout(() => t.classList.add('out'), ms); setTimeout(() => t.remove(), ms + 400); while (box.children.length > 4) box.firstChild.remove(); return t; }
/**
 * Modal window (pauses the game while open). Returns {el, body, close()}.
 * opts: { title, cls, onClose, closable: true, pause: true }
 */
export function modal(opts = {}) {
  const body = el('div.win-body'); const pause = opts.pause !== false; let open = true;
  const close = () => { if (!open) return; open = false; wrap.remove(); if (pause) G.modal--; opts.onClose && opts.onClose(); };
  const win = el('div.win' + (opts.cls ? '.' + opts.cls : ''), null, (opts.title || opts.closable !== false) && el('div.win-head', null, el('span.win-title', { text: opts.title || '' }), opts.closable !== false && el('button.x', { text: 'x', 'aria-label': 'Close', onclick: close })), body);
  const wrap = el('div.modal', { onpointerdown: e => { if (e.target === wrap && opts.closable !== false) close(); } }, win);
  /* ghost tap (alarm worker, 2026-11-16): a tap on a bed / counter the player stands next to opens this window on the canvas's pointerup, and the browser's click for that
     same tap then lands on whatever button is now under the finger (seen: "Sleep 8 hours" chosen by itself). A real, mouse or touch click that did not start inside this
     window within its first 600 ms is dropped; clicks from code (pad, keyboard: untrusted or detail 0) are never touched */
  const born = performance.now(); let downIn = false; wrap.addEventListener('pointerdown', () => { downIn = true; }, true);
  wrap.addEventListener('click', e => { if (!downIn && e.isTrusted && e.detail > 0 && performance.now() - born < 600) { e.preventDefault(); e.stopPropagation(); } }, true);
  root().append(wrap); if (pause) G.modal++; return { el: win, body, close, wrap };
}
/** simple choice menu. options: [{label, sub?, disabled?, icon?: HTMLElement, value}] -> Promise<value|null> */
export function choose(title, options, opts = {}) { return new Promise(res => { let done = false; const m = modal({ title, cls: 'menu ' + (opts.cls || ''), onClose: () => { if (!done) res(null); } }); if (opts.text) m.body.append(el('p.menu-text', { text: opts.text })); for (const o of options) m.body.append(el('button.opt', { disabled: o.disabled, onclick: () => { done = true; m.close(); res(o.value !== undefined ? o.value : o.label); } }, o.icon, el('span.opt-l', { text: o.label }), o.sub && el('span.opt-s', { text: o.sub }))); }); }
/** speech bubble above a world position or entity (auto-removes). */
export function bubble(target, text, ms = 2800, cls = '') {
  const b = el('div.bubble' + (cls ? '.' + cls : ''), { text }); root().append(b); const t0 = performance.now(); let half = -1, ox = 0;
  const upd = () => { if (performance.now() - t0 > ms || !b.isConnected) { b.remove(); G.off('frame', upd); return; } const s = G.toScreen(target.x, target.y, (target.z || 0) + (target.bubbleH || 1.9)); 
    if (half < 0) { b.style.left = s.x + 'px'; b.style.top = s.y + 'px'; const r = b.getBoundingClientRect(); half = r.width / 2; ox = r.left + half - s.x; }   /* QA8: measured once (the text never changes): no layout read every frame */
    const dx = Math.max(6 - (s.x + ox - half), 0) + Math.min(innerWidth - 6 - (s.x + ox + half), 0); const L = (s.x + dx) + 'px', Tp = s.y + 'px'; if (L !== pl) b.style.left = pl = L; if (Tp !== pt) b.style.top = pt = Tp; };   /* perf: written only when it moved */
  let pl = '', pt = ''; G.on('frame', upd); upd(); return b;
}
/** dialogue box at the bottom with speaker name; lines: [{who, text}] or strings. Resolves when dismissed. */
export function say(lines, opts = {}) { return new Promise(res => { lines = [].concat(lines).map(l => typeof l === 'string' ? { text: l } : l); let i = 0; G.modal++; const who = el('div.say-who'), tx = el('div.say-text'), box = el('div.say', { onclick: next }, who, tx, el('div.say-next', { text: '>' })); function show() { who.textContent = lines[i].who || opts.who || ''; who.style.display = who.textContent ? '' : 'none'; tx.textContent = lines[i].text; } function next() { if (++i >= lines.length) { box.remove(); G.modal--; removeEventListener('keydown', key, true); res(); } else show(); } function key(e) { if (e.key === ' ' || e.key === 'Enter' || e.key === 'e') { e.preventDefault(); e.stopPropagation(); next(); } } addEventListener('keydown', key, true); root().append(box); show(); }); }
/** canvas -> <img>-like element scaled up crisply */
export function pixCanvas(canvas, scale = 2) { const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height; c.getContext('2d').drawImage(canvas, 0, 0); c.className = 'pix'; c.style.width = canvas.width * scale + 'px'; c.style.height = canvas.height * scale + 'px'; return c; }
