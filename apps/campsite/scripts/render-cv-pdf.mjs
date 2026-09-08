// Prints dist/blog/cv.html to dist/cv.pdf, so the document and the page cannot
// disagree. Runs after `build`, as its own step: it needs a Chromium.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { chromium } from "playwright";
import { preview } from "vite";

import { cv, CV_PATH, CV_PDF_PATH } from "../dist-ssr/entry.js";

const DIST = "dist";

const collapse = (text) => text.replaceAll(/\s+/g, " ").trim();

async function textOf(pdf) {
  const document = await getDocument({ data: new Uint8Array(pdf) }).promise;
  const pages = Array.from({ length: document.numPages }, (_, i) => document.getPage(i + 1));
  const contents = await Promise.all(pages.map((page) => page.then((p) => p.getTextContent())));
  return collapse(contents.flatMap((content) => content.items.map((item) => item.str)).join(" "));
}

/** A print stylesheet change can hide the reader; fail here, not on someone's desk. */
async function check(pdf) {
  const text = await textOf(pdf);
  const [first] = cv.experience;
  for (const expected of [cv.name, cv.headline, first.org, first.title]) {
    if (!text.includes(collapse(expected))) {
      throw new Error(`${CV_PDF_PATH} does not contain "${expected}"`);
    }
  }
}

// Vite's preview server, not file://, so the page's absolute asset URLs resolve.
const server = await preview({
  configFile: false,
  logLevel: "silent",
  build: { outDir: DIST },
  preview: { open: false, strictPort: false },
});
const origin = server.resolvedUrls.local[0];

const browser = await chromium.launch();
try {
  // Scripts off: the reader is what renders, and the tent never boots.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const url = new URL(CV_PATH, origin).href;
  const response = await page.goto(url, { waitUntil: "networkidle" });
  if (!response?.ok()) throw new Error(`${url} answered ${response?.status() ?? "nothing"}`);

  const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  await check(pdf);
  writeFileSync(join(DIST, CV_PDF_PATH), pdf);
  console.log(`rendered ${CV_PDF_PATH} (${pdf.byteLength} bytes)`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
