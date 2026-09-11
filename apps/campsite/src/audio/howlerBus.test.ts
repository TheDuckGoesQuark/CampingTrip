import { describe, it, expect, vi, beforeEach } from "vitest";

const volume = vi.fn();
vi.mock("howler", () => ({ Howler: { volume } }));

let howlerBus: typeof import("./howlerBus");
let sessionStore: typeof import("../store/sessionStore").useSessionStore;

describe("howlerBus", () => {
  beforeEach(async () => {
    vi.resetModules();
    volume.mockClear();
    const storeMod = await import("../store/sessionStore");
    sessionStore = storeMod.useSessionStore;
    sessionStore.setState({ volume: 1 });
    howlerBus = await import("./howlerBus");
  });

  it("puts the stored level on Howler", () => {
    sessionStore.setState({ volume: 0.5 });
    howlerBus.syncHowlerVolume();
    expect(volume).toHaveBeenCalledWith(0.5);
  });

  it("keeps it there as the level moves", () => {
    howlerBus.syncHowlerVolume();
    sessionStore.getState().setVolume(0.2);
    expect(volume).toHaveBeenLastCalledWith(0.2);
  });

  it("subscribes once however often it is called", () => {
    howlerBus.syncHowlerVolume();
    howlerBus.syncHowlerVolume();
    volume.mockClear();
    sessionStore.getState().setVolume(0.6);
    expect(volume).toHaveBeenCalledOnce();
  });
});
