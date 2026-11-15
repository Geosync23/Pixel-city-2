// Phone app: MAPLE POST (app id 'post', released through the app store; installed automatically when your first post arrives). Data: G.post (sim/post.js).
// Tabs: Inbox (post waiting in your basket / P.O. box, then every letter you have collected, to re-read on paper) · Sent (letters waiting for a stamp, things in transit with a progress bar, delivered)
//   · Album (stamps by set, postcards, first-day covers, your P.O. box) · Offices (all five with hours and Take me there; nearest first).
// The badge counts only NEW post and clears when the app is opened. Deep links: G.phone.open('post', { tab: 'inbox' | 'sent' | 'album' | 'offices', mail: id, out: id }).
import { G } from '../core/game.js';
import { el, iconEl, btn, section, row, empty, bar, tabs, card, kv, safe, money, when } from './phone_util.js';
import { regDef } from './phone_store.js';
import { letterView, stampCanvas, postcardCanvas } from '../scenes/rooms/post_views.js';
import { ITEM_BY_ID } from '../data/items.js';
import { POSTCARDS, COVERS, STAMP_BY_ID, SPEEDS } from '../data/post.js';
import { JUNK_BY_ID } from '../story/letters.js';
export const order = 123;

const P = () => G.post; let tab = 'inbox';
const DAY = 1440, dateOf = t => { const d = Math.floor(t / DAY), dd = ((d % 56) + 56) % 56; return `${['Spring', 'Summer', 'Autumn', 'Winter'][Math.floor(dd / 14)]} ${dd % 14 + 1}`; };
const ICON = { letter: 'post_letter', reply: 'post_letter', junk: 'post_paper', bill: 'ui.coin', slip: 'post_slip', telegram: 'post_slip', parcel: 'post_parcel', card: 'post_pc_light' };
const note = t => el('p.ph-note', { text: t, style: { margin: '8px 10px', lineHeight: '1.35' } });

function mailView(m) {
  return (b, ctx) => {
    const p = P();
    if (m.type === 'letter' || m.type === 'reply') { const w = p.read(m.id); if (w) { const kids = [...w.body.childNodes]; w.close(); b.append(el('div', { style: { padding: '8px 4px' } }, ...kids)); } }
    else if (m.type === 'junk') { const j = JUNK_BY_ID[m.key] || { title: 'Flyer', text: '', from: '' }; /* QA round 4: clip the coupon here too (picking up the post empties the basket, and this view marked the flyer read without clipping it) */ if (!m.read && j.coupon) safe(() => { G.state.post.coupons[j.coupon.venue] = { pct: j.coupon.pct, until: G.now().day + 10 }; }); m.read = 1; const cp = j.coupon && safe(() => G.state.post.coupons[j.coupon.venue], null); b.append(card(el('b', { text: j.from }), el('p', { text: j.text, style: { lineHeight: '1.4' } })), j.coupon ? note(cp && cp.until >= G.now().day ? `Coupon clipped: ${j.coupon.pct}% back on your next purchase there (10 days).` : `Coupon: ${j.coupon.pct}% off, already used or expired.`) : null, j.place ? btn('Take me there', () => { safe(() => G.phone.routeTo(j.place)); }, 'pri wide', 'ui.pin') : null); }
    else if (m.type === 'bill') { const d = m.data || { items: [], total: 0 }; m.read = 1; b.append(card(...d.items.map(i => kv(i.label, money(i.amount))), kv('Due Monday 08:00', money(d.total), 'total')), note('Taken from your account on Monday morning. Arrears and disputes: window 1, Permits & Records, City Hall.'), btn('Open Bay Bank', () => ctx.open('bank'), 'wide')); }
    else if (m.type === 'slip') { const q = p.parcels().find(x => x.id === m.data), o = q && p.office(q.office); m.read = 1; b.append(card(el('b', { text: 'SORRY WE MISSED YOU' }), el('p', { text: q && q.st === 'slip' ? `A parcel is waiting for you at the counter of ${o ? o.name : 'the post office'}.` : 'Collected.' })), q && q.st === 'slip' && o ? btn('Take me there', () => { safe(() => G.phone.routeTo(o.room)); }, 'pri wide', 'ui.pin') : null); }
    else if (m.type === 'telegram') { m.read = 1; b.append(card(el('b', { text: 'TELEGRAM' }), el('p', { text: m.data, style: { fontFamily: 'monospace', lineHeight: '1.5' } }))); }
  };
}
function outView(o) {
  return b => { const p = P(), sp = SPEEDS.find(s => s.id === o.speed);
    b.append(card(kv('To', p.toName(o.to)), kv('Sent', dateOf(o.sentT)), kv(o.st === 'transit' ? 'Arrives' : 'Delivered', dateOf(o.due)), o.kind === 'parcel' ? kv('Service', `${sp ? sp.name : 'Standard'} · ${o.kg.toFixed(1)} kg · ${money(o.cost)}`) : null));
    if (o.kind === 'parcel') { b.append(section('In the box')); for (const i of o.items) b.append(row({ icon: i.id, title: (ITEM_BY_ID[i.id] || {}).name || i.id, right: i.qty > 1 ? 'x' + i.qty : '' })); b.append(note(['Held together by hope.', 'Wrapped. It will get there.', 'Tidily wrapped.', 'Wrapped square as a brick.'][o.wrap] || '')); }
    else { if (o.card) b.append(el('div', { style: { textAlign: 'center', margin: '8px' } }, postcardCanvas(String(o.card).replace('post_pc_', ''), 3))); b.append(el('div', { style: { padding: '8px 4px' } }, letterView(p.letterParts(o).hand, p.letterParts(o), 300))); if (o.stamp) b.append(el('div', { style: { textAlign: 'center' } }, stampCanvas(o.stamp, 2, { used: 1, comm: p.look().comm }))); } };
}
function inbox(b, ctx) {
  const p = P(), home = p.waiting('home'), box = p.waiting('pobox'), got = p.inbox().slice().reverse();
  if (home.length) { b.append(section('In the basket by your door', String(home.length))); for (const m of home) b.append(row({ icon: ICON[m.type] || 'post_letter', title: p.title(m), sub: 'Pick it up at home', cls: 'note' })); b.append(btn('Take me home', () => { const h = safe(() => G.housing.current()); if (h) safe(() => G.phone.routeTo(h.roomId)); }, 'wide', 'ui.home')); }
  if (box.length) { const o = p.office(p.box().office); b.append(section('In your P.O. box', String(box.length))); for (const m of box) b.append(row({ icon: ICON[m.type] || 'post_letter', title: p.title(m), sub: o ? o.short : '', cls: 'note' })); if (o) b.append(btn('Take me there', () => safe(() => G.phone.routeTo(o.room)), 'wide', 'ui.pin')); }
  const slips = p.parcels().filter(q => q.st === 'slip'); for (const q of slips) { const o = p.office(q.office); b.append(row({ icon: 'post_slip', title: q.label, sub: `Waiting at ${o ? o.short : 'the counter'}`, right: 'GO', rightCls: 'good', onclick: () => o && safe(() => G.phone.routeTo(o.room)) })); }
  if (!got.length && !home.length && !box.length) return b.append(empty('post_letter', 'No post yet', 'The carrier comes at half past nine, every day but Sunday. Letters land in the basket by your door.'));
  if (got.length) b.append(section('Your post', String(got.length)));
  for (const m of got) { const lt = m.type === 'letter' || m.type === 'reply'; b.append(row({ icon: ICON[m.type] || 'post_letter', title: p.title(m), sub: dateOf(m.t) + (lt ? '' : ' · ' + m.type), right: m.read ? '' : 'NEW', rightCls: 'good', onclick: () => ctx.push(p.title(m), mailView(m), 'mail' + m.id) })); }
}
function sent(b, ctx) {
  const p = P(), held = p.held(), out = p.out().slice().reverse(), pk = p.packed(), now = G.state.t;
  if (pk) b.append(section('Packed, not sent'), row({ icon: 'post_parcel', title: 'Wrapped parcel', sub: `${pk.kg.toFixed(1)} kg · take it to a counter`, cls: 'note' }));
  if (held.length) { b.append(section('Written, not posted', String(held.length))); for (const h of held) b.append(row({ icon: 'post_letter', title: `${h.kind === 'card' ? 'Postcard' : 'Letter'} to ${p.toName(h.to)}`, sub: `Needs a stamp (you have ${p.stamps.count()}) and any mailbox`, onclick: () => ctx.push('Your ' + (h.kind === 'card' ? 'postcard' : 'letter'), bb => bb.append(el('div', { style: { padding: '8px 4px' } }, letterView(p.letterParts(h).hand, p.letterParts(h), 300))), 'held' + h.id) })); }
  const tr = out.filter(o => o.st === 'transit'), dn = out.filter(o => o.st !== 'transit');
  if (tr.length) { b.append(section('On the way', String(tr.length))); for (const o of tr) { const k = Math.max(.04, Math.min(1, (now - o.sentT) / Math.max(1, o.due - o.sentT))); b.append(row({ icon: ICON[o.kind] || 'post_letter', title: `${o.kind === 'card' ? 'Postcard' : o.kind === 'parcel' ? 'Parcel' : 'Letter'} to ${p.toName(o.to)}`, sub: `Arrives ${dateOf(o.due)}`, right: Math.round(k * 100) + '%', onclick: () => ctx.push('Tracking', outView(o), 'out' + o.id) }), bar(k * 100, 100, '#2756a8', 'On the way')); } }
  if (dn.length) { b.append(section('Delivered', String(dn.length))); for (const o of dn) b.append(row({ icon: ICON[o.kind] || 'post_letter', title: `${o.kind === 'card' ? 'Postcard' : o.kind === 'parcel' ? 'Parcel' : 'Letter'} to ${p.toName(o.to)}`, sub: 'Delivered ' + dateOf(o.due), right: 'OK', rightCls: 'good', onclick: () => ctx.push('Delivered', outView(o), 'out' + o.id) })); }
  if (!pk && !held.length && !out.length) b.append(empty('post_parcel', 'Nothing sent yet', 'Write a letter at a post-office desk, or pack a parcel at the packing table and take it to the counter.', btn('Nearest post office', () => { const o = p.nearest(); if (o) safe(() => G.phone.routeTo(o.room)); }, 'pri', 'ui.pin')));
}
function album(b, ctx) {
  const p = P(), al = p.stamps.album(), own = p.stamps.owned(), all = p.stamps.all(), bx = p.box(), comm = p.look().comm;
  b.append(card(kv('Stamps in the album', `${Object.keys(al).length} / ${all.length}`), kv('Stamps to use', String(p.stamps.count())), kv('P.O. box', bx ? `No. ${bx.no + 100}, ${(p.office(bx.office) || {}).short || ''}` : 'None rented')));
  for (const [set, title] of p.stamps.sets()) { const L = all.filter(s => s.set === set); b.append(section(title, `${L.filter(s => al[s.id] !== undefined).length}/${L.length}`)); const g = el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 10px' } });
    for (const s of L) { const have = al[s.id] !== undefined; g.append(el('button', { 'aria-label': s.name + (have ? '' : ' (not yet)'), style: { background: 'none', border: 'none', padding: '0', position: 'relative' }, onclick: () => ctx.tip(have ? `${s.name}${own[s.id] ? ' · ' + own[s.id] + ' to use' : ''}${s.src ? ' · from ' + s.src : ''}` : `${s.name}: ${s.src ? 'from ' + s.src : s.season !== undefined ? 'on sale in ' + ['spring', 'summer', 'autumn', 'winter'][s.season] : 'at a post-office counter'}`) }, stampCanvas(s.id, 2, { dim: !have, comm }))); } b.append(g); }
  const cards = p.postcards(), ck = Object.keys(cards); b.append(section('Postcards', String(ck.length))); if (ck.length) { const g = el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 10px' } }); for (const k of ck) g.append(postcardCanvas(String(k).replace('post_pc_', ''), 2)); b.append(g); } else b.append(note('Postcards you write or have printed are kept here. The racks at the Downtown counter have all eight.'));
  const cv = p.covers(), cvk = Object.keys(cv); b.append(section('First-day covers', String(cvk.length))); if (cvk.length) for (const k of cvk) b.append(row({ icon: 'post_cover', title: COVERS[k] || k, sub: dateOf(cv[k] * DAY) })); else b.append(note('On holidays and at the Stamp Fair the philately counter sells that day\'s cover, cancelled while you watch.'));
}
function offices(b, ctx) {
  const p = P(), near = p.nearest(), L = p.offices().sort((a, c) => (a.key === (near && near.key) ? -1 : c.key === (near && near.key) ? 1 : 0));
  for (const o of L) b.append(card(el('b', { text: o.name + (near && o.key === near.key ? ' · nearest' : '') }), el('small', { text: o.master, style: { display: 'block', opacity: '.7' } }), el('p', { text: o.hours, style: { margin: '4px 0', lineHeight: '1.3' } }), kv('Now', o.open ? 'OPEN' : 'CLOSED', o.open ? 'good' : 'bad'), btn('Take me there', () => safe(() => G.phone.routeTo(o.room)), 'pri wide', 'ui.pin')));
  b.append(note('Any street mailbox takes a stamped letter. Collection is at 17:00; the round is at 09:30. No post on Sundays or holidays.'));
}
function render(b, ctx) {
  const p = P(); if (!p) return b.append(empty('post_letter', 'Maple Post', 'The post office is closed for the moment.'));
  const a = ctx.arg || {}; if (a.tab && !ctx._used) { tab = a.tab; } p.seen();
  b.append(el('div.ph-hero', { style: { background: '#2756a8', color: '#fff8e8' } }, iconEl('post_letter', 3), el('div', null, el('b', { text: 'Maple Post', style: { fontSize: '18px' } }), el('small', { text: `${p.waiting('home').length + p.waiting('pobox').length} waiting · ${p.out().filter(o => o.st === 'transit').length} on the way · ${p.stamps.count()} stamps` }))));
  b.append(tabs([{ id: 'inbox', name: 'Inbox' }, { id: 'sent', name: 'Sent' }, { id: 'album', name: 'Album' }, { id: 'offices', name: 'Offices' }], tab, t => { tab = t; ctx.arg = null; ctx.refresh(); }));
  ({ inbox, sent, album, offices }[tab] || inbox)(b, ctx);
  if (a.mail && !a._done) { a._done = 1; const m = p.mail().find(q => q.id === a.mail); if (m && m.got) ctx.push(p.title(m), mailView(m), 'mail' + m.id); } else if (a.out && !a._done) { a._done = 1; const o = p.track(a.out); if (o) ctx.push('Tracking', outView(o), 'out' + o.id); }
}
export function init() {
  if (!G.phone || !G.phone.registerApp) return;
  G.phone.registerApp(Object.assign(regDef('post'), { render, ownsLog: true, badge: () => (P() ? P().unseen() : 0) }));
}
