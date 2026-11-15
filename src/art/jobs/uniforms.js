// Work clothes for the jobs (J3): new garment SHAPES for the clothes system (src/art/chars/_shapes.js; guide: docs/reports/clothes_drawing.md), drawn where an
// existing piece was the wrong thing (the gate agent wore a pilot's jacket, the bell wore a taxi driver's cap). Not sold in any shop: sim/_jobstory_wear.js
// builds each job's uniform from these and from catalogue shapes.
//   outer  job_turnout (firefighter's coat: reflective bands)   job_hivis (sleeveless hi-vis vest)   job_bellcoat (double row of gold buttons)   job_stationcoat (brass buttons, braid)
//   top    job_apron (shirt + bib apron in the second colour)   job_smock (barber's side-buttoned jacket)   job_station (uniform shirt: epaulettes, pocket flap, name tape)
//   hat    job_firehelmet   job_peaked (peaked cap with a band and a badge)   job_bellcap (pillbox with a chin strap)
//   neck   job_whistle (a whistle / stopwatch on a cord)   job_scarfknot (a silk scarf knotted at the side: the gate agents)
import { regShape } from '../chars/_shapes.js';

const REFL = '#e8e04a', SILVER = '#d5dbe0';
regShape('outer', 'job_turnout', { sleeve: 9, tail: 2,
  body(c, x, j, g) { return j === 2 || j === g.T - 1 ? REFL : null; },
  front(g) { g.t(1, 0, g.dk(g.body, .32)); if (g.wide) g.t(2, 0, g.dk(g.body, .32)); for (let j = 1; j < g.T; j++) if (j !== 2 && j !== g.T - 1) g.t(1, j, g.dk(g.body, .16)); g.t(1, 2, SILVER); g.t(0, 1, g.GOLD); },
  back(g) { g.row(0, g.dk(g.body, .28)); g.t(0, 2, SILVER); g.t(-1, 2, SILVER); g.t(1, 2, SILVER); } });
regShape('outer', 'job_hivis', { sleeve: 0, arm: 'inner',
  body(c, x, j, g) { return j === 1 || j === g.T - 2 ? SILVER : null; },
  front(g) { for (let j = 0; j < g.T; j++) g.t(1, j, g.inner); g.t(0, 0, g.inner); },
  back(g) { g.t(0, 0, g.dk(g.body, .12)); } });
regShape('outer', 'job_bellcoat', { sleeve: 9,
  front(g) { const b = g.c2 || g.GOLD; g.row(0, b); g.t(1, 0, g.sk); for (let j = 1; j < g.T - 1; j += 2) { g.t(0, j, b); g.t(g.wide ? 2 : 1, j, b); } g.row(g.T - 1, b); },
  back(g) { const b = g.c2 || g.GOLD; g.row(0, b); g.row(g.T - 1, b); } });
regShape('outer', 'job_stationcoat', { sleeve: 9, tail: 3,
  front(g) { const b = g.c2 || g.GOLD; g.t(1, 0, g.inner); g.t(0, 0, g.lt(g.body, .2)); if (g.wide) g.t(2, 0, g.lt(g.body, .2)); for (let j = 1; j < g.T; j += 2) g.t(1, j, b); g.t(g.x0, 1, b); },
  back(g) { g.row(0, g.lt(g.body, .18)); g.t(0, g.T - 2, g.dk(g.body, .2)); g.t(0, g.T - 1, g.dk(g.body, .2)); } });
regShape('top', 'job_apron', { sleeve: 9,
  front(g) { const a = g.c2 || '#f4f0e8'; g.t(0, 0, a); for (let j = 1; j < g.T; j++) { g.t(0, j, a); g.t(1, j, a); if (g.wide) g.t(2, j, a); } g.t(1, 2, g.dk(a, .2)); g.t(1, 0, g.sk); },
  back(g) { const a = g.c2 || '#f4f0e8'; g.t(0, 0, a); g.t(-1, g.T - 3, a); g.t(0, g.T - 3, a); g.t(1, g.T - 3, a); g.t(0, g.T - 2, g.dk(a, .2)); } });
regShape('top', 'job_smock', { sleeve: 2,
  front(g) { g.t(1, 0, g.sk); g.t(0, 0, g.dk(g.body, .12)); for (let j = 1; j < g.T - 1; j++) g.t(g.x1, j, g.dk(g.body, .22)); g.t(g.x1, 1, g.c2 || '#8a9098'); g.t(g.x1, 3, g.c2 || '#8a9098'); g.t(0, 2, g.accent); g.row(g.T - 1, g.dk(g.body, .1)); },
  back(g) { g.row(0, g.dk(g.body, .12)); g.row(g.T - 1, g.dk(g.body, .1)); } });
regShape('top', 'job_station', { sleeve: 2,
  front(g) { g.t(1, 0, g.sk); g.t(g.x0, 0, g.c2 || g.GOLD); g.t(g.x1, 0, g.c2 || g.GOLD); g.t(0, 1, g.lt(g.body, .3)); g.t(0, 2, g.dk(g.body, .2)); for (let j = 1; j < g.T; j++) g.t(1, j, g.dk(g.body, .14)); g.row(g.T - 1, g.dk(g.body, .3)); g.t(1, g.T - 1, g.GOLD); },
  back(g) { g.t(g.x0, 0, g.c2 || g.GOLD); g.t(g.x1, 0, g.c2 || g.GOLD); g.row(g.T - 1, g.dk(g.body, .3)); } });
regShape('hat', 'job_firehelmet', { draw(g) { const c = g.c, b = g.band || '#f0c040'; g.R(-2, 2, 8, c); g.R(-3, 3, 7, c); g.R(-3, 3, 6, c); g.R(-5, g.bf, 5, g.dk(c, .22)); g.R(-5, -4, 4, g.dk(c, .3)); g.p(g.cx - 1, g.yb - 8, g.lt(c, .35)); g.p(g.cx, g.yb - 9, g.dk(c, .15)); if (g.front) { g.p(g.cx + 2, g.yb - 7, b); g.p(g.cx + 2, g.yb - 6, b); g.p(g.cx + 1, g.yb - 6, g.dk(b, .2)); } } });
regShape('hat', 'job_peaked', { draw(g) { const c = g.c, b = g.band || g.accent; g.R(-3, 3, 8, c); g.R(-4, 3, 7, c); g.R(-3, 3, 6, b); g.R(-3, 3, 5, g.dk(c, .1)); g.R(3, g.bf, 5, '#22202a'); g.p(g.cx - 2, g.yb - 8, g.lt(c, .25)); if (g.front) g.p(g.cx + 2, g.yb - 7, '#f0c040'); } });
regShape('hat', 'job_bellcap', { cut: false, draw(g) { const c = g.c, b = g.band || '#f0c040'; g.R(-2, 2, 8, c); g.R(-2, 2, 7, c); g.R(-2, 2, 6, b); g.p(g.cx - 1, g.yb - 8, g.lt(c, .3)); if (g.front) { g.p(g.cx + 3, g.yb - 4, '#22202a'); g.p(g.cx + 3, g.yb - 2, '#22202a'); } } });
regShape('neck', 'job_whistle', { draw(g) { const c = g.c || '#d5dbe0', d = '#33303f'; if (!g.front) { g.p(g.L, g.yS, d); return; } g.p(g.L, g.yS, d); g.p(2 + g.L, g.yS, d); g.p(g.L, g.yS + 1, d); g.p(1 + g.L, g.yS + 2, d); g.p(1 + g.L, g.yS + 3, c); g.p(2 + g.L, g.yS + 3, c); } });
regShape('neck', 'job_scarfknot', { draw(g) { const c = g.c || '#e8546a'; if (!g.front) { for (let x = -1; x <= 1; x++) g.p(x + g.L, g.yS, c); return; } for (let x = 0; x <= Math.min(2, g.x1); x++) g.p(x + g.L, g.yS, c); g.p(g.L, g.yS + 1, c); g.p(g.L - 1, g.yS + 2, c); g.p(g.L, g.yS + 2, '#f4f0e8'); } });
