import { Briefcase, Bug, ChatCircle, type Icon, PencilSimple } from "@jordanscamp/ds/icons";

/**
 * Here rather than beside the desktop item it names, so `routing/windows` can
 * build the slug without importing `desktopItems` — which reaches back round
 * through `routing/navigation` to the scene store.
 */
export const MOUSEMAIL_LABEL = "MouseMail";

/**
 * The templates MouseMail offers. One list, because the contact footer's rail
 * and the compose window's own pill row are the same four choices: the pill a
 * visitor clicks downstairs is the pill that is selected upstairs, and a label
 * that disagreed between the two would read as having landed somewhere else.
 */
export type PresetId = "bug" | "feedback" | "work" | "other";

export interface MailPreset {
  id: PresetId;
  label: string;
  glyph: Icon;
  /** Written into the subject line. */
  subject: string;
  /** Written into the message. Prompts, not prose — the visitor types between them. */
  body: string;
}

export const MAIL_PRESETS: readonly MailPreset[] = [
  {
    id: "bug",
    label: "Bug report",
    glyph: Bug,
    subject: "Something is broken",
    body: "Where I was:\n\nWhat I expected:\n\nWhat actually happened:\n",
  },
  {
    id: "feedback",
    label: "Feedback",
    glyph: ChatCircle,
    subject: "Some feedback",
    body: "What worked:\n\nWhat didn't:\n",
  },
  {
    id: "work",
    label: "Working together",
    glyph: Briefcase,
    subject: "Working together",
    body: "What you're building:\n\nWhere you think I'd fit:\n\nRough timing:\n",
  },
  {
    /**
     * Fills in nothing, on purpose: this is the way out of the other three, so
     * anything written here would be one more thing to clear before starting.
     */
    id: "other",
    label: "Other",
    glyph: PencilSimple,
    subject: "",
    body: "",
  },
];

export function mailPreset(id: PresetId): MailPreset {
  const found = MAIL_PRESETS.find((preset) => preset.id === id);
  if (found === undefined) throw new Error(`No mail preset called ${id}`);
  return found;
}

/**
 * The `mailto:` a template's pill points at. The prerendered page runs none of
 * MouseMail, so this is what a visitor with no script gets from the same click
 * — their own mail client, opened on the same template. Which is also why the
 * pills stay anchors: the scripted and scriptless answers agree.
 */
export function presetMailto(mailto: string, preset: MailPreset): string {
  // `encodeURIComponent`, not `URLSearchParams`: that form encodes a space as
  // `+`, which a mail client puts in the message as a plus sign.
  const fields = [
    ["subject", preset.subject],
    ["body", preset.body],
  ].filter(([, value]) => value !== "");
  if (fields.length === 0) return mailto;
  const query = fields.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
  return `${mailto}?${query}`;
}
