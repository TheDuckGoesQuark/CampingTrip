import * as THREE from 'three';

export type EmissiveCache = Map<string, { color: THREE.Color; intensity: number }>;

/**
 * Apply a warm emissive highlight to all standard/physical materials in a
 * subtree. Saves original values into `cache` so they can be restored later.
 * Meshes with `userData.skipHighlight = true` are left untouched.
 */
export function applyHighlight(root: THREE.Object3D, cache: EmissiveCache) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return;
    if (child.userData?.skipHighlight) return;

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((mat, i) => {
      if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) return;
      const key = `${child.uuid}-${i}`;
      if (!cache.has(key)) {
        cache.set(key, {
          color: mat.emissive.clone(),
          intensity: mat.emissiveIntensity,
        });
      }
      mat.emissive.set(0x442200);
      mat.emissiveIntensity = 0.35;
    });
  });
}

/**
 * Remove highlight — restores original emissive values from `cache` and
 * clears the cache.
 */
export function removeHighlight(root: THREE.Object3D, cache: EmissiveCache) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return;
    if (child.userData?.skipHighlight) return;

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((mat, i) => {
      const key = `${child.uuid}-${i}`;
      const orig = cache.get(key);
      if (orig) {
        mat.emissive.copy(orig.color);
        mat.emissiveIntensity = orig.intensity;
      }
    });
  });
  cache.clear();
}
