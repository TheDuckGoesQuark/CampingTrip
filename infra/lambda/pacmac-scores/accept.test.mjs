import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { acceptScore, MAX_BODY_BYTES, MAX_SCORE, qualifies, TABLE_SIZE } from "./accept.mjs";

const body = (over = {}) => JSON.stringify({ initials: "MAC", score: 4210, ...over });

describe("acceptScore", () => {
  it("takes three capital letters and a score the board allows", () => {
    assert.deepEqual(acceptScore(body()), { ok: true, entry: { initials: "MAC", score: 4210 } });
    assert.equal(acceptScore(body({ score: MAX_SCORE })).ok, true);
  });

  const refuses = (label, raw) =>
    it(`refuses ${label}`, () => assert.deepEqual(acceptScore(raw), { ok: false }));

  refuses("initials in lower case", body({ initials: "mac" }));
  refuses("two letters", body({ initials: "MA" }));
  refuses("four letters", body({ initials: "MACK" }));
  refuses("digits", body({ initials: "M4C" }));
  refuses("a score above what one board is worth", body({ score: MAX_SCORE + 10 }));
  refuses("a score of nothing", body({ score: 0 }));
  refuses("a negative score", body({ score: -10 }));
  refuses("a fractional score", body({ score: 12.5 }));
  refuses("a score no play could make", body({ score: 4215 }));
  refuses("a score sent as text", body({ score: "4210" }));
  refuses("a body that is not JSON", "initials=MAC");
  refuses("a body that is not an object", "[1, 2]");
  refuses("a body that is too large", body({ padding: "x".repeat(MAX_BODY_BYTES) }));
});

describe("qualifies", () => {
  const full = Array.from({ length: TABLE_SIZE }, (_, i) => ({
    initials: "AAA",
    score: 1000 - i * 10,
  }));

  it("lets anything onto a short board", () => {
    assert.equal(qualifies(full.slice(0, 3), 10), true);
  });

  it("lets only a beaten score onto a full one", () => {
    assert.equal(qualifies(full, 910), false);
    assert.equal(qualifies(full, 920), true);
  });
});
