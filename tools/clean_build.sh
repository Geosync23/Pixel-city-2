#!/bin/bash
# Lead's publish recipe v2 (since Stage 42, when every old WIP had been integrated): copy the working tree to a scratch dir, REMOVE the files of
# workers that are still running (patterns in EXCLUDE; add a `git show <commit>:<file>` pin below for shared files a running worker is editing), then validate + build.
# Usage: EXCLUDE="*university* _uni_* phone_uni*" tools/clean_build.sh   -> prints the dir; dist/index.html inside it. Remove with rm -rf.
# (tools/clean_build_old.sh is the v1 recipe: 'Stage 22' commit + file list.)
set -e
T=$(git rev-parse --show-toplevel); C=${CLEAN_DIR:-/tmp/claude-0/-home-user-Pixel-city-2/ab4bf52b-889a-5288-a866-29c2e55d0472/scratchpad/clean}
git worktree remove --force "$C" 2>/dev/null || true; rm -rf "$C"; mkdir -p "$C"
cp -r "$T/src" "$T/tools" "$C/"; cp "$T"/*.html "$T"/*.json "$C/" 2>/dev/null || true; ln -s "$T/assets" "$C/assets"; ln -s "$T/node_modules" "$C/node_modules" 2>/dev/null || true
for pat in $EXCLUDE; do find "$C/src" -name "$pat" -print -delete; done
for pin in $PINS; do f=${pin#*:}; (cd "$T" && git show "$pin") > "$C/$f"; done   # PINS="<commit>:src/path.js ..."
cd "$C" && node src/data/validate.mjs | tail -1 && node tools/build.mjs | tail -1 && echo "$C"
