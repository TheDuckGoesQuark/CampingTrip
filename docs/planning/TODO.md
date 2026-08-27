# TODO

All planned and deferred work, organised by priority.

---

## Next Up

### Design system — boxy pass on in-window content

- Decide whether `Button` and `Badge` should square off inside a CatOS window.
  They are shared components used outside the desktop chrome, so this needs a
  call on scope: a `shape` variant, a desktop-scoped wrapper, or leave the
  rounded brand shape as deliberate contrast.
- `Button` logs a Base UI `nativeButton` console error when given
  `render={<a href=… />}`. Reproduce on `/blog/photobroom`. Fix belongs in
  `src/primitives/Button` (components may not import Base UI directly).

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

### PhotoBroom — polish & robustness

- Error recovery: report which photos failed to bin (e.g. shared/partner items Google won't delete) rather than silently skipping
- Surface the `inspectPage()` health check in the UI as a "Google's layout may have changed" warning when selectors stop matching
- Loading skeleton / nicer progress while scanning very large result sets
- Code-split / shrink the overlay bundle (currently ~290KB)

---

## Future

_(nothing queued)_
