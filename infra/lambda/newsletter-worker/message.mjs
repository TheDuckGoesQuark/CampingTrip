// One recipient's copy of an issue, from the rendered issue and the queue
// message. Free of the SDK so it can be tested.

/** The renderer leaves this where the recipient's own link goes. */
export const UNSUBSCRIBE_PLACEHOLDER = "{{unsubscribe_url}}";

export function parseQueueMessage(body) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object") return null;
  const { issue, email, unsubscribeToken, test } = parsed;
  if (typeof issue !== "string" || typeof email !== "string") return null;
  if (test === true) return { issue, email, test: true };
  if (typeof unsubscribeToken !== "string") return null;
  return { issue, email, unsubscribeToken, test: false };
}

/**
 * Where the footer's link and the `List-Unsubscribe` header point. A test copy
 * points at the site's page for a spent link, which is honest about what
 * clicking it does: nothing.
 */
export function unsubscribeUrlFor(message, siteOrigin) {
  return message.test
    ? `${siteOrigin}/blog/subscribe/link-expired.html`
    : `${siteOrigin}/api/newsletter/unsubscribe?t=${message.unsubscribeToken}`;
}

/**
 * Subject, both bodies and the two headers that let a mail client offer its
 * own unsubscribe control. The one-click header is a POST by specification,
 * which is the whole reason the endpoint's GET only shows a page.
 */
export function buildMessage({ rendered, message, siteOrigin }) {
  const unsubscribeUrl = unsubscribeUrlFor(message, siteOrigin);
  const fill = (text) => text.replaceAll(UNSUBSCRIBE_PLACEHOLDER, unsubscribeUrl);
  return {
    subject: message.test ? `[TEST] ${rendered.subject}` : rendered.subject,
    html: fill(rendered.html),
    text: fill(rendered.text),
    headers: [
      { Name: "List-Unsubscribe", Value: `<${unsubscribeUrl}>` },
      { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" },
    ],
  };
}
