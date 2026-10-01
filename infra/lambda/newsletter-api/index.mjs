// The newsletter endpoint behind `jordanscamp.site/api/newsletter/*`.
//
// Three routes, told apart by the last path segment: `subscribe` writes a
// pending row and emails a confirmation link; `confirm` activates the row the
// link's token names; `unsubscribe` shows a page on GET and acts on POST. What
// to accept and what to say lives in `accept.mjs`; the table in `store.mjs`.
//
// Nothing a reader typed is logged. The one log line, on the confirmation
// cap, is a constant that an alarm's metric filter matches.
import { randomBytes } from "node:crypto";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import {
  acceptSubscribe,
  acceptToken,
  confirmationMail,
  NOTICES,
  noticePath,
  unsubscribePage,
  unsubscribeToken,
  wantsJson,
} from "./accept.mjs";
import { makeStore } from "./store.mjs";

const {
  TABLE_NAME,
  FROM,
  REPLY_TO,
  CONFIGURATION_SET,
  SITE_ORIGIN,
  CONSENT_VERSION,
  CONFIRM_CAP_PER_DAY,
} = process.env;

const SITE_NAME = "JordansCamp.Site";

const store = makeStore(DynamoDBDocumentClient.from(new DynamoDBClient({})), TABLE_NAME);
const ses = new SESv2Client({});

const newToken = () => randomBytes(24).toString("base64url");

const redirect = (notice) => ({
  statusCode: 303,
  headers: { Location: `${SITE_ORIGIN}${noticePath(notice)}`, "Cache-Control": "no-store" },
  body: "",
});

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

const html = (body) => ({
  statusCode: 200,
  headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  body,
});

const REFUSED = { error: "Not accepted." };

function bodyOf(event) {
  return event.isBase64Encoded
    ? Buffer.from(event.body ?? "", "base64").toString("utf8")
    : (event.body ?? "");
}

async function sendConfirmation(email, token) {
  const link = `${SITE_ORIGIN}/api/newsletter/confirm?t=${token}`;
  const mail = confirmationMail({ link, siteName: SITE_NAME });
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: FROM,
      ReplyToAddresses: [REPLY_TO],
      Destination: { ToAddresses: [email] },
      ConfigurationSetName: CONFIGURATION_SET,
      Content: {
        Simple: {
          Subject: { Data: mail.subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: mail.text, Charset: "UTF-8" },
            Html: { Data: mail.html, Charset: "UTF-8" },
          },
        },
      },
    }),
  );
}

async function subscribe(event) {
  const asJson = wantsJson(event.headers);
  const verdict = acceptSubscribe(bodyOf(event), event.headers?.["content-type"]);
  if (!verdict.ok) return asJson ? json(400, REFUSED) : redirect(NOTICES.notAccepted);

  const now = new Date();
  const nowIso = now.toISOString();
  const nowS = Math.floor(now.getTime() / 1000);
  const { email } = verdict;

  const existing = await store.get(email);
  // Already in: the same answer as a new signup, so the form cannot be used to
  // find out who is on the list, and no second confirmation is sent.
  if (existing?.status === "active")
    return asJson ? json(202, { ok: true }) : redirect(NOTICES.checkInbox);

  const day = nowIso.slice(0, 10);
  const allowed = await store.takeConfirmationSlot(day, Number(CONFIRM_CAP_PER_DAY), nowS);
  if (!allowed) {
    console.log("confirmation cap reached");
    return asJson ? json(503, { error: "Try again tomorrow." }) : redirect(NOTICES.notAccepted);
  }

  let confirmToken;
  if (existing?.status === "pending") {
    confirmToken = existing.confirm_token;
    await store.refreshPending(email, nowIso, nowS);
  } else {
    confirmToken = newToken();
    await store.putPending({
      email,
      confirmToken,
      unsubscribeToken: newToken(),
      nowIso,
      nowS,
      consentVersion: CONSENT_VERSION,
    });
  }

  await sendConfirmation(email, confirmToken);
  return asJson ? json(202, { ok: true }) : redirect(NOTICES.checkInbox);
}

async function confirm(event) {
  const token = acceptToken(event.queryStringParameters?.t);
  if (!token) return redirect(NOTICES.linkExpired);
  const key = await store.findByToken("confirm-token", "confirm_token", token);
  if (!key) return redirect(NOTICES.linkExpired);
  const activated = await store.activate(key, new Date().toISOString());
  return redirect(activated ? NOTICES.confirmed : NOTICES.linkExpired);
}

async function unsubscribe(event, method) {
  if (method === "GET") {
    const token = acceptToken(event.queryStringParameters?.t);
    if (!token) return redirect(NOTICES.linkExpired);
    return html(unsubscribePage({ token, siteName: SITE_NAME }));
  }
  const token = unsubscribeToken(
    bodyOf(event),
    event.headers?.["content-type"],
    event.queryStringParameters,
  );
  if (!token) return redirect(NOTICES.linkExpired);
  const key = await store.findByToken("unsubscribe-token", "unsubscribe_token", token);
  if (!key) return redirect(NOTICES.linkExpired);
  await store.unsubscribe(key, new Date().toISOString());
  return redirect(NOTICES.unsubscribed);
}

export const handler = async (event) => {
  const method = event?.requestContext?.http?.method;
  const route = (event?.rawPath ?? "").split("/").findLast(Boolean);

  if (route === "subscribe" && method === "POST") return subscribe(event);
  if (route === "confirm" && method === "GET") return confirm(event);
  if (route === "unsubscribe" && (method === "GET" || method === "POST")) {
    return unsubscribe(event, method);
  }
  return { statusCode: 404, body: "" };
};
