// Maple Bay City Hall — the Council Chamber (room `cityhall_council`, 24 x 18): horseshoe dais with seven councillors and the mayor in the chair, the clerk's table with the speakers' list, a podium,
// a brass rail, three rows of public benches and the live vote board. Meetings: data/cityhall.js COUNCIL (Tue + Thu 18:30 - 20:30, four motions of 28 minutes: read, public comment, debate, vote, result).
// The room only SHOWS the meeting; the schedule lives in sim/cityhall.js (G.cityhall.council.state()).
//   scene.hot = { sync(), councillors, chair (the mayor), clerk, speaker, board, state() -> the council state last shown, seatsFree() }
import { G } from '../../core/game.js';
import { GT } from '../../engine/world.js';
import { defineRoom } from '../interior.js';
import { bubble } from '../../ui/kit.js';
import { crowd } from './_show_life.js';
import { specs } from './_airport_life.js';
import { O, setP, mk, step, go, softEnv, dress, seatsOf, people } from './hotel.js';
import { CH, pick, kit, by, fade, idle, goRoom } from './cityhall.js';
import { CR, CV, NAME, PEOPLE, COUNCILLORS, hallOpen, councilNext } from '../../data/cityhall.js';

const W = 24, D = 18, K = kit(), { items, spots, H, Wl, S } = K;
const SEATS = [[9.6, 1.5, 1], [10.8, 1.5, 1], [12, 1.5, 1], [13.2, 1.5, 1], [14.4, 1.5, 1], [7.95, 3.9, 0], [16.05, 3.9, 2]]; // room coords of the 7 chairs; index 2 is the chair of the meeting
const LINES = {
  public: ['Shh. It is the fountain item next. It is ALWAYS the fountain item.', 'I come every Tuesday. It is cheaper than the cinema and nobody dies.', 'Watch the board. The little lamps are the best bit.', 'Anybody can speak. You put your name on the list at the clerk\'s table.', 'Councillor Nilsson has asked "who pays" eleven times tonight.', 'I brought sandwiches. Democracy runs long.'],
  empty: ['The chamber is open to look at. Meetings are Tuesday and Thursday at half past six.', 'Seven chairs, one gavel, a hundred and thirty years of arguing.', 'Sit anywhere. The benches are harder than they look.'],
  press: ['Bay Courier. I have covered this fountain since before I had grey hair.', 'If they vote before eight I make the morning edition.'],
};
function build() {
  Wl('voteboard', 'y', 8.5, { t: 'COUNCIL CHAMBER' }, { board: 1 }); for (const at of [1.2, 4.4, 17.2, 20.4]) Wl('furn.hotel.window', 'y', at, { w: 2.4, c: '#2f5a4a' }, { win: 1 }); for (const at of [.4, 7.6, 16, 23.2]) Wl('furn.lobby.sconce', 'y', at, {});
  for (const at of [2, 6.6, 11.4]) Wl('portrait', 'x', at, { k: at === 2 ? 3 : at > 10 ? 1 : 4 }, { portrait: at === 2 ? 3 : at > 10 ? 1 : 4 }); Wl('furn.lobby.sconce', 'x', 4.6, {}); Wl('furn.lobby.sconce', 'x', 9.4, {}); Wl('furn.lobby.restroom', 'x', 14.6, { c: '#5a4030', dc: '#2f6f5f' });
  H('daisfloor', 7.5, .8, { w: 9, d: 4.4 });
  SEATS.forEach(([x, y, dir], i) => H('cchair', x - .3, y - .42 + (dir === 1 ? 0 : .12), i === 2 ? { tall: 1, c: '#2f5a4a' } : dir === 2 ? { back: 0 } : {}, { z: .3, solid: false, flip: dir === 0 }));
  H('daisdesk', 9, 2, { w: 6, seal: 1, n: 5 }, { z: .3 }); H('daisdesk', 8.3, 3, { w: 1.8, n: 1 }, { z: .3, flip: true }); H('daisdesk', 15.1, 3, { w: 1.8, n: 1 }, { z: .3, flip: true });
  H('flagpole', 6.6, 1, {}); H('flagpole', 16.9, 1, { k: 'bay' }); H('podium', 11.5, 7.2, {}, { podium: 1 }); H('clerktable', 3.6, 5.6, {}, { signup: 1 });
  H('railing', 2.5, 9.7, { w: 8.5 }); H('railing', 13, 9.7, { w: 8.5 });
  for (const y of [11, 12.7, 14.4]) for (const x of [3.3, 7.5, 12.7, 16.9]) H('bench', x, y, { w: 4, dir: 3, c: '#7a2030' }, { gallery: 1 });
  H('furn.hotel.carpet', 11.2, 9.4, { w: 2, d: 8.2, c: '#2f6f5f' }); H('furn.hotel.chandelier', 10.8, 4.6, { r: 1 }, { z: 3.8 }); H('furn.hotel.chandelier', 10.8, 11.4, { r: .8 }, { z: 3.8 });
  H('planter', 1, 16.6, { seed: 3 }); H('planter', 21.4, 16.6, { seed: 5 });
  S(20.6, 8.6, 2, { busy: 1, label: 'Reporter', lines: LINES.press, anim: 'phone' }); S(21.4, 8.9, 2, { busy: 1, label: 'Reporter', lines: LINES.press }); S(2.6, 15.6, 0, { p: .5 }); S(19.5, 6.2, 3, { p: .4 });
}
build();

defineRoom({ id: CR.council, name: NAME + ' — Council Chamber', w: W, d: D, zoom: 0, music: 'quiet', noCrowd: true, showpiece: 'cityhall', venue: CV.place, floor: GT.f_wood, bg: '#15161f', edge: '#4a3a2a',
  wall: { color: '#e4d8bc', trim: '#6a4428', h: 5.2, rail: 2.1, pattern: 'plain' },
  exits: [{ x: 12.2, y: 17.4, label: 'Back to the Rotunda', to: 'int:' + CR.hall, use: () => goRoom('hall', 'council') }],
  spawn: { x: 12.2, y: 16.3, dir: 3 }, items, npcSpots: spots,
  setup(sc) {
    const Wd = sc.world, P = people(), AP = specs(), board = by(sc, 'board')[0];
    Wd.lights.push({ x: O + 12, y: O + 3.4, z: 0, r: 7, c: '#ffe9b0' }, { x: O + 12, y: O + 8.4, z: 0, r: 4, c: '#fff0c8' }, { x: O + 12, y: O + 13, z: 0, r: 7, c: '#ffe2a0' });
    const seats = seatsOf(sc, /cityhall\.bench/, { add: () => ({ busy: 1, gal: 1, p: 1 }) });
    const cr = crowd(sc, sc.def.npcSpots.concat(seats), { seed: 1911, fill: .7, lines: LINES.public });
    const cs = COUNCILLORS.map((d, i) => { const [x, y, dir] = SEATS[i], spec = i === 2 ? (CH() && CH().mayorSpec ? CH().mayorSpec() : P.formal[0]) : P.formal[(i * 4 + 1) % P.formal.length];
      const c = mk(sc, spec, x, y, dir, i === 2 ? PEOPLE.mayor + ' (in the chair)' : d.name + ', ' + d.ward, cc => { const st = CH() && CH().council.state(); bubble(cc, i === 2 ? (st && st.on ? 'Order, please. One at a time. Even you, Bart.' : 'Good evening!') : pick(d.quip), 3800); });
      c.z = .75; c.pose = 'sit'; c.poseOpts = { seated: true }; c.seat = i; c.hidden = true; return c; });
    const clerk = mk(sc, P.concierge[2], 4.6, 5.15, 1, PEOPLE.clerk, c => CH() && CH().signup(sc, c)); const speaker = mk(sc, AP.adult[11], 12.2, 10.6, 3, 'Citizen at the podium', LINES.public); speaker.hidden = true; speaker.speed = 1.6;
    let tick = 0, key = '', st = { on: false }, lineT = 0, lineI = 0, quipT = 0, spk = 0, lastBoard = '', wasOn = null;
    const POD = [12, 8.35];
    const setBoard = p => { const k = JSON.stringify(p); if (k !== lastBoard) { lastBoard = k; setP(board, p); } };
    const sync = () => {
      const n = G.now(); st = (CH() && CH().council.state()) || { on: false }; const on = !!st.on, open = hallOpen(n);
      if (on !== wasOn) { wasOn = on; for (const c of cs) c.hidden = !on; for (const c of cr.list) { const s = c.spot; c.hidden = s.gal ? !on || c.roll > .62 : s.busy ? !on : !open || c.roll > (s.p || .5); } if (!on) { speaker.hidden = true; spk = 0; } }
      clerk.hidden = !(on || (open && n.hf >= 17));
      if (!on) { const nx = councilNext(n), dn = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']; setBoard({ h: 'MAPLE BAY CITY COUNCIL', t: 'NEXT MEETING', t2: nx ? (nx.day === n.day ? 'TONIGHT' : dn[nx.weekday]) + ' 18:30' : 'TO BE ANNOUNCED', t3: 'THE PUBLIC MAY SPEAK', t4: 'SIGN UP AT THE CLERK', s: 'CHAMBER OPEN TO VISITORS' }); key = ''; return; }
      const k2 = st.i + ':' + st.phase; if (k2 !== key) { key = k2; phase(st); }
      if (st.phase === 'close') setBoard({ h: 'MAPLE BAY CITY COUNCIL', t: 'MEETING ADJOURNED', t2: 'THANK YOU FOR COMING', t3: 'BALLOT RESULTS AT THE BOX', t4: '', s: 'GOOD NIGHT', sc: '#ffd060' });
      else { const r = st.res, sh = st.shown, v = r.v.split('').map((ch, i) => (i < sh ? ch : '-')).join(''), a = v.split('A').length - 1, nn = v.split('N').length - 1;
        setBoard({ h: 'ITEM ' + (st.i + 1) + ' OF 4', t: st.motion.t, a, n: nn, v, s: st.phase === 'read' ? 'THE CLERK READS THE MOTION' : st.phase === 'comment' ? 'PUBLIC COMMENT' : st.phase === 'debate' ? 'DEBATE' : st.phase === 'vote' ? 'VOTING...' : st.motion.tabled ? 'TABLED. AGAIN.' : r.carried ? 'CARRIED ' + r.a + ' - ' + r.n : 'DEFEATED ' + r.a + ' - ' + r.n, sc: st.phase !== 'result' ? '#8fd0ff' : st.motion.tabled ? '#ffd060' : r.carried ? '#6fe08a' : '#ff7a6a' }); }
    };
    function phase(s) {
      const m = s.motion, chair = cs[2]; lineI = 0; lineT = 2.5; quipT = 3;
      if (s.phase === 'read') bubble(clerk, 'Item ' + (s.i + 1) + '. ' + m.ask, 6500);
      else if (s.phase === 'comment') { if (s.you) bubble(chair, 'The chair calls ' + (G.state.player.name || 'the next speaker') + ' to the podium.', 5200); else { speaker.setSpec(pick(Math.random() < .3 ? AP.elder : AP.adult)); speaker.hidden = false; speaker.alpha = 0; speaker.x = O + 12.2; speaker.y = O + 10.6; speaker.pose = null; spk = 1; go(speaker, Wd, POD[0], POD[1]); } }
      else if (s.phase === 'debate') { if (spk) { spk = 3; speaker.pose = null; go(speaker, Wd, 12.2, 10.8); } }
      else if (s.phase === 'vote') { bubble(chair, m.tabled ? 'Shall we table it? As is traditional?' : 'All those in favour? Lamps, please.', 4200); for (const c of cr.list) if (c.spot.gal) c._hold = 2; }
      else if (s.phase === 'result') { bubble(chair, m.tabled ? 'Tabled. See you all in another thirty years. *bang*' : s.res.carried ? 'The motion is carried, ' + s.res.a + ' to ' + s.res.n + '. *bang*' : 'The motion is lost, ' + s.res.a + ' to ' + s.res.n + '. *bang*', 5200); if (s.res.carried) for (const c of cr.list) if (c.spot.gal && !c.hidden && c.roll < .4) { c.pose = 'cheer'; c._hold = 3; } }
      else if (s.phase === 'close') bubble(chair, 'That is all our business. Mind the steps, and the protesters. Good night!', 5600);
    }
    sc.hot = { sync, councillors: cs, chair: cs[2], clerk, speaker, board, state: () => st, podium: POD, seatsFree: () => seats.length };
    sc.life = { crowd: cr, count: () => cr.count() + (st.on ? 8 : 0) };
    sc.env = softEnv(Wd, .58, .45); sync();
    const u0 = sc.update; sc.update = (dt, gm) => {
      u0(dt, gm); cr.update(dt); if ((tick -= dt) <= 0) { tick = .5; sync(); }
      for (const c of cs) { idle(c, dt); c.pose = c._hold > 0 ? 'talk' : 'sit'; } idle(clerk, dt); if (!(clerk._hold > 0)) { clerk.dir = 1; clerk.pose = st.on ? 'type' : null; }
      if (!speaker.hidden) { const mv = step(speaker, Wd, dt); if (spk === 1) { fade(speaker, false, dt); if (!mv) { spk = 2; speaker.dir = 3; speaker.pose = 'talk'; } } else if (spk === 3 && !mv) { if (fade(speaker, true, dt)) { speaker.hidden = true; speaker.alpha = undefined; spk = 0; } } }
      if (st.on && st.phase === 'comment' && spk === 2 && (lineT -= dt) <= 0 && lineI < st.motion.say.length) { bubble(speaker, st.motion.say[lineI++], 5200); lineT = 7; }
      if (st.on && st.phase === 'debate' && (quipT -= dt) <= 0) { quipT = 5.5; const i = [0, 1, 3, 4, 5, 6][Math.floor(Math.random() * 6)], c = cs[i]; c._hold = 3.5; bubble(c, pick(COUNCILLORS[i].quip), 4200); }
    };
    const e0 = sc.onEnter; sc.onEnter = (o, pv) => { e0(o, pv); wasOn = null; sync(); if (CH()) CH().arrivedIn('council', sc); };
  },
});
