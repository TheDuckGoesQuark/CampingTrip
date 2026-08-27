/**
 * Dates are authored as plain `YYYY-MM-DD`, which parses as UTC midnight. Format
 * in UTC too, or a reader west of Greenwich sees every post a day early.
 */
const FORMATS: Record<"long" | "short", Intl.DateTimeFormatOptions> = {
  long: { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  short: { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" },
};

export function formatDate(iso: string, style: "long" | "short" = "long"): string {
  return new Date(iso).toLocaleDateString("en-GB", FORMATS[style]);
}

/** Day of the month alone, for the date gutter down the side of a feed. */
export function dayOfMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", timeZone: "UTC" });
}

/** Month and year alone, sitting under `dayOfMonth`. */
export function monthAndYear(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" })
    .toUpperCase();
}
