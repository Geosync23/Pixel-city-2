// Phone app: Me — who you are. Tabs: Me (traits at a glance, interests, top skills, mini-game switch, coaches), Skills (all 21 by interest family;
// tap one for its levels, what each gives, how to train it, its coach and your best), Traits (picked + earned, the habit tracker, change), Records (personal bests,
// chess rating, biggest fish, arcade boards, earnings, and everything you have made: album, paintings, writing, apps, songs).
// Reads G.traits / G.skills / G.skillplay defensively. Deep links: G.phone.open('me', { tab: 'me' | 'skills' | 'traits' | 'records', pick: true (open the trait picker), skill: id }).
// Styles: the .me-* rules in src/ui/minigame.css. Registered as app id 'me' (not in the store catalogue: it is on the phone from the start; badge 1 until three traits are picked).
import { G } from '../core/game.js';
import { SKILL_MAX_LEVEL } from '../data/needs.js';
import { ACTIVITIES } from '../data/activities.js';
import { XP_MAP, FAMILIES, INTEREST, GAME_FOR, COACHES, NEW_BOOKS, LADDER } from '../data/skills_extra.js';
import { TRAIT_BY_ID, TRAIT_PICKS } from '../data/traits.js';
import { el, iconEl, empty, tabs, btn, card, section, kv, bar, chip, safe } from './phone_util.js';

let tab = 'me', lastArg = null;
const SP = () => G.skillplay, TR = () => G.traits, SKL = () => G.skills;
const defOf = k => safe(() => SKL().defs.find(d => d.id === k), null);
const WHERE = { home: 'at home', venue: 'in town', world: 'outdoors', anywhere: 'anywhere' };
const hh = h => String(h).padStart(2, '0') + ':00';
const money = n => safe(() => G.money.fmt(n), '$' + n);

function traitCard(t, extra) {
  return card(el('div.me-trait', null, iconEl(t.icon, 2), el('b', { text: t.name + (extra || '') }), el('small', null, el('i', { text: t.blurb })),
    el('div', null, ...t.plus.map(p => el('small.pl', { text: '+ ' + p, style: { display: 'block' } })), t.down ? el('small.dn', { text: '− ' + t.down, style: { display: 'block' } }) : null)));
}
function pick(ctx, mode) { ctx.close(); setTimeout(() => safe(() => TR().open({ mode }).then(() => safe(() => G.phone.open('me', { tab: 'traits' }), 0)), 0), 220); }

function meTab(b, ctx) {
  const tr = TR(), S = SKL(), sp = SP(), name = safe(() => G.state.player.name, 'You');
  const picked = safe(() => tr.picked(), []).map(id => TRAIT_BY_ID[id]).filter(Boolean), earned = safe(() => tr.earned(), []).filter(id => !tr.isOff(id)).map(id => TRAIT_BY_ID[id]).filter(Boolean);
  b.append(el('div.ph-hero', { style: { background: '#d9c8f2' } }, iconEl('app.me', 3), el('div', null, el('small', { text: 'This is' }), el('b', { text: name, style: { fontSize: '20px' } }), el('small', { text: picked.length ? picked.map(t => t.name).join(' · ') : 'Traits not chosen yet' }))));
  if (tr && picked.length < TRAIT_PICKS) b.append(card(el('b', { text: 'Who are you, really?' }), el('p', { text: `Pick ${TRAIT_PICKS} traits that fit you. Each has a few small perks and lots of character.` }), btn('Pick your traits', () => pick(ctx, 'prompt'), 'pri wide', 'ui.sparkle')));
  else if (tr) { b.append(section('Traits')); b.append(el('div.ph-chips', null, picked.concat(earned).map(t => el('button.ph-chip' + (t.earned ? '.gold' : '.good'), { onclick: () => ctx.tip(`${t.name}: ${t.plus.join('. ')}.${t.down ? ' But: ' + t.down + '.' : ''}`) }, iconEl(t.icon, 1), t.name)))); }
  if (S && S.interests) {
    const ints = S.interests(); b.append(section('Interests', el('small', { text: `${ints.length} of ${INTEREST.min}-${INTEREST.max}` })));
    b.append(el('div.ph-chips', null, FAMILIES.map(f => el('button.ph-chip' + (ints.includes(f.id) ? '.on' : ''), { 'data-fam': f.id, onclick: () => { const cur = S.interests(); if (cur.includes(f.id)) S.setInterests(cur.filter(x => x !== f.id)); else if (cur.length >= INTEREST.max) return ctx.tip(`Up to ${INTEREST.max} interests. Drop one first.`); else S.setInterests(cur.concat(f.id)); ctx.refresh(); } }, iconEl(f.icon, 1), f.name))));
    b.append(el('p.ph-note', { text: `Things you are interested in give ${Math.round(INTEREST.fun * 100)}% more Fun and ${Math.round((INTEREST.xp - 1) * 100)}% more xp. Change them whenever you like.` }));
  }
  if (S) { const top = safe(() => S.defs.slice().sort((x, y) => S.xp(y.id) - S.xp(x.id)).slice(0, 3), []).filter(d => S.xp(d.id) > 0);
    b.append(section('Best at', btn('All skills', () => { tab = 'skills'; ctx.refresh(); }, '')));
    if (!top.length) b.append(el('p.ph-note', { text: 'Nothing yet. Cook, paint, fish, dance, play: everything you do makes you better at it.' })); else for (const d of top) b.append(skillRow(d, ctx)); }
  if (sp) { const on = !sp.auto(); b.append(section('Mini-games'), card(el('p', { text: on ? 'On: cooking, painting, music, fishing and more open a short game. Tap Auto in any game for the usual result.' : 'Off: activities run by themselves and give the usual result.' }), btn(on ? 'Turn mini-games off' : 'Turn mini-games on', () => { sp.setAuto(on); ctx.refresh(); }, on ? '' : 'pri'))); }
  if (sp) { b.append(section('Coaches around town')); for (const c of safe(() => sp.coaches(), [])) b.append(card(el('div.ph-need', null, iconEl('skill.' + c.skill, 2), el('div.l', null, el('span', { text: c.short }), el('small', { text: c.doneToday ? 'done today' : c.here ? 'there now' : `${hh(c.hours[0])}-${hh(c.hours[1])}` })), el('small', { text: `${c.role}. ${defOf(c.skill).name} lesson ${money(c.fee)}.` })),
    c.x !== null ? btn('Take me there', () => { safe(() => G.phone.routeTo({ x: c.x, y: c.y, name: c.short }), 0); }, '', 'ui.pin') : null)); }
}

function skillRow(d, ctx) {
  const S = SKL(), lvl = S.level(d.id), nx = S.next(d.id), int = safe(() => S.isInterest(d.id), false);
  const r = el('button.me-sk' + (int ? '.int' : ''), { 'data-skill': d.id, onclick: () => ctx.push(d.name, (bb, cc) => skillPage(bb, cc, d.id), 'skill:' + d.id) }, iconEl('skill.' + d.id, 2),
    el('span.n', null, el('b', { text: d.name }), el('small', { text: lvl >= SKILL_MAX_LEVEL ? 'Mastered' : safe(() => S.ladder(d.id, lvl), '') })), el('span.lv', { text: 'Lv ' + lvl }), bar(nx ? nx.into : 1, nx ? nx.need : 1, 'var(--blue)', `${d.name} level ${lvl}`));
  return r;
}
function skillsTab(b, ctx) {
  const S = SKL(); if (!S) return b.append(empty('ui.star', 'Skills are warming up', 'Check back in a moment.'));
  const total = safe(() => S.defs.reduce((n, d) => n + S.level(d.id), 0), 0); b.append(el('p.ph-note', { text: `${S.defs.length} skills, ${SKILL_MAX_LEVEL} levels each. Total level ${total}. Skills never fade. The first practice of the day counts half as much again.` }));
  const seen = new Set();
  for (const f of FAMILIES) { const ds = f.skills.map(defOf).filter(Boolean); if (!ds.length) continue; b.append(section(f.name, safe(() => S.interests().includes(f.id), false) ? chip('interest', 'gold') : null)); for (const d of ds) { seen.add(d.id); b.append(skillRow(d, ctx)); } }
  const rest = S.defs.filter(d => !seen.has(d.id)); if (rest.length) { b.append(section('Other')); for (const d of rest) b.append(skillRow(d, ctx)); }
}
function skillPage(b, ctx, k) {
  const S = SKL(), sp = SP(), d = defOf(k); if (!d) return; const lvl = S.level(k), nx = S.next(k);
  b.append(el('div.ph-hero', null, iconEl('skill.' + k, 3), el('div', null, el('small', { text: d.desc }), el('b', { text: `Level ${lvl}` + (lvl >= SKILL_MAX_LEVEL ? ' (max)' : ''), style: { fontSize: '18px' } }), bar(nx ? nx.into : 1, nx ? nx.need : 1, 'var(--blue)', `${d.name} level ${lvl}`), el('small', { text: nx ? `${Math.round(nx.need - nx.into)} xp to level ${lvl + 1}` : 'Nothing left to learn. You could teach this.' }))));
  if (lvl > 1) b.append(card(el('b', { text: 'Right now' }), el('p', { text: safe(() => S.perk(k, lvl), '') })));
  const us = safe(() => S.unlocks(k), []);
  if (us.length) { b.append(section('What each level gives')); const c = card(); for (const u of us) c.append(el('div.me-lv' + (u.got ? '.got' : u.level === lvl + 1 ? '.next' : '.off'), { 'data-lv': u.level }, el('i', { text: String(u.level) }), el('div', null, el('b', { text: u.name + (u.level === lvl + 1 ? '  (next)' : '') }), ...u.lines.slice(1).map(t => el('span', { text: t }))))); b.append(c); }
  const acts = ACTIVITIES.filter(a => (a.xpPerHour && a.xpPerHour[k]) || (XP_MAP[a.id] && XP_MAP[a.id][k])).sort((x, y) => ((y.xpPerHour && y.xpPerHour[k]) || XP_MAP[y.id][k]) - ((x.xpPerHour && x.xpPerHour[k]) || XP_MAP[x.id][k])).slice(0, 8);
  b.append(section('How to get better'));
  const c2 = card(); for (const a of acts) c2.append(kv(a.name + (GAME_FOR[a.id] ? '  ★' : ''), WHERE[a.where] || '')); if (acts.some(a => GAME_FOR[a.id])) c2.append(el('small', { text: '★ has a mini-game: play it for bonus xp' }));
  const bk = NEW_BOOKS.filter(x => x.skill === k).map(x => x.name); if (bk.length) c2.append(el('small', { text: 'Books (bookshop): ' + bk.join(', ') })); else if (['cooking', 'fitness', 'charisma', 'logic', 'creativity', 'handiness'].includes(k)) c2.append(el('small', { text: 'Two skill books at the bookshop teach this as well.' }));
  if (k === 'swimming') c2.append(el('small', { text: 'Every length, dive and race at the Natatorium counts too.' }));
  b.append(c2);
  const co = COACHES.find(x => x.skill === k), live = co && safe(() => sp.coaches().find(x => x.id === co.id), null);
  if (co) b.append(card(el('b', { text: 'Coach: ' + co.name }), el('p', { text: `${co.role}. ${hh(co.hours[0])} to ${hh(co.hours[1])}, ${money(co.fee)} a lesson${co.favour ? ' or a small favour' : ''}. One lesson a day.` }), live && live.x !== null ? btn('Take me there', () => safe(() => G.phone.routeTo({ x: live.x, y: live.y, name: co.short }), 0), '', 'ui.pin') : null));
  const keys = [...new Set(Object.keys(GAME_FOR).filter(id => safe(() => sp.GAMES[GAME_FOR[id]].skill, null) === k).map(id => GAME_FOR[id]))];
  if (sp && keys.length) { b.append(section('Mini-games')); for (const key of keys) { const best = sp.best(key), g = sp.GAMES[key]; b.append(card(kv(safe(() => g.title(lvl, {}, null, {}), key), best && best.n ? `${'★'.repeat(Math.max(1, Math.round(best.q * 3)))} · played ${best.n}x` : 'not played yet'),
    btn('Practise (no rewards)', () => { ctx.close(); setTimeout(() => safe(() => sp.demo(key), 0), 250); }, ''))); } }
}

function traitsTab(b, ctx) {
  const tr = TR(); if (!tr) return b.append(empty('ui.sparkle', 'Traits are warming up', 'Check back in a moment.'));
  const picked = tr.picked().map(id => TRAIT_BY_ID[id]).filter(Boolean), earned = tr.earned().map(id => TRAIT_BY_ID[id]).filter(Boolean);
  if (picked.length < TRAIT_PICKS) b.append(card(el('b', { text: 'Pick three traits' }), el('p', { text: 'Small perks, at most one gentle downside each, and little moments of character out in town.' }), btn('Pick your traits', () => pick(ctx, 'prompt'), 'pri wide', 'ui.sparkle')));
  if (picked.length) { b.append(section('You are')); for (const t of picked) b.append(traitCard(t)); const can = tr.canChange();
    b.append(btn(can ? 'Change traits' : `Change traits (in ${tr.changeIn()} day${tr.changeIn() === 1 ? '' : 's'})`, () => (can ? pick(ctx, 'change') : ctx.tip('People change slowly: once a week.')), can ? 'wide' : 'wide off')); }
  b.append(section('Earned through habits'));
  if (!earned.length) b.append(el('p.ph-note', { text: 'Nothing yet. What you do again and again becomes part of you.' }));
  for (const t of earned) { const off = tr.isOff(t.id), c = traitCard(t, t.id === 'regular' && tr.regularAt() ? ' at ' + safe(() => G.places.get(tr.regularAt()).name, 'your place') : ''); c.append(btn(off ? 'Switched off. Turn on' : 'Turn off', () => { tr.toggle(t.id); ctx.refresh(); }, off ? 'pri' : '')); if (off) c.style.opacity = '.7'; b.append(c); }
  b.append(section('Habits'));
  const hc = card(); for (const h of tr.habits()) hc.append(el('div.me-hab', null, el('span', { text: `${h.label}  →  ${TRAIT_BY_ID[h.trait].name}` }), el('b', { text: h.done ? 'earned' : `${h.n} / ${h.need}` }), bar(h.done ? 1 : h.n, h.done ? 1 : h.need, h.done ? 'var(--good)' : 'var(--gold)', h.label))); b.append(hc);
}

const WORK_GROUPS = [['photo', 'Photo album'], ['painting', 'Paintings'], ['sketch', 'Sketches'], ['story', 'Writing'], ['app', 'Apps'], ['song', 'Songs you can play'], ['drink', 'Drinks mixed']];
function recordsTab(b, ctx) {
  const sp = SP(); if (!sp) return b.append(empty('ui.trophy', 'Nothing here yet', 'Records and the things you make will collect here.'));
  const s = sp.state(), games = sp.games().filter(g => g.best && g.best.n);
  b.append(section('Personal bests'));
  if (!games.length) b.append(el('p.ph-note', { text: 'Play a mini-game and your best shows up here.' }));
  else { const c = card(); for (const g of games) c.append(kv(g.title, `${'★'.repeat(Math.max(1, Math.round(g.best.q * 3)))}${g.best.stat ? ' · ' + g.best.stat + ' ' + (g.best.statName || '') : ''} · ${g.best.n}x`)); b.append(c); }
  const c2 = card(kv('Chess rating', `${s.chess.elo} (best ${s.chess.hi}, ${s.chess.w} won, ${s.chess.l} lost)`), kv('Biggest fish', s.fish ? `${s.fish.cm} cm ${s.fish.name}` : 'none yet'), kv('Garden harvests', String(s.garden.n) + (s.garden.g > 0 ? ` (bed ${Math.round(s.garden.g * 100)}% grown)` : '')),
    kv('Tips earned', money(s.money.tips || 0)), kv('Sold at the market', money(s.money.sold || 0)), kv('Writing and apps', money(s.money.pay || 0)), kv('Lessons taken', String(s.n.lessons || 0)));
  b.append(section('Milestones'), c2);
  const arc = sp.arcade.filter(a => s.arcade[a.id]); if (arc.length) { b.append(section('Arcade high scores')); b.append(card(...arc.map(a => kv(a.name, String(s.arcade[a.id]))))); }
  const all = sp.works(), col = safe(() => G.traits.has('collector'), false);
  b.append(section('Things you made', el('small', { text: String(all.length) })));
  if (!all.length) b.append(el('p.ph-note', { text: 'Photos, paintings, sketches, stories, apps and songs you finish are kept here.' }));
  for (const [k, title] of WORK_GROUPS) { const ws = sp.works(k).slice().reverse(); if (!ws.length) continue; b.append(el('div.ph-sec', null, el('span', { text: title }), el('small', { text: (k === 'song' ? `${ws.length} of ${LADDER.music.rungs.length}` : String(ws.length)) + (col ? ' collected' : '') })));
    b.append(el('div.me-grid', null, ws.slice(0, 18).map(w => el('div.me-work', { title: w.n }, sp.thumb(w), el('span', { text: w.n }), el('small', { text: `${'★'.repeat(Math.max(1, Math.round((w.q || 0) * 3)))}${w.sold ? ' · sold' : ''}` }))))); }
}

function render(b, ctx) {
  const fresh = !!ctx.arg && ctx.arg !== lastArg, a = fresh ? ctx.arg : {}; if (fresh) lastArg = ctx.arg;   // a deep link applies once, not on every refresh
  if (a.tab && ['me', 'skills', 'traits', 'records'].includes(a.tab)) tab = a.tab; const wantPick = a.pick, wantSkill = a.skill;
  b.append(tabs([{ id: 'me', name: 'Me' }, { id: 'skills', name: 'Skills' }, { id: 'traits', name: 'Traits' }, { id: 'records', name: 'Records' }], tab, t => { tab = t; ctx.refresh(); }));
  (tab === 'skills' ? skillsTab : tab === 'traits' ? traitsTab : tab === 'records' ? recordsTab : meTab)(b, ctx);
  if (wantSkill && defOf(wantSkill)) setTimeout(() => safe(() => ctx.push(defOf(wantSkill).name, (bb, cc) => skillPage(bb, cc, wantSkill), 'skill:' + wantSkill), 0), 0);
  else if (wantPick && TR() && TR().picked().length < TRAIT_PICKS) setTimeout(() => pick(ctx, 'prompt'), 60);
}
export const order = 124;
export function init() {
  if (!G.phone || !G.phone.registerApp) return;
  G.phone.registerApp({ id: 'me', name: 'Me', question: 'Who am I?', iconId: 'app.me', color: '#7a55c8', slot: 2.5, render, badge: () => (safe(() => TR().picked().length, TRAIT_PICKS) < TRAIT_PICKS ? 1 : 0) });
  safe(() => G.phone.unlock('me', true), 0);
}
