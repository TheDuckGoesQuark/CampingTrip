import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { issues, sentIssues } from ".";
import { slugify } from "../slug";

/** Read as source, as `subscribeNotices.test.ts` reads `accept.mjs`: `infra/` is not a package. */
const CONFIRM_SOURCE = resolve(process.cwd(), "../../infra/lambda/newsletter-api/confirm.mjs");

function endpointWelcomeSlug(): string | undefined {
  return readFileSync(CONFIRM_SOURCE, "utf8").match(/WELCOME_ISSUE = "([a-z0-9-]+)"/)?.[1];
}

describe("the welcome issue", () => {
  const welcomes = issues.filter((issue) => issue.welcome);

  it("is the one issue the endpoint sends on confirmation", () => {
    expect(welcomes).toHaveLength(1);
    expect(slugify(welcomes[0].subject)).toBe(endpointWelcomeSlug());
  });

  it("is live and never in the archive", () => {
    expect(welcomes[0].draft).toBeUndefined();
    expect(welcomes[0].sentOn).toBeUndefined();
    expect(sentIssues).not.toContain(welcomes[0]);
  });
});
