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
    description: "A confirmation link is on its way. Click it to join the list.",
    body: "A confirmation link is on its way to the address you gave, just to make sure it's yours. Click it, and you're on the list!",
  },
  {
    name: "confirmed",
    title: "You're on the list!",
    description: "The next time I post, you'll get it straight to your inbox.",
    body: "Next time I post something, you'll get the summary and a link. If you get fed up with me, there's an unsubscribe link in the footer of every email.",
  },
  {
    name: "unsubscribed",
    title: "Unsubscribed",
    description: "You've been taken off the list.",
    body: "Done, one less newsletter in your inbox! Your address stays on a do-not-send list to ensure you never receive anything by mistake. If you'd like your email removed from there too, use the contact form on my website and I'll sort that as soon as I can.",
  },
  {
    name: "link-expired",
    title: "That link isn't working",
    description: "That link isn't working. Sign up again, or use the contact form.",
    body: "Confirmation links only last two days. If that's the one you clicked, sign up again below for a fresh one. If you were trying to unsubscribe, use the contact form and I'll sort it by hand.",
    offerForm: true,
  },
  {
    name: "not-accepted",
    title: "That didn't go through",
    description: "Your sign-up didn't go through. Try again, or use the contact form.",
    body: "Either that email address didn't look right, or the day's sign-ups are used up. Check it and try again, or use the contact form.",
    offerForm: true,
  },
];

export function noticeNamed(name: string): SubscribeNotice | undefined {
  return SUBSCRIBE_NOTICES.find((notice) => notice.name === name);
}
