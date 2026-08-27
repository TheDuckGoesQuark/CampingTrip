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

  it("renders a handler-less traffic light as decoration, not a button", () => {
    render(
      <Window>
        <Window.TitleBar title="About" onClose={() => {}} />
      </Window>,
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Minimise" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Maximise" })).toBeNull();
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
});
