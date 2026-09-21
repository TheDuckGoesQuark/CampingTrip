---
name: run-locally
description: Start campingtrip's dev server so a reviewer or agent sees the CURRENT working-tree changes, and report where the client is reachable. Trigger when asked to run, start, spin up, or preview the app, or when another skill (record-demo, screenshot-project) needs to boot it.
---

# Run campingtrip locally

The platform is static-only, no backend: `campsite` and `photobroom` (see
`README.md`). Only **campsite** has a dev server: `photobroom` is a browser
extension overlay bundle with a `build`/`build:overlay` script but no `dev`
script, so there is nothing to "run" for it; verify a photobroom change by
running `pnpm --filter photobroom build:overlay` and loading the built
`extensions/photobroom/overlay.js`, not this skill.

## Start

```bash
pnpm --filter campsite dev
```

Run it in the background (or a separate terminal) since it's a long-lived
process. It's a plain Vite dev server with HMR, so it reflects local edits
live, no build step and no restart needed after a change, except see the
worktree caveat below.

## Client URL

Vite prints the real port on startup:

```
➜  Local:   http://localhost:5173/
```

**Don't assume 5173.** With no `--port` flag, Vite walks up from 5173 to the
next free port, so if another instance (another worktree, another session) is
already running, this one lands somewhere else. Always read the port back out
of the startup log rather than hardcoding it.

## Auth / seeded state

None needed: no backend, no auth, no database, every route is reachable
straight from a fresh checkout.

## Teardown

Kill the process (`Ctrl-C` in the foreground, or `kill` the background PID /
task). Nothing else to tear down: no services, no containers.

## Caveats

- **Running from a `.claude/worktrees/…` path**: the file watcher doesn't fire
  there, so HMR is dead and every edit needs a server **restart** to show up:
  don't trust a page that looks unchanged after an edit without restarting
  first. `curl http://localhost:<port>/src/path/to/File.tsx | grep <the edit>`
  confirms whether the served module is actually stale before debugging the
  code itself.
- **Driving this through the VSCode preview pane** (`.claude/launch.json` /
  `preview_start`): that tooling assigns its own port, which Vite ignores
  unless the launch entry passes `--port <n> --strictPort`. Without that, the
  preview tab can land on a dead port. Not a concern for a plain terminal
  `pnpm --filter campsite dev`, only for the preview-pane integration.
