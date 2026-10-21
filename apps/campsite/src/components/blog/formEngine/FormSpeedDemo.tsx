import { Button, TextField } from "@jordanscamp/ds";
import { useEffect, useRef, useState } from "react";

import styles from "./FormSpeedDemo.module.css";

const NAME = "Smittens";
const BORN = "01/04/2019";

type Outcome = "idle" | "typing" | "submitting" | "failed" | "saved";
type Field = "name" | "born";

interface Pace {
  /** Between one character landing on screen and the next. */
  charMs: number;
  /** Every `stallEvery` characters the screen freezes for `stallMs`; 0 means never. */
  stallEvery: number;
  stallMs: number;
  submitMs: number;
  result: "failed" | "saved";
}

const BEFORE: Pace = {
  charMs: 380,
  stallEvery: 4,
  stallMs: 1100,
  submitMs: 6000,
  result: "failed",
};
const AFTER: Pace = { charMs: 110, stallEvery: 0, stallMs: 0, submitMs: 60, result: "saved" };

/** How long the finished forms sit before the demo plays again. */
const REPLAY_AFTER_MS = 5000;

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

async function type(pace: Pace, set: (field: Field, value: string) => void, signal: AbortSignal) {
  let typed = 0;
  for (const [field, text] of [
    ["name", NAME],
    ["born", BORN],
  ] as const) {
    for (let length = 1; length <= text.length; length++) {
      typed += 1;
      const stalled = pace.stallEvery > 0 && typed % pace.stallEvery === 0;
      await wait(stalled ? pace.stallMs : pace.charMs, signal);
      set(field, text.slice(0, length));
    }
  }
}

function MiniForm({ label, pace, run }: { label: string; pace: Pace; run: number }) {
  const [name, setName] = useState("");
  const [born, setBorn] = useState("");
  const [outcome, setOutcome] = useState<Outcome>("idle");

  useEffect(() => {
    if (run === 0) return;
    const controller = new AbortController();
    const { signal } = controller;
    setName("");
    setBorn("");
    setOutcome("typing");
    const set = (field: Field, value: string) =>
      field === "name" ? setName(value) : setBorn(value);
    type(pace, set, signal)
      .then(() => {
        setOutcome("submitting");
        return wait(pace.submitMs, signal);
      })
      .then(() => setOutcome(pace.result))
      .catch(() => {});
    return () => controller.abort();
  }, [run, pace]);

  const busy = outcome === "typing" || outcome === "submitting";
  const finished = outcome === "saved" || outcome === "failed";

  return (
    <section className={styles.form} aria-label={label}>
      <div className={styles.header}>
        <p className={styles.heading}>{label}</p>
        {/* Laid out whether or not it has anything to say, so the form holds its height. */}
        <p
          className={outcome === "failed" ? styles.failed : styles.saved}
          role="status"
          data-shown={finished || undefined}
        >
          <span aria-hidden="true">{outcome === "failed" ? "✕" : "✓"}</span>{" "}
          {outcome === "failed" ? "Network error" : "Saved"}
        </p>
      </div>
      <TextField label="Name" value={name} readOnly size="sm" />
      <TextField label="Date of birth" value={born} readOnly size="sm" />
      <Button type="button" size="sm" disabled={busy}>
        {outcome === "submitting" ? (
          <>
            <span className={styles.spinner} aria-hidden="true" /> Submitting…
          </>
        ) : (
          "Submit"
        )}
      </Button>
    </section>
  );
}

/** The two forms fill themselves in once they scroll into view, and again after a pause. */
export default function FormSpeedDemo() {
  const [run, setRun] = useState(0);
  const figure = useRef<HTMLElement>(null);
  const visible = useRef(false);

  useEffect(() => {
    const node = figure.current;
    if (node === null) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry?.isIntersecting ?? false;
        if (visible.current) setRun((count) => (count === 0 ? 1 : count));
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (run === 0) return;
    const longest = BEFORE;
    const typing =
      (NAME.length + BORN.length) * longest.charMs +
      Math.floor((NAME.length + BORN.length) / longest.stallEvery) * longest.stallMs;
    const timer = window.setTimeout(
      () => {
        if (visible.current) setRun((count) => count + 1);
      },
      typing + longest.submitMs + REPLAY_AFTER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [run]);

  return (
    <figure className={styles.demo} ref={figure}>
      <div className={styles.forms}>
        <MiniForm label="Before" pace={BEFORE} run={run} />
        <MiniForm label="After" pace={AFTER} run={run} />
      </div>
      <figcaption className={styles.caption}>
        <span>
          The same responses typed at the same speed. The submission time on the old example is cut
          from two minutes to six seconds because your time is valuable to me.
        </span>
        <Button
          type="button"
          variant="subtle"
          size="sm"
          onClick={() => setRun((count) => count + 1)}
        >
          Play again
        </Button>
      </figcaption>
    </figure>
  );
}
