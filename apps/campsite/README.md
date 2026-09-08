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
- Web Audio API — synthesised rain, campfire, and typing sounds

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
