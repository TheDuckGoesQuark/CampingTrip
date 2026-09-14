import { Text, Window } from "@jordanscamp/ds";

import type { PresetId } from "../../data/mailPresets";
import MouseMailForm from "../blog/contact/MouseMailForm";
import { MESSAGE_LIMIT } from "../blog/contact/submitFeedback";
import { type Phase, useCompose } from "../blog/contact/useCompose";
import type { WindowFrameProps } from "./windowFrame";

export interface MouseMailWindowProps extends WindowFrameProps {
  mailto: string;
  emailLabel: string;
  preset?: PresetId | null;
  onClose: () => void;
}

const STATUS: Record<Phase, string> = {
  editing: "Not sent",
  sending: "Sending…",
  sent: "Sent",
  failed: "Couldn't send",
};

/**
 * MouseMail — a mail client on the CatOS desktop. `lg`: the header band, the
 * template row and a writing surface worth typing into do not fit inside the
 * page `md` leaves once the title bar, toolbar and status bar have taken their
 * share, and a compose window that scrolls before anything is typed reads as
 * broken rather than as small.
 *
 * A window rather than a dialog, so the desktop behind stays clickable and this
 * stacks with CatNav like any other app. That means Escape and focus-return are
 * the desktop's to handle — which it already does for every window — rather than
 * Base UI's.
 *
 * The phase and the character count are status-bar lines, which is why the
 * compose state is held out here and handed to the page rather than owned by
 * it: the frame is as much part of this form as the fields are.
 */
export default function MouseMailWindow({
  mailto,
  emailLabel,
  preset = null,
  onClose,
  ...frame
}: MouseMailWindowProps) {
  const compose = useCompose(preset);
  const composing = compose.phase === "editing" || compose.phase === "sending";

  return (
    <Window size="lg" {...frame}>
      <Window.TitleBar title="MouseMail" onClose={onClose} />
      <Window.Body>
        <MouseMailForm compose={compose} mailto={mailto} emailLabel={emailLabel} />
      </Window.Body>
      <Window.StatusBar>
        <Text variant="label" tone="muted" as="span">
          {STATUS[compose.phase]}
        </Text>
        {composing && (
          <>
            <Window.Separator />
            <Text variant="label" tone="muted" as="span">
              {compose.message.length} / {MESSAGE_LIMIT}
            </Text>
          </>
        )}
      </Window.StatusBar>
    </Window>
  );
}
