# CLAUDE.md — @jordanscamp/ds

Rules for editing the design system. For package context see
[`./README.md`](./README.md).

## The philosophy

The DS is **one Mantine theme + Mantine's components**. We do **not** build a
bespoke component library. The brand is expressed through `theme.ts`, and apps
use Mantine's components (re-exported from here). Before writing a component,
stop — can the theme + an existing Mantine component do it? Almost always yes.

## The contract

The DS knows nothing about domain (the campsite scene, blog content), nothing
about the 3D stack (`three`, `@react-three/*`), app state (`zustand`), or routing
(`react-router-dom`). It provides: the theme, `BrandProvider`, and the re-exported
Mantine surface. Reject PRs that leak app concerns in.

## Forbidden imports (enforced)

Per-file by oxlint (`packages/design-system/**` override) + graph-wide by
dependency-cruiser. The DS may **not** import `apps/**`, `react-router-dom`,
`zustand`, `three`, `@react-three/*`. `@mantine/*` may be imported **only** by
`src/primitives/**` (and `theme.ts`/`BrandProvider.tsx`) — the swap-readiness
chokepoint (`ds-mantine-via-primitives-only`).

## The theme is the control panel

Own the look through `theme.ts`, not by wrapping components:

- **Colour**: `colors` (10-shade tuples), `primaryColor`, `primaryShade`,
  `autoContrast`.
- **Type**: `fontFamily`, `headings`, `fontSizes`.
- **Shape/space**: `defaultRadius`, `radius`, `spacing`, `shadows`.
- **House style**: `components.<Name>.defaultProps` / `.styles` — set default
  `radius`/`size`/`variant` or restyle any Mantine component globally.
- Escape hatch: `other`.

If a look needs changing, change the theme. Don't add a wrapper component to do
what a `defaultProps` entry can.

## When to add a bespoke component (rare)

Only when **all** hold: Mantine has no component that fits, the need has come up
**3+ times**, and it's pure chrome (no domain). Then: one folder
(`Name/Name.tsx` + `index.ts` + `Name.stories.tsx` + `Name.test.tsx`), a barrel
export, tests for the contract, and a story (Default + AllVariants). Style via
Mantine props / the theme; no `className`/`style` escape-hatch props; brand
tokens (`--brand-*`) from a module only when needed.

## Stories

- **`Foundations`** — the theme tokens, visualised.
- **`Showcase/*`** — one of each Mantine component, grouped (Buttons, Inputs,
  Feedback, Overlays, Data display, Typography, Navigation, Layout), rendered
  with the theme. When you tune the theme, check these still look right.
