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
- **Badge** — status/label pill, never a control. `variant` (light/solid) × `tone`.
- **Tag** — topic label, parallel to `Badge` rather than a variant of it: a Tag is
  routinely a link (`render`) and carries a `selected` state and an optional
  `count`, so it needs its own element and ARIA.
- **Icon** — one stroked glyph from a closed named set, sized `sm`/`md`/`lg` and
  coloured by `currentColor`. Unlabelled icons are hidden from assistive tech;
  pass `label` for a glyph that is the only thing naming its control.
- **Card** — boxy bordered surface. `tone` (surface/sunken/subtle) × `elevation`
  (flat/raised/floating) × `padding` (sm/md). `elevation` moves border weight and
  hard shadow together. Hover and focus affordances key off the rendered element,
  so a card given `render={<a/>}` behaves as a control with no extra flag.
- **Link** — brand-styled anchor.
- **Modal** — compound dialog on the Base UI Dialog primitive: focus trap,
  focus-return, Escape + click-outside dismissal, ARIA. `variant`
  centered / takeover / bare. Subparts `Modal.Trigger/Header/Title/Body/Footer/Close`.
- **desktop/** — faux-desktop chrome that CatOS composes: `MenuBar`,
  `DesktopIcon`, and `Window`. Boxy and
  hard-shadowed (`--radius-none`, `--shadow-hard-*`, `--shadow-bevel-*`) over a
  macOS-shaped layout. Pure chrome, no domain.
  - **Window** — compound chrome whose subparts decide what kind of window it is.
    A browser takes `Window.Tabs` + `Window.Tab`/`Window.NewTab` and
    `Window.AddressBar`; a viewer takes `Window.Toolbar` (holding
    `Window.ToolButton` and `Window.Separator`) and `Window.StatusBar`. Shared:
    `Window.TitleBar` (squared traffic lights) and `Window.Body`, which takes
    `inset` for a window displaying one object rather than a document. `size`
    (sm/md/lg) belongs to the same choice and is fixed for the window's life.
    It floats rather than dimming, so the desktop behind stays clickable, and a
    control given no handler renders inert instead of dead. The frame scopes the
    radius tokens to `--radius-none`, so brand components square off inside it
    without each call site opting in.

## Styling

- `cva()` maps variants → CSS-Module class names; the module defines them against
  tokens (`var(--brand-*)`, `var(--space-*)`, …). No Tailwind, no hex, no raw `px`.
- Compound components use `Object.assign(Root, { Subpart })` so callers write
  `<Foo><Foo.Header/></Foo>`. See `Modal`.
- No `className` / `style` escape-hatch props. Internal inline `style` only for
  genuinely dynamic values.

Full rules: the package [`CLAUDE.md`](../../CLAUDE.md).
