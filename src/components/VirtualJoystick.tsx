import { useRef, useEffect, useCallback, useState } from 'react';
import { mobileInput } from '../mobileInput';
import { isMobile } from '../utils/deviceDetect';
import { useSceneStore } from '../store/sceneStore';

const SIZE = 110;        // outer ring diameter
const KNOB = 40;         // inner knob diameter
const MAX_R = (SIZE - KNOB) / 2; // max knob travel from center


export default function VirtualJoystick() {
  const [active, setActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const laptopFocused = useSceneStore((s) => s.laptopFocused);

  // Only render on touch devices
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => { setIsTouch(isMobile); }, []);

  const updateKnob = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, MAX_R);
    const angle = Math.atan2(dy, dx);

    const nx = Math.cos(angle) * clamped;
    const ny = Math.sin(angle) * clamped;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }

    // Normalise to -1..1
    mobileInput.x = nx / MAX_R;
    mobileInput.y = ny / MAX_R;
    mobileInput.active = true;
  }, []);

  const resetKnob = useCallback(() => {
    touchId.current = null;
    setActive(false);
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)';
    }
    mobileInput.x = 0;
    mobileInput.y = 0;
    mobileInput.active = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (touchId.current !== null) return;
    const touch = e.touches[e.touches.length - 1];
    touchId.current = touch.identifier;
    setActive(true);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    updateKnob(touch.clientX, touch.clientY);
  }, [updateKnob]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (touchId.current === null) return;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === touchId.current) {
          updateKnob(e.touches[i].clientX, e.touches[i].clientY);
          return;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchId.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId.current) {
          resetKnob();
          return;
        }
      }
    };

    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [updateKnob, resetKnob]);

  if (!isTouch || laptopFocused) return null;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        border: '1.5px solid rgba(255, 220, 150, 0.22)',
        background: 'rgba(255, 220, 150, 0.05)',
        zIndex: 25,
        touchAction: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        ref={knobRef}
        style={{
          width: KNOB,
          height: KNOB,
          borderRadius: '50%',
          background: active
            ? 'rgba(255, 220, 150, 0.28)'
            : 'rgba(255, 220, 150, 0.15)',
          border: '1.5px solid rgba(255, 220, 150, 0.3)',
          transition: active ? 'background 0.1s' : 'transform 0.15s ease-out, background 0.2s',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
