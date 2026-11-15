// Relationship verbs + meters (helper of sim/rel.js): the 25 history-dependent verbs of rel_rules.js VERBS_NEW, shown in the EXISTING talk panel
// (ui/talk.js) under the social system's twelve, each only while its moment is true; the two visible meters (friendship stage incl. Confidant, and the
// romance stage + warmth once there is Something There) on the talk sheet and on the person's card in Messages.
// Hooks (all add-only, see docs/reports/relationships.md): social.js verbsFor() -> talkVerbs(ses, out), act() -> talkAct(ses, vid, arg),
//   talk.js setRel() -> talkMeter(ses, head), picker() -> talkPicker(ses, v, ui), phone_messages.js personView() -> personCard(id, body, ctx).
// A verb never fails harshly: when its moment is not quite there the person gives the kind "not yet" (`soft`).
import { G } from '../core/game.js';
import { el, toast, bubble } from '../ui/kit.js';
import { UI } from '../ui/chapters_ui.js';
import { FRIEND_STAGES } from '../story/_rel_kit.js';
import { VERBS_NEW } from '../story/rel_rules.js';
import { comp } from './_chapters_cast.js';
import * as B from './_rel_base.js';
import { st, safe, today, DAY, HOOK, fill, short, fr, addFr, friendStage, stage, stageIdx, warmth, addWarmth, isRom, ror, frr, canStart, openTrack, remember, PEOPLE, WARMTH, NEWS, mood, PAGES } from './_rel_base.js';
import { RECIPE_BY_ID, ITEM_BY_ID } from '../data/items.js';

const V = Object.fromEntries(VERBS_NEW.map(v => [v.id, v]));
const pick = a => (a && a.length ? a[Math.floor(Math.random() * a.length)] : '');
const fsi = id => FRIEND_STAGES.indexOf(friendStage(id));
const cd = (id, v) => (frr(id).cd || {})[v] || 0, setCd = (id, v, h) => { const r = frr(id); (r.cd || (r.cd = {}))[v] = G.state.t + h * 60; };
const lastTalk = id => safe(() => G.state.social.npcs[id].lastTalkDay, -1);
const cookedDish = () => safe(() => G.inv.items().find(s => /^meal_/.test(s.id)), null);
const eventSoon = () => safe(() => G.planner.list(G.state.t, G.state.t + 2 * DAY, { events: true }).find(a => a.event && a.placeId), null);
function deciding() { const d = today(), s = st(), e = s.small.ev || {}; if (Object.values(s.dates).some(x => !x.done && x.t - G.state.t < 2 * DAY && x.t > G.state.t)) return 'heart'; if (d - (e.promoted || -9) <= 2 || d - (e.hired || -9) <= 2) return 'work'; if (d - (e.moved || -9) <= 7) return 'home'; if (d - (e.chapter || -9) <= 2) return 'family'; return null; }
const freshNews = id => { const s = st(); return s.news.filter(n => today() - n.day <= 2 && !((s.told[n.kind + ':' + n.day] || []).includes(id))); };
const otherFriend = (ses) => safe(() => Object.keys(G.social._rt()).find(o => o !== ses.id && fr(o) >= 40 && G.social.char(o) && !B.flag('knows:' + [ses.id, o].sort().join(':')) && Math.hypot(G.social.char(o).x - G.player.x, G.social.char(o).y - G.player.y) < 9), null);
const walking = id => { const w = st().walk; return !!w && w.id === id && w.until > G.state.t; };
const partnerDays = id => { const r = st().ro[id]; return r && r.partnerDay !== null && r.partnerDay !== undefined ? today() - r.partnerDay : -1; };
const atHomeEvening = () => safe(() => G.housing.isHome(), false) && G.now().hf >= 17;

/** which of the context verbs are true for this person right now -> [{ id, label, note?, picker? }] */
export function verbsFor(id, ses) {
  const out = [], P = PEOPLE[id], c = B.castOf(id); if (!c || c.citizen) return out; const kid = c.age < 14, f = fsi(id), t = G.state.t, s = st(), rom = isRom(id), sg = stage(id), si = stageIdx(id), r = s.ro[id] || {};
  const atWork = !!(ses && ses.atWork), add = (vid, label, x) => { if (cd(id, vid) > t) return; out.push(Object.assign({ id: 'rel:' + vid, label: label || V[vid].label }, x)); };
  /* ---- friendship ---- */
  const th = s.threads[id] && HOOK.SC[s.threads[id]]; if (th && th.ask && f >= 1) add('ask_thing', 'Ask: "' + th.ask[0] + '"', { special: true });
  if (f >= 2 && lastTalk(id) >= 0 && today() - lastTalk(id) >= 5) add('catch_up');
  if (f >= 2 && !kid && G.scene && G.scene.id === 'city' && !atWork && !walking(id)) add('walk_with');
  if (f >= 2 && cookedDish()) add('share_meal');
  if (f >= 2 && !kid && safe(() => G.housing.current(), null) && !(ses && ses.hang)) add('cook_for', null, { picker: 'visit' });
  const ev = eventSoon(); if (f >= 2 && !kid && ev) add('plus_one', 'Come with me to ' + ev.title, { ev });
  if (f >= 2 && !kid && deciding()) add('advice');
  if (f >= 2 && freshNews(id).length) add('news');
  if (f >= 2 && safe(() => G.needs.mood(), 70) < 45) add('lean');
  if (f >= 2 && P && P.craft && atWork) add('show_me');
  const o = f >= 3 && ses ? otherFriend(ses) : null; if (o) add('introduce', 'Introduce them to ' + short(o), { other: o });
  if (f >= 3 && !kid && !frr(id).keys && !(rom && si >= 4)) add('swap_keys');
  /* ---- romance: the ten only, never a current boss to begin with ---- */
  if (!rom) return out;
  const cs = canStart(id);
  if (sg === 'none') { if (f >= 2 && (cs === true || (cs === 'boss' && !r.bossSaid) || cs === 'closed')) add('say_it'); return out; }
  if (si >= 1 && si < 5) add('ask_out', null, { picker: 'date' });
  if (si >= 2 && walking(id)) add('hand');
  if (si >= 2 && !atWork && r.kissDay !== today()) add('kiss');
  if (si >= 2 && r.lastSeen !== undefined && today() - r.lastSeen >= 4) add('miss_you');
  if (sg === 'dating' && warmth(id) >= 35) add('define', null, { special: true });
  if (sg === 'exclusive' && warmth(id) >= 55) add('ask_partner', null, { special: true });
  if (si >= 4 && !r.keys) add('offer_key');
  if (sg === 'partner' && !r.lives && warmth(id) >= 75 && partnerDays(id) >= 14) add('ask_move_in');
  if (sg === 'partner' && warmth(id) >= 85 && partnerDays(id) >= 28 && r.hearts[2]) add('propose', null, { special: true });
  if (si >= 4 && atHomeEvening() && r.stayDay !== today()) add('stay_in');
  if (si === 1 || si === 2) add('just_friends'); if (si >= 3) add('end_it');
  return out;
}
/** add-only hook in social.js verbsFor(): our verbs go in before "Say goodbye" */
export function talkVerbs(ses, out) {
  if (!ses || ses.light || ses.ended || ses.id === '_anon') return; const id = ses.id, mineV = verbsFor(id, ses);
  /* the three who are not `flirtable` in cast.js are romanceable here (the data's ROMANCEABLE is the list that counts) */
  if (isRom(id) && !out.some(v => v.id === 'flirt') && fsi(id) >= 1 && (canStart(id) === true || stage(id) !== 'none')) mineV.unshift({ id: 'flirt', label: 'Flirt', disabled: (ses.rec.cd.flirt || 0) > G.state.t });
  if (isRom(id) && canStart(id) !== true && stage(id) === 'none') { const k = out.findIndex(v => v.id === 'flirt'); if (k >= 0 && (B.isBoss(id) || B.partner())) out.splice(k, 1); }      /* no flirting with your boss, or once you are Together with somebody */
  const k = out.findIndex(v => v.id === 'goodbye'); out.splice(k < 0 ? out.length : k, 0, ...mineV);
}
const say = t => (String(t).startsWith('*') ? String(t).replace(/^\*|\*$/g, '') : t);
/** add-only hook in social.js act(): -> a result for the talk panel, or null when the verb is not ours */
export function talkAct(ses, vid, arg) {
  if (!String(vid).startsWith('rel:')) return null; const k = vid.slice(4), v = V[k], id = ses.id, P = PEOPLE[id] || {}, r = isRom(id) ? ror(id) : null, s = st(); if (!v) return null;
  const res = { verb: vid, you: say(fill(pick(v.you))), them: say(fill(pick((P.verbs && P.verbs[k] && P.verbs[k].ok) || v.ok))), delta: 0, ok: true }, soft = () => { res.them = fill(pick((P.verbs && P.verbs[k] && P.verbs[k].soft) || v.soft) || 'Not today. Ask me again.', { thing: 'this week' }); res.ok = false; };
  const scene = key => { res.them = ''; res.end = true; ses.ended = true; res.start = () => HOOK.start(id + '.' + key); };
  const rec = ses.rec; if (rec.lastTalkDay !== today()) { rec.lastTalkDay = today(); rec.talksToday = 0; } rec.talksToday++; if (v.cooldownH) setCd(id, k, v.cooldownH); G.advance(3);
  const N = G.needs;
  switch (k) {
    case 'ask_thing': { const sc = HOOK.SC[s.threads[id]]; if (!sc) return null; res.you = sc.ask[0]; const a = String(sc.ask[1]); res.them = fill(a.slice(a.indexOf('|') + 1)); delete s.threads[id]; res.delta = addFr(id, 3); safe(() => N.add('social', 10)); break; }
    case 'catch_up': res.delta = addFr(id, 4); safe(() => N.add('social', 24)); res.after = fill(pick(['Now you. What have I missed?', 'That is me. Your turn, and do not leave out the dull parts.'])); break;
    case 'walk_with': if (ses.atWork) { soft(); break; } res.delta = addFr(id, 2); res.end = true; ses.ended = true; res.start = () => walkWith(id); break;
    case 'share_meal': { const d = cookedDish(); if (!d) return null; const rid = d.id.replace(/^meal_/, ''), liked = ((P.likes || {}).recipes || []).includes(rid); safe(() => G.inv.remove(d.id, 1)); res.delta = addFr(id, liked ? 4 : 2); if (liked) { remember(id, 'cooked_for'); if (r && stage(id) !== 'none') addWarmth(id, WARMTH.cookedTheirFavourite, 'verb'); res.after = 'You made THIS. For me. I am going to be thinking about this for a week.'; } safe(() => { N.add('hunger', 30); N.add('social', 14); }); break; }
    case 'cook_for': { const why = arg && arg.t ? null : 'x'; if (why) { soft(); break; } const home = safe(() => G.housing.current().roomId, null); res.appt = safe(() => G.social.hangout(id, { placeId: home, t: arg.t, dur: 120, kind: 'visit', title: `${short(id)} comes for dinner` }), null); if (!res.appt) soft(); else res.after = 'It is on your day.'; break; }
    case 'plus_one': { const ev = eventSoon(); if (!ev) { soft(); break; } res.you = fill(pick(v.you), { event: ev.title }); if (stage(id) !== 'none' && isRom(id)) { const ok = safe(() => HOOK.bookDate({ id, type: 'plusone', venue: ev.placeId, t: Math.max(ev.t, G.state.t + 30), title: ev.title }), null); if (!ok) soft(); } else { res.appt = safe(() => G.social.hangout(id, { placeId: ev.placeId, t: Math.max(ev.t, G.state.t + 30), dur: 90, kind: 'out', title: `${ev.title} with ${short(id)}` }), null); if (!res.appt) soft(); else if (((P.likes || {}).outings || []).includes('plusone')) res.delta = addFr(id, 2); } break; }
    case 'advice': { const kind = deciding() || 'work'; res.them = fill((P.advice && P.advice[kind]) || pick(v.ok)); res.delta = addFr(id, 2); break; }
    case 'news': { const n = freshNews(id)[0]; if (!n) return null; (s.told[n.kind + ':' + n.day] || (s.told[n.kind + ':' + n.day] = [])).push(id); const line = NEWS[n.kind] && NEWS[n.kind][id]; if (line) res.them = fill(line); res.delta = addFr(id, 3); break; }
    case 'lean': { const low = ['energy', 'hunger', 'social', 'comfort'].sort((a, b) => safe(() => N.get(a), 50) - safe(() => N.get(b), 50))[0]; res.after = { energy: 'Sit. No, properly. I will stand here and be in the way of anybody who wants you.', hunger: 'When did you last eat? That was not a question. Here.', social: 'Then stay a while. I was only going to talk to myself.', comfort: 'Take the good chair. I will fetch something hot.' }[low]; safe(() => { N.add(low, 14); N.add('social', 12); }); mood('rel_held'); remember(id, 'leaned'); res.delta = addFr(id, 2); break; }
    case 'show_me': { if (P.craft) safe(() => G.skills.addXp(P.craft, 14)); res.after = `(+14 ${P.craft || 'skill'} xp)`; res.delta = addFr(id, 1); break; }
    case 'introduce': { const o = otherFriend(ses); if (!o) return null; B.setFlag('knows:' + [id, o].sort().join(':')); res.you = fill(pick(v.you), { other: short(o) }); const oc = safe(() => G.social.char(o), null); if (oc) setTimeout(() => bubble(oc, fill(pick(v.ok)), 3200), 1800); res.delta = addFr(id, 2); addFr(o, 2); break; }
    case 'swap_keys': frr(id).keys = today(); if (P.keyLine) res.them = fill(P.keyLine); res.delta = addFr(id, 3); UI.toastGold(`You and ${short(id)} hold each other's spare keys.`); break;
    /* ---- romance ---- */
    case 'say_it': { const cs = canStart(id); if (cs === 'boss') { r.bossSaid = 1; res.them = fill(P.bossLine || 'Ask me that on a day I am not signing your timesheet.'); res.ok = false; break; } if (cs !== true) { soft(); break; } if (!openTrack(id, 'said')) { soft(); break; } addWarmth(id, 2, 'scene'); mood('rel_butterflies'); break; }
    case 'ask_out': { const ok = arg && safe(() => HOOK.bookDate(Object.assign({ id }, arg)), null); if (!ok) { soft(); break; } res.after = 'It is on your day.'; break; }
    case 'hand': if (r.handDay !== today()) { r.handDay = today(); res.delta = 0; addWarmth(id, 1, 'verb'); } s.walk.hand = 1; break;
    case 'kiss': if (ses.atWork) { soft(); break; } if (!r.kissed) { r.kissed = 1; mood('rel_butterflies'); } r.kissDay = today(); addWarmth(id, WARMTH.kiss, 'verb'); break;
    case 'miss_you': addWarmth(id, 2, 'verb'); r.lastSeen = today(); if (P.missed) res.them = fill(P.missed); break;
    case 'define': if (r.hearts[0] || HOOK.seen(id + '.h1')) scene('steady'); else soft(); break;
    case 'ask_partner': if (r.hearts[1] || HOOK.seen(id + '.h2')) scene('partner'); else soft(); break;
    case 'offer_key': scene('keys'); break;
    case 'ask_move_in': if (r.hearts[2] || HOOK.seen(id + '.h3')) scene('movein'); else soft(); break;
    case 'propose': scene('proposal'); break;
    case 'stay_in': r.stayDay = today(); res.end = true; ses.ended = true; res.start = () => HOOK.stayIn(id); break;
    case 'just_friends': res.you = ''; res.them = ''; res.end = true; ses.ended = true; res.start = () => HOOK.endIt(id, 'letdown', { ask: true }); break; /* QA13: the verb asks first, as end_it does (a tap meant to move the talk on landed on it and ended a Dating track) */
    case 'end_it': res.you = ''; res.them = ''; res.end = true; ses.ended = true; res.start = () => HOOK.endIt(id, 'breakup'); break;
    default: break;
  }
  if (r) r.lastSeen = today();
  safe(() => G.skills.addXp('charisma', 4)); G.emit('social:talk', id, vid, res.ok); G.emit('rel:verb', id, k, res.ok);
  return res;
}
/** they walk beside you for a while (the Chapters' companion code); "Take their hand" is offered while they do */
function walkWith(id, minutes = 25) {
  st().walk = { id, until: G.state.t + minutes, hand: 0 }; HOOK.withUs([id]); safe(() => G.needs.add('outdoors', 6));
  safe(() => G.goalsUI.caption(null, `${short(id)} falls in beside you. Tap them to talk as you go.`, 3600));
  const ch = comp.char(id); if (ch && !ch._relTalk) { ch._relTalk = 1; G.scene.interactables.push({ ent: ch, x: ch.x, y: ch.y, label: 'Talk to ' + short(id), range: 2.4, h: 1.3, npc: id, visible: () => comp.has(id), use: () => G.social.talk(id, { char: ch, rel: 1 }) }); }
}
export function tick() { const s = st(), w = s.walk; if (w && w.until <= G.state.t && !HOOK.isRunning()) { delete s.walk; const ch = comp.char(w.id); if (ch) bubble(ch, fill(pick(['This is me. Thank you for the company.', 'I turn off here. Same again soon.'])), 2600); setTimeout(() => HOOK.sendHome(), 1600); safe(() => G.needs.add('outdoors', 8)); } }

/* ---------- pickers ---------- */
/** add-only hook in ui/talk.js picker(): -> true when we showed our own picker. ui = { list(title, items, onPick), doAct(id, arg), menu() } */
export function talkPicker(ses, v, ui) {
  if (v.picker !== 'date') return false; const id = ses.id, types = safe(() => HOOK.dateTypes(id), []);
  ui.list('What sort of thing?', types.map(t => ({ id: t.id, label: t.name, sub: t.sub })), type => {
    const T = types.find(t => t.id === type), go = venue => ui.list('When?', safe(() => HOOK.dateTimes(id, type, venue), []).map(x => ({ id: x.t, label: x.label, sub: x.sub })), t => ui.doAct(v.id, { type, venue, t }));
    if (T.venues.length > 1) ui.list('Where?', T.venues.map(x => ({ id: x.key, label: x.name })), go); else go(T.venues[0] ? T.venues[0].key : null);
  });
  return true;
}

/* ---------- meters ---------- */
const bar = (pct, cls) => el('div.talk-meter.' + cls, null, el('i', { style: { width: Math.max(2, Math.min(100, pct)) + '%' } }));
/** add-only hook in ui/talk.js setRel(): the romance meter under the friendship meter (hidden until Something There); "Confidant" on the friendship label */
export function talkMeter(ses, head) {
  if (!head || ses.light) return; const id = ses.id; let row = head.querySelector('.talk-rom');
  if (friendStage(id) === 'confidant') { const t = head.querySelector('.talk-tier'); if (t && !ses.tier().family) t.textContent = 'Confidant'; }
  if (!isRom(id) || stage(id) === 'none') { if (row) row.remove(); return; }
  if (!row) { row = el('div.talk-rel.talk-rom'); head.append(row); head.classList.add('has-rom'); }
  row.replaceChildren(el('span.talk-tier', { 'data-t': 'rom', text: B.stageLabel(id) }), bar(warmth(id), 'rom'));
}
/** add-only hook in ui/phone_messages.js personView(): both meters, what they left you, the question you can ask, their page */
export function personCard(id, b, ctx) {
  const c = B.castOf(id); if (!c) return; const s = st(), fs = friendStage(id), kids = ['pip', 'milo'].includes(id) ? 'kids' : id, arc = safe(() => G.rel.arc(kids), null), fam = safe(() => G.social.isFamily(id), false);
  const card = el('div.ph-card.rel-card');
  card.append(el('div.rel-m', null, el('span', { text: fam ? 'Family' : 'Friendship' }), el('b', { text: fam && fs !== 'confidant' ? B.FRIEND_LABEL[fs] === 'Stranger' ? 'Family' : B.FRIEND_LABEL[fs] : B.FRIEND_LABEL[fs] }), el('div.rel-bar', null, el('i', { style: { width: Math.round(fr(id)) + '%' } }), ...[15, 40, 75].map(x => el('u', { style: { left: x + '%' } })))));
  if (isRom(id) && stage(id) !== 'none') card.append(el('div.rel-m.rom', null, el('span', { text: 'Romance' }), el('b', { text: B.stageLabel(id) }), el('div.rel-bar.rom', null, el('i', { style: { width: Math.round(warmth(id)) + '%' } }), ...[12, 35, 55, 85].map(x => el('u', { style: { left: x + '%' } })))));
  if (arc && arc.scenes.some(q => q.seen) && !isRom(id)) card.append(el('small.rel-arc', { text: `${arc.title}: ${arc.scenes.filter(q => q.seen).length} evening${arc.scenes.filter(q => q.seen).length === 1 ? '' : 's'} so far` }));
  const th = s.threads[id] && HOOK.SC[s.threads[id]]; if (th && th.ask) card.append(el('small.rel-ask', { text: 'Next time, you could ask: "' + th.ask[0] + '"' }));
  if (frr(id).keys) card.append(el('small.rel-arc', { text: 'You hold each other\'s spare keys.' }));
  const keeps = s.keeps.map(k => B.ITEMS[k]).filter(it => it && (it.from === id || (it.from === 'pip' && id === 'milo')));
  for (const it of keeps) card.append(el('div.rel-keep', null, el('b', { text: it.name }), el('small', { text: it.desc })));
  const pages = Object.keys(s.pages).filter(k => PAGES[k] && (PAGES[k].from === id || (kids === 'kids' && PAGES[k].from === 'pip')));
  for (const k of pages) card.append(el('button.ph-btn.wide', { 'data-relpage': k, onclick: () => { ctx.close(); setTimeout(() => HOOK.openPage(k), 350); } }, el('span', { text: 'Their page: ' + PAGES[k].title })));
  b.append(card);
}
export function init() {
  HOOK.verbsFor = verbsFor; HOOK.walkWith = walkWith;
  G.on('social:talk', (id, vid, ok) => {
    if (isRom(id) && st().ro[id]) st().ro[id].lastSeen = today();
    if (vid !== 'flirt' || !ok || !isRom(id)) return; const r = ror(id), cs = canStart(id);
    if (stage(id) !== 'none') { addWarmth(id, WARMTH.flirtOk, 'verb'); return; }
    if (cs === 'boss') { if (!r.bossSaid) { r.bossSaid = 1; const ch = safe(() => G.social.char(id), null); if (ch) setTimeout(() => bubble(ch, fill(PEOPLE[id].bossLine), 4200), 1200); } return; }
    if (cs !== true) return; r.flirts = (r.flirts || 0) + 1; if (r.flirts >= 2 && fr(id) >= 15) { openTrack(id, 'flirt'); mood('rel_butterflies'); }
  });
  G.on('social:gift', (id, item, kind) => { if (kind === 'loved' && isRom(id)) addWarmth(id, WARMTH.giftLoved, 'gift'); });
  G.on('job:hired', () => { const sm = st().small; (sm.ev || (sm.ev = {})).hired = today(); });
}
export { ITEM_BY_ID, RECIPE_BY_ID, toast };
