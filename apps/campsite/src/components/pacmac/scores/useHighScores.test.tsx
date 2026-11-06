import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { dealRound, type GameState } from "../engine/state";
import { type HighScoreStore, type ScoreTable, TABLE_SIZE } from "./store";
import { useHighScores } from "./useHighScores";

function fakeStore(table: ScoreTable = []): HighScoreStore & { write: ReturnType<typeof vi.fn> } {
  return {
    read: vi.fn().mockResolvedValue(table),
    write: vi.fn().mockImplementation(async (entry) => [entry, ...table]),
  };
}

const at = (phase: "playing" | "gameOver" | "won", score: number): GameState =>
  ({ phase, round: { ...dealRound(), score } }) as GameState;

function played(store: HighScoreStore, end: GameState) {
  const hook = renderHook(({ state }) => useHighScores(store, state), {
    initialProps: { state: at("playing", end.round.score) },
  });
  return {
    ...hook,
    finish: async () => {
      await act(async () => {});
      hook.rerender({ state: end });
    },
  };
}

describe("useHighScores", () => {
  it("reads the table when the game opens", async () => {
    const store = fakeStore([{ initials: "OLD", score: 900 }]);
    const { result } = renderHook(() => useHighScores(store, at("playing", 0)));
    await act(async () => {});
    expect(result.current.table).toEqual([{ initials: "OLD", score: 900 }]);
  });

  it("asks for initials when a game ends on a score that makes the table, and writes them", async () => {
    const store = fakeStore();
    const { result, finish } = played(store, at("gameOver", 300));
    await finish();
    expect(result.current.asking).toBe(300);
    await act(async () => result.current.submit("MAC"));
    expect(store.write).toHaveBeenCalledExactlyOnceWith({ initials: "MAC", score: 300 });
    expect(result.current.asking).toBeNull();
    expect(result.current.table[0]).toEqual({ initials: "MAC", score: 300 });
  });

  it("points at the row just signed, the lowest of equal ones", async () => {
    const store = fakeStore();
    store.write.mockResolvedValue([
      { initials: "TOP", score: 900 },
      { initials: "MAC", score: 300 },
      { initials: "MAC", score: 300 },
    ]);
    const { result, finish } = played(store, at("gameOver", 300));
    await finish();
    await act(async () => result.current.submit("MAC"));
    expect(result.current.signed).toBe(2);
  });

  it("forgets the signed row when the next game starts", async () => {
    const store = fakeStore();
    const { result, finish, rerender } = played(store, at("gameOver", 300));
    await finish();
    await act(async () => result.current.submit("MAC"));
    expect(result.current.signed).toBe(0);
    rerender({ state: at("playing", 0) });
    expect(result.current.signed).toBeNull();
  });

  it("asks after a win too", async () => {
    const store = fakeStore();
    const { result, finish } = played(store, at("won", 14_800));
    await finish();
    expect(result.current.asking).toBe(14_800);
  });

  it("asks nothing of a score that would not make a full table", async () => {
    const full = Array.from({ length: TABLE_SIZE }, () => ({ initials: "TOP", score: 5000 }));
    const store = fakeStore(full);
    const { result, finish } = played(store, at("gameOver", 100));
    await finish();
    expect(result.current.asking).toBeNull();
    expect(store.write).not.toHaveBeenCalled();
  });

  it("drops the question when the next game starts unsigned", async () => {
    const store = fakeStore();
    const { result, finish, rerender } = played(store, at("gameOver", 300));
    await finish();
    rerender({ state: at("playing", 0) });
    expect(result.current.asking).toBeNull();
    expect(store.write).not.toHaveBeenCalled();
  });
});
