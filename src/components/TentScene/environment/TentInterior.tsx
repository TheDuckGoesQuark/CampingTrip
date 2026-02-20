import { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { useSceneStore } from '../../../store/sceneStore';
import { useInteractive } from '../../../hooks/useInteractive';

// Model bbox: roughly -1 to +1 on each axis, ~2 units wide
// We scale it up so the interior feels like a real tent you're sitting inside.
const TENT_SCALE = 3.5;

// Preload so the model is cached before the scene mounts
useGLTF.preload('/models/tent.glb');

export default function TentInterior() {
  const { scene } = useGLTF('/models/tent.glb');
  const doorRef = useRef<THREE.Object3D>(null);
  const doorState = useSceneStore((s) => s.tentDoorState);
  const setDoorState = useSceneStore((s) => s.setTentDoorState);
  const setFocusTarget = useSceneStore((s) => s.setFocusTarget);
  const { hovered, handlers } = useInteractive('door');

  // Extract named parts from the GLTF scene graph
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const door = scene.getObjectByName('Door');
    if (door) {
      doorRef.current = door;
      // Make door material transparent so we can fade it
      door.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.side = THREE.DoubleSide;
        }
      });
    }
  }, [scene]);

  // Animate door open/close
  useEffect(() => {
    if (!doorRef.current) return;

    if (doorState === 'opening') {
      // Fold the door flap up/back
      gsap.to(doorRef.current.rotation, {
        x: -Math.PI * 0.7,
        duration: 1.0,
        ease: 'power2.out',
        onComplete: () => setDoorState('open'),
      });
      // Fade slightly for effect
      doorRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          gsap.to(child.material, {
            opacity: 0.6,
            duration: 0.8,
          });
        }
      });
    } else if (doorState === 'closing') {
      gsap.to(doorRef.current.rotation, {
        x: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        onComplete: () => setDoorState('closed'),
      });
      doorRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          gsap.to(child.material, {
            opacity: 1,
            duration: 0.6,
          });
        }
      });
    }
  }, [doorState, setDoorState]);

  function handleDoorClick() {
    if (doorState === 'closed') {
      setDoorState('opening');
      setFocusTarget('door');
    } else if (doorState === 'open') {
      setDoorState('closing');
      setFocusTarget('default');
    }
  }

  return (
    <group
      scale={[TENT_SCALE, TENT_SCALE, TENT_SCALE]}
      // Rotate so door faces -Z (toward where camera looks)
      rotation={[0, -Math.PI / 2, 0]}
      position={[0, 2.05, 0]}
    >
      <primitive
        object={scene}
        onClick={handleDoorClick}
        {...handlers}
      />
    </group>
  );
}
