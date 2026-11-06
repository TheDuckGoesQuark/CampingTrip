import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RenderTargetContext } from "../../prerender/renderTarget";
import { blogPaths } from "../../routing/blogPaths";
import { blogUrls, unlistedBlogUrls } from "../../routing/blogUrls";
import PacmacPage from "./PacmacPage";

describe("PacmacPage", () => {
  // jsdom has no 2D canvas and says so on every call; the board copes with none.
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  it("loads the game and shows its attract screen", async () => {
    render(<PacmacPage />);
    expect(await screen.findByText("press space to start")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "MacMan" })).toBeInTheDocument();
  });

  it("renders only the loading line in a static render", () => {
    render(
      <RenderTargetContext.Provider value="static">
        <PacmacPage />
      </RenderTargetContext.Provider>,
    );
    expect(screen.getByText("Loading MacMan…")).toBeInTheDocument();
    expect(screen.queryByText("press space to start")).not.toBeInTheDocument();
  });

  it("is never prerendered, listed or fed", () => {
    expect([...blogUrls(), ...unlistedBlogUrls()]).not.toContain(blogPaths.pacmac);
  });
});
