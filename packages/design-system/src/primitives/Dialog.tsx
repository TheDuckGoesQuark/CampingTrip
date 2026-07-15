/**
 * Dialog primitive — thin re-export of Base UI's Dialog namespace
 * (`Dialog.Root`, `.Trigger`, `.Portal`, `.Backdrop`, `.Popup`, `.Title`,
 * `.Description`, `.Close`). Base UI supplies the focus trap, focus-return,
 * Escape + click-outside dismissal, and ARIA wiring. Styling lives in
 * `../components/Modal`.
 *
 * This is the swap-readiness chokepoint: only files in `primitives/**` may
 * import `@base-ui/react` (enforced by `ds-base-ui-via-primitives-only`).
 */
export { Dialog } from "@base-ui/react/dialog";
