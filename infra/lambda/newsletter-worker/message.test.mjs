import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildMessage,
  parseQueueMessage,
  UNSUBSCRIBE_PLACEHOLDER,
  unsubscribeUrlFor,
} from "./message.mjs";

const ORIGIN = "https://example.com";
const rendered = {
  subject: "Three posts",
  html: `<p>Hi</p><a href="${UNSUBSCRIBE_PLACEHOLDER}">Leave</a>`,
  text: `Hi\n\nLeave: ${UNSUBSCRIBE_PLACEHOLDER}\n`,
};

describe("parseQueueMessage", () => {
  it("reads a real recipient", () => {
    const body = JSON.stringify({ issue: "a", email: "r@x.io", unsubscribeToken: "tok" });
    assert.deepEqual(parseQueueMessage(body), {
      issue: "a",
      email: "r@x.io",
      unsubscribeToken: "tok",
      test: false,
    });
  });

  it("reads a test recipient, which carries no token", () => {
    const body = JSON.stringify({ issue: "a", email: "r@x.io", test: true });
    assert.deepEqual(parseQueueMessage(body), { issue: "a", email: "r@x.io", test: true });
  });

  it("refuses a real recipient without a token, and anything malformed", () => {
    assert.equal(parseQueueMessage(JSON.stringify({ issue: "a", email: "r@x.io" })), null);
    assert.equal(parseQueueMessage("{"), null);
    assert.equal(parseQueueMessage("null"), null);
    assert.equal(parseQueueMessage(JSON.stringify({ issue: 1, email: "r@x.io" })), null);
  });
});

describe("buildMessage", () => {
  it("fills every placeholder with the recipient's own link", () => {
    const message = { issue: "a", email: "r@x.io", unsubscribeToken: "tok", test: false };
    const built = buildMessage({ rendered, message, siteOrigin: ORIGIN });
    const link = `${ORIGIN}/api/newsletter/unsubscribe?t=tok`;
    assert.equal(built.subject, "Three posts");
    assert.ok(built.html.includes(`href="${link}"`));
    assert.ok(built.text.includes(`Leave: ${link}`));
    assert.doesNotMatch(built.html + built.text, /\{\{/);
  });

  it("sets both List-Unsubscribe headers", () => {
    const message = { issue: "a", email: "r@x.io", unsubscribeToken: "tok", test: false };
    const { headers } = buildMessage({ rendered, message, siteOrigin: ORIGIN });
    assert.deepEqual(headers, [
      { Name: "List-Unsubscribe", Value: `<${ORIGIN}/api/newsletter/unsubscribe?t=tok>` },
      { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" },
    ]);
  });

  it("marks a test copy in the subject and points its link at a page that does nothing", () => {
    const message = { issue: "a", email: "r@x.io", test: true };
    const built = buildMessage({ rendered, message, siteOrigin: ORIGIN });
    assert.equal(built.subject, "[TEST] Three posts");
    assert.equal(unsubscribeUrlFor(message, ORIGIN), `${ORIGIN}/blog/subscribe/link-expired.html`);
    assert.match(built.text, /link-expired\.html/);
  });
});
