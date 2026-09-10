/**
 * Field primitive — thin re-export of Base UI's Field namespace (`Field.Root`,
 * `.Label`, `.Control`, `.Description`, `.Error`, `.Validity`). Base UI supplies
 * the label/control association and the `aria-describedby` + `aria-invalid`
 * wiring that a hand-rolled field gets wrong. Styling lives in
 * `../components/form`.
 *
 * This is the swap-readiness chokepoint: only files in `primitives/**` may
 * import `@base-ui/react` (enforced by `ds-base-ui-via-primitives-only`).
 */
export { Field } from "@base-ui/react/field";
