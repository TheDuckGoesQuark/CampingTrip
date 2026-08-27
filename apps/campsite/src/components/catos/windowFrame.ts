/**
 * What the desktop tells a window about its place among the others, as opposed
 * to what the window is showing. Shared because every window forwards the whole
 * set straight through to the DS frame and adds nothing of its own.
 */
export interface WindowFrameProps {
  /** Place in the stack, so a new window does not open on top of the last. */
  cascade?: number;
  /** Which window covers which — higher is nearer the front. */
  stackOrder?: number;
  /** Raise this window — a press anywhere in its frame. */
  onFocus?: () => void;
}
