# Character art API (src/art/chars/char.js, animals.js) — use via `charArt()` from src/core/char.js
- `CHAR_SB = [-16,-36,16,12]`; `drawChar(spec, pose)`; render+cache per spec/anim/frame/dir (the `Char` class does this).
- ANIMS (frames): stand 2, walk 6, run 6, sit 2, sleep 2, eat 2, drink 2, phone 2, talk 3, wave 4, type 2, work 4, lift 4, treadmill 6, carry 6, dance 4, read 2, shower 2, cheer 2.
- pose = { anim, frame, dir, seated?, item? ('box'|'bag'|'tray' for carry), itemColor?, blanket? (hex; use for beds), seatH?, mood? ('happy') }.
  With the `Char` class: `char.pose = 'eat'; char.poseOpts = { seated: true }`.
  dir: 0 = +x (front), 1 = +y (front), 2 = -x (back), 3 = -y (back).
- Seated: the anchor is the seat surface (furniture `seats[].{x,y,z}` -> set char x,y and `zoff = z`). Sleep: anchor = mattress surface at body centre, dir = where the feet point.
- spec fields (all optional): skin, hair, hairColor, top, topColor, bottom, bottomColor, shoes, hat, hatColor, glasses (true|'sun'), beard, bag, bagColor, innerColor, accent, scarf, build, height, age ('kid'|'adult'|'elder'), outfit.
- Lists exported: HAIRS(20), TOPS, BOTTOMS, HATS, BAGS, OUTFITS (barista, grocer, cook, office, courier, trainer, librarian, nurse, dockworker, bartender, busdriver, taxidriver, police, pilot, chef, gymwear, pajamas, swim, winter), SKINS(9), HAIR_COLORS, CLOTH_COLORS, PANTS_COLORS, SHOE_COLORS, BAG_COLORS, BUILDS, HEIGHTS, AGES, STYLES, CARRY_ITEMS, PLAYER_PRESETS(8).
- `randomSpec(r, { age, season, district, outfit, style })` — NOTE its district keys use `harborside` (the world uses `harbor`): map it.
- Animals: `drawAnimal(kind, { anim, frame, dir, variant })`, `ANIMAL_SB = [-12,-16,12,5]`, kinds cat, dog, pigeon, seagull, duck, squirrel; anims stand/walk/sit (cat, dog), stand/walk/fly (birds, + swim for duck). Flying birds have no shadow.
