# `packages/design-system/src/patterns/`

Generic compositions extracted from features when the rule of three fires (3+
unrelated consumers want the same shape). **Empty today** — nothing has crossed
that threshold.

## When something belongs here

- The same composition exists in 3+ unrelated feature folders.
- Each consumer is genuinely independent (not three uses inside one feature).
- The composition is generic — no domain type, no routing, no app state.

If you're tempted to add a file before all three hold, **don't**. Pre-extracted
patterns are a common DS mistake.

## When something does NOT belong here

- It uses a domain concept (the campsite scene, blog posts) — that's a feature.
- It reaches into routing or app state — that's a feature.
- It wants a `className` / `style` escape hatch — fix the missing variant or token
  first.
