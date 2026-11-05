import { useRef } from "react";

import { MAZE } from "./engine/maze";
import BoardCanvas from "./render/BoardCanvas";
import { dealtScene } from "./render/scene";
import { useRoom } from "./useRoom";

import styles from "./MacMan.module.css";

const DEALT = dealtScene(MAZE);

/** The game: a cabinet holding the screen and the chrome around it. */
export default function MacMan() {
  const cabinet = useRef<HTMLElement>(null);
  useRoom(cabinet);

  return (
    <section ref={cabinet} className={styles.cabinet} aria-labelledby="macman-title">
      <h1 id="macman-title" className={styles.visuallyHidden}>
        MacMan
      </h1>
      <div className={styles.stage}>
        <div className={styles.screen}>
          <BoardCanvas scene={DEALT} />
          <div className={styles.overlay}>
            <p className={styles.title} aria-hidden>
              MACMAN
            </p>
            <p className={styles.prompt}>press space to start</p>
          </div>
        </div>
      </div>
    </section>
  );
}
