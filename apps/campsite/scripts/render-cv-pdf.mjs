// Prints each CV page to its own PDF, so the document and the page cannot
// disagree. Runs after `build`, as its own step: it needs a Chromium.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { chromium } from "playwright";
import { preview } from "vite";

import { CONTACT_HEADING, cv, CV_DOCUMENTS } from "../dist-ssr/entry.js";

const DIST = "dist";

const collapse = (text) => text.replaceAll(/\s+/g, " ").trim();

async function readPdf(pdf) {
  const document = await getDocument({ data: new Uint8Array(pdf) }).promise;
  const pages = Array.from({ length: document.numPages }, (_, i) => document.getPage(i + 1));
  const contents = await Promise.all(pages.map((page) => page.then((p) => p.getTextContent())));
  return {
    pages: document.numPages,
    text: collapse(contents.flatMap((content) => content.items.map((item) => item.str)).join(" ")),
  };
}

/**
 * Without scripts the reader is a document, not a scene, so the viewport is its
 * own: it scrolls, and it says so. A stylesheet that locks `overflow` or hides
 * the bar leaves a reader stranded at the fold, which prints fine and so would
 * otherwise reach a stranger's browser unnoticed.
 */
async function checkReaderScrolls(page, path) {
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
  if (scroller.clipped) throw new Error(`${path} clips its own overflow without scripts`);
  if (scroller.barless) throw new Error(`${path} hides the document scrollbar without scripts`);
}

/** A print stylesheet change can hide the reader; fail here, not on someone's desk. */
function check(target, { pages, text }) {
  const [first] = cv.experience;
  for (const expected of [cv.name, cv.headline, first.org, first.title]) {
    if (!text.includes(collapse(expected))) {
      throw new Error(`${target.pdf} does not contain "${expected}"`);
    }
  }
  // The header's link row is already on the paper, so a second copy at the foot
  // is a wasted inch of an A4 someone is holding.
  if (text.includes(CONTACT_HEADING)) {
    throw new Error(`${target.pdf} prints the contact footer twice over`);
  }
  // A third page and it has stopped being the thing it is for; nothing else notices.
  if (target.maxPages !== undefined && pages > target.maxPages) {
    throw new Error(
      `${target.pdf} runs to ${pages} pages; it has to fit ${target.maxPages}. ` +
        "Cut a `short` from `cv.tsx` rather than loosening this.",
    );
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

  for (const target of CV_DOCUMENTS) {
    const url = new URL(target.page, origin).href;
    const response = await page.goto(url, { waitUntil: "networkidle" });
    if (!response?.ok()) throw new Error(`${url} answered ${response?.status() ?? "nothing"}`);

    await checkReaderScrolls(page, target.page);

    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    const read = await readPdf(pdf);
    // Written before it is judged, so a failure leaves the document to look at.
    writeFileSync(join(DIST, target.pdf), pdf);
    console.log(`rendered ${target.pdf} (${read.pages} pages, ${pdf.byteLength} bytes)`);
    check(target, read);
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
