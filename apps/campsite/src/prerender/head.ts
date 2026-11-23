import type { PageMeta, PersonMeta } from "../data/blogPages";
import { PORTRAIT, SITE, SITE_ORIGIN } from "../data/site";

export const ORIGIN = SITE_ORIGIN;
export const FEED_PATH = "/feed.xml";

const AUTHOR = "Jordan Mackie";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// One `@id` on every page that describes him, so a reader of two pages finds one person.
const PERSON_ID = `${ORIGIN}/#person`;
const WEBSITE_ID = `${ORIGIN}/#website`;

function personLd(person: PersonMeta, url: string, description?: string): object {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: person.name,
    jobTitle: person.jobTitle,
    description,
    url,
    image: `${ORIGIN}${person.image}`,
    sameAs: person.sameAs,
    email: person.email,
    address: person.address,
    knowsAbout: person.knowsAbout,
  };
}

function jsonLd(meta: PageMeta, url: string): object {
  const author = { "@type": "Person", "@id": PERSON_ID, name: AUTHOR, url: ORIGIN };
  switch (meta.kind) {
    case "article":
      return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: meta.title,
        description: meta.description,
        datePublished: meta.published,
        url,
        author,
      };
    case "profile":
      // `dateModified` belongs to the page, not the person, hence the wrapper.
      return {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        dateModified: meta.person.dateModified,
        url,
        mainEntity: personLd(meta.person, url, meta.description),
      };
    case "website":
      if (meta.owner) {
        return {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": WEBSITE_ID,
              name: SITE,
              alternateName: meta.owner.name,
              url,
              author: { "@id": PERSON_ID },
            },
            {
              "@type": "WebPage",
              name: meta.title,
              description: meta.description,
              url,
              isPartOf: { "@id": WEBSITE_ID },
              mainEntity: { "@id": PERSON_ID },
            },
            personLd(meta.owner, url),
          ],
        };
      }
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: meta.title,
        description: meta.description,
        url,
        author,
      };
  }
}

export function headTags(meta: PageMeta, path: string): string {
  const url = `${ORIGIN}${path}`;
  const fullTitle = meta.title === SITE || path === "/" ? meta.title : `${meta.title} · ${SITE}`;
  const title = escapeHtml(fullTitle);
  const description = escapeHtml(meta.description);
  const image = `${ORIGIN}${PORTRAIT.path}`;
  // `<` cannot appear inside a script element, even in a JSON string.
  const jsonLdText = JSON.stringify(jsonLd(meta, url)).replace(/</g, "\\u003c");

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="author" content="${AUTHOR}" />`,
    `<link rel="canonical" href="${url}" />`,
    ...(meta.unlisted ? [`<meta name="robots" content="noindex" />`] : []),
    `<link rel="alternate" type="application/atom+xml" title="${escapeHtml(AUTHOR)}" href="${ORIGIN}${FEED_PATH}" />`,
    ...(meta.alternate
      ? [
          `<link rel="alternate" type="${escapeHtml(meta.alternate.type)}" href="${ORIGIN}${meta.alternate.path}" />`,
        ]
      : []),
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="${meta.kind}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="${PORTRAIT.size}" />`,
    `<meta property="og:image:height" content="${PORTRAIT.size}" />`,
    `<meta property="og:image:alt" content="${AUTHOR}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<script type="application/ld+json">${jsonLdText}</script>`,
  ].join("\n    ");
}
