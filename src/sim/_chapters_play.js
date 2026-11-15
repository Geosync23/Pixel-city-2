// Chapter play (helper of sim/chapters.js): the adapters behind every `play` step of src/story/chapters.js. Each one starts the REAL system
// (mini-game kit, showpiece activity, shop, phone screen, Decorate ...) and resolves with how it went:
//   'good' | 'ok'  (results.good / results.ok lines)   |   'skip' (the quiet "Not today")   |   'dead' (the Chapter was stepped out of meanwhile)
// Nothing here can block the story: every adapter has a way through when the real thing refuses (closed, cloudy, no money).
//
// run(step, c) -> Promise<result>.  c (from the engine) = { alive(), chip(info), doAt(find, label, o) -> 'done' | 'skip' | 'dead', locate(find) -> { x, y } | null,
//   caption(whoId, text, ms), sleep(ms), until(pred, maxMs?) -> bool, setFlag(id, v), n (Chapter number), kicker }
//
// ADAPTERS FOR "MY DAY" (the My Day worker replaces these two; nothing else in the story touches the Planner):
//   MYDAY.open(c)  -> Promise     today: opens the phone Planner and waits until it is closed.        Use G.myDay.open() when it exists.
//   MYDAY.add(c)   -> Promise     today: opens the Planner's "add" sheet and waits for 'appt:add' or the phone closing.   Use G.myDay.addIdea() when it exists.
import { G } from '../core/game.js';
import { el, root, toast, choose } from '../ui/kit.js';
import { FAMILIES, INTEREST } from '../data/skills_extra.js';
import { UI } from '../ui/chapters_ui.js';
import { photo1985, photo1988 } from '../art/story/chapter_art.js';
import { OPEN, CAST as UCAST } from '../story/university.js';

const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const grade = r => (r && !r.quit && !r.auto && (r.score || 0) >= .5 ? 'good' : 'ok');
const once = (ev, ms) => new Promise(res => { let off = null; const t = ms ? setTimeout(() => { if (off) off(); res(null); }, ms) : 0; off = G.on(ev, (...a) => { off(); clearTimeout(t); res(a); }); });

/** a short real activity (the clock runs, the player animates); resolves true when it finished */
function act(label, anim, minutes, o = {}) {
  return new Promise(res => { if (G.busy) G.endActivity(false); G.startActivity(Object.assign({ label, anim, minutes, rate: Math.max(1.2, minutes / 3.2), done: () => res(true), cancel: () => res(false) }, o)); });
}
/** a mini-game from the skill kit, by key (flip, hoops, chess, sketch, pour, write ...) */
async function kit(key, c, o = {}) {
  if (!G.skillplay || !G.skillplay.demo) return 'ok';
  const pr = G.skillplay.demo(key, o.level || Math.min(3, safe(() => G.skills.level(o.skill || 'cooking'), 1)), o.opts || {});
  /* the kit names its games after the skill ("Mix: Blue Heron", "Writing: haiku"): in a Chapter the sheet says what you are really doing */
  if (o.title) { const name = () => { const b = document.querySelector('.mg .mg-tt b'), sm = document.querySelector('.mg .mg-tt small'); if (b) b.textContent = o.title; if (sm && o.sub) sm.textContent = o.sub; const h = document.querySelector('.mg .mg-hint'); if (h && o.hint) h.textContent = o.hint; return !!b; }; if (!name()) { let k = 0; const iv = setInterval(() => { if (name() || ++k > 20) clearInterval(iv); }, 50); } }
  const r = await pr;
  return c.alive() ? grade(r) : 'dead';
}
/** a plain kit game when a showpiece cannot run its own right now */
async function plain(def, c) {
  if (!G.minigame || !G.minigame.play) return 'ok';
  const r = await G.minigame.play(Object.assign({ level: 1 }, def)); return c.alive() ? grade(r) : 'dead';
}
const phoneClosed = () => new Promise(res => { const t = setInterval(() => { if (!safe(() => G.phone.isOpen, false)) { clearInterval(t); res(); } }, 300); });

/* ---------- My Day adapters (see header) ---------- */
export const MYDAY = {
  async open(c) {
    if (G.myDay && G.myDay.open) { await G.myDay.open(); return; }
    safe(() => G.phone.open('planner')); await c.sleep(400); await phoneClosed();
  },
  async add(c) {
    if (G.myDay && G.myDay.addIdea) { await G.myDay.addIdea(); return true; }
    let added = false; const off = G.on('appt:add', () => { added = true; });
    safe(() => G.phone.open('planner', { add: true })); await c.sleep(400); await phoneClosed(); off(); return added;
  },
};

/* ---------- Pip's survey: the interests picker ---------- */
function interestsSheet() {
  return new Promise(res => {
    const cur = new Set(safe(() => G.skills.interests(), []));
    const wrap = el('div.chc-wrap'), list = el('div.chs-list'), note = el('p.chc-meta'), ok = el('button.chc-go', { 'data-ch': 'survey', text: "That's me" });
    const draw = () => {
      list.replaceChildren(...FAMILIES.map(f => el('button.chs-i' + (cur.has(f.id) ? '.on' : ''), { 'data-fam': f.id, onclick: () => { if (cur.has(f.id)) cur.delete(f.id); else if (cur.size < INTEREST.max) cur.add(f.id); draw(); } },
        el('b', { text: f.name }), el('small', { text: f.blurb || f.desc || (f.skills || []).join(', ') }))));
      note.textContent = cur.size < INTEREST.min ? `Tick at least ${INTEREST.min}. Pip is firm about sample sizes.` : cur.size >= INTEREST.max ? `${INTEREST.max} is the most the form has room for.` : 'You can change your mind later. Pip will re-file.';
      ok.disabled = cur.size < INTEREST.min;
    };
    ok.onclick = () => { safe(() => G.skills.setInterests([...cur])); wrap.remove(); G.modal--; res(true); };
    wrap.append(el('div.chc.start.survey', null, el('div.chc-kick', { text: "Pip's Fun Survey" }), el('h2.chc-title', { text: 'What sounds like you?' }), list, note, el('div.chc-btns', null, ok)));
    root().append(wrap); G.modal++; draw();
  });
}

/* ---------- the adapters, by "kind:id" (the part of the id after ':' is the argument) ---------- */
const A = {
  /* --- Chapter 1 --- */
  async 'activity:wash_hands'(st, c, ) {
    const r = await c.doAt([{ tag: 'sink' }, { label: /sink/i }, { asset: 'furn.home.kitchen.clutter' }, { asset: 'furn.home.kitchen.counter' }], st.label, { go: 'Wash up', hint: st.hint }); if (r !== 'done') return r;
    await act('Washing your hands', 'work', 3); safe(() => G.needs.add('hygiene', 14)); return 'good';
  },
  async 'activity:use_toilet'(st, c) {
    const r = await c.doAt(null, st.label, { go: 'Pop upstairs', skip: true }); if (r !== 'done') return r;
    await act('Upstairs', 'stand', 5, { hide: true }); safe(() => G.needs.set('bladder', 100)); safe(() => G.needs.add('hygiene', 6)); return 'good';
  },
  async 'activity:nap'(st, c) {
    /* "the chair by the range": the kitchen chair that stands by the stove (Nana's has one, scenes/rooms/homes.js); elsewhere the nearest armchair / seat. The player sits on the piece's real seat, facing the way it faces. */
    const byRange = sc => { const fx = (sc.fixtures || []).find(f => f.tags.includes('rangechair') && f.seats.length); return fx ? { x: fx.x, y: fx.y, h: 1.9, fx } : null; }, find = [byRange, { asset: 'furn.home.armchair' }, { tag: 'seat' }];
    const r = await c.doAt(find, st.label, { go: 'Sit a while', skip: true }); if (r !== 'done') return r;
    const t = c.locate(find), seat = t && t.fx && t.fx.seats && t.fx.seats.find(q => !q.lie);
    await act('Ten minutes in the chair', 'sit', 10, seat ? { at: { x: seat.x, y: seat.y, z: seat.z || 0, dir: seat.dir === undefined ? 1 : seat.dir } } : {}); safe(() => G.needs.add('energy', 12)); safe(() => G.needs.add('comfort', 8)); return 'good';
  },
  async 'minigame:flip'(st, c) {
    const r = await c.doAt([{ tag: 'stove' }, { label: /stove|range|cook/i }], st.label, { go: 'To the stove', hint: st.hint }); if (r !== 'done') return r;
    return kit('flip', c, { skill: 'cooking', title: "Bea's Maple Oat Pancakes", sub: "At Nana's stove" });
  },
  /* --- Chapter 2 --- */
  async 'ui:map_pick'(st, c, arg) {
    const r = await c.doAt(null, st.label, { go: 'Open the Map', hint: st.hint }); if (r !== 'done') return r;
    safe(() => G.phone.open('map', { place: arg })); await c.sleep(500); await phoneClosed(); return 'good';
  },
  async 'activity:skydeck_scope'(st, c) {
    const r = await c.doAt([{ tag: 'telescope' }, { label: /telescope/i }], st.label, { go: 'To a telescope', hint: st.hint }); if (r !== 'done') return r;
    const d = await choose('Which part of town?', [['oldtown', 'Old Town'], ['harbor', 'The Harbor'], ['park', 'Central Park'], ['hillcrest', 'Hillcrest'], ['airport', 'The airport']].map(x => ({ label: x[1], value: x[0] })));
    if (!c.alive()) return 'dead'; if (!d) return 'ok';
    safe(() => G.money.add(.25, 'telescope')); const ok = safe(() => G.showpieces.skydeck.scope(d), false);
    if (ok) { await c.sleep(600); await c.until(() => !document.querySelector('.sky-scope'), 120000); }
    return ok ? 'good' : 'ok';
  },
  /* --- Chapter 3 --- */
  async 'ui:interests_pick'(st, c) {
    const r = await c.doAt(null, st.label, { go: 'Take the clipboard', hint: st.hint }); if (r !== 'done') return r;
    await interestsSheet(); return 'good';
  },
  'minigame:hoops': (st, c) => kit('hoops', c, { skill: 'fitness' }),
  'minigame:chess': (st, c) => kit('chess', c, { skill: 'chess' }),
  'minigame:sketch': (st, c) => kit('sketch', c, { skill: 'painting' }),
  /* --- Chapter 4 --- */
  async 'ui:myday_open'(st, c) { const r = await c.doAt(null, st.label, { go: 'Open it', hint: st.hint }); if (r !== 'done') return r; await MYDAY.open(c); return 'good'; },
  async 'ui:myday_add'(st, c) { const r = await c.doAt(null, st.label, { go: 'Add one', hint: st.hint }); if (r !== 'done') return r; const ok = await MYDAY.add(c); return ok ? 'good' : 'ok'; },
  async 'ui:jobs_apply'(st, c) {
    if (safe(() => G.jobs.current(), null)) { safe(() => { (G.state.flags || (G.state.flags = {})).c04_hadjob = 1; }); return 'good'; }   /* QA11: Theo does not say "Hired!" to somebody who already had a job */
    for (;;) {
      const r = await c.doAt(null, st.label, { go: 'See the listings', hint: st.hint }); if (r !== 'done') return r;
      safe(() => G.jobs.openBoard({ source: 'phone' })); await c.sleep(500);
      await c.until(() => !G.modal || !!safe(() => G.jobs.current(), null), 600000); if (!c.alive()) return 'dead';
      if (safe(() => G.jobs.current(), null)) return 'good';
      toast('Any job. It does not have to be forever.', 'info', 3200);
    }
  },
  /* --- Chapter 5 --- */
  async 'buy:goods'(st, c) {
    let got = null; const off = G.on('goods:buy', (id, store, p, how) => { got = { id, how }; });
    c.chip({ text: st.label, hint: st.hint, skip: { label: 'Just looking today', fn: () => { got = { how: 'none' }; } } });
    await c.until(() => !!got, 0); off(); if (!c.alive()) return 'dead';
    if (got.how === 'none') return 'skip';
    if (got.how === 'delivery') { c.setFlag('ch05_delivery', true); return 'ok'; }
    return 'good';
  },
  async 'ui:decorate_place'(st, c) {
    const r = await c.doAt(null, st.label, { go: 'Open Decorate', hint: st.hint }); if (r !== 'done') return r;
    safe(() => G.inv && G.goods && G.goods.unpackBag && G.goods.unpackBag());
    const ok = safe(() => { G.furnish.open(); return true; }, false); if (!ok) return 'ok';
    await c.sleep(500); await c.until(() => !safe(() => G.furnish.active, false), 0); return c.alive() ? 'good' : 'dead';
  },
  async 'activity:wardrobe_change'(st, c) {
    const r = await c.doAt([{ tag: 'wardrobe' }, { label: /wardrobe|closet|dresser/i }], st.label, { go: 'Open the wardrobe', skip: true }); if (r !== 'done') return r;
    const it = safe(() => G.interactables().find(i => /wardrobe|closet/i.test(i.label || '')), null);
    if (it) { safe(() => it.use(G, it)); await c.sleep(500); await c.until(() => !G.modal, 300000); } else if (G.phone) { safe(() => G.phone.open('closet')); await c.sleep(400); await phoneClosed(); }
    return 'good';
  },
  /* --- Chapter 6: the three boxes (interactables of the attic room, scenes/rooms/chapter_attic.js) --- */
  async 'activity:unpack_box'(st, c, arg) {
    const find = arg === 'kettle' ? { label: /KETTLE/ } : arg === 'girls' ? { label: /GIRLS/ } : { label: /armchair|dust sheet/i };
    const r = await c.doAt([find], st.label, { go: arg === 'tin' ? 'Reach down the side' : 'Open it' }); if (r !== 'done') return r;
    await act(arg === 'tin' ? 'Reaching down the side of the chair' : 'Opening the box, carefully', 'work', 4);
    safe(() => G.scene.attic && G.scene.attic.open(arg)); G.emit('chapter:box', arg); return 'good';
  },
  /* --- Chapter 7 --- */
  async 'climb:lighthouse_stairs'(st, c) {
    const lines = (st.talk || []).slice(); let said = 0; const t0 = performance.now();
    c.chip({ text: st.label, goal: { room: 'lighthouse_watch', find: null, label: 'Up the stair' } });
    await c.until(() => {
      if (lines.length && performance.now() - t0 > 2500 + said * 6500 && !G.modal) { const l = lines.shift(); said++; c.caption(l.who, l.text, 6000); }
      return G.scene && G.scene.id === 'int:lighthouse_watch';
    }, 0);
    st._left = lines; return c.alive() ? 'good' : 'dead';
  },
  async 'activity:lh_light_lamp'(st, c) {
    const L = safe(() => G.lighthouse.lampTime(), 19), n = G.now();
    if (n.hf < L - .45 && n.hf > L - 4) { toast('You wait. The sun goes down the way it always has, a little at a time.', 'info', 3600); await c.fade(() => G.advance(Math.round((L - .35 - n.hf) * 60))); }
    const r = await c.doAt([{ label: /lamp|mantle|burner|lens/i }], st.label, { go: 'To the lamp', hint: st.hint }); if (r !== 'done') return r;
    let ok = null;
    if (G.lighthouse && !safe(() => G.lighthouse.lampOn(), false)) ok = await safe(() => G.lighthouse.light(), Promise.resolve(false));
    if (!c.alive()) return 'dead';
    if (ok) return 'good';
    return plain({ kind: 'timing', title: 'Lighting the lamp', hint: 'Pump the vapour up to pressure, then the match.', o: { style: 'ring' } }, c);
  },
  /* --- Chapter 8 --- */
  async 'minigame:fm_auction'(st, c) {
    const n = G.now(); if (n.hf < 5.52) await c.fade(() => G.advance(Math.round((5.55 - n.hf) * 60)));
    const r = await c.doAt([{ label: /auction|rostrum|bid/i }], st.label, { go: 'To the rostrum', hint: st.hint }); if (r !== 'done') return r;
    /* the real auction: lot nine if it is still on the ice (the script calls it), else the next lot up. The script has you buy the fish whatever happens, so:
       Theo stands the difference if your purse is short, and a lot that gets away from you is followed by one you do get (a touch eager). */
    const pick = () => { const L = safe(() => G.fishmarket.lots(), []), l = L.find(q => q.n === 9 && !q.sold) || L.find(q => !q.sold); return l ? { i: L.indexOf(l), l } : null; };
    const first = pick();
    if (first && G.now().hf < 7.5) {
      const purse = safe(() => G.money.get(), 0), treat = purse < (first.l.start || 0);        /* short of the opening price: the fish is on Theo */
      const lend = l => { const need = Math.ceil((l.start || 0) - safe(() => G.money.get(), 0)); if (need > 0) safe(() => G.money.add(need, 'gift')); };
      const settle = () => { if (!treat) return; const over = safe(() => G.money.get(), 0) - purse; if (over > 0) safe(() => G.money.add(-over, 'gift')); else if (over < 0) safe(() => G.money.add(-over, 'gift')); };   /* your purse is as it was */
      if (treat) { lend(first.l); c.caption('theo', 'Put your wallet away. I am allowed to lend to family. Informally.', 4200); await c.sleep(1200); }
      const res = await safe(() => G.fishmarket.bid(first.i), Promise.resolve(null));
      if (!c.alive()) return 'dead';
      if (res && res.won) { settle(); return res.price <= ((first.l.start || 0) + (first.l.floor || 0)) / 2 ? 'good' : 'ok'; }
      const again = pick();
      if (again) { if (treat) lend(again.l); const r2 = await safe(() => G.fishmarket.bid(again.i, .2), Promise.resolve(null)); if (!c.alive()) return 'dead'; }
      settle(); return 'ok';
    }
    return plain({ kind: 'timing', title: 'Lot nine: the clock is falling', hint: 'Hand up when the price feels right.', o: { style: 'bar' } }, c);
  },
  /* --- Chapter 9: the two frames are shown by the engine (frames.js data below) --- */
  async 'activity:ch_microfilm'(st, c, arg) {
    const r = await c.doAt([{ label: /microfilm/i }], st.label, { go: 'Wind the reel', hint: st.hint }); if (r !== 'done') return r;
    await act('Winding the reel', 'work', 4); if (!c.alive()) return 'dead';
    await UI.frame(FRAMES[arg] || FRAMES['1988']); G.emit('chapter:microfilm', arg); return 'good';
  },
  /* --- Chapter 10 --- */
  async 'minigame:mus_dig'(st, c) {
    const r = await c.doAt([{ label: /dig/i }, { tag: 'mus_dig' }], st.label, { go: 'Into the dig pit', hint: st.hint }); if (r !== 'done') return r;
    const lines = (st.talk || []).slice(); let k = 0; const iv = setInterval(() => { if (!lines.length) return clearInterval(iv); const l = lines.shift(); c.caption(l.who, l.text, 5200); k++; }, 5600);
    let f = null; if (G.museum && G.museum.dig) f = await safe(() => G.museum.dig(), Promise.resolve(null));
    clearInterval(iv); st._left = lines; if (!c.alive()) return 'dead';
    if (f) return 'good';
    return plain({ kind: 'trace', title: 'The dig pit', hint: 'Brush along the edge of the bone.' }, c);
  },
  /* --- Chapter 11 --- */
  async 'minigame:obs_trace'(st, c) {
    const r = await c.doAt([{ label: /constellation|finder/i }], st.label, { go: 'To the star finder', hint: st.hint }); if (r !== 'done') return r;
    /* a clear evening that is not dark yet: you wait for the stars (the clock moves on, like waiting for dusk at the Light) */
    const sk = () => safe(() => G.observatory.sky(), null);
    if (sk() && sk().clear && !sk().night && G.now().hf > 16) { toast('You wait. The first star is always the one you were not looking at.', 'info', 3600); await c.fade(() => { for (let k = 0; k < 16 && sk() && !sk().night; k++) G.advance(10); }); if (!c.alive()) return 'dead'; }
    let ok = false; if (G.observatory && safe(() => G.observatory.sky().observing, false)) ok = await safe(() => G.observatory.trace(), Promise.resolve(false));
    if (!c.alive()) return 'dead'; if (ok) return 'good';
    return plain({ kind: 'trace', title: "Tonight's constellation", hint: 'Star to star. Take your time.' }, c);
  },
  /* --- Chapter 12: the University's own open lecture is on Wednesday nights; the Chapter is a weekday morning (it ends at the school gate at home time).
     So this is the morning public lecture of the same series, staged with the theatre's own pieces: the University's talk "How a lighthouse throws a candle
     twenty miles" (story/university.js OPEN, id 'lens': it sends you up the Light, which is page one of the book), its professor at the lectern, an audience,
     the three boards on the wall screen, and the talk's own question. If G.university.sitIn({ chapter, talk }) ever exists it is used instead. --- */
  async 'activity:uni_open_lecture'(st, c) {
    const sc = G.scene, U = sc && sc.uni && sc.uni.board ? sc.uni : null, tk = OPEN.find(t => t.id === 'lens') || OPEN[0], prof = safe(() => UCAST[tk.by].short || UCAST[tk.by].name, 'The lecturer');
    const tidy = () => { if (!U) return; const off = G.on('scene', () => { off(); safe(() => U.clear()); safe(() => U.board.show(null)); }); };
    const wrap = (t, n) => { const out = []; let l = ''; for (const w of String(t).split(' ')) { if ((l + ' ' + w).trim().length > n) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) out.push(l); return out; };
    if (U) { safe(() => U.setProf(tk.by)); safe(() => U.fill(12, false)); safe(() => U.board.show({ mode: 'stage', title: 'OPEN LECTURE', lines: wrap(tk.title, 30).slice(0, 3).concat([prof, 'TAKE ANY SEAT']) })); }
    const r = await c.doAt([{ label: /^Take a seat$/ }, { tag: 'seat' }], st.label, { go: 'Take a seat at the front', hint: st.hint }); if (r !== 'done') { tidy(); return r; }
    if (G.university && G.university.sitIn) { const ok = await safe(() => G.university.sitIn({ chapter: true, talk: tk.id }), Promise.resolve(false)); if (ok) return c.alive() ? 'good' : 'dead'; }
    const P = G.player, seat = U ? U.seats.filter(q => !q.taken || q.taken === P).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0] : null;
    const say = (name, text, ms) => safe(() => G.goalsUI.caption(name, text, ms));
    /* what is said while you sit: Kit, twice, under her breath; then the three boards, each on the screen as it is spoken */
    const cues = (st.talk || []).map(l => () => c.caption(l.who, l.text, 4300));
    tk.boards.forEach((b, i) => cues.push(() => { if (U) safe(() => U.board.show({ mode: 'slide', title: tk.title.toUpperCase().slice(0, 34), fig: b.fig, lines: wrap(b.h, 17).concat(wrap(b.t, 17)).slice(0, 4), n: i + 1, of: tk.boards.length })); say(prof, b.t, 6200); }));
    let k = 0; const step = () => { if (k < cues.length) cues[k++](); }; step(); const iv = setInterval(step, 4600);
    if (seat) { seat.taken = P; P.poseOpts = { seated: true }; }
    /* the class camera: one zoom step back, looking at the dais and the screen (the same view the University's own classes use) */
    const z0 = G.zoom, F = U && U.focus, port = innerHeight > innerWidth, proxy = F ? { x: F.x, y: F.y + (port ? 2.2 : 1), z: (F.z || 0) - (port ? (innerHeight * .1 / (G.cssScale || 2)) / 16 : 0) } : null;
    if (proxy) { if (z0 >= 3) safe(() => G.setZoom(z0 - 1)); G.camTarget = proxy; }
    const uncam = () => { if (!proxy) return; if (G.camTarget === proxy) G.camTarget = null; if (G.zoom !== z0) safe(() => G.setZoom(z0)); };
    await act('Listening: "' + tk.title + '"', 'sit', 36, Object.assign({ rate: 36 / (cues.length * 4.6 + 1.5) }, seat ? { at: { x: seat.x, y: seat.y, z: seat.z, dir: seat.dir } } : {}));
    clearInterval(iv); if (seat) { P.poseOpts = null; if (seat.taken === P) seat.taken = null; } st._left = []; if (!c.alive()) { uncam(); tidy(); return 'dead'; }
    safe(() => G.needs.add('inspiration', 12)); safe(() => G.needs.add('fun', 8)); safe(() => { G.state.uni.open[tk.id] = 1; });
    const q = tk.ask[0], v = await choose(`${prof} looks along the front row. "${q[0]}"`, q[1].map((t, i) => ({ label: t, value: i + 1 })).concat([{ label: '(Look at Kit.)', value: 99 }]));
    if (!c.alive()) { uncam(); tidy(); return 'dead'; }
    const right = v === q[2] + 1;
    say(prof, right ? q[3] : v === 99 ? 'No? ' + q[3] : 'Not quite. ' + q[3], 5200); await c.sleep(2600);
    if (U) safe(() => U.board.show({ mode: 'stage', title: 'OPEN LECTURE', lines: ['THANK YOU', 'NEXT: WEDNESDAY 19:30'] }));
    uncam(); tidy(); return right ? 'good' : 'ok';
  },
  /* --- Chapter 13 --- */
  async 'minigame:cook'(st, c) {
    const r = await c.doAt([{ tag: 'stove' }, { label: /stove|range|cook/i }], st.label, { go: 'To the table', hint: st.hint }); if (r !== 'done') return r;
    return kit('flip', c, { skill: 'cooking', title: 'The apple-maple pie', sub: "With Nana, in her kitchen", hint: 'Tap when the marker is in the green: apples in the pan, a turn at just the right moment. Nana is watching the crust, and you.' });
  },
  /* --- Chapter 14 / 15 --- */
  async 'minigame:pour'(st, c) {
    const lines = (st.talk || []).slice(); const iv = setInterval(() => { if (!lines.length) return clearInterval(iv); const l = lines.shift(); c.caption(l.who, l.text, 5000); }, 5200);
    const r = await kit('pour', c, { skill: 'mixology', title: 'Pour the tea', sub: 'Three cups from the copper pot' }); clearInterval(iv); st._left = lines; return r;
  },
  'minigame:write': (st, c) => kit('write', c, { skill: 'writing', title: 'The last page', sub: 'Page thirteen: The Lookout' }),
};

export async function run(st, c) {
  const key = st.kind + ':' + st.id, base = st.kind + ':' + String(st.id).split(':')[0], arg = String(st.id).split(':').slice(1).join(':');
  const fn = A[key] || A[base];
  if (!fn) { console.warn('chapters: no play adapter for', key); const r = await c.doAt(null, st.label, { go: 'Do it', skip: !!st.skip }); return r === 'done' ? 'ok' : r; }
  try { return (await fn(st, c, arg)) || 'ok'; } catch (e) { console.warn('chapters play ' + key, e); return c.alive() ? 'ok' : 'dead'; }
}
export const adapters = () => Object.keys(A);

/* ---------- the two microfilm frames (Bay Courier) ---------- */
export const FRAMES = {
  1988: { head: 'THE BAY COURIER', date: 'September 1988 · page six', title: 'COMINGS & GOINGS', photo: photo1988, caption: 'Shipping news. A cannery strike. An advertisement for a hat.',
    cols: ['Miss Eleanor Larkin of Thimble Street leaves us on Saturday for Pinehollow, where she is to be married.',
      'The Copper Kettle\'s loss, remarks her mother, is entirely Pinehollow\'s gain.'], button: 'Sit back' },
  1985: { head: 'THE BAY COURIER', date: 'June 1985 · front page', title: 'COPPER KETTLE OPENS ON THIMBLE STREET', photo: photo1985, caption: 'A doorway, a brass bell. Photograph: A. Pell.',
    cols: ['A small upright woman with flour on her cheek. A tall man in a motorman\'s cap. Two girls.',
      'The older girl is holding the door open with her foot, and laughing at whoever has the camera.'], button: 'Sit back' },
};
