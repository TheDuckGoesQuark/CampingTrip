import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

import { cn } from "../../../utils/cn";
import { Icon, type IconName } from "../../Icon";
import {
  centre,
  isFixedLayer,
  maximised,
  movedBy,
  refit,
  resizedBy,
  type Box,
  type Size,
  type WindowSize,
} from "./geometry";

import styles from "./Window.module.css";

/**
 * How the frame is presented. One value rather than a `maximised` and a
 * `minimised` flag, because the three are mutually exclusive and two booleans
 * would admit a fourth state that means nothing.
 *
 * `shaded` is what the amber light does: the window rolls up into its own title
 * bar. There is no dock or taskbar to minimise *to*, and a window that vanished
 * with no way back would be a trap.
 */
export type WindowDisplay = "normal" | "maximised" | "shaded";

interface DragHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
}

interface WindowFrame {
  display: WindowDisplay;
  /**
   * True where the frame has no geometry to offer — a layer too narrow to float
   * a window in. The controls that would change it go inert rather than missing,
   * so the chrome does not reshuffle when a viewport crosses the boundary.
   */
  geometryLocked: boolean;
  toggleMaximised: () => void;
  toggleShaded: () => void;
  moveHandlers: DragHandlers;
  onTitleBarDoubleClick: (event: ReactMouseEvent<HTMLElement>) => void;
}

const WindowFrameContext = createContext<WindowFrame | null>(null);

/** Throws outside a `<Window>`, so a stray subpart fails loudly rather than silently. */
function useWindowFrame(): WindowFrame {
  const frame = useContext(WindowFrameContext);
  if (!frame) throw new Error("Window subparts must be rendered inside a <Window>.");
  return frame;
}

/**
 * Pointer capture keeps a drag tracking once the pointer leaves the element it
 * started on. It is an enhancement, not a requirement — without it a drag simply
 * stops at the edge — and jsdom implements neither call, so both are optional.
 */
function capturePointer(element: HTMLElement, pointerId: number): void {
  element.setPointerCapture?.(pointerId);
}

function releasePointer(element: HTMLElement, pointerId: number): void {
  if (element.hasPointerCapture?.(pointerId)) element.releasePointerCapture?.(pointerId);
}

/**
 * Turns a pointer drag into a stream of deltas. Deltas rather than an origin
 * offset, so a clamped edge does not build up a debt the window pays back the
 * moment the pointer turns around.
 */
function usePointerDrag(onDelta: (dx: number, dy: number) => void, enabled: boolean): DragHandlers {
  const origin = useRef<{ x: number; y: number } | null>(null);

  const release = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    origin.current = null;
    releasePointer(event.currentTarget, event.pointerId);
  }, []);

  return {
    onPointerDown: useCallback(
      (event: ReactPointerEvent<HTMLElement>) => {
        // Left button only, and never from a control sitting on the drag surface.
        if (!enabled || event.button !== 0) return;
        if ((event.target as HTMLElement).closest("button")) return;
        event.preventDefault();
        capturePointer(event.currentTarget, event.pointerId);
        origin.current = { x: event.clientX, y: event.clientY };
      },
      [enabled],
    ),
    onPointerMove: useCallback(
      (event: ReactPointerEvent<HTMLElement>) => {
        const from = origin.current;
        if (!from) return;
        origin.current = { x: event.clientX, y: event.clientY };
        onDelta(event.clientX - from.x, event.clientY - from.y);
      },
      [onDelta],
    ),
    onPointerUp: release,
    onPointerCancel: release,
  };
}

export interface WindowProps {
  children: ReactNode;
  /** The size the frame opens at, and returns to from maximised. */
  size?: WindowSize;
  /** Controlled presentation. Pair with `onDisplayChange`. */
  display?: WindowDisplay;
  /** Uncontrolled starting presentation. */
  defaultDisplay?: WindowDisplay;
  onDisplayChange?: (display: WindowDisplay) => void;
}

/**
 * Window — boxy desktop chrome. Pure chrome nested inside a takeover; not a
 * focus-trapping dialog, it lives inside one. Compound: render any subset of
 * `Window.TitleBar` / `Window.Tabs` (holding `Window.Tab` and `Window.NewTab`) /
 * `Window.AddressBar` / `Window.Toolbar` (holding `Window.ToolButton` and
 * `Window.Separator`) / `Window.Body` / `Window.StatusBar`, in any order.
 *
 * Which subparts a caller picks is what makes a window a browser or a viewer:
 * tabs plus an address bar, or a toolbar plus a status bar.
 *
 * The frame owns its own geometry. It opens centred at `size`, and from there
 * the title bar drags it, the corner grow box resizes it, the green light and a
 * double-click on the title bar maximise it, and the amber light rolls it up
 * into its title bar. Every one of those states is reachable from the two
 * lights, which are ordinary buttons — dragging is a pointer refinement, not
 * the only way in.
 *
 * On a layer too narrow to float a frame in — a phone — none of that applies:
 * the window fills the space, the drag surfaces are dead and the amber and green
 * lights render inert. The stored `display` is left alone while that holds, so
 * widening the viewport hands the window back exactly as it was.
 *
 * It never dims what it floats over, so the desktop behind stays clickable —
 * that is how a second tab gets opened.
 */
function Root({
  children,
  size = "lg",
  display,
  defaultDisplay = "normal",
  onDisplayChange,
}: WindowProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [layer, setLayer] = useState<Size | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [ownDisplay, setOwnDisplay] = useState<WindowDisplay>(defaultDisplay);
  const current = display ?? ownDisplay;

  const setDisplay = useCallback(
    (next: WindowDisplay) => {
      if (display === undefined) setOwnDisplay(next);
      onDisplayChange?.(next);
    },
    [display, onDisplayChange],
  );

  /**
   * Measured in a layout effect, so the first paint already has geometry and the
   * frame never flashes at one size before settling at another.
   */
  useLayoutEffect(() => {
    const element = layerRef.current;
    if (!element) return;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setLayer((prev) =>
        prev?.width === width && prev?.height === height ? prev : { width, height },
      );
    };

    measure();

    /*
     * Two signals, because neither covers the other. The layer fills its
     * takeover, so a viewport resize is the change that actually happens here —
     * and a ResizeObserver on an element sized purely by the viewport is not
     * dependable, observed not firing at all across a 400px-to-900px change. The
     * observer stays for the case the event cannot see: the layer being resized
     * by something other than the viewport.
     */
    window.addEventListener("resize", measure);
    // Absent in jsdom, where there is no layout to observe in the first place.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);

    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, []);

  // Centre on first measurement; afterwards only rescue a frame the layer has
  // outgrown, so a resized viewport never throws away where the user put it.
  useLayoutEffect(() => {
    if (!layer) return;
    setBox((prev) => (prev ? refit(prev, layer) : centre(size, layer)));
  }, [layer, size]);

  const onMoveDelta = useCallback(
    (dx: number, dy: number) => {
      if (!layer) return;
      setBox((prev) => (prev ? movedBy(prev, dx, dy, layer) : prev));
    },
    [layer],
  );

  const onResizeDelta = useCallback(
    (dx: number, dy: number) => {
      if (!layer) return;
      setBox((prev) => (prev ? resizedBy(prev, dx, dy, layer) : prev));
    },
    [layer],
  );

  /**
   * On a narrow layer the frame is presented full-screen without its stored
   * display being touched, so widening the viewport hands the window back
   * exactly where it was — the two states are switchable in both directions.
   */
  const locked = layer ? isFixedLayer(layer) : false;
  const presented: WindowDisplay = locked ? "maximised" : current;

  // A maximised window is pinned; a shaded one can still be dragged out of the way.
  const moveHandlers = usePointerDrag(onMoveDelta, !locked && presented !== "maximised");
  const resizeHandlers = usePointerDrag(onResizeDelta, !locked && presented === "normal");

  const frame = useMemo<WindowFrame>(
    () => ({
      display: presented,
      geometryLocked: locked,
      toggleMaximised: () => setDisplay(current === "maximised" ? "normal" : "maximised"),
      toggleShaded: () => setDisplay(current === "shaded" ? "normal" : "shaded"),
      moveHandlers,
      onTitleBarDoubleClick: (event) => {
        if (locked) return;
        if ((event.target as HTMLElement).closest("button")) return;
        setDisplay(current === "maximised" ? "normal" : "maximised");
      },
    }),
    [current, locked, moveHandlers, presented, setDisplay],
  );

  const rendered = presented === "maximised" && layer ? maximised(layer) : box;
  const style: CSSProperties | undefined = rendered
    ? {
        position: "absolute",
        left: rendered.x,
        top: rendered.y,
        width: rendered.width,
        // Shaded: let the title bar decide, rather than guessing its height.
        height: presented === "shaded" ? "auto" : rendered.height,
      }
    : undefined;

  return (
    <div className={styles.layer} ref={layerRef}>
      <div
        className={cn(
          styles.window,
          // Only until the layer has been measured; geometry takes over after.
          !rendered && styles[size],
          presented === "shaded" && styles.shaded,
          locked && styles.locked,
        )}
        style={style}
      >
        <WindowFrameContext.Provider value={frame}>{children}</WindowFrameContext.Provider>
        {!locked && presented === "normal" && (
          <span className={styles.growBox} {...resizeHandlers} />
        )}
      </div>
    </div>
  );
}

export interface WindowTitleBarProps {
  title?: string;
  /**
   * The red light. Only the caller knows what closing means, so it stays a prop
   * and renders inert without one — unlike amber and green, which the frame
   * drives itself.
   */
  onClose?: () => void;
}

function TitleBar({ title, onClose }: WindowTitleBarProps) {
  const frame = useWindowFrame();

  return (
    <div
      className={styles.titlebar}
      onDoubleClick={frame.onTitleBarDoubleClick}
      {...frame.moveHandlers}
    >
      <div className={styles.lights}>
        <Light label="Close" tone="close" glyph="close" onClick={onClose} />
        <Light
          label="Minimise"
          tone="minimise"
          glyph="minus"
          pressed={frame.display === "shaded"}
          onClick={frame.geometryLocked ? undefined : frame.toggleShaded}
        />
        <Light
          label="Maximise"
          tone="maximise"
          glyph="plus"
          pressed={frame.display === "maximised"}
          onClick={frame.geometryLocked ? undefined : frame.toggleMaximised}
        />
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
  pressed,
  onClick,
}: {
  label: string;
  tone: "close" | "minimise" | "maximise";
  glyph: IconName;
  /** Set on the two lights that toggle, so their name can stay constant. */
  pressed?: boolean;
  onClick?: () => void;
}) {
  const className = cn(styles.light, styles[tone]);
  if (!onClick) return <span className={className} aria-hidden="true" />;
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      className={className}
      onClick={onClick}
    >
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
