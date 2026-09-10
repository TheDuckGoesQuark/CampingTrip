/**
 * Every Phosphor glyph, re-exported so an app reaches for icons through the
 * design system rather than depending on the icon library itself. Its own
 * entry point, not the barrel: nine thousand names in `@jordanscamp/ds` would
 * bury the twenty components that are the system.
 *
 * `Icon` is the older, closed set — a handful of stroked shapes drawn for this
 * era, which Phosphor has no equivalent of (a cassette, a tuft of grass).
 * Both are current; reach for Phosphor unless the drawn one is the point.
 */
export * from "@phosphor-icons/react";
