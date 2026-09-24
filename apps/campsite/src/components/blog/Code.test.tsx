import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Code from "./Code";

const SNIPPET = `// a note
export function Badge({ tone }: Props) {
  return <Pill tone={tone} label="ok" />;
}`;

function classesOf(container: HTMLElement, text: string) {
  const span = [...container.querySelectorAll("span.token")].find((s) => s.textContent === text);
  return span ? [...span.classList] : [];
}

describe("Code", () => {
  it("gives every source line its own element, so the gutter can number it", () => {
    const { container } = render(<Code code={SNIPPET} />);
    const lines = [...container.querySelectorAll(".token-line")].map((l) => l.textContent);
    expect(lines).toEqual(SNIPPET.split("\n"));
  });

  it("tokenises tsx into the types the stylesheet paints", () => {
    const { container } = render(<Code code={SNIPPET} />);
    expect(classesOf(container, "// a note")).toContain("comment");
    expect(classesOf(container, "export")).toContain("keyword");
    expect(classesOf(container, "Pill")).toContain("class-name");
    expect(classesOf(container, "tone")).toContain("attr-name");
    expect(classesOf(container, "ok")).toContain("attr-value");
  });

  it("paints no inline colours, so the brand classes decide", () => {
    const { container } = render(<Code code={SNIPPET} />);
    for (const span of container.querySelectorAll("span")) {
      expect(span.getAttribute("style")).toBeNull();
    }
  });
});
