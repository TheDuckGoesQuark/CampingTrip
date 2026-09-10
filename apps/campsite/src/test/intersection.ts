import { act } from "@testing-library/react";

/**
 * jsdom has no layout, so a real `IntersectionObserver` never reports and
 * anything armed by scrolling into view has to be told it happened. `send`
 * reaches the most recent observer built.
 */
export function watchIntersections() {
  const real = globalThis.IntersectionObserver;
  let report: IntersectionObserverCallback | undefined;
  let observer: IntersectionObserver | undefined;

  globalThis.IntersectionObserver = class {
    constructor(callback: IntersectionObserverCallback) {
      report = callback;
      observer = this as unknown as IntersectionObserver;
    }

    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof IntersectionObserver;

  return {
    /** Only `isIntersecting` is read by anything here, so only it is built. */
    send(isIntersecting: boolean): void {
      if (!report) throw new Error("nothing is observing intersections yet");
      act(() => {
        report!([{ isIntersecting } as IntersectionObserverEntry], observer!);
      });
    },

    restore(): void {
      globalThis.IntersectionObserver = real;
    },
  };
}
