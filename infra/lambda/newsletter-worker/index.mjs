// Drains the send queue into SES, one recipient per message. A recipient is
// marked `ISSUE#<slug>` / `SUB#<email>` after the send, with a condition, so
// a redelivered message finds the mark and is a no-op. A failure is reported
// for its own message only; the rest of the batch is acknowledged.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

import { buildMessage, parseQueueMessage } from "./message.mjs";

const { TABLE_NAME, BUCKET, FROM, REPLY_TO, CONFIGURATION_SET, SITE_ORIGIN } = process.env;

const table = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const ses = new SESv2Client({});

/** The rendered issue, read once per invocation however many recipients share it. */
const renderedCache = new Map();

async function renderedFor(issue) {
  if (!renderedCache.has(issue)) {
    const read = async (name) => {
      const object = await s3.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: `_newsletter/${issue}/${name}` }),
      );
      return object.Body.transformToString();
    };
    const [meta, html, text] = await Promise.all([
      read("meta.json"),
      read("email.html"),
      read("email.txt"),
    ]);
    renderedCache.set(issue, { subject: JSON.parse(meta).subject, html, text });
  }
  return renderedCache.get(issue);
}

const markKey = (message) => ({ pk: `ISSUE#${message.issue}`, sk: `SUB#${message.email}` });

async function alreadySent(message) {
  const { Item } = await table.send(
    new GetCommand({ TableName: TABLE_NAME, Key: markKey(message) }),
  );
  return Item !== undefined;
}

async function deliver(message) {
  if (!message.test && (await alreadySent(message))) return;

  const rendered = await renderedFor(message.issue);
  const built = buildMessage({ rendered, message, siteOrigin: SITE_ORIGIN });
  const { MessageId } = await ses.send(
    new SendEmailCommand({
      FromEmailAddress: FROM,
      ReplyToAddresses: [REPLY_TO],
      Destination: { ToAddresses: [message.email] },
      ConfigurationSetName: CONFIGURATION_SET,
      Content: {
        Simple: {
          Subject: { Data: built.subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: built.text, Charset: "UTF-8" },
            Html: { Data: built.html, Charset: "UTF-8" },
          },
          Headers: built.headers,
        },
      },
    }),
  );

  if (message.test) return;
  try {
    await table.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...markKey(message), sent_at: new Date().toISOString(), message_id: MessageId },
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
  } catch (error) {
    // Two workers raced the same redelivery; the second send already happened
    // and the mark is there. Nothing to do but not fail the batch for it.
    if (error?.name !== "ConditionalCheckFailedException") throw error;
  }
}

export const handler = async (event) => {
  const failures = [];
  await Promise.all(
    (event?.Records ?? []).map(async (record) => {
      const message = parseQueueMessage(record.body);
      // A body that is not a recipient will never become one: acknowledged, and
      // logged without its contents.
      if (!message) {
        console.log("dropped a queue message that was not a recipient");
        return;
      }
      try {
        await deliver(message);
      } catch (error) {
        console.error(`send failed for a recipient of ${message.issue}: ${error?.name ?? "error"}`);
        failures.push({ itemIdentifier: record.messageId });
      }
    }),
  );
  return { batchItemFailures: failures };
};
