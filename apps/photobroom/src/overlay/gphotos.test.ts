/**
 * Contract tests for the Google Photos page model.
 *
 * These import the REAL functions from gphotos.ts (not a copy) and feed them
 * DOM fixtures that mirror what we observed on photos.google.com (en-GB,
 * 2026-06-29). If Google changes their markup — or we change a selector —
 * these fail loudly, pointing at exactly what broke.
 *
 * Note: the scrolling/clicking routines and visibility filtering need real
 * layout (getClientRects), which jsdom doesn't provide, so they're not covered
 * here. The pure readers + the confirm-button selection logic are.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  idFromAnchor,
  upscale,
  thumbFromAnchor,
  checkboxForAnchor,
  readGrid,
  labelOf,
  pickConfirmButton,
  inspectPage,
  SELECTORS,
} from './gphotos';

/** A grid cell mirroring the real structure: anchor + sibling checkbox. */
function cell(opts: {
  id: string;
  thumb?: string;
  bgStyle?: string;
  label?: string;
  checkbox?: boolean;
  hrefPrefix?: string;
}) {
  const {
    id,
    thumb,
    bgStyle,
    // Real photos each have a distinct timestamp label; the checkbox shares it.
    label = `Photo – Portrait – 29 Jun 2024 · ${id}`,
    checkbox = true,
    hrefPrefix = './search/CgdKdW5lIDI5/top/photo/',
  } = opts;
  const thumbDiv = thumb
    ? `<div data-latest-bg="${thumb}"></div>`
    : bgStyle
      ? `<div style="background-image: url(&quot;${bgStyle}&quot;)"></div>`
      : `<div class="placeholder"></div>`;
  const cb = checkbox ? `<div role="checkbox" aria-label="${label}" aria-checked="false"></div>` : '';
  return `
    <div class="rtIMgb nV0gYe pltLxc">
      <a class="p137Zd" aria-label="${label}" href="${hrefPrefix}${id}">${thumbDiv}</a>
      ${cb}
    </div>`;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('id + thumbnail parsing', () => {
  it('extracts the id from a relative, search-scoped href', () => {
    document.body.innerHTML = cell({ id: 'AF1QipNC8RPNeIKzEWvKOYR', thumb: 'x=w81-h177-no' });
    const a = document.querySelector('a')!;
    expect(idFromAnchor(a)).toBe('AF1QipNC8RPNeIKzEWvKOYR');
  });

  it('handles long ids with hyphens and underscores', () => {
    document.body.innerHTML = cell({ id: 'AF1QipN-x_Y7z-abc_123DEF', thumb: 'x=w81-h177-no' });
    expect(idFromAnchor(document.querySelector('a')!)).toBe('AF1QipN-x_Y7z-abc_123DEF');
  });

  it('returns null for non-photo links', () => {
    document.body.innerHTML = `<a href="/album/abc123"></a>`;
    expect(idFromAnchor(document.querySelector('a')!)).toBeNull();
  });

  it('reads the thumbnail from data-latest-bg', () => {
    const url = 'https://photos.fife.usercontent.google.com/pw/abc=w81-h177-no?authuser=0';
    document.body.innerHTML = cell({ id: 'x', thumb: url });
    expect(thumbFromAnchor(document.querySelector('a')!)).toBe(url);
  });

  it('falls back to an inline background-image when the attr is absent', () => {
    document.body.innerHTML = cell({ id: 'x', bgStyle: 'https://photos.fife.usercontent.google.com/pw/styled=w100-h100-no' });
    expect(thumbFromAnchor(document.querySelector('a')!)).toContain('styled');
  });

  it('upscales the size directive but keeps trailing flags + query', () => {
    expect(upscale('https://h/pw/x=w81-h177-no?authuser=0')).toBe('https://h/pw/x=w640-h640-no?authuser=0');
    expect(upscale('')).toBe('');
    expect(upscale('https://h/pw/x')).toBe('https://h/pw/x'); // no directive → unchanged
  });
});

describe('checkbox association', () => {
  it('finds the sibling select checkbox for a cell', () => {
    document.body.innerHTML = cell({ id: 'x', thumb: 'x=w81-h177-no' });
    const a = document.querySelector('a')!;
    const cb = checkboxForAnchor(a);
    expect(cb).not.toBeNull();
    expect(cb!.getAttribute('role')).toBe('checkbox');
  });

  it('returns null when there is no checkbox (hero/featured cell)', () => {
    document.body.innerHTML = cell({ id: 'x', thumb: 'x=w81-h177-no', checkbox: false });
    expect(checkboxForAnchor(document.querySelector('a')!)).toBeNull();
  });
});

describe('readGrid', () => {
  it('reads id, upscaled thumbnail, and aria-label from a realistic grid', () => {
    document.body.innerHTML =
      cell({ id: 'AAA', thumb: 'https://h/pw/a=w81-h177-no', label: 'Photo – Portrait – 29 Jun 2024, 05:23:03' }) +
      cell({ id: 'BBB', thumb: 'https://h/pw/b=w82-h177-no', label: 'Photo – Landscape – 30 Jun 2022, 19:36:56' });

    const photos = readGrid();
    expect(photos.map((p) => p.id)).toEqual(['AAA', 'BBB']);
    expect(photos[0]!.thumbnailUrl).toContain('=w640-h640');
    expect(photos[0]!.ariaLabel).toBe('Photo – Portrait – 29 Jun 2024, 05:23:03');
  });

  it('skips the featured/hero cell that has no checkbox', () => {
    document.body.innerHTML =
      cell({ id: 'HERO', thumb: 'https://h/pw/hero=w500-h500', checkbox: false }) +
      cell({ id: 'REAL', thumb: 'https://h/pw/real=w81-h177-no' });
    expect(readGrid().map((p) => p.id)).toEqual(['REAL']);
  });

  it('deduplicates by id (first occurrence wins)', () => {
    document.body.innerHTML =
      cell({ id: 'DUP', thumb: 'https://h/pw/first=w81-h177-no' }) +
      cell({ id: 'DUP', thumb: 'https://h/pw/second=w81-h177-no' });
    const photos = readGrid();
    expect(photos).toHaveLength(1);
    expect(photos[0]!.thumbnailUrl).toContain('first');
  });

  it('ignores album/sharing links', () => {
    document.body.innerHTML = `
      <div class="rtIMgb"><a href="/album/abc"><div data-latest-bg="x=w81-h177"></div></a><div role="checkbox"></div></div>
      <div class="rtIMgb"><a href="/sharing/xyz"><div data-latest-bg="y=w81-h177"></div></a><div role="checkbox"></div></div>`;
    expect(readGrid()).toHaveLength(0);
  });
});

describe('pickConfirmButton', () => {
  it('prefers the dialog action button and excludes the toolbar button', () => {
    document.body.innerHTML = `
      <button id="toolbar" aria-label="Move to bin"></button>
      <div role="alertdialog">
        <button id="cancel" data-mdc-dialog-action="cancel">Cancel</button>
        <button id="confirm" data-mdc-dialog-action="ok"><span>Move to bin</span></button>
      </div>`;
    const toolbar = document.getElementById('toolbar') as HTMLElement;
    const candidates = [...document.querySelectorAll(SELECTORS.buttonish)].filter((el) =>
      SELECTORS.confirmLabel.test(labelOf(el))
    ) as HTMLElement[];
    // Cancel doesn't match the confirm label, so it isn't a candidate.
    expect(candidates.map((el) => el.id).sort()).toEqual(['confirm', 'toolbar']);
    expect(pickConfirmButton(candidates, toolbar)?.id).toBe('confirm');
  });

  it('returns null when only the excluded toolbar button matches', () => {
    document.body.innerHTML = `<button id="toolbar" aria-label="Move to bin"></button>`;
    const toolbar = document.getElementById('toolbar') as HTMLElement;
    expect(pickConfirmButton([toolbar], toolbar)).toBeNull();
  });

  it('falls back to any match when none is a dialog action', () => {
    document.body.innerHTML = `<button id="x">Move to bin</button>`;
    const x = document.getElementById('x') as HTMLElement;
    expect(pickConfirmButton([x], null)?.id).toBe('x');
  });
});

describe('inspectPage health check', () => {
  it('reports photo / checkbox / thumbnail coverage', () => {
    document.body.innerHTML =
      cell({ id: 'A', thumb: 'https://h/pw/a=w81-h177' }) +
      cell({ id: 'B', thumb: 'https://h/pw/b=w81-h177', checkbox: false });
    const health = inspectPage();
    expect(health.photoLinks).toBe(2);
    expect(health.withCheckbox).toBe(1);
    expect(health.withThumb).toBe(2);
  });
});
