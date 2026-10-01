import { Button, Link, Text, type TextElement, TextField } from "@jordanscamp/ds";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { useDocumentId, useRenderTarget } from "../../../prerender/renderTarget";
import { blogPaths } from "../../../routing/blogPaths";
import { type FailureReason, SUBSCRIBE_ENDPOINT, submitSubscription } from "./submitSubscription";

import styles from "./subscribe.module.css";

export const SUBSCRIBE_HEADING = "Join my mailing list";

export const SUBSCRIBE_LEAD =
  "If you'd like more of my internal monologue and shower thoughts every now and then, just add your email here.";

export const CONSENT =
  "A confirmation link will be sent to your email. If you get fed up with me, a two-click unsubscribe link will be in the footer of every email.";

export const SENT = "Thank you! A confirmation link is on its way to you now.";

export const EMAIL_LABEL = "Email address";

export const SUBMIT_LABEL = "Sign me up";

const HEADING_ID = "subscribe-heading";

type State = "idle" | "sending" | "sent" | FailureReason;

const FAILURE_COPY: Record<FailureReason, string> = {
  refused: "That doesn't look like an email address. Have another go?",
  paused:
    "Server says I've had too many sign ups today. Please try again tomorrow. Mum, I made it!",
  server: "Something broke on my end. Try again in a minute.",
  offline: "Looks like you're offline. Try again once you're back.",
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
            {state === "sending" ? "Signing you up…" : SUBMIT_LABEL}
          </Button>
        </form>
      )}

      <Text variant="body-sm" tone="muted">
        {CONSENT}{" "}
        <Link render={<RouterLink to={blogPaths.privacy} />}>How I secure your email</Link>
      </Text>
    </section>
  );
}
