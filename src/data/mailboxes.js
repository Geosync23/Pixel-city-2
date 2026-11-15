// Mailboxes (Direction update 23, owner msg 115): where each home's post arrives, and how you get from the street to your apartment. Pure data; the logic is src/sim/mailboxes.js.
//
// ===== THE ROUTING TUNABLE =====
// MAIL.ROUTE = 'lobby'   (default) the street door of YOUR apartment building opens into its lobby; the stairs / lift there take you up to your flat ("Home"); "Leave" in the flat
//                        brings you down into the lobby, and the lobby's street door puts you outside your building.
//            = 'direct'  the street door goes straight into your flat and "Leave" straight back out (as before); the lobby is reached by its own side door next to the front door
//                        (and its stairs / lift still go up to your flat).
// Try the other one without a rebuild: add `?mailroute=direct` (or `?mailroute=lobby`) to the URL. Houses are not affected (their front door is their front door).
export const MAIL = { ROUTE: 'lobby' };

// APARTMENTS[homeId] = { no (short, for the box), unit (as spoken: "Flat 3B"), up ('stairs' | 'lift': which one the arrival downstairs uses), share: existing lobby room id  |  lobby: spec }
//   share: the building already has a residential lobby (sim/lobbies.js); spec: a new lobby room `lobby:h_<homeId>` built by the same generator (scenes/rooms/lobbies.js lobbyRoom),
//   same fields as scenes/rooms/lobbies2.js + `extra`: hand-placed pieces [{ id (without 'furn.'), x, y, p, flip, wall, at, tags, label, text }] so no two starter lobbies look alike.
const R = 'res';
export const APARTMENTS = {
  juniper_court: { no: '3B', unit: 'Flat 3B', up: 'stairs', lobby: { name: 'Juniper Court', kind: R, style: 'walkup', v: 0, w: 8, d: 6, f: 'bike',
    c: { fl: 'f_check', wc: '#b5654a', wp: 'brick', wt: '#4a3428', m: 'brass', s: '#8a5a3a', r: '#3f6a4a', r2: '#e8c06a', dc: '#4a3428', a: '#3f8a55', rows: 3 },
    extra: [{ id: 'lobby.packages', x: 6.5, y: 1.5, p: { w: 1, seed: 3, c: '#8a5a3a' }, flip: true }, { id: 'generic.picture', wall: 'x', at: 3.5, p: { kind: 1, w: 1 } }],
    blurb: 'The brick hall of Juniper Court: a chequered floor, brass letterboxes and a stair that smells of the bakery next door from six in the morning.', sig: 'The smell of warm bread on the stairs', tryThis: ['Sit on the hall bench', 'Read the notice board'] } },
  saltbox_lofts: { no: '2', unit: 'Loft 2', up: 'stairs', lobby: { name: 'Saltbox Lofts', kind: R, style: 'loft', v: 0, w: 9, d: 7, mir: true,
    c: { fl: 'f_wood', wc: '#e8e4d8', wp: 'planks', wt: '#3f6f9f', s: '#3f6f9f', s2: '#c0704a', r: '#3f6f9f', r2: '#f1ede4', r3: '#5a8ab8', a: '#f2c230', col: 'wood', h: 3.1 },
    extra: [{ id: 'lobby.panel', wall: 'x', at: 6, p: { kind: 'buoy', w: 1 } }],
    blurb: 'Whitewashed boards, timber posts and a freight lift that used to carry salt cod. Somebody always leaves a pair of sea boots by the door.', sig: 'The old salt lift', tryThis: ['Sit on the blue sofa', 'Read the residents\' board'] } },
  easel_house: { no: '4', unit: 'Studio 4', up: 'stairs', lobby: { name: 'The Easel House', kind: R, style: 'walkup', v: 1, w: 8, d: 7,
    c: { fl: 'f_concrete', wc: '#e8b83a', wt: '#3a3f4c', m: 'black', s: '#7a55b0', r: '#e87aa0', r2: '#2f8f8a', dc: '#3a3f4c', a: '#e87aa0', ik: 'checker', mat: 'f_mat', sk: 'tube' }, f: 'bike',
    extra: [{ id: 'lobby.panel', wall: 'y', at: 5.5, p: { kind: 'mural', w: 2 } }, { id: 'lobby.packages', x: 6.5, y: 3, p: { w: 1, seed: 6, c: '#3a3f4c' }, flip: true }],
    blurb: 'A mustard-yellow hall with paint on the floor that nobody admits to, a mural that changes every month and black letterboxes covered in stickers.', sig: 'This month\'s mural', tryThis: ['Look at the mural', 'Read the corkboard'] } },
  birch_lane_flats: { no: '1', unit: 'Flat 1', up: 'stairs', lobby: { name: 'Birch Lane Flats', kind: R, style: 'court', v: 1, w: 9, d: 5, mir: true,
    c: { fl: 'f_lino', wc: '#dfe8d0', wp: 'stripes', w2: '#cfdcc0', wt: '#6a8a5a', m: 'bronze', s: '#6a8a5a', r: '#6a8a5a', r2: '#f1e6c8', dc: '#6a8a5a', ik: 'diamond', wf: '#f1ede4', a: '#e8843a' },
    extra: [{ id: 'lobby.packages', x: 3, y: 0, p: { w: 1, seed: 8, c: '#6a8a5a' } }],
    blurb: 'A green-striped garden hall with a door to the shared yard, a bench under the window and a row of bronze letterboxes polished by one very keen neighbour.', sig: 'The door to the garden', tryThis: ['Sit by the garden door', 'Check the buzzer names'] } },
  marlowe_1br: { no: '5C', unit: 'Apt 5C', up: 'lift', lobby: { name: 'The Marlowe', kind: R, style: 'walkup', v: 2, w: 10, d: 7, f: 'panel',
    c: { fl: 'f_check', wc: '#e4dcc8', wt: '#3a2a2a', m: 'brass', s: '#2f5a4a', r: '#2f5a4a', r2: '#e8dcc0', dc: '#3a2a2a', pc: '#5a3a28', ik: 'border', ch: 'deco' },
    extra: [{ id: 'lobby.packages', x: 0, y: 4, p: { w: 1.5, seed: 2, c: '#5a3a28' }, flip: true }],
    blurb: 'Pre-war and proud of it: a chequered floor, a brass cage lift, a doorman called Mr. Okafor and a picture rail nobody has dusted since the coronation.', sig: 'The brass cage lift', tryThis: ['Say hello to the doorman', 'Sit on the green settee'] } },
  cannery_loft: { no: '6', unit: 'Loft 6', up: 'lift', lobby: { name: 'Cannery Row', kind: R, style: 'loft', v: 1, w: 11, d: 8,
    c: { fl: 'f_concrete', wc: '#8a5a48', wp: 'brick', wt: '#2a2733', s: '#c0704a', r: '#2f8f8a', r2: '#f1ede4', a: '#f2c230', m: 'black', col: 'steel', h: 3.3 },
    extra: [{ id: 'lobby.panel', wall: 'y', at: 9.5, p: { kind: 'chart', w: 1.5 } }],
    blurb: 'The loading hall of the old cannery: raw brick, riveted columns, a freight lift you could park a van in and one long table where the building meets.', sig: 'The cannery freight lift', tryThis: ['Sit at the long table', 'Flop on the leather sofa'] } },
  beacon_penthouse: { no: 'PH', unit: 'the Penthouse', up: 'lift', lobby: { name: 'The Beacon Tower', kind: R, style: 'resgrand', w: 12, d: 8, f: 'fountain',
    c: { fl: 'f_stone', wc: '#2e3440', wt: '#d8a848', m: 'brass', lift: 'deco', desk: 'marble', dn: 'CONCIERGE', dl: 'Concierge', s: '#7a2f3a', dc: '#2a2430', sk: 'fan', cur: '#7a2f3a', ch: 'crystal', dkc: '#e8e4dc', h: 3.2 },
    extra: [{ id: 'lobby.packages', x: 0, y: 5, p: { w: 1.5, seed: 5, c: '#3a3028' }, flip: true }],
    blurb: 'Dark stone, brass and a fountain that never splashes. The concierge knows which lift goes all the way to the top, and who is allowed in it.', sig: 'The private lift to the penthouse', tryThis: ['Sit on the fountain rim', 'Ask the concierge anything'] } },
  inkwell_walkup: { no: '3', unit: 'Studio 3', up: 'stairs', lobby: { name: 'The Inkwell', kind: R, style: 'walkup', v: 0, w: 9, d: 6, mir: true, f: 'pkg',
    c: { fl: 'f_darkwood', wc: '#d8dce8', wt: '#2f3f72', m: 'steel', s: '#2f3f72', r: '#2f3f72', r2: '#e8c06a', dc: '#2f3f72', a: '#e8843a', sk: 'tube', rows: 2 },
    extra: [{ id: 'lobby.packages', x: 7.5, y: 2, p: { w: 1, seed: 11, c: '#2f3f72' }, flip: true }],
    blurb: 'Bare boards, ink-blue paint and a stairwell papered with gig posters. The print shop\'s smell of ink comes up through the floor.', sig: 'Gig posters up the stairs', tryThis: ['Read the notice board', 'Sit on the bench'] } },
  meridian_1407: { no: '14', unit: 'Apt 1407', up: 'lift', lobby: { name: 'Meridian Tower Residences', kind: R, style: 'resgrand', w: 11, d: 7,
    c: { fl: 'f_tile', wc: '#eef2f4', wt: '#3f6f9f', m: 'steel', lift: 'steel', desk: 'glass', dn: 'RESIDENTS', dl: 'Concierge', s: '#3f6f9f', dc: '#3f6f9f', sk: 'tube', cur: '#3aa0c8', ch: 'ring', ik: 'compass', r: '#3f6f9f', r2: '#eef2f4' },
    extra: [{ id: 'courier.parcellocker', x: 0, y: 4, flip: true, tags: ['lobby_packages'] }],
    blurb: 'The residents\' entrance of Meridian Tower: cool tile, a glass desk, steel lifts that go to the fourteenth floor in nine seconds.', sig: 'The express lift', tryThis: ['Sit on the settee', 'Ask the concierge'] } },
  /* these three live in a building that already had a residential lobby (sim/lobbies.js ids are stable; checked against the building at run time) */
  lantern_garret: { no: '5', unit: 'the Garret', up: 'stairs', share: 'lobby:27' },
  sunny_court_flat: { no: 'G1', unit: 'the Garden Flat', up: 'stairs', share: 'lobby:25' },
  netloft_3: { no: '3', unit: 'Loft 3', up: 'stairs', share: 'lobby:47' },
};

// HOUSES[homeId] = curb mailbox look { style: 'wood' | 'metal' | 'brick', c, rc }. Every house-type home (homes.js kind house / villa) is listed; a home in neither table counts as a house without a box
// (its post then waits "at your door" and the menu opens from the Maple Post app).
export const HOUSES = {
  sycamore_house: { style: 'metal', c: '#3f6f9f' }, villa_belvedere: { style: 'brick', c: '#d8cdb8' },
  wren_cottage: { style: 'wood', c: '#f1ede4', rc: '#3f8a6a' }, rosebank_bungalow: { style: 'wood', c: '#f4d8d8', rc: '#b0563a' }, crooked_house: { style: 'wood', c: '#e8dcc0', rc: '#4a3428' },
  bluebird_house: { style: 'metal', c: '#3c64ad' }, thistle_house: { style: 'brick', c: '#a8553f' }, larkspur_house: { style: 'metal', c: '#7a55b0' },
  stepdown_house: { style: 'metal', c: '#5a6272' }, orchard_end: { style: 'brick', c: '#b0644a' }, gulls_rest: { style: 'brick', c: '#9a9a96' },
};
// the family's houses: dressing only (door poi id -> look, whose it is)
export const FAMILY_BOXES = { 'door:home:grandma': { style: 'wood', c: '#f4ecd6', rc: '#8a2f3a', who: 'Nana' }, 'door:home:sibling': { style: 'metal', c: '#b8342e', who: 'Nora' } };
