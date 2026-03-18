import { useEffect, useRef, useState } from 'react';

/**
 * Tracks which `[data-step]` child is in the top third of the viewport.
 * Updates the URL hash to enable refresh-to-position.
 */
export function useScrollyProgress(containerRef: React.RefObject<HTMLElement | null>) {
  // Initialise from hash if present (e.g. #step-3)
  const initialStep = () => {
    const match = window.location.hash.match(/^#step-(\d+)$/);
    return match ? Number(match[1]) : 0;
  };

  const [activeStep, setActiveStep] = useState(initialStep);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // On mount, scroll to the anchored step
  useEffect(() => {
    const step = initialStep();
    if (step > 0) {
      const el = document.getElementById(`step-${step}`);
      if (el) {
        // Delay slightly so layout is settled
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'instant' }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const steps = container.querySelectorAll<HTMLElement>('[data-step]');
    if (steps.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-step'));
            if (!Number.isNaN(index)) {
              setActiveStep(index);
              // Update hash without triggering a scroll
              history.replaceState(null, '', `#step-${index}`);
            }
          }
        }
      },
      {
        // Trigger when a section is in the card zone (~12-30% from top)
        rootMargin: '-12% 0px -70% 0px',
        threshold: 0,
      },
    );

    steps.forEach((step) => observerRef.current!.observe(step));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [containerRef]);

  return activeStep;
}
