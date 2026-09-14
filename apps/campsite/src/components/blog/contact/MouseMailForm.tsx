import { Button, Tag, Text, TextField } from "@jordanscamp/ds";
import { type Icon, PaperPlaneRight } from "@jordanscamp/ds/icons";
import { useId } from "react";

import { MAIL_PRESETS } from "../../../data/mailPresets";
import { MESSAGE_LIMIT, SUBJECT_LIMIT } from "./submitFeedback";
import type { Compose } from "./useCompose";

import styles from "./contact.module.css";

export interface MouseMailFormProps {
  compose: Compose;
  /** Offered as the way out whenever sending fails. */
  mailto: string;
  emailLabel: string;
}

const GLYPH_PX = 14;

export default function MouseMailForm({ compose, mailto, emailLabel }: MouseMailFormProps) {
  const templatesId = useId();
  const errorId = useId();
  const sending = compose.phase === "sending";

  if (compose.phase === "sent") {
    return (
      <div className={styles.outcome}>
        <Text>Got it — thank you. It made my day that you bothered.</Text>
      </div>
    );
  }

  if (compose.phase === "failed") {
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
    <div className={styles.compose}>
      <div className={styles.headers}>
        {/*
          A field rather than a caption, so the address keeps a tab stop and stays
          selectable. Read-only rather than disabled: nothing here is switched off.
        */}
        <TextField label="To" value={emailLabel} readOnly />
        <TextField
          label="From"
          type="email"
          optional="optional — only so I can reply"
          value={compose.email}
          onValueChange={compose.setEmail}
          disabled={sending}
        />
        <TextField
          label="Subject"
          value={compose.subject}
          onValueChange={compose.setSubject}
          maxLength={SUBJECT_LIMIT}
          disabled={sending}
        />
      </div>

      <div className={styles.templates}>
        <Text variant="label" as="span" tone="muted" id={templatesId}>
          Template
        </Text>
        <ul className={styles.templateRow} aria-labelledby={templatesId}>
          {MAIL_PRESETS.map((preset) => (
            <li key={preset.id}>
              {/*
                `aria-pressed` rather than a radio group, which would promise
                arrow-key navigation between the options. These are separately
                tabbable buttons, and "Other" is the way back to nothing.
              */}
              <Tag
                selected={compose.preset === preset.id}
                render={
                  <button
                    type="button"
                    aria-pressed={compose.preset === preset.id}
                    disabled={sending}
                    onClick={() => compose.choosePreset(preset.id)}
                  />
                }
              >
                <Glyph glyph={preset.glyph} />
                {preset.label}
              </Tag>
            </li>
          ))}
        </ul>
        <div className={styles.send}>
          <Button variant="default" size="sm" onClick={compose.send} disabled={sending}>
            <PaperPlaneRight size={GLYPH_PX} weight="bold" aria-hidden />
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>

      <div className={styles.surface}>
        {/*
          Not a DS field: a compose body shows no label, draws no border of its
          own and states no height — the window supplies all three. The cost is
          that the label and error wiring are ours to do by hand.
        */}
        <textarea
          className={styles.message}
          aria-label="Message"
          placeholder="Anything at all."
          value={compose.message}
          onChange={(event) => compose.setMessage(event.target.value)}
          maxLength={MESSAGE_LIMIT}
          disabled={sending}
          aria-invalid={compose.messageError === undefined ? undefined : true}
          aria-describedby={compose.messageError === undefined ? undefined : errorId}
        />
        {compose.messageError === undefined ? null : (
          <p className={styles.messageError} id={errorId}>
            {compose.messageError}
          </p>
        )}
      </div>

      <input
        className={styles.trap}
        name="trap"
        value={compose.trap}
        onChange={(event) => compose.setTrap(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />
    </div>
  );
}

function Glyph({ glyph: Mark }: { glyph: Icon }) {
  return <Mark size={GLYPH_PX} weight="bold" aria-hidden />;
}
