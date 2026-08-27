/**
 * useRender primitive — thin re-export of Base UI's `useRender`. Gives a
 * component the same `render` polymorphism the Base UI components have, so a
 * surface can become an `<a>` without a `className`/`style` escape hatch.
 *
 * Swap-readiness chokepoint: only `primitives/**` may import `@base-ui/react`.
 */
export { useRender } from "@base-ui/react/use-render";
export type { UseRenderRenderProp } from "@base-ui/react/use-render";
