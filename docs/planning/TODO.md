# TODO

All planned and deferred work, organised by priority.

---

## Next Up

### Blog — the prerendered reader has no way up

A prerendered page is the head template plus `<main id="reader">` and nothing
else: no site header, no nav landmark, no link to `/` or to the blog index. So
`/blog/cv.html` with no JavaScript offers the CV's own links and the PDF, and
nothing more — a dead end for a crawler, a scraper and a reader-mode
extraction. Whatever header this grows has to be print-hidden, because the
print stylesheet in `index.html` keeps `#reader` and drops the rest, and that
is the path `build:pdf` prints `/cv.pdf` from.

### Blog — a real italic for post prose

`whatVibeCodingChanged.tsx` uses `<em>`, and the Nunito Sans load is the roman
axis only, so the browser synthesises the slant. `@fontsource-variable/nunito-sans`
ships `index-italic.css` beside it — another ~31KB for the one `<em>` on the site
today, which is why it was not taken. Worth it once prose leans on emphasis.

### Blog — Nunito still fetches four static weights

Splitting `--font-text` off `--font-sans` did not free any Nunito weight: 800 is
titles and tiles, 700 is `title-4`/labels/buttons/tags/badges, 600 is `Link`, and
400 is every unweighted descendant of `.jc-brand`. The saving is a different move
— `@fontsource-variable/nunito` would replace four ~16KB cuts with one axis file,
the way the text face already works. Derive the current cost with
`ls -la node_modules/.pnpm/@fontsource+nunito@*/node_modules/@fontsource/nunito/files/`.

### Campsite — the tab bar and the time-of-day arc share a corner

Fixing the right-hand collision left the left one. The arc is a fixed 160x130
box at top-left and the tab pill is centred, so at 375px the pill starts at
x=129 while the arc's box reaches x=174 — the boxes overlap, and only the arc's
drawn stroke topping out near x=116 keeps the pixels apart. Narrower still and
the stroke crosses under the pill. Reproduce by measuring both
`getBoundingClientRect()`s at a 320px viewport. The fix is a call on whether the
arc shrinks, moves, or collapses to the time text alone on narrow screens.

### Campsite — a full-screen settings takeover with model credits

The cog opens a 180px popover. A takeover would have room for the three
preferences plus the 3D model attributions, which today live only in the
per-model comments in `TentScene/environment/*.tsx` and in `apps/campsite/README.md`
— a visitor never sees them. Needs a focus trap and an Escape/close affordance;
the popover's outside-click handling is already there to lift.

### CatOS — window polish left over

- **Keyboard resize.** The amber and green lights cover shade and maximise, but
  dragging to an arbitrary size has no keyboard equivalent.
- **Two scrollers still draw the platform's bar.** `Window.Body` takes the
  design system's `classic` class and CatOS's plain-text window no longer
  scrolls itself; the modal and PhotoBroom's horizontal rail are still the
  platform's. Each is a deliberate call rather than a sweep: a modal is a
  document surface, and the rail is horizontal, where the end caps and the 16px
  band cost more.
- **A window can be completely hidden.** The browser is the widest frame and it
  centres, so a cascaded viewer lands inside its bounds. Re-clicking the desktop
  icon raises it, which works but is not discoverable. A dock, or windows that
  cascade further, would both fix it.

### Tent — the second step into the blog has no hint

The idle hint points at the laptop, and stops once its screen is on. But turning
the screen on is only step one: the blog opens from the _logo_ on that screen, and
nothing points at it. A visitor who takes the hint, turns the laptop on and then
stalls is stuck one click short. The same `useIdleHint` would drive it — the logo
already scales up on hover, so a slow breath on its scale is the obvious move.

### CatOS desktop — a minigame

"Cat Sweeper" is in the design and is the one desktop item that needs logic
rather than content. Everything else in the junk drawer is built.

### Blog — the "Work with me? / Get to know me?" toggle

The CV is live at `/blog/cv.html` and `/cv.pdf`; what is left is the way to land
on it. The design cycle owns the form. Three constraints hold whatever it
becomes, recorded in [cv-design.md](cv-design.md): the two views are two URLs
(`/blog/cv.html` and `/blog/index.html`), the toggle's state is derived from the
URL and never stored, and the prerendered reader must not depend on it.
Candidates: a segmented control in CatNav's header, a `CV` icon on the desktop,
a bookmark in the browser bar, or a choice on the welcome screen at `/`.

### Blog — the CV's narrative

The roles, skills and education in `cv.tsx` come from Jordan's document. The
narrative's closing paragraph is a `[DRAFT — …]` beat, and the narrative is the
place for an `Island` if the CV wants one interactive piece.

### Blog — content to write

- Three posts are seeded with a real standfirst and opening paragraph and a
  bracketed `[DRAFT — …]` beat to finish. They are placeholders for Jordan's
  words, not content.
- `Things I think are cool` on the homepage is fed from `bookmarks.ts`, which
  mixes two things: tools (myNoise) and things loved (Eyezmaze). The heading is
  wide enough to hold both, so the open question is whether they read better
  split across two homepage sections.

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
- Extend the `@react-three/test-renderer` coverage. `Lighting.test.tsx` is the
  worked example: mount a subtree, `advanceFrames`, then assert on what the
  `useFrame` body wrote. A mesh's resolved position and whether a tween's
  completion is wired are reachable the same way.

---

## Backlog

### CatOS — a battery indicator beside the clock

The menu bar's right slot holds the clock and nothing else. A battery reading
the visitor's real level would finish the illusion, but the Battery Status API
is Chromium-only — Firefox and Safari (so every iOS browser) never resolve
`navigator.getBattery`. What to draw there is the open question: hide the
indicator entirely, show a static full cell, or show an explicit
unknown-state glyph. The first is the honest default and the one to beat.

### Music player — the seek bar cannot be reached from a keyboard

`ProgressBar` in `MusicPlayerOverlay` is a bare `div` with an `onClick` that reads
`clientX`, so seeking is mouse-only and the control is invisible to assistive
technology. Wants a real slider: `role="slider"` with `aria-valuenow`/`min`/`max`,
`tabIndex={0}`, and arrow keys stepping the position. A native
`<input type="range">` would come with all of that, at the cost of restyling the
track and thumb to match the deck. Until then the file carries a grandfathered
`jsx-a11y/click-events-have-key-events` +
`jsx-a11y/no-static-element-interactions` entry in `.oxlintrc.json` — delete it
with the fix.

### Blog — the music callout promises songs the tape deck hasn't got

The `Callout` at the foot of `/blog/tags/music.html` reads "The tape deck back at camp
has the actual songs on it", and its button opens a player whose song list is
empty. Needs either Jordan's words or a recording in `songs.ts`.

### Repo — `PLAN.md` reads as a second architecture document

It is the pre-build implementation plan, and it describes an `audioManager.ts`,
a `rain-ambient.mp3` and a `tent-door-rustle.mp3` that were never built. A
reader who opens it alongside `ARCHITECTURE.md` gets two answers. Decide whether
it moves under `docs/`, goes away, or gains a header saying what it is.

### Campsite — tent open/close mechanic

- Add tent flap open/close interaction (click or swipe to unzip/zip). Starts
  from scratch in the store: `tentDoorState` and its setter are gone, since
  nothing ever called the setter and the readers all branched on a constant.
- Different ambient environment when tent is open vs closed
  - Open: brighter interior, outdoor sounds more prominent, wider camera range
  - Closed: cosier, muffled rain, warmer lighting
- Animate tent flap mesh (morph target or bone-based)
- Deferred loading of outdoor models — PicnicArea, Campfire, WalkingCat GLBs don't need to load until the tent is first opened. Load them lazily on first open (R3F Suspense boundary around outdoor group) so initial tent load is faster. OutdoorScene (sky/stars/clouds) is procedural so it's cheap either way. Now the largest remaining win: the campfire and picnic area are 2.2 MB of the 3.8 MB the idle warm-up pulls while someone is reading the blog.

### Campsite — sound & visual polish

- Sound changes when tent opens (rain gets louder, campfire crackle fades in)
- Visual transition effect when opening tent (light spill, blur fade)

### Campsite — what the blog still pays for

The blog's blocking bytes are down to the entry chunk, but two things inside it
are there only for the tent:

- **`howler`** comes in through `MusicPlayerOverlay`, which `SceneRoot` imports
  statically so a deep link to `/music` renders without the Canvas. The player
  could load its audio engine on open instead.
- **Four Nunito weights**, each in latin and latin-ext. Unicode-range keeps the
  unused subsets off the wire, but the weights themselves are all fetched. Worth
  checking whether the design actually uses all four.
- **4.1MB of models, on a page that shows none of them.** `SceneRoot`'s idle
  prefetch imports the TentScene chunk, whose module-scope `useGLTF.preload`
  calls then fetch every GLB plus the Draco decoder — measured at 4.1MB of
  models and 752KB of decoder, first request ~560ms after load. It costs no
  main-thread time (Draco decodes in a worker) and `saveData`/2G already opts
  out, so this is cellular bandwidth and battery rather than jank. The call is
  whether the prefetch should warm the chunk only and leave the models to the
  mount, or wait for a signal that the visitor is heading for the tent.
  Reproduce by counting `/models/` responses on a cold load of `/blog`.

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
