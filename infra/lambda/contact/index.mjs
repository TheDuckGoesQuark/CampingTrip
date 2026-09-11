// The contact endpoint behind `jordanscamp.site/api/contact`.
//
// Publishes a visitor's note to an SNS topic that emails it on. SNS rather than
// SES on purpose: the whole message is one body string, so there is no
// caller-influenced header anywhere in this path and the mail-injection class of
// bug cannot exist. The cost is no working Reply-To — the address, when given,
// is in the body to be copied out.
//
// The SDK is the runtime's own; nothing here is bundled or installed. What to
// accept, and what to say, lives in `accept.mjs` so it can be tested.
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

import { accept, bodyFor } from "./accept.mjs";

const sns = new SNSClient({});

/** The only recipient. Never read from the request. */
const TOPIC_ARN = process.env.TOPIC_ARN;

const REFUSED = { statusCode: 400, body: JSON.stringify({ error: "Not accepted." }) };

export const handler = async (event) => {
  if (event?.requestContext?.http?.method !== "POST") {
    return { statusCode: 405, body: "" };
  }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body ?? "", "base64").toString("utf8")
    : (event.body ?? "");

  const verdict = accept(raw);
  if (!verdict.ok) return REFUSED;

  await sns.send(
    new PublishCommand({
      TopicArn: TOPIC_ARN,
      // Constant, so nothing a visitor typed reaches a header field.
      Subject: "jordanscamp.site — someone said hello",
      Message: bodyFor(verdict),
    }),
  );

  // Nothing is logged: the note and the address are a stranger's, and CloudWatch
  // is not where they agreed to put them.
  return { statusCode: 204, body: "" };
};
