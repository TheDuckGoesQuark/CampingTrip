// Placeholder — will be replaced with GLTF + GSAP timeline in build stage 11
import { useSceneStore } from '../../../../store/sceneStore';
import { useUIStore } from '../../../../store/uiStore';

export default function Laptop() {
  const laptopState     = useSceneStore((s) => s.laptopState);
  const setLaptopState  = useSceneStore((s) => s.setLaptopState);
  const setActiveOverlay = useUIStore((s) => s.setActiveOverlay);

  function handleClick() {
    if (laptopState === 'in-bag') {
      setLaptopState('open');
      setActiveOverlay('laptop');
    }
  }

  return (
    <group position={[-1.5, 0.05, 0.5]} onClick={handleClick}>
      {/* Base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.03, 0.28]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Lid (open at 110°) */}
      <group position={[0, 0.015, -0.14]}>
        <mesh
          position={[0, 0.14, 0]}
          rotation={[laptopState === 'open' ? -Math.PI * 0.55 : -0.05, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.38, 0.26, 0.02]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
