# primitives

Re-exports the whole `@mantine/core` surface so apps import UI from
`@jordanscamp/ds` rather than `@mantine/core` directly. **This is the only module
allowed to import `@mantine/*`** (enforced by the `ds-mantine-via-primitives-only`
dependency-cruiser rule) — a single chokepoint that keeps a future library swap
cheap.

We rely on Mantine's components as-is; the house style comes from the theme
(`../theme.ts`).
