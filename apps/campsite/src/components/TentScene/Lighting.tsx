import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../store/sceneStore';
import { isMobile } from '../../utils/deviceDetect';
import {
  useTimeStore,
  lerpKeyframes,
  lerpColorKeyframes,
  getNightFactor,
} from '../../store/timeStore';

// ─── Keyframe stops ──────────────────────────────────────────────
// progress: 0.00 = 6 AM (dawn), 0.25 = noon, 0.50 = 6 PM, 0.75 = midnight

const AMBIENT_COLORS = [
  { t: 0.00, color: new THREE.Color('#ffaa77') },
  { t: 0.10, color: new THREE.Color('#fff0d0') },
  { t: 0.25, color: new THREE.Color('#fffaf0') },
  { t: 0.42, color: new THREE.Color('#ffe8cc') },
  { t: 0.50, color: new THREE.Color('#ff8844') },
  { t: 0.58, color: new THREE.Color('#e8a050') },
  { t: 0.75, color: new THREE.Color('#e8a050') },
  { t: 1.00, color: new THREE.Color('#ffaa77') },
];
const AMBIENT_INT = [
  { t: 0.00, value: 0.35 },
  { t: 0.10, value: 0.8 },
  { t: 0.25, value: 1.0 },
  { t: 0.42, value: 0.8 },
  { t: 0.50, value: 0.5 },
  { t: 0.58, value: 0.55 },
  { t: 0.75, value: 0.55 },
  { t: 1.00, value: 0.35 },
];

const HEMI_SKY = [
  { t: 0.00, color: new THREE.Color('#ff9966') },
  { t: 0.10, color: new THREE.Color('#b0d4f0') },
  { t: 0.25, color: new THREE.Color('#87ceeb') },
  { t: 0.42, color: new THREE.Color('#c4a070') },
  { t: 0.50, color: new THREE.Color('#ff6633') },
  { t: 0.58, color: new THREE.Color('#ffaa66') },
  { t: 0.75, color: new THREE.Color('#ffaa66') },
  { t: 1.00, color: new THREE.Color('#ff9966') },
];
const HEMI_GROUND = [
  { t: 0.00, color: new THREE.Color('#2a2520') },
  { t: 0.15, color: new THREE.Color('#4a5540') },
  { t: 0.25, color: new THREE.Color('#556b2f') },
  { t: 0.42, color: new THREE.Color('#3a4530') },
  { t: 0.50, color: new THREE.Color('#2a2020') },
  { t: 0.58, color: new THREE.Color('#1a1520') },
  { t: 0.75, color: new THREE.Color('#1a1520') },
  { t: 1.00, color: new THREE.Color('#2a2520') },
];
const HEMI_INT = [
  { t: 0.00, value: 0.35 },
  { t: 0.10, value: 0.6 },
  { t: 0.25, value: 0.7 },
  { t: 0.42, value: 0.5 },
  { t: 0.50, value: 0.4 },
  { t: 0.58, value: 0.45 },
  { t: 0.75, value: 0.45 },
  { t: 1.00, value: 0.35 },
];

const MAIN_COLORS = [
  { t: 0.00, color: new THREE.Color('#ffbb66') },
  { t: 0.15, color: new THREE.Color('#ffdd99') },
  { t: 0.25, color: new THREE.Color('#ffffee') },
  { t: 0.42, color: new THREE.Color('#ffcc88') },
  { t: 0.50, color: new THREE.Color('#ff8833') },
  { t: 0.58, color: new THREE.Color('#ff9933') },
  { t: 0.75, color: new THREE.Color('#ff9933') },
  { t: 1.00, color: new THREE.Color('#ffbb66') },
];
const MAIN_INT = [
  { t: 0.00, value: 2.5 },
  { t: 0.15, value: 2.0 },
  { t: 0.25, value: 1.5 },
  { t: 0.42, value: 2.5 },
  { t: 0.50, value: 3.5 },
  { t: 0.58, value: 4.5 },
  { t: 0.75, value: 4.5 },
  { t: 1.00, value: 2.5 },
];

const FILL_INT = [
  { t: 0.00, value: 0.8 },
  { t: 0.25, value: 0.5 },
  { t: 0.50, value: 0.8 },
  { t: 0.58, value: 1.2 },
  { t: 0.75, value: 1.2 },
  { t: 1.00, value: 0.8 },
];

const REAR_INT = [
  { t: 0.00, value: 1.0 },
  { t: 0.25, value: 0.5 },
  { t: 0.50, value: 1.0 },
  { t: 0.58, value: 1.5 },
  { t: 0.75, value: 1.5 },
  { t: 1.00, value: 1.0 },
];

// Static lerp targets for campfire / door light
const CAMPFIRE_NIGHT = new THREE.Color('#ff6622');
const CAMPFIRE_DAY = new THREE.Color('#ffeecc');
const DOOR_MOON = new THREE.Color('#8ab4d8');
const DOOR_SUN = new THREE.Color('#ffffdd');

// ─── Component ───────────────────────────────────────────────────

interface LightingProps {
  debug?: boolean;
}

export default function Lighting({ debug = false }: LightingProps) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const mainRef = useRef<THREE.PointLight>(null);
  const fillRef = useRef<THREE.PointLight>(null);
  const campfireRef = useRef<THREE.PointLight>(null);
  const rearRef = useRef<THREE.PointLight>(null);
  const doorLightRef = useRef<THREE.SpotLight>(null);

  useFrame(() => {
    if (debug) return;

    const p = useTimeStore.getState().progress;
    const doorState = useSceneStore.getState().tentDoorState;
    const doorOpen = doorState === 'open' || doorState === 'opening';
    const nf = getNightFactor(p);

    // ── Ambient ──
    if (ambientRef.current) {
      lerpColorKeyframes(AMBIENT_COLORS, p, ambientRef.current.color);
      ambientRef.current.intensity = lerpKeyframes(AMBIENT_INT, p);
    }

    // ── Hemisphere ──
    if (hemiRef.current) {
      lerpColorKeyframes(HEMI_SKY, p, hemiRef.current.color);
      lerpColorKeyframes(HEMI_GROUND, p, hemiRef.current.groundColor);
      hemiRef.current.intensity = lerpKeyframes(HEMI_INT, p);
    }

    // ── Main overhead ──
    if (mainRef.current) {
      lerpColorKeyframes(MAIN_COLORS, p, mainRef.current.color);
      mainRef.current.intensity = lerpKeyframes(MAIN_INT, p);
    }

    // ── Warm fill ──
    if (fillRef.current) {
      fillRef.current.intensity = lerpKeyframes(FILL_INT, p);
    }

    // ── Campfire / outdoor ambient through door ──
    if (campfireRef.current) {
      campfireRef.current.color.copy(CAMPFIRE_NIGHT).lerp(CAMPFIRE_DAY, 1 - nf);
      const nightInt = doorOpen ? 2.5 : 0.8;
      const dayInt = doorOpen ? 2.0 : 0.3;
      campfireRef.current.intensity = THREE.MathUtils.lerp(dayInt, nightInt, nf);
    }

    // ── Rear fill ──
    if (rearRef.current) {
      rearRef.current.intensity = lerpKeyframes(REAR_INT, p);
    }

    // ── Door spotlight — moonlight at night, sunlight by day ──
    if (doorLightRef.current) {
      doorLightRef.current.color.copy(DOOR_MOON).lerp(DOOR_SUN, 1 - nf);
      const baseInt = THREE.MathUtils.lerp(1.5, 0.6, nf);
      doorLightRef.current.intensity = doorOpen ? baseInt : 0;
    }
  });

  if (debug) {
    return (
      <>
        <ambientLight intensity={1.5} color="#ffffff" />
        <hemisphereLight args={['#87ceeb', '#556b2f', 1.0]} />
        <directionalLight position={[5, 10, 5]} intensity={2.0} color="#ffffff" castShadow />
        <directionalLight position={[-3, 8, -5]} intensity={1.0} color="#ffffee" />
      </>
    );
  }

  return (
    <>
      {/* Ambient — warm at night, brighter/whiter during day */}
      <ambientLight ref={ambientRef} intensity={0.55} color="#e8a050" />

      {/* Hemisphere — sky tint changes with time of day */}
      <hemisphereLight ref={hemiRef} args={['#ffaa66', '#1a1520', 0.45]} />

      {/* Main overhead warm glow (lantern / string lights) */}
      <pointLight
        ref={mainRef}
        position={[0, 2.2, 0.5]}
        color="#ff9933"
        intensity={4.5}
        distance={14}
        decay={1.0}
        castShadow
        shadow-mapSize-width={isMobile ? 512 : 1024}
        shadow-mapSize-height={isMobile ? 512 : 1024}
      />

      {/* Warm fill from camera area */}
      <pointLight
        ref={fillRef}
        position={[0, 1.0, 2]}
        color="#ff8844"
        intensity={1.2}
        distance={8}
        decay={1.5}
        castShadow={false}
      />

      {/* Campfire warmth / outdoor ambient through tent entrance */}
      <pointLight
        ref={campfireRef}
        position={[0, 0.8, -3]}
        color="#ff6622"
        intensity={0.8}
        distance={15}
        decay={1.0}
        castShadow={false}
      />

      {/* Dim rear fill — skip on mobile to reduce per-pixel light calculations */}
      {!isMobile && (
        <pointLight
          ref={rearRef}
          position={[0, 2.0, 4.0]}
          color="#ffaa77"
          intensity={1.5}
          distance={8}
          decay={1.5}
          castShadow={false}
        />
      )}

      {/* Moonlight / sunlight through door */}
      <spotLight
        ref={doorLightRef}
        position={[0, 3, -8]}
        target-position={[0, 0, 0]}
        intensity={0}
        color="#8ab4d8"
        angle={0.4}
        penumbra={1.0}
        castShadow={false}
      />
    </>
  );
}
