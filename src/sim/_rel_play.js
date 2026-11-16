// Relationship play (helper of sim/rel.js): the adapters behind every `play` step of the rel_*.js scenes and of the date types (rel_dates.js).
// Each starts the REAL system (the skill mini-games, a venue's menu, a whole show, the cooking window, a world activity) and resolves with
//   'good' | 'ok' | 'skip' (the quiet "Not today") | 'dead' (the scene was put down meanwhile).   Nothing here can block a scene: every play has a way through.
//
//   run(step, c) -> Promise<result>     step = { kind, id, label, skip? }     c = { person, alive(), venue? (the date's venue key), together: [ids with you] }
//   prompt(label, go, canSkip) -> Promise<bool>     the small card that says what you are about to do
//   orderForTwo(venueId, c) -> Promise<{ paid, mine, theirs, treat, liked } | null>     the venue's real menu, for two
// Play ids that had no system: `minigame:fixit` is the handiness mini-game of the skill kit (it exists: G.skillplay 'fixit'); `activity:post_send` is a small
// one built here (stand in the Post Office queue, hand the parcel over: a short real activity). `activity:swim` = the swimming mini-game.
import { G } from '../core/game.js';
import { el, root, toast } from '../ui/kit.js';
import { ITEM_BY_ID, RECIPE_BY_ID } from '../data/items.js';
import { ACTIVITY_BY_ID } from '../data/activities.js';
import { safe, sleep, PEOPLE, short, who, fill } from './_rel_base.js';

const grade = r => (r && !r.quit && !r.auto && (r.score || 0) >= .5 ? 'good' : 'ok');
const fmt = n => (G.money && G.money.fmt ? G.money.fmt(n) : '$' + n);
export function act(label, anim, minutes, o = {}) { return new Promise(res => { if (G.busy) safe(() => G.endActivity(false)); G.startActivity(Object.assign({ label, anim, minutes, rate: Math.max(1.2, minutes / 3), done: () => res(true), cancel: () => res(false) }, o)); }); }
const until = async (pred, max = 600000) => { const t0 = performance.now(); while (performance.now() - t0 < max) { if (safe(pred, false)) return true; await sleep(250); } return false; };
const once = (ev, ms) => new Promise(res => { let off = null; const t = setTimeout(() => { if (off) off(); res(null); }, ms); off = G.on(ev, (...a) => { off(); clearTimeout(t); res(a); }); });

/** the card before a play: what you are about to do, a button to do it, and (always) a quiet way round it */
export function prompt(label, go, canSkip = true, sub) {
  return new Promise(res => {
    G.modal++; let open = true; const done = v => { if (!open) return; open = false; wrap.remove(); G.modal--; res(v); };
    const wrap = el('div.relp-wrap', null, el('div.relp', { role: 'dialog' }, el('small', { text: 'Together' }), el('b', { text: label }), sub ? el('p', { text: sub }) : null,
      el('div.relp-btns', null, el('button.relp-go', { 'data-relp': 'go', text: go || 'Do it', onclick: () => done(true) }), canSkip ? el('button.relp-no', { 'data-relp': 'skip', text: 'Not today', onclick: () => done(false) }) : null)));
    root().append(wrap);
  });
}
async function kit(key, c, o = {}) {
  if (!G.skillplay || !G.skillplay.demo) return 'ok';
  const pr = G.skillplay.demo(key, o.level || Math.min(3, safe(() => G.skills.level(o.skill || 'cooking'), 1)), o.opts || {});
  if (o.title) { const name = () => { const b = document.querySelector('.mg .mg-tt b'), sm = document.querySelector('.mg .mg-tt small'); if (b) b.textContent = o.title; if (sm && o.sub) sm.textContent = o.sub; return !!b; }; if (!name()) { let k = 0; const iv = setInterval(() => { if (name() || ++k > 20) clearInterval(iv); }, 50); } }
  const r = await pr; return c.alive() ? grade(r) : 'dead';
}
async function plain(def, c) { if (!G.minigame || !G.minigame.play) return 'ok'; const r = await G.minigame.play(Object.assign({ level: 1 }, def)); return c.alive() ? grade(r) : 'dead'; }

/* ---------- the menu, for two ---------- */
const FOODISH = ['meal', 'dish', 'drink', 'snack', 'ready_meal'];
export function menuOf(venueId) { return safe(() => G.shop.stock(venueId), []).filter(it => it && FOODISH.includes(it.category)).map(it => ({ id: it.id, name: it.name, cat: it.category, price: safe(() => G.shop.price(it, venueId), it.price || 5) })).slice(0, 14); }
const likedDish = (person, it) => { const L = (PEOPLE[person] || {}).likes || {}, id = String(it.id).replace(/^meal_/, ''); return (L.recipes || []).includes(id) || (L.recipes || []).some(r => (RECIPE_BY_ID[r] || {}).name === it.name); };
export function orderForTwo(venueId, c) {
  const list = menuOf(venueId), name = short(c.person), vn = safe(() => G.places.get(venueId).name, null) || 'the counter';
  if (!list.length) return Promise.resolve(null);
  return new Promise(res => {
    G.modal++; let mine = null, theirs = null, open = true; const done = v => { if (!open) return; open = false; wrap.remove(); G.modal--; res(v); };
    const box = el('div.relo', { role: 'dialog' }), wrap = el('div.relp-wrap', null, box);
    const draw = () => {
      const col = (title, cur, set, mark) => el('div.relo-col', null, el('small', { text: title }), ...list.map(it => el('button.relo-i' + (cur === it ? '.on' : ''), { 'data-relo': (mark ? 'them:' : 'me:') + it.id, onclick: () => { set(it); draw(); } }, el('span', { text: (mark && likedDish(c.person, it) ? '★ ' : '') + it.name }), el('i', { text: fmt(it.price) }))));
      const total = (mine ? mine.price : 0) + (theirs ? theirs.price : 0), half = Math.round(total * 2) / 4, ok = mine && theirs;
      box.replaceChildren(el('div.relo-h', null, el('b', { text: 'Order for two' }), el('small', { text: vn })),
        el('div.relo-cols', null, col('For you', mine, v => { mine = v; }, false), col('For ' + name, theirs, v => { theirs = v; }, true)),
        el('div.relo-f', null, el('span', { text: ok ? `${fmt(total)} together` : 'Pick one each. A star is a favourite of theirs.' }),
          el('div.relp-btns', null, el('button.relp-go', { 'data-relo': 'split', disabled: !ok || undefined, text: ok ? `Split it (${fmt(half)})` : 'Split it', onclick: () => pay(half, false) }), el('button.relp-no', { 'data-relo': 'treat', disabled: !ok || undefined, text: ok ? `My treat (${fmt(total)})` : 'My treat', onclick: () => pay(total, true) }))));
    };
    const pay = (n, treat) => { let paid = safe(() => G.money.pay(n, `${treat ? 'Treating ' + name : 'With ' + name}: ${vn}`, { silent: true }), false);
      if (!paid && !treat) { toast(`${name}: "Mine, this time. You get the next one."`, 'good', 3600); n = 0; paid = true; } else if (!paid) { const h = Math.round(n * 2) / 4; paid = safe(() => G.money.pay(h, 'With ' + name + ': ' + vn, { silent: true }), false); if (!paid) toast(`${name}: "Put that away. Mine, this time."`, 'good', 3600); treat = false; n = paid ? h : 0; }
      done({ paid: n, mine, theirs, treat, liked: likedDish(c.person, theirs) || likedDish(c.person, mine) }); };
    draw(); root().append(wrap);
  });
}
async function eatTogether(o, c, minutes = 25) {
  const d = o && o.mine && ITEM_BY_ID[o.mine.id], fx = (d && d.effects) || {}, drink = o && o.mine && o.mine.cat === 'drink';
  const seat = safe(() => (G.scene.fixtures || []).filter(f => f.tags.includes('seat') && f.seats && f.seats.some(s => s && !s.staff && !s.lie)).map(f => f.seats.find(s => s && !s.staff && !s.lie)).sort((a, b) => Math.hypot(a.x - G.player.x, a.y - G.player.y) - Math.hypot(b.x - G.player.x, b.y - G.player.y))[0], null);
  await act(drink ? 'Drinking, and talking' : 'Eating, and talking', drink ? 'drink' : 'eat', minutes, seat ? { at: { x: seat.x, y: seat.y, z: seat.z || 0, dir: seat.dir === undefined ? 1 : seat.dir } } : {});
  safe(() => { const N = G.needs; N.add('hunger', fx.hunger || (drink ? 8 : 38)); N.add('fun', 10); N.add('social', 22); if (fx.energy) N.add('energy', fx.energy); });
}

/* ---------- world activities (data/activities.js ids; the scene data uses the fixture / poi names) ---------- */
const ACT = { ferris_wheel: 'ride_ferris_wheel', fishing_spot: 'fish_pier', duck_pond: 'feed_ducks', garden_plot: 'garden', viewpoint: 'enjoy_view', bench: 'people_watch', dance: 'dance', watch_fish: 'watch_fish', smell_flowers: 'smell_flowers', contemplate_art: 'contemplate_art', library_read: 'library_read', watch_live_music: 'watch_live_music' };
const GEN = { ferris_wheel: ['One slow turn on the Bay Wheel', 'sit', 14, { fun: 22, outdoors: 8 }], fishing_spot: ['Fishing, side by side', 'stand', 30, { fun: 14, outdoors: 14, comfort: 6 }], duck_pond: ['Feeding the ducks', 'stand', 12, { fun: 12, outdoors: 10 }], garden_plot: ['Hands in the soil', 'work', 20, { outdoors: 12, fun: 8 }],
  watch_fish: ['Watching the tanks', 'stand', 20, { fun: 16, inspiration: 8 }], smell_flowers: ['Walking the glass houses', 'stand', 18, { fun: 14, inspiration: 8, comfort: 6 }], contemplate_art: ['Walking the galleries', 'stand', 20, { inspiration: 16, fun: 10 }], library_read: ['Reading, a chair apart', 'read', 25, { fun: 10, inspiration: 8 }],
  watch_live_music: ['Listening to the band', 'stand', 30, { fun: 22 }], dance: ['Dancing', 'dance', 25, { fun: 26, energy: -8 }], swim: ['A length, then another', 'stand', 20, { fun: 14, energy: -10, hygiene: 6 }], post_send: ['In the queue, then at the counter', 'stand', 8, {}], viewpoint: ['Looking at the view', 'stand', 12, { fun: 12, outdoors: 8 }] };
async function activity(id, st, c) {
  const real = ACT[id] && ACTIVITY_BY_ID[ACT[id]], g = GEN[id] || [st.label || 'Together', 'stand', 15, { fun: 10 }];
  if (id === 'swim' && G.skillplay) return kit('swim', c, { skill: 'swimming', title: 'Lane two', sub: 'A length together' });
  if (id === 'fishing_spot' && G.skillplay && safe(() => G.skillplay.games().some(x => x.key === 'fish'), false)) return kit('fish', c, { skill: 'fishing', title: 'Fishing, side by side', sub: 'It is not that sort of fishing' });
  if (real) {
    const fx = safe(() => (G.scene.fixtures || []).find(f => safe(() => G.activities.tagsFor(f, G.scene), []).includes(real.tag)), null), poi = safe(() => G.world.pois.filter(p => new RegExp(id.replace(/_/g, '.*').replace('spot', ''), 'i').test(p.id || p.type || '')).sort((a, b) => Math.hypot(a.x - G.player.x, a.y - G.player.y) - Math.hypot(b.x - G.player.x, b.y - G.player.y))[0], null);
    if ((fx || poi) && !safe(() => G.activities.blocked(real.id, { fx, poi }), 'x')) {
      const done = once('activity:done', 240000), run = safe(() => G.activities.start(real.id, { fx, poi, minutes: Math.min(g[2] + 6, (real.minutes && real.minutes.default) || 20), full: true, quiet: true, label: g[0] }), null);
      if (run) { await done; return c.alive() ? 'good' : 'dead'; }
    }
  }
  const ok = await act(g[0], g[1], g[2]); safe(() => { for (const k in g[3]) G.needs.add(k, g[3][k]); }); return !c.alive() ? 'dead' : ok ? 'good' : 'ok';
}

/* ---------- a show: two seats, the whole real show ---------- */
async function show(venue, st, c) {
  if (venue === 'arena') {
    const ev = safe(() => G.arena.events(1)[0], null), live = safe(() => G.arena.now().ph, 'none');
    if (ev && live !== 'none' && G.scene && /arena/.test(G.scene.id)) { const tk = safe(() => G.arena.ticketFor(ev), null) || safe(() => G.arena.buy(ev, (G.arena.tiers(ev)[0] || {}).id), null); if (tk) { safe(() => G.money.pay(tk.price || 0, 'A seat for ' + short(c.person), { silent: true })); safe(() => G.arena.enterBowl()); await sleep(1500); await until(() => !/arena_bowl/.test((G.scene || {}).id || '') || safe(() => G.arena.now().ph, 'none') === 'none' || !c.alive(), 900000); return c.alive() ? 'good' : 'dead'; } }
    const ok = await act('The game, from two seats high up', 'sit', 40); safe(() => G.needs.add('fun', 28)); return c.alive() ? (ok ? 'good' : 'ok') : 'dead';
  }
  if (!G.shows || !safe(() => G.shows.venues().some(v => v.id === venue), false)) { await act('Two seats, side by side', 'sit', 40); safe(() => G.needs.add('fun', 26)); return c.alive() ? 'ok' : 'dead'; }
  const sh = safe(() => { const d = Math.floor(G.state.t / 1440); return G.shows.schedule(venue, d).concat(G.shows.schedule(venue, d + 1)).find(s => s.t + 5 > G.state.t); }, null);
  if (sh && sh.price) { const two = sh.price * 2; if (!safe(() => G.money.pay(two, `Two tickets: ${sh.title}`, { silent: true }), false)) toast(`${short(c.person)}: "I have the tickets. You can get the next ones."`, 'good', 3600); else toast(`Two tickets: ${fmt(two)}.`, 'money'); }
  safe(() => G.shows.attendWith(c.person)); safe(() => c.hideWith(true));
  const end = once('show:end', 900000); const stt = await safe(() => G.shows.startNow(venue, sh ? sh.id : undefined), Promise.resolve(null));
  if (!stt) { safe(() => c.hideWith(false)); await act('Two seats, side by side', 'sit', 40); safe(() => G.needs.add('fun', 26)); return c.alive() ? 'ok' : 'dead'; }
  await end; await sleep(1200); await until(() => !safe(() => G.shows.state(), null), 60000); safe(() => c.hideWith(false)); return c.alive() ? 'good' : 'dead';
}

/* ---------- cooking: the real cooking window when there is a stove of your own; the pan game anywhere else ---------- */
async function cook(id, st, c) {
  const r = RECIPE_BY_ID[id], home = safe(() => G.housing.isHome(), false), stove = safe(() => (G.scene.fixtures || []).find(f => f.tags.includes('stove')), null);
  if (id === 'choose' && home && stove && G.cooking && G.cooking.open) {
    const L = ((PEOPLE[c.person] || {}).likes || {}).recipes || [], can = L.filter(x => RECIPE_BY_ID[x] && safe(() => G.cooking.status(x, stove).can, false));
    toast(can.length ? `${short(c.person)} would love: ${can.map(x => RECIPE_BY_ID[x].name).join(', ')}.` : L.length ? `${short(c.person)}'s favourites: ${L.filter(x => RECIPE_BY_ID[x]).map(x => RECIPE_BY_ID[x].name).join(', ')}.` : 'Anything you like.', 'info', 5200);
    let cooked = null; const off = G.on('cooked', rid => { cooked = rid; });
    safe(() => G.cooking.open(stove)); await sleep(700);
    await until(() => !!cooked || (!G.modal && !G.busy) || !c.alive(), 900000); if (cooked) await until(() => !G.modal && !G.busy, 120000); off();
    if (!c.alive()) return 'dead'; if (cooked) { c.cooked = cooked; return L.includes(cooked) ? 'good' : 'ok'; }
    return 'skip';
  }
  const name = r ? r.name : 'Supper';
  const res = await kit(safe(() => G.skillplay.gameFor('cook', { recipe: id }), 'flip'), c, { skill: 'cooking', title: name, sub: 'Two people, one stove', opts: { ctx: { recipe: id } } });   /* the dish's own game (data/cookgames.js) */ if (res !== 'dead' && r) c.cooked = id; return res;
}

/* ---------- walking together ---------- */
async function walk(id, st, c) {
  const d = safe(() => c.destOf(id === 'venue' || id === 'event' ? c.venue : id), null), P = G.player, t0 = performance.now(), x0 = P.x, y0 = P.y; let moved = 0, lx = x0, ly = y0;
  if (d && d.spot && G.scene.id === 'city' && Math.hypot(P.x - d.x, P.y - d.y) > 6) safe(() => G.navGoals.set({ room: 'city', find: { x: d.x, y: d.y }, label: 'Walk there together', near: 4, name: d.name }));
  safe(() => c.captionRel(null, 'Walk a little way. They fall in beside you.', 4200));
  /* done when you have walked some sixty steps together, reached the place, or simply after a while (nothing blocks) */
  await until(() => { moved += Math.hypot(P.x - lx, P.y - ly); lx = P.x; ly = P.y; return !c.alive() || moved > 26 || (d && d.spot && moved > 6 && Math.hypot(P.x - d.x, P.y - d.y) < 4) || performance.now() - t0 > 90000; }, 100000);
  safe(() => G.navGoals.clear()); safe(() => { G.needs.add('outdoors', 14); G.needs.add('fun', 8); G.needs.add('social', 12); });
  return c.alive() ? (moved > 6 ? 'good' : 'ok') : 'dead';
}

/* ---------- a gift: the real backpack ---------- */
async function gift(st, c) {
  const { choose } = await import('../ui/kit.js'); const opts = safe(() => G.inv.items().map(s => ({ s, d: ITEM_BY_ID[s.id] })).filter(o => o.d && ['gift', 'book', 'snack', 'drink', 'meal', 'dish'].includes(o.d.category)), []);
  if (!opts.length) { toast('Nothing in your bag to give. The thought counts; it is noted.', 'info', 3600); return 'skip'; }
  const v = await choose('Give what?', opts.map(o => ({ label: o.d.name, sub: 'x' + o.s.qty, value: o.s.id })).concat([{ label: 'Nothing today', value: null }])); if (!c.alive()) return 'dead'; if (!v) return 'skip';
  safe(() => G.inv.remove(v, 1)); const L = ((PEOPLE[c.person] || {}).likes || {}).gifts || []; G.emit('social:gift', c.person, v, L.includes(v) ? 'loved' : 'liked'); return L.includes(v) ? 'good' : 'ok';
}

const GO = { minigame: 'Play it', activity: 'Do it together', cook: 'To the stove', order: 'See the menu', show: 'Take your seats', walk: 'Walk together', gift: 'Open your bag', ui: 'Open it' };
export async function run(st, c) {
  const id = String(st.id), venue = id === 'venue' ? c.venue : id.split(':')[0];
  const go = await prompt(st.label || 'Together', GO[st.kind], true, st.sub); if (!c.alive()) return 'dead'; if (!go) return 'skip';
  try {
    if (st.kind === 'minigame') {
      if (id === 'trace') { const obs = safe(() => G.observatory.sky().observing, false) && G.scene && /observatory/.test(G.scene.id); if (obs) { /* the Observatory's own tracer when it really opens (you have to be where it lives); never wait on it blind */ const pr = safe(() => G.observatory.trace(), null); await sleep(1600); const opened = !!safe(() => G.observatory.tracer.state(), null) || G.modal > 0 || !!G.busy; if (pr && opened) { const ok = await Promise.race([pr, until(() => !safe(() => G.observatory.tracer.state(), null) && !G.modal && !G.busy, 600000).then(() => sleep(1500)).then(() => false)]); if (!c.alive()) return 'dead'; if (ok) return 'good'; return 'ok'; } } return plain({ kind: 'trace', title: "Tonight's constellation", hint: 'Star to star. Take your time. Somebody is watching your hand, not the sky.' }, c); }
      const T = { fixit: ['handiness', st.label || 'Hand over the right thing'], flip: ['cooking', st.label], write: ['writing', st.label], sketch: ['painting', st.label], song: ['music', st.label], chess: ['chess', st.label] }[id];
      if (T && safe(() => G.skillplay.games().some(x => x.key === id), id === 'flip')) return kit(id, c, { skill: T[0], title: T[1], sub: 'With ' + short(c.person) });
      return plain({ kind: 'timing', title: st.label || 'Together', hint: 'Tap when the marker is in the green.', o: { style: 'ring' } }, c);
    }
    if (st.kind === 'order') {
      const sub = id.split(':')[1], o = await orderForTwo(venue, c); if (!c.alive()) return 'dead';
      if (!o) { await act('Something to eat, and time to talk', 'eat', 25); safe(() => { G.needs.add('hunger', 35); G.needs.add('social', 20); }); return 'ok'; }
      c.order = o; toast(o.paid ? `${o.treat ? 'Your treat' : 'Split'}: ${fmt(o.paid)}.` : 'Their treat.', 'money'); await eatTogether(o, c, sub ? 18 : 25); return !c.alive() ? 'dead' : o.liked ? 'good' : 'ok';
    }
    if (st.kind === 'show') return show(venue, st, c);
    if (st.kind === 'cook') return cook(id, st, c);
    if (st.kind === 'walk') return walk(id, st, c);
    if (st.kind === 'gift') return gift(st, c);
    if (st.kind === 'activity') return activity(id, st, c);
    if (st.kind === 'ui') { safe(() => G.phone.open(id === 'dating_app' ? 'porchlight' : id === 'my_day' ? 'planner' : id === 'wardrobe' ? 'closet' : 'planner')); await sleep(500); await until(() => !safe(() => G.phone.isOpen, false), 300000); return c.alive() ? 'good' : 'dead'; }
  } catch (e) { console.warn('rel play', st.kind, id, e); }
  return c.alive() ? 'ok' : 'dead';
}
export { fill, who };
