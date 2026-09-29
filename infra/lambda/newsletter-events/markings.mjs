// Which subscribers an SES event marks, and as what. Free of the SDK so it
// can be tested against the event shapes SES documents.

/**
 * A soft bounce (a full mailbox, a server having a bad hour) is left alone:
 * the address may well work next issue. Only a permanent bounce or a complaint
 * takes an address off the list.
 */
export function markingsFrom(message) {
  if (message === null || typeof message !== "object") return [];
  const type = message.eventType ?? message.notificationType;

  if (type === "Bounce" && message.bounce?.bounceType === "Permanent") {
    return addresses(message.bounce.bouncedRecipients).map((email) => ({
      email,
      status: "bounced",
    }));
  }
  if (type === "Complaint") {
    return addresses(message.complaint?.complainedRecipients).map((email) => ({
      email,
      status: "complained",
    }));
  }
  return [];
}

function addresses(recipients) {
  if (!Array.isArray(recipients)) return [];
  return recipients
    .map((recipient) => recipient?.emailAddress)
    .filter((email) => typeof email === "string" && email !== "")
    .map((email) => email.trim().toLowerCase());
}
