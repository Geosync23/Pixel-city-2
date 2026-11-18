// railpath_check: nothing tall may stand in the light-rail train's path (small items 2026-11-18; the poplar and birch that grew up through the viaduct deck).
//   node tools/railpath_check.mjs [--v]      exit code 1 when something is found.
// The corridor = the viaduct deck rectangles (LEGS of src/world/_rail.js: 6 wide, along the whole loop). An object is flagged when its footprint (x-y box,
// optionally widened by RP_M tiles, env, default 0) overlaps the corridor AND its top reaches above the deck's underside (deck underside = deckZ - 0.6,
// i.e. about z 7.4 on the north leg, 5.4 on the south leg). So the height threshold is relative to the deck: trees, lamps, signs, poles and anything else
// tall enough to touch the deck or the train. FAIL = the top is more than 0.25 above the track bed (deckZ: into the train's body);
// WARNING = the top is between the deck's underside and that (it pokes into the concrete slab, the train passes clear over it). Skipped: rail structures (prop.rail.*), vehicles, and the buildings the line runs through on purpose
// (stations; listed with --v). Runtime additions (city events) are not in here.
import path from 'node:path'; import { pathToFileURL } from 'node:url';
import { ROOT, genIndex } from './artfiles.mjs';
genIndex(); const imp = f => import(pathToFileURL(path.join(ROOT, f)));
await imp('src/art/index.js'); const { getCity } = await imp('src/world/_city.js'); const { LEGS, deckZ } = await imp('src/world/_rail.js');
const w = getCity(), v = process.argv.includes('--v');
const rects = LEGS.map(L => L.axis === 'x' ? [L.a, L.c - 3, L.b, L.c + 3] : [L.c - 3, L.a, L.c + 3, L.b]);
const SKIP = /^prop\.rail\.|^ex\.rail|^custom:(deck|pier)/;
const CLEAR = .25; // above the rail tops = into the train's body
const bad = [], warn = [], info = [];
for (const o of w.objs) {
  const id = o.id.replace(/#.*/, ''); if (SKIP.test(id) || o.a.kind === 'vehicle') continue;
  const m = +(process.env.RP_M || 0), B = o.B; if (!B) continue;
  for (const R of rects) {
    const x0 = Math.max(B[0] - m, R[0]), y0 = Math.max(B[1] - m, R[1]), x1 = Math.min(B[3] + m, R[2]), y1 = Math.min(B[4] + m, R[3]); if (x1 <= x0 || y1 <= y0) continue;
    const bed = deckZ((x0 + x1) / 2, (y0 + y1) / 2), under = bed - .6, top = B[5];
    if (top <= under) continue;
    const s = `${id} at (${o.x}, ${o.y}) top z ${top.toFixed(2)}, deck underside ${under.toFixed(2)}, track bed ${bed.toFixed(2)}`;
    if (o.a.kind === 'building') info.push(s + ' (building: the line runs through it)'); else if (top > bed + CLEAR) bad.push(s); else warn.push(s); break;
  }
}
for (const s of bad) console.log('IN THE TRAIN\'S PATH  ' + s);
for (const s of warn) console.log('warn (reaches into the deck slab, not the train)  ' + s);
if (v) for (const s of info) console.log('info  ' + s);
console.log(`\n${w.objs.length} objects checked against ${rects.length} deck legs: ${bad.length} tall thing(s) in the train's path (FAIL), ${warn.length} reaching into the deck slab only (warning), ${info.length} building(s) the line passes through`);
process.exit(bad.length ? 1 : 0);
