import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RenderTargetContext } from "../../prerender/renderTarget";
import { Island } from "./Island";

const load = () => Promise.resolve({ default: () => <button>Live thing</button> });

describe("Island", () => {
  it("renders only the fallback when the target is static", () => {
    render(
      <RenderTargetContext.Provider value="static">
        <Island load={load} fallback={<p>Still image</p>} />
      </RenderTargetContext.Provider>,
    );
    expect(screen.getByText("Still image")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the fallback, then the component, when live", async () => {
    render(<Island load={load} fallback={<p>Still image</p>} />);
    expect(screen.getByText("Still image")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Live thing" })).toBeInTheDocument();
    expect(screen.queryByText("Still image")).not.toBeInTheDocument();
  });
});
