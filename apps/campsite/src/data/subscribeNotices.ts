/**
 * The pages a subscribe, confirm or unsubscribe lands on when it arrives as a
 * plain form post or a followed link. The endpoint redirects by name, so the
 * names here are its (`NOTICES` in `infra/lambda/newsletter-api/accept.mjs`);
 * `subscribeNotices.test.ts` reads that file and holds the two sets equal.
 */
export interface SubscribeNotice {
  /** The file name under `/blog/subscribe/`, and the endpoint's key for it. */
  name: string;
  title: string;
  /** For the page head. The body says the same thing at reading length. */
  description: string;
  body: string;
  /** Offer the form again, for a reader who has to start over. */
  offerForm?: true;
}

export const SUBSCRIBE_NOTICES: readonly SubscribeNotice[] = [
  {
    name: "check-your-inbox",
    title: "Check your inbox",
    description: "A confirmation link is on its way. Nothing is sent until you click it.",
    body: "A confirmation link is on its way to the address you gave. Click it and you're in; nothing is sent until you do. If it hasn't turned up in a few minutes, look in the junk folder, then try the form again.",
  },
  {
    name: "confirmed",
    title: "You're in",
    description: "The next post comes to your inbox with a summary and a link.",
    body: "The next post comes to your inbox with a summary and a link. Every issue carries an unsubscribe link, so leaving is one click.",
  },
  {
    name: "unsubscribed",
    title: "You've left the list",
    description: "Nothing more will arrive from here.",
    body: "Nothing more will arrive from here. The address stays on a do-not-send note so it can't be added back by mistake; say the word and I'll remove even that.",
  },
  {
    name: "link-expired",
    title: "That link has expired",
    description: "A confirmation link lasts two days. Subscribe again for a fresh one.",
    body: "A confirmation link lasts two days, and an unsubscribe link belongs to one address. Subscribe again below for a fresh one, or say hello through the contact form and I'll sort it by hand.",
    offerForm: true,
  },
  {
    name: "not-accepted",
    title: "That didn't go through",
    description: "The address didn't look like one, or sign-ups are paused for the day.",
    body: "Either the address didn't look like one, or sign-ups are paused for the day. Check it and try again below, or say hello through the contact form and I'll add you by hand.",
    offerForm: true,
  },
];

export function noticeNamed(name: string): SubscribeNotice | undefined {
  return SUBSCRIBE_NOTICES.find((notice) => notice.name === name);
}
