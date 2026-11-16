# Controller support (owner msg 143, BIBLE "Direction update 26")

"Lets also design and implement controller support now. I know it is very much a touch screen game but if done by a Fable agent I think they can figure it out!"

**Read this first: nobody has held a real controller.** Everything below was driven by a scripted fake pad behind `navigator.getGamepads` (standard mapping) in
headless Chromium. The logic is exercised end to end; the FEEL (stick mapping, target choice, focus order, rumble strength, pointer speed) is a designed first guess
with every number exposed as a tunable. Section 9 lists what is most likely to feel wrong in the hand.

Files: `src/core/pad.js` (polling, mapping, dead zones, repeat, active input, rumble, prefs), `src/ui/padnav.js` + `padnav.css` (focus layer, world target,
cursor, surfaces, pad keyboard, glyph hints, legend strip, Settings section), `src/art/icons/pad.js` (glyph art), `tools/pad_check.mjs` + `tools/pad_lib.mjs`
(the fake-pad play-through). Hooks in other files are marked `PAD HOOK` (list in section 7).

## 1. Design in one page

- **Touch stays first.** With no controller nothing runs and nothing shows: `Pad.init()` adds two listeners (`gamepadconnected` / `gamepaddisconnected`) and
  looks once at `navigator.getGamepads()`. The poll (one `requestAnimationFrame`, one `getGamepads()` call) starts with the first pad and stops with the last.
  The focus layer's DOM, its `MutationObserver` and the `<body>` classes are created on the first pad button (or the first arrow key in a window).
- **Whichever input was used last is in charge** (`Pad.mode`: `touch` / `pad` / `keys`). Any pad button or stick -> `pad`: glyphs, ring and legend appear.
  A real finger, mouse move or wheel -> `touch`: they all disappear again (the pad's own synthetic pointer events are not trusted events, so they do not).
  Several pads: the one touched last drives.
- **The world**: left stick walks; the game picks a TARGET in front of you and marks it (gold corner brackets + a bobbing arrow, drawn in the game canvas);
  the prompt at the bottom names it with the confirm glyph; one button uses it (the player walks up to it first, exactly like a tap).
- **Every window**: ONE focus layer over the DOM. It looks at what is on screen; no screen registers anything. New UI built with `el()` gets pad support for
  free. A gold ring with dark edges marks the focus.
- **The universal fallback**: press the right stick for a free POINTER. The stick moves it, the confirm button taps (hold = drag / hold-to-walk). It sends real
  pointer + click events to whatever is under it, canvas or DOM, so anything a finger can do a pad can do.
- **Surfaces**: things played with the pointer (the map, the room in Decorate, mini-game canvases) are focus stops you step ONTO with the confirm button;
  inside, the stick is the pointer. A running mini-game of the shared kit takes the pad at once.
- **Glyphs** appear only in `pad` mode: on the interact prompt, on the HUD's phone / bag / My Day buttons, on whatever Back / Skip / the tab bar will press
  (small corner badges), and in a legend strip under the game. The strip takes 30 px at the bottom of the screen while a pad is in use (the game view shrinks by
  that much), so it can never cover a button.
- **Keyboard**: in any window the arrow keys / Tab move the same focus ring and Enter / Space press it. In the world the keys keep their old jobs.
- **Vibration**: ON by default, deliberately sparse and short (using a target, tab / target cycling, paying, the end of a mini-game, a skill / friend /
  goal / promotion moment, a need hitting zero; never on plain focus moves). Toggle in Settings.

## 2. Buttons

Buttons are named by POSITION (bottom / right / left / top face button), because Nintendo prints A and B the other way round.
"Confirm" = bottom, "Back" = right; on a Switch-style pad they swap automatically (Settings > Controller > Confirm button: Auto / Bottom / Right).

| | Xbox | PlayStation | Switch (confirm = right) | Unknown pad |
|---|---|---|---|---|
| Confirm / use | A | Cross | A (right) | bottom dot |
| Back / cancel / stop | B | Circle | B (bottom) | right dot |
| Left face | X | Square | Y | left dot |
| Top face | Y | Triangle | X | top dot |
| Bumpers | LB RB | L1 R1 | L R | L R |
| Triggers | LT RT | L2 R2 | ZL ZR | LT RT |
| Menu / View | Menu (three lines) / View | Options / Create (same pictures) | + / - | three lines / two squares |

Glyph set: guessed from the pad's id (045e / "xbox" -> Xbox, 054c / "dualsense" / a bare "Wireless Controller" -> PlayStation, 057e / "pro controller" ->
Switch, anything else -> the brand-free "dots" set). Manual choice in Settings.

### In the world (no window open)
| Input | Does |
|---|---|
| Left stick | walk (analogue: slow near the middle, full speed from 82% deflection) |
| Confirm | use the highlighted target (walks up to it first) |
| LB / RB | next target to the left / right on screen (up to 7 units away); stays locked for 5 s or until you walk off |
| Back | stop walking / cancel the running activity (the HUD's Stop) / close the needs panel |
| Left face (X) | backpack |
| Top face (Y) | My Day |
| Start (Menu / Options / +) | phone |
| Select (View / Create / -) | Map |
| D-pad left / right | game speed down / up (1x 2x 4x) |
| D-pad down, or click the left stick | pause / continue |
| D-pad up | step onto the HUD: the focus ring goes onto the HUD chips, banners, the Decorate chip, the DEV button, tutorial boxes. Confirm presses one and returns to walking; Back returns without pressing |
| Right stick | look around (the camera leans up to 36% of the view, springs back) |
| LT / RT | zoom out / in (the game's zoom is in whole steps: one step per pull) |
| Click the right stick | the free pointer on / off |

### In a window (sheet, menu, phone app, dialogue, shop, creator, Decorate panels, title)
| Input | Does |
|---|---|
| D-pad / left stick | move the focus (auto-repeat after 0.34 s, then every 0.105 s) |
| Confirm | press the focused thing. Text field: the pad keyboard. Slider / select: nothing (left / right changes it). Surface: step onto it |
| Back | the nearest Back / x / Close / Cancel / Not now / Done around the focus (it wears the Back glyph); if there is none, an Escape key press |
| LB / RB | previous / next tab of the nearest tab bar (the bar wears LB and RB at its ends) |
| Left face (X) | a "Skip ..." button when one is on screen (it wears the glyph; the focus never starts on it), or an element marked `data-pad-key="x"` |
| Right stick | scroll the list the focus is in (or the window's main scroller) |
| LT / RT | page up / down |
| Start | put the phone away (when the phone is open) |
| Click the right stick | the free pointer |

### Free pointer (click the right stick)
Left stick moves it (speed x Settings "Pointer speed"), D-pad nudges it, Confirm = tap (hold = drag; on the world: hold = walk toward the pointer, tap far away =
walk there, exactly the touch behaviour), right stick scrolls the list under it, LT / RT = wheel (zooms the world or a zoomable canvas), Back or the right
stick click again = put it away.

### On a surface
- **cursor surface** (Decorate's room, a mini-game canvas, any canvas marked `data-pad-surface`): stick = pointer inside it, D-pad = nudge by 1/8, Confirm =
  tap / hold-drag, Back = step off. Decorate adds Y = Turn (the R key), X = Undo (the U key), LB / RB = the tray's tabs.
- **pan surface** (the phone's Map): stick drags the map under a fixed crosshair, Confirm picks what is under the crosshair, LT / RT zoom, Back steps off.
- **a running kit mini-game** (taken automatically): stick = pointer, Confirm = tap / hold, Start or Back = pause (then Resume / Auto-finish / Stop are ordinary
  focus stops). Rhythm games use buttons for the lanes instead of the pointer: 1 lane = Confirm; 2 = X, B; 3 = X, A, B; 4 = D-pad left, D-pad right, X, B
  (the legend strip shows them). Sort games are played with the focus layer (their bins are buttons).

### The pad keyboard (Confirm on a text field)
A small on-screen keyboard made of ordinary buttons (so the focus layer plays it): Confirm types, X deletes, Y = space, Start or Back = Done (sends Enter to the
field as well, which is what the search boxes wait for). An empty field starts with a capital. With the arrow keys instead of a pad the field simply takes the
keyboard focus.

## 3. The stick on an isometric map (the decision)

The ground is 2:1 isometric: world +x runs down-right on screen, +y down-left. Two feels, switchable in Settings ("Walking stick"):

- **Along the streets (default).** The stick acts on the ground as seen from above, turned 45 degrees (`dx = sx + sy, dy = sy - sx`, the same as the existing
  arrow keys): up = straight up the screen, right = straight right, and the four DIAGONALS run exactly along the tile axes, which is where every street,
  pavement, wall and corridor in Maple Bay runs. Within 11 degrees of one of those eight directions the walk locks onto it, so a thumb that is nearly right
  walks dead straight down a pavement instead of drifting into the wall. In between the angle is continuous.
  Why default: in an isometric city the player's goal is nearly always "down this street", and streets are the screen's diagonals at 26.6 degrees. A stick pushed
  to its natural 45-degree corner should follow the street; with a screen-true mapping it would cut across the tiles at 45 degrees and scrape along buildings.
- **Exact direction.** The character moves on screen exactly where the stick points (`dx = sx + 2sy, dy = 2sy - sx`). For players who find the streets
  mapping "pulls".

Speed is analogue: 42% just outside the dead zone, full from 82% deflection. The dead zone is radial (default 18%, Settings slider 5..40%).

## 4. Choosing the target (the decision)

Every 0.1 s, among the scene's interactables within 3.4 units, the lowest score wins:

`score = distance - facing x 1.25 x min(1, distance / 1.2) - (1.5 if distance <= 1.6) + (0.9 if it is a person)`

- `facing` is the cosine between where you face (or where the stick points, while it is pushed) and the thing: straight ahead is worth 1.25 units.
- Anything within 1.6 units (the touch prompt's own range) always beats things further off: what you stand next to wins over what is merely ahead.
- People count 0.9 units further away than things: streets are full of passers-by, and without this the door you walked up to kept losing to whoever strolled
  past (found in the play-through). LB / RB still reach anyone.
- The current target is sticky (a rival must beat it by 0.4), so it does not flicker between two things.
- Just through a door, the door behind you is not offered until you step a unit away or push the stick at it (otherwise Confirm, Confirm walks you in and
  straight back out; found in the play-through at the bottom of the stairs).
- LB / RB override: every interactable on screen within 7 units, in screen order left to right; the pick is locked for 5 s.

The HUD prompt shows this target (not the plain nearest thing) while a pad is in use; Confirm calls the same `G.useInteractable` a tap does.

## 5. The focus layer's rules (src/ui/padnav.js)

1. **Focusable**: `button`, `a[href]`, `input`, `select`, `textarea`, `[role=button|tab|option|link|checkbox|switch|menuitem|radio]`, `[tabindex]`, `[data-pad]`,
   anything that got an `onclick` / `onpointerdown` / `onpointerup` through `kit.el()` (el() marks the element `_pn`) or an `.onclick` property, and surfaces
   (`canvas.mg-cv`, `canvas.md-gcv`, `canvas.jp-map`, `.ph-map`, `[data-pad-surface]`, and areas registered with `G.padnav.addSurface`). Disabled controls are skipped.
2. **Reachable**: the middle of its visible part must be what `document.elementFromPoint` finds there. That one test gives modality for free: a window's
   backdrop hides the HUD under it, the phone hides the game, a first-time card on top of a shop hides the shop. Rows scrolled out of a live list count as
   reachable (they are scrolled into view when focused). Anything covering more than 90% x 60% of the screen is a backdrop, not a button.
3. **Which layer**: while a window is open (`G.modal > 0`), on the title, in a cutscene or during an activity with a sheet, HUD-like layers (`#hud`, `#goalsw`,
   `#ph-banners`, `#toasts`, `#nav-*`, `.dev-btn`, `[data-pad-passive]`) are left out. While walking nothing is focused; D-pad up puts everything on screen in.
4. **Where the focus starts**: `[data-pad="default"]`, else the first thing in the window's content that is not a Back / Close button, a Skip button, a
   dialogue line, an "aside" (Auto, Log), a header control or a box around other things. If only such things are on screen nothing is focused (the ring
   is hidden) until the player pushes a direction: Confirm can never skip a cutscene or auto-finish a game by accident.
   When the focused thing vanishes but its window stays (an answer was given, the next question is not up yet) the ring does not jump to Close / x, and
   Confirm is ignored for 0.28 s after any jump the ring makes by itself.
   When a window closes the focus returns to where it was (a stack per layer; inside one layer, e.g. phone app -> phone home, by the same words).
   After a re-render (lists redraw themselves a lot) the focus goes to the thing with the same words nearest to where it was.
5. **Moving**. "That way" = the thing's middle lies that way and it is past the focus's edge.
   - LEFT / RIGHT stay in the row: a thing in line with the focus costs 0.35 x its distance for the first 300 px (full price beyond), a diagonal neighbour
     costs its distance + 2.2 x its sideways gap + 70 px. So "right" from a left arrow goes to the arrow at the other end of its row, not to a swatch below.
   - UP / DOWN go to the NEAREST ROW first (everything whose near edge is within 20 px of the nearest one), then to the nearest thing in that row. A row is
     never skipped because something further on happens to be in line.
   - Things far off to the side (sideways gap > 2.5 x (forward gap + 40 px)) are not "that way"; for up / down they are the fallback when nothing else is
     (a footer's buttons under a wide panel).
   - Boxes (a thing with other things on it: the map with its buttons and its list panel). Into a box: if something on it is straight ahead, go to that
     (the list's first row), else onto the box. Inside a box: a move toward more of the box lands on the box, not on something outside it.
   - Nothing that way at all: the list scrolls if it can, else the focus wraps to the far end of the same row / column, else the ring gives a small shake.
6. **Dialogue lines** (`data-pad="line"`): Confirm on the line advances it; the moment answers appear the focus jumps to the first answer.
7. **Back**: of all Back-like controls on screen, the one that shares the deepest ancestor with the focus (so the map's "Close list" wins over the phone's Back
   while you are in that list). Words that count: Back, x / Close ..., Dismiss, Cancel, Not now, No thanks, Later, Done, Resume, `.ph-hback`, `[data-pad-back]`.
   "Back to title" does not count (exact words only).
8. **Pressing** = `pointerdown`, `pointerup`, `click` at the element's middle with a synthetic touch pointer (id 7743; `setPointerCapture` is patched to accept
   that id). So a control that listens to pointer events and one that listens to clicks both work.

Hooks for UI authors (all optional): `data-pad="default" | "line" | "aside"`, `data-pad-back`, `data-pad-skip`, `data-pad-key="x|y"`, `data-pad-passive`,
`data-pad-surface="cursor|pan"`, and glyph slots `<i class="pg" data-pg="ok|back|x|y|l1|r1|l2|r2|start|select|ls|rs|dup|...">` (empty and `display:none` until a
pad is in use). `G.padnav.addSurface({ el, rect(), kind, keys: { y: 'r' }, hints: [['y', 'Turn']] })` for an area of the game canvas.

## 6. API

- `G.pad` (`src/core/pad.js`): `seen`, `mode`, `active`, `style`, `swapped`, `held(action)`, `lx ly rx ry lt rt`, `nav`, `prefs`, `setPref(k, v)`, `rumble(kind)`,
  `steer()`. Events: `pad:down(action)`, `pad:up(action)`, `pad:connect`, `pad:disconnect`, `pad:poll(dt)`, `input:mode(mode, prev)`, `pad:prefs(key)`.
  Actions: `ok back x y l1 r1 l2 r2 select start l3 r3 up down left right home`.
- `G.padnav`: `state()` (`world | ui | cursor | surf`), `info()` (for tests), `target()`, `settings(body, ctx)`, `glyph(action, scale)`, `addSurface(...)`,
  `refresh()`, `TW` (the world tunables).
- `G.padSteer()` and `G.camLook` are read by `core/game.js` (both absent until a pad has been used).
- Prefs are per device, not per save: `localStorage['maplebay.pad.v1'] = { glyphs, confirm, dead, rumble, cursor, stick }`.

## 7. Hooks in other files (each marked `PAD HOOK`)

| File | Hook |
|---|---|
| `src/core/game.js` | the walk reads `G.padSteer()` (after hold-to-steer and the arrow keys; `[dx, dy, speed]`), the camera adds `G.camLook` |
| `src/ui/kit.js` | `el()` marks elements that get a click / pointerdown / pointerup handler (`_pn = 1`, a property: no DOM change) |
| `src/ui/hud.js` | glyph slots on the prompt, My Day, bag and phone buttons; the prompt names `G.padnav.target()` while a pad is in use |
| `src/ui/phone_settings.js` | one line: `G.padnav.settings(b, ctx)` (the Controller section, above "More") |
| `src/ui/talk.js`, `src/ui/chapters_ui.js` | the line is `data-pad="line"`; the Chapter sheet's Log and "..." are `data-pad="aside"` |
| `src/sim/firsttime.js` | "Got it" is `data-pad="default"` (not "Show me") |
| `src/sim/_jobplay_kit.js`, `src/ui/minigame.js` | Auto (and the kit's Pause / Stop) are `data-pad="aside"`: the focus never lands on Auto by itself |
| `src/ui/furnish.js` | the room is registered as a surface (`G.padnav.addSurface`), Y = R (turn), X = U (undo) |

Not touched: `src/engine/*` (the target highlight is a `G.overlays` function in `padnav.js`), `title.js`, `creator.js`, `shop.js`, `myday.js`, `goals.js`,
`phone.js`, every `phone_*.js` app except Settings, `skillplay*.js`, `_jobplay_games.js`, `phone_map.js`. They needed nothing.

## 8. Status per screen

"Played" = driven by the fake pad in `tools/pad_check.mjs` or `tools/pad_extra.mjs`. "Same mechanism" = built from the same buttons / lists as a played
screen and reached through the same focus layer, but nobody pressed through it with a pad. "Pointer" = works through a surface or the free pointer.

| Screen | How | Status |
|---|---|---|
| Title (New Game / Continue / Settings) | focus | played |
| Character creator: presets, tabs, swatches, arrows, name | focus + LB / RB + pad keyboard | played |
| Traits, first-home picker | focus | played |
| Arrival cutscenes, taxi tutorial | X = Skip; "Skip intro" from the HUD (D-pad up, or X there) | played (skipped, not walked through with a pad) |
| Shows, cinema ("Leave early"), the plane's "Skip the wait" | X (the cutscene's lone button, `.tut-skipcut`) | "Skip the wait" played; shows not played |
| Walking, doors, lobbies, stairs | stick + target + Confirm | played (home, lobby, street, cafe, deli, Nana's house) |
| Fixtures (fridge, bed, counters), kit menus (`choose`), windows (`modal`), `say` boxes, first-time cards | target, then focus | played |
| Activities (nap, eating): progress bar, Stop | Back = Stop | played |
| Talking to people | target (LB / RB when a door is nearer), focus on lines then verbs, Back = goodbye | played |
| Shops / cafes (buy, eat here, tabs) | focus + LB / RB | played |
| Phone: home, Messages (thread, reply), Settings, Me (tabs, skill page), MapleCab, Map lists + route card | focus + LB / RB, Start = away | played |
| Phone Map canvas | pan surface | played (drag + zoom); picking a pin with Confirm is by design, not asserted |
| My Day sheet (ideas, Add, walk-through Skip) | Y, focus, X = Skip | played |
| Cab ride | X = Skip ride (the button wears the X glyph; it is never focused) | played. Bus "Skip ride" / "Choose stop", the train's "Get off here" / "Skip ahead": same mechanism, not played |
| Decorate: panels, tray, tabs, Done | focus + LB / RB | played |
| Decorate: moving a piece | cursor surface (hold Confirm = drag), X undo, Y turn | drag + undo played; turn, colour, store, sell, try-a-piece from the Shop tab: same mechanism |
| Skill mini-games (kit) | auto surface | `timing` played. `balance`, `aim` (hold): Confirm held. `rhythm`: lane buttons. `sort`: focus on the bins. `trace`, `memory`, `quickdraw`, arcade cabinets, chess: the pointer inside the canvas. None of these other kinds was played with the pad |
| Job plays (`_jobplay_kit`: pick / order / grid / live / mg) | focus (+ hold buttons: Confirm down = pointerdown, up = pointerup) | `pick` played ("The Regulars"); `order`, `grid`, `live`, the `.jp-map` canvas: same mechanism / pointer |
| Job board, shift HUD, tickets, `ui/jobs.js` minis (pick / meter / belt / mash), results card | focus | same mechanism, not played |
| Chapters: start card, dialogue lines, choices, "..." menu | target, focus (`line` / `aside`) | played |
| Chapter extras (book, log, moments, bell / ladder taps in the world) | focus / pointer | not played |
| Dev menu | D-pad up, focus | played |
| Settings: sliders, chips, Controller section, Save | focus, left / right on sliders | played |
| Save, reload, Continue | focus | played |
| Other phone apps (Bank, Jobs, Wellness, Delivery, Planner / week view, Closet, Roomy / homes, Appy store, Reader, Reel, Wander guide, Post, University, Opportunities, Porchlight, Bay Basics) | focus | same mechanism, not played. Search boxes use the pad keyboard; `<select>`s change with left / right |
| Phone games (Playbox, `canvas.md-gcv`) | cursor surface (Confirm on the canvas, then stick + Confirm) | by design, not played. Reflex games will be harder with a stick than with a thumb |
| Reel video scrubber, full-screen reel | pointer | not played |
| Venue specials with their own canvas / pointer code (observatory eyepiece and constellations, conservatory photo, lighthouse, natatorium minis, hotel, post sorting, museum, fish market mini, shows "stand up") | free pointer (R3); several also listen to keys | not played |
| Wardrobe / mirror (creator in edit mode), barber, clothes shops | focus | same mechanism |
| Notification banners | D-pad up, focus | same mechanism (the DEV button and "Skip intro" were played this way) |

Nothing is known to be unreachable: whatever the focus layer cannot see, the free pointer can tap. What a pad cannot do: pinch (not needed: triggers / zoom
buttons).

Known gaps (honest list):
- **Sound may stay silent until the first touch, click or key.** Browsers unlock audio on a "user activation"; a gamepad button is not one in most browsers.
- The tutorial's words still say "Click where you want to walk (or use WASD / the arrow keys)" and Help says "Tap the ground to walk": no controller wording.
- The `E` keycap in the prompt is replaced by the glyph; other places that print key names (Help text) are unchanged.
- Timed DOM games with moving targets (the job "belt") are playable with the focus ring but nobody tried how fair they feel.
- A non-standard pad (no "standard" mapping) gets: left stick, first ten buttons in the usual order, D-pad from a hat or two axes. If its buttons are in
  another order the player has the "Confirm button" setting, and the free pointer needs only the left stick, one face button and a stick click. There is no
  button-remapping screen.
- iOS Safari reports no `vibrationActuator`: no rumble on iPhone / iPad.

## 9. What will most likely feel wrong in the hand, and the knob for each

1. **The stick on the diagonal map.** Default "Along the streets" turns the stick 45 degrees; some players expect "Exact direction". Knobs: Settings >
   Controller > Walking stick; `TUNE.snapDeg` (11: how hard the eight directions pull), `TUNE.walkMin` (.42) / `TUNE.walkFull` (.82) (analogue speed),
   `prefs.dead` (.18, Settings slider). All in `src/core/pad.js`.
2. **Which thing gets highlighted.** Especially on a crowded pavement, next to a door with a person in front of it, and between two close fixtures in a small
   kitchen. Knobs in `padnav.js` `TW`: `reach` 3.4, `near` 1.6 / `nearBonus` 1.5, `facing` 1.25, `people` .9, `sticky` .4, `cycleReach` 7, `lockSecs` 5.
   If people are too hard to talk to: lower `people`. If the target jumps about while walking: raise `sticky`. If far things grab the prompt: lower `reach`.
3. **Where the focus goes.** The order is geometric, not hand-written, so odd layouts can surprise: a wide row above a grid, the map with buttons on it, a
   sheet whose first control is not the one you want (My Day opens on "Week"). Knobs: `TW.inLine` .35 / `TW.inLineReach` 300 / `TW.diagonal` 70 (how strongly
   left / right stay in the row), `TW.rowTol` 20 (what counts as one row for up / down), `TW.sideWeight` 2.2, the "not that way" cone in `move()`, and per
   screen `data-pad="default"` on the control that should start with the focus. Example seen: at 1280 x 720 "down" from the creator's last arrow lands in
   the other column (it is the nearest thing below), and My Day opens with the ring on "Week".
Also worth a real try: pointer speed (`TW.cursorSpeed` 640 px/s x the Settings slider), the camera lean (`TW.look` .36), the repeat rate (`TUNE.repeatFirst`
.34 s, `TUNE.repeatNext` .105 s), rumble strengths (`FX` in `pad.js`), the 0.28 s `TW.mashGuard` (Confirm is ignored right after the ring jumps by itself, so
mashing through answers cannot press a Close button that slid under the ring), and the 30 px legend strip (is giving up that much of a phone screen right?).

## 10. What was checked, and the results (2026-11-16, final build)

Everything here ran in headless Chromium with a FAKE pad. No real controller, no real phone, no Safari.

**`node tools/pad_check.mjs`** plays one continuous session from the title screen with nothing but the fake pad (no taps, no clicks, no game calls to make
things happen; the script only looks at the page to decide what to press): title -> New Game -> creator (preset, tabs, hair, skin, a typed name) -> traits ->
home -> the arrival cutscene (X) -> "Skip intro" -> the flat (stick, fridge, bed, Stop) -> lobby -> street (stick, a passer-by, a conversation) -> the cafe
(order, eat) -> phone (Messages: read + reply) -> My Day (add an idea) -> Map (place list, route card, WALK; the map canvas: pan + zoom) -> a cab (Skip
ride) -> a shop purchase -> a skill mini-game -> developer mode -> a job play -> next morning -> a cab -> Chapter 1 (start card, 8 lines, a choice, step
out) -> a cab home -> Decorate (drag a piece, undo, tabs, Done) -> Settings (a slider, the Controller section, Save) -> reload -> Continue -> walk.

| Run | Result | Needed |
|---|---|---|
| 390 x 844, Xbox-style pad | **68 passed, 0 failed**, 0 page errors | focus layer 53x, free-pointer fallback 0x, 34 rumbles |
| 844 x 390 (phone on its side), PlayStation-style pad | **61 passed, 0 failed, 6 skipped**, 0 page errors | focus 50x, pointer fallback 0x |
| 1280 x 720, Switch-style pad (confirm = right button) | **68 passed, 0 failed**, 0 page errors | focus 52x, pointer fallback 1x |

- The 6 skips at 844 x 390 are LAYOUT limits of the game on a screen that low, not controller limits, and a finger has (nearly) the same trouble: the phone's
  Map has 14 px for its place list and 84 px for the map itself (the controller's hint strip costs 20 px of that; with touch it would be 34 px and 104 px),
  and Decorate's two panels leave 40 px of room between them. Also seen there: the creator's preset row is covered by its footer (with touch too; the
  check says so and carries on). Worth a look by whoever owns those layouts; nothing was changed.
- The one pointer fallback at 1280 x 720 was the SCRIPT's route-finding, not the game: its greedy "press toward the target" walked into a loop between the
  creator's two columns on the way to "Next". By hand the path exists (down the left column to Back, then right). It is the kind of focus-order surprise
  section 9.3 warns about, and it showed the fallback working.
- What each step needed is printed per step: `[focus]` the generic layer, `[target]` / `[cycle]` the world target, `[stick]`, `[osk]` the pad keyboard,
  `[bespoke(...)]` a mapping made for that screen (tabs, X = Skip, B = Stop, Start / Y / Select, the map's pan surface, the mini-game surface, Decorate's
  room, sliders). Full logs: `out/pad_check.json`, `out/pad_check_land_.json`, `out/pad_check_desk_.json`.
- Things the play-through found and that were fixed on the way (all in `padnav.js` / `pad.js` unless said): the door behind you was offered again right
  after coming through it; passers-by stole the target from the door you walked up to; the focus started on "Show me" (first-time cards), on "Auto" (job
  plays) and jumped to Close / x after an answer vanished (mashing Confirm then closed the play); the focus did not return to the app icon after leaving a
  phone app; Tab closed the phone before it could move the focus; on a Switch-style pad choosing another glyph set flipped the confirm button; a hat-type
  D-pad was read from the wrong axes; "right" from an arrow went to a swatch below instead of the arrow at the other end of the row; "down" skipped a row;
  the map's own buttons were hard to get on and off; hold-to-fill buttons could not be held (Confirm is now down = pointerdown, up = pointerup + click).
- Script lessons that are also player facts: a cab cannot be called from indoors (the game says "Step outside to meet your cab") and did not come to the
  market square in front of Bean & Gone in one run (the script now walks to the kerb and asks again if no cab comes); first-time cards slide in at any
  moment and take the focus (Confirm = "Got it").

**`node tools/pad_extra.mjs`** (side cases): 20 / 20 pass. Keyboard: arrows still walk in the world; in the phone an arrow shows the ring (no glyphs, no
strip), arrows and Tab move it, Enter opens Settings, Esc Esc closes the phone, the ring is gone back in the world. A real click hides ring, glyphs and
strip at once and the game is full height again; the next pad button brings them back. The free pointer walks the player (Confirm on the floor far away).
Right stick leans the camera and it springs back. RT / LT zoom one step. D-pad speed and pause. Unplugging returns to touch. Switch-style pad: right
button confirms, bottom goes back. A non-standard pad (`mapping: ''`, 12 buttons, D-pad on a hat axis): dots glyphs, Start, hat navigation, confirm. Two
pads: the last one used drives and the glyphs follow. Glyph sheet: `out/shots/pad_glyphs.png`.

**Touch is untouched: `node tools/pad_touch_check.mjs <build without controller support>`**. No git commands were allowed, so "the previous build" is a copy
of today's tree with the five new files removed and every `PAD HOOK` reversed (a script did it; 0 leftovers), built the same way. The same tap session in
both builds (title, creator, a room: HUD, a tap-walk, a tap on the counter, shop, phone home, Settings, Map, My Day): the DOM of `#ui` is identical at all
8 moments (116 to 217 elements each; clock, toasts, bubbles, badges, banners and the Now-playing line left out as they vary run to run), the pixels of the
opaque windows are identical (shop 0.00%, HUD 0.00 to 0.40%, phone home 0.00 to 0.38% = the clock, Settings 0.27% = the tune's name), a tap walks and a
tap on the counter opens the shop in both, 0 page errors in both. In the new build with no pad: no `#padnav`, no strip, no class on `<body>`, the four
glyph slots empty and `display:none`, `G.padSteer` / `G.camLook` unset, the poll not running. Ran three times, identical each time.

**Performance** (`tools/perf.mjs --html before,after`, interleaved, CPU 4x slower, dpr 2, 3 runs each; the machine was shared with other workers, so the
spread is wide):

| scene | fps before | fps after | 1% low before / after | worst frame before / after |
|---|---|---|---|---|
| walk | 53.4 (52.4-54.1) | 52.2 (49.1-55.5) | 13.7 / 13.7 | 117 ms / 100 ms |
| phone | 54.8 (52.2-56.1) | 53.4 (52.7-55.3) | 9.4 / 8.0 | 300 ms / 300 ms |

Inside the spread: no slowdown without a pad. (A first comparison showed 450 ms hitches in "after": that was my comparison build, which lacked the ambience
recordings' folder, not the controller code. Aside for whoever uses `--no-audio`: a build whose manifest lists the recordings but which was built with
`--no-audio` hitches like that.) The controller code adds about 51 KB to the single file. `node tools/perf.mjs --verify`: VERIFY OK, same pixels.

**The rest**: `node src/data/validate.mjs` OK · `node tools/build.mjs` OK (14473 KB) · `grep -c '(?<[=!]' dist/index.html` = 0 ·
`node tools/navcheck.mjs --rooms all`: all passed, 0 page errors · `node tools/ambience_check.mjs`: 138 / 138 · zero page errors in every run above.
Screenshots (looked at): `out/shots/pad_*.png` (390 x 844), `pad_land_*.png` (844 x 390), `pad_desk_*.png` (1280 x 720), `pad_glyphs.png`,
`pad_kb_settings.png`, `pad_cursor_world.png`, `pad_switch_phone.png`, `pad_generic_phone.png`, `pad_paused.png`. The ring (dark / gold-to-orange / dark) reads
on the cream panels, the dark phone, the blue creator and the world; nothing overlaps the HUD because the strip has its own 30 px (20 px on a low screen).

**Not verified, because it cannot be here**:
- a real controller in a real hand; iPhone / iPad Safari; Android Chrome; Firefox;
- **whether the claude.ai artifact page lets the game see a controller at all.** The game runs inside that page's frame; browsers only give a frame gamepad
  access if the embedding page allows it, and the frame must have the focus (tap the game once). If a paired pad does nothing in the artifact, that is the
  first suspect: try the same `dist/index.html` opened directly. The game cannot detect or fix this from inside;
- rumble strength (the fake pad only counts calls: 34 in a 10-minute session);
- very fast taps: the Gamepad API is polled once per frame, so a press shorter than one frame can be missed when the frame rate drops. Normal presses
  (60 ms and more) are fine at 20 fps and up.

One behaviour change for keyboard players: **Tab no longer closes the phone** (it moves the focus now; M, Q, P and Esc still close it).

## 11. Questions for the owner (after he has held a pad)

1. Does "up" feel right? Try Settings > Controller > Walking stick both ways and say which one should be the default.
2. Is the highlighted thing the one you meant, most of the time? Where it is not (crowded pavement, kitchen corner), which one did you mean?
3. The strip of button hints takes 30 px at the bottom while a controller is in use. Keep it, make it smaller, or show it only for a few seconds?
4. Start = phone, Select = Map, Y = My Day, X = bag. Is that the right four? (There is no free button left for the needs panel: it is D-pad up, then Confirm.)
5. Vibration is on by default and sparse. More, less, or off by default?
6. Should the tutorial get controller wording ("Push the stick to walk") when a pad is in use? That is a small text job in the intro, not done here.

## 12. How to try it (for the owner)

Pair a controller with the phone (iPhone / iPad: Settings > Bluetooth, hold the pad's pairing button: Xbox = the small button on top, PlayStation = Create +
PS, Switch Pro = the button next to the USB port). Open the game and **press any button on the pad**: a gold ring appears on "New Game" / "Continue" and a
strip of button pictures along the bottom. From there: stick or D-pad to move the ring, the bottom button to choose, the right button to go back. In the city
the left stick walks, gold corners mark what the bottom button will use, the bumpers pick another thing, Start is the phone, Y (top button) My Day, X (left
button) the bag, Select the Map, and a click on the right stick gives a hand pointer that can tap anything. Touch the screen and it is a touch game again.
Settings > Controller (it appears once a pad has been used) has the button pictures, the confirm button, the walking feel, dead zone, pointer speed, vibration.
If there is no sound: tap the screen once (browsers only start audio after a touch).

## 13. Summary

- Full gamepad support is in: stick walking with a highlighted target and one button to use it, one focus layer that drives every DOM screen without
  per-screen code, a free pointer and "surfaces" for everything that is played with a finger (the map, Decorate's room, mini-game canvases), a pad
  keyboard for text fields, glyph hints in four styles that exist only while a pad is in use, a Controller section in Settings, light rumble, and the same
  focus ring for the arrow keys.
- A scripted fake pad played the whole game loop from the title screen to save / reload / Continue at three screen sizes with three pad styles:
  68 / 68, 61 + 6 layout skips, 68 / 68, no page errors. With no pad the game is identical to a build without the feature (same DOM, same pixels, same
  frame rate).
- Nobody has held a controller. The three things to try first with a real one: does "up" feel right (Settings > Controller > Walking stick), is the
  highlighted thing the one you meant, and does the ring go where you expect. Every number behind those is a named tunable (section 9).
- To reproduce: `node tools/build.mjs && node tools/pad_check.mjs` (about 10 minutes; `--w 844 --h 390 --style ps --tag land_`, `--w 1280 --h 720 --style
  switch --tag desk_`), `node tools/pad_extra.mjs`, and for the touch comparison `python3 tools/pad_nopad.py /tmp/nopad && (cd /tmp/nopad && node
  tools/build.mjs) && node tools/pad_touch_check.mjs /tmp/nopad/dist`.
