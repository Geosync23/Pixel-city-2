// REAL FIXTURES for job stations that used a stand-in (J3; the list: docs/reports/jobs_engine.md "Stand-ins that want a real fixture").
// The rooms belong to other systems, so nothing in their files is edited: at start-up each fixture below is APPENDED to the room definition's item list in
// memory (add-only: nothing is moved, replaced or removed; a fixture is left out when its spot is taken or the room is not found). Art: src/art/jobs/fixtures.js
// (`furn.job.fix.*`), each tagged only with its job station. sim/_jobstory_stations.js prefers the real fixture and falls back to the old stand-in.
//   ADDED  { [roomId]: [{ id, x, y | wall + at, flip?, p? }] }      added() -> [{ room, id, ok }]  (debug: which were appended)
import { G } from '../../core/game.js';
import { ROOMS } from '../interior.js';

export const ADDED = {
  restaurant: [            /* The Gilded Gull: the open kitchen line under the back windows, the walk-in and the quay door on the left wall */
    { id: 'furn.job.fix.gullstove', x: 9.0, y: .1 }, { id: 'furn.job.fix.gullprep', x: 11.45, y: .1 }, { id: 'furn.job.fix.walkin', wall: 'x', at: .55 }, { id: 'furn.job.fix.gulldoor', wall: 'x', at: 6.5 }],
  'pub:22': [              /* Otis & Sons Barbershop: the shampoo basin behind the till */
    { id: 'furn.job.fix.barbersink', x: 8.2, y: 4.1 }],
  aquarium: [              /* the keepers' corner on the left wall of the tropical hall */
    { id: 'furn.job.fix.fishkitchen', x: .1, y: 6.3, flip: true }, { id: 'furn.job.fix.waterlab', x: .1, y: 4.2, flip: true }],
  conservatory: [          /* the flower room corner of Garden Gifts */
    { id: 'furn.job.fix.flowercooler', x: .9, y: 22.8 }, { id: 'furn.job.fix.floristbench', x: 1.7, y: 25.6 }],
  central_station: [       /* the announcer's booth on the west side of the hall, the lost-property cupboard on the west wall */
    { id: 'furn.job.fix.announcer', x: 1.0, y: 9.5 }, { id: 'furn.job.fix.lostprop', x: .4, y: 16.0, flip: true }],
  observatory: [           /* the terrace kit between the theatre door and the stairs */
    { id: 'furn.job.fix.terracekit', x: 25.7, y: .3 }],
  museum: [                /* Norm's chair by the left foot of the skeleton */
    { id: 'furn.job.fix.guardchair', x: 18.4, y: 10.5 }],
};
const done = [];
function append(room, items) {
  let def = null; try { def = ROOMS.get(room); } catch (e) { def = null; }
  if (!def) { for (const it of items) done.push({ room, id: it.id, ok: false, why: 'no room' }); return; }
  if (def._jobFix) return; def._jobFix = true;
  const extra = items.map(it => Object.assign({ p: {} }, it, { jobFix: true }));
  if (Array.isArray(def.items)) { def.items.push(...extra); for (const it of extra) done.push({ room, id: it.id, ok: true }); }
  else if (typeof def.build === 'function') { const b = def.build; def.build = (arg, g) => { const d = b(arg, g); if (d && Array.isArray(d.items)) d.items = d.items.concat(extra); return d; }; for (const it of extra) done.push({ room, id: it.id, ok: true, dynamic: true }); }
  else for (const it of extra) done.push({ room, id: it.id, ok: false, why: 'no item list' });
}
export const order = 59;   /* after public places / lobbies / places: every room definition exists */
export function init() {
  const run = () => { for (const room in ADDED) try { append(room, ADDED[room]); } catch (e) { console.warn('job fixtures', room, e); } };
  run(); G.on('ready', run);
  G.jobFixtures = { added: () => done.slice(), ADDED };
}
