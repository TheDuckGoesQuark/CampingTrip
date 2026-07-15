/**
 * The full Mantine component surface, re-exported so apps import UI from a
 * single place (`@jordanscamp/ds`) rather than reaching for `@mantine/core`
 * directly. This is also the ONE module allowed to import `@mantine/*` (enforced
 * by the `ds-mantine-via-primitives-only` dependency-cruiser rule) — a
 * chokepoint that keeps a future library swap to a single file.
 *
 * We rely on Mantine's components as-is; the house style comes from the theme
 * (see ../theme.ts). Add a bespoke component only when Mantine genuinely can't
 * express what we need.
 */
export * from "@mantine/core";
