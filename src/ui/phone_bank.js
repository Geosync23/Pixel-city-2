// Phone app: Bay Bank (balance + next bill, activity, home & loans). Reads G.money (get/history/bills/arrears/limit) defensively;
// loan / mortgage summaries come from G.money.loan?.() / G.housing?.mortgage?.() when those exist, else the rules in data/economy.js.
import { G } from '../core/game.js';
import { BILLS, LOAN, MORTGAGE, OVERDRAFT } from '../data/economy.js';
import { HOME_BY_ID } from '../data/homes.js';
import { el, iconEl, row, empty, tabs, btn, card, section, kv, money, balance, when, dayOf, DAY, place, safe, cap } from './phone_util.js';

let tab = 'balance';
const hist = () => safe(() => G.money.history(), []);
function bills() {
  const b = safe(() => G.money.bills(), null); if (b && b.items) return b;
  const h = G.state.home && HOME_BY_ID[G.state.home.id], items = []; if (h && h.rentPerWeek) items.push({ id: 'rent', label: 'Rent', amount: h.rentPerWeek });
  items.push({ id: 'phone', label: 'Phone plan', amount: BILLS.phonePlanPerWeek });
  const d = dayOf(G.state.t), nextMon = (d - (d % 7) + 7) * DAY + BILLS.due.hour * 60;
  return { items, total: items.reduce((s, i) => s + i.amount, 0), arrears: 0, dueT: nextMon - (G.state.t < nextMon - 7 * DAY ? 7 * DAY : 0) };
}
function balanceTab(b) {
  const bal = balance(), wk0 = (dayOf(G.state.t) - (dayOf(G.state.t) % 7)) * DAY; let inn = 0, out = 0; for (const h of hist()) if (h.t >= wk0) { if (h.d > 0) inn += h.d; else out -= h.d; }
  b.append(el('div.ph-hero.green', null, iconEl('ui.coin', 3), el('div', null, el('small', { text: 'Available balance' }), el('b.ph-big', { text: money(bal) }), bal < 0 ? el('small', { text: `Overdraft: no fees, down to ${money(OVERDRAFT.limit)}.` }) : null)));
  const tot = inn + out || 1;
  b.append(card(el('b', { text: 'This week' }), el('div.ph-inout', { role: 'img', 'aria-label': `In ${money(inn)}, out ${money(out)}` }, el('i', { style: { width: inn / tot * 100 + '%', background: 'var(--good)' } }), el('i', { style: { width: out / tot * 100 + '%', background: 'var(--accent)' } })), kv('Money in', '+' + money(inn)), kv('Money out', '-' + money(out))));
  const B = bills();
  b.append(section('Next bill', el('span.ph-chip.gold', { text: when(B.dueT) })));
  const c = card(); for (const i of B.items) c.append(kv(i.label, money(i.amount))); if (B.arrears) c.append(kv('Carried over', money(B.arrears)));
  c.append(kv('Total', money(B.total + (B.arrears || 0)), 'total')); b.append(c);
  b.append(el('p.ph-note', { text: bal >= B.total ? 'You are covered for the next bill.' : 'A bit short for the next bill. No panic: nobody gets evicted in Maple Bay.' }));
}
function activityTab(b) {
  const H = hist(); if (!H.length) return b.append(empty('ui.coin', 'No activity yet', 'Pay, shopping, fares and tips will be listed here.'));
  for (const h of H.slice(0, 30)) b.append(row({ icon: h.d >= 0 ? 'ui.plus' : 'ui.minus', iconScale: 1, title: cap(h.r || (h.d >= 0 ? 'Income' : 'Payment')), sub: when(h.t), right: (h.d >= 0 ? '+' : '-') + money(Math.abs(h.d)), rightCls: h.d >= 0 ? 'good' : 'bad' }));
}
function homeTab(b, ctx) {
  const hs = G.state.home || {}, h = HOME_BY_ID[hs.id], loan = safe(() => G.money.loan(), null) || (G.state.bank && G.state.bank.loan) || null, mort = safe(() => G.housing.mortgage(), null), bank = place('bank');
  b.append(section('Home'));
  if (h) b.append(card(el('b', { text: h.name }), kv(hs.owned ? 'Status' : 'Lease', hs.owned ? 'You own it' : 'Weekly, rolls over every Monday'), hs.owned ? (h.upkeepPerWeekOwned ? kv('Upkeep', money(h.upkeepPerWeekOwned) + ' / week') : null) : h.rentPerWeek ? kv('Rent', money(h.rentPerWeek) + ' / week') : null, !hs.owned && h.buyPrice ? kv('To buy', money(h.buyPrice)) : null));
  else b.append(card(el('p', { text: 'No home on file yet. Pick up your keys first!' })));
  b.append(section('Mortgage'));
  if (mort && (mort.left || mort.balance)) b.append(card(kv('Remaining', money(mort.balance || 0)), mort.weekly ? kv('Weekly payment', money(mort.weekly)) : null, mort.left ? kv('Weeks left', String(mort.left)) : null));
  else b.append(card(el('p', { text: `None. Buying needs ${Math.round(MORTGAGE.downPayment * 100)}% down, then ${MORTGAGE.terms.map(t => t.weeks).join(' / ')} weekly payments. Miss one and the term just grows by a week.` })));
  b.append(section('Loan'));
  if (loan && (loan.balance || loan.left)) b.append(card(kv('Balance', money(loan.balance || 0)), loan.weekly ? kv('Weekly repayment', money(loan.weekly)) : null, loan.left ? kv('Weeks left', String(loan.left)) : null,
    G.money && G.money.repayLoan ? btn('Repay early', () => { safe(() => G.money.repayLoan(), 0); ctx.refresh(); }, 'wide') : null));
  else { const d = dayOf(G.state.t), max = LOAN.maxByWeek.filter(m => d >= m.fromDay).pop(); b.append(card(el('p', { text: `None. Small loans up to ${money(max.max)}: a flat ${Math.round(LOAN.fee * 100)}% fee, repaid over ${LOAN.repayWeeks} Mondays.${LOAN.requiresJob ? ' You need a job first.' : ''}` }))); }
  b.append(el('p.ph-note', { text: 'New loans, leases and home purchases need a visit to Bay Realty & Trust, Downtown.' }));
  if (bank) b.append(btn('Show the bank on the map', () => ctx.open('map', { place: bank.id }), 'wide', 'ui.pin'));
}
export default {
  id: 'bank',
  badge: () => (balance() < 0 ? 1 : 0),
  render(b, ctx) {
    b.append(tabs([{ id: 'balance', name: 'Balance' }, { id: 'activity', name: 'Activity' }, { id: 'home', name: 'Home & Loans' }], tab, t => { tab = t; ctx.refresh(); }));
    (tab === 'balance' ? balanceTab : tab === 'activity' ? activityTab : homeTab)(b, ctx);
  },
};
