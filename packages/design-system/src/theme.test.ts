import { describe, expect, it } from "vitest";

import { theme } from "./theme";

describe("theme", () => {
  it("uses sage as the primary colour", () => {
    expect(theme.primaryColor).toBe("sage");
  });

  it("defines full 10-shade sage and amber palettes", () => {
    expect(theme.colors?.sage).toHaveLength(10);
    expect(theme.colors?.amber).toHaveLength(10);
  });

  it("sets house-style component defaults", () => {
    expect(theme.components?.Card?.defaultProps).toMatchObject({ radius: "lg" });
  });
});
