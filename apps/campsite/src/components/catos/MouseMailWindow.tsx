import { Text, Window } from "@jordanscamp/ds";
import { useState } from "react";

import MouseMailForm, { type Phase } from "../blog/contact/MouseMailForm";
import type { WindowFrameProps } from "./windowFrame";

export interface MouseMailWindowProps extends WindowFrameProps {
  mailto: string;
  emailLabel: string;
  onClose: () => void;
}

const STATUS: Record<Phase, string> = {
  editing: "Not sent",
  sending: "Sending…",
  sent: "Sent",
  failed: "Couldn't send",
};

/**
 * MouseMail — a mail client on the CatOS desktop. `md`: `sm` caps at 420×320,
 * which a message field, an address field and its hint do not fit inside
 * without the body scrolling — a compose window that scrolls before anything is
 * typed reads as broken rather than as small.
 *
 * A window rather than a dialog, so the desktop behind stays clickable and this
 * stacks with CatNav like any other app. That means Escape and focus-return are
 * the desktop's to handle — which it already does for every window — rather than
 * Base UI's.
 */
export default function MouseMailWindow({
  mailto,
  emailLabel,
  onClose,
  ...frame
}: MouseMailWindowProps) {
  const [phase, setPhase] = useState<Phase>("editing");

  return (
    <Window size="md" {...frame}>
      <Window.TitleBar title="MouseMail" onClose={onClose} />
      <Window.Toolbar>
        <Text variant="label" tone="muted" as="span">
          To: {emailLabel}
        </Text>
      </Window.Toolbar>
      <Window.Body>
        <MouseMailForm mailto={mailto} emailLabel={emailLabel} onPhaseChange={setPhase} />
      </Window.Body>
      <Window.StatusBar>
        <Text variant="label" tone="muted" as="span">
          {STATUS[phase]}
        </Text>
      </Window.StatusBar>
    </Window>
  );
}
