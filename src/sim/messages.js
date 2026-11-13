// Messages: text threads between the player and NPCs (or services such as the landlord or ZipEats). UI: src/ui/phone_messages.js.
//
// State slice G.state.messages = { threads: { [id]: { id, name?, icon?, unread, last (t), msgs: [msg] } }, queue: [{ at, m }], seq }
//   msg = { i, me?: 1, text, t, replies?: [{ label, value, then? }], appt?: {...}, onReply?: eventName, done?: value picked, apptId?, type? }
//
// G.messages
//   send({ from, text, replies?, appt?, onReply?, name?, icon?, delay?, type?, silent?, read? }) -> msg | null (null when delayed)
//        from     npc id from story/cast.js (thread id). Any other id works too if you pass `name` (e.g. from: 'zipeats', name: 'ZipEats').
//        text     tokens {name} (player) are filled in.
//        replies  quick replies [{ label, value, then?: text the sender answers with a little later }]. Picking one emits
//                 'msg:reply'(threadId, value, msg) and, when `onReply` is set, G.emit(onReply, value, threadId, msg).
//                 onReply is an EVENT NAME (string), so it survives save/load: register with G.on(name, fn) in your init.
//        appt     appointment proposal { title, placeId, t (abs minute), dur?, kind?: 'friend', withNpc?, data? }. The bubble shows a card;
//                 default replies are Accept / Decline; Accept adds it to G.planner (msg.apptId) and emits 'msg:appt'(threadId, true, apptId, msg).
//        delay    game minutes before delivery (kept in the save).   type: notification type from data/phone.js (default message_received / invitation).
//   sendMine(threadId, text)        a bubble from the player (no notification)
//   reply(threadId, value, msgI?)   answer the newest (or given) open question; returns true when something was answered
//   threads() -> newest-first [{ id, name, unread, last, msgs }]     thread(id)     unread() -> total     markRead(id)
//   pending(threadId) -> the newest msg still waiting for a reply, or null
// Events: 'msg:new'(msg, threadId), 'msg:reply'(threadId, value, msg), 'msg:appt'(threadId, accepted, apptId, msg), 'msg:read'(threadId)
import { G } from '../core/game.js';
import { CAST_BY_ID } from '../story/cast.js';
import * as TEXTS from '../story/texts.js';

export const order = 60;
const KEEP = 60; // messages kept per thread
let S = null;
const fresh = () => ({ threads: {}, queue: [], seq: 0 });
const fillT = (s, x) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (x && x[k] !== undefined ? x[k] : k === 'name' ? (G.state.player && G.state.player.name) || 'you' : m));
const pick = (arr, seed) => (Array.isArray(arr) && arr.length ? arr[Math.abs(seed | 0) % arr.length] : null);
export const senderName = id => { const th = S && S.threads[id]; if (th && th.name) return th.name; const c = CAST_BY_ID[id]; return c ? c.short || c.name : String(id).replace(/^./, m => m.toUpperCase()); };

function threadOf(id, o) { let th = S.threads[id]; if (!th) th = S.threads[id] = { id, unread: 0, last: 0, msgs: [] }; if (o && o.name) th.name = o.name; if (o && o.icon) th.icon = o.icon; return th; }
function push(th, m) { m.i = ++S.seq; th.msgs.push(m); th.last = m.t; if (th.msgs.length > KEEP) th.msgs.splice(0, th.msgs.length - KEEP); return m; }

function deliver(o) {
  const th = threadOf(o.from, o), m = { text: fillT(o.text), t: G.state.t };
  if (o.appt) { m.appt = Object.assign({ kind: 'friend', dur: 90 }, o.appt); if (m.appt.withNpc === undefined && CAST_BY_ID[o.from]) m.appt.withNpc = o.from; }
  if (o.replies && o.replies.length) m.replies = o.replies.map(r => (typeof r === 'string' ? { label: r, value: r } : { label: r.label, value: r.value !== undefined ? r.value : r.label, then: r.then }));
  else if (m.appt) {
    const R = TEXTS.INVITE_REPLIES || {}, own = !o.onReply; // with no handler we answer for the NPC ourselves
    m.replies = [{ label: pick(R.playerAccept, S.seq) || "I'm in!", value: 'accept', then: own ? pick(R.npcOnAccept, S.seq) || 'See you there!' : undefined },
      { label: pick(R.playerDecline, S.seq) || "Can't make it, sorry!", value: 'decline', then: own ? pick(R.npcOnDecline, S.seq) || 'No worries. Next time!' : undefined }];
  }
  if (o.onReply) m.onReply = String(o.onReply); if (o.type) m.type = o.type;
  push(th, m);
  const reading = G.phone && G.phone.isOpen && G.phone.viewing && G.phone.viewing('messages', o.from);
  if (!o.read && !reading) th.unread++;
  G.emit('msg:new', m, th.id);
  if (!o.silent && !reading && G.phone && G.phone.notify) G.phone.notify({ type: o.type || (m.appt ? 'invitation' : 'message_received'), app: 'messages', title: senderName(th.id), text: m.text, icon: th.icon || 'ui.speech', data: { thread: th.id }, face: th.id });
  return m;
}

export function send(o) {
  if (!S || !o || !o.from || !o.text) return null;
  if (o.delay > 0) { const q = Object.assign({}, o); delete q.delay; S.queue.push({ at: G.state.t + o.delay, m: q }); return null; }
  return deliver(o);
}
export function sendMine(id, text) { if (!S) return null; const th = threadOf(id), m = push(th, { me: 1, text: fillT(text), t: G.state.t }); G.emit('msg:new', m, id); return m; }
export function pending(id) { const th = S && S.threads[id]; if (!th) return null; for (let k = th.msgs.length - 1; k >= 0; k--) { const m = th.msgs[k]; if (m.replies && m.done === undefined) return m; } return null; }
export function reply(id, value, msgI) {
  const th = S && S.threads[id]; if (!th) return false;
  const m = msgI ? th.msgs.find(x => x.i === msgI) : pending(id); if (!m || !m.replies || m.done !== undefined) return false;
  const r = m.replies.find(x => x.value === value) || m.replies[0]; m.done = r.value;
  push(th, { me: 1, text: r.label, t: G.state.t });
  if (m.appt) {
    const ok = r.value === 'accept';
    if (ok && G.planner && G.planner.add) m.apptId = G.planner.add(Object.assign({}, m.appt));
    G.emit('msg:appt', id, ok, m.apptId || null, m);
  }
  if (r.then) { const a = m.appt, tok = a ? { venue: (G.places && G.places.get && G.places.get(a.placeId) || {}).name || 'there', time: G.now ? String(Math.floor((a.t % 1440) / 60)).padStart(2, '0') + ':' + String(Math.floor(a.t % 60)).padStart(2, '0') : '', day: 'then', npc: senderName(id) } : null; send({ from: id, text: fillT(r.then, tok), delay: 3 + (S.seq % 5) }); }
  G.emit('msg:reply', id, r.value, m);
  if (m.onReply) G.emit(m.onReply, r.value, id, m);
  return true;
}
export function threads() { if (!S) return []; return Object.values(S.threads).filter(t => t.msgs.length).sort((a, b) => b.last - a.last || (a.id < b.id ? -1 : 1)).map(t => ({ id: t.id, name: senderName(t.id), icon: t.icon, unread: t.unread, last: t.last, msgs: t.msgs })); }
export function thread(id) { const t = S && S.threads[id]; return t ? { id, name: senderName(id), icon: t.icon, unread: t.unread, last: t.last, msgs: t.msgs } : null; }
export function unread() { let n = 0; if (S) for (const k in S.threads) n += S.threads[k].unread || 0; return n; }
export function markRead(id) { const t = S && S.threads[id]; if (t && t.unread) { t.unread = 0; G.emit('msg:read', id); } }

export function init() {
  S = G.defineState('messages', fresh);
  G.on('load', () => { S = G.state.messages || (G.state.messages = fresh()); S.queue = S.queue || []; S.threads = S.threads || {}; });
  G.on('minutes', () => { if (!S.queue.length) return; const t = G.state.t, due = S.queue.filter(q => q.at <= t); if (!due.length) return; S.queue = S.queue.filter(q => q.at > t); for (const q of due) deliver(q.m); });
  G.messages = { send, sendMine, reply, pending, threads, thread, unread, markRead, senderName };
}
