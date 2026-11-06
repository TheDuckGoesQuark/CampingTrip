// The routes, given a table, so they are tested without AWS. GET answers the
// top ten; POST records a score and answers the top ten as it then stands.
import { acceptScore, qualifies } from "./accept.mjs";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

export const REFUSED = { error: "Not accepted." };
export const BUSY = { error: "The board is full for today." };

/**
 * `deps`: the table, the day's write cap, and the clock and id, injected so a
 * test can pin them.
 */
export async function route(event, { table, writeCapPerDay, nowMs, newId }) {
  // A direct signed invoke has no request context; only the Function URL is the API.
  const method = event.requestContext?.http?.method;
  if (method === "GET") return json(200, { scores: await table.top() });
  if (method !== "POST") return json(405, REFUSED);

  const body = event.isBase64Encoded
    ? Buffer.from(event.body ?? "", "base64").toString("utf8")
    : (event.body ?? "");
  const verdict = acceptScore(body);
  if (!verdict.ok) return json(400, REFUSED);

  const board = await table.top();
  // A score that would not make the board is answered without spending a write.
  if (!qualifies(board, verdict.entry.score)) return json(200, { scores: board });

  const day = new Date(nowMs).toISOString().slice(0, 10);
  if (!(await table.takeWriteSlot(day, writeCapPerDay, Math.floor(nowMs / 1000)))) {
    console.log("pacmac-scores: daily write cap reached");
    return json(429, BUSY);
  }
  await table.put(verdict.entry, nowMs, newId());
  return json(200, { scores: await table.top() });
}
