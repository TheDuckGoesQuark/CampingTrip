/**
 * PhotoBroom Extension — Service Worker (Background)
 *
 * Routes messages between the PhotoBroom web app (via externally_connectable)
 * and the content script running on photos.google.com.
 *
 * Message protocol:
 *   { action: "ping" }                          → { ok: true }
 *   { action: "fetchPhotos", date: "March 27" } → { photos: [...] }
 *   { action: "deletePhotos", ids: [...] }      → { deleted: true, results: [...] }
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find or open a Google Photos tab, returning its tab ID. */
async function getOrCreateGPhotosTab() {
  const tabs = await chrome.tabs.query({ url: 'https://photos.google.com/*' });
  if (tabs.length > 0) {
    return tabs[0].id;
  }
  const tab = await chrome.tabs.create({
    url: 'https://photos.google.com/',
    active: false,
  });
  // Wait for the tab to finish loading
  await new Promise((resolve) => {
    const listener = (tabId, info) => {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
  return tab.id;
}

/** Send a message to the content script on a specific tab and wait for a reply. */
function sendToContentScript(tabId, message) {
  return chrome.tabs.sendMessage(tabId, message);
}

/**
 * Navigate a tab to a URL and wait for the page to finish loading.
 * Returns when the tab's status becomes 'complete'.
 */
function navigateAndWait(tabId, url) {
  return new Promise((resolve) => {
    const listener = (updatedTabId, info) => {
      if (updatedTabId === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.update(tabId, { url });
  });
}

// ---------------------------------------------------------------------------
// External message handler (from PhotoBroom web app)
// ---------------------------------------------------------------------------

chrome.runtime.onMessageExternal.addListener(
  (message, _sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    // Return true to indicate async sendResponse
    return true;
  }
);

async function handleMessage(message) {
  const { action } = message;

  if (action === 'ping') {
    return { ok: true, version: chrome.runtime.getManifest().version };
  }

  if (action === 'fetchPhotos') {
    const { date } = message;
    if (!date) return { error: 'Missing date parameter' };

    const tabId = await getOrCreateGPhotosTab();
    const searchUrl = `https://photos.google.com/search/${encodeURIComponent(date)}`;
    await navigateAndWait(tabId, searchUrl);

    // Give the SPA a moment to render search results after page load
    await new Promise((r) => setTimeout(r, 2000));

    const result = await sendToContentScript(tabId, {
      action: 'scrapePhotos',
    });
    return result;
  }

  if (action === 'deletePhotos') {
    const { ids } = message;
    if (!ids || !ids.length) return { error: 'Missing ids parameter' };

    const tabId = await getOrCreateGPhotosTab();
    const results = [];

    for (const id of ids) {
      try {
        // Navigate to the individual photo
        const photoUrl = `https://photos.google.com/photo/${id}`;
        await navigateAndWait(tabId, photoUrl);
        await new Promise((r) => setTimeout(r, 1500));

        const result = await sendToContentScript(tabId, {
          action: 'deleteCurrentPhoto',
        });
        results.push({ id, ...result });
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }

    return { deleted: true, results };
  }

  return { error: `Unknown action: ${action}` };
}
