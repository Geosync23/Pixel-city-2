// The airport opening: intro steps registered on G.intro between 'arrival_plane_cinematic' and 'curb' (see src/sim/intro.js).
//   cabin     seated in the plane after landing; everyone deboards (scene.cabin choreography); then the MOVEMENT tutorial; walk out the door.
//   concourse goal "Follow the signs to the tram": moving-walkway tip, first text from Nora (phone + quick-reply tutorial), talk / shop tip.
//   tramride  the people-mover ride (scene 'airtram').
//   baggage   "Collect your bag at carousel 2" (your yellow bag appears on the belt; tap it -> starter snacks + backpack window; from then on you TOW it: sim/luggage.js), then
//             customs green channel -> arrivals hall -> exit doors -> city 'spawn:airport' where the existing 'curb' step takes over.
// State: G.state.intro.ap = { c0, mv, belt, talk, shop, shopT, msg, replied, bag, joke } (JSON flags; steps resume from them after a load).
// The sibling "welcome" texts stay with the curb step (sendWelcome there); this file only sends a short "are you on the ground?" opener.
// Debug: G.introAirport = { TUNE, grabBag(), state() }.   Replay: ?scene=city&intro
import { G } from '../core/game.js';
import { toast, bubble } from '../ui/kit.js';
import { caption, skipButton } from '../ui/goals.js';

export const order = 115;
const TUNE = { CABIN_MAX: 42, CABIN_LEFT: 5, BAG_DELAY: 5, MSG_AT_X: 15, CLOCK: .12 };
// the game clock crawls during the airport steps (so it is still about 2 PM at the curb and needs do not drain during the tutorial)
const slow = on => { if (on) { if (G.state.speed === 1) G.state.speed = TUNE.CLOCK; } else if (G.state.speed === TUNE.CLOCK) G.state.speed = 1; };
const safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
const room = () => (G.scene && G.scene.roomId) || '';
const near = (q, r) => Math.hypot(G.player.x - q.x, G.player.y - q.y) < r;
const ST = () => { const s = G.state.intro || (G.state.intro = {}); if (!s.ap) s.ap = {}; return s.ap; };
const goal = (id, text, hint) => safe(() => { if (!G.goals.get(id)) G.goals.add({ id, text, group: 'goal', hint }); });
const goalEnd = (id, ok) => safe(() => { if (!G.goals.get(id)) return; if (ok) G.goals.complete(id); else if (!G.goals.isDone(id)) G.goals.remove(id); });
const phoneOpen = () => !!(G.phone && G.phone.isOpen);
const msgBtn = () => (phoneOpen() ? [...document.querySelectorAll('.ph-appbtn')].find(b => /^Messages/i.test(b.getAttribute('aria-label') || '')) || null : document.querySelector('.hud-phone'));
const touch = () => typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);
const at = id => G.intro && G.intro.at === id;

export function init() {
  const I = G.intro; if (!I || !I.register) return;
  /* ---------- cabin ---------- */
  {
    let cut = null, t = 0, ph = '', un = null, said = 0, run = 0, bye = 0;
    const unseat = () => { const p = G.player, sc = G.scene, m = sc && sc.cabin && sc.cabin.mine; if (p.pose === 'sit') { p.pose = null; if (m && room() === 'airport:plane') { p.x = m.row + .75; p.y = m.y; } } p.poseOpts = null; p.zoff = 0; p.z = 0; };
    I.register({ id: 'cabin',
      async enter(c) {
        const my = ++run; t = 0; ph = 'load'; said = 0; bye = 0; slow(true);
        await G.go('int:airport:plane'); if (my !== run || !at('cabin')) return;
        const cab = G.scene.cabin, p = G.player, m = cab.mine; cab.reset(); p.stop(); p.x = m.x; p.y = m.y; p.zoff = m.z; p.z = m.z; p.dir = 0; p.pose = 'sit'; p.poseOpts = { seated: true }; p.hidden = false; safe(() => G.snapCam());
        cut = G.cutscene = { update() { } }; ph = 'wait'; safe(() => G.phone.lock('taxi'));
        un = skipButton('Skip the wait', () => { if (ph === 'wait' && room() === 'airport:plane') G.scene.cabin.fast(); });
        c.hint("Touchdown! Everyone's grabbing their bags - sit tight until the line reaches your row.");
      },
      update(dt, c) {
        if (ph !== 'wait' && ph !== 'free') return; if (room() !== 'airport:plane') return; const cab = G.scene.cabin; t += dt;
        if (ph === 'wait') {
          if (said === 0 && t > .5) { said = 1; safe(() => G.audio.sfx('seatbelt', { v: .5 }));   /* owner msg 229: quieter in the intro */ caption(null, 'Ding! The seatbelt sign blinks off.', 3000); cab.start(); }
          else if (said === 1 && t > 4.6) { said = 2; caption('Captain', 'Welcome to Maple Bay, folks. Local time is 2 PM. Thanks for flying Maple Air.', 4400); }
          else if (said === 2 && t > 13.5) { said = 3; caption(null, 'New city. New keys waiting. Almost there.', 3600); }
          if (t > 2.5 && (cab.myTurn() || t > TUNE.CABIN_MAX)) {
            ph = 'free'; cab.release(); if (G.cutscene === cut) G.cutscene = null; cut = null; unseat(); if (un) un(); un = null;
            c.hint((touch() ? 'Your turn! Tap where you want to walk.' : 'Your turn! Click where you want to walk (or use WASD / the arrow keys).') + ' Head for the door at the front.', { x: 20.75, y: 1.9, h: 1.9 });
          }
        } else { const a = cab.attendant; if (a && !bye && near(a, 2.8)) { bye = 1; a.pose = 'wave'; a._hold = 4; bubble(a, 'Thanks for flying with us. Welcome to Maple Bay!'); } }
      },
      done: () => room() === 'airport:concourse',
      exit() { run++; slow(false); if (cut && G.cutscene === cut) G.cutscene = null; cut = null; if (ph) unseat(); if (un) un(); un = null; caption(); ph = ''; },
    }, { before: 'curb' });
  }
  /* ---------- concourse ---------- */
  {
    let offs = [], t = 0, cur = '', ok = false, run = 0, p0 = null;
    I.register({ id: 'concourse',
      async enter(c) {
        const my = ++run; ok = false; t = 0; cur = ''; p0 = null; slow(true);
        if (room() !== 'airport:concourse') { await G.go('int:airport:concourse'); if (my !== run || !at('concourse')) return; }
        const s = ST(); goal('ap_tram', 'Follow the signs to the tram', 'The tram to Baggage Claim leaves from the far end of Concourse B.'); safe(() => G.phone.lock('taxi'));
        if (!s.c0) { s.c0 = 1; caption(null, 'Maple Bay International - Concourse B.', 3400); }
        const on = (ev, fn) => offs.push(G.on(ev, (...a) => { if (at('concourse')) fn(...a); }));
        on('airport:belt', () => { ST().belt = 1; }); on('airport:talk', () => { ST().talk = 1; }); on('shop:open', () => { ST().shop = 1; }); on('msg:reply', th => { if (th === 'jules') ST().replied = 1; });
        ok = true;
      },
      update(dt, c) {
        if (!ok || room() !== 'airport:concourse') return; t += dt; const s = ST(), sc = G.scene, X = G.player.x - 1; let h;
        /* owner msg 271, in this order: 'stretch your legs' as you get off the plane -> Nora's text and the tip for texts -> the counters tip -> walkway, tram */
        if (!p0) p0 = { x: G.player.x, y: G.player.y }; if (!s.mv && (Math.hypot(G.player.x - p0.x, G.player.y - p0.y) > 2 || t > 7)) s.mv = 1;
        if (s.mv && !s.msg) { s.msg = 1; safe(() => G.messages.send({ from: 'jules', text: 'Are you on the ground yet?? My flight tracker froze. Classic.', replies: [{ label: 'Just landed!', value: 'landed', then: 'OK OK OK. Tram, bag, curb. I will text you properly at recess!' }, { label: 'Wheels down. Hunting for the tram.', value: 'tram', then: 'Follow the signs and do NOT get lost in duty free. Talk soon!' }] })); }
        if (!s.mv) h = ['move', 'Tap the ground to walk. Stretch those legs!'];
        else if (s.msg && !s.replied && X < 52) h = phoneOpen() ? ['reply', 'Open Messages and tap a reply to send it to Nora.', msgBtn] : ['phone', 'Bzzt! Nora just texted you. Tap your phone to read it.', '.hud-phone'];
        else if (X < 38 && !s.shop && (s.shopT || 0) < 14) { s.shopT = (s.shopT || 0) + dt; h = ['shop', 'No rush: tap a counter (coffee, noodles, books) to buy something. You have $' + Math.round(safe(() => G.state.player.money, 0)) + '.', sc.spots.coffee]; }
        else if (!s.belt && X < 19) h = ['belt', 'Follow the signs to the Tram. Step onto the moving walkway - it carries you along, and walking on it is even faster.', sc.spots.belt];
        else h = ['tram', 'Keep following the signs: the tram to Baggage Claim is at the far end of the concourse.', sc.spots.tram];
        if (h[0] !== cur) { cur = h[0]; c.hint(h[1], h[2]); }
      },
      done: () => !!G.scene && (G.scene.id === 'airtram' || room() === 'airport:terminal'),
      exit() { run++; slow(false); for (const f of offs) f(); offs = []; ok = false; goalEnd('ap_tram', !!G.scene && (G.scene.id === 'airtram' || room() === 'airport:terminal')); },
    }, { before: 'curb' });
  }
  /* ---------- tram ride ---------- */
  {
    let run = 0;
    I.register({ id: 'tramride',
      async enter(c) {
        const my = ++run; slow(true);
        if (!(G.scene && G.scene.id === 'airtram') && room() !== 'airport:terminal') { await G.go('int:airport:terminal', { x: 36.5, y: 2.9, dir: 1 }); if (my !== run) return; }
        if (G.scene && G.scene.id === 'airtram') c.hint('The tram shuttles between the gates and the Main Terminal. Watch the windows!');
      },
      done: () => room() === 'airport:terminal',
      exit() { run++; slow(false); },
    }, { before: 'curb' });
  }
  /* ---------- baggage claim -> exit ---------- */
  {
    let ok = false, run = 0, t = 0, tb = -1, cur = '', bag = null, it = null, sc = null;
    const clear = () => { if (sc && it) { const i = sc.interactables.indexOf(it); if (i >= 0) sc.interactables.splice(i, 1); } if (sc && bag) safe(() => sc.claim[1].remove(bag)); it = null; bag = null; };
    const grab = () => {
      if (!at('baggage') || ST().bag) return; const s = ST(); s.bag = 1; clear(); safe(() => G.luggage.pickUp()); /* owner msg 165: you tow it from here (sim/luggage.js) */ safe(() => G.audio.sfx('toast'));
      for (const [id, n] of [['granola_bar', 2], ['chocolate_bar', 1], ['canned_coffee', 1]]) safe(() => G.inv.add(id, n, { silent: true }));
      toast('Got your bag! (And the snacks you packed.)', 'good', 3200); goalEnd('ap_bag', true); goal('ap_exit', 'Head through customs to the exit', 'Green channel, then across the arrivals hall to the doors.'); cur = '';
      setTimeout(() => { if (at('baggage') && !G.modal) { safe(() => G.inv.open()); ST().invTip = 1; } }, 700);
    };
    I.register({ id: 'baggage',
      async enter(c) {
        const my = ++run; ok = false; t = 0; tb = -1; cur = ''; bag = null; it = null; slow(true);
        if (room() !== 'airport:terminal') { await G.go('int:airport:terminal', { x: 36.5, y: 2.9, dir: 1 }); if (my !== run || !at('baggage')) return; }
        sc = G.scene; const s = ST(); safe(() => G.phone.lock('taxi'));
        if (s.bag) { goal('ap_exit', 'Head through customs to the exit'); safe(() => G.luggage.pickUp()); } else { goal('ap_bag', 'Collect your bag at carousel 2', 'Baggage claim is just past the tram platform. Carousel 2.'); caption(null, 'Main Terminal. Baggage claim first, then the exit.', 3600); }
        sc.canLeave = () => { if (!at('baggage') || ST().bag) return true; toast('Not without your bag - it is on carousel 2!', 'info'); return false; };
        ok = true;
      },
      update(dt, c) {
        if (!ok) return; if (room() !== 'airport:terminal' || G.scene !== sc) { if (cur !== 'back' && room() === 'airport:concourse') { cur = 'back'; c.hint(ST().bag ? 'The exit is back at the Main Terminal - take the tram.' : 'Your bag is waiting at Baggage Claim - take the tram back.', G.scene.spots && G.scene.spots.tram); } return; } t += dt; const s = ST(), p = G.player, X = p.x - 1, Y = p.y - 1; let h;
        if (!s.bag) {
          if (tb < 0 && (near(sc.spots.claim, 7) || t > 16)) tb = 0; if (tb >= 0) tb += dt;
          if (!bag && tb > TUNE.BAG_DELAY) { bag = sc.claim[1].add({ mine: 1 }); it = { ent: bag, x: bag.x, y: bag.y, z: .44, label: 'Your bag!', h: .7, hit: 16, range: 2.4, use: grab }; sc.interactables.push(it); caption(null, 'There it is - the yellow one with the maple leaf sticker.', 3600); }
          h = bag ? ['grab', 'Your bag is on the belt! Tap it to grab it.', () => bag] : tb >= 0 ? ['wait', 'Carousel 2. Bags are coming out - yours is yellow, you cannot miss it.', sc.spots.claim] : ['find', 'Baggage Claim: find carousel 2 and collect your bag.', sc.spots.claim];
        } else {
          if (s.invTip === 1 && !G.modal) s.invTip = 2;
          if (!s.joke) { const g = sc.life.statics.list.find(q => q.key === 'greet0'); if (g && near(g, 2.6) && X < 19.4) { s.joke = 1; g._hold = 4; bubble(g, 'Mr. Pemberton?! ...Oh. Sorry. You have a very Pemberton walk.', 4200); } }
          h = X > 19.7 ? ['customs', 'Nothing to declare? Walk through the green channel.', sc.spots.customs] : X > 17 && Y < 13.2 && Y > 8 ? ['hall', 'Arrivals! Past the welcome committee and into the hall.', sc.spots.corridor] : ['exit', 'The exit is across the atrium, past the fountain. Your backpack and phone are always in the corner of the screen.', sc.spots.exit];
        }
        if (h[0] !== cur) { cur = h[0]; c.hint(h[1], h[2]); }
      },
      done: () => !!G.scene && G.scene.id === 'city',
      exit() { run++; slow(false); ok = false; clear(); if (sc) sc.canLeave = null; const out = !!G.scene && G.scene.id === 'city'; goalEnd('ap_bag', !!ST().bag); goalEnd('ap_exit', out); const p = G.player; p.carry = false; if (p.poseOpts && p.poseOpts.item) p.poseOpts = null; sc = null; },
    }, { before: 'curb' });
    G.introAirport = { TUNE, state: ST, grabBag: () => { if (at('baggage') && !ST().bag) { if (!bag && sc) bag = sc.claim[1].add({ mine: 1 }); grab(); return true; } return false; } };
  }
}
