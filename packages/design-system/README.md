# @jordanscamp/ds

Jordan's Camp design system — **one Mantine theme + Mantine's components**. Not a
bespoke component library: we rely on Mantine and express the brand through the
theme. A custom component earns its place only when Mantine genuinely can't do
the job (and the need has come up 3+ times).

## What's here

- **`theme.ts`** — the single source of truth. Colours (`sage` primary + `amber`),
  typography (Nunito), radius/shadow scales, and per-component defaults. This is
  the control panel; everything else reads from it.
- **`BrandProvider`** — wraps the app in the theme (light by default; Mantine's
  dark scheme is available for free when we want it).
- **`primitives/`** — re-exports all of `@mantine/core`, so apps import UI from
  `@jordanscamp/ds` rather than `@mantine/core` directly. The one place allowed
  to import Mantine (dependency-cruiser chokepoint), keeping a future swap cheap.
- **`tokens/brand.css`** — the brand colours as plain `--brand-*` CSS variables
  for the few non-Mantine surfaces that want them.

## Storybook

`Foundations` visualises the theme tokens (palette, radius, shadows, type,
spacing). `Showcase/*` renders one of each Mantine component with the theme so
you can see the whole kit at a glance.

```bash
pnpm --filter @jordanscamp/ds storybook       # dev stories
pnpm --filter @jordanscamp/ds test            # vitest
pnpm --filter @jordanscamp/ds build           # tsc typecheck
pnpm --filter @jordanscamp/ds build-storybook # static Storybook
```

## Consuming

Consumed as TS source across the workspace (no build step). In the app entry:

```tsx
import "@mantine/core/styles.css";
import "@jordanscamp/ds/styles.css";
import { BrandProvider } from "@jordanscamp/ds";

<BrandProvider>
  <App />
</BrandProvider>;
```

Then import components from `@jordanscamp/ds` (never deep source paths, never
`@mantine/core` directly in an app). To change the look, reach for the theme
first — `theme.components.<X>.defaultProps` sets the house style globally.
