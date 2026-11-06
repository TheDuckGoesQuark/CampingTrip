import { describe, expect, it } from "vitest";

import { localScoreStore } from "./localStore";
import { parseTable, placed, qualifies, type ScoreTable, TABLE_SIZE } from "./store";

const entry = (score: number, initials: string | null = null) => ({ initials, score });
const full: ScoreTable = Array.from({ length: TABLE_SIZE }, (_, i) => entry(1000 - i * 100));

describe("placed", () => {
  it("puts a score in order and keeps the best ten", () => {
    const table = placed(full, entry(950, "MAC"));
    expect(table).toHaveLength(TABLE_SIZE);
    expect(table[1]).toEqual(entry(950, "MAC"));
    expect(table[TABLE_SIZE - 1].score).toBe(200);
  });

  it("places a tie below the score already there", () => {
    expect(placed([entry(500, "OLD")], entry(500, "NEW"))).toEqual([
      entry(500, "OLD"),
      entry(500, "NEW"),
    ]);
  });
});

describe("qualifies", () => {
  it("lets anything above nothing onto a short table, and only a beaten score onto a full one", () => {
    expect(qualifies([], 10)).toBe(true);
    expect(qualifies([], 0)).toBe(false);
    expect(qualifies(full, 100)).toBe(false);
    expect(qualifies(full, 101)).toBe(true);
  });
});

describe("parseTable", () => {
  it("drops anything that is not an entry, and sorts what is left", () => {
    expect(
      parseTable([
        entry(10),
        { score: -1, initials: null },
        { score: 5, initials: "lower" },
        entry(30, "ABC"),
        "x",
      ]),
    ).toEqual([entry(30, "ABC"), entry(10)]);
    expect(parseTable({ not: "a table" })).toEqual([]);
  });
});

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size;
    },
  };
}

describe("localScoreStore", () => {
  it("keeps what it is given across reads", async () => {
    const storage = memoryStorage();
    const store = localScoreStore(() => storage);
    expect(await store.read()).toEqual([]);
    await store.write(entry(120));
    await store.write(entry(450));
    expect(await localScoreStore(() => storage).read()).toEqual([entry(450), entry(120)]);
  });

  it("reads an empty table from storage it cannot parse or reach", async () => {
    const storage = memoryStorage();
    storage.setItem("macman-scores", "{oops");
    expect(await localScoreStore(() => storage).read()).toEqual([]);
    const blocked = localScoreStore(() => {
      throw new Error("blocked");
    });
    expect(await blocked.read()).toEqual([]);
    expect(await blocked.write(entry(50))).toEqual([entry(50)]);
  });
});
