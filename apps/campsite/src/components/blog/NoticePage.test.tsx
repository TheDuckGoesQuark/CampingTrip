import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { contactMailto } from "../../data/contactEmail";
import { noticeNamed } from "../../data/subscribeNotices";
import { RenderTargetContext } from "../../prerender/renderTarget";
import NoticePage from "./NoticePage";

function mount(name: string) {
  return render(
    <RenderTargetContext.Provider value="live">
      <MemoryRouter>
        <NoticePage notice={noticeNamed(name)!} />
      </MemoryRouter>
    </RenderTargetContext.Provider>,
  );
}

describe("NoticePage", () => {
  it.each(["unsubscribed", "link-expired", "not-accepted"])(
    "links 'the contact form' to MouseMail on %s",
    (name) => {
      mount(name);
      expect(screen.getByRole("link", { name: "the contact form" })).toHaveAttribute(
        "href",
        contactMailto,
      );
    },
  );

  it("has no contact link where the body does not mention one", () => {
    mount("confirmed");
    expect(screen.queryByRole("link", { name: "the contact form" })).not.toBeInTheDocument();
  });
});
