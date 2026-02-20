import { useSceneStore } from '../../../store/sceneStore';

/** Soft mat / groundsheet covering the tent floor. Click to reset camera focus. */
export default function Groundsheet() {
  const setFocusTarget = useSceneStore((s) => s.setFocusTarget);

  return (
    <mesh
      position={[0, 0.005, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={() => setFocusTarget('default')}
    >
      <planeGeometry args={[5, 5.5]} />
      <meshStandardMaterial
        color="#6a7d5a"
        roughness={0.92}
        metalness={0}
      />
    </mesh>
  );
}
