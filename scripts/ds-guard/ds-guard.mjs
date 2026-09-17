#!/usr/bin/env node
/**
 * ds-guard — the cross-file half of design-system enforcement.
 *
 * A linter forbids things that *appear*: a banned import, a raw utility class,
 * an inline style. Reinvention is the opposite shape — app code that builds its
 * own Switch has no banned token and no import edge, so there is nothing for a
 * per-file rule to match. Catching it needs the DS's export list on one side and
 * the consumer tree on the other, which is what this does.
 *
 * Depends on nothing but Node, so it runs the same under oxlint, ESLint or
 * neither. See ./README.md for the layer model and ./config.json for the knobs.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

function configPath() {
  const flag = process.argv.indexOf("--config");
  return flag === -1 ? join(HERE, "config.json") : resolve(process.argv[flag + 1]);
}

const CONFIG_PATH = configPath();

/** Paths in a config are relative to the repo it guards, not to this file, so a
 *  vendored copy can sit at any depth and the config stays readable. */
const ROOT = resolve(dirname(CONFIG_PATH), "../..");

/** Words that name a UI control the DS is expected to own. Deliberately excludes
 *  layout nouns (row, grid, panel, section) — those are legitimately app-local
 *  and flagging them buries the signal. */
const CONTROL_VOCABULARY = new Set([
  "accordion",
  "avatar",
  "badge",
  "banner",
  "breadcrumb",
  "button",
  "card",
  "checkbox",
  "chip",
  "combobox",
  "dialog",
  "drawer",
  "dropdown",
  "field",
  "input",
  "loader",
  "menu",
  "modal",
  "pagination",
  "pill",
  "popover",
  "progress",
  "radio",
  "select",
  "slider",
  "snackbar",
  "spinner",
  "stepper",
  "switch",
  "tab",
  "tabs",
  "tag",
  "textarea",
  "toast",
  "toggle",
  "tooltip",
]);

const SEVERITY_ORDER = { error: 0, warn: 1, info: 2 };

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) fail(`No config at ${CONFIG_PATH}.`);
  const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  for (const key of ["designSystem", "consumers", "styleSources"]) {
    if (config[key] === undefined) fail(`config.json is missing "${key}".`);
  }
  return config;
}

function fail(message) {
  console.error(`ds-guard: ${message}`);
  process.exit(2);
}

/** Hand-rolled rather than a glob dependency: the matching needed here is a
 *  directory prefix and a file extension, and `fs.globSync` is experimental. */
function collectFiles(dirs, { extensions, exclude }) {
  const found = [];
  const skip = new RegExp(exclude.join("|"), "u");

  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      const rel = relative(ROOT, full);
      if (skip.test(rel)) continue;
      if (entry.isDirectory()) walk(full);
      else if (extensions.some((ext) => entry.name.endsWith(ext))) found.push(rel);
    }
  };

  for (const dir of dirs) {
    const full = join(ROOT, dir);
    if (existsSync(full) && statSync(full).isDirectory()) walk(full);
  }
  return found.toSorted();
}

/**
 * Read from the barrel rather than configured, so the check cannot fall behind a
 * newly added component. Type-only exports are dropped: a local `ButtonProps` is
 * a consumer of the DS, not a reinvention of it.
 */
function readDesignSystemExports(barrels) {
  const names = new Set();

  for (const barrel of barrels) {
    const path = join(ROOT, barrel);
    if (!existsSync(path)) fail(`Design-system barrel not found: ${barrel}`);
    const source = readFileSync(path, "utf8");

    for (const [, body] of source.matchAll(/export\s*\{([^}]*)\}/gu)) {
      for (const clause of body.split(",")) {
        const name = clause
          .trim()
          .split(/\s+as\s+/u)
          .pop()
          ?.trim();
        if (name === undefined || name === "") continue;
        if (clause.trim().startsWith("type ")) continue;
        if (/^[A-Z][A-Za-z0-9]*$/u.test(name)) names.add(name);
      }
    }
    for (const [, name] of source.matchAll(
      /export\s+(?:async\s+)?(?:function|const|class)\s+([A-Z][A-Za-z0-9]*)/gu,
    )) {
      names.add(name);
    }
  }

  if (names.size === 0) fail("Parsed zero exports from the design-system barrel(s).");
  return names;
}

function words(identifier) {
  return identifier
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .split(/[^A-Za-z0-9]+|\s+/u)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

/**
 * The head noun of a compound name, which in English is the last word: a
 * `photoCard` is a card, a `cardBody` is a body. Matching every word instead
 * flags every modifier class on a component as a reinvention of it, which
 * buries the real finding under its own siblings.
 */
function headNoun(identifier) {
  const parts = words(identifier);
  return parts[parts.length - 1];
}

/** Style names a consumer file declares for itself. The two mechanisms answer the
 *  same question, so every check downstream is written against the merged list. */
const STYLE_EXTRACTORS = {
  /** Only classes the file actually references. Stylesheets are routinely shared
   *  across a directory, so "declared in a sheet this file imports" would blame
   *  every file in `blog/` for every class in `blog.module.css`. */
  cssModules(file, source) {
    const declared = new Map();

    for (const [, binding, sheet] of source.matchAll(
      /import\s+(\w+)\s+from\s*["']([^"']+\.module\.css)["']/gu,
    )) {
      const path = resolve(ROOT, dirname(file), sheet);
      if (!existsSync(path)) continue;
      const css = readFileSync(path, "utf8");
      for (const [, name] of css.matchAll(/^\s*\.([A-Za-z][A-Za-z0-9_-]*)/gmu)) {
        declared.set(`${binding}.${name}`, name);
      }
    }

    const used = new Set();
    for (const [, binding, dotted, indexed] of source.matchAll(
      /\b(\w+)(?:\.([A-Za-z][A-Za-z0-9_]*)|\[["']([A-Za-z][A-Za-z0-9_-]*)["']\])/gu,
    )) {
      const key = `${binding}.${dotted ?? indexed}`;
      if (declared.has(key)) used.add(declared.get(key));
    }
    return [...used];
  },

  /** Top level of a `StyleSheet.create({...})` literal only: one level down is a
   *  style declaration, not a named style. */
  reactNativeStyleSheet(file, source) {
    const names = new Set();

    for (const match of source.matchAll(/StyleSheet\.create\(\s*\{/gu)) {
      let depth = 0;
      for (let i = match.index + match[0].length - 1; i < source.length; i += 1) {
        const char = source[i];
        if (char === "{") depth += 1;
        else if (char === "}") {
          depth -= 1;
          if (depth === 0) break;
        } else if (depth === 1 && /[A-Za-z_]/u.test(char)) {
          const key = /^([A-Za-z_][A-Za-z0-9_]*)\s*:/u.exec(source.slice(i));
          if (key !== null) names.add(key[1]);
        }
      }
    }
    return [...names];
  },
};

function localComponents(source) {
  const names = new Set();
  for (const [, name] of source.matchAll(
    /(?:^|\n)\s*(?:export\s+)?(?:default\s+)?function\s+([A-Z][A-Za-z0-9]*)/gu,
  )) {
    names.add(name);
  }
  for (const [, name] of source.matchAll(
    /(?:^|\n)\s*(?:export\s+)?const\s+([A-Z][A-Za-z0-9]*)\s*[:=][^=]*?=>/gu,
  )) {
    names.add(name);
  }
  return [...names];
}

function designSystemImports(source, packageName) {
  const names = new Set();
  const pattern = new RegExp(
    `import\\s*(?:type\\s*)?\\{([^}]*)\\}\\s*from\\s*["']${packageName}(?:/[^"']*)?["']`,
    "gu",
  );
  for (const [, body] of source.matchAll(pattern)) {
    for (const clause of body.split(",")) {
      const name = clause
        .trim()
        .replace(/^type\s+/u, "")
        .split(/\s+as\s+/u)[0]
        ?.trim();
      if (name !== undefined && name !== "") names.add(name);
    }
  }
  return names;
}

function analyse(config) {
  const { designSystem, consumers, styleSources } = config;
  const extractStyles = STYLE_EXTRACTORS[styleSources];
  if (extractStyles === undefined) {
    fail(
      `Unknown styleSources "${styleSources}". Known: ${Object.keys(STYLE_EXTRACTORS).join(", ")}.`,
    );
  }

  const exports_ = readDesignSystemExports(designSystem.barrels);

  // A compound export name is only ever matched whole. Indexing `TextArea` under
  // its head noun would have it claim `PicnicArea`, and `MenuBar` claim
  // `ProgressBar` — the head noun of a compound identifies the compound, not a
  // component whose own name merely ends in it.
  const exportByName = new Map();
  for (const name of exports_) {
    const parts = words(name);
    exportByName.set(parts.join(""), name);
    if (parts.length === 1 && !exportByName.has(parts[0])) exportByName.set(parts[0], name);
  }
  const matchExport = (subject) => {
    const parts = words(subject);
    return exportByName.get(parts.join("")) ?? exportByName.get(headNoun(subject));
  };

  const files = collectFiles(consumers, {
    extensions: config.extensions ?? [".ts", ".tsx"],
    exclude: config.exclude ?? [
      "node_modules",
      "\\.test\\.",
      "\\.spec\\.",
      "\\.stories\\.",
      "/dist/",
    ],
  });

  const findings = [];
  const usage = new Map([...exports_].map((name) => [name, 0]));
  let filesImportingDs = 0;

  for (const file of files) {
    const source = readFileSync(join(ROOT, file), "utf8");
    const imported = designSystemImports(source, designSystem.package);
    if (imported.size > 0) filesImportingDs += 1;
    for (const name of imported) {
      if (usage.has(name)) usage.set(name, usage.get(name) + 1);
    }

    // A file that already imports the DS component it names locally is composing,
    // not reinventing: `const PhotoCard = () => <Card>…</Card>` is the intended shape.
    const subjects = [
      ...extractStyles(file, source).map((name) => ({ name, kind: "style" })),
      ...localComponents(source).map((name) => ({ name, kind: "component" })),
    ];

    for (const { name, kind } of subjects) {
      {
        const word = headNoun(name);
        const dsExport = matchExport(name);

        if (dsExport !== undefined) {
          if (imported.has(dsExport)) continue;
          findings.push({
            rule: "reinvented-component",
            severity: "error",
            file,
            subject: `${kind}:${name}`,
            message:
              `${kind === "style" ? "Local style" : "Local component"} \`${name}\` names ` +
              `\`${dsExport}\`, which ${designSystem.package} exports, and this file does not ` +
              `import it. Use the design system's \`${dsExport}\` or open a DS PR to extend it.`,
          });
          continue;
        }

        if (CONTROL_VOCABULARY.has(word)) {
          findings.push({
            rule: "missing-primitive",
            severity: "warn",
            file,
            subject: `${kind}:${name}`,
            message:
              `${kind === "style" ? "Local style" : "Local component"} \`${name}\` builds a ` +
              `\`${word}\`, and ${designSystem.package} exports nothing by that name. Either the ` +
              `design system has a gap worth filling, or this is a one-off that should say so.`,
          });
        }
      }
    }
  }

  for (const [name, count] of usage) {
    if (count === 0) {
      findings.push({
        rule: "unused-export",
        severity: "info",
        file: designSystem.barrels[0],
        subject: name,
        message: `${designSystem.package} exports \`${name}\`, and no consumer file imports it.`,
      });
    }
  }

  return {
    findings: findings.toSorted(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        a.file.localeCompare(b.file) ||
        a.subject.localeCompare(b.subject),
    ),
    stats: {
      consumerFiles: files.length,
      filesImportingDs,
      exports: exports_.size,
      usedExports: [...usage.values()].filter((count) => count > 0).length,
    },
  };
}

const keyOf = (finding) => `${finding.rule}|${finding.file}|${finding.subject}`;

function loadBaseline(config) {
  const path = resolve(dirname(CONFIG_PATH), config.baseline ?? "baseline.json");
  if (!existsSync(path)) return { path, entries: new Set() };
  return { path, entries: new Set(JSON.parse(readFileSync(path, "utf8")).accepted) };
}

function writeBaseline(path, findings) {
  const accepted = findings
    .filter((finding) => finding.severity !== "info")
    .map(keyOf)
    .toSorted();
  writeFileSync(
    path,
    `${JSON.stringify(
      {
        comment:
          "Violations ds-guard accepts today, so the checks can be adopted on a repo that " +
          "already has debt. CI fails on anything not listed here, and on any entry listed " +
          "here that no longer occurs — so removing debt means deleting its line. " +
          "Regenerate with `pnpm ds-guard --update-baseline`.",
        accepted,
      },
      null,
      2,
    )}\n`,
  );
  return accepted.length;
}

const BULLET = { error: "✗", warn: "!", info: "·" };

function report(findings, stats, { baseline }) {
  const shown = findings.filter((finding) => !baseline.has(keyOf(finding)));
  const byRule = new Map();
  for (const finding of shown) {
    if (!byRule.has(finding.rule)) byRule.set(finding.rule, []);
    byRule.get(finding.rule).push(finding);
  }

  for (const [rule, group] of byRule) {
    console.log(`\n${rule} (${group.length})`);
    for (const finding of group) {
      console.log(`  ${BULLET[finding.severity]} ${finding.file}`);
      console.log(`    ${finding.message}`);
    }
  }

  const pct = Math.round((stats.filesImportingDs / Math.max(stats.consumerFiles, 1)) * 100);
  console.log(
    `\nConsumer files importing the design system: ${stats.filesImportingDs}/${stats.consumerFiles} (${pct}%)`,
  );
  console.log(
    `Design-system exports with at least one consumer: ${stats.usedExports}/${stats.exports}`,
  );

  return shown;
}

const config = loadConfig();
const { findings, stats } = analyse(config);
const baseline = loadBaseline(config);

if (process.argv.includes("--update-baseline")) {
  const count = writeBaseline(baseline.path, findings);
  console.log(`ds-guard: baselined ${count} finding(s) into ${relative(ROOT, baseline.path)}.`);
  process.exit(0);
}

const outstanding = report(findings, stats, { baseline: baseline.entries });

// A baseline entry that no longer occurs is debt somebody paid off; leaving it
// in lets the file drift into fiction, so removing it is part of the fix.
const live = new Set(findings.map(keyOf));
const stale = [...baseline.entries].filter((key) => !live.has(key));
if (stale.length > 0) {
  console.log(`\nstale-baseline (${stale.length})`);
  for (const key of stale) console.log(`  ✓ ${key}`);
  console.log("  Fixed — delete these lines from the baseline.");
}

const blocking = outstanding.filter((finding) => finding.severity !== "info");
if (blocking.length > 0 || stale.length > 0) {
  console.log(`\nds-guard failed: ${blocking.length} new, ${stale.length} stale.`);
  process.exit(1);
}
console.log("\nds-guard passed.");
