# QA round 3 (Opus QA & data lane, 2026-11-15): museum, observatory, recipes, city-folk lines, buses, pedestrians on the road
Everything below ran in headless Chromium from `src/` (not `--dist`), mostly in portrait 390x844, with the scratchpad driver
`/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/r3/` (`drv.mjs` + `help.js`, plus `bubs.mjs` = parallel bubble logger, `peds.mjs` = pedestrians-on-asphalt logger,
`bustrip.mjs` = door-to-door trip timer, `reach.mjs` = recipe reachability, scenario files `cook*.mjs`, `mus*.mjs`, `obs*.mjs`, `react.mjs`, `ctx.mjs`, `roadsyn.mjs`). Screenshots in its `shots/`.
"Real" = pathfinder walking with Char.move, interactables used by walking to them, DOM buttons clicked, mouse drags/taps on canvases. Teleports only place the start of a scenario.
Several times the shared build would not load because another worker's file was mid-edit (`src/art/chars/char.js` "shoe is not a function", `src/sim/clothes_shop.js` duplicate `order`); I waited and re-ran.

PLACEHOLDER
