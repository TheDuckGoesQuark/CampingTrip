// The leaderboard behind `jordanscamp.site/api/pacmac/scores`. What to accept
// lives in `accept.mjs`, the routes in `scores.mjs`, the table in `table.mjs`.
import { randomUUID } from "node:crypto";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { route } from "./scores.mjs";
import { makeTable } from "./table.mjs";

const { TABLE_NAME, WRITE_CAP_PER_DAY } = process.env;

const table = makeTable(DynamoDBDocumentClient.from(new DynamoDBClient({})), TABLE_NAME);

export const handler = (event) =>
  route(event, {
    table,
    writeCapPerDay: Number(WRITE_CAP_PER_DAY),
    nowMs: Date.now(),
    newId: randomUUID,
  });
