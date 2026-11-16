// Conversation panel. openTalk(session) -> Promise (resolves when the panel closes). Sessions come from G.social.converse()
// (src/sim/social.js): { name, role, spec, char, greeting: [..], rel(), tier(), verbs(), act(verbId, arg), gifts(), foods(), places(), times(kind), favors(), close() }.
// Pauses the sim (G.modal) while open; both characters play the talk animation; Esc says goodbye / closes.
import { G } from '../core/game.js';
import { el } from './kit.js';
import { charArt } from '../core/char.js';
import { render } from '../engine/raster.js';
import { toSprite } from '../engine/sprites.js';

function injectCss() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/talk.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/talk.css' })); }
const PW = 16, PH = 17;
function portrait(spec) {
  const A = charArt(), cv = el('canvas.pix.talk-pc'); cv.width = PW; cv.height = PH; const g = cv.getContext('2d'), fr = {};
  const frame = (anim, f, mood) => { const k = anim + f + (mood || ''); if (!fr[k]) try { fr[k] = toSprite(render(A.CHAR_SB, () => A.drawChar(spec, { anim, frame: f, dir: 1, mood }), null, 0)).c; } catch (e) { fr[k] = null; } return fr[k]; };
  const draw = (anim = 'stand', f = 0, mood) => { const c = frame(anim, f, mood) || frame('stand', 0); g.clearRect(0, 0, PW, PH); if (c) g.drawImage(c, -A.CHAR_SB[0] - PW / 2, -A.CHAR_SB[1] - (spec && spec.age === 'kid' ? 19 : 22), PW, PH, 0, 0, PW, PH); };
  draw(); return { cv, draw };
}
function floatAt(parent, text, cls) { const f = el('div.talk-float.' + cls, { text }); parent.append(f); setTimeout(() => f.remove(), 1500); }

export function openTalk(ses) {
  injectCss();
  return new Promise(resolve => {
    const P = G.player, ch = ses.char, rt = ses.rt, saved = ch ? { pose: ch.pose, opts: ch.poseOpts, dir: ch.dir } : null, seated = !!(ch && (ch.zoff > 0 || (rt && rt.seated)));
    let open = true, speak = 0, pSpeak = 0, typing = null, queue = [], after = null, pt = 0, happy = 0, pending = null;
    if (ch) { if (ch.stop) ch.stop(); if (!seated && ch.faceTo && !(rt && rt.spot && rt.spot.kind === 'staff')) ch.faceTo(P.x, P.y); P.faceTo(ch.x, ch.y); if (rt) rt.talking = true; }
    const prevCam = G.camTarget; if (ch) { const o = innerWidth < 560 ? 3.2 : 1.3; G.camTarget = { x: (P.x + ch.x) / 2 + o, y: (P.y + ch.y) / 2 + o, z: P.z }; }
    const por = portrait(ses.spec), tierEl = el('span.talk-tier'), fill = el('i'), meter = el('div.talk-meter', null, fill, el('u', { style: { left: '15%' } }), el('u', { style: { left: '40%' } }), el('u', { style: { left: '75%' } }));
    const you = el('div.talk-you'), txt = el('div.talk-txt'), more = el('span.talk-more', { text: '▶' }), verbs = el('div.talk-verbs');
    const face = el('div.talk-face', null, por.cv), head = el('div.talk-head', null, el('div.talk-id', null, el('b', { text: ses.name }), el('small', { text: ses.role || '' })), el('div.talk-rel', null, tierEl, meter));
    const line = el('div.talk-line', { 'data-pad': 'line' /* PAD HOOK (ui/padnav.js) */, onclick: () => advance() }, you, txt, more);
    const box = el('div.talk', { role: 'dialog', 'aria-label': 'Conversation with ' + ses.name }, face, el('div.talk-main', null, head, line, verbs));
    const wrap = el('div.talk-wrap', null, box); document.getElementById('ui').append(wrap); G.modal++;
    const setRel = () => { const t = ses.tier(), r = ses.rel(); tierEl.textContent = t.label; tierEl.dataset.t = t.family ? 'family' : t.id; fill.style.width = Math.max(2, Math.min(100, r)) + '%'; if (G.rel && G.rel.talkMeter) try { G.rel.talkMeter(ses, head); } catch (e) { /* REL (add-only): the romance meter */ } };
    setRel();

    function type(text) { txt.textContent = ''; let i = 0; speak = 1; typing = () => { i += 2; txt.textContent = text.slice(0, i); if (i >= text.length) { typing = null; speak = .35; } }; typing.full = () => { txt.textContent = text; typing = null; speak = .2; }; }
    function next() { const q = queue.shift(); if (!q) { more.style.visibility = 'hidden'; const a = after; after = null; if (a) a(); return; } type(q); if (!queue.length) { const a = after; after = null; if (a) a(); } more.style.visibility = queue.length || pending ? 'visible' : 'hidden'; }
    function advance() { if (typing) return typing.full(); if (queue.length) return next(); if (pending) { const p = pending; pending = null; more.style.visibility = 'hidden'; p(); } }
    /** show a player line + NPC lines; then run `then` */
    function show(youLine, lines, then) { you.textContent = youLine || ''; you.style.display = youLine ? '' : 'none'; if (youLine) pSpeak = .9; queue = lines.filter(Boolean); after = then; verbs.textContent = ''; next(); }
    function opt(o, fn) { return el('button.talk-v' + (o.special ? '.pri' : '') + (o.id === 'goodbye' ? '.bye' : ''), { disabled: o.disabled, 'data-v': o.id, onclick: fn }, el('span', { text: o.label }), (o.sub || o.note) && el('small', { text: o.sub || o.note })); }
    function menu() { verbs.textContent = ''; verbs.classList.remove('list'); for (const v of ses.verbs()) verbs.append(opt(v, () => (v.picker ? picker(v) : doAct(v.id)))); }
    function list(title, items, onPick) {
      verbs.textContent = ''; verbs.classList.add('list'); verbs.append(el('div.talk-pt', { text: title }));
      if (!items.length) verbs.append(el('div.talk-pt', { text: 'Nothing suitable right now.' }));
      for (const it of items) verbs.append(opt(it, () => onPick(it.id))); verbs.append(opt({ id: 'back', label: 'Back' }, menu));
    }
    function picker(v) {
      if (G.rel && G.rel.talkPicker && G.rel.talkPicker(ses, v, { list, doAct, menu })) return;   /* REL (add-only): the date picker */
      if (v.picker === 'gift') list('Give what?', ses.gifts(), id => doAct(v.id, id));
      else if (v.picker === 'food') list('Offer what?', ses.foods(), id => doAct(v.id, id));
      else if (v.picker === 'favor') list('Ask for...', ses.favors(), id => doAct(v.id, id));
      else if (v.picker === 'visit') list('When should they come over?', ses.times('visit'), t => doAct(v.id, { t }));
      else list('Where to?', ses.places(), place => list('When?', ses.times('out'), t => doAct(v.id, { place, t })));
    }
    function doAct(id, arg) {
      verbs.classList.remove('list'); const res = ses.act(id, arg); if (!res) return menu();
      if (res.delta) { const d = Math.round(res.delta * 10) / 10; floatAt(face, (d > 0 ? '+' : '') + d + ' ♥', d > 0 ? 'up' : 'down'); if (ch) worldFloat(d); } else if (res.ok === false) floatAt(face, '...', 'meh');
      happy = res.ok && res.delta > 0 ? 2.5 : 0; setRel();
      show(res.you, [res.them, res.after], () => { if (res.end) { pending = () => close(res.start); more.style.visibility = 'visible'; verbs.append(opt({ id: 'leave', label: res.start ? 'Let’s go' : 'Leave', special: true }, () => close(res.start))); } else menu(); });
    }
    function worldFloat(d) { const s = G.toScreen(ch.x, ch.y, ch.z + 2.1), f = el('div.talk-wfloat.' + (d > 0 ? 'up' : 'down'), { text: (d > 0 ? '+' : '') + d + ' ♥', style: { left: s.x + 'px', top: s.y + 'px' } }); document.getElementById('ui').append(f); setTimeout(() => f.remove(), 1500); }
    const onFrame = dt => {
      if (!open) return; pt += dt; if (typing) typing(); if (speak > 0 && !typing) speak -= dt; if (pSpeak > 0) pSpeak -= dt; if (happy > 0) happy -= dt;
      P.t += dt; P.pose = pSpeak > 0 ? 'talk' : null;
      if (ch) { ch.t += dt; ch.moving = false; if (speak > 0) { ch.pose = 'talk'; ch.poseOpts = seated ? { seated: true } : null; } else { ch.pose = saved.pose; ch.poseOpts = saved.opts; } }
      por.draw(speak > 0 ? 'talk' : 'stand', speak > 0 ? Math.floor(pt * 5) % 3 : 0, happy > 0 ? 'happy' : undefined);
    };
    const onKey = e => { if (!open) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } else if (e.key === ' ' || e.key === 'Enter') { if (typing || queue.length || pending) { e.preventDefault(); e.stopPropagation(); advance(); } } else if (/^[1-9]$/.test(e.key)) { const b = verbs.querySelectorAll('button')[+e.key - 1]; if (b && !b.disabled && !typing && !queue.length) { e.stopPropagation(); b.click(); } } };
    function close(then) {
      if (!open) return; open = false; G.off('frame', onFrame); removeEventListener('keydown', onKey, true); wrap.remove(); G.modal--; G.camTarget = prevCam || null; P.pose = null;
      if (ch) { ch.pose = saved.pose; ch.poseOpts = saved.opts; if (rt && rt.spot && rt.spot.kind === 'staff') ch.dir = saved.dir; if (rt) rt.talking = false; }
      ses.close(); if (then) try { then(); } catch (e) { console.error(e); } resolve(ses);
    }
    ses.ui = { close, advance, el: box };
    G.on('frame', onFrame); addEventListener('keydown', onKey, true);
    show('', ses.greeting, menu);
  });
}
