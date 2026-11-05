import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { TABLE_SIZE } from "./accept.mjs";
import { BUSY, REFUSED, route } from "./scores.mjs";

/** The table, kept in memory and held to the same day cap `table.mjs` enforces. */
function fakeTable(rows = []) {
  const counts = new Map();
  return {
    rows,
    async top() {
      return [...rows].sort((a, b) => b.score - a.score).slice(0, TABLE_SIZE);
    },
    async put(entry) {
      rows.push(entry);
    },
    async takeWriteSlot(day, cap) {
      const n = counts.get(day) ?? 0;
      if (n >= cap) return false;
      counts.set(day, n + 1);
      return true;
    },
  };
}

const request = (method, body) => ({
  requestContext: { http: { method } },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const deps = (table, writeCapPerDay = 5) => ({
  table,
  writeCapPerDay,
  nowMs: Date.parse("2026-11-05T12:00:00Z"),
  newId: () => "id",
});

const read = (response) => ({ status: response.statusCode, body: JSON.parse(response.body) });

describe("route", () => {
  let table;
  beforeEach(() => {
    table = fakeTable([{ initials: "OLD", score: 300 }]);
  });

  it("answers GET with the board", async () => {
    assert.deepEqual(read(await route(request("GET"), deps(table))), {
      status: 200,
      body: { scores: [{ initials: "OLD", score: 300 }] },
    });
  });

  it("records a POSTed score and answers with the board it is now on", async () => {
    const response = read(
      await route(request("POST", { initials: "MAC", score: 900 }), deps(table)),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.scores, [
      { initials: "MAC", score: 900 },
      { initials: "OLD", score: 300 },
    ]);
  });

  it("refuses a score the board could not hold", async () => {
    assert.deepEqual(
      read(await route(request("POST", { initials: "MAC", score: 99_990 }), deps(table))),
      {
        status: 400,
        body: REFUSED,
      },
    );
    assert.equal(table.rows.length, 1);
  });

  it("spends no write on a score that would not make a full board", async () => {
    const full = fakeTable(
      Array.from({ length: TABLE_SIZE }, () => ({ initials: "TOP", score: 5000 })),
    );
    const response = read(
      await route(request("POST", { initials: "MAC", score: 100 }), deps(full, 0)),
    );
    assert.equal(response.status, 200);
    assert.equal(full.rows.length, TABLE_SIZE);
  });

  it("stops taking scores once the day's cap is spent", async () => {
    const capped = deps(table, 1);
    await route(request("POST", { initials: "AAA", score: 400 }), capped);
    assert.deepEqual(read(await route(request("POST", { initials: "BBB", score: 500 }), capped)), {
      status: 429,
      body: BUSY,
    });
    assert.equal(table.rows.length, 2);
  });

  it("reads a base64 body, as a Function URL may send one", async () => {
    const event = {
      requestContext: { http: { method: "POST" } },
      isBase64Encoded: true,
      body: Buffer.from(JSON.stringify({ initials: "BSE", score: 700 })).toString("base64"),
    };
    assert.equal((await route(event, deps(table))).statusCode, 200);
  });

  it("answers anything but GET and POST, and a direct invoke, with 405", async () => {
    assert.equal((await route(request("DELETE"), deps(table))).statusCode, 405);
    assert.equal((await route({}, deps(table))).statusCode, 405);
  });
});
