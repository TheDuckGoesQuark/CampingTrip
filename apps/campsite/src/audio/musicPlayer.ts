import { Howl } from 'howler';
import { useMusicStore } from '../store/musicStore';
import { songs } from '../data/songs';
import { asset } from '../utils/assetPath';

let currentHowl: Howl | null = null;
let progressInterval: ReturnType<typeof setInterval> | null = null;
let loadedIndex = -1;

function clearProgress() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

function startProgress() {
  clearProgress();
  progressInterval = setInterval(() => {
    if (currentHowl && currentHowl.playing()) {
      const seek = currentHowl.seek() as number;
      const dur = currentHowl.duration();
      useMusicStore.getState().setProgress(dur > 0 ? seek / dur : 0);
    }
  }, 250);
}

function loadTrack(index: number): Howl | null {
  const wrappedIndex = ((index % songs.length) + songs.length) % songs.length;
  const song = songs[wrappedIndex];
  if (!song) return null;

  if (currentHowl) {
    currentHowl.stop();
    currentHowl.unload();
  }
  clearProgress();

  const howl = new Howl({
    src: [asset(song.src)],
    html5: true,
    volume: 0.6,
    onload: () => {
      useMusicStore.getState().setDuration(howl.duration());
    },
    onend: () => {
      useMusicStore.getState().pause();
      useMusicStore.getState().setProgress(1);
      // Auto-advance to next track
      const store = useMusicStore.getState();
      if (store.currentTrackIndex < songs.length - 1) {
        store.next();
        musicPlayer.playTrack(store.currentTrackIndex + 1);
      }
    },
  });

  currentHowl = howl;
  loadedIndex = wrappedIndex;
  return howl;
}

export const musicPlayer = {
  playTrack(index: number) {
    const wrappedIndex = ((index % songs.length) + songs.length) % songs.length;
    const howl = wrappedIndex === loadedIndex && currentHowl
      ? currentHowl
      : loadTrack(wrappedIndex);
    if (!howl) return;
    howl.play();
    useMusicStore.getState().play();
    startProgress();
  },

  pause() {
    if (currentHowl && currentHowl.playing()) {
      currentHowl.pause();
    }
    useMusicStore.getState().pause();
    clearProgress();
  },

  resume() {
    if (currentHowl) {
      currentHowl.play();
      useMusicStore.getState().play();
      startProgress();
    } else {
      this.playTrack(useMusicStore.getState().currentTrackIndex);
    }
  },

  togglePlay() {
    const { isPlaying, currentTrackIndex } = useMusicStore.getState();
    if (isPlaying) {
      this.pause();
    } else if (currentHowl && loadedIndex === currentTrackIndex) {
      this.resume();
    } else {
      this.playTrack(currentTrackIndex);
    }
  },

  next() {
    const store = useMusicStore.getState();
    const nextIndex = (store.currentTrackIndex + 1) % songs.length;
    store.setTrack(nextIndex);
    this.playTrack(nextIndex);
  },

  prev() {
    const store = useMusicStore.getState();
    // If more than 3 seconds in, restart current track
    if (currentHowl) {
      const seek = currentHowl.seek() as number;
      if (seek > 3) {
        currentHowl.seek(0);
        store.setProgress(0);
        return;
      }
    }
    const prevIndex = (store.currentTrackIndex - 1 + songs.length) % songs.length;
    store.setTrack(prevIndex);
    this.playTrack(prevIndex);
  },

  seek(fraction: number) {
    if (!currentHowl) return;
    const dur = currentHowl.duration();
    currentHowl.seek(fraction * dur);
    useMusicStore.getState().setProgress(fraction);
  },

  stop() {
    if (currentHowl) {
      currentHowl.stop();
    }
    clearProgress();
    useMusicStore.getState().pause();
    useMusicStore.getState().setProgress(0);
  },
};
