import { describe, expect, it, vi } from "vitest";

import { SCORES_ENDPOINT, serverScoreStore } from "./serverStore";
import type { HighScoreStore } from "./store";

const answer = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );

function fallback(): HighScoreStore & {
  read: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
} {
  return {
    read: vi.fn().mockResolvedValue([{ initials: null, score: 50 }]),
    write: vi.fn().mockImplementation(async (entry) => [entry]),
  };
}

describe("serverScoreStore", () => {
  it("reads the shared top ten", async () => {
    const request = vi.fn(() => answer(200, { scores: [{ initials: "MAC", score: 900 }] }));
    const store = serverScoreStore({ fallback: fallback(), request });
    expect(await store.read()).toEqual([{ initials: "MAC", score: 900 }]);
    expect(request).toHaveBeenCalledWith(SCORES_ENDPOINT, expect.anything());
  });

  it("posts a finished game and answers with the table the server sends back", async () => {
    const request = vi.fn((_url: string, _init?: RequestInit) =>
      answer(200, { scores: [{ initials: "MAC", score: 900 }] }),
    );
    const local = fallback();
    const store = serverScoreStore({ fallback: local, request });
    expect(await store.write({ initials: "MAC", score: 900 })).toEqual([
      { initials: "MAC", score: 900 },
    ]);
    const [, init] = request.mock.calls[0];
    expect(init).toMatchObject({
      method: "POST",
      body: JSON.stringify({ initials: "MAC", score: 900 }),
    });
    expect(local.write).not.toHaveBeenCalled();
  });

  it("falls back to this browser's table when the server cannot be reached", async () => {
    const local = fallback();
    const store = serverScoreStore({
      fallback: local,
      request: () => Promise.reject(new TypeError("offline")),
    });
    expect(await store.read()).toEqual([{ initials: null, score: 50 }]);
    await store.write({ initials: "MAC", score: 900 });
    expect(local.write).toHaveBeenCalledWith({ initials: "MAC", score: 900 });
  });

  it("falls back on a refusal, and on an answer that is not a table", async () => {
    const local = fallback();
    await serverScoreStore({
      fallback: local,
      request: () => answer(429, { error: "full" }),
    }).write({
      initials: "MAC",
      score: 900,
    });
    expect(local.write).toHaveBeenCalledOnce();
    const html = () => Promise.resolve(new Response("<!doctype html>", { status: 200 }));
    expect(await serverScoreStore({ fallback: local, request: html }).read()).toEqual([
      { initials: null, score: 50 },
    ]);
  });
});
