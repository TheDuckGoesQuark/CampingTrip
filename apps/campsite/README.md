# Campsite

The homepage at [jordanscamp.site](https://jordanscamp.site) — a cosy 3D camping scene. You're sitting inside a tent on a rainy night with a lantern overhead, a cat strolling past, a campfire crackling outside, and a laptop showing projects.

## Running locally

```bash
pnpm --filter campsite dev
```

## Tech stack

- React + TypeScript + Vite
- React Three Fiber / drei — 3D scene rendering
- GSAP — animation timelines
- Zustand — state management
- Web Audio API — synthesised campfire and typing sounds
- Howler — the recorded ambience beds

## Audio: two preferences and a level

Sound is split by how intrusive it is, and the split is load-bearing for anyone
adding a new noise:

- `soundEnabled` (default **on**) — one-shots fired by something the visitor
  just did: laptop bleeps, MIDI notes, guitar, the cat, page flips. Everything
  in `src/audio/soundEffects.ts` self-gates on it.
- `ambienceEnabled` (default **off**) — the looping beds and the campfire.
  A continuous noise is something you consent to rather than something you
  triggered, so it needs an explicit yes: either the scene control, or the
  welcome screen's "full experience".
- `volume` (default **1**) — how loud all of it is. The two flags choose what
  plays; this scales whatever does. Reachable from the tent's gear panel and
  from the CatOS menu bar, because the takeover covers the gear panel.

### What a new sound has to do about the level

Nothing, if it is wired to the right output. There are two, because the level
has to reach two mixers:

| Kind of source           | Wire it to                                                                        | Why                                                                                                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web Audio (synthesised)  | `getMasterBus()` from `src/audio/masterVolume.ts`, in place of `ac.destination`   | One gain node in front of the destination, ramped over 20ms so a change mid-note does not click                                                                                                |
| Howler (a recorded file) | call `syncHowlerVolume()` from `src/audio/howlerBus.ts` before the first `play()` | Howler mixes in its own context; its global volume multiplies every Howl on top of that Howl's own gain, so a bed keeps its place in the day/night mix and a fade in flight still lands scaled |

A source wired to `ac.destination` plays at full volume with the fader at zero,
which reads as a broken control rather than as a missed one.

Each looping sound has exactly one owning component, which starts it and stops
it from the same effect. `CampfireLoadingScreen` owns the campfire and
`AmbienceAudio` owns the two beds. Starting a loop from one place and stopping
it from another is how a sound outlives the thing it belongs to: a stop reachable
only down the happy path leaves the loop running whenever the component leaves by
any other route, and nothing is left holding a handle to it.

### The two ambience beds

The scene has weather: `RainSystem` draws rain only at night and clears by day,
so the ambience follows the same rule with two recorded beds — rain on the tent
canvas after dark, birdsong before it. `getNightFactor` already smoothsteps
through dawn and dusk, so driving one bed off it and the other off its
complement crossfades them for free: neither cuts out, and both sit at half gain
mid-dusk.

`AmbienceAudio` is the sole owner of both. It alone may call into
`src/audio/ambienceBeds.ts`, and it alone sets the mix from the day/night arc. A
second caller gets beds at a fixed volume that no longer tracks it, and that
neither the toggle nor the arc can reach.

Neither file is fetched until ambience is switched on, which is why an opt-in
default also keeps 1.7 MB off the critical path. Where the recordings came
from, how the loops were cut, and how to swap one out: [ambience
beds](../../docs/ambience-beds.md).

## The blog without JavaScript

The build writes one HTML file per blog URL into `dist`, rendered by the same
components the CatOS browser uses, so the page reads without running the app.
`scripts/prerender.mjs` does it after `vite build`, from an SSR bundle of
`src/prerender/entry.tsx`; Caddy serves the file when it exists and the SPA
shell otherwise. A browser with JavaScript hides the prerendered `#reader` and
draws the same content inside the tent.

Rules this puts on anything rendered inside the blog window:

- It must render in Node: no `window`, `document` or `localStorage` during
  render. Effects are fine, since a static render never runs them.
- Something interactive goes through `Island` with a fallback that is real
  content (a still, a caption, a sentence), because for a crawler the fallback
  is the whole thing. The module behind it is code-split and never loaded by
  the static render.
- A new kind of page needs a `metaOfBlogPage` case and a `blogUrls()` entry as
  well as its `BlogPage` variant. The test over `blogUrls()` renders every URL,
  which catches a page that exists but cannot be prerendered.
- A post with `draft: true` is shown in CatOS but left out of `blogUrls()` and
  the feed, so nothing outside the tent indexes it.
- The app's global stylesheet may not assume the scene. `src/styles/global.css`
  takes the viewport — `height: 100%`, `overflow: hidden`, no pull-to-refresh —
  only under `html.js`, the class the shell's inline script sets, so a page that
  reaches a browser which never ran it keeps the viewport it was given and
  scrolls. A scrollbar's treatment is per-scroller and opt-in through the design
  system's `scrollbars.module.css`. Chrome with no room for a bar takes `hidden`
  — an icon rail, a window's tab strip, the iPod's song list. A scroller inside
  boxy chrome takes `classic`, the bevelled bar with arrow end caps, so the
  browser's rounded overlay bar does not read as foreign inside a `Window`. A
  surface holding a document takes neither, so a reader can see there is more
  below.

### The CV, and its PDF

`src/data/cv.tsx` is the one source for the CV. It renders as the `cv` page at
`/blog/cv.html` (Caddy also answers `/cv`), whose prerendered head is a
`schema.org/ProfilePage` around a `Person`, and as `dist/cv.pdf`, which
`pnpm --filter campsite build:pdf` prints from the prerendered page with
JavaScript disabled, through the print stylesheet. That is a separate command
from `build` because it needs a Chromium (`pnpm exec playwright install
chromium`); CI and the deploy run it after the build, a local build does not.
The script fails if the PDF's text lacks the name, headline or first role, so a
print stylesheet change cannot ship a blank document. It also fails if that
page clips its own overflow or hides the document scrollbar, since a stylesheet
that strands a scriptless reader at the fold still prints perfectly.

## 3D model credits

All models are used under CC-BY licenses. Attribution is required — please keep these credits intact.

| Model                    | Source                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Stylized Campfire        | [Natalia Campos on Sketchfab](https://sketchfab.com/3d-models/stylized-campfire-3b507b1eb4c142218a4b3baa043e3ed4) |
| Cosy Picnic Area         | [Sketchfab](https://sketchfab.com/3d-models/cosy-picnic-area-0a1fc21d723e454b91314809871e1031)                    |
| Laptop                   | [Sketchfab](https://sketchfab.com/3d-models/laptop-7d870e900889481395b4a575b9fa8c3e)                              |
| Acoustic Guitar          | [Sketchfab](https://sketchfab.com/tags/low-poly-guitar)                                                           |
| Cat Walk                 | [Sketchfab](https://sketchfab.com/tags/cat-walk)                                                                  |
| Shure SM57 Microphone    | [Sketchfab](https://sketchfab.com/3d-models/shure-sm57-dynamic-microphone-ec2dc94e022547beadee622b1ff34a5d)       |
| Moka Pot                 | [Sketchfab](https://sketchfab.com/3d-models/moka-pot-2ca52d750d95471a953fb2c9eb577da6)                            |
| Notepad                  | [Sketchfab](https://sketchfab.com/3d-models/notepadb-0b30d2efe63f41b0a812904b610fe577)                            |
| Focusrite Scarlett Solo  | [Sketchfab](https://sketchfab.com/3d-models/focusrite-scarlett-solo-interface-f09111be4a5c48228c3b898965d62bba)   |
| Akai MPK Mini Controller | [Sketchfab](https://sketchfab.com/3d-models/akai-mpk-mini-midi-controller-89eae01d0547430bb8e10110eaadaa81)       |
