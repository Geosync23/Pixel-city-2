// clothing_outfits.js — PRESET OUTFITS of every clothing shop (owner msg 178): ready-made looks put together from pieces the shop sells.
// Pure data (node-safe). A look: { id, name, pieces: [catalogue ids], season?: [0 spring, 1 summer, 2 autumn, 3 winter] (offered only then), sig?: true (made of the NEW pieces) }.
// Rules checked by src/data/validate.mjs (checkOutfits): every piece exists, is sold at that shop, is not a catalogue exclusive, fits the look's season; one piece per slot
// (accessories: one per kind); a top + bottom or a dress, and shoes; 3 to 6 looks per shop. Look pieces are always on that shop's rails (sim/clothes_shop.js inStock).
export const OUTFITS = {};
export const LOOK_BY_ID = {};
const PIECES = {};
for (const shop in OUTFITS) { PIECES[shop] = new Set(); for (const l of OUTFITS[shop]) { l.shop = shop; LOOK_BY_ID[l.id] = l; for (const id of l.pieces) PIECES[shop].add(id); } }
/** is this piece part of one of the shop's looks (then it never rotates out) */
export const lookPiece = (id, shop) => !!(PIECES[shop] && PIECES[shop].has(id));
/** the shop's looks offered in a season (all of them when season is undefined) */
export const looksFor = (shop, season) => (OUTFITS[shop] || []).filter(l => season === undefined || !l.season || l.season.includes(season));
/** validation: returns a list of problems */
export function checkOutfits(PIECE_BY_ID, SHOPS) {
  const errs = [], seen = new Set();
  for (const shop in OUTFITS) {
    if (!SHOPS[shop]) { errs.push(`outfits: unknown shop ${shop}`); continue; } const list = OUTFITS[shop];
    if (list.length < 3 || list.length > 6) errs.push(`outfits: ${shop} has ${list.length} looks (3 to 6 wanted)`);
    for (let s = 0; s < 4; s++) if (looksFor(shop, s).length < 3) errs.push(`outfits: ${shop} has fewer than 3 looks in season ${s}`);
    for (const l of list) {
      if (!l.id || seen.has(l.id)) errs.push(`outfits: duplicate or missing look id ${l.id}`); seen.add(l.id); if (!l.name) errs.push(`outfits: ${l.id} has no name`);
      const slots = {};
      for (const id of l.pieces) {
        const p = PIECE_BY_ID[id]; if (!p) { errs.push(`outfits: ${l.id} references missing piece ${id}`); continue; }
        if (!p.shops.includes(shop)) errs.push(`outfits: ${l.id}: ${id} is not sold at ${shop}`); if (p.online) errs.push(`outfits: ${l.id}: ${id} is a catalogue exclusive`);
        const k = p.slot === 'acc' ? 'acc:' + p.kind : p.slot; if (slots[k]) errs.push(`outfits: ${l.id} has two pieces for ${k}`); slots[k] = 1;
        if (p.season !== null && p.season !== undefined) { const ps = [].concat(p.season); if (!l.season || l.season.some(s => !ps.includes(s))) errs.push(`outfits: ${l.id}: ${id} is seasonal (${ps}) but the look is offered in ${l.season || 'every season'}`); }
      }
      if (!(slots.dress || (slots.top && slots.bottom))) errs.push(`outfits: ${l.id} needs a top and a bottom, or a dress`); if (slots.dress && slots.top) errs.push(`outfits: ${l.id} has a dress and a top`);
      if (!slots.shoes) errs.push(`outfits: ${l.id} has no shoes`);
    }
  }
  return errs;
}
