import { Button, Link, Text, type TextElement, TextField } from "@jordanscamp/ds";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { useDocumentId, useRenderTarget } from "../../../prerender/renderTarget";
import { blogPaths } from "../../../routing/blogPaths";
import { type FailureReason, SUBSCRIBE_ENDPOINT, submitSubscription } from "./submitSubscription";

import styles from "./subscribe.module.css";

export const SUBSCRIBE_HEADING = "New posts, by email";

export const SUBSCRIBE_LEAD =
  "When something new lands here, I'll send you the summary and a link. Nothing else, and rarely.";

export const CONSENT =
  "A confirmation link comes first, and nothing is sent until you click it. Every issue carries an unsubscribe link.";

export const SENT = "Check your inbox for a confirmation link.";

export const EMAIL_LABEL = "Email address";

export const SUBMIT_LABEL = "Subscribe";

const HEADING_ID = "subscribe-heading";

type State = "idle" | "sending" | "sent" | FailureReason;

const FAILURE_COPY: Record<FailureReason, string> = {
  refused: "That didn't look like an address. Check it and try again.",
  paused: "Sign-ups are paused for today. Try again tomorrow.",
  server: "That didn't go through. Try again in a minute.",
  offline: "You seem to be offline. Try again once you're back.",
};

function isFailure(state: State): state is FailureReason {
  return state in FAILURE_COPY;
}

export interface SubscribeFormProps {
  /** `h2` under a post's own title, `h1` on the page that is only this form. */
  headingLevel?: TextElement;
}

/**
 * One form, two ways of submitting. Rendered statically it is a plain POST to
 * the endpoint, which answers with a redirect to a notice page, so it works
 * with scripts off. In the live app the same form is intercepted and the answer
 * shown in place, because a full-page navigation out of the tent would be the
 * wrong reward for subscribing.
 */
export default function SubscribeForm({ headingLevel = "h2" }: SubscribeFormProps) {
  const live = useRenderTarget() === "live";
  const headingId = useDocumentId(HEADING_ID);
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<State>("idle");

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    setState("sending");
    const result = await submitSubscription({ email, trap });
    setState(result.ok ? "sent" : result.reason);
  }

  return (
    <section className={styles.subscribe} aria-labelledby={headingId}>
      <Text variant="title-3" as={headingLevel} id={headingId}>
        {SUBSCRIBE_HEADING}
      </Text>
      <Text tone="muted">{SUBSCRIBE_LEAD}</Text>

      {state === "sent" ? (
        <Text role="status">{SENT}</Text>
      ) : (
        <form
          className={styles.form}
          method="post"
          action={SUBSCRIBE_ENDPOINT}
          onSubmit={live ? submit : undefined}
        >
          <div className={styles.address}>
            <TextField
              label={EMAIL_LABEL}
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={state === "sending"}
              error={isFailure(state) ? FAILURE_COPY[state] : undefined}
            />
          </div>
          {/* The honeypot: hidden the same way as MouseMail's, so a screen reader
              never meets a field only a bot should fill in. */}
          <input
            className={styles.trap}
            name="trap"
            value={trap}
            onChange={(event) => setTrap(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
          />
          <Button type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : SUBMIT_LABEL}
          </Button>
        </form>
      )}

      <Text variant="body-sm" tone="muted">
        {CONSENT}{" "}
        <Link render={<RouterLink to={blogPaths.privacy} />}>How your address is handled</Link>.
      </Text>
    </section>
  );
}
