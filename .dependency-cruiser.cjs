/**
 * dependency-cruiser config — graph-level rules oxlint cannot express.
 *
 * The per-file forbidden-import bans (DS → routing/state/three, apps → deep DS
 * paths) live in `.oxlintrc.json`. dep-cruiser keeps only rules that need a
 * graph view: the `ds-base-ui-via-primitives-only` chokepoint (allow @base-ui
 * in `primitives/**`, ban it elsewhere in the DS — a file-pattern scope oxlint's
 * no-restricted-imports can't express), the `no-mantine` ban (DS + campsite),
 * plus the hygiene rules (no-circular, no-orphans).
 *
 * Run via `pnpm check-deps`.
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "ds-base-ui-via-primitives-only",
      severity: "error",
      comment:
        "Inside the DS, @base-ui/react may only be imported by the primitives " +
        "layer. Components must import from `../primitives/<Name>`. This is the " +
        "swap-readiness chokepoint — see packages/design-system/src/primitives/README.md.",
      from: {
        path: "^packages/design-system/src/(?!primitives/)",
        pathNot: ["\\.stories\\.(ts|tsx)$", "\\.test\\.(ts|tsx)$"],
      },
      to: { path: "(^|/)@base-ui/", dependencyTypes: ["npm", "npm-peer", "npm-dev"] },
    },
    {
      name: "no-mantine",
      severity: "error",
      comment: "Mantine is retired workspace-wide — use @jordanscamp/ds (Base UI + tokens).",
      from: {},
      to: { path: "(^|/)@mantine/", dependencyTypes: ["npm", "npm-peer", "npm-dev"] },
    },
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies are forbidden.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "info",
      comment: "Orphan modules — surface, don't fail.",
      from: {
        orphan: true,
        pathNot: [
          "\\.d\\.ts$",
          "(^|/)\\.[^/]+\\.(cjs|js|ts)$",
          "\\.(config|setup)\\.(ts|tsx|js|cjs|mjs)$",
          "vite-env\\.d\\.ts$",
          "\\.test\\.(ts|tsx)$",
          "\\.spec\\.(ts|tsx)$",
          "\\.stories\\.(ts|tsx)$",
          "/dist/",
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: ["node_modules"] },
    tsPreCompilationDeps: true,
    exclude: {
      path: [
        "node_modules",
        "\\.test\\.(ts|tsx)$",
        "\\.spec\\.(ts|tsx)$",
        "dist",
        "storybook-static",
        "coverage",
      ],
    },
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
  },
};
