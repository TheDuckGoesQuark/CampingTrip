# TODO

All planned and deferred work, organised by priority.

---

## Next Up

### Workout tracker — core workout flow (Phase 2 remaining)

- Batch sync endpoint (`POST /api/workout/sync/`) — dedicated endpoint for full state reconciliation on reconnect
- End-to-end offline workflow testing: log a workout offline → come online → data syncs

### Workout tracker — dashboard & polish (Phase 4)

- History view with date filtering and search
- Mobile UX polish (transitions, gestures, haptics)
- Session review page (detailed view of past workouts)
- Advancement notifications (toast/badge when a node is achieved)
- Exercise demo videos/images in guided workout warm-up and exercise screens
- Dashboard charts: show date range selector, handle duplicate dates better (group by session not just date)

---

## Backlog

### Workout tracker — Strava integration

- Track runs via Strava API
- Verify workouts / import activities
- OAuth flow for Strava connection

### Workout tracker — equipment tracking

- Equipment varies a lot — needs flexible modelling
- Equivalent exercises to consider across equipment

### Workout tracker — data export/import

- Export workout data (JSON/CSV)
- Import data from other apps

### Workout tracker — sharing ladders between users

- Allow users to share/publish their ladder progressions
- Browse and clone community ladders

### Workout tracker — progressive overload suggestions

- Auto-suggest weight/rep increases based on recent performance
- Periodisation recommendations

### Workout tracker — notification reminders

- Push notifications for scheduled workouts
- Rest day reminders

### Campsite — tent open/close mechanic

- Add tent flap open/close interaction (click or swipe to unzip/zip)
- Different ambient environment when tent is open vs closed
  - Open: brighter interior, outdoor sounds more prominent, wider camera range
  - Closed: cosier, muffled rain, warmer lighting
- Animate tent flap mesh (morph target or bone-based)
- Deferred loading of outdoor models — PicnicArea, Campfire, WalkingCat GLBs don't need to load until the tent is first opened. Load them lazily on first open (R3F Suspense boundary around outdoor group) so initial tent load is faster. OutdoorScene (sky/stars/clouds) is procedural so it's cheap either way.

### Campsite — sound & visual polish

- Sound changes when tent opens (rain gets louder, campfire crackle fades in)
- Visual transition effect when opening tent (light spill, blur fade)

### Digital Twins — scheduling simulator polish & storytelling

- Scrollytelling narrative content for the algorithm explanation cards
- Phase 1 scroll-driven animation engine (keyframe interpolation, anchor system, task tokens) — see plan file
- Easing curves for smoother scroll interpolation (Phase 2 in plan)
- Wait time chart (avg wait time per project over time)
- Per-project throughput breakdown chart

### PhotoBroom — initial features

- Define domain models (albums, photos, tags, etc.)
- Photo upload and storage (S3)
- Album/tag management UI
- Browse and search photos
- Bulk operations (tag, move, delete)

---

## Future

- Full onboarding flow for initial working weight estimates (currently set per-node on ladder detail page)
- Warm-up set rep/weight curve customisation per user
