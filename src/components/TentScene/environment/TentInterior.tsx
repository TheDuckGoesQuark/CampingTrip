import { useMemo } from 'react';
import * as THREE from 'three';

const CANVAS_COLOR = '#c9ad6f';
const FLOOR_COLOR  = '#5c4a1e';
const POLE_COLOR   = '#7a5538';

// A-frame tent dimensions
const HALF_W     = 3;       // half floor width (floor = 6 wide)
const RIDGE_H    = 3;       // ridge height at centre
const TENT_FRONT = -3;      // z of front face (toward door)
const TENT_BACK  = 3;       // z of back face (behind camera)
const TENT_DEPTH = TENT_BACK - TENT_FRONT; // 6

// Derived
const SLANT = Math.sqrt(HALF_W ** 2 + RIDGE_H ** 2); // ~4.24
const TILT  = Math.atan2(HALF_W, RIDGE_H);            // ~0.785 rad (45°)

// Door opening (must fit inside the front triangle)
const DOOR_W = 1.6;
const DOOR_H = 2.2;

export default function TentInterior() {
  const { frontWallGeo, backWallGeo } = useMemo(() => {
    // Back wall: solid triangle
    const back = new THREE.Shape();
    back.moveTo(-HALF_W, 0);
    back.lineTo(HALF_W, 0);
    back.lineTo(0, RIDGE_H);
    back.closePath();

    // Front wall: triangle with rectangular door cutout
    const front = new THREE.Shape();
    front.moveTo(-HALF_W, 0);
    front.lineTo(HALF_W, 0);
    front.lineTo(0, RIDGE_H);
    front.closePath();

    const hole = new THREE.Path();
    const hd = DOOR_W / 2;
    hole.moveTo(-hd, 0);
    hole.lineTo(hd, 0);
    hole.lineTo(hd, DOOR_H);
    hole.lineTo(-hd, DOOR_H);
    hole.closePath();
    front.holes.push(hole);

    return {
      frontWallGeo: new THREE.ShapeGeometry(front),
      backWallGeo: new THREE.ShapeGeometry(back),
    };
  }, []);

  const canvasMat = (
    <meshStandardMaterial color={CANVAS_COLOR} roughness={0.9} side={THREE.DoubleSide} />
  );

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HALF_W * 2, TENT_DEPTH]} />
        <meshStandardMaterial color={FLOOR_COLOR} roughness={0.95} />
      </mesh>

      {/* ── Left sloped wall ── */}
      {/* Pivot at left floor edge, tilt inward to meet ridge */}
      <group position={[-HALF_W, 0, 0]}>
        <group rotation={[0, 0, -TILT]}>
          <mesh
            position={[0, SLANT / 2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            receiveShadow
          >
            <planeGeometry args={[TENT_DEPTH, SLANT]} />
            {canvasMat}
          </mesh>
        </group>
      </group>

      {/* ── Right sloped wall ── */}
      <group position={[HALF_W, 0, 0]}>
        <group rotation={[0, 0, TILT]}>
          <mesh
            position={[0, SLANT / 2, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            receiveShadow
          >
            <planeGeometry args={[TENT_DEPTH, SLANT]} />
            {canvasMat}
          </mesh>
        </group>
      </group>

      {/* ── Back wall (solid triangle) ── */}
      <mesh
        position={[0, 0, TENT_BACK]}
        rotation={[0, Math.PI, 0]}
        receiveShadow
        geometry={backWallGeo}
      >
        {canvasMat}
      </mesh>

      {/* ── Front wall (triangle with door cutout) ── */}
      <mesh
        position={[0, 0, TENT_FRONT]}
        receiveShadow
        geometry={frontWallGeo}
      >
        {canvasMat}
      </mesh>

      {/* ── Ridge pole (runs front-to-back along the peak) ── */}
      <mesh
        position={[0, RIDGE_H, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.04, 0.04, TENT_DEPTH + 0.4, 8]} />
        <meshStandardMaterial color={POLE_COLOR} roughness={0.8} />
      </mesh>

      {/* ── Front A-frame pole (left leg) ── */}
      <AFrameLeg z={TENT_FRONT} side={-1} />

      {/* ── Front A-frame pole (right leg) ── */}
      <AFrameLeg z={TENT_FRONT} side={1} />

      {/* ── Back A-frame pole (left leg) ── */}
      <AFrameLeg z={TENT_BACK} side={-1} />

      {/* ── Back A-frame pole (right leg) ── */}
      <AFrameLeg z={TENT_BACK} side={1} />
    </group>
  );
}

/**
 * One leg of an A-frame support: runs from the floor edge up to the ridge.
 * `side`: -1 for left, +1 for right.
 */
function AFrameLeg({ z, side }: { z: number; side: -1 | 1 }) {
  // Pole runs from (side * HALF_W, 0, z) to (0, RIDGE_H, z)
  // Centre at midpoint, rotated to match slope
  return (
    <mesh
      position={[side * HALF_W * 0.5, RIDGE_H / 2, z]}
      rotation={[0, 0, -side * TILT]}
      castShadow
    >
      <cylinderGeometry args={[0.03, 0.04, SLANT, 6]} />
      <meshStandardMaterial color={POLE_COLOR} roughness={0.8} />
    </mesh>
  );
}
