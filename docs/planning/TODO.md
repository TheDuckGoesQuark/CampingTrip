# TODO

All planned and deferred work, organised by priority.

---

## Next Up

### Workout tracker — data model & offline sync design

Plan the workout tracker backend models (exercises, workouts, sets), DRF serializers/viewsets, and the frontend offline-first architecture (IndexedDB schema, sync queue, conflict resolution).

### Workout tracker — UI implementation

Build the actual workout logging UI: exercise library, workout logger, history view, dashboard. Mobile-first design for phone use.

---

## Backlog

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

---

## Future

(Nothing yet)
