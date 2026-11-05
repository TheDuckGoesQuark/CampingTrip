import { useEffect, useMemo, useRef } from "react";

import Hud from "./chrome/Hud";
import Overlay, { announcementFor } from "./chrome/Overlay";
import { MAZE } from "./engine/maze";
import { useKeyboard } from "./input/useKeyboard";
import BoardCanvas from "./render/BoardCanvas";
import { sceneOf } from "./render/scene";
import { useMacMan } from "./useMacMan";
import { useRoom } from "./useRoom";

import styles from "./MacMan.module.css";

const HELP = "MacMan. Arrow keys or W, A, S and D to move; space to start and pause.";

/** The game: a cabinet holding the screen and the chrome around it. */
export default function MacMan() {
  const cabinet = useRef<HTMLElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  useRoom(cabinet);

  const { state, actions } = useMacMan();
  const keyboard = useKeyboard(actions);
  const scene = useMemo(() => sceneOf(state, MAZE), [state]);

  // The tab opened to play, so the keys go to the game without a click first.
  useEffect(() => screen.current?.focus(), []);

  return (
    <section ref={cabinet} className={styles.cabinet} aria-labelledby="macman-title">
      <h1 id="macman-title" className={styles.visuallyHidden}>
        MacMan
      </h1>
      <div className={styles.stage}>
        <div
          ref={screen}
          className={styles.screen}
          role="application"
          aria-label={HELP}
          tabIndex={0}
          {...keyboard}
        >
          <Hud score={state.round.score} />
          <div className={styles.board}>
            <BoardCanvas scene={scene} />
            <Overlay state={state} />
          </div>
        </div>
      </div>
      <p role="status" className={styles.visuallyHidden}>
        {announcementFor(state)}
      </p>
    </section>
  );
}
