// Served ahead of the shell by `try_files {path} {path}.html /index.html` in infra/Caddyfile.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  blogUrls,
  FEED_PATH,
  feedEntries,
  ORIGIN,
  render,
  renderLanding,
} from "../dist-ssr/entry.js";

const DIST = "dist";
const HEAD_BLOCK = /<!-- prerender:head -->[\s\S]*?<!-- \/prerender:head -->/;
const HTML_SLOT = "<!-- prerender:html -->";

const template = readFileSync(join(DIST, "index.html"), "utf8");
if (!HEAD_BLOCK.test(template) || !template.includes(HTML_SLOT)) {
  throw new Error("dist/index.html is missing the prerender markers; see index.html");
}

function write(path, contents) {
  const file = join(DIST, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

function fill(page) {
  return template.replace(HEAD_BLOCK, page.head).replace(HTML_SLOT, page.html);
}

const escapeXml = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function sitemap(paths) {
  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(`${ORIGIN}${path}`)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function atom(entries) {
  const updated = entries[0] ? `${entries[0].date}T00:00:00Z` : new Date().toISOString();
  const items = entries
    .map(
      (entry) => `  <entry>
    <title>${escapeXml(entry.title)}</title>
    <link href="${escapeXml(`${ORIGIN}${entry.path}`)}" />
    <id>${escapeXml(`${ORIGIN}${entry.path}`)}</id>
    <updated>${entry.date}T00:00:00Z</updated>
    <summary>${escapeXml(entry.summary)}</summary>
    <content type="html">${escapeXml(entry.html)}</content>
  </entry>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Jordan's Camp</title>
  <link href="${ORIGIN}/" />
  <link rel="self" href="${ORIGIN}${FEED_PATH}" />
  <id>${ORIGIN}/</id>
  <updated>${updated}</updated>
  <author><name>Jordan Mackie</name></author>
${items}
</feed>
`;
}

const written = [];
for (const path of blogUrls()) {
  const page = render(path);
  if (!page) throw new Error(`blogUrls() named ${path}, but render() found no page there`);
  write(path, fill(page));
  written.push(path);
}
// The shell itself, last: everything above read the template from it.
write("index.html", fill(renderLanding()));

write("sitemap.xml", sitemap(["/", ...written]));
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);
write(FEED_PATH, atom(feedEntries()));

console.log(`prerendered ${written.length} blog pages, the landing page, sitemap, robots and feed`);
