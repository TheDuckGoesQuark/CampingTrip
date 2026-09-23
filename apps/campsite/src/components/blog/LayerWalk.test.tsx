import { render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RenderTargetContext, type RenderTarget } from "../../prerender/renderTarget";
import LayerWalk from "./LayerWalk";

function renderAs(target: RenderTarget) {
  return render(
    <RenderTargetContext.Provider value={target}>
      <LayerWalk />
    </RenderTargetContext.Provider>,
  );
}

describe("LayerWalk", () => {
  it("walks the layers from raw tokens up to the application", () => {
    render(<LayerWalk />);
    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual([
      "Raw tokens",
      "Semantic tokens",
      "Tailwind variants",
      "Primitive components",
      "Components",
      "Application",
    ]);
  });

  it("points every tree node at the section that explains it", () => {
    const { container } = render(<LayerWalk />);
    const tree = screen.getByRole("navigation", { name: "Design system layers" });
    const nodes = within(tree).getAllByRole("link");
    expect(nodes).toHaveLength(6);

    for (const node of nodes) {
      const target = node.getAttribute("href")?.slice(1);
      expect(target).toBeTruthy();
      expect(container.querySelector(`#${target}`)).not.toBeNull();
    }
  });

  /* A built document holds both copies of a page at once, so the static copy
     namespaces its ids. This failure does not reproduce against the dev server. */
  it("keeps node and section ids in step in the static copy", () => {
    const { container } = renderAs("static");
    const tree = screen.getByRole("navigation", { name: "Design system layers" });

    for (const node of within(tree).getAllByRole("link")) {
      const target = node.getAttribute("href")?.slice(1) ?? "";
      expect(target.startsWith("reader-")).toBe(true);
      expect(container.querySelector(`#${target}`)).not.toBeNull();
    }
  });

  it("carries no screenshots, only code", () => {
    render(<LayerWalk />);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  /* Deliberately not wrapped in an Island: this content has to reach a crawler. */
  it("renders its content without a browser", () => {
    const html = renderToStaticMarkup(<LayerWalk />);
    expect(html).toContain("--sem-text-role-primary");
    expect(html).toContain("@base-ui/react/menu");
    expect(html).toContain("DropdownMenu.Trigger");
  });
});
