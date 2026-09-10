import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSceneStore } from "../store/sceneStore";
import { useSessionStore } from "../store/sessionStore";
import SceneRoot from "./SceneRoot";

// Stubbed because mounting the real Canvas pulls in three.js and fires every
// GLB preload at module scope.
const tentProps: { visible: boolean; paused: boolean }[] = [];
vi.mock("./TentScene/TentScene", () => ({
  default: (props: { visible: boolean; paused: boolean }) => {
    tentProps.push(props);
    return <div data-testid="tent" />;
  },
}));

const latest = () => tentProps[tentProps.length - 1];

/**
 * Every case has to start at the tent and navigate: a cold load into a covering
 * route never mounts the scene at all, so it has nothing to pause.
 */
async function mountAtTent() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="/*"
          element={
            <>
              <Link to="/blog/index.html">to blog</Link>
              <Link to="/notes">to notes</Link>
              <Link to="/music">to music</Link>
              <SceneRoot />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  await waitFor(() => expect(latest()).toBeDefined());
  return userEvent.setup();
}

describe("SceneRoot pauses the scene it keeps mounted", () => {
  beforeEach(() => {
    tentProps.length = 0;
    useSessionStore.setState({ hasCompletedWelcome: true });
    useSceneStore.setState({ sceneReady: true });
  });

  it("draws the scene on the tent route", async () => {
    await mountAtTent();
    expect(latest()?.paused).toBe(false);
  });

  it("pauses the scene once the blog is over it", async () => {
    const user = await mountAtTent();
    await user.click(screen.getByRole("link", { name: "to blog" }));

    await waitFor(() => expect(screen.getByTestId("tent")).toBeInTheDocument());
    expect(latest()?.paused).toBe(true);
  });

  it("pauses it under the notepad too, not just the blog", async () => {
    const user = await mountAtTent();
    await user.click(screen.getByRole("link", { name: "to notes" }));
    await waitFor(() => expect(latest()?.paused).toBe(true));
  });

  it("keeps drawing under the music player, which the tent shows through", async () => {
    const user = await mountAtTent();
    await user.click(screen.getByRole("link", { name: "to music" }));
    expect(latest()?.paused).toBe(false);
  });
});
