# Architecture — how the game is put together (read before writing game code)

Vanilla JS ES modules, Canvas 2D, zero runtime dependencies. `node tools/build.mjs` bundles everything into one file `dist/index.html`.
Design decisions live in `docs/BIBLE.md`. Art rules in `docs/ART_GUIDE.md`.

```
src/engine/   raster.js (pixel rasteriser, pure)  world.js (terrain+objects+nav)  ground.js (terrain painter)
              sprites.js (sprite cache)  render.js (depth sort + lighting)  nav.js (A*, movement)
src/core/     game.js (G: state, scenes, loop, interactions, activities, save)  char.js (Char entity)  clock.js  input.js  bus.js
src/art/      asset libraries (auto-registered; look up with asset(id) / byTag(...) from art/registry.js)
src/data/     design data (items, jobs, needs, venues, homes, economy, calendar, phone)      -- plain exports
src/story/    narrative data (cast, dialogue, story beats, intro, texts)                      -- plain exports
src/world/    city generation (terrain, districts, roads, building placement) -> registers the 'city' scene
src/scenes/   interiors, train ride, other scenes
src/sim/      gameplay systems (needs, inventory, jobs, social, traffic, transit, weather, ...)
src/ui/       DOM UI (kit.js helpers, style.css, HUD, phone, shop windows, ...)
tools/        build.mjs  serve.mjs  shot.mjs (screenshot/drive the game)  gallery.mjs (art preview)  modules.mjs
```

## Modules and init
Any file under `src/{world,scenes,sim,ui,story}/` may `export function init(G)` (may be async) and optionally `export const order = N`
(default 100; lower runs first). `tools/modules.mjs` generates `src/modules.gen.js` which calls them — **never edit generated files or
add imports to main.js**. Files starting with `_` are skipped (use for private helpers). Extra `.css` files in `src/ui/` are bundled automatically
(in dev, inject them yourself or put rules in a `<style>` you create in init).
Import shared things directly: `import { G } from '../core/game.js'`.

## G (src/core/game.js) — the one global
- `G.state` — the whole save (JSON-serialisable!). Own a slice: `const S = G.defineState('needs', () => ({...defaults}))`; after a load, re-read `G.state.needs` (listen to `'load'`). `G.state.t` = game minutes since day 0 00:00; `G.state.player = {name, spec, money, scene, x, y}`; `G.state.flags` misc booleans.
- Time: `G.now()` -> `{day, weekday (0=Mon), hour, minute, hf, season, dayOfMonth, clock, label...}`; `G.advance(minutes)`. 1 game minute = 1 real second at `G.state.speed = 1`.
- Events (`G.on(ev, fn)` returns an unsubscribe; `G.emit`): `'minutes'(delta, t)` whenever whole game minutes pass (use for needs decay), `'hour'(h)`, `'day'(dayIndex)`, `'season'(s)`, `'scene'(scene, prev)`, `'use'(interactable)`, `'activity'(a)`, `'activityEnd'(a, completed)`, `'frame'(dt)`, `'key'(k)`, `'save'`, `'load'`, `'ready'`. Add your own namespaced events freely (`'money'`, `'needs:low'`, ...) and document them at the top of your file.
- Systems: `G.addSystem({ name, update(dt, gameMinutes) })` runs every unpaused frame.
- Pausing: while `G.modal > 0` the simulation is paused and world input ignored. `modal()` / `say()` / `choose()` from `ui/kit.js` handle this.
- Scenes: `G.registerScene('city', factory)` or prefix `G.registerScene('int:', (id, arg) => scene)`. `await G.go('int:cafe', { x, y } | { poi: 'id' })` switches with a fade.
  A scene is `{ world: World, ents: [entities], interactables: [...], indoor: bool, spawn: {x,y,dir} | fn, update(dt, gm), onEnter(opts, prev), onExit(), env?(t) }`.
  `G.scene`, `G.world` are current. The city scene is cached forever; interiors are cached LRU.
- Player: `G.player` is a `Char` (`x,y,z,dir,spec,pose,speed,path`; `goTo(world,x,y)`, `faceTo`, `stop`). `player.pose = 'sit'` forces an animation; `player.zoff` raises it (on a chair/bed); `player.hidden`.
- Interactions: an interactable is `{ x, y, label, use(G, it), spot?: {x,y}, range?, hit?, h?, ent?: Char, visible?(), scene? }`. Put them in `scene.interactables`, or `G.addInteractable(it)` (with `scene: id`) from a system.
  Tapping one (or pressing E near it) walks the player to `spot` (or within `range`) and calls `use`. `G.useInteractable(it)` does the same programmatically.
- Activities: `G.startActivity({ label, anim, minutes, rate?, tick?(gameMinutes), done?(), cancel?(), at?: {x,y,z,dir}, hide? })` locks the player in an animation while time runs fast; `G.endActivity(false)` cancels. `G.busy` is the current one.
- Cutscenes: set `G.cutscene = { update(dt) }` to take over (taxi/bus rides); `G.camTarget = entity` makes the camera follow something else; clear both when done.
- Canvas hooks: `G.overlays.push((ctx, cam, dt) => ...)` draws in low-res canvas pixels after lighting (weather, markers); `G.underlays` draws right after the ground. `G.toScreen(x,y,z)` gives CSS px for DOM elements (bubbles).
- Save: `G.save()`, `G.load()`, `G.hasSave()`. Everything persistent must live in `G.state`.
- Debug: `window.G`. URL params (when no intro system has set `G.started = true`): `?scene=city&x=..&y=..&t=<hour>&season=0-3&zoom=N&debug`.

## Engine essentials
- **World** (`engine/world.js`): `new World(w, h)`; terrain `flat/ramp/sculpt/ground(x0,y0,x1,y1,GT.type)`, `heightAt(x,y)`, `bakeTerrainNav()` (call after terrain edits, before placing objects);
  objects `place(assetId, x, y, { p, flip, z, solid, data })`, `placeCustom({key,size,vb,draw}, x, y)`, `remove(ob)`, `ob.hidden = true`; nav `block/free(x0,y0,x1,y1)`, `isBlocked(x,y)`;
  `decal({x0,y0,x1,y1, draw(R, zAt)})` for ground markings; `poi({type,id,x,y,...})` / `findPois(type)`; `zone` grid for district ids; `world.version++` re-renders ground.
  Positions snap to 0.5; ground types in `GT` (interior floors `GT.f_*`). Tiles steeper than 0.7 are cliffs (unwalkable) unless `GT.stairs`.
- **Entities** (anything in `scene.ents`): `{ x, y, z, bb: [dx0,dy0,dx1,dy1,h], sprite(): {c,l,x,y,w,h}, hidden?, alpha? }`. `Char` (core/char.js) is the standard one:
  `new Char(spec, x, y)`, `char.move(world, dt, steer?)` every frame, `char.pose`. Character art API: `charArt()` -> `{ drawChar, randomSpec(r, opts), CHAR_SB, ANIMS, OUTFITS, PLAYER_PRESETS ... }`.
  For vehicles etc. build sprites with `assetSprite(asset, params, flip)` from `engine/sprites.js` (cached).
- **Lighting**: scenes get ambient from `core/clock.js` (`ambient(t, weather)` outdoors, `ambientIndoor(t)` when `scene.indoor`). Art marks glowing pixels (`glow`/`lit`), assets with `light` cast ground pools; `world.lights.push({x,y,z,r,c})` adds more. `scene.lights(m, cam, pool)` can add moving pools (headlights).
- **Path/movement**: `engine/nav.js` `findPath(world, sx, sy, tx, ty)`, `stepToward`, `followPath`.
- **UI** (`ui/kit.js`): `el('div.cls', {text, onclick,...}, ...kids)`, `toast(text, kind)`, `modal({title})` -> `{body, close}`, `choose(title, options)` -> Promise, `say([{who, text}])` -> Promise, `bubble(entity, text)`, `pixCanvas(canvas, scale)`. Style with the CSS variables in `ui/style.css`; keep the chunky pixel look (2px borders, hard 3px drop shadow, no rounded corners, no gradients). Must work with touch and at 360px wide.

## Testing your work (required)
- `node tools/build.mjs` must succeed (catches import errors).
- `node tools/shot.mjs --url "?scene=city&x=120&y=80&t=20" --out mytest [--eval "G.setZoom(3); ..."] [--wait 1500]` loads the game headless, prints page errors and saves `out/shots/mytest.png`
  — **look at it with the Read tool**. `--eval` runs async JS in the page (drive the game through `window.G`, e.g. `await G.go('int:cafe')`, `G.advance(600)`, call your system's functions, click DOM buttons via `document.querySelector(...).click()`). The eval's return value is printed.
- Zero console errors/warnings is the bar. Check day and night, and a narrow viewport (`--w 390 --h 780`) for UI.

## Rules for agents
- Stay inside the files/folders you were assigned. Never edit `src/engine`, `src/core`, tools, generated files, or another team's folder — if you need a change there, describe it precisely in your final report (or work around it locally).
- No git commands. No new dependencies. No external network resources at runtime. Deterministic generation (use `rng(seed)` from raster.js, not Math.random, for anything that affects the world layout or save).
- Keep the save small and JSON-safe. Keep per-frame work light (no allocations in hot loops over hundreds of entities; no pathfinding every frame).
- Final report: files, public API (exports, events, state slice, URL/debug hooks), known gaps.
