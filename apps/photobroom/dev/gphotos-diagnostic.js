/**
 * PhotoBroom multi-select recon — run on a Google Photos SEARCH RESULTS page.
 * Read-only. Run it TWICE:
 *   1) As-is first  → shows how the "Select" checkbox attaches to each cell.
 *   2) Then manually hover a photo and click its select circle to select 1–2
 *      photos, and run again → the "visible buttons" list will now include the
 *      bulk action toolbar (find the move-to-bin / delete one).
 */
(() => {
  console.log("%c=== PhotoBroom multi-select recon ===", "font-weight:bold;font-size:14px");
  console.log("URL:", location.href);

  const links = [...document.querySelectorAll('a[href*="/photo/"]')];
  console.log("photo links:", links.length);

  links.slice(0, 3).forEach((a, i) => {
    const id = (a.getAttribute("href") || "").match(/\/photo\/([A-Za-z0-9_-]+)/)?.[1];

    // Walk up from the anchor to find the nearest container holding a checkbox.
    let node = a;
    let found = null;
    for (let depth = 0; node && depth < 6; depth++, node = node.parentElement) {
      const cb = node.querySelector?.('[role="checkbox"]');
      if (cb) {
        found = {
          depthFromAnchor: depth,
          "checkbox aria-label": cb.getAttribute("aria-label"),
          "aria-checked": cb.getAttribute("aria-checked"),
          containerTag: node.tagName.toLowerCase(),
          containerClass: node.className,
        };
        break;
      }
    }
    console.log(`cell ${i} id=${id}`, found || "(no checkbox found within 6 ancestors)");
  });

  // Run again after selecting photos: the selection toolbar buttons appear here.
  const visibleButtons = [
    ...document.querySelectorAll('button[aria-label], [role="button"][aria-label]'),
  ]
    .filter((b) => b.offsetParent !== null)
    .map((b) => b.getAttribute("aria-label"));
  console.log("%cVisible buttons right now:", "font-weight:bold", visibleButtons);

  // Anything selection/count related (e.g. "3 selected").
  const selectionHints = [...document.querySelectorAll('[aria-label], [role="status"]')]
    .map((e) => e.getAttribute("aria-label") || e.textContent || "")
    .filter((t) => /select|selected|\bitem(s)?\b/i.test(t))
    .slice(0, 10);
  console.log("%cSelection hints:", "font-weight:bold", selectionHints);
})();
