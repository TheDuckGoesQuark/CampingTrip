import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useSceneStore } from '../../store/sceneStore';
import { useSessionStore } from '../../store/sessionStore';

export default function WakeUpController() {
  const { camera } = useThree();
  const hasPlayed = useRef(false);
  const hasCompletedWelcome = useSessionStore((s) => s.hasCompletedWelcome);
  const setWakeUpDone = useSceneStore((s) => s.setWakeUpDone);
  const effectsEnabled = useSessionStore((s) => s.effectsEnabled);

  useEffect(() => {
    if (!hasCompletedWelcome || hasPlayed.current) return;
    hasPlayed.current = true;

    const overlay = document.getElementById('wake-up-overlay');
    if (!overlay) {
      // No overlay found — skip animation, just enable scene
      setWakeUpDone();
      return;
    }

    // If user chose "just browsing", skip the cinematic intro
    if (!effectsEnabled) {
      overlay.style.opacity = '0';
      camera.position.set(0, 0.8, 2.5);
      setWakeUpDone();
      return;
    }

    // Start lying down — camera near floor, looking up at tent ceiling
    camera.position.set(0, 0.15, 2.5);

    const tl = gsap.timeline({
      onComplete: () => {
        overlay.style.pointerEvents = 'none';
        setWakeUpDone();
      },
    });

    tl
      // Start fully black
      .set(overlay, { opacity: 1 })

      // Eyes crack open
      .to(overlay, { opacity: 0.3, duration: 0.5, ease: 'power1.out' }, 0.6)
      // Blink closed
      .to(overlay, { opacity: 0.85, duration: 0.12 }, 1.15)
      // Open properly
      .to(overlay, { opacity: 0.0, duration: 0.7, ease: 'power2.out' }, 1.35)

      // Sit up — camera rises from lying to seated
      .to(camera.position, {
        y: 0.8,
        duration: 2.0,
        ease: 'power2.out',
      }, 1.0)

      // Settle sway
      .to(camera.position, { y: 0.74, duration: 0.35, ease: 'power1.inOut' }, 3.0)
      .to(camera.position, { y: 0.8, duration: 0.45, ease: 'power1.inOut' }, 3.35);

    return () => {
      tl.kill();
    };
  }, [hasCompletedWelcome, camera, setWakeUpDone, effectsEnabled]);

  return null;
}
