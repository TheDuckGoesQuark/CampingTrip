# Cosy Tent Personal Website — Implementation Plan (v2)

## Context
A personal website built as a geocities-style art experiment. The main experience is a cosy tent interior built with React Three Fiber — real 3D with proper lighting, but the camera is controlled and locked to a "diorama" view (like looking into a shadow box), not a free-roaming 3D game. Mouse movement creates subtle parallax by nudging the camera position slightly. Warm lantern lighting is a core part of the feel. TypeScript + React. Supports desktop and mobile.

---

## Core Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| 3D engine | React Three Fiber (R3F) | Real lighting, shadows, no CSS clip-path hacks |
| Camera model | Locked perspective, narrow FOV (~45°) | Diorama/shadow-box feel without full orbit |
| Parallax | Camera position nudge via `useFrame` lerp | No CSS vars, no Zustand — pure Three.js |
| Animation | GSAP (free) + `useFrame` + Three.js AnimationMixer | One approach per concern, no library duplication |
| Art assets | GLTF models (sourced free/CC0) | No SVG illustration work required |
| State | Zustand for app state only (not per-frame data) | Clear separation; per-frame stays in Three.js |
| Lighting | `PointLight` at lantern + `AmbientLight` | Real shadows, warm falloff, multiple sources later |
| Audio | Howler.js + raw Web Audio API (AC sounds) | Howler for spatial/looping, Web Audio for typing |
| UI overlays | HTML/React outside the Canvas | Welcome screen, laptop screen, tooltips |

---

## Tech Stack

```
vite + react + typescript          — build + framework
@react-three/fiber                 — React renderer for Three.js
@react-three/drei                  — helpers: useGLTF, Html, useProgress, etc.
three                              — 3D engine
gsap (free)                        — complex animation timelines
zustand (with persist)             — app-level state
howler                             — audio management
css modules                        — scoped styles for HTML overlays
```

---

## Project Structure

```
src/
├── main.tsx
├── App.tsx                        # WelcomeScreen → Scene transition gate
│
├── store/
│   ├── sessionStore.ts            # soundEnabled, effectsEnabled, hasCompletedWelcome (persisted)
│   ├── sceneStore.ts              # tentDoorState, catLocation, lanternOn, laptopState
│   └── uiStore.ts                 # hoveredObject, activeOverlay ('none'|'laptop'|'guitar')
│
├── hooks/
│   ├── useTypingSound.ts          # Web Audio API — triangle oscillator, C pentatonic
│   ├── useReducedMotion.ts        # prefers-reduced-motion media query
│   └── useTouchDevice.ts          # pointer: coarse detection
│
├── audio/
│   └── audioManager.ts            # Howler singleton + sceneStore.subscribe() side effects
│
├── components/
│   ├── WelcomeScreen/
│   │   ├── WelcomeScreen.tsx      # Full-screen HTML overlay, manages welcome flow
│   │   ├── WelcomeScreen.module.css
│   │   ├── TypingMessage.tsx      # Char-by-char reveal + typing sounds
│   │   └── OptionButtons.tsx      # "Full experience" / "Just browsing"
│   │
│   ├── TentScene/
│   │   ├── TentScene.tsx          # R3F <Canvas> wrapper, suspense boundary
│   │   ├── SceneContent.tsx       # All 3D objects composed here
│   │   ├── CameraController.tsx   # useFrame mouse parallax + GSAP focus transitions
│   │   ├── Lighting.tsx           # AmbientLight + lantern PointLight + outdoor spot
│   │   │
│   │   ├── environment/
│   │   │   ├── TentInterior.tsx   # Walls, ceiling, floor — built from R3F geometry primitives
│   │   │   ├── OutdoorScene.tsx   # Trees, ground, sky — visible through door opening
│   │   │   └── RainSystem.tsx     # THREE.Points particle system
│   │   │
│   │   └── objects/
│   │       ├── Cat/
│   │       │   ├── Cat.tsx        # Loads GLTF, owns AnimationMixer, reads catLocation
│   │       │   └── catPaths.ts    # CatmullRomCurve3 waypoints for wander path
│   │       ├── TentDoor/
│   │       │   ├── TentDoor.tsx   # Door mesh, owns GSAP fold timeline
│   │       │   └── doorTimeline.ts# GSAP timeline factory
│   │       ├── Lantern/
│   │       │   └── Lantern.tsx    # Mesh + PointLight child, toggle drives Lighting.tsx
│   │       ├── Laptop/
│   │       │   ├── Laptop.tsx     # GLTF + GSAP pull-out/open timeline
│   │       │   └── LaptopScreen.tsx # Html overlay (drei) with project list
│   │       └── Guitar/
│   │           └── Guitar.tsx     # GLTF + click handler
│   │
│   ├── overlays/
│   │   ├── ProjectsOverlay.tsx    # Full laptop screen — project cards
│   │   ├── Tooltip.tsx            # Hover label (Html from drei, or fixed HTML)
│   │   └── LoadingScreen.tsx      # Asset loading progress (useProgress from drei)
│   │
│   └── effects/
│       └── Vignette.tsx           # CSS post-processing: dark edges HTML overlay
│
├── animations/
│   ├── gsapTimelines.ts           # createWakeUpTimeline, createDoorTimeline, createLaptopTimeline
│   └── easings.ts                 # Shared cubic-bezier + GSAP ease strings
│
├── data/
│   └── projects.ts                # { title, url, description, year }[]
│
├── styles/
│   ├── global.css                 # Reset, font-face, :root tokens
│   └── tokens.css                 # CSS custom properties for HTML overlay theming
│
└── types/
    ├── scene.ts                   # TentDoorState, CatLocation, LaptopState
    └── project.ts

public/
├── models/                        # GLTF/GLB assets (see sources below)
│   ├── cat.glb
│   ├── guitar.glb
│   ├── lantern.glb
│   ├── laptop.glb
│   └── sleeping-bag.glb
└── audio/
    ├── rain-ambient.mp3
    ├── rain-heavy.mp3
    ├── cat-purr.mp3
    ├── cat-meow.mp3
    ├── cat-scratch.mp3
    ├── lantern-click.mp3
    ├── tent-door-rustle.mp3
    └── guitar-strum.mp3
```

---

## Camera System

### POV: inside the tent, looking out

The camera is the player — sitting up in their sleeping bag near the back of the tent, looking toward the door. The beautiful rainy exterior is framed by the tent door ahead. Objects surround the camera.

```
Camera position: (0, 0.8, 2.5)    — near back of tent, sitting-up height
Camera target:   (0, 0.5, -2.5)   — toward the tent door / outside
FOV:             65°               — slightly wider than default, immersive interior feel

Tent layout (from camera's perspective):
  - Tent door:      straight ahead   (0,  0.8, -2.5)
  - Lantern:        above you        (0,  2.2,  0.5)
  - Cat + bag:      right side       (1.5, 0,   0.5)
  - Laptop bag:     left side        (-1.5, 0,  0.5)
  - Guitar:         right far corner (2,   0,  -1.5)
  - Your sleeping bag: at camera position, implied
```

### Mouse parallax — zero React state

Mouse movement shifts the camera slightly left/right/up/down — the "looking around" feel. Implemented entirely in `useFrame` via a ref. No React state, no re-renders.

```typescript
// CameraController.tsx
const mouseRef = useRef({ x: 0, y: 0 });
const basePos    = new THREE.Vector3(0, 0.8, 2.5);
const baseTarget = new THREE.Vector3(0, 0.5, -2.5);
const lookAtTarget = useRef(baseTarget.clone());

useEffect(() => {
  const onMove = (e: MouseEvent) => {
    mouseRef.current.x = (e.clientX / window.innerWidth  - 0.5);
    mouseRef.current.y = (e.clientY / window.innerHeight - 0.5);
  };
  window.addEventListener('mousemove', onMove);
  return () => window.removeEventListener('mousemove', onMove);
}, []);

useFrame(({ camera }) => {
  // Camera position shifts subtly (looking around inside the tent)
  const targetX = basePos.x + mouseRef.current.x * 0.4;
  const targetY = basePos.y - mouseRef.current.y * 0.15;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.04);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.04);

  // lookAt also shifts to pan the view slightly
  lookAtTarget.current.x = THREE.MathUtils.lerp(lookAtTarget.current.x, mouseRef.current.x * 0.5, 0.04);
  camera.lookAt(lookAtTarget.current);
});
```

No CSS vars. No Zustand. No re-renders. Pure Three.js at 60fps.

### Focus transitions (click-to-focus)

Clicking an object pivots and glides the camera to look at it closely, then back.

```typescript
const presets = {
  default:  { pos: [0, 0.8, 2.5],    target: [0, 0.5, -2.5] },  // looking toward door
  lantern:  { pos: [0, 1.8, 1.5],    target: [0, 2.2,  0.5] },  // look up at lantern
  laptop:   { pos: [-1.2, 0.6, 1.5], target: [-1.5, 0.3, 0.5] },
  door:     { pos: [0, 0.9, 1.0],    target: [0, 0.8, -3.0] },   // lean toward door
  guitar:   { pos: [1.5, 0.8, 0.5],  target: [2.0, 0.5, -1.5] },
};
```

Mouse parallax lerp factor drops to near zero during GSAP transitions, restored on complete.

### Mobile parallax

`touchmove` or `DeviceOrientation` writes to the same `mouseRef`. No Zustand. DeviceOrientation permission requested on iOS during welcome screen "Full Experience" tap.

---

## Expanding to a Full World (future)

Yes — completely realistic. The architecture is designed for it.

When the user opens the tent door and steps through, GSAP glides the camera forward through the door opening into the outdoor scene. A `currentScene` field in `sceneStore` (`'tent' | 'forest' | ...`) controls which scene geometry is active. The outdoor scene already needs to be partially built (visible through the door) — extending it to a walkable forest is additive work.

```typescript
// sceneStore.ts — add:
type SceneName = 'tent' | 'forest' | 'clifftop' | ...;
currentScene: SceneName;
transitionToScene: (scene: SceneName, entryPoint?: THREE.Vector3) => void;
```

Possible world structure:
```
[Tent interior] → [Forest clearing with campfire → music]
                → [Forest path → deeper woods]
                → [Cliff edge with view → about page]
```

Each "area" is a self-contained component under `src/components/scenes/`. The transition is a GSAP camera glide with a cross-fade or brief darkness between scenes. The low-poly style stays consistent throughout. The world is yours to grow.

---

## Lighting Design

```typescript
// Lighting.tsx
<AmbientLight intensity={lanternOn ? 0.15 : 0.05} color="#1a0f2e" />   // cold, dim, night blue

// Lantern — warm, casts shadows
<PointLight
  ref={lanternLightRef}
  position={[0, 2.2, -0.5]}   // lantern position
  intensity={lanternOn ? 2.5 : 0}
  color="#ffb347"               // warm amber
  distance={6}                  // falloff radius
  decay={2}                     // physically correct falloff
  castShadow
  shadow-mapSize={[512, 512]}
/>

// When tent door is open: cold blue light from outside
<SpotLight
  position={[0, 1.5, -4]}      // outside, shining through door gap
  target-position={[0, 0, 0]}
  intensity={doorOpen ? 0.8 : 0}
  color="#4a7fa5"               // cold rainy-day blue
  angle={0.4}
  penumbra={0.8}
/>
```

When lantern is off and door is closed: scene is very dark. Ambient only. This is intentional — makes the lantern toggle feel significant.

All mesh components set `castShadow` and `receiveShadow`. The tent floor and walls receive shadows.

---

## State Architecture (Zustand)

**Only app-level state lives here. Nothing per-frame.**

```typescript
// sceneStore.ts
type TentDoorState = 'closed' | 'opening' | 'open' | 'closing';
type CatLocation  = 'sleeping' | 'awake-inside' | 'outside' | 'scratching';
type LaptopState  = 'in-bag' | 'pulled-out' | 'open' | 'closing';

interface SceneState {
  tentDoorState: TentDoorState;
  catLocation:   CatLocation;
  lanternOn:     boolean;
  laptopState:   LaptopState;
  // Actions
  setTentDoorState: (s: TentDoorState) => void;
  setCatLocation:   (l: CatLocation) => void;
  toggleLantern:    () => void;
  setLaptopState:   (s: LaptopState) => void;
}
```

**Audio side effects — not in components:**
```typescript
// audioManager.ts — called once at App init
sceneStore.subscribe(s => s.tentDoorState, state => {
  if (state === 'opening') { howler.door.play('rustle'); howler.rain.fade(0.3, 0.9, 800); }
  if (state === 'closed')  { howler.rain.fade(0.9, 0.3, 600); }
});
sceneStore.subscribe(s => s.lanternOn, on => {
  howler.lantern.play(on ? 'click-on' : 'click-off');
});
```

---

## Animation System

### Clear division of responsibility

| Animation | Tool | Why |
|---|---|---|
| Cat breathing, tail sway | `useFrame` in Cat.tsx | Continuous, per-frame, no need for library |
| Cat blink | `useFrame` + random timer ref | Same |
| GLTF skeletal animation (cat walk, idle) | `THREE.AnimationMixer` | Native to the GLTF format |
| Cat wander path | `THREE.CatmullRomCurve3` + `useFrame` | Native Three.js, no paid plugin needed |
| Wake-up intro timeline | GSAP | Multi-step sequence with precise timing |
| Tent door 3D fold | GSAP | `rotateY` on door mesh ref |
| Laptop pull-out + open | GSAP | Position + rotation timeline with callbacks |
| Camera focus transitions | GSAP | Smooth position + lookAt interpolation |
| Lantern intensity change | Direct Three.js ref | `lightRef.current.intensity = value` in handler |

GSAP is the only animation library. It works on Three.js object refs directly:
```typescript
gsap.to(doorMeshRef.current.rotation, { y: -Math.PI * 0.85, duration: 0.8, ease: 'power2.out' });
```

### Cat wander path — no paid plugin
```typescript
// catPaths.ts
export const wanderPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1.5, 0, 0.5),   // sleeping bag
  new THREE.Vector3(-0.5, 0, -0.5),
  new THREE.Vector3(0.5, 0, -1.0),   // tent door
]);

// In Cat.tsx useFrame:
const t = useRef(0);
useFrame((_, delta) => {
  if (catLocation !== 'outside') return;
  t.current = Math.min(t.current + delta * 0.3, 1);
  const point = wanderPath.getPoint(t.current);
  catGroupRef.current.position.lerp(point, 0.1);
});
```

---

## Wake-up GSAP Timeline

Camera starts lying in the sleeping bag inside the tent — very low, looking up at the canvas ceiling with the lantern glow above. Then rises and tilts forward to the sitting-up POV looking toward the door.

```typescript
// gsapTimelines.ts
export function createWakeUpTimeline(refs: { overlay: HTMLElement; camera: THREE.Camera }) {
  const tl = gsap.timeline({ paused: true });

  // Start: lying in sleeping bag — camera near floor, tilted upward looking at ceiling
  tl.set(refs.camera.position, { x: 0, y: 0.15, z: 2.5 })
    .set(refs.overlay, { opacity: 1, background: '#000' })

  // Eyes open — blink sequence (like waking slowly)
    .to(refs.overlay, { opacity: 0.3, duration: 0.4, ease: 'power1.out' }, 0.5)
    .to(refs.overlay, { opacity: 0.9, duration: 0.1 }, 0.95)   // blink closed again
    .to(refs.overlay, { opacity: 0.0, duration: 0.6, ease: 'power2.out' }, 1.1)  // open properly

  // Sit up — camera rises and tilts forward to look toward the door
    .to(refs.camera.position, {
      y: 0.8,        // sitting-up height
      duration: 1.8,
      ease: 'power2.out'
    }, 0.9)

    // Slight sway as you settle
    .to(refs.camera.position, { y: 0.75, duration: 0.3, ease: 'power1.inOut' }, 2.7)
    .to(refs.camera.position, { y: 0.8,  duration: 0.4, ease: 'power1.inOut' }, 3.0);

  return tl;
}
```

---

## Tent Door (3D fold)

In 3D, this is simple: the door is a mesh with a pivot at its top edge. GSAP rotates it.

```typescript
// TentDoor.tsx
const doorPivotRef = useRef<THREE.Group>(null);

function openDoor() {
  sceneStore.setTentDoorState('opening');
  gsap.to(doorPivotRef.current!.rotation, {
    x: -Math.PI * 0.9,   // fold up toward tent ceiling
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => sceneStore.setTentDoorState('open')
  });
}
```

No clip-paths. No masking. The outdoor scene geometry is behind the tent opening — when the door rotates away, it's simply visible. This is how 3D works.

---

## Tent Interior Geometry

Built from R3F primitives — no Blender needed for the tent shell:

```tsx
// TentInterior.tsx
// Back wall: angled plane
// Two side walls: angled planes meeting at a ridge pole
// Floor: flat plane with texture (from Poly Haven CC0)
// Tent poles: cylinders
// Ridge rope: thin cylinder connecting peak to each end

<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
  <planeGeometry args={[6, 8]} />
  <meshStandardMaterial color="#8b6914" roughness={0.9} />
</mesh>
```

For canvas texture on walls: source a fabric/canvas texture from Poly Haven (CC0) and apply as `map` to `meshStandardMaterial`.

---

## Asset Sources

| Asset | Source | License | URL |
|---|---|---|---|
| **Animated cat** | Quaternius Animal Pack Vol.2 (via OpenGameArt) | CC0 | opengameart.org/content/animated-animales-low-poly |
| **Guitar** | Sketchfab — search "low poly guitar" | CC-BY or CC0 | sketchfab.com/tags/low-poly-guitar |
| **Lantern** | Sketchfab — "LowPoly Lantern" by USBEN | Check per-model | sketchfab.com |
| **Sleeping bag** | Sketchfab — "Camping sleeping bag" by Fochdog | Check per-model | sketchfab.com |
| **Laptop** | Kenney Furniture Kit or Sketchfab | CC0 | kenney.nl/assets/furniture-kit |
| **Trees / outdoor** | Sketchfab "Low Poly Camping And Forest Pack" | Check per-model | sketchfab.com |
| **Canvas texture** | Poly Haven | CC0 | polyhaven.com |
| **Furniture / props** | Kenney.nl packs | CC0 | kenney.nl/assets |

**Asset workflow:**
1. Download as GLTF/GLB (or convert FBX → GLB via Blender's free export)
2. Optimise with `gltf-transform` CLI (free, reduces file size dramatically)
3. Place in `public/models/`
4. Load via `useGLTF()` from `@react-three/drei`

---

## Welcome Screen

Pure HTML/React — no Three.js involved. Canvas isn't mounted yet.

```
App.tsx
└─ if (!hasCompletedWelcome)
     <WelcomeScreen />              — full-screen dark overlay
       <TypingMessage text="..." />  — char-by-char, AC sounds per char
       <OptionButtons />             — "Full experience" / "Just browsing"
                                       iOS: requests DeviceOrientation permission
```

On choice: store preferences → fade to black (CSS transition) → `hasCompletedWelcome = true` → `App.tsx` renders `<TentScene />` → GSAP wake-up timeline plays.

### Animal Crossing typing sounds
```typescript
// useTypingSound.ts — raw Web Audio API only
const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C pentatonic
const osc = ctx.createOscillator();
osc.type = 'triangle';
osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
// 50ms burst, exponential gain envelope
```

---

## Mobile

- Touch parallax: `touchmove` → write to `mouseRef` in CameraController (same ref as mouse, no Zustand)
- iOS DeviceOrientation: permission requested on "Full Experience" tap (must be from user gesture)
- Tap interactions: first tap shows tooltip, second activates (same pattern as desktop hover→click)
- `100dvh` for Canvas height (handles mobile browser chrome)
- ProjectsOverlay: full-screen modal on `< 768px` (not in-scene laptop animation)

---

## Build Sequence

1. **Scaffold** — Vite + React + TS + R3F + drei + GSAP + Zustand + Howler
2. **Canvas + placeholder scene** — grey boxes, ambient light, camera at correct position
3. **Camera controller** — mouse parallax in useFrame, verify 60fps, no state leak
4. **Tent interior geometry** — walls, floor, ceiling from primitives + canvas texture
5. **Lighting** — AmbientLight + lantern PointLight, toggle works, shadows visible
6. **Welcome screen** — HTML overlay, typing sounds, option buttons, fade transition
7. **Wake-up GSAP timeline** — camera rise from lying-down POV
8. **Lantern object** — GLTF load + click → toggle, test full audio side-effect pattern
9. **Cat** — load GLTF, AnimationMixer, breathing/blink in useFrame, sleeping state
10. **Tent door** — 3D fold animation, outdoor geometry reveals through opening, rain
11. **Laptop** — GLTF + camera focus + HTML overlay with project data
12. **Guitar** — GLTF + click → strum sound + music link
13. **Cat state machine** — wander path, outdoor behaviour, scratch interaction
14. **Mobile polish** — touch/gyro parallax, tap interactions, viewport edge cases
15. **Audio mix + polish** — balance Howler volumes, add Geocities easter eggs

---

## Critical Files

- `src/store/sceneStore.ts` — state machine; all object interactions and audio side effects derive from this
- `src/components/TentScene/CameraController.tsx` — parallax + focus transitions; sets performance tone for the whole project
- `src/components/TentScene/Lighting.tsx` — warm lighting is the core aesthetic feel
- `src/animations/gsapTimelines.ts` — wake-up, door fold, laptop pull-out; most intricate code
- `src/audio/audioManager.ts` — audio side effects decoupled from components

---

## Verification Checklist

1. `npm run dev` → Canvas renders, mouse parallax works, no re-renders per frame (check React DevTools)
2. Lantern toggle → real shadow changes across all meshes, warm vs. cold ambient shift
3. Door opens → cat reacts, rain appears, outdoor light changes
4. Wake-up timeline → smooth camera rise from floor level, blink effect
5. Laptop → camera focuses, GLTF opens, project list renders in HTML overlay
6. `prefers-reduced-motion` → animations skip, interactions still function
7. Mobile (real device) → touch parallax works, interactions tap-accessible
8. Sound off → no audio, all visuals work
9. Asset loading → LoadingScreen shows progress via `useProgress`, no flash of empty scene
