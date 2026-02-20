import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audio } from '../../../../audio/audioManager';
import { useSessionStore } from '../../../../store/sessionStore';
import { useInteractive } from '../../../../hooks/useInteractive';

export default function Guitar() {
  const groupRef = useRef<THREE.Group>(null);
  const soundEnabled = useSessionStore((s) => s.soundEnabled);
  const { hovered, handlers } = useInteractive('guitar');

  // Subtle wiggle when hovered
  const t = useRef(0);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    t.current += delta;
    groupRef.current.rotation.z = hovered
      ? 0.15 + Math.sin(t.current * 6) * 0.03
      : THREE.MathUtils.lerp(groupRef.current.rotation.z, 0.15, 0.05);
  });

  function handleClick() {
    if (soundEnabled) audio.playGuitarStrum();
  }

  return (
    <group
      ref={groupRef}
      position={[1.6, 0.3, -1.2]}
      rotation={[0.3, -0.4, 0.15]}
      onClick={handleClick}
      {...handlers}
    >
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.14, 0.28, 6, 12]} />
        <meshStandardMaterial
          color={hovered ? '#a0571a' : '#8b4513'}
          roughness={0.7}
        />
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
