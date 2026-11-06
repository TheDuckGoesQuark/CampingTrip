import { useEffect, useMemo, useRef } from "react";

import { isMobile } from "../../utils/deviceDetect";
import Hud from "./chrome/Hud";
import Lives from "./chrome/Lives";
import Overlay, { announcementFor } from "./chrome/Overlay";
import type { Actions } from "./engine/actions";
import { MAZE } from "./engine/maze";
import DPad from "./input/DPad";
import { useKeyboard } from "./input/useKeyboard";
import { useTouch } from "./input/useTouch";
import BoardCanvas from "./render/BoardCanvas";
import { sceneOf } from "./render/scene";
import { localScoreStore } from "./scores/localStore";
import { serverScoreStore } from "./scores/serverStore";
import type { HighScoreStore } from "./scores/store";
import { useHighScores } from "./scores/useHighScores";
import { unlockAudio } from "./sound/sound";
import { useGameSound } from "./sound/useGameSound";
import { useMacMan } from "./useMacMan";
import { useRoom } from "./useRoom";

import styles from "./MacMan.module.css";

const HELP =
  "MacMan. Arrow keys or W, A, S and D to move, or swipe; space or a tap to start, space or the pause button to pause.";

/** The shared top ten, with this browser's own table whenever it cannot be reached. */
const SCORES = serverScoreStore({ fallback: localScoreStore() });

/** The pause button's job in this phase, if it has one. */
function pauseFor(actions: Actions) {
  if ("pause" in actions) return { paused: false, toggle: actions.pause };
  if (actions.phase === "paused") return { paused: true, toggle: actions.resume };
  return null;
}

/** The game: a cabinet holding the screen and the chrome around it. */
export default function MacMan({ scores = SCORES }: { scores?: HighScoreStore }) {
  const cabinet = useRef<HTMLElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  useRoom(cabinet);

  const { state, actions } = useMacMan();
  const keyboard = useKeyboard(actions, unlockAudio);
  const pad = useRef<HTMLDivElement>(null);
  const touch = useTouch(actions, { pad, onStart: unlockAudio });
  useGameSound(state);
  const { table, asking, signed, submit } = useHighScores(scores, state);
  const scene = useMemo(() => sceneOf(state, MAZE), [state]);

  // The tab opened to play, so the keys go to the game without a click first.
  useEffect(() => screen.current?.focus(), []);

  return (
    <section
      ref={cabinet}
      className={styles.cabinet}
      aria-labelledby="macman-title"
      {...(isMobile ? touch : {})}
    >
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
          <Hud
            score={state.round.score}
            best={table[0]?.score ?? 0}
            pause={isMobile ? pauseFor(actions) : null}
          />
          <div className={styles.board}>
            <BoardCanvas scene={scene} />
            <Overlay
              state={state}
              touch={isMobile}
              table={table}
              onInitials={asking === null ? null : submit}
              signed={signed}
            />
          </div>
          <Lives lives={state.round.lives} />
        </div>
      </div>
      {isMobile && (
        <div ref={pad} className={styles.padArea}>
          <DPad queued={state.round.macman.queued} />
        </div>
      )}
      <p role="status" className={styles.visuallyHidden}>
        {announcementFor(state)}
      </p>
    </section>
  );
}
