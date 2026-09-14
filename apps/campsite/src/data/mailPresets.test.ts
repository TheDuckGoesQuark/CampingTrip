import { describe, expect, it } from "vitest";

import { MAIL_PRESETS, mailPreset, type PresetId } from "./mailPresets";

describe("mail presets", () => {
  it("offers each id exactly once", () => {
    const ids = MAIL_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("finds every one of them by id", () => {
    for (const preset of MAIL_PRESETS) {
      expect(mailPreset(preset.id)).toBe(preset);
    }
  });

  it("refuses an id that is not one", () => {
    expect(() => mailPreset("nope" as PresetId)).toThrow(/no mail preset/i);
  });

  // The free-form choice earns its place by clearing the others, so a subject
  // or a body on it would defeat the only thing it does.
  it("leaves the free-form choice empty", () => {
    const other = mailPreset("other");
    expect(other.subject).toBe("");
    expect(other.body).toBe("");
  });

  it("gives every other choice both a subject and a body", () => {
    for (const preset of MAIL_PRESETS.filter((p) => p.id !== "other")) {
      expect(preset.subject).not.toBe("");
      expect(preset.body).not.toBe("");
    }
  });
});
