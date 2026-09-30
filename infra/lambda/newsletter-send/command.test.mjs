import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { batches, messageFor, parseCommand, recipientsFrom } from "./command.mjs";

describe("parseCommand", () => {
  it("takes a slug and a mode", () => {
    assert.deepEqual(parseCommand({ issue: "three-posts-and-a-tent", mode: "test" }), {
      ok: true,
      issue: "three-posts-and-a-tent",
      mode: "test",
    });
  });

  it("refuses a slug with anything but lowercase, digits and single hyphens", () => {
    for (const issue of ["Three", "a--b", "-a", "a/b", "a b", "", "x".repeat(81)]) {
      assert.equal(parseCommand({ issue, mode: "test" }).ok, false, issue);
    }
  });

  it("refuses an unknown mode and a missing command", () => {
    assert.equal(parseCommand({ issue: "a", mode: "publish" }).ok, false);
    assert.equal(parseCommand({ issue: "a" }).ok, false);
    assert.equal(parseCommand(null).ok, false);
    assert.equal(parseCommand("send").ok, false);
  });
});

describe("recipientsFrom", () => {
  it("splits, trims, lowercases and drops blanks", () => {
    assert.deepEqual(recipientsFrom(" A@x.io, b@x.io ,,"), ["a@x.io", "b@x.io"]);
    assert.deepEqual(recipientsFrom(undefined), []);
  });
});

describe("messageFor", () => {
  it("carries the token for a real recipient", () => {
    assert.deepEqual(messageFor({ issue: "a", email: "r@x.io", unsubscribeToken: "t" }), {
      issue: "a",
      email: "r@x.io",
      unsubscribeToken: "t",
    });
  });

  it("carries the flag and no token for a test", () => {
    assert.deepEqual(messageFor({ issue: "a", email: "r@x.io", test: true }), {
      issue: "a",
      email: "r@x.io",
      test: true,
    });
  });
});

describe("batches", () => {
  it("cuts into tens, last one short", () => {
    const items = Array.from({ length: 23 }, (_, i) => i);
    const cut = batches(items);
    assert.equal(cut.length, 3);
    assert.deepEqual(cut[2], [20, 21, 22]);
  });

  it("gives nothing for nothing", () => assert.deepEqual(batches([]), []));
});
