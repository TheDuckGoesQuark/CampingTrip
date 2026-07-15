import { createTheme, type MantineColorsTuple } from "@mantine/core";

/*
 * The single Jordan's Camp theme. This is the whole design system's control
 * panel — every lever we pull lives here, and Mantine's components read from it.
 * See the Storybook "Showcase" stories to view the effect of each lever.
 */

/**
 * `sage` — the brand primary. A muted, foresty green ramp (0 lightest → 9
 * darkest) built around the five brand colours (granite #3f4b3b, hunter-green
 * #44633f, sea-green #5a9367, mint-leaf #5cab7d, ivory #f5f9e9). Shade 6 is
 * sea-green.
 */
const sage: MantineColorsTuple = [
  "#eef4ea",
  "#dde9d4",
  "#bdd4b0",
  "#99bd88",
  "#7aab68",
  "#659a54",
  "#5a9367", // primary (light)
  "#4c7d57",
  "#446340", // hunter-green
  "#38492f",
];

/** `amber` — a warm secondary accent for highlights and calls-to-action. */
const amber: MantineColorsTuple = [
  "#fff6e8",
  "#ffe9cc",
  "#ffd49b",
  "#ffbe66",
  "#ffac3c",
  "#ffa11f",
  "#f2913a",
  "#d1770f",
  "#a95f06",
  "#7f4700",
];

export const theme = createTheme({
  /* ── Colour ─────────────────────────────────────────────── */
  colors: { sage, amber },
  primaryColor: "sage",
  primaryShade: { light: 6, dark: 7 },
  // Auto-pick black/white text on filled colours for readable contrast.
  autoContrast: true,
  luminanceThreshold: 0.45,
  white: "#ffffff",
  black: "#2b3327", // near-black green — the darkest brand ink

  /* ── Typography ─────────────────────────────────────────── */
  fontFamily: "Nunito, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyMonospace: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  headings: {
    fontFamily: "Nunito, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: "800",
  },

  /* ── Shape & spacing ────────────────────────────────────── */
  // Softly rounded, not chunky. (Mantine's default fontSizes/spacing are good,
  // so we leave those alone and only tune radius.)
  defaultRadius: "md",
  radius: { xs: "4px", sm: "7px", md: "10px", lg: "16px", xl: "24px" },

  /* ── Elevation ──────────────────────────────────────────── */
  shadows: {
    xs: "0 1px 2px rgba(31, 41, 28, 0.16)",
    sm: "0 2px 6px rgba(31, 41, 28, 0.18), 0 1px 2px rgba(31, 41, 28, 0.12)",
    md: "0 6px 18px rgba(31, 41, 28, 0.20), 0 2px 6px rgba(31, 41, 28, 0.14)",
    lg: "0 14px 36px rgba(31, 41, 28, 0.22), 0 4px 10px rgba(31, 41, 28, 0.16)",
    xl: "0 28px 64px rgba(31, 41, 28, 0.26), 0 8px 18px rgba(31, 41, 28, 0.18)",
  },

  /* ── Interaction ────────────────────────────────────────── */
  focusRing: "auto",
  cursorType: "pointer", // pointer cursor on checkboxes, switches, etc.
  respectReducedMotion: true,

  /* ── Per-component defaults ─────────────────────────────────
   * Set the house style once here rather than per usage. This is how we "own
   * the look" while still using Mantine's components. */
  components: {
    Button: { defaultProps: { radius: "md" } },
    Badge: { defaultProps: { radius: "sm", variant: "light" } },
    Card: { defaultProps: { radius: "lg", shadow: "sm", withBorder: true } },
    Paper: { defaultProps: { radius: "lg" } },
    Anchor: { defaultProps: { underline: "hover" } },
    Tooltip: { defaultProps: { radius: "sm", withArrow: true } },
    Modal: { defaultProps: { radius: "lg", centered: true } },
  },

  /* ── Escape hatch ───────────────────────────────────────── */
  other: {
    brand: {
      granite: "#3f4b3b",
      hunterGreen: "#44633f",
      seaGreen: "#5a9367",
      mintLeaf: "#5cab7d",
      ivory: "#f5f9e9",
    },
  },
});
