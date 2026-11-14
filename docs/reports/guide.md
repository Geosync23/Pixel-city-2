# Wander — the Maple Bay guidebook (phone app `guide`) — notes (src/sim/guide.js, _guide_data.js, src/ui/phone_guide.js, phone_guide.css)
- Content index built at runtime from what exists (rebuilt on city 'scene'): 272 entries (135 places, 24 transit, 10 shows, 16 events, 87 activities). Chapters: Eat & Drink, Shopping, Shows & Nightlife, Arts & Culture,
  Outdoors & Parks, Fitness & Sport, Sights & Landmarks, Services, Getting Around, Things To Try. Undiscovered places are listed too.
- `G.guide`: all(), get(id), byChapter(ch), byDistrict(key), near(x, y, n, filter?), search(text), stats(), rebuild(), whatsOn(day?), times(entry, days), thingsToTry(), stampGroups(), stamp(id), openNow(entry),
  pos(entry), nearestTransit(entry), hiddenGem(), fav(id, on?), favs(). State G.state.guide { stamps, seen, favs, ... }. Events guide:stamp, guide:rebuilt.
- App: cover/home (search, Today in Maple Bay, chapter tiles, districts), chapter pages with filters + thumbnails, entry pages with "Take me there" (waypoint), "Call a cab", "Add to planner" for shows/events,
  What's On agenda, Stamp Book (96 stamps: activities/experiences + 9 districts). Deep links: G.phone.open('guide', { entry | chapter | district | tab: 'whatson' | 'stamps' }).
- Stamps are driven by existing events (activity:done, ride:end, show:end, shop:buy, skydeck:*, mall:*, service, job:*, social:*, npc:met, cooked, home:furnish, scene, place:discover).
- New content appears automatically if it is a door poi with a room, a stall, a G.publicPlaces entry, a G.shows venue, a calendar EVENT, a poi spot, or an activity in data/activities.js. Blurb templates live in _guide_data.js.
- Gaps: no app icon art (`app.guide`); bus stops aren't separate entries; entry picture slightly soft; "Add to planner" on calendar events duplicates the planner's own event row; phone home grid now scrolls (10 apps).
