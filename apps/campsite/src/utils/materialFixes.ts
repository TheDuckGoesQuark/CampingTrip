import * as THREE from 'three';

/**
 * Fix moiré / shimmer on detailed normal-mapped meshes.
 * Reduces normal map intensity and enables anisotropic filtering.
 */
export function applyMoireFix(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = true;

    const mat = child.material as THREE.MeshStandardMaterial;
    if (mat.normalMap) {
      mat.normalScale = new THREE.Vector2(0.3, 0.3);
      mat.normalMap.anisotropy = 16;
      mat.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
      mat.normalMap.generateMipmaps = true;
    }
    if (mat.map) {
      mat.map.anisotropy = 16;
    }
  });
}

/**
 * Fix dark/invisible metallic GLTF meshes under low environment lighting.
 *
 * Many Sketchfab models are authored for bright studio IBLs. Under our dim
 * "night" Environment preset they appear near-black. This helper:
 *  1. Caps metalness so scene lights contribute a diffuse component
 *  2. Adds warm emissive to simulate ambient tent-light bounce
 *  3. Bumps roughness for softer, broader reflections
 *  4. Lightens pure-black base colors so there's something to shade
 */
export function fixDarkMetallics(mesh: THREE.Mesh) {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

  mats.forEach((mat) => {
    if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
    const stdMat = mat as THREE.MeshStandardMaterial;

    stdMat.envMapIntensity = 3.0;
    stdMat.metalness = Math.min(stdMat.metalness, 0.65);
    stdMat.roughness = Math.max(stdMat.roughness, 0.35);

    // Warm emissive simulates ambient tent lighting on metal
    stdMat.emissive = new THREE.Color(0x331a08);
    stdMat.emissiveIntensity = 0.25;

    // Lighten pure-black base colors so there's something to shade
    const hsl = { h: 0, s: 0, l: 0 };
    stdMat.color.getHSL(hsl);
    if (hsl.l < 0.08) {
      stdMat.color.setHSL(hsl.h, hsl.s, 0.25);
    }

    stdMat.needsUpdate = true;
  });
}
