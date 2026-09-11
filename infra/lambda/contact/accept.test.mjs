import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { accept, bodyFor, MAX_BODY_BYTES, MESSAGE_LIMIT, MIN_DWELL_MS } from "./accept.mjs";

/** A request a real person would send, `now` minus a plausible dwell. */
const NOW = 1_700_000_000_000;
const refuses = (label, raw, now = NOW) =>
  it(label, () => assert.deepEqual(accept(raw, now), { ok: false }));

const good = (over = {}) =>
  JSON.stringify({
    message: "The cat made me smile.",
    trap: "",
    mountedAt: NOW - MIN_DWELL_MS - 1,
    ...over,
  });

describe("accept", () => {
  it("takes a note a person typed", () => {
    const v = accept(good(), NOW);
    assert.equal(v.ok, true);
    assert.equal(v.note, "The cat made me smile.");
    assert.equal(v.replyTo, undefined);
  });

  it("trims the note", () => {
    assert.equal(accept(good({ message: "  hello  " }), NOW).note, "hello");
  });

  it("keeps an address that could be replied to", () => {
    assert.equal(accept(good({ email: " a@b.com " }), NOW).replyTo, "a@b.com");
  });

  it("drops an address that could not be", () => {
    for (const email of ["", "  ", "nope", "a@", "@b", "a b@c", "a@b c"]) {
      assert.equal(accept(good({ email }), NOW).replyTo, undefined, email);
    }
  });

  describe("refuses", () => {
    refuses("a filled honeypot", good({ trap: "http://spam" }));
    refuses("a missing honeypot", JSON.stringify({ message: "hi", mountedAt: NOW - 9999 }));
    refuses("a submit faster than a person types", good({ mountedAt: NOW - MIN_DWELL_MS + 1 }));
    refuses("a mount time that is not a number", good({ mountedAt: "soon" }));
    refuses("a mount time that is not finite", good({ mountedAt: Number.POSITIVE_INFINITY }));
    refuses("an empty note", good({ message: "   " }));
    refuses("a missing note", JSON.stringify({ trap: "", mountedAt: NOW - 9999 }));
    refuses("a note that is not a string", good({ message: 42 }));
    refuses("a note past the limit", good({ message: "x".repeat(MESSAGE_LIMIT + 1) }));
    refuses("a body past the byte cap", good({ message: "x".repeat(MAX_BODY_BYTES) }));
    refuses("something that is not JSON", "not json");
    refuses("JSON that is not an object", JSON.stringify(["hi"]));
    refuses("JSON null", JSON.stringify(null));
    refuses("no body at all", undefined);
  });

  // A dwell check that read the clock instead of `mountedAt` would pass anything
  // once the process had been warm for a while.
  it("measures dwell from the payload, not from uptime", () => {
    assert.equal(accept(good({ mountedAt: NOW }), NOW).ok, false);
    assert.equal(accept(good({ mountedAt: NOW - MIN_DWELL_MS }), NOW).ok, true);
  });
});

describe("bodyFor", () => {
  it("puts the note first and says when there is no reply address", () => {
    const body = bodyFor({ note: "hello", replyTo: undefined });
    assert.match(body, /^hello\n/);
    assert.match(body, /No reply address given\./);
  });

  it("carries the reply address when there is one", () => {
    assert.match(bodyFor({ note: "hello", replyTo: "a@b.com" }), /Reply to: a@b\.com/);
  });

  // The whole reason this path uses SNS: a newline in a header field is how mail
  // injection works, and here there is no header field to inject into.
  it("keeps a newline-stuffed note in the body, where newlines are harmless", () => {
    const note = "hi\nBcc: victim@example.com";
    assert.ok(bodyFor({ note, replyTo: undefined }).startsWith(note));
  });
});
