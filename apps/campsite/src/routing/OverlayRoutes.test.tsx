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
      openWindows: [],
      browserPath: null,
      openBlogPaths: [],
      focusTarget: "default",
    });
    useMusicStore.setState({ isOpen: false });
  });

  it("BlogRoute opens the laptop and reads the page from the URL", () => {
    renderAt("/blog/tags/music.html", "/blog/*", <BlogRoute />);
    const s = useSceneStore.getState();
    expect(s.laptopFocused).toBe(true);
    expect(s.browserPath).toBe("/blog/tags/music.html");
  });

  it("BlogRoute canonicalises a path missing the extension", () => {
    renderAt("/blog/tags/music", "/blog/*", <BlogRoute />);
    expect(useSceneStore.getState().browserPath).toBe("/blog/tags/music.html");
  });

  it("bare /blog opens the laptop on the desktop, with no page", () => {
    renderAt("/blog", "/blog/*", <BlogRoute />);
    const s = useSceneStore.getState();
    expect(s.laptopFocused).toBe(true);
    expect(s.browserPath).toBeNull();
  });

  it("an unrecognised blog path lands on the desktop rather than the tent", () => {
    renderAt("/blog/nothing/here.html", "/blog/*", <BlogRoute />);
    const s = useSceneStore.getState();
    expect(s.laptopFocused).toBe(true);
    expect(s.browserPath).toBeNull();
  });

  it("redirects a flat legacy slug to its namespaced path", () => {
    // The link in projects.ts still points at the flat form, so it has to land.
    renderAt("/blog/photobroom", "/blog/*", <BlogRoute />);
    const s = useSceneStore.getState();
    expect(s.laptopFocused).toBe(true);
    expect(s.browserPath).toBe("/blog/projects/photobroom.html");
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
