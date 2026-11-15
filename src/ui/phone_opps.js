// Phone app: OPPORTUNITIES (app id 'opps'). Data: G.opps (src/sim/opportunities.js).
// Tabs: For you (what is on offer + what you said yes to; say yes, not now, take me there, let it go) · Looking back (the last forty, with how they ended).
// The badge counts offers you have not answered. Deep link: G.phone.open('opps', { opp: id }) (what the "Opportunity" banner opens).
// Never "missions" or "quests": these are small optional things; nothing is lost by letting one pass.
import { G } from '../core/game.js';
import { el, iconEl, btn, section, empty, tabs, card, safe } from './phone_util.js';
import { regDef } from './phone_store.js';
import { ITEM_BY_ID } from '../data/items.js';
import '../art/icons/needs_extra.js';
export const order = 133;

const O = () => G.opps; let tab = 'now';
const HOW = { done: ['Done', 'good'], expired: ['Passed', ''], declined: ['Not this time', ''], ignored: ['Passed by', ''], dropped: ['Let go', ''] };
const DAY = 1440, dateOf = t => { const d = Math.floor(t / DAY), d0 = Math.floor(G.state.t / DAY); return d === d0 ? 'today' : d === d0 - 1 ? 'yesterday' : `${d0 - d} days ago`; };
const chipRow = (...kids) => el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' } }, ...kids);
const tag = (text, bg) => el('span.ph-chip', { text, style: { background: bg || '#fffdf4', fontSize: '12px' } });

function oppCard(v, ctx, open) {
  const src = el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.5px', opacity: '.75' } }, iconEl(v.icon, 1), el('span', { text: v.srcName, style: { flex: '1' } }), v.st ? tag('You said yes', '#dff5d8') : tag('New', '#fff0b8'));
  const c = card(src, el('b', { text: v.title, style: { fontSize: '16px', lineHeight: '1.2' } }), el('p', { text: v.text, style: { lineHeight: '1.4' } }));
  c.dataset.opp = v.id;
  const meta = chipRow(); if (v.placeName) meta.append(tag(v.placeName)); meta.append(tag(v.untilText)); c.append(meta);
  const br = v.def && v.def.do && v.def.do.bring; if (br) { const it = ITEM_BY_ID[br[0]] || { name: br[0] }, n = br[1] || 1, have = safe(() => G.inv.count(br[0]), 0); c.append(el('small', { text: `Bring ${n > 1 ? n + ' x ' : ''}${it.name}` + (have >= n ? ' (you have it)' : have ? ` (you have ${have})` : ' (a grocery, market or corner shop has it)'), style: { fontWeight: '700' } })); }
  if (v.rewardText) c.append(el('small', { text: 'For you: ' + v.rewardText, style: { opacity: '.8', fontWeight: '600' } }));
  const row = el('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } });
  if (!v.st) row.append(btn(v.from ? 'Yes, put it on my day' : v.canGo ? 'Yes, show me the way' : "Yes, I'm in", () => { O().accept(v.id); if (v.canGo && !v.from) ctx.close(); else ctx.refresh(); }, 'good', 'ui.opp'), btn('Not now', () => { O().decline(v.id); if (open) ctx.back(); else ctx.refresh(); }));
  else { if (v.canGo) row.append(btn('Take me there', () => { O().go(v.id); if (!safe(() => G.phone.viewing('map'), false)) ctx.close(); }, 'pri', 'ui.pin')); if (v.appt) row.append(btn('My Day', () => ctx.open('planner', { appt: v.appt }))); row.append(btn('Let it go', () => { O().drop(v.id); if (open) ctx.back(); else ctx.refresh(); })); }
  c.append(row); return c;
}
function nowTab(b, ctx) {
  const L = safe(() => O().list(), []), mine = L.filter(v => v.st), offers = L.filter(v => !v.st);
  if (!L.length) { b.append(empty('ui.opp', 'Nothing just now', 'Opportunities turn up a few times a day: a nice evening, a friend short of lemons, something on in town. Say yes to the ones you fancy. Nothing is lost by letting one pass.')); return; }
  if (offers.length) { b.append(section('On offer')); for (const v of offers) b.append(oppCard(v, ctx)); }
  if (mine.length) { b.append(section('You said yes')); for (const v of mine) b.append(oppCard(v, ctx)); }
  b.append(el('p.ph-note', { text: 'Doing the thing counts even if you never tapped yes.', style: { margin: '8px 2px' } }));
}
function pastTab(b) {
  const L = safe(() => O().log(), []), s = safe(() => O().stats(), {});
  b.append(card(el('div', { style: { display: 'flex', justifyContent: 'space-around', textAlign: 'center' } }, ...[['Seen through', s.done || 0], ['Offered', s.offered || 0], ['Let pass', Math.max(0, (s.offered || 0) - (s.done || 0) - (s.open || 0))]].map(([k, n]) => el('div', null, el('b', { text: String(n), style: { fontSize: '20px', display: 'block' } }), el('small', { text: k }))))));
  if (!L.length) { b.append(el('p.ph-note', { text: 'The ones you see through, and the ones you let pass, are remembered here.', style: { margin: '8px 2px' } })); return; }
  for (const e of L) { const h = HOW[e.r] || HOW.ignored, src = (O().SOURCES[e.src] || O().SOURCES.story);
    b.append(el('div.ph-row', { style: { opacity: e.r === 'done' ? '1' : '.72' } }, iconEl(src.icon, 1), el('div.ph-row-m', null, el('b', { text: e.title }), el('small', { text: `${src.name} · ${dateOf(e.t)}` })), el('span.ph-row-r' + (h[1] ? '.' + h[1] : ''), { text: h[0] }))); }
  b.append(el('button.ph-btn.wide', { text: 'Stamp book', onclick: () => safe(() => G.phone.open('guide', { tab: 'stamps' })), style: { marginTop: '8px' } }));
}
function render(b, ctx) {
  if (!O()) return b.append(empty('ui.opp', 'Opportunities', 'Nothing here yet.'));
  const a = ctx.arg || {};
  const n = safe(() => O().list().length, 0), s = safe(() => O().stats(), {});
  b.append(el('div.ph-hero', { style: { background: '#2fa3a0', color: '#fff8e8' } }, iconEl('app.opps', 3), el('div', null, el('b', { text: 'Opportunities', style: { fontSize: '18px' } }), el('small', { text: n ? `${n} open · ${s.done || 0} seen through` : `${s.done || 0} seen through so far` }))));
  b.append(tabs([{ id: 'now', name: 'For you' }, { id: 'past', name: 'Looking back' }], tab, t => { tab = t; ctx.arg = null; ctx.refresh(); }));
  (tab === 'past' ? pastTab : nowTab)(b, ctx);
  if (a.opp && !a._done) { a._done = 1; const v = safe(() => O().get(a.opp), null); if (v) ctx.push(v.title, (bb, cc) => { const cur = safe(() => O().get(v.id), null); if (cur) bb.append(oppCard(cur, cc, true)); else bb.append(empty('ui.opp', v.title, 'This one has come and gone.')); }, 'opp' + v.id); }
}
export function init() {
  if (!G.phone || !G.phone.registerApp) return;
  const cat = safe(() => regDef('opps'), null) || {}, def = { id: 'opps', name: cat.name && cat.name !== 'opps' ? cat.name : 'Opportunities', question: cat.question || 'What could I do today?', iconId: 'app.opps', color: cat.color || '#2fa3a0', slot: 50 };
  G.phone.registerApp(Object.assign(def, { render, badge: () => safe(() => O().list().filter(v => !v.st).length, 0) }));
  G.on('opps:change', () => { safe(() => G.phone.syncBadge && G.phone.syncBadge()); if (safe(() => G.phone.viewing('opps'), false)) safe(() => G.phone.refresh()); });
}
