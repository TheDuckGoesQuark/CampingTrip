import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

// Mock GSAP to avoid real animation side effects
vi.mock('gsap', () => {
  const to = vi.fn(() => ({ kill: vi.fn() }));
  const timeline = vi.fn(() => ({
    paused: true,
    set: vi.fn().mockReturnThis(),
    to: vi.fn().mockReturnThis(),
  }));

  return {
    default: { timeline, to },
    __esModule: true,
  };
});

import {
  createWakeUpTimeline,
  createDoorTimeline,
  createLaptopTimeline,
} from './gsapTimelines';
import gsap from 'gsap';

describe('createWakeUpTimeline', () => {
  it('returns a GSAP timeline object', () => {
    const overlay = document.createElement('div');
    const camera = new THREE.PerspectiveCamera();

    const tl = createWakeUpTimeline({ overlay, camera });

    expect(gsap.timeline).toHaveBeenCalledWith({ paused: true });
    expect(tl).toBeDefined();
    expect(tl.set).toBeDefined();
    expect(tl.to).toBeDefined();
  });
});

describe('createDoorTimeline', () => {
  it('returns open and close functions', () => {
    const rotation = new THREE.Euler();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    const tl = createDoorTimeline(rotation, onOpen, onClose);

    expect(tl.open).toBeInstanceOf(Function);
    expect(tl.close).toBeInstanceOf(Function);
  });

  it('calls gsap.to when open is invoked', () => {
    const rotation = new THREE.Euler();
    const tl = createDoorTimeline(rotation, vi.fn(), vi.fn());

    tl.open();
    expect(gsap.to).toHaveBeenCalled();
  });

  it('calls gsap.to when close is invoked', () => {
    const rotation = new THREE.Euler();
    const tl = createDoorTimeline(rotation, vi.fn(), vi.fn());

    tl.close();
    expect(gsap.to).toHaveBeenCalled();
  });
});

describe('createLaptopTimeline', () => {
  it('returns pullOut, open, and close functions', () => {
    const laptop = new THREE.Object3D();
    const lid = new THREE.Object3D();

    const tl = createLaptopTimeline(laptop, lid, vi.fn(), vi.fn());

    expect(tl.pullOut).toBeInstanceOf(Function);
    expect(tl.open).toBeInstanceOf(Function);
    expect(tl.close).toBeInstanceOf(Function);
  });

  it('calls gsap.to for pullOut', () => {
    const laptop = new THREE.Object3D();
    const lid = new THREE.Object3D();
    const tl = createLaptopTimeline(laptop, lid, vi.fn(), vi.fn());

    tl.pullOut();
    expect(gsap.to).toHaveBeenCalled();
  });
});
