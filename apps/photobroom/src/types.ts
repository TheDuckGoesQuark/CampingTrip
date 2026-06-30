/** A photo read from the Google Photos grid by the overlay. */
export interface ScrapedPhoto {
  /** Google Photos media item ID (from the cell's /photo/ID link). */
  id: string;
  /**
   * Thumbnail URL — Google's usercontent URL straight from the grid (the
   * overlay runs on photos.google.com, so it loads it directly; no inlining).
   */
  thumbnailUrl: string;
  /** aria-label text from the DOM — typically contains the date/description. */
  ariaLabel: string;
}

/** User's decision for a photo during the sweep. */
export type Decision = 'keep' | 'trash' | 'skip';
