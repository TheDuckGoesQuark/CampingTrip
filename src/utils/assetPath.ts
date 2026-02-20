const BASE = import.meta.env.BASE_URL;

/** Prefix a public-directory asset path with the Vite base URL. */
export function asset(path: string): string {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE}${clean}`;
}
