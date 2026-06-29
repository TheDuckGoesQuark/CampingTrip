/**
 * Tests for the content script's DOM scraping and button-finding logic.
 *
 * These tests validate the contract between the extension content script
 * and Google Photos DOM structure. They replicate the selector logic from
 * extensions/photobroom/content-script.js so that if the selectors
 * diverge from the DOM, tests fail loudly.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Replicate the core extraction logic from content-script.js
// (These are the exact same selectors/functions — if the content script
// changes its selectors, these tests must be updated to match.)
// ---------------------------------------------------------------------------

interface ScrapedPhoto {
  id: string;
  thumbnailUrl: string;
  ariaLabel: string;
}

function collectVisiblePhotos(photos: Map<string, ScrapedPhoto>) {
  const links = document.querySelectorAll('a[href*="/photo/"]');
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    const match = href.match(/\/photo\/([A-Za-z0-9_-]+)/);
    if (!match) continue;

    const id = match[1]!;
    if (photos.has(id)) continue;

    const thumbnailUrl = upscaleThumbnail(extractThumbnailUrl(link));
    if (!thumbnailUrl) continue;

    const ariaLabel =
      link.getAttribute('aria-label') ||
      link.closest('[aria-label]')?.getAttribute('aria-label') ||
      '';

    photos.set(id, { id, thumbnailUrl, ariaLabel });
  }
}

function extractThumbnailUrl(link: Element): string {
  const bgEl = link.querySelector('[data-latest-bg]');
  const attr = bgEl?.getAttribute('data-latest-bg');
  if (attr) return attr;

  const styled = link.querySelector('[style*="background-image"]');
  const styleStr =
    styled?.getAttribute('style') || bgEl?.getAttribute('style') || '';
  const m = styleStr.match(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/i);
  if (m) return m[1]!;

  const img = link.querySelector('img');
  return img?.getAttribute('src') || '';
}

function upscaleThumbnail(url: string): string {
  if (!url) return '';
  return url.replace(/=w\d+-h\d+/, '=w640-h640');
}

function findButtonByAriaLabel(pattern: RegExp): Element | null {
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

function findButtonByText(pattern: RegExp): Element | null {
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
// Tests
// ---------------------------------------------------------------------------

describe('content script — photo scraping', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('extracts photo ID, thumbnail URL, and aria-label from standard grid', () => {
    document.body.innerHTML = `
      <div class="yDSiEe">
        <a href="/photo/AF1QipNabc123_def" aria-label="Photo – Portrait – 29 Jun 2024, 05:23:03">
          <div data-latest-bg="https://photos.fife.usercontent.google.com/pw/abc123=w81-h177-no?authuser=0"></div>
        </a>
        <a href="/photo/AF1QipNxyz789_ghi" aria-label="Photo – Portrait – 29 Jun 2023, 14:40:53">
          <div data-latest-bg="https://photos.fife.usercontent.google.com/pw/xyz789=w82-h177-no?authuser=0"></div>
        </a>
      </div>
    `;

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    expect(photos.size).toBe(2);

    const first = photos.get('AF1QipNabc123_def');
    expect(first).toBeDefined();
    expect(first!.thumbnailUrl).toContain('photos.fife.usercontent.google.com');
    expect(first!.ariaLabel).toBe('Photo – Portrait – 29 Jun 2024, 05:23:03');

    const second = photos.get('AF1QipNxyz789_ghi');
    expect(second).toBeDefined();
    expect(second!.ariaLabel).toBe('Photo – Portrait – 29 Jun 2023, 14:40:53');
  });

  it('extracts the photo ID from a relative search-scoped href', () => {
    // Real grid hrefs are relative and search-scoped, e.g.
    // ./search/<token>/top/photo/<id>
    document.body.innerHTML = `
      <a href="./search/CgdKdW5lIDI5/top/photo/AF1QipNC8RPNeIKzEWvKOYR" aria-label="Photo – 29 Jun">
        <div data-latest-bg="https://photos.fife.usercontent.google.com/pw/thumb=w81-h177-no"></div>
      </a>
    `;

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    expect(photos.size).toBe(1);
    expect(photos.has('AF1QipNC8RPNeIKzEWvKOYR')).toBe(true);
  });

  it('upscales the grid thumbnail size directive for the swipe UI', () => {
    document.body.innerHTML = `
      <a href="/photo/sized" aria-label="Photo">
        <div data-latest-bg="https://photos.fife.usercontent.google.com/pw/thumb=w81-h177-no?authuser=0"></div>
      </a>
    `;

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    const thumb = photos.get('sized')!.thumbnailUrl;
    expect(thumb).toContain('=w640-h640');
    expect(thumb).not.toContain('=w81-h177');
    // trailing flags and query string are preserved
    expect(thumb).toContain('-no?authuser=0');
  });

  it('reads the thumbnail from computed background-image when the attr is absent', () => {
    document.body.innerHTML = `
      <a href="/photo/bgstyle" aria-label="Photo">
        <div style="background-image: url(&quot;https://photos.fife.usercontent.google.com/pw/styled=w100-h100-no&quot;)"></div>
      </a>
    `;

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    expect(photos.size).toBe(1);
    expect(photos.get('bgstyle')!.thumbnailUrl).toContain('styled');
  });

  it('falls back to <img> src when no background-image is present', () => {
    document.body.innerHTML = `
      <a href="/photo/imgcell" aria-label="Photo">
        <img src="https://lh3.googleusercontent.com/legacy=w200-h200" />
      </a>
    `;

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    expect(photos.size).toBe(1);
    expect(photos.get('imgcell')!.thumbnailUrl).toContain('legacy');
  });

  it('extracts aria-label from ancestor element as fallback', () => {
    document.body.innerHTML = `
      <div aria-label="Photos from March 27">
        <a href="/photo/photo456">
          <div data-latest-bg="https://photos.fife.usercontent.google.com/pw/thumb2=w81-h177-no"></div>
        </a>
      </div>
    `;

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    expect(photos.size).toBe(1);
    expect(photos.get('photo456')!.ariaLabel).toBe('Photos from March 27');
  });

  it('deduplicates photos by ID', () => {
    document.body.innerHTML = `
      <a href="/photo/same_id" aria-label="Photo A">
        <div data-latest-bg="https://photos.fife.usercontent.google.com/pw/a=w81-h177-no"></div>
      </a>
      <a href="/photo/same_id" aria-label="Photo A duplicate">
        <div data-latest-bg="https://photos.fife.usercontent.google.com/pw/b=w81-h177-no"></div>
      </a>
    `;

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    expect(photos.size).toBe(1);
    // First occurrence wins
    expect(photos.get('same_id')!.thumbnailUrl).toContain('/a=');
  });

  it('skips cells with no thumbnail (background not yet loaded)', () => {
    document.body.innerHTML = `
      <a href="/photo/no_thumb" aria-label="Something">
        <div class="placeholder"></div>
      </a>
    `;

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    expect(photos.size).toBe(0);
  });

  it('handles Google Photos-style long IDs with hyphens and underscores', () => {
    document.body.innerHTML = `
      <a href="/photo/AF1QipN-x_Y7z-abc_123DEF456" aria-label="Photo">
        <div data-latest-bg="https://photos.fife.usercontent.google.com/pw/long=w81-h177-no"></div>
      </a>
    `;

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    expect(photos.size).toBe(1);
    expect(photos.has('AF1QipN-x_Y7z-abc_123DEF456')).toBe(true);
  });

  it('ignores links to non-photo paths', () => {
    document.body.innerHTML = `
      <a href="/album/abc123">
        <div data-latest-bg="https://photos.fife.usercontent.google.com/pw/album=w81-h177-no"></div>
      </a>
      <a href="/sharing/abc456">
        <div data-latest-bg="https://photos.fife.usercontent.google.com/pw/share=w81-h177-no"></div>
      </a>
    `;

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    expect(photos.size).toBe(0);
  });

  it('handles empty DOM gracefully', () => {
    document.body.innerHTML = '<div></div>';

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    expect(photos.size).toBe(0);
  });
});

describe('content script — button finding', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('findButtonByAriaLabel', () => {
    it('finds a <button> with matching aria-label', () => {
      document.body.innerHTML = `
        <button aria-label="Delete item">X</button>
        <button aria-label="Share">S</button>
      `;

      const btn = findButtonByAriaLabel(/delete/i);
      expect(btn).not.toBeNull();
      expect(btn!.textContent).toBe('X');
    });

    it('finds [role="button"] with matching aria-label', () => {
      document.body.innerHTML = `
        <div role="button" aria-label="Move to trash" tabindex="0">Trash</div>
      `;

      const btn = findButtonByAriaLabel(/move to trash/i);
      expect(btn).not.toBeNull();
      expect(btn!.textContent).toBe('Trash');
    });

    it('finds [data-tooltip] with matching aria-label', () => {
      document.body.innerHTML = `
        <div data-tooltip="Delete" aria-label="Delete" tabindex="0">🗑</div>
      `;

      const btn = findButtonByAriaLabel(/delete/i);
      expect(btn).not.toBeNull();
    });

    it('returns null when no button matches', () => {
      document.body.innerHTML = `
        <button aria-label="Edit">E</button>
        <button aria-label="Share">S</button>
      `;

      const btn = findButtonByAriaLabel(/delete|move to trash|remove/i);
      expect(btn).toBeNull();
    });

    it('matches case-insensitively', () => {
      document.body.innerHTML = `
        <button aria-label="DELETE ITEM">X</button>
      `;

      const btn = findButtonByAriaLabel(/delete/i);
      expect(btn).not.toBeNull();
    });

    it('prioritises <button> over [role="button"]', () => {
      document.body.innerHTML = `
        <button aria-label="Delete">Button Delete</button>
        <div role="button" aria-label="Delete">Role Delete</div>
      `;

      const btn = findButtonByAriaLabel(/delete/i);
      expect(btn).not.toBeNull();
      // <button> selectors are checked first
      expect(btn!.textContent).toBe('Button Delete');
    });
  });

  describe('findButtonByText', () => {
    it('finds a <button> by text content', () => {
      document.body.innerHTML = `
        <div class="dialog">
          <button>Cancel</button>
          <button>Move to trash</button>
        </div>
      `;

      const btn = findButtonByText(/move to trash/i);
      expect(btn).not.toBeNull();
      expect(btn!.textContent).toBe('Move to trash');
    });

    it('finds [role="button"] by text content', () => {
      document.body.innerHTML = `
        <div class="dialog">
          <div role="button">Cancel</div>
          <div role="button">Delete</div>
        </div>
      `;

      const btn = findButtonByText(/delete/i);
      expect(btn).not.toBeNull();
      expect(btn!.textContent).toBe('Delete');
    });

    it('finds [data-mdc-dialog-action] by text content', () => {
      document.body.innerHTML = `
        <button data-mdc-dialog-action="cancel">Cancel</button>
        <button data-mdc-dialog-action="accept">Move to trash</button>
      `;

      const btn = findButtonByText(/move to trash/i);
      expect(btn).not.toBeNull();
    });

    it('returns null when no button text matches', () => {
      document.body.innerHTML = `
        <button>Cancel</button>
        <button>OK</button>
      `;

      const btn = findButtonByText(/move to trash|delete/i);
      expect(btn).toBeNull();
    });

    it('handles buttons with nested text nodes', () => {
      document.body.innerHTML = `
        <button><span>Move to </span><span>trash</span></button>
      `;

      // textContent joins all child text nodes
      const btn = findButtonByText(/move to trash/i);
      expect(btn).not.toBeNull();
    });
  });
});

describe('content script — realistic Google Photos HTML', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('scrapes a realistic Google Photos search result grid', () => {
    // Mirrors the real DOM observed on photos.google.com/search/<date>:
    // <a class="p137Zd" href="./search/<token>/top/photo/<id>" aria-label="…">
    //   <div class="RY3tic" data-latest-bg="<thumb url>" style="background-image:…">
    // Class names are obfuscated — we rely only on href, data-latest-bg, aria-label.
    document.body.innerHTML = `
      <div class="yDSiEe" role="list">
        <a class="p137Zd" tabindex="0"
           aria-label="Photo – Portrait – 27 Mar 2024, 05:23:03"
           href="./search/CgdNYXJjaCAyNw/top/photo/AF1QipNAAAAAAAAAAAAAAAAAAAAAAAAAAAA">
          <div class="RY3tic" style="opacity: 1; background-image: url(&quot;x&quot;)"
               data-latest-bg="https://photos.fife.usercontent.google.com/pw/photo1=w81-h177-no?authuser=0"></div>
        </a>
        <a class="p137Zd" tabindex="0"
           aria-label="Photo – Portrait – 27 Mar 2023, 14:40:53"
           href="./search/CgdNYXJjaCAyNw/top/photo/AF1QipNBBBBBBBBBBBBBBBBBBBBBBBBBBBBB">
          <div class="RY3tic" data-latest-bg="https://photos.fife.usercontent.google.com/pw/photo2=w82-h177-no?authuser=0"></div>
        </a>
        <a class="p137Zd" tabindex="0"
           aria-label="Photo taken at Edinburgh Castle – 27 Mar 2022, 20:14:21"
           href="./search/CgdNYXJjaCAyNw/top/photo/AF1QipNCCCCCCCCCCCCCCCCCCCCCCCCCCCCC">
          <div class="RY3tic" data-latest-bg="https://photos.fife.usercontent.google.com/pw/photo3=w108-h192-no?authuser=0"></div>
        </a>
      </div>
    `;

    const photos = new Map<string, ScrapedPhoto>();
    collectVisiblePhotos(photos);

    expect(photos.size).toBe(3);

    const photo1 = photos.get('AF1QipNAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    expect(photo1).toBeDefined();
    expect(photo1!.thumbnailUrl).toContain('photo1');
    expect(photo1!.thumbnailUrl).toContain('=w640-h640');
    expect(photo1!.ariaLabel).toBe('Photo – Portrait – 27 Mar 2024, 05:23:03');

    const photo2 = photos.get('AF1QipNBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
    expect(photo2).toBeDefined();
    expect(photo2!.ariaLabel).toContain('27 Mar 2023');

    const photo3 = photos.get('AF1QipNCCCCCCCCCCCCCCCCCCCCCCCCCCCCC');
    expect(photo3).toBeDefined();
    expect(photo3!.ariaLabel).toContain('Edinburgh Castle');
  });

  it('finds the trash button in a realistic en-GB lightbox toolbar', () => {
    // Real toolbar observed on photos.google.com (en-GB): the trash control is
    // a <button aria-label="Move to bin"> — NOT "Delete"/"Move to trash". The
    // sidebar "Bin" is an <a role="tab">, so it must not be matched.
    document.body.innerHTML = `
      <a role="tab" aria-label="Bin">bin</a>
      <div role="toolbar">
        <button aria-label="Share"><span>share</span></button>
        <button aria-label="Edit"><span>edit</span></button>
        <button aria-label="Open info"><span>info</span></button>
        <button aria-label="Favourite"><span>star</span></button>
        <button aria-label="Move to bin"><span>delete</span></button>
        <button aria-label="More options"><span>more_vert</span></button>
      </div>
    `;

    const deleteBtn = findButtonByAriaLabel(/move to (bin|trash)|delete|remove/i);
    expect(deleteBtn).not.toBeNull();
    expect(deleteBtn!.getAttribute('aria-label')).toBe('Move to bin');
    // The sidebar "Bin" tab is an <a role="tab">, so it is not a candidate.
    expect(deleteBtn!.tagName.toLowerCase()).toBe('button');
  });

  it('finds confirmation dialog button in realistic trash dialog', () => {
    document.body.innerHTML = `
      <div class="VfPpkd-P5QLlc" role="alertdialog" aria-label="Move to trash?">
        <div class="VfPpkd-cnG4Wd">
          <h2>Move to trash?</h2>
          <p>This item will be in your trash for 60 days before it's permanently deleted.</p>
        </div>
        <div class="VfPpkd-T0kwCb">
          <button class="VfPpkd-LgbsSe" data-mdc-dialog-action="cancel">
            Cancel
          </button>
          <button class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ" data-mdc-dialog-action="accept">
            Move to trash
          </button>
        </div>
      </div>
    `;

    const confirmBtn = findButtonByText(/move to trash|delete/i);
    expect(confirmBtn).not.toBeNull();
    expect(confirmBtn!.textContent).toContain('Move to trash');
    // Confirm it doesn't match the Cancel button (which would be bad)
    expect(confirmBtn!.textContent).not.toContain('Cancel');
  });
});
