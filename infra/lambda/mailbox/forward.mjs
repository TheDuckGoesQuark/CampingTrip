// What to forward and how the forwarded copy is addressed. Free of the SDK so
// it can be tested. A message is handled as a latin1 string throughout, which
// maps one byte to one character, so attachments survive the round trip.

const BLANK_LINE = /\r?\n\r?\n/;
const ADDRESS = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/;

/** SES signs and stamps its own. */
const DROPPED = new Set(["return-path", "sender", "message-id", "dkim-signature"]);

export function receiptOf(event) {
  const ses = event?.Records?.[0]?.ses;
  if (!ses?.mail?.messageId || !Array.isArray(ses.receipt?.recipients)) return null;
  return { messageId: ses.mail.messageId, receipt: ses.receipt };
}

const failed = (verdict) => verdict?.status === "FAIL";

/** Forwarding spam from this domain would spend the reputation the newsletter sends on. */
export function isUnwanted(receipt) {
  return failed(receipt.spamVerdict) || failed(receipt.virusVerdict);
}

export function aliasFor(receipt, aliases) {
  const reached = receipt.recipients.map((recipient) => recipient.toLowerCase());
  return aliases.find((alias) => reached.includes(alias)) ?? aliases[0];
}

function splitHeaders(block) {
  const headers = [];
  for (const line of block.split(/\r?\n/)) {
    if (/^[ \t]/.test(line) && headers.length > 0) {
      headers.at(-1).lines.push(line);
      continue;
    }
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    headers.push({ name: line.slice(0, colon).trim().toLowerCase(), lines: [line] });
  }
  return headers;
}

const valueOf = (header) => header.lines.join(" ").slice(header.lines[0].indexOf(":") + 1);

const renamed = (header, name) => [
  `${name}:${header.lines[0].slice(header.lines[0].indexOf(":") + 1)}`,
  ...header.lines.slice(1),
];

/** From becomes the alias: the sender's DMARC policy would reject a copy claiming to be them. */
export function readdress(raw, alias) {
  const split = raw.search(BLANK_LINE);
  const block = split < 0 ? raw : raw.slice(0, split);
  const body = split < 0 ? "" : raw.slice(split).replace(BLANK_LINE, "");

  const headers = splitHeaders(block);
  const from = headers.find((header) => header.name === "from");
  const replyTo = headers.find((header) => header.name === "reply-to");

  // Built from the bare address only, so nothing the sender wrote is quoted into a new header.
  const sender = from ? valueOf(from).match(ADDRESS)?.[0] : undefined;
  const display = sender ? sender.replace("@", " at ") : "unknown sender";

  const kept = headers
    .filter((header) => !DROPPED.has(header.name) && header.name !== "from")
    .filter((header) => header.name !== "reply-to")
    .flatMap((header) => header.lines);

  const answerTo = replyTo ?? from;
  return [
    `From: "${display}" <${alias}>`,
    ...(answerTo ? renamed(answerTo, "Reply-To") : []),
    ...kept,
    "",
    body,
  ].join("\r\n");
}
