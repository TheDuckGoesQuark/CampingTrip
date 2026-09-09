/**
 * Menu primitive — thin re-export of Base UI's Menu namespace (`Menu.Root`,
 * `.Trigger`, `.Portal`, `.Positioner`, `.Popup`, `.Item`, `.Separator`). Base
 * UI supplies the `menu`/`menuitem` roles, roving focus, typeahead, Escape and
 * click-outside dismissal, and focus-return to the trigger. Styling lives in
 * `../components/desktop/MenuBar`.
 *
 * This is the swap-readiness chokepoint: only files in `primitives/**` may
 * import `@base-ui/react` (enforced by `ds-base-ui-via-primitives-only`).
 */
export { Menu } from "@base-ui/react/menu";
