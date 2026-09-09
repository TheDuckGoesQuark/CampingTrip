import ReactThreeTestRenderer from "@react-three/test-renderer";
import * as THREE from "three";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { useTimeStore } from "../../store/timeStore";
import Lighting from "./Lighting";

// The keyframe stops are private to `Lighting.tsx`, so the only way to read one
// is to run a frame of the rig and look at the light it wrote to.

type Renderer = Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;

interface Rig {
  ambient: THREE.AmbientLight;
  hemisphere: THREE.HemisphereLight;
  main: THREE.PointLight;
  campfire: THREE.PointLight;
  door: THREE.SpotLight;
  at: (progress: number) => Promise<void>;
}

async function mountRig(renderer: Renderer): Promise<Rig> {
  const points = renderer.scene
    .findAllByType("PointLight")
    .map((node) => node.instance as THREE.PointLight);

  // Identify by the positions the component gives them, not by scene order.
  const byZ = (z: number) => points.find((light) => light.position.z === z)!;

  return {
    ambient: renderer.scene.findByType("AmbientLight").instance as THREE.AmbientLight,
    hemisphere: renderer.scene.findByType("HemisphereLight").instance as THREE.HemisphereLight,
    main: byZ(0.5),
    campfire: byZ(-3),
    door: renderer.scene.findByType("SpotLight").instance as THREE.SpotLight,
    at: async (progress: number) => {
      useTimeStore.setState({ progress });
      await renderer.advanceFrames(1, 0);
    },
  };
}

const DAWN = 0.0;
const NOON = 0.25;
const DUSK = 0.5;
const MIDNIGHT = 0.75;

describe("Lighting", () => {
  let renderer: Renderer;
  let rig: Rig;

  beforeEach(async () => {
    renderer = await ReactThreeTestRenderer.create(<Lighting />);
    rig = await mountRig(renderer);
  });

  afterEach(async () => {
    await renderer.unmount();
    useTimeStore.setState({ progress: 0 });
  });

  it("makes the ambient light brightest at noon", async () => {
    await rig.at(NOON);
    const noon = rig.ambient.intensity;
    await rig.at(DAWN);
    const dawn = rig.ambient.intensity;
    await rig.at(MIDNIGHT);
    const midnight = rig.ambient.intensity;

    expect(noon).toBeGreaterThan(dawn);
    expect(noon).toBeGreaterThan(midnight);
  });

  it("burns the overhead lantern hardest at night", async () => {
    await rig.at(MIDNIGHT);
    const midnight = rig.main.intensity;
    await rig.at(NOON);
    const noon = rig.main.intensity;

    expect(midnight).toBeGreaterThan(noon);
  });

  it("keeps every animated intensity positive across the cycle", async () => {
    for (let step = 0; step < 20; step++) {
      await rig.at(step / 20);

      expect(rig.ambient.intensity).toBeGreaterThan(0);
      expect(rig.hemisphere.intensity).toBeGreaterThan(0);
      expect(rig.main.intensity).toBeGreaterThan(0);
      expect(rig.campfire.intensity).toBeGreaterThan(0);
    }
  });

  it("moves the ambient light continuously, with no jump between frames", async () => {
    await rig.at(0);
    let previous = rig.ambient.intensity;

    for (let step = 1; step <= 100; step++) {
      await rig.at(step / 100);
      const current = rig.ambient.intensity;

      expect(Math.abs(current - previous)).toBeLessThan(0.15);
      previous = current;
    }
  });

  it("turns the door light from moonlight to sunlight", async () => {
    await rig.at(MIDNIGHT);

    expect(rig.door.color.b).toBeGreaterThan(rig.door.color.r);

    await rig.at(NOON);

    expect(rig.door.color.r).toBeGreaterThan(rig.door.color.b);
  });

  it("cools the hemisphere sky from dusk to noon", async () => {
    await rig.at(DUSK);
    const dusk = rig.hemisphere.color.clone();
    await rig.at(NOON);

    expect(dusk.r - dusk.b).toBeGreaterThan(rig.hemisphere.color.r - rig.hemisphere.color.b);
  });
});

describe("Lighting in debug mode", () => {
  it("renders a flat rig that ignores the clock", async () => {
    const renderer = await ReactThreeTestRenderer.create(<Lighting debug />);
    const ambient = renderer.scene.findByType("AmbientLight").instance as THREE.AmbientLight;

    useTimeStore.setState({ progress: NOON });
    await renderer.advanceFrames(1, 0);
    const noon = ambient.intensity;

    useTimeStore.setState({ progress: MIDNIGHT });
    await renderer.advanceFrames(1, 0);

    expect(ambient.intensity).toBe(noon);
    expect(renderer.scene.findAllByType("PointLight")).toHaveLength(0);

    await renderer.unmount();
    useTimeStore.setState({ progress: 0 });
  });
});
