/**
 * Button primitive — thin re-export of Base UI's Button. Handles the
 * accessible button behaviour (native `<button>` by default, `render` prop for
 * polymorphism, disabled handling). Styling lives in `../components/Button`.
 *
 * Swap-readiness chokepoint: only `primitives/**` may import `@base-ui/react`.
 */
export { Button } from "@base-ui/react/button";
