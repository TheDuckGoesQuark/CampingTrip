# @jordanscamp/ds

The Jordan's Camp design system. Source-only package consumed via `workspace:*`
by the apps in `apps/*`. Modelled on the citrus2 design system, with its
Tailwind + `tailwind-variants` styling swapped for **CSS-variable tokens + CSS
Modules + `cva`**, on top of **Base UI**.

## Layer model

```text
tokens (CSS variables) → primitives (Base UI re-exports) → components (styled,
token-based, compound) → patterns (generic compositions, rare)
```

- **tokens** — CSS custom properties. Colours (light + dark), spacing, radius,
  shadow, typography. Live in [src/tokens/](src/tokens/).
- **primitives** — one-line re-exports of `@base-ui/react`. The swap point if the
  headless engine ever changes. See [src/primitives/](src/primitives/).
- **components** — styled, token-based, compound. The main surface consumed by
  apps. See [src/components/](src/components/).
- **patterns** — generic compositions extracted when the rule of three fires.
  Empty by default.

## Stack

- React 19, peer-deped.
- **Base UI** (`@base-ui/react`) for headless behaviour + a11y (focus trap,
  focus-return, dismissal, ARIA).
- **CSS Modules** for component styling; **CSS-variable tokens** for the brand.
- **`class-variance-authority`** (`cva`) for typed, closed variant axes.
- Source-only — no build step. Consumers bundle via Vite.

## Consuming from an app

Add the workspace dep and import components by name:

```jsonc
// apps/<app>/package.json
"dependencies": { "@jordanscamp/ds": "workspace:*" }
```

```ts
import { Button, Text, Modal, BrandProvider } from "@jordanscamp/ds";
```

Then, **once**, at the app entry: import the token stylesheet and wrap the app in
`<BrandProvider>`.

```ts
// apps/<app>/src/main.tsx
import "@jordanscamp/ds/tokens.css";
```

```tsx
<BrandProvider>
  <App />
</BrandProvider>
```

- `@jordanscamp/ds/tokens.css` loads the brand font (Nunito) and the token layers
  (`primitives → semantic → dimensions → typography → shadow`). Without it, DS
  components render unstyled — every class references a `var(--…)` token.
- `<BrandProvider>` applies the `.jc-brand` base (brand font + ink) and the colour
  scheme. Pass `colorScheme="dark"` for the dark token set; it writes `data-theme`
  on `<html>` so Base UI's body-portalled dialogs re-theme too.

## Storybook

```bash
pnpm --filter @jordanscamp/ds storybook        # dev server on :6006
pnpm --filter @jordanscamp/ds build-storybook  # static build
```

The preview (`.storybook/preview.tsx`) imports `src/tokens/tokens.css` and wraps
every story in `<BrandProvider>`. Stories live beside their components
(`src/components/<Name>/<Name>.stories.tsx`) and are the review artefact + the
visual contract (Default + AllVariants per component; Interactive for stateful
ones).

## CI

The workspace CI (`.github/workflows/ci.yml`) runs `fmt:check`, `lint`,
`check-deps`, `tsc`, `test`, and `build` on every PR. The Storybook workflow
(`.github/workflows/storybook.yml`) builds the DS Storybook on DS-touching PRs and
deploys it to GitHub Pages from `main`.

## Rules

Day-to-day rules for editing this package live in [`CLAUDE.md`](CLAUDE.md).
Headlines:

- DS knows nothing about domain, features, APIs, routing, or app state.
- No escape hatches — no `className` / `style` prop on DS components. Variants are
  enumerated and typed via `cva`.
- Tokens for every colour / radius / shadow / spacing / typography value. No hex,
  no raw `px`.
- Base UI only via `src/primitives/**` (the swap chokepoint).
- Every new component ships with a story and tests.
