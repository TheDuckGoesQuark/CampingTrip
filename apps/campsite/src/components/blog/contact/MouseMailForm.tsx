import { Button, Tag, Text, TextField, TextSurface } from "@jordanscamp/ds";
import { type Icon, PaperPlaneRight } from "@jordanscamp/ds/icons";
import { useId } from "react";

import { MAIL_PRESETS } from "../../../data/mailPresets";
import SendDialog from "./SendDialog";
import { MESSAGE_LIMIT, SUBJECT_LIMIT } from "./submitFeedback";
import type { Compose } from "./useCompose";

import styles from "./contact.module.css";

export interface MouseMailFormProps {
  compose: Compose;
  emailLabel: string;
  /** Closing MouseMail is how a finished send ends. */
  onClose: () => void;
}

const GLYPH_PX = 14;

export default function MouseMailForm({ compose, emailLabel, onClose }: MouseMailFormProps) {
  const templatesId = useId();
  const errorId = useId();
  const busy = compose.phase !== "editing";

  return (
    <div className={styles.stage}>
      {/* Switched off rather than unmounted, so a failed send hands it back. */}
      <div className={styles.compose} inert={busy}>
        <div className={styles.headers}>
          {/*
          A field rather than a caption, so the address keeps a tab stop and stays
          selectable. Read-only rather than disabled: nothing here is switched off.
        */}
          <TextField label="To" value={emailLabel} readOnly />
          <TextField
            label="From"
            type="email"
            optional="optional, only so I can reply"
            value={compose.email}
            onValueChange={compose.setEmail}
          />
          <TextField
            label="Subject"
            value={compose.subject}
            onValueChange={compose.setSubject}
            maxLength={SUBJECT_LIMIT}
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
            <Button variant="default" size="sm" onClick={compose.send}>
              <PaperPlaneRight size={GLYPH_PX} weight="bold" aria-hidden />
              Send
            </Button>
          </div>
        </div>

        <div className={styles.surface}>
          <TextSurface
            face="text"
            fill="frame"
            aria-label="Message"
            placeholder="Anything at all."
            value={compose.message}
            onChange={(event) => compose.setMessage(event.target.value)}
            maxLength={MESSAGE_LIMIT}
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

      {busy && <SendDialog compose={compose} emailLabel={emailLabel} onClose={onClose} />}
    </div>
  );
}

function Glyph({ glyph: Mark }: { glyph: Icon }) {
  return <Mark size={GLYPH_PX} weight="bold" aria-hidden />;
}
