import { Howl, Howler } from 'howler';
import { useSceneStore } from '../store/sceneStore';
import { useSessionStore } from '../store/sessionStore';

// Howl instances — lazily created so they don't block initial load
const sounds = {
  rainAmbient: null as Howl | null,
  rainHeavy: null as Howl | null,
  doorRustle: null as Howl | null,
  guitarStrum: null as Howl | null,
};

function getOrCreate(key: keyof typeof sounds, src: string, loop = false): Howl {
  if (!sounds[key]) {
    sounds[key] = new Howl({ src: [src], loop, volume: 0.5 });
  }
  return sounds[key]!;
}

let initialised = false;

export function initAudioManager() {
  if (initialised) return;
  initialised = true;

  // Mirror master mute to Howler global
  let prevSoundEnabled = useSessionStore.getState().soundEnabled;
  useSessionStore.subscribe((s) => {
    if (s.soundEnabled !== prevSoundEnabled) {
      prevSoundEnabled = s.soundEnabled;
      Howler.mute(!s.soundEnabled);
    }
  });

  // Door state → rain cross-fade + door rustle
  let prevDoorState = useSceneStore.getState().tentDoorState;
  useSceneStore.subscribe((s) => {
    if (s.tentDoorState !== prevDoorState) {
      prevDoorState = s.tentDoorState;
      const rain = getOrCreate('rainAmbient', '/audio/rain-ambient.mp3', true);
      if (s.tentDoorState === 'opening') {
        getOrCreate('doorRustle', '/audio/tent-door-rustle.mp3').play();
        if (!rain.playing()) rain.play();
        rain.fade(rain.volume(), 0.85, 800);
      }
      if (s.tentDoorState === 'closed') {
        rain.fade(rain.volume(), 0.3, 600);
      }
    }
  });
}

// One-shot helpers called by components
export const audio = {
  playRainAmbient: () => {
    const rain = getOrCreate('rainAmbient', '/audio/rain-ambient.mp3', true);
    if (!rain.playing()) rain.play();
  },
  playGuitarStrum: () => getOrCreate('guitarStrum', '/audio/guitar-strum.mp3').play(),
};
