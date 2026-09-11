# Completed Work

History of what's been built, key decisions made, and what was deferred along the way.

<!-- comment-guard: allow — this file's job is to narrate history. -->

---

## The laptop can be turned down without leaving it

**Date**: 2026-09-10

**What was done**:

- **One master level, in the session store.** `volume` (0–1, persisted,
  clamped in the setter) sits beside the existing on/off flags: they choose what
  plays, it chooses how loud all of it is.
- **Two families of source, two ways of answering to it.** The synthesised ones
  — `soundEffects`, `campfireSynth`, `useTypingSound` — now connect to
  `audio/masterVolume`'s `getMasterBus()` in place of `ac.destination`, a single
  gain node ramped over 20ms so a level change mid-note does not click. The
  sampled ones are Howls mixed in Howler's own context, so `audio/howlerBus`
  puts the same number on `Howler.volume()`, which multiplies every Howl on top
  of its own gain — a bed keeps its place in the day/night mix and a fade
  already in flight still lands scaled.
- **A tray volume in the CatOS menu bar**, left of the clock. The trigger is a
  Phosphor speaker whose waves follow the level and whose accessible name
  carries the reading; the panel holds a quiet speaker, the ramp, a loud
  speaker, and the percentage.
- **A volume row in the tent's gear panel**, above the toggles it governs.
- **`MenuBar.Panel` in the design system**, over a new `Popover` primitive. A
  `MenuBar.Menu` would have sat the slider in a `menu`, where a range is not a
  `menuitem` and the menu's roving focus eats its arrow keys.

**Key decisions**:

- **A level, not a fourth toggle.** The complaint was reaching the tent's gear
  cluster from behind a full-screen takeover, which a duplicate mute button
  would have answered too — but the beds, the music and the one-shots had three
  unrelated fixed gains and no way to trim any of them.
- **Silence is the mute.** The bottom of the fader's travel is 0, so there is no
  second control to explain and no remembered level to restore.
- **Each surface in its own idiom, one control underneath.** `VolumeSlider` is
  the wiring — a native range, for its arrow keys, Home/End and value
  announcement — and each surface skins it: the desktop gets the 90s tray ramp,
  a right-angled triangle filled as far as the level reaches, drawn as two
  polygons so the fill needs no clip path; the tent keeps its rounded
  lantern-amber slot. Neither draws a handle it does not need — the desktop's
  reading is the filled area, so a cap riding it would be a competing answer.
- **`Howler.volume()` rather than scaling each bed.** Multiplying the level into
  the day/night mix meant re-mixing on every drag, and the fade time that suits
  a dawn crossfade is a second — far too slow for a fader.
- **The end glyphs are decorative.** They say which way is louder; the state is
  the fill, the bar's glyph and the percentage.

**Deferred**:

- The video window's YouTube embed is outside both buses — see TODO.

---

## The tent stops drawing when the blog covers it

**Date**: 2026-09-10

**What was done**:

- **`<Canvas frameloop>` is now driven by the route.** `SceneRoot` passes
  `paused={covering}` to `TentScene`, which maps it to
  `frameloop={paused ? "never" : "always"}`. R3F cancels its `requestAnimationFrame`
  loop on `"never"` while leaving the WebGL context, compiled shaders and
  uploaded textures resident, so the mount latch keeps its whole point — closing
  the overlay is still instant — without paying for frames nobody can see.
- **The measurement, so the claim is not a guess.** Playwright against a
  `vite preview` of `dist`, with every WebGL draw entry point and
  `requestAnimationFrame` wrapped as counters. Before: the blog route ran at
  60fps and ~10,200 draw calls/sec, more than the tent's ~9,800, while five
  hit-tested points across the canvas all returned CatOS elements — every one of
  those pixels was behind an opaque wallpaper. After: 0fps and 0 draw calls
  under the blog, ~9,200 draw calls/sec once back in the tent, one WebGL context
  created for the whole journey, and 10ms from `history.back()` to the first
  frame drawn again.

**Key decisions**:

- **`"never"`, not `"demand"`.** The scene is genuinely continuously animated
  when visible — nine `useFrame` callbacks across the camera, lighting, campfire,
  rain and cat — so `"demand"` would need `invalidate()` every frame anyway and
  buys nothing over `"always"`.
- **Mounted and drawing are now separate ideas.** The latch that keeps the scene
  mounted across a covering route was deliberate and stays; the bug was that
  `showTent` never consulted `covering`, so there was no way to express
  "resident but idle".
- **Route-driven, not visibility-driven.** `isCoveringRoute` already encodes
  which overlays are opaque, so the pause reuses it rather than introducing a
  second notion of what covers the tent. `/music` is not covering and keeps
  drawing, which is correct — the tent shows through it.
- **The clock reset is a non-issue here.** `setFrameloop` zeroes
  `clock.elapsedTime` and restarts it, so resuming hands `useFrame` a jumped
  delta. Nothing in the scene reads absolute clock time (`grep` for
  `elapsedTime` finds no hits outside R3F itself), and a one-frame delta jump on
  return was accepted rather than smoothed.

**Deferred**:

- A cold load to `/blog` was checked and does _not_ render: no WebGL context, no
  frames, no draw calls. It does still pull 4.1MB of GLB models plus the 752KB
  Draco decoder on idle for a page that shows none of them, with no main-thread
  cost (Draco decodes in a worker, `totalBlockedMs: 0`). Logged under
  "Campsite — what the blog still pays for" rather than fixed here.

## MouseMail, and the text inputs it is built from

**Date**: 2026-09-10

**What was done**:

- **The contact footer invites a reply.** Beside the links: "Feedback? Spotted a
  bug? Just want to tell me this put a smile on your face? Let me know here."
  Both `here` and the email address open MouseMail. The invitation is not a
  fourth entry in `cv.links` — that array is the one source shared with the CV's
  header row and the `schema.org/Person` in the page head, and a non-link entry
  would corrupt all three. `contactEmail.ts` reads the address off it instead, so
  the footer, MouseMail and `personOf` cannot disagree.
- **MouseMail is a CatOS window, not a dialog.** `WINDOW_MAIL`, an id that is not
  a path, beside `WINDOW_BROWSER`. It renders in the same stack as CatNav with an
  envelope launcher on the desktop rail, and `openWindows` now carries a window
  that shows no page.
- **`TextField` and `TextArea` in the design system**, on a new `Field` primitive
  shim so Base UI supplies the label association and the `aria-describedby` /
  `aria-invalid` wiring. Grouped under `components/form/` with one shared CSS
  module, mirroring how `desktop/` groups its chrome.
- **An `envelope` in the drawn glyph set**, because `DesktopIcon` draws only from
  that closed set.
- **The Modal unmount report closed as not reproducible** — its own entry above.

**Key decisions**:

- **A window rather than a dialog, because the site is boxy.** A rounded card
  floating over a faux desktop fights the aesthetic. As a window it stacks with
  CatNav, leaves the desktop clickable and closes from the red light. The cost is
  that Escape and focus-return become the desktop's job rather than Base UI's,
  which is correct for a window and something the desktop already does.
- **MouseMail has no URL, deliberately.** `blogUrls` prerenders every route, and
  a prerendered form is a form that cannot send. Session state, like the tab
  strip.
- **The trigger is a `mailto:` anchor that JS takes the click off**, not a
  button. The href is what makes the prerendered pages work with no script, and
  it keeps right-click-copy-address; a modified click is left to the browser.
  `Link render={<button/>}` was the alternative and is not viable —
  `Link.module.css` sets no background or padding reset, so it draws native
  button chrome in brand colours, and an app cannot restyle it.
- **`label` is a required string on both inputs**, so an unlabelled field is not
  expressible; `error` is a caller-supplied string, so the DS owns the ARIA an
  error implies but holds no validation rules.
- **`md`, not `sm`, for the window.** `sm` caps at 420x320, which the message
  field, the address field and its hint do not fit inside without the body
  scrolling before anything is typed.
- **The footer wraps rather than answering a breakpoint.** It sits inside a
  resizable CatOS window, so how much room it has says nothing about the width of
  the screen.

**Deferred**:

- The endpoint. Every send currently fails to the `mailto:`, which is the
  designed failure path rather than a stub — the client is the real one.
- No CatOS menu-bar entry for MouseMail; the desktop icon and the footer are the
  only ways in.
- The homepage's "let me know" still jumps to the footer rather than opening
  MouseMail, so reaching it from the landing page is two hops.
- No `danger` tone on `Text`, which is what would let the form's label, hint and
  error all compose through it instead of restating `--text-*` in CSS.
- Border and focus-ring contrast, which no token currently satisfies — left in
  TODO.md as a token decision rather than patched behind a local hex.

---

## The contact banner shimmers when you reach it

**Date**: 2026-09-10

**What was done**:

- **The greeting and the banner share one rainbow.**
  `blog/rainbow.module.css` holds the six themed stops, the two spark images,
  and the travelling window they ride in — everything the effect is except the
  clip. The masthead composes `palette sparks play` and clips its bar to the
  greeting's glyphs; the contact banner composes `palette sheen sparks` and lays
  the same bar over the whole panel. One `@keyframes`, one set of stops, one
  band geometry, so tuning either one cannot drift them apart. Verified against
  the built CSS that no masthead declaration changed value in the move.
- **`.play` is why the classes are inert.** Every animation is declared `paused`
  and started by a separate class. Without that the effect could only ever fire
  on load, which is right for a greeting and wrong for a banner nobody has
  scrolled to yet.
- **The banner shimmers on every arrival, not just the first.** `useArrivals`
  counts the times its element has been held in view for 500ms uninterrupted
  having been away since the last, and `useAnchorFollows` adds the other way in:
  a click on any link to the banner's own hash, delegated from the document
  because `hashchange` never reports the same hash twice. The wait is what
  separates arriving from passing through — `Window.Body` scrolls smoothly, so
  the target is in view for most of the journey to it — and it is also why a
  followed link cannot count twice, since the click and the scroll answering it
  restart one timer. A `rootMargin` of `-10%` at the bottom stops a banner whose
  top edge has only just appeared from counting as arrived.
- **The shimmer is an element, not more pseudo-elements on the banner.** A CSS
  animation starts over only when its element does, so `ContactFooter` mounts one
  overlay per arrival, keyed by the count. Nothing imperative, and the greeting's
  own `.sweep` was already a real element for the same reason.

**Key decisions**:

- **A sheen over the panel, not a text sweep on the heading.** The greeting's
  bar is clipped to glyphs, which can only light up text; a banner is a
  portrait, a heading and a link list. So the footer's bar travels over the
  whole surface instead, ending transparent at both ends so it passes rather
  than arrives.
- **Over the content, not under it.** Under it the bar would vanish behind the
  portrait and reappear the other side. Over it at `0.3` opacity the wash moves
  ink and its background by roughly the same amount, so text stays comfortably
  readable while the bar is on it — and the bar crosses the photo, which is what
  a glare does.
- **`:target` is gone.** It marked the banner with an accent top border and a
  background flash, and because the hash stays in the URL the orange border
  stayed with it — a permanent mark left by having once followed a link. The
  shimmer says the same thing and then stops saying it.
- **Reduced motion and forced colours drop the whole thing.** Unlike
  "brighter.", which is colour rather than motion and stays, none of the
  banner's shimmer is load-bearing, so both branches take all of it.

**Deferred**:

- The band is a fixed fraction of whatever block it crosses, so on a banner far
  wider than the greeting it reads as a broad wash rather than a narrow bar.
  Narrowing it per-site means parameterising the gradient's stops, which is not
  worth the machinery for two callers.

---

## A closing Modal does unmount, and two instruments that say otherwise

**Date**: 2026-09-10

**What was done**: Probed the reported stuck `[role=dialog]` before building a
contact modal on top of `Modal`. It does not reproduce against
`@base-ui/react` 1.6 on either variant, on any exit route: Escape, the close
button, CatOS's "Touch grass" control, a route-driven `open` flip, five
consecutive open/close cycles, or a close issued inside the 150ms opening
transition. Each leaves nothing behind.

The reported node carried `data-closed` and `data-ending-style` — Base UI
waiting on an exit transition that never reports finishing. `centered` and
`bare` were never strong suspects: both transition `transform` alongside
`opacity`, so the transform change fires a `transitionend` even when opacity is
already settled. `takeover` animates opacity alone, making it the plausible
one, but the `pointer-events` guard in `Modal.module.css` gives that wait
somewhere to land.

**Key decisions**:

- **Headless Chromium is the only instrument that can see this class of bug.**
  Two cheaper ones give a confident wrong answer. jsdom stubs CSS modules, so
  no transition exists for Base UI to wait on and the popup always unmounts —
  `Modal.test.tsx` asserts exactly that and passes regardless of the truth. The
  browser pane is worse than blind: it reports `document.hidden`,
  `requestAnimationFrame` never fires, and the popup then sticks in
  `data-starting-style` at opacity 0 with Escape registering no close at all.
  That signature reads as the bug and is not it — stuck _opening_, not closing.
  `tabs_select` does not clear it; the pane stays hidden.
- **`/blog` drives CatOS without WebGL.** It is a covering route, so a cold
  load there skips the 3D scene chunk entirely — the takeover can be exercised
  headlessly without the tent rendering.
- **No fix committed.** There is nothing to fix in the tree as it stands, and a
  speculative change to transition handling would be a change with no failing
  case to justify it.

**Deferred**: no regression test. Pinning this behaviour needs a real browser in
CI, which the design system's `vitest` + jsdom setup cannot provide; the
campsite's Playwright is the closest existing tool but lives in the wrong
package. Worth revisiting if the design system grows other transition-dependent
behaviour that wants covering, rather than standing up a browser runner for one
assertion.

---

## The invitation to get in touch has somewhere to go

**Date**: 2026-09-10

**What was done**:

- **The homepage's offer is shorter and pressable.** "let me know via the
  medium of your liking*" is now "let me know*", with "let me know" an anchor
  to the contact banner. The footnote marker and its note are unchanged.
- **Every page CatNav renders ends in a contact banner.** One row — a
  bevel-framed portrait at the mascot's 128px, then "Let's talk" at the
  greeting's own `title-1` over a stacked list of links, each with its glyph —
  so the CV's own header row,
  the `schema.org/Person` in the page head and this strip cannot disagree about
  how to reach me. Appended in `BlogPageView`, which already switches on the
  page kind, rather than by each page.
- **An icon set, at last: Phosphor.** The design system had seventeen
  hand-drawn stroked paths and no library, so a GitHub glyph had to be invented
  — and a hand-drawn git-branch standing in for GitHub read as homemade.
  Mantine's icons guide names Phosphor as its own recommendation, and
  `@phosphor-icons/react` ships the brand marks: `Envelope`, `LinkedinLogo`,
  `GithubLogo`, at `weight="bold"` to hold up against the display face. Added
  to the design system and re-exported from `@jordanscamp/ds/icons`, its own
  entry point so nine thousand names stay out of the barrel. Tree-shaking
  holds: the main chunk grew about 16KB for three glyphs.
- **`cv.links` carries the address and the LinkedIn profile.** The email's
  label is the address itself, not the word "Email". `personOf` sorts them
  without change: the `mailto:` becomes the `schema.org` `email` and the
  profile joins `sameAs`, and both reach `/cv.pdf`, where a link is useless but
  a printed address is not.
- **`Window.Body` publishes its page inset.** `--window-page-inset-block` and
  `--window-page-inset-inline` name the padding the body applies, so a child
  that has to reach the frame's edges can cancel it without restating the
  value. `index.html`'s `#reader` publishes the same two names, so the
  prerendered document behaves identically.
- **`Window.Body` takes a `flush` page.** The frame keeps a transparent
  16px cell above the grow box so the scrollbar ends one cell early; a page
  whose last element is its own full-bleed foot needs that cell filled, not
  reserved, or the banner stops short of the frame. `flush` drops it, and the
  scrollbar runs to the corner — where it also ends in a window with a status
  bar. Only CatNav passes it.
- **Arriving is gentle and marked.** `Window.Body` scrolls smoothly for anyone
  who has not asked for less motion, and `.contact:target` keeps an accent top
  border and, again only without a motion preference, flashes the banner once
  before settling.
- **Every hand-written id is namespaced per render target.** `useDocumentId`
  prefixes the prerendered half's ids with `reader-`.
- **`offsiteLinkProps` is shared.** The `mailto:` gets no `target`/`rel`;
  everything else opens in a new tab. `CvPage` had this inline and now calls it.
- **The banner is hidden on paper, and `build:pdf` proves it.** The CV's header
  already prints its links, so a second copy would waste an inch of an A4. The
  render script asserts `CONTACT_HEADING` — exported from the component through
  the SSR entry the script already imports from — is absent from the PDF text.
- **Two new structural tests.** `semantics.test.ts` asserts every
  `a[href^="#"]` in the prerendered HTML resolves to an `id` on the same page,
  and that each such href is `reader-`-prefixed. Both were verified by breaking
  the thing they assert and watching them fail.

**Key decisions**:

- **The anchor was dead before the id fix, and would have shipped that way.**
  Booting the app does not remove the prerendered `#reader` — printing renders
  it, so `index.html` only hides it — which leaves both copies of a page in the
  document and two elements answering to `contact`. The browser resolves a bare
  `#contact` to the first, the hidden one, so the link scrolled nowhere. It
  reproduced only against a built `dist`, never against the dev server, which
  has no reader block. The pre-existing footnote marker had the same dead
  anchor and is fixed by the same change.
- **The prerendered half takes the prefix, not the live half.** A URL already
  shared as `…/blog/index.html#contact` still lands on the app's banner.
- **A full-bleed banner rather than a measured column.** The first attempt
  capped the footer at the 640px measure a post and the CV read at, which meant
  matching a width that differs per page: on the homepage the reading column is
  whatever the feed beside it leaves, so the footer's rule sat 116px shorter
  than the section rule above it and read as a bug, and under the CV's centred
  column it sat flush left. A banner in the feed panel's sunken green sidesteps
  the question — it belongs to the frame, not to the article, so no page's
  measure has to be answered.
- **The banner's content sits at the frame's left inset on every page,** rather
  than tracking the centred column a post and the CV use. It reads as the
  frame's floor, and it needs no per-page rule.
- **`:target` rather than a class and a timer.** No script, and a deep link
  into a prerendered page marks itself. A repeat click still re-scrolls — a
  same-fragment navigation runs the scroll again — but does not re-flash, since
  the element is already the target. The accent border is what stays.

**Deferred**:

- **The seventeen hand-drawn glyphs are still in use** across CatOS (`house`,
  `cat`, `grass`, `cassette`, `door-arrow`, `trash`, the chevrons). Both sets
  are current. Moving the generic ones onto Phosphor is a visual change to the
  whole desktop and wants its own review.
- **`LandingReader` hand-lists GitHub** in its "Read" section and does not read
  `cv.links`, so the no-JavaScript landing page will not pick up a new profile.
- **React's `useId` ids are still duplicated across the two renders.**
  `FeedPanel`'s `aria-labelledby` is the one in play; both copies carry the same
  heading text, so there is no user-visible effect, but it is the same latent
  defect `useDocumentId` fixes for hand-written ids.

---

## The blog's greeting arrives on a rainbow

**Date**: 2026-09-10

**What was done**:

- **The homepage masthead title animates in.** It rises 6px into place over
  0.45s, then a band of rainbow glides left-to-right across it once and leaves
  "brighter." coloured behind it. Specks of four-pointed sparkle ride the band.
- **The greeting is rendered twice, stacked.** The `h1` is the finished state
  and never animates: ink, with "brighter." already rainbow. Over it sits
  `.sweep` — the same words, same type, `inset: 0`, `aria-hidden`, not a
  heading — whose gradient runs transparent → rainbow → ink and travels. Ahead
  of the bar the copy is opaque ink and the heading beneath is not seen; behind
  it the copy is transparent and the heading shows through, rainbow word and
  all.
- **The rainbow is one sweep across the block, not one per line.** The gradient
  is painted on `.sweep` and clipped to the glyphs inside it with
  `background-clip: text`. The painting area is the whole block, so a title
  that wraps onto two or three lines gets a single slanted bar crossing all of
  them at the same offset, rather than the bar restarting per line.
- **The sparkles are masked by the same travelling window.** `::after` on the
  wrapper carries seven star images spread across the block, masked by a
  gradient with the identical `300%` size and `100% → 0` position animation, so
  a speck can only light up while the bar is actually over it.
- **The intro's thesis got its own weight, and the invitation its own
  paragraph.** "This website is trying to do both." is `<strong>` and now ends
  the opening paragraph; the offer to get in touch, and the footnote marker
  that hangs off it, start a new one.

**Key decisions**:

- **The reveal is the bar, not a second animation.** Earlier attempts gave
  "brighter." its own animation — a timed fade, then a one-way wipe in the
  word's own coordinate space — and both had to guess where in the block the
  word sat. That moves with every rewrap, so the reveal ran late on a wide
  window and early on a narrow one, and the timed version let the word fall
  back to ink between the bar leaving and the fade starting. Stacking two
  copies makes the ink/transparent boundary of the sweep's own gradient the
  thing that uncovers the word: correct at every width, and nothing to retime.
- **The real heading is the one underneath.** It is in flow, so it sets the
  height the overlay is `inset: 0` against; it is the only `h1`, so the outline
  and the accessible name are unchanged; and it is what selection and find-in
  page reach, the copy being `user-select: none` and `pointer-events: none`.
- **The words are written once.** `GREETING_LEAD` / `GREETING_TAIL` in
  `HomePage.tsx`, because two copies that disagree stop lining up.
- **The stops are themed and contrast-bounded.** Each is fully saturated, then
  taken only as dark (light mode) or as light (dark mode) as it must be to
  clear 3:1 against its own surface — the ratio a 34px heading is held to.
  Spending lightness rather than saturation is what keeps them vivid. Yellow is
  the stop that pays for it, since a yellow that reads on paper is gold.
- **Saturated sparkles with a white core.** A pale cream speck is what a
  sparkle wants to be and is invisible on ivory at twelve pixels wide. The
  outer star is amber or violet so it reads on the page; the white core is what
  reads when it lands on a glyph.
- **Reduced motion and forced colours both just drop the copy.** With the
  overlay gone what is left is the finished heading, which is the right answer
  for a reader who does not want motion. Forced colours additionally takes the
  word's rainbow, which it must: that mode strips the background the fill is
  showing through while leaving `-webkit-text-fill-color` transparent.

**Deferred**:

- The sweep runs once, on mount. Replaying it on hover would need the animation
  restarted, which CSS alone does not do cleanly.
- The stacked copies paint the same glyphs twice while the overlay is opaque,
  so the ink text carries a little extra edge weight for the second or so
  before the bar passes. Not visible at this size; worth knowing if the
  treatment is ever reused at body sizes.
- The sparkle images are fixed amber and violet in both themes. On paper they
  sit around 2:1, which is thin for a decoration; theming them would mean four
  data URIs rather than two.
- Roughly the first and last fifth of the 1.8s is the bar travelling off-screen.
  Harmless, since the title just sits still, but the timing could be tightened
  by narrowing the gradient's dead zones.

---

## Narrow viewports keep only the gear in the scene controls

**Date**: 2026-09-09

**What was done**: The tab bar is centred and the scene controls are pinned
right, so on a phone the two ran into each other — measured at 375px, the pill
ended at x=246 and the three-button cluster started at x=239, a 7px collision.
Below 640px the two popover duplicates (visual effects, ambience) now hide and
the gear stands alone; the same measurement gives 81px of clearance.

- **The duplicates were the ones to drop.** They exist only because they are
  what people reach for mid-visit; the popover behind the gear still carries
  ambience, sound effects and visual effects, so nothing becomes unreachable.
- **CSS, not `matchMedia`.** `display: none` under a media query takes the
  buttons out of the accessibility tree too, and avoids a first-paint flash of
  the wrong cluster. The rule is declared after `.button` so it wins the
  cascade — both are single-class specificity.
- **`ControlButton` grew an optional `className`.** The alternative, a
  `hideOnNarrow` boolean, would have put a layout concern in the component's
  API for one caller pair.
- **640px picked to match the app's existing breakpoint** in
  `PhotoBroomPage.module.css` — the repo has no breakpoint tokens. At 641px the
  three-button cluster returns with 126px of clearance, so nothing snaps back
  into a collision at the boundary.

**Deferred**: no test. jsdom does not evaluate CSS-module media queries, so the
only assertion available is that the buttons carry a hashed class name — a test
of the implementation, not the behaviour. The existing SceneControls suite still
covers both buttons and every popover row.

---

## The intro says what I'm for, and the way out is a control you can press

**Date**: 2026-09-09

**What was done**:

- **The homepage intro is rewritten.** It led with "I build software for a
  living and make odd little things for the fun of it" and an explanation of the
  computer-inside-a-campsite joke. It now opens on what I'm for — making
  people's lives easier, and solving complex problems with easy-to-follow
  systems — and invites contact. The writing paragraph loses the specific
  examples and names the range instead: music, physics, Flash game mechanics.
- **The invitation carries a footnote.** An asterisk after "the medium of your
  liking" links to a small, muted aside below the prose offering the campsite as
  the other option. `<sup>` is hand-positioned rather than left on
  `vertical-align: super`, which grows the line box and would loosen the one
  line holding the marker against the rest of the paragraph.
- **The aside offers a control, not an instruction.** `EscapeHatch` draws the
  way out as whichever control the reader actually has — a keycap where there is
  a keyboard, the menu bar's own `→ Touch grass` button where there is not —
  and both are the same link to the tent, so the aside is pressable rather than
  a note about a key. The keycap is a `.key` chip: mono, sunken, thick bottom
  border, `line-height: 1` so it does not stretch the line it sits in.
- **The bin window lost its status bar.** "Items in the Bin are kept for 60
  days" was a second joke stacked on the one already in the body, which is the
  funnier of the two and the one that reads as the bin's own voice.

**Key decisions**:

- **The swap turns on `pointer`, not on a width.** A width query gets this
  wrong in the direction that matters: CatNav is resizable, so a narrow window
  on a laptop still has an Esc key and would have been told to tap a button.
  `(pointer: coarse)` asks whether there is a keyboard, which is the actual
  question.
- **CSS rather than `isMobile`.** `isMobile` is a module-load constant, and
  every blog URL is prerendered — `typeof window` is `undefined` there, so a JS
  branch would bake the keyboard copy into the static HTML and flip it on
  hydration for phone visitors. Shipping both branches and letting the device
  choose has no mismatch to reconcile.
- **The verb moves with the control.** "Hit Esc a few times" is true of layered
  Escape, which closes the front window before it leaves; a tap on Touch grass
  does it once. The swapped span carries its own verb so neither reading lies,
  and the rest of the sentence stays single-sourced.
- **A link, not a button.** It is a real navigation to `/` with a URL, and its
  accessible name stays the visible text so it satisfies label-in-name; the
  menu bar's own `title` explains the destination.
- **The footnote marker is named.** A link whose entire text is `*` fills a
  screen reader's link list with punctuation, so it carries
  `aria-label="Footnote"` and the aside's matching `*` is `aria-hidden` — the
  same treatment `MenuBar` gives its shortcut hints. No back-link from the
  aside: with one footnote two lines under its marker, it would be clutter.

**Deferred**: the `.key` chip lives in the blog's CSS module. If a second use
turns up it belongs in `@jordanscamp/ds`, with `MenuBar.Item`'s shortcut hint
rendering it too, so there is one keycap look rather than two. The aside's link
also skips the `playSoftClick()` the menu bar's button plays, on the grounds
that it is prose rather than chrome.

---

## A window's scrollbar, drawn in the frame's own hard edges

**Date**: 2026-09-09

**What was done**: A `Window`'s page drew whatever the OS draws — a rounded grey
overlay bar inside a 2px-bordered frame that squares off every radius its
children bring. `scrollbars.module.css` gained a second opt-in class beside
`hidden`, and `Window.Body` composes it.

- **`classic` is the new class**: a 2px-dithered sunken track, a bevelled thumb
  and a clickable arrow end cap at each end, all in `--brand-subtle` with
  `--shadow-bevel-out` — the material the title bar, tab strip, toolbar and
  status bar already share. Opt-in per scroller, like `hidden`: `Window.Body`
  takes it, and the modal, the plain-text surface and PhotoBroom's horizontal
  rail are left for a deliberate decision.
- **The arrows are gradients, not glyphs or SVG.** `content` does not render
  inside a scrollbar pseudo-element, and a data-URI SVG cannot read a custom
  property — so each arrow is a 90° `conic-gradient` wedge in `--brand-text`,
  which re-themes with the rest.
- **The grow box became the foot of the bar, but only beside one.** It is 16px
  at the frame's bottom-right and so was the bar's bottom end cap, which put
  the sizing hatch across the arrow. A transparent `border-bottom` shortens the
  bar by one cell — a scrollbar is laid out across the padding box, so a border
  is what moves its end — and the box becomes a bevelled cube in the buttons'
  material, so the column reads ▲ / thumb / track / ▼ / grip. Same fix as
  publicobject.com's Swing `ScrollPaneLayout`, which reserves `CORNER_HEIGHT`
  at the foot of the vertical bar for the same reason.
- **The plain-text window scrolls as one document.** A `textarea` is its own
  scroll container, so the file drew the platform's bar inside the frame while
  the window's own bar sat idle. `field-sizing: content` sizes the control to
  its text instead — Baseline as of June 2026 — with `min-height: 100%` keeping
  a short file filling the window, so growing the file is what brings the
  window's bar and the grip cube in. `overflow-y` and the composed `classic`
  class stay for a browser that cannot size a field to its content, where the
  textarea keeps its own bar in the brand's palette rather than the OS grey.
- **Without a bar it stays bare hatching**, which is what it always was. A cube
  beside a page that is not scrolling is a cell with nothing above it — the
  image viewer showed this plainly. Both the reserved cell and the cube hang
  off `.body[data-scrolls]:has(+ .growBox)`: all three conditions have to hold
  — a bar to shorten, a corner adjacent to it, and a frame that resizes — or
  the corner is a gap for nothing.

**Key decisions**:

- **Two mechanisms, one gated behind the other.** Blink discards every
  `::-webkit-scrollbar` rule if any standard `scrollbar-*` property is set on
  the element, so the two are mutually exclusive rather than additive. The
  Firefox colours sit inside `@supports not selector(::-webkit-scrollbar)`,
  which tests for the pseudo-element rather than naming an engine. Getting this
  wrong is silent: the bar renders as the browser's own overlay.
- **Buttons are opted into, not carved out.** WebKit lays out four button slots
  per axis and starts all four at `display: none`, so a slot exists only once
  named. Naming the two outer ones (`:vertical:start:decrement`,
  `:vertical:end:increment`) leaves the inner pair off with no rule to switch it
  back off. Confirmed in the running app by colouring all four slots.
- **The page answers for its own overflow.** Whether a bar is showing is not a
  question CSS can ask, so `Window.Body` measures it and writes `data-scrolls`
  on itself — a sibling selector then reaches it, rather than threading a prop
  or the frame context through. It measures against the live box, so the answer
  stays true of the render it describes even though the reserved corner is part
  of that box: both states are fixed points, and each reports the bar Chrome is
  actually drawing.

**Deferred**:

- Firefox draws a flat bar in the same palette — it has only `scrollbar-color`,
  so no bevel, no dither, no end caps. The `Scrolling` story says to check both.
- The end caps' click-to-scroll is Blink's own behaviour and was not exercised:
  the preview pane would not accept clicks in this session.
- Re-measuring took a rendering page to confirm: a backgrounded one runs no
  animation frames, so `ResizeObserver` never delivers there and the attribute
  looks stuck. Confirmed once the pane was foregrounded — the answer flips as a
  frame settles, and as the text window's file grows past its page.
- The modal and PhotoBroom's horizontal rail still draw the platform bar.

---

## The way back to the campsite, from inside the blog

**Date**: 2026-09-09

**What was done**:

- **The exit names a place, not a mechanic.** The cat menu's "Shut down" became
  "Touch grass". Both label a departure, but grass is somewhere to arrive, and
  the joke lands literally — there is grass and a picnic area outside the tent.
- **The way out is drawn on the menu bar.** `MenuBar.Action` is a new subpart —
  a bar entry that acts instead of dropping a menu, wearing the trigger's bare
  styling — carrying a new `door-arrow` glyph and the same label, in the bar's
  right slot beside the clock. The slot became a flex row to hold both. A menu
  item is only found by someone who already suspects it is there, and the glyph
  is the half that reaches a stranger: a shape showing a way out of somewhere
  says there is an outside, which the label cannot without spoiling it.
- **A "Touch Grass" desktop icon**, with a new `grass` glyph, high in the rail.
  It is the joke and the reward for moving a window, deliberately not the
  reliable door: CatNav opens at `xl` and centres, so it covers half a rail icon
  at 1280px and, under 768px where a window locks to maximised, all of them. A
  cold deep link always arrives with a window already open, so that is the
  normal case. The `app` kind now carries its own `glyph`, since what an app
  launches is not a fact about apps, and a rail item pointed at the tent takes
  the shut-down path rather than the window-opening one.
- **The campsite project links to the tent.** It is one of the projects, and its
  action opened `https://jordanscamp.site/` in a new tab — a full reload of the
  site the reader is standing in. Recognised by comparing the URL to
  `SITE_ORIGIN` rather than by a flag on the project, so the two cannot
  disagree. `SITE_ORIGIN` is now declared once in `blogPages.ts`, with
  `head.ts` and CatNav's address bar reading it.
- **The landing story plays on the way out.** Arriving anywhere under `/blog` or
  `/notes` used to mark the welcome completed and persist that, so the story at
  `/` was spent without ever being shown and the sound choice was never offered
  — while `soundEnabled` defaults to on. `deepLinkSkipsIntro` now spends the
  intro only for an arrival the tent shows through (`/music`), where the
  backdrop would otherwise be blank. A covering arrival leaves it owed, so
  leaving CatOS by any route — the bar, the menu, the desktop icon, Escape, the
  project link — lands on `/` and plays the story, revealing the tent behind it.
  `isCoveringRoute` moved from `SceneRoot` to `routing/navigation` alongside it,
  since both are route policy rather than layout, and both are now asserted.
- **A launcher's glyph fills its frame.** `Icon` gained an `xl` size
  (`--icon-xl`, 48px) and `DesktopIcon` uses it. A glyph sat at 24px in a 72px
  box while the other two things that can fill that frame — an image, and a
  `Tile`'s letter — both filled it, so a glyph launcher read as a smaller
  object than its neighbours. A new enumerated size rather than a local
  override, because the DS takes no `className`.
- **The grass glyph is a tuft, not a sprig.** Seven blades — five tall, two
  short outer stubs — converging at a wide base and fanning out, from a
  reference Jordan supplied. Stroked, so the blades cannot taper the way a
  filled outline's do; this is as close as the set's one-path-per-glyph shape
  reaches. It only ever draws at `xl`, since an app is never a window and so
  never a tab.
- **A closing Modal no longer swallows clicks.** Found while checking the
  reveal in a browser: the takeover fades out at `--layer-modal` over a welcome
  screen at `z-index: 100`, so the story's buttons were not clickable. Both the
  popup and the backdrop drop their hit area under `[data-ending-style]`. The
  popup needs its descendants named too — `pointer-events` inherits, but
  `Window`'s frame sets `auto` to be clickable through its layer, and takes hits
  back unless outranked.

**Key decisions**:

- **The door is chrome, not scenery.** A still of the tent behind the CatOS
  window was the strongest existence signal on offer and was rejected as too
  visually busy. So the burden falls on the bar, where it cannot be covered.
- **Two capitalisations of one phrase, on purpose.** "Touch grass" in the bar and
  menu, where entries are sentence case; "Touch Grass" on the desktop, where
  they are app and file names. The tests name both exactly rather than matching
  a case-sensitive regex, so the difference is stated rather than incidental.
- **The reveal costs the laptop's pull-away shot.** Leaving now cuts to the
  story instead of flying the camera back from the laptop. Traded knowingly:
  suspense for a visitor who has never seen the tent beats a transition they
  have no context for.
- **`/blog` stays the front door.** Every canonical URL, the sitemap and the
  feed point there, and the reader-first alternative — CatOS as something you
  enter rather than arrive inside — was left alone: the story at `/` is what
  earns its place as the root.

**Deferred**:

- A closing Modal never unmounts; the guard makes the leftover node harmless
  rather than absent. Its own TODO entry.
- The prerendered reader still has no way up, which is hygiene for crawlers and
  no-JS readers rather than discoverability, and has to reckon with the CV PDF.
  Its own TODO entry.
- Copy throughout is Jordan's to change.

---

## Two type faces, split by job — and a title that scales with its column

**Date**: 2026-09-09

**What was done**:

- **`--text-title-1-size` is a `clamp()` on `cqi`.** One fixed 32px served the
  phone and nothing else: the same size against a 68ch column on a wide window
  read undersized. The floor is the old 32px, so mobile is untouched; the ceiling
  is 2.75rem. Measured in the running app: 32px at a 371px container, 35.2px at
  716px, 42.1px at 1148px.
- **`--text-title-1-step` added for fixed boxes.** `Tile`'s `lg` size drew its
  letter from the heading token, and a letter that grew with the window would
  outgrow the 72px square `DesktopIcon` puts it in. The step is the clamp's floor,
  so the tile is unchanged.
- **Homepage masthead copy.** "Hello, you found the laptop." became "Hello, let's
  see if we can make your day brighter."

**Key decisions**:

- **`cqi`, not `vi`.** The blog renders inside `Window.Body`, which is already a
  named `window-page` container — a window can be dragged narrow on a wide screen,
  and it is the window the title has to answer to. With no query container in the
  ancestry the unit falls back to the viewport, which is the right answer for a
  page rendered directly, so no fallback declaration is needed.
- **Fluid in the token, not in `blog.module.css`.** Page titles on the CV, a post,
  the archive and PhotoBroom all use `title-1`; a per-page override would have
  fixed one heading and left four.

- **`--font-text` split off `--font-sans`.** Paragraph text read loose, which was
  Nunito's own fit rather than a spacing bug: rounded terminals sit wide and give
  every letter a similar oval silhouette. Nunito Sans squares those terminals and
  fits tighter. `<Text>`'s three body variants and `.blog-prose p` take the new
  token; titles, labels, buttons, tags, badges and tiles keep Nunito. Body md went
  16px/1.6 → 17px/1.62 with it.
- **`Link` inherits its family instead of pinning `--font-sans`.** A link inside a
  paragraph is part of that sentence, and a pinned family switched the face
  mid-line the moment two faces existed. Chrome links sit inside something already
  on `--font-sans`, so they resolve unchanged — verified across the homepage's
  fourteen links.
- **The masthead eyebrow is gone.** "Jordan's Camp" sat above the title in a window
  whose own title bar and tab already say it twice.

**Key decisions**:

- **A variable text face, not static cuts.** Reading text needs 400 for paragraphs,
  600 for an inline link and 700 for `<strong>`. One 31KB axis file beats three
  ~16KB cuts, and `unicode-range` in the package keeps the unused subsets off the
  wire.
- **Nunito Sans, not a serif.** Source Serif 4 was the bigger readability jump and
  was specimened, but a serif inside a pixel-art CatOS window changes what the site
  is rather than how it reads. Keeping Nunito on the headings means the page still
  reads as the same brand with only the paragraphs changed.
- **`--font-text` on the variant, not on a wrapper.** `.body-lg`/`.body`/`.body-sm`
  each set it directly, so a body `<Text>` inside a `Modal` — which pins
  `--font-sans` on its root — still resolves to the reading face.

**Deferred**: a real italic for the text face, and moving Nunito itself to a
variable axis. Both in TODO; the weight audit behind the second is recorded there,
because splitting the faces freed no Nunito weight.

**Side effects worth knowing**: `Button`'s `md` label follows
`--text-body-md-size`, so button text went 16px → 17px with the body. Feed item
titles are `<Text variant="body" as="h3">`, so they now render in the reading face
beside their standfirsts rather than in Nunito.

---

## Stacked PRs are GitHub-native now, not Graphite

**Date**: 2026-09-09

**What was done**:

- **`CLAUDE.md` names the stack tool.** The Conventions list now records
  GitHub-native stacked PRs via `gh stack`, alongside the install line. Nothing
  in the repo had said which tool the stacks were built with — the only mention
  lived in a CI comment, which is not where a contributor looks for it.
- **`terraform.yml`'s trigger comment renamed the tool.** The comment explains
  why the `pull_request` trigger has no `branches` filter, and that explanation
  rests on stacked PRs being based on their parent branch rather than main —
  which is equally true of `gh stack`, so only the tool's name changed.
- **Cleared the local Graphite state from `.git/`.** `.graphite_repo_config`,
  `.graphite_cache_persist` and `.graphite_pr_info` are per-clone and ignored by
  git, so they are invisible in a diff — but they are the tell a tool-detecting
  agent checks first, and would have kept pointing at `gt` whatever the tracked
  files said.

**Key decisions**:

- **Put the convention in `CLAUDE.md`, not the README.** The README is project
  context — architecture, stack, commands. Which PR tool to reach for is
  agent/contributor workflow, which is what `CLAUDE.md` already holds.
- **Verified the Graphite cache before deleting it rather than trusting the
  file's absence.** It held no surviving multi-level stack — every branch was
  the trunk, parented directly on `main`, or already `BAD_PARENT_NAME` — and no
  PR was open, so nothing reconstructable was lost.
- **Trimmed the CI comment's history narration while renaming the tool.** It
  recounted which PR numbers had skipped the workflow and how many there were.
  Both load-bearing facts survive — a `branches: [main]` filter only matches the
  bottom of a stack, and the `apply` job's gates are what make an unfiltered
  trigger safe.

---

## The blog's markup says what it means, and the header got a cat

**Date**: 2026-09-09

**What was done**: Two things that turned out to share a diff. The homepage
masthead gained a pixel-art tuxedo cat beside the title, and every blog page's
markup moved from anonymous `div`s onto real sectioning elements, with the
heading outline fixed and both layers of enforcement wired up behind it.

### The cat is a self-hosted GIF with a credit, not a hotlink

Jordan picked a GIF from Giphy — pixel art by @victorbasso, originally Instagram
`vitu.pixel` — which happens to look a great deal like Smittens. No licence is
stated anywhere on it, so the two honest options were hotlinking Giphy's own CDN
(the channel the artist chose, but a third-party request on every page load, and
against the precedent set by self-hosting the Draco decoder) or self-hosting with
a visible credit. Jordan chose self-hosting, and the credit under the frame is
load-bearing rather than decorative: the picture is art resembling the cat, not a
photograph of him.

An interim attempt drew the cat from scratch as an animated SVG sprite to sidestep
the licence question entirely. Jordan preferred the original — "they nailed the
tail flick" — so it was dropped rather than kept as dead code.

The source art is 32x32 upscaled 6x to 192px, so the frame renders at 128px: an
exact 4x, which `image-rendering: pixelated` keeps hard-edged. That also forced
`box-sizing: content-box` on the image, because under the global border-box the
2px frame ate into the 128 and left a 124px picture at a fractional scale. The
figure is held to the frame's own width so the credit wraps beneath the picture
instead of setting the figure wider than the thing it captions.

The GIF carries an opaque cream background of its own, which is why it is framed
as a picture rather than floated on the page — unframed it reads as a pale block
on the dark theme. A still WebP of the first frame is served through
`<picture><source media="(prefers-reduced-motion: reduce)">`, because CSS cannot
pause a GIF and a rule was never going to be enough.

### Flex, not grid, for the masthead

The title and the cat share a wrapping flex row with the intro running the full
column beneath both. Only the heading shares the row: a paragraph held to the
width the cat leaves is a 35-character measure.

`<header>` owns the width for everything inside it — one `max-width`, and the
masthead row and both paragraphs fill it. So the cat's right edge and the
paragraph's right edge are the same edge, and all four elements measure the same.
An earlier attempt shrink-wrapped the row instead, which made the masthead
narrower than the prose and, via `max-width: fit-content` on the title, gave
`justify-content` free space to act on and indented the whole masthead away from
the prose's left edge.

Grid was considered and rejected. Two explicit grid columns never collapse to one
without a media or container query, and `repeat(auto-fit, minmax(...))` would give
the cat an equal share of the width. Intrinsic wrapping is what `flex-wrap`
already is. The alignment falls out of three declarations: `align-items:
flex-start` puts the title at the top, `align-self: center` on the figure opts it
alone out of that, and `justify-content: center` centres the cat on the line it
wraps onto while staying inert on the shared line, where the title's `flex-grow`
has already taken the free space.

Wrapping rather than a container query, too: the room the masthead gets is
whatever the 280px feed leaves it, not the width of the window, so the window can
be wide while this column is not.

Where the title breaks is left to the browser. Non-breaking spaces were tried, to
force the break after "Hello,", and must not be retried: gluing the clause makes
it unbreakable, and at the widths this column actually gets, the text then runs up
to 74px into the cat. Greedy line breaking also means no single glue gives the
same break at every width.

### Sectioning, and the two heading levels that were missing

`CvPage` was already semantic and served as the pattern; the rest of the blog was
`div`s. Now: `header`/`section`/`article`/`nav`/`aside`/`footer` throughout, every
run of posts, tags and projects is a real list, dates are `time` elements with
machine-readable `datetime`, and the cat is a `figure` with its credit in a
`figcaption`.

Two pages had **no `h1` at all** — `ProjectPage` opened at `title-2` and `ToolPage`
at `title-3`. Both now pass `as="h1"` while keeping the visual size, which is the
`variant`-versus-`as` split the DS `Text` component exists to allow. The homepage
skipped `h1 → h3`, and the CV skipped `h2 → h4`.

Section rules moved out of the DOM: an `<hr>` next to a `<section>` announces a
break the element already makes, so the rule is the section's own top border now.

### Enforcement, in two layers, because they catch disjoint things

`jsx-a11y` is on in `.oxlintrc.json`. Three rules are off with the reason stated
in the config: `anchor-has-content` and `control-has-associated-label` fire falsely
against the DS's polymorphic `render={<a/>}` API — they read an element in
isolation and cannot see that its accessible name comes from the wrapping
component's children — and `prefer-tag-over-role` insists an arc-shaped
time-of-day dial should be an `<input>`. The alternative, a per-file exemption
list, grows with every new consumer and protects new code least.

The other layer is `src/prerender/semantics.test.ts`, which parses the real
prerendered HTML of every page. A linter cannot see a heading that skips a level,
a `ul` full of `div`s, an unnamed `nav`, a nested `main`, or an `aria-labelledby`
pointing at nothing — those are facts about a document, not an element. It earned
itself immediately by failing on two heading skips in files this work had not
touched: the no-JS landing page and PhotoBroom's folded-in project page. Both
fixed, and `.blog-prose` gained the `h2` style whose absence had pushed the
landing page's sections down a level in the first place.

Globally, the `semantic-html` skill was installed into GlobalKnowledge from the
skills.sh registry, with the two-layer enforcement note added to the global
`CLAUDE.md` — the half a third-party skill does not carry.

### Deferred

The tape deck's seek bar is a bare `div` with an `onClick` reading `clientX`, so
it is mouse-only. It is grandfathered in `.oxlintrc.json` with an entry to delete
once fixed, and tracked in TODO.

---

## DO_NOT_OPEN.txt pays off with a video, not a punchline

**Date**: 2026-09-09

**What was done**: The desktop's warning file used to open a text window reading
"Told you." It now opens a media player that starts the Rick Astley video on its
own. The filename stays `.txt` — a text file that opens a player is the joke, and
the mismatched cassette icon on the rail is the only tell the visitor gets.

### A new desktop kind, not a special case on the text window

`DesktopItem` gained `{ kind: "video"; videoId; caption; duration }` and
`VideoWindow` joined the `CatosWindow` switch. This follows the pattern the
dispatcher's own comment describes — a kind of window means a case plus a
component, and nothing in the design system moves. The alternative, embedding an
iframe inside `TextWindow`, would have put a player behind a `textarea` and left
the revert control claiming to apply to a video.

The player wears the image viewer's chrome deliberately, so the two read as one
OS. Its transport buttons are inert for the same reason the viewer's zoom is: the
embedded player owns playback.

- **Autoplay is a request, not a guarantee, and the code is written to survive
  being refused.** A cross-origin frame only gets it where the embedder delegates
  the permission (`allow="autoplay"`) _and_ the top document already has user
  activation. A visitor who clicked the icon gets the payoff; one who arrives on
  `/blog/desk/do-not-open-txt` cold gets a paused player, because the browser
  never handed out the activation. Both were acceptable; a frame that refuses to
  load was not.
- **The scene's own sound preference governs the video.** `soundEnabled` off
  means `mute=1`. A site that offers a mute toggle and then ignores it for one
  file is a bug wearing a joke's clothes.
- **`prefers-reduced-motion` suppresses autoplay entirely.** The player still
  loads and still plays on a click.
- **The player's own controls stay visible.** Audio that starts unprompted needs
  a visible way to stop it (WCAG 1.4.2), and that control bar is the only one on
  the page — hiding it for a cleaner frame would have removed the sole remedy.
- **The `src` is frozen at mount.** Recomputing it from the live store would swap
  the iframe's URL and restart the video every time the visitor touched the
  scene's sound toggle.
- **Embedded from `youtube-nocookie.com`.** The same player without tracking
  cookies until playback starts, which keeps a static site with no consent banner
  honest.
- **The sandbox suppresses an oxlint warning on purpose.** `iframe-missing-sandbox`
  rejects `allow-scripts` with `allow-same-origin` as an escape, which holds for a
  same-origin frame able to drop its own sandbox. This frame is cross-origin, the
  token preserves YouTube's origin rather than ours, and the player will not run
  without both. What the sandbox buys is the tokens left out: the frame cannot
  navigate this page away or claim its storage.

**Deferred**: the icon set is closed and has no film or play glyph, so a video
shares `cassette` with tool pages. Adding one is a design-system change for a
single desktop item, and the borrowed glyph reads correctly on a retro desktop.

---

## The cat menu replaces the loose "Back to tent" button

**Date**: 2026-09-09

**What was done**: The way out of CatOS moved from a bare button sitting on the
menu bar into a pull-down behind the cat glyph, which is where a desktop of this
vintage keeps it.

### `MenuBar` grew pull-downs

`MenuBar` was pure chrome — a left slot and a right slot. It is now compound:
`MenuBar.Menu` (a trigger plus a portalled popup), `MenuBar.Item` (with an
optional right-aligned `shortcut` hint, hidden from assistive tech) and
`MenuBar.Separator`. Behaviour comes from Base UI's `Menu`, added as
`primitives/Menu.tsx` — roles, roving focus, typeahead, Escape and outside-press
dismissal, focus-return.

- **The popup is portalled to the body, so it escapes the takeover's stacking
  context.** CatOS is a Base UI `Dialog` popup at `z-index: 201`; a menu opened
  from inside it lands in a body-level sibling and was painted underneath. The
  z-index goes on the _positioner_, not the popup — the anchoring engine leaves
  the popup `position: static`, where a z-index means nothing.
- **Stacking order became a token layer.** Four component stylesheets each held
  a hand-written `z-index`; adding a fifth for the menu would have made the
  ordering unreadable. `tokens/layers.css` now names them
  (`--layer-menubar`, `--layer-window`, `--layer-modal-backdrop`, `--layer-modal`,
  `--layer-popup`) and every one of those five reads from it. Adding a new
  `@import` to `tokens.css` needs a Vite restart, not just a reload.

### The About box is a route, not an alert

"About CatOS" opens a real CatOS window at `/blog/about` — it stacks, drags and
closes like everything else on the desktop. That meant a new `BlogRef`/`BlogPage`
kind rather than a nested modal, which would have been the one thing on that
desktop behaving like the real web. The exhaustive switches made the compiler
find every site that needed the case.

`isBrowserPath` (path-level) gained a page-level counterpart, `isBrowserPage`,
because "not a tab" was being re-derived in the browser window and again in the
prerenderer.

Its body is a centred spec stack, with a live uptime counting from
1997-09-17T21:00+01:00 — Jordan's birth, to the minute. The offset is written
into the timestamp rather than left as local wall-clock time, so every visitor
counts from the same instant instead of from 9pm wherever they happen to be.
The figure is mono and tabular so a ticking second does not shuffle the line
under it.

### The menu's three items

`About CatOS`, `Close all windows` (disabled on an empty desktop), and
`Shut down` — which keeps the `Esc` hint the old button had, shown only when no
window is left to close, since Escape closes the front window first.

**Deferred**: a battery indicator beside the clock, dropped from this change.
The Battery Status API is Chromium-only, so it needs a decided fallback for
Firefox and Safari before it is worth building.

A screen-off fade before returning to the tent was built and then removed at
Jordan's request — `Shut down` navigates straight out.

---

## The desktop's text files are editable, and notes.txt is now words_with_friends.txt

**Date**: 2026-09-09

**What was done**: `TextWindow` renders a `<textarea>` where it rendered a `<pre>`,
so a visitor can type into a file on the CatOS desktop. Typing goes to
`useSessionStore.textEdits`, keyed by the file's slug. The toolbar's "read only"
label is replaced by a `Revert` tool button. `notes.txt` was replaced with
`words_with_friends.txt` — six lines lifted from Jordan's group chats — which
changes its slug, and so its URL, from `notes-txt` to `words-with-friends-txt`.

**Key decisions**:

- **Edits persist, in the session store rather than component state.** A window
  unmounts when it closes, so component state would lose a visitor's typing the
  moment they hit the red light — which reads as a bug, not as a scene. The store
  is already `persist`-wrapped, so edits survive a reload too.
- **Revert instead of Save.** With no server there is nothing to save to, and a
  Save button that only wrote to `localStorage` would be theatre. Revert is the
  one control that is honest about what the window can do, and it renders
  disabled until there is something to revert — the same handler-less-means-
  disabled pattern `PreviewWindow`'s zoom controls already use.
- **The caret is the focus indicator.** `.textBody:focus-visible` drops the
  outline: a ring around the whole page would read as a selected object rather
  than as a document, and a caret is what a text field is expected to show.
- **`.textSurface` is gone.** A textarea is its own scroll container, so the
  wrapper it needed as a `<pre>` had nothing left to do.
- **`DO_NOT_OPEN.txt` became editable too**, since editability is a property of
  the text window rather than of one file. Overwriting "Told you." is a fair
  thing to let a visitor do.

**Deferred**: nothing. Worth knowing: a visitor's edits are per-browser and
invisible to anyone else, and there is no undo beyond the browser's own
textarea history plus Revert.

---

## Smittens is a photograph now, not a drawing

**Date**: 2026-09-09

**What was done**: `SmittensPhoto` shipped an inline SVG cat because the repo
carried no cat photo. It carries one now:
`apps/campsite/public/images/smittens.webp`, referenced through `asset()` like
every other public-directory asset. `PreviewWindow` was untouched, which is what
the old component's comment promised would happen.

**Key decisions**:

- **The source was cropped, not the CSS.** The photo is 4:3; the viewer window
  is sized for the ~1.58:1 shape the SVG occupied. Dropped in at 4:3 the figure
  ran 43px past the window body and the caption was clipped. Cropping the source
  to 1600 × 1015 puts it back inside the frame with no styling change and a
  smaller file, rather than adding an `object-fit` crop the frame would then own.
- **WebP at q80, 1600px long edge** — the convention `images/screenshots/README.md`
  already sets for this repo. 87 KB.
- **`cwebp` strips EXIF by default**, so no camera or GPS metadata ships with it.
- **The desktop item's `label` stays `smittens_047.jpg`.** It is the in-world
  filename shown in a fictional OS's title bar, not a claim about what the repo
  serves. `dimensions` and `size` were updated, because those read as facts.

**Deferred**: nothing.

---

## The tape deck, the light rig's test, and a stale audio doc

**Date**: 2026-09-09

**What was done**: Three recorded loose ends, all in the campsite's audio and
scene layers.

### The music player had no music

`songs.ts` named three mp3s under `public/audio/songs/` and none of them were in
the repo, so every track 404ed and the transport did nothing visible. The
playlist is now empty, which is what the repo actually holds — the overlay
already had both empty states ("No songs yet" in the list, "No track" in the
now-playing view), so the player reads as empty rather than broken. Emptying it
exposed the arithmetic underneath:

- **A zero-length playlist wrapped to `NaN`.** `next()` and `prev()` computed
  `(index ± 1) % songs.length`, and a `NaN` index went into `musicStore` and
  stayed there — no later track can ever equal it, so `togglePlay`'s
  "same track already loaded" check would never be true again. All three modulo
  sites go through one `wrapIndex`, which returns `null` for an empty playlist
  and stops each caller before it writes.
- **`musicPlayer` had no tests at all.** It has 11 now, over a mocked Howler:
  the empty-playlist guards, wrapping past either end, `prev()` restarting a
  track more than 3 s in, Howl reuse, and progress publication on the 250 ms
  interval.
- **Deferred**: whether the deck gets recordings. Adding one is an entry in
  `songs.ts` plus the file. The blog's music-tag callout still promises songs it
  hasn't got — that copy is Jordan's to write, and is now in TODO.

### `Lighting.test.ts` asserted on copies of the component's arithmetic

It declared its own `AMBIENT_INT` and `MAIN_INT` arrays, transcribed from
`Lighting.tsx`, and asserted on those — so the file never imported the
component, and a keyframe could move without a test noticing. It is now
`Lighting.test.tsx`, driving the real rig through `@react-three/test-renderer`:
mount `<Lighting />`, set `timeStore.progress`, `advanceFrames(1, 0)` to run the
`useFrame` body, then read the intensities and colours off the lights it wrote
to.

- **The keyframe stops stay private to the component**, which is the point —
  there is nothing to transcribe. Lights are found by the positions the
  component gives them, not by scene order.
- **Checked that it actually catches drift**: moving the noon ambient stop from
  1.0 to 0.1 fails the noon test. The old file stayed green through the same
  edit.
- **Two assertions the copies could not make**: colours are now covered (the
  door light is bluer than it is red at midnight and the other way round at
  noon, the hemisphere sky cools from dusk to noon), and `debug` is covered —
  its flat rig ignores the clock and carries none of the animated lights.
- `IS_REACT_ACT_ENVIRONMENT` is set in `src/test/setup.ts`. Testing Library
  sets it for itself, so nothing needed it until a test used the R3F renderer
  directly.

### `ARCHITECTURE.md` documented an audio module that isn't there

Its "File Playback" section described an `audioManager.ts` subscribing to
Zustand stores outside React, playing a `rain-ambient.mp3` and a
`tent-door-rustle.mp3`. None of the three exist.

- The section is now **Track Playback (`musicPlayer.ts`)** — one Howl at a time,
  seek pushed into `musicStore` on an interval, and the empty playlist stated so
  the next reader does not go hunting for the mp3s.
- The `audio/` tree in the directory listing matches the directory: `audioContext.ts`
  and `musicPlayer.ts` were missing from it.
- The state-architecture bullet justifying five stores cited `audioManager` as
  the non-React subscriber. `CameraController` is the real one.
- The tech-stack table said React 18; the workspace is on 19.
- **A fourth testing category** is documented, since `Lighting.test.tsx` is not
  any of the three that were listed.
- **Deferred**: `PLAN.md` still names `audioManager.ts` and both mp3s. It is the
  pre-build plan rather than a description of the app, so it is left alone and
  recorded in TODO — what it needs is a decision about where it lives, not an
  edit to its audio section.

---

## The campfire outlived its loading screen

**Date**: 2026-09-09

**What was done**: The campfire's low base rumble could keep playing for the
rest of the session, through the ambience toggle being switched off. It was
started in one effect and stopped in a different one, so any exit that did not
run the second effect's timer left it burning with nothing holding a handle to
it.

- **The stop lived on the happy path only.** `stopCampfire` was called from
  inside the fade-out effect's `setTimeout`, and that effect's cleanup cleared
  the timer without stopping the fire. Unmounting before it fired therefore
  leaked the fire permanently — and "Reset preferences" in the cog popover does
  exactly that, clearing `hasCompletedWelcome`, which drops `showTent` in
  `SceneRoot` and unmounts the screen. The control that leaks the sound sits in
  the same popover as the toggle meant to silence it.
- **Withdrawing the preference did nothing to a lit fire.** Both start effects
  gated on `ambienceEnabled`, but nothing stopped the campfire when it went
  false, so turning ambience off mid-load left the fire crackling.
- **One effect now owns both ends**, keyed on a single `campfireLit` derived
  from the welcome, the preference and the fade-out. Every exit is a cleanup:
  the fade-out flips the flag, an unmount runs the same teardown, and so does
  withdrawing the preference. Two tests cover the two paths that were broken.
- **`campfireSynth` was building its own `AudioContext`**, against the rule
  `audioContext.ts` states in its own docblock. So the hum sat on a second OS
  audio thread that nothing else could reach or suspend. It uses the shared
  context now, and `audioContext.ts` is the only place in `src/` that
  constructs one.
- **A suspended context no longer counts as a lit fire.** `startCampfire` set
  `playing = true` regardless of whether Web Audio could sound, and the caller
  latched `audioStarted` on the same assumption, so a returning visitor — who
  arrives with the welcome already completed and has made no gesture yet — got
  a graph built against a mute context and no retry. It now declines, reports
  that through `isCampfirePlaying`, and the owner retries on the first gesture.
- **Relighting during a fade-out builds a fresh graph.** `playing` was cleared
  on a timer, so a start inside the fade window returned early and was then
  silenced by the pending teardown. Same detach-before-fade fix as
  `ambienceBeds`.

**Deferred**: the campfire is still synthesised rather than recorded, unlike the
two ambience beds. It only plays under the loading screen, where a synth reads
fine.

---

## `tentDoorState` is gone

**Date**: 2026-09-09

**What was done**: The store carried a four-state tent door — `"closed" |
"opening" | "open" | "closing"` — that nothing ever set. `setTentDoorState` had
no caller in the app; the only ones were the store's own definition and a test
that fed the setter each state and read it back, so the field held its initial
`"open"` for every session that ever ran.

- **The readers were branching on a constant.** `Lighting.tsx` chose the
  campfire's night and day intensities and switched the door spotlight off
  entirely, all off a `doorOpen` that could not be false. Those branches
  collapse to their open-door values, so the scene looks exactly as it did.
- **Two tests went with it.** `Lighting.test.ts`'s "door light is off when door
  is closed" set `const doorOpen = false` in the test body and asserted on that,
  never touching `Lighting.tsx` — it would have passed with the component
  deleted. "Campfire is brighter at night" had the same shape, recomputing
  `THREE.MathUtils.lerp` and checking the result against itself.
- **The mechanic that wanted it is still on the backlog**, now noted as starting
  from scratch in the store. Keeping unreachable scaffolding for it bought
  nothing: a future implementation needs a writer, an animation and a mesh, none
  of which the dead field brought with it.

**Deferred**: the rest of `Lighting.test.ts` has the same defect — it replicates
the component's keyframe arrays and asserts on the copies — and `PLAN.md` still
shows `setTentDoorState` in its illustrative snippets. The plan is a
point-in-time design artifact from the first commit rather than live
documentation, so it was left as written.

---

## Recorded ambience, and a bed for the daytime

**Date**: 2026-09-09

**What was done**: The rain was four layers of filtered noise from
`rainSynth.ts`, which read as white noise rather than as weather, and the day
had no bed at all — `getNightFactor` scaled the rain to silence by dawn and
nothing replaced it. Both are now 60 s field recordings, crossfaded into each
other by the same night factor.

- **Two beds, one crossfade.** `getNightFactor` already smoothsteps through
  dawn (progress 0.00–0.06) and dusk (0.46–0.54), so reading rain off it and
  birdsong off its complement crossfades them for nothing: both sit at half gain
  mid-dusk and neither cuts out. It also deleted a special case — the old
  component faded rain to silence explicitly below a night factor of 0.05, which
  the multiplication now does on its own.
- **Birdsong by day, not rain.** `RainSystem` already hides its particles
  during daylight, so the world's rule was rain at night and clear by day. The
  daytime bed follows the picture rather than fighting it.
- **The recordings are Public Domain Mark 1.0** from archive.org, so no
  attribution is owed; both recordists are credited in
  [docs/ambience-beds.md](../ambience-beds.md) anyway, since the licence is the
  only thing making the files safe to ship and a maintainer needs to check it.
- **The rain excerpt dodges the thunder.** Its source promises thunder and
  delivers it in two rolls, each a ~19 dB excursion in the 20–120 Hz band. A
  thunderclap on a 60 s loop reads as a loop, not as weather, so the excerpt
  sits in the quiet 75 s between them.
- **Both files are normalised to −20 LUFS with a fixed gain**, not a compressor,
  so the rain keeps its gusts and the birds their transients. Matching their
  loudness is what lets one set of gain constants in `AmbienceAudio` mean the
  same thing for either bed. Birdsong still peaks slightly below rain, because
  transients draw the ear where a flat bed doesn't.
- **The loops are seamless by construction**, each one's last 5 s crossfaded
  onto its first 5 s. Verified in a browser rather than assumed: both decode to
  exactly 60.0000 s with 0 ms of trailing silence, so mp3 encoder padding did not
  survive into the decoded buffer and Web Audio's loop is sample-exact.
- **`html5: false` is load-bearing.** Howler's HTML5 Audio path inserts a gap at
  the loop point and cannot be gain-automated smoothly, so both of this
  module's jobs depend on staying on the Web Audio path.
- **The gesture-retry logic went away.** `RainAudio` retried `startRain` on the
  first click, touch or keypress because a raw `AudioContext` will not sound
  before a gesture. Howler resumes a suspended context itself
  (`Howler.autoUnlock`) and queues volume changes made before a file has loaded,
  so neither the retry nor the `playing` state latch that woke the volume effect
  is needed.
- **The mix does not read the tent door.** `RainAudio` scaled rain by
  `tentDoorState`, but nothing in the app ever calls `setTentDoorState` — the
  open/close mechanic is still backlog — so the field sits at its initial
  `"open"` forever and the closed branch was unreachable. The beds track the
  day/night arc alone.
- **The toggle is no longer called "rain".** It governs birdsong too, so the
  control reads "Ambience" and its button label follows.
- **`rainSynth.ts` and its test are deleted** (317 lines). Keeping a second rain
  engine would have meant two things to reason about for one sound.

**Cost**: 1.7 MB of audio, fetched only when ambience is switched on — which is
off by default, so it stays off the critical path entirely.

**Deferred**: the beds load as a pair. Loading each only as its gain goes
non-zero would halve the night-time fetch, but the time-of-day wheel can jump
from noon to midnight instantly, so the saving buys a gap where a bed should
already be playing.

---

## The laptop flies to the viewer before CatOS covers it

**Date**: 2026-09-08

**What was done**: opening the blog landed on an empty CatOS desktop a beat
before it filled, and the laptop's flight to the camera was never visible at all.
Both came from `laptopFocused` doing two jobs — driving the GSAP flight and being
the takeover's `open` — so the overlay was opaque within 150ms of a flight that
runs 1000ms.

- **`flyingTo` splits the two.** A new scene-store field naming the object on its
  way to the viewer, with `laptopUp` / `notepadUp` selectors for "in its focus
  pose, or heading there". The 3D objects and the mobile camera centring read the
  selector; the takeover still reads `laptopFocused` alone.
- **`OverlayLink.coversScene` decides which wait applies.** A covering overlay
  flies first and opens on arrival; one that leaves the tent visible opens at once
  and holds the URL, as the music player does. `animMs` is the flight's own
  length again — 1000 for the laptop, 900 for the notepad, both read off the
  GSAP tweens.
- **The window is up the moment CatOS is**, because the URL commits before the
  overlay rather than after it.
- **A browsing session is discarded on the way in, not on the way out**, so the
  desktop is still standing while the takeover fades out.
- **"Back to tent" moved into the menu bar**, since it was gated on an empty
  desktop and a window is now always open. Its Esc hint renders only on an empty
  desktop, which is when Escape leaves rather than closing a window.

**Key decisions**:

- **A completion callback would lose to the timer it was meant to replace.** The
  hold is set to the flight's own length, so `onComplete` could at best tie with
  it on a visible tab, and in a backgrounded one it never fires at all — the
  ticker driving it is rAF, which the browser pauses. The earlier attempt only
  looked slower because the deadline had been pushed clear of the animation so
  the callback could win a race that does not need winning.
- **`OverlayKind` moved to `types/scene.ts`.** The store needs it to type
  `flyingTo`, and importing it from `routing/overlays` — even as a type — is a
  cycle `depcruise` rejects. It sits beside `FocusTarget`, which is the same kind
  of fact.
- **Selectors, not three copies of the expression.** `laptopUp` is read by
  `Laptop`, `CameraController` and the tests; a flight only some of them knew
  about would tear.
- **Write order is load-bearing in `applyOverlayState`.** Focus lands before the
  flight clears. Clearing first leaves one frame where the object is neither
  flying nor focused, and the mobile camera treats that frame as the laptop
  returning to the desk — it fires its restore tween, and the focus write
  immediately after saves the half-restored angle over the real one, so leaving
  CatOS put the visitor back facing the middle of the tent rather than the
  laptop. Covered by a test that records `laptopUp` across an arrival and
  rejects any `false`.
- **An abandoned flight is put back.** `cancelPending` clears `flyingTo`, so a
  flight that is superseded or unmounted cannot leave its object in the
  visitor's face with no overlay to explain it.
- **Clearing the desktop on exit is what made the exit ugly.** The takeover fades
  over 150ms with its children still mounted, so the window vanishing was the
  store emptying underneath a frame still on screen.

**Deferred**: camera input is not frozen during the flight, so mouse parallax
still moves the tent under a laptop on its way up. Left alone deliberately — it
reads as alive rather than wrong.

**Verification**: the look was confirmed by hand. It could not be confirmed any
other way — the tent renders blank in the Claude Code browser pane (pre-existing)
and the tab bar gates on `sceneReady`, so the in-app journey cannot be driven
there at all. What is covered by tests is the state machine
(`useSceneNavigate.test.tsx`), the takeover staying down mid-flight
(`LaptopScreenOverlay.test.tsx`) and the session reset (`overlays.test.ts`).

---

## The rain became opt-in, and lost its second owner

**Date**: 2026-09-08

**What was done**: One flag, `soundEnabled`, drove both the looping rain bed and
every one-shot interaction sound, and a second component started the rain behind
`RainAudio`'s back. Ambience is now its own preference, off until asked for.

- **`ambienceEnabled` (default off) holds the looping beds** — rain on the tent
  and the campfire crackle. `soundEnabled` (still default on) keeps the one-shots:
  laptop bleeps, MIDI, guitar, cat, page flips, window chrome. The split is by
  intrusiveness, not by source: a continuous bed is a thing you consent to, a
  click on a laptop lid is feedback for something you just did.
- **`RainAudio` is the sole owner of the rain.** `CampfireLoadingScreen` also
  called `startRain(0.12)` as a campfire→rain cross-fade, and that rain was
  invisible to `RainAudio`: its volume effect and its stop path both gated on a
  local `started` ref that the other caller never set. So loading-screen rain
  played at a flat 0.12 through daylight and ignored the sound toggle entirely —
  the "it activates inconsistently" symptom. The call is gone.
- **The start latch is state, not a ref.** Even on its own path, `RainAudio`
  recorded "playing" in a ref, which doesn't re-render, so the volume effect
  could miss the transition and leave the rain wherever it started.
- **The cog became a cluster.** Visual effects and rain are now their own
  buttons beside the gear (`SceneControls`), each an `aria-pressed` toggle whose
  label states the action it performs. The popover keeps all three switches plus
  Reset preferences.
- **Peak rain volume dropped** from 0.22 to 0.12 with the door open, 0.08 to
  0.04 closed.

**Key decisions**: the campfire crackle moved to `ambienceEnabled` alongside the
rain even though only the rain was complained about — it is the same kind of
sound, and leaving it on `soundEnabled` would have meant the loading screen
crackling at someone who had turned ambience off. The welcome screen's "full
experience (sound + motion)" does switch ambience on: an explicit press of a
button offering sound _is_ the opt-in, and the scene control is right there to
turn it back off. Off-by-default governs the visitor who never answered — the
returning one, and the one who deep-links past the welcome screen.

`SceneControls` was written against a CSS module rather than inheriting
`SettingsMenu`'s inline styles, so `.oxlintrc.json`'s grandfathered
`forbid-dom-props` list lost an entry instead of gaining a renamed one. The
amber tent chrome doesn't map onto the brand tokens the tab bar uses, so it is
declared as module-local custom properties at the top of the file; spacing,
radius and type still come from the design system.

**Deferred**: the full-screen settings takeover with 3D model credits — see
TODO.md. Rain's day/night gate is untouched: with ambience on, it is still
silent by day, which is now a deliberate scene effect rather than a surprise.

---

## The CatOS browser window opens at a size that suits a monitor

**Date**: 2026-09-08

**What was done**: `Window` gained an `xl` size hint — `0.9` of its layer up to
1200x860, against `lg`'s `0.92` up to 880x660 — and `BrowserWindow` asks for it.

**Key decisions**:

- **The ceiling was the whole problem, not the ratio.** `sizeFor` is
  `min(layer.width * ratio, maxWidth)`, so above roughly 957px of viewport the
  proportional term never binds: a 1512px laptop and a 2560px monitor both
  resolved to 880px. Raising the ratio would have changed nothing on either. The
  ratio governs only the small-viewport half of the rule.
- **1200 is derived from the icon rail.** The rail is 148px and a window centres,
  so a 1512px viewport puts the frame's left edge at 152 — clear by 4px. Below
  about 1500px the ratio takes back over and the frame does overlap the rail,
  which is what a real desktop does with its icons too.
- **`xl`, not `browser`.** The design system knows what a browser is — it ships
  `Window.AddressBar` and `Window.Tabs` — so naming the hint after its one caller
  was tempting. A size named for a use case stops being a scale; `BrowserWindow`
  naming `xl` at the call site says the same thing without spending a name on it.
- **Two places hold the numbers.** `SIZE_HINTS` and the pre-measurement CSS
  fallback are kept equal by hand, as the existing sizes already are.

**Deferred**: nothing.

---

## Scrollbars: hidden by opt-in, not by default

**Date**: 2026-09-08

**What was done**: `/blog/cv.html` read well with JavaScript off and printed
fine, but a reader could not tell it scrolled — `global.css` hid every scrollbar
on the site, and that stylesheet reaches a prerendered page because Vite hoists
it into a `<link>`. The default is now inverted.

- **The viewport lock is the scene's**, not the site's: `height: 100%`,
  `overflow: hidden` and `overscroll-behavior: none` hang off `html.js`, the
  class the shell's inline script sets before first paint. A prerendered page
  is an ordinary document, so the shell's `html:not(.js)` block no longer has to
  hand back the overflow it never should have lost.
- **Hiding a scrollbar is a per-scroller opt-in** through the design system's
  `scrollbars.module.css`, exported as `@jordanscamp/ds/scrollbars.module.css`
  and composed by both packages. It states both mechanisms (`scrollbar-width`
  for Firefox, `::-webkit-scrollbar` for Blink and WebKit — the old global rule
  stated only the second, so Firefox always drew the bars the scene meant to
  hide). Chrome takes it: the CatOS rail, the `Window` tab strip, the iPod's
  song list, the notebook page.
- **`build:pdf` guards it.** It already loads the CV in a Chromium with scripts
  off, so it now also fails if that page clips its overflow or hides the
  document scrollbar. Confirmed by putting the old rule back: the step fails
  with `/blog/cv.html hides the document scrollbar without scripts`.

**Key decisions**: opt-in rather than an exception for the reader, because a
global rule with one carve-out is a trap for the next prerendered page — the
site's default now matches what a browser does unasked. The DS `Window` and
`Modal` bodies were deliberately _not_ opted in: they show their scrollbars in
the scene now, which is what they already did in Storybook, and the window body
is where a long document renders. Same reasoning left the plain-text window's
surface and PhotoBroom's code blocks with theirs. The tab strip went the other
way once it was visible: it is a row of chrome that overflows whenever the tabs
outgrow the frame, and a bar under them reads as damage.

**Deferred**: the desktop's scrollbars are now the OS's, unstyled. Styling them
to fit CatOS is in TODO.

---

## The CV: one module, three renderings

**Date**: 2026-09-08

**What was done**: the plan in [cv-design.md](cv-design.md), through to
content. `src/data/cv.tsx` holds the CV as typed data with a TSX narrative, and
three things render from it.

- **A `cv` page kind** at `/blog/cv.html`, through the same exhaustive switches
  as every other page, so the CatOS browser, the prerender, the sitemap and the
  URL test all picked it up. `CvPage` is narrative first, then experience,
  skills and education in plain markup. Caddy answers `/cv` with a redirect.
- **A `profile` head.** `PageMeta` became a discriminated union; the profile
  case emits `og:type profile`, a `schema.org/ProfilePage` wrapping a `Person`
  (`jobTitle` from the current role, `sameAs` from the links, `knowsAbout` from
  the skills, `dateModified` from `updated`), and a `rel="alternate"` link to
  the PDF, which is also in the sitemap.
- **`dist/cv.pdf`**, printed by `scripts/render-cv-pdf.mjs`: Vite's preview
  server over `dist`, Playwright's Chromium with JavaScript disabled so the
  reader renders and the tent never boots, `page.pdf()` at A4. The script then
  reads the PDF's text back with pdfjs and fails unless the name, headline and
  first role are in it. It is `build:pdf`, a separate command from `build`, run
  in CI and the deploy after the build and cached Chromium install, so a local
  build needs no browser.
- **Printing any prerendered page prints the reader**, tent or no tent: the
  shell's print stylesheet hides every `body` child that does not contain
  `#reader`. That is what the PDF step relies on.
- **A `draft` flag on posts**, landed first: the CV is one click from the
  posts, and the three seeded ones are placeholders. A draft is shown in
  CatOS, and left out of `blogUrls()`, the feed, and any tag page only drafts
  would fill.
- **The content**, from Jordan's document. `Role.summary` became optional and
  `Education.highlights` was added to fit it.

**Key decisions**: a build-time PDF rather than a print dialog, so a recruiter
gets a file and an ATS gets a parseable document without a browser. The PDF
is printed from the prerendered HTML rather than a second template, so the
two cannot drift. `ProfilePage` rather than a bare `Person`, because
`dateModified` belongs to the page. The reader's wrapper is the design
system's `BrandProvider` div, so the print rule keeps the branch containing
`#reader` rather than assuming `#reader` is a direct child of `body`; the
first attempt assumed that and printed a blank page, which the text check
caught.

**Deferred**: the "Work with me? / Get to know me?" toggle, to the design
cycle; the narrative's closing paragraph, to Jordan; a `location` on each
role and any links beyond GitHub, which the document did not carry.

---

## The blog reads without JavaScript

**Date**: 2026-09-08

**What was done**: every URL under `/blog` was the same SPA shell — the tent's
title and description, an empty `#root`, and a noscript block about a cat. Google
renders JavaScript eventually; link unfurlers and AI crawlers do not, so a shared
post link previewed as a campsite and read as nothing. The build now writes one
HTML file per blog URL, rendered by the same components the CatOS browser uses.

- **`scripts/prerender.mjs`** runs after the client build and an SSR build of
  `src/prerender/entry.tsx`. It uses the built `dist/index.html` as its template
  (so the fingerprinted asset links are right), fills the `prerender:head` and
  `prerender:html` markers per page, and also writes `sitemap.xml`, `robots.txt`
  and an Atom `feed.xml`. The landing page at `/` gets a text version of the tent
  in place of the old noscript block.
- **`blogUrls()`** (`src/routing/blogUrls.ts`) enumerates every page from the data
  modules; a test asserts each one parses, resolves and renders. A new post is in
  the sitemap, the feed and the prerender when it is in `posts/index.ts`.
- **`metaOfBlogPage`** sits beside `titleOfBlogPage` and gives each page its
  description and Open Graph type; `src/prerender/head.ts` turns that into the
  head tags plus a schema.org `BlogPosting` or `WebPage` block.
- **`Island`** (`src/components/blog/Island.tsx`) is how a post holds something
  interactive: a dynamic `import()` plus a fallback that is real content. The
  static render shows the fallback and never loads the module; the live render
  code-splits it. `Counter` in "What vibe coding actually changed" is the proof.
- The shell hides `#reader` once JavaScript has run (`html.js`), so a browser
  never shows the page twice. The SPA does not hydrate the reader: it mounts fresh
  into `#root`, which sidesteps every hydration-mismatch bug at the cost of
  shipping a post's prose twice to a JavaScript user.
- Caddy's `try_files` also tries `{path}.html`, so a link without the extension
  still gets the file, and the `no-cache` header covers every `*.html`.

**Key decisions**: prerender rather than dynamic rendering or a framework move —
the content was already typed data with TSX bodies and the URL scheme already
looked like files, so the only missing piece was writing them. Humans and bots
receive identical HTML, so this is progressive enhancement, not cloaking.

**Deferred**: a `draft` flag (all three seeded posts are prerendered and indexed
with their `[DRAFT` beats); the CV page and the "Work with me / Get to know me"
toggle as two prerendered URLs; a PDF from the same CV data.

---

## A performance pass over the whole site

**Date**: 2026-08-27

**What was done**: a cold load of `/blog` transferred 32.7 MB and blocked on
1.5 MB of WebGL the page never used. It now blocks on 443 kB, and a whole visit
including the background warm-up is 5.4 MB. Four independent causes:

- **Nothing was compressed.** Caddy's `encode` is opt-in and had never been
  enabled, so every byte of JS and CSS went out raw. `infra/Caddyfile` now sets
  `encode zstd gzip` and adds `Cache-Control` — a year, immutable, for the
  fingerprinted `/assets/*`, a revalidating week for models and images, and
  `no-cache` for the shell that names them. The bootstrap copy in
  `infra/templates/user_data.sh` mirrors it.
- **Three.js was on the blog's critical path** despite `TentScene` being a lazy
  chunk. Two edges pulled it into the entry graph — `CampfireLoadingScreen`
  importing drei's `useProgress`, and `timeStore` importing `THREE.MathUtils`
  — and the object form of `manualChunks` added a third that no import
  explained. Progress now reaches the loading screen through `sceneStore`,
  pushed by `TentScene/loadProgress.ts` inside the lazy chunk; the store's math
  is local; `lerpColorKeyframes` moved to `TentScene/colorKeyframes.ts`, the only
  place THREE.Color was needed.
- **30 MB of models.** Sketchfab exports carry 1024² PNGs and unquantised
  geometry. WebP at quality 80 plus Draco takes them to 3.8 MB with no change in
  texture resolution. `scripts/optimise-models.mjs` (`pnpm --filter campsite
models:optimise`) does it and skips anything already carrying
  `EXT_texture_webp`, so a re-run can't stack lossy passes.
- **A third-party fetch that was failing.** `<Environment preset="night">`
  pulled its HDRI from `raw.githack.com`, which answers 403 — the metallics have
  had no environment map for some time. Replaced with two `<Lightformer>`s at
  64px, which needs no network.

Screenshots on `/blog/photobroom` went to WebP (1.3 MB → 488 kB) and now carry
`loading="lazy"`.

**Key decisions**:

- **No `manualChunks` at all**, rather than a tidier one. Splitting three into a
  named vendor chunk is the obvious move and it back-fires: the scene chunk and
  the entry chunk share the stores, which makes them mutually dependent, and
  Rollup resolves the cycle by hoisting the shared vendor chunks into the
  entry's static imports. Vite's own chunking keeps three inside the lazy chunk,
  which is the only place it is used. The reason is written into `vite.config.ts`
  because the fix looks like an omission.
- **Texture resolution left at 1024².** Halving it saved another ~0.5 MB across
  the set, which is not worth a visible drop in fidelity once WebP and Draco
  have already done 8×.
- **The idle warm-up still fetches the models**, so closing the laptop lands on
  a scene that is already there — that was the complaint that started this. It
  is now 3.8 MB rather than 30 MB, and it is skipped entirely when the browser
  reports `saveData` or a 2G-class connection.
- **Draco over meshopt.** The decoder was already deployed at `/draco` and wired
  through `DRACO_PATH`; meshopt would have meant shipping a second decoder for
  no measured gain.

**Deferred**: the warm-up's 3.8 MB is still unasked-for on a blog visit, and the
campfire is 1.4 MB of it — see the outdoor-model lazy-loading item in TODO.
Nothing was done about font subsetting or about `howler` sitting on the blog's
critical path.

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
