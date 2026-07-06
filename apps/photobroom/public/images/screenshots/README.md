# Landing-page screenshots

Images here with these exact names — the landing page ("See it in action")
shows them in order, and falls back to a "Screenshot coming soon" placeholder
until each file exists:

| File          | Stage shown                                                         |
| ------------- | ------------------------------------------------------------------- |
| `sweep.jpg`   | The PhotoBroom panel on a Google Photos search, "Sweep this search" |
| `review.jpg`  | The big keyboard review view (a photo + Bin/Skip/Keep buttons)      |
| `confirm.jpg` | The review summary with the "Move N to bin" button                  |
| `done.jpg`    | The completion / "Sweep another" screen                             |

JPEG (photo-heavy screenshots compress far better than PNG). Resize to ~1600px
on the long edge, e.g. with macOS `sips`:

```
sips -Z 1600 shot.png --out tmp.png
sips -s format jpeg -s formatOptions 82 tmp.png --out sweep.jpg
```

Served statically from `/images/screenshots/<name>.jpg`.
