// Venue interiors, workplaces & services: office, clinic, courier, warehouse, bank. Format + metadata: see venues_lib.js.
import { GT } from '../../engine/world.js';
import { room, V, WY, WX, S } from './venues_lib.js';

// ---------------------------------------------------------------- Hartwell & Finch (open-plan office, 14th floor) 16 x 12
room({ id: 'office', name: 'Hartwell & Finch', w: 16, d: 12, music: 'office', floor: GT.f_carpet,
  floors: [{ x0: 2.5, y0: 0, x1: 10, y1: 1.5, floor: GT.f_tile }, { x0: 10.5, y0: 5.5, x1: 16, y1: 10, floor: GT.f_wood }],
  wall: { color: '#e4e0d4', trim: '#5a6a7a', rail: 1, h: 2.8 },
  items: [WY('office.elevator', .4), WY('office.whiteboard', 11.5), WY('office.chart', 14), WY('generic.clock', 10.4),
    WX('generic.window', 2.2), WX('generic.window', 5.2, { seed: 3 }), WX('office.chart', 8, { kind: 'cork' }),
    V('office.coffee', 3, 0, null, { n: 'use' }), V('generic.cooler', 5, 0), V('office.copier', 6, 0), V('office.filing', 7.5, 0), V('office.filing', 8.5, 0), V('office.server', 15, 0),
    V('office.cubicle', .5, 2, null, { n: 'seats', nk: 'staff' }), V('office.cubicle', 2.5, 2, { scr: '#2a8a6a', cc: '#c0563a', dual: true }),
    V('office.cubicle', 5.5, 2, { pc: '#a8a090', plant: true }, { n: 'seats', nk: 'staff' }), V('office.cubicle', 7.5, 2, null, { n: 'seats', nk: 'staff' }),
    V('office.cubicle', .5, 5, { plant: true }, { n: 'seats', nk: 'staff' }), V('office.cubicle', 2.5, 5, { cc: '#3f6a5a' }, { n: 'seats', nk: 'staff' }),
    V('office.cubicle', 5.5, 5, { scr: '#2a8a6a', dual: true }), V('office.cubicle', 7.5, 5, { cc: '#c0563a' }, { n: 'seats', nk: 'staff' }),
    V('office.meeting', 11, 1.5, null, { n: 'seats', ns: 3, nk: 'staff' }), V('generic.plant', 14.5, 1.5, { kind: 'palm', s: 1.5, pot: '#f1ede4' }),
    V('office.bossdesk', 12, 6.5, null, { n: 'staff' }), V('office.filing', 15, 6), V('generic.floorlamp', 11, 6),
    V('office.printer', 10, 8), V('office.reception', 1.5, 9, null, { n: 'staff use' }), V('generic.sofa', 9.5, 10.5, { c: '#3a5a8a' }, { n: 'seats', ns: 1 }), V('clinic.magtable', 12, 10.5),
    V('generic.plant', .5, 11), V('generic.plant', 15.5, 11),
  ],
  npc: [S(5.25, 1.2, 3, 'stand', 'staff'), S(6.5, 1.6, 3, 'work', 'staff')],
  exits: [{ x: 7, y: 11.5 }] });

// ---------------------------------------------------------------- Bayside Clinic (reception, waiting area, exam bay) 12 x 9
room({ id: 'clinic', name: 'Bayside Clinic', w: 12, d: 9, music: 'quiet', floor: GT.f_lino, floors: [{ x0: 0, y0: 0, x1: 12, y1: 3.5, floor: GT.f_tile }],
  wall: { color: '#eef2ec', trim: '#a8d4cc', rail: 1 },
  items: [WY('clinic.eyechart', .6), WY('clinic.eyechart', 4.3, { kind: 'xray' }), WY('clinic.eyechart', 6.2, { kind: 'body' }), WY('generic.clock', 11.2),
    WX('generic.window', 5.4, { w: 1.5 }), WX('generic.picture', 7.6, { kind: 0 }),
    V('clinic.cabinet', 2, 0), V('clinic.sink', 3, 0), V('clinic.cart', 5, 0), V('clinic.bed', 7.5, .5), V('clinic.iv', 10.5, .5),
    V('clinic.exambed', .5, 1.5), V('clinic.scale', 4.5, 1.5), V('clinic.screen', 3.5, 3.5), V('clinic.screen', 6.5, 3.5),
    V('clinic.nurse', 9.5, 3.5, null, { n: 'seats', nk: 'staff' }),
    V('clinic.reception', .5, 5, null, { n: 'staff use' }), V('bank.ticket', 0, 6.5),
    V('clinic.chairs', 6, 5.5, { n: 4, c: '#4a7ac0' }, { n: 'seats', ns: 3 }), V('clinic.chairs', 6, 7, null, { n: 'seats', ns: 2 }), V('clinic.magtable', 8.5, 6.5),
    V('clinic.wheelchair', 10.5, 7), V('generic.cooler', 11.5, 5.5), V('generic.plant', 0, 8.5), V('generic.plant', 11.5, 8.5),
  ],
  npc: [S(1.5, 3.1, 3, 'work', 'staff'), S(8.8, 2.4, 3, 'work', 'staff'), S(2.5, 1.1, 3, 'work', 'staff'), S(3, 6.2, 2)],
  exits: [{ x: 3.5, y: 8.5 }] });

// ---------------------------------------------------------------- ZipParcel Depot (courier hub) 13 x 10
room({ id: 'courier', name: 'ZipParcel Depot', w: 13, d: 10, music: 'office', floor: GT.f_concrete, floors: [{ x0: 2.5, y0: 6.5, x1: 13, y1: 10, floor: GT.f_lino }],
  wall: { color: '#c8ccc8', trim: '#f2c230', rail: .3, h: 3.2 },
  items: [WY('courier.dockdoor', .5, { n: 1, open: 1, truck: true }), WY('courier.dockdoor', 4, { n: 2 }), WY('courier.sign', 7.5), WY('courier.sign', 8.6, { kind: 'forklift' }), WY('courier.sign', 9.8, { kind: 'days' }), WY('courier.sign', 11.2, { kind: 'board' }),
    WX('generic.clock', 3.3), WX('generic.extinguisher', 6.3), WX('courier.sign', 8.5, { kind: 'board' }),
    V('courier.pallet', .5, 1.5, { wrap: true, n: 2, band: '#d63a3a' }), V('courier.pallet', 2.5, 1.5, { kind: 'barrels' }), V('courier.forklift', 5, 1.5, { load: true, up: true }), V('courier.cone', 4.5, 3),
    V('courier.shelf', 8.5, 1, null, { n: 'use', nk: 'staff' }), V('courier.shelf', 10.5, 1, { seed: 9, pal: ['#c99a62', '#d63a3a', '#3c64ad', '#f2c230', '#e8e0d0'] }),
    V('courier.conveyor', .5, 4, { w: 4, scan: true, seed: 5 }, { n: 'staff' }), V('courier.bins', 5.5, 4, null, { n: 'use', nk: 'staff' }), V('courier.cage', 8, 4), V('courier.bench', 10, 4.5, null, { n: 'staff' }), V('courier.pile', 12, 3.5),
    V('courier.dispatch', .5, 7, null, { n: 'seats', nk: 'staff' }), V('courier.parcellocker', 3.5, 7.5, null, { n: 'use' }),
    V('office.reception', 8.5, 7, { c: '#f2c230' }, { n: 'staff use' }), V('courier.handtruck', 12.5, 8.5), V('courier.palletjack', 6, 6), V('generic.bench', 10.5, 9.5, null, { n: 'seats', ns: 1 }),
  ],
  npc: [S(2, 1, 3, 'work', 'staff'), S(4.5, 9.2, 0)],
  exits: [{ x: 7, y: 9.5 }] });

// ---------------------------------------------------------------- Pier 7 Freight (dock warehouse) 16 x 13
room({ id: 'warehouse', name: 'Pier 7 Freight', w: 16, d: 13, music: 'office', floor: GT.f_concrete, floors: [{ x0: 0, y0: 0, x1: 10.5, y1: 1.5, floor: GT.f_stone }, { x0: 0, y0: 4.5, x1: 1.5, y1: 8.5, floor: GT.f_stone }],
  wall: { color: '#8a96a0', pattern: 'siding', trim: '#f2c230', rail: .3, h: 3.4 },
  items: [WY('courier.dockdoor', .5, { n: 1, open: 1, truck: true }), WY('courier.dockdoor', 4, { n: 2 }), WY('courier.dockdoor', 7.5, { n: 3, open: 1 }),
    WY('courier.sign', 11, { kind: 'board' }), WY('courier.sign', 12.2), WY('courier.sign', 13.4, { kind: 'forklift' }), WY('generic.clock', 14.8),
    WX('courier.dockdoor', 5, { n: 7, open: 1 }), WX('courier.sign', 9, { kind: 'days' }), WX('generic.extinguisher', 10.5),
    V('generic.lockers', 0, 2, { w: 2, c: '#c8a030' }, { flip: true }),
    V('courier.pallet', 2.5, 2.5, { wrap: true, n: 2, band: '#d63a3a' }, { n: 'use', nk: 'staff' }), V('courier.pallet', 4, 2.5, { n: 2, band: '#3c64ad' }),
    V('courier.pallet', 7, 2.5, { wrap: true, band: '#f2c230' }), V('courier.pallet', 8.5, 2.5, { kind: 'barrels', band: '#3f8a55' }, { n: 'use', nk: 'staff' }),
    V('courier.shelf', 11.5, 2.5, null, { n: 'use', nk: 'staff' }), V('courier.shelf', 13.5, 2.5, { seed: 9 }), V('courier.shelf', 11.5, 5.5, { seed: 14 }), V('courier.shelf', 13.5, 5.5, { seed: 20 }, { n: 'use', nk: 'staff' }),
    V('courier.forklift', 4, 6, { load: true, up: true }, { n: 'seats', nk: 'staff' }), V('courier.palletjack', 8, 6), V('courier.cone', 3, 5.5), V('courier.cone', 7, 7.5),
    V('courier.crates', .5, 9.5), V('courier.crates', 1.5, 9.5), V('courier.pallet', 3, 9.5, { kind: 'barrels', band: '#d63a3a' }), V('courier.cage', 5, 10),
    V('courier.conveyor', 10.5, 8, { w: 4, seed: 2 }, { n: 'staff' }), V('courier.dispatch', 12.5, 10.5, null, { n: 'seats', nk: 'staff' }), V('courier.pile', 15, 10), V('courier.handtruck', 15.5, 8),
    V('courier.forklift', 9, 10.5), V('generic.cooler', 15.5, 0),
  ],
  npc: [S(2, 1, 3, 'work', 'staff'), S(9, 1, 3, 'work', 'staff'), S(1.2, 6.5, 2, 'work', 'staff'), S(11.5, .9, 3, 'stand', 'staff'), S(1.5, 11.6, 3, 'work', 'staff')],
  exits: [{ x: 7.5, y: 12.5 }] });

// ---------------------------------------------------------------- Bay Realty & Trust (tellers + realtor desk) 12 x 9
room({ id: 'bank', name: 'Bay Realty & Trust', w: 12, d: 9, music: 'quiet', floor: GT.f_stone, floors: [{ x0: 7, y0: 0, x1: 12, y1: 4.5, floor: GT.f_carpet }],
  wall: { color: '#e4dcc8', trim: '#2f5a4a', rail: 1, h: 3 },
  items: [WY('bank.vault', .5), WY('bank.safebox', 3.4), WY('generic.clock', 5.6), WY('bank.listings', 7.5), WY('generic.picture', 10.3, { kind: 2, c: '#d8a848' }),
    WX('generic.window', 2.3, { w: 1.5 }), WX('generic.picture', 7.5, { kind: 3, w: 1.5 }),
    V('bank.teller', .5, 2, null, { n: 'staff use' }), V('bank.teller', 3.5, 2, null, { n: 'staff use' }), V('generic.queuepost', 1, 4.5, { n: 3, kind: 'belt' }), V('bank.ticket', 5.5, 4.5),
    V('bank.desk', 8, 1.5, null, { n: 'seats staff' }), V('bank.brochures', 11, 1.5), V('generic.plant', 11.5, 0, { kind: 'palm', s: 1.5, pot: '#f1ede4' }),
    V('bank.atm', 0, 5.5, null, { flip: true, n: 'use' }), V('bank.atm', 0, 6.5, { c: '#3c64ad' }, { flip: true }),
    V('bank.writing', 7, 6), V('generic.sofa', 9, 6.5, null, { n: 'seats' }), V('clinic.magtable', 9.5, 5), V('clinic.chairs', 1.5, 7, null, { n: 'seats', ns: 2 }),
    V('generic.plant', 0, 8.5), V('generic.plant', 11.5, 8.5),
  ],
  npc: [S(2.5, 5.4, 3), S(3.5, 5.4, 3), S(8.5, .9, 3)],
  exits: [{ x: 5, y: 8.5 }] });
