// Placeholder — will be replaced with GLTF in build stage 12
import { audio } from '../../../../audio/audioManager';
import { useSessionStore } from '../../../../store/sessionStore';

export default function Guitar() {
  const soundEnabled = useSessionStore((s) => s.soundEnabled);

  function handleClick() {
    if (soundEnabled) audio.playGuitarStrum();
  }

  return (
    <group position={[1.6, 0.3, -1.2]} rotation={[0.3, -0.4, 0.15]} onClick={handleClick}>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.14, 0.28, 6, 12]} />
        <meshStandardMaterial color="#8b4513" roughness={0.7} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.025, 0.45, 4, 8]} />
        <meshStandardMaterial color="#c8a060" roughness={0.6} />
      </mesh>
      {/* Sound hole */}
      <mesh position={[0, 0, 0.15]}>
        <circleGeometry args={[0.06, 12]} />
        <meshStandardMaterial color="#2a1205" roughness={1} />
      </mesh>
    </group>
  );
}
