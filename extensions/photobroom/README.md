# PhotoBroom Chrome Extension

A bridge between the [PhotoBroom web app](https://photobroom.jordanscamp.site) and Google Photos. It scrapes search results and automates photo deletion via simulated user actions.

## Architecture

```
PhotoBroom Web App                    Chrome Extension
(photobroom.jordanscamp.site)         (unpacked, runs on photos.google.com)
┌──────────────────────┐              ┌─────────────────────────────┐
│                      │   messages   │ service-worker.js           │
│  useExtension hook ──┼──────────────┼─► routes messages           │
│                      │              │      │                      │
│  Home page           │              │      ▼                      │
│   └─ fetchPhotos()   │              │ content-script.js           │
│                      │              │  (on photos.google.com)     │
│  Sweep page          │              │   ├─ scrapePhotos()         │
│   └─ swipe UI        │              │   │   navigates to search   │
│                      │              │   │   scrolls grid           │
│  Review page         │              │   │   extracts IDs + URLs   │
│   └─ deletePhotos()  │              │   └─ deleteCurrentPhoto()   │
│                      │              │       clicks trash + confirm│
└──────────────────────┘              └─────────────────────────────┘
```

Communication uses Chrome's `externally_connectable` API — the web app sends messages via `chrome.runtime.sendMessage(EXTENSION_ID, ...)`.

## How it works

1. **Scraping**: When the web app requests photos for a date (e.g. "March 27"), the extension:
   - Opens/finds a Google Photos tab
   - Navigates to `photos.google.com/search/March+27`
   - Scrolls through the virtual-scrolling grid, collecting photo IDs, thumbnail URLs, and aria-labels
   - Returns the results to the web app

2. **Deletion**: When the user confirms their trash selections, the extension:
   - For each photo ID, navigates to `photos.google.com/photo/PHOTO_ID`
   - Finds the delete button via `aria-label` matching
   - Clicks it and confirms the dialog
   - Reports success/failure for each photo

## Install (personal/development use)

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select this directory (`extensions/photobroom/`)
5. Note the **Extension ID** shown on the extension card (e.g. `abcdefghijklmnopqrstuvwxyz123456`)
6. Set the extension ID in the web app:
   - For local dev: create `apps/photobroom/.env.local` with `VITE_EXTENSION_ID=your-id-here`
   - Or edit `apps/photobroom/src/hooks/useExtension.ts` and replace the placeholder

## Message protocol

| Action | Request | Response |
|--------|---------|----------|
| `ping` | `{ action: "ping" }` | `{ ok: true, version: "0.1.0" }` |
| `fetchPhotos` | `{ action: "fetchPhotos", date: "March 27" }` | `{ photos: [{ id, thumbnailUrl, ariaLabel }] }` |
| `deletePhotos` | `{ action: "deletePhotos", ids: ["id1", "id2"] }` | `{ deleted: true, results: [{ id, success, error? }] }` |

## DOM selectors

The content script avoids obfuscated CSS class names. Instead it uses:

- **Photo links**: `a[href*="/photo/"]` — extract photo ID from URL
- **Thumbnails**: `img` inside photo links, or `img[src*="lh3.googleusercontent.com"]`
- **Date info**: `aria-label` attributes on photo elements
- **Delete button**: `button[aria-label]` / `[role="button"][aria-label]` matching `/delete|move to trash/i`
- **Confirm button**: button text matching `/move to trash|delete/i`

These are accessibility-mandated attributes that Google is unlikely to remove.

## Limitations

- **DOM fragility**: Google Photos updates its web app regularly. If scraping or deletion breaks, the `aria-label` patterns in `content-script.js` may need updating.
- **Thumbnail expiry**: Google Photos image URLs expire after ~60 minutes. Complete the sweep in a single session.
- **Rate limiting**: Deletion navigates to each photo individually. Expect ~2-3 seconds per photo.
- **Trash, not delete**: Photos are moved to Google Photos trash (recoverable for 60 days), not permanently deleted.
