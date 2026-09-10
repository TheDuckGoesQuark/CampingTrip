import { Button, Text, TextArea, TextField } from "@jordanscamp/ds";
import { useRef, useState } from "react";

import { type Feedback, MESSAGE_LIMIT, submitFeedback } from "./submitFeedback";

import styles from "./contact.module.css";

export interface MouseMailFormProps {
  /** Offered as the way out whenever sending fails. */
  mailto: string;
  emailLabel: string;
  /** Reported so the window's status bar can say what the form is doing. */
  onPhaseChange?: (phase: Phase) => void;
}

export type Phase = "editing" | "sending" | "sent" | "failed";

export default function MouseMailForm({ mailto, emailLabel, onPhaseChange }: MouseMailFormProps) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [phase, setPhase] = useState<Phase>("editing");
  const [messageError, setMessageError] = useState<string>();
  const mountedAt = useRef(Date.now());

  function moveTo(next: Phase) {
    setPhase(next);
    onPhaseChange?.(next);
  }

  async function send() {
    if (message.trim() === "") {
      setMessageError("Add a note first — anything at all.");
      return;
    }
    setMessageError(undefined);
    moveTo("sending");
    const feedback: Feedback = {
      message: message.trim(),
      trap,
      mountedAt: mountedAt.current,
      ...(email.trim() === "" ? {} : { email: email.trim() }),
    };
    // The dwell floor is the endpoint's to enforce; holding the person here
    // would punish someone who simply types fast.
    const result = await submitFeedback(feedback);
    moveTo(result.ok ? "sent" : "failed");
  }

  if (phase === "sent") {
    return (
      <div className={styles.outcome}>
        <Text>Got it — thank you. It made my day that you bothered.</Text>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className={styles.outcome}>
        <Text>That didn&apos;t send, and I&apos;d still like to hear it. My inbox works:</Text>
        <Text>
          <a href={mailto}>{emailLabel}</a>
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <TextArea
        label="What's on your mind?"
        value={message}
        onValueChange={setMessage}
        error={messageError}
        maxLength={MESSAGE_LIMIT}
        rows={6}
        disabled={phase === "sending"}
      />
      <TextField
        label="Your email"
        type="email"
        optional
        description="Only so I can reply — leave it blank and I won't."
        value={email}
        onValueChange={setEmail}
        disabled={phase === "sending"}
      />
      <input
        className={styles.trap}
        name="trap"
        value={trap}
        onChange={(event) => setTrap(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />
      <div className={styles.send}>
        <Button variant="solid" onClick={send} disabled={phase === "sending"}>
          {phase === "sending" ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
