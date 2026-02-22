import { useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import CameraController from './CameraController';
import Lighting from './Lighting';
import InteractiveObject from './InteractiveObject';
import { useSceneStore } from '../../store/sceneStore';
import { useTimeStore, lerpKeyframes } from '../../store/timeStore';
import { useTimeSync } from '../../hooks/useTimeSync';
import TentInterior from './environment/TentInterior';
import PicnicArea from './environment/PicnicArea';
import OutdoorScene from './environment/OutdoorScene';
import Campfire from './environment/Campfire';
import Guitar from './environment/Guitar';
import MokaPot from './environment/MokaPot';
import Laptop from './environment/Laptop';
import ScarlettSolo from './environment/ScarlettSolo';
import ShureMic from './environment/ShureMic';
import MidiController from './environment/MidiController';
import Notepad from './environment/Notepad';
import WalkingCat from './environment/WalkingCat';
import RainSystem from './environment/RainSystem';
import RainAudio from './RainAudio';
import {
  playLaptopOn,
  playLaptopOff,
  playGuitarStrum,
  playMidiNote,
  playPageFlip,
  playSoftClick,
} from '../../audio/soundEffects';
import { useMusicStore } from '../../store/musicStore';

// Environment intensity keyframes (brighter during day)
const ENV_INT = [
  { t: 0.00, value: 0.3 },
  { t: 0.15, value: 0.7 },
  { t: 0.25, value: 1.0 },
  { t: 0.42, value: 0.7 },
  { t: 0.50, value: 0.4 },
  { t: 0.58, value: 0.3 },
  { t: 0.75, value: 0.3 },
  { t: 1.00, value: 0.3 },
];

/** Syncs the time store to the system clock and updates scene.environmentIntensity */
function TimeSync() {
  useTimeSync();
  const scene = useThree((s) => s.scene);
  useFrame(() => {
    const p = useTimeStore.getState().progress;
    (scene as any).environmentIntensity = lerpKeyframes(ENV_INT, p);
  });
  return null;
}
interface Props {
  debug?: boolean;
}

export default function SceneContent({ debug = false }: Props) {
  const [laptopScreenOn, setLaptopScreenOn] = useState(false);
  const laptopFocused = useSceneStore((s) => s.laptopFocused);

  const toggleLaptopScreen = useCallback(() => {
    // Don't toggle while in focus mode
    if (useSceneStore.getState().laptopFocused) return;
    setLaptopScreenOn((prev) => {
      if (prev) playLaptopOff();
      else playLaptopOn();
      return !prev;
    });
  }, []);

  const activateNotepad = useCallback(() => {
    if (useSceneStore.getState().notepadFocused) return;
    playPageFlip();
    useSceneStore.getState().setFocusTarget('default');
    useSceneStore.getState().setNotepadFocused(true);
  }, []);

  const activateMusicPlayer = useCallback(() => {
    playSoftClick();
    useMusicStore.getState().open();
  }, []);

  return (
    <>
      {!debug && <CameraController />}
      <Lighting debug={debug} />
      <TimeSync />

      {/* Subtle env map so metallic objects (moka pot, scarlett) catch light */}
      <Environment preset="night" environmentIntensity={0.3} />

      {/* Non-interactive environment */}
      <TentInterior />
      <PicnicArea />

      {/* Interactive objects — wrapped for hover highlight + label + a11y */}
      <InteractiveObject
        id="guitar"
        label="Guitar"
        labelPosition={[1.6, 1.2, -0.8]}
        onActivate={playGuitarStrum}
      >
        <Guitar />
      </InteractiveObject>

      <InteractiveObject
        id="laptop"
        label={laptopScreenOn ? 'Laptop (click to turn off)' : 'Laptop (click to turn on)'}
        labelPosition={[-1.75, 1.75, -0.85]}
        onActivate={toggleLaptopScreen}
      >
        <Laptop screenOn={laptopScreenOn} />
      </InteractiveObject>

      {/* Laptop screen glow — illuminates tent when screen is on (not when focused) */}
      {laptopScreenOn && !laptopFocused && (
        <pointLight
          position={[-1.3, 1.0, -0.5]}
          color="#7799dd"
          intensity={2.0}
          distance={6}
          decay={1.5}
          castShadow={false}
        />
      )}

      <InteractiveObject
        id="scarlett"
        label="Scarlett Solo"
        labelPosition={[-1.9, 1.0, -0.1]}
      >
        <ScarlettSolo />
      </InteractiveObject>

      <InteractiveObject
        id="shure-mic"
        label="Music Player"
        labelPosition={[-0.6, 0.8, -0.4]}
        onActivate={activateMusicPlayer}
      >
        <ShureMic />
      </InteractiveObject>

      <InteractiveObject
        id="midi"
        label="MIDI Controller"
        labelPosition={[-1.0, 0.6, 0.3]}
        onActivate={playMidiNote}
      >
        <MidiController />
      </InteractiveObject>

      <InteractiveObject
        id="notepad"
        label="Notepad"
        labelPosition={[-0.7, 1.0, -0.7]}
        onActivate={activateNotepad}
      >
        <Notepad />
      </InteractiveObject>

      <InteractiveObject
        id="moka-pot"
        label="Moka Pot"
        labelPosition={[-1, 0.7, -1.8]}
      >
        <MokaPot />
      </InteractiveObject>

      {/* Outside */}
      <OutdoorScene />
      <Campfire />
      <WalkingCat />
      <RainSystem />
      <RainAudio />

    </>
  );
}
