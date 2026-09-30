import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  acceptSubscribe,
  acceptToken,
  confirmationMail,
  EMAIL_LIMIT,
  MAX_BODY_BYTES,
  NOTICES,
  noticePath,
  unsubscribePage,
  unsubscribeToken,
  wantsJson,
} from "./accept.mjs";

const JSON_TYPE = "application/json";
const FORM_TYPE = "application/x-www-form-urlencoded";
const TOKEN = "abcdefghijklmnopqrstuvwxyz012345";

const refuses = (label, raw, type = JSON_TYPE) =>
  it(label, () => assert.deepEqual(acceptSubscribe(raw, type), { ok: false }));

describe("acceptSubscribe", () => {
  it("takes an address from a JSON post", () => {
    const raw = JSON.stringify({ email: "Reader@Example.com", trap: "" });
    assert.deepEqual(acceptSubscribe(raw, JSON_TYPE), { ok: true, email: "reader@example.com" });
  });

  it("takes an address from a plain form post", () => {
    const raw = new URLSearchParams({ email: " reader@example.com ", trap: "" }).toString();
    assert.deepEqual(acceptSubscribe(raw, FORM_TYPE), { ok: true, email: "reader@example.com" });
  });

  it("treats a missing content type as a form post", () => {
    assert.equal(acceptSubscribe("email=r%40e.io&trap=", undefined).ok, true);
  });

  refuses("refuses a filled honeypot", JSON.stringify({ email: "r@e.io", trap: "x" }));
  refuses("refuses a missing honeypot", JSON.stringify({ email: "r@e.io" }));
  refuses(
    "refuses an address with no dot after the at",
    JSON.stringify({ email: "r@e", trap: "" }),
  );
  refuses("refuses an address with a space", JSON.stringify({ email: "r e@e.io", trap: "" }));
  refuses("refuses a non-string address", JSON.stringify({ email: 1, trap: "" }));
  refuses("refuses broken JSON", "{", JSON_TYPE);
  refuses("refuses a JSON array", "[]", JSON_TYPE);
  refuses(
    "refuses an address past the RFC ceiling",
    JSON.stringify({ email: `${"a".repeat(EMAIL_LIMIT)}@e.io`, trap: "" }),
  );
  refuses(
    "refuses a body past the byte cap",
    `email=${"a".repeat(MAX_BODY_BYTES)}@e.io&trap=`,
    FORM_TYPE,
  );
  refuses("refuses a non-string body", undefined);
});

describe("tokens", () => {
  it("takes 32 base64url characters", () => assert.equal(acceptToken(TOKEN), TOKEN));
  it("refuses a short token", () => assert.equal(acceptToken("abc"), undefined));
  it("refuses other characters", () => assert.equal(acceptToken(`${TOKEN.slice(1)}/`), undefined));
  it("refuses a non-string", () => assert.equal(acceptToken(["a"]), undefined));

  it("reads an unsubscribe token from our page's form body first", () => {
    const body = new URLSearchParams({ t: TOKEN }).toString();
    assert.equal(unsubscribeToken(body, FORM_TYPE, { t: "nope" }), TOKEN);
  });

  it("falls back to the query string for a one-click POST", () => {
    assert.equal(unsubscribeToken("List-Unsubscribe=One-Click", FORM_TYPE, { t: TOKEN }), TOKEN);
  });

  it("gives nothing when neither holds a token", () => {
    assert.equal(unsubscribeToken("", FORM_TYPE, {}), undefined);
  });
});

describe("wantsJson", () => {
  it("is true for a JSON content type", () => {
    assert.equal(wantsJson({ "Content-Type": "application/json; charset=utf-8" }), true);
  });
  it("is true for a JSON accept header", () => {
    assert.equal(wantsJson({ accept: "application/json, text/plain" }), true);
  });
  it("is false for a plain form post", () => {
    assert.equal(wantsJson({ "content-type": FORM_TYPE, accept: "text/html" }), false);
  });
  it("is false with no headers", () => assert.equal(wantsJson(), false));
});

describe("notices", () => {
  it("live under /blog/subscribe/ as html files", () => {
    assert.equal(noticePath(NOTICES.confirmed), "/blog/subscribe/confirmed.html");
  });
});

describe("unsubscribePage", () => {
  it("carries the token in a hidden field on a POST form", () => {
    const html = unsubscribePage({ token: TOKEN, siteName: "Jordan's Camp" });
    assert.match(html, /<form method="post">/);
    assert.match(html, new RegExp(`name="t" value="${TOKEN}"`));
  });

  it("escapes what it is given", () => {
    const html = unsubscribePage({ token: '"><script>', siteName: "<b>" });
    assert.doesNotMatch(html, /<script>/);
    assert.doesNotMatch(html, /<b>/);
    assert.match(html, /&quot;&gt;&lt;script&gt;/);
  });

  it("asks not to be indexed", () => {
    assert.match(
      unsubscribePage({ token: TOKEN, siteName: "x" }),
      /name="robots" content="noindex"/,
    );
  });
});

describe("confirmationMail", () => {
  const mail = confirmationMail({
    link: "https://example.com/confirm?t=abc",
    siteName: "Jordan's Camp",
  });

  it("puts the link in both parts", () => {
    assert.match(mail.text, /https:\/\/example\.com\/confirm\?t=abc/);
    assert.match(mail.html, /href="https:\/\/example\.com\/confirm\?t=abc"/);
  });

  it("says nothing is sent before the click", () => {
    assert.match(mail.text, /nothing is sent until you do/);
    assert.match(mail.subject, /^Confirm your subscription/);
  });
});
