import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Window } from "./Window";

describe("Window", () => {
  it("renders the title bar title and the page body", () => {
    render(
      <Window>
        <Window.TitleBar title="About" />
        <Window.Body>hello</Window.Body>
      </Window>,
    );
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("closes from the red traffic light", async () => {
    const onClose = vi.fn();
    render(
      <Window>
        <Window.TitleBar title="About" onClose={onClose} />
      </Window>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the red light as decoration when closing means nothing", () => {
    render(
      <Window>
        <Window.TitleBar title="About" />
      </Window>,
    );
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("keeps amber and green live, because the frame drives them itself", () => {
    render(
      <Window>
        <Window.TitleBar title="About" />
      </Window>,
    );
    expect(screen.getByRole("button", { name: "Minimise" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maximise" })).toBeInTheDocument();
  });

  it("marks only the active tab as selected", () => {
    render(
      <Window>
        <Window.Tabs>
          <Window.Tab label="One" active />
          <Window.Tab label="Two" />
        </Window.Tabs>
      </Window>,
    );
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "false");
  });

  it("reports tab select and tab close separately", async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <Window>
        <Window.Tabs>
          <Window.Tab label="CatMap" onSelect={onSelect} onClose={onClose} />
        </Window.Tabs>
      </Window>,
    );
    await userEvent.click(screen.getByRole("tab", { name: "CatMap" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Close CatMap" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("omits the tab close control when no handler is given", () => {
    render(
      <Window>
        <Window.Tabs>
          <Window.Tab label="Pinned" />
        </Window.Tabs>
      </Window>,
    );
    expect(screen.queryByRole("button", { name: "Close Pinned" })).toBeNull();
  });

  it("fires the new-tab control", async () => {
    const onNewTab = vi.fn();
    render(
      <Window>
        <Window.Tabs>
          <Window.Tab label="One" active />
          <Window.NewTab onClick={onNewTab} />
        </Window.Tabs>
      </Window>,
    );
    await userEvent.click(screen.getByRole("button", { name: "New tab" }));
    expect(onNewTab).toHaveBeenCalledTimes(1);
  });

  it("shows the address and fires the nav handlers", async () => {
    const onBack = vi.fn();
    const onReload = vi.fn();
    render(
      <Window>
        <Window.AddressBar
          url="https://jordanscamp.site/blog/catmap"
          onBack={onBack}
          onReload={onReload}
        />
      </Window>,
    );
    expect(screen.getByText("https://jordanscamp.site/blog/catmap")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    await userEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("disables a nav arrow with no handler", () => {
    render(
      <Window>
        <Window.AddressBar url="https://jordanscamp.site/blog" onBack={() => {}} />
      </Window>,
    );
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Forward" })).toBeDisabled();
  });
  it("fires a toolbar button and disables one with no handler", async () => {
    const onZoomIn = vi.fn();
    render(
      <Window size="md">
        <Window.Toolbar>
          <Window.ToolButton label="Zoom in" icon="plus" onClick={onZoomIn} />
          <Window.Separator />
          <Window.ToolButton label="Zoom out" icon="minus" />
        </Window.Toolbar>
      </Window>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
  });

  it("does not claim the toolbar role it has no keyboard behaviour for", () => {
    render(
      <Window>
        <Window.Toolbar>
          <Window.ToolButton label="Zoom in" icon="plus" onClick={() => {}} />
        </Window.Toolbar>
      </Window>,
    );
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("renders status bar facts", () => {
    render(
      <Window size="md">
        <Window.Body inset>image</Window.Body>
        <Window.StatusBar>smittens_047.jpg</Window.StatusBar>
      </Window>,
    );
    expect(screen.getByText("smittens_047.jpg")).toBeInTheDocument();
  });

  it("applies a distinct frame class per size", () => {
    const { container: small } = render(<Window size="sm">a</Window>);
    const { container: large } = render(<Window size="lg">b</Window>);
    const classOf = (c: HTMLElement) => c.firstElementChild?.firstElementChild?.className;
    expect(classOf(small)).not.toEqual(classOf(large));
  });

  it("insets the body only when asked", () => {
    const { container: plain } = render(
      <Window>
        <Window.Body>a</Window.Body>
      </Window>,
    );
    const { container: inset } = render(
      <Window>
        <Window.Body inset>b</Window.Body>
      </Window>,
    );
    expect(screen.getByText("a").className).not.toEqual(screen.getByText("b").className);
    expect(plain).toBeTruthy();
    expect(inset).toBeTruthy();
  });
  describe("geometry", () => {
    const titleBarOf = (container: HTMLElement) =>
      container.querySelector("[class*=titlebar]") as HTMLElement;

    it("starts normal, with both toggles unpressed", () => {
      render(
        <Window>
          <Window.TitleBar title="About" />
        </Window>,
      );
      expect(screen.getByRole("button", { name: "Maximise" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(screen.getByRole("button", { name: "Minimise" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("maximises from the green light and restores from it", async () => {
      render(
        <Window>
          <Window.TitleBar title="About" />
        </Window>,
      );
      const green = screen.getByRole("button", { name: "Maximise" });
      await userEvent.click(green);
      expect(green).toHaveAttribute("aria-pressed", "true");
      await userEvent.click(green);
      expect(green).toHaveAttribute("aria-pressed", "false");
    });

    it("maximises on a double-click of the title bar", async () => {
      const { container } = render(
        <Window>
          <Window.TitleBar title="About" />
        </Window>,
      );
      await userEvent.dblClick(titleBarOf(container));
      expect(screen.getByRole("button", { name: "Maximise" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("ignores a double-click that landed on a light", async () => {
      render(
        <Window>
          <Window.TitleBar title="About" onClose={() => {}} />
        </Window>,
      );
      await userEvent.dblClick(screen.getByRole("button", { name: "Close" }));
      expect(screen.getByRole("button", { name: "Maximise" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("rolls up from the amber light, hiding everything but the title bar", async () => {
      render(
        <Window>
          <Window.TitleBar title="About" />
          <Window.Body>page contents</Window.Body>
        </Window>,
      );
      await userEvent.click(screen.getByRole("button", { name: "Minimise" }));
      expect(screen.getByRole("button", { name: "Minimise" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      // The title stays reachable, so the window can always be unrolled.
      expect(screen.getByText("About")).toBeInTheDocument();
    });

    it("maximising leaves a shaded window, since the two are one state", async () => {
      render(
        <Window>
          <Window.TitleBar title="About" />
        </Window>,
      );
      await userEvent.click(screen.getByRole("button", { name: "Minimise" }));
      await userEvent.click(screen.getByRole("button", { name: "Maximise" }));
      expect(screen.getByRole("button", { name: "Minimise" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(screen.getByRole("button", { name: "Maximise" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("opens in the state a caller asks for", () => {
      render(
        <Window defaultDisplay="maximised">
          <Window.TitleBar title="About" />
        </Window>,
      );
      expect(screen.getByRole("button", { name: "Maximise" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("reports changes and defers to the caller when controlled", async () => {
      const onDisplayChange = vi.fn();
      render(
        <Window display="normal" onDisplayChange={onDisplayChange}>
          <Window.TitleBar title="About" />
        </Window>,
      );
      const green = screen.getByRole("button", { name: "Maximise" });
      await userEvent.click(green);
      expect(onDisplayChange).toHaveBeenCalledWith("maximised");
      // Controlled: the prop still says normal, so nothing moved on its own.
      expect(green).toHaveAttribute("aria-pressed", "false");
    });

    it("offers the grow box only while the frame is resizable", async () => {
      const { container } = render(
        <Window>
          <Window.TitleBar title="About" />
        </Window>,
      );
      const growBox = () => container.querySelector("[class*=growBox]");
      expect(growBox()).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Maximise" }));
      expect(growBox()).toBeNull();
    });
  });
});
