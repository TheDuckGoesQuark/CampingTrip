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

/* en-US, not the en-GB used elsewhere: en-GB writes September "Sept", which the
   resume parsers behind job applications do not all read as a month. */
export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function yearsSince(iso: string, now: Date = new Date()): number {
  const start = new Date(iso);
  const years = now.getUTCFullYear() - start.getUTCFullYear();
  const month = now.getUTCMonth() - start.getUTCMonth();
  const beforeAnniversary = month < 0 || (month === 0 && now.getUTCDate() < start.getUTCDate());
  return beforeAnniversary ? years - 1 : years;
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
