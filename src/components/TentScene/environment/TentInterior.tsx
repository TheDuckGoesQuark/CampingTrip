import { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { asset } from '../../../utils/assetPath';
import { applyMoireFix } from '../../../utils/materialFixes';

const TENT_SCALE = 4;

useGLTF.preload(asset('models/tent.glb'), true);

export default function TentInterior() {
  const { scene } = useGLTF(asset('models/tent.glb'), true);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    applyMoireFix(scene);

  }, [scene]);

  return (
    <group
      ref={groupRef}
      scale={[TENT_SCALE, TENT_SCALE, TENT_SCALE]}
      position={[0, 0.59 * TENT_SCALE, 0]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <primitive object={scene} />
    </group>
  );
}
