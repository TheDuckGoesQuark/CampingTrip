/* Its own module, not `blogPages.ts`: that one reaches every page's content, so
   a component importing the origin from there closes a cycle through `cv.ts`. */

export const SITE = "Jordan's Camp";

/** Not `location.origin`: a `localhost:5173` in CatNav's address bar would break
 *  the illusion, and the CV's PDF is printed against a preview server. */
export const SITE_ORIGIN = "https://jordanscamp.site";

/** A JPEG beside the page's WebP: link unfurlers and `schema.org` readers do not all take WebP. */
export const PORTRAIT = { path: "/images/jordan.jpg", size: 384 } as const;
