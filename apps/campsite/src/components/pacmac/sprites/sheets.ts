import { SPRITES, type SpriteKey } from "./manifest";
import { placeholder, type Sheet } from "./placeholders";

export type Sheets = Partial<Record<SpriteKey, Sheet>>;

const KEYS = Object.keys(SPRITES) as SpriteKey[];

export function placeholderSheets(): Sheets {
  const sheets: Sheets = {};
  for (const key of KEYS) {
    const sheet = placeholder(key);
    if (sheet) sheets[key] = sheet;
  }
  return sheets;
}

/**
 * Fetches every supplied PNG, handing each over as it decodes. A file that is
 * missing, or not the size its manifest entry says, leaves the placeholder in
 * place, so a sprite can be dropped in without touching anything else.
 */
export function loadSuppliedSheets(onSheet: (key: SpriteKey, sheet: Sheet) => void): () => void {
  let cancelled = false;
  for (const key of KEYS) {
    const { src, frames, cell } = SPRITES[key];
    const image = new Image();
    image.addEventListener("load", () => {
      if (cancelled) return;
      if (image.naturalWidth !== frames * cell || image.naturalHeight !== cell) {
        console.warn(
          `MacMan: ${src} is ${image.naturalWidth}x${image.naturalHeight}, expected ${frames * cell}x${cell}`,
        );
        return;
      }
      onSheet(key, { image, frames, cell });
    });
    image.src = src;
  }
  return () => {
    cancelled = true;
  };
}
