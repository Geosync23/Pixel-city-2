// onroad_check: lists every placed prop / tree of the generated city whose footprint overlaps a traffic lane (carriageway, occupancy 1) or rail ballast.
//   node tools/onroad_check.mjs [--all]      exit code 1 when something is found.
// Things that belong there are skipped: vehicles, buildings, rail structures (viaduct, piers, track, platforms over the street), road markings / signals /
// manholes (prop.road.* except street-name signs and bike racks), overhead string lights. --all also prints the props on asphalt OUTSIDE the lanes
// (parking lots: trees and bike racks there are planted on purpose) as information. Runtime additions (city events, clothing store signs) are not in here.
import path from 'node:path'; import { pathToFileURL } from 'node:url';
import { ROOT, genIndex } from './artfiles.mjs';
genIndex(); const imp = f => import(pathToFileURL(path.join(ROOT, f)));
await imp('src/art/index.js'); const { getCity } = await imp('src/world/_city.js');
const w = getCity(), c = w._ctx, all = process.argv.includes('--all');
const SKIP = /^prop\.rail\.|^prop\.road\.(?!sign\.street|bikerack)|^prop\.street\.stringlights|^ex\.|^custom:/;
const bad = [], info = [];
for (const o of w.objs) {
  if (o.a.kind === 'vehicle' || o.a.kind === 'building' || SKIP.test(o.id)) continue;
  let lane = 0, rail = 0, asph = 0;
  for (let x = o.B[0] + .05; x < o.B[3]; x += .2) for (let y = o.B[1] + .05; y < o.B[4]; y += .2) { const t = w.tileType(x, y), k = c.occAt(x, y); if (k === 1) lane++; else if (t === 9) rail++; else if (t === 3) asph++; }
  const at = `${o.id.replace(/#.*/, '')} at (${o.x}, ${o.y}) size ${o.size[0]} x ${o.size[1]}`;
  if (lane || rail) bad.push(`${at}: ${lane ? 'in a traffic lane' : 'on rail ballast'}`); else if (asph) info.push(`${at}: on asphalt outside the lanes (parking lot / forecourt)`);
}
for (const s of bad) console.log('ON ROAD  ' + s);
if (all) for (const s of info) console.log('info     ' + s);
console.log(`\n${w.objs.length} objects checked: ${bad.length} on a road or rail track${all ? `, ${info.length} on lot asphalt (info)` : ''}`);
process.exit(bad.length ? 1 : 0);
