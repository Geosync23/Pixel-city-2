# Home design mode + online ordering + multi-day shipping (Wave C): condensed report
Full API in the headers of `src/ui/furnish.js`, `src/sim/orders.js`, `src/sim/homedesign.js`, `src/sim/housing.js`, `src/data/shipping.js`, `src/ui/phone_home.js`.

## What exists
- **Design mode** (the old Decorate mode, rebuilt on the same data; `G.furnish.open({ tryId?, tab? })`, HUD chip "Decorate", Roomy app).
  - Drag a piece with a finger. It hops up above the fingertip (small pieces further than big ones), snaps to half tiles, green / red footprint, a label over it says why not or what it stands on. Let go on red: it springs back.
  - Wall pieces slide along both back walls (left of the room corner = left wall). Two wall pieces may share a stretch of wall when one hangs above the other.
  - Small `surface` goods stand on the table / shelf / counter under them; move the table and they ride along. Rugs lie under furniture.
  - Tap = select: Turn, Colour (other colourways of the same piece and size), Store, Sell. No confirm dialogs: **Undo** (top left, also U / Ctrl+Z) takes back every step, money included.
  - Tray: "My things" (storage; tap = put down at the nearest free spot to the middle of the view, table tops first for small things) and "Shop" (the whole catalogue as 412 pieces with their colours inside, category chips, search box, loaded 36 tiles at a time).
  - A Shop tile puts a see-through **try piece** with a price tag in your room: drag, turn, recolour, "Add to cart" (its place is remembered) or "Remove". Nothing is paid in design mode. Leaving with loose try pieces asks once whether to put them in the cart.
  - Top bar: Undo, money, the home's Comfort (what the Comfort need settles at here) with the change since you opened the mode, furniture / decor counts, a cart / "Trying $x" chip, Done.
  - Works in the bathroom too (same rules as before).
- **Roomy** phone app (`roomy`, `src/ui/phone_home.js`): Shop (search; by room, kind, style, shop; a page per piece with colours, every seller's price and delivery time, "See it in my room", wish list, add to cart), Wishes, Cart (one parcel per seller, Express, assembly service, total against your balance, Order), Orders (five tracking steps, Cancel, "Leave it at my door", "Always leave big parcels at my door", boxes still waiting at home, history).
- **Shipping** (`src/sim/orders.js`, table in `src/data/shipping.js`):

| | days |
|---|---|
| Lumen, Leaf & Loam, Warp & Weft, Copper Pan, Spoke & Strum, Voltaic | 1 |
| Bellwether, Kestrel & Pine, Sleepyhead, Timber & Trowel, Gilded Attic | 2 |
| Fjord & Fold (flat-pack), Atelier Nord (made to order) | 3 |
| a large piece in the parcel (2 tiles of floor or more, any bed) | +1 (4 at most) |
| Express | next day; $12 + $6 per large piece; not offered when it is next-day anyway |

  Postage $5 per parcel, free from $150. Assembly service $10 per flat-pack piece. Flat-pack = non-carry storage, tables, beds, seating, outdoor, fitness from Fjord & Fold or Timber & Trowel.
  The courier (Bay Parcel) rings between 09:00 and 13:00; the time is fixed at ordering and stands in the Planner ("Delivery: Kestrel & Pine (be in)", reminder 30 min before for big parcels).
  Small parcels are left at the door. A parcel with a big piece needs you in: out -> a "sorry we missed you" notification, next try a day later at the same time; on the second try, or when you tap "Leave it at my door", the boxes are put inside your door.
  Cancel with a full refund until 07:00 on the day it is due. A home holds 8 boxes; the rest goes straight into storage (the toast and the app say so).
- **Boxes and unpacking** (`src/sim/homedesign.js`, art `src/art/homedesign/boxes.js`): small parcel, big carton, flat-pack stack, cardboard pile. Small things of one parcel share a box (4 per box), every bigger piece has its own.
  Tap a box: "Unpack" (4 or 8 minutes) or, for a flat-pack, "Build it" (Tighten the bolts: the timing ring, 4 rounds, "Just build it" skips it) / "Take it slowly" (45 min, no game) / "Not now".
  Then the box bursts, the piece drops into the room with a bounce and sparkles and a "+2 cosy" label: at the place planned in design mode when it is still free, on a table top for small things, else the nearest free spot to the box, storage only when nothing fits. The toast names the Comfort change.
  A cardboard pile stays (1 ambience off per unpacked box, 3 at most) until "Take out the cardboard" (3 minutes, cleanliness +3 each).
  Store purchases that are delivered (the old next-day 09:00 flow) arrive in the same boxes and unpack the same way. Moving boxes are untouched.

## Slot rule (chosen)
Only real furniture counts toward the home's furniture slots (studio 14 ... grand 64). **Decor** has its own allowance of `2 x slots + 10` (studio 38): wall pieces, rugs and other flat things, anything that stands on a surface, and small floor pieces with a footprint of half a tile (plants, floor lamps, baskets).
`G.housing.slots()` -> `{ used, max, decor, decorMax }`, `G.housing.isDecor(itemId)`. Old saves only get roomier.

## Files
New: `src/data/shipping.js`, `src/sim/orders.js`, `src/sim/homedesign.js`, `src/ui/phone_home.js`, `src/art/homedesign/boxes.js`.
Edited: `src/ui/furnish.js` (design mode rewritten; listings code unchanged), `src/ui/furnish.css`, `src/sim/housing.js`, `src/sim/goods.js` (two words: `hd_box`, `hd_card` in NO_TOP; store venues `delivers: false` so a home-goods purchase no longer pops "New app: ZipEats"), `src/sim/goods_sheet.js` (exports `picture`, `facts`, `swatchOf`, `colourName`; picture cached per piece).

## API / state / events
- `G.furnish`: `open({ tryId, store, tab })`, `close()`, `active`, `undo()`, `state()` (tests).
- `G.orders`: `sellers(goodId)`, `best`, `cart()`, `add(goodId, { store, pos, asm })`, `remove(ix)`, `setAsm`, `clearCart`, `inCart`, `quote(express)`, `checkout(express)`, `ships()`, `active()`, `get`, `track(id)`, `cancel(id)`, `leaveAtDoor(id)`, `safe()` / `setSafe`, `wish()`, `toggleWish`, `wished`, `deliverNow(id?)`, `stats()`, `APP`.
  State `G.state.orders = { seq, cart, wish, ships, safe, n, spent }`. Events `order:cart`, `order:placed`, `order:delivered`, `order:missed`, `order:cancel`, `order:wish` (+ `goods:buy`(…, 'online') and `shop:buy` per line).
- `G.homeDesign`: `unpack(boxUid, { fx })`, `building(boxUid)`, `recycle()`, `shop(arg)` (opens Roomy), `design(arg)`, `fx`. Events `homedesign:unpacked`, `homedesign:built`, `homedesign:recycled`.
- `G.housing` additions: `addBox({ label, items, pos, sz, asm, from })`, `BOX_MAX`, `unpack(uid, { place: true, quiet })` -> `{ placed, stored, items }`, `freeSpot(itemId, x, y)`, `snapshot()` / `restore(str)`, `recolour(uid, itemId)`, `isDecor`, `cardboard()`, `recycle()`, `boxKind(box)`; `slots()` has `decor`, `decorMax`. State: `home.card`; boxes may carry `sz`, `pos`, `asm`, `from`.
- Fixture tags `hd_box`, `hd_card`.

## Hooks for the lead
1. `src/sim/apps.js` catalogue row (without it the app is simply on the phone from the first minute):
   `{ id: 'roomy', name: 'Roomy', cat: 'home', tagline: 'What would make it home?', size: '34 MB', rating: 4.8, iconIds: ['app.roomy', 'sofa_t1', 'ui.home'], color: '#d9703a', release: { day: 1, on: 'home:unpack', text: 'your first unpacked box, or day 1' }, desc: 'Furnish your home from the sofa. Every piece in town, tried in your own room before you buy, delivered in 1 to 4 days.', does: ['Browse by room, kind, style or shop', 'See it in my room', 'Wish list, cart and Express', 'Track every parcel to your door'] },`
2. Home computer (`src/sim/activities.js`, in `menu()`, one line next to the other tag rows): `if (tags.includes('computer') && G.homeDesign && isHome(G.scene)) add('Shop for the home', 'Roomy: browse, order, track', () => G.homeDesign.shop());`
3. Optional: an `app.roomy` icon (the app uses the sofa item icon today).

## Verified
With real touch input (Playwright, 390x844, hasTouch, CDP touch events), screenshots `out/shots/hd_*.png`:
- Studio (Juniper Court): open from the HUD chip; tray tap places a sofa; finger drag valid and invalid (springs back, reason shown); select + Turn; table lamp onto the nesting tables ("On the Nesting Tables", z 0.55) and it rides along when the table is dragged; picture and sconce on the walls, dragged along and across the corner, refused over the window; colour swap Mustard -> Teal; Undo of colour, move and a sale (money back); Store; Sell; Done rebuilds the room.
- Shop tab: 412 tiles, search "lamp" (24), category chips, try piece from the phone ("See it in my room"), drag, recolour, Add to cart, leave with a loose try piece -> prompt -> cart.
- Roomy: Shop, list, item page, wish, cart, Express toggle, Order, Orders tab; away from home "See it in my room" explains itself.
- Delivery -> boxes -> tap a carton (the character walks over) -> drop-in; flat-pack -> Build it -> the bolt game played by taps -> built; small parcel of two (lamp onto a table, sconce onto the wall); cardboard taken out.
- One-bedroom (Marlowe), house (Sycamore), villa: design mode with 75 pieces in the tray, 16 placed by taps, a drag, the bathroom; 60 fps everywhere; no page errors in any run. Desktop: mouse drag, U undo, Esc.
Through the API: 1 / 2 / 3 / 4-day arrivals and Express; planned place honoured; missed delivery -> next day -> left at the door; "Leave it at my door"; cancel + refund, too late after 07:00; too little money; full home (8 boxes, rest to storage); save / load mid-order (orders, cart, wish list, boxes, cardboard identical); an old save (no `orders`, no `card`, old `d` boxes and a pending store delivery) loads and unpacks; `validate.mjs` and the build pass; the bundled `dist/index.html` ran the unpack test.
Not verified: a real phone; pinch zoom inside design mode; the planner reminder banner for a delivery; the Decorate tip texts of other systems; the suggested apps.js row and computer line (not applied).

## Known gaps / for the owner
- "See it in my room" works only while you stand in your home (design mode needs the room on screen). Away from home the button says so.
- No post-office tie-in for missed parcels: boxes are put inside your door on the second try. A collection slip would need a small hook in `src/sim/post.js`.
- A piece only turns between two views (as before); wall pieces have a fixed height.
- Try pieces do not collide with each other; planned places are for the main room only.
- Placing a piece in a very full villa can take up to half a second once (finding a free spot); usual cost is about 30 ms.
- Physical store purchases do not arrive as flat-packs (only online orders from Fjord & Fold / Timber & Trowel do), and the doorman perk (same-day) applies to store purchases only.
- Tuning to confirm: decor allowance (2 x slots + 10), cardboard penalty (1 ambience per pile, 3 at most), fees and days in `src/data/shipping.js`.
