import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MenuBar } from "./MenuBar";

describe("MenuBar", () => {
  it("renders left and right slots", () => {
    render(<MenuBar left={<span>CatOS</span>} right={<span>9:41</span>} />);
    expect(screen.getByText("CatOS")).toBeInTheDocument();
    expect(screen.getByText("9:41")).toBeInTheDocument();
  });

  describe("actions", () => {
    it("calls its handler on a press", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();
      render(<MenuBar right={<MenuBar.Action onClick={onPress}>Touch grass</MenuBar.Action>} />);
      await user.click(screen.getByRole("button", { name: "Touch grass" }));
      expect(onPress).toHaveBeenCalledOnce();
    });

    it("names a glyph-only action", () => {
      render(
        <MenuBar
          right={
            <MenuBar.Action ariaLabel="Touch grass">
              <svg />
            </MenuBar.Action>
          }
        />,
      );
      expect(screen.getByRole("button", { name: "Touch grass" })).toBeInTheDocument();
    });
  });

  describe("pull-downs", () => {
    const renderMenu = (onChoose = vi.fn()) => {
      render(
        <MenuBar
          left={
            <MenuBar.Menu label="CatOS">
              <MenuBar.Item onClick={onChoose}>About CatOS</MenuBar.Item>
              <MenuBar.Separator />
              <MenuBar.Item shortcut="Esc">Shut down</MenuBar.Item>
            </MenuBar.Menu>
          }
        />,
      );
      return onChoose;
    };

    it("keeps its items shut until the trigger is used", () => {
      renderMenu();
      expect(screen.queryByRole("menuitem", { name: "About CatOS" })).toBeNull();
    });

    it("opens on the trigger and calls the chosen item", async () => {
      const user = userEvent.setup();
      const onChoose = renderMenu();
      await user.click(screen.getByRole("button", { name: "CatOS" }));
      await user.click(await screen.findByRole("menuitem", { name: "About CatOS" }));
      expect(onChoose).toHaveBeenCalledOnce();
    });

    it("names a glyph-only trigger", () => {
      render(<MenuBar left={<MenuBar.Menu label={<svg />} ariaLabel="CatOS menu" />} />);
      expect(screen.getByRole("button", { name: "CatOS menu" })).toBeInTheDocument();
    });

    it("keeps a shortcut hint out of the item's accessible name", async () => {
      const user = userEvent.setup();
      renderMenu();
      await user.click(screen.getByRole("button", { name: "CatOS" }));
      expect(await screen.findByRole("menuitem", { name: "Shut down" })).toBeInTheDocument();
    });
  });
});
