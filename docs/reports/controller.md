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
- **Vibration**: ON by default, deliberately sparse and short (using a target, tab / target cycling, a few good-news moments). Toggle in Settings.

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
| Left face (X) | a "Skip ..." button when one is on screen (it wears the glyph), or an element marked `data-pad-key="x"` |
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
4. **Where the focus starts**: `[data-pad="default"]`, else the first thing in the window that is not a Back / Close button, a dialogue line or an "aside".
   When a window closes the focus returns to where it was (a stack per layer; inside one layer, e.g. phone app -> phone home, by the same words).
   After a re-render (lists redraw themselves a lot) the focus goes to the thing with the same words nearest to where it was.
5. **Moving**: among things lying in that direction, lowest `gap ahead + 2.2 x gap sideways + 0.25 x centre offset`. Things far off to the side
   (sideways gap > 2.5 x (forward gap + 40 px)) are not "that way". A box with things in it (the map with its buttons) costs 140 px extra so its contents come
   first; from inside a box, a move with nothing that way lands on the box. Nothing that way at all: the list scrolls if it can, else the focus wraps to the far
   end of the same row / column, else the ring gives a small shake.
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
