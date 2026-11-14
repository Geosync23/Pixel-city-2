// One hand-written lobby spec per apartment / office building, grouped by building class and listed in city scan order (sim/lobbies.js assigns them).
// Spec: { name, sign (short text for desks / logos), kind 'res'|'office', style + v (layout family / variant in rooms/lobbies.js), w, d, mir, lifts, f (feature words),
//         c (palette: wc wall colour, wp wall pattern, w2, wt trim, fl floor GT key, m metal, a accent, s seat colour, r/r2 rug or inlay colours ...), blurb, sig, tryThis }
// Classes: twin twotone round brutalist setback banded mirror | mbtv hmaster foundry bayjet townhall shed5 | row.gable row.brick row.stucco row.bay row.timber row.mansard garden court hloft
const R = 'res', O = 'office';
export const LOBBY_SPECS = {
  /* ---------------- downtown towers ---------------- */
  twin: [
    { name: 'Meridian Twin Towers', sign: 'MERIDIAN', kind: O, style: 'glass', w: 15, d: 10, f: 'fountain coffee green', c: { fl: 'f_tile', wc: '#f1ede4', wt: '#b8864a', m: 'brass', a: '#b8864a', s: '#b8864a', s2: '#3a3f4c', lc: '#3a3028', kc: '#3a3028', ka: '#e8c06a', kn: 'MERIDIAN', kl: 'Meridian Espresso', scr: '#3a3028' },
      blurb: 'Two bronze-glass towers sharing one enormous atrium, with a fountain you can sit on and an espresso kiosk that keeps the whole building upright.', sig: 'The atrium fountain', tryThis: ['Sit on the rim of the fountain', 'Get a flat white from Meridian Espresso', 'Read the tenant directory'] },
  ],
  twotone: [
    { name: 'Garnet Exchange', sign: 'GARNET', kind: O, style: 'corp', v: 0, w: 11, d: 8, f: 'gate', c: { fl: 'f_stone', cf: 'f_carpet', wc: '#e8dcd0', wt: '#5a2f3f', m: 'brass', a: '#e8c06a', s: '#7a2f3a', wd: '#6a3040', lgc: '#5a2f3f', dkc: '#6a3040', ch: 'deco', tc: '#d8c8b0' },
      blurb: 'A garnet-red trading house lobby: wine-coloured panelling, brass gates and brokers pretending not to run.', sig: 'Brass security gates', tryThis: ['Wait on the red sofa', 'Check the felt directory'] },
    { name: 'Harbor Trust Building', sign: 'TRUST', kind: O, style: 'deco', w: 12, d: 8, lifts: 2, c: { fl: 'f_check', wc: '#e4dcc8', wt: '#2f4a3f', m: 'brass', pc: '#2f4a3f', lc: '#2f4a3f', dkc: '#2f4a3f', cc: '#2f4a3f', s: '#2f5a4a', mc: '#cfe0d4', ik: 'star', ic: '#2f4a3f' },
      blurb: 'Built in 1929 and proud of it: green marble, a brass sunburst, lifts with dial indicators and a chequerboard floor polished by ninety years of good shoes.', sig: 'The brass sunburst wall', tryThis: ['Watch the lift dials sweep', 'Sit on the green settee', 'Read the directory board'] },
    { name: 'Northgate Centre', sign: 'NORTHGATE', kind: O, style: 'corp', v: 1, w: 10, d: 8, c: { fl: 'f_tile', cf: 'f_carpet', wc: '#dfe8e8', wt: '#2f6f6f', m: 'steel', a: '#2f8f8a', s: '#2f8f8a', wd: '#c8b890', lgc: '#2f6f6f', desk: 'steel', dkc: '#dfe8e8', dir: 'digital', scr: '#1b4a4a' },
      blurb: 'A tidy teal-and-steel lobby where the lifts are on the side wall and the queue belts are always perfectly straight.', sig: 'Side-wall lift bank', tryThis: ['Take a seat by the water cooler', 'Scroll the digital directory'] },
    { name: 'Hollis Price Chambers', sign: 'HOLLIS', kind: O, style: 'corp', v: 0, w: 12, d: 9, mir: true, f: 'books nopatch', c: { fl: 'f_darkwood', wc: '#3f5a4a', wt: '#3a2a1e', m: 'brass', a: '#e8c06a', s: '#5a2f3f', wd: '#5a3a28', lgc: '#3a2a1e', desk: 'green', ch: 'crystal', sk: 'globe', lift: 'deco', lc: '#3a2a1e', rd: '#8a5a3a' },
      blurb: 'Barristers\' chambers with bottle-green walls, a law library in the lobby and a silence you could file.', sig: 'The lobby law library', tryThis: ['Browse the bylaws', 'Sink into the burgundy sofa'] },
  ],
  round: [
    { name: 'Tidewater Insurance Plaza', sign: 'TIDEWATER', kind: O, style: 'glass', w: 12, d: 9, f: 'coffee', c: { fl: 'f_tile', wc: '#eef2f4', wt: '#3f6f9f', m: 'steel', a: '#3aa0c8', s: '#3f6f9f', lc: '#2a4a6a', kc: '#2a4a6a', ka: '#f4fbfc', kn: 'TIDE BAR', kl: 'Tide Bar Coffee', scr: '#1b3a5a' },
      blurb: 'Cool blue glass, a long white welcome desk and the Tide Bar kiosk doing brisk trade in oat-milk everything.', sig: 'Tide Bar Coffee', tryThis: ['Grab an espresso at the Tide Bar', 'Wait on the long blue sofa'] },
    { name: 'Pelican Mutual Tower', sign: 'PELICAN', kind: O, style: 'glass', w: 13, d: 10, mir: true, f: 'tree green', c: { fl: 'f_stone', wc: '#f4f0e4', wt: '#3f7a48', m: 'brass', a: '#e8843a', s: '#3f7a48', s2: '#e8843a', lc: '#2f4a3a', lf: 'f_wood', scr: '#2f4a3a', tc: '#d8c8a0' },
      blurb: 'An indoor tree, a living green wall and orange sofas: the friendliest lobby an insurance company has ever paid for.', sig: 'The atrium tree', tryThis: ['Sit under the indoor tree', 'Look up your floor on the screen'] },
    { name: 'Quay Street Labs', sign: 'QUAY LABS', kind: O, style: 'glass', w: 14, d: 9, f: 'mural coffee bike', c: { fl: 'f_wood', wc: '#f8f4ea', wt: '#e8843a', m: 'black', a: '#e8843a', s: '#7a55b0', cols: ['#2f8f8a', '#f2c230', '#e87aa0', '#f4f0e8', '#7a55b0'], kc: '#e8843a', ka: '#2a2733', kn: 'FUEL', kl: 'Fuel Coffee Cart', scr: '#3a2a4a', lf: 'f_mat', tc: '#3a3f4c' },
      blurb: 'A start-up tower with a mural instead of a logo, bikes in the lobby and a coffee cart called Fuel.', sig: 'The lobby mural', tryThis: ['Order from the Fuel cart', 'Flop on the purple sofa'] },
    { name: 'Brightwater Health Partners', sign: 'BRIGHTWATER', kind: O, style: 'glass', w: 11, d: 9, lifts: 2, c: { fl: 'f_lino', wc: '#eef6f0', wt: '#5aa08a', m: 'steel', a: '#5aa08a', s: '#8ac4b0', s2: '#f1ede4', lc: '#3f7a6a', scr: '#2f5a4a', lf: 'f_tile' },
      blurb: 'Mint walls, soft seats and a lobby so calm it lowers your pulse before you have even found the directory.', sig: 'Mint-green calm', tryThis: ['Take the weight off on the mint sofa'] },
    { name: 'Atlas Maritime Centre', sign: 'ATLAS', kind: O, style: 'corp', v: 0, w: 13, d: 8, f: 'gate chart', c: { fl: 'f_tile', cf: 'f_carpet', wc: '#e4e8f0', wt: '#2f3f72', m: 'steel', a: '#c4c9ce', s: '#2f3f72', wd: '#3a4a7a', lgc: '#2f3f72', desk: 'steel', dkc: '#e4e8f0', dir: 'digital', scr: '#1b2a5a', ch: 'ring' },
      blurb: 'Shipping agents, chart-makers and customs brokers under one navy-blue roof, with a sea chart on the lobby wall.', sig: 'The wall chart of the bay', tryThis: ['Study the sea chart', 'Wait in the navy chairs'] },
  ],
  brutalist: [
    { name: 'Kessler Block', sign: 'KESSLER', kind: O, style: 'brutal', w: 12, d: 9, c: { fl: 'f_concrete', gf: 'f_stone', wc: '#9a9a96', wp: 'tile', wt: '#4a4a48', m: 'steel', a: '#e8843a', s: '#b8b4ac', scr: '#2a2a28', tc: '#6a6a68' },
      blurb: 'Raw concrete, a relief wall and benches you could park a truck on. People either love the Kessler Block or work in it.', sig: 'The concrete relief wall', tryThis: ['Sit on a concrete bench', 'Check the directory screen'] },
    { name: 'Ostrander Institute', sign: 'OSTRANDER', kind: O, style: 'brutal', w: 11, d: 10, mir: true, f: 'vend', c: { fl: 'f_stone', gf: 'f_concrete', wc: '#b0a898', wp: 'tile', wt: '#5a4a3a', m: 'bronze', a: '#3aa0c8', s: '#b07444', pc: '#b0a898', cc: '#b0a898', scr: '#1b3a5a', pd: '#5a4a3a', r: '#7a6a5a', rd: '#b07444' },
      blurb: 'A research institute in warm board-marked concrete with timber benches, four big columns and one very well-used vending machine.', sig: 'Four concrete columns', tryThis: ['Rest on a timber bench', 'Look up a department'] },
  ],
  setback: [
    { name: 'The Lanternworks Building', sign: 'LANTERN', kind: O, style: 'deco', w: 13, d: 9, lifts: 3, c: { fl: 'f_stone', wc: '#3a3440', wt: '#d8a848', m: 'brass', pc: '#2a2430', lc: '#2a2430', s: '#7a2f3a', mc: '#3a3440', ik: 'compass', ic: '#2a2733', r2: '#e8dcc0' },
      blurb: 'Black stone and brass from the days when the Lanternworks lit the whole bay. Three dial-top lifts, two chandeliers, one doorman who has seen everything.', sig: 'Three brass lifts in a row', tryThis: ['Stand on the compass inlay', 'Sit on the wine-red settee', 'Find a tenant on the felt board'] },
    { name: 'Carrow & Finch Tower', sign: 'CARROW', kind: O, style: 'deco', w: 11, d: 8, mir: true, lifts: 2, c: { fl: 'f_tile', wc: '#f1e6d0', wt: '#c0704a', m: 'copper', pc: '#5a3a30', lc: '#5a3a30', dkc: '#5a3a30', cc: '#5a3a30', s: '#2f3f72', mc: '#f1e6d0', ik: 'diamond', ic: '#5a3a30', r2: '#f1e6d0' },
      blurb: 'Cream walls, copper lifts and a diamond floor: the prettiest way in Maple Bay to be told that Mr Finch is in a meeting.', sig: 'Copper lift doors', tryThis: ['Admire the diamond floor', 'Wait on the blue settee'] },
  ],
  banded: [
    { name: 'Bayline Telecom House', sign: 'BAYLINE', kind: O, style: 'corp', v: 1, w: 12, d: 8, mir: true, c: { fl: 'f_carpet', cf: 'f_tile', wc: '#e8ecf4', wt: '#3c64ad', m: 'steel', a: '#3c64ad', s: '#3c64ad', wd: '#b8c4d8', lgc: '#3c64ad', desk: 'glass', dir: 'digital', scr: '#1b2a5a', sk: 'tube' },
      blurb: 'The phone company\'s front hall: blue carpet, a glowing reception desk and screens showing how many calls the city is making right now.', sig: 'The glowing blue desk', tryThis: ['Take a seat', 'Read the directory screen'] },
    { name: 'Maple Bay Gas & Light', sign: 'GAS & LIGHT', kind: O, style: 'corp', v: 0, w: 11, d: 9, f: 'nopatch', c: { fl: 'f_darkwood', wc: '#e8d8b8', wt: '#5a3a28', m: 'brass', a: '#e8c06a', s: '#3f6a5a', wd: '#5a3a28', lgc: '#5a3a28', ch: 'deco', sk: 'globe', lift: 'deco', lc: '#5a3a28', rd: '#8a5a3a' },
      blurb: 'The old utility company headquarters, all dark oak and brass globes. They still keep one gas lamp lit in the lobby, for luck.', sig: 'Oak panelling and brass globes', tryThis: ['Sit under the brass lamp', 'Find a department on the felt board'] },
  ],
  mirror: [
    { name: 'Silver One', sign: 'SILVER ONE', kind: O, style: 'glass', w: 14, d: 9, mir: true, f: 'fountain', c: { fl: 'f_stone', wc: '#dfe3e8', wt: '#7d858e', m: 'steel', a: '#a8b4c4', s: '#5a6272', s2: '#c4c9ce', lc: '#3a3f4c', scr: '#2a2f3c', lf: 'f_tile', tc: '#e4e8ec' },
      blurb: 'Mirror glass outside, silver and stone inside, a quiet fountain in the middle. Everything in Silver One is exactly the same shade of expensive.', sig: 'The silver fountain court', tryThis: ['Perch on the fountain rim', 'Wait on the grey sofa'] },
  ],
  /* ---------------- one-off offices ---------------- */
  mbtv: [{ name: 'MBTV Broadcast House', sign: 'MBTV', kind: O, style: 'media', w: 9, d: 7, c: { fl: 'f_carpet', wc: '#2e3440', wt: '#b8342e', h: 3 },
    blurb: 'Home of Maple Bay Television: a wall of screens, a shelf of local-news awards and a red ON AIR light over Studio A.', sig: 'The ON AIR light', tryThis: ['Watch the wall of screens', 'Sit on the red sofa and feel famous'] }],
  hmaster: [{ name: 'Harbor Authority Office', sign: 'HARBOR', kind: O, style: 'harbor', w: 8, d: 6, c: { fl: 'f_wood', wc: '#e6dcc0', wt: '#7a2f2f', h: 2.8 },
    blurb: 'The harbor master\'s front office: tide tables, a wall chart with pins in it and a lifebuoy that has actually been used.', sig: 'The tide table board', tryThis: ['Read today\'s tides', 'Sit on the bench under the window'] }],
  foundry: [{ name: 'Ironside Foundry — Front Office', sign: 'IRONSIDE', kind: O, style: 'plant', w: 9, d: 7, c: { fl: 'f_lino', wc: '#d8d4c8', wt: '#5f87a8', a: '#e8843a', bc: '#2f8a55', lk: '#5f87a8', sd: '#8a9aa8', dl: 'Foundry floor', dt: 'Hard hats beyond this point. Through the little window: sparks, steam and a crane the size of a house.', h: 2.8 },
    blurb: 'Where the foundry meets the public: a punch clock, a safety board, a vending machine and the distant thunder of the casting floor.', sig: 'The punch clock', tryThis: ['Read the safety board', 'Wait on the plastic chairs'] }],
  bayjet: [{ name: 'BayJet Aviation', sign: 'BAYJET', kind: O, style: 'plant', w: 10, d: 7, mir: true, f: 'plane sofa', c: { fl: 'f_tile', wc: '#eef2f6', wt: '#b8342e', a: '#b8342e', bt: 'APRON', bc: '#b8342e', lk: '#c4c9ce', s: '#2f3f72', dkc: '#f1ede4', sd: '#c4c9ce', dl: 'Hangar', dt: 'Crew and engineers only. Behind the door somebody is whistling inside a jet engine.', h: 3 },
    blurb: 'The charter outfit at the airfield: a framed jet on the wall, model-aircraft trophies and pilots drinking vending-machine coffee.', sig: 'The framed BayJet poster', tryThis: ['Sit in the crew lounge sofa'] }],
  townhall: [{ name: 'Town Hall', sign: 'TOWN HALL', kind: O, style: 'civic', w: 16, d: 10, c: { fl: 'f_stone', wc: '#e8cfa8', wt: '#8a5a3a', h: 3.3 },
    blurb: 'Maple Bay\'s Town Hall: marble columns, a compass rose in the floor, the Permits & Licences window and a notice board that is the city\'s real newspaper.', sig: 'The compass rose floor', tryThis: ['Read the civic notice board', 'Sit on a bench under the chandeliers', 'Ask at the information desk'] }],
  shed5: [{ name: 'Shed 5 Works', sign: 'SHED 5', kind: O, style: 'cowork', w: 13, d: 9, c: { fl: 'f_wood', wc: '#dfe6d8', wt: '#6f9a78', a: '#6f9a78', s: '#e8843a', r: '#3f6a5a', r2: '#f1ede4', cols: ['#f4e9cf', '#6f9a78', '#e8843a', '#2f5a4a', '#f2c230'], h: 3 },
    blurb: 'An old harbor shed turned co-working space: long shared tables, bikes, a mural and the Bean Bar, which is open to anyone who walks in.', sig: 'The Bean Bar', tryThis: ['Order at the Bean Bar', 'Sit at a shared table', 'Read the members\' board'] }],
  /* ---------------- old town walk-ups ---------------- */
  'row.gable': [
    { name: 'The Gablewright Apartments', kind: R, style: 'walkup', v: 0, w: 7, d: 5, f: 'pkg', c: { fl: 'f_check', wc: '#b5654a', wp: 'brick', wt: '#5a3a28', m: 'brass', s: '#8a5a3a', r: '#7a2f3a', r2: '#e8c06a', dc: '#5a3a28', a: '#c0392b' },
      blurb: 'A brick walk-up with a chequered hall, brass mailboxes and a stairwell that smells of somebody\'s Sunday roast.', sig: 'Brass mailboxes', tryThis: ['Read the notice board', 'Sit on the hall bench'] },
    { name: 'Copper Kettle Court', kind: R, style: 'walkup', v: 1, w: 7, d: 6, mir: true, f: 'bike arch', c: { fl: 'f_wood', wc: '#e8d8b8', wt: '#8a4a34', m: 'copper', s: '#b07444', r: '#8a4a34', r2: '#e8d8b8', dc: '#a8553f', a: '#2f8f8a', ik: 'checker' },
      blurb: 'Cream walls, copper mailboxes and an arched stair. There is always a bicycle in the hall and nobody knows whose.', sig: 'The arched stairway', tryThis: ['Sit on the bench by the stairs', 'Check the notices'] },
    { name: 'The Tanner\'s Rest', kind: R, style: 'walkup', v: 0, w: 7, d: 6, mir: true, f: 'stairdoor bike', c: { fl: 'f_darkwood', wc: '#a8805a', wp: 'planks', wt: '#4a3428', m: 'bronze', s: '#5a3a28', r: '#3f6a5a', r2: '#e8c878', dc: '#4a3428', dc2: '#7a5a3a', a: '#f2c230', rows: 2 },
      blurb: 'A timber-lined hall in an old tannery row: dark boards, a bronze letter rack and a door to the stairs that always sticks.', sig: 'Timber-plank walls', tryThis: ['Sit on the bench', 'Read the corkboard'] },
  ],
  'row.brick': [
    { name: 'The Wexford', kind: R, style: 'walkup', v: 2, w: 8, d: 6, f: 'panel', c: { fl: 'f_check', wc: '#77575a', wp: 'brick', wt: '#3a2a2a', m: 'brass', s: '#7a2f3a', r: '#7a2f3a', r2: '#e8dcc0', dc: '#3a2a2a', pc: '#5a3030', ik: 'border', ch: 'crystal' },
      blurb: 'Four floors of plum brick with a cage lift, a crystal chandelier and a doorman who knows every resident\'s dog by name.', sig: 'The cage lift', tryThis: ['Chat with the doorman', 'Sit on the red settee', 'Read the notice board'] },
    { name: 'Mortimer House', kind: R, style: 'walkup', v: 0, w: 8, d: 5, f: 'lift pkg', c: { fl: 'f_stone', wc: '#a8553f', wp: 'brick', wt: '#4a4a52', m: 'steel', s: '#5a6272', r: '#3a3f4c', r2: '#c4c9ce', dc: '#4a4a52', sk: 'tube', a: '#3c64ad' },
      blurb: 'A solid red-brick block with a stone floor, steel letterboxes and a cage lift that announces itself three floors early.', sig: 'Steel letterboxes', tryThis: ['Sit on the bench', 'See what the notices say'] },
  ],
  'row.stucco': [
    { name: 'Pistachio House', kind: R, style: 'walkup', v: 1, w: 6, d: 6, f: 'arch pkg', c: { fl: 'f_tile', wc: '#c9d6b8', wt: '#5a7a5a', m: 'steel', s: '#e8e2d4', r: '#5a7a5a', r2: '#f1ede4', dc: '#8aa88a', ik: 'diamond', mat: 'f_check' },
      blurb: 'A pistachio-green hall with a tiled floor and an arched stair. The whole building smells faintly of lemon polish.', sig: 'Pistachio walls', tryThis: ['Sit on the white bench', 'Read the corkboard'] },
    { name: 'The Sage Apartments', kind: R, style: 'walkup', v: 0, w: 9, d: 5, f: 'bike pkg', c: { fl: 'f_lino', wc: '#dfe8d0', wp: 'stripes', w2: '#cfdcc0', wt: '#6a8a5a', m: 'bronze', s: '#6a8a5a', r: '#6a8a5a', r2: '#f1e6c8', dc: '#6a8a5a', sk: 'fan', a: '#e8843a' },
      blurb: 'A long, striped, sage-green hallway with a picture nobody chose and a pile of parcels for the flat that is never home.', sig: 'Striped wallpaper', tryThis: ['Sit by the window', 'Check the notice board'] },
  ],
  'row.bay': [
    { name: 'The Larkspur', kind: R, style: 'walkup', v: 1, w: 7, d: 7, c: { fl: 'f_darkwood', wc: '#c8cfe8', wp: 'stripes', w2: '#b8c0e0', wt: '#4a4a7a', m: 'brass', s: '#4a4a7a', r: '#4a4a7a', r2: '#e8dcc0', dc: '#4a4a7a', sk: 'fan', ik: 'border', mat: 'f_carpet' },
      blurb: 'A Victorian bay-front with larkspur-blue striped walls, fan lamps either side of the stair and a deep hall with two windows.', sig: 'Fan lamps by the stair', tryThis: ['Sit on the hall bench', 'Read the notices'] },
    { name: 'The Buttercup Apartments', kind: R, style: 'walkup', v: 0, w: 8, d: 6, f: 'bike', c: { fl: 'f_wood', wc: '#f0d890', wp: 'stripes', w2: '#e8c878', wt: '#8a5a3a', m: 'brass', s: '#c0563a', r: '#c0563a', r2: '#f0d890', dc: '#8a5a3a', a: '#3f8a55', sk: 'globe' },
      blurb: 'Butter-yellow stripes, a warm wood floor and the cheeriest hallway on the street, even when the bins are due.', sig: 'Butter-yellow hall', tryThis: ['Sit on the red bench', 'Read the corkboard'] },
  ],
  'row.timber': [
    { name: 'Tudor Arms Apartments', kind: R, style: 'walkup', v: 2, w: 9, d: 6, mir: true, f: 'nodesk panel', c: { fl: 'f_darkwood', wc: '#f0e0c8', wt: '#4a3428', m: 'bronze', s: '#3f5a4a', r: '#3f5a4a', r2: '#e8dcc0', dc: '#4a3428', pc: '#4a3428', ik: 'herring', ch: 'deco', sk: 'globe' },
      blurb: 'Half-timbered outside, oak-panelled inside, with a herringbone floor and a cage lift somebody added in 1931 and nobody has trusted since.', sig: 'Oak panels and herringbone', tryThis: ['Sit on the green settee', 'Check the corkboard'] },
  ],
  'row.mansard': [
    { name: 'The Marguerite', kind: R, style: 'resgrand', w: 9, d: 6, c: { fl: 'f_check', wc: '#e6dce8', wp: 'stripes', w2: '#dccfe0', wt: '#5a4a6a', m: 'brass', lift: 'cage', desk: 'deco', dn: 'CONCIERGE', dl: 'Concierge', s: '#5a4a6a', r: '#5a4a6a', r2: '#f1ede4', dc: '#5a4a6a', ik: 'star', sk: 'fan', cur: '#7a55b0' },
      blurb: 'A little Parisian mansard block with lilac stripes, a star in the floor, a cage lift and a concierge who disapproves of almost everything, charmingly.', sig: 'The concierge desk', tryThis: ['Ask the concierge anything', 'Sit on the lilac settee'] },
  ],
  garden: [
    { name: 'Sunny Court', kind: R, style: 'resgrand', w: 10, d: 7, f: 'fountain arch', c: { fl: 'f_tile', wc: '#f0d890', wt: '#b0563a', m: 'copper', lift: 'steel', desk: 'green', dn: 'PORTER', dl: 'Porter', s: '#b0563a', dc: '#b0563a', sk: 'globe', cur: '#3f8a55', ch: 'ring', dkc: '#2f5a4a' },
      blurb: 'Four sunny-yellow floors around a lobby with a tiled fountain, potted palms and a porter who waves at everybody.', sig: 'The lobby fountain', tryThis: ['Sit on the fountain rim', 'Say hello to the porter', 'Read the notice board'] },
  ],
  /* ---------------- townhouse courts ---------------- */
  court: [
    { name: 'Cobbler\'s Row Court', kind: R, style: 'court', v: 0, w: 9, d: 5, c: { fl: 'f_stone', wc: '#a86a50', wp: 'brick', wt: '#4a3428', m: 'brass', s: '#8a5a3a', r: '#7a2f3a', r2: '#e8c06a', dc: '#4a3428', dc2: '#8a5a3a' },
      blurb: 'The shared hall of an old cobblers\' terrace: flagstones, brick and a long red runner worn pale down the middle.', sig: 'The long red runner', tryThis: ['Sit on the bench', 'Read the notice board'] },
    { name: 'Maple Leaf Court', kind: R, style: 'court', v: 1, w: 10, d: 5, c: { fl: 'f_wood', wc: '#f1e6d0', wt: '#3f6a4a', m: 'bronze', s: '#3f6a4a', r: '#b0563a', r2: '#f1e6d0', dc: '#3f6a4a', ik: 'diamond', wf: '#3f6a4a' },
      blurb: 'A bright shared hall with tall windows either side of the courtyard door and two benches that catch the afternoon sun.', sig: 'The courtyard door', tryThis: ['Sit in the window light', 'Peek at the courtyard'] },
    { name: 'The Linden Court', kind: R, style: 'court', v: 0, w: 10, d: 6, mir: true, f: 'bike', c: { fl: 'f_wood', wc: '#d8e0d0', wp: 'siding', wt: '#5a6a5a', m: 'steel', s: '#e8e2d4', r: '#3f6a5a', r2: '#f1ede4', dc: '#5a6a5a', dc2: '#a8b8a8', a: '#3f8a55', pk: '#a8b8a8', sk: 'tube' },
      blurb: 'Pale green boards, a white bench and a basket bike by the door: the hilltop townhouses keep their hall like a seaside cottage.', sig: 'Clapboard walls', tryThis: ['Sit on the white bench', 'Read the corkboard'] },
    { name: 'Ridgeview Court', kind: R, style: 'court', v: 1, w: 11, d: 5, mir: true, c: { fl: 'f_carpet', wc: '#dcd4e4', wt: '#5a4a6a', m: 'brass', s: '#5a4a6a', r: '#5a4a6a', r2: '#f1ede4', dc: '#5a4a6a', ik: 'border', wf: '#5a4a6a' },
      blurb: 'A carpeted hall in soft lilac with a view through to the courtyard and, on a clear day, the whole bay.', sig: 'Bay view through the courtyard', tryThis: ['Sit under the window', 'Check your (imaginary) post'] },
    { name: 'The Aldercrest', kind: R, style: 'court', v: 0, w: 11, d: 6, f: 'bike', c: { fl: 'f_darkwood', wc: '#c8a878', wp: 'planks', wt: '#4a3428', m: 'copper', s: '#7a4e2d', r: '#2f3f72', r2: '#e8c06a', dc: '#4a3428', dc2: '#7a5a3a', a: '#b8342e', rows: 4, sk: 'globe' },
      blurb: 'Alder-plank walls, copper letterboxes four rows deep and a navy runner: the grandest of the Hillcrest courts.', sig: 'Copper letterboxes', tryThis: ['Sit on the oak bench', 'Read the notices'] },
    { name: 'Skylark Terrace', kind: R, style: 'court', v: 1, w: 9, d: 6, f: 'bike', c: { fl: 'f_tile', wc: '#cfe0ea', wt: '#3f6f9f', m: 'steel', s: '#3f6f9f', r: '#3f6f9f', r2: '#f4fbfc', dc: '#3f6f9f', ik: 'checker', wf: '#f1ede4', a: '#f2c230' },
      blurb: 'Sky-blue walls and a blue-and-white chequer floor. Somebody keeps a yellow bicycle here and polishes it on Sundays.', sig: 'Blue chequer floor', tryThis: ['Sit by the courtyard door'] },
    { name: 'Hilltop Mews', kind: R, style: 'court', v: 0, w: 10, d: 5, c: { fl: 'f_lino', wc: '#e8d0c0', wp: 'stripes', w2: '#e0c4b0', wt: '#8a4a34', m: 'bronze', s: '#8a4a34', r: '#3f6a5a', r2: '#e8d0c0', dc: '#8a4a34', dc2: '#c08a6a', rows: 2 },
      blurb: 'The smallest court at the very top of the hill: peach stripes, a green runner and a parcel shelf everyone is very honest about.', sig: 'Peach-striped hall', tryThis: ['Sit on the bench', 'Read the corkboard'] },
  ],
  /* ---------------- harbor lofts ---------------- */
  hloft: [
    { name: 'The Sail Loft', kind: R, style: 'loft', v: 0, w: 9, d: 7, c: { fl: 'f_concrete', wc: '#8a6a58', wp: 'brick', wt: '#3a3f4c', s: '#c0704a', s2: '#3a3f4c', r: '#3a3f4c', r2: '#c0704a', r3: '#4a4f5c', a: '#c0392b', h: 3.1 },
      blurb: 'Sailmakers worked here for a century. Now it is lofts: brick, steel columns, a freight lift and a sofa by the bikes.', sig: 'The freight lift', tryThis: ['Sit on the leather sofa', 'Read the residents\' board'] },
    { name: 'The Net Loft', kind: R, style: 'loft', v: 0, w: 10, d: 7, mir: true, f: 'bike', c: { fl: 'f_darkwood', wc: '#a8483a', wp: 'brick', wt: '#2a2733', s: '#2f8f8a', r: '#2f8f8a', r2: '#f1ede4', r3: '#3aa09a', a: '#2f8f8a', col: 'brick', h: 3.1 },
      blurb: 'Red brick and dark boards, brick piers and a teal sofa. The parcel lockers were the residents\' first unanimous vote.', sig: 'Brick piers', tryThis: ['Sit on the teal sofa', 'Check the corkboard'] },
    { name: 'Net Loft Quayside', kind: R, style: 'loft', v: 1, w: 10, d: 8, c: { fl: 'f_concrete', wc: '#c8b89a', wp: 'planks', wt: '#5a4a3a', s: '#b8342e', r: '#b8342e', r2: '#f1ede4', a: '#b8342e', m: 'steel', col: 'wood', h: 3.1 },
      blurb: 'Whitewashed boards, timber posts and a long shared table where the building eats together on Fridays.', sig: 'The community table', tryThis: ['Sit at the long table', 'Flop on the red sofa'] },
    { name: 'Old Sail Loft', kind: R, style: 'loft', v: 1, w: 9, d: 8, mir: true, c: { fl: 'f_wood', wc: '#e4e0d8', wt: '#3a3f4c', s: '#3f6a5a', r: '#3f6a5a', r2: '#e8c878', r3: '#4f7a6a', a: '#f2c230', m: 'black', col: 'steel', h: 3.1 },
      blurb: 'The first loft conversion on the quay: white walls, big harbor windows, black letterboxes and a table covered in somebody\'s jigsaw.', sig: 'Big harbor windows', tryThis: ['Sit at the jigsaw table', 'Watch the light through the windows'] },
  ],
};
// if the city ever has more buildings of a class than specs, extra ones reuse the specs in order with a numeral added to the name
export function specFor(key, i) { const a = LOBBY_SPECS[key]; if (!a || !a.length) return null; if (i < a.length) return a[i]; const base = a[i % a.length], k = Math.floor(i / a.length) + 1; return Object.assign({}, base, { name: base.name + ' ' + ['', 'II', 'III', 'IV', 'V'][k - 1 > 4 ? 4 : k - 1], mir: !base.mir, w: base.w + (k % 2), c: Object.assign({}, base.c) }); }
