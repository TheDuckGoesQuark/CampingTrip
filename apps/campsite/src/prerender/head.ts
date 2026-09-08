import { type PageMeta, SITE } from "../data/blogPages";

export const ORIGIN = "https://jordanscamp.site";
export const FEED_PATH = "/feed.xml";

const AUTHOR = "Jordan Mackie";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function headTags(meta: PageMeta, path: string): string {
  const url = `${ORIGIN}${path}`;
  const fullTitle = meta.title === SITE || path === "/" ? meta.title : `${meta.title} · ${SITE}`;
  const title = escapeHtml(fullTitle);
  const description = escapeHtml(meta.description);
  const jsonLd =
    meta.kind === "article"
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: meta.title,
          description: meta.description,
          datePublished: meta.published,
          url,
          author: { "@type": "Person", name: AUTHOR, url: ORIGIN },
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: meta.title,
          description: meta.description,
          url,
          author: { "@type": "Person", name: AUTHOR, url: ORIGIN },
        };
  // `<` cannot appear inside a script element, even in a JSON string.
  const jsonLdText = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="author" content="${AUTHOR}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" type="application/atom+xml" title="${escapeHtml(AUTHOR)}" href="${ORIGIN}${FEED_PATH}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="${meta.kind}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<script type="application/ld+json">${jsonLdText}</script>`,
  ].join("\n    ");
}
