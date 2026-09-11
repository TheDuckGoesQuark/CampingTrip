import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";

import type { Song } from "../data/songs";

interface MockHowl {
  src: string[];
  play: Mock<() => void>;
  pause: Mock<() => void>;
  stop: Mock<() => void>;
  unload: Mock<() => void>;
  playing: Mock<() => boolean>;
  /** Reads the play position, or moves it when given one. */
  seek: Mock<(to?: number) => number>;
  duration: Mock<() => number>;
}

let howls: MockHowl[] = [];

vi.mock("howler", () => ({
  Howler: { volume: vi.fn() },
  Howl: vi.fn(function (this: MockHowl, opts: Record<string, unknown>) {
    let isPlaying = false;
    let position = 0;
    this.src = opts.src as string[];
    this.play = vi.fn(() => {
      isPlaying = true;
    });
    this.pause = vi.fn(() => {
      isPlaying = false;
    });
    this.stop = vi.fn(() => {
      isPlaying = false;
      position = 0;
    });
    this.unload = vi.fn();
    this.playing = vi.fn(() => isPlaying);
    this.duration = vi.fn(() => 180);
    this.seek = vi.fn((to?: number) => {
      if (to !== undefined) position = to;
      return position;
    });
    howls.push(this);
  }),
}));

const TWO_SONGS: Song[] = [
  { title: "First", artist: "Jordan", src: "audio/songs/first.mp3" },
  { title: "Second", artist: "Jordan", src: "audio/songs/second.mp3" },
];

async function loadPlayer(songList: Song[]) {
  vi.resetModules();
  howls = [];
  vi.doMock("../data/songs", () => ({ songs: songList }));
  const { musicPlayer } = await import("./musicPlayer");
  const { useMusicStore } = await import("../store/musicStore");
  return { musicPlayer, useMusicStore };
}

describe("musicPlayer with an empty playlist", () => {
  let player: Awaited<ReturnType<typeof loadPlayer>>;

  beforeEach(async () => {
    vi.useFakeTimers();
    player = await loadPlayer([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.doUnmock("../data/songs");
  });

  it("loads nothing and starts nothing", () => {
    player.musicPlayer.playTrack(0);

    expect(howls).toHaveLength(0);
    expect(player.useMusicStore.getState().isPlaying).toBe(false);
  });

  it.each(["next", "prev"] as const)("leaves the track index a number after %s()", (method) => {
    player.musicPlayer[method]();

    expect(player.useMusicStore.getState().currentTrackIndex).toBe(0);
  });

  it("does not report itself playing after togglePlay()", () => {
    player.musicPlayer.togglePlay();

    expect(player.useMusicStore.getState().isPlaying).toBe(false);
  });

  it("ignores a seek", () => {
    player.musicPlayer.seek(0.5);

    expect(player.useMusicStore.getState().progress).toBe(0);
  });
});

describe("musicPlayer with a playlist", () => {
  let player: Awaited<ReturnType<typeof loadPlayer>>;

  beforeEach(async () => {
    vi.useFakeTimers();
    player = await loadPlayer(TWO_SONGS);
  });

  afterEach(() => {
    player.musicPlayer.stop();
    vi.useRealTimers();
    vi.doUnmock("../data/songs");
  });

  it("plays the requested track", () => {
    player.musicPlayer.playTrack(0);

    expect(howls).toHaveLength(1);
    expect(howls[0].src[0]).toContain("first.mp3");
    expect(howls[0].play).toHaveBeenCalled();
    expect(player.useMusicStore.getState().isPlaying).toBe(true);
  });

  // `playTrack` does not own the store's index; its callers set it.
  it("wraps past the end of the playlist", () => {
    player.useMusicStore.getState().setTrack(1);

    player.musicPlayer.next();

    expect(player.useMusicStore.getState().currentTrackIndex).toBe(0);
  });

  it("wraps back past the start of the playlist", () => {
    player.musicPlayer.prev();

    expect(player.useMusicStore.getState().currentTrackIndex).toBe(1);
  });

  it("restarts the current track when prev() lands more than 3 s in", () => {
    player.useMusicStore.getState().setTrack(1);
    player.musicPlayer.playTrack(1);
    howls[0].seek(10);

    player.musicPlayer.prev();

    expect(player.useMusicStore.getState().currentTrackIndex).toBe(1);
    expect(howls[0].seek).toHaveBeenLastCalledWith(0);
  });

  it("reuses the loaded Howl when the same track is played again", () => {
    player.musicPlayer.playTrack(0);
    player.musicPlayer.pause();
    player.musicPlayer.playTrack(0);

    expect(howls).toHaveLength(1);
  });

  it("publishes progress while playing", () => {
    player.musicPlayer.playTrack(0);
    howls[0].seek(90);

    vi.advanceTimersByTime(250);

    expect(player.useMusicStore.getState().progress).toBeCloseTo(0.5);
  });
});
