/** A photo scraped from Google Photos by the extension. */
export interface ScrapedPhoto {
  /** Google Photos media item ID (from URL /photo/ID). */
  id: string;
  /**
   * Thumbnail as a data: URL. The extension fetches the bytes from Google's
   * usercontent host (which sets Cross-Origin-Resource-Policy) and inlines
   * them so the web app can render them cross-site.
   */
  thumbnailUrl: string;
  /** aria-label text from the DOM — typically contains date and description. */
  ariaLabel: string;
}

/** User's decision for a photo during the sweep. */
export type Decision = 'keep' | 'trash' | 'skip';

/** Result of a single photo deletion attempt. */
export interface DeleteResult {
  id: string;
  success: boolean;
  error?: string;
}

/** Extension ping response. */
export interface PingResponse {
  ok: boolean;
  version: string;
}

/** Extension fetch response. */
export interface FetchPhotosResponse {
  photos?: ScrapedPhoto[];
  error?: string;
}

/** Extension delete response. */
export interface DeletePhotosResponse {
  deleted: boolean;
  results: DeleteResult[];
  error?: string;
}
