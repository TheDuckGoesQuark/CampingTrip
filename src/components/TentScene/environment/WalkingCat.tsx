import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useInteractionStore } from '../../../store/interactionStore';
import SceneLabel from '../SceneLabel';
import { playCatMeow } from '../../../audio/soundEffects';
import { asset, DRACO_PATH } from '../../../utils/assetPath';
import { applyHighlight, removeHighlight, type EmissiveCache } from '../../../utils/highlight';

// Credit: "Cat Walk" animation (CC-BY)
// Cat strolls past the tent outside, looping back and forth

const CAT_SCALE = 0.018;
const WALK_SPEED = 0.6;
const ANIM_SPEED = 0.5;
const WALK_RANGE = 6;
const WALK_Z = -4.15;
const WALK_Y = 0.15;
const PAUSE_DURATION = 6;

useGLTF.preload(asset('models/cat-walk.glb'), DRACO_PATH);

export default function WalkingCat() {
  const { scene, animations } = useGLTF(asset('models/cat-walk.glb'), DRACO_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const hoveredId = useInteractionStore((s) => s.hoveredId);
  const focusedId = useInteractionStore((s) => s.focusedId);
  const setHovered = useInteractionStore((s) => s.setHovered);
  const isHighlighted = hoveredId === 'cat' || focusedId === 'cat';

  const state = useRef({
    x: -WALK_RANGE,
    direction: 1,
    paused: false,
    pauseTimer: 0,
  });

  const emissiveCache = useRef<EmissiveCache>(new Map());

  const clonedScene = useMemo(() => skeletonClone(scene), [scene]);

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    if (animations.length > 0) {
      const action = mixer.clipAction(animations[0]);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
    }

    clonedScene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(clonedScene);
    };
  }, [clonedScene, animations]);

  // Apply / remove highlight
  useEffect(() => {
    if (!clonedScene) return;
    if (isHighlighted) {
      applyHighlight(clonedScene, emissiveCache.current);
    } else {
      removeHighlight(clonedScene, emissiveCache.current);
    }
  }, [isHighlighted, clonedScene]);

  const handlePointerEnter = useCallback(
    (e: any) => {
      e.stopPropagation();
      setHovered('cat');
      document.body.style.cursor = 'pointer';
    },
    [setHovered],
  );

  const handlePointerLeave = useCallback(
    (e: any) => {
      e.stopPropagation();
      setHovered(null);
      document.body.style.cursor = 'auto';
    },
    [setHovered],
  );

  useFrame((_, delta) => {
    if (!groupRef.current || !mixerRef.current) return;

    const s = state.current;

    if (s.paused) {
      s.pauseTimer += delta;
      if (s.pauseTimer >= PAUSE_DURATION) {
        s.paused = false;
        s.pauseTimer = 0;
        s.direction *= -1;
        s.x = s.direction > 0 ? -WALK_RANGE : WALK_RANGE;
      }
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    mixerRef.current.update(delta * ANIM_SPEED);

    s.x += WALK_SPEED * s.direction * delta;

    if (
      (s.direction > 0 && s.x > WALK_RANGE) ||
      (s.direction < 0 && s.x < -WALK_RANGE)
    ) {
      s.paused = true;
      s.pauseTimer = 0;
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.position.set(s.x, WALK_Y, WALK_Z);
    groupRef.current.rotation.set(
      0,
      s.direction > 0 ? Math.PI / 2 : -Math.PI / 2,
      0,
    );
  });

  return (
    <group
      ref={groupRef}
      scale={[CAT_SCALE, CAT_SCALE, CAT_SCALE]}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={(e: any) => {
        e.stopPropagation();
        playCatMeow();
      }}
    >
      <primitive object={clonedScene} />
      {isHighlighted && (
        <SceneLabel text="Smittens" position={[0, 55, 15]} />
      )}
    </group>
  );
}
