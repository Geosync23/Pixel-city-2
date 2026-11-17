You are continuing "Maple Bay", my isometric pixel-art city life sim, on a new account. The repository is geosync23/pixel-city-2.
Start from the head of branch `ccr-e622e92c-7t3ejy` (if this session was given a different branch, create it from that head and work there).

How we work now:
- You do the work yourself: design, code, art, testing, publishing and keeping the docs. There is no separate lead and no team of workers.
- You may use ONE helper sub-agent on Opus (model "opus") for support: QA sweeps, screenshots, data entry, small clearly specified fixes, doc upkeep. One at a time. You don't need a Fable check of its work, but look at what it made before you publish and tell me what was tested.
- Read CLAUDE.md first and follow its standing orders, then docs/HANDOFF.md top to bottom ("Now" and "MOVING TO ANOTHER ACCOUNT"). Wherever the docs say "the lead" or "workers", read it as you. The repo is the memory: log every message of mine verbatim in docs/OWNER_MESSAGES.md, and keep HANDOFF, HISTORY, STATUS and BACKLOG current. Commit and push after every meaningful step.
- Setup: `npm install`, then `node tools/build.mjs` (a plain build is the live game), run a smoke test, then publish dist/index.html as a NEW artifact. The old link belongs to the old account. Put the new link in CLAUDE.md and send it to me.
- Write progress notes into your report as you go and check in with me at set points. If something is getting expensive or stuck, stop and tell me instead of pushing on.

What to do, in this order:
1. Lighting: the pools of street light at night show through buildings. The previous Fable worker was nearly done when it ran out of usage. Its final checks had all passed and only its report was missing. Everything it left is in docs/wip/lighting_as_left/ (README there), and the plan is docs/wip/LIGHTING_RESUME_BRIEF.md. Apply its saved work, read its log, re-run its checks, look at its pictures, and write docs/reports/pool_occlusion.md. Then send me a short note on whether it works and what's left, before making bigger changes. When it's right, publish it with before/after night pictures.
   (If this goes badly I may go back to the old account after the reset and let the original worker finish, so don't delete anything in docs/wip/.)
2. Passengers flicker on their seats in the plane cabin.
3. Re-shoot the trailer's plane landing shot on the current game: zoomed in as in the current cut, red "Maple Air" livery, same slot and length, no plane sound. Then send me the trailer again (web copy and download copy). docs/reports/trailers.md has the shot list and how to re-record.
4. Small items from HANDOFF: move the two trees under the rail viaduct, plus a rule that nothing tall stands in the train's path; a long traffic soak; a touch-test pass over the newest work; re-run the five test tools updated for the Start button.

Not now: more activities and jobs (later, when I say), J4 jobs, iPhone 13 mini work, Trailer A.

About me: I play on an Android phone in portrait and voice-type. Keep reports short and plain, and always say what you tested yourself and what you didn't.
