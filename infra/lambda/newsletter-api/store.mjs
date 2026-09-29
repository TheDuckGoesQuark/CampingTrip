// The table, as the handler needs it. Every write that must not happen twice
// carries a condition, so a retried request or a redelivered link is a no-op
// rather than a second row or a second send.
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const HOUR = 60 * 60;

/** How long an unconfirmed signup is kept before the table forgets it. */
export const PENDING_TTL_S = 48 * HOUR;

/** The day's counter outlives the day, so a late reader of the table can see it. */
const CAP_TTL_S = 72 * HOUR;

export const subscriberKey = (email) => ({ pk: `SUB#${email}`, sk: "META" });

const isConditionFailure = (error) => error?.name === "ConditionalCheckFailedException";

export function makeStore(client, tableName) {
  const table = { TableName: tableName };

  return {
    async get(email) {
      const { Item } = await client.send(new GetCommand({ ...table, Key: subscriberKey(email) }));
      return Item;
    },

    /** `false` once the day's cap is spent; the caller refuses and logs. */
    async takeConfirmationSlot(day, cap, nowS) {
      try {
        await client.send(
          new UpdateCommand({
            ...table,
            Key: { pk: `CAP#confirm#${day}`, sk: "META" },
            UpdateExpression: "ADD #n :one SET #ttl = if_not_exists(#ttl, :ttl)",
            ConditionExpression: "attribute_not_exists(#n) OR #n < :cap",
            ExpressionAttributeNames: { "#n": "count", "#ttl": "ttl" },
            ExpressionAttributeValues: { ":one": 1, ":cap": cap, ":ttl": nowS + CAP_TTL_S },
          }),
        );
        return true;
      } catch (error) {
        if (isConditionFailure(error)) return false;
        throw error;
      }
    },

    /** A fresh pending row. Overwrites a lapsed one, since asking again is allowed. */
    async putPending({ email, confirmToken, unsubscribeToken, nowIso, nowS, consentVersion }) {
      await client.send(
        new PutCommand({
          ...table,
          Item: {
            ...subscriberKey(email),
            email,
            status: "pending",
            confirm_token: confirmToken,
            unsubscribe_token: unsubscribeToken,
            subscribed_at: nowIso,
            consent_version: consentVersion,
            ttl: nowS + PENDING_TTL_S,
          },
        }),
      );
    },

    /** The same pending row asked for again: the clock restarts, the tokens stay. */
    async refreshPending(email, nowIso, nowS) {
      await client.send(
        new UpdateCommand({
          ...table,
          Key: subscriberKey(email),
          UpdateExpression: "SET subscribed_at = :now, #ttl = :ttl",
          ConditionExpression: "#s = :pending",
          ExpressionAttributeNames: { "#ttl": "ttl", "#s": "status" },
          ExpressionAttributeValues: {
            ":now": nowIso,
            ":ttl": nowS + PENDING_TTL_S,
            ":pending": "pending",
          },
        }),
      );
    },

    /** The row a link's token belongs to, or `undefined`. */
    async findByToken(index, attribute, token) {
      const { Items } = await client.send(
        new QueryCommand({
          ...table,
          IndexName: index,
          KeyConditionExpression: "#t = :t",
          ExpressionAttributeNames: { "#t": attribute },
          ExpressionAttributeValues: { ":t": token },
          Limit: 1,
        }),
      );
      return Items?.[0];
    },

    /** `false` when the row is no longer one that can be confirmed. */
    async activate(key, nowIso) {
      try {
        await client.send(
          new UpdateCommand({
            ...table,
            Key: { pk: key.pk, sk: key.sk },
            UpdateExpression:
              "SET #s = :active, confirmed_at = if_not_exists(confirmed_at, :now) REMOVE #ttl",
            ConditionExpression: "#s IN (:pending, :active)",
            ExpressionAttributeNames: { "#s": "status", "#ttl": "ttl" },
            ExpressionAttributeValues: {
              ":active": "active",
              ":pending": "pending",
              ":now": nowIso,
            },
          }),
        );
        return true;
      } catch (error) {
        if (isConditionFailure(error)) return false;
        throw error;
      }
    },

    async unsubscribe(key, nowIso) {
      await client.send(
        new UpdateCommand({
          ...table,
          Key: { pk: key.pk, sk: key.sk },
          UpdateExpression: "SET #s = :unsubscribed, unsubscribed_at = :now REMOVE #ttl",
          ConditionExpression: "attribute_exists(pk)",
          ExpressionAttributeNames: { "#s": "status", "#ttl": "ttl" },
          ExpressionAttributeValues: { ":unsubscribed": "unsubscribed", ":now": nowIso },
        }),
      );
    },
  };
}
