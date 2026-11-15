// Relationship life (helper of sim/rel.js): what the romance track changes in the world (rel_romance.js MILESTONES, LIVEIN, WEDDING, PLAYER_KIND).
//   milestone(scene)     a romance scene ended: first date > Dating, heart scenes, "Together" (the others you were dating get a kind closing conversation,
//                        in person, with you choosing the words), Partner, the key, moving in, the proposal > Engaged.
//   endIt(id, how)       letting down / breaking up: a scene the player starts, three honest wordings, their own answer; then the track closes, friendship
//                        drops 8 (never below Friend), ten quiet days, and they are a friend. Nobody leaves town.
//   LIVING TOGETHER      the partner is at YOUR home whenever their own routine says "home" (they leave and come back through the door as the social system
//                        walks people); a morning line; they sit and eat when you cook two servings in the evening (+warmth); on their `cooksOn` days a
//                        dish of theirs waits in the kitchen; one kind of chore (the home stays cleaner); the bed (a line once for a single bed, a "bigger
//                        bed" Idea; a line once for a tiny home); the Social need drifts up of an evening; 40% of rent and utilities paid in through
//                        G.money.add on every bill day ("From <name>: their share"); "Stay in tonight". They never nag.
//   THE WEDDING          a card in My Day after the proposal ("The wedding: whenever you two are ready"): where (six venues), when, who stands up with
//                        you, and afterwards; then the ceremony at the place, with the family and your friends standing round, the partner's own vows,
//                        your choice of three, the rings, the reception lines. Rain does not postpone anything.
//   pages / keepsakes    the order slips people hand you (rel_arcs.js PAGES) open as a little book; keepsakes are listed on the person's card in Messages.
//   The two optional favours (ENGINE_FLAGS): Haru's master stock (three days) and Birdie's pond flock (four of seven days), one tap at the spot.
import { G } from '../core/game.js';
import { el, root, toast, bubble, choose } from '../ui/kit.js';
import { UI } from '../ui/chapters_ui.js';
import { ROOMS } from '../scenes/interior.js';
import { HOME_BY_ID } from '../data/homes.js';
import { RECIPE_BY_ID } from '../data/items.js';
import { HEARTS, LIVEIN, WEDDING, PLAYER_KIND, ANNIVERSARY } from '../story/rel_romance.js';
import { GOODNIGHT } from '../story/rel_dates.js';
import { WITH_PARTNER } from '../story/rel_small.js';
import { comp } from './_chapters_cast.js';
import * as B from './_rel_base.js';
import { st, safe, sleep, today, DAY, HOOK, fill, short, who, dest, at, stage, stageIdx, setStage, addWarmth, addFr, fr, ror, isRom, queueText, mood, PEOPLE, PAGES, partner, dating, WDL, hhmm, castOf, familyTexts, setFlag, flags } from './_rel_base.js';

const say = (w, text) => ({ do: 'say', who: w, text });
const pick = a => (a && a.length ? a[Math.floor(Math.random() * a.length)] : null);
const homeRoom = () => safe(() => G.housing.current().roomId, null);
const isHome = () => !!safe(() => G.housing.isHome(), false);
const pchar = id => safe(() => G.social.char(id), null);

/* ---------- milestones ---------- */
export function milestone(sc) {
  const id = sc.person, r = ror(id), s = st();
  switch (sc.key) {
    case 'fd': if (!r.dates) r.dates = 1; r.firstDateDay = today(); r.lastDate = today(); r.types.first = 1; setStage(id, 'dating'); queueText({ from: id, text: GOODNIGHT[id].lovely, after: 1.5, force: true }); mood('rel_butterflies'); G.emit('rel:date', id, 'first', 'lovely'); break;
    case 'meet': setFlag('met:' + id + ':noticed'); break;
    case 'h1': r.hearts[0] = 1; break; case 'h2': r.hearts[1] = 1; break; case 'h3': r.hearts[2] = 1; break;
    case 'steady': setStage(id, 'exclusive'); for (const o of dating()) if (o !== id) { ror(o).letdown = 1; safe(() => G.messages.sendMine(o, 'Can we talk? Nothing bad. Well. A little bad.')); } if (!s.app.paused) s.app.askPause = 1; break;
    case 'partner': setStage(id, 'partner'); break;
    case 'keys': r.keys = today(); setFlag('keys:' + id); break;
    case 'movein': moveIn(id); break;
    case 'proposal': setStage(id, 'engaged'); s.wedding = { id, venue: null, t: null, stand: null, reception: null, appt: null, pin: null }; weddingPin(); break;
    default: break;
  }
}

/* ---------- kind endings ---------- */
export async function endIt(id, how, o) {
  if (!isRom(id) || stage(id) === 'none' || HOOK.isRunning()) return false; const H = HEARTS[id], kind = how === 'breakup' || stageIdx(id) >= 3 ? 'breakup' : 'letdown';
  if (kind === 'breakup' || (o && o.ask)) { const sure = await choose(fill(PLAYER_KIND.sure, { partner: short(id) }), [{ label: 'Yes. Say it kindly.', value: 1 }, { label: 'No. Not today.', value: 0 }]); if (!sure) return false; }
  HOOK.withUs([id]);
  const steps = [say('narrator', kind === 'breakup' ? 'You ask if the two of you can talk. They put down what they are holding.' : 'There is no good moment for this. You pick this one, and say it to their face.'),
    { do: 'choice', id: 'kind_' + kind + '_' + id, options: PLAYER_KIND[kind].map(o => ({ id: o.id, text: o.text, reply: H.kind[kind] })) }];
  const r = await HOOK.runOps('end:' + id, HOOK.compile(steps), { person: id }); HOOK.sendHome(); if (r !== 'done') return false;
  const R = ror(id), s = st(); if (s.live && s.live.id === id) moveOut(id, true); if (s.wedding && s.wedding.id === id) { if (s.wedding.appt) safe(() => G.planner.remove(s.wedding.appt)); if (s.wedding.pin) safe(() => G.planner.remove(s.wedding.pin)); s.wedding = null; }
  for (const k in s.dates) if (s.dates[k].id === id && !s.dates[k].done) { safe(() => G.planner.remove(k)); delete s.dates[k]; }
  for (const k in s.off) if (HOOK.SC[k] && HOOK.SC[k].arc === 'h:' + id && !s.off[k].done) { if (s.off[k].pin) safe(() => G.planner.remove(s.off[k].pin)); delete s.off[k]; }
  R.stage = 'none'; R.closed = today(); R.quiet = today() + 10; R.flirts = 0; delete R.letdown; G.emit('rel:stage', id, 'none', kind);
  addFr(id, -Math.max(0, Math.min(8, fr(id) - 40))); mood('rel_quiet'); G.emit('rel:ended', id, kind); return true;
}
/** through G.rel.intercept: somebody you were dating when you chose "Together" with another person hears it from you, in person */
export function intercept(id) { const r = st().ro[id]; if (r && r.letdown && stage(id) !== 'none' && stageIdx(id) < 3) { delete r.letdown; endIt(id, 'letdown'); return true; } return false; }

/* ---------- living together ---------- */
const L = () => st().live;
export function moveIn(id, quiet) {
  const s = st(); if (!isRom(id) || stageIdx(id) < 4 && !quiet) return false; if (s.live && s.live.id === id) return true; if (s.live) moveOut(s.live.id, true);
  if (stageIdx(id) < 4) setStage(id, 'partner', true);
  s.live = { id, since: today(), morning: -1, evening: -1, meal: -1, chore: today(), waiting: -1, night: -1 }; ror(id).lives = 1; setFlag('lives:together'); mood('rel_home');
  const P = LIVEIN.people[id]; UI.toastGold(`${short(id)} has moved in. With them: ${P.brings.join('; ')}.`, 9000); G.emit('rel:movein', id); safe(homeTick); return true;
}
export function moveOut(id, quiet) {
  const s = st(); if (!s.live || s.live.id !== id) return false; s.live = null; ror(id).lives = 0; delete flags()['lives:together']; safe(() => G.social.place(id));
  if (!quiet) toast(`${short(id)} has moved back to their own place. Their things went with them.`, 'info', 4200); G.emit('rel:moveout', id); return true;
}
const sleeping = (id, h) => { const sl = LIVEIN.people[id].sleep; return sl[0] > sl[1] ? h >= sl[0] || h < sl[1] : h >= sl[0] && h < sl[1]; };
/** every few game minutes: where the partner is. At home (yours) whenever their own routine has them at home or nowhere; else the social system places them */
function homeTick() {
  const l = L(), hr = homeRoom(); if (!l || !hr) return; const id = l.id, b = safe(() => G.social.schedule(id), null), h = G.now().hf;
  const away = b && b.place && b.place !== 'home' && !sleeping(id, h);
  if (st().dates && Object.values(st().dates).some(d => d.id === id && !d.done && G.state.t >= d.t - 30)) return;
  if (comp.has(id)) return;
  if (away) { if (l.at) { l.at = 0; safe(() => G.social.place(id)); } return; }
  if (!l.at || G.state.t - l.at > 40) { l.at = G.state.t; safe(() => G.social.place(id, hr, { until: G.state.t + 70, anim: sleeping(id, h) ? 'stand' : h >= 17 && h < 22 ? 'sit' : 'stand' })); }
}
function bedOf(sc) { return safe(() => (sc.fixtures || []).find(f => f.tags.includes('bed')), null); }
function lineNow(pool, id) { const stp = pool[(today() + pool.length) % pool.length]; if (!stp) return; const c = pchar(id); if (stp.who !== 'narrator' && c) bubble(c, fill(stp.text), 4200 + stp.text.length * 30); else safe(() => G.goalsUI.caption(stp.who === 'narrator' ? null : short(id), fill(stp.text), 6500)); G.emit('rel:small', 'livein', id, stp.text); }
/** once a second while you are at home with a live-in partner */
function homeLife() {
  const l = L(); if (!l || !isHome() || HOOK.busy()) return; const id = l.id, H = HEARTS[id].livein, P = LIVEIN.people[id], n = G.now(), d = today(), c = pchar(id), sc = G.scene;
  /* asleep: in your bed */
  if (c && sleeping(id, n.hf)) { const bed = bedOf(sc), seat = bed && bed.seats && (bed.seats.filter(q => q && q.lie)[1] || bed.seats.find(q => q && q.lie)); if (seat && c.pose !== 'sleep') { c.stop && c.stop(); c.x = seat.x + (bed.seats.filter(q => q && q.lie).length > 1 ? 0 : .35); c.y = seat.y; c.zoff = seat.z || .4; c.dir = seat.dir === undefined ? 1 : seat.dir; c.pose = 'sleep'; c.poseOpts = null; } }
  else if (c && c.pose === 'sleep') { c.pose = null; c.zoff = 0; }
  /* the bed and the size of the place: said once, never a complaint */
  if (!l.bedSaid && n.hf >= 21) { const bed = bedOf(sc), single = bed && bed.seats && bed.seats.filter(q => q && q.lie).length < 2; l.bedSaid = 1; if (single) { safe(() => G.goalsUI.caption(null, LIVEIN.singleBed[0].text, 8000)); safe(() => G.planner.suggest({ title: 'A bigger bed', t: G.state.t + 600, dur: 30, kind: 'personal', data: { blurb: 'For two. No hurry.' } })); } }
  if (!l.tinySaid && safe(() => HOME_BY_ID[G.housing.current().id].sizeClass, '') === 'nook') { l.tinySaid = 1; safe(() => G.goalsUI.caption(null, LIVEIN.tiny[0].text, 7000)); }
  if (l.morning !== d && n.hf >= 6 && n.hf < 10) { l.morning = d; lineNow(H.morning, id); safe(() => G.needs.add('comfort', 4)); return; }
  /* their turn to cook: a dish of theirs is waiting when you come in of an evening */
  if (l.waiting !== d && n.hf >= 17 && n.hf < 22 && P.cooksOn.includes(n.weekday)) { l.waiting = d; const rid = (PEOPLE[id].likes.recipes || []).find(x => RECIPE_BY_ID[x]), it = 'meal_' + rid;
    if (rid && safe(() => G.inv.fridge.add(it, 2, { silent: true }), false)) { safe(() => G.goalsUI.caption(null, `${short(id)} has cooked: ${RECIPE_BY_ID[rid].name}, two plates, keeping warm in the kitchen.`, 6500)); l.meal = d; addWarmth(id, 1, 'scene'); } return; }
  if (l.evening !== d && n.hf >= 18 && n.hf < 23 && c && !sleeping(id, n.hf)) { l.evening = d; lineNow(H.evening, id); return; }
  if (d - l.chore >= 2 && c && n.hf >= 9 && n.hf < 21) { l.chore = d; lineNow(H.chores, id); safe(() => G.supplies.addClean(P.chore === 'tidy' ? 14 : 9)); return; }
}
function onCooked(rid, servings) {
  const l = L(); if (!l || !isHome() || l.meal === today()) return; const id = l.id, n = G.now(), c = pchar(id); if (!c || n.hf < 17 || n.hf > 21.5 || (servings || 0) < 2) return;
  l.meal = today(); const liked = (PEOPLE[id].likes.recipes || []).includes(rid); addWarmth(id, liked ? 3 : 1, 'scene'); c.pose = 'eat'; setTimeout(() => { if (c.pose === 'eat') c.pose = null; }, 9000);
  bubble(c, liked ? 'You made this. For us. Sit down, I am not waiting.' : 'That smells right. Two plates. I will get the forks.', 4200); safe(() => { G.needs.add('social', 18); G.inv.fridge.remove('meal_' + rid, 1); });
}
function onBills(b) {
  const l = L(); if (!l || !b) return; const items = (b.items || []).filter(i => /rent|utilit|upkeep|power|water|internet|heat/i.test((i.id || '') + ' ' + (i.label || ''))), sum = items.reduce((a, i) => a + (i.amount || 0), 0), share = Math.round(sum * .4 * 4) / 4;
  if (share > 0) { safe(() => G.money.add(share, `From ${short(l.id)}: their share`)); toast(`${short(l.id)} paid their share of the rent and bills: ${G.money.fmt(share)}.`, 'money', 4200); }
}
/** "Stay in tonight": an evening together, by what is in the house */
export async function stayIn(id) {
  const tags = safe(() => (G.scene.fixtures || []).flatMap(f => f.tags), []), how = tags.includes('tv') ? ['Watching something, badly, together', 'sit'] : tags.includes('stereo') || tags.includes('record') ? ['Records, side two', 'sit'] : tags.includes('bookshelf') ? ['Two books, one sofa', 'read'] : ['An evening in', 'sit'];
  const H = HEARTS[id].livein; await new Promise(res => G.startActivity({ label: how[0], anim: how[1], minutes: 75, rate: 22, done: () => res(true), cancel: () => res(false) }));
  safe(() => { G.needs.add('fun', 22); G.needs.add('social', 30); G.needs.add('comfort', 18); }); addWarmth(id, B.WARMTH.stayIn, 'verb'); lineNow(H.evening, id); return true;
}

/* ---------- the wedding ---------- */
const roomLike = (re, fb) => { for (const [k, r] of ROOMS.entries()) if (re.test(k) || re.test(String(r.name || ''))) return k; return fb; };
const VROOM = { cityhall: () => roomLike(/wedding/i, 'cityhall'), conservatory: () => roomLike(/conservatory.*palm|palm house/i, 'conservatory'), lighthouse: () => roomLike(/lighthouse.*(gallery|lamp|top)/i, 'lighthouse'), ballroom: () => roomLike(/ballroom/i, 'hotel') };
export const venues = () => WEDDING.venues.filter(v => v.id !== 'lookout' || safe(() => G.chapters.done('ch15'), false) || !G.chapters);
function venueDest(v) { const rid = VROOM[v.id] && VROOM[v.id](); const d = rid && ROOMS.has(rid) ? dest(rid, null) : dest(v.place, null); return d ? Object.assign({}, d, { name: v.name }) : null; }
export function slots(v) { const out = [], d0 = today() + 2; for (let d = d0; d < d0 + 16 && out.length < 6; d++) if (v.when.days.includes(d % 7)) for (const h of v.when.hours) { out.push({ t: d * DAY + h * 60, label: `${WDL[d % 7]}${d - today() > 6 ? ' week' : ''}, ${hhmm(h)}` }); if (out.length >= 6) break; } return out; }
export const standers = () => safe(() => G.social.known(), []).filter(id => castOf(id) && (castOf(id).age || 30) >= 14 && id !== partner() && (safe(() => G.social.isFamily(id), false) || fr(id) >= 75) && id !== 'pip' && id !== 'milo');
function weddingPin() { const w = st().wedding; if (!w || w.t || w.pin && safe(() => G.planner.pins().some(p => p.id === w.pin), false)) return; w.pin = safe(() => G.planner.suggest({ title: 'The wedding: whenever you two are ready', t: G.state.t + 30, dur: 30, kind: 'story', data: { relWedding: 1, blurb: 'Where, when, who stands up with you, and afterwards.' } }), null); }
/** set (part of) the plan. o = { venue, t, stand, reception }; with venue + t it goes on My Day */
export function weddingPlan(o = {}) {
  const w = st().wedding; if (!w) return null; for (const k of ['venue', 't', 'stand', 'reception']) if (o[k] !== undefined) w[k] = o[k];
  const v = WEDDING.venues.find(x => x.id === w.venue);
  if (v && w.t) { const d = venueDest(v); if (w.appt) safe(() => G.planner.remove(w.appt)); w.appt = safe(() => G.planner.add({ title: `The wedding: ${v.name}`, placeId: d && d.placeId, t: w.t, dur: 120, kind: 'story', chosen: true, remind: 60, data: Object.assign({ relWedding: 1, blurb: `You and ${short(w.id)}` }, d && d.pos ? { pos: d.pos } : null) }), null); if (w.pin) { safe(() => G.planner.remove(w.pin)); w.pin = null; }
    if (!w.told) { w.told = 1; familyTexts({ jules: 'It is in the diary. In PEN. Pip has laminated the date.', nana: 'I have the date. I shall make the cake. Do not argue.', dez: 'Date saved. Bike escort confirmed. It is happening.' }, {}, 2); } }
  return w;
}
export function weddingSheet() {
  const w = st().wedding; if (!w) return; G.modal++; let open = true; const close = () => { if (!open) return; open = false; wrap.remove(); G.modal--; };
  const box = el('div.relw', { role: 'dialog' }), wrap = el('div.relp-wrap.relw-wrap', null, box), P = PEOPLE[w.id];
  const draw = () => {
    const V = venues(), v = V.find(x => x.id === w.venue), sl = v ? slots(v) : [], st2 = standers(), recs = WEDDING.receptions.filter(r => !r.needs || B.test(r.needs));
    const sec = (title, items, cur, set, note) => el('div.relw-sec', null, el('small', { text: title }), el('div.relw-opts', null, ...items.map(it => el('button.relw-o' + (cur === it.id ? '.on' : ''), { 'data-relw': title.split(' ')[0].toLowerCase() + ':' + it.id, onclick: () => { set(it.id); draw(); } }, it.label))), note ? el('p', { text: note }) : null);
    box.replaceChildren(...[el('div.relw-h', null, el('small', { text: 'The wedding' }), el('b', { text: `You and ${short(w.id)}` }), el('p', { text: 'Whenever you two are ready. Nothing here has a deadline, and all of it can be changed until the day.' })),
      sec('Where?', V.map(x => ({ id: x.id, label: x.name })), w.venue, id => { w.venue = id; w.t = null; }, v ? v.look + ((P.likes.places || []).some(p => new RegExp(v.place.replace(/^@/, ''), 'i').test(p)) ? ' ' + fill(WEDDING.venueLiked[0].text) : '') + (v.id === 'cityhall' ? ' The licence is $40 at the door.' : '') : ''),
      v ? sec('When?', sl.map(x => ({ id: x.t, label: x.label })), w.t, t => { w.t = t; }, '') : null,
      sec('Who stands up with you?', st2.map(id => ({ id, label: short(id) })), w.stand, id => { w.stand = id; }, w.stand ? '"' + fill(WEDDING.stand[w.stand] || WEDDING.stand.any) + '"' : st2.length ? '' : 'Family, or a Close Friend. It can also be nobody: the Clerk has done it both ways.'),
      sec('And afterwards?', recs.map(r => ({ id: r.id, label: r.name })), w.reception, id => { w.reception = id; }, (recs.find(r => r.id === w.reception) || {}).line || ''),
      el('div.relp-btns', null, el('button.relp-go', { 'data-relw': 'set', disabled: !(w.venue && w.t) || undefined, text: w.appt ? 'Change the day' : 'Put it on our day', onclick: () => { weddingPlan({}); close(); UI.toastGold(`The wedding is on your day: ${(venues().find(x => x.id === w.venue) || {}).name}.`, 6000); } }), el('button.relp-no', { 'data-relw': 'later', text: 'Not yet', onclick: close }))].filter(Boolean));
  };
  draw(); root().append(wrap);
}
let wedOn = false;
export async function weddingBegin() {
  const w = st().wedding; if (!w || wedOn || HOOK.isRunning()) return 'busy'; const id = w.id, v = WEDDING.venues.find(x => x.id === w.venue) || WEDDING.venues[0], C = WEDDING.ceremony, R = WEDDING.reception, rec = WEDDING.receptions.find(r => r.id === w.reception) || WEDDING.receptions[3];
  const outdoor = ['bandstand', 'lookout'].includes(v.id), wet = ['rain', 'storm', 'snow'].includes(B.wx()), H = HEARTS[id];
  const guests = [id].concat(['nana', 'jules', 'theo', 'pip', 'milo', 'dez', 'kit'].filter(g => safe(() => G.social.known().includes(g), false)), safe(() => G.chapters.done('ch15'), false) ? ['dad'] : [], w.stand && !['nana', 'jules', 'theo', 'dez', 'kit', 'dad'].includes(w.stand) ? [w.stand] : [],
    safe(() => G.social.known(), []).filter(g => !safe(() => G.social.isFamily(g), false) && g !== id && fr(g) >= 40 && castOf(g) && castOf(g).age >= 14).slice(0, 5), castOf(v.officiant) ? [v.officiant] : []).filter((g, i, a) => a.indexOf(g) === i);
  const steps = [].concat(C.gather, w.stand ? [say(w.stand, WEDDING.stand[w.stand] || 'Of course I will. I have the rings. I have checked four times.')] : [], v.words, (PEOPLE[id].likes.places || []).some(p => new RegExp(v.place.replace(/^@/, ''), 'i').test(p)) ? WEDDING.venueLiked : [], outdoor && wet ? C.rain : [], C.walk,
    H.vows.map(t => say(id, t)), C.playerVows, C.rings, C.kiss, C.after, [say('narrator', rec.line)], R.toast, R.dance, R.end);
  wedOn = true;
  try {
    if (v.id === 'cityhall') safe(() => G.money.pay(40, 'The licence, City Hall', { force: true, silent: true }));
    for (const g of guests) safe(() => G.social.place(g)); comp.set(guests); HOOK.withUs([], null); comp.follow(false); const look = who(id, 'date'), pc = comp.char(id); if (pc && look.spec) pc.spec = look.spec;
    const tk = { partner: short(id), place: v.name }, out = await HOOK.runOps('wedding', HOOK.compile(steps), { person: id, tok: tk, look: 'date' });
    if (out !== 'done') return out;
    setStage(id, 'married'); const r = ror(id); r.weddingDay = today(); w.done = today(); if (w.appt) safe(() => G.planner.done(w.appt)); mood('rel_glow'); safe(() => { G.needs.add('fun', 40); G.needs.add('social', 60); G.needs.add('hunger', 40); });
    st().wedding = null; if (!(st().live && st().live.id === id)) moveIn(id, true); st().arcs['h:' + id].lastDay = today();
    await UI.endCard({ kicker: 'Married', title: `You and ${short(id)}`, lines: ['A ring, a little cold, and then not', rec.name, 'Confetti in your shoe. Leave it.'], next: 'Nothing is taken away: dates, evenings in, and two anniversaries a year.' });
    return 'done';
  } finally { wedOn = false; comp.follow(true); comp.clear(); }
}
function weddingTick() { const w = st().wedding; if (!w || !w.t || wedOn || HOOK.busy()) return; const t = G.state.t; if (t < w.t - 40 || t > w.t + 240) return; const v = WEDDING.venues.find(x => x.id === w.venue), d = v && venueDest(v); if (!d || !at(d)) return; if (w.snooze && w.snooze > t) return;
  w.snooze = t + 60; const pr = UI.card({ kicker: 'Today', title: 'The wedding', hook: `${v.name}. Everyone is finding a chair. ${short(w.id)} is somewhere behind a door, being told to breathe.`, who: [who(w.id, 'date')].filter(x => x.spec).map(x => ({ name: x.short, spec: x.spec })), meta: 'About fifteen minutes', ready: 'When you are ready.', canBegin: true }); HOOK.rose(); pr.then(r => { if (r === 'begin') weddingBegin(); }); }
export async function debugWedding(venue) {
  const s = st(); let id = partner(); if (!id) { id = 'haru'; setStage(id, 'partner', true); ror(id).hearts = [1, 1, 1]; } if (stage(id) !== 'engaged') setStage(id, 'engaged', true); if (!s.wedding) s.wedding = { id, venue: null, t: null, stand: null, reception: null, appt: null, pin: null };
  const v = WEDDING.venues.find(x => x.id === venue) || (venue === undefined && s.wedding.venue ? WEDDING.venues.find(x => x.id === s.wedding.venue) : WEDDING.venues[0]); weddingPlan({ venue: v.id, t: G.state.t + 20, stand: s.wedding.stand || standers()[0] || null, reception: s.wedding.reception || 'home' });
  const d = venueDest(v); if (d.room) await G.go('int:' + d.room); else await G.go('city', { x: d.x - 2, y: d.y + 2.5 }); return s.wedding;
}

/* ---------- pages ---------- */
export const pages = id => Object.keys(st().pages).filter(k => PAGES[k] && (!id || PAGES[k].from === id)).map(k => Object.assign({ id: k, day: st().pages[k] }, PAGES[k]));
function openPage(k) { const all = pages(); if (!all.length) return null; return UI.book({ title: 'Pages for the book', pages: all.map((p, i) => ({ id: p.id, n: i + 1, title: p.title, text: p.lines, by: 'In ' + short(p.from) + "'s hand", state: 'written' })), at: Math.max(0, all.findIndex(p => p.id === k)) }); }

/* ---------- the two optional favours ---------- */
function favours() {
  const fv = () => { const s = st(); return s.fav || (s.fav = { broth: [], flock: [] }); }, mk = (scene, x, y, label, vis, use) => safe(() => G.addInteractable({ scene, x, y, label, range: 2.2, h: 1.2, visible: vis, use }));
  const pot = () => HOOK.seen('haru.h2') && !HOOK.seen('haru.h3') && !flags().haru_fed_broth && !fv().broth.includes(today());
  G.on('scene', () => { const sc = G.scene; if (!sc || sc._relFav) return;
    if (sc.id === 'int:ramen') { sc._relFav = 1; const fx = safe(() => sc.fixtures.find(f => f.staff), null), p = fx ? fx.staff : { x: 3, y: 3 }; sc.interactables.push({ x: p.x, y: p.y, label: 'Feed the master stock', range: 2.4, h: 1.2, visible: pot, use: () => { const f = fv(); f.broth.push(today()); toast(f.broth.length >= 3 ? 'Three days fed. The stock is as he left it. He will know.' : 'A ladle of water, a hand of bones. You do not stir. He said not to stir.', 'good', 4200); if (f.broth.length >= 3) setFlag('haru_fed_broth'); } }); } });
  const pond = safe(() => dest('spot:pond', 'birdie'), null), flock = () => HOOK.seen('birdie.rota') && !HOOK.seen('birdie.home') && !flags().birdie_fed && !fv().flock.includes(today()) && G.now().hf >= 10 && G.now().hf < 13;
  if (pond) mk('city', pond.x + 1.5, pond.y, "Feed Birdie's flock", flock, () => { const f = fv(); f.flock.push(today()); toast(f.flock.length >= 4 ? 'Four days. Gerald has stopped looking past you for her.' : 'Eleven sharp. Seeds, not bread. Gerald inspects you and finds you adequate.', 'good', 4200); if (f.flock.length >= 4) setFlag('birdie_fed'); });
}

/** the player proposes (only when the track says yes: warmth 85, 28 days as partners, the third heart scene) */
export function propose(id) { const r = st().ro[id]; if (!r || stage(id) !== 'partner' || r.pts < 85 || !r.hearts[2] || today() - (r.partnerDay || 0) < 28) return false; return HOOK.start(id + '.proposal'); }
export function tick() { safe(homeLife); safe(weddingTick); }
export function hourly() { safe(homeTick); const l = L(); if (l && isHome() && G.now().hf >= 17 && pchar(l.id)) safe(() => G.needs.add('social', 6)); }
export function daily() {
  const s = st(), d = today(); safe(weddingPin);
  for (const id in s.ro) { const r = s.ro[id]; if (r.weddingDay !== null && r.weddingDay !== undefined && d > r.weddingDay && (d - r.weddingDay) % 56 === 0) { familyTexts(ANNIVERSARY.texts, { partner: short(id) }, 2); delete s.seen[id + '.m2']; delete s.off[id + '.m2']; }
    if (r.firstDateDay !== null && r.firstDateDay !== undefined && d > r.firstDateDay && (d - r.firstDateDay) % 56 === 0 && stageIdx(id) >= 3) safe(() => G.planner.suggest({ title: `A year ago today, with ${short(id)}`, t: d * DAY + 17 * 60, dur: 60, kind: 'friend', data: { blurb: 'Where it started.' } })); }
}
export function init() {
  HOOK.endIt = endIt; HOOK.stayIn = stayIn; HOOK.openPage = openPage; HOOK.weddingSheet = weddingSheet; HOOK.grantItem = () => null; HOOK.withPartner = id => (L() && isHome() && WITH_PARTNER[id] ? fill(WITH_PARTNER[id], { partner: short(L().id) }) : null);
  G.on('cooked', (rid, n) => safe(() => onCooked(rid, n))); G.on('bills:due', b => safe(() => onBills(b)));
  G.on('minutes', (d, t) => { if (Math.floor(t / 10) !== Math.floor((t - d) / 10)) safe(homeTick); });
  G.on('scene', () => setTimeout(() => safe(homeTick), 150));
  G.on('myday:add', x => { const w = st().wedding, p = x && x.idea && x.idea.pinId; if (w && p && p === w.pin) { w.pin = null; if (x.apptId && x.apptId !== true) safe(() => G.planner.remove(x.apptId)); setTimeout(weddingSheet, 400); } });
  G.on('activity:start', id => { const l = L(); if (l && id === 'sleep' && isHome() && l.night !== today()) { l.night = today(); const H = HEARTS[l.id].livein; if (H.night) lineNow(H.night, l.id); } });
  G.on('ready', () => safe(favours));
}
export { sleep };
