import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { EMAIL_TOKENS } from "./emailTheme";

/** From the package root, which is where vitest runs this file. */
const TOKENS_DIR = resolve(process.cwd(), "../../packages/design-system/src/tokens");
const SOURCES = ["primitives.css", "semantic.css", "typography.css", "dimensions.css"];

/** The first declaration of each custom property wins: that is the light `:root`. */
function lightDeclarations(): Map<string, string> {
  const declared = new Map<string, string>();
  for (const file of SOURCES) {
    const css = readFileSync(resolve(TOKENS_DIR, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, name, value] of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      if (!declared.has(name)) declared.set(name, value.trim());
    }
  }
  return declared;
}

function resolveToken(name: string, declared: Map<string, string>): string {
  const value = declared.get(name);
  expect(value, `${name} is not declared in the design system's tokens`).toBeDefined();
  return value!.replace(/var\((--[a-z0-9-]+)\)/g, (_: string, inner: string) =>
    resolveToken(inner, declared),
  );
}

describe("EMAIL_TOKENS", () => {
  const declared = lightDeclarations();

  it.each(Object.entries(EMAIL_TOKENS))("holds %s at the design system's value", (name, value) => {
    expect(value.toLowerCase()).toBe(resolveToken(name, declared).toLowerCase());
  });
});
