import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import { playWindowOpen } from "../audio/soundEffects";
import type { MailPreset } from "../data/mailPresets";
import { useRenderTarget } from "../prerender/renderTarget";
import { WINDOW_MAIL } from "../routing/windows";
import { useSceneStore } from "../store/sceneStore";

interface InterceptProps {
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * The caller's anchor stays a real `mailto:` and this takes the click off it: a
 * `button` would be the plainer control, but the prerendered page runs none of
 * this, and its scriptless answer would then be no answer at all.
 */
export function useMouseMailIntercept(): (preset?: MailPreset) => InterceptProps {
  const navigate = useNavigate();
  const live = useRenderTarget() === "live";

  return (preset) => {
    if (!live) return {};

    return {
      onClick: (event) => {
        // A modified click means the reader wants the browser's behaviour, not ours.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        // Before the navigation, so the window mounts already on the template.
        useSceneStore.getState().setMailPreset(preset?.id ?? null);
        navigate(WINDOW_MAIL);
        playWindowOpen();
      },
    };
  };
}
