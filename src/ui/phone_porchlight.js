// Phone app: PORCHLIGHT, Maple Bay's own dating app ("Leave a light on."). Data: src/story/rel_people.js PORCHLIGHT + each person's `profile` / `chat`.
// Engine: sim/rel.js (G.rel). Styles: phone_porchlight.css. Catalogue row: sim/apps.js CATALOG `porchlight` (in the store from day 4, free).
//
// Not a slot machine, on purpose: a short stack of the ten written people who fit who you are open to (no swiping, no feed, no chance roll, no streaks).
//   CARDS   the stack; a card = their portrait in their date look on a backdrop of their part of town, name, age, pronouns, headline, "You've met".
//   A CARD  about, three prompts (each with "Reply to this"), three picture tiles, looking for, Say hello, Not for me (undo in Me).
//   CHATS   like Messages. They answer a hello within a few game hours (in their own time; `chat.known` when you have met in town, `chat.fresh` when not).
//           Under the bubbles: up to four things to say (their `chat.asks`, each once: +1 warmth, at most 2 a day). After two exchanges: Suggest meeting ->
//           what sort of thing > day strip > time chips > Ask: it lands on My Day (G.rel.date.book). Their answer is `chat.yes`.
//   ME      your card as others see it (your portrait in what you are wearing, three prompts), who you are open to, what you are looking for,
//           Pause my card, People I hid, Fewer messages.
// A hello that is answered opens the romance track at Something There (never with your current boss: their card is not in the stack while you work for
// them). Meeting through the app first makes them an Acquaintance. At "Together" the app asks once whether to pause your card.
// State: G.state.rel.app = { hidden: [ids], chats: { [id]: { msgs: [{ me?, text, t }], asked: [i], n, due?: { at, text }, unread } }, paused, prompts: { q: a }, askPause }.
import { G } from '../core/game.js';
import { charArt } from '../core/char.js';
import { render as rasterRender } from '../engine/raster.js';
import { toSprite } from '../engine/sprites.js';
import { el, btn, tabs, empty, chip, safe } from './phone_util.js';
import { ROMANCEABLE, PEOPLE, PORCHLIGHT } from '../story/rel_people.js';
import { CAST_BY_ID } from '../story/cast.js';
import '../art/rel/icons.js';

export const order = 147;
const DAY = 1440, WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const S = () => { const r = G.state.rel || (G.state.rel = {}); const a = r.app || (r.app = {}); for (const [k, v] of [['hidden', []], ['chats', {}], ['prompts', {}]]) if (a[k] === undefined) a[k] = v; return a; };
const today = () => Math.floor(G.state.t / DAY);
const first = id => { const c = CAST_BY_ID[id], sh = c.short || c.name; return /[\s.]/.test(sh) ? c.name.split(' ')[0] : sh; };
const met = id => safe(() => G.social.known().includes(id), false);
const fillT = (t, x) => String(t).replace(/\{name\}/g, (G.state.player && G.state.player.name) || 'you').replace(/\{prompt\}/g, (x && x.prompt) || '');
let tab = 'cards';

/* ---------- pictures: the character art, big, on a backdrop of their part of town ---------- */
const SKY = { oldtown: ['#f3c98b', '#b5651d', '#7a4a2a'], harbor: ['#a9d6e5', '#2a6f97', '#468faf'], downtown: ['#cdb4db', '#5e548e', '#3d405b'], arts: ['#ffd6a5', '#9d4edd', '#6a4c93'], hillcrest: ['#caffbf', '#52796f', '#354f52'], campus: ['#bde0fe', '#588157', '#3a5a40'], park: ['#d8f3dc', '#40916c', '#2d6a4f'] };
const sprites = new Map();
function sprite(spec, anim = 'stand', frame = 0) { const k = anim + frame; let m = sprites.get(spec); if (!m) sprites.set(spec, m = {}); if (!m[k]) { const A = charArt(); try { m[k] = { c: toSprite(rasterRender(A.CHAR_SB, () => A.drawChar(spec, { anim, frame, dir: 1 }), null, 0)).c, A }; } catch (e) { m[k] = m.stand0 || null; } } return m[k]; }
/** a w x h pixel picture (scaled by css): backdrop + the figure. kind: 0 portrait (3/4 figure), 1..3 the three photo tiles */
function picture(id, w, h, kind, spec, lift = 0) {
  const cv = el('canvas.pix.pl-pic'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), c = CAST_BY_ID[id] || {}, pal = SKY[c.district] || SKY.downtown, seed = [...String(id)].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7 + kind * 13) >>> 0, rnd = i => ((seed * (i + 3) * 2654435761) >>> 8) % 1000 / 1000;
  g.fillStyle = kind === 2 ? pal[1] : pal[0]; g.fillRect(0, 0, w, h);
  if (kind !== 2) { g.fillStyle = '#ffffff55'; g.fillRect(Math.floor(rnd(1) * w * .6), 3 + Math.floor(rnd(2) * 6), 9, 2); g.fillRect(Math.floor(rnd(3) * w * .7) + 4, 9 + Math.floor(rnd(4) * 5), 6, 2); }
  /* a far line of roofs, then a nearer band, then the ground */
  const hz = Math.round(h * (kind ? .62 : .58)); g.fillStyle = pal[2]; for (let x = 0, i = 0; x < w; i++) { const bw = 5 + Math.floor(rnd(10 + i) * 8), bh = 6 + Math.floor(rnd(30 + i) * (kind === 2 ? 5 : 14)); g.fillRect(x, hz - bh, bw, bh); if (rnd(50 + i) > .5) { g.fillStyle = '#ffe9a6'; g.fillRect(x + 2, hz - bh + 2, 1, 1); g.fillStyle = pal[2]; } x += bw + 1; }
  g.fillStyle = pal[1]; g.fillRect(0, hz, w, h - hz); g.fillStyle = '#00000022'; g.fillRect(0, hz, w, 1); for (let i = 0; i < 6; i++) g.fillRect(Math.floor(rnd(70 + i) * w), hz + 3 + Math.floor(rnd(80 + i) * (h - hz - 4)), 4, 1);
  const sp = spec || safe(() => G.rel.who(id, 'date').spec, null), anim = kind === 2 ? 'sit' : kind === 3 ? 'wave' : 'stand', s = sp && (sprite(sp, anim, 0) || sprite(sp)); if (!s) return cv;
  const A = s.A, sc = kind ? (w < 50 ? 1.5 : 2) : 3, fw = 20, fh = kind ? (w < 50 ? 20 : 27) : 21, sx = -A.CHAR_SB[0] - fw / 2, sy = -A.CHAR_SB[1] - 26;
  g.imageSmoothingEnabled = false; g.drawImage(s.c, sx, sy, fw, fh, Math.round(w / 2 - fw * sc / 2 + (kind === 1 ? -6 : kind === 3 ? 5 : 0)), Math.round(h - fh * sc - lift), fw * sc, fh * sc);
  return cv;
}

/* ---------- who is in the stack ---------- */
const PRON = { 'she/her': 'w', 'he/him': 'm', 'they/them': 'n' };
function deck() {
  const a = S(), open = safe(() => G.rel.openTo(), ['w', 'm', 'n']), seed = (G.state.social && G.state.social.seed0) || 0;
  return ROMANCEABLE.filter(id => open.includes(PRON[PEOPLE[id].pronouns]) && !a.hidden.includes(id) && !isBoss(id) && !a.chats[id] && G.rel.stage(id) === 'none' && safe(() => G.rel.people().find(p => p.id === id).can, true) === true)
    .sort((x, y) => ((x.charCodeAt(0) * 7 + x.length * 13 + seed) % 11) - ((y.charCodeAt(0) * 7 + y.length * 13 + seed) % 11));
}
const isBoss = id => { const P = PEOPLE[id], j = safe(() => G.jobs.current(), null); return !!(P.work && P.work.bossOf && j && j.id === P.work.bossOf); };

/* ---------- chats ---------- */
function say(id, text, me) { const c = S().chats[id] || (S().chats[id] = { msgs: [], asked: [], n: 0, unread: 0 }); c.msgs.push({ me: me ? 1 : 0, text, t: G.state.t }); if (c.msgs.length > 40) c.msgs.shift(); if (!me) c.unread = (c.unread || 0) + 1; return c; }
/** when in their own time will they answer? (a few game hours on; never in the small hours) */
function replyAt(id) { let t = G.state.t + 90 + ((id.length * 37 + today() * 11) % 150); const h = (t % DAY) / 60; if (h >= 22.5) t += (24 - h + 7.5) * 60; else if (h < 7.5) t += (7.5 - h) * 60; return Math.round(t); }
function hello(id, text) { const c = say(id, text, true); c.due = { at: replyAt(id), text: (met(id) ? PEOPLE[id].chat.known : PEOPLE[id].chat.fresh)[0], open: 1 }; c.unread = 0; }
function pump() {
  if (!G.state.rel || !G.state.rel.app) return; const a = S();
  for (const id in a.chats) { const c = a.chats[id]; if (!c.due || c.due.at > G.state.t) continue; const d = c.due; delete c.due; say(id, fillT(d.text));
    if (d.open) { safe(() => { if (!met(id)) { G.social.meet(id); if (G.social.rel(id) < 15) G.social.setRel(id, 15); } }); safe(() => G.rel.debug && 0); safe(() => openTrack(id)); }
    if (c.noteDay !== today()) { c.noteDay = today(); safe(() => G.phone.notify({ app: 'porchlight', title: 'Porchlight · ' + first(id), text: fillT(d.text), icon: 'app.porchlight', priority: 'normal', data: { chat: id } })); } }
}
function openTrack(id) { if (G.rel.stage(id) !== 'none') return; const ok = safe(() => G.rel._openTrack(id, 'app'), false); if (ok) G.emit('porchlight:match', id); }
function ask(id, i) { const c = S().chats[id], a = PEOPLE[id].chat.asks[i]; if (!c || !a || c.asked.includes(i)) return; c.asked.push(i); say(id, a[0], true); say(id, a[1]); c.unread = 0; c.n++; const A = S(); if (A.day !== today()) { A.day = today(); A.n = 0; } if (A.n < 2) { A.n++; safe(() => G.rel.addWarmth(id, 1, 'app')); } }

/* ---------- views ---------- */
function cardRow(id, ctx) {
  const P = PEOPLE[id], c = CAST_BY_ID[id];
  return el('button.pl-card', { 'data-pl': 'card:' + id, onclick: () => ctx.push(first(id), cardView(id), 'card:' + id) }, picture(id, 119, 100, 0),
    el('div.pl-card-b', null, el('b', { text: `${first(id)}, ${P.age}` }), el('small', { text: P.pronouns + (met(id) ? '' : '') }), met(id) ? el('span.pl-met', { text: "You've met" }) : null), el('i', { text: P.profile.headline }));
}
function helloSheet(id, ctx, prompt) {
  const ops = PORCHLIGHT.openers.map(o => fillT(o, { prompt: prompt || PEOPLE[id].profile.prompts[0][0] })), list = prompt ? [ops[2], ops[0]] : ops;
  const sh = el('div.pl-sheet', null, el('b', { text: 'Say hello to ' + first(id) }), ...list.map((t, i) => el('button.pl-op', { 'data-pl': 'op:' + i, onclick: () => { sh.remove(); hello(id, t); tab = 'chats'; ctx.back(); ctx.tip(`Sent. ${first(id)} answers when they have a minute.`); } }, t)), el('button.pl-quiet', { text: 'Not now', onclick: () => sh.remove() }));
  ctx.body.append(sh); sh.scrollIntoView({ block: 'end' });
}
function cardView(id) {
  return (b, ctx) => {
    const P = PEOPLE[id], pr = P.profile, has = !!S().chats[id];
    b.classList.add('pl'); b.append(el('div.pl-hero', null, picture(id, 119, 100, 0, null, 15), el('div.pl-hero-t', null, el('b', { text: `${first(id)}, ${P.age}` }), el('small', { text: `${P.pronouns} · ${P.work.title}` }))),
      el('p.pl-head', { text: pr.headline }), el('div.pl-sec', { text: 'About' }), el('p.pl-about', { text: pr.about }));
    for (const [q, a] of pr.prompts) b.append(el('div.pl-prompt', null, el('small', { text: q }), el('b', { text: a }), has ? null : el('button.pl-reply', { 'data-pl': 'reply', onclick: () => helloSheet(id, ctx, q) }, 'Reply to this')));
    b.append(el('div.pl-tiles', null, ...pr.photos.map((cap, i) => el('figure', null, picture(id, 55, 55, i + 1), el('figcaption', { text: cap })))),
      el('div.pl-sec', { text: 'Looking for' }), el('p.pl-about', { text: pr.looking }));
    if (has) b.append(btn('Open your chat', () => { ctx.back(); tab = 'chats'; ctx.push(first(id), chatView(id), 'chat:' + id); }, 'wide'));
    else b.append(el('button.pl-hello', { 'data-pl': 'hello', onclick: () => helloSheet(id, ctx) }, 'Say hello'), el('button.pl-quiet', { 'data-pl': 'hide', onclick: () => { S().hidden.push(id); ctx.back(); ctx.tip(`Hidden. Undo it in Me.`); } }, 'Not for me'));
  };
}
function meetSheet(id, ctx) {
  const types = safe(() => G.rel.date.types(id), []); let type = types.length === 1 ? types[0] : null, venue = type && type.venues[0] ? type.venues[0].key : null, t = null;
  const sh = el('div.pl-sheet.meet'); const draw = () => {
    const times = type ? safe(() => G.rel.date.times(id, type.id, venue), []) : [], days = [...new Set(times.map(x => Math.floor(x.t / DAY)))], d0 = today(), day = t ? Math.floor(t / DAY) : days[0];
    sh.replaceChildren(...[el('b', { text: 'What sort of thing?' }), el('div.pl-types', null, ...types.slice(0, 9).map(T => el('button.pl-type' + (type === T ? '.on' : ''), { 'data-pl': 'type:' + T.id, onclick: () => { type = T; venue = T.venues[0] ? T.venues[0].key : null; t = null; draw(); } }, el('b', { text: T.name }), el('small', { text: T.sub })))),
      type && type.venues.length > 1 ? el('div.pl-chips', null, ...type.venues.map(v => chip(v.name, venue === v.key ? 'on' : '', () => { venue = v.key; t = null; draw(); }))) : null,
      type ? el('div.pl-days', null, ...[0, 1, 2, 3, 4, 5].map(k => { const d = d0 + k, ok = days.includes(d); return el('button.pl-day' + (ok ? '' : '.off') + (day === d && ok ? '.on' : ''), { disabled: !ok || undefined, 'data-pl': 'day:' + k, onclick: () => { t = times.find(x => Math.floor(x.t / DAY) === d).t; draw(); } }, el('small', { text: k === 0 ? 'Today' : WD[d % 7] }), el('b', { text: ok ? '•' : '' })); })) : null,
      type && !times.length ? el('p', { text: `${first(id)} has no free time for that this week. Try another idea.` }) : null,
      type && day !== undefined ? el('div.pl-chips', null, ...times.filter(x => Math.floor(x.t / DAY) === day).map(x => chip(x.label.split(', ')[1], t === x.t ? 'on' : '', () => { t = x.t; draw(); }))) : null,
      el('button.pl-hello', { 'data-pl': 'askdate', disabled: !(type && t) || undefined, onclick: () => { const ok = safe(() => G.rel.date.book({ id, type: type.id, venue, t }), null); sh.remove(); if (ok) { say(id, 'Would you like to meet? ' + type.name.replace(/^A first date: /, '') + ', ' + times.find(x => x.t === t).label + '.', true); say(id, PEOPLE[id].chat.yes); S().chats[id].unread = 0; ctx.refresh(); ctx.tip("It's on your day."); } else ctx.tip('That day is taken. Pick another.'); } }, 'Ask'),
      el('button.pl-quiet', { text: 'Not now', onclick: () => sh.remove() })].filter(Boolean));
  };
  draw(); ctx.body.append(sh); sh.scrollIntoView({ block: 'end' });
}
function chatView(id) {
  return (b, ctx) => {
    b.classList.add('pl'); const c = S().chats[id], P = PEOPLE[id]; if (!c) return b.append(empty('app.porchlight', 'No chat yet', 'Say hello from their card.')); c.unread = 0;
    b.append(el('div.pl-chat-h', null, picture(id, 40, 40, 1), el('div', null, el('b', { text: first(id) }), el('small', { text: G.rel.stageLabel(id) || (c.due ? 'They answer when they have a minute' : 'Porchlight') }))));
    const list = el('div.pl-msgs'); for (const m of c.msgs) list.append(el('div.pl-msg' + (m.me ? '.me' : ''), { text: m.text })); b.append(list);
    const answered = c.msgs.some(m => !m.me), datedOrBooked = safe(() => G.rel.date.list().some(d => d.id === id), false), si = ['none', 'spark', 'dating', 'exclusive', 'partner', 'engaged', 'married'].indexOf(G.rel.stage(id));
    if (!answered) b.append(el('p.pl-note', { text: 'Nobody ghosts on Porchlight. Give it a few hours, and go outside.' }));
    else {
      const left = P.chat.asks.map((a, i) => [a, i]).filter(x => !c.asked.includes(x[1]));
      if (left.length) b.append(el('div.pl-asks', null, ...left.map(([a, i]) => el('button.pl-op', { 'data-pl': 'ask:' + i, onclick: () => { ask(id, i); ctx.refresh(); } }, a[0]))));
      if ((c.n >= 2 || !left.length) && si >= 1 && si < 5 && !datedOrBooked) b.append(el('button.pl-meet', { 'data-pl': 'meet', onclick: () => meetSheet(id, ctx) }, 'Suggest meeting'));
      else if (datedOrBooked) b.append(el('p.pl-note', { text: "It's on your day. See you there." }));
      else if (c.n < 2) b.append(el('p.pl-note', { text: 'A couple of questions first. Then you can suggest meeting.' }));
    }
    setTimeout(() => { list.scrollTop = list.scrollHeight; }, 0);
  };
}
function meView(b, ctx) {
  const a = S(), open = G.rel.openTo(), PL = PORCHLIGHT.player, me = G.state.player || {};
  b.append(el('div.pl-hero', null, picture('@me', 119, 100, 0, G.player && G.player.spec, 15), el('div.pl-hero-t', null, el('b', { text: me.name || 'You' }), el('small', { text: 'Your card, as others see it' }))));
  const qs = PL.prompts.slice(0, 3); for (const q of qs) { const cur = a.prompts[q] || PL.answers[q][0]; b.append(el('div.pl-prompt', null, el('small', { text: q }), el('b', { text: cur }), el('div.pl-chips', null, ...PL.answers[q].map((t, i) => chip(String(i + 1), cur === t ? 'on' : '', () => { a.prompts[q] = t; ctx.refresh(); })))) ); }
  b.append(el('div.pl-sec', { text: 'Open to' }), el('div.pl-chips', null, ...[['w', 'Women'], ['m', 'Men'], ['n', 'Nonbinary people']].map(([k, n]) => chip(n, open.includes(k) ? 'on' : '', () => { const s = new Set(open); if (s.has(k)) s.delete(k); else s.add(k); G.rel.openTo([...s]); ctx.refresh(); }))),
    el('div.pl-sec', { text: 'Looking for' }), el('div.pl-chips', null, ...PL.lookingFor.map(t => chip(t, (G.state.rel.looking || 'Not sure yet') === t ? 'on' : '', () => { G.state.rel.looking = t; ctx.refresh(); }))),
    el('div.pl-sec', { text: 'Your card' }), btn(a.paused ? 'Your card is paused. Switch it back on' : 'Pause my card', () => { a.paused = !a.paused; ctx.refresh(); }, 'wide'),
    btn(G.state.rel.fewer ? 'Fewer messages from people: ON' : 'Fewer messages from people: off', () => { G.state.rel.fewer = !G.state.rel.fewer; ctx.refresh(); }, 'wide'));
  if (a.hidden.length) b.append(el('div.pl-sec', { text: 'People I hid' }), el('div.pl-chips', null, ...a.hidden.map(id => chip(first(id) + '  ↩', '', () => { a.hidden.splice(a.hidden.indexOf(id), 1); ctx.refresh(); }))));
}
function render(b, ctx) {
  const a = S(); if (ctx.arg && ctx.arg.chat && a.chats[ctx.arg.chat]) { const id = ctx.arg.chat; ctx.arg = null; tab = 'chats'; setTimeout(() => ctx.push(first(id), chatView(id), 'chat:' + id), 0); }
  b.classList.add('pl'); const unread = Object.values(a.chats).reduce((n, c) => n + (c.unread ? 1 : 0), 0);
  b.append(tabs([{ id: 'cards', name: 'Cards' }, { id: 'chats', name: 'Chats', badge: unread || '' }, { id: 'me', name: 'Me' }], tab, t => { tab = t; ctx.refresh(); }));
  if (a.askPause && !a.paused) b.append(el('div.pl-ask', null, el('span', { text: 'You are seeing somebody. Pause your card? Chats are kept.' }), btn('Pause it', () => { a.paused = true; a.askPause = 0; ctx.refresh(); }, 'gold'), btn('Leave it on', () => { a.askPause = 0; ctx.refresh(); })));
  if (tab === 'cards') {
    b.append(el('div.pl-top', null, el('span.pl-lamp'), el('div', null, el('b', { text: PORCHLIGHT.name }), el('small', { text: PORCHLIGHT.tagline }))));
    if (a.paused) return b.append(empty('app.porchlight', 'Your card is paused', 'Nobody sees it, and the stack is put away. Chats are kept.', btn('Switch it back on', () => { a.paused = false; ctx.refresh(); }, 'pri')));
    const ids = deck(); for (const id of ids) b.append(cardRow(id, ctx));
    b.append(el('p.pl-end', { text: ids.length ? "That's everyone for now. Go outside." : G.rel.openTo().length ? "That's everyone for now. Go outside." : 'Tell Porchlight who you are open to, in Me.' }));
  } else if (tab === 'chats') {
    const ids = Object.keys(a.chats).sort((x, y) => (a.chats[y].msgs.slice(-1)[0] || {}).t - (a.chats[x].msgs.slice(-1)[0] || {}).t);
    if (!ids.length) return b.append(empty('app.porchlight', 'No chats yet', 'Say hello to somebody from their card. Everybody answers.'));
    for (const id of ids) { const c = a.chats[id], last = c.msgs[c.msgs.length - 1] || {}; b.append(el('button.pl-row', { 'data-pl': 'chat:' + id, onclick: () => ctx.push(first(id), chatView(id), 'chat:' + id) }, picture(id, 40, 40, 1), el('span.pl-row-m', null, el('b', { text: first(id) }), el('small', { text: (last.me ? 'You: ' : '') + (last.text || '') })), c.unread ? el('em') : null)); }
  } else meView(b, ctx);
}
function injectCss() { if (!document.querySelector('link[href="src/ui/style.css"]') || document.querySelector('link[href="src/ui/phone_porchlight.css"]')) return; document.head.append(el('link', { rel: 'stylesheet', href: 'src/ui/phone_porchlight.css' })); }
export function init() {
  injectCss(); if (!G.phone || !G.phone.registerApp) return;
  G.phone.registerApp({ id: 'porchlight', name: 'Porchlight', question: 'Who else is out there?', iconId: 'app.porchlight', color: '#2e3a5c', render, badge: () => safe(() => Object.values(S().chats).reduce((n, c) => n + (c.unread ? 1 : 0), 0), 0) });
  G.on('minutes', pump);
  G.porchlight = { deck, hello, ask, pump, state: S, replyNow: id => { const c = S().chats[id]; if (c && c.due) { c.due.at = 0; pump(); return true; } return false; } };
}
