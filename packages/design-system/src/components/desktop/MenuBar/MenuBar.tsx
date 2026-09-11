import type { ReactNode } from "react";

import { Menu } from "../../../primitives/Menu";
import { Popover } from "../../../primitives/Popover";

import styles from "./MenuBar.module.css";

export interface MenuBarProps {
  /** Left-aligned items (app name, menus). */
  left?: ReactNode;
  /** Right-aligned items (clock, status). */
  right?: ReactNode;
}

/**
 * A translucent desktop menu bar pinned to the top of its positioned parent.
 * Pure chrome — pass whatever belongs on the left and right.
 */
function Root({ left, right }: MenuBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.left}>{left}</div>
      <div className={styles.right}>{right}</div>
    </div>
  );
}
Root.displayName = "MenuBar";

export interface MenuBarMenuProps {
  label: ReactNode;
  /** Required when `label` is a glyph: without it the trigger has no name. */
  ariaLabel?: string;
  children?: ReactNode;
}

/**
 * One pull-down on the bar. Portalled, so it escapes any ancestor that clips or
 * stacks — a menu bar sits inside the surface it drops over.
 */
function BarMenu({ label, ariaLabel, children }: MenuBarMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.trigger} aria-label={ariaLabel}>
        {label}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.positioner} side="bottom" align="start" sideOffset={2}>
          <Menu.Popup className={styles.popup}>{children}</Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
BarMenu.displayName = "MenuBar.Menu";

export interface MenuBarItemProps {
  onClick?: () => void;
  disabled?: boolean;
  /** Key hint, e.g. `Esc`. Kept out of the item's accessible name. */
  shortcut?: ReactNode;
  children?: ReactNode;
}

function Item({ onClick, disabled, shortcut, children }: MenuBarItemProps) {
  return (
    <Menu.Item className={styles.item} onClick={onClick} disabled={disabled}>
      <span className={styles.itemLabel}>{children}</span>
      {shortcut != null && (
        <span className={styles.shortcut} aria-hidden="true">
          {shortcut}
        </span>
      )}
    </Menu.Item>
  );
}
Item.displayName = "MenuBar.Item";

export interface MenuBarActionProps {
  onClick?: () => void;
  /** Required when `children` is a glyph: without it the button has no name. */
  ariaLabel?: string;
  /** Hover and focus hint. Distinct from `ariaLabel`, which names the control. */
  title?: string;
  children?: ReactNode;
}

/**
 * A bar entry that acts on its own rather than dropping a menu. Wears the same
 * bare styling as a `MenuBar.Menu` trigger, so a bar can mix the two without
 * one of them reading as a foreign object.
 */
function Action({ onClick, ariaLabel, title, children }: MenuBarActionProps) {
  return (
    <button
      type="button"
      className={styles.trigger}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}
Action.displayName = "MenuBar.Action";

export interface MenuBarPanelProps {
  label: ReactNode;
  /** Required when `label` is a glyph: without it the trigger has no name. */
  ariaLabel?: string;
  children?: ReactNode;
}

/**
 * A bar entry that drops controls rather than commands — the volume, say. A
 * `MenuBar.Menu` would sit them in a `menu`, where a slider is not a `menuitem`
 * and loses its own arrow keys to the menu's roving focus.
 */
function Panel({ label, ariaLabel, children }: MenuBarPanelProps) {
  return (
    <Popover.Root>
      <Popover.Trigger className={styles.trigger} aria-label={ariaLabel}>
        {label}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={styles.positioner} side="bottom" align="end" sideOffset={2}>
          <Popover.Popup className={styles.panel}>{children}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
Panel.displayName = "MenuBar.Panel";

function MenuSeparator() {
  return <Menu.Separator className={styles.separator} />;
}
MenuSeparator.displayName = "MenuBar.Separator";

/** MenuBar — a `MenuBar.Menu` goes in the `left` slot, like any other bar content. */
export const MenuBar = Object.assign(Root, {
  Menu: BarMenu,
  Action,
  Panel,
  Item,
  Separator: MenuSeparator,
});
