import { act, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PageViews, { viewPath } from "./PageViews";

let count: ReturnType<typeof vi.fn<(vars?: { path?: string }) => void>>;
let go: (to: string) => void = () => {};

function Navigator() {
  const navigate = useNavigate();
  go = navigate;
  return null;
}

function mount(initial = "/blog/index.html") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <PageViews />
      <Navigator />
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>,
  );
}

const interact = () =>
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });

beforeEach(() => {
  count = vi.fn<(vars?: { path?: string }) => void>();
  window.goatcounter = { count };
});

afterEach(() => {
  delete window.goatcounter;
});

describe("PageViews", () => {
  it("counts nothing on load", () => {
    mount();
    expect(count).not.toHaveBeenCalled();
  });

  it("counts the current page on the first interaction, once", () => {
    mount("/blog/posts/a.html?x=1");
    interact();
    interact();
    expect(count).toHaveBeenCalledTimes(1);
    expect(count).toHaveBeenCalledWith({ path: "/blog/posts/a.html?x=1" });
  });

  it("counts each route change after that, and not before", () => {
    mount("/blog/index.html");
    act(() => go("/blog/posts/a.html"));
    expect(count).not.toHaveBeenCalled();
    interact();
    expect(count).toHaveBeenCalledWith({ path: "/blog/posts/a.html" });
    act(() => go("/blog/index.html"));
    expect(count).toHaveBeenLastCalledWith({ path: "/blog/" });
    act(() => go("/blog/posts/b.html"));
    expect(count).toHaveBeenCalledTimes(3);
    expect(count).toHaveBeenLastCalledWith({ path: "/blog/posts/b.html" });
  });

  it("records a directory's page as the directory, query string kept", () => {
    expect(viewPath("/blog/index.html", "")).toBe("/blog/");
    expect(viewPath("/index.html", "?utm_campaign=x")).toBe("/?utm_campaign=x");
    expect(viewPath("/blog/posts/a.html", "")).toBe("/blog/posts/a.html");
    expect(viewPath("/blog/newsletter/index.html", "")).toBe("/blog/newsletter/");
  });

  it("survives count.js not having loaded", () => {
    delete window.goatcounter;
    mount();
    expect(() => interact()).not.toThrow();
  });
});
