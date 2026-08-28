# PhotoBroom screenshots

Images here with these exact names — the PhotoBroom blog page
(`/blog/photobroom`, "See it in action") shows them in order, and falls back to
a "Screenshot coming soon" placeholder until each file exists:

| File           | Stage shown                                                         |
| -------------- | ------------------------------------------------------------------- |
| `sweep.webp`   | The PhotoBroom panel on a Google Photos search, "Sweep this search" |
| `review.webp`  | The big keyboard review view (a photo + Bin/Skip/Keep buttons)      |
| `confirm.webp` | The review summary with the "Move N to bin" button                  |
| `done.webp`    | The completion / "Sweep another" screen                             |

WebP at quality 80 — roughly a third the size of the equivalent JPEG on these
screenshots. Resize to ~1600px on the long edge:

```
npx sharp-cli -i shot.png -o . -f webp -q 80 --width 1600
```

Served statically from `/images/screenshots/<name>.webp`.
