// Small DOM mini-games shared by the Bay Fish Hall and the Gull Point Lighthouse (sim/fishmarket.js, sim/lighthouse.js). All resolve null when the window is closed.
//   clockGame({ title, text, start, floor, rival, secs, fmt })  -> Promise<{ won, price } | null>   the falling auction clock: press to stop it before a rival does
//   sweepGame({ title, text, rounds, speed, zone, label, hint }) -> Promise<score 0..1 | null>      a marker runs along a bar: press while it is inside the green zone, once per round
//   tapGame({ title, text, n, secs, label })                    -> Promise<fraction 0..1 | null>    press n times before the time runs out
//   floatButton(label, onPress, ms) -> remove()   a non-modal button over the world (the simulation keeps running)
//   MINI.cur = { kind, act(), auto(q 0..1), state() } while one is open (tests drive it through G.fishmarket.mini / G.lighthouse.mini)
import { el, root, modal } from '../../ui/kit.js';
export const MINI = { cur: null };
const css = (e, o) => { Object.assign(e.style, o); return e; };
const INK = '#2a2733';
function shell(title, text, label, onClose) {
  const cap = el('p', { text, style: 'margin:2px 4px 8px;text-align:center;line-height:1.3' }), stage = css(el('div'), { position: 'relative', height: '96px', margin: '4px 6px 10px' }), btn = el('button.opt', null, el('span.opt-l', { text: label }));
  const m = modal({ title, cls: 'harbor-mini', onClose }); m.body.append(cap, stage, btn); return { m, cap, stage, btn };
}
export function clockGame(o) {
  return new Promise(res => {
    const secs = o.secs || 7, fmt = o.fmt || (n => '$' + n); let t = 0, raf = 0, done = false, last = performance.now();
    const ui = shell(o.title || 'The auction clock', o.text || '', 'Raise your hand!', () => finish(null));
    const face = css(el('div'), { position: 'absolute', left: '50%', top: '0', width: '92px', height: '92px', marginLeft: '-46px', border: '4px solid ' + INK, borderRadius: '50%', background: '#fbf7ee', boxSizing: 'border-box' });
    const hand = css(el('div'), { position: 'absolute', left: '50%', top: '50%', width: '4px', height: '38px', marginLeft: '-2px', marginTop: '-38px', background: '#d8342e', transformOrigin: '50% 100%' });
    const price = css(el('div'), { position: 'absolute', left: '0', right: '0', top: '100px', textAlign: 'center', fontWeight: 'bold' }); face.append(hand); ui.stage.append(face, price); ui.stage.style.height = '124px';
    const cur = () => Math.max(o.floor, Math.round(o.start - (o.start - o.floor) * Math.min(1, t / secs)));
    function act() { if (done) return; finish({ won: true, price: cur() }); }
    function frame(now) { if (done) return; const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; const c = cur(); hand.style.transform = `rotate(${(-135 + 270 * (1 - Math.min(1, t / secs))).toFixed(1)}deg)`; price.textContent = fmt(c); if (c <= o.rival) return finish({ won: false, price: c }); if (t >= secs + .4) return finish({ won: true, price: o.floor }); raf = requestAnimationFrame(frame); }
    function finish(v) { if (done) return; done = true; cancelAnimationFrame(raf); MINI.cur = null; if (v !== null) { try { ui.m.close(); } catch (e) { } } res(v); }
    ui.btn.onclick = act; MINI.cur = { kind: 'clock', act, auto: (q = 1) => finish(q <= 0 ? { won: false, price: o.rival } : { won: true, price: Math.max(o.floor, Math.round(o.rival + 1 + (1 - Math.min(1, q)) * (o.start - o.rival - 1))) }), state: () => ({ kind: 'clock', price: cur(), t }) }; raf = requestAnimationFrame(frame);
  });
}
export function sweepGame(o) {
  return new Promise(res => {
    const rounds = o.rounds || 4, got = []; let pos = 0, dir = 1, raf = 0, done = false, last = performance.now(), i = 0, zone = o.zone || .22, z0 = .3 + Math.random() * .4, spd = o.speed || 1.1;
    const ui = shell(o.title || '', o.text || '', o.label || 'Now!', () => finish(null)); ui.stage.style.height = '54px';
    const bar = css(el('div'), { position: 'absolute', left: '0', right: '0', top: '14px', height: '22px', border: '4px solid ' + INK, background: '#eaf6fb', boxSizing: 'border-box' }), zn = css(el('div'), { position: 'absolute', top: '0', bottom: '0', background: '#6fc07a' }), mk = css(el('div'), { position: 'absolute', top: '-8px', bottom: '-8px', width: '6px', marginLeft: '-3px', background: '#d8342e', boxShadow: '0 0 0 2px ' + INK });
    bar.append(zn, mk); ui.stage.append(bar);
    const show = () => { zn.style.left = ((z0 - zone / 2) * 100).toFixed(1) + '%'; zn.style.width = (zone * 100).toFixed(1) + '%'; ui.cap.textContent = `${o.text || ''} (${Math.min(rounds, i + 1)}/${rounds})${o.hint ? ' ' + o.hint(i) : ''}`; };
    function act() { if (done) return; const d = Math.abs(pos - z0); got.push(d <= zone / 2 ? 1 : Math.max(0, 1 - (d - zone / 2) / .25)); i++; if (i >= rounds) return finish(got.reduce((a, b) => a + b, 0) / rounds); zone *= .86; spd *= 1.12; z0 = .2 + Math.random() * .6; show(); }
    function frame(now) { if (done) return; const dt = Math.min(.05, (now - last) / 1000); last = now; pos += dir * spd * dt; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } mk.style.left = (pos * 100).toFixed(1) + '%'; raf = requestAnimationFrame(frame); }
    function finish(v) { if (done) return; done = true; cancelAnimationFrame(raf); MINI.cur = null; if (v !== null) { try { ui.m.close(); } catch (e) { } } res(v); }
    ui.btn.onclick = act; MINI.cur = { kind: 'sweep', act, auto: (q = 1) => finish(Math.max(0, Math.min(1, q))), state: () => ({ kind: 'sweep', round: i, of: rounds, pos }) }; show(); raf = requestAnimationFrame(frame);
  });
}
export function tapGame(o) {
  return new Promise(res => {
    const n = o.n || 12, secs = o.secs || 8; let k = 0, left = secs, raf = 0, done = false, last = performance.now();
    const ui = shell(o.title || '', o.text || '', o.label || 'Go!', () => finish(null)); ui.stage.style.height = '40px';
    const bar = css(el('div'), { position: 'absolute', left: '0', right: '0', top: '8px', height: '22px', border: '4px solid ' + INK, background: '#eaf6fb', boxSizing: 'border-box' }), fill = css(el('div'), { position: 'absolute', left: '0', top: '0', bottom: '0', width: '0%', background: '#e8c06a' }); bar.append(fill); ui.stage.append(bar);
    function act() { if (done) return; k++; fill.style.width = Math.round(k / n * 100) + '%'; if (k >= n) finish(1); }
    function frame(now) { if (done) return; const dt = Math.min(.05, (now - last) / 1000); last = now; left -= dt; ui.cap.textContent = `${o.text || ''} (${k}/${n}, ${Math.max(0, left).toFixed(1)} s)`; if (left <= 0) return finish(k / n); raf = requestAnimationFrame(frame); }
    function finish(v) { if (done) return; done = true; cancelAnimationFrame(raf); MINI.cur = null; if (v !== null) { try { ui.m.close(); } catch (e) { } } res(v); }
    ui.btn.onclick = act; MINI.cur = { kind: 'tap', act, auto: (q = 1) => finish(Math.max(0, Math.min(1, q))), state: () => ({ kind: 'tap', k, of: n, left }) }; raf = requestAnimationFrame(frame);
  });
}
export function floatButton(label, onPress, ms = 6000) {
  const b = css(el('button.opt', { onclick: () => { onPress(); rm(); } }, el('span.opt-l', { text: label })), { position: 'absolute', left: '50%', bottom: '18%', transform: 'translateX(-50%)', zIndex: 40, minWidth: '180px', pointerEvents: 'auto' });
  let gone = false; const rm = () => { if (gone) return; gone = true; b.remove(); clearTimeout(t); }; const t = setTimeout(rm, ms); root().append(b); return rm;
}
