# `packages/design-system/src/primitives/`

The headless / accessibility layer beneath the styled components. Each file is a
thin re-export shim over `@base-ui/react` — one line per primitive.

## Why this layer exists

1. **Swap-readiness.** If we ever migrate off Base UI (to Radix, or our own
   primitives), the swap touches this folder and nothing else. Components in
   `../components/` keep importing from `../primitives/<Name>` and are unaware the
   underlying engine changed.
2. **Lint chokepoint.** The `ds-base-ui-via-primitives-only` dependency-cruiser
   rule forbids `../components/**` (and everything outside `primitives/**`) from
   importing `@base-ui/react` directly. The boundary is mechanical, not cultural.

## What lives here

| File           | Role                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dialog.tsx`   | Re-exports the `Dialog` namespace from `@base-ui/react/dialog` (`.Root`, `.Trigger`, `.Portal`, `.Backdrop`, `.Popup`, `.Title`, `.Close`, …). Backs `../components/Modal`.           |
| `Button.tsx`   | Re-exports `Button` from `@base-ui/react/button` (native button behaviour + `render` polymorphism). Backs `../components/Button`.                                                     |
| `useRender.ts` | Re-exports `useRender` from `@base-ui/react/use-render`. Lets a component take a `render` prop without being a Base UI component. Backs `../components/Card` and `../components/Tag`. |

If you reach for a Base UI primitive that isn't here, **add a shim file first**,
then import it from a component.

## What does NOT belong here

- **Styling.** CSS Modules, tokens, `cva` — none of that touches this layer.
  That's `../components/`.
- **Domain.** This layer doesn't know what CatOS or the blog is.
- **Visual surfaces.** If it needs Storybook variants or styling axes, it belongs
  in `../components/`.
