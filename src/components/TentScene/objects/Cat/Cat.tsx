import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../../../store/sceneStore';
import { useInteractive } from '../../../../hooks/useInteractive';

const FUR_COLOR = '#e8c88a';
const FUR_DARK = '#d4a870';
const NOSE_COLOR = '#cc8888';

/** Curled-up sleeping cat with blinking eyes and animated tail */
export default function Cat() {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const catLocation = useSceneStore((s) => s.catLocation);
  const { hovered, handlers } = useInteractive('cat');

  // Time accumulator
  const t = useRef(0);
  // Track blink state
  const nextBlink = useRef(2 + Math.random() * 4);

  // Eye shape: a small flat ellipse, scaled down on Y to "close"
  const eyeShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.ellipse(0, 0, 0.018, 0.012, 0, Math.PI * 2, false, 0);
    return shape;
  }, []);

  useFrame((_, delta) => {
    t.current += delta;

    // Breathing bob
    if (groupRef.current && catLocation === 'sleeping') {
      groupRef.current.position.y = Math.sin(t.current * 1.2) * 0.012;
    }

    // Tail sway
    if (tailRef.current) {
      const speed = hovered ? 4 : 1.5;
      const amount = hovered ? 0.25 : 0.12;
      tailRef.current.rotation.y = Math.sin(t.current * speed) * amount;
    }

    // Blinking eyes — scale Y between 1 (open) and 0.05 (closed)
    if (leftEyeRef.current && rightEyeRef.current) {
      const elapsed = t.current;
      let eyeScale = 1;

      if (elapsed > nextBlink.current) {
        // Blink lasts ~0.15s
        const blinkProgress = elapsed - nextBlink.current;
        if (blinkProgress < 0.07) {
          eyeScale = 1 - blinkProgress / 0.07; // closing
        } else if (blinkProgress < 0.15) {
          eyeScale = (blinkProgress - 0.07) / 0.08; // opening
        } else {
          // Schedule next blink
          nextBlink.current = elapsed + 2 + Math.random() * 5;
        }
      }

      eyeScale = Math.max(0.05, eyeScale);
      leftEyeRef.current.scale.y = eyeScale;
      rightEyeRef.current.scale.y = eyeScale;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[1.5, 0.08, 0.5]}
      rotation={[0, -0.4, 0]}
      {...handlers}
    >
      {/* === Body — curled oval lying on side === */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.09, 0.2, 6, 12]} />
        <meshStandardMaterial
          color={hovered ? '#f0d49a' : FUR_COLOR}
          roughness={0.9}
        />
      </mesh>

      {/* Belly curve — slight bulge underneath */}
      <mesh position={[0, -0.04, 0.03]} castShadow>
        <sphereGeometry args={[0.085, 8, 8]} />
        <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
      </mesh>

      {/* === Head === */}
      <group position={[0.18, 0.05, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.085, 10, 10]} />
          <meshStandardMaterial
            color={hovered ? '#f0d49a' : FUR_COLOR}
            roughness={0.9}
          />
        </mesh>

        {/* Left ear */}
        <mesh position={[-0.045, 0.075, -0.01]} rotation={[0, 0, -0.15]} castShadow>
          <coneGeometry args={[0.028, 0.055, 4]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.9} />
        </mesh>
        {/* Inner left ear */}
        <mesh position={[-0.045, 0.073, 0.005]} rotation={[0, 0, -0.15]}>
          <coneGeometry args={[0.015, 0.035, 4]} />
          <meshStandardMaterial color={NOSE_COLOR} roughness={0.9} />
        </mesh>

        {/* Right ear */}
        <mesh position={[0.045, 0.075, -0.01]} rotation={[0, 0, 0.15]} castShadow>
          <coneGeometry args={[0.028, 0.055, 4]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.9} />
        </mesh>
        {/* Inner right ear */}
        <mesh position={[0.045, 0.073, 0.005]} rotation={[0, 0, 0.15]}>
          <coneGeometry args={[0.015, 0.035, 4]} />
          <meshStandardMaterial color={NOSE_COLOR} roughness={0.9} />
        </mesh>

        {/* Left eye */}
        <mesh
          ref={leftEyeRef}
          position={[-0.032, 0.015, 0.078]}
          rotation={[0, 0, 0]}
        >
          <shapeGeometry args={[eyeShape]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>

        {/* Right eye */}
        <mesh
          ref={rightEyeRef}
          position={[0.032, 0.015, 0.078]}
          rotation={[0, 0, 0]}
        >
          <shapeGeometry args={[eyeShape]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.01, 0.082]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color={NOSE_COLOR} roughness={0.7} />
        </mesh>
      </group>

      {/* === Front paws — tucked under chin === */}
      <mesh position={[0.14, -0.06, 0.04]} castShadow>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[0.14, -0.06, -0.04]} castShadow>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
      </mesh>

      {/* === Back haunches — rounded bump at rear === */}
      <mesh position={[-0.14, 0.0, 0.02]} castShadow>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshStandardMaterial color={FUR_COLOR} roughness={0.9} />
      </mesh>

      {/* === Tail — curled around body, animated sway === */}
      <group ref={tailRef} position={[-0.18, 0.0, 0.0]}>
        {/* Tail base */}
        <mesh position={[-0.02, 0, 0.06]} rotation={[0, 0.8, 0]} castShadow>
          <capsuleGeometry args={[0.018, 0.1, 4, 8]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.9} />
        </mesh>
        {/* Tail tip — curls forward */}
        <mesh position={[0.02, 0, 0.13]} rotation={[0, 1.2, 0]} castShadow>
          <capsuleGeometry args={[0.015, 0.08, 4, 8]} />
          <meshStandardMaterial color={FUR_DARK} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
