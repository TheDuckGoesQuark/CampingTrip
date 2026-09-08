import { type ComponentType, lazy, type ReactNode, Suspense, useMemo } from "react";

import { useRenderTarget } from "../../prerender/renderTarget";

export interface IslandProps<P extends object> {
  load: () => Promise<{ default: ComponentType<P> }>;
  props?: P;
  /** Real content, not a spinner: in the prerendered HTML this is all a crawler gets. */
  fallback: ReactNode;
}

export function Island<P extends object>({ load, props, fallback }: IslandProps<P>) {
  const target = useRenderTarget();
  // Once per Island, not per render: a fresh `lazy` remounts and loses state.
  const Live = useMemo(() => lazy(load), [load]);
  if (target === "static") return <>{fallback}</>;
  return (
    <Suspense fallback={fallback}>
      <Live {...(props as P)} />
    </Suspense>
  );
}
