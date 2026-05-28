# TODO

All planned and deferred work, organised by priority.

---

## Next Up

_(nothing queued)_

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
- Stand up a backend when needed — see "Adding a backend later" in `docs/architecture.md` (containerised service + co-located Postgres on the existing EC2 box)

---

## Future

_(nothing queued)_
