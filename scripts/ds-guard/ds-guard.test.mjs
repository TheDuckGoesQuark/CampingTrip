import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { test, describe } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const GUARD = join(HERE, "ds-guard.mjs");
const FIXTURE_CONFIG = join(HERE, "__fixtures__/scripts/ds-guard/config.json");
const FIXTURE_BASELINE = join(HERE, "__fixtures__/scripts/ds-guard/baseline.json");

/** Drives the real CLI rather than an exported function: the exit code and the
 *  baseline round-trip are the contract CI depends on, and they only exist here. */
function run(baseline = null) {
  if (baseline === null) rmSync(FIXTURE_BASELINE, { force: true });
  else writeFileSync(FIXTURE_BASELINE, JSON.stringify({ accepted: baseline }));

  try {
    return {
      status: 0,
      out: execFileSync("node", [GUARD, "--config", FIXTURE_CONFIG], { encoding: "utf8" }),
    };
  } catch (error) {
    return { status: error.status, out: error.stdout };
  }
}

describe("reinvention", () => {
  test("flags a local component that shadows a design-system export", () => {
    assert.match(run().out, /Local component `Button` names `Button`/u);
  });

  test("ignores a local component that composes the export it is named after", () => {
    assert.doesNotMatch(run().out, /PhotoCard/u);
  });

  test("flags a style whose head noun is a design-system export", () => {
    assert.match(run().out, /Local style `card` names `Card`/u);
  });

  test("ignores a style that merely modifies one", () => {
    assert.doesNotMatch(run().out, /cardBody/u);
  });
});

describe("attribution", () => {
  test("a shared stylesheet's classes belong only to files that reference them", () => {
    // Prose.tsx imports the same sheet as Rolled.tsx but touches only `.prose`.
    assert.doesNotMatch(run().out, /Prose\.tsx[\s\S]{0,200}?`card`/u);
  });
});

describe("compound export names", () => {
  test("a multi-word export does not claim a name that merely ends in its head noun", () => {
    const { out } = run();
    assert.doesNotMatch(out, /PicnicArea/u);
    assert.doesNotMatch(out, /ProgressBar/u);
  });
});

describe("gaps", () => {
  test("reports a control the design system has no export for", () => {
    assert.match(run().out, /`ToggleSwitch` builds a `switch`/u);
  });
});

describe("the oxlint plugin", () => {
  // A rule that quietly stops matching is indistinguishable from a clean repo,
  // which is the failure this whole kit exists to prevent. Run it for real.
  function lint() {
    try {
      execFileSync(
        "npx",
        [
          "oxlint",
          "--config",
          join(HERE, "__fixtures__/oxlintrc.json"),
          join(HERE, "__fixtures__/apps"),
        ],
        { encoding: "utf8", stdio: "pipe" },
      );
      return "";
    } catch (error) {
      return `${error.stdout}${error.stderr}`;
    }
  }

  test("flags a hand-built control and an inline icon", () => {
    const out = lint();
    assert.match(out, /ds\(no-bespoke-control\)/u);
    assert.match(out, /ds\(no-inline-icon\)/u);
  });
});

describe("baseline", () => {
  const knownKeys = [
    "reinvented-component|apps/demo/src/Rolled.tsx|component:Button",
    "reinvented-component|apps/demo/src/Rolled.tsx|style:card",
    "missing-primitive|apps/demo/src/Rolled.tsx|component:ToggleSwitch",
  ];

  test("an accepted violation stops failing the build", () => {
    const { status, out } = run(knownKeys);
    assert.equal(status, 0);
    assert.doesNotMatch(out, /Local component `Button`/u);
  });

  test("an accepted violation that no longer occurs fails, so the file cannot rot", () => {
    const { status, out } = run([
      ...knownKeys,
      "reinvented-component|apps/demo/src/Gone.tsx|style:card",
    ]);
    assert.equal(status, 1);
    assert.match(out, /stale-baseline \(1\)/u);
  });

  test("--update-baseline accepts exactly today's blocking findings", () => {
    rmSync(FIXTURE_BASELINE, { force: true });
    execFileSync("node", [GUARD, "--config", FIXTURE_CONFIG, "--update-baseline"], {
      encoding: "utf8",
    });
    assert.ok(existsSync(FIXTURE_BASELINE));
    assert.equal(
      run(JSON.parse(execFileSync("cat", [FIXTURE_BASELINE], { encoding: "utf8" })).accepted)
        .status,
      0,
    );
    rmSync(FIXTURE_BASELINE, { force: true });
  });
});
