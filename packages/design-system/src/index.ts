// @jordanscamp/ds — public barrel.
//
// Layer model: tokens (CSS vars) → primitives (Base UI shims) → components
// (styled via cva + CSS Modules) → patterns. See ./README.md and ./CLAUDE.md.
// Apps import tokens once: `import "@jordanscamp/ds/tokens.css"`.

export { BrandProvider, type BrandProviderProps, type ColorScheme } from "./BrandProvider";

export { Button, type ButtonProps } from "./components/Button";
export { Text, type TextProps, type TextElement } from "./components/Text";
export { Badge, type BadgeProps } from "./components/Badge";
export { Link, type LinkProps } from "./components/Link";
export { Modal, type ModalProps, type ModalVariant, type ModalSize } from "./components/Modal";

// Faux-desktop chrome
export { Window, type WindowProps } from "./components/desktop/Window";
export { MenuBar, type MenuBarProps } from "./components/desktop/MenuBar";
export {
  Dock,
  DockItem,
  DockDivider,
  type DockProps,
  type DockItemProps,
} from "./components/desktop/Dock";
export { DesktopIcon, type DesktopIconProps } from "./components/desktop/DesktopIcon";
