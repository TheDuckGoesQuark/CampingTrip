import { act, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RenderTargetContext, type RenderTarget } from "../../prerender/renderTarget";
import { easeScrollTo } from "../../utils/easeScrollTo";
import LayerWalk from "./LayerWalk";

import styles from "./LayerWalk.module.css";

vi.mock("../../utils/easeScrollTo", () => ({ easeScrollTo: vi.fn() }));

const scroll = vi.mocked(easeScrollTo);

function treeNode(name: string) {
  const tree = screen.getByRole("navigation", { name: "Design system layers" });
  return within(tree).getByRole("link", { name });
}

function section(name: string) {
  return screen.getByRole("heading", { level: 3, name }).closest(`.${styles.row}`)!;
}

// `composes` makes the export a list of class names, not one.
const SHIMMER = `.${styles.sweep.trim().split(/\s+/).join(".")}`;

const follow = (name: string) => act(async () => treeNode(name).click());

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

  describe("following a tree node", () => {
    beforeEach(() => {
      scroll.mockReset().mockResolvedValue(true);
    });

    it("eases to the section by hand, rather than as a fragment navigation", async () => {
      render(<LayerWalk />);
      // On the document, which hears the click after React's root has handled it.
      let prevented = false;
      const witness = (event: Event) => {
        prevented = event.defaultPrevented;
      };
      document.addEventListener("click", witness);

      await follow("Components");
      document.removeEventListener("click", witness);

      expect(scroll).toHaveBeenCalledWith(section("Components"), { instant: false });
      expect(prevented).toBe(true);
    });

    it("leaves a modified click to the browser", () => {
      render(<LayerWalk />);
      act(() => {
        treeNode("Components").dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true }),
        );
      });
      expect(scroll).not.toHaveBeenCalled();
    });

    it("jumps rather than eases for a visitor who asked for less motion", async () => {
      vi.mocked(window.matchMedia).mockImplementation(
        (query) => ({ matches: query.includes("reduce") }) as MediaQueryList,
      );
      render(<LayerWalk />);
      await follow("Components");
      expect(scroll).toHaveBeenCalledWith(section("Components"), { instant: true });
    });

    it("shimmers the row it lands on, and moves focus there", async () => {
      render(<LayerWalk />);
      expect(document.querySelector(SHIMMER)).toBeNull();

      await follow("Components");

      const row = section("Components");
      expect(row.querySelector(SHIMMER)).not.toBeNull();
      expect(document.querySelectorAll(SHIMMER)).toHaveLength(1);
      expect(document.activeElement).toBe(row);
    });

    it("shimmers afresh on a second landing", async () => {
      render(<LayerWalk />);
      await follow("Components");
      const first = section("Components").querySelector(SHIMMER);

      await follow("Components");
      const second = section("Components").querySelector(SHIMMER);

      expect(second).not.toBeNull();
      expect(second).not.toBe(first);
    });

    it("does not shimmer a row the visitor scrolled away from before arriving", async () => {
      scroll.mockResolvedValue(false);
      render(<LayerWalk />);
      await follow("Components");
      expect(document.querySelector(SHIMMER)).toBeNull();
    });
  });

  /* Deliberately not wrapped in an Island: this content has to reach a crawler. */
  it("renders its content without a browser", () => {
    const html = renderToStaticMarkup(<LayerWalk />);
    expect(html).toContain("--sem-text-role-primary");
    expect(html).toContain("@base-ui/react/menu");
    expect(html).toContain("DropdownMenu.Trigger");
  });
});
