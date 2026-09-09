import { Text, Window } from "@jordanscamp/ds";
import { useState } from "react";

import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useSessionStore } from "../../store/sessionStore";
import type { DesktopItem } from "../../types/desktop";
import type { WindowFrameProps } from "./windowFrame";

import styles from "./catos.module.css";

export interface VideoWindowProps extends WindowFrameProps {
  item: Extract<DesktopItem, { kind: "video" }>;
  onClose: () => void;
}

const EMBED_HOST = "https://www.youtube-nocookie.com/embed/";

/**
 * A cross-origin frame is granted `autoplay` only where the embedder delegates
 * it *and* the top document already has user activation — so clicking the icon
 * plays, and a cold deep link lands on a paused player.
 */
function embedUrl(videoId: string, { autoplay, muted }: { autoplay: boolean; muted: boolean }) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: muted ? "1" : "0",
    // Stops iOS from taking the video fullscreen and swallowing the joke.
    playsinline: "1",
    rel: "0",
  });
  return `${EMBED_HOST}${videoId}?${params}`;
}

/**
 * The transport buttons are inert for the same reason the image viewer's zoom
 * is: the embedded player owns playback, and grey beats a control that lies.
 */
export default function VideoWindow({ item, onClose, ...frame }: VideoWindowProps) {
  const soundEnabled = useSessionStore((s) => s.soundEnabled);
  const reducedMotion = useReducedMotion();

  // Frozen at mount: recomputed, it would restart the video on every sound toggle.
  const [src] = useState(() =>
    embedUrl(item.videoId, { autoplay: !reducedMotion, muted: !soundEnabled }),
  );

  return (
    <Window size="md" {...frame}>
      <Window.TitleBar title={`${item.label} — Player`} onClose={onClose} />
      <Window.Toolbar>
        <Window.ToolButton label="Previous track" icon="chevron-left" />
        <Window.ToolButton label="Next track" icon="chevron-right" />
        <Window.Separator />
        <Text variant="label" tone="muted" as="span">
          Now playing
        </Text>
      </Window.Toolbar>
      <Window.Body inset>
        <figure className={styles.videoFigure}>
          <div className={styles.videoFrame}>
            <iframe
              className={styles.videoEmbed}
              src={src}
              title={item.label}
              allow="autoplay; encrypted-media; picture-in-picture"
              // The rule's escape needs a same-origin frame; this one is cross-origin,
              // so the token preserves YouTube's origin, not ours. The omitted tokens
              // are the point: no navigating this page, no storage.
              // eslint-disable-next-line react/iframe-missing-sandbox
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <figcaption className={styles.photoCaption}>
            <Text variant="body-sm" tone="muted" align="center">
              {item.caption}
            </Text>
          </figcaption>
        </figure>
      </Window.Body>
      <Window.StatusBar>
        <span>{item.label}</span>
        <span>·</span>
        <span>{item.duration}</span>
        <span className={styles.statusSpacer}>{soundEnabled ? "Volume 100%" : "Muted"}</span>
      </Window.StatusBar>
    </Window>
  );
}
