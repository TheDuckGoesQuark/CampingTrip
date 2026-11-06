// The table, as the handler needs it: one partition holding every board entry,
// sorted by its key so the top ten is a single query, and a counter per day
// that caps how many writes a day the board will take.
import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { TABLE_SIZE } from "./accept.mjs";
import { sortKey } from "./keys.mjs";

const BOARD = "BOARD";

/** The day's counter outlives the day, so a late reader of the table can see it. */
const CAP_TTL_S = 72 * 60 * 60;

const isConditionFailure = (error) => error?.name === "ConditionalCheckFailedException";

export function makeTable(client, tableName) {
  const table = { TableName: tableName };

  return {
    async top() {
      const { Items = [] } = await client.send(
        new QueryCommand({
          ...table,
          KeyConditionExpression: "pk = :board",
          ExpressionAttributeValues: { ":board": BOARD },
          ScanIndexForward: false,
          Limit: TABLE_SIZE,
        }),
      );
      return Items.map(({ initials, score }) => ({ initials, score }));
    },

    async put({ initials, score }, nowMs, id) {
      await client.send(
        new PutCommand({
          ...table,
          Item: { pk: BOARD, sk: sortKey(score, nowMs, id), initials, score },
          ConditionExpression: "attribute_not_exists(pk)",
        }),
      );
    },

    /** `false` once the day's cap is spent; the caller refuses. */
    async takeWriteSlot(day, cap, nowS) {
      try {
        await client.send(
          new UpdateCommand({
            ...table,
            Key: { pk: `CAP#write#${day}`, sk: "META" },
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
  };
}
