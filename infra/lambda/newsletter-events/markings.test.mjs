import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { markingsFrom } from "./markings.mjs";

const bounce = (bounceType, ...emails) => ({
  eventType: "Bounce",
  bounce: { bounceType, bouncedRecipients: emails.map((emailAddress) => ({ emailAddress })) },
});

describe("markingsFrom", () => {
  it("marks every recipient of a permanent bounce", () => {
    assert.deepEqual(markingsFrom(bounce("Permanent", "A@x.io", " b@x.io ")), [
      { email: "a@x.io", status: "bounced" },
      { email: "b@x.io", status: "bounced" },
    ]);
  });

  it("leaves a transient bounce alone", () => {
    assert.deepEqual(markingsFrom(bounce("Transient", "a@x.io")), []);
  });

  it("marks a complaint", () => {
    const message = {
      eventType: "Complaint",
      complaint: { complainedRecipients: [{ emailAddress: "a@x.io" }] },
    };
    assert.deepEqual(markingsFrom(message), [{ email: "a@x.io", status: "complained" }]);
  });

  it("reads the legacy notificationType field too", () => {
    const message = {
      ...bounce("Permanent", "a@x.io"),
      eventType: undefined,
      notificationType: "Bounce",
    };
    assert.equal(markingsFrom(message).length, 1);
  });

  it("ignores deliveries and anything malformed", () => {
    assert.deepEqual(markingsFrom({ eventType: "Delivery" }), []);
    assert.deepEqual(
      markingsFrom({ eventType: "Bounce", bounce: { bounceType: "Permanent" } }),
      [],
    );
    assert.deepEqual(markingsFrom(null), []);
    assert.deepEqual(markingsFrom("Bounce"), []);
  });
});
