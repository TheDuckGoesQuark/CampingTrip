import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../../store/sceneStore';

export default function OutdoorScene() {
  const doorState = useSceneStore((s) => s.tentDoorState);
  const visible = doorState === 'open' || doorState === 'opening';
  const fireRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  // Flickering campfire light
  useFrame((_, delta) => {
    if (!fireRef.current || !visible) return;
    t.current += delta;
    fireRef.current.intensity = 1.5 + Math.sin(t.current * 8) * 0.3 + Math.sin(t.current * 13) * 0.15;
  });

  return (
    <group position={[0, 0, -4]}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -3]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#1a2d1a" roughness={1} />
      </mesh>

      {/* Dirt patch around campsite */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, -5]} receiveShadow>
        <circleGeometry args={[2.5, 16]} />
        <meshStandardMaterial color="#2a1e0e" roughness={1} />
      </mesh>

      {/* Night sky — gradient via vertex colors */}
      <NightSky />

      {/* Stars */}
      <Stars />

      {/* Trees — layered depth */}
      {/* Close trees */}
      <Tree position={[-2.8, 0, -3]} height={3.5} shade={0} />
      <Tree position={[3.2, 0, -3.5]} height={3} shade={0} />
      {/* Mid trees */}
      <Tree position={[-4.5, 0, -5]} height={4.5} shade={1} />
      <Tree position={[1.5, 0, -6]} height={5} shade={1} />
      <Tree position={[-1, 0, -7]} height={4} shade={1} />
      <Tree position={[4.5, 0, -5.5]} height={3.5} shade={1} />
      {/* Far trees */}
      <Tree position={[-6, 0, -9]} height={5.5} shade={2} />
      <Tree position={[-3, 0, -10]} height={6} shade={2} />
      <Tree position={[2, 0, -9.5]} height={5} shade={2} />
      <Tree position={[5.5, 0, -8]} height={4.5} shade={2} />
      <Tree position={[0, 0, -11]} height={6.5} shade={2} />
      <Tree position={[-5, 0, -11]} height={5} shade={2} />
      <Tree position={[6.5, 0, -10]} height={4} shade={2} />

      {/* === Campfire === */}
      <group position={[0, 0, -5.5]}>
        {/* Fire ring — stones */}
        <CampfireRing />

        {/* Fire embers/glow */}
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial
            color="#ff6a00"
            emissive="#ff4400"
            emissiveIntensity={3}
            transparent
            opacity={0.9}
          />
        </mesh>
        {/* Upper flame */}
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.08, 0.2, 6]} />
          <meshStandardMaterial
            color="#ffaa00"
            emissive="#ff6600"
            emissiveIntensity={2}
            transparent
            opacity={0.7}
          />
        </mesh>

        {visible && (
          <pointLight
            ref={fireRef}
            position={[0, 0.4, 0]}
            color="#ff7a20"
            intensity={1.5}
            distance={6}
            decay={2}
          />
        )}

        {/* Logs */}
        <mesh position={[-0.15, 0.06, 0.05]} rotation={[0, 0.4, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.04, 0.35, 5]} />
          <meshStandardMaterial color="#3d2210" roughness={1} />
        </mesh>
        <mesh position={[0.12, 0.06, -0.05]} rotation={[0, -0.6, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.04, 0.3, 5]} />
          <meshStandardMaterial color="#4a2a14" roughness={1} />
        </mesh>
      </group>

      {/* Distant hills / treeline silhouette */}
      <mesh position={[0, 1.5, -13]}>
        <sphereGeometry args={[8, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#0a1a0a" roughness={1} />
      </mesh>
    </group>
  );
}

function NightSky() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(40, 20, 1, 8);
    const colors = new Float32Array(g.attributes.position.count * 3);
    const topColor = new THREE.Color('#0a0520');
    const bottomColor = new THREE.Color('#1a2040');

    for (let i = 0; i < g.attributes.position.count; i++) {
      const y = g.attributes.position.getY(i);
      const t = (y + 10) / 20; // 0 at bottom, 1 at top
      const c = topColor.clone().lerp(bottomColor, 1 - t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  return (
    <mesh position={[0, 6, -14]} geometry={geo}>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}

function Stars() {
  const geo = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = 3 + Math.random() * 10;
      positions[i * 3 + 2] = -10 - Math.random() * 5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial
        color="#ffffff"
        size={0.06}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

function CampfireRing() {
  const stones = useMemo(() => {
    const items = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 0.22;
      items.push({
        pos: [Math.cos(angle) * r, 0.03, Math.sin(angle) * r] as [number, number, number],
        scale: 0.8 + Math.random() * 0.4,
      });
    }
    return items;
  }, []);

  return (
    <>
      {stones.map((s, i) => (
        <mesh key={i} position={s.pos} scale={s.scale}>
          <sphereGeometry args={[0.04, 5, 5]} />
          <meshStandardMaterial color="#4a4a4a" roughness={1} />
        </mesh>
      ))}
    </>
  );
}

const TREE_SHADES = [
  { trunk: '#2d1f0e', canopy1: '#0d2210', canopy2: '#112a14' }, // close
  { trunk: '#1e150a', canopy1: '#0a1a0d', canopy2: '#0d2010' }, // mid
  { trunk: '#140e06', canopy1: '#071408', canopy2: '#09180a' }, // far (darker, more silhouette)
];

function Tree({
  position,
  height,
  shade = 0,
}: {
  position: [number, number, number];
  height: number;
  shade?: number;
}) {
  const colors = TREE_SHADES[Math.min(shade, 2)];
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, height * 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, height * 0.4, 5]} />
        <meshStandardMaterial color={colors.trunk} roughness={1} />
      </mesh>
      {/* Lower canopy */}
      <mesh position={[0, height * 0.5, 0]} castShadow>
        <coneGeometry args={[height * 0.28, height * 0.45, 6]} />
        <meshStandardMaterial color={colors.canopy1} roughness={1} />
      </mesh>
      {/* Mid canopy */}
      <mesh position={[0, height * 0.65, 0]} castShadow>
        <coneGeometry args={[height * 0.22, height * 0.35, 6]} />
        <meshStandardMaterial color={colors.canopy2} roughness={1} />
      </mesh>
      {/* Top canopy */}
      <mesh position={[0, height * 0.8, 0]} castShadow>
        <coneGeometry args={[height * 0.14, height * 0.25, 6]} />
        <meshStandardMaterial color={colors.canopy2} roughness={1} />
      </mesh>
    </group>
  );
}
