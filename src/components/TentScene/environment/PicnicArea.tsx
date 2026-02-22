import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { asset } from '../../../utils/assetPath';
import { applyMoireFix } from '../../../utils/materialFixes';

// Credit: "Cosy Picnic Area" on Sketchfab (CC-BY)
// https://sketchfab.com/3d-models/cosy-picnic-area-0a1fc21d723e454b91314809871e1031

const SCALE = 2.88;
// Model is ~2.85 units along X (the long side). After ~83° Y rotation,
// that length runs mostly along Z. Half-length at scale:
const HALF_LENGTH = (2.85 * SCALE) / 2; // ~4.1 units

useGLTF.preload(asset('models/cosy_picnic_area.glb'), true);

export default function PicnicArea() {
  const { scene } = useGLTF(asset('models/cosy_picnic_area.glb'), true);

  // Clone for the second blanket so we don't share the same scene graph
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    applyMoireFix(scene);
    applyMoireFix(clonedScene);
  }, [scene, clonedScene]);

  return (
    <>
      {/* Main blanket — near the door */}
      <group
        position={[-0.3, 0.05, -0.2]}
        rotation={[0, -Math.PI * 0.46, 0]}
        scale={[SCALE, SCALE, SCALE]}
      >
        <primitive object={scene} />
      </group>

      {/* Second blanket — closer to camera, extends the cosy floor */}
      <group
        position={[-0.3, 0.15, -1.3 + HALF_LENGTH]}
        rotation={[0, -Math.PI * 0.52, 0]}
        scale={[SCALE, SCALE, SCALE]}
      >
        <primitive object={clonedScene} />
      </group>
    </>
  );
}
