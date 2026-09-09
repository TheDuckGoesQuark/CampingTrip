import { Icon, Text, Window } from "@jordanscamp/ds";
import { useEffect, useState } from "react";

import type { WindowFrameProps } from "./windowFrame";

import styles from "./catos.module.css";

/** An offset, not local wall-clock time: every visitor counts from one instant. BST that day. */
const BOOTED_AT = Date.parse("1997-09-17T21:00:00+01:00");

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const pad = (n: number) => String(n).padStart(2, "0");

/** Elapsed time as `<days> days hh:mm:ss`. */
export function uptimeSince(from: number, now: number): string {
  const elapsed = Math.max(0, now - from);
  const days = Math.floor(elapsed / DAY);
  const hours = Math.floor(elapsed / HOUR) % 24;
  const minutes = Math.floor(elapsed / MINUTE) % 60;
  const seconds = Math.floor(elapsed / SECOND) % 60;
  return `${days} days ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function useUptime(): string {
  const [uptime, setUptime] = useState(() => uptimeSince(BOOTED_AT, Date.now()));
  useEffect(() => {
    const id = setInterval(() => setUptime(uptimeSince(BOOTED_AT, Date.now())), SECOND);
    return () => clearInterval(id);
  }, []);
  return uptime;
}

export interface AboutWindowProps extends WindowFrameProps {
  onClose: () => void;
}

/**
 * The About box, off the cat menu. A small window rather than an alert, so it
 * stacks, drags and closes like everything else on this desktop — an alert
 * would be the one thing here that behaves like the real web.
 */
export default function AboutWindow({ onClose, ...frame }: AboutWindowProps) {
  const uptime = useUptime();

  return (
    <Window size="sm" {...frame}>
      <Window.TitleBar title="About CatOS" onClose={onClose} />
      <Window.Body inset>
        <div className={styles.aboutBody}>
          <div className={styles.aboutMark}>
            <Icon name="cat" size="lg" />
          </div>
          <Text variant="title-3" align="center">
            CatOS
          </Text>
          <div className={styles.aboutSpecs}>
            <Text variant="body-sm" tone="muted" align="center" as="div">
              Version 9, "Smittens"
            </Text>
            <Text variant="body-sm" tone="muted" align="center" as="div">
              Memory: Infinite, but session scoped (take our word for it)
            </Text>
            <Text variant="body-sm" tone="muted" align="center" as="div">
              Storage: Unknown
            </Text>
            <Text variant="body-sm" tone="muted" align="center" as="div">
              Uptime: <span className={styles.aboutUptime}>{uptime}</span>
            </Text>
          </div>
        </div>
      </Window.Body>
      <Window.StatusBar>Built in a sleeping bag by Jordan Mackie.</Window.StatusBar>
    </Window>
  );
}
