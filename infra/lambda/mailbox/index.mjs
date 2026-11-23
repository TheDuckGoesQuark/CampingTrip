// Forwards mail received for the site's public addresses to a private inbox.
// SES writes the message to the bucket, then invokes this with the receipt.
// A throw is retried by Lambda and counted by the alarm; the message stays in
// the bucket until its lifecycle rule expires it.
//
// The SDK is the runtime's own; nothing here is bundled or installed. What to
// forward, and how it is addressed, lives in `forward.mjs` so it can be tested.
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";

import { aliasFor, isUnwanted, readdress, receiptOf } from "./forward.mjs";

const { BUCKET, KEY_PREFIX, FORWARD_TO } = process.env;
const ALIASES = process.env.ALIASES.split(",");

const s3 = new S3Client({});
const ses = new SESv2Client({});

export const handler = async (event) => {
  const received = receiptOf(event);
  if (!received || isUnwanted(received.receipt)) return;

  const object = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: `${KEY_PREFIX}${received.messageId}` }),
  );
  const raw = Buffer.from(await object.Body.transformToByteArray()).toString("latin1");
  const alias = aliasFor(received.receipt, ALIASES);

  // Nothing is logged: the message is a stranger's, and CloudWatch is not
  // where they sent it.
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: alias,
      Destination: { ToAddresses: [FORWARD_TO] },
      Content: { Raw: { Data: Buffer.from(readdress(raw, alias), "latin1") } },
    }),
  );
};
