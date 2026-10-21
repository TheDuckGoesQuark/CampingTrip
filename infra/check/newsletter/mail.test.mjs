import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  confirmLink,
  decodeBody,
  decodeQuotedPrintable,
  decodeWord,
  isAddressedTo,
  parseContentType,
  parseHeaders,
  parseMessage,
  unsubscribeLink,
} from "./mail.mjs";

const ORIGIN = "https://jordanscamp.site";
const CONFIRM = `${ORIGIN}/api/newsletter/confirm?t=1a2b-C3D4_e5`;

const crlf = (lines) => lines.join("\r\n");

describe("parseHeaders", () => {
  it("lower-cases names and joins folded lines", () => {
    const headers = parseHeaders(crlf(["Subject: Confirm your", " subscription", "To: a@b.c"]));
    assert.equal(headers.get("subject"), "Confirm your subscription");
    assert.equal(headers.get("to"), "a@b.c");
  });

  it("joins a repeated header with a comma", () => {
    const headers = parseHeaders(crlf(["Received: one", "Received: two"]));
    assert.equal(headers.get("received"), "one, two");
  });
});

describe("parseContentType", () => {
  it("reads the type and its quoted parameters", () => {
    const { type, params } = parseContentType(
      'multipart/alternative; boundary="=_x=_"; charset=UTF-8',
    );
    assert.equal(type, "multipart/alternative");
    assert.equal(params.boundary, "=_x=_");
    assert.equal(params.charset, "UTF-8");
  });
});

describe("decoding", () => {
  it("reads quoted-printable, soft breaks and UTF-8 bytes included", () => {
    assert.equal(decodeQuotedPrintable("a=3Db =\r\nc caf=C3=A9"), "a=b c café");
  });

  it("reads base64 in the part's charset", () => {
    const body = Buffer.from("café ☕", "utf8").toString("base64");
    assert.equal(decodeBody(body, "base64", "utf-8"), "café ☕");
  });

  it("passes 7bit and 8bit bodies through", () => {
    assert.equal(decodeBody("plain\r\ntext", "7bit"), "plain\r\ntext");
    assert.equal(decodeBody("plain", undefined), "plain");
  });

  it("reads an encoded word in a header, either encoding", () => {
    assert.equal(decodeWord("=?UTF-8?Q?Caf=C3=A9_time?="), "Café time");
    assert.equal(decodeWord(`=?utf-8?B?${Buffer.from("Café").toString("base64")}?=`), "Café");
    assert.equal(decodeWord("Plain subject"), "Plain subject");
  });
});

describe("parseMessage", () => {
  const alternative = crlf([
    "From: Jordan Mackie <hello@jordanscamp.site>",
    "To: e2e+run1@e2e.jordanscamp.site",
    "Subject: Confirm your subscription",
    'Content-Type: multipart/alternative; boundary="b1"',
    "",
    "preamble",
    "--b1",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    "Click to confirm:",
    `${ORIGIN}/api/newsletter/confirm?t=3D1a2b-C3D4_e5`,
    "--b1",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(`<a href="${CONFIRM}">Confirm</a>`).toString("base64"),
    "--b1--",
    "epilogue",
  ]);

  it("yields the text and html parts of a multipart/alternative", () => {
    const message = parseMessage(alternative);
    assert.equal(message.subject, "Confirm your subscription");
    assert.match(message.text, /Click to confirm:/);
    assert.equal(confirmLink(message, ORIGIN), CONFIRM);
    assert.match(message.html, /<a href=/);
  });

  it("finds the parts inside a multipart/mixed wrapper", () => {
    const split = alternative.search(/\r?\n\r?\n/);
    const inner = alternative.slice(split).replace(/^\r?\n\r?\n/, "");
    const mixed = crlf([
      "Subject: Wrapped",
      'Content-Type: multipart/mixed; boundary="outer"',
      "",
      "--outer",
      'Content-Type: multipart/alternative; boundary="b1"',
      "",
      inner,
      "--outer--",
    ]);
    const message = parseMessage(mixed);
    assert.equal(confirmLink(message, ORIGIN), CONFIRM);
    assert.match(message.html, /Confirm<\/a>/);
  });

  it("treats a single-part message as its text", () => {
    const message = parseMessage(crlf(["Subject: Hi", "", "just text"]));
    assert.equal(message.text, "just text");
    assert.equal(message.html, "");
  });
});

describe("the links a check follows", () => {
  it("takes the confirmation link from the html when the text lacks it", () => {
    const message = { text: "no link here", html: `see ${CONFIRM} now`, headers: new Map() };
    assert.equal(confirmLink(message, ORIGIN), CONFIRM);
  });

  it("is null when no confirmation link is present", () => {
    const message = { text: "", html: "", headers: new Map() };
    assert.equal(confirmLink(message, ORIGIN), null);
  });

  it("reads List-Unsubscribe without its brackets", () => {
    const headers = new Map([["list-unsubscribe", `<${ORIGIN}/api/newsletter/unsubscribe?t=tok>`]]);
    assert.equal(unsubscribeLink({ headers }), `${ORIGIN}/api/newsletter/unsubscribe?t=tok`);
    assert.equal(unsubscribeLink({ headers: new Map() }), null);
  });

  it("matches the recipient regardless of case", () => {
    const headers = new Map([["to", "E2E+Run1@e2e.jordanscamp.site"]]);
    assert.equal(isAddressedTo({ headers }, "e2e+run1@e2e.jordanscamp.site"), true);
    assert.equal(isAddressedTo({ headers }, "e2e+run2@e2e.jordanscamp.site"), false);
  });
});
