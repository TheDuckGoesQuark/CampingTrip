import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("renders a native button with its label", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });

  it("fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders as a link via the render prop", () => {
    render(<Button render={<a href="https://example.com" />}>Visit</Button>);
    const link = screen.getByRole("link", { name: "Visit" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link.className.trim().length).toBeGreaterThan(0);
  });

  it("lends a substituted anchor its look without taking its semantics", () => {
    render(<Button render={<a href="/elsewhere" />}>Go</Button>);
    const link = screen.getByRole("link", { name: "Go" });
    expect(link.tagName).toBe("A");
    // Announcing a link as a button costs the reader what an anchor tells them,
    // and replaces keyboard behaviour the anchor already had.
    expect(link).not.toHaveAttribute("role", "button");
  });

  it("is still an accessible button when nothing is substituted", () => {
    render(<Button>Press</Button>);
    expect(screen.getByRole("button", { name: "Press" }).tagName).toBe("BUTTON");
  });
});
