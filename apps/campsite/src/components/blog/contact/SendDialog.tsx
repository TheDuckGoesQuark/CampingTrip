import {
  AlertDialog,
  Button,
  CopyButton,
  LoadingDialog,
  Text,
  TransferProgress,
} from "@jordanscamp/ds";
import { CheckCircle, WarningCircle } from "@jordanscamp/ds/icons";

import { draftText } from "./draftText";
import { type Compose, type Failure, SEND_FLOOR_MS } from "./useCompose";

export interface SendDialogProps {
  compose: Compose;
  emailLabel: string;
  /** Closes MouseMail, not just this dialog. */
  onClose: () => void;
}

const MARK_PX = 28;

/**
 * Nothing rate-limits one sender, so no wording may imply it does. Retrying is
 * offered in the sentence, not a button: "Back to my note" leads to a live Send.
 */
const EXPLANATION: Record<Failure, string> = {
  busy: "The mailbox was handling too much at once. Worth trying again in a moment.",
  hasty:
    "That went off within a couple of seconds of the window opening, which reads as a bot. Try again and it should go through.",
  refused: "The mailbox turned it away, and I can't say why without telling the bots too.",
  server: "Something broke at my end, not yours.",
  offline: "Nothing came back at all — worth a look at your connection.",
};

export default function SendDialog({ compose, emailLabel, onClose }: SendDialogProps) {
  if (compose.phase === "sending") {
    return (
      <LoadingDialog title="Sending">
        <TransferProgress caption="Transferring… 1 of 1 message" durationMs={SEND_FLOOR_MS} />
      </LoadingDialog>
    );
  }

  if (compose.phase === "failed") {
    return <Failed compose={compose} emailLabel={emailLabel} />;
  }

  return (
    <AlertDialog>
      <AlertDialog.Title>Message sent</AlertDialog.Title>
      <AlertDialog.Icon>
        <CheckCircle size={MARK_PX} weight="fill" />
      </AlertDialog.Icon>
      <AlertDialog.Body>
        <Text>
          {compose.email.trim() === ""
            ? "Thanks for your message, I should see it within a few days!"
            : "Thanks for your message, I'll usually reply within a few days!"}
        </Text>
      </AlertDialog.Body>
      <AlertDialog.Actions>
        <Button variant="default" size="sm" onClick={onClose}>
          OK
        </Button>
      </AlertDialog.Actions>
    </AlertDialog>
  );
}

function Failed({ compose, emailLabel }: { compose: Compose; emailLabel: string }) {
  const text = draftText(emailLabel, compose.subject, compose.message);

  return (
    <AlertDialog>
      <AlertDialog.Title>Not sent</AlertDialog.Title>
      <AlertDialog.Icon>
        <WarningCircle size={MARK_PX} weight="fill" />
      </AlertDialog.Icon>
      <AlertDialog.Body>
        <Text>{compose.failure === undefined ? "" : EXPLANATION[compose.failure]}</Text>
        <Text variant="body-sm" tone="muted">
          Alternatively, copy everything and send from your own email client.
        </Text>
      </AlertDialog.Body>
      <AlertDialog.Actions>
        <Button variant="default" size="sm" onClick={compose.resume}>
          Back
        </Button>
        <CopyButton value={text} label="Copy email contents" size="sm" />
      </AlertDialog.Actions>
    </AlertDialog>
  );
}
