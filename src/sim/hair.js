// Hair as a service: lookbooks at the barber, the salon and the colour bar; a cutting scene in the chair; the reveal in the mirror; hair that grows out.
//
// Lookbooks (data/hair_styles.js `books`): 'barber' = Otis & Sons (pub:22) and any barbershop: short cuts, fades, beards, natural colours;
//   'salon' = Bloom Beauty in the Galleria (mall:bloom) and any salon: the long and styled looks, natural colours and a few bright ones;
//   'colorbar' = the colour bar at Lacquer Lounge (pub:17) and any nail bar: every dye plus two-tone effects (ombre, dipped tips, streaks, split).
// Prices: style price (by length) x BOOK[kind].level; colour COLOR_PRICE (+FX_PRICE for an effect); beard price from FACIAL; a tidy-up trim TRIM_PRICE.
// G.hair
//   open(kind, venueId?, fx?)   the lookbook window      current() -> { hair, hairColor, hairColor2, hairFx, beard }      shaggy() -> bool (SHAG_DAYS since the last cut)
//   daysSince()   history() -> [{ d (day), what, where }]   known() -> [style ids] you have worn (the creator's "change your look" offers these + the starter set)
//   bookFor(roomId) -> kind | null      styles(kind) -> [style rows]
// State G.state.hair = { last: day of the last cut, hist: [...], known: [ids], nag: day of the last "getting shaggy" toast }.  The hair itself lives in the wardrobe base spec.
// Events: 'hair:change'(current, kind), 'hair:cut'(styleId, venueId), 'hair:dye'(hex, fx), and 'service'('haircut' | 'hair colour', venueId) for the guide.
import { G } from '../core/game.js';
import { modal, el, toast, choose } from '../ui/kit.js';
import { registerFixture } from '../scenes/interior.js';
import { HAIR_STYLES, HAIR_BY_ID, FACIAL, HAIR_DYES } from '../data/clothes.js';
import { stage, specThumb, big, injectCss, put } from '../ui/phone_closet_kit.js';

export const order = 133;
export const SHAG_DAYS = 21, COLOR_PRICE = 30, FX_PRICE = 15, TRIM_PRICE = 10, CUT_MIN = 25;
export const BOOK = { barber: { name: 'Barber lookbook', level: 1, fx: false, dyes: d => d[2] }, salon: { name: 'Salon lookbook', level: 1.4, fx: false, dyes: (d, i) => d[2] || i % 2 === 0 }, colorbar: { name: 'Colour bar', level: 1.2, fx: true, dyes: () => true } };
const FX = [['', 'One colour'], ['ombre', 'Ombre'], ['tips', 'Dipped tips'], ['streak', 'Streaks'], ['split', 'Split dye']];
let S = null;
const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const today = () => Math.floor((G.state.t || 0) / 1440), fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n), stamp = id => safe(() => G.guide.stamp(id));
const baseSpec = () => Object.assign({}, (G.state.wardrobe && G.state.wardrobe.base) || G.state.player.spec || {});
const current = () => { const b = baseSpec(); return { hair: b.hair || 'short', hairColor: b.hairColor || '#4a3022', hairColor2: b.hairColor2 || null, hairFx: b.hairFx || null, beard: b.beard || false }; };
const starters = () => HAIR_STYLES.filter(h => h.starter).map(h => h.id);
const known = () => [...new Set(starters().concat(S.known || [], [current().hair]))];
const daysSince = () => today() - (S.last === undefined || S.last === null ? today() : S.last);
const shaggy = () => daysSince() >= SHAG_DAYS;
const styles = kind => HAIR_STYLES.filter(h => (h.books || []).includes(kind));
const priceOf = (h, kind) => Math.round((h.price || 25) * BOOK[kind].level);
function bookFor(roomId) {
  if (roomId === 'pub:22') return 'barber'; if (roomId === 'pub:17') return 'colorbar'; if (roomId === 'mall:bloom') return 'salon';
  const k = safe(() => G.publicPlaces.get(roomId).kind, ''); return k === 'barber' ? 'barber' : k === 'salon' ? 'salon' : k === 'nails' ? 'colorbar' : null;
}
function setHair(ch, kind, venue, what) {
  const b = baseSpec(); Object.assign(b, ch); for (const k of ['hairColor2', 'hairFx']) if (!b[k]) delete b[k];
  safe(() => G.wardrobe.setLook(b)); if (ch.hair && !S.known.includes(ch.hair)) S.known.push(ch.hair);
  S.last = today(); S.nag = null; S.hist.push({ d: today(), what, where: venue || '' }); if (S.hist.length > 30) S.hist.shift();
  G.emit('hair:change', current(), kind);
}

/* ---------- the chair ---------- */
function snips(color) { // little DOM animation over the player's head: scissors and falling tufts
  const box = el('div', { style: { position: 'fixed', pointerEvents: 'none', zIndex: 50, width: '0', height: '0' } }), sc = el('div', { style: { position: 'absolute', left: '10px', top: '-34px', font: '20px/1 monospace', color: '#e8e8ee', textShadow: '1px 1px 0 #2a2733, -1px -1px 0 #2a2733' }, text: '✂' });
  put(box, sc); document.body.append(box); let t = 0, bits = [];
  const upd = dt => { t += dt || .016; const p = G.player, s = G.toScreen(p.x, p.y, (p.z || 0) + 1.5); box.style.left = s.x + 'px'; box.style.top = s.y + 'px';
    sc.style.transform = `translate(${Math.sin(t * 5) * 14}px, ${Math.cos(t * 7) * 4}px) rotate(${Math.sin(t * 16) * 22 - 40}deg)`;
    if (Math.random() < .25) { const b = el('div', { style: { position: 'absolute', width: '4px', height: '4px', background: color, left: (Math.random() * 30 - 15) + 'px', top: '-10px' } }); b._v = 0; b._y = -10; put(box, b); bits.push(b); }
    for (const b of bits) { b._v += 90 * (dt || .016); b._y += b._v * (dt || .016); b.style.top = b._y + 'px'; if (b._y > 46) b.remove(); } bits = bits.filter(b => b.isConnected); };
  G.on('frame', upd); return () => { G.off('frame', upd); box.remove(); };
}
function chair(fx, apply, title, venue) {
  const before = safe(() => G.wardrobe.currentSpec(), G.state.player.spec), seat = fx && fx.seats && fx.seats[0], stop = snips(current().hairColor);
  const finish = () => { stop(); apply(); safe(() => { G.needs.add('hygiene', 10); G.needs.add('fun', 8); G.needs.add('social', 6); }); reveal(before, title); };
  const act = { label: 'In the chair', anim: seat ? 'sit' : 'stand', minutes: CUT_MIN, done: finish, cancel: finish };
  if (seat) act.at = { x: seat.x, y: seat.y, z: seat.z || 0, dir: seat.dir === undefined ? 1 : seat.dir };
  if (!safe(() => (G.startActivity(act), true), false)) finish();
}
function reveal(before, title) {
  injectCss(); const now = safe(() => G.wardrobe.currentSpec(), G.state.player.spec), m = modal({ title: 'The reveal', cls: 'wardrobe' });
  put(m.body, el('div', { style: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '14px' } }, el('div', { style: { textAlign: 'center', fontSize: '11px', opacity: .75 } }, specThumb(before, 'head', 3), el('div', { text: 'before' })), stage(now, 7)),
    el('p', { style: { textAlign: 'center', margin: '8px 0 0' }, text: title }), el('p.cw-note', { style: { textAlign: 'center' }, text: 'The cape comes off with a flourish. Tap the mirror to see the back.' }));
}

/* ---------- the lookbook ---------- */
function open(kind, venue, fx) {
  if (!BOOK[kind]) return false; injectCss(); const B = BOOK[kind], cur = current(), pick = Object.assign({}, cur); let tab = kind === 'colorbar' ? 'colour' : 'style';
  const m = modal({ title: B.name, cls: 'wardrobe' }), spec = () => Object.assign(safe(() => G.wardrobe.currentSpec(), Object.assign({}, G.state.player.spec)), { hair: pick.hair, hairColor: pick.hairColor, hairColor2: pick.hairColor2, hairFx: pick.hairFx, beard: pick.beard, hat: null, shag: false });
  const st = stage(spec(), 6), info = el('div'), host = el('div'), tabs = el('div.cw-chips');
  const cost = () => { let n = 0; if (pick.hair !== cur.hair) n += priceOf(HAIR_BY_ID[pick.hair] || { price: 25 }, kind); if (pick.hairColor !== cur.hairColor || (pick.hairColor2 || null) !== (cur.hairColor2 || null) || (pick.hairFx || null) !== (cur.hairFx || null)) n += COLOR_PRICE + (pick.hairFx ? FX_PRICE : 0);
    if (pick.beard !== cur.beard && pick.beard) n += Math.round(((FACIAL.find(f => f.id === pick.beard) || { price: 12 }).price)); else if (pick.beard !== cur.beard) n += 6; return n; };
  const drawInfo = () => { st.set(spec()); info.textContent = ''; const n = cost(), h = HAIR_BY_ID[pick.hair];
    put(info, el('b', { text: (h && h.name) || 'Your hair' }), el('div', { text: n ? 'Total ' + fmt(n) : 'No changes yet' }), shaggy() ? el('div', { text: `Last cut ${daysSince()} days ago` }) : null,
      el('button.opt', { disabled: !n, style: { marginTop: '6px' }, onclick: () => book(n) }, el('span.opt-l', { text: n ? 'Book it · ' + fmt(n) : 'Pick something' })),
      shaggy() && kind !== 'colorbar' ? el('button.opt', { style: { marginTop: '4px' }, onclick: () => book(TRIM_PRICE, true) }, el('span.opt-l', { text: 'Just a trim · ' + fmt(TRIM_PRICE) }), el('span.opt-s', { text: 'same style, tidied up' })) : null); };
  function book(n, trim) {
    if (!safe(() => G.money.pay(n, trim ? 'Trim' : B.name, { category: 'service', venue }), false)) return; m.close();
    const cut = pick.hair !== cur.hair, dye = pick.hairColor !== cur.hairColor || pick.hairColor2 !== cur.hairColor2 || pick.hairFx !== cur.hairFx, name = trim ? 'A tidy trim. Sharp again.' : `${(HAIR_BY_ID[pick.hair] || { name: 'New hair' }).name}${dye ? ', freshly coloured' : ''}. That is you now.`;
    chair(fx, () => { setHair(trim ? {} : { hair: pick.hair, hairColor: pick.hairColor, hairColor2: pick.hairColor2 || null, hairFx: pick.hairFx || null, beard: pick.beard }, kind, venue, trim ? 'Trim' : (cut ? (HAIR_BY_ID[pick.hair] || { name: pick.hair }).name : '') + (dye ? (cut ? ' + ' : '') + 'colour' : '') + (pick.beard !== cur.beard ? ' + beard' : ''));
      if (cut) { stamp('x:hair_new'); G.emit('hair:cut', pick.hair, venue); } if (dye) { stamp('x:hair_dye'); G.emit('hair:dye', pick.hairColor, pick.hairFx); } G.emit('service', dye && !cut ? 'hair colour' : 'haircut', venue); }, name, venue);
  }
  const cells = (list, make, n0 = 24) => { const g = el('div.cw-grid'); let n = 0; const add = () => { const end = Math.min(list.length, n + n0); for (; n < end; n++) put(g, make(list[n])); if (n < list.length) { const b = el('button.cw-more', { text: `Show more (${list.length - n} left)`, onclick: () => { b.remove(); add(); } }); put(g, b); } }; add(); return g; };
  const draw = () => {
    tabs.textContent = ''; const T = [['style', 'Styles'], ['colour', 'Colour']]; if (kind === 'barber') T.push(['beard', 'Beard']); if (kind === 'colorbar') T.shift();
    for (const [k, n] of T) put(tabs, el('button' + (tab === k ? '.on' : ''), { text: n, onclick: () => { tab = k; draw(); } }));
    host.textContent = '';
    if (tab === 'style') { const list = styles(kind); put(host, el('p.cw-note', { text: `${list.length} looks in this book. Other places carry different ones.` }), cells(list, h => el('button.cw-cell' + (pick.hair === h.id ? '.on' : ''), { onclick: () => { pick.hair = h.id; drawInfo(); draw(); } }, specThumb(Object.assign(spec(), { hair: h.id }), 'head', 3), el('b', { text: h.name }), el('small', { text: h.id === cur.hair ? 'yours now' : fmt(priceOf(h, kind)) })))); }
    else if (tab === 'colour') {
      const dyes = HAIR_DYES.filter((d, i) => B.dyes(d, i)), sw = (key) => el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '5px', margin: '4px 0 8px' } }, dyes.map(d => el('button', { title: d[1], 'aria-label': d[1], style: { width: '30px', height: '30px', background: d[0], border: pick[key] === d[0] ? '3px solid #fffdf4' : '2px solid #2a2733', outline: pick[key] === d[0] ? '2px solid #2a2733' : 'none', cursor: 'pointer' }, onclick: () => { pick[key] = d[0]; if (key === 'hairColor2' && !pick.hairFx) pick.hairFx = 'ombre'; drawInfo(); draw(); } })));
      put(host, el('b', { text: 'Colour · ' + fmt(COLOR_PRICE) }), sw('hairColor'));
      if (B.fx) { put(host, el('b', { text: 'Two-tone effect · +' + fmt(FX_PRICE) })); const r = el('div.cw-chips'); for (const [k, n] of FX) put(r, el('button' + ((pick.hairFx || '') === k ? '.on' : ''), { text: n, onclick: () => { pick.hairFx = k || null; if (!k) pick.hairColor2 = null; else if (!pick.hairColor2) pick.hairColor2 = '#f07aa8'; drawInfo(); draw(); } })); put(host, r); if (pick.hairFx) put(host, el('b', { text: 'Second colour' }), sw('hairColor2')); }
      else put(host, el('p.cw-note', { text: 'Two-tone effects and the brightest dyes are done at the colour bar at Lacquer Lounge.' }));
    } else put(host, cells([{ id: false, name: 'Clean shaven', price: 6 }].concat(FACIAL), f => el('button.cw-cell' + ((pick.beard || false) === f.id ? '.on' : ''), { onclick: () => { pick.beard = f.id; drawInfo(); draw(); } }, specThumb(Object.assign(spec(), { beard: f.id }), 'head', 3), el('b', { text: f.name }), el('small', { text: fmt(f.price) }))));
  };
  put(m.body, el('div.cw-top', null, st, info), tabs, host); drawInfo(); draw(); return true;
}
function onRoom(scene) {
  const id = scene.roomId, kind = bookFor(id);
  for (const it of scene.interactables) {
    if (it._hair) continue;
    if (kind && it.fx && it.fx.tags.includes('checkout')) { const orig = it.use, chairFx = (scene.fixtures.find(f => f.seats && f.seats.length && /armchair|pedi|barber/.test(f.asset.id)) || null); it._hair = 1;
      it.use = async (g, x) => { const v = await choose(kind === 'colorbar' ? 'Lacquer Lounge' : 'Front desk', [{ label: BOOK[kind].name, sub: kind === 'colorbar' ? 'dyes, ombre, dipped tips' : `${styles(kind).length} looks, colour${kind === 'barber' ? ', beards' : ''}`, value: 1 }, { label: 'Front desk', sub: 'the other services', value: 2 }]); if (v === 1) open(kind, id, chairFx); else if (v === 2 && orig) orig(g, x); }; }
    else if (id === 'deptstore' && it.fx && it.fx.item && it.fx.item.venue === 'mall:bloom') { const orig = it.use; it._hair = 1;
      it.use = async (g, x) => { const v = await choose('Bloom Beauty', [{ label: 'Hair salon', sub: `${styles('salon').length} looks in the lookbook, colour`, value: 1 }, { label: 'Beauty counter', sub: 'the shop', value: 2 }]); if (v === 1) open('salon', 'mall:bloom', null); else if (v === 2) { if (G.shop && G.shop.open) G.shop.open('mall:bloom', { checkHours: true }); else if (orig) orig(g, x); } }; }
  }
}
function onDay() { if (!S || !shaggy() || S.nag === today() || (S.nag && today() - S.nag < 7)) return; const h = current().hair; if (h === 'bald' || h === 'buzz' || h === 'hijab') return; S.nag = today(); safe(() => G.wardrobe.refresh()); toast('Your hair is getting a little shaggy. Any barber or salon will tidy it up.', 'info', 4200); }

export function init() {
  const mk = () => ({ last: null, hist: [], known: [], nag: null });
  S = G.defineState('hair', mk); const fix = () => { S = G.state.hair || G.defineState('hair', mk); S.hist = S.hist || []; S.known = S.known || []; if (S.last === null || S.last === undefined) S.last = today(); };
  fix(); G.on('load', fix); G.on('game:new', () => { G.state.hair = mk(); fix(); });
  G.hair = { open, current, shaggy, daysSince, history: () => S.hist.slice(), known, bookFor, styles, BOOK };
  registerFixture('barber', (fx, scene) => { const kind = bookFor(scene.roomId); if (!kind || !/station/.test(fx.asset.id)) return null; return { label: 'Barber mirror: the lookbook', hit: 14, spot: null, range: 2.4 /* QA round 4: the default spot (in front of the wall mirror) is inside the barber chair, so a tap walked you over and then did nothing */, use: () => { const ch = scene.fixtures.filter(f => f.seats && f.seats.length && /barber\.armchair/.test(f.asset.id)).sort((a, b) => Math.abs(a.x - fx.x) - Math.abs(b.x - fx.x))[0] || null; open(kind, scene.roomId, ch); } }; });
  G.on('room:build', onRoom); G.on('day', onDay);
}
