import { Button, Text } from "@jordanscamp/ds";
import { useEffect, useId, useRef } from "react";

import TransferProgress from "./TransferProgress";
import type { Compose } from "./useCompose";

import styles from "./contact.module.css";

export interface SendDialogProps {
  compose: Compose;
  mailto: string;
  emailLabel: string;
  /** Closes MouseMail, not just this dialog. */
  onClose: () => void;
}

const TITLE: Record<string, string> = {
  sending: "Sending",
  sent: "Message sent",
  failed: "Not sent",
};

/**
 * Covers the window's page rather than the viewport, so the desktop behind stays
 * live — a file-copy dialog blocked its own application, not the machine. Which
 * is also why focus is moved here on open but deliberately not trapped: there is
 * nowhere it would be wrong to go.
 */
export default function SendDialog({ compose, mailto, emailLabel, onClose }: SendDialogProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  // Send was the last thing focused and is inert now, so without this focus
  // lands on the body and a keyboard reader loses their place.
  useEffect(() => {
    panel.current?.focus();
  }, [compose.phase]);

  return (
    <div className={styles.scrim}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panel}
      >
        <div className={styles.dialogTitle}>
          <Text variant="label" as="span" id={titleId}>
            {TITLE[compose.phase]}
          </Text>
        </div>
        <div className={styles.dialogBody}>
          <Outcome compose={compose} mailto={mailto} emailLabel={emailLabel} />
        </div>
        {compose.phase === "sending" ? null : (
          <div className={styles.dialogActions}>
            {compose.phase === "sent" ? (
              <Button variant="default" size="sm" onClick={onClose}>
                OK
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={compose.resume}>
                Back to my note
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Outcome({
  compose,
  mailto,
  emailLabel,
}: {
  compose: Compose;
  mailto: string;
  emailLabel: string;
}) {
  if (compose.phase === "sending") return <TransferProgress />;

  if (compose.phase === "failed") {
    return (
      <>
        <Text>The message failed to send. Your note is still behind this, untouched.</Text>
        <Text>
          My inbox works, if you would rather not wait: <a href={mailto}>{emailLabel}</a>
        </Text>
      </>
    );
  }

  const replyTo = compose.email.trim();
  return (
    <>
      <Text>Off it goes. Thank you — it genuinely made my day that you bothered.</Text>
      {replyTo === "" ? (
        <Text>
          No return address on this one, so it&apos;s a message in a bottle: I&apos;ll read it, and
          you&apos;ll never hear a word back. Honestly, that&apos;s a perfectly good way to send
          one.
        </Text>
      ) : (
        <Text>
          You left me somewhere to write back to, so I will: <strong>{replyTo}</strong>. Give me a
          few days — I&apos;m slow, but I do answer.
        </Text>
      )}
    </>
  );
}
