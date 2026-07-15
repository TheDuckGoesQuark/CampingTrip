import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Dock, DockDivider, DockItem } from "./Dock";

describe("Dock", () => {
  it("renders items with tooltip labels", () => {
    render(
      <Dock>
        <DockItem label="Finder">📁</DockItem>
        <DockDivider />
        <DockItem label="Trash">🗑️</DockItem>
      </Dock>,
    );
    expect(screen.getByTitle("Finder")).toBeInTheDocument();
    expect(screen.getByTitle("Trash")).toBeInTheDocument();
  });
});
