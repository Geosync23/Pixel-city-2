// _jobplay_kit.js — the small touch-first kit the job PLAYS are built from (helper of sim/jobstory.js; the plays are in _jobplay_games.js; styles: ui/jobstory.css).
//
// A play is `async ctx => score 0..1`. It strings together PARTS; each part is one of:
//   ctx.pick({ prompt, who?, options: [{ t, sub?, v 0..1, say? }], secs?, keep? }) -> v          one question, big buttons, the right answer is shown afterwards
//   ctx.order({ prompt, items: [{ t, sub?, k }], first, last, secs? }) -> 0..1               tap the cards in the right order (ascending k); tap a placed card to take it back
//   ctx.grid({ prompt, cols, cells: [{ t, odd? }], secs? }) -> 0 | 1                            find the odd cell
//   ctx.live({ prompt, setup(api) })  -> 0..1                                                 a real-time part built from DOM (api: body, every(ms, fn), after(ms, fn), finish(score), sleep)
//   ctx.mg(def) -> 0..1                                                                        an existing mini-game of ui/minigame.js (G.minigame.play), or ctx.skill(key) for a G.skillplay game
//   ctx.say(text, ms?)                                                                         one line of feedback under the prompt
// Every sheet has Auto (the usual result at once: 0.5) and x (close: the ticket stays, nothing is lost). The sheet pauses the game, so a play never costs shift time.
// runPlay(o, fn) -> Promise<score | null>     o = { job, title, sub, good, bad }   null = closed with x.  Shows the result card (stars at 0.55 / 0.85) at the end.
import { G } from '../core/game.js';
import { el, root } from '../ui/kit.js';
import { UI } from '../ui/chapters_ui.js';

const AUTO = { auto: 1 }, QUIT = { quit: 1 };
const sleep = ms => new Promise(r => setTimeout(r, ms));
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const sample = (a, n) => shuffle(a).slice(0, n);
export const pickOf = a => a[Math.floor(Math.random() * a.length)];
const fast = () => !!(G.query && G.query.has('chfast'));
function css() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/jobstory.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/jobstory.css' })); }
export { css as injectCss };

function sheet(o) {
  css(); G.modal++;
  let over = false, res, T = 0, T0 = 0, onTime = null; const done = new Promise(r => { res = r; }), timers = [];
  const body = el('div.jp-body'), hint = el('div.jp-hint'), bar = el('i'), timer = el('div.jp-timer', null, bar), note = el('div.jp-note');
  const end = v => { if (over) return; over = true; clearInterval(iv); timers.forEach(f => f()); wrap.remove(); G.modal--; res(v); };
  const wrap = el('div.jp-wrap', null, el('div.jp', { role: 'dialog', 'aria-label': o.title },
    el('div.jp-head', null, el('div.jp-tt', null, el('b', { text: o.title }), el('small', { text: o.sub || '' })), o.noAuto ? null : el('button.jp-b.jp-auto', { 'data-jp': 'auto', text: 'Auto', title: 'Skip the game and take the usual result', onclick: () => end(AUTO) }), o.noAuto ? null : el('button.jp-b', { 'data-jp': 'x', text: 'x', 'aria-label': 'Close', onclick: () => end(QUIT) })),
    hint, timer, body, note));
  root().append(wrap);
  const iv = setInterval(() => { if (!T0 || over) return; T -= .1; bar.style.width = Math.max(0, T / T0 * 100) + '%'; timer.classList.toggle('low', T / T0 < .25); if (T <= 0) { T0 = 0; const f = onTime; onTime = null; if (f) f(); } }, 100);
  return { body, done, end, get over() { return over; },
    set(...n) { body.replaceChildren(...n.filter(Boolean)); }, hint(t) { hint.textContent = t || ''; }, note(t, cls) { note.textContent = t || ''; note.className = 'jp-note' + (cls ? ' ' + cls : ''); },
    time(sec, fn) { T = T0 = sec || 0; onTime = fn || null; timer.style.visibility = sec ? '' : 'hidden'; bar.style.width = '100%'; timer.classList.remove('low'); }, left: () => T,
    every(ms, fn) { const id = setInterval(() => { if (!over) fn(); }, ms); const off = () => clearInterval(id); timers.push(off); return off; },
    after(ms, fn) { const id = setTimeout(() => { if (!over) fn(); }, ms); const off = () => clearTimeout(id); timers.push(off); return off; } };
}

class Ctx {
  constructor(o) { this.o = o; this.S = null; }
  open() { if (!this.S || this.S.over) this.S = sheet(this.o); return this.S; }
  shut() { if (this.S && !this.S.over) this.S.end(null); this.S = null; }
  /** wait for p, unless the sheet is closed by Auto / x meanwhile */
  async wait(p) { const S = this.S, v = await Promise.race([p, S.done.then(x => ({ __end: x }))]); if (v && v.__end !== undefined) { this.S = null; throw v.__end || QUIT; } return v; }
  sleep(ms) { return this.wait(sleep(fast() ? Math.min(ms, 60) : ms)); }
  async say(text, ms = 1100, cls) { const S = this.open(); S.note(text, cls); await this.sleep(ms); }

  async pick(q) {
    const S = this.open(); S.hint(q.hint || ''); S.note('');
    const opts = q.keep ? q.options : shuffle(q.options), btns = [], best = Math.max(...opts.map(o => o.v));
    const card = el('div.jp-card', null, q.who && q.who.spec ? el('div.jp-face', null, UI.face(q.who.spec, 3)) : null, el('div', null, q.who && q.who.name ? el('b.jp-who', { text: q.who.name }) : null, ...[].concat(q.prompt).map(t => el('p', { text: t }))));
    let pickRes; const p = new Promise(r => { pickRes = r; });
    const grid = el('div.jp-opts' + (q.cols === 2 ? '.two' : ''), null, opts.map((o, i) => { const b = el('button.jp-opt', { 'data-v': o.v, onclick: () => pickRes(i) }, el('span', { text: o.t }), o.sub ? el('small', { text: o.sub }) : null); btns.push(b); return b; }));
    S.set(card, grid); S.time(q.secs || 0, () => pickRes(-1));
    const i = await this.wait(p); S.time(0); const o = i >= 0 ? opts[i] : null, v = o ? o.v : 0;
    btns.forEach((b, k) => { b.disabled = true; if (opts[k].v >= best - .001) b.classList.add('right'); else if (k === i) b.classList.add(opts[k].v >= .5 ? 'mid' : 'wrong'); });
    const line = o && o.say ? o.say : i < 0 ? (q.late || 'Too slow. It happens.') : v >= best - .001 ? (q.yes || 'Right.') : (q.no || 'Not quite.');
    S.note(line, v >= best - .001 ? 'ok' : v >= .5 ? 'mid' : 'no'); await this.sleep(q.pause || (line.length > 40 ? 1700 : 1100));
    return v;
  }

  async order(q) {
    const S = this.open(); S.hint(q.hint || 'Tap the cards in order. Tap a placed one to take it back.'); S.note('');
    const items = shuffle(q.items.map((it, i) => Object.assign({ i }, it))), seq = []; let go; const p = new Promise(r => { go = r; });
    const card = el('div.jp-card', null, el('div', null, ...[].concat(q.prompt).map(t => el('p', { text: t })))), slots = el('div.jp-slots'), pool = el('div.jp-pool'), ok = el('button.jp-go', { 'data-jp': 'done', text: q.button || "That's the order", disabled: true, onclick: () => go(1) });
    const draw = () => {
      slots.replaceChildren(el('small.jp-end', { text: q.first || 'First' }), ...items.map((_, k) => { const it = seq[k]; return el('button.jp-slot' + (it ? '.full' : ''), { 'data-slot': k, onclick: () => { if (it) { seq.splice(k, 1); draw(); } } }, el('i', { text: String(k + 1) }), it ? el('span', { text: it.t }) : null, it && it.sub ? el('small', { text: it.sub }) : null); }), el('small.jp-end', { text: q.last || 'Last' }));
      pool.replaceChildren(...items.filter(it => !seq.includes(it)).map(it => el('button.jp-opt.jp-item', { 'data-item': it.i, 'data-k': it.k, onclick: () => { seq.push(it); draw(); } }, el('span', { text: it.t }), it.sub ? el('small', { text: it.sub }) : null)));
      ok.disabled = seq.length < items.length;
    };
    draw(); S.set(card, slots, pool, ok); S.time(q.secs || 0, () => go(0));
    await this.wait(p); S.time(0); for (const it of items) if (!seq.includes(it)) seq.push(it);
    let bad = 0, all = 0; for (let a = 0; a < seq.length; a++) for (let b = a + 1; b < seq.length; b++) { if (seq[a].k === seq[b].k) continue; all++; if (seq[a].k > seq[b].k) bad++; }
    const score = all ? 1 - bad / all : 1, right = seq.slice().sort((a, b) => a.k - b.k);
    slots.replaceChildren(el('small.jp-end', { text: q.first || 'First' }), ...seq.map((it, k) => el('button.jp-slot.full.' + (right[k].k === it.k ? 'right' : 'wrong'), { disabled: true }, el('i', { text: String(k + 1) }), el('span', { text: it.t }), it.sub ? el('small', { text: it.sub }) : null)), el('small.jp-end', { text: q.last || 'Last' }));
    pool.replaceChildren(); ok.remove();
    S.note(score >= .99 ? (q.yes || 'In order.') : score >= .6 ? (q.mid || 'Nearly. One or two out of place.') : (q.no || 'That would not have stood up.'), score >= .99 ? 'ok' : score >= .6 ? 'mid' : 'no'); await this.sleep(1500);
    return score;
  }

  async grid(q) {
    const S = this.open(); S.hint(q.hint || 'Tap the one that is wrong.'); S.note(''); let go; const p = new Promise(r => { go = r; }), btns = [];
    const g = el('div.jp-grid', { style: { gridTemplateColumns: `repeat(${q.cols}, 1fr)` } }, q.cells.map((c, i) => { const b = el(c.head ? 'div.jp-cell.head' : 'button.jp-cell', c.head ? { text: c.t } : { text: c.t, 'data-odd': c.odd ? 1 : 0, onclick: () => go(i) }); btns.push(b); return b; }));
    S.set(el('div.jp-card', null, el('div', null, ...[].concat(q.prompt).map(t => el('p', { text: t })))), g); S.time(q.secs || 0, () => go(-1));
    const i = await this.wait(p); S.time(0); const hit = i >= 0 && !!q.cells[i].odd;
    btns.forEach((b, k) => { b.disabled = true; if (q.cells[k].odd) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
    S.note(hit ? (q.yes || 'Found it.') : (q.no || 'It was the green one.'), hit ? 'ok' : 'no'); await this.sleep(1300); return hit ? 1 : 0;
  }

  /** a real-time part. setup(api) builds the DOM and calls api.finish(score) when it is over. */
  async live(q) {
    const S = this.open(); S.hint(q.hint || ''); S.note(''); let fin; const p = new Promise(r => { fin = r; });
    const api = { S, body: S.body, every: S.every, after: S.after, finish: v => fin(Math.max(0, Math.min(1, v))), note: S.note, time: S.time };
    S.set(...[].concat(q.setup(api) || [])); const v = await this.wait(p); S.time(0); await this.sleep(q.pause || 900); return v;
  }

  /** an existing mini-game (ui/minigame.js). The sheet closes first: that kit runs while nothing modal is open. */
  async mg(def) {
    this.shut(); if (!G.minigame || !G.minigame.play) return .5; await sleep(120);
    const r = await G.minigame.play(Object.assign({ level: 3, sub: this.o.title }, def)); if (!r || r.quit) throw QUIT; if (r.auto || r.score < 0) throw AUTO; return r.score;
  }
  async skill(key, opts) {
    this.shut(); if (!G.skillplay || !G.skillplay.demo) return .5; await sleep(120);
    const r = await G.skillplay.demo(key, undefined, opts); if (!r || r.quit) throw QUIT; if (r.auto || r.score < 0) throw AUTO; return r.score;
  }

  async result(score) {
    this.shut(); const o = this.o, st = score >= .85 ? 3 : score >= .55 ? 2 : score > .2 ? 1 : 0, S = this.S = sheet(Object.assign({}, o, { noAuto: true })); let go; const p = new Promise(r => { go = r; });
    S.hint(''); S.time(0);
    S.set(el('div.jp-res', null, el('div.jp-stars', null, [0, 1, 2].map(i => el('span' + (i < st ? '.on' : ''), { text: '★' }))), el('b', { text: st >= 3 ? 'Beautifully done' : st === 2 ? 'A good piece of work' : st === 1 ? 'It will do' : 'A rough one' }),
      el('p', { text: st >= 3 ? o.good : st <= 1 ? o.bad : (o.mid || 'Nothing to be ashamed of, and something to do better tomorrow.') }), o.reward ? el('small', { text: o.reward(score) }) : null),
      el('button.jp-go', { 'data-jp': 'back', text: 'Back to work', onclick: () => go() }));
    await Promise.race([p, S.done]); this.shut();
  }
}

export async function runPlay(o, fn) {
  const ctx = new Ctx(o);
  if (G.skillplay && G.skillplay.auto && G.skillplay.auto()) return .5;      /* "mini-games off" in the Me app: the usual result, no sheet */
  try { const v = Math.max(0, Math.min(1, await fn(ctx))); await ctx.result(v); return v; }
  catch (e) { if (e === AUTO) return .5; if (e === QUIT) return null; console.error('job play', o.job, e); return .5; }
  finally { ctx.shut(); }
}
export const mean = (...v) => v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);
