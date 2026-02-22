# Architecture

This document describes the design decisions, architecture, and patterns used in CampingTrip — an interactive 3D portfolio/experience built with React Three Fiber.

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| 3D Rendering | Three.js via React Three Fiber (R3F) |
| R3F Utilities | Drei (useGLTF, useTexture, Html, Environment) |
| State Management | Zustand (5 independent stores) |
| Animation | GSAP (timelines + tweens) + useFrame for per-frame updates |
| Audio | Web Audio API (synthesised effects) + Howler.js (file playback) |
| Build | Vite + TypeScript (strict mode) |
| Testing | Vitest + Testing Library + jsdom |
| Deploy | GitHub Pages at `/CampingTrip/` |

## Directory Structure

```
src/
├── animations/          GSAP timeline factories + easing presets
│   ├── easings.ts           Named GSAP easing strings
│   └── gsapTimelines.ts     createWakeUpTimeline, createDoorTimeline, createLaptopTimeline
│
├── audio/               All sound generation
│   ├── audioManager.ts      Howler.js file playback + store subscriptions
│   ├── rainSynth.ts         Multi-layer procedural rain (Web Audio)
│   └── soundEffects.ts      Synthesised one-shot SFX (laptop, midi, guitar, cat)
│
├── components/
│   ├── TentScene/       The 3D scene and its systems
│   │   ├── TentScene.tsx        R3F Canvas + overlay composition
│   │   ├── SceneContent.tsx     Scene graph root (lights, objects, systems)
│   │   ├── CameraController.tsx Per-frame camera: parallax, breathing, presets
│   │   ├── Lighting.tsx         7 lights with time-of-day keyframe animation
│   │   ├── InteractiveObject.tsx Generic wrapper: hover highlight, click, a11y
│   │   ├── InteractionOverlay.tsx Keyboard navigation (hidden buttons)
│   │   ├── WakeUpController.tsx  Intro cinematic (GSAP timeline)
│   │   ├── RainAudio.tsx         Bridges rainSynth to R3F lifecycle
│   │   ├── SceneLabel.tsx        3D floating label (Drei Html)
│   │   └── DebugControls.tsx     Dev-only orbit camera + FPS display
│   │
│   │   └── environment/     Individual 3D objects
│   │       ├── TentInterior.tsx    GLB model + material tweaks
│   │       ├── Laptop.tsx          Interactive: screen on/off, focus mode
│   │       ├── Guitar.tsx          Interactive: strum sound
│   │       ├── MidiController.tsx  Interactive: synth note
│   │       ├── WalkingCat.tsx      Skeletal animation + meow
│   │       ├── Campfire.tsx        GLB + flickering point light
│   │       ├── OutdoorScene.tsx    Sky gradient, stars, clouds
│   │       ├── RainSystem.tsx      600-particle rain system
│   │       ├── PicnicArea.tsx      Outdoor furniture GLB
│   │       ├── ScarlettSolo.tsx    Audio interface GLB (display only)
│   │       ├── ShureMic.tsx        Microphone GLB (display only)
│   │       ├── MokaPot.tsx         Coffee maker GLB (display only)
│   │       └── Notepad.tsx         Notepad GLB (display only)
│   │
│   ├── WelcomeScreen/   Intro sequence
│   │   ├── WelcomeScreen.tsx  Root: typing animation → option buttons
│   │   ├── TypingMessage.tsx  Character-by-character text reveal
│   │   └── OptionButtons.tsx  "Full experience" vs "just browsing"
│   │
│   ├── overlays/        Fixed HTML on top of the Canvas
│   │   ├── TimeOfDayArc.tsx        Interactive quarter-circle time wheel
│   │   ├── SettingsMenu.tsx        Sound/effects toggles + reset
│   │   ├── LaptopScreenOverlay.tsx Full-viewport overlay when laptop focused
│   │   ├── ProjectsOverlay.tsx     Portfolio project cards
│   │   ├── LoadingScreen.tsx       Asset loading indicator
│   │   └── Tooltip.tsx             Styled tooltip component
│   │
│   └── effects/
│       └── Vignette.tsx     CSS radial-gradient overlay (dark edges)
│
├── store/               Zustand state management (5 stores)
│   ├── timeStore.ts         Day/night progress + keyframe helpers
│   ├── sessionStore.ts      Sound/effects/welcome (persisted)
│   ├── sceneStore.ts        Door, lantern, laptop, camera target
│   ├── uiStore.ts           Hovered object, active overlay
│   └── interactionStore.ts  Hovered/focused 3D object IDs
│
├── hooks/               Custom React hooks
│   ├── useTimeSync.ts       Syncs timeStore to system clock (1 Hz)
│   ├── useReducedMotion.ts  Reads prefers-reduced-motion
│   ├── useTouchDevice.ts    Detects coarse pointer
│   └── useTypingSound.ts    Web Audio typing click for WelcomeScreen
│
├── data/
│   └── projects.ts      Portfolio project data
│
├── types/
│   ├── scene.ts         TentDoorState, LaptopState, FocusTarget, etc.
│   └── project.ts       Project interface
│
├── utils/
│   └── assetPath.ts     Prepends Vite BASE_URL to public asset paths
│
├── styles/
│   └── global.css       Minimal global styles
│
└── test/
    └── setup.ts         Vitest setup: WebGL, Audio, matchMedia mocks
```

## State Architecture

Five independent Zustand stores keep concerns separated:

```
┌─────────────┐  ┌──────────────┐  ┌────────────┐
│  timeStore   │  │ sessionStore │  │ sceneStore  │
│              │  │  (persisted) │  │             │
│ progress 0-1 │  │ soundEnabled │  │ wakeUpDone  │
│ isManual     │  │ effectsEnabl │  │ doorState   │
│              │  │ hasWelcome   │  │ lanternOn   │
│ + helpers:   │  └──────────────┘  │ laptopState │
│ getNightFact │                    │ focusTarget │
│ lerpKeyframe │  ┌──────────────┐  └─────────────┘
│ getTimeOfDay │  │   uiStore    │
└──────────────┘  │              │  ┌──────────────┐
                  │ hoveredObj   │  │ interaction  │
                  │ activeOverlay│  │    Store     │
                  └──────────────┘  │ hoveredId    │
                                    │ focusedId    │
                                    └──────────────┘
```

**Why 5 stores instead of 1?**

- Each store has a single concern and a minimal surface area
- Components subscribe to exactly the slice they need (Zustand's selector pattern)
- Non-React code (audioManager) can subscribe without hooks via `store.subscribe()`
- Stores can be tested and reset independently

**Session persistence:** `sessionStore` uses Zustand's `persist` middleware with `localStorage` key `campingtrip-session`. It remembers sound/effects preferences across visits.

## Rendering Pipeline

### Canvas Configuration

```
Canvas → shadows: on, antialias: on, alpha: off
       → camera: perspective, fov 69, near 0.1, far 200
       → background: #0a0608 (near-black)
```

### Per-Frame Update Order (useFrame)

1. **TimeSync** — Syncs `timeStore.progress` to system clock (throttled 1 Hz)
2. **CameraController** — Reads mouse/touch/gyro input, applies:
   - Smooth lerp toward current preset position
   - Mouse parallax (position + look-at)
   - Breathing bob (0.22 Hz, 8mm)
   - Idle sway (0.12 Hz, 4mm)
3. **Lighting** — Interpolates 7 lights across keyframe stops based on `progress`
4. **Campfire** — Flickers point light via layered sine waves
5. **RainSystem** — Cycles 600 particle positions with wind + gravity
6. **WalkingCat** — State machine: walk → pause → reverse → walk
7. **OutdoorScene** — Updates sky gradient vertex colors, star/cloud opacity

### Lighting System

Seven independent lights with time-of-day keyframe animation:

| Light | Role | Key Behaviour |
|---|---|---|
| Ambient | Base fill | Color shifts warm↔cool across day |
| Hemisphere | Sky/ground bounce | Sky color tracks time of day |
| Main Point | Lantern / string lights | Brightest at night (4.5 intensity) |
| Warm Fill | Camera-area fill | Subtle depth cue |
| Campfire Point | Outdoor warmth | Modulated by door state + night factor |
| Rear Fill | Background dimension | Subtle, increases at night |
| Door Spotlight | Moon/sunlight through door | Only visible when door is open |

All keyframe interpolation uses `smoothstep` (not linear) for organic transitions.

## Time-of-Day System

A 24-hour cycle mapped to a 0–1 progress value:

```
0.00 = 6 AM (dawn)     0.25 = noon
0.50 = 6 PM (sunset)   0.75 = midnight
```

### Night Factor

A smoothstep-derived value (0 = day, 1 = night) with two transition windows:
- **Dawn:** progress 0.00–0.06 (6:00–7:30 AM) — night fades to day
- **Dusk:** progress 0.46–0.54 (5:00–7:00 PM) — day fades to night

Used by lighting, rain, outdoor scene, and audio to smoothly react to time.

### Manual Override

The `TimeOfDayArc` UI allows dragging to set time manually. When the user drags:
1. `timeStore.isManual` is set to `true`, pausing auto-sync
2. After 3 seconds of inactivity, `isManual` resets to `false`
3. Auto-sync resumes, snapping back to real system time

## Camera System

### Presets

Five named camera positions for different focus targets:

| Target | Position | Use |
|---|---|---|
| `default` | Elevated, centered | Normal exploration |
| `lantern` | Mid-height, closer | Looking at ceiling lights |
| `laptop` | Low, left | Looking at laptop/desk |
| `door` | Mid-height, centered | Looking out the tent door |
| `guitar` | Low, right | Looking at guitar |

Transitions between presets use GSAP tweens (0.8–1.0s, `power2.inOut`).

### Parallax

Two layers of mouse-driven camera movement:

1. **Position parallax** (POS_X=0.12, POS_Y=0.08) — Camera shifts WITH mouse. Subtle depth effect.
2. **Look-at parallax** (LOOK_X=0.8, LOOK_Y=0.4) — Look target shifts WITH mouse. The primary "looking around" feel.

When focusing on an object (not `default`), parallax is dampened to 15% via `paralaxMul`.

### Input Sources

- **Desktop:** `mousemove` events, mapped to [-0.5, 0.5] range
- **Mobile touch:** `touchmove` events, same mapping
- **Mobile gyroscope:** `DeviceOrientationEvent`, gamma (tilt) mapped to X, beta to Y

## Interactive Object Pattern

All clickable 3D objects are wrapped in `InteractiveObject`:

```tsx
<InteractiveObject id="guitar" label="Guitar" labelPosition={[x,y,z]} onActivate={playStrum}>
  <Guitar />
</InteractiveObject>
```

This wrapper provides:
- **Hover highlight:** Traverses child meshes, sets emissive to warm brown (#442200)
- **Label display:** Shows `SceneLabel` (floating HTML) when highlighted
- **Click handling:** Calls `onActivate` callback
- **Keyboard a11y:** Listens for `scene-activate` CustomEvent
- **Flicker prevention:** 50ms debounced pointer leave (avoids flicker between child meshes)

## Accessibility

`InteractionOverlay` renders 9 visually-hidden but focusable `<button>` elements, one per interactive object. These are:
- Clipped to 1x1px (invisible but in the a11y tree)
- Tabbable with `tabIndex={0}`
- On focus: sets `interactionStore.focusedId` → highlights corresponding 3D object
- On Enter/Space: dispatches `CustomEvent('scene-activate', { detail: { id } })`

This bridges DOM keyboard navigation to the 3D scene via the CustomEvent system.

## Audio Architecture

### Synthesised Effects (`soundEffects.ts`)

All one-shot sounds are generated from Web Audio oscillators and buffers — no audio files:

| Effect | Technique |
|---|---|
| Laptop on | Two ascending sine tones (C5→E5) |
| Laptop off | Two descending sine tones (E5→A4) |
| MIDI note | Random pentatonic sawtooth through swept LPF |
| Guitar strum | Karplus-Strong plucked string synthesis (6 strings, open G) |
| Cat meow | Frequency-swept sine + harmonic through formant filters + noise |

Each function checks `sessionStore.soundEnabled` before creating any audio nodes.

### Rain Synthesis (`rainSynth.ts`)

Four concurrent noise layers:

1. **Deep** — Brownian noise → 600 Hz LPF (rain body on fabric)
2. **Mid** — White noise → 2.2 kHz bandpass (individual drop patter)
3. **High** — White noise → 5.5 kHz bandpass (mist / splatter detail)
4. **Drips** — Stochastic short bursts with resonant LPF (heavy drops on canvas)

A slow LFO (2.5s random walk) modulates layers for natural gust fluctuation. Volume responds to door state (open = louder) and night factor (silent during day).

### File Playback (`audioManager.ts`)

Uses Howler.js for the few audio files that exist (rain-ambient.mp3, tent-door-rustle.mp3). Subscribes directly to Zustand stores (not via React hooks) for reactive volume/mute control.

## Animation Patterns

### GSAP Timelines

Used for scripted, multi-step animations:

- **Wake-up** — Camera rises from floor + overlay blinks (eye-opening effect)
- **Door open/close** — Euler rotation on door pivot
- **Laptop focus/unfocus** — Position, rotation, scale via coordinated tweens

Timeline factories live in `animations/gsapTimelines.ts` and receive refs as arguments.

### useFrame Animations

For continuous, per-frame updates:

- Camera breathing + sway (sinusoidal, always running)
- Campfire light flicker (layered sine waves)
- Rain particle cycling (velocity + wind + recycling)
- Cloud drift (constant X velocity)
- Cat walk cycle (state machine with pause timers)
- Lighting keyframe interpolation (reads timeStore.progress)

### Easing Presets

Named GSAP easings in `animations/easings.ts`:

```ts
smooth: 'power2.inOut'  // Default transitions
out:    'power2.out'     // Decelerating exits
snappy: 'power3.out'    // Quick, decisive movements
bounce: 'back.out(1.7)' // Overshoot for playful elements
gentle: 'power1.inOut'  // Subtle, slow transitions
```

## Material Handling

### GLB Post-Processing

After loading a GLB model, meshes are traversed to apply consistent settings:

- Shadow casting and receiving enabled
- Normal map intensity reduced (0.3) to prevent moire patterns
- Anisotropic filtering for crisp textures at oblique angles

### Metallic Object Adjustment

The dark environment preset makes metallic objects too dark. A correction pattern is applied:

- Lower metalness (max 0.65) — lets scene lights contribute diffuse shading
- Increase roughness (min 0.35) — softer, broader highlights
- Add warm emissive (#331a08) — simulates ambient light bounce
- Increase envMapIntensity (3.0) — catches available reflections
- Lighten near-black base colors (min lightness 0.25) — gives something to shade

Used by MokaPot, Laptop, and other metallic objects.

## Performance Strategies

- **Asset preloading:** `useGLTF.preload()` called at module scope
- **Lazy audio init:** AudioContext created on first user interaction (Web Audio policy)
- **Time sync throttle:** System clock read at 1 Hz (not per-frame)
- **Memoised geometry:** `useMemo` for sky gradient, cloud definitions, particle buffers
- **Points vs meshes:** Rain uses a single Points object (600 vertices) instead of 600 mesh instances
- **Shadow map budget:** 1024x1024 (balanced quality vs performance)
- **Conditional rendering:** Effects disabled via sessionStore toggle

## Testing Strategy

Tests use Vitest with jsdom environment. Three categories:

1. **Pure logic tests** — Store actions, keyframe interpolation, camera math, easing values. No DOM or WebGL needed.
2. **DOM component tests** — Testing Library for overlays, buttons, keyboard handlers. Mock WebGL context in setup.
3. **Audio system tests** — Mock AudioContext verifies synthesiser functions execute without errors and respect mute state.

WebGL-dependent rendering (actual pixels, shaders, shadows) is not unit-tested — that would require visual regression testing with a real browser (Playwright).

See `src/test/setup.ts` for the mock infrastructure (WebGL context, AudioContext, matchMedia, ResizeObserver).

## Key Design Decisions

**React Three Fiber over raw Three.js:** Declarative scene graph management, component lifecycle integration, and React DevTools support outweigh the small abstraction cost.

**Five small stores over one large store:** Granular subscriptions prevent unnecessary re-renders. A Lighting component doesn't re-render when laptop state changes.

**Synthesised audio over samples:** Zero network requests for sound effects. Guaranteed availability. Smaller bundle. The sounds are characterful enough for the aesthetic.

**CustomEvent bridge for a11y:** Decouples DOM keyboard navigation from the R3F scene graph. InteractiveObject doesn't need to know about keyboard events; InteractionOverlay doesn't need to know about 3D meshes.

**Module-level constants over config files:** Camera presets, lighting keyframes, and easing values are co-located with the components that use them. No indirection for values that are tuned visually.

**GSAP for scripted + useFrame for continuous:** GSAP excels at timeline sequencing and easing. useFrame excels at per-frame physics and procedural motion. Using both plays to each tool's strengths.
