// The newsletter check, against the live site: subscribe a fresh address on
// the inbox domain, follow the confirmation it is mailed, wait for the
// welcome, and unsubscribe. A missed step fails the run by name.
//
// Mail is read from the inbox bucket through the AWS CLI, which the runner
// has and this directory does not: there is no install step to keep green.
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import { promisify } from "node:util";

import { WELCOME_ISSUE } from "../../lambda/newsletter-api/confirm.mjs";
import { confirmLink, isAddressedTo, parseMessage, unsubscribeLink } from "./mail.mjs";

const exec = promisify(execFile);

const { SITE_ORIGIN, INBOX_DOMAIN, INBOX_BUCKET, WAIT_SECONDS = "180" } = process.env;

const started = Date.now();
const elapsed = () => `${((Date.now() - started) / 1000).toFixed(0)}s`;

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function note(message) {
  console.log(`[${elapsed()}] ${message}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `- ${message}\n`);
  }
}

for (const [name, value] of Object.entries({ SITE_ORIGIN, INBOX_DOMAIN, INBOX_BUCKET })) {
  if (!value) fail(`${name} is not set`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function aws(...args) {
  const { stdout } = await exec("aws", args, { maxBuffer: 32 * 1024 * 1024 });
  return stdout;
}

async function inboxKeys() {
  const out = await aws(
    "s3api",
    "list-objects-v2",
    "--bucket",
    INBOX_BUCKET,
    "--prefix",
    "inbox/",
    "--query",
    "Contents[].Key",
    "--output",
    "json",
  );
  return JSON.parse(out) ?? [];
}

const readMail = (key) => aws("s3", "cp", `s3://${INBOX_BUCKET}/${key}`, "-");
const deleteMail = (key) => aws("s3", "rm", `s3://${INBOX_BUCKET}/${key}`);

/**
 * The next message for `address`, deleted from the bucket once read. Mail for
 * any other address is left for the bucket's own expiry.
 */
async function awaitMail(step, address, accepts) {
  const deadline = Date.now() + Number(WAIT_SECONDS) * 1000;
  const seen = new Set();
  while (Date.now() < deadline) {
    for (const key of await inboxKeys()) {
      if (seen.has(key)) continue;
      seen.add(key);
      const message = parseMessage(await readMail(key));
      if (!isAddressedTo(message, address)) continue;
      await deleteMail(key);
      if (accepts(message)) return message;
      fail(
        `${step}: the message for ${address} has subject "${message.subject}", not the one expected`,
      );
    }
    await sleep(10_000);
  }
  return fail(`${step}: nothing for ${address} within ${WAIT_SECONDS}s`);
}

function expectRedirect(step, response, notice) {
  const location = response.headers.get("location") ?? "";
  if (response.status !== 303 || !location.endsWith(`/blog/subscribe/${notice}.html`)) {
    fail(`${step}: expected a 303 to ${notice}, got ${response.status} ${location}`);
  }
}

const address = `e2e+${randomUUID().slice(0, 8)}@${INBOX_DOMAIN}`;

const subscribed = await fetch(`${SITE_ORIGIN}/api/newsletter/subscribe`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({ email: address, trap: "" }),
});
if (subscribed.status !== 202) {
  fail(`subscribe: expected 202, got ${subscribed.status} ${await subscribed.text()}`);
}
note(`subscribed ${address}`);

const confirmation = await awaitMail("confirmation", address, (m) => confirmLink(m, SITE_ORIGIN));
note(`confirmation arrived: "${confirmation.subject}"`);

const confirmed = await fetch(confirmLink(confirmation, SITE_ORIGIN), { redirect: "manual" });
expectRedirect("confirm", confirmed, "confirmed");
note("confirmed");

const welcome = await awaitMail("welcome", address, (m) =>
  m.html.includes(`utm_campaign=${WELCOME_ISSUE}`),
);
note(`welcome arrived: "${welcome.subject}"`);

const unsubscribe = unsubscribeLink(welcome);
if (!unsubscribe) fail("welcome: no List-Unsubscribe header");
if (welcome.headers.get("list-unsubscribe-post") !== "List-Unsubscribe=One-Click") {
  fail("welcome: List-Unsubscribe-Post is missing or wrong");
}

const unsubscribed = await fetch(unsubscribe, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: "List-Unsubscribe=One-Click",
  redirect: "manual",
});
expectRedirect("unsubscribe", unsubscribed, "unsubscribed");
note("unsubscribed");
