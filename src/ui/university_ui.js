// university_ui.js — the class sheet: a bottom sheet (portrait) / side panel (landscape) that carries a lecture, a paper or a study session while the room stays
// visible above it (the professor talks, the screen on the wall changes, classmates fidget). Not a modal: the simulation keeps running; the class engine
// (sim/_uni_class.js) advances the clock. Styles: university.css.
//   openSheet({ title, sub, color, onLeave }) -> sheet
//   sheet.slide({ h, t, fig, who, n, of, btn })        -> Promise<'next' | LEFT>      a lecture board: heading, two or three sentences, the diagram
//   sheet.ask(Q, { who, n, of, reveal = true, shuffle = true }) -> Promise<{ ok, pick, i } | LEFT>   Q = [question, [answers], right index, afterword]
//   sheet.say(who, text, btn = 'Next')                  -> Promise<'next' | LEFT>
//   sheet.notes(title, [text], btn)                     -> Promise                     reading notes
//   sheet.result({ grade, title, lines, btn })          -> Promise
//   sheet.head(title, sub)   sheet.close()   sheet.left (true once the player chose to leave)   sheet.want() -> { kind, right? } for tests
//   LEFT is the value every pending promise resolves to when the player leaves.   current() -> the open sheet or null
import { G } from '../core/game.js';
import { el, root } from './kit.js';
import { fig } from '../art/showpiece/_uni_figs.js';

export const LEFT = 'left';
let cur = null;
export const current = () => cur;
function injectCss() { if (typeof document === 'undefined' || !document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/university.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/university.css' })); }
/** a 72 x 36 diagram on a small chalkboard canvas (also used by the phone app) */
export function figCanvas(id) { const c = el('canvas.uc-fig', { width: 72, height: 36 }), g = c.getContext('2d'); g.fillStyle = '#16302a'; g.fillRect(0, 0, 72, 36); fig(id)((x, y, col) => { if (col && x >= 0 && y >= 0 && x < 72 && y < 36) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } }, 72, 36); return c; }
const pips = (n, of, done) => el('div.uc-pips', null, Array.from({ length: of }, (_, i) => el('i' + (done && done[i] ? '.on' : i === n ? '.cur' : ''))));

export function openSheet(o = {}) {
  injectCss(); if (cur) cur.close();
  const tt = el('b', { text: o.title || '' }), sb = el('small', { text: o.sub || '' }), body = el('div.uc-body'), chip = el('div.uc-chip'); if (o.color) chip.style.background = o.color;
  let pend = null, want = null, open = true;
  const settle = v => { const p = pend; pend = null; want = null; if (p) p(v); };
  const sh = { left: false, el: null,
    head(t, s) { tt.textContent = t || ''; sb.textContent = s || ''; },
    close() { if (!open) return; open = false; box.remove(); if (cur === sh) cur = null; settle(LEFT); },
    want: () => want,
    leave() { if (sh.left) return; sh.left = true; settle(LEFT); if (o.onLeave) o.onLeave(); },
    wait(fill, w) { body.textContent = ''; want = w || { kind: 'next' }; return new Promise(res => { if (sh.left || !open) return res(LEFT); pend = res; fill(v => settle(v)); }); },
    slide(s) { return sh.wait(done => { if (s.who) body.append(el('div.uc-who', { text: s.who })); if (s.fig) body.append(figCanvas(s.fig)); body.append(el('div.uc-h', { text: s.h }), el('div.uc-t', { text: s.t })); if (s.of) body.append(pips(s.n, s.of)); body.append(el('button.uc-next', { text: s.btn || 'Next', onclick: () => done('next') })); }); },
    say(who, text, btn) { return sh.wait(done => { if (who) body.append(el('div.uc-who', { text: who })); body.append(el('div.uc-t', { text }), el('button.uc-next', { text: btn || 'Next', onclick: () => done('next') })); }); },
    ask(Q, a = {}) {
      const idx = Q[1].map((_, i) => i); if (a.shuffle !== false) idx.sort(() => Math.random() - .5); const right = idx.indexOf(Q[2]);
      return sh.wait(done => {
        if (a.who) body.append(el('div.uc-who', { text: a.who })); body.append(el('div.uc-q', { text: Q[0] }));
        const btns = idx.map((k, i) => el('button.uc-opt', { text: Q[1][k], 'data-i': i, onclick: () => pickIt(i) })); body.append(...btns); if (a.of) body.append(pips(a.n, a.of, a.done));
        function pickIt(i) { const ok = i === right; btns.forEach(b => { b.disabled = true; }); want = { kind: 'next' };
          if (a.reveal === false) { btns[i].classList.add('pick'); setTimeout(() => done({ ok, pick: Q[1][idx[i]], i }), 260); return; }
          btns.forEach((b, j) => b.classList.add(j === right ? 'ok' : j === i ? 'no' : 'dim'));
          body.append(el('div.uc-note', { text: (ok ? 'Right. ' : 'Not quite. ') + (Q[3] || (ok ? '' : 'The answer: ' + Q[1][Q[2]] + '.')) }), el('button.uc-next', { text: 'Next', onclick: () => done({ ok, pick: Q[1][idx[i]], i }) })); }
      }, { kind: 'ask', right });
    },
    notes(title, list, btn) { return sh.wait(done => { body.append(el('div.uc-h', { text: title }), el('div.uc-notes', null, list.map(t => el('div.uc-note', { text: t }))), el('button.uc-next', { text: btn || 'Done reading', onclick: () => done('next') })); }); },
    result(r) { return sh.wait(done => { body.append(el('div.uc-res', null, r.grade && el('div.uc-grade', { text: r.grade }), el('b', { text: r.title }), (r.lines || []).filter(Boolean).map(t => el('span', { text: t }))), el('button.uc-next', { text: r.btn || 'Done', onclick: () => done('next') })); }); },
  };
  const box = el('div.uc', null, el('div.uc-head', null, chip, el('div.uc-tt', null, tt, sb), o.onLeave && el('button.uc-leave', { text: o.leaveLabel || 'Leave', onclick: () => sh.leave() })), body);
  const fit = () => box.classList.toggle('side', innerWidth > innerHeight && innerWidth >= 760); fit(); addEventListener('resize', fit);
  root().append(box); sh.el = box; cur = sh; return sh;
}
export function init() { G.on('load', () => { if (cur) cur.close(); }); }
