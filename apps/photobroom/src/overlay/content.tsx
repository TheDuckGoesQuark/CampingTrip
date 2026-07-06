import { createRoot } from "react-dom/client";

import { Overlay } from "./Overlay";

/**
 * Content-script entry. Mounts the PhotoBroom overlay into a shadow root on
 * photos.google.com so its styles are fully isolated from Google's page (and
 * vice-versa). Idempotent — Google Photos is an SPA, so guard against double
 * injection.
 */
const HOST_ID = "photobroom-overlay-host";

function mount() {
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement("div");
  host.id = HOST_ID;
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    @keyframes pb-spin { to { transform: rotate(360deg); } }
  `;
  shadow.appendChild(style);

  const container = document.createElement("div");
  shadow.appendChild(container);
  createRoot(container).render(<Overlay />);
}

if (document.body) mount();
else document.addEventListener("DOMContentLoaded", mount, { once: true });
