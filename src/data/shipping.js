// shipping.js — online ordering for the home (Wave C): who ships how fast, what it costs, how a parcel is boxed. Pure data + tiny pure helpers.
// Used by src/sim/orders.js (G.orders), src/ui/phone_home.js (the Roomy app) and src/ui/furnish.js (the Shop tab of design mode).
//
// SHIPPING TABLE (days from ordering to the doorbell, 1-4):
//   seller speed  + size of the biggest piece in the parcel        (clamped to 1..4)
//   local shops 1 day (Lumen, Leaf & Loam, Warp & Weft, Copper Pan, Spoke & Strum, Voltaic)
//   stores      2 days (Bellwether, Kestrel & Pine, Sleepyhead, Timber & Trowel, The Gilded Attic)
//   warehouses  3 days (Fjord & Fold flat-pack, Atelier Nord made to order)
//   size: small (you could carry it) +0, medium +0, large (sofas, beds, wardrobes: 2 tiles of floor or more) +1
//   EXPRESS: next day whatever the seller, EXPRESS.fee + EXPRESS.large per large piece. Not offered when the parcel is next-day anyway.
//   Standard postage FEE.standard per parcel, free from FEE.freeFrom. Assembly service FEE.assembly per flat-pack piece (it then arrives built).
//   The van comes between WINDOW.from and WINDOW.to o'clock; the exact time is known when you order and stands in the planner.
//   Small parcels are left at the door. A parcel with a big piece needs you IN: if you are out the courier comes again the next day (MISSED.tries times),
//   after that (or when you ask in the app: "Leave it at my door") it waits inside your door.
export const COURIER = 'Bay Parcel';
export const SELLER_DAYS = {
  'goods:lumen': 1, 'goods:loam': 1, 'goods:warp': 1, 'goods:copper': 1, 'goods:spoke': 1, 'goods:voltaic': 1,
  'goods:bellwether': 2, 'goods:kestrel': 2, 'goods:sleepy': 2, 'goods:timber': 2, 'goods:attic': 2,
  'goods:fjord': 3, 'goods:nord': 3,
};
export const SELLER_NOTE = {
  'goods:fjord': 'Flat-pack from the warehouse: cheap, slow, some assembly.', 'goods:nord': 'Made to order.', 'goods:attic': 'One of a kind, packed by hand.',
  'goods:timber': 'Flat-pack for the big pieces.',
};
export const FEE = { standard: 5, freeFrom: 150, assembly: 10 };
export const EXPRESS = { fee: 12, large: 6 };
export const WINDOW = { from: 9, to: 13 };
export const MISSED = { tries: 2 };
export const CANCEL = { untilHour: 7 };          /* an order can be cancelled (full refund) until 07:00 on the day it is due */
export const BOX_MAX = 8;                        /* unopened boxes a home holds; anything more is stacked straight into storage */
export const CART_MAX = 24;
/** flat-pack sellers and the categories they flat-pack */
const FLAT_SELLERS = ['goods:fjord', 'goods:timber'], FLAT_CATS = ['storage', 'tables', 'beds', 'seating', 'outdoor', 'fitness'];

/** size class of a good: 's' small (carry), 'm' medium, 'l' large. `size` = [w, d, h] of its art (optional). */
export function sizeOf(g, size) { if (!g) return 'm'; if (g.carry) return 's'; const area = size ? size[0] * size[1] : 1; return area >= 2 || g.tag === 'bed' ? 'l' : 'm'; }
export const isFlat = (g, storeId) => !!g && !g.carry && FLAT_SELLERS.includes(storeId) && FLAT_CATS.includes(g.cat);
/** days a parcel takes: seller speed + 1 when it holds a large piece; express = 1 */
export function shipDays(storeId, sizes, express) { if (express) return 1; const d = (SELLER_DAYS[storeId] || 2) + (sizes.includes('l') ? 1 : 0); return Math.max(1, Math.min(4, d)); }
export function shipFee(sub, sizes, express) { const std = sub >= FEE.freeFrom ? 0 : FEE.standard; return express ? std + EXPRESS.fee + EXPRESS.large * sizes.filter(s => s === 'l').length : std; }
export const dayText = n => (n <= 1 ? 'Next day' : `${n} days`);

/* ---------- browse by room ---------- */
export const ROOMS = [
  { id: 'living', name: 'Living room', icon: 'gcat.seating', has: g => ['seating', 'rugs', 'electronics', 'decor'].includes(g.cat) || (g.cat === 'tables' && !/desk/i.test(g.name)) || (g.cat === 'lighting' && g.place !== 'wall') || g.tag === 'bookshelf' },
  { id: 'bedroom', name: 'Bedroom', icon: 'gcat.beds', has: g => g.cat === 'beds' || g.cat === 'storage' || (g.cat === 'lighting' && g.place === 'surface') || g.cat === 'rugs' },
  { id: 'kitchen', name: 'Kitchen & dining', icon: 'gcat.kitchen', has: g => g.cat === 'kitchen' || (g.cat === 'tables' && /dining|kitchen|bistro|bar/i.test(g.name)) || (g.cat === 'seating' && /stool|dining|chair/i.test(g.name) && g.tag !== 'sofa') },
  { id: 'study', name: 'Desk & hobbies', icon: 'gcat.hobby', has: g => ['hobby', 'music', 'fitness'].includes(g.cat) || g.tag === 'computer' || /desk/i.test(g.name) || g.tag === 'bookshelf' || g.tag === 'easel' },
  { id: 'bath', name: 'Bathroom', icon: 'gcat.bath', has: g => g.cat === 'bath' },
  { id: 'walls', name: 'On the walls', icon: 'gcat.wall', has: g => g.place === 'wall' },
  { id: 'green', name: 'Plants', icon: 'gcat.plants', has: g => g.cat === 'plants' },
  { id: 'out', name: 'Balcony & garden', icon: 'gcat.outdoor', has: g => g.cat === 'outdoor' },
];
export const STYLES = { modern: 'Modern', classic: 'Classic', midcentury: 'Mid-century', cottage: 'Cottage', glam: 'Glam', rustic: 'Rustic', japandi: 'Japandi', boho: 'Boho', retro: 'Retro', kids: 'Playful', coastal: 'Coastal', industrial: 'Industrial', gamer: 'Gamer' };
/** words a search matches against */
export const searchText = g => (g.name + ' ' + g.cat + ' ' + g.style + ' ' + g.tag + ' ' + (g.colour || '') + ' ' + (g.tags || []).join(' ') + ' ' + g.place).toLowerCase();
