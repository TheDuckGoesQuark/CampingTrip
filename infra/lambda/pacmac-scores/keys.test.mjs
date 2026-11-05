import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sortKey } from "./keys.mjs";

describe("sortKey", () => {
  const descending = (keys) => [...keys].sort().reverse();

  it("sorts a higher score first, whatever its length", () => {
    const keys = [sortKey(900, 1, "a"), sortKey(14800, 1, "b"), sortKey(4210, 1, "c")];
    assert.deepEqual(descending(keys), [keys[1], keys[2], keys[0]]);
  });

  it("puts the earlier of two equal scores first", () => {
    const early = sortKey(500, 1_700_000_000_000, "a");
    const late = sortKey(500, 1_800_000_000_000, "b");
    assert.deepEqual(descending([late, early]), [early, late]);
  });
});
