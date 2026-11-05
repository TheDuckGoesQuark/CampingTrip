import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { dealRound } from "../engine/state";
import Overlay from "./Overlay";

describe("Overlay", () => {
  it("shows the game-over picture above the score and the way to play again", () => {
    render(
      <Overlay
        state={{ phase: "gameOver", round: { ...dealRound(), score: 290 } }}
        touch={false}
      />,
    );
    const picture = screen.getByRole("img", { name: "What happened?" });
    expect(picture).toHaveAttribute("src", "/images/pacmac/game-over.png");
    const score = screen.getByText("290 points");
    expect(picture.compareDocumentPosition(score) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("press space to play again")).toBeInTheDocument();
  });

  it("keeps the picture off the win screen", () => {
    render(<Overlay state={{ phase: "won", round: dealRound() }} touch={false} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("Overlay on a touch screen", () => {
  it("asks for a tap rather than a key", () => {
    render(<Overlay state={{ phase: "attract", round: dealRound() }} touch />);
    expect(screen.getByText("tap to start")).toBeInTheDocument();
  });
});
