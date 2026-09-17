/**
 * ToggleGroup primitive — thin re-export of Base UI's `ToggleGroup` and the
 * `Toggle` its children are. Two packages, one shim: a `Toggle` outside a group
 * is a different control with its own state, and the DS exposes no such thing,
 * so the pair only ever arrives together. Backs `../components/SegmentedControl`.
 *
 * Swap-readiness chokepoint: only `primitives/**` may import `@base-ui/react`.
 */
export { Toggle } from "@base-ui/react/toggle";
export { ToggleGroup } from "@base-ui/react/toggle-group";
