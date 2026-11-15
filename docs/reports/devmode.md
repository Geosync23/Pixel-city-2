# Developer mode (owner msg 103) — DONE by the lead, live since Stage 33

- Turn on: phone > Settings > More > Developer mode On. A red DEV button appears in the bottom-left corner of the game screen and opens the dev menu.
- src/ui/devmode.js (self-registering). State G.state.dev = { on, needs, money, all }. API G.dev = { on(), set(on), open(), unlockAll(), frozen, all }.
- Menu: Freeze needs at full (src/sim/needs.js decay() returns early while G.dev.frozen) / Fill once; Unlimited money (held at $999,999) / +$1,000 / +$10,000;
  Unlock everything = skip intro if active, release + install every app, discover every place, learn every recipe, max every skill (so every job is eligible), all passes
  (conservatory_pass, observatory_pass, aquarium_pass, museum_member, nat_pass, hotel_friend), all homes (src/sim/housing.js `unlocked` honours G.dev.all); the same as single buttons;
  Hire me as… (job list, lifts the needed skills, clears the re-apply wait); Teleport… (place list -> G.go('city', x, y)); time +1 h / +6 h / to 8 am / +1 day; speed 1-16x; weather; turn off.
- Lead tested at 390x844 (source and clean build): toggle in Settings, button appears, money 440 -> 999,999, needs stay 100 through a 15-hour advance, unlock: 279/279 places, 212 recipes, skills level 10, jobs 10/10 eligible, 23/28 apps
  (the other 5 are catalogue teasers that cannot be installed). NOT tested by hand: Teleport and Hire pickers (code paths only), 8x/16x speed stability.
