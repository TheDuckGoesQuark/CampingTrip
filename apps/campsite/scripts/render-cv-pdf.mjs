// Prints dist/blog/cv.html to dist/cv.pdf, so the document and the page cannot
// disagree. Runs after `build`, as its own step: it needs a Chromium.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { chromium } from "playwright";
import { preview } from "vite";

import { CONTACT_HEADING, cv, CV_PATH, CV_PDF_PATH } from "../dist-ssr/entry.js";

const DIST = "dist";

const collapse = (text) => text.replaceAll(/\s+/g, " ").trim();

async function textOf(pdf) {
  const document = await getDocument({ data: new Uint8Array(pdf) }).promise;
  const pages = Array.from({ length: document.numPages }, (_, i) => document.getPage(i + 1));
  const contents = await Promise.all(pages.map((page) => page.then((p) => p.getTextContent())));
  return collapse(contents.flatMap((content) => content.items.map((item) => item.str)).join(" "));
}

/**
 * Without scripts the reader is a document, not a scene, so the viewport is its
 * own: it scrolls, and it says so. A stylesheet that locks `overflow` or hides
 * the bar leaves a reader stranded at the fold, which prints fine and so would
 * otherwise reach a stranger's browser unnoticed.
 */
async function checkReaderScrolls(page) {
  const scroller = await page.evaluate(() => {
    const html = document.documentElement;
    const rules = [...document.styleSheets].flatMap((sheet) => {
      try {
        return [...sheet.cssRules];
      } catch {
        return [];
      }
    });
    const hidden = rules.some((rule) => {
      const selector = rule.selectorText;
      if (!selector?.includes("::-webkit-scrollbar")) return false;
      const target = selector.replace(/::-webkit-scrollbar.*$/, "").trim();
      return target === "" || html.matches(target) || document.body.matches(target);
    });
    const style = getComputedStyle(html);
    return {
      clipped: style.overflowY === "hidden",
      barless: hidden || style.scrollbarWidth === "none",
    };
  });
  if (scroller.clipped) throw new Error(`${CV_PATH} clips its own overflow without scripts`);
  if (scroller.barless) throw new Error(`${CV_PATH} hides the document scrollbar without scripts`);
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
  // The header's link row is already on the paper, so a second copy at the foot
  // is a wasted inch of an A4 someone is holding.
  if (text.includes(CONTACT_HEADING)) {
    throw new Error(`${CV_PDF_PATH} prints the contact footer twice over`);
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

  await checkReaderScrolls(page);

  const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  await check(pdf);
  writeFileSync(join(DIST, CV_PDF_PATH), pdf);
  console.log(`rendered ${CV_PDF_PATH} (${pdf.byteLength} bytes)`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
