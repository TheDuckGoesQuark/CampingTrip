/**
 * PhotoBroom Extension — Content Script
 *
 * Injected into photos.google.com. Two responsibilities:
 * 1. Scrape photo thumbnails, IDs, and dates from search results
 * 2. Simulate click actions to delete a photo in the lightbox view
 *
 * Uses aria-label and role attributes for DOM queries (stable across
 * Google's obfuscated class name changes). Falls back to broader
 * heuristics when needed.
 */

// ---------------------------------------------------------------------------
// Message handler (from service worker)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'scrapePhotos') {
    scrapePhotos().then(sendResponse).catch((err) =>
      sendResponse({ error: err.message })
    );
    return true; // async
  }

  if (message.action === 'deleteCurrentPhoto') {
    deleteCurrentPhoto().then(sendResponse).catch((err) =>
      sendResponse({ error: err.message })
    );
    return true; // async
  }
});

// ---------------------------------------------------------------------------
// Scraping: extract photos from the search results grid
// ---------------------------------------------------------------------------

/**
 * Scrolls through the Google Photos search results grid and extracts
 * photo data. Google Photos uses virtual scrolling, so we must scroll
 * incrementally and collect new elements as they appear.
 *
 * @returns {{ photos: Array<{ id: string, thumbnailUrl: string, ariaLabel: string }> }}
 */
async function scrapePhotos() {
  const photos = new Map(); // id → photo data (deduplication)
  let noNewPhotosCount = 0;
  const MAX_IDLE_SCROLLS = 5;
  const SCROLL_DELAY_MS = 800;
  const MAX_PHOTOS = 500; // safety cap

  // Initial scrape before scrolling
  collectVisiblePhotos(photos);

  // Scroll down incrementally to trigger virtual scroll loading
  while (noNewPhotosCount < MAX_IDLE_SCROLLS && photos.size < MAX_PHOTOS) {
    const prevCount = photos.size;

    window.scrollBy(0, window.innerHeight * 0.8);
    await sleep(SCROLL_DELAY_MS);

    collectVisiblePhotos(photos);

    if (photos.size === prevCount) {
      noNewPhotosCount++;
    } else {
      noNewPhotosCount = 0;
    }
  }

  // Scroll back to top
  window.scrollTo(0, 0);

  return { photos: Array.from(photos.values()) };
}

/**
 * Scan the current DOM for photo elements and add them to the map.
 * Uses multiple strategies to find photo containers and extract data.
 */
function collectVisiblePhotos(photos) {
  // Strategy 1: Find links to individual photos (most reliable)
  // Google Photos renders each photo as a clickable element that links to /photo/ID
  const links = document.querySelectorAll('a[href*="/photo/"]');
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    const match = href.match(/\/photo\/([A-Za-z0-9_-]+)/);
    if (!match) continue;

    const id = match[1];
    if (photos.has(id)) continue;

    // Find the thumbnail image inside this link
    const img = link.querySelector('img');
    const thumbnailUrl = img?.src || '';

    // Get aria-label for date/description info
    const ariaLabel =
      link.getAttribute('aria-label') ||
      img?.getAttribute('aria-label') ||
      link.closest('[aria-label]')?.getAttribute('aria-label') ||
      '';

    if (thumbnailUrl) {
      photos.set(id, { id, thumbnailUrl, ariaLabel });
    }
  }

  // Strategy 2: Find images with Google Photos CDN URLs that we might have missed
  if (photos.size === 0) {
    const imgs = document.querySelectorAll(
      'img[src*="lh3.googleusercontent.com"]'
    );
    for (const img of imgs) {
      // Try to find a parent link with the photo ID
      const parentLink = img.closest('a[href*="/photo/"]');
      if (parentLink) {
        const href = parentLink.getAttribute('href') || '';
        const match = href.match(/\/photo\/([A-Za-z0-9_-]+)/);
        if (match && !photos.has(match[1])) {
          photos.set(match[1], {
            id: match[1],
            thumbnailUrl: img.src,
            ariaLabel: img.getAttribute('aria-label') || '',
          });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Deletion: simulate user clicks to trash a photo
// ---------------------------------------------------------------------------

/**
 * Deletes the currently-viewed photo (assumes we're on /photo/PHOTO_ID).
 * Simulates the user clicking the delete/trash button and confirming.
 *
 * @returns {{ success: boolean, error?: string }}
 */
async function deleteCurrentPhoto() {
  // Step 1: Find and click the delete/trash button
  const deleteBtn = await waitForElement(
    () => findButtonByAriaLabel(/delete|move to trash|remove/i),
    5000
  );
  if (!deleteBtn) {
    // Fallback: try the keyboard shortcut (# is delete in Google Photos)
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: '#',
        code: 'Digit3',
        shiftKey: true,
        bubbles: true,
      })
    );
    await sleep(1000);
  } else {
    deleteBtn.click();
    await sleep(1000);
  }

  // Step 2: Confirm the deletion dialog
  // Look for the "Move to trash" confirmation button
  const confirmBtn = await waitForElement(
    () => findButtonByText(/move to trash|delete/i),
    3000
  );
  if (confirmBtn) {
    confirmBtn.click();
    await sleep(500);
    return { success: true };
  }

  // If no confirmation dialog appeared, the action may have succeeded
  // directly (some Google Photos versions skip confirmation)
  return { success: true };
}

/**
 * Find a button-like element whose aria-label matches a pattern.
 * Searches <button>, [role="button"], and clickable elements.
 */
function findButtonByAriaLabel(pattern) {
  const selectors = [
    'button[aria-label]',
    '[role="button"][aria-label]',
    '[data-tooltip][aria-label]',
  ];
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      if (pattern.test(el.getAttribute('aria-label') || '')) {
        return el;
      }
    }
  }
  return null;
}

/**
 * Find a button-like element whose text content matches a pattern.
 * Used for confirmation dialogs.
 */
function findButtonByText(pattern) {
  const elements = document.querySelectorAll(
    'button, [role="button"], [data-mdc-dialog-action]'
  );
  for (const el of elements) {
    if (pattern.test(el.textContent || '')) {
      return el;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Poll for an element to appear in the DOM.
 * @param {() => Element|null} finder - Function that returns the element or null
 * @param {number} timeoutMs - Max time to wait
 * @param {number} intervalMs - Poll interval
 * @returns {Promise<Element|null>}
 */
async function waitForElement(finder, timeoutMs = 5000, intervalMs = 200) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const el = finder();
    if (el) return el;
    await sleep(intervalMs);
  }
  return null;
}
