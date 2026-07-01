# Jordan's Camp — Claude Code Instructions

Read `README.md` for project context, architecture, tech stack, and commands.

## Planning Workflow

After completing a task or making a significant change:

1. Move the relevant item from `docs/planning/TODO.md` to `docs/planning/COMPLETED.md`
2. In COMPLETED.md, include: what was changed, why, key decisions made, anything deferred
3. If new work was discovered during the task, add it to TODO.md
4. Keep TODO.md organised by priority: **Next Up** > **Backlog** > **Future**
5. If the change affects architecture, directory structure, or conventions, update `README.md`

## Conventions

The platform is static-only — three frontend apps (campsite, digitaltwins,
photobroom), no backend.

- Dev (one app): `pnpm --filter <app-name> dev`
- Build (all): `pnpm -r build`
- Tests (all): `pnpm -r test`
- PhotoBroom extension bundle: `pnpm --filter photobroom build:overlay`
  (outputs `extensions/photobroom/overlay.js`)
