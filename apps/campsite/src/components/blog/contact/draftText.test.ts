import { describe, expect, it } from "vitest";

import { draftText } from "./draftText";

const TO = "someone@example.com";

describe("draftText", () => {
  it("leads with the header lines a person would otherwise retype", () => {
    expect(draftText(TO, "Found a bug", "the tent will not load")).toBe(
      `To: ${TO}\nSubject: Found a bug\n\nthe tent will not load\n`,
    );
  });

  it("leaves out a subject line the visitor never wrote", () => {
    expect(draftText(TO, "   ", "just this")).toBe(`To: ${TO}\n\njust this\n`);
  });

  it("trims, so a template's trailing newline is not pasted as the message", () => {
    expect(draftText(TO, "  hi  ", "  there  ")).toBe(`To: ${TO}\nSubject: hi\n\nthere\n`);
  });

  it("keeps the newlines inside a note, which are the visitor's paragraphs", () => {
    expect(draftText(TO, "", "one\n\ntwo")).toBe(`To: ${TO}\n\none\n\ntwo\n`);
  });
});
