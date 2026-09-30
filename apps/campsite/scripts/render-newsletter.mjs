// Renders one issue to the three files the send function reads from S3.
// Run by the Newsletter workflow after `vite build --ssr`; see
// infra/newsletter/README.md.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { issueSlugs, renderIssueBySlug } from "../dist-ssr/entry.js";

const [slug] = process.argv.slice(2);
if (!slug) {
  console.error(`Usage: render-newsletter.mjs <slug>\nIssues: ${issueSlugs().join(", ")}`);
  process.exit(2);
}

const rendered = renderIssueBySlug(slug);
if (!rendered) {
  console.error(`No issue is called "${slug}". Issues: ${issueSlugs().join(", ")}`);
  process.exit(1);
}

const dir = join("dist-newsletter", slug);
mkdirSync(dir, { recursive: true });
const { html, text, ...meta } = rendered;
writeFileSync(
  join(dir, "meta.json"),
  JSON.stringify({ ...meta, renderedAt: new Date().toISOString() }, null, 2),
);
writeFileSync(join(dir, "email.html"), html);
writeFileSync(join(dir, "email.txt"), text);
console.log(`rendered "${rendered.subject}"${rendered.draft ? " (draft)" : ""} to ${dir}`);
