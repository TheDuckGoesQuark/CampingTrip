import { useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useSceneStore } from '../../../../store/sceneStore';
import { useInteractive } from '../../../../hooks/useInteractive';

const DOOR_W = 1.6;
const DOOR_H = 2.2;

export default function TentDoor() {
  const pivotRef = useRef<THREE.Group>(null);
  const { tentDoorState, setTentDoorState } = useSceneStore();
  const isIdle = tentDoorState === 'closed' || tentDoorState === 'open';
  const { hovered, handlers } = useInteractive('tent-door');

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
    <group position={[0, DOOR_H, -2.9]} ref={pivotRef}>
      <mesh
        position={[0, -DOOR_H / 2, 0]}
        onClick={handleClick}
        {...handlers}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[DOOR_W, DOOR_H]} />
        <meshStandardMaterial
          color={hovered ? '#d4b87a' : '#c4a96a'}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
