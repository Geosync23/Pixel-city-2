// _jobstory_wear.js — what people wear at work (helper of sim/jobs.js and sim/_jobstory_cast.js; J3).
//   JOB_WEAR[jobId]   the key G.wardrobe.wearTemp() gets at clock-in for the 15 new jobs: a look made of clothes-system pieces (catalogue shapes + the work
//                     pieces drawn in src/art/jobs/uniforms.js). The looks are merged into the wardrobe's LOOKS at import (its documented hook), so a uniform
//                     goes over the player's own body, hair and anything the look does not name. The ten older jobs keep their outfit art (data/jobs.js).
//   CAST_LOOKS[speakerId]   a hand-set look for every job-story speaker who is not a cast.js character (design brief: story/jobs_*.js `look`): age, build,
//                     skin, hair, clothes. The showpiece staff who already stand in their rooms are listed too: until the real figure has been seen in its
//                     room (then its own look is used), a text or a portrait shows this one.
//   STAFF[speakerId]  how to find a showpiece's own staff figure in its room: a pattern on the figure's label.
import { LOOKS } from './wardrobe.js';

const W = '#f4f0e8', INK = '#33303f', NAVY = '#2f3f72', GREY = '#8a8a98', GOLD = '#f0c040';
const UNI = {
  job_gate_agent: { bag: null, top: 'jacket', topColor: NAVY, innerColor: W, neck: 'job_scarfknot', neckColor: '#e8546a', bottom: 'slacks', bottomColor: NAVY, shoes: '#2f2c3a', shoeType: 'loafer', hat: null, scarf: null },
  job_baggage_handler: { bag: null, top: 'hoodie', topColor: '#6a7078', outer: 'job_hivis', outerColor: '#e8e04a', bottom: 'cargo', bottomColor: '#4a4a58', shoes: '#6a4428', shoeType: 'boot', gloves: '#c8a070', hat: null, scarf: null },
  job_station_agent: { bag: null, top: 'job_station', topColor: '#3b5a9a', topColor2: GOLD, neck: 'job_whistle', neckColor: '#d5dbe0', bottom: 'slacks', bottomColor: '#2b2d42', shoes: '#2f2c3a', shoeType: 'oxford', hat: 'job_peaked', hatColor: '#2b2d42', hatBand: '#b8342e', scarf: null },
  job_retail_associate: { bag: null, top: 'tee', topColor: INK, neck: 'lanyard', neckColor: '#e8546a', bottom: 'slacks', bottomColor: INK, shoes: W, shoeType: 'sneaker', hat: null, scarf: null },
  job_museum_guide: { bag: null, top: 'jacket', topColor: '#7a2e3a', innerColor: W, neck: 'lanyard', neckColor: GOLD, bottom: 'slacks', bottomColor: '#4a4a58', shoes: '#2f2c3a', shoeType: 'loafer', hat: null, scarf: null },
  job_florist: { bag: null, top: 'job_apron', topColor: '#e8e2d4', topColor2: '#6f7a48', bottom: 'jeans', bottomColor: '#4a6fa8', shoes: '#6a4428', shoeType: 'boot', hat: null, scarf: null },
  job_aquarist: { bag: null, top: 'polo', topColor: '#2f9a94', neck: 'lanyard', neckColor: NAVY, bottom: 'cargo', bottomColor: '#4a4a58', shoes: '#33303f', shoeType: 'rainboot', hat: null, scarf: null },
  job_hotel_bell: { bag: null, top: 'shirt', topColor: W, outer: 'job_bellcoat', outerColor: '#7a2e3a', outerColor2: GOLD, bottom: 'slacks', bottomColor: INK, bottomColor2: GOLD, botPat: 'sidestripe', shoes: '#2f2c3a', shoeType: 'oxford', gloves: W, hat: 'job_bellcap', hatColor: '#7a2e3a', hatBand: GOLD, scarf: null },
  job_observatory_guide: { bag: null, top: 'turtleneck', topColor: '#2b2d42', outer: 'fleece', outerColor: '#3a3f5c', neck: 'lanyard', neckColor: '#c8322c', bottom: 'slacks', bottomColor: INK, shoes: '#2f2c3a', hat: null, scarf: null },
  job_hair_stylist: { bag: null, top: 'job_smock', topColor: W, topColor2: '#8a9098', accent: '#c8322c', bottom: 'slacks', bottomColor: INK, shoes: '#2f2c3a', shoeType: 'loafer', hat: null, scarf: null },
  job_firefighter: { bag: null, top: 'tee', topColor: NAVY, outer: 'job_turnout', outerColor: '#c8a468', bottom: 'cargo', bottomColor: '#c8a468', bottomColor2: '#e8e04a', shoes: '#33303f', shoeType: 'boot', gloves: null, hat: 'job_firehelmet', hatColor: '#f2c230', hatBand: GOLD, scarf: null },
  job_radio_dj: { neck: 'neckphones', neckColor: INK },
  job_teacher: { bag: null, top: 'cardigan', topColor: '#4a7a58', innerColor: W, neck: 'lanyard', neckColor: GOLD, bottom: 'chinos', bottomColor: '#7a5238', shoes: '#6a4428', shoeType: 'loafer', hat: null, scarf: null },
  job_reporter: { outer: 'trench', outerColor: '#c8ad7a', neck: 'lanyard', neckColor: '#c8322c', bag: 'messenger', bagColor: '#7a5238', hat: null },
};
for (const k in UNI) if (!LOOKS[k]) LOOKS[k] = UNI[k];
export const JOB_WEAR = { gate_agent: 'job_gate_agent', baggage_handler: 'job_baggage_handler', station_agent: 'job_station_agent', retail_associate: 'job_retail_associate', museum_guide: 'job_museum_guide', florist: 'job_florist', aquarist: 'job_aquarist', gull_cook: 'chef',
  hotel_bell: 'job_hotel_bell', observatory_guide: 'job_observatory_guide', hair_stylist: 'job_hair_stylist', firefighter: 'job_firefighter', radio_dj: 'job_radio_dj', teacher: 'job_teacher', reporter: 'job_reporter' };
export const UNIFORMS = UNI;

/* ---------- the people ---------- */
const SK = ['#ffe2c8', '#f8d0aa', '#ecba90', '#dba276', '#c4875a', '#a66a44', '#84502f', '#643c26', '#4a2c1e'];
const HC = { black: '#2b2433', dark: '#4a3022', brown: '#6e4428', light: '#8f5a30', auburn: '#a8452a', ginger: '#d9722e', blond: '#e6c36a', plat: '#f0e4b8', grey: '#a9a9b4', white: '#e8e8ee', silver: '#c8c8d0' };
/** P(age, skin 0..8, hair, hair colour, top, top colour, bottom, bottom colour, extra) */
const P = (age, skin, hair, hc, top, tc, bottom, bc, x) => Object.assign({ age, skin: SK[skin], hair, hairColor: HC[hc] || hc, top, topColor: tc, bottom, bottomColor: bc, hat: null, glasses: false, beard: false, bag: null, scarf: null, outfit: null, build: 'avg', height: 'avg', shoes: '#2f2c3a' }, x);
export const CAST_LOOKS = {
  /* 1 barista */
  tobi: P('adult', 1, 'curtains', 'brown', 'long', '#5a6a8a', 'jeans', '#34507f', { outfit: 'barista', height: 'tall', build: 'slim' }),
  lindgren: P('elder', 0, 'balding', 'white', 'cardigan', GREY, 'slacks', '#7a5238', { innerColor: W, glasses: 'reading', build: 'slim' }),
  suki: P('adult', 1, 'bun', 'black', 'sweater', '#b8563a', 'jeans', '#4a6fa8', { neck: 'longscarf', neckColor: '#e8b83a', build: 'slim' }),
  /* 2 grocery clerk */
  hollis: P('elder', 5, 'balding', 'grey', 'long', '#8a9a8a', 'slacks', '#4a4a58', { outfit: 'grocer', height: 'tall', build: 'slim' }),
  bex: P('adult', 2, 'pixie', 'plat', 'tee', '#f08ab0', 'jeans', '#4a6fa8', { outfit: 'grocer' }),
  moss: P('elder', 0, 'bun', 'white', 'coat', '#6a3a5a', 'longskirt', '#4a4a58', { height: 'short', build: 'slim', bag: 'tote', bagColor: '#c8ad7a' }),
  /* 3 line cook */
  lorraine: P('adult', 1, 'bouffant', '#d8c8a0', 'dress', '#f08ab0', 'skirt', '#f08ab0', { glasses: 'reading', shoes: W, accent: W }),
  tee: P('adult', 6, 'hightop', 'black', 'job_apron', W, 'jeans', '#34507f', { topColor2: '#4a4a58', neck: 'neckphones', neckColor: INK, height: 'tall', build: 'slim' }),
  /* 4 office analyst */
  gideon: P('elder', 4, 'balding', 'grey', 'shirt', W, 'slacks', '#4a4a58', { neck: 'bowtie', neckColor: '#7a2e3a', glasses: true, build: 'slim' }),
  lucia: P('adult', 2, 'chignon', 'dark', 'jacket', '#b83a6a', 'pencil', INK, { innerColor: W, build: 'slim' }),
  finch: P('elder', 0, 'bob', 'white', 'coat', '#e8b83a', 'slacks', '#4a4a58', { height: 'short', bag: 'handbag', bagColor: '#7a5238' }),
  /* 5 courier */
  sal: P('elder', 3, 'short', 'grey', 'coat', '#7a5238', 'slacks', '#4a4a58', { hat: 'flatcap', hatColor: '#6a5a48', beard: 'mustache' }),
  greer: P('elder', 1, 'curlybob', 'grey', 'cardigan', '#5a5f9a', 'longskirt', '#4a4a58', { innerColor: W, glasses: true, neck: 'pearls', neckColor: W }),
  /* 6 fitness trainer */
  winnie: P('elder', 6, 'twa', 'white', 'ziphoodie', '#b89ad8', 'track', '#b89ad8', { height: 'short', build: 'slim', shoes: W }),
  calder: P('adult', 1, 'sidepart', 'light', 'tee', '#5ab0e0', 'shorts', INK, { build: 'broad', neck: 'scarf', neckColor: W, shoes: '#d04a3a' }),
  midge: P('adult', 6, 'buzz', 'black', 'polo', '#d9483b', 'track', NAVY, { neck: 'job_whistle', neckColor: '#d5dbe0', build: 'broad' }),
  /* 7 librarian */
  wendy: P('adult', 2, 'longbangs', 'black', 'cardigan', '#4a7a58', 'skirt', '#7a5238', { innerColor: W, neck: 'lanyard', neckColor: GOLD, height: 'short', build: 'slim' }),
  vasile: P('elder', 1, 'combover', 'grey', 'shirt', W, 'slacks', '#7a5238', { beard: 'mustache', build: 'broad', belt: '#4a3022' }),
  /* 8 nurse */
  faye: P('adult', 1, 'pixie', 'black', 'coat', W, 'slacks', '#4a4a58', { build: 'slim', neck: 'job_whistle', neckColor: '#9aa0a8' }),
  hal: P('adult', 2, 'balding', 'light', 'cardigan', '#b8862e', 'slacks', '#3f8f8a', { innerColor: '#5ab0a8', glasses: 'reading', build: 'broad' }),
  albrecht: P('elder', 0, 'slickback', 'white', 'suit', '#4a4a58', 'slacks', '#4a4a58', { innerColor: W, accent: '#7a2e3a', neck: 'tie', neckColor: '#7a2e3a', build: 'slim' }),
  /* 9 dock worker */
  annie: P('adult', 3, 'lowpony', 'dark', 'long', '#3b6fd0', 'cargo', '#4a4a58', { outer: 'job_hivis', outerColor: '#f28a30', hat: 'hardhat', hatColor: '#f2c230', build: 'broad' }),
  kip: P('adult', 0, 'fringe', 'blond', 'hoodie', '#6a7078', 'cargo', '#4a4a58', { outer: 'job_hivis', outerColor: '#e8e04a', build: 'slim', shoes: '#c8a070', shoeType: 'boot' }),
  wren: P('elder', 2, 'short', 'grey', 'sweater', NAVY, 'cargo', '#e8b83a', { beard: 'full', hat: 'beanie', hatColor: NAVY, build: 'broad', shoeType: 'rainboot' }),
  /* 10 bartender */
  etta: P('elder', 6, 'twa', 'silver', 'coat', '#5a2a4a', 'longskirt', INK, { earring: 'drop', earringColor: GOLD, build: 'slim', height: 'tall' }),
  jonah: P('adult', 1, 'short', 'brown', 'shirt', '#bcd4e8', 'slacks', '#4a4a58', { neck: 'tie', neckColor: GREY, beard: 'stubble' }),
  tomas: P('adult', 1, 'balding', 'brown', 'shirt', W, 'slacks', INK, { neck: 'bowtie', neckColor: '#c8322c', height: 'short', build: 'broad' }),
  /* 11 gate agent */
  connie: P('elder', 3, 'bun', 'silver', 'jacket', NAVY, 'slacks', NAVY, { innerColor: W, neck: 'job_scarfknot', neckColor: '#e8546a' }),
  rafi: P('adult', 3, 'quiff', 'black', 'shirt', W, 'slacks', NAVY, { neck: 'neckphones', neckColor: INK, beard: 'stubble', build: 'slim' }),
  beaumont: P('elder', 5, 'short', 'grey', 'suit', GREY, 'slacks', GREY, { innerColor: W, accent: NAVY, bag: 'duffel', bagColor: '#7a5238', glasses: true }),
  demir: P('elder', 3, 'short', 'grey', 'suit', NAVY, 'slacks', NAVY, { outfit: 'pilot', beard: 'mustache' }),
  juno: P('kid', 6, 'twinbraids', 'black', 'tee', '#e8b83a', 'leggings', '#3b6fd0', { bag: 'backpack', bagColor: '#d9483b' }),
  /* 12 baggage handler */
  lena: P('adult', 1, 'lowpony', 'brown', 'hoodie', '#6a7078', 'cargo', '#4a4a58', { outer: 'job_hivis', outerColor: '#e8e04a', neck: 'neckphones', neckColor: '#d9483b', build: 'broad' }),
  abdi: P('adult', 7, 'skinfade', 'black', 'long', NAVY, 'cargo', '#4a4a58', { outer: 'job_hivis', outerColor: '#e8e04a', build: 'slim', height: 'tall' }),
  winston: P('elder', 6, 'balding', 'white', 'coat', '#9aa0a8', 'slacks', INK, { neck: 'bowtie', neckColor: NAVY, glasses: 'reading', gloves: W }),
  /* 13 station agent */
  ada: P('adult', 7, 'locbun', 'grey', 'shirt', W, 'slacks', '#2b2d42', { outer: 'job_stationcoat', outerColor: '#2b2d42', outerColor2: GOLD, neck: 'job_whistle', neckColor: '#d5dbe0', hat: 'job_peaked', hatColor: '#2b2d42', hatBand: '#b8342e', height: 'tall' }),
  tick: P('adult', 1, 'sidepart', 'ginger', 'waistcoat', '#4a4a58', 'slacks', '#4a4a58', { innerColor: W, build: 'slim' }),
  santos: P('adult', 3, 'short', 'dark', 'long', '#b83a6a', 'slacks', '#4a4a58', { hat: 'headscarf', hatColor: '#3b6fd0', height: 'short', build: 'broad', shoes: '#e8b83a', shoeType: 'rainboot', bag: 'duffel', bagColor: '#3b6fd0' }),
  /* 14 retail associate */
  gwen: P('adult', 1, 'bluntbob', 'grey', 'blouse', W, 'slacks', INK, { neck: 'scarf', neckColor: '#e8b83a' }),
  paolo: P('adult', 2, 'undercut', 'black', 'jacket', '#2f9a94', 'wide', '#ead9b8', { innerColor: INK, build: 'slim' }),
  saffron: P('adult', 6, 'afropuffs', 'black', 'hoodie', GREY, 'pleated', '#4a4a58', { outer: 'blazer', outerColor: NAVY, neck: 'neckphones', neckColor: W, build: 'slim', height: 'short' }),
  price: P('elder', 5, 'short', 'grey', 'ziphoodie', '#7a55c8', 'track', '#7a55c8', { hat: 'visor', hatColor: W, shoes: W }),
  /* 15 museum guide */
  okafor: P('elder', 7, 'short', 'grey', 'long', '#2c3a5e', 'slacks', '#4a4a58', { glasses: true }),
  ines_docent: P('adult', 3, 'lowpony', 'dark', 'jacket', '#7a2f3a', 'slacks', INK, { innerColor: W, neck: 'lanyard', neckColor: GOLD }),
  norm: P('adult', 3, 'combover', 'dark', 'jacket', NAVY, 'slacks', GREY, { innerColor: '#bcd4e8', beard: 'mustache', build: 'broad' }),
  flo: P('elder', 0, 'short', 'white', 'coat', '#4a7a58', 'longskirt', INK, { hat: 'headscarf', hatColor: '#b83a6a', height: 'short', bag: 'handbag', bagColor: INK }),
  /* 16 florist */
  pet: P('elder', 2, 'chignon', 'grey', 'job_apron', '#8a9a8a', 'slacks', '#7a5238', { topColor2: '#c8ad7a', build: 'slim' }),
  wendell: P('elder', 1, 'balding', 'white', 'cardigan', '#4a7a58', 'slacks', '#7a5238', { innerColor: W, glasses: true }),
  hank: P('adult', 7, 'short', 'black', 'tee', W, 'jeans', '#34507f', { outer: 'fleece', outerColor: '#3f8a55', build: 'broad' }),
  babbage: P('adult', 0, 'balding', 'ginger', 'coat', '#c8ad7a', 'slacks', '#4a4a58', { glasses: true, build: 'slim' }),
  odile: P('adult', 1, 'bun', 'dark', 'jacket', INK, 'skirt', INK, { innerColor: W, neck: 'job_scarfknot', neckColor: '#7a2e3a' }),
  /* 17 radio host */
  hattie: P('elder', 1, 'shag', 'grey', 'boilersuit', '#4a6fa8', 'slacks', '#4a6fa8', { neck: 'neckphones', neckColor: INK, build: 'slim' }),
  sunny: P('adult', 4, 'curly', 'black', 'cardigan', '#d9a23a', 'chinos', '#7a5238', { innerColor: W, build: 'slim' }),
  silas: P('elder', 1, 'short', 'white', 'sweater', '#ead9b8', 'slacks', NAVY, { beard: 'full', hat: 'beanie', hatColor: NAVY, build: 'broad' }),
  /* 18 teacher */
  whitlow: P('elder', 6, 'chignon', 'grey', 'cardigan', '#8a3848', 'longskirt', '#4a4a58', { innerColor: W, neck: 'lanyard', neckColor: GOLD, glasses: 'reading' }),
  calloway: P('adult', 5, 'curlyfade', 'black', 'shirt', '#bcd4e8', 'chinos', '#7a5238', { neck: 'tie', neckColor: NAVY, glasses: true, build: 'slim', height: 'tall' }),
  nguyen: P('elder', 2, 'short', 'grey', 'coat', '#7a5238', 'slacks', '#4a4a58', { build: 'slim', height: 'short' }),
  cosmo: P('kid', 2, 'bowl', 'black', 'hoodie', GREY, 'jeans', '#34507f', { hat: 'beanie', hatColor: GREY }),
  juniper: P('kid', 6, 'afropuffs', 'black', 'cardigan', '#d9483b', 'skirt', NAVY, { innerColor: W }),
  ayo: P('kid', 7, 'buzz', 'black', 'shirt', W, 'shorts', NAVY, {}),
  /* 19 aquarist */
  reyes: P('adult', 3, 'lowpony', 'dark', 'polo', '#1f8f9a', 'slacks', '#4a4a58', { neck: 'lanyard', neckColor: NAVY }),
  bart: P('adult', 0, 'short', 'ginger', 'long', NAVY, 'overalls', '#4a5a48', { beard: 'full', hat: 'beanie', hatColor: '#d9483b', build: 'broad', shoeType: 'rainboot', shoes: '#33303f' }),
  tamsin: P('adult', 6, 'boxbraids', 'black', 'tank', '#2f9a94', 'leggings', INK, { neck: 'scarf', neckColor: W, build: 'slim' }),
  /* 20 Gull cook */
  bastien: P('adult', 1, 'crew', 'grey', 'shirt', W, 'slacks', '#4a4a58', { outfit: 'chef', build: 'slim' }),
  sol: P('adult', 3, 'lowpony', 'dark', 'job_smock', W, 'slacks', '#4a4a58', { topColor2: '#c8ccd4', accent: W, hat: 'bandana', hatColor: '#d9483b' }),
  mo: P('adult', 7, 'bald', 'black', 'job_apron', W, 'slacks', '#4a4a58', { topColor2: INK, glasses: 'reading', build: 'broad' }),
  /* 21 hotel bell */
  gus_door: P('elder', 4, 'short', 'silver', 'shirt', W, 'slacks', INK, { outer: 'job_stationcoat', outerColor: '#7a2e3a', outerColor2: GOLD, hat: 'job_peaked', hatColor: '#7a2e3a', hatBand: GOLD, gloves: W, build: 'broad' }),
  marisol: P('adult', 3, 'sleekpony', 'black', 'waistcoat', INK, 'slacks', INK, { innerColor: W, neck: 'bowtie', neckColor: INK }),
  voss: P('elder', 0, 'bouffant', 'white', 'blouse', '#f4e9cf', 'longskirt', '#7a3a6a', { outer: 'kimono', outerColor: '#7a3a6a', outerColor2: GOLD, neck: 'pearls', neckColor: W, build: 'slim' }),
  /* 22 observatory guide */
  halvorsen: P('adult', 0, 'sidepart', 'grey', 'coat', W, 'slacks', '#4a4a58', { glasses: true }),
  stella: P('adult', 3, 'longbangs', 'dark', 'turtleneck', '#2b2d42', 'slacks', INK, { neck: 'lanyard', neckColor: '#c8322c' }),
  ezra: P('kid', 1, 'shag', 'brown', 'puffer', '#3f8a55', 'jeans', '#34507f', { hat: 'pom', hatColor: '#3b6fd0', gloves: '#d9483b' }),
  achebe: P('elder', 7, 'short', 'grey', 'coat', '#c8a070', 'slacks', '#4a4a58', { neck: 'scarf', neckColor: '#b8342e', height: 'tall' }),
  /* 23 reporter */
  max: P('adult', 7, 'shortlocs', 'black', 'shirt', W, 'slacks', INK, { glasses: true, hat: null, build: 'avg' }),
  lev: P('adult', 1, 'slickback', 'light', 'henley', '#8a8a78', 'cargo', '#6f7a48', { outer: 'fieldjacket', outerColor: '#8a8458', beard: 'stubble', bag: 'camera', bagColor: INK, height: 'tall', build: 'slim' }),
  edwina: P('elder', 0, 'bouffant', 'white', 'cardigan', '#c8a8c8', 'longskirt', '#4a4a58', { innerColor: W, neck: 'pearls', neckColor: W, glasses: 'reading', height: 'short' }),
  /* 24 hair stylist */
  pops: P('elder', 6, 'balding', 'white', 'job_smock', W, 'slacks', INK, { topColor2: '#8a9098', accent: '#c8322c', beard: 'mustache' }),
  renee: P('adult', 6, 'skinfade', 'black', 'job_apron', GREY, 'slacks', INK, { topColor2: INK, build: 'slim' }),
  deacon: P('elder', 7, 'short', 'grey', 'suit', INK, 'slacks', INK, { innerColor: W, accent: '#7a2e3a', neck: 'tie', neckColor: '#7a2e3a', height: 'tall' }),
  /* 25 firefighter */
  jo: P('adult', 6, 'twa', 'black', 'job_station', NAVY, 'slacks', NAVY, { topColor2: GOLD, build: 'avg', height: 'tall', belt: INK }),
  dutch: P('adult', 0, 'crew', 'grey', 'job_apron', NAVY, 'cargo', '#c8a468', { topColor2: W, build: 'broad', height: 'tall' }),
  tully: P('adult', 2, 'undercut', 'black', 'tee', NAVY, 'cargo', '#c8a468', { neck: 'job_whistle', neckColor: '#f2c230', bottomColor2: '#e8e04a', build: 'slim', shoeType: 'boot', shoes: '#33303f' }),
};
/** the showpiece's own staff figure in its room (matched on the figure's label) */
export const STAFF = { odile: /^Odile\b/, marisol: /^Marisol\b/, gus_door: /^Gus\b.*door/i, okafor: /^Dr\. Okafor\b/, ines_docent: /^Ines, docent/, wendell: /^Wendell\b/, reyes: /^Dr\. Reyes\b/, halvorsen: /^Dr\. Halvorsen\b/, stella: /^Stella\b/ };
