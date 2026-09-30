import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { noticeNamed, SUBSCRIBE_NOTICES } from "./subscribeNotices";

/**
 * The endpoint redirects to these pages by name. `infra/` is not a workspace
 * package, so its module cannot be imported here; reading the source and
 * matching its `NOTICES` literal is what keeps the two lists one list. The path
 * is from the package root, which is where vitest runs this file.
 */
const ENDPOINT_SOURCE = resolve(process.cwd(), "../../infra/lambda/newsletter-api/accept.mjs");

function endpointNotices(): string[] {
  const source = readFileSync(ENDPOINT_SOURCE, "utf8");
  const block = source.match(/NOTICES = Object\.freeze\(\{([\s\S]*?)\}\)/);
  expect(block, "accept.mjs no longer declares NOTICES as a frozen object literal").not.toBeNull();
  return [...block![1].matchAll(/:\s*"([a-z-]+)"/g)].map((match) => match[1]).sort();
}

describe("subscribe notices", () => {
  it("are exactly the pages the endpoint redirects to", () => {
    const here = SUBSCRIBE_NOTICES.map((notice) => notice.name).sort();
    expect(here).toEqual(endpointNotices());
  });

  it("are found by name", () => {
    expect(noticeNamed("confirmed")?.title).toBe("You're in");
    expect(noticeNamed("nothing")).toBeUndefined();
  });

  it("offer the form again only where a reader has to start over", () => {
    const offering = SUBSCRIBE_NOTICES.filter((notice) => notice.offerForm).map((n) => n.name);
    expect(offering).toEqual(["link-expired", "not-accepted"]);
  });
});
