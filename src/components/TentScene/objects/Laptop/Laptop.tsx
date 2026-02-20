import { useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useSceneStore } from '../../../../store/sceneStore';
import { useUIStore } from '../../../../store/uiStore';
import { useInteractive } from '../../../../hooks/useInteractive';

export default function Laptop() {
  const lidRef          = useRef<THREE.Mesh>(null);
  const laptopState     = useSceneStore((s) => s.laptopState);
  const setLaptopState  = useSceneStore((s) => s.setLaptopState);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);
  const { hovered, handlers } = useInteractive('laptop');

  function handleClick() {
    if (laptopState === 'in-bag' && lidRef.current) {
      setLaptopState('pulled-out');
      gsap.to(lidRef.current.rotation, {
        x: -Math.PI * 0.55,
        duration: 0.7,
        ease: 'power2.out',
        onComplete: () => {
          setLaptopState('open');
          setActiveOverlay('laptop');
        },
      });
    }
  }

  return (
    <group position={[-1.5, 0.05, 0.5]} onClick={handleClick} {...handlers}>
      {/* Base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.03, 0.28]} />
        <meshStandardMaterial
          color={hovered ? '#3a3a3a' : '#2a2a2a'}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
      {/* Lid — animated via GSAP */}
      <group position={[0, 0.015, -0.14]}>
        <mesh ref={lidRef} position={[0, 0.14, 0]} rotation={[-0.05, 0, 0]} castShadow>
          <boxGeometry args={[0.38, 0.26, 0.02]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
