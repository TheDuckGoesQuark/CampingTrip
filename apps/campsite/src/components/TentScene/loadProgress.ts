import { useProgress } from "@react-three/drei";

import { useSceneStore } from "../../store/sceneStore";

// The loading screen cannot read drei's progress itself without dragging three
// onto the blog's critical path. Seeding as well as subscribing makes the order
// against this chunk's `useGLTF.preload` calls irrelevant.
function push({ progress }: { progress: number }) {
  useSceneStore.getState().setLoadProgress(progress);
}

export function mirrorLoadProgress() {
  useProgress.subscribe(push);
  push(useProgress.getState());
}
