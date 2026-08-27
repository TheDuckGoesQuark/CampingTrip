import type { ReactNode } from "react";

import { cn } from "../../../utils/cn";

import styles from "./Window.module.css";

export interface WindowProps {
  children: ReactNode;
}

/**
 * Window — boxy desktop chrome for a mock browser. Pure chrome nested inside a
 * takeover; not a focus-trapping dialog, it lives inside one. Compound: render
 * any subset of `Window.TitleBar` / `Window.Tabs` (holding `Window.Tab` and
 * `Window.NewTab`) / `Window.AddressBar` / `Window.Body`, in any order.
 *
 * It never dims what it floats over, so the desktop behind stays clickable —
 * that is how a second tab gets opened. One fixed size whatever the page: a
 * frame that resized per tab read as broken.
 */
function Root({ children }: WindowProps) {
  return (
    <div className={styles.layer}>
      <div className={styles.window}>{children}</div>
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
        <Light label="Close" tone="close" glyph="✕" onClick={onClose} />
        <Light label="Minimise" tone="minimise" glyph="–" onClick={onMinimise} />
        <Light label="Maximise" tone="maximise" glyph="+" onClick={onMaximise} />
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
  glyph: string;
  onClick?: () => void;
}) {
  const className = cn(styles.light, styles[tone]);
  if (!onClick) return <span className={className} aria-hidden="true" />;
  return (
    <button type="button" aria-label={label} className={className} onClick={onClick}>
      {glyph}
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
          ✕
        </button>
      )}
    </div>
  );
}

function NewTab({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" aria-label="New tab" className={styles.newTab} onClick={onClick}>
      +
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
        <NavButton label="Back" glyph="◀" onClick={onBack} />
        <NavButton label="Forward" glyph="▶" onClick={onForward} />
        <NavButton label="Reload" glyph="⟳" onClick={onReload} />
      </div>
      <div className={styles.addressWell}>
        <span className={styles.lock} aria-hidden="true">
          🔒
        </span>
        <span className={styles.url}>{url}</span>
      </div>
    </div>
  );
}

function NavButton({
  label,
  glyph,
  onClick,
}: {
  label: string;
  glyph: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={styles.navButton}
      onClick={onClick}
      disabled={!onClick}
    >
      {glyph}
    </button>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}

export const Window = Object.assign(Root, { TitleBar, Tabs, Tab, NewTab, AddressBar, Body });
