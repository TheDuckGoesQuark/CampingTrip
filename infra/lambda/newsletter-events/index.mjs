// Marks subscribers from the bounce and complaint events SES publishes to the
// newsletter's events topic. Which addresses, and as what, is `markings.mjs`.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { markingsFrom } from "./markings.mjs";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const { TABLE_NAME } = process.env;

async function mark({ email, status }, nowIso) {
  try {
    await client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: `SUB#${email}`, sk: "META" },
        UpdateExpression: "SET #s = :status, marked_at = :now REMOVE #ttl",
        // An address SES reports that was never on the list is not added to it.
        ConditionExpression: "attribute_exists(pk)",
        ExpressionAttributeNames: { "#s": "status", "#ttl": "ttl" },
        ExpressionAttributeValues: { ":status": status, ":now": nowIso },
      }),
    );
  } catch (error) {
    if (error?.name !== "ConditionalCheckFailedException") throw error;
  }
}

export const handler = async (event) => {
  const nowIso = new Date().toISOString();
  for (const record of event?.Records ?? []) {
    let message;
    try {
      message = JSON.parse(record?.Sns?.Message ?? "");
    } catch {
      continue;
    }
    await Promise.all(markingsFrom(message).map((marking) => mark(marking, nowIso)));
  }
};
