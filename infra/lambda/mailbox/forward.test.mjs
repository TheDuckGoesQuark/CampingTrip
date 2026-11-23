import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { aliasFor, isUnwanted, readdress, receiptOf } from "./forward.mjs";

const ALIASES = ["jordan@site.test", "hello@site.test"];

const receipt = (overrides = {}) => ({
  recipients: ["jordan@site.test"],
  spamVerdict: { status: "PASS" },
  virusVerdict: { status: "PASS" },
  ...overrides,
});

const message = (...headers) => [...headers, "", "Hello there."].join("\r\n");

const headerLines = (raw) => raw.split("\r\n\r\n")[0].split("\r\n");

describe("receiptOf", () => {
  it("reads the message id and receipt from an SES event", () => {
    const event = { Records: [{ ses: { mail: { messageId: "abc" }, receipt: receipt() } }] };
    assert.equal(receiptOf(event).messageId, "abc");
  });

  it("is null for an event SES did not send", () => {
    assert.equal(receiptOf({}), null);
    assert.equal(receiptOf({ Records: [{ ses: { mail: {} } }] }), null);
  });
});

describe("isUnwanted", () => {
  it("forwards a message that passed both scans", () => {
    assert.equal(isUnwanted(receipt()), false);
  });

  it("drops spam", () => {
    assert.equal(isUnwanted(receipt({ spamVerdict: { status: "FAIL" } })), true);
  });

  it("drops a virus", () => {
    assert.equal(isUnwanted(receipt({ virusVerdict: { status: "FAIL" } })), true);
  });

  it("forwards a message SES could not scan", () => {
    assert.equal(isUnwanted(receipt({ spamVerdict: { status: "GRAY" } })), false);
  });
});

describe("aliasFor", () => {
  it("is the alias the message reached, whatever its case", () => {
    assert.equal(aliasFor(receipt({ recipients: ["Hello@Site.test"] }), ALIASES), ALIASES[1]);
  });

  it("is the first alias when the recipient is not one of them", () => {
    assert.equal(aliasFor(receipt({ recipients: ["other@site.test"] }), ALIASES), ALIASES[0]);
  });
});

describe("readdress", () => {
  it("sends from the alias, named after the sender's address", () => {
    const out = readdress(message("From: Ada <ada@example.org>", "Subject: Hi"), ALIASES[0]);
    assert.equal(headerLines(out)[0], 'From: "ada at example.org" <jordan@site.test>');
  });

  it("answers to the sender", () => {
    const out = readdress(message("From: Ada <ada@example.org>", "Subject: Hi"), ALIASES[0]);
    assert.ok(headerLines(out).includes("Reply-To: Ada <ada@example.org>"));
  });

  it("keeps a Reply-To the sender set", () => {
    const out = readdress(
      message("From: Ada <ada@example.org>", "Reply-To: team@example.org"),
      ALIASES[0],
    );
    const replies = headerLines(out).filter((line) => line.startsWith("Reply-To:"));
    assert.deepEqual(replies, ["Reply-To: team@example.org"]);
  });

  it("keeps a folded From whole when it becomes the Reply-To", () => {
    const out = readdress(message("From: Ada", " <ada@example.org>", "Subject: Hi"), ALIASES[0]);
    assert.match(out, /Reply-To: Ada\r\n <ada@example\.org>\r\n/);
  });

  it("drops the headers SES writes itself", () => {
    const out = readdress(
      message(
        "Return-Path: <bounce@example.org>",
        "DKIM-Signature: v=1; a=rsa-sha256;",
        " b=abc",
        "Message-ID: <1@example.org>",
        "Sender: list@example.org",
        "From: ada@example.org",
        "Subject: Hi",
      ),
      ALIASES[0],
    );
    assert.deepEqual(headerLines(out), [
      'From: "ada at example.org" <jordan@site.test>',
      "Reply-To: ada@example.org",
      "Subject: Hi",
    ]);
  });

  it("quotes nothing the sender wrote into the new From", () => {
    const out = readdress(message('From: "x\\" <evil@a.io>" <ada@example.org>'), ALIASES[0]);
    assert.equal(headerLines(out)[0], 'From: "evil at a.io" <jordan@site.test>');
  });

  it("names an unreadable sender rather than failing", () => {
    const out = readdress(message("Subject: Hi"), ALIASES[0]);
    assert.equal(headerLines(out)[0], 'From: "unknown sender" <jordan@site.test>');
  });

  it("leaves the body byte for byte", () => {
    const body = "Content\r\n\r\n--boundary\r\n\xff\xfe\x00binary";
    const out = readdress(`From: ada@example.org\r\nSubject: Hi\r\n\r\n${body}`, ALIASES[0]);
    assert.equal(out.slice(out.indexOf("\r\n\r\n") + 4), body);
  });

  it("reads a message with bare line feeds", () => {
    const out = readdress("From: ada@example.org\nSubject: Hi\n\nHello.", ALIASES[0]);
    assert.ok(out.endsWith("Subject: Hi\r\n\r\nHello."));
  });
});
