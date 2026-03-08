/** True on touch-primary devices (phones, tablets). Evaluated once at module load. */
export const isMobile =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
