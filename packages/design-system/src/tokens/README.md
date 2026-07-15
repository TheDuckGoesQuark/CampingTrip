# `packages/design-system/src/tokens/`

Design tokens — CSS custom properties consumed by apps via:

```ts
import "@jordanscamp/ds/tokens.css";
```

## File layout

`tokens.css` is the package entry — it `@import`s the layers below, in order,
then defines the `.jc-brand` base:

```text
tokens/
├── tokens.css       ← package entry. Imports everything below + the Nunito font.
├── primitives.css   ← raw colour ramps (--sage-*, --amber-*, --neutral-*). Back the semantic layer; not consumed directly.
├── semantic.css     ← adaptive semantic tokens (--brand-*); light at :root, dark under [data-theme="dark"].
├── dimensions.css   ← spacing (--space-*) + corner radius (--radius-*).
├── typography.css   ← font families (--font-*) + the type scale (--text-*, --weight-*).
└── shadow.css       ← elevation (--shadow-1..5) + --shadow-focus.
```

## What lives where

### Primitives are not consumed directly

`primitives.css` holds the raw ramps (`--sage-6`, `--amber-1`, `--neutral-8`, …).
They **only back** the semantic tokens. Bind components to semantic tokens, never
to a raw ramp step.

### The semantic layer is where theming happens

`semantic.css` defines every brand colour as a `--brand-*` token at `:root`
(light) and re-points the same tokens under `[data-theme="dark"]`. Because every
component references `var(--brand-*)`, flipping `data-theme` on `<html>` (which
`<BrandProvider colorScheme>` does) re-themes the whole tree — including Base UI
dialogs that portal to `<body>`, since the tokens live at `:root` rather than on
the provider's wrapper.

## Coming from Mantine (or Chakra)?

Two shifts catch most people:

### 1. Tokens are CSS variables, not a JS theme object

In Mantine you wrote `<Button color="sage.6">` / `theme.colors.sage[6]`, resolved
at render by a provider. Here the theme is CSS variables; components reference
them in their `.module.css`:

```css
/* Mantine theme object → CSS variable */
.solid {
  background: var(--brand-solid); /* was theme.colors.sage[6] / primaryColor */
  color: var(--brand-text-on-brand);
}
```

There is **no theme object and no `sx`/style-prop system**. A component's look is
its CSS Module referencing tokens; its variants are a `cva()` call selecting
module classes.

### 2. Variants are `cva`, not props resolved against a theme

```tsx
// Button.tsx
const button = cva(styles.base, {
  variants: {
    variant: { solid: styles.solid, ghost: styles.ghost },
    size: { sm: styles.sm, md: styles.md },
  },
  defaultVariants: { variant: "solid", size: "md" },
});
// <button className={button({ variant, size })} />
```

`cva` maps enumerated variant props → CSS-Module class names. No arbitrary
`color`/`size` strings; the axes are closed and typed (`VariantProps`).

## Naming convention used in components

### Colours (`--brand-*`, semantic)

| Concept        | Tokens                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Surfaces       | `--brand-bg` (page), `--brand-surface`, `--brand-surface-raised`, `--brand-surface-sunken`, `--brand-surface-inverse`        |
| Text           | `--brand-text`, `--brand-text-muted`, `--brand-text-disabled`, `--brand-text-on-brand`, `--brand-link`, `--brand-link-hover` |
| Borders        | `--brand-border`, `--brand-border-strong`, `--brand-border-subtle`                                                           |
| Brand (green)  | `--brand-solid`, `--brand-solid-hover`, `--brand-solid-active`, `--brand-subtle`, `--brand-subtle-hover`                     |
| Accent (amber) | `--brand-accent`, `--brand-accent-subtle`                                                                                    |
| Interaction    | `--brand-focus`, `--brand-state-hover`, `--brand-state-pressed`, `--brand-scrim`                                             |
| Status         | `--brand-danger`, `--brand-danger-subtle`                                                                                    |

### Dimensions

Spacing (T-shirt scale): `--space-{xxxs,xxs,xs,s,m,l,xl,xxl}` = 2/4/6/8/16/24/32/48px.
Radius: `--radius-{none,s,m,l,xl,full}` = 0/7/10/16/24/9999px.

### Typography

`--font-sans` (Nunito) / `--font-mono`; weights `--weight-{regular,medium,bold,heading}`.
The type scale (`--text-title-1..4`, `--text-body-{lg,md,sm}`, `--text-label`) is
owned by `<Text variant="…">` — prefer composing `<Text>` over restating sizes.

### Shadows

`--shadow-1..5` (elevation) and `--shadow-focus` (focus ring).

## Changing a token

Edit the CSS by hand — there's no codegen. Change a semantic value in
`semantic.css` (both the `:root` and `[data-theme="dark"]` blocks if it should
differ per scheme); the ramps in `primitives.css` only when the underlying brand
palette changes.
