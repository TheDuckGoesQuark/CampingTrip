export type TentDoorState = "closed" | "opening" | "open" | "closing";
export type SceneName = "tent" | "forest";
export type FocusTarget = "default" | "lantern" | "laptop" | "door" | "guitar" | "notepad";
/** Which overlay a route opens. Exactly one is open at a time. */
export type OverlayKind = "laptop" | "notepad" | "music";
