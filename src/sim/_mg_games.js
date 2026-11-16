// Mini-games B (owner msgs 163-164, BIBLE Direction update 33 + CORRECTION): the chore / venue games and where each attaches. Kinds: src/ui/minigame_b.js. Data + tunables: src/data/minigames_b.js.
// TWO WAYS A GAME ATTACHES
//   1. a game with a `skill` joins skillplay: BG[key] is added to G.skillplay.GAMES and data ACT_GAME_B fills GAME_FOR, so skillplay opens it when the activity starts (bonus xp, records, the Me app).
//   2. a game without a skill (a shower is not a skill) runs on the B runner `ride(key, ctx, activity)`: the same behaviour (the bar creeps while you play, then whooshes; Auto = the plain
//      activity; Stop = the activity is cancelled the normal way; mini-games off = nothing opens), a result card, no xp. It opens for
//        - a G.activities id listed in ACT_GAME_B, and
//        - any bare G.startActivity({ ..., mgb: 'key', mgbCtx: {...} })   <- the `MG-B HOOK` in laundry.js, supplies.js, hotel.js.
// Rules (agreed with the owner): every game is optional; playing well adds a little of what the activity already gives; skipping or failing takes nothing away.
// G.mgB = { ride(key, ctx?, activity?), wash(load) (the sort game when a wash is started), demo(key, ctx?) -> Promise<result>, games (BG), acts (ACT_GAME_B), current() }
import { G } from '../core/game.js';
import { ITEM_BY_ID } from '../data/items.js';
import { GAME_FOR } from '../data/skills_extra.js';
import { TUNE_B, ACT_GAME_B, LEAK_SPOTS } from '../data/minigames_b.js';
import { play, abort, sheetRect, stars as starsOf, MG, draw as D } from '../ui/minigame.js';
import { el, root } from '../ui/kit.js';
import { iconEl } from '../ui/_icons.js';

const safe = (fn, fb) => { try { const v = fn(); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), B = TUNE_B.bonus, INK = D.INK;
const add = (k, v) => safe(() => G.needs.add(k, v), 0), auto = () => safe(() => G.skillplay.auto(), false);
const shuffle = a => a.slice().sort(() => Math.random() - .5);

/* ====================================================================== pictures for the kit kinds that take a scene ====================================================================== */
const poolScene = (c, x, y, w, h, q, bounce) => {   // 'timing': a pool table from above; a good shot rolls the ball into the corner pocket
  D.box(c, 18, 2, 144, 62, '#8a5a2c'); D.R(c, 23, 7, 134, 52, '#2f7f5f'); D.R(c, 23, 7, 134, 2, '#3f9670'); for (const p of [[24, 8], [90, 7], [156, 8], [24, 58], [90, 59], [156, 58]]) D.disc(c, p[0], p[1], 4, INK);
  const u = bounce > 0 ? 1 - bounce / .35 : 0, hit = bounce > 0 && q > .5, bx = 112 + (hit ? u * 42 : bounce > 0 ? Math.sin(u * 9) * 3 : 0), by = 34 - (hit ? u * 25 : 0), cx = 56 + (bounce > 0 ? Math.min(1, u * 3) * 30 : 0);
  for (const b of [[70, 16, '#f2c230'], [130, 48, '#3b82d6'], [44, 46, '#8a5cc2']]) { D.disc(c, b[0], b[1], 4, INK); D.disc(c, b[0], b[1], 3, b[2]); }
  if (!(hit && u > .9)) { D.disc(c, bx, by, 4, INK); D.disc(c, bx, by, 3, '#d8342e'); D.R(c, bx - 1, by - 2, 2, 1, '#ffffff'); }
  D.disc(c, cx, 34, 4, INK); D.disc(c, cx, 34, 3, '#fffdf4'); D.line(c, cx - 8 - (bounce > 0 ? 0 : 4), 34, cx - 44, 36, INK, 3); D.line(c, cx - 9 - (bounce > 0 ? 0 : 4), 34, cx - 43, 36, '#e0b46a', 1);
};
const swingScene = (c, x, y, w, h, s) => {          // 'stroke': a park swing
  D.R(c, x, y, w, h, '#cfe9f4'); D.R(c, x, y + h - 10, w, 10, '#8fc97a'); D.disc(c, x + w - 20, y + 12, 6, '#fff4c0'); const px = x + w / 2, py = y + 6;
  D.line(c, px - 34, y + h - 8, px - 22, py, INK, 3); D.line(c, px + 34, y + h - 8, px + 22, py, INK, 3); D.R(c, px - 24, py - 2, 48, 4, INK); D.R(c, px - 23, py - 1, 46, 2, '#c05a3a');
  const a = (s.u - .5) * 1.5, sx = px + Math.sin(a) * 38, sy = py + Math.cos(a) * 38; D.line(c, px - 5, py, sx - 5, sy, '#77707f', 1); D.line(c, px + 5, py, sx + 5, sy, '#77707f', 1); D.R(c, sx - 8, sy, 16, 3, INK);
  D.disc(c, sx, sy - 14, 4, INK); D.disc(c, sx, sy - 14, 3, '#e8b890'); D.box(c, sx - 4, sy - 10, 9, 10, '#e0527a'); D.line(c, sx + 2, sy - 1, sx + 2 + Math.sin(a + (s.hold ? .9 : -.5)) * 8, sy + 6, INK, 2);
};
const lapScene = (c, x, y, w, h, s) => {            // 'stroke': a pool lane
  D.R(c, x, y, w, h, '#3b9fd6'); for (let k = 0; k < 2; k++) for (let q = 0; q < w; q += 8) D.R(c, x + q, y + 8 + k * 44, 5, 3, (q / 8 + k) % 2 ? '#fffdf4' : '#d8342e'); for (let k = 0; k < 7; k++) D.R(c, x + ((k * 27 + 300 - s.dist * 2) % (w - 10) + (w - 10)) % (w - 10), y + 18 + (k % 4) * 9, 9, 1, '#9fd0f0');
  const sx = x + 50 + s.u * 14, sy = y + 34; D.R(c, sx - 26, sy - 2, 24, 6, INK); D.R(c, sx - 25, sy - 1, 22, 4, '#e8b890'); D.R(c, sx - 18, sy - 1, 8, 4, '#27375e'); D.disc(c, sx, sy, 5, INK); D.disc(c, sx, sy, 4, '#e8b890'); D.R(c, sx - 2, sy - 5, 6, 3, '#f2c230');
  const a = -2.6 + s.u * 2.9; D.line(c, sx - 2, sy, sx - 2 + Math.cos(a) * 16, sy + Math.sin(a) * 12, INK, 3); D.line(c, sx - 2, sy, sx - 2 + Math.cos(a) * 15, sy + Math.sin(a) * 11, '#e8b890', 1); if (s.hold) for (let k = 0; k < 3; k++) D.R(c, sx - 30 - k * 5, sy - 4 + (k * 5 + Math.floor(s.t * 20)) % 9, 2, 2, '#ffffff');
};
const pondScene = (c, x, y, w, h) => {              // 'aim' (throw): the duck pond
  D.R(c, x, y, w, h, '#a8d88a'); D.R(c, x + 70, y + 4, w - 70, 56, '#5fb0e0'); D.R(c, x + 62, y + 12, 10, 40, '#5fb0e0'); for (let k = 0; k < 5; k++) D.R(c, x + 80 + k * 16, y + 14 + (k % 3) * 14 + Math.round(Math.sin(G.time * 2 + k)), 7, 1, '#bfe3f2');
  for (const d of [[118, 30, '#fffdf4'], [140, 42, '#b8794a'], [152, 24, '#fffdf4'], [128, 48, '#e9dcc0']]) { const bob = Math.round(Math.sin(G.time * 3 + d[0])); D.disc(c, d[0], d[1] + bob, 5, INK); D.disc(c, d[0], d[1] + bob, 4, d[2]); D.disc(c, d[0] - 5, d[1] - 4 + bob, 3, INK); D.disc(c, d[0] - 5, d[1] - 4 + bob, 2, d[2]); D.R(c, d[0] - 10, d[1] - 4 + bob, 3, 2, '#f08a2c'); }
  for (let k = 0; k < 4; k++) D.R(c, x + 8 + k * 14, y + h - 14 - (k % 2) * 3, 2, 5, '#5f9f4a');
};
const bread = (c, x, y) => { D.R(c, x - 3, y - 3, 7, 6, INK); D.R(c, x - 2, y - 2, 5, 4, '#e0b46a'); D.R(c, x - 1, y - 1, 3, 2, '#fff0c8'); };
const dialScene = (c, x, y, w, h, s) => {           // 'balance': the shower: blue = too cold, red = too hot
  for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) D.box(c, x + i * 22, y + j * 16, 22, 16, (i + j) % 2 ? '#dfeef5' : '#eaf6fb', '#c2d4de');
  const d = s.v - s.c0, col = s.inz ? '#8fd8f0' : d > 0 ? '#f08a2c' : '#3b82d6'; D.R(c, x + 58, y + 2, 4, 10, '#9aa4b0'); D.box(c, x + 44, y + 10, 32, 6, '#9aa4b0');
  for (let k = 0; k < 7; k++) { const dx = x + 46 + k * 4.5; for (let q = 0; q < 5; q++) D.R(c, dx + (k - 3) * q * .7, y + 18 + q * 11 + (Math.floor(s.t * 30) + k * 3) % 9, 2, 5, col); }
  if (!s.inz && d > 0) for (let k = 0; k < 4; k++) D.R(c, x + 30 + k * 18, y + 60 - (Math.floor(s.t * 14) + k * 5) % 22, 4, 3, '#ffffffcc');                 // steam
  if (!s.inz && d < 0) for (let k = 0; k < 3; k++) { D.R(c, x + 34 + k * 26, y + 30 + k * 6, 1, 7, '#ffffff'); D.R(c, x + 31 + k * 26, y + 33 + k * 6, 7, 1, '#ffffff'); }   // brr
  const kx = x + 104, ky = y + 46, a = -2.4 + s.v * 4.8; D.disc(c, kx, ky, 13, INK); D.disc(c, kx, ky, 12, '#d9d9e0'); D.disc(c, kx - 9, ky + 12, 3, '#3b82d6'); D.disc(c, kx + 9, ky + 12, 3, '#d8342e'); D.line(c, kx, ky, kx + Math.sin(a) * 10, ky - Math.cos(a) * 10, INK, 3);
};
const leakScene = (c, x, y, w, h, s) => {           // 'targets': pipes under the sink; the lit joint drips
  const P = '#9aa4b0'; for (const yy of [30, 72]) { D.R(c, x + 4, yy - 5, w - 8, 10, INK); D.R(c, x + 4, yy - 4, w - 8, 8, P); D.R(c, x + 4, yy - 4, w - 8, 2, '#c8d0d8'); }
  for (const xx of [60, 108]) { D.R(c, xx - 5, 30, 10, 42, INK); D.R(c, xx - 4, 30, 8, 42, P); D.R(c, xx - 4, 30, 2, 42, '#c8d0d8'); }
  s.spots.forEach((p, k) => { D.box(c, p[0] - 8, p[1] - 8, 16, 16, k === s.hitAt && s.hitT > 0 ? '#fff8b0' : '#77707f'); D.R(c, p[0] - 5, p[1] - 1, 10, 2, INK); if (k === s.cur) for (let q = 0; q < 3; q++) D.R(c, p[0] - 1 + (q - 1) * 5, p[1] + 10 + (Math.floor(G.time * 24) + q * 4) % 12, 2, 3, '#3b82d6'); });
};

/* ====================================================================== the games ====================================================================== */
const boxOf = ctx => safe(() => { const uid = ctx.fx.item.box; return G.housing.boxes().find(b => b.uid === uid); }, null);
const nm = id => safe(() => ITEM_BY_ID[id].name.split(',')[0], 'Something');
const boxItems = ctx => { const b = boxOf(ctx); if (!b) return [['Odds and ends', 'ui.star'], ['A mug', 'ui.star'], ['A postcard', 'ui.star']]; return (b.gives || []).map(g => [nm(g.item) + (g.qty > 1 ? ' x' + g.qty : ''), g.item]).concat((b.items || []).map(id => [nm(id), id])); };
const fixResult = R => safe(() => G.skillplay.GAMES.fixit.result(R), { icon: 'skill.handiness', title: 'Fixed', lines: [] });
const fun = (R, max) => { const n = Math.max(1, Math.round(max * R.q)); add('fun', n); return n; };

/** key -> { skill? (see the header), title(l, ctx, id), kit(l, ctx, id) -> play() def fields, onScore?(session) (B runner: right when the game ends), result(R) -> { icon, title, lines } } */
export const BG = {
  /* ---- 1. the moving boxes (the first mini-game a new player meets: it cannot go wrong) ---- */
  unbox: { quietAuto: true, skill: 'handiness', title: (l, ctx) => 'Unpack: ' + safe(() => boxOf(ctx).label, 'a moving box'), fxc: ['#f2c230', '#fff8b0'],
    kit: (l, ctx) => ({ kind: 'unbox', level: 1, sub: 'Moving in', icon: 'skill.handiness', hint: 'Tap the tape to open the box. Then tap each thing to lift it out.', o: { items: boxItems(ctx) }, verdicts: ['Unpacked', 'Unpacked', 'Unpacked with care', 'Home already!'] }),
    result: R => { const n = R.played ? fun(R, B.unboxFun) : 0; return { icon: 'skill.handiness', title: R.played ? 'Unpacked with care' : 'Unpacked', lines: [n ? `That felt good: Fun +${n}` : null] }; } },
  /* ---- 4. gardening: watering is watering (the house plants used to open the weeding game) ---- */
  water: { quietAuto: true, skill: 'gardening', also: ['handiness'], title: () => 'Water the plant', fxc: ['#8fd8f0', '#dff1fa'],
    kit: () => ({ kind: 'water', icon: 'skill.gardening', hint: 'Hold to pour. Let go when the water is in the green: every pot wants a different amount.', verdicts: ['Soggy', 'Watered', 'Well watered', 'Green fingers!'] }),
    result: R => { if (R.q >= .55) safe(() => G.needs.addMoodlet('fresh_air'), 0); const n = R.played ? fun(R, 2) : 0; return { icon: 'skill.gardening', title: R.played ? (R.q >= .55 ? 'The plant perks up' : 'Watered, more or less') : 'Watered', lines: [n ? `Fun +${n}` : null] }; } },
  /* ---- 5. home repairs: the tune-ups used to sort parts into drawers ---- */
  leak: { skill: 'handiness', title: () => 'Tighten the leak', fxc: ['#f2c230', '#fff8b0'],
    kit: () => ({ kind: 'targets', icon: 'skill.handiness', hint: 'Tighten each joint as it starts to drip: tap it.', o: { spots: LEAK_SPOTS, n: 9, life: 1.6, r: 10 }, scene: leakScene, theme: { paper: '#e9dcc0' }, verdicts: ['Still dripping', 'Mostly dry', 'Dry as a bone', 'Plumber grade!'] }),
    result: fixResult },
  wires: { skill: 'handiness', title: () => 'Match the wires', fxc: ['#f2c230', '#fff8b0'],
    kit: () => ({ kind: 'wires', icon: 'skill.handiness', hint: 'Tap a plug, then the socket with the same colour and mark.', verdicts: ['A few sparks', 'It works', 'Neatly wired', 'Better than new!'] }),
    result: fixResult },
  /* ---- 6. venue games that were plain timers ---- */
  cue: { quietAuto: true, skill: 'gaming', title: () => 'Shoot pool', fxc: ['#f2c230', '#fff8b0'],
    kit: () => ({ kind: 'timing', icon: 'skill.gaming', hint: 'Tap when the marker is in the green to pot the ball. Five balls.', o: { rounds: 5, zone: .32 }, scene: poolScene, verdicts: ['Scratched', 'A couple down', 'Good break', 'Ran the table!'] }),
    result: R => { const n = R.played ? fun(R, B.poolFun) : 0; return { icon: 'skill.gaming', title: R.played ? `${R.stats.perfect || 0} clean pots of ${R.stats.rounds || 5}` : 'A friendly frame', lines: [n ? `Fun +${n}` : null] }; } },
  /* ---- 11. studying: a quick recall round for the skill books ---- */
  recall: { quietAuto: true, skill: 'logic', title: (l, ctx) => 'Recall: ' + safe(() => ITEM_BY_ID[ctx.book].name, 'the chapter'), fxc: ['#f2c230', '#fff8b0'],
    kit: () => ({ kind: 'memory', icon: 'skill.logic', hint: 'Close the book: watch the cards light up, then tap them in the same order.', o: { rounds: 2 }, verdicts: ['It did not stick', 'Some of it stuck', 'Good recall', 'Word for word!'] }),
    result: R => { const b = safe(() => ITEM_BY_ID[R.ctx.book], null), sk = b && b.skill, x = R.played && sk ? Math.round(safe(() => G.skills.addXp(sk, B.recallXp * R.q), 0)) : 0; return { icon: 'skill.logic', title: R.played ? (R.q >= .55 ? 'It stuck' : 'Some of it stuck') : 'Read quietly', lines: [x >= 1 ? `Recalled the chapter: +${x} xp in what the book teaches` : null] }; } },

  /* ================= the B runner (no skill) ================= */
  /* ---- 2. laundry ---- */
  sort: { title: () => 'Sort the load', icon: 'need.hygiene',
    kit: () => ({ kind: 'laundry', o: { mode: 'sort' }, sub: 'Lights from darks', hint: 'White and pale things go in Lights, dark things in Darks. Tap the basket (or its button).', verdicts: ['Pink socks ahead', 'Mostly sorted', 'Well sorted', 'Not one sock astray!'] }),
    onScore: me => { const l = me.ctx.load; if (l) l.mgb = (l.mgb || 0) + (me.q >= .55 ? B.sortHours : 1); },
    result: R => ({ title: `${R.stats.right || 0} of ${R.stats.of || 8} in the right basket`, lines: [R.q >= .55 ? `Nothing will run in the wash: Fresh Clothes will last ${B.sortHours} hours longer` : 'Sorted, more or less: Fresh Clothes will last an hour longer'] }) },
  fold: { title: () => 'Fold the laundry', icon: 'need.hygiene',
    kit: () => ({ kind: 'laundry', o: { mode: 'fold' }, sub: 'Warm from the dryer', hint: 'Tap the flap that glows: one side in, the other side in, then fold it up.', verdicts: ['A crumpled heap', 'Folded-ish', 'A neat stack', 'Shop-window folds!'] }),
    onScore: me => { const l = me.ctx.load; if (l && me.q >= .55) l.mgb = (l.mgb || 0) + 1; },
    result: R => { const n = fun(R, B.foldFun); return { title: R.q >= .55 ? 'A neat warm stack' : 'Folded, more or less', lines: [`Fun +${n}`, R.q >= .55 ? 'Crisp folds: Fresh Clothes will last an hour longer' : null] }; } },
  /* ---- 3. dishes / cleaning / windows ---- */
  scrub: { title: () => 'Scrub and wipe', icon: 'need.hygiene',
    kit: () => ({ kind: 'scrub', o: { scenes: shuffle(['window', 'counter', 'plate']), n: 4 }, sub: 'A proper clean', hint: 'Rub each spot away with your finger: the window, the counter, the plates.', verdicts: ['A lick and a promise', 'Cleaner', 'Sparkling', 'You could eat off it!'] }),
    result: R => { const n = Math.round(B.clean * R.q); if (n > 0) safe(() => G.supplies.addClean(n), 0); safe(() => G.skills.addXp('handiness', B.cleanXp * R.q), 0); return { title: R.q >= .55 ? 'Every corner done' : 'Clean enough', lines: [n > 0 ? `Extra sparkle: home cleanliness +${n}` : null] }; } },
  dishes: { title: () => 'Do the dishes', icon: 'need.hygiene',
    kit: () => ({ kind: 'scrub', o: { scenes: ['plate', 'plate'], n: 4 }, sub: 'A quick tidy', hint: 'Rub the food off each plate with the sponge.', verdicts: ['Still greasy', 'Rinsed', 'Squeaky clean', 'Gleaming!'] }),
    result: R => { const n = Math.round(B.clean * .5 * R.q); if (n > 0) safe(() => G.supplies.addClean(n), 0); return { title: R.q >= .55 ? 'The plates squeak' : 'Dishes done', lines: [n > 0 ? `A bit tidier still: home cleanliness +${n}` : null] }; } },
  /* ---- 16. the shower dial ---- */
  dial: { title: () => 'Find the temperature', icon: 'need.hygiene',
    kit: () => ({ kind: 'balance', o: { need: 6.5, secs: 20, zone: .2 }, sub: 'Not too hot, not too cold', hint: 'Hold to turn it hotter, let go to cool it. Keep the marker in the green.', scene: dialScene, theme: { paper: '#eaf6fb' }, verdicts: ['Hot! Cold! Hot!', 'Lukewarm', 'Just right', 'Spa day!'] }),
    result: R => { const n = Math.round(B.showerHyg * R.q); if (n > 0) add('hygiene', n); return { title: R.q >= .55 ? 'Just the right temperature' : 'Hot, cold, hot. Clean anyway.', lines: [n > 0 ? `A proper scrub: Hygiene +${n}` : null] }; } },
  /* ---- 6. more plain timers: the park swing, the duck pond ---- */
  swing: { title: () => 'Swing higher', icon: 'need.fun',
    kit: () => ({ kind: 'stroke', o: { strokes: 6, period: 2.2 }, sub: 'Higher! Higher!', hint: 'Press as the swing reaches the back (left green), hold through the swing, let go at the front (right green).', scene: swingScene, verdicts: ['Barely moving', 'Swinging', 'Flying', 'Over the bar (nearly)!'] }),
    result: R => { const n = fun(R, B.swingFun); return { title: `${R.stats.perfect || 0} perfect swings`, lines: [`Fun +${n}`] }; } },
  ducks: { title: () => 'Feed the ducks', icon: 'need.fun',
    kit: () => ({ kind: 'aim', o: { mode: 'throw', shots: 4 }, sub: 'Fourteen ducks are watching', hint: 'Tap to lock your aim, then tap again for the throw. Land the bread by the ducks.', scene: pondScene, projectile: bread, verdicts: ['Into the reeds', 'A few crumbs', 'Well thrown', 'Duck royalty!'] }),
    result: R => { const n = fun(R, B.duckFun); return { title: `${R.stats.made || 0} of ${R.stats.shots || 4} landed by the ducks`, lines: [`Fun +${n}`] }; } },
  /* ---- 17. pets: the animals at the pet pens (there are no pets of your own in the game yet) ---- */
  brush: { title: () => 'Brush the dog', icon: 'need.social',
    kit: () => ({ kind: 'scrub', o: { scenes: ['pet'], n: 6 }, sub: 'With the animals', hint: 'Brush out each tangle: rub it with your finger.', verdicts: ['Still scruffy', 'Tidier', 'Glossy', 'Best in show!'] }),
    result: R => { const n = fun(R, B.petFun); return { title: R.q >= .55 ? 'A glossy, very happy dog' : 'A happy dog', lines: [`Fun +${n}`] }; } },
  /* ---- 8. swimming: the hotel pool's laps were a plain timer ---- */
  laps: { title: () => 'Swim laps', icon: 'skill.swimming', level: () => safe(() => G.skills.level('swimming'), 1),
    kit: () => ({ kind: 'stroke', o: { strokes: 8 }, sub: 'Long, even strokes', hint: 'Press as your arm reaches the catch (left green), hold the pull, let go at the finish (right green) and breathe.', scene: lapScene, theme: { color: '#3b82d6' }, verdicts: ['Mostly splashing', 'Steady', 'Strong strokes', 'Like a seal!'] }),
    result: R => { const g = +(B.lapsFit * R.q).toFixed(1); if (g > 0) safe(() => G.needs.addFitness(g), 0); safe(() => G.skills.addXp('swimming', 10 * R.q), 0); return { title: `${R.stats.perfect || 0} clean strokes of ${R.stats.strokes || 8}`, lines: [g > 0 ? `Fitness +${g}` : null] }; } },
};

/* ====================================================================== the B runner ====================================================================== */
let cur = null, camProxy = null;
function camShift() {   // keep the character in view above the sheet (the same sum as skillplay's)
  const r = sheetRect(), p = G.player; if (!r || !p) return; const side = r.left > innerWidth * .4 && r.width < innerWidth * .6 && innerWidth > innerHeight, sx = side ? (innerWidth - r.left) / 2 : 0, sy = side ? 0 : Math.max(0, innerHeight / 2 - r.top / 2 - 10);
  const o = G.toScreen(0, 0, 0), ex = G.toScreen(1, 0, 0), ey = G.toScreen(0, 1, 0), a = ex.x - o.x, b = ey.x - o.x, c = ex.y - o.y, d = ey.y - o.y, det = a * d - b * c || 1, wx = (sx * d - b * sy) / det, wy = (a * sy - c * sx) / det;
  camProxy = { get x() { return p.x + wx; }, get y() { return p.y + wy; }, get z() { return p.z || 0; } }; if (!G.camTarget) G.camTarget = camProxy;
}
function camBack() { if (camProxy && G.camTarget === camProxy) G.camTarget = null; camProxy = null; }
function card(o) {
  const e = el('div.mg-res', { role: 'status' }, o.icon ? iconEl(o.icon, 2) : null, el('div', null, el('b', { text: o.title }), ...(o.lines || []).filter(Boolean).map(l => el('span', { text: l }))), el('div.mg-stars.sm', null, [0, 1, 2].map(k => el('i' + (k < o.stars ? '.on' : '')))));
  e.onclick = () => e.remove(); root().append(e); setTimeout(() => e.classList.add('out'), 4200); setTimeout(() => e.remove(), 4500); return e;
}
function defOf(key, ctx, id) { const gm = BG[key], l = gm.level ? gm.level() : gm.skill ? safe(() => G.skills.level(gm.skill), 1) : 2; return Object.assign({ level: l, title: gm.title(l, ctx, id), icon: gm.icon }, gm.kit(l, ctx, id)); }
/** open game `key` over the running activity `a` (default: G.busy). Returns the session, or null when nothing was opened (mini-games off, no such game, not busy). */
function ride(key, ctx = {}, a = G.busy) {
  const gm = BG[key]; if (!gm || !a || G.busy !== a || auto() || (ctx && ctx.noMini)) return null;
  const me = cur = { key, ctx, act: a, q: null, played: false, stats: {}, open: true }, rate0 = a.rate, d0 = a.done, c0 = a.cancel;
  const shut = () => { if (me.open) { me.open = false; if (cur === me) cur = null; if (MG.cur) abort(); camBack(); } };
  a.rate = Math.min(a.rate, Math.max(.02, a.minutes / TUNE_B.slowSecs));
  a.done = () => { shut(); d0 && d0(); if (!me.played) return; let out = { title: gm.title(1, ctx), lines: [] }; try { out = gm.result({ q: me.q, played: true, stats: me.stats, ctx, sess: me }) || out; } catch (e) { console.warn('mini-games B: ' + e.message); }
    card({ icon: out.icon || gm.icon, title: out.title, lines: out.lines, stars: starsOf(me.q) }); if (starsOf(me.q) === 3) safe(() => G.needs.addMoodlet('in_the_zone'), 0); };
  a.cancel = () => { shut(); c0 && c0(); };
  const pr = play(defOf(key, ctx, a.actId)); requestAnimationFrame(() => requestAnimationFrame(() => { if (me.open) camShift(); }));
  pr.then(res => {
    camBack(); const was = me.open; me.open = false; if (cur === me) cur = null; if (!was || G.busy !== a) return;
    if (res.quit) return G.endActivity(false);
    if (res.auto) { a.rate = rate0; return; }
    me.played = true; me.q = res.score; me.stats = res.stats || {}; try { gm.onScore && gm.onScore(me); } catch (e) { console.warn('mini-games B: ' + e.message); }
    a.rate = Math.max(rate0, a.left / TUNE_B.whoosh);
  }).catch(e => console.warn('mini-games B: ' + e.message));
  return me;
}
/** MG-B HOOK (laundry.js): a wash was just started. With mini-games on you load the machine yourself (a short activity + the sort game); off = nothing, exactly as before. */
function wash(load) { if (!load || auto() || G.busy || !G.player) return null; const a = G.startActivity({ label: 'Loading the machine', anim: 'work', minutes: TUNE_B.loadMinutes, rate: 3 }); return ride('sort', { load }, a); }
async function demo(key, ctx = {}) { if (!BG[key]) return null; const pr = play(defOf(key, ctx, null)); requestAnimationFrame(() => requestAnimationFrame(camShift)); const res = await pr; camBack(); return res; }

export function initGames() {
  const sp = G.skillplay;
  if (sp && sp.GAMES) {
    for (const k in BG) if (BG[k].skill) sp.GAMES[k] = BG[k];
    for (const id in ACT_GAME_B) if (sp.GAMES[ACT_GAME_B[id]]) GAME_FOR[id] = ACT_GAME_B[id];
    /* 7. fishing: the existing game was the reel only; it is now cast, wait for the bite, reel (same key, same result, so the coach and the date get it too) */
    if (sp.GAMES.fish) sp.GAMES.fish.kit = () => ({ kind: 'cast', icon: 'skill.fishing', hint: 'Tap to cast when the marker is in the green. Wait. Tap when the float dips. Then hold to reel and let go to give line.', verdicts: ['It got away', 'A nibble', 'Landed it', 'What a catch!'] });
    /* 14. painting: every second session at the easel opens with mixing the colours instead of the brush strokes (same key, same result) */
    const p = sp.GAMES.paint; if (p) { const k0 = p.kit; p.kit = (l, ctx, id, sess) => { const n = safe(() => { const c = sp.state().n; c.mgbPaint = (c.mgbPaint || 0) + 1; return c.mgbPaint; }, 1); return n % 2 ? k0(l, ctx, id, sess) : { kind: 'mix', icon: 'skill.painting', hint: 'Mix the colour on the card: tap the tubes to add drops of red, yellow and blue.', verdicts: ['Mud', 'Close', 'A good match', 'Straight from the tube!'] }; }; }
  }
  G.on('activity', a => { try { if (a && a.mgb) ride(a.mgb, a.mgbCtx || {}, a); } catch (e) { console.warn('mini-games B: ' + e.message); } });
  G.on('activity:start', (id, ctx) => { try { const k = ACT_GAME_B[id]; if (k && BG[k] && !BG[k].skill) ride(k, ctx || {}); } catch (e) { console.warn('mini-games B: ' + e.message); } });
  G.on('load', () => { if (cur) { cur.open = false; cur = null; } camBack(); });
  G.mgB = { ride, wash, demo, games: BG, acts: ACT_GAME_B, current: () => cur, tune: TUNE_B };
}
