#!/bin/bash
# Lead's publish recipe: build a CLEAN dist from the 'Stage 22' commit + the finished file set, leaving out running workers' WIP.
# Usage: tools/clean_build.sh [extra files...]  -> prints the worktree path; dist/index.html inside it. Remove with: git worktree remove --force <path>
set -e
T=$(git rev-parse --show-toplevel); C=${CLEAN_DIR:-/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/clean}
S22=$(git log --format=%h -1 --grep="^Stage 22"); B25=$(git log --format=%h -1 --grep="Stage 25b")
git worktree remove --force "$C" 2>/dev/null || true; git worktree add --detach "$C" "$S22" >/dev/null 2>&1; ln -s "$T/node_modules" "$C/node_modules" 2>/dev/null || true
cd "$T"
rm -f "$C"/src/sim/{hotel,arena,aquarium}* "$C"/src/scenes/rooms/{hotel,arena,aquarium}* "$C"/src/data/{hotel,arena,aquarium}* "$C"/src/art/showpiece/*{hotel,arena,aqua}*
FILES="src/ui/phone_taxi.js src/ui/phone_guide.js src/ui/phone.js src/ui/phone_planner.js src/ui/phone_wellness.js src/ui/phone_messages.js src/ui/creator.js src/ui/phone_minis.js src/ui/title.js src/ui/phone_me.js
 src/ui/devmode.js src/ui/phone_settings.js src/ui/phone_reader.js src/ui/phone_reel.js src/ui/phone_closet*.js src/ui/phone_play*.js src/ui/minigame.js src/ui/minigame.css src/ui/phone_media.css src/ui/phone_post.js
 src/engine/render.js src/art/props/park.js
 src/sim/lobbies.js src/sim/planner.js src/sim/wardrobe.js src/sim/clothes_shop.js src/sim/laundry.js src/sim/hair.js src/sim/traits.js src/sim/skillplay.js src/sim/skillplay_arcade.js src/sim/needs.js src/sim/housing.js
 src/sim/media.js src/sim/_media_films.js src/sim/_shows_films.js src/sim/apps.js src/sim/post.js
 src/data/needs.js src/data/hair_styles.js src/data/traits.js src/data/skills_extra.js src/data/media.js src/data/post.js src/data/clothes*
 src/story/shortreads.js src/story/letters.js src/art/icons/clothes.js src/art/icons/skills_extra.js src/art/icons/media.js
 src/sim/_crowd_lines.js src/sim/_crowd_core.js src/sim/crowd.js src/sim/_crowd_rooms.js src/sim/transit.js src/sim/traffic.js src/sim/_traffic_veh.js src/sim/navigator.js src/sim/museum.js src/sim/observatory.js
 src/ui/shop.js src/ui/hud.js src/data/items.js src/data/venues_extra.js src/data/validate.mjs src/data/calendar.js src/scenes/rooms/museum.js src/scenes/rooms/observatory.js src/art/showpiece/museum.js
 src/scenes/rooms/post*.js src/art/showpiece/post*.js src/art/showpiece/_post_*.js $*"
for f in $FILES; do mkdir -p "$C/$(dirname $f)"; cp "$f" "$C/$f"; done
cp -r src/art/chars/. "$C/src/art/chars/"
for n in hotel arena aquarium fishmarket lighthouse cityhall natatorium; do for f in src/sim/$n.js src/data/$n.js src/scenes/rooms/$n*.js src/art/showpiece/$n*.js; do [ -f "$f" ] && cp "$f" "$C/$f"; done; done
for p in _hotel_ _arena_ _aqua_ _fish_ _lh_ _ch_ _nat_; do for f in $(ls src/*/$p* src/*/*/$p* 2>/dev/null); do cp "$f" "$C/$f"; done; done
git show $B25:src/world/_blocks.js > "$C/src/world/_blocks.js"
cd "$C" && node src/data/validate.mjs | tail -1 && node tools/build.mjs | tail -1 && echo "$C"
