// Phone app: Messages (Chats + People). Data/API: src/sim/messages.js (G.messages); relationships from G.social when it exists.
// ctx.arg: { thread: id } opens that conversation, { person: id } the contact card, { tab: 'people' }.
import { G } from '../core/game.js';
import { CAST_BY_ID } from '../story/cast.js';
import { RELATIONSHIP_TIERS, STARTING_RELATIONSHIP } from '../story/dialogue.js';
import * as TEXTS from '../story/texts.js';
import { el, iconEl, row, empty, tabs, btn, card, chip, section, portrait, npcInfo, npcName, when, clockOf, dayOf, placeName, place, isKnown, safe, cap, timeInfo } from './phone_util.js';

let tab = 'chats';
const M = () => G.messages;

/* ---------- people ---------- */
export function contacts() {
  const ids = new Set(), k = safe(() => G.social.known(), null);
  if (k) for (const x of k) ids.add(typeof x === 'string' ? x : x && x.id);
  else for (const id in STARTING_RELATIONSHIP) if (CAST_BY_ID[id] && (CAST_BY_ID[id].group === 'family' || STARTING_RELATIONSHIP[id] >= 40)) ids.add(id);
  for (const t of safe(() => M().threads(), [])) if (CAST_BY_ID[t.id]) ids.add(t.id);
  ids.delete(undefined); return [...ids].sort((a, b) => rel(b) - rel(a));
}
export const rel = id => { const r = safe(() => G.social.rel(id), null); return typeof r === 'number' ? r : STARTING_RELATIONSHIP[id] || 0; };
export function tier(id) {
  const info = npcInfo(id) || {}; let t = safe(() => G.social.tier(id), null); if (t && typeof t === 'object') t = t.id || t.label;
  const byRel = RELATIONSHIP_TIERS.find(x => rel(id) >= x.min && rel(id) <= x.max) || RELATIONSHIP_TIERS[0], T = RELATIONSHIP_TIERS.find(x => x.id === t || x.label === t) || byRel;
  return info.group === 'family' ? { id: 'family', label: 'Family', icon: 'rel.family' } : { id: T.id, label: T.label, icon: 'rel.' + T.id };
}
function hearts(id) { const n = Math.max(0, Math.min(4, Math.ceil(rel(id) / 25))), h = el('span.ph-hearts', { 'aria-label': `${n} of 4 hearts` }); for (let i = 0; i < 4; i++) { const c = iconEl('ui.heart', 1); if (i >= n) c.classList.add('off'); h.append(c); } return h; }

function call(id, ctx) {
  if (G.social && G.social.call) { ctx.close(); return G.social.call(id); }
  if (safe(() => G.activities.start('phone_call', { npc: id, npcId: id }), false)) return ctx.close();
  ctx.tip(`${npcName(id)} didn't pick up. Try a text!`);
}
function sayHi(id, ctx) {
  M().sendMine(id, ['Hey! How is your day going?', 'Hi! Thinking of you.', 'Hey, what are you up to?'][Math.floor(G.state.t) % 3]);
  if (G.social && G.social.onText) safe(() => G.social.onText(id), 0);
  else { const g = (npcInfo(id) || {}).group === 'family' ? 'family' : tier(id).id === 'close' ? 'close' : 'friend', L = (TEXTS.CHECK_INS && TEXTS.CHECK_INS[g]) || ['Hey you! All good here.']; M().send({ from: id, text: L[Math.floor(G.state.t) % L.length], delay: 8 }); }
  ctx.refresh();
}
function personView(id) {
  return (b, ctx) => {
    const n = npcInfo(id) || { name: cap(id) }, t = tier(id), home = n.home ? place(String(n.home).replace(/^home_/, 'home:')) : null, where = safe(() => G.social.whereIs(id), null);
    b.append(el('div.ph-hero.pink', null, portrait(id, 64), el('div', null, el('b', { text: n.name || npcName(id), style: { fontSize: '18px' } }), n.role ? el('small', { text: n.role }) : null, el('span', null, iconEl(t.icon, 1), ' ', t.label, ' ', hearts(id)))));
    if (n.bio) b.append(card(el('p', { text: n.bio })));
    const facts = card(); if (n.birthday) facts.append(el('div.ph-kv', null, el('span', { text: 'Birthday' }), el('b', { text: `${cap(n.birthday.season)} ${n.birthday.day}` })));
    if (where && (t.id === 'friend' || t.id === 'close' || t.id === 'family')) facts.append(el('div.ph-kv', null, el('span', { text: 'Right now' }), el('b', { text: typeof where === 'string' ? placeName(where) : where.name || '' })));
    if (n.district) facts.append(el('div.ph-kv', null, el('span', { text: 'Usually around' }), el('b', { text: cap(({ oldtown: 'Old Town', harbor: 'Harborside', arts: 'Arts Quarter' })[n.district] || n.district) })));
    if (facts.children.length) b.append(facts);
    b.append(el('div.ph-btns', null, btn('Text', () => ctx.push(npcName(id), threadView(id), id), 'pri', 'ui.speech'), btn('Call', () => call(id, ctx), '', 'ui.phone')),
      el('div.ph-btns', null, btn('Invite out', () => ctx.open('planner', { add: true, withNpc: id }), '', 'ui.calendar'), home && isKnown(home.id) ? btn('Home on map', () => ctx.open('map', { place: home.id }), '', 'ui.pin') : null));
  };
}

/* ---------- conversation ---------- */
function threadView(id) {
  return (b, ctx) => {
    const th = M().thread(id); M().markRead(id);
    const chat = el('div.ph-chat'); let lastDay = -1;
    for (const m of th ? th.msgs : []) {
      const d = dayOf(m.t); if (d !== lastDay) { lastDay = d; const i = timeInfo(m.t); chat.append(el('div.ph-daysep', { text: d === dayOf(G.state.t) ? 'Today' : `${i.weekdayName} ${i.dayOfMonth} ${i.seasonName}` })); }
      chat.append(el('div.ph-msg' + (m.me ? '.me' : ''), null, m.text, el('small', { text: clockOf(m.t) })));
      if (m.appt) { const a = m.appt, st = m.done === undefined ? '' : m.done === 'accept' ? '.ok' : '.no';
        chat.append(el('div.ph-appt' + st, null, iconEl('ui.calendar', 2), el('div', null, el('b', { text: a.title || 'Invitation' }), el('small', { text: when(a.t) + (a.placeId ? ' · ' + placeName(a.placeId) : '') }), el('small', { text: m.done === undefined ? 'Waiting for your answer' : m.done === 'accept' ? 'Accepted · added to Planner' : 'Declined' })))); }
    }
    if (!th || !th.msgs.length) chat.append(empty('ui.speech', 'No messages yet', `Say hi to ${npcName(id)}.`));
    b.append(chat); setTimeout(() => { b.scrollTop = b.scrollHeight; }, 0);
    const p = M().pending(id);
    if (p) ctx.foot.append(el('div.ph-replies', null, p.replies.map(r => el('button', { text: r.label, onclick: () => { M().reply(id, r.value, p.i); ctx.refresh(); } }))));
    else if (CAST_BY_ID[id]) ctx.foot.append(el('div.ph-btns', null, btn('Say hi', () => sayHi(id, ctx), '', 'ui.speech'), btn('Invite', () => ctx.open('planner', { add: true, withNpc: id }), '', 'ui.calendar'), btn('Contact', () => ctx.push(npcName(id), personView(id)), '', 'ui.info')));
  };
}

export default {
  id: 'messages', ownsLog: true,
  badge: () => safe(() => M().unread(), 0),
  render(b, ctx) {
    if (!M()) return b.append(empty('ui.speech', 'No signal', 'Messages will appear once the network wakes up.'));
    const a = ctx.arg; if (a && !a._used) { a._used = 1; if (a.tab) tab = a.tab; if (a.thread) return queueMicrotask(() => ctx.push(npcName(a.thread) === cap(a.thread) && M().thread(a.thread) ? M().thread(a.thread).name : npcName(a.thread), threadView(a.thread), a.thread)); if (a.person) { tab = 'people'; return queueMicrotask(() => ctx.push(npcName(a.person), personView(a.person))); } }
    const un = M().unread();
    b.append(tabs([{ id: 'chats', name: 'Chats', badge: un || null }, { id: 'people', name: 'People' }], tab, t => { tab = t; ctx.refresh(); }));
    if (tab === 'chats') {
      const ths = M().threads();
      if (!ths.length) return b.append(empty('ui.speech', 'No messages yet', 'When family, friends or work text you, it lands here.'));
      for (const t of ths) { const last = t.msgs[t.msgs.length - 1];
        b.append(row({ icon: t.icon ? el('span.ph-ico', { style: { width: '40px', height: '40px', background: '#fff4dc' } }, iconEl(t.icon, 2)) : portrait(t.id, 40, t.name), title: t.name, sub: (last.me ? 'You: ' : '') + last.text, right: t.unread ? el('em.ph-chip.bad', { text: t.unread + ' new' }) : when(t.last).replace('Today ', ''), cls: t.unread ? 'unread' : '', onclick: () => ctx.push(t.name, threadView(t.id), t.id) })); }
    } else {
      const ids = contacts();
      if (!ids.length) return b.append(empty('rel.friend', 'Nobody here yet', 'Chat with people around town and they will show up in People.'));
      b.append(section('Contacts', chip(String(ids.length))));
      for (const id of ids) { const n = npcInfo(id) || {}, t = tier(id); b.append(row({ icon: portrait(id, 40), title: n.name || npcName(id), sub: n.role || '', right: el('span.ph-row-r', null, t.label, el('br'), hearts(id)), onclick: () => ctx.push(npcName(id), personView(id)) })); }
    }
  },
};
