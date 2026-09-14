import { useRef, useState } from "react";

import { mailPreset, type PresetId } from "../../../data/mailPresets";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { type Feedback, type FailureReason, MIN_DWELL_MS, submitFeedback } from "./submitFeedback";

export type Failure = FailureReason | "hasty";

/**
 * How long the sending phase is held open at minimum, so the transfer screen
 * gets its run: an endpoint answering in a fifth of a second would flash the bar
 * and be gone before it read as anything.
 */
export const SEND_FLOOR_MS = 1600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type Phase = "editing" | "sending" | "sent" | "failed";

export interface Compose {
  /** The template in force, or undefined while the visitor has chosen none. */
  preset: PresetId | undefined;
  subject: string;
  message: string;
  email: string;
  trap: string;
  phase: Phase;
  failure: Failure | undefined;
  messageError: string | undefined;
  choosePreset: (id: PresetId) => void;
  setSubject: (value: string) => void;
  setMessage: (value: string) => void;
  setEmail: (value: string) => void;
  setTrap: (value: string) => void;
  send: () => void;
  /** Back to the draft, which is still intact behind whatever is covering it. */
  resume: () => void;
}

/**
 * Safe to rewrite from a template: either the visitor never typed here, or they
 * have since emptied it. Choosing a template must never cost someone a sentence
 * they wrote, but it also must not be silently refused because a previous
 * template left text behind — which is the whole reason this is not simply
 * "is it empty".
 */
function replaceable(value: string, typed: boolean): boolean {
  return !typed || value.trim() === "";
}

/**
 * `accept` refuses all of its checks alike, on purpose. The dwell floor is the
 * only one a real typist trips, and we hold the mount time — so that case can be
 * named without the endpoint saying which check it was.
 */
function refine(reason: FailureReason, dwellMs: number): Failure {
  return reason === "refused" && dwellMs < MIN_DWELL_MS ? "hasty" : reason;
}

/**
 * Everything the compose window holds. One hook rather than state inside the
 * form, because the window's own chrome is part of the form: Send is a toolbar
 * button and the phase and character count are status-bar text, so the frame
 * and the fields have to be reading the same values.
 *
 * `requested` is the template the visitor asked for on their way in — clicking
 * a reason in the contact footer opens this window already on that template.
 */
export function useCompose(requested: PresetId | null = null): Compose {
  const reduced = useReducedMotion();
  const [preset, setPreset] = useState<PresetId>();
  const [subject, setSubjectValue] = useState("");
  const [message, setMessageValue] = useState("");
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [phase, setPhase] = useState<Phase>("editing");
  const [failure, setFailure] = useState<Failure>();
  const [messageError, setMessageError] = useState<string>();
  const [typedSubject, setTypedSubject] = useState(false);
  const [typedMessage, setTypedMessage] = useState(false);
  const [consumed, setConsumed] = useState<PresetId | null>(null);
  const mountedAt = useRef(Date.now());

  function choosePreset(id: PresetId) {
    const chosen = mailPreset(id);
    setPreset(id);
    if (replaceable(subject, typedSubject)) {
      setSubjectValue(chosen.subject);
      setTypedSubject(false);
    }
    if (replaceable(message, typedMessage)) {
      setMessageValue(chosen.body);
      setTypedMessage(false);
      setMessageError(undefined);
    }
  }

  /* Adjusting state to a changed input during the render that brings it, rather
     than in an effect: an effect would paint the window empty first and fill it
     in on the next frame, which reads as the template failing to arrive. */
  if (requested !== null && requested !== consumed) {
    setConsumed(requested);
    choosePreset(requested);
  }

  async function send() {
    if (message.trim() === "") {
      setMessageError("Add a note first — anything at all.");
      return;
    }
    setMessageError(undefined);
    setFailure(undefined);
    setPhase("sending");
    const feedback: Feedback = {
      message: message.trim(),
      trap,
      mountedAt: mountedAt.current,
      ...(subject.trim() === "" ? {} : { subject: subject.trim() }),
      ...(email.trim() === "" ? {} : { email: email.trim() }),
    };
    // Not the anti-spam dwell floor, which stays the endpoint's to enforce:
    // holding the person here would punish someone who simply types fast.
    // The dwell the endpoint judged, which the send floor below outlasts.
    const askedAt = Date.now();
    const [result] = await Promise.all([
      submitFeedback(feedback),
      reduced ? Promise.resolve() : wait(SEND_FLOOR_MS),
    ]);
    if (result.ok) {
      setPhase("sent");
      return;
    }
    setFailure(refine(result.reason, askedAt - mountedAt.current));
    setPhase("failed");
  }

  return {
    preset,
    subject,
    message,
    email,
    trap,
    phase,
    failure,
    messageError,
    choosePreset,
    setSubject: (value) => {
      setTypedSubject(true);
      setSubjectValue(value);
    },
    setMessage: (value) => {
      setTypedMessage(true);
      setMessageValue(value);
    },
    setEmail,
    setTrap,
    send,
    resume: () => setPhase("editing"),
  };
}
