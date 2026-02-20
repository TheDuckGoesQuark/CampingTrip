import * as THREE from 'three';

// Waypoints for the cat wander path across the tent floor and toward the door
export const wanderPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(1.5,  0, 0.5),   // sleeping spot (right of camera)
  new THREE.Vector3(0.8,  0, 0.0),
  new THREE.Vector3(0.0,  0, -0.8),
  new THREE.Vector3(-0.5, 0, -1.5),  // toward door
  new THREE.Vector3(0.0,  0, -2.4),  // door threshold
]);

// Shorter loop path when awake-inside (wandering near sleeping bag)
export const idlePath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(1.5,  0, 0.5),
  new THREE.Vector3(1.2,  0, 0.0),
  new THREE.Vector3(1.5,  0, -0.4),
  new THREE.Vector3(1.8,  0, 0.1),
  new THREE.Vector3(1.5,  0, 0.5),
], true); // closed loop
