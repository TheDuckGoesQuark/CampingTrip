import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NOTICES } from "./accept.mjs";
import { confirmSubscriber, WELCOME_ISSUE } from "./confirm.mjs";

const TOKEN = "abcdefghijklmnopqrstuvwxyz012345";
const NOW = "2026-10-21T12:00:00.000Z";

/** One row, held to the conditions `store.mjs` puts on each write. */
function storeWith(row) {
  const key = { pk: `SUB#${row.email}`, sk: "META" };
  return {
    row,
    async findByToken(_index, _attribute, token) {
      return row.confirm_token === token ? key : undefined;
    },
    async activate(_key, nowIso) {
      if (!["pending", "active"].includes(row.status)) return false;
      row.status = "active";
      row.confirmed_at ??= nowIso;
      return true;
    },
    async claimWelcome(_key, nowIso) {
      if (row.status !== "active" || row.welcome_queued_at !== undefined) return undefined;
      row.welcome_queued_at = nowIso;
      return { ...row };
    },
    async releaseWelcome() {
      delete row.welcome_queued_at;
    },
  };
}

const pending = () => ({
  email: "reader@example.com",
  status: "pending",
  confirm_token: TOKEN,
  unsubscribe_token: "unsubscribe-token-for-the-reader",
});

function queue({ failures = 0 } = {}) {
  const sent = [];
  let left = failures;
  return {
    sent,
    async enqueue(message) {
      if (left > 0) {
        left -= 1;
        throw Object.assign(new Error("queue down"), { name: "QueueUnavailable" });
      }
      sent.push(message);
    },
  };
}

const follow = (store, q, token = TOKEN) =>
  confirmSubscriber({ store, enqueue: q.enqueue, token, nowIso: NOW });

describe("confirmSubscriber", () => {
  it("activates the row and queues the welcome for that address", async () => {
    const store = storeWith(pending());
    const q = queue();
    assert.equal(await follow(store, q), NOTICES.confirmed);
    assert.equal(store.row.status, "active");
    assert.equal(store.row.welcome_queued_at, NOW);
    assert.deepEqual(q.sent, [
      {
        issue: WELCOME_ISSUE,
        email: "reader@example.com",
        unsubscribeToken: "unsubscribe-token-for-the-reader",
      },
    ]);
  });

  it("queues the welcome once however often the link is followed", async () => {
    const store = storeWith(pending());
    const q = queue();
    await follow(store, q);
    assert.equal(await follow(store, q), NOTICES.confirmed);
    assert.equal(await follow(store, q), NOTICES.confirmed);
    assert.equal(q.sent.length, 1);
  });

  it("queues nothing for a subscriber whose welcome is already recorded", async () => {
    const store = storeWith({ ...pending(), status: "active", welcome_queued_at: NOW });
    const q = queue();
    assert.equal(await follow(store, q), NOTICES.confirmed);
    assert.deepEqual(q.sent, []);
  });

  it("still confirms when the queue refuses, and retries on the next click", async () => {
    const store = storeWith(pending());
    const q = queue({ failures: 1 });
    assert.equal(await follow(store, q), NOTICES.confirmed);
    assert.equal(store.row.status, "active");
    assert.equal(store.row.welcome_queued_at, undefined);
    assert.deepEqual(q.sent, []);

    await follow(store, q);
    assert.equal(q.sent.length, 1);
    assert.equal(store.row.welcome_queued_at, NOW);
  });

  it("sends an unsubscribed reader's old link to the expired page, with no welcome", async () => {
    const store = storeWith({ ...pending(), status: "unsubscribed" });
    const q = queue();
    assert.equal(await follow(store, q), NOTICES.linkExpired);
    assert.deepEqual(q.sent, []);
  });

  it("sends an unknown or missing token to the expired page", async () => {
    const q = queue();
    assert.equal(
      await follow(storeWith(pending()), q, "not-a-token-anyone-was-sent"),
      NOTICES.linkExpired,
    );
    assert.equal(await follow(storeWith(pending()), q, null), NOTICES.linkExpired);
    assert.deepEqual(q.sent, []);
  });
});
