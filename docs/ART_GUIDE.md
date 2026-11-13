# Art guide — how to make art for Maple Bay

All art is **code**: draw functions that call the pixel rasteriser `src/engine/raster.js` (read it fully first; it is short).
Read `docs/BIBLE.md` for the look/scale, look at `src/art/examples/basics.js` for the contract, and study
`reference/Pixel_Station.html` (the original 1x-resolution sample whose style we are upgrading to 2x detail).

## Coordinates
- World units. +x = screen right-down, +y = screen left-down, +z = up. 1 unit = 16 px along a wall, 16 px up.
- You see three faces of everything: top, the **+y face** (front-left wall) and the **+x face** (right wall).
  Anything on the -x / -y faces is invisible, so put doors, signs and detail on +y and +x.
- Draw in **local coords**: the asset's min corner is (0,0,0) on the ground; it occupies `size = [w, d, h]`.
- Painter's algorithm: later drawing covers earlier. Draw back-to-front (far = low x+y, low z first).
- Scale: person 1.4 tall, storey 2.0, door 0.9 x 1.6, car 3.2 x 1.5 x 1.3. Keep wall details aligned to these.

## Asset contract
A module in `src/art/<your-folder>/<name>.js` does `export default [asset, ...]`. It is auto-discovered (never edit `src/art/index.js`).
```js
{ id: 'bld.oldtown.rowhouse',      // unique, dot-namespaced: prop.* bld.* veh.* furn.* ...
  kind: 'building' | 'prop' | 'vehicle' | 'furniture',
  tags: ['oldtown', 'shop'],       // district + use tags; planners pick assets by tag
  size: [w,d,h]  or  p => [w,d,h], // collision / sorting box (local, from 0,0,0). Keep it tight around the solid mass.
  vb:   [x0,y0,z0,x1,y1,z1] or p => [...],  // OPTIONAL visual bounds if you draw outside size (awnings, canopies, antennas). Anything outside vb is clipped!
  variants: [ {..p}, ... ],        // parameter sets shown in the gallery AND used by the world as ready-made looks. Give several.
  solid: true,                     // props: blocks walking? (default true for building/furniture, set false for rugs, decals, overhead things)
  draw(p) { ... },                 // p = params (always has p.seed when placed in the world). MUST be deterministic for a given p: use rng(p.seed), never Math.random()
  // optional extras
  door: { side: 'y'|'x', at: n }   // buildings: door centre n units along that face (so the game can put the player there)
  light: { x,y,z, r }              // a pool of light cast on the ground at night (street lamps, shop fronts)
  seats: [ {x,y,z,dir} ]           // furniture/benches: where a character sits; dir 0:+x 1:+y 2:-x 3:-y
  use:   { x,y }                   // furniture: the floor spot (local) where a character stands to use it
}
```
- **Parametric is best**: buildings should take `p.w, p.d, p.floors, p.seed, p.name (sign text), colours...` and look right at
  several sizes; list good combos in `variants`. Variety comes from params + seed (window lights, rooftop clutter, colours).
- **Flip is free**: the engine can draw any asset mirrored across the x/y diagonal (`--flip` in the gallery). Lighting and text stay correct
  when you use the raster primitives. So design ONE orientation (main facade on **+y**), don't write a second one.
  Vehicles: draw the vehicle lying along the x axis only; `p.dir = 1` means it drives toward +x (headlights on the +x end, tail lights on the -x end), `p.dir = -1` the opposite.
- **Night**: draw the daytime look normally. Wrap things that only shine at night in `glow(() => ...)` (window light, lamp bulbs) and things that
  are bright day and night in `lit(() => ...)` (neon, screens, signals). `winY/winX` do window glow for you (`on:` decides if that window is lit at night; randomise with rng).
- **Seasons**: `ENV.season` 0 spring, 1 summer, 2 autumn, 3 winter. Use `foliage(kind, v)` / `grassC()` for plants. In winter add snow to roofs/tops
  (white `'#f4f8fb'`, dithered edges). Make seasonal touches where they add charm (pumpkins, string lights, parasols).

## Quality bar
- Higher detail than the sample: window frames + sills, doors with handles, brick/siding/stone patterns (`PAT.*`), cornices, awnings, signs with
  readable 3x5 text (`signY`, `textY`), rooftop AC units/water tanks/antennas/gardens, pipes, balconies, plants, posters.
- Readable silhouettes; 1px dark outlines (`box` does it; use `{ol:false}` for inner parts). Limited, harmonious palette; use `dk()/lt()/mix()` to derive shades.
  No pure black, no noisy random speckle, no gradients — dither with the `h2` second colour instead.
- Every asset must read clearly at 2x-3x zoom, by day and by night, and not look like its neighbours: vary massing, roofline, colour, materials.
- Dimensions that touch the world must be multiples of 0.5 (footprints usually whole units). Buildings 4-16 wide/deep; landmarks may be bigger.

## Workflow (do this constantly)
```
node tools/gallery.mjs <id-or-path-substring> --night            # day + night side by side -> out/gallery/<name>.png
node tools/gallery.mjs bld.oldtown --season 3 --scale 2 --out winter
node tools/gallery.mjs mything --flip
```
Then **look at the PNG with the Read tool**, critique it honestly (proportions? flat? muddy? readable?) and iterate until it is genuinely good.
Check night and at least one other season before you finish. The gallery must run with no errors for your whole folder.

## Rules
- Only create/edit files inside the folder you were assigned. Do not edit `raster.js`, the tools, or other folders. If you need a new primitive,
  write a local helper in your folder (e.g. `_lib.js` — files starting with `_` are fine to share inside your folder) and mention it in your report.
- Import only from `../../engine/raster.js` (and your own folder). No DOM, no canvas, no async, no external libraries.
- Performance: a draw function runs once per sprite (results are cached), so clarity beats speed — but keep any single sprite under ~600x600 px.
- Do NOT run git commands. Do not create docs. Finish with a short report: file list, asset ids (with tags and param names), anything the engine should know.
