export function useTouchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}
