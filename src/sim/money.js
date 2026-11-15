// Money: wallet, weekly bills, overdraft rules, transaction history. Numbers come from src/data/economy.js + homes.js.
// The wallet itself is G.state.player.money (dollars; prices are rounded to $0.25).
//
// State slice G.state.bank = { hist: [{ t, d, r (reason), b (balance after) }] (last 60), arrears, billWeek (last week index billed),
//   remWeek (last week reminded), tab: { day, used } ("on the tab" essentials), lastBill: { t, items, total, paid } }
//
// G.money
//   get() -> balance              fmt(n) -> '$4.50' / '$12' / '-$3'
//   add(n, reason)                income (emits 'money')
//   pay(n, reason, opts?) -> bool spend. false + toast when it cannot go through. opts: { category (item category; 'homegood' | 'outfit' | 'gift'
//                                 are blocked while the balance is negative), venue (for the essentials tab), force: true (bills, clinic: always
//                                 succeeds; what would push the balance past the overdraft limit becomes arrears), silent: true (no toast) }
//   canAfford(n, opts?) -> bool   same rules as pay, no side effects
//   bills() -> { items: [{ id, label, amount }], total, arrears, dueT (abs minute of the next Monday 08:00) }
//   addBillSource(fn)             fn() -> [{ id, label, amount }] extra weekly lines (mortgage, loan, auto-renewals) from other systems
//   history() -> newest-first [{ t, d, r, b }]        arrears() -> number        limit -> overdraft limit (-250)
// Events: 'money'(delta, reason), 'bills:due'({ items, total, paid, arrears }), 'bills:soon'({ items, total })
import { G } from '../core/game.js';
import { BILLS, OVERDRAFT } from '../data/economy.js';
import { HOME_BY_ID, SIZE_CLASSES } from '../data/homes.js';
import { toast } from '../ui/kit.js';

export const order = 51;
const WEEK = 7 * 1440, r2 = n => Math.round(n * 100) / 100;
let S = null; const sources = [];
const fresh = () => ({ hist: [], arrears: 0, billWeek: Math.floor(G.state.t / WEEK), remWeek: -1, tab: { day: -1, used: 0 }, lastBill: null });
const P = () => G.state.player;
export const fmt = n => { const a = Math.abs(n), s = Number.isInteger(r2(a)) ? String(r2(a)) : r2(a).toFixed(2); return (n < 0 ? '-$' : '$') + s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); };

function log(d, reason) { S.hist.push({ t: Math.floor(G.state.t), d: r2(d), r: reason || '', b: r2(P().money) }); if (S.hist.length > 60) S.hist.splice(0, S.hist.length - 60); G.emit('money', d, reason); }
function verdict(n, o = {}) {
  const bal = P().money, after = bal - n;
  if (o.force || n <= 0 || after >= 0) return 'ok';
  if (OVERDRAFT.blockedWhileNegative.includes(o.category)) return 'want';
  if (after >= OVERDRAFT.limit) return 'ok';
  if (o.venue === 'grocery' || o.venue === 'diner') { const day = G.now().day, used = S.tab.day === day ? S.tab.used : 0; if (used + n <= 15) return 'tab'; }
  return 'broke';
}
const api = {
  fmt, limit: OVERDRAFT.limit,
  get: () => P().money,
  add(n, reason) { n = r2(n); if (!n) return; P().money = r2(P().money + n); log(n, reason); },
  canAfford: (n, o) => { const v = verdict(n, o); return v === 'ok' || v === 'tab'; },
  pay(n, reason, o = {}) {
    n = r2(n); if (n <= 0) return true;
    const v = verdict(n, o);
    if (v === 'want') { if (!o.silent) toast('Your account is in the red — treats will have to wait.', 'bad'); return false; }
    if (v === 'broke') { if (!o.silent) toast(`Not enough money (${fmt(n)}).`, 'bad'); return false; }
    if (v === 'tab') { const day = G.now().day; if (S.tab.day !== day) S.tab = { day, used: 0 }; S.tab.used += n; if (!o.silent) toast('"Pay us back when you can." — put on your tab.', 'info'); }
    let take = n;
    if (o.force && o.bill) { take = Math.max(0, Math.min(n, r2(P().money - OVERDRAFT.limit))); S.arrears = r2(S.arrears + n - take); }
    P().money = r2(P().money - take); log(-take, reason); return true;
  },
  arrears: () => S.arrears,
  history: () => S.hist.slice().reverse(),
  addBillSource(fn) { sources.push(fn); },
  bills() {
    const items = [], h = G.state.home, home = h && HOME_BY_ID[h.id];
    if (home) {
      if (h.owned) { if (home.upkeepPerWeekOwned) items.push({ id: 'upkeep', label: 'Home upkeep', amount: home.upkeepPerWeekOwned }); }
      else if (home.rentPerWeek) items.push({ id: 'rent', label: 'Rent — ' + home.name, amount: home.rentPerWeek });
      const sc = SIZE_CLASSES[home.sizeClass]; if (sc) items.push({ id: 'utilities', label: 'Utilities', amount: sc.utilitiesPerWeek });
    }
    items.push({ id: 'phone', label: 'Phone plan', amount: BILLS.phonePlanPerWeek });
    for (const f of sources) { try { for (const it of f() || []) if (it && it.amount > 0) items.push(it); } catch (e) { console.error(e); } }
    if (S.arrears > 0) items.push({ id: 'arrears', label: 'Carried over', amount: S.arrears });
    const total = r2(items.reduce((a, i) => a + i.amount, 0));
    return { items, total, arrears: S.arrears, dueT: (S.billWeek + 1) * WEEK + BILLS.due.weekday * 1440 + BILLS.due.hour * 60 };
  },
};
function tick() {
  if (!S) return; const t = G.state.t;
  const b = api.bills();
  if (t >= b.dueT) {
    S.billWeek = Math.floor(t / WEEK); const arr0 = S.arrears; S.arrears = 0; const bal0 = P().money;
    api.pay(b.total, 'Weekly bills', { force: true, bill: true }); const paid = r2(bal0 - P().money);
    S.lastBill = { t: Math.floor(t), items: b.items, total: b.total, paid };
    const msg = S.arrears > 0 ? `Weekly bills: paid ${fmt(paid)} of ${fmt(b.total)}. The rest rolls over to next Monday — no fee.` : `Weekly bills paid: ${fmt(b.total)}.`;
    if (!(G.phone && G.phone.notify)) toast(msg, 'money', 4200); else if (S.arrears > 0) G.phone.notify({ app: 'bank', title: 'Weekly bills', text: msg, icon: 'ui.coin' });   /* QA7: one notice per event: ui/phone.js's 'bills:due' banner (Bay Bank: Paid ...); only a part payment adds its own line */
    G.emit('bills:due', { items: b.items, total: b.total, paid, arrears: S.arrears, prevArrears: arr0 }); return;
  }
  const remT = b.dueT - 1440 + (BILLS.reminder.hour - BILLS.due.hour) * 60, wk = S.billWeek + 1;
  if (t >= remT && S.remWeek < wk) { S.remWeek = wk; const msg = `Bills are due tomorrow at 8: ${fmt(b.total)}.`; if (!(G.phone && G.phone.notify)) toast(msg, 'money', 4000);   /* QA7: the phone's own 'bills:soon' notice (ui/phone.js, Bay Bank) is the one notice */ G.emit('bills:soon', { items: b.items, total: b.total }); }
}
export function init() {
  S = G.defineState('bank', fresh);
  const rebind = () => { S = G.state.bank || (G.state.bank = fresh()); const f = fresh(); for (const k in f) if (S[k] === undefined) S[k] = f[k]; };
  rebind(); G.on('load', rebind);
  G.on('game:new', () => { S.billWeek = Math.floor(G.state.t / WEEK); });
  G.money = api; G.on('minutes', tick);
}
