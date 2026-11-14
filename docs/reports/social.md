# Social system — notes (full API in header of src/sim/social.js; panel in src/ui/talk.js)
- `G.social`: npc(id) -> {id, name, short, role, group, district, home, spec, rel, tier, tierLabel, met, where, knownFacts, bio?, birthday?}; rel(id), addRel(id, d, {raw?}), setRel(id, v), tier(id), known(), meet(id), isFamily(id);
  whereIs(id) -> {placeId, label, name, sceneId, x, y}, present(id), char(id) (the Char if on screen), schedule(id, t?), staffAt(venueId), boss(jobId), refresh();
  talk(id, opts) -> Promise (panel); opts {greeting: [...], lines: {verbId: text|[..]}, max, onEnd}; converse(id, opts) (UI-less); talkToCitizen(info).
- Story scripting: `G.social.place('kit', 'cafe', {minutes: 120, anim: 'drink'})`; exact spot `place(id, placeId, {x, y, until, scene: 'int:cafe'?})` (city coords by default); `place(id, null)` hides; `place(id)` back to routine.
  `await G.social.sayAs(id, ['line', ...])` scripted lines. `hangout(id, {placeId, t, dur})` agreed meeting -> apptId; `inviteFrom(id, {placeId, t, dur, text, title})` text with Accept/Decline (home:sibling/grandma/friend become hosted visits and open the door via G.housing.invite).
- Events: npc:met(id), friend:up(id, tier), friend:down, social:talk(id, verb, ok), social:gift, social:hangout(id, apptId, kind), social:favor, social:citizen.
- Jobs: boss(jobId) -> cast id; staffAt(venueId); addRel(bossId, n) after good shifts; flags.goodWord. Shop may apply `discount(venueId)`.
- State G.state.social {npcs, citizens, over, hang, ...}.
