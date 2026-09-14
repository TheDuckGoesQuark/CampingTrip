import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
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

  describe("radio runs", () => {
    function Appearance({ onPick = vi.fn() }: { onPick?: (value: string) => void }) {
      const [value, setValue] = useState("light");
      return (
        <MenuBar
          left={
            <MenuBar.Menu label="View">
              <MenuBar.RadioGroup
                ariaLabel="Appearance"
                value={value}
                onValueChange={(next) => {
                  setValue(next);
                  onPick(next);
                }}
              >
                <MenuBar.RadioItem value="light">Light</MenuBar.RadioItem>
                <MenuBar.RadioItem value="dark">Dark</MenuBar.RadioItem>
              </MenuBar.RadioGroup>
            </MenuBar.Menu>
          }
        />
      );
    }
    const openView = async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "View" }));
      await screen.findByRole("group", { name: "Appearance" });
      return user;
    };

    it("ticks the chosen one and no other", async () => {
      render(<Appearance />);
      await openView();
      expect(screen.getByRole("menuitemradio", { name: "Light" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(screen.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute(
        "aria-checked",
        "false",
      );
    });

    it("reports a pick, moves the tick to it, and shuts the menu", async () => {
      const onPick = vi.fn();
      render(<Appearance onPick={onPick} />);
      const user = await openView();
      await user.click(screen.getByRole("menuitemradio", { name: "Dark" }));
      expect(onPick).toHaveBeenCalledWith("dark");
      expect(screen.queryByRole("menu")).toBeNull();

      await openView();
      expect(screen.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });
  });

  describe("control panels", () => {
    const renderPanel = () =>
      render(
        <MenuBar
          right={
            <MenuBar.Panel ariaLabel="Volume" label={<svg />}>
              <input type="range" aria-label="Level" defaultValue={40} />
            </MenuBar.Panel>
          }
        />,
      );

    it("keeps its controls shut until the trigger is used", () => {
      renderPanel();
      expect(screen.queryByRole("slider")).toBeNull();
    });

    it("names a glyph-only trigger", () => {
      renderPanel();
      expect(screen.getByRole("button", { name: "Volume" })).toBeInTheDocument();
    });

    it("opens on the trigger", async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(screen.getByRole("button", { name: "Volume" }));
      expect(await screen.findByRole("slider", { name: "Level" })).toBeInTheDocument();
    });

    /* A range's arrow keys are the browser's own, so the story's `Interactive`
       play is what proves they survive a popover; jsdom can only show there is
       no menu between them and the control. */
    it("leaves a control inside it as itself, not as a menu item", async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(screen.getByRole("button", { name: "Volume" }));
      const slider = await screen.findByRole("slider", { name: "Level" });
      expect(screen.queryByRole("menu")).toBeNull();
      expect(screen.queryByRole("menuitem")).toBeNull();
      slider.focus();
      expect(slider).toHaveFocus();
    });

    it("closes on Escape and returns focus to the trigger", async () => {
      const user = userEvent.setup();
      renderPanel();
      const trigger = screen.getByRole("button", { name: "Volume" });
      await user.click(trigger);
      await screen.findByRole("slider", { name: "Level" });
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("slider")).toBeNull();
      expect(trigger).toHaveFocus();
    });
  });
});
