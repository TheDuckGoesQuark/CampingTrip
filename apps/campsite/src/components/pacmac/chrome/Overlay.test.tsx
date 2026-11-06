import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { dealRound } from "../engine/state";
import Overlay from "./Overlay";

describe("Overlay", () => {
  it("shows the game-over picture above the score and the way to play again", () => {
    render(
      <Overlay
        state={{ phase: "gameOver", round: { ...dealRound(), score: 290 } }}
        touch={false}
        table={[]}
        onInitials={null}
        signed={null}
      />,
    );
    const picture = screen.getByRole("img", { name: "What happened?" });
    expect(picture).toHaveAttribute("src", "/images/pacmac/game-over.png");
    const score = screen.getByText("290 points");
    expect(picture.compareDocumentPosition(score) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("press space to play again")).toBeInTheDocument();
  });

  it("keeps the picture off the win screen", () => {
    render(
      <Overlay
        state={{ phase: "won", round: dealRound() }}
        touch={false}
        table={[]}
        onInitials={null}
        signed={null}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("Overlay on a touch screen", () => {
  it("asks for a tap rather than a key", () => {
    render(
      <Overlay
        state={{ phase: "attract", round: dealRound() }}
        touch
        table={[]}
        onInitials={null}
        signed={null}
      />,
    );
    expect(screen.getByText("tap to start")).toBeInTheDocument();
  });
});

describe("Overlay and the leaderboard", () => {
  const table = [
    { initials: "MAC", score: 9000 },
    { initials: null, score: 120 },
  ];

  it("shows the top ten between games, with a dash for a score nobody signed", () => {
    render(
      <Overlay
        state={{ phase: "attract", round: dealRound() }}
        touch={false}
        table={table}
        onInitials={null}
        signed={null}
      />,
    );
    const rows = within(screen.getByRole("list", { name: "Top ten" })).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual(["1MAC9000", "2---120"]);
  });

  it("asks for initials instead of offering another game while a score waits for them", () => {
    const onInitials = vi.fn();
    render(
      <Overlay
        state={{ phase: "gameOver", round: { ...dealRound(), score: 900 } }}
        touch={false}
        table={[]}
        onInitials={onInitials}
        signed={null}
      />,
    );
    expect(screen.queryByText("press space to play again")).not.toBeInTheDocument();
    const field = screen.getByLabelText("top ten! your initials");
    expect(field).toHaveFocus();
    fireEvent.change(field, { target: { value: "m4ack" } });
    expect(field).toHaveValue("MAC");
    fireEvent.submit(field);
    expect(onInitials).toHaveBeenCalledWith("MAC");
  });

  it("keeps the initials with the save button, which waits for three letters", () => {
    const onInitials = vi.fn();
    render(
      <Overlay
        state={{ phase: "gameOver", round: dealRound() }}
        touch
        table={[]}
        onInitials={onInitials}
        signed={null}
      />,
    );
    const save = screen.getByRole("button", { name: "save" });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("top ten! your initials"), { target: { value: "JMK" } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    expect(onInitials).toHaveBeenCalledWith("JMK");
  });

  it("shows the table in place of the picture once signed, with the new row marked", () => {
    render(
      <Overlay
        state={{ phase: "gameOver", round: { ...dealRound(), score: 120 } }}
        touch={false}
        table={table}
        onInitials={null}
        signed={1}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const rows = within(screen.getByRole("list", { name: "Top ten" })).getAllByRole("listitem");
    expect(rows[1]).toHaveAttribute("aria-current", "true");
    expect(rows[0]).not.toHaveAttribute("aria-current");
    expect(screen.getByText("press space to play again")).toBeInTheDocument();
  });

  it("keeps the initials until there are three", () => {
    const onInitials = vi.fn();
    render(
      <Overlay
        state={{ phase: "won", round: dealRound() }}
        touch={false}
        table={[]}
        onInitials={onInitials}
        signed={null}
      />,
    );
    const field = screen.getByLabelText("top ten! your initials");
    fireEvent.change(field, { target: { value: "JM" } });
    fireEvent.submit(field);
    expect(onInitials).not.toHaveBeenCalled();
  });
});
