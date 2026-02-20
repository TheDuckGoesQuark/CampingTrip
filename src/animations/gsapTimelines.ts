import gsap from 'gsap';
import * as THREE from 'three';

export function createWakeUpTimeline(refs: {
  overlay: HTMLElement;
  camera: THREE.Camera;
}) {
  const tl = gsap.timeline({ paused: true });

  // Start: lying in sleeping bag — camera at floor level looking up at tent ceiling
  tl.set(refs.camera.position, { x: 0, y: 0.15, z: 2.5 })
    .set(refs.overlay, { opacity: 1, backgroundColor: '#000' })

    // Rain + ambient fades in via audioManager onStart callback (not here)

    // Blink open slowly
    .to(refs.overlay, { opacity: 0.3, duration: 0.4, ease: 'power1.out' }, 0.5)
    .to(refs.overlay, { opacity: 0.9, duration: 0.1 }, 0.95) // blink closed again
    .to(refs.overlay, { opacity: 0.0, duration: 0.6, ease: 'power2.out' }, 1.1)

    // Sit up — camera rises to seated height
    .to(refs.camera.position, { y: 0.8, duration: 1.8, ease: 'power2.out' }, 0.9)

    // Slight sway as you settle into sitting position
    .to(refs.camera.position, { y: 0.75, duration: 0.3, ease: 'power1.inOut' }, 2.7)
    .to(refs.camera.position, { y: 0.8, duration: 0.4, ease: 'power1.inOut' }, 3.0);

  return tl;
}

export function createDoorTimeline(
  doorPivotRotation: THREE.Euler,
  onOpen: () => void,
  onClose: () => void
) {
  return {
    open: () =>
      gsap.to(doorPivotRotation, {
        x: -Math.PI * 0.9,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: onOpen,
      }),
    close: () =>
      gsap.to(doorPivotRotation, {
        x: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: onClose,
      }),
  };
}

export function createLaptopTimeline(
  laptopRef: THREE.Object3D,
  lidRef: THREE.Object3D,
  onPulledOut: () => void,
  onOpen: () => void
) {
  return {
    pullOut: () =>
      gsap.to(laptopRef.position, {
        y: 0.3,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: onPulledOut,
      }),
    open: () =>
      gsap.to(lidRef.rotation, {
        x: -Math.PI * 0.55,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: onOpen,
      }),
    close: () =>
      gsap.to(lidRef.rotation, {
        x: 0,
        duration: 0.5,
        ease: 'power2.inOut',
      }),
  };
}
