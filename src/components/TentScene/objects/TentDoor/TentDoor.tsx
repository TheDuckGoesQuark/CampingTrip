import { useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useSceneStore } from '../../../../store/sceneStore';

// The door is a child of a pivot group whose origin sits at the top of the door frame.
// Rotating the pivot's X axis folds the door upward toward the tent ceiling.
const DOOR_W = 1.6;
const DOOR_H = 2.2;

export default function TentDoor() {
  const pivotRef = useRef<THREE.Group>(null);
  const { tentDoorState, setTentDoorState } = useSceneStore();
  const isIdle = tentDoorState === 'closed' || tentDoorState === 'open';

  function handleClick() {
    if (!pivotRef.current || !isIdle) return;

    if (tentDoorState === 'closed') {
      setTentDoorState('opening');
      gsap.to(pivotRef.current.rotation, {
        x: -Math.PI * 0.9,
        duration: 0.85,
        ease: 'power2.out',
        onComplete: () => setTentDoorState('open'),
      });
    } else {
      setTentDoorState('closing');
      gsap.to(pivotRef.current.rotation, {
        x: 0,
        duration: 0.65,
        ease: 'power2.inOut',
        onComplete: () => setTentDoorState('closed'),
      });
    }
  }

  return (
    // Pivot positioned at the top edge of the door frame
    <group
      position={[0, DOOR_H, -2.9]}
      ref={pivotRef}
    >
      {/* Door mesh hangs down from the pivot */}
      <mesh
        position={[0, -DOOR_H / 2, 0]}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[DOOR_W, DOOR_H]} />
        <meshStandardMaterial
          color="#c4a96a"
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle click hint — thin outline */}
      <lineSegments position={[0, -DOOR_H / 2, 0.01]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(DOOR_W, DOOR_H)]} />
        <lineBasicMaterial color="#8b6040" transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}
