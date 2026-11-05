import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { dealRound, type GameState } from "../engine/state";
import type { HighScoreStore } from "./store";
import { useHighScores } from "./useHighScores";

function fakeStore(): HighScoreStore & { write: ReturnType<typeof vi.fn> } {
  return {
    read: vi.fn().mockResolvedValue([{ initials: null, score: 900 }]),
    write: vi.fn().mockImplementation(async (entry) => [entry]),
  };
}

const at = (phase: "playing" | "gameOver" | "won", score: number): GameState =>
  ({ phase, round: { ...dealRound(), score } }) as GameState;

describe("useHighScores", () => {
  it("reads the table when the game opens", async () => {
    const store = fakeStore();
    const { result } = renderHook(() => useHighScores(store, at("playing", 0)));
    await act(async () => {});
    expect(result.current).toEqual([{ initials: null, score: 900 }]);
  });

  it("writes the score once, when the game ends", async () => {
    const store = fakeStore();
    const { rerender } = renderHook(({ state }) => useHighScores(store, state), {
      initialProps: { state: at("playing", 300) },
    });
    rerender({ state: at("gameOver", 300) });
    rerender({ state: at("gameOver", 300) });
    await act(async () => {});
    expect(store.write).toHaveBeenCalledExactlyOnceWith({ initials: null, score: 300 });
  });

  it("writes a win too, but never a game that scored nothing", async () => {
    const store = fakeStore();
    const { rerender } = renderHook(({ state }) => useHighScores(store, state), {
      initialProps: { state: at("playing", 0) },
    });
    rerender({ state: at("gameOver", 0) });
    rerender({ state: at("playing", 14_800) });
    rerender({ state: at("won", 14_800) });
    await act(async () => {});
    expect(store.write.mock.calls).toEqual([[{ initials: null, score: 14_800 }]]);
  });
});
