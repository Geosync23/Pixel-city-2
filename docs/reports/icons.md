# Item icons — notes (src/art/icons/: icons.js, food.js, ui.js, items_food.js, items_home.js, items_wear.js, items_misc.js, extras.js, _lib.js)
- All 365 items have a specific 16x16 icon (558 icons in total incl. needs/skills/ui/jobs/venue pins/app.guide/app.jobs). Root cause of the old colour squares: icons.js never registered the food tables.
- `drawIcon(id, category)` never throws; unknown ids fall back by the words in the id (taco, lamp, shoe, latte...), then `cat.<category>`, then a parcel.
- Add an icon: add `item_id: () => { ...painters... }` to the matching table (WORLD / HOME / MISC) or a LOOKS row for outfits in items_wear.js (outfit colours are a COPY of wardrobe LOOKS / mall data — keep in sync). Header of icons.js explains.
- UI uses them through src/ui/_icons.js `iconEl(id, scale, category)` (no UI change was needed). `venue.*` and `job.*` icons exist but nothing calls them yet (map pins / jobs app could).
- Preview: `node tools/gallery.mjs icon.gen_ --scale 5 --out icons` (filter — the full sheet is very tall).
- Weak spots: gym pass dumbbell, the three sizes of monstera/fiddle look alike. Not checked in game: fridge window, toasts, furniture shop rows, map pins.
