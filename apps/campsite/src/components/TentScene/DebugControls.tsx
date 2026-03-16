import { OrbitControls, Grid } from '@react-three/drei';

/** Orbit controls + visual helpers for debugging scene layout */
export default function DebugControls() {
  return (
    <>
      <OrbitControls makeDefault />
      <axesHelper args={[3]} />
      <Grid
        args={[20, 20]}
        position={[0, 0, 0]}
        cellColor="#444"
        sectionColor="#888"
        fadeDistance={25}
        infiniteGrid
      />
    </>
  );
}
