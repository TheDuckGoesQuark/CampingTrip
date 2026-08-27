# TODO

All planned and deferred work, organised by priority.

---

## Next Up

### CatOS — window geometry

Make the window behave like a window. All of this belongs in the DS `Window`,
which currently centres itself at a fixed `size`:

- Maximise: fill the desktop, from the green light and from a double-click on the
  title bar.
- Minimise: collapse to the title bar and back, from the amber light. There is no
  dock or taskbar to minimise _to_, so a window shade is the behaviour that fits.
- Resize by dragging. This needs the frame to carry a real position rather than
  being flex-centred, since growing a centred frame slides it out from under the
  cursor — which drags to move it comes along with.
- Two windows on screen at once, which the position work unlocks. Until then a
  gimmick replaces the browser rather than floating over it.

### CatOS desktop — a minigame

"Cat Sweeper" is in the design and is the one desktop item that needs logic
rather than content. Everything else in the junk drawer is built.

### Blog — content to write

- Three posts are seeded with a real standfirst and opening paragraph and a
  bracketed `[DRAFT — …]` beat to finish. They are placeholders for Jordan's
  words, not content.
- `Favourite Tools` on the homepage is fed from `bookmarks.ts`, which mixes two
  things: tools (myNoise) and things loved (Eyezmaze). Decide whether those want
  to be two homepage sections or one.

### Design system — boxy pass on in-window content

- Give `Button` a bevelled face for in-window use. The window frame squares its
  corners, but the design's in-window buttons also carry a 1px
  `--brand-border-strong` and `--shadow-bevel-out`, which no `Button` variant
  has. Decide whether that is a new variant or a scoped override like the radius.
- `Button` logs a Base UI `nativeButton` console error when given
  `render={<a href=… />}`. Reproduce on `/blog/photobroom`. Fix belongs in
  `src/primitives/Button` (components may not import Base UI directly).

### Design system — more than one window on screen

`Window` centres itself in a full-bleed layer, so two rendered together stack
exactly on top of each other. The CatOS design wants a Preview window
overlapping a text window. Needs a call on where placement lives: a `placement`
variant on `Window`, or an app-level window manager owning position and z-order.

### Campsite — an environment that can actually run the 3D scene

Two changes shipped this session that could not be verified before merging,
because the preview pane keeps the page hidden and a hidden page pauses
`requestAnimationFrame`, so R3F stops rendering and GSAP stops advancing. One of
them was broken and had to be reverted. Worth solving before the next change
inside the Canvas:

- Find a way to drive the tent scene with a live rAF for verification, or
- Add coverage with `@react-three/test-renderer` (already a devDependency, and
  the vitest config already inlines it) so scene-graph assertions — a mesh's
  resolved position, whether a tween's completion is wired — can run headlessly.

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
