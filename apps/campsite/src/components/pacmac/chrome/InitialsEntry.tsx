import { type FormEvent, useEffect, useRef, useState } from "react";

import styles from "./chrome.module.css";

/** Three letters for the table, kept with Enter or the save button. */
export default function InitialsEntry({ onSubmit }: { onSubmit: (initials: string) => void }) {
  const [initials, setInitials] = useState("");
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => field.current?.focus(), []);

  const ready = initials.length === 3;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) onSubmit(initials);
  };

  return (
    <form className={styles.initials} onSubmit={submit}>
      <label className={styles.prompt} htmlFor="macman-initials">
        top ten! your initials
      </label>
      <div className={styles.entryRow}>
        <input
          ref={field}
          id="macman-initials"
          className={styles.letters}
          value={initials}
          onChange={(event) =>
            setInitials(
              event.target.value
                .toUpperCase()
                .replace(/[^A-Z]/g, "")
                .slice(0, 3),
            )
          }
          enterKeyHint="done"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          maxLength={3}
          aria-describedby="macman-initials-hint"
        />
        <button type="submit" className={styles.save} disabled={!ready}>
          save
        </button>
      </div>
      <p id="macman-initials-hint" className={styles.hint}>
        three letters
      </p>
    </form>
  );
}
