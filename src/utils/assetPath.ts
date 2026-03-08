const BASE = import.meta.env.BASE_URL;

/** Prefix a public-directory asset path with the Vite base URL. */
export function asset(path: string): string {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE}${clean}`;
}

/** Local Draco decoder path (self-hosted to avoid loading from gstatic.com CDN). */
export const DRACO_PATH = `${BASE}draco/gltf/`;
