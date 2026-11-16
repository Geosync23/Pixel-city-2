// _jobplay_games.js — the distinctive PLAY of each job (design: story/jobs_new.js PLAYS, docs/story/JOBS.md section 3). Kit: _jobplay_kit.js.
//
//   PLAY[jobId] = async (ctx, env) => score 0..1         env = { level, weather, lvl(skill) }
//   STATION[jobId] = the station tag where the play's ticket appears (a station of the job's work loop)
//   playFor(jobId) -> fn | null          A job without an entry here runs on its ordinary tickets (nothing is lost but the flavor).
//
// REUSED mini-games: line_cook (the flip rings), fitness_trainer (balance + timing), bartender (pour), retail_associate (outfit sort), hair_stylist (trace),
//   observatory_guide (focus ring / show cues), florist (wrap timing), barista (lever timing), dock_worker level 3 (fork timing). The hotel's play asks the
//   navigator (G.nav.find) for real places, as the concierge does, and marks the ones the player has discovered.
// ONE "put it in the right order" game (ctx.order) with six skins: grocery_clerk, dock_worker, librarian, nurse, courier (a route), aquarist.
// OWN small games: gate_agent (passes), baggage_handler (belt), station_agent (doors), museum_guide (the group), gull_cook (timers), office_analyst (the odd
//   number), barista (regulars).
import { G } from '../core/game.js';
import { el } from '../ui/kit.js';
import { UI } from '../ui/chapters_ui.js';
import { charArt } from '../core/char.js';
import { rng } from '../engine/raster.js';
import { shuffle, sample, pickOf, mean } from './_jobplay_kit.js';
import { who } from './_jobstory_cast.js';

const safe = (f, d) => { try { const v = f(); return v === undefined || v === null ? d : v; } catch (e) { return d; } };
const O = (t, v, say, sub) => ({ t, v, say, sub });
const face = seed => safe(() => charArt().randomSpec(rng(seed), { season: 0, age: seed % 5 === 0 ? 'elder' : 'adult' }), null);

/* ------------------------------------------------------------------ existing jobs */

/* BARISTA — The Regulars: strangers show the drink, regulars show only a face (you learn each the first time). Then one pull of the lever. */
const REGULARS = [['lindgren', 'Mr. Lindgren', 'Cortado, no sugar'], ['suki', 'Suki', 'Oat flat white, extra hot'], [null, 'The bus driver on his break', 'Black coffee, two sugars', 4107], [null, 'The woman with the cello case', 'Mocha, no cream', 5203], [null, 'The man who reads the tide table', 'Tea with lemon', 6305]];
const DRINKS = ['Cortado, no sugar', 'Oat flat white, extra hot', 'Black coffee, two sugars', 'Mocha, no cream', 'Tea with lemon', 'Latte', 'Americano', 'Hot chocolate', 'Iced tea'];
async function barista(ctx, env) {
  const known = env.mem.known || (env.mem.known = {}), got = [], line = shuffle([0, 1, 2, 3, 4, 's', 's']).slice(0, 6);
  for (const c of line) {
    if (c === 's') { const d = pickOf(DRINKS.slice(5)); got.push(await ctx.pick({ who: { spec: face(900 + Math.floor(Math.random() * 400)), name: 'A stranger' }, prompt: '"' + d + ', please."', options: [O(d, 1), ...sample(DRINKS.filter(x => x !== d), 3).map(x => O(x, 0))], cols: 2, secs: 9, yes: 'Coming up.', no: 'They asked for the ' + d.toLowerCase() + '.' })); continue; }
    const r = REGULARS[c], w = { spec: r[0] ? who(r[0]).spec : face(r[3]), name: r[1] };
    if (!known[c]) { known[c] = 1; got.push(await ctx.pick({ who: w, prompt: ['A regular. You have not served this one before.', '"The usual. ' + r[2] + '."'], hint: 'Remember the face: next time there will be no words.', options: [O(r[2], 1), ...sample(DRINKS.filter(x => x !== r[2]), 3).map(x => O(x, 0))], cols: 2, secs: 12, yes: 'Noted. Face first, name later.' })); }
    else got.push(await ctx.pick({ who: w, prompt: '(A nod. A look at the machine. Nothing else.)', options: [O(r[2], 1, 'Before they said a word.'), ...sample(DRINKS.filter(x => x !== r[2]), 3).map(x => O(x, 0, 'They tell you, kindly: ' + r[2].toLowerCase() + '.'))], cols: 2, secs: 9 }));
  }
  const lever = await ctx.mg({ kind: 'timing', title: 'The Duchess', hint: 'Watch the needle, not the clock. Let go in the green.', icon: 'skill.cooking', o: { rounds: 2, zone: .3 }, level: Math.min(8, 1 + env.level * 2) });
  return mean(...got) * .7 + lever * .3;
}

/* GROCERY CLERK — Heavy to Light (order skin 1) */
const GROC = [['Tinned tomatoes', 'heavy', 1], ['Potatoes', 'heavy', 1], ['A bag of rice', 'heavy', 1], ['Milk', 'cold', 2], ['Butter', 'cold', 2], ['Apples', 'firm', 3], ['Cereal box', 'light', 4], ['Bread', 'soft', 5], ['Peaches', 'soft', 5], ['Eggs', 'on top, always', 6]];
async function grocery(ctx) {
  const a = await ctx.order({ prompt: ['Lane two. A paper bag and six things coming down the belt.', 'Heavy low, cold with cold, soft high, eggs last.'], items: sample(GROC, 6).map(g => ({ t: g[0], sub: g[1], k: g[2] })), first: 'Bottom of the bag', last: 'Top', secs: 45, yes: 'A bag that stands up by itself.', no: 'Bread under tins. Repacked, with a small sigh.' });
  const b = await ctx.pick({ prompt: '"Do you know where the capers are?"', options: [O('Aisle six, with the pickles, bottom shelf.', 1, 'Hollis nods from the stockroom door.'), O('We do not sell capers.', 0, 'You do. Aisle six.'), O('Ask at the till.', .3, 'You are at the till.')], secs: 10 });
  return a * .75 + b * .25;
}

/* LINE COOK — The Rail: four calls in diner shorthand, then the grill rings (the existing flip game) */
const CALLS = [['Adam and Eve on a raft', 'Two poached eggs on toast'], ['Burn one', 'A burger, well done'], ['Short stack', 'Three pancakes'], ['Wreck two', 'Two eggs, scrambled'], ['BLT, hold the grass', 'Bacon and tomato, no lettuce'], ['Cluck and grunt', 'Eggs and bacon'], ['Mayo in the alley', 'Mayonnaise on the side'], ['Blue plate', 'The special of the day']];
async function lineCook(ctx, env) {
  const calls = sample(CALLS, 4), got = [], lor = who('lorraine');
  for (const c of calls) got.push(await ctx.pick({ who: lor, prompt: '"' + c[0] + '!"', options: [O(c[1], 1), ...sample(CALLS.filter(x => x !== c), 2).map(x => O(x[1], 0))], secs: 8, yes: 'On the rail.', no: 'Tee, at the sink, says quietly: ' + c[1].toLowerCase() + '.' }));
  const grill = await ctx.skill('flip');
  return mean(...got) * .5 + grill * .5;
}

/* OFFICE ANALYST — The Odd Number: three small tables */
function sumTable() {
  const rows = ['Rent', 'Wages', 'Post', 'Sundry'], cells = [{ t: '', head: 1 }, { t: 'Jan', head: 1 }, { t: 'Feb', head: 1 }, { t: 'Total', head: 1 }], bad = Math.floor(Math.random() * 4);
  rows.forEach((r, i) => { const a = 20 + Math.floor(Math.random() * 60), b = 20 + Math.floor(Math.random() * 60); cells.push({ t: r, head: 1 }, { t: String(a) }, { t: String(b) }, { t: String(a + b + (i === bad ? pickOf([10, -10, 1]) : 0)), odd: i === bad }); });
  return { prompt: 'One total does not add up.', cols: 4, cells, secs: 30, yes: 'Found. Good. Not finished. But good.', no: 'Lucia colors it pink for you.' };
}
function monthTable() {
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], dup = 1 + Math.floor(Math.random() * 6), cells = [];
  m.forEach((x, i) => cells.push({ t: (i === dup ? m[dup - 1] : x) + '  ' + (300 + Math.floor(Math.random() * 400)), odd: i === dup }));
  return { prompt: 'A month appears twice. Tap the second one.', cols: 2, cells, secs: 25, yes: 'There it is. Somebody filed the same month twice.', no: 'Read the months, not the money.' };
}
function sevensTable() {
  const cells = [], bad = Math.floor(Math.random() * 3); ['Tram', 'Lunch', 'Paper'].forEach(x => cells.push({ t: x, head: 1 }));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { let n = 11 + Math.floor(Math.random() * 80); if (c === bad) n = Math.floor(n / 10) * 10 + 7; else if (n % 10 === 7) n++; cells.push({ t: String(n), odd: c === bad }); }
  return { prompt: 'One column was made up at a desk: every figure in it ends the same way. Tap any figure in it.', cols: 3, cells, secs: 25, yes: 'A row of sevens. Nobody spends in sevens.', no: 'Look at the last digits.' };
}
async function analyst(ctx) { const a = await ctx.grid(sumTable()), b = await ctx.grid(monthTable()), c = await ctx.grid(sevensTable()); return mean(a, b, c); }

/* COURIER — Five Drops (order skin 5: a route on a small map) */
async function courier(ctx) {
  const W = 300, H = 170, pts = [{ x: 150, y: 150, n: 'Depot' }]; const NAMES = shuffle(['Lantern Row 4', 'Thimble St 12', 'Market St 30', 'Pier Road 2', 'Hillcrest 81', 'Sycamore Ln 7', 'Quay 9']);
  while (pts.length < 6) { const p = { x: 24 + Math.random() * (W - 48), y: 16 + Math.random() * (H - 60), n: NAMES[pts.length] }; if (pts.every(q => Math.hypot(q.x - p.x, q.y - p.y) > 50 && Math.abs(q.y - p.y) + Math.abs(q.x - p.x) / 4 > 24)) pts.push(p); }
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), len = seq => { let s = 0, at = pts[0]; for (const i of seq) { s += d(at, pts[i]); at = pts[i]; } return s + d(at, pts[0]); };
  let best = 1e9; (function perm(a, rest) { if (!rest.length) { best = Math.min(best, len(a)); return; } for (let i = 0; i < rest.length; i++) perm(a.concat(rest[i]), rest.filter((_, k) => k !== i)); })([], [1, 2, 3, 4, 5]);
  return ctx.live({ hint: 'Five drops and back to the depot. Tap the addresses in the order you would ride them: shortest loop wins.', pause: 1500, setup(api) {
    const seq = [], cv = el('canvas.jp-map', { width: W, height: H }), g = cv.getContext('2d'), out = el('div.jp-dist'), undo = el('button.jp-b', { text: 'Undo', onclick: () => { seq.pop(); draw(); } });
    const draw = () => { g.fillStyle = '#e9dcc0'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d2c3a2'; g.lineWidth = 6; for (let x = 30; x < W; x += 54) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 26; y < H; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.strokeStyle = '#c8483b'; g.lineWidth = 3; g.beginPath(); g.moveTo(pts[0].x, pts[0].y); for (const i of seq) g.lineTo(pts[i].x, pts[i].y); if (seq.length === 5) g.lineTo(pts[0].x, pts[0].y); g.stroke();
      pts.forEach((p, i) => { const k = seq.indexOf(i); g.fillStyle = i === 0 ? '#2a2733' : k >= 0 ? '#c8483b' : '#3b6fd0'; g.beginPath(); g.arc(p.x, p.y, i === 0 ? 8 : 11, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i === 0 ? 'D' : k >= 0 ? String(k + 1) : '', p.x, p.y + 1); g.fillStyle = '#2a2733'; g.font = '10px sans-serif'; g.fillText(p.n, Math.max(34, Math.min(W - 34, p.x)), p.y + (p.y > H - 30 ? -17 : 19)); });
      cv.dataset.pts = JSON.stringify(pts.map(p => [Math.round(p.x), Math.round(p.y)])); out.textContent = seq.length ? 'Loop so far: ' + Math.round(len(seq) * 3) + ' m' : 'Start anywhere.'; };
    cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H; let hit = -1, hd = 26; pts.forEach((p, i) => { const q = Math.hypot(p.x - x, p.y - y); if (i && q < hd && !seq.includes(i)) { hd = q; hit = i; } }); if (hit < 0) return; seq.push(hit); draw();
      if (seq.length === 5) { const r2 = best / len(seq), sc = r2 >= .985 ? 1 : r2 >= .9 ? .8 : r2 >= .8 ? .6 : .35; api.note(sc >= 1 ? 'The shortest loop. Dez is quiet about it.' : sc >= .6 ? 'A fair route. ' + Math.round((len(seq) - best) * 3) + ' m longer than the best one.' : 'You crossed your own path. Sal draws the better way on an index card.', sc >= 1 ? 'ok' : sc >= .6 ? 'mid' : 'no'); api.finish(sc); } });
    api.time(40, () => { api.note('The van is waiting. Sal picks the order for you.', 'no'); api.finish(.3); }); draw(); return [cv, el('div.jp-row', null, out, undo)]; } });
}

/* FITNESS TRAINER — The Encouraging Zone: hold the push in the moving band (balance), then call the last reps (timing) */
async function trainer(ctx, env) {
  const a = await ctx.mg({ kind: 'balance', title: 'The Encouraging Zone', hint: 'Hold to push, let go to ease off. Keep the needle in the green: too hard and they wilt, too soft and they stall.', icon: 'skill.fitness', o: { secs: 26 }, level: 1 + env.level });
  const b = await ctx.mg({ kind: 'timing', title: 'Call the last three', hint: 'Say "one more" at the top of the lift: tap in the green.', icon: 'skill.fitness', o: { rounds: 3 }, level: 1 + env.level });
  return a * .6 + b * .4;
}

/* LIBRARIAN — By the Number (order skin 3) + a reference riddle */
const RIDDLES = [['"It is blue. There is a dog. I read it in a tent."', 'Harbor Dog (blue cloth, 1974)', ['A Field Guide to Dogs', 'The Blue Hour: Poems']], ['"The one about the lighthouse. Not the famous one. The funny one."', 'Ninety-Seven Steps and a Sandwich', ['Lighthouses of the World', 'The Keeper\'s Almanac']], ['"A cookbook, but it is mostly about her mother."', 'Lantern Row Recipes', ['Bake It Easy', 'Soups for Sixty']], ['"My grandson wants the one with the tram on the cover."', 'The 14 Goes to Sea', ['A History of Maple Bay', 'Timetables 1924']]];
async function librarian(ctx) {
  const nums = sample([152.4, 248.1, 331.7, 398.2, 510, 551.6, 599.9, 612.3, 641.5, 641.59, 720.4, 796.3, 811, 914.2], 6);
  const a = await ctx.order({ prompt: ['The returns trolley. Six spines.', 'Shelve by the number, lowest first. 641.5 comes before 641.59.'], items: nums.map(n => ({ t: String(n), sub: n < 200 ? 'Mind' : n < 400 ? 'People' : n < 600 ? 'Science' : n < 700 ? 'How to' : n < 800 ? 'Arts' : 'Stories & places', k: n })), first: 'Left end of the shelf', last: 'Right end', secs: 50, yes: 'In order. Ms. Castillo does not look up, which is praise.', no: 'A 641.5 among the 600s. One eyebrow goes up.' });
  const r = pickOf(RIDDLES), b = await ctx.pick({ prompt: ['A patron at the desk:', r[0]], options: [O(r[1], 1, 'That is the one. They hold it like a found glove.'), ...r[2].map(x => O(x, 0, 'Close. It was "' + r[1] + '".'))], secs: 14 });
  return a * .7 + b * .3;
}

/* NURSE — Who First, and a Pulse (order skin 4 + a beat count) */
const WAITING = [['A man holding his chest, very quiet', 'grey, sweating, says he is fine', 1], ['A child with a bead up her nose', 'cheerful about it', 3], ['A cook with a cut hand', 'wrapped in a tea towel, dripping', 2], ['A runner with a twisted ankle', 'ice already on it', 4], ['A woman who cannot catch her breath', 'lips a little blue', 1], ['Somebody for a repeat prescription', 'reading the noticeboard', 5], ['A boy who fell off a wall', 'awake, talking, a bump on the head', 2]];
async function nurse(ctx) {
  const four = []; for (const w of shuffle(WAITING)) if (four.length < 4 && !four.some(x => x[2] === w[2])) four.push(w);
  const a = await ctx.order({ prompt: ['Four people in the waiting room.', 'Who goes in first? The loudest is not always the sickest.'], items: four.map(w => ({ t: w[0], sub: w[1], k: w[2] })), first: 'Seen first', last: 'Can wait', secs: 45, yes: 'The quiet one who needed to go first went first.', no: 'Samira reorders the cards without comment, and shows you why.' });
  const bpm = pickOf([54, 60, 66, 72, 78, 84]), secs = 10;
  const b = await ctx.live({ hint: 'Take a pulse: tap the button on every beat for ten seconds.', pause: 1600, setup(api) {
    let n = 0, on = false, t0 = 0; const heart = el('div.jp-heart', { 'data-bpm': bpm, text: '♥' }), btn = el('button.jp-go.jp-tap', { 'data-jp': 'tap', text: 'Start counting', onclick: () => { if (!on) { on = true; t0 = performance.now(); btn.textContent = 'Beat'; api.time(secs, stop); return; } n++; btn.classList.toggle('alt'); } });
    const off = api.every(60000 / bpm, () => { heart.classList.add('beat'); setTimeout(() => heart.classList.remove('beat'), 160); });
    const stop = () => { off(); const real = Math.round(bpm * secs / 60), err = Math.abs(n - real); btn.disabled = true; api.note(`You counted ${n} in ten seconds: ${n * 6} a minute. It was ${real * 6}.` + (err <= 1 ? ' Good hands.' : ' Samira takes it again with you.'), err <= 1 ? 'ok' : err <= 3 ? 'mid' : 'no'); api.finish(err <= 1 ? 1 : err <= 2 ? .75 : err <= 4 ? .5 : .2); };
    return [el('div.jp-card', null, el('div', null, el('p', { text: 'Two fingers on the wrist. Watch the heart, count with your thumb.' }))), heart, btn]; } });
  return a * .6 + b * .4;
}

/* DOCK WORKER — Heavy Low, Labels Out (order skin 2); from level 3 the forks on a timing bar */
const CRATES = [['Anchor chain', 480], ['Tinned sardines', 320], ['Machine parts', 410], ['Rope, coiled', 150], ['Oranges', 220], ['Lamp glass', 60], ['Wool bales', 90], ['Paint, 20 tins', 260], ['Tea chests', 120]];
async function dock(ctx, env) {
  const a = await ctx.order({ prompt: ['Six crates for one pallet.', 'Heavy low, light high. Nothing overhangs, labels out.'], items: sample(CRATES, 6).map(c => ({ t: c[0], sub: c[1] + ' kg', k: -c[1] })), first: 'Bottom of the pallet', last: 'Top', secs: 45, yes: 'A square pallet. Gus says nothing, which is the review.', no: 'It leans. You restack it yourself.' });
  if (env.level < 3) return a;
  const b = await ctx.mg({ kind: 'timing', title: 'Forks into the slot', hint: 'Ease forward. Stop when the forks line up: tap in the green.', icon: 'skill.handiness', o: { rounds: 2 }, level: 4 });
  return a * .7 + b * .3;
}

/* BARTENDER — Read the Room: three guests, each wants a drink, water, or a minute of listening; a drink is then poured (the existing pour game) */
const GUESTS = [['Tie loosened, phone face-up, has not touched the beer.', 'listen', '"Long day?" He talks for a while. It helps.'], ['Laughing with two friends, empty glass held up like a flag.', 'drink', 'Another round, and quick.'], ['Just off a shift, red in the face, drank the last one in two swallows.', 'water', 'A glass of water, set down without a word. A grateful nod.'], ['Good coat, one glove on the bar, looking at the door and not at the menu.', 'listen', 'You ask who she is waiting for. It is a long story and a good one.'], ['Reading the cocktail list with a finger, lips moving.', 'drink', 'You make the one her finger stopped on.'], ['Third night running, the same stool, the same order, slower every time.', 'water', 'Water, and the kitchen\'s last bowl of soup. He does not argue.']];
const SERVE = { drink: 'Make them a drink', water: 'A glass of water', listen: 'A minute of listening' };
async function bartender(ctx) {
  const got = []; let drink = false;
  for (const g of sample(GUESTS, 3)) { const v = await ctx.pick({ prompt: ['At the bar:', g[0]], keep: true, options: Object.keys(SERVE).map(k => O(SERVE[k], k === g[1] ? 1 : k === 'drink' && g[1] !== 'drink' ? 0 : .4, k === g[1] ? g[2] : k === 'drink' ? 'A beautiful drink, for someone who needed something else.' : 'Kind. Not quite what they came for.')), secs: 12, pause: 1900 }); got.push(v); if (g[1] === 'drink') drink = true; }
  const pour = drink ? await ctx.skill('pour') : await ctx.mg({ kind: 'aim', title: 'One for the tip jar', hint: 'Hold to pour. Let go at the line.', icon: 'skill.mixology', o: { mode: 'pour', shots: 2 } });
  return mean(...got) * .65 + pour * .35;
}

/* ------------------------------------------------------------------ new jobs */

/* GATE AGENT — Name, Flight, Gate: eight passes against the board, then the rows in order */
const NAMES = ['OKAFOR / A', 'LIM / P', 'BEAUMONT / L', 'REYES / C', 'TRAN / W', 'ABARA / J', 'NILSEN / B', 'PARK / S', 'OSEI / W', 'GALE / W', 'MILLS / D'];
async function gate(ctx) {
  const fl = 'MB' + (210 + Math.floor(Math.random() * 60)), gt = 'B3', day = safe(() => G.now().weekdayName, 'Thu'), days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], yest = days[(days.indexOf(day) + 6) % 7];
  const N = 8, badAt = sample([...Array(N).keys()], 2 + (Math.random() < .5 ? 1 : 0));
  const passes = sample(NAMES, N).map((n, i) => { const p = { name: n, fl, gt, day, bad: null }; if (badAt.includes(i)) { const k = pickOf(['gate', 'day', 'flight']); if (k === 'gate') { p.gt = pickOf(['B2', 'B5', 'B6']); p.bad = 'This pass is for gate ' + p.gt + '.'; } else if (k === 'day') { p.day = yest; p.bad = 'Right flight, wrong day: ' + yest + '.'; } else { p.fl = 'MB' + (310 + Math.floor(Math.random() * 60)); p.bad = 'That is flight ' + p.fl + ', not ours.'; } } return p; });
  const a = await ctx.live({ hint: `Your flight: ${fl} · gate ${gt} · ${day}. Board the right passes, stop the wrong ones.`, pause: 1100, setup(api) {
    let i = 0, right = 0, busy = false; const card = el('div.jp-pass'), prog = el('div.jp-dist');
    const show = () => { const p = passes[i]; card.className = 'jp-pass'; card.dataset.bad = p.bad ? 1 : 0; card.replaceChildren(el('small', { text: 'BOARDING PASS' }), el('b', { text: p.name }), el('div.jp-row', null, el('span', { text: 'Flight ' + p.fl }), el('span', { text: 'Gate ' + p.gt }), el('span', { text: p.day }))); prog.textContent = `Pass ${i + 1} of ${N}`; api.time(6.5, () => act(null)); };
    const act = ok => { if (busy) return; busy = true; const p = passes[i], good = ok !== null && (ok ? !p.bad : !!p.bad); if (good) right++; card.classList.add(good ? 'ok' : 'no'); api.note(good ? (p.bad ? p.bad + ' Caught, kindly.' : '') : ok === null ? 'The line is backing up.' : p.bad ? p.bad + ' It went through.' : 'That pass was fine.', good ? 'ok' : 'no'); api.time(0);
      api.after(p.bad || !good ? 1150 : 380, () => { busy = false; i++; if (i >= N) return api.finish(right / N); api.note(''); show(); }); };
    show(); return [card, el('div.jp-opts.two', null, el('button.jp-opt', { 'data-jp': 'stop', text: 'Stop them', onclick: () => act(false) }), el('button.jp-opt.pri', { 'data-jp': 'board', text: 'Board', onclick: () => act(true) })), prog]; } });
  const b = await ctx.order({ prompt: ['The microphone.', 'Call them so the aisle never jams: those who need time first, then the back of the plane forward.'], items: [{ t: 'Families and anyone who needs a minute', k: 0 }, { t: 'Rows 21 to 30', k: 1 }, { t: 'Rows 11 to 20', k: 2 }, { t: 'Rows 1 to 10', k: 3 }], first: 'First call', last: 'Last call', secs: 30, yes: 'An aisle that never jams.', no: 'Row 9 boards with row 29. Connie smiles before she speaks.' });
  return a * .7 + b * .3;
}

/* BAGGAGE HANDLER — Read the Tag, Not the Bag: the belt speeds up; the bag's color lies, the tag does not; odd shapes go to oversize */
const TAGC = [['red', '#d8483b', 'Carousel 1'], ['blue', '#3b6fd0', 'Carousel 2'], ['yellow', '#e8b83a', 'Carousel 3']], ODD = ['A pair of skis', 'A cello', 'A surfboard', 'A floor lamp', 'A rolled carpet'], BAGS = ['Hard case', 'Duffel', 'Rucksack', 'Holdall', 'Trunk', 'Suitcase'];
async function baggage(ctx) {
  const N = 22;
  return ctx.live({ hint: 'Send each bag where its TAG says. Odd shapes go to Oversize, whatever the tag.', pause: 1300, setup(api) {
    let i = 0, right = 0, cur = null, lock = false; const bag = el('div.jp-bag'), tag = el('i.jp-tag'), name = el('b'), prog = el('div.jp-dist');
    const next = () => { if (i >= N) { api.note(right >= N ? 'None wrong. Lena finishes a clue.' : right >= N * .7 ? `${right} of ${N} on the right belt.` : 'A set of skis went round carousel one. Three times.', right >= N * .85 ? 'ok' : right >= N * .55 ? 'mid' : 'no'); return api.finish(right / N); }
      const odd = Math.random() < .16, t = Math.floor(Math.random() * 3), body = (t + 1 + Math.floor(Math.random() * 2)) % 3; cur = { want: odd ? 3 : t }; bag.dataset.want = cur.want;
      bag.style.background = TAGC[body][1]; bag.classList.toggle('odd', odd); bag.classList.remove('go'); void bag.offsetWidth; bag.classList.add('go'); tag.style.background = TAGC[t][1]; name.textContent = odd ? pickOf(ODD) : pickOf(BAGS);
      const secs = Math.max(1.5, 3.4 - i * .09); bag.style.animationDuration = secs + 's'; prog.textContent = `Bag ${i + 1} of ${N}`; lock = false; api.time(secs, () => send(-1)); };
    const send = k => { if (lock || !cur) return; lock = true; api.time(0); const ok = k === cur.want; if (ok) right++; api.note(ok ? '' : k < 0 ? 'It went round again.' : 'Wrong belt: the tag said ' + (cur.want === 3 ? 'Oversize' : TAGC[cur.want][2]) + '.', ok ? 'ok' : 'no'); i++; api.after(ok ? 140 : 600, next); };
    bag.append(tag, name); next();
    return [el('div.jp-belt', null, bag), el('div.jp-opts.two', null, ...TAGC.map((c, k) => el('button.jp-opt', { 'data-jp': 'c' + k, style: { borderColor: c[1] }, onclick: () => send(k) }, el('span', { text: c[2] }), el('small', { text: c[0] + ' tag' }))), el('button.jp-opt', { 'data-jp': 'c3', onclick: () => send(3) }, el('span', { text: 'Oversize' }), el('small', { text: 'odd shapes' }))), prog]; } });
}

/* STATION AGENT — Along the Train: watch every door, not the nearest; flag up when the last one is shut */
async function station(ctx) {
  const rounds = [];
  for (let r = 0; r < 3; r++) rounds.push(await ctx.live({ hint: 'Watch the doors along the whole train. Raise the flag the moment the last light goes out.', pause: 1500, setup(api) {
    const n = 5 + r, doors = [], t0 = performance.now(); let clearAt = 0, done = false, runner = r === 1 && Math.random() < .8, ran = false;
    const row = el('div.jp-train'); for (let k = 0; k < n; k++) { const d = el('i.jp-door.open', { text: '' }); row.append(d); doors.push({ d, at: 1800 + Math.random() * (4200 + r * 900), shut: false }); }
    doors[Math.floor(Math.random() * n)].at += 1500;
    const flag = el('button.jp-go.jp-flag', { 'data-jp': 'flag', text: 'Raise the flag', onclick: () => { if (done) return; done = true; const now = performance.now();
      if (doors.some(x => !x.shut)) { doors.forEach(x => { if (!x.shut) x.d.classList.add('late'); }); api.note('The flag went up on an open door. The driver waits; so does everyone.', 'no'); return api.finish(.15); }
      const lag = (now - clearAt) / 1000; api.note(lag < .9 ? 'Away on time.' + (ran ? ' With the 6:42 lady aboard.' : '') : lag < 2.2 ? 'Away, a breath late.' : 'The train had been ready for a while.', lag < .9 ? 'ok' : lag < 2.2 ? 'mid' : 'no'); api.finish(lag < .9 ? 1 : lag < 2.2 ? .75 : .5); } });
    const hold = el('div.jp-opts.two');
    api.every(90, () => { if (done) return; const t = performance.now() - t0; let all = true; for (const x of doors) { if (!x.shut && t >= x.at) { x.shut = true; x.d.className = 'jp-door'; } if (!x.shut) all = false; }
      if (all && runner) { runner = false; api.note('Somebody is running down the stairs with an ice box.'); hold.replaceChildren(el('button.jp-opt', { 'data-jp': 'hold', text: 'Hold a beat for her', onclick: () => { hold.replaceChildren(); ran = true; const x = doors[0]; x.shut = false; x.d.className = 'jp-door open'; x.at = performance.now() - t0 + 1700; api.note('"Bless you!" The first door opens again.'); } }), el('button.jp-opt', { 'data-jp': 'nohold', text: 'She will get the next one', onclick: () => { hold.replaceChildren(); api.note(''); clearAt = performance.now(); } })); return; }
      if (all && !clearAt && !hold.childNodes.length) clearAt = performance.now(); else if (!all) clearAt = 0;
      if (clearAt && performance.now() - clearAt > 6000 && !done) { done = true; api.note('The driver leans out and looks at you.', 'no'); api.finish(.35); } });
    return [el('div.jp-card', null, el('div', null, el('p', { text: ['The 6:42, platform 1.', 'The Railyard stopper, platform 2.', 'The Harborside train, platform 1.'][r] }), el('small', { text: 'Lit = open. Dark = shut.' }))), row, hold, flag]; } }));
  return mean(...rounds);
}

/* RETAIL — Dressed for the Day: an occasion and a budget (own small puzzle), then the rails (the existing outfit game) */
const OCC = [['a job interview at the bank', 'smart', 85], ['a first date at the pier', 'easy', 70], ['a hike up to the Lookout', 'outdoor', 75], ['her granddaughter\'s recital', 'smart', 90], ['helping a friend move house', 'outdoor', 55]];
const RAIL = { top: [['Pressed shirt', 'smart', 28], ['Soft knit', 'easy', 24], ['Rain shell', 'outdoor', 34], ['Silk blouse', 'smart', 46], ['Band tee', 'easy', 14]], bottom: [['Dark slacks', 'smart', 32], ['Good jeans', 'easy', 30], ['Trail pants', 'outdoor', 29], ['Pleated skirt', 'smart', 38], ['Cord shorts', 'easy', 19]], extra: [['Leather belt', 'smart', 18], ['Canvas sneakers', 'easy', 22], ['Wool socks', 'outdoor', 9], ['Blazer', 'smart', 55], ['Sun hat', 'outdoor', 16]] };
async function retail(ctx) {
  const o = pickOf(OCC);
  const a = await ctx.live({ hint: 'One from each rail. The tags should suit the day, and the total should fit the budget.', pause: 1700, setup(api) {
    const sel = {}, total = el('b'), go = el('button.jp-go', { 'data-jp': 'done', text: 'To the fitting room', disabled: true, onclick: () => { const picks = Object.values(sel), sum = picks.reduce((a, p) => a + p[2], 0), fit = picks.filter(p => p[1] === o[1]).length, over = sum - o[2];
      const sc = (fit / 3) * (over <= 0 ? 1 : over <= 12 ? .6 : .35); api.note(over > 0 ? `Lovely, and ${over} dollars over. They put one thing back, kindly.` : fit === 3 ? 'Under budget, and they stand differently in the mirror.' : fit === 2 ? 'Nearly. One piece is for a different sort of day.' : 'It fits the budget. It does not fit the day.', sc >= .99 ? 'ok' : sc >= .5 ? 'mid' : 'no'); api.finish(sc); } });
    const upd = () => { const s = Object.values(sel).reduce((a, p) => a + p[2], 0); total.textContent = `$${s} of $${o[2]}`; total.className = s > o[2] ? 'no' : ''; go.disabled = Object.keys(sel).length < 3; };
    const rails = Object.keys(RAIL).map(k => { const opts = sample(RAIL[k].filter(p => p[1] !== o[1]), 2).concat(sample(RAIL[k].filter(p => p[1] === o[1]), 1)); return el('div.jp-rail', null, el('small', { text: k === 'extra' ? 'One more thing' : k[0].toUpperCase() + k.slice(1) + 's' }), el('div.jp-opts.three', null, shuffle(opts).map(p => { const b = el('button.jp-opt', { 'data-tag': p[1], 'data-price': p[2], onclick: () => { sel[k] = p; [...b.parentNode.children].forEach(x => x.classList.toggle('on', x === b)); upd(); } }, el('span', { text: p[0] }), el('small', { text: `${p[1]} · $${p[2]}` })); return b; }))); });
    upd(); return [el('div.jp-card', null, el('div', null, el('p', { text: `A customer: "It is for ${o[0]}. I have ${o[2]} dollars."` }), el('small', { text: 'Wants: ' + o[1] }))), ...rails, el('div.jp-row', null, total, go)]; } });
  const b = await ctx.skill('outfit');
  return a * .6 + b * .4;
}

/* MUSEUM GUIDE — Walking Backwards: four stops, read the group; at one stop the right thing is to say nothing */
const STOPS = [['The Harbour Whale', 'Nine children, one tired teacher. Everyone is looking straight up.', [['"Who can count the ribs before I can?"', 1, 'Nine voices start counting. The teacher mouths: thank you.'], ['"This specimen was acquired in 1931."', .2, 'True. Two children have sat down.'], ['"As you can see, it is very large."', 0, 'A dollar goes in the jar.']]],
  ['Marge the Tyrannosaur', 'Two retired geologists with their own notebooks.', [['"The left femur is a cast. Guess which, and I will tell you how we know."', 1, 'They argue happily for a full minute.'], ['"Dinosaurs lived a very long time ago."', 0, 'A patient look.'], ['"She was found in the clay pits in 1961, by a canteen lady."', .7, 'They write it down.']]],
  ['The harbor paintings', 'A couple who have stopped talking. One of them is looking at the small grey one and has not moved.', [['(Say nothing. Stand a little way off.)', 1, 'A full minute of quiet at the right painting. That is the tour.'], ['"This artist used a palette knife, as you can see."', 0, 'The moment goes. A dollar goes in the jar.'], ['"Shall we move on? There is a lot to get through."', .1, 'They move on. One looks back.']]],
  ['The city model', 'A family with tired feet and a boy who has found the button.', [['"Press it on the hour and watch where the lights come on first."', 1, 'They all crouch. Even the feet forget themselves.'], ['"Please do not touch the model."', .1, 'The button is there to be pressed.'], ['"The scale is one to six hundred."', .4, 'The father nods. The boy presses the button anyway.']]],
  ['The dig pit', 'Three teenagers pretending not to be interested.', [['"There is a real tooth in there somewhere. Nobody has found it this week."', 1, 'Three brushes are taken, casually.'], ['"The dig pit is for younger visitors."', 0, 'They leave, and they were the right age for it.'], ['"Dinosaurs are cool, right?"', .2, 'A silence you will remember.']]],
  ['The tram of 1924', 'An old man in a station coat, hand on the brass rail.', [['"Did you ride it?" And then you wait.', 1, 'He did. Twenty minutes later the whole group knows the 14 by heart.'], ['"This tram ran from 1924 to 1958."', .4, 'He knows. He was on it.'], ['"Mind the rail, please, sir."', 0, 'He takes his hand away. You wish he had not.']]]];
async function museum(ctx) {
  const got = []; for (const s of sample(STOPS, 4)) got.push(await ctx.pick({ prompt: [s[0] + '.', s[1]], options: s[2].map(o => O(o[0], o[1], o[2])), secs: 14, pause: 2000, hint: 'Who are they? Say the thing that is for them.' }));
  return mean(...got);
}

/* FLORIST — Three Kinds and No More: a card, one focal flower, one filler, one green; then paper, twist, ribbon */
const CARDS = [['For a grandmother who is eighty today', 'joy', 'yellow', 'Tulips'], ['For somebody in the hospital on Quay Street', 'gentle', 'white', 'Ranunculus'], ['For an apology that is three days late', 'plain', 'white', 'Stock'], ['For a first night at the Playhouse', 'bold', 'red', 'Peonies'], ['For a kitchen table, no reason', 'easy', 'pink', 'Sweet peas']];
const FOCAL = [['Tulips', 'yellow'], ['Ranunculus', 'white'], ['Stock', 'white'], ['Peonies', 'red'], ['Sweet peas', 'pink'], ['Dahlias', 'orange']], FILL = [['Wax flower', 'white'], ['Statice', 'purple'], ['Feverfew', 'white'], ['Solidago', 'yellow'], ['Astrantia', 'pink'], ['Hypericum', 'red']], GREEN = ['Eucalyptus', 'Fern', 'Ruscus', 'Pittosporum'];
async function florist(ctx) {
  const c = pickOf(CARDS);
  const a = await ctx.live({ hint: 'Three kinds and no more: one flower to look at, one to fill, one green.', pause: 1700, setup(api) {
    const sel = {}, go = el('button.jp-go', { 'data-jp': 'done', text: 'Tie it', disabled: true, onclick: () => { const f = sel.focal, fl = sel.fill, sc = (f[0] === c[3] ? .5 : f[1] === c[2] ? .35 : .1) + (fl[1] === c[2] || fl[1] === 'white' ? .3 : .1) + .2;
      api.note(sc >= .95 ? 'It says what the card asked. Pet says "Hm", approvingly.' : sc >= .6 ? 'Pretty. Pet moves one stem a finger\'s width and says nothing.' : 'It is a bunch of flowers. It is not yet an answer to the card.', sc >= .95 ? 'ok' : sc >= .6 ? 'mid' : 'no'); api.finish(sc); } });
    const group = (k, title, list) => el('div.jp-rail', null, el('small', { text: title }), el('div.jp-opts.three', null, list.map(p => { const b = el('button.jp-opt', { 'data-k': k, 'data-n': p[0], onclick: () => { sel[k] = p; [...b.parentNode.children].forEach(x => x.classList.toggle('on', x === b)); go.disabled = !(sel.focal && sel.fill && sel.green); } }, el('span', { text: p[0] }), p[1] ? el('small', { text: p[1] }) : null); return b; })));
    const foc = shuffle([FOCAL.find(f => f[0] === c[3]), ...sample(FOCAL.filter(f => f[0] !== c[3] && f[1] !== c[2]), 2)]), fil = shuffle([FILL.find(f => f[1] === c[2]) || FILL[0], ...sample(FILL.filter(f => f[1] !== c[2] && f[1] !== 'white'), 2)]);
    return [el('div.jp-card', null, el('div', null, el('p', { text: 'The order card: "' + c[0] + '."' }), el('small', { text: `It should say: ${c[1]}. Color: ${c[2]}.` }))), group('focal', 'To look at', foc), group('fill', 'To fill', fil), group('green', 'Green', sample(GREEN, 3).map(g => [g, ''])), go]; } });
  const b = await ctx.mg({ kind: 'timing', title: 'Paper, twist, ribbon', hint: 'Three taps: fold the paper, twist, pull the ribbon. Each in the green.', icon: 'skill.gardening', o: { rounds: 3 }, level: 2 });
  return a * .65 + b * .35;
}

/* AQUARIST — The Morning Round (order skin 6): fill the tray from the card, then feed in the order on the card */
const DIET = [['The penguins', 'Herring', ['Sprats', 'Squid', 'Lettuce']], ['The sea turtle', 'Lettuce and shrimp', ['Herring', 'Krill', 'Mussels']], ['The octopus', 'Crab, in the jar with the lid on', ['Lettuce', 'Flakes', 'Sprats']], ['The seahorses', 'Krill, a pinch', ['Squid', 'Herring', 'Crab']]];
const PENGUINS = ['Pebble (the shy one)', 'Admiral', 'Biscuit', 'Dot', 'Fog', 'Gus (the greedy one)'];
async function aquarist(ctx) {
  const got = []; for (const d of sample(DIET, 2)) got.push(await ctx.pick({ prompt: ['The diet card:', d[0] + '.'], options: [O(d[1], 1, 'Right food, right tray.'), ...sample(d[2], 2).map(x => O(x, 0, 'Dr. Reyes enters it as "a learning opportunity".'))], secs: 10 }));
  const b = await ctx.order({ prompt: ['Feeding the six by hand.', 'The card says: the shy one first, then the others by name, A to Z, and the greedy one LAST.'], items: PENGUINS.map((p, i) => ({ t: p, k: i })), first: 'First fish', last: 'Last fish', secs: 40, yes: 'Right food, right order, and the shy one ate.', no: 'Greedy Gus ate twice. He is not sorry.' });
  return mean(...got) * .45 + b * .55;
}

/* GULL COOK — All Together: start three (then four) dishes so they finish in the same two seconds */
async function gullCook(ctx) {
  const tables = [[['Lamb', 9], ['Sea bass', 6], ['Greens', 3]], [['Duck', 10], ['Risotto', 7.5], ['Scallops', 4], ['Sauce', 2]]], got = [];
  for (const [ri, dishes] of tables.entries()) got.push(await ctx.live({ hint: 'Fire each dish so they ALL finish together. Longest first; the others wait their moment.', pause: 1800, setup(api) {
    const rows = dishes.map(d => ({ n: d[0], T: d[1], t0: 0, bar: el('i'), el: null })); let started = 0, t = 0;
    const clock = el('b.jp-clock', { text: '0.0 s' });
    for (const r of rows) r.el = el('button.jp-dish', { 'data-jp': 'fire', onclick: () => { if (r.t0) return; r.t0 = performance.now(); r.el.classList.add('on'); started++; } }, el('span', { text: r.n }), el('small', { text: r.T + ' s' }), el('div.jp-timer', null, r.bar));
    api.every(60, () => { const now = performance.now(); if (started && !t) t = now; clock.textContent = (t ? (now - t) / 1000 : 0).toFixed(1) + ' s'; let all = true; for (const r of rows) { const f = r.t0 ? Math.min(1, (now - r.t0) / (r.T * 1000)) : 0; r.bar.style.width = f * 100 + '%'; if (f >= 1) r.el.classList.add('done'); else all = false; }
      if (t && now - t > 26000 && !all) { for (const r of rows) if (!r.t0) r.t0 = now; }
      if (all) { const ends = rows.map(r => r.t0 + r.T * 1000), spread = (Math.max(...ends) - Math.min(...ends)) / 1000, sc = spread <= .8 ? 1 : spread <= 2 ? .8 : spread <= 4 ? .5 : .25;
        api.note(sc >= 1 ? 'All at the pass at once. Chef says nothing at all.' : sc >= .8 ? `Within ${spread.toFixed(1)} seconds of each other. Good enough to send.` : 'The fish waited for the lamb. The fish does not like to wait.', sc >= 1 ? 'ok' : sc >= .8 ? 'mid' : 'no'); api.finish(sc); } });
    return [el('div.jp-card', null, el('div', null, el('p', { text: ri ? 'Table seven. Four plates.' : 'Table four. Three plates.' }), el('small', { text: 'Tap a dish to start it cooking.' }))), clock, el('div.jp-dishes', null, rows.map(r => r.el))]; } }));
  return got[0] * .45 + got[1] * .55;
}

/* HOTEL BELL — "Where Can I...?": real places from the navigator; the ones you have discovered are marked and score higher */
const WANTS = [['"Somewhere for coffee that is not the lobby."', ['coffee']], ['"We are hungry and it is late."', ['food', 'hunger']], ['"Is there anything on tonight that is not for tourists?"', ['fun']], ['"Fruit, a toothbrush, and a newspaper. Where?"', ['groceries']], ['"A present for a nine-year-old. Urgently."', ['shopping']]];
function placesFor(kinds) { for (const k of kinds) { const r = safe(() => G.nav.find(k, 6), []).filter(x => typeof x.id === 'string' && x.name && !x.home && !x.friend); if (r.length) return r; } return []; }
async function hotel(ctx) {
  const got = [], all = safe(() => G.places.list('venue'), []).filter(p => p && p.name && !/^lobby:|^home/.test(p.id));
  for (const w of sample(WANTS, 3)) {
    const rows = placesFor(w[1]); if (!rows.length) continue; const right = { name: rows[0].name, id: rows[0].id }, known = id => !!id && !!safe(() => G.places.known(id), false);
    const decoys = sample(all.filter(p => p.name !== right.name && !rows.some(r => r.name === p.name) && !w[1].some(k => safe(() => G.nav.matches(p, k), false))), 2).map(p => ({ name: p.name, id: p.id }));
    while (decoys.length < 2) decoys.push({ name: decoys.length ? 'The brochure rack' : 'The gift shop in the lobby', id: null });
    got.push(await ctx.pick({ who: { spec: face(7000 + got.length * 13), name: 'A guest' }, prompt: w[0], hint: 'Places you have walked to yourself are marked: you can describe the way.', options: [O(right.name, known(right.id) ? 1 : .8, known(right.id) ? 'You tell them the way from memory. They come back delighted.' : 'A good answer. You have never been: you read it off the map.', known(right.id) ? 'you have been there' : ''), ...decoys.map(d => O(d.name, .15, 'You sent them to the brochure. Odile adjusts it, gently.', known(d.id) ? 'you have been there' : ''))], secs: 14, pause: 1900 }));
  }
  return got.length ? mean(...got) : .5;
}

/* OBSERVATORY GUIDE — clear: star-hop to tonight's target and focus (the existing focus ring); cloud: the show cues (the existing rhythm bar) */
const HOPS = [['Start at the bright one low in the south. Which pattern is next to it?', 'The Teapot', ['A square', 'A ring of nine']], ['From the handle, go up twice its own length.', 'A small smudge that is not a star', ['The Moon', 'A red light on a mast']], ['Follow the arc of the Dipper\'s handle to...', 'Arcturus, the orange one', ['The North Star', 'A satellite']], ['Find the W. The middle point aims at...', 'The Andromeda smudge', ['Saturn', 'The lighthouse']], ['Two stars close together, one gold and one blue.', 'Albireo', ['An aeroplane', 'Venus, twice']]];
async function observatory(ctx, env) {
  if (env.weather !== 'clear') {
    const s = await ctx.pick({ prompt: ['Cloud tonight. The planetarium, then.', 'The narration says: "...and as the Sun goes down over Hillcrest..." Which cue?'], options: [O('Sunset, slow fade', 1, 'The dome goes orange, then deep blue. Somebody gasps.'), O('Sunrise', 0, 'Sunrise, in the middle of the night sky. Stella improvises a comet.'), O('House lights up', 0, 'Forty people blink at each other.')], secs: 10 });
    const r = await ctx.mg({ kind: 'rhythm', title: 'Show cues', hint: 'Press each cue as the narration reaches it.', icon: 'skill.logic', o: { lanes: 2, notes: 12, bpm: 70 }, level: 2 });
    return s * .3 + r * .7;
  }
  const got = []; for (const h of sample(HOPS, 3)) got.push(await ctx.pick({ prompt: ['Star-hopping, with a visitor at your elbow.', h[0]], options: [O(h[1], 1, 'There. One hop closer.'), ...h[2].map(x => O(x, 0, 'Not that. Back to the bright one, and again.'))], secs: 11 }));
  const f = await ctx.mg({ kind: 'timing', title: 'Focus', hint: 'Bring the ring onto the mark, then stop.', icon: 'skill.logic', o: { rounds: 3, style: 'ring' }, level: 2 });
  return mean(...got) * .5 + f * .5;
}

/* HAIR STYLIST — The Cut: talk or quiet (two cues), the guard, the line (the existing trace game), the finish */
const CHAIRS = [['Sits down, puts the phone face down, shuts his eyes.', 'quiet', 'A short back and sides, like the picture: a number two.', 'Number 2'], ['Is already telling you about her sister\'s wedding before the cape is on.', 'talk', 'Just a tidy: keep the length, clean the neck.', 'Scissors only'], ['Looks at the floor. Says "whatever you think" twice.', 'quiet', 'The picture shows it close at the sides, longer on top.', 'Number 3, scissors on top'], ['Has brought a photograph of himself from 1989 and wants to discuss it.', 'talk', 'The photograph: very short all over.', 'Number 1']];
async function stylist(ctx) {
  const c = pickOf(CHAIRS), guards = ['Number 1', 'Number 2', 'Number 3, scissors on top', 'Scissors only'];
  const a = await ctx.pick({ prompt: ['The next chair:', c[0]], keep: true, options: [O('Talk', c[1] === 'talk' ? 1 : .2, c[1] === 'talk' ? 'The right amount of conversation.' : 'A great deal of chat for someone who wanted peace.'), O('Quiet', c[1] === 'quiet' ? 1 : .2, c[1] === 'quiet' ? 'You let the clippers do the talking.' : 'They had a story ready. It stays untold.')], cols: 2, secs: 10, pause: 1700 });
  const b = await ctx.pick({ prompt: ['The lookbook:', c[2]], options: guards.map(g => O(g, g === c[3] ? 1 : 0, g === c[3] ? 'That is the one.' : 'Pops, without turning round: "' + c[3] + '."')), cols: 2, secs: 10 });
  const t = await ctx.mg({ kind: 'trace', title: 'The line', hint: 'Follow the guide along the neckline: steady, one stroke at a time.', icon: 'skill.style', o: { strokes: 3 }, level: 2 });
  return a * .25 + b * .25 + t * .5;
}

/* ------------------------------------------------------------------ the four room jobs (J3) */

/* RADIO HOST — Hit the Post: a record for the caller's mood, then talk over the intro and stop just before the singing */
const RECORDS = [['"Harbor Lights", The Tidewater Three', 'slow · warm · a long sax'], ['"Up With the Bakers", Dolly Marsh', 'bright · quick · brass'], ['"Nine Miles of Rain", Otis Kell', 'slow · blue · one guitar'], ['"Kitchen Radio", The Sycamores', 'warm · easy · a singalong'], ['"Engine Song", Les Pistons', 'loud · fast · no words'], ['"Cello Suite, the slow one"', 'quiet · deep · takes its time'], ['"Saturday Shoes", Pearl & the Divers', 'bright · dancing · handclaps'], ['"Lullaby for a Ferry"', 'quiet · warm · almost asleep']];
const CALLERS = [['Line one. A cab driver on the rank at the station, forty minutes into a wait.', '"Something to keep me company. Nothing I have to keep up with."', 0, 3], ['Line two. The bakery on Lantern Row, flour to the elbows.', '"We need waking up, love. It is four hours till the bread."', 1, 6], ['Line one. A nurse on her break at the clinic.', '"I have ten minutes and I want to sit very still in them."', 5, 7], ['Line four. A man who cannot sleep because it is raining on a tin roof.', '"Play the rain something. It might as well have a tune."', 2, 0], ['Line two. Somebody painting a kitchen at midnight.', '"I want to sing and I only know choruses."', 3, 6], ['Line one. The lighthouse.', '"Quiet night. Something that will not frighten the fog."', 7, 5]];
async function radio(ctx, env) {
  const c = pickOf(CALLERS), others = sample(RECORDS.map((_, i) => i).filter(i => i !== c[2] && i !== c[3]), 2), hat = who('hattie');
  const a = await ctx.pick({ prompt: [c[0], c[1]], hint: 'Read the mood, not the title.', options: [O(RECORDS[c[2]][0], 1, 'That is the one. You can hear them settle.', RECORDS[c[2]][1]), O(RECORDS[c[3]][0], .65, 'Close. It will do, and they are too kind to say.', RECORDS[c[3]][1]), ...others.map(i => O(RECORDS[i][0], .1, 'Wrong room for that record. They listen politely.', RECORDS[i][1]))], secs: 16, pause: 1700 });
  const posts = []; for (let r = 0; r < 2; r++) posts.push(await ctx.live({ hint: r ? 'Once more. This intro is shorter.' : 'Hold the button to talk over the intro. Let go just before the singing starts.', pause: 1300, setup(api) {
    const post = .56 + Math.random() * .3, speed = (r ? .26 : .2) + env.level * .012, fill = el('i'), mark = el('u', { style: { left: post * 100 + '%' } }), bar = el('div.jp-intro', null, fill, mark, el('span', { text: 'intro' }), el('span.r', { text: 'she sings' })); let f = 0, held = false, done = false, idle = 0;
    const end = () => { if (done || f <= 0) return; done = true; btn.disabled = true; const gap = post - f, sc = gap < 0 ? .12 : gap <= .05 ? 1 : gap <= .11 ? .85 : gap <= .2 ? .6 : gap <= .35 ? .4 : .25;
      api.note(gap < 0 ? 'You talked over the first line. Down the corridor, a soldering iron stops.' : gap <= .05 ? 'On the post. Not a breath of dead air.' : gap <= .11 ? 'A beat early. Nobody but Hattie would know.' : 'You stopped, and the intro went on without you. Three seconds is a pause.', gap < 0 ? 'no' : gap <= .11 ? 'ok' : 'mid'); bar.classList.add(gap < 0 ? 'over' : 'done'); api.finish(sc); };
    const btn = el('button.jp-go.jp-hold', { 'data-jp': 'hold', text: 'Hold to talk', onpointerdown: e => { e.preventDefault(); if (!done) { held = true; btn.classList.add('on'); } }, onpointerup: () => { if (held) { held = false; end(); } }, onpointerleave: () => { if (held) { held = false; end(); } }, onpointercancel: () => { if (held) { held = false; end(); } } });
    api.every(40, () => { if (done) return; if (held) { f = Math.min(1, f + speed * .04); fill.style.width = f * 100 + '%'; if (f >= 1) { held = false; end(); } } else if ((idle += .04) > 9 && f <= 0) { done = true; api.note('Dead air. Four seconds is a funeral.', 'no'); api.finish(.1); } });
    return [el('div.jp-card', null, hat.spec ? el('div.jp-face', null, UI.face(hat.spec, 3)) : null, el('div', null, el('b.jp-who', { text: 'Hattie, in your headphones' }), el('p', { text: r ? '"Again. Ride it right up to her."' : '"Talk it up. Stop before she does."' }))), bar, btn]; } }));
  return a * .4 + mean(...posts) * .6;
}

/* TEACHER — Who Can Show Me?: call on a spread of hands; bring the daydreamer back with a question */
const CLASS = [['juniper', 'Juniper'], ['ayo', 'Ayo'], ['cosmo', 'Cosmo'], [null, 'Bea', 7103], [null, 'Sam', 7211], [null, 'Lin', 7307]];
const LESSON = [['Who can show me three plus four?', 'Seven.'], ['Who can find the month after May?', 'June.'], ['Who can show me which is heavier: a feather or a shoe?', 'The shoe.'], ['Who can spell "boat"?', 'B, O, A, T.'], ['Who can tell me what a stick insect eats?', 'Bramble leaves.'], ['Who can show me half of eight?', 'Four.'], ['Who can find Maple Bay on the map?', 'There: by the water.']];
async function teacher(ctx, env) {
  const kids = CLASS.map(k => ({ id: k[0], name: k[1], spec: k[0] ? who(k[0]).spec : safe(() => charArt().randomSpec(rng(k[2]), { age: 'kid', season: 1 }), null), asked: 0 })), got = [], qs = sample(LESSON, 5), dream = 2;
  for (let r = 0; r < qs.length; r++) {
    if (r === dream) { const d = pickOf(kids.filter(k => k.id !== 'juniper'));
      got.push(await ctx.pick({ who: { spec: d.spec, name: d.name }, prompt: d.name + ' is looking out of the window. There is a gull on the fence. It is a very interesting gull.', hint: 'Bring them back with a question, not a telling-off.', options: [O(d.name + ', what do you think the gull would say?', 1, 'A pause. "It would say seven." They are back, and proud of it.'), O(d.name + '! Eyes on the board, please.', .25, 'They look. Their ears go pink. The gull was more interesting.'), O('Carry on. They will catch up.', .45, 'They do not. The gull has a friend now.')], secs: 14, pause: 1900 })); }
    got.push(await ctx.live({ hint: 'Hands are up. Call on a spread of children: not always the same one.', pause: 1200, setup(api) {
      /* Juniper always knows; two or three others; Cosmo only once the others have had a turn */
      const up = new Set(['Juniper']); for (const k of sample(kids.filter(k => k.name !== 'Juniper' && (k.name !== 'Cosmo' || r >= 3)), 2 + (r % 2))) up.add(k.name); let over = false;
      const att = el('i', { style: { width: Math.round((got.length ? mean(...got) : .7) * 100) + '%' } });
      const tap = k => { if (over || !up.has(k.name)) return; over = true; api.time(0); const sc = k.asked === 0 ? 1 : k.asked === 1 ? .45 : .2; k.asked++;
        api.note(k.asked === 1 ? (k.name === 'Cosmo' ? 'Cosmo holds up his map and points. It is the right answer.' : `${k.name}: "${qs[r][1]}"  A new voice.`) : k.name === 'Juniper' ? 'Juniper again. Juniper is delighted. Ayo starts on "why".' : `${k.name} again. The quiet table looks at its shoes.`, k.asked === 1 ? 'ok' : 'mid'); for (const b of btns) b.disabled = true; api.finish(sc); };
      const btns = kids.map(k => el('button.jp-kid' + (up.has(k.name) ? '.up' : ''), { 'data-kid': k.name, 'data-up': up.has(k.name) ? 1 : 0, 'data-asked': k.asked, onclick: () => tap(k) }, k.spec ? el('span.jp-kface', null, UI.face(k.spec, 2)) : null, el('span', { text: k.name }), el('em', { text: up.has(k.name) ? '✋' : '' }), k.asked ? el('small', { text: 'asked ' + k.asked + 'x' }) : null));
      api.time(9, () => { if (over) return; over = true; api.note('Nobody was asked. The hands go down, one by one.', 'no'); api.finish(.15); });
      return [el('div.jp-card', null, el('div', null, el('p', { text: '"' + qs[r][0] + '"' }), el('small', { text: `Question ${r + 1} of ${qs.length}` }))), el('div.jp-att', null, el('span', { text: 'The room' }), el('div.jp-timer', null, att)), el('div.jp-kids', null, btns)]; } }));
  }
  return mean(...got);
}

/* REPORTER — Who Cares?: three voices at the place (a fact, a feeling, a shrug), then a first line, an order and a headline */
const STORIES = [
  { place: 'The steps of City Hall. Forty-one pigeons, and a man with a clipboard who counts them.', people: [['The man with the clipboard', ['How many, and since when?', 'Forty-one. Every noon since March. He shows you the column.'], ['Why do you count them?', '"Somebody should know." He means it.'], ['Nice day for it?', '"It is a day."']], ['A woman eating her lunch', ['Do they bother you?', '"They wait till I have finished. They are better mannered than the council."'], ['How long have you sat here?', 'Eleven years, the same step.'], ['Any comment?', 'She shrugs, kindly.']], ['The caretaker', ['What does it cost to clean?', 'Two hours a day and a hose. He has the figure.'], ['Would you miss them?', '"Do not print this. Yes."'], ['Busy?', '"Always."']]],
    first: [['A man named Walt has counted the pigeons on the City Hall steps every noon since March.', 1, 'A person in the first line. Max nods once.'], ['There are forty-one pigeons on the City Hall steps.', .6, 'True. And who cares? Max waits.'], ['It is a bird\'s life on the City Hall steps!', .1, 'Max says: "No."']],
    heads: [['Forty-One Pigeons, and the Man Who Counts Them', 1], ['Pigeon Numbers Steady, Says Count', .55], ['Coo\'s Counting? Hall Steps in a Flap', .15]] },
  { place: 'The crosswalk at Main and Third. Item four on the council agenda.', people: [['A crossing guard, off duty', ['How many cross here at three o\'clock?', 'Sixty children, counted, and one dog that thinks it is one.'], ['Are you worried?', '"Every day at ten to three. Then they are over, and I breathe."'], ['Is it busy?', '"It is a crosswalk."']], ['A bus driver on the 16', ['How long is the green?', 'Eleven seconds. She has timed it on her own watch.'], ['What is it like from the cab?', '"I see their hats. Only their hats."'], ['Thoughts?', 'A shrug with both hands on the wheel.']], ['A second-grader', ['How do you cross?', '"You run. Mr. Calloway says walk. So you walk fast."'], ['Is it scary?', '"Only the middle."'], ['Do you like school?', '"It is okay."']]],
    first: [['A second-grader at Main and Third knows exactly how long the green light is: not long enough.', 1, 'You start with the smallest person in the story. That is the story.'], ['The council will discuss a crosswalk on Thursday.', .5, 'That is the agenda, not the street.'], ['Why did the chicken cross Main Street?', .1, 'Max puts the pencil down. That is worse than "No".']],
    heads: [['Eleven Seconds to Cross Main Street', 1], ['Council to Consider Crosswalk Timing', .6], ['Walk This Way! Crossing Row Hots Up', .15]] },
  { place: 'The Bay Fish Hall, six in the morning. The last ice machine in the harbor is going.', people: [['The auctioneer', ['How old is the machine?', 'Nineteen sixty-two. Four tons a night. He knows the serial number.'], ['What will you miss?', '"The noise. You hear it and you know the day has started."'], ['Early start?', '"Always."']], ['A skipper, unloading', ['What does bought ice cost you?', 'Thirty a box, six boxes a trip. He does the sum on the gunwale.'], ['Does it matter?', '"Fish does not care. I do."'], ['Good catch?', '"Fair."']], ['The engineer', ['Can it be mended?', 'One part. Nobody makes it. He has drawn it, to scale, twice.'], ['How do you feel?', '"Like a doctor with one patient."'], ['Cold in here?', '"It is an ice room."']]],
    first: [['For sixty years the day at the Bay Fish Hall has started with a noise, and next month it stops.', 1, 'You can hear it. So will they.'], ['An ice machine at the fish hall is to be replaced.', .5, 'Accurate, and asleep.'], ['Cold comfort for the harbor as ice age ends!', .1, 'Edwina, without looking up: "Oh dear."']],
    heads: [['The Last Four Tons: Fish Hall Ice Machine to Fall Silent', 1], ['Ice Machine at Fish Hall to Be Replaced', .6], ['Ice, Ice, Maybe: Chill in the Air at Hall', .15]] },
];
async function reporter(ctx) {
  const S = pickOf(STORIES), max = who('max'), kinds = []; const got = [];
  for (let i = 0; i < 3; i++) { const p = S.people[i], vals = [1, .85, .2];
    const v = await ctx.pick({ who: { spec: face(8100 + i * 17 + S.people.length), name: p[0] }, prompt: i ? 'Next: ' + p[0].toLowerCase() + '. One question.' : [S.place, 'One question each. Choose it well.'], keep: false, options: p.slice(1).map((q, k) => O(q[0], vals[k], q[1])), secs: 16, pause: 2100, yes: '', no: '' });
    got.push(v); kinds.push(v >= 1 ? 'fact' : v >= .8 ? 'feeling' : 'shrug'); }
  const both = kinds.includes('fact') && kinds.includes('feeling'), voices = Math.min(1, mean(...got) + (both ? .08 : -.1));
  await ctx.say(both ? 'A fact and a feeling in the notebook. Back to the desk.' : kinds.every(k => k === 'fact') ? 'Three facts and nobody in them. Back to the desk.' : 'Thin notes. Back to the desk.', 1200, both ? 'ok' : 'mid');
  const a = await ctx.pick({ who: max, prompt: '"First line. Read it to me. And then I am going to ask you: who cares?"', options: S.first.map(f => O(f[0], f[1], f[2])), secs: 20, pause: 2000 });
  const b = await ctx.order({ prompt: ['Now the order. Max: "Who it happens to. Then what is true. Then what happens next."'], items: [{ t: 'The person', sub: 'who it happens to', k: 1 }, { t: 'The number', sub: 'what is true', k: 2 }, { t: 'Thursday', sub: 'what happens next', k: 3 }, { t: 'How you got there', sub: 'nobody asked', k: 4 }], first: 'Top of the story', last: 'Cut from the bottom', secs: 30, yes: 'It reads from the top down, and it can be cut from the bottom up.', no: 'Max moves two paragraphs with one arrow.' });
  const c = await ctx.pick({ prompt: 'A headline. Lev is waiting to size the photograph.', options: S.heads.map(h => O(h[0], h[1], h[1] >= 1 ? 'It says what it is. The light on the desk comes on: WHO CARES? Somebody will.' : h[1] > .5 ? 'It is not wrong. It is also not awake.' : 'Edwina reads it aloud, slowly. You hear it.')), secs: 16, pause: 2000 });
  return voices * .4 + a * .25 + b * .15 + c * .2;
}

/* FIREFIGHTER — The Bell: dress in order, choose three pieces of kit, do the one careful thing */
const KIT = ['Ladder', 'Hose line', 'Pump', 'Cat carrier', 'Fan', 'Toolbox'];
const DECK = [
  ['Smoke alarm, 14 Sycamore Lane. Caller says: "It is probably toast."', ['Fan', 'Toolbox', 'Hose line'], 'At the door. The alarm is still going.', [['Check behind the toaster and behind the stove, then open the windows.', 1, 'Toast. And a tea towel too near the ring: you move it. That was the tenth of a call.'], ['Open every window and reset the alarm.', .5, 'It was toast. You did not look behind the stove. Dutch does, on the way out.'], ['Run the hose line into the kitchen.', .1, 'A wet kitchen and a slice of toast. The Captain says nothing, at length.']]],
  ['A cat up the big maple on Birch Lane. Third branch from the top. It has been there since lunch.', ['Ladder', 'Cat carrier', 'Toolbox'], 'The cat regards the ladder with contempt.', [['Foot the ladder, climb slowly, and let the cat come to the carrier.', 1, 'It walks into the carrier as if that had been its plan all along.'], ['Climb fast and grab.', .25, 'You have the cat. The cat has your sleeve. Both of you come down slowly.'], ['Call it down.', .4, 'The cat has heard its name before. It is not moved.']]],
  ['A flooded basement, Lantern Row. A burst pipe; a couple, and a box they want.', ['Pump', 'Hose line', 'Toolbox'], 'Knee deep, and the fuse box is on the far wall.', [['Shut off the electricity at the street first. Then the water. Then the pump.', 1, 'In that order. The box comes out dry on your shoulder.'], ['Start the pump at once.', .4, 'It works. Dutch shuts off the power behind you, and looks at you while he does it.'], ['Wade in for the box.', .15, 'Tully has your collar. "Power first. Always."']]],
  ['A stuck lift at Hartwell Tower, between nine and ten. Four people and a fern.', ['Toolbox', 'Fan', 'Ladder'], 'Voices through the door. One of them is counting.', [['Talk to them first. Then key the lift down to nine by hand.', 1, 'They step out in order of age. The fern is carried.'], ['Force the doors.', .3, 'They open. So does a long conversation with the building manager.'], ['Wait for the lift company.', .45, 'An hour. The fern is fine. The people are less fine.']]],
  ['A trash can alight behind the diner. Dot is watching from the back door with her arms folded.', ['Hose line', 'Pump', 'Fan'], 'Small, smoky, and next to a stack of crates.', [['Move the crates, then a short burst at the base, then stir and soak.', 1, 'Out, and it stays out. Dot hands the crew a pie through the door.'], ['A long blast from the doorway.', .45, 'Out. Also the crates, the door, and Dot.'], ['Smother it with the lid and leave.', .3, 'It sulks, and starts again when you are in the cab.']]],
  ['A smell of gas at the Old Town market, by the fruit stalls.', ['Fan', 'Toolbox', 'Cat carrier'], 'The meter says nothing. The smell says a great deal.', [['Follow your nose before your meter: check the stalls.', 1, 'It is a durian. The stallholder gives you a slice. You decline, warmly.'], ['Clear the whole market.', .45, 'Two hundred people on the pavement, for a fruit.'], ['Tell them it is nothing.', .2, 'It was nothing. You did not know that when you said it.']]],
];
async function firefighter(ctx, env) {
  const d = pickOf(DECK), tully = who('tully');
  const a = await ctx.order({ prompt: ['THE BELL.', 'Boots are in the pants, pants are by the bunk. Sixty seconds on the bay clock.'], items: [{ t: 'Boots', sub: 'step in', k: 1 }, { t: 'Pants', sub: 'pull up', k: 2 }, { t: 'Suspenders', sub: 'over the shoulders', k: 3 }, { t: 'Coat', sub: 'collar up', k: 4 }, { t: 'Helmet', sub: 'strap', k: 5 }], first: 'First', last: 'On the truck', secs: 24, button: 'On the truck', yes: 'Fifty-something seconds. Tully looks at the watch twice.', mid: 'Dressed. One thing went on over another. Sixty-four seconds.', no: 'Suspenders on backwards. Dutch whistles anyway.' });
  const b = await ctx.live({ hint: 'Read the card. Choose three pieces of kit, then roll.', pause: 1500, setup(api) {
    const on = new Set(), go = el('button.jp-go', { 'data-jp': 'roll', text: 'Roll', disabled: true, onclick: () => { const n = d[1].filter(k => on.has(k)).length; for (const x of btns) { x.disabled = true; if (d[1].includes(x.dataset.kit)) x.classList.add('right'); else if (on.has(x.dataset.kit)) x.classList.add('wrong'); }
      api.note(n === 3 ? 'The right kit, first time. Engine 2 pulls out, a little to the right.' : n === 2 ? 'Nearly. Dutch throws the missing piece on as you roll.' : 'A ladder for a basement. Dutch whistles, and repacks the truck at the lights.', n === 3 ? 'ok' : n === 2 ? 'mid' : 'no'); go.disabled = true; api.finish(n / 3); } });
    const btns = KIT.map(k => el('button.jp-opt', { 'data-kit': k, 'data-need': d[1].includes(k) ? 1 : 0, onclick: e => { const b2 = e.currentTarget; if (on.has(k)) { on.delete(k); b2.classList.remove('on'); } else if (on.size < 3) { on.add(k); b2.classList.add('on'); } go.disabled = on.size !== 3; } }, el('span', { text: k })));
    return [el('div.jp-card.jp-dispatch', null, el('div', null, el('b.jp-who', { text: 'DISPATCH · STATION 2' }), el('p', { text: d[0] }))), el('div.jp-opts.two', null, btns), go]; } });
  const c = await ctx.pick({ who: tully, prompt: [d[2], 'The one careful thing:'], options: d[3].map(o => O(o[0], o[1], o[2])), secs: 18, pause: 2300 });
  return a * .35 + b * .3 + c * .35;
}

export const PLAY = { barista, grocery_clerk: grocery, line_cook: lineCook, office_analyst: analyst, courier, fitness_trainer: trainer, librarian, nurse, dock_worker: dock, bartender,
  gate_agent: gate, baggage_handler: baggage, station_agent: station, retail_associate: retail, museum_guide: museum, florist, aquarist, gull_cook: gullCook, hotel_bell: hotel, observatory_guide: observatory, hair_stylist: stylist, radio_dj: radio, teacher, reporter, firefighter };
/* the station of the job's work loop where the play's ticket shows up, and how the play counts as a task */
export const STATION = { barista: 'espresso_machine', grocery_clerk: 'till', line_cook: 'grill', office_analyst: 'own_desk', courier: 'sorting_bench', fitness_trainer: 'weights', librarian: 'front_desk', nurse: 'reception', dock_worker: 'manifest_board', bartender: 'bar_counter',
  gate_agent: 'gate_desk', baggage_handler: 'baggage_carousel', station_agent: 'platform_edge', retail_associate: 'fitting_room', museum_guide: 'mus_info_desk', florist: 'florist_bench', aquarist: 'aq_fish_kitchen', gull_cook: 'gull_stove', hotel_bell: 'hotel_concierge', observatory_guide: 'obs_small_scope', hair_stylist: 'barber_chair', radio_dj: 'radio_board', teacher: 'class_board', reporter: 'news_own_desk', firefighter: 'fire_gear_hooks' };
/* which mini-game each play leans on (for the report table and G.jobStory.debug.plays()) */
export const KIND = { barista: 'own + timing', grocery_clerk: 'order', line_cook: 'reused (flip) + own', office_analyst: 'own', courier: 'order (route)', fitness_trainer: 'reused (balance, timing)', librarian: 'order + own', nurse: 'order + own', dock_worker: 'order (+ timing at level 3)', bartender: 'reused (pour) + own',
  gate_agent: 'own + order', baggage_handler: 'own', station_agent: 'own', retail_associate: 'reused (outfit) + own', museum_guide: 'own', florist: 'own + timing', aquarist: 'order + own', gull_cook: 'own', hotel_bell: 'reused (navigator finder)', observatory_guide: 'reused (focus ring / rhythm) + own', hair_stylist: 'reused (trace) + own', radio_dj: 'own (mood match + hold to the post)', teacher: 'own (hands up, the daydreamer)', reporter: 'own (three voices) + order', firefighter: 'order (turn out) + own (kit, the careful thing)' };
/* result lines that differ from the designer's PLAYS text because the built game is shorter than the sketch */
export const WORDS = { baggage_handler: { good: 'Every bag on the right belt. Lena finishes a clue.' } };
export const playFor = id => PLAY[id] || null;
export { UI };
