// The send function. CI invokes it with `{ issue, mode }`:
//
//   test    one queue message per test recipient, nothing recorded
//   send    claim the issue, then one queue message per active subscriber
//   status  how many of the claimed recipients have been sent to
//
// The claim is a conditional put on `ISSUE#<slug>`, made before anything is
// enqueued: a second invocation for the same issue finds it and stops, so a
// re-run of the workflow cannot send an issue twice.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SendMessageBatchCommand, SQSClient } from "@aws-sdk/client-sqs";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { batches, messageFor, parseCommand, recipientsFrom } from "./command.mjs";

const { TABLE_NAME, QUEUE_URL, BUCKET, TEST_RECIPIENTS } = process.env;

const table = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sqs = new SQSClient({});
const s3 = new S3Client({});

const issueKey = (issue) => ({ pk: `ISSUE#${issue}`, sk: "META" });

async function metaOf(issue) {
  const object = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: `_newsletter/${issue}/meta.json` }),
  );
  return JSON.parse(await object.Body.transformToString());
}

async function enqueue(messages) {
  for (const batch of batches(messages)) {
    const { Failed } = await sqs.send(
      new SendMessageBatchCommand({
        QueueUrl: QUEUE_URL,
        Entries: batch.map((message, i) => ({
          Id: String(i),
          MessageBody: JSON.stringify(message),
        })),
      }),
    );
    if (Failed?.length) throw new Error(`${Failed.length} messages were not enqueued`);
  }
}

async function activeSubscribers() {
  const recipients = [];
  let ExclusiveStartKey;
  do {
    const page = await table.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "status-index",
        KeyConditionExpression: "#s = :active",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":active": "active" },
        ExclusiveStartKey,
      }),
    );
    recipients.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return recipients;
}

async function sentCount(issue) {
  let count = 0;
  let ExclusiveStartKey;
  do {
    const page = await table.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sub)",
        ExpressionAttributeValues: { ":pk": `ISSUE#${issue}`, ":sub": "SUB#" },
        Select: "COUNT",
        ExclusiveStartKey,
      }),
    );
    count += page.Count ?? 0;
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return count;
}

async function status(issue) {
  const { Item } = await table.send(
    new GetCommand({ TableName: TABLE_NAME, Key: issueKey(issue) }),
  );
  if (!Item) return { issue, claimed: false };
  return {
    issue,
    claimed: true,
    claimed_at: Item.claimed_at,
    active_at_claim: Item.active_at_claim,
    sent: await sentCount(issue),
  };
}

async function test(issue) {
  await metaOf(issue);
  const recipients = recipientsFrom(TEST_RECIPIENTS);
  await enqueue(recipients.map((email) => messageFor({ issue, email, test: true })));
  return { issue, mode: "test", recipients: recipients.length };
}

async function send(issue) {
  const meta = await metaOf(issue);
  if (meta.draft) return { issue, refused: "the issue is a draft" };

  const nowIso = new Date().toISOString();
  try {
    await table.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...issueKey(issue), claimed_at: nowIso, subject: meta.subject },
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
  } catch (error) {
    if (error?.name !== "ConditionalCheckFailedException") throw error;
    return { ...(await status(issue)), refused: "already claimed" };
  }

  const recipients = await activeSubscribers();
  await table.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: issueKey(issue),
      UpdateExpression: "SET active_at_claim = :n",
      ExpressionAttributeValues: { ":n": recipients.length },
    }),
  );
  await enqueue(
    recipients.map(({ email, unsubscribe_token }) =>
      messageFor({ issue, email, unsubscribeToken: unsubscribe_token }),
    ),
  );
  return { issue, mode: "send", claimed_at: nowIso, active_at_claim: recipients.length };
}

export const handler = async (event) => {
  const command = parseCommand(event);
  if (!command.ok) throw new Error(command.error);
  const { issue, mode } = command;
  if (mode === "status") return status(issue);
  if (mode === "test") return test(issue);
  return send(issue);
};
