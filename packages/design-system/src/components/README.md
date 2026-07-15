# `packages/design-system/src/components/`

The main surface of the design system. Styled, token-based, compound where layout
varies. Apps consume these from `@jordanscamp/ds`.

## Shape

Each component lives in its own folder:

```text
ComponentName/
├── ComponentName.tsx           ← the component (cva + CSS Module)
├── ComponentName.module.css    ← styles, referencing tokens only
├── ComponentName.stories.tsx   ← Default + AllVariants (+ Interactive if stateful)
├── ComponentName.test.tsx      ← contract tests
└── index.ts                    ← re-exports for the barrel
```

Add the named export to [`../index.ts`](../index.ts).

## Current components

- **Button** — action control on the Base UI Button primitive. `variant`
  (solid/subtle/ghost/default) × `size` (sm/md). Link-styled via Base UI `render`.
- **Text** — owns the brand type scale; replaces Mantine `Text` + `Title`.
  `variant` (title-1..4 / body-lg/body/body-sm / label) × `tone` × `align`;
  titles render as `h1`–`h4` by default (override with `as`).
- **Badge** — status/label pill. `variant` (light/solid) × `tone`.
- **Link** — brand-styled anchor.
- **Modal** — compound dialog on the Base UI Dialog primitive: focus trap,
  focus-return, Escape + click-outside dismissal, ARIA. `variant`
  centered / takeover / bare. Subparts `Modal.Trigger/Header/Title/Body/Footer/Close`.
- **desktop/** — faux-desktop chrome (`Window`, `MenuBar`, `Dock`/`DockItem`/
  `DockDivider`, `DesktopIcon`) that CatOS composes. Pure chrome, no domain.

## Styling

- `cva()` maps variants → CSS-Module class names; the module defines them against
  tokens (`var(--brand-*)`, `var(--space-*)`, …). No Tailwind, no hex, no raw `px`.
- Compound components use `Object.assign(Root, { Subpart })` so callers write
  `<Foo><Foo.Header/></Foo>`. See `Modal`.
- No `className` / `style` escape-hatch props. Internal inline `style` only for
  genuinely dynamic values.

Full rules: the package [`CLAUDE.md`](../../CLAUDE.md).
