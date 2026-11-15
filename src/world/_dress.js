// Finishing touches on already-placed city buildings: sign texts and labels that differ from the generator's variant defaults.
// (art audit 2026-11-15, "Hooks"). Nothing moves and no placement param changes: `ob.p` (and so `ob.p.name`, which
// sim/public_places.js and sim/lobbies.js use as a classification key) stays exactly as generated. Only the DRAWN text changes:
// the object gets a thin wrapper asset whose draw() passes the extra params to the real art.
// Each rule: [asset id, x, y, { params only the art reads }]. A rule that finds no object is skipped (and listed in world.dressMiss).
const RULES = [
  // three tattoo / vintage fronts in the Arts Quarter all said INK & IVY: the first keeps it, the others show their own trade
  ['bld.arts.vintage', 224, 90, { name: 'IVY VINTAGE' }],
  ['bld.arts.vintage', 254, 90, { name: 'INK & ZINES' }],
  // brutalist blocks beside City Hall: lit roof sign with the lobby's name (lobby specs in scenes/rooms/lobbies2.js)
  ['bld.downtown.office.brutalist', 194, 241, { sign: 'KESSLER' }],
  ['bld.downtown.office.brutalist', 222, 241, { sign: 'OSTRANDER' }],
  // round towers: lobby name over the door
  ['bld.downtown.tower.round', 182, 283, { name: 'TIDEWATER' }],
  ['bld.downtown.tower.round', 222, 282, { name: 'PELICAN' }],
  ['bld.downtown.tower.round', 238, 159, { name: 'QUAY LABS' }],
  ['bld.downtown.tower.round', 251, 253, { name: 'BRIGHTWATER' }],
  ['bld.downtown.tower.round', 250, 283, { name: 'ATLAS' }],
  // duplicate names: the second of each pair gets its own
  ['bld.harbor.lofts', 209, 331, { name: 'SMOKEHOUSE' }],
  ['bld.downtown.pavilion', 243, 152, { name: 'BLOOM RIVERSIDE' }],
  ['bld.arts.kiosk', 212, 274, { name: 'ESPRESSO' }],
  // the railyard tanks are locomotive fuel, not jet fuel
  ['bld.airport.fueltanks', 329, 317, { label: 'DIESEL', band: '#3f8a55' }],
];
export function build(c) {
  const w = c.world, miss = [];
  for (const [id, x, y, extra] of RULES) {
    const ob = w.objs.find(o => o.id === id && o.x === x && o.y === y); if (!ob) { miss.push(id + '@' + x + ',' + y); continue; }
    const a = ob.a;
    ob.a = Object.assign(Object.create(a), { draw(p) { a.draw(Object.assign({}, p, extra)); } });
    ob._key = id + '|' + JSON.stringify(ob.p) + (ob.flip ? '|F' : '') + '|' + JSON.stringify(extra); // own sprite cache entry
  }
  if (miss.length) w.dressMiss = miss;
}
