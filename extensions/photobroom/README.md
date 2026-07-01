# PhotoBroom (Chrome extension)

Sweep through Google Photos search results with your keyboard and move the ones
you don't want to the bin — fast, and nothing is deleted until you confirm.

Google Photos has no bulk "delete everything from this search", and its API
can't delete photos at all, so PhotoBroom drives the Google Photos web UI
directly: it injects an **in-page overlay** onto `photos.google.com` (in a shadow
root), reads the results grid, and uses Google's own multi-select + "Move to bin".

## Architecture

Everything runs in the browser, on the Google Photos tab — there's no web-app ↔
extension messaging, no service worker, no backend.

```
photos.google.com tab
  └─ overlay.js (content script)
       ├─ Overlay / phases  — the panel UI (React, in a shadow root)
       ├─ usePhotoSweep     — flow orchestration + reviewed-photo memory
       ├─ sweepMachine      — the pure state machine
       └─ gphotos           — reads the grid, scroll-selects, clicks "Move to bin"
```

- Source lives in [`apps/photobroom/src/overlay/`](../../apps/photobroom/src/overlay).
- `overlay.js` is a **build artifact** (git-ignored), produced by
  `apps/photobroom/vite.overlay.config.ts`.

## Install (load unpacked)

```bash
pnpm install
pnpm --filter photobroom build:overlay   # builds overlay.js into this folder
```

Then in `chrome://extensions`: enable **Developer mode** → **Load unpacked** →
select this `extensions/photobroom` folder. Re-run the build and hit **reload** ↻
after pulling changes.

## Use

Open a search/date in Google Photos → the **🧹 PhotoBroom** panel (bottom-right)
→ **Sweep this search** → triage with the arrow keys (← bin · ↑ skip · → keep ·
⌫ undo) → **Review** → **Move to bin**. Binned photos sit in Google's bin for 60
days. The install/usage guide also lives on the landing page,
[photobroom.jordanscamp.site](https://photobroom.jordanscamp.site).

> Not on the Chrome Web Store — automating another site's UI is against Google's
> ToS, so this is a personal, load-unpacked tool.
