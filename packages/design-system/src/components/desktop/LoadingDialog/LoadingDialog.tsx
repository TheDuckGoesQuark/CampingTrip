import type { ReactNode } from "react";

import { DialogFrame } from "../DialogFrame";

export interface LoadingDialogProps {
  title: ReactNode;
  /** What the wait looks like — `TransferProgress`, or anything else. */
  children?: ReactNode;
}

/**
 * A wait the person cannot do anything about, so it carries no actions: the
 * only way out is the work finishing. `AlertDialog` is what replaces it.
 */
export function LoadingDialog({ title, children }: LoadingDialogProps) {
  return <DialogFrame title={title}>{children}</DialogFrame>;
}
