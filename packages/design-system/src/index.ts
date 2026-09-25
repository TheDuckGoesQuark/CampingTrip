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
export { Icon, ICON_NAMES, type IconProps, type IconName } from "./components/Icon";
export { TextField, type TextFieldProps } from "./components/form/TextField";
export { TextArea, type TextAreaProps } from "./components/form/TextArea";
export { TextSurface, type TextSurfaceProps } from "./components/TextSurface";
export { Card, type CardProps } from "./components/Card";
export { CopyButton, COPIED_MS, type CopyButtonProps } from "./components/CopyButton";
export { Tag, type TagProps } from "./components/Tag";
export {
  SegmentedNav,
  type SegmentedNavItemProps,
  type SegmentedNavProps,
} from "./components/SegmentedNav";
export { Tile, type TileProps } from "./components/Tile";

// Faux-desktop chrome
export {
  Window,
  type WindowProps,
  type WindowTitleBarProps,
  type WindowTabProps,
  type WindowAddressBarProps,
  type WindowBookmarkProps,
  type WindowToolButtonProps,
  type WindowBodyProps,
} from "./components/desktop/Window";
export {
  MenuBar,
  type MenuBarProps,
  type MenuBarMenuProps,
  type MenuBarPanelProps,
  type MenuBarItemProps,
  type MenuBarRadioGroupProps,
  type MenuBarRadioItemProps,
} from "./components/desktop/MenuBar";
export { DesktopIcon, type DesktopIconProps } from "./components/desktop/DesktopIcon";
export { AlertDialog, type AlertDialogProps } from "./components/desktop/AlertDialog";
export { LoadingDialog, type LoadingDialogProps } from "./components/desktop/LoadingDialog";
export {
  TransferProgress,
  type TransferProgressProps,
} from "./components/desktop/TransferProgress";
