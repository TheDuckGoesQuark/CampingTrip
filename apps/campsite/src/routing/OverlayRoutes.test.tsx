import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMusicStore } from "../store/musicStore";
import { useSceneStore } from "../store/sceneStore";
import { BlogRoute, MusicRoute, NotesRoute } from "./OverlayRoutes";

vi.mock("../audio/musicPlayer", () => ({ musicPlayer: { stop: vi.fn() } }));

function renderAt(entry: string, routePath: string, element: ReactElement) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path={routePath} element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("overlay route components declare scene state on mount", () => {
  beforeEach(() => {
    useSceneStore.setState({
      laptopFocused: false,
      notepadFocused: false,
      activePostSlug: null,
      focusTarget: "default",
    });
    useMusicStore.setState({ isOpen: false });
  });

  it("BlogRoute opens the laptop and reads the slug from the URL", () => {
    renderAt("/blog/camping-trip", "/blog/:slug?", <BlogRoute />);
    const s = useSceneStore.getState();
    expect(s.laptopFocused).toBe(true);
    expect(s.activePostSlug).toBe("camping-trip");
  });

  it("BlogRoute with no slug opens the laptop with no post", () => {
    renderAt("/blog", "/blog/:slug?", <BlogRoute />);
    const s = useSceneStore.getState();
    expect(s.laptopFocused).toBe(true);
    expect(s.activePostSlug).toBeNull();
  });

  it("NotesRoute opens the notepad", () => {
    renderAt("/notes", "/notes", <NotesRoute />);
    expect(useSceneStore.getState().notepadFocused).toBe(true);
  });

  it("MusicRoute opens the music player", () => {
    renderAt("/music", "/music", <MusicRoute />);
    expect(useMusicStore.getState().isOpen).toBe(true);
  });
});
