import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "../../../utils/cn";
import { Icon, type IconName } from "../../Icon";

import styles from "./Window.module.css";

const frame = cva(styles.window, {
  variants: {
    size: { sm: styles.sm, md: styles.md, lg: styles.lg },
  },
  defaultVariants: { size: "lg" },
});

export interface WindowProps extends VariantProps<typeof frame> {
  children: ReactNode;
}

/**
 * Window — boxy desktop chrome. Pure chrome nested inside a takeover; not a
 * focus-trapping dialog, it lives inside one. Compound: render any subset of
 * `Window.TitleBar` / `Window.Tabs` (holding `Window.Tab` and `Window.NewTab`) /
 * `Window.AddressBar` / `Window.Toolbar` (holding `Window.ToolButton` and
 * `Window.Separator`) / `Window.Body` / `Window.StatusBar`, in any order.
 *
 * Which subparts a caller picks is what makes a window a browser or a viewer:
 * tabs plus an address bar, or a toolbar plus a status bar. `size` belongs to
 * that same choice and is fixed for the life of the window — a frame that
 * resized as its contents changed read as broken.
 *
 * It never dims what it floats over, so the desktop behind stays clickable —
 * that is how a second tab gets opened.
 */
function Root({ children, size }: WindowProps) {
  return (
    <div className={styles.layer}>
      <div className={frame({ size })}>{children}</div>
    </div>
  );
}

export interface WindowTitleBarProps {
  title?: string;
  onClose?: () => void;
  /** Amber and green lights render inert unless given a handler. */
  onMinimise?: () => void;
  onMaximise?: () => void;
}

function TitleBar({ title, onClose, onMinimise, onMaximise }: WindowTitleBarProps) {
  return (
    <div className={styles.titlebar}>
      <div className={styles.lights}>
        <Light label="Close" tone="close" glyph="close" onClick={onClose} />
        <Light label="Minimise" tone="minimise" glyph="minus" onClick={onMinimise} />
        <Light label="Maximise" tone="maximise" glyph="plus" onClick={onMaximise} />
      </div>
      <span className={styles.title}>{title}</span>
      <span className={styles.titleSpacer} />
    </div>
  );
}

/**
 * Renders a span rather than a button when given no handler, so an inert light is
 * not announced or focusable as a control that does nothing.
 */
function Light({
  label,
  tone,
  glyph,
  onClick,
}: {
  label: string;
  tone: "close" | "minimise" | "maximise";
  glyph: IconName;
  onClick?: () => void;
}) {
  const className = cn(styles.light, styles[tone]);
  if (!onClick) return <span className={className} aria-hidden="true" />;
  return (
    <button type="button" aria-label={label} className={className} onClick={onClick}>
      <Icon name={glyph} size="sm" />
    </button>
  );
}

/** The tab strip. Give it `Window.Tab` children, and optionally a `Window.NewTab`. */
function Tabs({ children }: { children: ReactNode }) {
  return (
    <div className={styles.tabs} role="tablist">
      {children}
    </div>
  );
}

export interface WindowTabProps {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  onSelect?: () => void;
  /** Omit to render a tab with no close affordance. */
  onClose?: () => void;
}

function Tab({ label, icon, active = false, onSelect, onClose }: WindowTabProps) {
  return (
    <div className={cn(styles.tab, active && styles.tabActive)}>
      <button
        type="button"
        role="tab"
        aria-selected={active}
        className={styles.tabButton}
        onClick={onSelect}
      >
        {icon && (
          <span className={styles.tabIcon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={styles.tabLabel}>{label}</span>
      </button>
      {onClose && (
        <button
          type="button"
          aria-label={`Close ${label}`}
          className={styles.tabClose}
          onClick={onClose}
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
}

function NewTab({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" aria-label="New tab" className={styles.chromeButton} onClick={onClick}>
      <Icon name="plus" size="sm" />
    </button>
  );
}

export interface WindowAddressBarProps {
  /** Displayed as text: the bar is chrome, not a real location input. */
  url: string;
  /** Back/forward render disabled unless given a handler. */
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
}

function AddressBar({ url, onBack, onForward, onReload }: WindowAddressBarProps) {
  return (
    <div className={styles.addressbar}>
      <div className={styles.navGroup}>
        <ToolButton label="Back" icon="chevron-left" onClick={onBack} />
        <ToolButton label="Forward" icon="chevron-right" onClick={onForward} />
        <ToolButton label="Reload" icon="reload" onClick={onReload} />
      </div>
      <div className={styles.addressWell}>
        <span className={styles.lock}>
          <Icon name="lock" size="sm" />
        </span>
        <span className={styles.url}>{url}</span>
      </div>
    </div>
  );
}

export interface WindowToolButtonProps {
  /** Accessible name — the button is icon-only, so this is its only label. */
  label: string;
  icon: IconName;
  /** Renders disabled unless given a handler, matching the traffic lights. */
  onClick?: () => void;
}

/** A bevelled square icon button, as used by the address bar and toolbars. */
function ToolButton({ label, icon, onClick }: WindowToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={styles.chromeButton}
      onClick={onClick}
      disabled={!onClick}
    >
      <Icon name={icon} size="sm" />
    </button>
  );
}

/**
 * The strip a non-browser window gets where a browser has its tab strip and
 * address bar — an image viewer's zoom and paging controls, a text window's
 * mode. Give it `Window.ToolButton`s, `Window.Separator`s and plain nodes.
 *
 * Deliberately not `role="toolbar"`: that role promises arrow-key navigation
 * between the controls, which this does not implement. Each button is tabbable.
 */
function Toolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>;
}

/** A hairline divider for grouping controls within a toolbar. */
function Separator() {
  return <span className={styles.separator} aria-hidden="true" />;
}

/**
 * The strip along the bottom of a window, for the facts about what is open —
 * a filename, pixel dimensions, a zoom level. Monospaced, so numbers that tick
 * don't shuffle the text beside them.
 */
function StatusBar({ children }: { children: ReactNode }) {
  return <div className={styles.statusbar}>{children}</div>;
}

export interface WindowBodyProps {
  children: ReactNode;
  /**
   * Sink the page into an inset well — right for a window displaying one object
   * (an image) rather than a document that runs to the edges.
   */
  inset?: boolean;
}

function Body({ children, inset = false }: WindowBodyProps) {
  return <div className={cn(styles.body, inset && styles.bodyInset)}>{children}</div>;
}

export const Window = Object.assign(Root, {
  TitleBar,
  Tabs,
  Tab,
  NewTab,
  AddressBar,
  Toolbar,
  ToolButton,
  Separator,
  StatusBar,
  Body,
});
