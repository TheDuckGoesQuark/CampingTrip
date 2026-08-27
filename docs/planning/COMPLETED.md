# Completed Work

History of what's been built, key decisions made, and what was deferred along the way.

---

## Landing on the blog, and a hint towards the laptop

**Date**: 2026-08-27

**What was done**: two nudges towards the blog, which was previously reachable
only by a visitor guessing that the laptop in the corner was one.

- **`/blog` opens the blog itself.** Two mechanisms, because two different
  journeys arrive here. An in-app journey aims at `blogPaths.home` directly, via a
  new `opens` on the overlay link; a link or a typed URL straight to bare `/blog`
  gets a redirect in `BlogRoute`.
- **The tent points at the laptop after 8 seconds of stillness.** A new
  `useIdleHint(armed, delayMs)` hook, and a breath on the laptop's own emissive
  map — the peak of the breath is exactly the look hover already gives it.

**Key decisions**:

- **`OverlayLink.path` and `OverlayLink.opens` are different facts.** `path` had
  been doing two jobs: the prefix that makes a tab read as current, and the place a
  click goes. The blog is the first case where they differ — the tab must stay
  current on every page under `/blog`, while a click should land on the homepage.
- **The empty desktop survives.** Closing the last window still lands on bare
  `/blog` and leaves it empty, because re-opening the browser there would make the
  red light look broken. The redirect is skipped whenever CatOS is already open,
  which is exactly what tells the two arrivals apart.
- **One effect owns the laptop's LEDs.** Hover lights them steadily and the hint
  breathes them; two effects would fight over the same materials. Hover wins — a
  visitor already pointing at the laptop has found it. Only the LEDs are touched,
  and they carry `skipHighlight`, so the breath cannot collide with the warm
  emissive `applyHighlight` puts on the body.
- **The hint is armed, not filtered.** `useIdleHint` takes `armed` rather than the
  caller ignoring its result, so a hint is never counting down behind a loading
  screen or an open overlay and then firing the instant one closes.
- **Reduced motion still gets the hint**, held steady rather than breathing. The
  point is to say "look here", and that does not require movement.

**Deferred**: the hint stops once the laptop's screen is on, but the blog opens
from the logo _on_ that screen — so the second step of the journey still has no
hint. In `TODO.md`.

**Not verified**: the breath's appearance. The tent scene renders blank in the
Claude Code browser pane (pre-existing — confirmed by stashing the change and
reloading), so the hint's timing is covered by tests and its look needs a human.

---

## Stacking windows by z-index, not by DOM order

**Date**: 2026-08-27

**What was done**: fixed two bugs in the multi-window desktop, both from one
cause. On a window behind the front one, the red light only raised the window
instead of closing it, and dragging its title bar was erratic.

The cause: raising moved the window's id to the end of `openWindows`, the overlay
mapped that array to children, so React raised a window by **moving its DOM
node**. A node detached and re-attached mid-gesture loses the pending `click`
(the browser only synthesises one when press and release share a still-attached
target) and its pointer capture. Raising happens on press — so the raise ate the
very gesture that asked for it.

- **`Window`** gained `stackOrder`, which sets `--window-stack-order` on the
  frame's layer; the layer's `z-index` is `calc(20 + var(--window-stack-order))`.
- **`LaptopScreenOverlay`** renders the frames in a fixed order — by id — and
  passes each window's place in the stack as that number instead.
- **`components/catos/windowFrame.ts`** holds the frame props every window
  forwards untouched, so a third one did not get re-declared in five files.

**Key decisions**:

- **Supersedes "paint order is DOM order"** from the entry below. DOM order is
  the cheaper mechanism and it was the wrong one: it makes raising a structural
  change to the tree, and the tree is what the in-flight gesture is anchored to.
  Stacking is a paint concern, so z-index is where it belongs.
- **DOM order fixed by sorting on id.** Arbitrary, and that is the point — it has
  to be something the stack cannot perturb. Nothing reads it any more.
- **`cascade` and `stackOrder` both come from the stack index.** Not a
  coincidence worth hiding: a window opens on the end of the stack, so its index
  there is also how many windows it must step down and right of. `cascade` is
  still read once at mount, so a later raise never moves a window on screen.
- **Verified by the invariant, not the timing.** The bug needed a human-paced
  press — automation fires press and release inside one frame, before React
  commits, so a synthetic click passed even while the bug was live. The test
  asserts the thing that actually broke: a raise leaves the rendered order
  untouched. Confirmed in the browser too, with a `MutationObserver` recording
  zero child-list changes across raises and drags.

---

## More than one window at a time

**Date**: 2026-08-27

**What was done**: the CatOS desktop holds a stack of windows instead of one. New
windows cascade so they do not land on top of each other, a press anywhere in a
frame raises it, and closing the front one hands the address bar to whatever was
behind it.

- **`sceneStore`** gained `openWindows` (window ids, back to front) and traded
  `activeBlogPath` for `browserPath`, since "the page the browser holds" and
  "which window is in front" stopped being the same thing.
- **`routing/windows.ts`** holds the window-identity rules: the browser is one
  window whatever page it shows, so it needs an id that is not a path
  (`WINDOW_BROWSER`); everything else _is_ its path.
- **`Window`** gained `cascade` and `onFocus`.

**Key decisions**:

- **Paint order is DOM order.** Each `Window` already renders its own full-bleed,
  click-through layer, so rendering the stack back to front gives correct z-order
  with no z-index bookkeeping. Raising a window means moving it last.
  _Superseded — see "Stacking windows by z-index, not by DOM order" above._
- **The URL names the front window; the rest is session state.** One URL cannot
  describe a desktop, and a shared link should not resurrect a stranger's — the
  same reasoning the tab strip already used. So `applyOverlayState` raises the
  window the URL names and leaves the others exactly where they are.
- **Raising replaces rather than pushes history.** Bringing a window forward is
  not going somewhere new, and a back button that walked through raise events
  would be useless.
- **Closing the front window navigates to the one behind it**, and only an empty
  desktop goes back to bare `/blog`. Closing the browser also ends the browsing
  session, tab strip included, since that window _is_ the session.
- **`frontWindow()` rather than `at(-1)`.** The app's TS lib target is ES2020, and
  naming the concept beats index arithmetic at four call sites.
- **The browser can completely cover a smaller window.** It is the widest frame
  and it centres, so a cascaded viewer lands inside its bounds. Clicking the
  desktop icon again raises the hidden window, which is the recovery path; moving
  the browser aside is the other. Left as is — this is how desktops behave.

**Verified in a browser**: three windows open at once, each cascaded and
reachable; raising by clicking a frame behind; raising by re-clicking a desktop
icon without duplicating the window; closing the front window handing the address
back. None of which jsdom can show.

---

## On a phone, a window is the screen

**Date**: 2026-08-27

**What was done**: below 768px of layer width a `Window` fills the space, the
drag surfaces go dead, the grow box is gone and the amber and green lights render
inert. The homepage stacks its two columns at the same sort of width, via a
container query.

**Key decisions**:

- **The stored `display` is left untouched while the frame is locked.** The
  full-screen presentation is computed, not assigned, so widening the viewport
  hands the window back exactly as the visitor left it.
- **The geometry controls go inert rather than missing.** A light that vanished
  would reshuffle the chrome as a viewport crossed the boundary; `Light` already
  renders a plain span when given no handler, so this is the existing pattern.
- **The homepage stacks on a container query, not a media query.** A window can
  be dragged narrow on a wide screen, and it is the window the content has to
  fit — so `Window.Body` is now a named container (`window-page`) and the page
  responds to that. This is what makes the same layout correct for a resized
  window and for a phone, with one rule.
- **Both a `resize` listener and a `ResizeObserver`.** Neither covers the other:
  the layer fills its takeover, so a viewport resize is the change that actually
  happens, while the observer catches the layer being resized by something else.
- **The desktop rail is unreachable while a phone-sized window is open**, since
  the window covers it. Closing the window is the way back, which is how a phone
  behaves anyway.
- **One line of copy stopped naming a side.** The intro said the tags were "on
  the right", which stops being true the moment the feed moves underneath.

**Not verified here**: the live switch between the two states. The browser pane
used for checking changes viewport metrics without notifying the page — measured
directly, `innerWidth` went 400 to 1000 with neither a `resize` event nor a
ResizeObserver callback firing. Both are spec-guaranteed in a real browser, and
each state was verified on a fresh load at 375px and at 900/1000/1100px, but the
transition itself wants a hand on a real window edge.

---

## The homepage fills the window it is in

**Date**: 2026-08-27

**What was done**: the homepage's reading column takes whatever width is left
instead of a fixed 500px, so a resized or maximised window no longer leaves dead
space down the right. The feed keeps its 280px, and the tools grid gains columns
as the window widens.

**Key decisions**:

- **The feed does not grow.** It is an index of short lines; a wider one would
  stretch the same content and read worse.
- **Prose keeps a measure even though its column does not** (`68ch`). Past
  roughly 75 characters a line is hard to track back from, so a maximised window
  would otherwise make the intro wider without making it more readable. This is
  the one part of "grow to fill" that is deliberately not followed — pull the
  `.intro` cap if the full width is wanted.

---

## Windows behave like windows: maximise, window shade, drag to move and resize

**Date**: 2026-08-27

**What was done**:

- **`Window` owns its geometry.** It opens centred at `size`, and from there the
  title bar drags it, a corner grow box resizes it, the green light and a
  double-click on the title bar maximise it, and the amber light rolls it up into
  its own title bar.
- **`geometry.ts`** holds the sizing, clamping, move and resize maths as pure
  functions, with the bulk of the new tests against it.
- **`display` is one enum** — `normal` / `maximised` / `shaded` — controlled via
  `display` + `onDisplayChange`, uncontrolled via `defaultDisplay`.
- **The amber and green lights are always live**, driven by the frame through a
  context. Only the red light stays a caller prop.
- **`--menubar-height`** is now a token, which `MenuBar` sizes itself from and a
  maximised window leaves clear.

**Key decisions**:

- **Minimise is a window shade, not a disappearance.** There is no dock or
  taskbar to minimise _to_, so a window that vanished would be a trap. Rolling up
  into the title bar is the classic behaviour, needs no new chrome, and leaves the
  way back exactly where the way in was.
- **One enum, not two booleans.** `maximised` and `minimised` flags would admit a
  fourth state that means nothing.
- **Move came along with resize, not as a separate feature.** Growing a
  flex-centred frame re-centres it, sliding the window out from under the cursor,
  so resize needs a real position — and once the frame has one, being unable to
  move it is the odd behaviour.
- **Both drag surfaces are refinements, not the only way in.** Every state the
  frame can be in is reachable from the two lights, which are ordinary buttons
  with `aria-pressed`. Fine-grained resize is pointer-only, which is a real gap,
  but not one that locks anyone out of the big view.
- **Geometry is measured in a layout effect** so the first paint already has it,
  with the CSS size classes kept as the pre-measurement fallback. A viewport
  resize only _rescues_ a frame the layer has outgrown rather than re-centring it,
  so it never throws away where the user put the window.
- **Drags are applied as deltas, not as an offset from a grabbed origin.** An
  origin-based drag builds up a debt while clamped at an edge and then pays it
  back the instant the pointer turns around.
- **Pointer capture is treated as optional.** It is an enhancement — without it a
  drag stops at the element's edge — and calling it unguarded threw on every
  title-bar click under jsdom.

**Also fixed**:

- **The campsite's `ResizeObserver` test stub was not constructible.** It was
  `vi.fn().mockImplementation(() => ({…}))`, so `new ResizeObserver(…)` threw for
  any component that used one.

**Deferred**:

- Two windows on screen at once. The frame now carries a position, which is what
  that needed, but z-order and focus between windows is still nobody's job.
- Keyboard resize. The lights cover maximise and shade; dragging to an arbitrary
  size has no keyboard equivalent.

---

## The desktop gets its junk drawer

**Date**: 2026-08-27

**What was done**:

- **Four things on the desktop besides CatNav**: `smittens_047.jpg` in a Preview
  window, `notes.txt` and `DO_NOT_OPEN.txt` in plain-text windows, and a Bin that
  lists what's in it. Each is a `DesktopItem` in `data/desktopItems.ts`.
- **`components/catos/`** holds one component per window kind — `BrowserWindow`,
  `PreviewWindow`, `TextWindow`, `BinWindow` — and `CatosWindow` picks between
  them. The browser chrome moved out of `LaptopScreenOverlay`, which is now just
  the desktop.
- **`DesktopIcon` takes a `glyph`**, so an icon can be a drawn `Icon` rather than
  an initial. Preference order: image, glyph, letter tile.
- **The "New" badge found a real home** on the homepage feed: a post published
  since the visitor's last session. It was previously wired to desktop icons,
  which carry no dates, so it could never fire.
- **`LaptopScreenOverlay` came off the `react/forbid-dom-props` grandfathered
  list** — its inline styles are now in `catos.module.css`.

**Key decisions**:

- **Desktop items are URLs too** (`/blog/desk/<slug>`), because the URL is this
  app's source of truth for what's open and a window with no URL would be the one
  piece of state that isn't. They carry no `.html`: the extension exists to be
  _seen_ in an address bar, and none of these windows has one.
- **A desktop item never joins the browser's tab strip.** `isBrowserPath` gates
  it, and `BrowserPage` excludes the desk kind so the browser's own renderer is
  exhaustive rather than quietly falling through.
- **One window at a time, browser included.** The design shows a Preview
  overlapping a text window, but that needs a window manager owning position and
  z-order. Opening a gimmick therefore replaces the browser rather than floating
  over it, and closing it returns to the desktop with the tab strip intact.
- **Preview's zoom and paging controls render disabled rather than being
  omitted.** There is one image and it fits. A viewer missing them reads as
  unfinished, and a control that lies about working is worse than a grey one.
- **The Bin offers no Empty.** The joke is the contents, and a working control
  would delete them for whoever visits next.
- **The photograph is drawn, not shipped.** The repo carries no cat photo.
  `SmittensPhoto` is one component, so an `<img>` can replace it without
  `PreviewWindow` changing.
- **Text windows are `md`, not `sm`.** At 420px a line of notes soft-wraps
  mid-phrase, which reads as a layout fault rather than as a text file.
- **A status bar is a single line.** Its height is fixed, so wrapped content
  escaped the frame — found by looking at it. The caption moved under the photo
  as a `figcaption`, where a caption belongs.

**Deferred**:

- A minigame. "Cat Sweeper" was drawn in the design and is the one desktop item
  that needs real logic rather than content.

---

## The browser gets a homepage, posts, tags and a 90s URL scheme

**Date**: 2026-08-27

**What was done**:

- **The desktop stopped being the content index.** The rail launches CatNav and
  nothing else; projects, tools and posts all live inside the browser now.
- **CatNav opens a homepage** (`/blog/index.html`): about, projects, favourite
  tools, and the blog feed as a sunken panel down the right.
- **Posts exist.** `types/post.ts` plus one file per post under `data/posts/`,
  barrelled newest-first. Bodies are TSX. Three are seeded, each with a real
  standfirst and opening and a bracketed `[DRAFT — …]` beat to finish.
- **Tags are pages**, not a sidebar filter: `/blog/tags/<tag>.html`, with counts
  derived from the posts. `/blog/posts/index.html` is the whole archive.
- **The URL scheme is a directory per kind with a trailing `.html`**, defined
  once in `routing/blogPaths.ts` alongside the parser that reads it back.
- **`Window` grew a `Tile`-based letter fallback** — extracted from
  `DesktopIcon`, now shared with the homepage's project rows and tool cards.
- **`Button` no longer takes an anchor's semantics** when given `render`.

**Key decisions**:

- **Tabs are paths, not slugs.** A tab can be a post, a tag, a project, a tool or
  the archive; a path already says which, and the flat slug namespace it replaces
  could silently resolve a post and a project with the same title to whichever
  list was searched first.
- **One splat route, `blog/*`, read back with `parseBlogPath`** rather than a
  route per kind, so the scheme is defined in exactly one place. `blogPathFor` is
  its inverse, and the route canonicalises through it — so `/blog/tags/music` and
  `/blog/tags/music.html` are one tab, displayed with the extension.
- **`/blog/<slug>` still resolves.** `projects.ts` publishes a link to
  `/blog/photobroom`, so flat slugs redirect to whichever directory now holds
  them. Covered by a test naming that reason.
- **An unrecognised blog path lands on the desktop**, not back at the tent — a
  gentler 404 that keeps the visitor inside CatOS.
- **`Modal`'s popup now sets `font-family` as well as `color`.** Base UI portals
  it to `<body>`, outside `BrandProvider`'s wrapper, so it inherited the
  campsite's Courier New. `<Text>` was unaffected because it sets its own family;
  raw markup a caller passes in was not, which is what a post body is.
- **`Button` with `render` bypasses Base UI's Button entirely.** Base UI's job
  there is to make a _non_-button act like one, and it does that by stamping
  `role="button"` on what it is given — stripping an anchor of the link semantics
  a reader needs, to replace keyboard behaviour the anchor already had. Setting
  `nativeButton={false}` makes that worse, not better. This also clears the
  console error the planning notes had recorded, including in `OverlayTabBar`.
- **New app UI uses CSS Modules, not inline `style`.** `react/forbid-dom-props`
  is enforced for every app file outside the grandfathered list, and that list is
  meant to shrink. `Tile` exists partly because a per-item colour cannot be
  expressed in an app file under that rule.
- **A feed shows what a post says, not an image.** No post carries a hero image,
  and the projects' `icon` paths are not in the repo, so the letter tile is the
  real presentation rather than a fallback waiting to be replaced.
- **Dates format in UTC.** They are authored as `YYYY-MM-DD`, which parses as UTC
  midnight; formatting locally would show every post a day early west of
  Greenwich.

**Deferred**:

- The desktop's gimmicks — a minesweeper, a stray JPEG opening in Preview, a
  text file, a bin. The `Window` chrome for them is in place; nothing launches
  them yet.
- `data/tags.ts` and `data/posts/index.ts` sort with `.sort()` on a defensive
  copy, which oxlint flags in favour of `toSorted`. That needs the app's TS `lib`
  moved to ES2023, which is a browser-support call worth making deliberately.

---

## Design-system pieces for the CatOS blog: Icon, Card, Tag, and window kinds

**Date**: 2026-08-27

**What was done**:

- **`Icon`** — a closed set of stroked glyphs on a 24-unit viewBox, sized
  `sm`/`md`/`lg` from new `--icon-*` tokens and coloured by `currentColor`.
  Names describe the shape (`globe`, `document`, `cassette`), never a use, so the
  DS stays ignorant of what a caller has behind them. An unlabelled icon is
  `aria-hidden`; `label` promotes it to `role="img"`.
- **`Card`** — a boxy bordered surface: `tone` × `elevation` × `padding`.
- **`Tag`** — a topic label with `selected`, an optional `count`, and `render`.
- **`Window` grew the chrome a non-browser window needs**: `Window.Toolbar`,
  `Window.ToolButton`, `Window.Separator`, `Window.StatusBar`, a `size` axis
  (`sm`/`md`/`lg`) and `Window.Body inset`. The traffic lights, tab close,
  new-tab, address-bar navigation and padlock all draw from `Icon`.
- **`primitives/useRender.ts`** — the Base UI shim that gives `Card` and `Tag`
  a `render` prop without either importing Base UI directly.

**Key decisions**:

- **A window's kind is which subparts it is given, not a `kind` prop.** Tabs plus
  an address bar make a browser; a toolbar plus a status bar make a viewer. This
  keeps one frame component instead of a discriminated union whose arms each want
  different chrome, and it means a new kind of window needs no DS change at all.
- **The window frame scopes the radius tokens to `--radius-none`.** This settles
  the open question of whether `Button` and `Badge` should square off inside
  CatOS. A `shape` variant on each rounded component would have spread one
  decision across three APIs and required every call site to opt in; scoping the
  tokens on `.window` states the rule once — everything inside a window is
  hard-edged — and future components inherit it. `--radius-full` is left alone,
  so genuinely circular things stay circular.
- **`Tag` is parallel to `Badge`, not a variant of it.** The rubric's own answer:
  a Tag is routinely a link and carries a selected state, which is a different
  element and different ARIA, not a different colour.
- **`Card`'s hover and focus affordances key off the rendered element**
  (`.base:is(a, button)`), not an `interactive` prop, so the styling and the
  semantics cannot disagree.
- **`elevation` moves border weight and hard shadow together** rather than
  exposing them as two axes — a 1px border under a 4px drop shadow never reads as
  one object.
- **`Window.Toolbar` deliberately does not claim `role="toolbar"`.** That role
  promises arrow-key navigation between its controls, which it does not
  implement; each button is tabbable instead. Covered by a test so the role
  cannot be added without the behaviour.
- **The mockup's eyeballed 10px and 12px paddings snapped to the token scale**
  (`--space-s`, `--space-m`) rather than earning new tokens.

**Deferred**:

- Multiple windows on screen at once. The design shows a Preview window
  overlapping a text window, but `Window` centres itself in its layer, so two
  would stack exactly. Needs a placement or window-manager concern.
- A bevelled 90s `Button` face. Scoping the radius squares the corners, but the
  mockup's in-window buttons also carry a 1px border and `--shadow-bevel-out`,
  which `Button`'s `subtle` variant does not.

---

## Notes dropped from the tab bar; URL-hold mechanism tried and reverted

**Date**: 2026-08-27

**What was done**:

- **The tab bar promotes only the blog and the music.** `OverlayLink` gained
  `inTabBar`; the notepad is marked `false` rather than removed from
  `OVERLAY_LINKS`, because the notepad object in the tent resolves its route
  through that same table via `linkFor("notepad")`. It stays openable by its
  object and by `/notes`.
- **The laptop's logo sits on the screen panel.** Its position is now derived
  from `laptop.glb`: the screen sub-node carries a ~100x scale and a
  180-degree Y rotation, giving a panel of x -15.2..15.2, y 0.46..20.56 with its
  front face at z -9.89. The logo takes that centre.
- **The URL hold stayed a timer.** An attempt to commit on the GSAP flight's
  `onComplete` was merged and then reverted; the abandoned-flight cancellation it
  introduced was kept.

**Key decisions**:

- **Committing the URL on animation completion does not work here, and the
  reason is worth keeping.** For the completion signal to ever be the one that
  fires, the fallback deadline has to sit clear of the animation, so it went
  900ms to 1600ms. But the objects animate inside the Canvas off
  `requestAnimationFrame`, which a hidden tab pauses outright — measured at 0
  ticks per second — so a flight can simply never report. The deadline therefore
  did all the work, 700ms slower than the timer it replaced. Anyone reaching for
  this again needs a completion source that fires without rAF, not a longer
  deadline.
- **A flight that is abandoned no longer lands its URL.** Clicking the laptop and
  then the notepad used to fire the laptop's `navigate("/blog")` a second later,
  over the top of `/notes`.
- **The logo's placement is a derived constant, not a runtime measurement.** The
  runtime `Box3` version was the original source of the icon vanishing: it wrote
  to a ref, which schedules no render, so the seeded position is what actually
  drew and the measured value only took effect when an unrelated re-render
  followed. Moving the seed to state made the measured value win every time.
- **Depth reads as horizontal drift on this model.** `REST_ROT` turns the group
  54 degrees about Y, mapping local +Z onto world (0.81, 0, 0.59), so a logo
  floating 8.9 units toward the viewer appears about 7.2 units to the right.
  Worth remembering before nudging x on anything parented to that group.

**Deferred**:

- `Button` and `Badge` keep their rounded brand shape inside the boxy window.
- `Button` logs a Base UI `nativeButton` console error when rendered as a link.

**Why it mattered**: the URL-hold attempt is the useful part of this entry. It
was a reasonable idea, it passed its tests, and it shipped broken because the
tests exercised the emitter directly and never GSAP reaching it. The verification
gap was known and written down at merge time, which is not the same as closed.

## CatOS blog reskinned as a boxy 1990s mock browser

**Date**: 2026-08-27

**What was done**:

- **`Window` became a compound mock browser.** It was a single-purpose macOS
  panel taking `title`/`onClose`/`size`; it is now composed from
  `Window.TitleBar`, `Window.Tabs` + `Window.Tab` + `Window.NewTab`,
  `Window.AddressBar` and `Window.Body`. Square corners, a 2px border and a hard
  offset shadow; the traffic lights are squared off but stay left, in brand
  red/amber/green.
- **The blog's windows carry a real address.** `Window.AddressBar` shows the
  route the window is on, prefixed with the canonical public origin so the chrome
  reads the same on localhost as in production.
- **Posts open in tabs.** `sceneStore.openPostSlugs` holds the strip; the URL
  still names only the active tab. Selecting, closing and neighbour-focus are all
  navigations, so every tab stays a shareable link.
- **The window floats instead of dimming.** Dropping the modal backdrop is what
  lets a second tab be opened by clicking another desktop icon. The desktop icons
  moved into a left-hand rail so a centred window cannot cover them.
- **The desktop shell went 90s too** — opaque menu bar with a hard rule, a square
  bevelled dock tray, square icon tiles with an inverted-block selection.
- **New token families**: `--shadow-hard-1..3` (solid offset, no blur) and
  `--shadow-bevel-{out,in}` (raised/recessed edges), plus
  `--brand-control-{close,minimise,maximise,glyph}` so the traffic lights stopped
  being hardcoded macOS hexes.

**Key decisions**:

- **The URL names the active tab; the strip is session state.** Putting the whole
  strip in the URL would have made every shared link carry a stranger's open
  tabs. A deep link to `/blog/:slug` opens exactly that one tab.
- **The browsing session lasts as long as the visitor is inside CatOS.** Bare
  `/blog` shows the desktop with the strip intact — the desktop _is_ CatOS's
  new-tab page, which is what `Window.NewTab` navigates to. Leaving the laptop
  ends the session; the red light ends it explicitly.
- **One window size, whatever the page.** The old `size="md" | "page"` prop was
  dropped: a strip of tabs whose frame resized as you switched between them
  looked broken, and a real browser window does not resize to its content.
- **Controls with no handler render inert, not dead.** A traffic light without a
  handler is a `<span>`, not a `<button>`, and a nav arrow renders `disabled`, so
  nothing announces itself to a screen reader as a control that does nothing.
  Forward is therefore permanently disabled, and Back is enabled only when the
  router actually has history behind it — a Back that left the site would break
  the illusion harder than a greyed-out one.
- **Reload genuinely reloads.** The body is re-keyed on a counter, so the control
  remounts the page rather than being decoration.
- **Tab-strip lifecycle is tested where it lives.** `applyOverlayState` owns
  route→strip syncing (`routing/overlays.test.ts`); the overlay owns _navigating_
  (`LaptopScreenOverlay.test.tsx` asserts the resulting path). An earlier test
  that asserted store state after a click failed for the right reason — the
  component was never responsible for it.

**Deferred**:

- Buttons and badges _inside_ a window keep their rounded brand shape. Squaring
  them off would touch `Button`/`Badge`, which are used well outside the desktop
  context, so it wants its own decision.
- `Button` logs a Base UI `nativeButton` warning whenever it renders as a link
  (pre-existing, visible on `/blog/photobroom`).

**Why it mattered**: the blog already had faux-desktop chrome, but a window with
no address bar and no tabs read as a modal dialog rather than a place you were
browsing. Tabs are what make the URL-per-post structure legible.

## terraform.yml now runs on stacked PRs

**Date**: 2026-08-26

**What was done**:

- **Dropped `branches: [main]` from `terraform.yml`'s `pull_request` trigger.**
  That filter matches a PR's _base_, and this repo uses Graphite, where every PR
  in a stack is based on its parent branch. So stacked `infra/**` changes matched
  nothing and got no `fmt -check`, no `validate` and no plan preview — the first
  Terraform to see them was `apply -auto-approve` after the merge.
- **The plan comment now names what it was computed against.** On a stacked PR
  the plan is still against live infrastructure, so it includes the parent
  branches' unmerged changes; without a note that reads as an unexplained extra
  diff.

**Key decisions**:

- **Removed the filter rather than enumerating branch patterns.** A pattern list
  would need maintaining as branch naming changed, and the safety property does
  not come from the trigger anyway — it comes from the job gates.
- **Left the `push` trigger restricted to main.** Combined with the `apply` job's
  existing `github.event_name == 'push' && github.ref == 'refs/heads/main'`
  condition, a feature branch can still only reach `validate` and the read-only
  `plan`. Verified both gates, plus the `plan` job's same-repo condition that
  keeps fork PRs away from credentials, are untouched.

**Why it mattered**: found the practical way — the five PRs that scoped this
account's IAM policies (#66–#70) all skipped the workflow entirely, while #72,
a single PR based on main, got the full check. The stack that most needed a plan
preview was the one that could not get one.

## DNS cleanup — www now works, orphaned hosted zone removed

**Date**: 2026-08-26

**What was done**:

- **`www.jordanscamp.site` now resolves.** It previously returned NXDOMAIN: the
  only `www` record anywhere in the account was a stale CNAME to
  `TheDuckGoesQuark.github.io`, sitting in a hosted zone nothing delegated to.
  Added as a CNAME to the apex in `infra/route53.tf`, with Caddy issuing a 301 to
  the apex (`infra/Caddyfile` plus the bootstrap copy in
  `infra/templates/user_data.sh`).
- **Deleted the orphaned `jordanscamp.site` hosted zone `Z0321657TI5MQR8EEVXL`.**
  It was created automatically by Route53 Registrar at domain registration
  (22 Feb 2026) and still held the pre-Terraform GitHub Pages configuration —
  `A` to `185.199.108-111.153`, `AAAA` to `2606:50c0:800x::153`, and the `www`
  CNAME. Terraform later built its own zone for the same domain and the
  registrar's delegation was repointed, leaving this one stranded.

**Key decisions**:

- **Redirect www to the apex rather than serving both.** Two hostnames serving
  the same content gives every page two addresses, which splits search ranking
  and double-counts analytics. One line in `infra/Caddyfile` to reverse.
- **A CNAME for www, not a second A record**, so exactly one record decides where
  the domain points. If the apex ever stops being a bare IP, www follows.
- **Verified the orphan by delegation set, not by name or record count**, which
  is what made it safe: the registrar's four nameservers matched the live zone
  and none of the orphan's. Counting records would have picked the wrong one —
  the dead zone held 5 (GitHub Pages needs A + AAAA + www) against the live
  zone's 3.

**Deferred**:

- `terraform.yml` still does not run on stacked PRs — see TODO.md. Ironically the
  www change, being a single PR based on `main`, is the only infra change in this
  sequence that got a real CI plan.

## Account isolation — scope the Terraform apply role away from CatMap

**Date**: 2026-08-26

**What was done**:

- **Every `Resource = "*"` in the Terraform apply role narrowed** (`infra/iam.tf`,
  `aws_iam_role_policy.github_terraform_resources`). This role shares AWS account
  `477395207022` with an unrelated project, CatMap, whose VPC, subnet, security
  group, internet gateway and route table went live during this work. Before the
  change the role could terminate their instance, delete their network, rewrite
  `catmaps.me`, drop their log groups and delete their buckets.
- **Route53** — mutating actions (`ChangeResourceRecordSets`,
  `ChangeTagsForResource`) scoped to `aws_route53_zone.main.zone_id`; reads left
  on `"*"`; `route53:CreateHostedZone` deleted outright (unscopable, and no
  legitimate caller now the zone exists and is protected).
- **CloudWatch Logs** — scoped to the `jordanscamp-prod/*` prefix in both ARN
  forms (bare and `:*`-suffixed — AWS's canonical ARN uses the suffix,
  Terraform's state stores the bare form). `logs:DescribeLogGroups` split out
  and left on `"*"`; it is the enumeration call and supports no resource scope.
- **S3** — scoped to `arn:aws:s3:::jordanscamp-*` (+ `/*`), covering the deploy
  and state buckets while excluding `catmap-*`.
- **EC2/VPC** — one statement of eleven wildcards became seven statements:
  reads unconditioned; mutations on existing resources gated on
  `aws:ResourceTag/Project`; creates gated on `aws:RequestTag/Project`; network
  interfaces gated on `ec2:Vpc`; `RunInstances` split three ways for its
  sub-resource authorisation; and `ec2:CreateTags` gated on `ec2:CreateAction`.
- **Lifecycle guardrails** (`infra/ec2.tf`, `infra/route53.tf`) — `ami` pinned
  via `ignore_changes` so an unrelated `infra/**` merge stops replacing the web
  server, and `prevent_destroy` on the Elastic IP and the hosted zone.
- **Verified, not assumed.** Each step was applied from the laptop and checked
  with `aws iam simulate-principal-policy` before the next began: every negative
  check `implicitDeny`, every positive control `allowed`, site still 200.

**Key decisions**:

- **Tags are the boundary**, which is why `ec2:CreateTags` needed the
  `ec2:CreateAction` gate more urgently than any `Delete*` needed its tag
  condition — authority to tag arbitrary resources is authority to move the
  boundary.
- **`ec2:Vpc` rather than a tag for network interfaces.** The provider does not
  tag ENIs (verified: `eni-0a9713ee64a568cd2` has an empty tag set), so a
  `Project` condition would have denied this project's own instance rebuild.
- **EC2 actions enumerated, not wildcarded.** `ec2:*Instance*` spans both
  `RunInstances` (needs `aws:RequestTag`) and `TerminateInstances` (needs
  `aws:ResourceTag`), so no single condition can be correct for it.
- **S3 kept as a prefix rather than the two bucket ARNs.** The residual
  capability is confined to this project's own namespace, and enumerating would
  reintroduce the bootstrap deadlock on every future bucket.
- **AMI pin first**, so that every subsequent plan showed only the IAM diff.

**Deferred**:

- The orphaned `jordanscamp.site` hosted zone `Z0321657TI5MQR8EEVXL` (5 records
  against the live zone's 3). Irreversible, not in Terraform state, so left for
  a deliberate manual decision — see TODO.md.
- `RunInstances` grants are verified only by simulation. The role's trust policy
  admits GitHub OIDC only, so it cannot be assumed locally to test for real, and
  with the AMI pinned a normal apply never exercises those paths.
- The shared GitHub OIDC provider arrangement from #64 is unchanged by design.

## Brand design system, shareable blog routes, and scene accessibility

**Date**: 2026-07-06

**What was done**:

- **New `packages/design-system` (`@jordanscamp/ds`)** — the first `packages/*`, a Mantine 9 + Storybook 10 personal-brand DS. Twilight/dusk palette + amber accent (lantern `#ffb347`), Nunito (bundled via `@fontsource`), chunky radii, tactile shadows, springy micro-motion. Layered `primitives → components → patterns` with a strict authoring rubric in its `CLAUDE.md` (adapted from citrus2). Components: `BlogLayout`, `PostCard`, `Article`, `Tag`, `NightShiftToggle` (each with stories + tests). Consumed as TS source across the workspace.
- **Night shift** — `BrandProvider` takes a `warmth` (0–1) that drives `--brand-*` surface tokens via `color-mix` (pure CSS, continuous). campsite's `BrandRoot` feeds it `getNightFactor(progress)` (quantised to 0.02), so the blog warms with the in-app time-of-day and the time-arc scrubber warms it live. A "⚙ Blog" settings menu in CatOS toggles it (persisted `sessionStore.nightShiftEnabled`) plus light/dark.
- **Shareable routes** (react-router-dom 7) — `/` scene, `/home` blog, `/home/:slug` open post, `/notes`, `/music`. `RouteSync` is the single URL⇄store bridge (drives existing overlay flags + `sceneStore.activePostSlug`); pure mapping in `routing/paths.ts` (unit-tested). Deep links skip the welcome intro. The CatOS project window now renders through DS `Article`; project slugs are derived from titles (`data/slug.ts`, no denormalisation).
- **Accessibility** — single `data/interactables.ts` registry (kills the 3-way id duplication) feeding the keyboard toolbar; `aria-live` announcer ("Blog opened" …); "Skip to blog" link; informational-only objects (moka pot, Scarlett) no longer fire dead activations and carry `aria-description`; `role="dialog"`/`aria-modal`/`aria-label` on all three overlays; camera GSAP transitions honour `prefers-reduced-motion`.
- **Repo linting** — adopted oxlint + oxfmt + dependency-cruiser (translated from citrus2). Enforces DS domain-agnosticism (no `apps/**`/router/zustand/three imports), barrel-only DS consumption, Mantine-only-in-`primitives/` chokepoint, and a `style` escape-hatch ban (legacy campsite/photobroom exempt as tracked tech-debt). One-time repo format applied.

**Key decisions**:

- Night-shift warms our own `--brand-*` tokens only; warming Mantine's palette via `cssVariablesResolver` is left as a documented spike in the DS README.
- Extended `projects` with `slug`/`tags` (derived slug) rather than a parallel `posts.ts`, keeping titles the single source of truth.
- The `style`-ban is off for the two existing bespoke apps (a 3D art piece and a shadow-root overlay) — a guardrail for future feature code, not a legacy purge.

**Deferred**:

- Mantine `FocusTrap` + return-focus inside the bespoke overlays (they have their own keyboard handlers; roles/aria added, trap left for later).
- Warming the full Mantine palette with night-shift (spike).
- Migrating photobroom onto DS components (it took the React 19 + Mantine 9 bump only).

---

## Monorepo upgrade to React 19 + removal of Digital Twins

**Date**: 2026-07-06

**What was done**:

- **React 19 across the workspace.** campsite → React 19 + `@react-three/fiber` v9 (`@react-three/drei` v10, `@react-three/test-renderer` v9); the only code change needed was a `useRef(undefined)` initial-argument fix in `InteractiveObject.tsx` (React 19 tightened `useRef`). photobroom → React 19 + Mantine 9. React pinned to `~19.2` — the only range satisfying both Mantine 9 (`^19.2.0`) and R3F v9 (`>=19 <19.3`).
- **Deleted `apps/digitaltwins`** (a vibe-coded MVP) and its whole footprint: the Route53 A record + Caddy vhost + EC2 bootstrap block (`infra/{route53,main,ec2}.tf`, `Caddyfile`, `templates/user_data.sh`), the `build-digitaltwins` CI job + deploy/restore steps (`deploy.yml`, `infra-control.yml`), root `package.json` scripts, and docs. Removing the DNS record requires a `terraform apply`.

**Key decisions**:

- Chose Mantine 9 (React-19-only) over staying on Mantine 8, accepting the R3F v9 scene migration — which turned out near-trivial since campsite uses only standard R3F intrinsics (no `extend`/custom shaders/JSX augmentation).
- Prerequisite step for the new `packages/design-system` (`@jordanscamp/ds`) which requires React 19.

**Deferred**:

- Photobroom adopts the React 19 + Mantine 9 bump only; migrating it onto the shared DS _components_ is later.

---

## PhotoBroom — in-page overlay for sweeping Google Photos into the bin

**Date**: 2026-06-29

**What was done**:

Rebuilt PhotoBroom into a single in-page **overlay** on `photos.google.com` with **multi-select bulk delete**, replacing an earlier (closed-PR) two-tab design that paired a hosted web app with an extension bridge and deleted photos one at a time.

- **Overlay** (`apps/photobroom/src/overlay/`): React + framer-motion bundled to a single IIFE content script (`vite.overlay.config.ts` → `extensions/photobroom/overlay.js`), mounted in a shadow root so its styles are isolated from Google's page. Desktop keyboard-driven review (← bin / → keep / ↑ skip / ⌫ undo) over a near-fullscreen photo, with a prominent **Stop** that aborts any in-progress scan/select/delete. Reuses the existing `sweepSlice` state machine.
- **Page model** (`gphotos.ts`): all Google-Photos-specific selectors live in one documented `SELECTORS` block; reads the grid directly (native thumbnails), scrolls the real inner container (fixes "only the first date section loaded"), associates each cell's checkbox by its shared `aria-label`, then drives Google's native multi-select + bulk "Move to bin" + confirm. `inspectPage()` health check included.
- **Tests**: `gphotos.test.ts` imports the real module and asserts the selector contract against fixtures mirroring observed markup (caught a real cross-cell checkbox bug).
- **Landing page**: replaced the obsolete web-app flow with a Mantine install/usage/how-it-works page for `photobroom.jordanscamp.site`; removed orphaned `pages/`, `components/`, `hooks/`, `store/store.ts`, `api/`.
- Added PhotoBroom to the campsite projects list.

**Key decisions**:

- **In-page overlay, not iframe or two tabs.** Embedding Google Photos in an iframe is blocked by frame-ancestors headers and would log out under third-party-cookie partitioning; an overlay is first-party on the page, so login, native thumbnails, and same-origin DOM access all just work.
- **Drive Google's own multi-select** rather than per-photo navigation — one confirmation, much faster, stays on the results page.
- **Centralised selectors + contract tests** so a Google DOM change is a single-spot fix, caught early.
- **Not for the Chrome Web Store** — automating Google's UI breaches their ToS; it's a personal, load-unpacked tool. "Move to bin" is reversible for 60 days, keeping the blast radius small.

**Deferred**:

- Report which photos failed to bin (e.g. shared/partner items) instead of skipping silently.
- Surface the `inspectPage()` health check in the UI as a "layout may have changed" warning.
- Shrink/code-split the ~290KB overlay bundle.

---

## Cost cleanup — remove workout app & tear down the orphaned backend/RDS

**Date**: 2026-05-28

**What was done**:

- Removed the workout app entirely (`apps/workout/`, root workspace scripts, CI build/deploy steps, Caddy site, Route53 record). Decision: not moving forward with it — a spreadsheet is sufficient.
- Verified `campsite` and `digitaltwins` are pure static SPAs (no API calls, no auth). The Django backend's only consumer was the workout app, so after removal the entire backend stack was orphaned.
- Deleted the Django backend (`backend/`) outright — clean slate; a future backend will be built fresh, likely in a more type-safe language.
- Terraform teardown of orphaned, cost-bearing resources: RDS PostgreSQL (`rds.tf`), ECR (`ecr.tf`), Secrets Manager (`secrets.tf`), the RDS security group, the two RDS-only data subnets, the `web` CloudWatch log group, and the `api`/`workout` Route53 records. Trimmed the EC2/GitHub-Actions IAM policies (ECR + Secrets) and DB-related variables/outputs.
- Simplified `infra/templates/user_data.sh`, `infra/Caddyfile`, `deploy.yml`, `ci.yml`, and `infra-control.yml` to a static-only flow (Caddy serves three static sites; no Docker containers, migrations, or `:8000` health check). Docker + Compose remain installed on EC2 so a backend can be added later as a drop-in compose file.

**Key decisions**:

- **Cheapest DB is no DB.** The owner asked whether DynamoDB or a serverless DB would be cheaper than always-on RDS. Since nothing uses the database after the workout app is gone, the cost win is simply removing RDS — no migration needed. DynamoDB was also a poor fit for the relational Django/ORM/auth code that existed.
- **Keep EC2, not full serverless.** The owner values a simple on-ramp for a future DB-backed backend (and wants to experiment with type-safe languages). Keeping the EC2 box + Docker makes that trivial and keeps a future co-located Postgres free, rather than moving to S3/CloudFront + Lambda/DynamoDB.
- **Kept `photobroom`** as a deployed static stub to be built later.
- **No DB backups** configured (there is no DB).

**Deferred / follow-up**:

- Operational teardown of live AWS resources must follow the ordering notes (flip RDS `deletion_protection`/`skip_final_snapshot` before destroy; set ECR `force_delete` before removing the repo; the running EC2 box is updated via the deploy workflow, not by the `user_data` edit).
- When PhotoBroom needs a backend, follow "Adding a backend later" in `docs/architecture.md`.

---

## PhotoBroom — project scaffolding & multi-site wiring

**Date**: 2026-03-27

**What was done**:

Infrastructure:

- Added `photobroom.jordanscamp.site` subdomain: Route53 A record, Caddyfile site block, EC2 templatefile vars + CORS origins, user_data.sh (mkdir, S3 deploy, Caddyfile template)

Backend:

- Created `backend/apps/photobroom/` Django app (empty models, serializers, views, URLs, admin, migrations)
- Registered in `INSTALLED_APPS` and wired URLs at `/api/photobroom/`

Frontend:

- Created `apps/photobroom/` — React + Vite + TypeScript + Mantine (dark theme, orange accent)
- RTK Query setup with codegen config (filtering `/api/photobroom/` + `/api/auth/`)
- Redux store with auth slice + redux-persist (IndexedDB)
- AppShell with header, placeholder Home page, BrowserRouter
- Root workspace scripts: dev/build/test:photobroom

CI/CD:

- Added `build-photobroom` job in deploy.yml (parallel frontend build)
- Wired artifact download, S3 upload, and SSM extract in deploy job

Claude Code:

- Created `.claude/skills/new-site.md` — reusable skill documenting the full multi-site scaffold process (infra, backend, frontend, CI/CD, API codegen pattern)

**Key decisions**:

- Followed workout app pattern for API-backed setup (RTK Query + codegen + auth slice + IDB persist)
- Followed digitaltwins pattern for app shell (Mantine AppShell + simple header + BrowserRouter)
- No offline middleware yet (can be added when needed, unlike workout which needed it from day one)
- No Google OAuth provider wrapper (can be added later if needed)
- Skill file created first, then used as the guide for scaffolding

**Deferred**:

- Domain models, serializers, views (no features yet — just the skeleton)
- Photo upload/storage implementation
- OpenAPI schema generation (no endpoints to document yet)

---

## Workout tracker — guided workout UX: progress bar, postpone, dashboard charts

**Date**: 2026-03-20

**What was done**:

Frontend — Guided Workout (`GuidedWorkout.tsx`):

- **Progress bar**: workout-spanning progress indicator at top of guided flow showing percentage complete, current exercise label, and "Next: {exercise}" preview. Tracks warm-ups done + sets completed across all exercises.
- **Postpone button**: "Postpone — someone's using this" button on exercise screen. Swaps current exercise with the next one in the queue (not move-to-end). Only shown when there's a next exercise available. Resets set index on swap.

Frontend — Dashboard (`Dashboard.tsx`):

- Replaced boring stat cards with two progress charts using `@mantine/charts` (Recharts wrapper)
- **Session Volume bar chart**: orange bars showing total weight moved per session (reps x kg)
- **Weight Progression line chart**: multi-series line chart with per-exercise color coding, exercise selector dropdown, monotone curves
- `formatDate` helper for readable date labels (e.g. "20 Mar")
- Fallback message when no chart data yet

Backend — Dashboard charts endpoint (`views.py`):

- Added `GET /api/workout/dashboard/charts/` action on `DashboardView`
- `volume_per_session`: sum of (reps \* weight) for completed working sets per session
- `weight_per_exercise`: max working weight per exercise per completed session
- OpenAPI schema regenerated, RTK Query hooks regenerated (`useWorkoutDashboardChartsRetrieveQuery`)

Infrastructure:

- Added `@mantine/charts` and `recharts@2` dependencies
- Imported `@mantine/charts/styles.css` in `main.tsx`
- Fixed stale RTK Query cache bug: removed `baseApi.reducerPath` from redux-persist whitelist (API cache was persisted in IndexedDB, causing new endpoints to get stuck in pending state)

**Key decisions**:

- Postpone swaps with next exercise (not move-to-end) — simpler, predictable behavior per user preference
- Charts use `@mantine/charts` (Mantine's Recharts wrapper) for consistency with design system
- API cache no longer persisted in IndexedDB — it refetches on mount anyway, and stale persisted state was causing new query endpoints to break
- Volume chart uses bar chart (good for comparing days), weight progression uses line chart (good for seeing trends/plateaus)

**Deferred**:

- Dashboard date range filtering → Phase 4
- Better handling of multiple sessions on the same date → Phase 4

---

## Workout tracker — guided workout flow with tailored warm-ups

**Date**: 2026-03-20

**What was done**:

Backend:

- Added `MuscleGroup` model (9 groups: lats, biceps, chest, triceps, shoulders, forearms, core, legs, general)
- Added `WarmUpExercise` model with M2M to `MuscleGroup` and `duration_seconds` field
- Added `muscle_groups` M2M field to `Exercise` model
- Added `is_warmup` and `warmup_duration_seconds` fields to `SessionExercise`
- Created `warmups.py` — warm-up selection algorithm: collects muscle groups from today's exercises, queries `WarmUpExercise` records targeting those groups, annotates by coverage count, returns up to 5
- Updated session `generate` action to call `select_warmups()` and insert warm-up `SessionExercise` records before main exercises
- Updated `complete` action to filter `is_warmup=False` for progression evaluation
- Seeded 12 warm-up exercises (Arm Circles, Shoulder Dislocates, Dead Hang, Scapular Pull-ups, Cat-Cow Stretch, Inchworms, Downward Dog, Wrist Circles, Push-up Plus, Leg Swings, Hip Circles, Light Jogging) with muscle group mappings
- Assigned muscle groups to all existing seeded exercises
- Updated `copy_defaults_to_user()` to copy muscle group assignments

Frontend:

- **Audio module** (`audio/audioContext.ts`, `audio/sounds.ts`) — Web Audio API singleton with 4 sound functions: `playCountdownBeep` (880Hz), `playGoSound` (880→1320Hz ascending), `playTimerWarning` (660Hz gentle), `playCompleteSound` (two-tone chime)
- **Timer hook** (`hooks/useTimer.ts`) — countdown timer with audio integration, plays warning beep in last 5 seconds, returns `{ remaining, isActive, progress, start, pause, skip }`
- **GuidedWorkout page** (`pages/GuidedWorkout.tsx`) — full-screen overlay at `/workout/:id/guided` with state machine via `useReducer`:
  - **Countdown phase**: 3, 2, 1, GO! with audio beeps
  - **Warm-up phase**: exercise name + RingProgress timer, auto-transitions between warm-ups, skip button
  - **Exercise phase**: set-by-set logging with typed inputs (reps/weight, reps only, duration, distance), type selector, "Log Set" saves via PATCH
  - **Rest phase**: RingProgress countdown with "Skip Rest" button, shows next exercise name
  - **Complete phase**: summary with completion chime
- Dashboard `handleStartWorkout` now navigates to `/workout/:id/guided`
- "Exit to Log View" button on guided flow navigates to `/workout/:id` (unguided LogWorkout)
- Both modes available: guided interactive mode for live workouts, log mode for editing data after the fact

**Key decisions**:

- Muscle groups modelled as separate model (not enum) for extensibility
- Warm-up selection uses annotation/ordering rather than manual scoring — leverages Django ORM for efficient coverage-based ranking
- Guided workout uses `useReducer` for phase transitions + `useState` for exercise/set indices — reducer handles phase logic, local state handles mutable exercise data
- Audio uses Web Audio API oscillators (no audio files) for small bundle size and instant playback
- GuidedWorkout is a fixed-position overlay (zIndex 1000) that covers the AppShell, rather than a separate route layout

**Deferred**:

- Exercise demo videos/images in guided workout screens → Phase 4
- Warm-up duration customisation per user → Future

---

## Workout tracker — prefilled sets, warm-up sets within exercises, working weight onboarding

**Date**: 2026-03-20

**What was done**:

Backend:

- Added `warmup_sets_count` and `warmup_start_pct` fields to `LadderNode` — configures how many warm-up sets before working sets and the starting weight percentage
- Added `working_weight` (DecimalField) to `UserNodeProgress` — tracks the user's current working weight for weighted exercises
- Added `is_warmup_set` (BooleanField) to `ExerciseSet` — distinguishes warm-up sets from working sets
- Created `set_generation.py` — generates prefilled ExerciseSet records during session generation:
  - Extracts target reps/sets from ladder criteria
  - Generates warm-up sets with exponential weight curve (`start_pct * (end_pct/start_pct)^(i/(n-1))`) and descending rep curve (~1.8x working reps down to working reps)
  - Rounds weights to nearest 2.5kg with 2.5kg minimum
  - Generates working sets with prefilled reps and working weight
- Updated session `generate` action to call `generate_sets_for_exercise()` for each main exercise
- Updated `complete` action to track max weight from completed working sets and update `UserNodeProgress.working_weight`
- Updated progression engine to exclude warm-up sets (`is_warmup_set=False` filter)
- Fixed session update serializer to preserve `is_warmup` and `warmup_duration_seconds` on PATCH — matches existing exercises by (exercise_id, order) key instead of deleting and recreating
- Seed data: weighted exercises (Weighted Pull-ups, Weighted Chin-ups, Weighted Dips, Weighted Rows) get 2-3 warm-up sets; bodyweight exercises get 0

Frontend:

- GuidedWorkout: warm-up sets show "Warm-up Set N" badge (gray) instead of working set counter; type selector hidden for warm-up sets; `is_warmup_set` propagated in all save/complete payloads
- Ladder detail page: added NumberInput for "Working wt" (kg) on each node card, saves on blur via create/patch UserNodeProgress

**Key decisions**:

- Warm-up set configuration lives on LadderNode (not a separate model) — simple, per-exercise control
- Exponential weight curve (not linear) gives more time at lighter weights, matching standard gym warm-up practice
- Working weight is set during onboarding on ladder detail page, then auto-updated from max logged weight after session completion
- Session update serializer matches exercises by (exercise_id, order) composite key to preserve server-generated read-only fields

**Deferred**:

- Full onboarding flow for initial working weight → Future
- Warm-up set reps curve customisation → Future

---

## Digital Twins — interactive scheduling simulator

**Date**: 2026-03-19

**What was done**:

Simulation engine (`simulation.ts`):

- Pure headless tick-based simulation: 1 tick = 1 minute, 1440 ticks/day
- Task generation with per-queue configurable distributions (size 1-180min, priority 1-5) using Box-Muller transform
- Selector algorithms: round-robin and priority-based
- Executor policies: run-to-completion and time-boxed with configurable cycle length + per-project allocation
- Interruption system: configurable frequency (0-24/day) and cost distribution, cooldown lockout
- Context switching cost: configurable warmup ticks before productive work begins
- Efficiency parameter: ticks of real time per tick of work (1-4×)
- Progress tracking on tasks: preempted tasks retain progress when returned to queue
- Rich metrics snapshot per tick: queue depths, executor state, throughput, context switching, interruption status, oldest task age per queue
- `resampleQueues()` with z-score rescaling: proportionally adjusts task properties when distributions change, preserving relative positions

React visual layer:

- `SimulatorPanel.tsx` — full pipeline visualization: queues → allocation bar → selector → executor → done area
- `TaskChip` — sized by duration (44-120px), star ratings for priority, progress fill (left-to-right color fill as work completes)
- `ExecutorDisplay` — 4 states: working (chip filling up), context switching (orange warmup), interrupted (red countdown), idle
- `DoneArea` — stacked bar showing proportion by project, recently completed chips with glow animation
- `QueueRow` — queue box with overflow count, inline DistributionEditor controls for task size and priority
- `DistributionEditor` — interactive canvas bell curve, drag horizontal=mean, vertical=spread
- `AllocationBar` — vertical stacked bar with draggable segment boundaries for time-boxed allocation
- `useSimulation` hook — play/pause/step/reset/speed, refs for stable interval callbacks, live rescaling on distribution changes
- 7 preset configurations: Balanced day, Open office chaos, Deep work, Structured time-boxing, Fire-fighting day, One big project, Slow & steady

MetricsPanel — 6 canvas charts with axes, gridlines, legends:

- Queue depth per project
- Backlog vs completed (combined)
- Throughput rate (rolling 30-min average, tasks/hr)
- Executor utilisation (rolling % working, interrupted, switching)
- Actual vs target allocation (solid = actual, dashed = target per project)
- Oldest task age per queue

**Key decisions**:

- Pure JS simulation engine with no React dependency — can run headless for batch experiments
- Z-score rescaling instead of random resampling: changing a distribution slider proportionally rescales existing tasks rather than re-rolling random values
- Progress stored on SimTask (not just ExecutorSlot) so preempted tasks show partial fill in queues
- Canvas-based charts with niceStep axis algorithm, rolling averages for smooth throughput/utilisation curves
- CSS border task chips instead of rough.js SVG (rough.js unreliable at small sizes)
- Grid layout with conditional columns (allocation bar only in time-boxed mode)
- Metrics panel scrollable independently with minHeight per chart

**Deferred**:

- Scroll-driven animation engine for storytelling (Phase 1 in plan file)
- Wait time and per-project throughput breakdown charts
- Scrollytelling narrative content

---

## Digital Twins — project scaffolding & scrollytelling framework

**Date**: 2026-03-18

**What was done**:

- Created `apps/digitaltwins/` as a new frontend-only app (Vite + React + Mantine + Framer Motion)
- Set up app shell with BrowserRouter, Mantine dark theme, minimal header
- Built scrollytelling framework: `useScrollyProgress` hook (Intersection Observer), `ScrollySection`, `ScrollyLayout` components
- Wired up placeholder scheduling post with 7 narrative steps and sticky visualization slot
- Home page with blog post index card
- Added root workspace scripts (dev/build/test:digitaltwins)
- Infrastructure: Route53 DNS record, Caddyfile server block, EC2 user_data template, deploy workflow (build + artifact + SSM extract)
- Updated README with Digital Twins in the apps table

**Key decisions**:

- No external scrollytelling library — custom ~30-line hook using Intersection Observer with rootMargin midpoint trigger
- No PWA, Redux, or backend API — frontend-only, simpler than workout app
- Framer Motion for queue animations (to be built)
- Scrollytelling layout: sticky viz fills viewport, narrative sections scroll over with semi-transparent dark cards

**Deferred**:

- Simulation engine (algorithms, task generator, playback) — to be built hands-on
- Narrative content and wording — to be crafted manually
- Interactive controls and metrics panel

---

## Workout tracker — data model & offline sync design (Phase 1 foundation)

**Date**: 2026-03-16

**What was done**:

- Designed and implemented 11 Django models: WorkoutUser, Exercise, Ladder, LadderNode, Criterion, UserNodeProgress, WeeklyPlan, PlanSlot, WorkoutSession, SessionExercise, ExerciseSet
- Created DRF serializers with nested creates (sessions include exercises + sets, plans include slots)
- Created DRF viewsets for all models + Dashboard aggregate view
- Wired URLs under `/api/workout/`
- Added Google OAuth provider config (allauth + `SOCIALACCOUNT_PROVIDERS`)
- Set up Mantine + Storybook design system with dark theme (#0a0612 / #ffb347)
- Set up Redux + RTK Query with OpenAPI codegen pipeline (same pattern as catmaps)
- Set up redux-persist with IndexedDB adapter for offline data persistence
- Built nav shell with bottom navigation and updated routes
- Created `Makefile` for schema generation + API codegen
- Created `docs/planning/design-decisions.md` documenting architecture choices

**Key decisions** (see `docs/planning/design-decisions.md` for full rationale):

- React PWA over React Native
- Mantine + Storybook over Tailwind
- Redux/RTKQ + codegen over Zustand
- redux-persist + IndexedDB for offline (not Dexie)
- WorkoutUser model isolating workout domain from auth
- Typed JSON fields for flexible criteria and exercise set data
- Ladders named by highest exercise (no name field)
- No denormalization — compute from session logs

**Deferred**:

- Equipment/muscle group tracking on exercises → Backlog
- Strava integration → Backlog
- Default ladder seeding from Notion → Phase 3
- Offline mutation queue middleware → Phase 2
- Batch sync endpoint → Phase 2

---

## Workout tracker — core workout flow (Phase 2)

**Date**: 2026-03-17

**What was done**:

Backend:

- Added `POST /api/workout/sessions/generate/` — generates a workout session from the user's active weekly plan for a given date
- `resolve_ladder_exercise()` picks the current exercise from a ladder based on user progress (first unachieved node, or highest if all achieved)
- Enhanced Dashboard endpoint with `today_session` and `today_plan_exercises` fields
- Regenerated OpenAPI schema with new endpoints
- 5 new tests: generate session from plan, from ladder with progression, no plan, no exercises today, dashboard today plan

Frontend:

- **Weekly Plan editor** — full CRUD: create/edit plans with per-day exercise slots. Supports both direct exercise and ladder assignments. Full-screen modal editor with searchable dropdowns.
- **Dashboard** — shows today's planned exercises (from active weekly plan), quick-start workout button, generates session from plan or continues existing one. Stats grid (total sessions, completed, ladders, achievements).
- **Active Workout UI** — set-by-set logging with typed data inputs (reps+weight, reps only, duration, distance). Rest timer with countdown ring. Per-exercise progress bars. Save/Finish controls. Auto-copies last set values when adding new sets.
- **History page** — paginated session list with status badges, tap to review a session.
- **Offline mutation queue** — Redux middleware catches FETCH_ERROR rejections, queues failed mutations in IndexedDB, replays in order when back online. Online/offline detection with auto-replay.
- **Sync status bar** — shows offline badge and pending mutation count in the app shell.
- Updated router with `/workout/:id` route for session-specific workout view.
- Bottom nav active state now matches prefix routes (e.g. `/workout/123` highlights Workout tab).

**Key decisions**:

- Session generation is a POST action on the sessions viewset, not a separate endpoint
- Offline queue uses a separate IndexedDB store from redux-persist to avoid coupling
- Rest timer is per-set (starts automatically after logging a set), with skip option
- Exercise type (reps_weight, duration, etc.) is set per-exercise, not per-set — all sets in an exercise use the same type
- Dashboard response is cast from the codegen array type since inline_serializer produces a ViewSet list action

**Deferred**:

- Batch sync endpoint (`POST /api/workout/sync/`) → Phase 2 remaining
- Rest timer sounds/vibration → Phase 2 remaining
- End-to-end offline workflow testing → Phase 2 remaining

---

## Workout tracker — ladders & progression (Phase 3)

**Date**: 2026-03-17

**What was done**:

Backend:

- Created `progression.py` — criterion evaluation engine that checks session logs against ladder node criteria
  - `evaluate_criterion()` dispatches to type-specific checkers: `_check_min_reps_sets`, `_check_min_weight`, `_check_sustained_sessions`, `_check_min_duration`
  - `check_node_progress()` evaluates all criteria on a node, returns achievement status
  - `update_user_progress()` persists achievement to `UserNodeProgress` when all criteria met
- Added `GET /api/workout/ladder-nodes/{id}/check-progress/` — check progression status for a single node
- Added `GET /api/workout/ladders/{id}/progress/` — ladder-wide progress for all nodes
- Added `POST /api/workout/sessions/{id}/complete/` — completes session and auto-evaluates ladder progression for any ladder-linked exercises
- 12 new tests: criterion evaluation (min_reps_sets met/not met, min_weight, sustained_sessions met/not met, min_duration, node progress all met, update_user_progress marks achieved, incomplete session ignored), API tests (check-progress endpoint, ladder progress endpoint, complete session evaluates progression)

Frontend:

- **Ladder list page** — CRUD for ladders with create modal, delete button, click-to-detail navigation. Shows node count badges.
- **Ladder detail page** — tech tree visualization using @xyflow/react with:
  - Custom `LadderTreeNode` component: green (achieved), orange/pulsing (current level), grey (locked)
  - Automatic layout by level grouping with horizontal centering
  - Animated edges for current level, implicit level-based edges when no explicit prerequisites
  - Criteria progress display per node
- **Node management** — add/delete nodes with exercise picker, level selector, prerequisite selection
- **Criterion management** — add criteria to nodes with type-specific param forms (sets+reps, weight, sessions+reps, seconds)
- **Session completion** — "Finish" button now calls the `complete` endpoint which evaluates progression, instead of just patching status
- Added `/ladders/:id` route for ladder detail view
- Regenerated OpenAPI schema and RTKQ hooks with all new endpoints

**Key decisions**:

- Progression evaluation only counts sets from completed sessions (in_progress sessions are ignored)
- The `complete` endpoint both marks the session completed AND evaluates progression in one call, avoiding race conditions
- Tech tree uses implicit level-based edges when no explicit prerequisites are set, giving a sensible default visualization
- Criteria forms are type-specific: each criterion type has its own parameter inputs matching the JSON schema

**Deferred**:

- Advancement notifications (toast/badge when achieved) → Phase 4

---

## Workout tracker — default ladder seeding (Phase 3 completion)

**Date**: 2026-03-17

**What was done**:

Backend:

- Created `seed_default_ladders` management command that seeds all ladder/exercise/plan data from Jordan's Notion
  - 5 ladders: Pull (7 nodes), Chin-up (4 nodes), Push (7 nodes), Row (3 nodes), Carry (5 nodes)
  - 4 standalone exercises: Running, Yoga, Swimming, Parkrun 5k
  - Default weekly plan matching Notion schedule (Mon-Sun with pull/push/run/swim/yoga slots)
  - Each node has a criterion (min_reps_sets or min_duration) matching the Notion "Target" column
  - Prerequisites are linear within each ladder (level 1 → 2 → 3 etc.)
  - Uses a special `_workout_defaults` user to own canonical seed data
  - Idempotent (skips if data exists), supports `--clear` flag for re-seeding
- Extended `create_workout_user` signal to call `copy_defaults_to_user()` on new user creation
  - Copies all exercises, ladders (with nodes, criteria, prerequisites), and weekly plan
  - Each user gets independent copies they can freely edit/delete
- 9 new tests (40 total): seed creates correct counts, weekly plan, idempotency, clear+reseed, linear prerequisites, copy to user, independence check, no-seed noop, signal integration

**Key decisions**:

- Seed data owned by a dedicated inactive user (`_workout_defaults`), not tied to any real account
- Copy happens in the existing `post_save` signal — no separate signal needed
- Carry ladder uses `min_duration` criterion (target is time-based: 4x30m, 4x20m) while all others use `min_reps_sets`
- Weekly plan slots reference ladders where applicable (auto-pick current level) and standalone exercises for cardio/yoga
