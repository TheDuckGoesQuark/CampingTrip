import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useTimeStore,
  lerpColorKeyframes,
  getNightFactor,
} from '../../../store/timeStore';
import { isMobile } from '../../../utils/deviceDetect';

// ─── Sky gradient keyframes ──────────────────────────────────────
// progress: 0.00 = 6 AM (dawn), 0.25 = noon, 0.50 = 6 PM, 0.75 = midnight

const SKY_TOP = [
  { t: 0.00, color: new THREE.Color('#6688cc') },
  { t: 0.08, color: new THREE.Color('#5599cc') },
  { t: 0.25, color: new THREE.Color('#3366aa') },
  { t: 0.42, color: new THREE.Color('#5577aa') },
  { t: 0.50, color: new THREE.Color('#553388') },
  { t: 0.58, color: new THREE.Color('#1a1040') },
  { t: 0.75, color: new THREE.Color('#0a0520') },
  { t: 1.00, color: new THREE.Color('#6688cc') },
];

const SKY_BOTTOM = [
  { t: 0.00, color: new THREE.Color('#ff7744') },
  { t: 0.08, color: new THREE.Color('#99bbcc') },
  { t: 0.25, color: new THREE.Color('#88bbdd') },
  { t: 0.42, color: new THREE.Color('#ddaa88') },
  { t: 0.50, color: new THREE.Color('#ff5522') },
  { t: 0.58, color: new THREE.Color('#442244') },
  { t: 0.75, color: new THREE.Color('#1a2040') },
  { t: 1.00, color: new THREE.Color('#ff7744') },
];

// ─── Outdoor backdrop ────────────────────────────────────────────

/** Outdoor backdrop visible through the tent door — sky, stars, distant hills.
 *  Trees and campfire come from the Campfire GLB scene. */
export default function OutdoorScene() {
  return (
    <group position={[0, 0, -1]}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -3]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#2a3d2a" roughness={1} />
      </mesh>

      <AnimatedSky />
      <Stars />
      <Clouds />
    </group>
  );
}

// ─── Animated sky gradient ───────────────────────────────────────

function AnimatedSky() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(60, 25, 1, 8);
    // Pre-allocate color buffer
    const colors = new Float32Array(g.attributes.position.count * 3);
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  // Re-usable Color objects to avoid per-frame allocation
  const _top = useMemo(() => new THREE.Color(), []);
  const _bot = useMemo(() => new THREE.Color(), []);
  const _tmp = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const p = useTimeStore.getState().progress;

    lerpColorKeyframes(SKY_TOP, p, _top);
    lerpColorKeyframes(SKY_BOTTOM, p, _bot);

    const colorAttr = meshRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const arr = colorAttr.array as Float32Array;
    const posAttr = meshRef.current.geometry.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      const t = (y + 12.5) / 25; // 0 at bottom, 1 at top
      _tmp.copy(_bot).lerp(_top, t);
      arr[i * 3] = _tmp.r;
      arr[i * 3 + 1] = _tmp.g;
      arr[i * 3 + 2] = _tmp.b;
    }
    colorAttr.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} position={[0, 8, -18]} geometry={geo}>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Stars (fade out during day) ─────────────────────────────────

function Stars() {
  const pointsRef = useRef<THREE.Points>(null);

  const geo = useMemo(() => {
    const count = 150;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = 4 + Math.random() * 12;
      positions[i * 3 + 2] = -12 - Math.random() * 8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const nf = getNightFactor(useTimeStore.getState().progress);
    (pointsRef.current.material as THREE.PointsMaterial).opacity = 0.7 * nf;
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.06} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

// ─── Drifting clouds (visible during day, fade at night) ─────────

const CLOUD_DEFS = Array.from({ length: isMobile ? 7 : 14 }, () => ({
  x: (Math.random() - 0.5) * 40,
  y: 6 + Math.random() * 8,
  z: -14 - Math.random() * 4,
  speed: 0.06 + Math.random() * 0.14,
  sx: 2.5 + Math.random() * 4.5,
  sy: 0.5 + Math.random() * 0.9,
  sz: 1.2 + Math.random() * 2.3,
  baseOpacity: 0.25 + Math.random() * 0.25,
}));

function Clouds() {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    const nf = getNightFactor(useTimeStore.getState().progress);
    const dayFactor = 1 - nf;

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const c = CLOUD_DEFS[i];

      // Slow drift
      mesh.position.x += c.speed * delta;
      if (mesh.position.x > 25) mesh.position.x = -25;

      // Fade based on daytime
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = c.baseOpacity * dayFactor;
    });
  });

  return (
    <>
      {CLOUD_DEFS.map((c, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el; }}
          position={[c.x, c.y, c.z]}
          scale={[c.sx, c.sy, c.sz]}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial
            color="#dde4ee"
            transparent
            opacity={c.baseOpacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
