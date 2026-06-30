# @jordanscamp/theme

The shared design language for jordanscamp apps — design tokens plus a Mantine
theme built from them.

## Use it (Mantine apps)

```tsx
import { ThemeProvider } from '@jordanscamp/theme';

createRoot(el).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
```

Or bring your own provider: `import { theme } from '@jordanscamp/theme'` and
pass it to `<MantineProvider theme={theme}>`.

## Use it (non-Mantine surfaces)

For the campsite R3F scene or the PhotoBroom overlay's inline styles, import the
raw tokens without pulling in Mantine:

```ts
import { surface, accent, text } from '@jordanscamp/theme/tokens';
```

## Where to edit

- `src/tokens.ts` — the single source of truth (colours, fonts, radii). Change
  the look here.
- `src/theme.ts` — how those tokens map onto Mantine's theme.
- `src/Provider.tsx` — the `<ThemeProvider>` convenience wrapper.

Consumed as TypeScript source (no build step) — Vite/TS compile it through the
workspace.
