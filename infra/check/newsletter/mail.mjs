// A received message as SES wrote it to the bucket: headers, then a body that
// is one part or several. Free of the SDK so it can be tested.

const BLANK_LINE = /\r?\n\r?\n/;

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Names lower-cased, folded lines joined, repeats joined with a comma. */
export function parseHeaders(block) {
  const headers = new Map();
  let name = null;
  for (const line of block.split(/\r?\n/)) {
    if (/^[ \t]/.test(line) && name) {
      headers.set(name, `${headers.get(name)} ${line.trim()}`);
      continue;
    }
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    name = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    headers.set(name, headers.has(name) ? `${headers.get(name)}, ${value}` : value);
  }
  return headers;
}

export function parseContentType(value = "text/plain") {
  const [type, ...rest] = value.split(";");
  const params = {};
  for (const piece of rest) {
    const eq = piece.indexOf("=");
    if (eq < 0) continue;
    const key = piece.slice(0, eq).trim().toLowerCase();
    params[key] = piece
      .slice(eq + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1");
  }
  return { type: type.trim().toLowerCase(), params };
}

export function decodeQuotedPrintable(text, charset = "utf-8") {
  const joined = text.replace(/=\r?\n/g, "");
  const bytes = [];
  for (let i = 0; i < joined.length; i += 1) {
    const hex = joined.slice(i + 1, i + 3);
    if (joined[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(Number.parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(joined.charCodeAt(i) & 0xff);
    }
  }
  return new TextDecoder(charset).decode(Uint8Array.from(bytes));
}

export function decodeBody(body, encoding = "7bit", charset = "utf-8") {
  switch (encoding.trim().toLowerCase()) {
    case "base64":
      return new TextDecoder(charset).decode(Buffer.from(body.replace(/\s/g, ""), "base64"));
    case "quoted-printable":
      return decodeQuotedPrintable(body, charset);
    default:
      return body;
  }
}

/** An RFC 2047 encoded word in a header, `=?utf-8?Q?...?=`, read back. */
export function decodeWord(value) {
  return value.replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g, (_, charset, encoding, text) =>
    encoding.toLowerCase() === "b"
      ? new TextDecoder(charset).decode(Buffer.from(text, "base64"))
      : decodeQuotedPrintable(text.replaceAll("_", " "), charset),
  );
}

function splitMultipart(body, boundary) {
  const atMarker = new RegExp(`(?:^|\\r?\\n)--${escapeRegExp(boundary)}`);
  return body
    .split(atMarker)
    .slice(1)
    .filter((piece) => !piece.startsWith("--"))
    .map((piece) => piece.replace(/^\r?\n/, ""));
}

function splitHeadersAndBody(raw) {
  const at = raw.search(BLANK_LINE);
  if (at < 0) return { headers: parseHeaders(raw), body: "" };
  return { headers: parseHeaders(raw.slice(0, at)), body: raw.slice(at).replace(BLANK_LINE, "") };
}

/** The first text and html parts, however the message nests them. */
function collectParts(headers, body, parts) {
  const { type, params } = parseContentType(headers.get("content-type"));
  if (type.startsWith("multipart/") && params.boundary) {
    for (const piece of splitMultipart(body, params.boundary)) {
      const part = splitHeadersAndBody(piece);
      collectParts(part.headers, part.body, parts);
    }
    return;
  }
  const decoded = decodeBody(body, headers.get("content-transfer-encoding"), params.charset);
  if (type === "text/plain" && parts.text === undefined) parts.text = decoded;
  if (type === "text/html" && parts.html === undefined) parts.html = decoded;
}

export function parseMessage(raw) {
  const { headers, body } = splitHeadersAndBody(raw);
  const parts = {};
  collectParts(headers, body, parts);
  return {
    headers,
    subject: decodeWord(headers.get("subject") ?? ""),
    text: parts.text ?? "",
    html: parts.html ?? "",
  };
}

export function isAddressedTo(message, address) {
  return (message.headers.get("to") ?? "").toLowerCase().includes(address.toLowerCase());
}

/** The confirmation link the API mailed, or null. */
export function confirmLink(message, siteOrigin) {
  const link = new RegExp(`${escapeRegExp(siteOrigin)}/api/newsletter/confirm\\?t=[A-Za-z0-9_-]+`);
  return message.text.match(link)?.[0] ?? message.html.match(link)?.[0] ?? null;
}

/** Where `List-Unsubscribe` points, without its angle brackets, or null. */
export function unsubscribeLink(message) {
  return (message.headers.get("list-unsubscribe") ?? "").match(/<([^>]+)>/)?.[1] ?? null;
}

/**
 * The `Authentication-Results` header SES adds on receipt, one entry per
 * method: `{ method: "dkim", result: "pass", detail: "header.i=@example.com" }`.
 */
export function authenticationResults(message) {
  return (message.headers.get("authentication-results") ?? "")
    .split(";")
    .map((entry) => entry.trim().match(/^(spf|dkim|dmarc)=(\w+)\s*(.*)$/))
    .filter(Boolean)
    .map(([, method, result, detail]) => ({ method, result: result.toLowerCase(), detail }));
}
