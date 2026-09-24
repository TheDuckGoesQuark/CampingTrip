# TODO

All planned and deferred work, organised by priority.

---

## Next Up

### Contact — nothing limits how often one sender may post

`/api/contact` is public and unauthenticated, and the only ceiling anywhere is
`reserved_concurrent_executions = 2` on the Lambda. That bounds the bill, which
was the point, but it counts messages in flight across everyone rather than per
sender: one script can post to the inbox as fast as it likes, serially, forever.
The honeypot and the dwell floor stop the naive ones and nothing else.

The cost is a flooded inbox rather than a large bill, so it is not urgent. Where
the limiter would live is the awkward part: Caddy's `rate_limit` is not in the
standard binary, so that route means maintaining a custom Caddy build, and doing
it in the Lambda means state for what is currently a stateless function.

Worth deciding before advertising the address more widely. MouseMail's `busy`
copy says "handling too much at once" rather than "you have sent too many" — if
a real per-sender limit lands, that wording should change with it.

### Infra — a Terraform run can break the deploy in the same push

`terraform.yml` and `deploy.yml` both trigger on push to main and run
concurrently. `deploy.yml`'s "Find EC2 instance by tag" step filters on
`instance-state-name=running` and fails outright when it matches nothing, with no
retry — so any apply that stops the instance, as a `user_data` change does, hands
the deploy an empty result and fails it. That happened on the contact-endpoint
merge: the apply was mid-restart when the deploy looked.

The failure is loud and re-running the deploy fixes it, so this is a papercut
rather than a hazard. Either wrap the lookup in a retry, or make `deploy` wait on
`terraform` via `needs:` so the two cannot interleave.

### Infra — the AWS provider pin is a major version behind

`infra/versions.tf` pins `~> 5.0`. Two things in `contact.tf` exist only because
of that pin: `aws_lambda_permission.contact_public_invoke`, which provider 6.28
adds by itself for a `NONE`-auth function URL, and the note that the
`lambda:InvokedViaFunctionUrl` condition cannot be expressed — 6.x has the
argument, so the public grant could be narrowed from "any signed Invoke" to
"only through the URL".

Worth doing on its own, not folded into feature work: the 6.0 upgrade touches
every resource already in state, so the plan wants reading carefully before
merging given `terraform.yml` applies on push to main. Afterwards, delete the
explicit permission and confirm the provider's two statements replace it.

### Contact — a failed endpoint looks identical to a working one

`submitFeedback.ts` falls back to the `mailto:` when the POST fails, which is
the right thing for the visitor and means a broken `/api/contact` reaches nobody
who would notice. There is no synthetic check on the endpoint, and a check that
only asserts a 204 would not prove SNS delivered either. Whether that is worth a
CloudWatch canary is a judgement about what a missed note costs, not a defect.

### MouseMail — the window remembers a send it should have forgotten

Closing MouseMail does not unmount it, so its compose state survives. A
successful send now closes the window on `OK`, which hides this for the path
people actually take — but close MouseMail by its own title bar mid-draft and
reopen it, and everything typed is still sitting there. That is arguably a
feature; it is not a decision anyone made.

### MouseMail — the menu bar still does not open it

The desktop icon, the contact footer and now `/blog/desk/mousemail` itself open
it; the CatOS menu bar does not, though it is where "Close all windows" and
"Touch grass" live and so is where someone looks for what CatOS can do.
Separately, the homepage's "let me know" still jumps to the contact footer, so
reaching MouseMail from the landing page means following a link and then
following another — the footer link was the whole point of #123, and it now sits
in front of a thing that has its own URL to be linked straight to.

Both are one-liners; the question is whether the landing page should skip the
footer, or whether arriving at the banner first is the intended pause.

### Design system — `Text` has no `danger` tone

`tone` offers default / muted / on-brand / link, so a form error cannot be
coloured through `Text` and `components/form/field.module.css` restates
`--text-*` sizes for the label, the hint and the error instead of composing
`<Text>` as the package's styling rules prefer. `Badge` already carries a
`danger` tone, so the semantic exists — it is only missing from the type scale.
Adding it would let all three parts of a field compose through `Text`.

### Design system — no border token clears 3:1, and the focus ring misses in light

WCAG 1.4.11 wants 3:1 for the boundary that identifies a control and for a focus
indicator. Derive the current figures with the ramps in `src/tokens/primitives.css`:

| Against the page                  | Light | Dark | Needs |
| --------------------------------- | ----- | ---- | ----- |
| `--brand-border`                  | 1.34  | 1.61 | 3.0   |
| `--brand-border-strong`           | 1.82  | 2.29 | 3.0   |
| `--shadow-focus` ring, composited | 1.84  | 3.20 | 3.0   |

Two separate problems. The border one arrived with the form controls, where the
box is the only thing saying where to type — a `Card`'s border is decoration and
carries no such duty, so the tokens were never asked for this. `--neutral-5`
(4.28 light) is the first stop on the ramp that clears it, which suggests a
`--brand-border-control` rather than moving `--brand-border-strong` and
restyling every card and window that leans on it.

The focus ring is older and wider: `--shadow-focus` is what `Button`, `Card`,
`Tag` and `Window`'s controls all focus with, so a light-mode ring at 1.84
affects every one of them and is not the form's to fix alone. The dark ring is
fine, which is why it reads as a light-palette bug rather than a shadow bug.

Text contrast is not in question — label 8.6, hint 4.81, error 4.63, typed value
9.21, placeholder 5.16, all above 4.5 in both schemes.

### CatOS — the video window is outside the master fader

`VideoWindow` is a YouTube iframe, so neither the Web Audio bus nor Howler's
global volume reaches it: it takes `soundEnabled` as a `mute` parameter at
mount and nothing else. Its status line reads "Volume 100%" whenever it is not
muted, which the tray fader can now contradict. Either drive the embed through
the YouTube iframe API (`postMessage` `setVolume`, which also needs the player
to be ready before the first call) and put it on the same level as everything
else, or stop the status line claiming a number it does not set.

### Repo: drop PhotoBroom

Dead code we no longer want here. `apps/photobroom` (2.0M) and
`extensions/photobroom` (332K) are 26 tracked files between them, plus three
root scripts (`dev:photobroom`, `build:photobroom`, `test:photobroom`).

**The decision to make first**: the campsite has a project page _about_
PhotoBroom, `components/overlays/PhotoBroomPage.tsx`, reached from
`data/projects.tsx` and asserted by `blogPages.test.ts`,
`OverlayRoutes.test.tsx` and `blogPaths.test.ts`, with screenshots under
`public/images/screenshots`. That is portfolio content, not app source: retiring
the extension does not oblige the site to stop saying it was built. Whether the
page stays is a separate call from whether the code does.

Named in config besides: `.oxlintrc.json`, `.oxfmtrc.json`, `cspell.json`,
`project-words.txt`, `scripts/ds-guard/config.json` and its `baseline.json`.
Named in prose: `README.md`, `CLAUDE.md`, `docs/architecture.md` and the
`run-locally` skill, which devotes its opening paragraph to why PhotoBroom has
no dev server. The CI workflows say nothing about it: they run `pnpm -r`, so
they need no edit.

**The knock-on worth expecting**: ds-guard reports design-system reach as a
ratio over consumer files. Removing an app that never used the design system
moves that ratio, so the baseline wants regenerating in the same change and the
new number is not a regression.

### Blog: the highlighter loads on the landing page

Nothing splits the blog out of the entry chunk: only `TentScene` has its own
bundle, so `prism-react-renderer` and its grammars sit in the chunk the 3D
landing page loads. It is the single largest thing on the blog side of that
chunk, and the landing page never renders a line of code. The entry chunk went
from 226.5 kB to 255.6 kB gzipped when it landed, which is the budget to win
back.

Lazy at the `Code` component rather than at the route: code blocks are rare and
sit well down a post, so the chunk can arrive after the page does, and a post
with no code never fetches it at all. The plain `<pre>` makes a correct
`Suspense` fallback, since the text without its colours is the same text.

**The bit to check before writing it**: the prerender calls
`renderToStaticMarkup`, which cannot wait for a lazy chunk, so the static HTML
will carry the fallback. That is harmless here, because `main.tsx` mounts with
`createRoot` rather than `hydrateRoot` and the client re-renders from scratch
anyway, but it does mean the prerendered copy loses its colours. Confirm that is
acceptable for the no-JS and crawler view before committing to the approach.

`manualChunks` is the wrong tool: the comment in `vite.config.ts` records that
naming vendor chunks made Rollup hoist them into the entry's static imports, off
the back of the entry↔scene cycle the shared stores create. The built chunk list
is the only proof either way.

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

The CV is live at `/blog/cv.html` and `/cv.pdf`, and the homepage's professional
column, its `See the full CV` link and the contact footer on every other page
reach it — so this is about the way in the design cycle owns, not the only way
in. Whatever it becomes, `SegmentedNav` in `@jordanscamp/ds` is what draws it:
the CV's own length switch is its first consumer, and this toggle is the second
the design system was promoted for. Three constraints hold whatever it
becomes, recorded in [cv-design.md](cv-design.md): the two views are two URLs
(`/blog/cv.html` and `/blog/index.html`), the toggle's state is derived from the
URL and never stored, and the prerendered reader must not depend on it.
Candidates: a segmented control in CatNav's header, a `CV` icon on the desktop,
a bookmark in the browser bar, or a choice on the welcome screen at `/`.

### Blog — the contact footer offers the CV from the condensed CV

`ContactFooter` hides its `Read my CV` item on `page.kind === "cv"`. The
condensed CV is its own kind, so the footer offers a reader already on a CV a
link to the other one, which the length switch in the header already does
better. A one-line fix once both changes are on main: the guard wants to cover
`cvCondensed` too.

### Blog — the CV's remaining `[DRAFT — …]` beat

One bracketed beat is live on `/blog/cv.html` and in `/cv.pdf`, published
knowingly: what CatMaps has running today. It needs facts only Jordan has. The
Summary is still the place for an `Island` if the CV wants one interactive
piece.

### Blog — the commendation attributions are inferred, not confirmed

Five quotes are live, verbatim from an internal Slack channel with every name,
sponsor study and product name stripped. The roles attached to them — a clinical
research lead, two product designers, the lead of the incident response team,
two engineers — were inferred from what each message says about its author, not
looked up. Jordan knows the real ones and should correct them. The two designer
quotes are by the same person, so one of them wants a different voice or a
distinguishing role.

Nobody was asked. Attribution is by role and the section names no employer, so
no individual is identified, but anyone who wrote one would recognise their own
words. Worth asking the five for a line written knowingly, which could then be
quoted with a name and be stronger for it.

### Blog — the CV PDF spends two pages on every one it needs

`/cv.pdf` is six A4 pages for about 1,480 words: roughly 250 words a page where
a dense CV carries 600–700. The content is near three pages' worth and the print
stylesheet spends six. Dropping `break-inside: avoid` from `.cvRole` already
recovered one page, so the rest is the space scale, the section separator's
height and the print heading sizes rather than anything structural. Worth a
print-density pass on its own, measured with `pdfinfo` and
`pdftotext | wc -w` rather than by eye.

The condensed CV's `@media print` block in `CvCondensedPage.module.css` is a worked example
of the same levers — collapsed gaps, a smaller section margin, no separator —
scoped to `.cvCondensed` so it says nothing about the full page yet.

### Blog — Participant diaries has no Difficulty or Approach

`Participant diaries` carries `[DRAFT — …]` in both facets, published knowingly.
It needs what made the rebuild hard and how Jordan went at it, which is the half
of the frame carrying the seniority argument.

### Blog — only Lindus Health uses the structured form

`Role.achievements` is optional, so Gravity Sketch and below still render
`highlights` as plain bullets and the page mixes two shapes. Their content needs
the same treatment before the frame reads as a decision rather than an accident.
Gravity Sketch's bullets carry no numbers or named outcomes; Improbable has two
purely technical lines; Skyscanner, AMNiiS, Imagine Software and American
Express have none at all. `AMNiiS — Lead Backend Engineer` is a leadership title
with an empty body, which reads as a gap rather than a credential.

It also decides what the condensed CV prints for them. `condensedBullets` takes
the `short` of each achievement a role names, and falls back to the whole of
`highlights` for a role naming none — so Gravity Sketch contributes six bullets
against Lindus Health's seven, which is not the weighting either deserves.
Giving those roles achievements is what fixes it; a cap on the fallback would
only hide it.

### Blog — content to write

- Every post in `data/posts` is seeded with a real standfirst and opening
  paragraph and bracketed `[DRAFT: …]` beats to finish. They are placeholders
  for Jordan's words, not content, and each stays `draft: true` until its beats
  are filled.
- `ourDesignersWriteTheUi` is written and its `draft` flag is off. It names the
  employer and the domain deliberately, so the review from someone there is the
  last gate before it is merged and deployed.
- `Things I think are cool` on the homepage is fed from `bookmarks.ts`, which
  mixes two things: tools (myNoise) and things loved (Eyezmaze). The heading is
  wide enough to hold both, so the open question is whether they read better
  split across two homepage sections.

### Blog: the useless machine has no repeat visual check

The paw's arc was tuned against a contact sheet: a throwaway Playwright script
that inlines the component's real stylesheet, renders the markup nine times, and
seeks each copy to a different point with `animation-play-state: paused` plus a
negative `animation-delay`. It found two things no test could: the custom
properties were scoped to a sibling of the paw so it never moved at all, and the
first arc translated the whole limb so it detached from the box halfway out.

That script lives in a scratch directory and is gone with the session. Nothing in
the repo can see an animation, and `packages/design-system` cannot either, since
Vitest runs with CSS disabled. Worth deciding whether a frame-sheet script earns
a place in `scripts/`, or whether animation stays a thing only a human checks.

### Repo: `ds/no-inline-icon` cannot tell an icon from an illustration

The rule reports every `<svg>` in app code, but its message argues about icons:
DS sizing, colour tokens, the `aria-hidden` default. Those are reasons an icon
belongs in the design system, and they say nothing about a one-off illustration
whose parts animate independently. The useless machine's paw took the long way
round it (rounded boxes and a `clip-path`), and `shimmer.module.css` takes the
other one (SVG as a `data:` URI in CSS), so the rule is currently routed around
twice rather than obeyed.

Two consumers is not yet a pattern, so this is worth watching rather than
fixing. If a third arrives, the question is whether the rule should exempt an
`<svg>` that carries no `role="img"` and no title, or whether the DS should
export an `Illustration` escape hatch that owns them.

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

### Blog: a project page cannot reach its CV entry

Deferred when the personal column kept its project pages: a "See this on my CV"
link needs a mapping from a `projects.tsx` title to a `CvProject` name. CatMaps
no longer needs one, since both now spell it the same way, but
`JordansCamp.Site` and "Jordan's Campsite" still disagree, and PhotoBroom and
Music Production have no CV entry to land on at all. So the link wants either
an explicit optional `cvName` on `Project`, or to appear only where a name
matches.

### The design system has gaps the apps filled themselves

`pnpm ds-guard` reports them; `scripts/ds-guard/baseline.json` is the accepted
list, and an entry deleted from it must stay fixed. Two kinds:

`missing-primitive` — a control the DS exports nothing for, so every app that
wanted one built it. `ToggleSwitch` and `VolumeSlider` in `overlays/` are the
clearest: both hand-write keyboard behaviour that `@base-ui/react` already
ships, and the switch is a `<div role="switch">` with its own keydown handler.
`Spinner` (photobroom), the `catos` menus and the tab bar's `pill` are the rest.
Each is a DS PR — a primitive over the Base UI component, then a styled export —
not something a lint rule can fix.

`reinvented-component` — a local name matching something the DS already exports.
`SceneControls` alone carries a `ControlButton`, four inline glyph components and
a `.button` class, with `Button` and `Icon` sitting in `@jordanscamp/ds`.
`photobroom/overlay/ui.tsx` declares its own `Button` outright.

Worth doing in DS-first order: land `Switch` and `Slider`, then migrate
`SceneControls`, which clears most of the baseline in one change.

### Design system — `TextArea` is the only export nobody imports

`pnpm ds-guard` reports it as `info`, so it never fails a build. Unlike
`SegmentedControl`, which was deleted because `SegmentedNav` already covered the
ground, this reads as a gap rather than dead surface: its sibling `TextField` is
used, `TextSurface` now covers the window-framed case, and a labelled multi-line
field simply has nowhere in the apps yet. The decision is whether the apps grow
one or the design system drops it, and neither is urgent.

### Repo — nothing would catch a class that stops reaching an element

The tag row on the homepage lost its base class in #167 and stacked instead of
scrolling for as long as that sat on main. Every declaration was still in the
built stylesheet; what changed was which classes reached the element, and the
check in front of it compared declarations. `pnpm -r test` could not see it
either: Vitest resolves a CSS-module class name but not `composes`, so
`styles.rowTags` is one class in a test and two in a browser, and #178's guard
has to read the stylesheet as text to say anything at all.

What did catch it, after the fact, was an element-by-element computed-style diff
between two commits, driven through Playwright against two dev servers: six blog
pages, about 1900 elements, every property that a lost class would change. It
found the one regression and confirmed nothing else in the split had moved. That
script was written for the occasion and then deleted, because there is nowhere in
the repo for it to live.

This is the same missing layer the `--desktop-icon-cell-height` item below wants,
and the two should be solved together: both need a real browser, a rendered page
and a computed value. Playwright is already a dependency, used by
`render-cv-pdf.mjs`, so what is missing is a place to put a suite and a decision
about what it guards.

### Design system — nothing catches a drifted `--desktop-icon-cell-height`

The icon field's grid cell is a `calc()` over `--tile-lg`, `--space-s` and the
`body-sm` type scale, which is right only while `DesktopIcon` is a tile, one
gap, and a label clamped to two lines. Change any of those — a third label line,
a badge that adds height — and icons overflow their cells with nothing failing.
Vitest runs with `css: false`, so the check has to be a rendered one: a
Storybook play function or a Playwright assertion that an icon's measured height
is no greater than the token. Worth doing whenever a rendered-CSS check exists
for anything else, rather than standing one up for this alone.

### Repo — five Americanisms cannot be enforced inside `.ts`/`.tsx`/`.css`

`cspell` checks an identifier, a CSS property and a comment with the same rule,
and has no way to tell prose from code inside a source file. So `color`,
`center`, `gray`, `license` and `normalize` are deliberately absent from
`flagWords`: banning them would flag `align-items: center`, Mantine's `gray`
token, `String.prototype.normalize` and the MIT License. Prose written in those
files therefore relies on review, and only markdown — where fences and inline
code are separable — gets the full list.

Closing the gap needs a checker that parses TypeScript and walks only comments,
string literals and JSX text. An oxlint rule would be the natural home, but
oxlint has no spelling plugin and adding one is upstream work. A small custom
AST pass over comments and JSX text is the tractable version. Not urgent: the
whole repo was 15 Americanisms when the rule went in, so review has been
holding the line by itself.

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
