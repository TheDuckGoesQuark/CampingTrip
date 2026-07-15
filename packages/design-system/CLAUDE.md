# CLAUDE.md — @jordanscamp/ds

Rules for editing the design system. Read before adding, changing, or styling
any component here.

For package-level context (layer model, consumption pattern, stack rationale)
see [`./README.md`](./README.md). For tokens specifically — including the
Mantine → CSS-variables/cva mental-model bridge — see
[`./src/tokens/README.md`](./src/tokens/README.md).

## The philosophy

Adapted from the citrus2 design system (`~/Documents/citrus2/packages/design-system`),
swapping its Tailwind + `tailwind-variants` styling for **plain CSS-variable
tokens + CSS Modules + `cva`**, and keeping **Base UI** as the headless engine.

The DS is **tokens + Base UI behaviour + a thin set of styled components**. Before
writing a component, stop — can a token + an existing component do it? Usually yes.

## The contract

The DS knows nothing about domain (the campsite 3D scene, blog content, projects),
nothing about features, nothing about APIs, nothing about routing, nothing about
app state. If a PR makes the DS aware of any of these, reject it.

The DS provides: visual chrome, accessibility wiring, locked keyboard behaviour,
focus management, semantic tokens. That's all.

## Forbidden imports (enforced)

Per-file bans run through oxlint (`/.oxlintrc.json`). The Base UI sub-path rule
runs through dependency-cruiser (`/.dependency-cruiser.cjs`) because it needs a
graph view — allow Base UI in `primitives/**`, ban it in `components/**`. Both
run in `pnpm lint` / `pnpm check-deps`.

The DS may **not** import from:

- `apps/**` — no domain leakage
- `react-router-dom` — routing is an app concern
- `zustand` — app state is a feature concern
- `three`, `@react-three/*` — the 3D scene is a campsite concern
- `@mantine/*` — retired; do not reintroduce
- `@base-ui/react` — **only** files in `src/primitives/**` may import it.
  Components and patterns import from `../primitives/<Name>` instead. This is the
  swap-readiness chokepoint enforced by `ds-base-ui-via-primitives-only`.

The DS **may** import: `react`, `react-dom`, `@base-ui/react` (primitives layer
only), `class-variance-authority`, `clsx`, `@fontsource/nunito`, and its own
tokens/utilities.

If you find yourself wanting a forbidden import, **it's a feature conversation.**

## Layer model

```
tokens (CSS variables)
    ↓
primitives (Base UI re-exports, locked API)
    ↓
components (styled via cva + CSS Modules, compound)
    ↓
patterns (generic compositions — extract on rule of three)
```

- **tokens** — CSS custom properties in `src/tokens/*.css`. Colour, spacing,
  radius, shadow, typography. See [`./src/tokens/README.md`](./src/tokens/README.md).
- **primitives** — one-line re-exports of `@base-ui/react`. The swap point if the
  headless engine ever changes. See [`./src/primitives/README.md`](./src/primitives/README.md).
- **components** — styled, token-based, compound. The main surface consumed by
  apps. See [`./src/components/README.md`](./src/components/README.md).
- **patterns** — generic compositions extracted when the rule of three fires (3+
  unrelated consumers). Empty by default. See [`./src/patterns/README.md`](./src/patterns/README.md).

## Compound component recipe

Every component with multi-part layout uses this shape (see `Modal`):

```tsx
function Root({ children, ...props }: RootProps) {
  return <div className={styles.root}>{children}</div>;
}
function Header({ children }: { children: ReactNode }) {
  /* … */
}
function Body({ children }: { children: ReactNode }) {
  /* … */
}

export const Foo = Object.assign(Root, { Header, Body });
```

Rules:

- Named subparts render in any order, any subset.
- No `<Foo header={…} body={…} />` prop-slot shape — use children composition.
- `Object.assign` for the export (not separate named exports).
- Share cross-subpart state via a context + `useFoo()` hook that throws outside `<Foo>`.

## When to add a new component (rubric)

Apply in order. Stop at the first match.

| Situation                                        | Decision                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| Content change inside a fixed layout             | Slot (`children`)                                                      |
| Visual variant within a closed, bounded set      | Enumerated prop (`size`, `tone`, `variant`) via `cva`                  |
| Caller needs named parts in flexible arrangement | Compound subcomponent (`Foo.Header`, `Foo.Body`)                       |
| Different ARIA role / focus return / semantic    | New component parallel to existing (`Modal` vs a future `AlertDialog`) |
| 3+ booleans controlling layout or behaviour      | Refactor to discriminated union or compound                            |
| Only 1–2 consumers want it                       | **Wait.** Keep it local to the feature. Rule of three before promotion |

Additional gates:

- **"Should I add a `width` prop?"** — No. Use the enumerated `size`. If existing
  sizes don't fit, that's a design conversation.
- **"Should I accept a `className` / `style` prop?"** — No. Most escape hatches
  are a missing variant in disguise.

## Styling rules

- **Only tokens.** Every colour, radius, shadow, spacing, typography value comes
  from a token (`var(--brand-*)`, `var(--space-*)`, `var(--radius-*)`,
  `var(--shadow-*)`, `var(--text-*)`). Full naming convention in
  [`./src/tokens/README.md`](./src/tokens/README.md).
- **No `#hex` / `rgb(...)` / raw `px` for sizes/spacing in component CSS.** Token
  references only. (Genuinely dynamic values — a fallback-tile colour computed
  from a prop, a measured offset — may be set via internal inline `style`; this is
  never a consumer-facing escape hatch.)
- **One `cva()` per component**, mapping variants → CSS-Module class names; the
  `.module.css` defines those classes against tokens. Export `VariantProps`
  typings where useful.
- **Typography lives in `<Text>`**, which owns the `--text-*` scale. Prefer
  composing `<Text variant="…">` over restating font sizes in a component's CSS.
- **One folder per component**: `ComponentName/ComponentName.tsx`,
  `ComponentName.module.css`, `index.ts`, `ComponentName.stories.tsx`,
  `ComponentName.test.tsx`.

## Every new DS component ships with

- A named export from [`./src/index.ts`](./src/index.ts) (the barrel).
- A locked controlled/uncontrolled API if stateful (`open`/`defaultOpen`/`onOpenChange`).
- Tests covering the contract (controlled/uncontrolled, keyboard behaviour, ARIA/focus).
- A `.stories.tsx` with at least **Default** and **AllVariants**; **Interactive**
  (a `play` function) for stateful ones — e.g. `Modal` proves focus trap + return.
  Run via `pnpm --filter @jordanscamp/ds storybook`.

If you can't write a default story (or test) without feature context (domain data,
app state), the component doesn't belong in the DS.

## DO / DON'T

✅ **Do**

- Compound exports: `export const Foo = Object.assign(Root, { Header, Body });`
- Tokens for every colour / radius / shadow / spacing / typography value.
- `cva()` for closed, bounded variant axes.
- Base UI (via `../primitives`) for anything with focus/keyboard/ARIA behaviour.

❌ **Don't**

- Import `react-router-dom`, `zustand`, `three`/`@react-three/*`, `@mantine/*`, or
  any feature/domain type. Ever.
- Import `@base-ui/react` outside `src/primitives/**`.
- Add a `width` / `padding` / `color` escape-hatch prop. That's a missing variant
  or a missing token.
- Accept `className` or `style` as a component prop. Ever.
- Use `#hex`, `rgb(...)`, raw `px` for spacing/sizing in component CSS.

## When in doubt

- If adding the thing makes the DS aware of a domain concept → move it to the app.
- If the component needs three booleans to configure → compound or discriminated union.
- If you want an escape-hatch prop — stop. Most escape hatches are a missing
  variant in disguise.
